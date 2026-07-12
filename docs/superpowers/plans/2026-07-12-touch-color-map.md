# Touch Color Map Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a beautiful, responsive single-page web app to generate printable outlines of tracker grids (circles/hearts) with custom prefixes and numbers, allowing users to interactively exclude individual items and dynamically reflow the remaining sequence for printing.

**Architecture:** Vanilla HTML5, CSS3, and ES Modules. State management holds ranges and exclusions, persists to localStorage, and renders svg outlines. A print stylesheet hides UI chrome and scales pages perfectly.

**Tech Stack:** Vanilla JS (ES Modules), HTML5, CSS3 (CSS Variables for theme/print), Node.js (strictly for running built-in assertions/tests under `node --test`).

## Global Constraints
* No external CSS libraries (like TailwindCSS) or external JS framework libraries (like React/Vue) - use native vanilla APIs.
* Outlines must print cleanly on A4 or Letter sizes.
* Excluded items must be completely removed from the grid sequence, making the remaining items flow continuously.

---

### Task 1: State Management & Unit Test Suite

**Files:**
- Create: `js/state.js`
- Create: `tests/state.test.js`

**Interfaces:**
- Produces:
  * `state`: The global state object containing `theme`, `paperSize`, `ranges`, and `excludedItems`.
  * `addRange({ prefix, start, end, symbol, color })`: Adds a range rule and returns its generated ID.
  * `removeRange(id)`: Removes a range rule by its ID.
  * `toggleExclusion(label)`: Toggles whether a specific item label (e.g. "C4") is excluded.
  * `getEffectiveItems(range)`: Returns an array of numbers representing non-excluded items within a range.
  * `saveState()`: Persists current state to localStorage.
  * `loadState()`: Loads state from localStorage or initializes defaults.

- [ ] **Step 1: Create the failing unit test file**
  Create `tests/state.test.js` to assert state operations (adding/removing ranges, toggling exclusions, generating correct list sequence).

  Write code to `/Users/guilhermeandrade/Documents/Projetos/touch-color-map/tests/state.test.js`:
  ```javascript
  import test from 'node:test';
  import assert from 'node:assert';
  import { 
    state, 
    addRange, 
    removeRange, 
    toggleExclusion, 
    getEffectiveItems, 
    resetState 
  } from '../js/state.js';

  test('State Operations Test Suite', async (t) => {
    await t.test('should initialize with default empty values', () => {
      resetState();
      assert.strictEqual(state.ranges.length, 0);
      assert.strictEqual(state.excludedItems.length, 0);
    });

    await t.test('should add a range rule correctly', () => {
      resetState();
      const id = addRange({ prefix: 'C', start: 1, end: 5, symbol: 'circle', color: '#ff0000' });
      assert.strictEqual(state.ranges.length, 1);
      assert.strictEqual(state.ranges[0].id, id);
      assert.strictEqual(state.ranges[0].prefix, 'C');
    });

    await t.test('should handle exclusions and reflow correctly', () => {
      resetState();
      const range = { prefix: 'C', start: 1, end: 5 };
      
      // Initially C1 to C5 should be present
      let items = getEffectiveItems(range);
      assert.deepStrictEqual(items, [1, 2, 3, 4, 5]);

      // Exclude C3
      toggleExclusion('C3');
      assert.deepStrictEqual(state.excludedItems, ['C3']);
      
      // List should reflow without 3
      items = getEffectiveItems(range);
      assert.deepStrictEqual(items, [1, 2, 4, 5]);

      // Toggle C3 back
      toggleExclusion('C3');
      assert.deepStrictEqual(state.excludedItems, []);
      items = getEffectiveItems(range);
      assert.deepStrictEqual(items, [1, 2, 3, 4, 5]);
    });

    await t.test('should remove a range rule correctly', () => {
      resetState();
      const id = addRange({ prefix: 'G', start: 1, end: 3, symbol: 'heart', color: '#00ff00' });
      assert.strictEqual(state.ranges.length, 1);
      removeRange(id);
      assert.strictEqual(state.ranges.length, 0);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test tests/state.test.js`
  Expected output: Failures (cannot import `../js/state.js` as it does not exist yet).

- [ ] **Step 3: Create the minimal state implementation**
  Create `js/state.js` with storage mapping, reactive state updating, and state logic.

  Write code to `/Users/guilhermeandrade/Documents/Projetos/touch-color-map/js/state.js`:
  ```javascript
  export let state = {
    theme: 'dark',
    paperSize: 'a4',
    symbolScale: 1.0,
    ranges: [],
    excludedItems: []
  };

  export function resetState() {
    state.theme = 'dark';
    state.paperSize = 'a4';
    state.symbolScale = 1.0;
    state.ranges = [];
    state.excludedItems = [];
  }

  export function addRange({ prefix, start, end, symbol, color }) {
    const id = 'range-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    state.ranges.push({
      id,
      prefix: prefix.trim(),
      start: parseInt(start, 10),
      end: parseInt(end, 10),
      symbol: symbol || 'circle',
      color: color || '#6366f1'
    });
    saveState();
    return id;
  }

  export function removeRange(id) {
    state.ranges = state.ranges.filter(r => r.id !== id);
    saveState();
  }

  export function toggleExclusion(label) {
    const idx = state.excludedItems.indexOf(label);
    if (idx > -1) {
      state.excludedItems.splice(idx, 1);
    } else {
      state.excludedItems.push(label);
    }
    saveState();
  }

  export function getEffectiveItems(range) {
    const items = [];
    for (let i = range.start; i <= range.end; i++) {
      const label = `${range.prefix}${i}`;
      if (!state.excludedItems.includes(label)) {
        items.push(i);
      }
    }
    return items;
  }

  export function saveState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('touch_color_map_state', JSON.stringify(state));
    }
  }

  export function loadState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('touch_color_map_state');
      if (saved) {
        try {
          state = Object.assign(state, JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse state", e);
        }
      }
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test tests/state.test.js`
  Expected output: Pass all tests.

- [ ] **Step 5: Commit changes**
  Run:
  ```bash
  git add js/state.js tests/state.test.js
  git commit -m "feat: implement state manager and add passing unit test suite"
  ```

---

### Task 2: UI Foundation & Styling System

**Files:**
- Create: `index.html`
- Create: `styles.css`

**Interfaces:**
- Consumes: Theme status (uses CSS custom variables to toggle Light/Dark styles, and page classes for A4/Letter size sizing).
- Produces: The complete user interface layout with styled controls, scrollbars, responsive elements, and printable sheet structure.

- [ ] **Step 1: Write index.html with control forms and print canvas**
  Create `index.html` with basic layout scaffolding.

  Write code to `/Users/guilhermeandrade/Documents/Projetos/touch-color-map/index.html`:
  ```html
  <!DOCTYPE html>
  <html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Touch Color Map Generator</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <!-- App Container -->
    <div class="app-layout no-print">
      <!-- Sidebar Control Panel -->
      <aside class="sidebar">
        <header class="sidebar-header">
          <h1 class="logo-text">Touch Color Map</h1>
          <p class="subtitle-text">Printable Tracker Grid Generator</p>
        </header>

        <section class="config-section">
          <h2>Create New Range</h2>
          <form id="range-form" class="control-form">
            <div class="form-row">
              <div class="form-group">
                <label for="input-prefix">Prefix</label>
                <input type="text" id="input-prefix" placeholder="e.g. C, GC" maxlength="5">
              </div>
            </div>
            <div class="form-row split">
              <div class="form-group">
                <label for="input-start">Start</label>
                <input type="number" id="input-start" value="1" min="1" required>
              </div>
              <div class="form-group">
                <label for="input-end">End</label>
                <input type="number" id="input-end" value="10" min="1" required>
              </div>
            </div>
            <div class="form-group">
              <label>Symbol Type</label>
              <div class="symbol-selector">
                <label class="radio-card">
                  <input type="radio" name="symbol-type" value="circle" checked>
                  <div class="radio-content">
                    <span class="symbol-preview circle-preview"></span>
                    Circle
                  </div>
                </label>
                <label class="radio-card">
                  <input type="radio" name="symbol-type" value="heart">
                  <div class="radio-content">
                    <span class="symbol-preview heart-preview"></span>
                    Heart
                  </div>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>Color Swatch</label>
              <div class="color-picker-wrapper">
                <div class="color-presets" id="color-presets">
                  <!-- Rendered dynamically -->
                </div>
                <div class="custom-color-input">
                  <input type="color" id="input-color" value="#6366f1">
                  <span>Custom Color</span>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-primary">Add Range Rule</button>
          </form>
        </section>

        <!-- Active Rules Panel -->
        <section class="active-ranges-section">
          <h2>Active Ranges</h2>
          <div id="active-ranges-list" class="ranges-list">
            <!-- Empty state or items rendered dynamically -->
          </div>
        </section>

        <!-- Global Settings Panel -->
        <section class="settings-section">
          <h2>Page & Controls</h2>
          <div class="form-group">
            <label for="select-paper">Paper Size</label>
            <select id="select-paper">
              <option value="a4">A4 (210 x 297 mm)</option>
              <option value="letter">US Letter (8.5 x 11 in)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="range-scale">Symbol Scale: <span id="scale-val">1.0</span>x</label>
            <input type="range" id="range-scale" min="0.6" max="1.8" step="0.1" value="1.0">
          </div>
          <div class="button-group">
            <button id="btn-theme" class="btn btn-secondary">Toggle Theme</button>
            <button id="btn-clear" class="btn btn-danger">Clear All</button>
          </div>
        </section>
      </aside>

      <!-- Preview Canvas Area -->
      <main class="preview-area">
        <header class="preview-header">
          <div class="preview-title">
            <h2>Print Preview Sheet</h2>
            <p>Click on any shape to remove it from the map. The remaining symbols will collapse and re-flow.</p>
          </div>
          <button id="btn-print" class="btn btn-success">Print Map</button>
        </header>

        <div class="sheet-container">
          <!-- Represents the physical printed page -->
          <div id="print-sheet" class="print-page paper-a4">
            <div id="sheet-content">
              <!-- Dynamically populated outline categories -->
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Script Entry -->
    <script type="module" src="app.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Create CSS file with Design System and Print Rules**
  Write custom variables for dark/light themes, typography, custom scrollbars, layout styling, and print settings.

  Write code to `/Users/guilhermeandrade/Documents/Projetos/touch-color-map/styles.css`:
  ```css
  /* Core Design Tokens */
  :root {
    --font-primary: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    /* Dark Mode Defaults */
    --bg-app: #0f172a;
    --bg-sidebar: rgba(30, 41, 59, 0.7);
    --border-sidebar: rgba(255, 255, 255, 0.08);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --bg-card: #1e293b;
    --border-card: rgba(255, 255, 255, 0.05);
    --bg-input: #0f172a;
    --border-input: rgba(255, 255, 255, 0.15);
    
    --primary: #6366f1;
    --secondary: #475569;
    --danger: #ef4444;
    --success: #10b981;
    
    --sheet-bg: #ffffff;
    --sheet-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    --sheet-border: #e2e8f0;
    
    --transition-speed: 0.2s;
  }

  [data-theme="light"] {
    --bg-app: #f1f5f9;
    --bg-sidebar: rgba(255, 255, 255, 0.8);
    --border-sidebar: rgba(0, 0, 0, 0.08);
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --bg-card: #ffffff;
    --border-card: rgba(0, 0, 0, 0.05);
    --bg-input: #f8fafc;
    --border-input: rgba(0, 0, 0, 0.12);
    
    --sheet-bg: #ffffff;
    --sheet-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    --sheet-border: #cbd5e1;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--font-primary);
    background-color: var(--bg-app);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
    transition: background-color var(--transition-speed), color var(--transition-speed);
  }

  /* App Layout */
  .app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  /* Sidebar Controls */
  .sidebar {
    width: 380px;
    background-color: var(--bg-sidebar);
    backdrop-filter: blur(12px);
    border-right: 1px solid var(--border-sidebar);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #a5b4fc, #fda4af);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  h2 {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    margin-bottom: 16px;
    font-weight: 600;
  }

  .control-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-row {
    display: flex;
    gap: 12px;
  }

  .form-row.split > * {
    flex: 1;
  }

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  input[type="text"],
  input[type="number"],
  select {
    width: 100%;
    padding: 10px 12px;
    background-color: var(--bg-input);
    border: 1px solid var(--border-input);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: var(--font-primary);
    font-size: 0.9rem;
    outline: none;
    transition: border-color var(--transition-speed);
  }

  input:focus, select:focus {
    border-color: var(--primary);
  }

  /* Radio Card Selectors */
  .symbol-selector {
    display: flex;
    gap: 12px;
  }

  .radio-card {
    flex: 1;
    cursor: pointer;
  }

  .radio-card input {
    display: none;
  }

  .radio-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background-color: var(--bg-card);
    border: 2px solid transparent;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all var(--transition-speed);
  }

  .radio-card input:checked + .radio-content {
    border-color: var(--primary);
    background-color: rgba(99, 102, 241, 0.1);
  }

  .symbol-preview {
    width: 14px;
    height: 14px;
    display: inline-block;
    border: 2px solid var(--text-secondary);
  }

  .circle-preview {
    border-radius: 50%;
  }

  .heart-preview {
    background-color: var(--text-secondary);
    clip-path: path("M12 4.419C12 4.419 10.082 0 6.004 0C2.69 0 0 2.5 0 5.862C0 11.233 12 18 12 18S24 11.233 24 5.862C24 2.5 21.31 0 17.996 0C13.918 0 12 4.419 12 4.419Z");
    transform: scale(0.6);
  }

  /* Color Swatches */
  .color-picker-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .color-presets {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .preset-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.15s;
  }

  .preset-dot:hover {
    transform: scale(1.1);
  }

  .preset-dot.active {
    border-color: var(--text-primary);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }

  .custom-color-input {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
  }

  input[type="color"] {
    appearance: none;
    -webkit-appearance: none;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    background: none;
  }

  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  input[type="color"]::-webkit-color-swatch {
    border: 1px solid var(--border-input);
    border-radius: 6px;
  }

  /* Buttons */
  .btn {
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    text-align: center;
  }

  .btn:hover {
    opacity: 0.9;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-primary { background-color: var(--primary); color: white; }
  .btn-secondary { background-color: var(--secondary); color: white; }
  .btn-danger { background-color: var(--danger); color: white; }
  .btn-success { background-color: var(--success); color: white; }

  .button-group {
    display: flex;
    gap: 8px;
  }

  .button-group > * {
    flex: 1;
  }

  /* Ranges List */
  .ranges-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  .range-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .range-card-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .range-card-color-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .btn-icon {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1.1rem;
    transition: color 0.15s;
  }

  .btn-icon:hover {
    color: var(--danger);
  }

  /* Main Canvas Area */
  .preview-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .preview-header {
    padding: 24px;
    border-bottom: 1px solid var(--border-sidebar);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .preview-title h2 {
    font-size: 1.25rem;
    color: var(--text-primary);
    margin-bottom: 4px;
    text-transform: none;
    letter-spacing: normal;
  }

  .preview-title p {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .sheet-container {
    flex: 1;
    overflow: auto;
    padding: 40px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  /* Printable Sheet Mimic */
  .print-page {
    background-color: var(--sheet-bg);
    border: 1px solid var(--sheet-border);
    box-shadow: var(--sheet-shadow);
    color: #334155;
    padding: 60px;
    transition: width 0.3s, height 0.3s;
    overflow: hidden;
  }

  /* Size Presets */
  .paper-a4 {
    width: 793px; /* A4 aspect ratio @ 96 DPI */
    min-height: 1122px;
  }

  .paper-letter {
    width: 816px; /* Letter aspect ratio @ 96 DPI */
    min-height: 1056px;
  }

  /* Sheet Layout Grid Components */
  .range-section {
    margin-bottom: 32px;
  }

  .range-section-header {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 16px;
    border-bottom: 2px solid #cbd5e1;
    padding-bottom: 6px;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .grid-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  /* Symbols and Layout */
  .symbol-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }

  .symbol-item:hover {
    transform: scale(1.1);
  }

  .symbol-item:active {
    transform: scale(0.9);
  }

  .symbol-shape {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .symbol-shape svg {
    fill: none;
    stroke-width: 2px;
    transition: transform 0.2s;
  }

  .symbol-label {
    position: absolute;
    font-size: 9px;
    font-weight: 700;
    user-select: none;
    pointer-events: none;
  }

  /* Animations for exclusion */
  .fade-out {
    opacity: 0;
    transform: scale(0.6);
  }

  /* Print Specific Rules */
  @media print {
    body {
      background: white !important;
      color: black !important;
    }
    
    .no-print,
    .sidebar,
    .preview-header,
    .app-layout::before {
      display: none !important;
    }

    .app-layout {
      display: block;
      height: auto;
      width: auto;
    }

    .preview-area {
      overflow: visible;
    }

    .sheet-container {
      padding: 0 !important;
      overflow: visible !important;
      display: block;
    }

    .print-page {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
    }

    .range-section {
      page-break-inside: avoid;
    }
  }
  ```

- [ ] **Step 3: Commit UI setup**
  Run:
  ```bash
  git add index.html styles.css
  git commit -m "feat: design visual control panels and high resolution print sheets"
  ```

---

### Task 3: Renderer & Event Logic Integration

**Files:**
- Create: `js/renderer.js`
- Create: `app.js`

**Interfaces:**
- Consumes: `state` and helper operations from `js/state.js`.
- Produces: SVG elements, preset indicators, visual range items, updates elements when scale/exclusions change, handles printing events.

- [ ] **Step 1: Write the Renderer**
  Create `js/renderer.js` to dynamically draw preset color dots, SVG icons for circle/heart trackers, active range cards, and interactive print preview elements.

  Write code to `/Users/guilhermeandrade/Documents/Projetos/touch-color-map/js/renderer.js`:
  ```javascript
  import { toggleExclusion, removeRange, getEffectiveItems, state } from './state.js';

  export const PRESET_COLORS = [
    '#6366f1', // Indigo
    '#f43f5e', // Rose
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#3b82f6', // Blue
  ];

  export function renderColorPresets(activeColor, onSelect) {
    const container = document.getElementById('color-presets');
    if (!container) return;
    container.innerHTML = '';
    
    PRESET_COLORS.forEach(color => {
      const dot = document.createElement('div');
      dot.className = `preset-dot ${color === activeColor ? 'active' : ''}`;
      dot.style.backgroundColor = color;
      dot.addEventListener('click', () => onSelect(color));
      container.appendChild(dot);
    });
  }

  export function renderActiveRanges(onDelete) {
    const list = document.getElementById('active-ranges-list');
    if (!list) return;
    list.innerHTML = '';

    if (state.ranges.length === 0) {
      list.innerHTML = '<p class="subtitle-text" style="text-align: center; padding: 12px 0;">No active ranges</p>';
      return;
    }

    state.ranges.forEach(range => {
      const card = document.createElement('div');
      card.className = 'range-card';
      card.innerHTML = `
        <div class="range-card-info">
          <div class="range-card-color-indicator" style="background-color: ${range.color}"></div>
          <span><strong>${range.prefix || 'No Prefix'}</strong> (${range.start}-${range.end})</span>
        </div>
        <button class="btn-icon" title="Delete Range">&times;</button>
      `;

      card.querySelector('.btn-icon').addEventListener('click', () => {
        removeRange(range.id);
        onDelete();
      });

      list.appendChild(card);
    });
  }

  // Helper to generate SVG string based on symbol type
  function getSymbolSVG(type, color, size) {
    if (type === 'heart') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="stroke: ${color};">
          <path d="M12 4.419C12 4.419 10.082 0 6.004 0C2.69 0 0 2.5 0 5.862C0 11.233 12 18 12 18S24 11.233 24 5.862C24 2.5 21.31 0 17.996 0C13.918 0 12 4.419 12 4.419Z" />
        </svg>
      `;
    }
    // Default circle
    const radius = 10;
    const center = 12;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="stroke: ${color};">
        <circle cx="${center}" cy="${center}" r="${radius}" />
      </svg>
    `;
  }

  export function renderPrintSheet(onToggleItem) {
    const container = document.getElementById('sheet-content');
    if (!container) return;
    container.innerHTML = '';

    if (state.ranges.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #64748b; margin-top: 100px;">Add ranges from the sidebar to populate your coloring tracker sheet.</div>';
      return;
    }

    // Size of symbols scaled
    const size = Math.round(36 * state.symbolScale);

    state.ranges.forEach(range => {
      const section = document.createElement('section');
      section.className = 'range-section';

      // Header
      const header = document.createElement('div');
      header.className = 'range-section-header';
      header.style.color = range.color;
      header.style.borderBottomColor = range.color;
      header.innerHTML = `
        <span>Range: ${range.prefix ? range.prefix + ' ' : ''}${range.start} to ${range.end}</span>
      `;
      section.appendChild(header);

      // Grid of symbols
      const grid = document.createElement('div');
      grid.className = 'grid-container';

      const items = getEffectiveItems(range);
      items.forEach(num => {
        const label = `${range.prefix}${num}`;
        const item = document.createElement('div');
        item.className = 'symbol-item';
        item.title = `Click to exclude ${label}`;

        const shape = document.createElement('div');
        shape.className = 'symbol-shape';
        shape.innerHTML = getSymbolSVG(range.symbol, range.color, size);

        const textLabel = document.createElement('span');
        textLabel.className = 'symbol-label';
        textLabel.style.color = range.color;
        textLabel.innerText = label;

        shape.appendChild(textLabel);
        item.appendChild(shape);

        item.addEventListener('click', () => {
          // Fade-out visual cue before removal
          item.classList.add('fade-out');
          setTimeout(() => {
            toggleExclusion(label);
            onToggleItem();
          }, 150);
        });

        grid.appendChild(item);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  }
  ```

- [ ] **Step 2: Connect the Application Bootstrap and Events**
  Create `app.js` to coordinate loading the state, rendering the view components, setting paper sizing, scales, and theme modes.

  Write code to `/Users/guilhermeandrade/Documents/Projetos/touch-color-map/app.js`:
  ```javascript
  import { state, addRange, loadState, saveState } from './js/state.js';
  import { renderColorPresets, renderActiveRanges, renderPrintSheet } from './js/renderer.js';

  let selectedColor = '#6366f1';

  function refreshUI() {
    renderActiveRanges(refreshUI);
    renderPrintSheet(refreshUI);
    document.getElementById('scale-val').innerText = state.symbolScale;
    
    // Theme application
    document.documentElement.setAttribute('data-theme', state.theme);

    // Paper size application
    const sheet = document.getElementById('print-sheet');
    sheet.className = `print-page paper-${state.paperSize}`;
  }

  // Setup presets color selections
  function handlePresetSelect(color) {
    selectedColor = color;
    document.getElementById('input-color').value = color;
    renderColorPresets(selectedColor, handlePresetSelect);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial State Load
    loadState();

    // 2. Setup static controls
    renderColorPresets(selectedColor, handlePresetSelect);
    
    // Bind form submissions
    const form = document.getElementById('range-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const prefix = document.getElementById('input-prefix').value;
      const start = document.getElementById('input-start').value;
      const end = document.getElementById('input-end').value;
      const symbol = document.querySelector('input[name="symbol-type"]:checked').value;
      const color = document.getElementById('input-color').value;

      addRange({ prefix, start, end, symbol, color });
      
      // Reset prefix form only, keep color
      document.getElementById('input-prefix').value = '';
      refreshUI();
    });

    // Color picker change
    document.getElementById('input-color').addEventListener('input', (e) => {
      selectedColor = e.target.value;
      renderColorPresets(selectedColor, handlePresetSelect);
    });

    // Paper Select
    const paperSelect = document.getElementById('select-paper');
    paperSelect.value = state.paperSize;
    paperSelect.addEventListener('change', (e) => {
      state.paperSize = e.target.value;
      saveState();
      refreshUI();
    });

    // Symbol Scale slider
    const scaleSlider = document.getElementById('range-scale');
    scaleSlider.value = state.symbolScale;
    scaleSlider.addEventListener('input', (e) => {
      state.symbolScale = parseFloat(e.target.value);
      saveState();
      refreshUI();
    });

    // Theme toggle
    document.getElementById('btn-theme').addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState();
      refreshUI();
    });

    // Clear all
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all configurations and exclusions?')) {
        state.ranges = [];
        state.excludedItems = [];
        saveState();
        refreshUI();
      }
    });

    // Print window
    document.getElementById('btn-print').addEventListener('click', () => {
      window.print();
    });

    // 3. Render initial views
    refreshUI();
  });
  ```

- [ ] **Step 3: Commit connection logic**
  Run:
  ```bash
  git add js/renderer.js app.js
  git commit -m "feat: connect UI bootstrap, range addition forms, and local storage events"
  ```
