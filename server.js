// Street Empire multiplayer server. No dependencies, just Node 16+.
const http = require("http"), fs = require("fs"), path = require("path");
const PORT = process.env.PORT || 3000;
const DEV_KEY = process.env.DEV_KEY || "";            // optional: secret to unlock the Dev menu with ?dev=KEY
const PUB = path.join(__dirname, "public");
const SAVES_FILE = path.join(__dirname, "saves.json");
const players = new Map(), clients = new Set(); let saves = {};
try { saves = JSON.parse(fs.readFileSync(SAVES_FILE, "utf8")); } catch (e) {}

function broadcast(obj) { const m = "data: " + JSON.stringify(obj) + "\n\n"; for (const c of clients) c.write(m); }
setInterval(() => { const now = Date.now(); for (const [id, p] of players) if (now - p.t > 8000) { players.delete(id); broadcast({ id, gone: 1 }); } }, 2000);
let saveTimer = null;
function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFile(SAVES_FILE, JSON.stringify(saves), () => {}), 2000); }
function readBody(req) { return new Promise(r => { let b = ""; req.on("data", d => { b += d; if (b.length > 2e6) req.destroy(); }); req.on("end", () => { try { r(JSON.parse(b || "{}")); } catch (e) { r({}); } }); }); }

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/api/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no" });
    res.write("retry: 2000\n\n");
    for (const [id, p] of players) res.write("data: " + JSON.stringify({ id, presence: p.s }) + "\n\n");
    clients.add(res);
    const ka = setInterval(() => res.write(": keepalive\n\n"), 15000);
    req.on("close", () => { clients.delete(res); clearInterval(ka); });
    return;
  }
  if (u.pathname === "/api/sync" && req.method === "POST") {
    const b = await readBody(req), now = Date.now();
    if (typeof b.id === "string" && b.id.length < 64 && b.state && typeof b.state === "object") players.set(b.id, { s: b.state, t: now });
    const out = {}; for (const [k, p] of players) if (k !== b.id && now - p.t < 8000) out[k] = p.s;
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }); return res.end(JSON.stringify({ players: out }));
  }
  if (u.pathname === "/api/presence" && req.method === "POST") {
    const b = await readBody(req);
    if (typeof b.id === "string" && b.id.length < 64 && b.state && typeof b.state === "object") { players.set(b.id, { s: b.state, t: Date.now() }); broadcast({ id: b.id, presence: b.state }); }
    res.writeHead(204); return res.end();
  }
  if (u.pathname === "/api/leave" && req.method === "POST") {
    const b = await readBody(req); if (players.delete(b.id)) broadcast({ id: b.id, gone: 1 });
    res.writeHead(204); return res.end();
  }
  if (u.pathname === "/api/dev") {
    const ok = !!DEV_KEY && u.searchParams.get("k") === DEV_KEY;
    res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok }));
  }
  if (u.pathname.startsWith("/api/save/")) {
    const id = u.pathname.slice(10);
    if (!/^[\w-]{6,64}$/.test(id)) { res.writeHead(400); return res.end(); }
    if (req.method === "PUT") { saves[id] = await readBody(req); persist(); res.writeHead(204); return res.end(); }
    res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(saves[id] || null));
  }
  let f = path.join(PUB, u.pathname === "/" ? "index.html" : path.normalize(u.pathname));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); res.end(d);
  });
});
server.listen(PORT, () => console.log("Street Empire running on port " + PORT));
