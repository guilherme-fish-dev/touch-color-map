import { state, addRange, loadState, saveState, bulkExclude, bulkRestore } from './js/state.js';
import { renderColorPresets, renderActiveRanges, renderPrintSheet, renderExclusions } from './js/renderer.js';

let selectedColor = '#6366f1';

function refreshUI() {
  renderActiveRanges(refreshUI);
  renderPrintSheet(refreshUI);
  renderExclusions(refreshUI);
  
  const scaleVal = document.getElementById('scale-val');
  if (scaleVal) {
    scaleVal.innerText = state.symbolScale;
  }
  
  // Theme application
  document.documentElement.setAttribute('data-theme', state.theme);

  // Paper size application
  const sheet = document.getElementById('print-sheet');
  if (sheet) {
    sheet.className = `print-page paper-${state.paperSize}`;
  }

  // Update inputs dynamically to match loaded/changed state
  const inputTitle = document.getElementById('input-title');
  if (inputTitle && document.activeElement !== inputTitle) {
    inputTitle.value = state.title || '';
  }

  const inputSubtitle = document.getElementById('input-subtitle');
  if (inputSubtitle && document.activeElement !== inputSubtitle) {
    inputSubtitle.value = state.subtitle || '';
  }

  const inputFooter = document.getElementById('input-footer');
  if (inputFooter && document.activeElement !== inputFooter) {
    inputFooter.value = state.footer || '';
  }

  const selectColumns = document.getElementById('select-columns');
  if (selectColumns) {
    selectColumns.value = state.gridColumns;
  }

  const selectLabelPosition = document.getElementById('select-label-position');
  if (selectLabelPosition) {
    selectLabelPosition.value = state.labelPosition;
  }

  const paperSelect = document.getElementById('select-paper');
  if (paperSelect) {
    paperSelect.value = state.paperSize;
  }

  const scaleSlider = document.getElementById('range-scale');
  if (scaleSlider) {
    scaleSlider.value = state.symbolScale;
  }
}

// Setup presets color selections
function handlePresetSelect(color) {
  selectedColor = color;
  const inputColor = document.getElementById('input-color');
  if (inputColor) {
    inputColor.value = color;
  }
  renderColorPresets(selectedColor, handlePresetSelect);
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State Load
  loadState();

  // 2. Setup static controls
  renderColorPresets(selectedColor, handlePresetSelect);
  
  // Bind form submissions
  const form = document.getElementById('range-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const prefix = document.getElementById('input-prefix').value;
      const start = document.getElementById('input-start').value;
      const end = document.getElementById('input-end').value;
      const symbol = document.querySelector('input[name="symbol-type"]:checked').value;
      const color = document.getElementById('input-color').value;

      const startNum = parseInt(start, 10);
      const endNum = parseInt(end, 10);
      if (startNum > endNum) {
        alert('Start number must be less than or equal to end number.');
        return;
      }

      const rangeSize = endNum - startNum + 1;
      if (rangeSize > 1000) {
        alert('A single range rule cannot contain more than 1000 items. Please split your range.');
        return;
      }

      try {
        addRange({ prefix, start, end, symbol, color });
        
        // Reset prefix form only, keep color
        document.getElementById('input-prefix').value = '';
        refreshUI();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Color picker change
  const inputColor = document.getElementById('input-color');
  if (inputColor) {
    inputColor.addEventListener('input', (e) => {
      selectedColor = e.target.value;
      renderColorPresets(selectedColor, handlePresetSelect);
    });
  }

  // Title edit handler
  const inputTitle = document.getElementById('input-title');
  if (inputTitle) {
    inputTitle.addEventListener('input', (e) => {
      state.title = e.target.value;
      saveState();
      refreshUI();
    });
  }

  // Subtitle edit handler
  const inputSubtitle = document.getElementById('input-subtitle');
  if (inputSubtitle) {
    inputSubtitle.addEventListener('input', (e) => {
      state.subtitle = e.target.value;
      saveState();
      refreshUI();
    });
  }

  // Footer edit handler
  const inputFooter = document.getElementById('input-footer');
  if (inputFooter) {
    inputFooter.addEventListener('input', (e) => {
      state.footer = e.target.value;
      saveState();
      refreshUI();
    });
  }

  // Columns select handler
  const selectColumns = document.getElementById('select-columns');
  if (selectColumns) {
    selectColumns.addEventListener('change', (e) => {
      state.gridColumns = parseInt(e.target.value, 10);
      saveState();
      refreshUI();
    });
  }

  // Label position handler
  const selectLabelPosition = document.getElementById('select-label-position');
  if (selectLabelPosition) {
    selectLabelPosition.addEventListener('change', (e) => {
      state.labelPosition = e.target.value;
      saveState();
      refreshUI();
    });
  }

  // Bulk exclude button handler
  const btnBulkExclude = document.getElementById('btn-bulk-exclude');
  const inputBulkExclude = document.getElementById('input-bulk-exclude');
  if (btnBulkExclude && inputBulkExclude) {
    btnBulkExclude.addEventListener('click', () => {
      const expr = inputBulkExclude.value.trim();
      if (expr) {
        bulkExclude(expr);
        inputBulkExclude.value = '';
        refreshUI();
      }
    });
  }

  // Bulk restore button handler
  const btnBulkRestore = document.getElementById('btn-bulk-restore');
  if (btnBulkRestore && inputBulkExclude) {
    btnBulkRestore.addEventListener('click', () => {
      const expr = inputBulkExclude.value.trim();
      if (expr) {
        bulkRestore(expr);
        inputBulkExclude.value = '';
        refreshUI();
      }
    });
  }

  // Paper Select
  const paperSelect = document.getElementById('select-paper');
  if (paperSelect) {
    paperSelect.addEventListener('change', (e) => {
      state.paperSize = e.target.value;
      saveState();
      refreshUI();
    });
  }

  // Symbol Scale slider
  const scaleSlider = document.getElementById('range-scale');
  if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
      state.symbolScale = parseFloat(e.target.value);
      saveState();
      refreshUI();
    });
  }

  // Theme toggle
  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState();
      refreshUI();
    });
  }

  // Clear all
  const btnClear = document.getElementById('btn-clear');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all configurations and exclusions?')) {
        state.ranges = [];
        state.excludedItems = [];
        state.title = '';
        state.subtitle = '';
        state.footer = '';
        state.labelPosition = 'inside';
        state.gridColumns = 0;
        saveState();
        refreshUI();
      }
    });
  }

  // Restore all exclusions
  const btnRestoreAll = document.getElementById('btn-restore-all');
  if (btnRestoreAll) {
    btnRestoreAll.addEventListener('click', () => {
      state.excludedItems = [];
      saveState();
      refreshUI();
    });
  }

  // Print window
  const btnPrint = document.getElementById('btn-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // 3. Render initial views
  refreshUI();
});
