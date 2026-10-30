# Study Forge

A study planner that runs in the browser: a task list, a Pomodoro timer, a progress view, and a short daily reflection.

Live: https://study-forge-ecru.vercel.app

## Features

- Tasks with course, priority and due date, filterable by to do / done
- 25/5 focus timer with a progress ring and a chime at the end
- Daily goal, study streak and a 7-day chart
- Mood check-in with a tip for each mood
- Journal that autosaves and keeps past days
- Dark mode
- Installable and works offline (PWA)

No framework, no build step, no account. Data is saved in `localStorage`.

## Running it

Opening `index.html` directly works, but the service worker needs http:

```bash
python3 -m http.server 8000
```

## Layout

- `index.html` - landing page
- `dashboard.html` - tasks, timer, progress
- `reflect.html` - mood and journal
- `script.js` - all the JS; each `setup...()` function returns early if its part of the page isn't there, so every page can load the same file
- `style.css` - colours are CSS variables at the top, dark mode swaps them
- `sw.js` - caches the app for offline use. Bump `CACHE_NAME` when files change.

## To do

- Custom timer lengths
- Editing tasks
- Clear-all-data button

## License

MIT
