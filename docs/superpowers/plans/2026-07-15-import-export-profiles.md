# Profiles & JSON Import/Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sidebar configuration section that allows users to save and load named profiles locally and export/import configuration files in JSON format.

**Architecture:** Extend the state layer with local profile persistence functions, implement dynamic listing of saved profiles in the renderer, add a "Profiles & Backup" sidebar component to `index.html`, and hook up event controllers in `app.js` with comprehensive validation.

**Tech Stack:** JavaScript (ES Modules), HTML5, CSS3, localStorage, native File Reader.

## Global Constraints
- High contrast (WCAG Level AA) must be maintained for printed and interactive UI elements.
- The UI styling must match the premium physical journal and planner aesthetic (clean alignments, restraint, dark sidebars, no gradients).
- Alphanumeric sorting and reflow behaviors must operate correctly across imported configurations.

---

### Task 1: Extend State Layer and Unit Tests

**Files:**
- Modify: `js/state.js`
- Modify: `tests/state.test.js`

**Interfaces:**
- Consumes: Existing `state` object and `saveState()` / `loadState()` persistence from `js/state.js`.
- Produces:
  - `getProfiles()`: Returns an array of saved profile objects from `localStorage`.
  - `saveProfile(name)`: Saves/overwrites the active state as a profile under the given name in `localStorage`.
  - `loadProfile(id)`: Restores state settings from the specified profile.
  - `deleteProfile(id)`: Removes the specified profile from the profile collection.
  - `exportToJSON()`: Serializes active state as a formatted JSON string.
  - `importFromJSON(jsonString)`: Validates and loads state from a JSON string.

- [ ] **Step 1: Add failing test cases to state.test.js**
  Append these test cases in `tests/state.test.js`:
  ```javascript
  import { 
    getProfiles,
    saveProfile,
    loadProfile,
    deleteProfile,
    exportToJSON,
    importFromJSON
  } from '../js/state.js';

  // Inside the main test suite
  await t.test('Profile Management and JSON Backup', () => {
    resetState();
    window.localStorage.clear();
    
    // Add some test active state
    addRange({ prefix: 'T', start: 1, end: 5 });
    state.title = 'Test Title';
    
    // Save Profile
    const profileId = saveProfile('Test Profile');
    assert.ok(profileId);
    
    const profiles = getProfiles();
    assert.strictEqual(profiles.length, 1);
    assert.strictEqual(profiles[0].name, 'Test Profile');
    assert.strictEqual(profiles[0].data.title, 'Test Title');
    
    // Reset active state
    resetState();
    assert.strictEqual(state.title, '');
    assert.strictEqual(state.ranges.length, 0);
    
    // Load Profile
    loadProfile(profileId);
    assert.strictEqual(state.title, 'Test Title');
    assert.strictEqual(state.ranges.length, 1);
    assert.strictEqual(state.ranges[0].prefix, 'T');
    
    // JSON Export
    const jsonStr = exportToJSON();
    assert.ok(jsonStr.includes('"title": "Test Title"'));
    
    // Reset active state
    resetState();
    
    // JSON Import
    importFromJSON(jsonStr);
    assert.strictEqual(state.title, 'Test Title');
    assert.strictEqual(state.ranges.length, 1);
    assert.strictEqual(state.ranges[0].prefix, 'T');
    
    // Delete Profile
    deleteProfile(profileId);
    const postDeleteProfiles = getProfiles();
    assert.strictEqual(postDeleteProfiles.length, 0);
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `node tests/state.test.js`
  Expected: FAIL with import errors or undefined functions.

- [ ] **Step 3: Implement state and serialization functions in js/state.js**
  Append functions to the end of `js/state.js`:
  ```javascript
  export function getProfiles() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const saved = localStorage.getItem('touch_color_map_profiles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse profiles", e);
      return [];
    }
  }

  export function saveProfile(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Profile name cannot be empty.');
    }
    const profiles = getProfiles();
    const id = 'profile-' + Date.now();
    const newProfile = {
      id,
      name: name.trim(),
      timestamp: Date.now(),
      data: {
        theme: state.theme,
        paperSize: state.paperSize,
        symbolScale: state.symbolScale,
        ranges: JSON.parse(JSON.stringify(state.ranges)),
        excludedItems: [...state.excludedItems],
        title: state.title,
        subtitle: state.subtitle,
        footer: state.footer,
        labelPosition: state.labelPosition,
        gridColumns: state.gridColumns,
        groupRanges: state.groupRanges,
        sortAlphanumerically: state.sortAlphanumerically
      }
    };
    
    const existingIndex = profiles.findIndex(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (existingIndex > -1) {
      newProfile.id = profiles[existingIndex].id;
      profiles[existingIndex] = newProfile;
    } else {
      profiles.push(newProfile);
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('touch_color_map_profiles', JSON.stringify(profiles));
    }
    return newProfile.id;
  }

  export function loadProfile(id) {
    const profiles = getProfiles();
    const profile = profiles.find(p => p.id === id);
    if (!profile) {
      throw new Error('Profile not found.');
    }
    const data = profile.data;
    if (data) {
      if (typeof data.theme === 'string') state.theme = data.theme;
      if (typeof data.paperSize === 'string') state.paperSize = data.paperSize;
      if (typeof data.symbolScale === 'number') state.symbolScale = data.symbolScale;
      if (Array.isArray(data.ranges)) state.ranges = JSON.parse(JSON.stringify(data.ranges));
      if (Array.isArray(data.excludedItems)) state.excludedItems = [...data.excludedItems];
      if (typeof data.title === 'string') state.title = data.title;
      if (typeof data.subtitle === 'string') state.subtitle = data.subtitle;
      if (typeof data.footer === 'string') state.footer = data.footer;
      if (typeof data.labelPosition === 'string') state.labelPosition = data.labelPosition;
      if (typeof data.gridColumns === 'number') state.gridColumns = data.gridColumns;
      if (typeof data.groupRanges === 'boolean') state.groupRanges = data.groupRanges;
      if (typeof data.sortAlphanumerically === 'boolean') state.sortAlphanumerically = data.sortAlphanumerically;
      saveState();
    }
  }

  export function deleteProfile(id) {
    let profiles = getProfiles();
    profiles = profiles.filter(p => p.id !== id);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('touch_color_map_profiles', JSON.stringify(profiles));
    }
  }

  export function exportToJSON() {
    const exportData = {
      theme: state.theme,
      paperSize: state.paperSize,
      symbolScale: state.symbolScale,
      ranges: state.ranges,
      excludedItems: state.excludedItems,
      title: state.title,
      subtitle: state.subtitle,
      footer: state.footer,
      labelPosition: state.labelPosition,
      gridColumns: state.gridColumns,
      groupRanges: state.groupRanges,
      sortAlphanumerically: state.sortAlphanumerically
    };
    return JSON.stringify(exportData, null, 2);
  }

  export function importFromJSON(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON format.');
    }
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid configuration data.');
    }
    
    if (!Array.isArray(parsed.ranges)) {
      throw new Error('Invalid configuration: "ranges" must be an array.');
    }
    if (!Array.isArray(parsed.excludedItems)) {
      throw new Error('Invalid configuration: "excludedItems" must be an array.');
    }
    
    if (typeof parsed.theme === 'string') state.theme = parsed.theme;
    if (typeof parsed.paperSize === 'string') state.paperSize = parsed.paperSize;
    if (typeof parsed.symbolScale === 'number' && !isNaN(parsed.symbolScale)) state.symbolScale = parsed.symbolScale;
    state.ranges = parsed.ranges.filter(r => r && typeof r === 'object' && r.id);
    state.excludedItems = parsed.excludedItems.filter(item => typeof item === 'string');
    if (typeof parsed.title === 'string') state.title = parsed.title;
    if (typeof parsed.subtitle === 'string') state.subtitle = parsed.subtitle;
    if (typeof parsed.footer === 'string') state.footer = parsed.footer;
    if (parsed.labelPosition === 'inside' || parsed.labelPosition === 'above' || parsed.labelPosition === 'below') {
      state.labelPosition = parsed.labelPosition;
    }
    if (typeof parsed.gridColumns === 'number') state.gridColumns = parsed.gridColumns;
    if (typeof parsed.groupRanges === 'boolean') state.groupRanges = parsed.groupRanges;
    if (typeof parsed.sortAlphanumerically === 'boolean') state.sortAlphanumerically = parsed.sortAlphanumerically;
    
    saveState();
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**
  Run: `node tests/state.test.js`
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Run: `git commit -am "feat: implement state and persistence operations for profiles and import/export"`

---

### Task 2: Create HTML Template & Sidebar Styling

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Design specifications for sidebar positioning and forms.
- Produces: Correct DOM elements and CSS styling for the `profiles-section` sidebar module.

- [ ] **Step 1: Add HTML elements to index.html**
  Locate line 135 in `index.html` (above `Page Info Panel`) and add:
  ```html
      <!-- Profiles & Backup Panel -->
      <section class="profiles-section settings-section">
        <h2>Profiles & Backup</h2>
        
        <div class="form-group">
          <label for="input-profile-name">Save Current Sheet</label>
          <div class="profile-input-group" style="display: flex; gap: 8px;">
            <input type="text" id="input-profile-name" placeholder="e.g. Copic Cool Grays" style="flex: 1;">
            <button id="btn-save-profile" class="btn btn-primary btn-small" type="button" style="padding: 8px 12px;">Save</button>
          </div>
        </div>

        <div class="saved-profiles-list" id="saved-profiles-list">
          <!-- Populated dynamically -->
        </div>

        <div class="backup-actions-group" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-sidebar); display: flex; gap: 8px;">
          <button id="btn-export-json" class="btn btn-secondary" style="flex: 1; font-size: 0.85rem; padding: 8px 10px;">Export JSON</button>
          <button id="btn-import-trigger" class="btn btn-secondary" style="flex: 1; font-size: 0.85rem; padding: 8px 10px;">Import JSON</button>
          <input type="file" id="input-import-file" accept=".json" style="display: none;">
        </div>
      </section>
  ```

- [ ] **Step 2: Add CSS rules to styles.css**
  Append these styles to `styles.css` to visually lay out and style the profiles list:
  ```css
  /* Saved Profiles Styling */
  .saved-profiles-list {
    margin-top: 12px;
    max-height: 150px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 4px;
  }

  .saved-profiles-list::-webkit-scrollbar {
    width: 4px;
  }

  .saved-profiles-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .saved-profiles-list::-webkit-scrollbar-thumb {
    background: var(--border-input);
    border-radius: 2px;
  }

  .profile-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    background-color: var(--bg-input);
    border: 1px solid var(--border-input);
    border-radius: var(--rounded-md);
    font-size: 0.85rem;
    transition: border-color 0.2s ease;
  }

  .profile-row:hover {
    border-color: var(--color-primary);
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .profile-name {
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-date {
    font-size: 0.7rem;
    color: var(--text-secondary);
  }

  .profile-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-load-profile {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 4px;
    transition: opacity 0.2s ease;
  }

  .btn-load-profile:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .btn-delete-profile {
    background: none;
    border: none;
    color: var(--color-danger);
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    line-height: 1;
    padding: 0 4px;
    transition: opacity 0.2s ease;
  }

  .btn-delete-profile:hover {
    opacity: 0.8;
  }
  ```

- [ ] **Step 3: Commit changes**
  Run: `git commit -am "style: add HTML and css layouts for sidebar profiles and backup panel"`

---

### Task 3: Render Profiles & Bind Events

**Files:**
- Modify: `js/renderer.js`
- Modify: `app.js`
- Modify: `tests/integration.test.js`

**Interfaces:**
- Consumes: Extended state functions (`getProfiles`, `saveProfile`, `loadProfile`, `deleteProfile`, `exportToJSON`, `importFromJSON`) and rendering templates.
- Produces: Working interactive UI components with event listeners.

- [ ] **Step 1: Add failing integration tests to tests/integration.test.js**
  Append this test block inside `tests/integration.test.js`:
  ```javascript
  await t.test('should handle profile save, load, delete and json actions', async () => {
    elements = {};
    resetState();
    globalThis.document.listeners = {};
    window.localStorage.clear();

    await import('../app.js?t=' + Date.now() + '_profile_events');
    const handler = globalThis.document.listeners['DOMContentLoaded'];
    handler();

    const inputName = elements['input-profile-name'];
    const btnSave = elements['btn-save-profile'];
    assert.ok(inputName);
    assert.ok(btnSave);

    // Save profile event
    inputName.value = 'My Swatch';
    const clickSave = btnSave.listeners['click'];
    assert.ok(clickSave);
    clickSave();

    // Verify localStorage has profiles
    const profiles = JSON.parse(window.localStorage.getItem('touch_color_map_profiles') || '[]');
    assert.strictEqual(profiles.length, 1);
    assert.strictEqual(profiles[0].name, 'My Swatch');
  });
  ```

- [ ] **Step 2: Run integration tests to verify failure**
  Run: `node tests/integration.test.js`
  Expected: FAIL (cannot locate `btn-save-profile` or elements properties)

- [ ] **Step 3: Implement renderProfiles in js/renderer.js**
  Add `renderProfiles` function to `js/renderer.js`:
  ```javascript
  import { getProfiles, deleteProfile, loadProfile } from './state.js';

  export function renderProfiles(onLoad, onDelete) {
    const list = document.getElementById('saved-profiles-list');
    if (!list) return;
    list.innerHTML = '';

    const profiles = getProfiles();
    if (profiles.length === 0) {
      list.innerHTML = '<p class="subtitle-text" style="text-align: center; padding: 12px 0; width: 100%;">No saved profiles</p>';
      return;
    }

    profiles.forEach(profile => {
      const row = document.createElement('div');
      row.className = 'profile-row';
      
      const dateStr = new Date(profile.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      row.innerHTML = `
        <div class="profile-info">
          <span class="profile-name" title="${escapeHTML(profile.name)}">${escapeHTML(profile.name)}</span>
          <span class="profile-date">${dateStr}</span>
        </div>
        <div class="profile-actions">
          <button class="btn-load-profile" type="button">Load</button>
          <button class="btn-delete-profile" type="button" title="Delete Profile">&times;</button>
        </div>
      `;

      row.querySelector('.btn-load-profile').addEventListener('click', () => {
        try {
          loadProfile(profile.id);
          onLoad();
        } catch (err) {
          alert(err.message);
        }
      });

      row.querySelector('.btn-delete-profile').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete profile "${profile.name}"?`)) {
          deleteProfile(profile.id);
          onDelete();
        }
      });

      list.appendChild(row);
    });
  }
  ```
  *Make sure to export it at the top level.*

- [ ] **Step 4: Connect controls and update refreshUI in app.js**
  1. Add `getProfiles`, `saveProfile`, `deleteProfile`, `loadProfile`, `exportToJSON`, `importFromJSON` to the state import list in `app.js`.
  2. Add `renderProfiles` to the renderer import list in `app.js`.
  3. Update `refreshUI` in `app.js` to invoke `renderProfiles(refreshUI, refreshUI)`:
     ```javascript
     renderProfiles(refreshUI, refreshUI);
     ```
  4. In the `DOMContentLoaded` event listener of `app.js`, bind the handlers:
     ```javascript
     // Profile Save
     const btnSaveProfile = document.getElementById('btn-save-profile');
     const inputProfileName = document.getElementById('input-profile-name');
     if (btnSaveProfile && inputProfileName) {
       btnSaveProfile.addEventListener('click', () => {
         const name = inputProfileName.value.trim();
         if (!name) {
           alert('Please enter a profile name.');
           return;
         }
         try {
           saveProfile(name);
           inputProfileName.value = '';
           refreshUI();
         } catch (err) {
           alert(err.message);
         }
       });
     }

     // Export JSON
     const btnExportJSON = document.getElementById('btn-export-json');
     if (btnExportJSON) {
       btnExportJSON.addEventListener('click', () => {
         try {
           const jsonStr = exportToJSON();
           const blob = new Blob([jsonStr], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           const fileName = (state.title || 'touch-color-map').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
           a.href = url;
           a.download = `${fileName || 'color-map-config'}.json`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           URL.revokeObjectURL(url);
         } catch (err) {
           alert('Failed to export configuration: ' + err.message);
         }
       });
     }

     // Import JSON Trigger & File Input handling
     const btnImportTrigger = document.getElementById('btn-import-trigger');
     const inputImportFile = document.getElementById('input-import-file');
     if (btnImportTrigger && inputImportFile) {
       btnImportTrigger.addEventListener('click', () => {
         inputImportFile.click();
       });

       inputImportFile.addEventListener('change', (e) => {
         const file = e.target.files[0];
         if (!file) return;

         const reader = new FileReader();
         reader.onload = (event) => {
           try {
             importFromJSON(event.target.result);
             inputImportFile.value = '';
             refreshUI();
           } catch (err) {
             alert('Failed to import configuration: ' + err.message);
           }
         };
         reader.readAsText(file);
       });
     }
     ```

- [ ] **Step 5: Run all tests to make sure everything passes**
  Run:
  - `node tests/state.test.js`
  - `node tests/integration.test.js`
  Expected: PASS

- [ ] **Step 6: Commit and push changes**
  Run: `git commit -am "feat: implement renderProfiles and bind JSON import/export and profile save events"`
