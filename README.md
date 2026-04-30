# StudyForge 🎯

> Turn study goals into focused action.

A modern, mobile-first productivity web app for students. Manage study tasks, run guided focus sessions, track your weekly progress, and build the consistency that turns good intentions into real results.

Built with **vanilla HTML, CSS, and JavaScript** — no frameworks, no build step. Open `index.html` and you're running.

---

## ✨ Features

- **🏠 Landing page** — clean hero with a clear call-to-action and a feature overview
- **📊 Dashboard** — today's date, total tasks, completed tasks, focus sessions, productivity score, and a daily streak pill
- **✅ Task manager** — create tasks with title, course, priority (Low / Medium / High), and optional due date; filter by status; mark complete or delete
- **⏱ Pomodoro focus timer** — 25-minute focus blocks and 5-minute breaks with a circular progress ring and a soft Web Audio chime
- **🧠 Mood check-in** — pick from Motivated, Tired, Stressed, or Focused and get a tailored motivational message
- **📈 Weekly progress** — productivity score (0–100) plus a 7-day chart of tasks + sessions
- **📓 Reflection journal** — daily journal entry that auto-saves as you type, with a list of past entries
- **🔥 Daily streaks** — your streak grows every day you complete a task or finish a focus session
- **🌗 Dark / light mode** — toggle anywhere; honors your system preference on first visit
- **💾 JSON backup export** — download all your data as a single timestamped JSON file
- **🎉 Confetti celebrations** — a tiny burst when you complete a task or finish a focus block

All data is stored locally in your browser via `localStorage` — nothing leaves your device.

---

## 🛠 Technologies used

- **HTML5** — semantic, accessible markup
- **CSS3** — custom properties (theming), CSS Grid, Flexbox, custom animations, mobile-first responsive design
- **Vanilla JavaScript (ES6+)** — modular feature organization, no frameworks
- **Web Storage API** — `localStorage` for full client-side persistence
- **Web Audio API** — synthesized chime for timer notifications (no audio files needed)
- **Google Fonts** — *Fraunces* (display) and *Plus Jakarta Sans* (body)

---

## 🚀 How to run locally

This is a static project — no build step, no dependencies, no server required.

**Option 1 — just open the file:**
```bash
git clone https://github.com/<your-username>/StudyForge.git
cd StudyForge
# then double-click index.html, or:
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

**Option 2 — run a tiny local server (recommended):**
```bash
cd StudyForge
python3 -m http.server 8000
# then visit http://localhost:8000 in your browser
```

The app works offline after the first load (Google Fonts will fall back to system fonts if you're disconnected).

---

## 📸 Screenshots

> _Add your screenshots here once you've taken them._

- `screenshots/landing.png` — landing page
- `screenshots/dashboard.png` — dashboard
- `screenshots/tasks.png` — task manager
- `screenshots/timer.png` — focus timer
- `screenshots/progress.png` — weekly progress
- `screenshots/dark-mode.png` — dark mode

---

## 🗂 Project structure

```
StudyForge/
├── index.html          # Landing page
├── dashboard.html      # Main dashboard
├── tasks.html          # Task manager
├── timer.html          # Pomodoro timer
├── mood.html           # Mood check-in
├── progress.html       # Weekly progress + score
├── journal.html        # Reflection journal
├── style.css           # All styles (theme tokens, components, responsive)
├── script.js           # All app logic, organized by feature
└── README.md
```

The JavaScript is organized into clearly numbered sections — storage layer, date helpers, theme, streaks, tasks, timer, mood, progress, journal, dashboard, export, UI helpers, and page initialization.

---

## 🔮 Future improvements

- Drag-and-drop to reorder tasks
- Recurring tasks (daily / weekly)
- Customizable Pomodoro lengths and long-break intervals
- Calendar view of completed work
- Mood history visualization
- PWA support (installable, offline-first via service worker)
- Data import (round-trip the JSON export)
- Optional cloud sync with a backend like Firebase or Supabase
- Keyboard shortcuts for power users

---

## 🎓 What I learned

Building StudyForge taught me a lot about shipping a real-feeling app without leaning on a framework:

- **Designing a clean state model with `localStorage`.** I created a single source of truth for storage keys and tiny `readStore` / `writeStore` helpers with safe fallbacks. That made every feature easy to wire up and easy to reason about.
- **Organizing vanilla JS by feature.** Instead of one tangled file, I broke `script.js` into clearly labeled sections (storage, theme, tasks, timer, etc.) with `init` functions per page. Each `init` only runs if its DOM elements exist, so one shared script works across every page.
- **Real CSS theming with custom properties.** Light and dark modes share the same component CSS — only the variables change. This made dark mode almost free once the tokens were right.
- **Mobile-first design discipline.** I designed for a 375px viewport first, then added breakpoints. The bottom navigation, card layouts, and touch targets were all easier because of it.
- **Animation as a finish, not a gimmick.** Subtle entry animations, hover lifts, the timer ring, and confetti on completion — used sparingly, they make the app feel polished.
- **XSS-safe DOM rendering.** Since user input goes into the DOM, I wrote a small `escapeHtml` helper and used it everywhere I templated user data.
- **Time-based logic without a library.** Streaks, weekly charts, and date keys all use small pure helper functions — no Moment / date-fns required.

---

## 💼 Resume bullet points

Drop these straight into your resume:

- Designed and built **StudyForge**, a mobile-first productivity web app for students using vanilla HTML, CSS, and JavaScript — no frameworks, no build tooling.
- Implemented **seven feature modules** (task manager, Pomodoro timer, mood tracker, weekly progress, reflection journal, daily streaks, JSON export) with full client-side persistence via the `localStorage` API.
- Engineered a **responsive, accessible UI** with custom CSS design tokens, a full dark mode, and entry/hover animations — scoring the app well on mobile usability.
- Built a **circular progress-ring Pomodoro timer** with Web Audio API chime, document-title countdown, and persistent session history.
- Architected a clean, **feature-organized JavaScript codebase** (~700 LOC) with consistent patterns for state, rendering, and event delegation, plus XSS-safe DOM templating.
- Designed a **productivity scoring algorithm** (0–100) based on daily task completions and focus sessions, visualized with a 7-day activity chart.

---

## 📄 License

MIT — feel free to fork it, learn from it, and remix it.

---

**Built with ☕ and a lot of focus blocks.**
