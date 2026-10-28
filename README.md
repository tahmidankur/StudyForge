# Study Forge

Study Forge is a simple study app for students. Write down your tasks, focus with a Pomodoro timer, see your progress, and reflect on your day.

It is built with plain HTML, CSS and JavaScript. No frameworks, no build step, no account. Everything is saved in your browser with `localStorage`.

---

## Features

- **Tasks**: add tasks with a course, priority and due date, tick them off, filter by To do / Done
- **Focus timer**: 25 minutes of focus, 5 minute break, with a progress ring and a chime
- **Progress**: daily goal, study streak, and a chart of the last 7 days
- **Mood check-in**: pick how you feel and get a matching tip
- **Journal**: write about your day; it saves as you type and keeps past entries
- **Dark mode**: switch with the moon/sun button
- **Works like a phone app**: install it on your home screen and use it offline

---

## How to run

1. Download or clone the project:

   ```bash
   git clone https://github.com/tahmidankur/StudyForge.git
   ```

2. Open `index.html` in your browser. That's it!

To try the installable app and offline mode, run a small local server instead (service workers don't run on `file://` pages):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

### Install it on your phone

Host the folder somewhere with `https` (GitHub Pages works: Settings → Pages → deploy from `main`). Then:

- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** menu → Install app
- **Desktop (Chrome/Edge):** click the install icon in the address bar

---

## Project structure

```text
StudyForge/
├── index.html      Landing page
├── dashboard.html  Tasks, focus timer and progress
├── reflect.html    Mood check-in and journal
├── style.css       All the styles (colors are at the top)
├── script.js       All the JavaScript, split into numbered sections
├── icon.svg        The logo
├── icons/          PNG versions of the logo for phones
├── manifest.json   App name, colors and icons (lets you install it)
├── sw.js           Service worker: saves the files so the app works offline
└── README.md
```

---

## How the code works

- **One CSS file.** The colors live at the top of `style.css` as CSS variables like `--tomato`. Dark mode just swaps those variables.
- **One JavaScript file.** Every page loads `script.js`. Each feature has a `setup...()` function that first checks whether its HTML is on the page, so the same file works everywhere.
- **Saving data.** `load(key, fallback)` and `save(key, value)` wrap `localStorage`. Daily counts are stored by date, like `{ "2026-10-27": 3 }`, which makes the weekly chart easy to build.

- **Offline.** `sw.js` saves every file in the browser's cache. When you change a file, bump `CACHE_NAME` in `sw.js` (v1 → v2) so installed apps pick up the update.

### Ideas to try next

- Let the user change the timer length
- Add an "edit task" button
- Add a button that clears all data
- Show a calendar of past journal entries

---

## License

MIT
