let storage = {};
let confirmCalled = false;
let confirmMessage = '';
let confirmResponse = true;
let printCalled = false;
let alertCalled = false;
let alertMessage = '';

globalThis.alert = (msg) => {
  alertCalled = true;
  alertMessage = msg;
};

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
  },
  alert: globalThis.alert
};
globalThis.localStorage = globalThis.window.localStorage;

// Mock DOM
let elements = {};
globalThis.document = {
  getElementById: (id) => {
    if (!elements[id]) {
      const classList = {
        classes: new Set(),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        contains: function(c) { return this.classes.has(c); }
      };
      elements[id] = {
        innerHTML: '',
        innerText: '',
        value: '',
        className: '',
        style: {},
        children: [],
        listeners: {},
        classList: classList,
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
    const classList = {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); }
    };
    return {
      tagName: tag,
      className: '',
      style: {},
      innerHTML: '',
      innerText: '',
      children: [],
      listeners: {},
      classList: classList,
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

  await t.test('should validate start <= end range in app.js form submit', async () => {
    elements = {};
    resetState();
    globalThis.document.listeners = {};
    
    await import('../app.js?t=' + Date.now() + '_val');
    
    const handler = globalThis.document.listeners['DOMContentLoaded'];
    handler();

    // Mock form inputs
    elements['input-prefix'] = { value: 'X' };
    elements['input-start'] = { value: '10' };
    elements['input-end'] = { value: '5' }; // Invalid: 10 > 5
    elements['input-color'] = { value: '#ffffff' };
    
    // Trigger form submit
    const formSubmit = elements['range-form'].listeners['submit'];
    assert.ok(formSubmit);
    
    alertCalled = false;
    alertMessage = '';
    const mockEvent = { preventDefault: () => {} };
    formSubmit(mockEvent);
    
    assert.strictEqual(alertCalled, true);
    assert.strictEqual(alertMessage, 'Start number must be less than or equal to end number.');
    // Check range was not added
    assert.strictEqual(state.ranges.length, 0);

    // Now valid values
    elements['input-end'] = { value: '15' }; // Valid: 10 <= 15
    alertCalled = false;
    formSubmit(mockEvent);
    assert.strictEqual(alertCalled, false);
    assert.strictEqual(state.ranges.length, 1);
  });

  await t.test('should prevent double click triggers on exclusion items', async () => {
    elements = {};
    resetState();
    
    state.ranges.push({
      id: 'test-range-exclusion',
      prefix: 'E',
      start: 1,
      end: 1,
      symbol: 'circle',
      color: '#ff0000'
    });
    
    let toggleCallCount = 0;
    renderPrintSheet(() => {
      toggleCallCount++;
    });

    const content = elements['sheet-content'];
    const section = content.children[0];
    const grid = section.children[1];
    const item = grid.children[0];
    
    const clickHandler = item.listeners['click'];
    assert.ok(clickHandler);
    
    // Trigger double clicks
    clickHandler();
    clickHandler();
    
    // Wait for timeouts
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // toggleCallCount should be 1, and state.excludedItems should have 'E1' exactly once
    assert.strictEqual(toggleCallCount, 1);
    assert.deepStrictEqual(state.excludedItems, ['E1']);
  });
});
