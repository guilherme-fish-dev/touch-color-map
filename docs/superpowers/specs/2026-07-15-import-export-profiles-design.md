# Design Spec: Configuration Saving, Profiles & JSON Import/Export

This design document outlines the implementation plan for adding local configuration profiles (slots saved in the browser) and file-based JSON backup (import/export) to the Touch Color Map application.

## Goal
Provide a premium, satisfying planner-style experience for managing marker tracking sheets. Users should be able to:
1. Save their current configuration under a custom name (e.g. "Copic Sketch 72 A") to quickly reload it later.
2. Delete saved local profiles.
3. Export the current active sheet setup as a `.json` configuration file.
4. Import a previously saved `.json` file to restore their settings.

## Proposed Changes

### 1. State Layer: [state.js](file:///Users/guilhermeandrade/Documents/Projetos/touch-color-map/js/state.js)
We need to manage both the active sheet state and the collection of saved profiles.
- Introduce helper functions to load and save the collection of profiles under `touch_color_map_profiles` in `localStorage`.
- Create functions:
  - `getProfiles()`: Returns an array of saved profile objects from `localStorage`.
  - `saveProfile(name)`: Takes a name, captures the current active state, and saves it. If the name matches an existing profile, it will overwrite it.
  - `loadProfile(id)`: Loads the target profile's data into the active state and saves the active state.
  - `deleteProfile(id)`: Removes the specified profile from the profile collection.
  - `exportToJSON()`: Serializes the active state (excluding profiles) into a JSON string.
  - `importFromJSON(jsonString)`: Parses, validates, and loads the data into the active state.

### 2. Rendering Layer: [renderer.js](file:///Users/guilhermeandrade/Documents/Projetos/touch-color-map/js/renderer.js)
We need to display the saved profiles in the sidebar.
- Create a function `renderProfiles(onLoad, onDelete)`:
  - Selects the target container `#saved-profiles-list`.
  - Clears it, and displays each saved profile as a pill/row.
  - Each row shows the profile name, date of saving, and includes a **Load** button and a **Delete** (close/trash) button.
  - If no profiles exist, displays a placeholder message ("No saved profiles").

### 3. UI Template: [index.html](file:///Users/guilhermeandrade/Documents/Projetos/touch-color-map/index.html)
We need to insert the new collapsible/sidebar panel.
- Add a new `<section class="settings-section">` titled `<h2>Profiles & Backup</h2>` in the sidebar.
- Place it below the "exclusions-log-section" or "settings-section" (Page Info).
- Add:
  - Input field for entering a name to save the current configuration.
  - Save button.
  - Scrolling container div `#saved-profiles-list`.
  - Flexbox container for "Export JSON" and "Import JSON" buttons.
  - Hidden `<input type="file" id="input-import-file" accept=".json">`.

### 4. Interactive Controller: [app.js](file:///Users/guilhermeandrade/Documents/Projetos/touch-color-map/app.js)
Bind the new interactive elements.
- Inside `DOMContentLoaded`, bind:
  - Click on "Save Profile" -> validates name, calls `saveProfile()`, clears input, and re-renders/refreshes the UI.
  - Clicking on "Export JSON" -> calls `exportToJSON()` and initiates a browser file download.
  - Clicking on "Import JSON" -> triggers click on the hidden file input.
  - File input `change` listener -> reads the file, parses JSON, calls `importFromJSON()`, and refreshes the UI.
  - Integrate profiles rendering and profile deletion/loading into `refreshUI()`.

### 5. Styles: [styles.css](file:///Users/guilhermeandrade/Documents/Projetos/touch-color-map/styles.css)
Add rules to fit the planner aesthetic:
- Style `.saved-profiles-list` as a list of small cards or rows with subtle borders.
- Style the scrollbar for the profiles container.
- Ensure transitions for hovering on Load/Delete buttons.
- Align spacing to fit the sidebar typography layout.

---

## Verification Plan

### Automated/Unit Tests
- Write a quick test verification script or use browser console validations to ensure state is correctly packaged and un-packaged.

### Manual Verification
1. **Save Profile**: Enter "Test Profile 1", click Save. Verify it appears in the list.
2. **Reload / Clear**: Modify ranges, titles, scale. Click "Load" on "Test Profile 1". Verify all modified fields revert to the saved state.
3. **Delete Profile**: Click the delete icon. Verify the profile is removed from the list and storage.
4. **Export JSON**: Add unique ranges, click Export JSON. Ensure a `.json` file downloads.
5. **Import JSON**: Clear all, click Import JSON, select the exported file. Verify the layout and configurations match exactly.
