# Touch Color Map Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Touch Color Map generator to support starting ranges from 0, increasing limits to 1000 items, adding bulk range exclusions (e.g., F3-F151), rendering page titles, subtitles, and footers, and supporting adjustable layout column configurations with label positions (inside vs. above shape).

**Architecture:** Extend `js/state.js`, `js/renderer.js`, `app.js`, and `styles.css`. Add a bulk exclusion parser, input fields for header/footer metadata, layout style selectors, and update unit/integration tests to cover the new behaviors.

**Tech Stack:** Vanilla JS, HTML5, CSS3, Node.js (for testing).

## Global Constraints
* Maintain 100% vanilla approach with no external libraries.
* Auto-save all new options (title, subtitle, footer, label position, layout grid) to localStorage.
* Keep print layouts clean and crisp on physical sheets.

---

### Task 1: State, Validations & Bulk Exclusions

**Files:**
- Modify: `js/state.js`
- Modify: `tests/state.test.js`

**Interfaces:**
- Produces:
  * `state.title`, `state.subtitle`, `state.footer`: Strings representing page metadata.
  * `state.labelPosition`: String `'inside' | 'above'`.
  * `state.gridColumns`: Number (0 for auto, or 5, 8, 10, 12).
  * `bulkExclude(expression)`: Parses expressions like "F3-F151" or "F3, F4" and adds them to `state.excludedItems`.
  * `bulkRestore(expression)`: Restores multiple items based on range expression.

- [ ] **Step 1: Write tests for state extensions**
  Add unit tests in `tests/state.test.js` for bulk range parsing (`bulkExclude` and `bulkRestore`), defensive properties initialization (checking default title/subtitle/footer/columns/labelPosition), and zero-start range calculations.

  Replace target content in `/Users/guilhermeandrade/Documents/Projetos/touch-color-map/tests/state.test.js` using `node:test`:
  ```javascript
  // Add these test cases to the existing file:
  test('Bulk Exclusions Parsing', () => {
    resetState();
    // Test comma-separated list
    bulkExclude('F3, F4, F5');
    assert.deepStrictEqual(state.excludedItems, ['F3', 'F4', 'F5']);

    // Test range dash parsing
    bulkExclude('F10-F12');
    assert.ok(state.excludedItems.includes('F10'));
    assert.ok(state.excludedItems.includes('F11'));
    assert.ok(state.excludedItems.includes('F12'));

    // Test restoring bulk
    bulkRestore('F4-F5');
    assert.ok(!state.excludedItems.includes('F4'));
    assert.ok(!state.excludedItems.includes('F5'));
    assert.ok(state.excludedItems.includes('F3'));
  });
  ```

- [ ] **Step 2: Update state module**
  Modify `js/state.js` to initialize default properties, allow `start` to be `0`, raise the range limit check validation, and implement `bulkExclude`/`bulkRestore` regex parsing.

- [ ] **Step 3: Run unit tests**
  Run: `node --test tests/state.test.js`
  Expected output: PASS all tests.

- [ ] **Step 4: Commit**
  Commit the files with message: `"feat: add bulk range exclusion parser and state extensions for titles and layouts"`

---

### Task 2: UI Form Fields & Responsive Styles

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `state.title`, `state.subtitle`, `state.footer`, `state.gridColumns`, `state.labelPosition`.
- Produces: Sidebar inputs for page title/subtitle/footer, layout options, a bulk exclusion box, and rendering container columns.

- [ ] **Step 1: Update index.html**
  * Change `min="1"` on `input-start` to `min="0"`.
  * Add a form section for Page Info (Title, Subtitle, Footer).
  * Add a form section for Layout Config (Label Position: Inside vs Above; Columns: Auto, 5, 8, 10, 12).
  * Add a "Bulk Exclude" action card under the exclusions list.

- [ ] **Step 2: Update styles.css**
  * Add styles for page title/subtitle headers and footers on the printable sheet.
  * Add utility classes for grids: `.grid-cols-5`, `.grid-cols-8`, `.grid-cols-10`, `.grid-cols-12` applying `grid-template-columns: repeat(X, 1fr)`.
  * Add styling for "Label Position: Above" layout where the code text is placed on top of the empty outline shape, with a clean separator line.

- [ ] **Step 3: Commit**
  Commit markup and layout styles with message: `"feat: design page headers, footers, custom grid columns, and above-label layouts"`

---

### Task 3: Renderer & Event Connections

**Files:**
- Modify: `js/renderer.js`
- Modify: `app.js`
- Modify: `tests/integration.test.js`

**Interfaces:**
- Consumes: All updated state variables.
- Produces: Dynamic headers/footers on sheets, renders grid containers matching column options, applies labels above shapes if selected, and connects bulk inputs.

- [ ] **Step 1: Update js/renderer.js**
  * Add header & footer DOM generation on the page preview sheet.
  * Update `renderPrintSheet` to dynamically add the grid column classes.
  * Render labels above the shape when `state.labelPosition === 'above'`.

- [ ] **Step 2: Update app.js**
  * Connect input change events for Title, Subtitle, and Footer to update state.
  * Connect dropdown changes for Label Position and Grid Columns.
  * Connect Bulk Exclude form submission.
  * Update range size form validation check to allow up to 1000 items instead of 300.

- [ ] **Step 3: Update tests/integration.test.js**
  Add test assertions verifying bulk exclusion parsing in the UI, title change rendering, and grid column count layouts.

- [ ] **Step 4: Run integration tests**
  Run: `node --test tests/integration.test.js`
  Expected output: PASS.

- [ ] **Step 5: Commit**
  Commit connection logic with message: `"feat: connect bulk exclusions, metadata settings, and grid rendering parameters"`
