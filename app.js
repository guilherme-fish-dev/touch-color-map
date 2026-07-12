import { state, addRange, loadState, saveState } from './js/state.js';
import { renderColorPresets, renderActiveRanges, renderPrintSheet } from './js/renderer.js';

let selectedColor = '#6366f1';

function refreshUI() {
  renderActiveRanges(refreshUI);
  renderPrintSheet(refreshUI);
  
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

      addRange({ prefix, start, end, symbol, color });
      
      // Reset prefix form only, keep color
      document.getElementById('input-prefix').value = '';
      refreshUI();
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

  // Paper Select
  const paperSelect = document.getElementById('select-paper');
  if (paperSelect) {
    paperSelect.value = state.paperSize;
    paperSelect.addEventListener('change', (e) => {
      state.paperSize = e.target.value;
      saveState();
      refreshUI();
    });
  }

  // Symbol Scale slider
  const scaleSlider = document.getElementById('range-scale');
  if (scaleSlider) {
    scaleSlider.value = state.symbolScale;
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
        saveState();
        refreshUI();
      }
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
