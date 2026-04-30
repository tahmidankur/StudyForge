# StudyForge

StudyForge is a simple productivity web app designed to help students stay organized, focused, and consistent with their study goals.

The app allows users to manage study tasks, use a Pomodoro focus timer, track weekly progress, check in with their mood, and write daily reflections. All data is saved locally in the browser using `localStorage`, so no information is sent to a server.

---

## Features

- Add, complete, filter, and delete study tasks
- Use a Pomodoro timer for focus sessions and breaks
- Track completed tasks and focus sessions
- View weekly progress and productivity score
- Check in with your mood and receive a short motivational message
- Write and save daily journal reflections
- Switch between light mode and dark mode
- Export saved data as a JSON backup file

---

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- localStorage
- Web Audio API
- Google Fonts

---

## How to Run

Clone the repository:

```bash
git clone https://github.com/<your-username>/StudyForge.git
cd StudyForge

Open index.html in your browser.
Or run a local server:
python3 -m http.server 8000
Then open this link in your browser:
http://localhost:8000

**Project Structure**
StudyForge/
├── index.html
├── dashboard.html
├── tasks.html
├── timer.html
├── mood.html
├── progress.html
├── journal.html
├── style.css
├── script.js
└── README.md

What I Learned
While building StudyForge, I practiced creating a complete web app using only HTML, CSS, and JavaScript. I learned how to organize JavaScript code by feature, save user data with localStorage, create a responsive layout, build a dark mode system, and handle time-based features such as streaks and focus sessions.
Future Improvements
Add recurring tasks
Add custom Pomodoro settings
Add a calendar view
Add data import for JSON backups
Add optional cloud sync
License
This project is licensed under the MIT License.

Make sure there is a blank line before and after every heading, paragraph, list, and code block. That is what makes it display cleanly on GitHub.
