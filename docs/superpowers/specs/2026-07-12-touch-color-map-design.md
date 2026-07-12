# Design Specification: Touch Color Map Generator

A beautiful, modern web-based application designed to help users generate customizable tracker maps (using circles or hearts) for coloring books, diamond painting, bubble painting, or other crafts (like Bobbie Goods). The generated sheets can be customized, items can be selectively excluded with dynamic sequence reflowing, and printed cleanly.

---

## 1. Overview & Requirements
* **Dynamic Range Management:** Users can add multiple numbered ranges with optional alphanumeric prefixes (e.g., `1-10`, `C1-C10`, `GC1-GC10`).
* **Custom Symbols:** Choose between Circle or Heart symbols for each range individually.
* **Interactive Preview & Exclusions:** Click any symbol in the live preview grid to exclude it (e.g., remove `C4` or `GC8`). The grid collapses dynamically, leaving no empty space.
* **Print Optimization:** Standard browser print layout hides controls, headers, and UI panels, formatting only the printable outline tracker grid to scale on A4 or Letter paper.
* **Premium Design:** Glassmorphic sidebar controls, responsive layout, smooth transitions, support for light/dark theme, and crisp vector outlines (SVG) suitable for high-resolution printing.
* **Local Storage Persistence:** Automatically saves ranges, settings, and excluded items so work is preserved across refreshes.

---

## 2. Architecture & File Structure

This is a serverless, single-page application (SPA) implemented with vanilla HTML5, CSS3, and ES Modules for high performance and zero-config deployment.

```
touch-color-map/
├── index.html            # Main markup and print containers
├── styles.css            # Custom CSS properties, dark/light styles, grid system, print rules
├── app.js                # Core app controller, initializes state & listens to UI events
└── js/
    ├── state.js          # Reactive state engine & localStorage sync
    ├── renderer.js       # UI rendering engine (generates inputs, SVGs, preview grid)
    └── store.js          # Export/import capabilities for saving configurations
```

---

## 3. UI Design & Aesthetics

### Color Palette & Theme (Dynamic)
* **Dark Mode (Default UI):**
  * Background: Slate/Navy Dark (`#0f172a` to `#1e293b` gradient)
  * Sidebar: Glassmorphic panel (semi-transparent with blur, border: `1px solid rgba(255, 255, 255, 0.08)`)
  * Accent Colors: Indigo (`#6366f1`), Rose Pink (`#f43f5e`), Teal (`#14b8a6`)
* **Light Mode UI:**
  * Background: Soft cool white (`#f8fafc`)
  * Sidebar: Semi-transparent white card with backdrop-blur.
* **Print Mode:**
  * Clean white background (`#ffffff`), dark charcoal outlines (`#334155`), hiding all UI toolbars.

### Interactive Components
* **Control Panel (Sidebar):**
  * Form to add ranges:
    * Prefix Input (Text, max 5 chars)
    * Start Number (Integer, default 1)
    * End Number (Integer, default 50)
    * Symbol Picker (Radio icons: Circle vs. Heart)
    * Accent Color Picker (Visual color swatch choices + custom picker)
  * Active Ranges List: List of cards showing configured ranges with quick edits (change symbol, edit color, delete range).
  * Exclusions Log: A collapsible drawer showing currently removed items (e.g. `C4`, `GC8`) with a "Restore All" button.
* **Print Preview (Canvas Area):**
  * Styled to resemble paper (aspect ratio adjusted for A4 or Letter).
  * Groups ranges into cards with a clean header (e.g., `"Range: C1 to C10 (Hearts)"`).
  * Group symbols are laid out in a grid.
  * Clicking a symbol triggers a fade-out animation and removes it from the flow.

---

## 4. Technical Implementation Details

### State Schema (`js/state.js`)
```javascript
export const state = {
  theme: 'dark',        // 'dark' | 'light'
  paperSize: 'a4',      // 'a4' | 'letter'
  symbolScale: 1.0,     // scale multiplier for print sizes
  ranges: [],           // array of { id, prefix, start, end, symbol, color }
  excludedItems: [],    // array of "Prefix + Number" strings, e.g. ["C4", "GC8"]
};
```

### Exclusions & Reflow Logic
When rendering a range group:
1. Generate array of numbers from `start` to `end`.
2. Filter out numbers where `${prefix}${number}` exists in `excludedItems`.
3. Render remaining numbers in a flex/grid layout.
This ensures the remaining items automatically re-flow and fill the space cleanly.

### Printing Optimization (`styles.css`)
```css
@media print {
  body {
    background: white;
    color: black;
  }
  .sidebar, .navbar, .exclude-toast, .no-print {
    display: none !important;
  }
  .print-page {
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }
  .range-section {
    page-break-inside: avoid;
  }
}
```

---

## 5. Verification Plan

### Automated Tests
* Standard browser-based test suite validation (basic verification of element creation, deletion, state synchronization).

### Manual Verification
* Verify adding ranges (e.g., prefix `C`, start `1`, end `12`).
* Click `C4` and verify it disappears, and `C5` shifts left into its position.
* Click theme switch and verify UI theme changes correctly.
* Press `Cmd + P` or click Print, and verify that sidebar/control elements disappear, leaving only a printable grid sheet.
