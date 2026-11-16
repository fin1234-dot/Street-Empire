# Street Empire online server

Zero dependencies, needs Node 16 or newer.

## Run on your own computer
    cd street-empire-site
    node server.js
Open http://localhost:3000 in two browser tabs. You should see "Online: 2 players".

## Put it on the internet (Render example)
1. Make a free GitHub account and create a new repository. Upload everything in this folder
   (server.js, package.json, README.md and the public folder).
2. Make an account at render.com and choose New > Web Service. Connect that repository.
3. Settings: Runtime = Node, Build Command = (leave empty), Start Command = `node server.js`.
4. Optional: add an environment variable DEV_KEY = any secret word you choose.
5. Deploy. Render gives you a link like https://your-name.onrender.com. Send it to friends.
   Free plans can sleep when nobody is playing, so the first load can take about a minute.
   Check Render's current plans and limits before you rely on it.

## Dev menu for you only
Open https://your-site/?dev=YOUR_SECRET once in your browser (the same word you set as DEV_KEY).
Everyone else who opens the normal link sees the normal game.

## Notes
- Player positions are kept in memory, so they reset if the server restarts.
- Cloud saves are written to saves.json. Free hosts often erase files on restart, so the game
  also keeps its own save in each player's browser.
