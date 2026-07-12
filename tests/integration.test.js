let storage = {};
let confirmCalled = false;
let confirmMessage = '';
let confirmResponse = true;
let printCalled = false;

globalThis.window = {
  localStorage: {
    setItem: (key, val) => { storage[key] = val; },
    getItem: (key) => storage[key] || null,
    clear: () => { storage = {}; }
  },
  confirm: (msg) => {
    confirmCalled = true;
    confirmMessage = msg;
    return confirmResponse;
  },
  print: () => {
    printCalled = true;
  }
};
globalThis.localStorage = globalThis.window.localStorage;

// Mock DOM
let elements = {};
globalThis.document = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = {
        innerHTML: '',
        innerText: '',
        value: '',
        className: '',
        style: {},
        children: [],
        listeners: {},
        appendChild: function(child) {
          this.children.push(child);
        },
        addEventListener: function(event, handler) {
          this.listeners[event] = handler;
        },
        querySelector: function(selector) {
          if (selector === '.btn-icon') {
            return {
              addEventListener: (event, cb) => {
                this.btnIconListener = cb;
              }
            };
          }
          return null;
        }
      };
    }
    return elements[id];
  },
  createElement: (tag) => {
    return {
      tagName: tag,
      className: '',
      style: {},
      innerHTML: '',
      innerText: '',
      children: [],
      listeners: {},
      appendChild: function(child) {
        this.children.push(child);
      },
      addEventListener: function(event, cb) {
        this.listeners[event] = cb;
      },
      querySelector: function(selector) {
        if (selector === '.btn-icon') {
          return {
            addEventListener: (event, cb) => {
              this.btnIconListener = cb;
            }
          };
        }
        return null;
      }
    };
  },
  addEventListener: (event, handler) => {
    if (!globalThis.document.listeners) globalThis.document.listeners = {};
    globalThis.document.listeners[event] = handler;
  },
  querySelector: (selector) => {
    if (selector === 'input[name="symbol-type"]:checked') {
      return { value: 'circle' };
    }
    return null;
  },
  documentElement: {
    setAttribute: (name, val) => {
      globalThis.document.documentElement[name] = val;
    }
  }
};

import test from 'node:test';
import assert from 'node:assert';

import { state, resetState } from '../js/state.js';
import { renderColorPresets, renderActiveRanges, renderPrintSheet } from '../js/renderer.js';

test('Renderer & Event Logic Integration Tests', async (t) => {
  await t.test('should render color presets correctly', () => {
    elements = {};
    renderColorPresets('#6366f1', () => {});
    const presetsContainer = elements['color-presets'];
    assert.strictEqual(presetsContainer.children.length, 8);
    assert.strictEqual(presetsContainer.children[0].className, 'preset-dot active');
    assert.strictEqual(presetsContainer.children[1].className, 'preset-dot ');
  });

  await t.test('should render active ranges correctly', () => {
    elements = {};
    resetState();
    
    // Check when empty
    renderActiveRanges(() => {});
    assert.ok(elements['active-ranges-list'].innerHTML.includes('No active ranges'));

    // Check with ranges
    state.ranges.push({
      id: 'test-range',
      prefix: 'T',
      start: 1,
      end: 5,
      symbol: 'circle',
      color: '#ff0000'
    });
    renderActiveRanges(() => {});
    const list = elements['active-ranges-list'];
    assert.strictEqual(list.children.length, 1);
    assert.strictEqual(list.children[0].className, 'range-card');
  });

  await t.test('should render print sheet correctly', () => {
    elements = {};
    resetState();
    
    renderPrintSheet(() => {});
    assert.ok(elements['sheet-content'].innerHTML.includes('Add ranges from the sidebar'));

    state.ranges.push({
      id: 'test-range',
      prefix: 'T',
      start: 1,
      end: 2,
      symbol: 'circle',
      color: '#ff0000'
    });
    renderPrintSheet(() => {});
    const content = elements['sheet-content'];
    assert.strictEqual(content.children.length, 1);
    assert.strictEqual(content.children[0].className, 'range-section');
  });

  await t.test('should initialize and register events in app.js', async () => {
    elements = {};
    resetState();
    
    // Clear listeners of document
    globalThis.document.listeners = {};
    
    // Dynamically import app.js to trigger DOMContentLoaded registration
    await import('../app.js?t=' + Date.now());
    
    // Trigger DOMContentLoaded
    const handler = globalThis.document.listeners['DOMContentLoaded'];
    assert.ok(handler);
    handler();

    // Verify paper scale setup
    assert.strictEqual(elements['scale-val'].innerText, 1);

    // Verify theme was loaded/applied
    assert.strictEqual(globalThis.document.documentElement['data-theme'], 'dark');
  });
});
