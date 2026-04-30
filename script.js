/* ============================================================
   1. STORAGE
   All the localStorage names are kept here so they stay easy to manage.
   ============================================================ */
const STORAGE_KEYS = {
  TASKS: 'ff_tasks',
  FOCUS_SESSIONS: 'ff_focus_sessions',          // keeps the all-time focus session count
  FOCUS_HISTORY: 'ff_focus_history',            // stores daily counts like { 'YYYY-MM-DD': count }
  TASK_HISTORY: 'ff_task_history',              // stores how many tasks were completed each day
  MOOD: 'ff_mood',                              // saves today's selected mood
  JOURNAL: 'ff_journal',                        // saves journal entries by date
  THEME: 'ff_theme',                            // saves the chosen theme
  STREAK: 'ff_streak',                          // keeps the current streak information
  SOUND_ENABLED: 'ff_sound_enabled',            // remembers if sound is turned on or off
};

/**
 * Reads saved data from localStorage.
 * If nothing is saved yet, it uses the fallback value.
 */
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read ${key}:`, err);
    return fallback;
  }
}

/**
 * Saves data into localStorage after converting it to JSON.
 */
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write ${key}:`, err);
  }
}

/* ============================================================
   2. DATE HELPERS
   Small date functions used around the app.
   ============================================================ */
function getTodayKey() {
  // Using the local date makes sure 'today' matches the user's own timezone.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatLongDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Builds a list for the last 7 days, starting from the oldest day.
 */
function getLast7DayKeys() {
  const keys = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push({
      key: `${y}-${m}-${day}`,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
      isToday: i === 0,
    });
  }
  return keys;
}

/* ============================================================
   3. THEME
   Handles light and dark mode for the app.
   ============================================================ */
function initTheme() {
  const saved = readStore(STORAGE_KEYS.THEME, null);
  // Use the saved theme first. If there is none, follow the device setting.
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggleIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  writeStore(STORAGE_KEYS.THEME, next);
  updateThemeToggleIcon(next);
}

function updateThemeToggleIcon(theme) {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  // Show the sun in dark mode and the moon in light mode.
  btn.innerHTML = theme === 'dark'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

/* ============================================================
   4. STREAK TRACKING
   A study day counts when the user finishes a task or a focus session.
   ============================================================ */
function getStreak() {
  return readStore(STORAGE_KEYS.STREAK, { count: 0, lastActiveDate: null });
}

/**
 * Marks today as active and updates the streak count.
 * This runs after a task or focus session is completed.
 */
function recordActivity() {
  const today = getTodayKey();
  const streak = getStreak();
  if (streak.lastActiveDate === today) return; // today is already counted

  // Check if the last active day was yesterday.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayKey = `${y}-${m}-${d}`;

  if (streak.lastActiveDate === yesterdayKey) {
    streak.count += 1;        // streak continues
  } else {
    streak.count = 1;         // start over from day one
  }
  streak.lastActiveDate = today;
  writeStore(STORAGE_KEYS.STREAK, streak);
}

/**
 * Returns the current streak.
 * If the user missed more than one day, the streak resets.
 */
function getCurrentStreak() {
  const streak = getStreak();
  if (!streak.lastActiveDate) return 0;

  const today = getTodayKey();
  if (streak.lastActiveDate === today) return streak.count;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayKey = `${y}-${m}-${d}`;

  // If the user was active yesterday, the streak is still alive today.
  if (streak.lastActiveDate === yesterdayKey) return streak.count;
  return 0; // the streak is no longer active
}

/* ============================================================
   5. TASKS
   Adds, updates, deletes, and displays tasks.
   ============================================================ */
function getTasks() {
  return readStore(STORAGE_KEYS.TASKS, []);
}

function saveTasks(tasks) {
  writeStore(STORAGE_KEYS.TASKS, tasks);
}

function addTask({ title, course, priority, dueDate }) {
  const tasks = getTasks();
  const newTask = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: title.trim(),
    course: (course || '').trim(),
    priority: priority || 'Medium',
    dueDate: dueDate || '',
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(newTask); // show the newest task at the top
  saveTasks(tasks);
  return newTask;
}

function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return null;

  task.completed = !task.completed;

  // Save this completion so it can appear in the weekly chart.
  if (task.completed) {
    const history = readStore(STORAGE_KEYS.TASK_HISTORY, {});
    const today = getTodayKey();
    history[today] = (history[today] || 0) + 1;
    writeStore(STORAGE_KEYS.TASK_HISTORY, history);
    recordActivity();
  }

  saveTasks(tasks);
  return task;
}

function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

/**
 * Shows the task list on the page.
 * The filter decides which tasks should be visible.
 */
function renderTasks(filter = 'all') {
  const list = document.getElementById('task-list');
  if (!list) return;

  let tasks = getTasks();
  if (filter === 'active') tasks = tasks.filter(t => !t.completed);
  else if (filter === 'completed') tasks = tasks.filter(t => t.completed);
  else if (filter === 'high') tasks = tasks.filter(t => t.priority === 'High' && !t.completed);

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <p>No tasks here yet. Add one above to get started.</p>
      </div>`;
    return;
  }

  list.innerHTML = tasks.map(task => `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${escapeHtml(task.id)}">
      <button class="task-checkbox" data-action="toggle" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
      <div class="task-info">
        <div class="task-title-text">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${task.course ? `<span class="course">${escapeHtml(task.course)}</span><span class="dot-sep">•</span>` : ''}
          <span class="priority-badge priority-${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
          ${task.dueDate ? `<span class="dot-sep">•</span><span>Due ${escapeHtml(formatDueDate(task.dueDate))}</span>` : ''}
        </div>
      </div>
      <button class="btn-danger" data-action="delete" aria-label="Delete task">Delete</button>
    </li>
  `).join('');
}

function formatDueDate(dateStr) {
  // The date comes from the date input in yyyy-mm-dd format.
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Cleans user text before putting it into the page.
 * This helps stop unwanted HTML from being injected.
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initTasksPage() {
  const form = document.getElementById('task-form');
  const list = document.getElementById('task-list');
  const filterBar = document.getElementById('task-filters');
  if (!form || !list) return;

  let activeFilter = 'all';
  renderTasks(activeFilter);

  // Add a new task when the form is submitted.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const title = formData.get('title');
    if (!title || !title.toString().trim()) {
      showToast('Please enter a task title');
      return;
    }
    addTask({
      title: title.toString(),
      course: formData.get('course')?.toString() || '',
      priority: formData.get('priority')?.toString() || 'Medium',
      dueDate: formData.get('dueDate')?.toString() || '',
    });
    form.reset();
    renderTasks(activeFilter);
    showToast('Task added');
  });

  // Handle task complete and delete buttons from one click listener.
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const item = btn.closest('.task-item');
    if (!item) return;
    const id = item.getAttribute('data-id');
    const action = btn.getAttribute('data-action');

    if (action === 'toggle') {
      const task = toggleTask(id);
      if (task && task.completed) {
        launchConfetti();
        showToast('Nice work! Task completed.');
      }
      renderTasks(activeFilter);
    } else if (action === 'delete') {
      if (confirm('Delete this task?')) {
        deleteTask(id);
        renderTasks(activeFilter);
      }
    }
  });

  // Change the task filter when a chip is clicked.
  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderTasks(activeFilter);
    });
  }
}

/* ============================================================
   6. FOCUS TIMER
   Basic Pomodoro timer for focus and break sessions.
   ============================================================ */
const TIMER_DURATIONS = {
  focus: 25 * 60,   // 25-minute focus session
  break: 5 * 60,    // 5-minute break
};

const timerState = {
  mode: 'focus',
  remaining: TIMER_DURATIONS.focus,
  intervalId: null,
  isRunning: false,
};

function getFocusSessions() {
  return readStore(STORAGE_KEYS.FOCUS_SESSIONS, 0);
}

function incrementFocusSessions() {
  const total = getFocusSessions() + 1;
  writeStore(STORAGE_KEYS.FOCUS_SESSIONS, total);

  // Save today's session count for the weekly chart.
  const history = readStore(STORAGE_KEYS.FOCUS_HISTORY, {});
  const today = getTodayKey();
  history[today] = (history[today] || 0) + 1;
  writeStore(STORAGE_KEYS.FOCUS_HISTORY, history);

  recordActivity();
  return total;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-time');
  const status = document.getElementById('timer-status');
  const ring = document.getElementById('timer-ring-progress');
  if (!display) return;

  display.textContent = formatTime(timerState.remaining);
  if (status) {
    status.textContent = timerState.isRunning
      ? (timerState.mode === 'focus' ? 'Focusing' : 'On break')
      : 'Paused';
  }

  // Move the timer ring based on how much time is left.
  if (ring) {
    const total = TIMER_DURATIONS[timerState.mode];
    const ratio = timerState.remaining / total;
    const radius = ring.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference * (1 - ratio);
  }

  // Update the browser tab so the timer is still visible when switching tabs.
  if (document.getElementById('timer-time')) {
    document.title = `${formatTime(timerState.remaining)} • StudyForge`;
  }
}

function startTimer() {
  if (timerState.isRunning) return;
  timerState.isRunning = true;
  updateTimerControls();

  timerState.intervalId = setInterval(() => {
    timerState.remaining -= 1;
    if (timerState.remaining <= 0) {
      handleTimerComplete();
      return;
    }
    updateTimerDisplay();
  }, 1000);
  updateTimerDisplay();
}

function pauseTimer() {
  if (!timerState.isRunning) return;
  timerState.isRunning = false;
  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  updateTimerControls();
  updateTimerDisplay();
}

function resetTimer() {
  pauseTimer();
  timerState.remaining = TIMER_DURATIONS[timerState.mode];
  updateTimerDisplay();
}

function setTimerMode(mode) {
  if (mode !== 'focus' && mode !== 'break') return;
  pauseTimer();
  timerState.mode = mode;
  timerState.remaining = TIMER_DURATIONS[mode];

  // Update the active timer mode button.
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
  });
  updateTimerDisplay();
}

function handleTimerComplete() {
  pauseTimer();
  playChime();

  if (timerState.mode === 'focus') {
    const total = incrementFocusSessions();
    showToast(`Focus session done! Total: ${total}`);
    launchConfetti();
    // After focusing, move the user to break mode.
    setTimerMode('break');
  } else {
    showToast('Break finished. Ready for another focus session?');
    setTimerMode('focus');
  }
  updateTotalSessionsDisplay();
}

function updateTimerControls() {
  const startBtn = document.getElementById('btn-start');
  const pauseBtn = document.getElementById('btn-pause');
  if (!startBtn || !pauseBtn) return;
  startBtn.style.display = timerState.isRunning ? 'none' : 'inline-flex';
  pauseBtn.style.display = timerState.isRunning ? 'inline-flex' : 'none';
}

function updateTotalSessionsDisplay() {
  const el = document.getElementById('timer-total-sessions');
  if (el) el.textContent = getFocusSessions();
  const todayEl = document.getElementById('timer-today-sessions');
  if (todayEl) {
    const history = readStore(STORAGE_KEYS.FOCUS_HISTORY, {});
    todayEl.textContent = history[getTodayKey()] || 0;
  }
}

/**
 * Plays a small chime when the timer ends.
 * It uses the browser audio API, so no sound file is needed.
 */
function playChime() {
  const enabled = readStore(STORAGE_KEYS.SOUND_ENABLED, true);
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Play two simple notes for the chime.
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.95);
    });
  } catch (err) {
    console.warn('Could not play chime:', err);
  }
}

function initTimerPage() {
  const ring = document.getElementById('timer-ring-progress');
  if (!ring) return;

  // Set up the circle used for the timer progress ring.
  const radius = ring.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = 0;

  setTimerMode('focus');
  updateTotalSessionsDisplay();

  document.getElementById('btn-start')?.addEventListener('click', startTimer);
  document.getElementById('btn-pause')?.addEventListener('click', pauseTimer);
  document.getElementById('btn-reset')?.addEventListener('click', resetTimer);

  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => setTimerMode(btn.getAttribute('data-mode')));
  });

  // Turn timer sound on or off.
  const soundBtn = document.getElementById('btn-sound');
  if (soundBtn) {
    const updateSoundUI = () => {
      const enabled = readStore(STORAGE_KEYS.SOUND_ENABLED, true);
      soundBtn.textContent = enabled ? '🔔 Sound on' : '🔕 Sound off';
    };
    updateSoundUI();
    soundBtn.addEventListener('click', () => {
      const enabled = readStore(STORAGE_KEYS.SOUND_ENABLED, true);
      writeStore(STORAGE_KEYS.SOUND_ENABLED, !enabled);
      updateSoundUI();
    });
  }

  // Put the page title back before the user leaves.
  window.addEventListener('beforeunload', () => { document.title = 'StudyForge'; });
}

/* ============================================================
   7. MOOD CHECK-IN
   Saves the user's mood and shows a matching message.
   ============================================================ */
const MOOD_MESSAGES = {
  Motivated: {
    text: 'Channel that energy into one focused block. Big momentum starts with one well-spent hour.',
    author: 'StudyForge',
  },
  Tired: {
    text: 'Rest is part of the work. Try a small task — just 10 minutes — and let momentum carry you.',
    author: 'StudyForge',
  },
  Stressed: {
    text: 'Breathe. Pick the smallest next step and only do that. The rest will still be there afterward.',
    author: 'StudyForge',
  },
  Focused: {
    text: 'Lock in. Start a Pomodoro and protect this state — your future self will thank you.',
    author: 'StudyForge',
  },
};

function getMoodToday() {
  const data = readStore(STORAGE_KEYS.MOOD, null);
  if (!data || data.date !== getTodayKey()) return null;
  return data.mood;
}

function setMoodToday(mood) {
  writeStore(STORAGE_KEYS.MOOD, { date: getTodayKey(), mood });
}

function renderMoodMessage(mood) {
  const wrap = document.getElementById('mood-message');
  if (!wrap) return;
  if (!mood) {
    wrap.style.display = 'none';
    return;
  }
  const msg = MOOD_MESSAGES[mood];
  if (!msg) return;
  wrap.style.display = 'block';
  wrap.innerHTML = `
    <div class="mood-message-content">
      ${escapeHtml(msg.text)}
      <span class="mood-message-author">— ${escapeHtml(msg.author)}</span>
    </div>
  `;
}

function initMoodPage() {
  const grid = document.getElementById('mood-grid');
  if (!grid) return;

  const today = getMoodToday();
  if (today) {
    grid.querySelector(`[data-mood="${today}"]`)?.classList.add('selected');
    renderMoodMessage(today);
  }

  grid.addEventListener('click', (e) => {
    const opt = e.target.closest('.mood-option');
    if (!opt) return;
    const mood = opt.getAttribute('data-mood');
    grid.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    setMoodToday(mood);
    renderMoodMessage(mood);
    showToast(`Mood saved: ${mood}`);
  });
}

/* ============================================================
   8. PROGRESS
   Calculates productivity stats and builds the weekly chart.
   ============================================================ */
/**
 * Calculates today's productivity score from 0 to 100.
 * Completing 5 tasks and 4 focus sessions gives the full score.
 */
function calculateProductivityScore() {
  const taskHistory = readStore(STORAGE_KEYS.TASK_HISTORY, {});
  const focusHistory = readStore(STORAGE_KEYS.FOCUS_HISTORY, {});
  const today = getTodayKey();

  const tasksToday = taskHistory[today] || 0;
  const sessionsToday = focusHistory[today] || 0;

  const taskScore = Math.min(tasksToday / 5, 1) * 50;
  const focusScore = Math.min(sessionsToday / 4, 1) * 50;
  return Math.round(taskScore + focusScore);
}

/**
 * Gets the total tasks and focus sessions for the last 7 days.
 */
function getWeeklyStats() {
  const taskHistory = readStore(STORAGE_KEYS.TASK_HISTORY, {});
  const focusHistory = readStore(STORAGE_KEYS.FOCUS_HISTORY, {});
  const days = getLast7DayKeys();

  let totalTasks = 0;
  let totalSessions = 0;
  const dailyData = days.map(({ key, label, isToday }) => {
    const tasks = taskHistory[key] || 0;
    const sessions = focusHistory[key] || 0;
    totalTasks += tasks;
    totalSessions += sessions;
    return { key, label, tasks, sessions, isToday, combined: tasks + sessions };
  });

  return { totalTasks, totalSessions, dailyData };
}

function renderWeeklyChart() {
  const chart = document.getElementById('weekly-chart');
  if (!chart) return;

  const { dailyData } = getWeeklyStats();
  const max = Math.max(1, ...dailyData.map(d => d.combined));

  chart.innerHTML = dailyData.map(d => {
    const heightPct = (d.combined / max) * 100;
    return `
      <div class="weekly-bar-col">
        <div class="weekly-bar-value">${d.combined || ''}</div>
        <div class="weekly-bar ${d.isToday ? 'is-today' : ''}" style="height: ${Math.max(heightPct, 2)}%"></div>
        <div class="weekly-bar-label">${escapeHtml(d.label)}</div>
      </div>
    `;
  }).join('');
}

function initProgressPage() {
  if (!document.getElementById('progress-score')) return;

  const score = calculateProductivityScore();
  document.getElementById('progress-score').innerHTML = `${score}<sup>%</sup>`;

  const { totalTasks, totalSessions } = getWeeklyStats();
  const allTasks = getTasks();
  const totalCompleted = allTasks.filter(t => t.completed).length;
  const totalSessionsLifetime = getFocusSessions();

  setText('stat-week-tasks', totalTasks);
  setText('stat-week-sessions', totalSessions);
  setText('stat-total-completed', totalCompleted);
  setText('stat-total-sessions', totalSessionsLifetime);

  renderWeeklyChart();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ============================================================
   9. JOURNAL
   Handles today's journal entry and shows older entries.
   ============================================================ */
function getJournalEntries() {
  return readStore(STORAGE_KEYS.JOURNAL, {});
}

function saveJournalEntry(date, text) {
  const entries = getJournalEntries();
  if (text.trim()) {
    entries[date] = text;
  } else {
    delete entries[date];
  }
  writeStore(STORAGE_KEYS.JOURNAL, entries);
}

function renderJournalHistory() {
  const wrap = document.getElementById('journal-history');
  if (!wrap) return;

  const entries = getJournalEntries();
  const today = getTodayKey();
  // Show older entries first by latest date, but keep today's entry in the editor.
  const dates = Object.keys(entries).filter(d => d !== today).sort().reverse().slice(0, 10);

  if (dates.length === 0) {
    wrap.innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <h3 style="margin-bottom: 0.85rem;">Past entries</h3>
    ${dates.map(d => {
      const [y, m, day] = d.split('-').map(Number);
      const date = new Date(y, m - 1, day);
      const formatted = date.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric',
      });
      return `
        <div class="journal-entry">
          <div class="journal-entry-date">${escapeHtml(formatted)}</div>
          <div class="journal-entry-text">${escapeHtml(entries[d])}</div>
        </div>
      `;
    }).join('')}
  `;
}

function initJournalPage() {
  const textarea = document.getElementById('journal-text');
  if (!textarea) return;

  const indicator = document.getElementById('save-indicator');
  const today = getTodayKey();
  const entries = getJournalEntries();
  textarea.value = entries[today] || '';

  let saveTimer = null;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimer);
    if (indicator) indicator.classList.remove('visible');
    saveTimer = setTimeout(() => {
      saveJournalEntry(today, textarea.value);
      if (indicator) {
        indicator.classList.add('visible');
        setTimeout(() => indicator.classList.remove('visible'), 2000);
      }
    }, 500); // wait a moment before auto-saving while the user types
  });

  renderJournalHistory();
}

/* ============================================================
   10. DASHBOARD
   Loads the main summary cards and greeting.
   ============================================================ */
function initDashboard() {
  if (!document.getElementById('dashboard-root')) return;

  setText('today-date', formatLongDate());

  const tasks = getTasks();
  const completed = tasks.filter(t => t.completed).length;
  const totalSessions = getFocusSessions();
  const score = calculateProductivityScore();
  const streak = getCurrentStreak();

  setText('stat-total-tasks', tasks.length);
  setText('stat-completed-tasks', completed);
  setText('stat-focus-sessions', totalSessions);
  setText('stat-score', `${score}%`);

  // Show the streak badge if there is an active streak.
  const streakEl = document.getElementById('streak-pill');
  if (streakEl) {
    if (streak > 0) {
      streakEl.style.display = 'inline-flex';
      streakEl.innerHTML = `🔥 ${streak} day streak`;
    } else {
      streakEl.style.display = 'none';
    }
  }

  // Choose a greeting based on the time of day.
  const greetEl = document.getElementById('greeting-text');
  if (greetEl) {
    const hour = new Date().getHours();
    let greeting = 'Welcome back';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    greetEl.textContent = `${greeting}, scholar.`;
  }
}

/* ============================================================
   11. EXPORT / BACKUP
   Lets the user download all saved StudyForge data as one JSON file.
   ============================================================ */
function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    tasks: getTasks(),
    focusSessions: getFocusSessions(),
    focusHistory: readStore(STORAGE_KEYS.FOCUS_HISTORY, {}),
    taskHistory: readStore(STORAGE_KEYS.TASK_HISTORY, {}),
    mood: readStore(STORAGE_KEYS.MOOD, null),
    journal: getJournalEntries(),
    streak: getStreak(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `StudyForge-backup-${getTodayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup downloaded');
}

/* ============================================================
   12. UI HELPERS
   Small helpers for toast messages and confetti effects.
   ============================================================ */
let toastTimer = null;
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

/**
 * Drops a small confetti effect from the top of the screen.
 */
function launchConfetti() {
  const colors = ['#6b5bd2', '#7aa6ff', '#4caf82', '#e8a838', '#e35d6a', '#9d8aff'];
  const count = 36;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 2 + Math.random() * 1.5 + 's';
    piece.style.animationDelay = Math.random() * 0.3 + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

/* ============================================================
   13. PAGE SETUP
   Starts the right features depending on what exists on the current page.
   ============================================================ */
function setActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav a').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === path);
  });
}

function bindGlobalControls() {
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', toggleTheme);
  document.querySelector('[data-export]')?.addEventListener('click', exportData);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setActiveNavLink();
  bindGlobalControls();

  // These setup functions safely check the page before running,
  // so calling all of them here is fine.
  initDashboard();
  initTasksPage();
  initTimerPage();
  initMoodPage();
  initProgressPage();
  initJournalPage();
});