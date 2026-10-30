/* ---------- Saving data ---------- */

const KEYS = {
  TASKS: 'ff_tasks',                 // list of task objects
  FOCUS_HISTORY: 'ff_focus_history', // focus sessions per day: { '2026-10-27': 3 }
  TASK_HISTORY: 'ff_task_history',   // tasks finished per day:  { '2026-10-27': 2 }
  STREAK: 'ff_streak',               // { count: 4, lastActiveDate: '2026-10-27' }
  MOOD: 'ff_mood',                   // { date: '2026-10-27', mood: 'Focused' }
  JOURNAL: 'ff_journal',             // journal text per day: { '2026-10-27': '...' }
  THEME: 'ff_theme',                 // 'light' or 'dark'
};

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked (private mode), app still works without saving
  }
}

// Add 1 to today's count in a history object like { '2026-10-27': 2 }.
function addToToday(key, amount = 1) {
  const history = load(key, {});
  const today = dateKey();
  history[today] = Math.max(0, (history[today] || 0) + amount);
  save(key, history);
}

function todayCount(key) {
  return load(key, {})[dateKey()] || 0;
}


/* ---------- Date helpers ---------- */

// '2026-10-27' style key for daily data
function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function showTodayDate() {
  const el = document.getElementById('today-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }
}


/* ---------- Dark mode ---------- */

// set before load so the page doesn't flash the wrong theme
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = load(KEYS.THEME, prefersDark ? 'dark' : 'light');

function setupThemeButton() {
  const button = document.getElementById('theme-btn');
  if (!button) return;

  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    save(KEYS.THEME, next);
  });
}


/* ---------- Streak ---------- */
// A day counts toward your streak when you finish a task or a focus session.

function markTodayActive() {
  const streak = load(KEYS.STREAK, { count: 0, lastActiveDate: null });
  const today = dateKey();
  const yesterday = dateKey(daysAgo(1));

  if (streak.lastActiveDate === today) return; // today already counted

  streak.count = streak.lastActiveDate === yesterday ? streak.count + 1 : 1;
  streak.lastActiveDate = today;
  save(KEYS.STREAK, streak);
}

function getStreak() {
  const streak = load(KEYS.STREAK, { count: 0, lastActiveDate: null });
  const stillGoing = streak.lastActiveDate === dateKey() || streak.lastActiveDate === dateKey(daysAgo(1));
  return stillGoing ? streak.count : 0;
}


/* ---------- Tasks ---------- */

let taskFilter = 'all';

function getTasks() {
  return load(KEYS.TASKS, []);
}

function addTask(title, course, priority, dueDate) {
  const tasks = getTasks();
  tasks.unshift({
    id: Date.now().toString(),
    title,
    course,
    priority,
    dueDate,
    completed: false,
    completedOn: null,
  });
  save(KEYS.TASKS, tasks);
}

function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;

  if (task.completed) {
    task.completedOn = dateKey();
    addToToday(KEYS.TASK_HISTORY, 1);
    markTodayActive();
    showToast('Nice work!');
  } else if (task.completedOn === dateKey()) {
    // Un-ticking a task you finished today removes it from today's count again.
    addToToday(KEYS.TASK_HISTORY, -1);
    task.completedOn = null;
  }

  save(KEYS.TASKS, tasks);
}

function deleteTask(id) {
  save(KEYS.TASKS, getTasks().filter(t => t.id !== id));
}

// task titles are user text, so escape before using innerHTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;

  let tasks = getTasks();
  if (taskFilter === 'todo') tasks = tasks.filter(t => !t.completed);
  if (taskFilter === 'done') tasks = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    list.innerHTML = '<li class="empty">No tasks here yet. Add one above!</li>';
    return;
  }

  list.innerHTML = tasks.map(task => {
    // Build the small line under the title, e.g. "CS 101 · High · Due Oct 30"
    const details = [];
    if (task.course) details.push(escapeHtml(task.course));
    details.push(`<span class="badge badge-${task.priority.toLowerCase()}">${task.priority}</span>`);
    if (task.dueDate) {
      const due = parseDateKey(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      details.push(`Due ${due}`);
    }

    return `
      <li class="task ${task.completed ? 'done' : ''}" data-id="${task.id}">
        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark as done">
        <div class="task-text">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">${details.join(' · ')}</div>
        </div>
        <button class="delete-btn">Delete</button>
      </li>`;
  }).join('');
}

function setupTasks() {
  const form = document.getElementById('task-form');
  if (!form) return;

  const list = document.getElementById('task-list');
  const filters = document.getElementById('task-filters');

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;

    addTask(
      title,
      document.getElementById('task-course').value.trim(),
      document.getElementById('task-priority').value,
      document.getElementById('task-due').value,
    );
    form.reset();
    renderTasks();
  });

  // One listener on the whole list handles every task's checkbox and delete button.
  list.addEventListener('click', (event) => {
    const item = event.target.closest('.task');
    if (!item) return;

    if (event.target.matches('input[type="checkbox"]')) {
      toggleTask(item.dataset.id);
    } else if (event.target.matches('.delete-btn')) {
      if (!confirm('Delete this task?')) return;
      deleteTask(item.dataset.id);
    } else {
      return;
    }
    renderTasks();
    renderProgress();
  });

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('.filter');
    if (!button) return;
    filters.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    taskFilter = button.dataset.filter;
    renderTasks();
  });

  renderTasks();
}


/* ---------- Focus timer ---------- */

const TIMER_MINUTES = { focus: 25, break: 5 };

const timer = {
  mode: 'focus',              // 'focus' or 'break'
  secondsLeft: TIMER_MINUTES.focus * 60,
  intervalId: null,           // set while the timer is running
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderTimer() {
  const running = timer.intervalId !== null;
  const totalSeconds = TIMER_MINUTES[timer.mode] * 60;

  document.getElementById('timer-time').textContent = formatTime(timer.secondsLeft);
  document.getElementById('timer-start').textContent = running ? 'Pause' : 'Start';
  document.getElementById('timer-status').textContent =
    running ? (timer.mode === 'focus' ? 'Focusing…' : 'On a break') : 'Ready';
  document.getElementById('timer-card').classList.toggle('break-mode', timer.mode === 'break');

  const ring = document.getElementById('timer-ring');
  const circumference = 2 * Math.PI * 90; // 90 is the circle's radius in the HTML
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference * (1 - timer.secondsLeft / totalSeconds);

  document.title = running ? `${formatTime(timer.secondsLeft)} · Study Forge` : 'Study · Study Forge';
}

function startOrPauseTimer() {
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
  } else {
    timer.intervalId = setInterval(tick, 1000);
  }
  renderTimer();
}

function tick() {
  timer.secondsLeft -= 1;
  if (timer.secondsLeft <= 0) {
    finishTimer();
  } else {
    renderTimer();
  }
}

function finishTimer() {
  playChime();
  if (timer.mode === 'focus') {
    addToToday(KEYS.FOCUS_HISTORY, 1);
    markTodayActive();
    renderProgress();
    showToast('Focus session done! Take a break.');
    setTimerMode('break');
  } else {
    showToast('Break over. Ready to focus again?');
    setTimerMode('focus');
  }
}

function setTimerMode(mode) {
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.mode = mode;
  timer.secondsLeft = TIMER_MINUTES[mode] * 60;

  document.querySelectorAll('.mode').forEach(button => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  renderTimer();
}

// Play three short notes using the Web Audio API (no sound file needed).
function playChime() {
  try {
    const audio = new AudioContext();
    [523, 659, 784].forEach((frequency, i) => {
      const note = audio.createOscillator();
      const volume = audio.createGain();
      const start = audio.currentTime + i * 0.18;

      note.frequency.value = frequency;
      volume.gain.setValueAtTime(0.2, start);
      volume.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      note.connect(volume);
      volume.connect(audio.destination);
      note.start(start);
      note.stop(start + 0.5);
    });
  } catch {
    // Some browsers block sound. That's okay.
  }
}

function setupTimer() {
  if (!document.getElementById('timer-time')) return;

  document.getElementById('timer-start').addEventListener('click', startOrPauseTimer);
  document.getElementById('timer-reset').addEventListener('click', () => setTimerMode(timer.mode));
  document.querySelectorAll('.mode').forEach(button => {
    button.addEventListener('click', () => setTimerMode(button.dataset.mode));
  });
  renderTimer();
}


/* ---------- Progress ---------- */

const DAILY_GOAL = { tasks: 3, focus: 4 };

function renderProgress() {
  if (!document.getElementById('week-chart')) return;

  const tasksToday = todayCount(KEYS.TASK_HISTORY);
  const focusToday = todayCount(KEYS.FOCUS_HISTORY);

  document.getElementById('stat-tasks').textContent = tasksToday;
  document.getElementById('stat-focus').textContent = focusToday;
  document.getElementById('stat-streak').textContent = getStreak();

  // Daily goal: tasks are worth half, focus sessions the other half.
  const taskPart = Math.min(tasksToday / DAILY_GOAL.tasks, 1) * 50;
  const focusPart = Math.min(focusToday / DAILY_GOAL.focus, 1) * 50;
  const percent = Math.round(taskPart + focusPart);
  document.getElementById('goal-percent').textContent = `${percent}%`;
  document.getElementById('goal-fill').style.width = `${percent}%`;

  // Weekly chart: one bar per day, height = tasks + focus sessions that day.
  const taskHistory = load(KEYS.TASK_HISTORY, {});
  const focusHistory = load(KEYS.FOCUS_HISTORY, {});
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = daysAgo(i);
    const key = dateKey(date);
    days.push({
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      total: (taskHistory[key] || 0) + (focusHistory[key] || 0),
      isToday: i === 0,
    });
  }

  const biggest = Math.max(1, ...days.map(d => d.total));
  document.getElementById('week-chart').innerHTML = days.map(day => `
    <div class="chart-col ${day.isToday ? 'today' : ''}">
      <span>${day.total || ''}</span>
      <div class="chart-bar" style="height: ${(day.total / biggest) * 100}%"></div>
      <span>${day.label}</span>
    </div>`).join('');
}

function showGreeting() {
  const el = document.getElementById('greeting');
  if (!el) return;
  const hour = new Date().getHours();
  if (hour < 12) el.textContent = 'Good morning';
  else if (hour < 18) el.textContent = 'Good afternoon';
  else el.textContent = 'Good evening';
}


/* ---------- Mood ---------- */

const MOOD_TIPS = {
  Motivated: 'Use that energy! Pick your hardest task and start a focus session now.',
  Focused: 'You are in the zone. Start the timer and protect the next 25 minutes.',
  Tired: 'Rest is part of studying. Try one small task for just 10 minutes.',
  Stressed: 'Breathe. Pick the smallest next step and only do that one thing.',
};

function showMood(mood) {
  document.querySelectorAll('.mood').forEach(button => {
    button.classList.toggle('selected', button.dataset.mood === mood);
  });
  const message = document.getElementById('mood-message');
  message.textContent = MOOD_TIPS[mood];
  message.hidden = false;
}

function setupMood() {
  const moods = document.getElementById('moods');
  if (!moods) return;

  // Only show the saved mood if it was picked today.
  const saved = load(KEYS.MOOD, null);
  if (saved && saved.date === dateKey()) showMood(saved.mood);

  moods.addEventListener('click', (event) => {
    const button = event.target.closest('.mood');
    if (!button) return;
    save(KEYS.MOOD, { date: dateKey(), mood: button.dataset.mood });
    showMood(button.dataset.mood);
  });
}


/* ---------- Journal ---------- */

function renderPastEntries() {
  const entries = load(KEYS.JOURNAL, {});
  const pastDates = Object.keys(entries)
    .filter(date => date !== dateKey())
    .sort()
    .reverse()
    .slice(0, 10); // newest 10

  document.getElementById('past-entries-card').hidden = pastDates.length === 0;
  document.getElementById('past-entries').innerHTML = pastDates.map(date => `
    <div class="entry">
      <div class="entry-date">${parseDateKey(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      <div class="entry-text">${escapeHtml(entries[date])}</div>
    </div>`).join('');
}

function setupJournal() {
  const textarea = document.getElementById('journal-text');
  if (!textarea) return;

  const savedNote = document.getElementById('saved-note');
  textarea.value = load(KEYS.JOURNAL, {})[dateKey()] || '';

  // Save half a second after the user stops typing.
  let saveTimeout;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    savedNote.classList.remove('visible');

    saveTimeout = setTimeout(() => {
      const entries = load(KEYS.JOURNAL, {});
      if (textarea.value.trim()) entries[dateKey()] = textarea.value;
      else delete entries[dateKey()];
      save(KEYS.JOURNAL, entries);
      savedNote.classList.add('visible');
    }, 500);
  });

  renderPastEntries();
}


/* ---------- Start the page ---------- */

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// service workers only run on http(s), not file://
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js');
}

document.addEventListener('DOMContentLoaded', () => {
  setupThemeButton();
  showTodayDate();
  showGreeting();
  setupTasks();
  setupTimer();
  renderProgress();
  setupMood();
  setupJournal();
});
