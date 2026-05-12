/* ============================================================
   Connections — game logic
   - Daily puzzle: deterministic per local date (no internet needed)
   - Practice: random pick or archive picker
   - Mistakes tracking, one-away, win/loss, share emoji grid
   - Stats + practice history in localStorage
   - PWA install prompt handling
   ============================================================ */

(() => {
'use strict';

/* ---------- State ---------- */

const COLORS = ['y', 'g', 'b', 'p']; // by difficulty: yellow, green, blue, purple
const COLOR_NAMES = { y: 'Yellow', g: 'Green', b: 'Blue', p: 'Purple' };
const EMOJI = { y: '🟨', g: '🟩', b: '🟦', p: '🟪' };
const MAX_MISTAKES = 4;

const state = {
  puzzles: [],
  current: null,        // active puzzle object
  mode: 'daily',        // 'daily' | 'practice'
  tiles: [],            // [{ word, group, solved }] in display order
  selected: new Set(),  // indices in tiles
  solvedGroups: [],     // [{ group, words, category }] in solve order
  guessLog: [],         // for emoji grid: array of arrays of group letters (length 4)
  pastGuesses: new Set(),// stringified sorted word combos
  mistakes: 0,
  finished: false,
  won: false,
};

/* ---------- Storage ---------- */

const KEY_STATS = 'conn.stats';
const KEY_DAILY = 'conn.daily';   // { 'YYYY-MM-DD': { progress } }
const KEY_HIST  = 'conn.history'; // { '<puzzleNumber>': { won, mistakes, date } }
const KEY_LAST_DAILY_DATE = 'conn.lastDailyDate';

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function getStats() {
  return loadJSON(KEY_STATS, {
    played: 0, wins: 0,
    streak: 0, maxStreak: 0,
    perfect: 0,
    dist: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, // mistakes count distribution (4 = loss)
  });
}
function setStats(s) { saveJSON(KEY_STATS, s); }

function getHistory() { return loadJSON(KEY_HIST, {}); }
function setHistory(h) { saveJSON(KEY_HIST, h); }

/* ---------- Date helpers ---------- */

function todayLocal() {
  // Local date as YYYY-MM-DD; daily puzzles roll over at local midnight.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prettyDate(yyyymmdd) {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  if (!y) return yyyymmdd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ---------- Pick today's puzzle deterministically ---------- */

function hashStr(s) {
  // Simple deterministic 32-bit hash.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dailyIndexForDate(dateStr, total) {
  return hashStr(dateStr) % total;
}

/* ---------- DOM ---------- */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const grid = $('#grid');
const solvedList = $('#solved-list');
const mistakeDots = $('#mistake-dots');
const submitBtn = $('#submit-btn');
const deselectBtn = $('#deselect-btn');
const shuffleBtn = $('#shuffle-btn');
const toastEl = $('#toast');
const modeLabel = $('#mode-label');

const menuDrawer  = $('#menu-drawer');
const archiveDrawer = $('#archive-drawer');
const statsModal  = $('#stats-modal');
const endModal    = $('#end-modal');
const howModal    = $('#how-modal');

/* ---------- Toast ---------- */

let toastTimer = null;
function toast(msg, ms = 1600) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

/* ---------- Shuffle (Fisher-Yates) ---------- */

function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------- Build a puzzle into game state ---------- */

function startPuzzle(puzzle, mode) {
  state.current = puzzle;
  state.mode = mode;
  state.selected.clear();
  state.solvedGroups = [];
  state.guessLog = [];
  state.pastGuesses = new Set();
  state.mistakes = 0;
  state.finished = false;
  state.won = false;

  // Build tile list. Each word knows its group (0..3) which maps to a color.
  const tiles = [];
  puzzle.a.forEach((g, idx) => {
    g.w.forEach(w => tiles.push({ word: w, group: idx, solved: false }));
  });
  shuffleArr(tiles);
  state.tiles = tiles;

  // If daily, restore in-progress if it exists for today.
  if (mode === 'daily') {
    restoreDailyProgress();
  }

  // Header
  modeLabel.textContent = mode === 'daily' ? 'Daily' : 'Practice';

  render();
}

/* ---------- Render ---------- */

function render() {
  renderSolved();
  renderGrid();
  renderMistakes();
  renderControls();
}

function renderSolved() {
  solvedList.innerHTML = '';
  state.solvedGroups.forEach(sg => {
    const row = document.createElement('div');
    row.className = `solved-row ${COLORS[sg.group]}`;
    row.innerHTML = `
      <span class="cat"></span>
      <span class="ws"></span>
    `;
    row.querySelector('.cat').textContent = sg.category;
    row.querySelector('.ws').textContent = sg.words.join(', ');
    solvedList.appendChild(row);
  });
}

function renderGrid() {
  grid.innerHTML = '';
  state.tiles.forEach((t, i) => {
    if (t.solved) return; // solved tiles are shown in the bar above, not in grid
    const btn = document.createElement('button');
    btn.className = 'tile';
    btn.type = 'button';
    btn.textContent = t.word;
    btn.dataset.idx = String(i);
    if (state.selected.has(i)) btn.classList.add('selected');
    btn.addEventListener('click', () => toggleSelect(i, btn));
    grid.appendChild(btn);
  });
}

function renderMistakes() {
  const dots = mistakeDots.querySelectorAll('.dot');
  dots.forEach((d, i) => {
    d.classList.toggle('gone', i < state.mistakes);
  });
}

function renderControls() {
  const n = state.selected.size;
  const playing = !state.finished;
  shuffleBtn.disabled = !playing;
  deselectBtn.disabled = !playing || n === 0;
  submitBtn.disabled = !playing || n !== 4;
}

/* ---------- Selection ---------- */

function toggleSelect(idx, btnEl) {
  if (state.finished) return;
  if (state.selected.has(idx)) {
    state.selected.delete(idx);
    btnEl.classList.remove('selected');
  } else {
    if (state.selected.size >= 4) {
      // already 4 selected, ignore
      return;
    }
    state.selected.add(idx);
    btnEl.classList.add('selected');
  }
  renderControls();
}

function deselectAll() {
  state.selected.clear();
  $$('.tile.selected').forEach(el => el.classList.remove('selected'));
  renderControls();
}

function shuffleRemaining() {
  if (state.finished) return;
  const selectedWords = new Set(
    Array.from(state.selected).map(i => state.tiles[i].word)
  );
  const solvedTiles = state.tiles.filter(t => t.solved);
  const unsolvedTiles = state.tiles.filter(t => !t.solved);
  shuffleArr(unsolvedTiles);
  // Recombine — solved tiles can remain at any positions; only unsolved tiles
  // are rendered into the grid. Put solved first to keep array simple.
  state.tiles = solvedTiles.concat(unsolvedTiles);
  // Rebuild selection indices from words.
  state.selected = new Set();
  state.tiles.forEach((t, i) => {
    if (!t.solved && selectedWords.has(t.word)) state.selected.add(i);
  });
  renderGrid();
  renderControls();
}

/* ---------- Submit ---------- */

function submitGuess() {
  if (state.finished || state.selected.size !== 4) return;

  // Find the chosen tile indices in selection order is fine; we don't need order.
  const sel = Array.from(state.selected);
  const chosenTiles = sel.map(i => state.tiles[i]);
  const chosenWords = chosenTiles.map(t => t.word);

  // Bounce animation, then resolve.
  const tileEls = sel.map(i => grid.querySelector(`[data-idx="${i}"]`)).filter(Boolean);
  tileEls.forEach((el, k) => {
    el.style.animationDelay = `${k * 90}ms`;
    el.classList.add('bounce');
  });

  // After bounce delay, evaluate.
  const totalDelay = 90 * 4 + 250;
  setTimeout(() => {
    tileEls.forEach(el => { el.classList.remove('bounce'); el.style.animationDelay = ''; });

    // Already-guessed check
    const key = chosenWords.slice().sort().join('|');
    if (state.pastGuesses.has(key)) {
      toast('Already guessed!');
      return;
    }
    state.pastGuesses.add(key);

    // Record guess for emoji grid.
    state.guessLog.push(chosenTiles.map(t => COLORS[t.group]));

    // All same group?
    const groups = chosenTiles.map(t => t.group);
    const allSame = groups.every(g => g === groups[0]);

    if (allSame) {
      handleCorrect(groups[0], chosenWords);
    } else {
      // Count of the most common group
      const counts = {};
      groups.forEach(g => counts[g] = (counts[g] || 0) + 1);
      const max = Math.max(...Object.values(counts));
      handleWrong(max === 3, tileEls);
    }
  }, totalDelay);
}

function handleCorrect(groupIdx, chosenWords) {
  // Mark tiles solved
  state.tiles.forEach(t => {
    if (t.group === groupIdx && chosenWords.includes(t.word)) {
      t.solved = true;
    }
  });
  // Record solved group
  const ans = state.current.a[groupIdx];
  state.solvedGroups.push({
    group: groupIdx,
    words: ans.w,
    category: ans.c,
  });
  // Clear selection
  state.selected.clear();
  // Save daily progress
  if (state.mode === 'daily') saveDailyProgress();

  render();

  // Win check
  if (state.solvedGroups.length === 4) {
    finishGame(true);
  }
}

function handleWrong(oneAway, tileEls) {
  state.mistakes++;
  // Shake all 4 tiles
  tileEls.forEach(el => {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 600);
  });
  renderMistakes();
  if (oneAway && state.mistakes < MAX_MISTAKES) {
    toast('One away…');
  }
  if (state.mode === 'daily') saveDailyProgress();
  if (state.mistakes >= MAX_MISTAKES) {
    finishGame(false);
  }
}

/* ---------- Finish ---------- */

function finishGame(won) {
  state.finished = true;
  state.won = won;
  // Deselect
  state.selected.clear();

  // If lost, reveal remaining groups in their natural difficulty order
  if (!won) {
    const remaining = [0,1,2,3].filter(g => !state.solvedGroups.some(s => s.group === g));
    remaining.forEach(g => {
      const ans = state.current.a[g];
      state.solvedGroups.push({ group: g, words: ans.w, category: ans.c });
      // mark tiles solved so grid empties out
      state.tiles.forEach(t => { if (t.group === g) t.solved = true; });
    });
  }
  render();

  recordResult(won);
  showEndModal();

  // If daily, the progress is now final — keep it stored so the user can
  // see results if they reopen.
  if (state.mode === 'daily') saveDailyProgress();
}

function recordResult(won) {
  // Record in history (per puzzle number) and update stats.
  const hist = getHistory();
  const key = String(state.current.n);
  const wasPlayedBefore = !!hist[key];
  // For practice mode, always record latest result.
  hist[key] = { won, mistakes: state.mistakes, date: state.current.d, ts: Date.now() };
  setHistory(hist);

  // Stats only update on the FIRST completion of a given puzzle, OR per-daily.
  // To keep stats consistent across modes, we count each puzzle once.
  if (!wasPlayedBefore) {
    const s = getStats();
    s.played++;
    if (won) {
      s.wins++;
      s.streak = (state.mode === 'daily') ? s.streak + 1 : s.streak; // streak only via daily
      if (s.streak > s.maxStreak) s.maxStreak = s.streak;
      if (state.mistakes === 0) s.perfect++;
    } else if (state.mode === 'daily') {
      s.streak = 0;
    }
    const distKey = won ? state.mistakes : 4;
    s.dist[distKey] = (s.dist[distKey] || 0) + 1;
    setStats(s);
  } else {
    // Replays: don't double-count, but still update streak for daily wins
    if (state.mode === 'daily') {
      const s = getStats();
      if (won) {
        s.streak += 1;
        if (s.streak > s.maxStreak) s.maxStreak = s.streak;
      } else {
        s.streak = 0;
      }
      setStats(s);
    }
  }
}

/* ---------- End modal ---------- */

function buildEmojiGrid() {
  return state.guessLog.map(row => row.map(c => EMOJI[c]).join('')).join('\n');
}

function showEndModal() {
  const titleEl = $('#end-title');
  const subEl = $('#end-sub');
  const emojiEl = $('#emoji-grid');
  const grid = buildEmojiGrid();
  const result = state.won
    ? (state.mistakes === 0
        ? { t: 'Perfect!', s: 'No mistakes. Beautiful.' }
        : { t: 'Solved!', s: `${MAX_MISTAKES - state.mistakes} mistake${MAX_MISTAKES - state.mistakes === 1 ? '' : 's'} remaining.` })
    : { t: 'Next time!', s: 'Better luck on the next puzzle.' };
  titleEl.textContent = result.t;
  subEl.textContent = `${state.mode === 'daily' ? 'Daily' : 'Practice'}${result.s ? ' — ' + result.s : ''}`;
  emojiEl.textContent = grid || '(no guesses)';
  endModal.showModal();
}

async function copyResult() {
  const text = buildEmojiGrid();
  try {
    await navigator.clipboard.writeText(text);
    toast('Result copied');
  } catch {
    toast("Couldn't copy — long-press to select");
  }
}

/* ---------- Daily progress persistence ---------- */

function dailyKey() { return `${todayLocal()}::${state.current.n}`; }

function saveDailyProgress() {
  const all = loadJSON(KEY_DAILY, {});
  all[dailyKey()] = {
    solvedGroups: state.solvedGroups.map(sg => sg.group),
    mistakes: state.mistakes,
    finished: state.finished,
    won: state.won,
    // tile order to restore visual continuity:
    order: state.tiles.map(t => t.word),
    guessLog: state.guessLog,
    pastGuesses: Array.from(state.pastGuesses),
  };
  saveJSON(KEY_DAILY, all);
}

function restoreDailyProgress() {
  const all = loadJSON(KEY_DAILY, {});
  const saved = all[dailyKey()];
  if (!saved) return;
  // Reorder tiles to match saved
  const byWord = new Map(state.tiles.map(t => [t.word, t]));
  state.tiles = saved.order.map(w => byWord.get(w)).filter(Boolean);
  // Replay solved groups
  saved.solvedGroups.forEach(gIdx => {
    const ans = state.current.a[gIdx];
    state.solvedGroups.push({ group: gIdx, words: ans.w, category: ans.c });
    state.tiles.forEach(t => { if (t.group === gIdx) t.solved = true; });
  });
  state.mistakes = saved.mistakes || 0;
  state.finished = !!saved.finished;
  state.won = !!saved.won;
  state.guessLog = saved.guessLog || [];
  state.pastGuesses = new Set(saved.pastGuesses || []);
}

/* ---------- Modes ---------- */

function startDaily() {
  const idx = dailyIndexForDate(todayLocal(), state.puzzles.length);
  const puzzle = state.puzzles[idx];
  // Streak rollover logic: if last daily date is neither today nor yesterday,
  // reset the streak.
  const lastDate = localStorage.getItem(KEY_LAST_DAILY_DATE);
  if (lastDate) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
    if (lastDate !== todayLocal() && lastDate !== yKey) {
      const s = getStats(); s.streak = 0; setStats(s);
    }
  }
  localStorage.setItem(KEY_LAST_DAILY_DATE, todayLocal());

  startPuzzle(puzzle, 'daily');
}

function startRandomPractice() {
  // Avoid the daily and avoid already-played puzzles if any unplayed remain.
  const hist = getHistory();
  const dailyIdx = dailyIndexForDate(todayLocal(), state.puzzles.length);
  const unplayed = state.puzzles
    .map((p, i) => ({ p, i }))
    .filter(x => x.i !== dailyIdx && !hist[String(x.p.n)]);
  let pick;
  if (unplayed.length > 0) {
    pick = unplayed[Math.floor(Math.random() * unplayed.length)].p;
  } else {
    // All played — just pick randomly excluding today's daily.
    const pool = state.puzzles.filter((_, i) => i !== dailyIdx);
    pick = pool[Math.floor(Math.random() * pool.length)] || state.puzzles[0];
  }
  startPuzzle(pick, 'practice');
}

function startSpecificPractice(puzzleNumber) {
  const p = state.puzzles.find(x => x.n === puzzleNumber);
  if (!p) { toast('Puzzle not found'); return; }
  startPuzzle(p, 'practice');
}

/* ---------- Archive ---------- */

function renderArchive(filter = '') {
  const list = $('#archive-list');
  const hist = getHistory();
  list.innerHTML = '';

  const q = filter.trim().toLowerCase();
  // Sort newest first
  const items = state.puzzles.slice().sort((a, b) => b.n - a.n);
  let shown = 0;
  for (const p of items) {
    if (q) {
      const hay = `#${p.n} ${p.d} ${prettyDate(p.d).toLowerCase()}`;
      if (!hay.toLowerCase().includes(q)) continue;
    }
    const btn = document.createElement('button');
    btn.className = 'archive-item';
    btn.type = 'button';
    const h = hist[String(p.n)];
    let badge = '';
    if (h) {
      badge = h.won
        ? `<span class="badge solved">Solved · ${h.mistakes}✗</span>`
        : `<span class="badge failed">Played</span>`;
    } else {
      badge = '<span class="badge">New</span>';
    }
    btn.innerHTML = `
      <span class="n">#${p.n}</span>
      <span class="d">${prettyDate(p.d)}</span>
      ${badge}
    `;
    btn.addEventListener('click', () => {
      archiveDrawer.close();
      startSpecificPractice(p.n);
    });
    list.appendChild(btn);
    shown++;
    if (shown >= 200) break; // virtualization light — first 200 matches
  }
  const total = state.puzzles.length;
  const played = Object.keys(hist).length;
  $('#archive-total').textContent = String(total);
  $('#played-count').textContent = String(played);
}

/* ---------- Stats modal ---------- */

function renderStats() {
  const s = getStats();
  $('#stat-played').textContent = String(s.played);
  $('#stat-winpct').textContent = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  $('#stat-streak').textContent = String(s.streak);
  $('#stat-maxstreak').textContent = String(s.maxStreak);
  $('#stat-perfect').textContent = String(s.perfect);

  const dist = s.dist || {};
  const max = Math.max(1, ...Object.values(dist));
  const dEl = $('#dist');
  dEl.innerHTML = '';
  const labels = [
    { k: 0, label: '0 ✗ (perfect)' },
    { k: 1, label: '1 ✗' },
    { k: 2, label: '2 ✗' },
    { k: 3, label: '3 ✗' },
    { k: 4, label: 'Loss' },
  ];
  labels.forEach(({k, label}) => {
    const v = dist[k] || 0;
    const row = document.createElement('div');
    row.className = 'dist-row';
    row.innerHTML = `<span>${label}</span><span class="dist-bar"><span style="width:${(v / max) * 100}%"></span></span><strong>${v}</strong>`;
    dEl.appendChild(row);
  });
}

/* ---------- PWA install ---------- */

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('#install-item').hidden = false;
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  $('#install-item').hidden = true;
  toast('Installed!');
});

async function promptInstall() {
  if (!deferredPrompt) {
    // iOS Safari has no programmatic prompt — show guidance.
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
      toast('In Safari: Share → Add to Home Screen', 3500);
    } else {
      toast('Install option not available — try your browser menu', 3000);
    }
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}

/* ---------- Event wiring ---------- */

submitBtn.addEventListener('click', submitGuess);
deselectBtn.addEventListener('click', deselectAll);
shuffleBtn.addEventListener('click', shuffleRemaining);

// Header buttons
$('#menu-btn').addEventListener('click', () => menuDrawer.showModal());
$('#stats-btn').addEventListener('click', () => { renderStats(); statsModal.showModal(); });

// Close buttons via data-attrs
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.hasAttribute('data-close-menu')) menuDrawer.close();
  if (t.hasAttribute('data-close-archive')) archiveDrawer.close();
  if (t.hasAttribute('data-close-stats')) statsModal.close();
  if (t.hasAttribute('data-close-end')) endModal.close();
  if (t.hasAttribute('data-close-how')) howModal.close();
});

// Close drawers when clicking backdrop
[menuDrawer, archiveDrawer].forEach(dlg => {
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
});

// Menu actions
$$('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    menuDrawer.close();
    switch (action) {
      case 'daily':           startDaily(); break;
      case 'practice-random': startRandomPractice(); break;
      case 'archive':         renderArchive(); archiveDrawer.showModal(); break;
      case 'how-to':          howModal.showModal(); break;
      case 'install':         promptInstall(); break;
      case 'reset':           confirmReset(); break;
    }
  });
});

$('#archive-search-input').addEventListener('input', (e) => {
  renderArchive(e.target.value);
});

$('#copy-result').addEventListener('click', copyResult);
$('#next-puzzle').addEventListener('click', () => {
  endModal.close();
  startRandomPractice();
});

function confirmReset() {
  if (!confirm('Clear all stats and practice history? This cannot be undone.')) return;
  localStorage.removeItem(KEY_STATS);
  localStorage.removeItem(KEY_HIST);
  localStorage.removeItem(KEY_DAILY);
  localStorage.removeItem(KEY_LAST_DAILY_DATE);
  toast('Progress cleared');
  // Restart current mode
  if (state.mode === 'daily') startDaily(); else startRandomPractice();
}

/* ---------- Boot ---------- */

async function boot() {
  try {
    const res = await fetch('data.json');
    state.puzzles = await res.json();
  } catch (err) {
    toast('Could not load puzzles');
    console.error(err);
    return;
  }
  $('#puzzle-count').textContent = String(state.puzzles.length);
  startDaily();

  // Register service worker — must be after first paint to feel snappy.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
}
boot();

})();
