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
class MockDOMElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this._className = '';
    this._innerHTML = '';
    this.innerText = '';
    this.value = '';
    this.style = {};
    this.listeners = {};
    this.classList = {
      _parent: this,
      add(cls) {
        const classes = this._parent._className ? this._parent._className.trim().split(/\s+/).filter(Boolean) : [];
        if (!classes.includes(cls)) {
          classes.push(cls);
          this._parent._className = classes.join(' ');
        }
      },
      remove(cls) {
        const classes = this._parent._className ? this._parent._className.trim().split(/\s+/).filter(Boolean) : [];
        const idx = classes.indexOf(cls);
        if (idx > -1) {
          classes.splice(idx, 1);
          this._parent._className = classes.join(' ');
        }
      },
      contains(cls) {
        const classes = this._parent._className ? this._parent._className.trim().split(/\s+/).filter(Boolean) : [];
        return classes.includes(cls);
      }
    };
  }
  get className() {
    return this._className;
  }
  set className(val) {
    this._className = val;
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
    }
  }
  appendChild(child) {
    this.children.push(child);
  }
  addEventListener(event, cb) {
    this.listeners[event] = cb;
  }
  querySelector(selector) {
    this.queriedElements = this.queriedElements || {};
    if (!this.queriedElements[selector]) {
      this.queriedElements[selector] = new MockDOMElement('div');
    }
    return this.queriedElements[selector];
  }
}

let elements = {};
globalThis.document = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = new MockDOMElement('div');
    }
    return elements[id];
  },
  createElement: (tag) => {
    return new MockDOMElement(tag);
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
import { renderColorPresets, renderActiveRanges, renderPrintSheet, renderExclusions } from '../js/renderer.js';

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

    // Test validation for range size > 1000
    elements['input-start'] = { value: '1' };
    elements['input-end'] = { value: '1002' }; // 1002 items (> 1000)
    alertCalled = false;
    alertMessage = '';
    formSubmit(mockEvent);
    assert.strictEqual(alertCalled, true);
    assert.ok(alertMessage.includes('cannot contain more than 1000 items'));
    // ranges length should still be 1
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
    const grid = section.children[0];
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

  await t.test('should render exclusions log correctly and allow restoring items', () => {
    elements = {};
    resetState();
    
    // Test when exclusions is empty
    renderExclusions(() => {});
    const logListEmpty = elements['exclusions-log-list'];
    assert.ok(logListEmpty.innerHTML.includes('No exclusions'));
    assert.strictEqual(elements['exclusions-count'].innerText, '0 items excluded');

    // Add exclusions and a matching range to test styling/border
    state.excludedItems.push('C3');
    state.ranges.push({
      id: 'test-range-ex',
      prefix: 'C',
      start: 1,
      end: 5,
      symbol: 'circle',
      color: '#ff0000'
    });
    
    let onRestoreCalled = false;
    renderExclusions(() => {
      onRestoreCalled = true;
    });

    assert.strictEqual(elements['exclusions-count'].innerText, '1 item excluded');
    const logList = elements['exclusions-log-list'];
    assert.strictEqual(logList.children.length, 1);
    
    const tag = logList.children[0];
    assert.strictEqual(tag.className, 'exclusion-tag');
    assert.ok(tag.innerHTML.includes('C3'));
    
    // Simulate clicking restore button on the tag
    const restoreBtn = tag.querySelector('.restore-tag-btn');
    assert.ok(restoreBtn);
    
    const clickHandler = restoreBtn.listeners['click'];
    assert.ok(clickHandler);
    
    clickHandler();
    
    assert.strictEqual(onRestoreCalled, true);
    assert.strictEqual(state.excludedItems.indexOf('C3'), -1); // successfully removed/restored
  });

  await t.test('should restore all exclusions on btn-restore-all click', async () => {
    elements = {};
    resetState();
    globalThis.document.listeners = {};
    
    await import('../app.js?t=' + Date.now() + '_restore_all');
    
    const handler = globalThis.document.listeners['DOMContentLoaded'];
    handler();
    
    state.excludedItems.push('C3');
    state.excludedItems.push('C4');
    
    const btnRestoreAll = elements['btn-restore-all'];
    assert.ok(btnRestoreAll);
    
    const clickHandler = btnRestoreAll.listeners['click'];
    assert.ok(clickHandler);
    
    clickHandler();
    
    assert.strictEqual(state.excludedItems.length, 0);
  });

  await t.test('should render title, subtitle, and footer correctly in print sheet', () => {
    elements = {};
    resetState();
    
    // Set headers and footers in state
    state.title = 'Hello Title';
    state.subtitle = 'Hello Subtitle';
    state.footer = 'Hello Footer';
    
    renderPrintSheet(() => {});
    
    assert.strictEqual(elements['sheet-title'].innerText, 'Hello Title');
    assert.strictEqual(elements['sheet-subtitle'].innerText, 'Hello Subtitle');
    assert.strictEqual(elements['sheet-footer-text'].innerText, 'Hello Footer');
    
    assert.ok(elements['sheet-header'].classList.contains('visible'));
    assert.ok(elements['sheet-footer'].classList.contains('visible'));
    
    // Now check empty behavior
    state.title = '';
    state.subtitle = '';
    state.footer = '';
    
    renderPrintSheet(() => {});
    
    assert.strictEqual(elements['sheet-header'].classList.contains('visible'), false);
    assert.strictEqual(elements['sheet-footer'].classList.contains('visible'), false);
  });

  await t.test('should apply grid column classes dynamically in print sheet', () => {
    elements = {};
    resetState();
    
    state.ranges.push({
      id: 'test-range-grid',
      prefix: 'G',
      start: 1,
      end: 3,
      symbol: 'circle',
      color: '#ff0000'
    });
    
    // Check auto-fit (gridColumns = 0)
    state.gridColumns = 0;
    renderPrintSheet(() => {});
    
    let content = elements['sheet-content'];
    let section = content.children[0];
    let grid = section.children[0];
    assert.strictEqual(grid.className, 'grid-container');
    
    // Check columns mapping (gridColumns = 5)
    state.gridColumns = 5;
    renderPrintSheet(() => {});
    content = elements['sheet-content'];
    section = content.children[0];
    grid = section.children[0];
    assert.ok(grid.classList.contains('grid-cols-5'));
  });

  await t.test('should render label-above on symbol items in print sheet when selected', () => {
    elements = {};
    resetState();
    
    state.ranges.push({
      id: 'test-range-label',
      prefix: 'L',
      start: 1,
      end: 3,
      symbol: 'circle',
      color: '#ff0000'
    });
    
    // When inside (default)
    state.labelPosition = 'inside';
    renderPrintSheet(() => {});
    
    let content = elements['sheet-content'];
    let section = content.children[0];
    let grid = section.children[0];
    let item = grid.children[0];
    assert.strictEqual(item.className, 'symbol-item');
    assert.strictEqual(item.classList.contains('label-above'), false);
    
    // When above
    state.labelPosition = 'above';
    renderPrintSheet(() => {});
    content = elements['sheet-content'];
    section = content.children[0];
    grid = section.children[0];
    item = grid.children[0];
    assert.ok(item.classList.contains('label-above'));

    // When below
    state.labelPosition = 'below';
    renderPrintSheet(() => {});
    content = elements['sheet-content'];
    section = content.children[0];
    grid = section.children[0];
    item = grid.children[0];
    assert.ok(item.classList.contains('label-below'));
  });

  await t.test('should hook up events and handle title edit in app.js', async () => {
    elements = {};
    resetState();
    globalThis.document.listeners = {};
    
    await import('../app.js?t=' + Date.now() + '_title');
    
    const handler = globalThis.document.listeners['DOMContentLoaded'];
    handler();
    
    const inputTitle = elements['input-title'];
    assert.ok(inputTitle);
    
    const inputHandler = inputTitle.listeners['input'];
    assert.ok(inputHandler);
    
    // Simulate typing
    inputHandler({ target: { value: 'New Test Title' } });
    
    assert.strictEqual(state.title, 'New Test Title');
  });

  await t.test('should trigger bulk exclusion and bulk restoration on buttons click in app.js', async () => {
    elements = {};
    resetState();
    globalThis.document.listeners = {};
    
    await import('../app.js?t=' + Date.now() + '_bulk');
    
    const handler = globalThis.document.listeners['DOMContentLoaded'];
    handler();
    
    // Add a range to test bulk exclusion
    state.ranges.push({
      id: 'r-bulk',
      prefix: 'B',
      start: 1,
      end: 10,
      symbol: 'circle',
      color: '#ff0000'
    });
    
    const inputBulk = elements['input-bulk-exclude'];
    const btnExclude = elements['btn-bulk-exclude'];
    const btnRestore = elements['btn-bulk-restore'];
    
    assert.ok(inputBulk);
    assert.ok(btnExclude);
    assert.ok(btnRestore);
    
    // Exclude B2-B4
    inputBulk.value = 'B2-B4';
    const clickExclude = btnExclude.listeners['click'];
    assert.ok(clickExclude);
    clickExclude();
    
    assert.deepStrictEqual(state.excludedItems.sort(), ['B2', 'B3', 'B4']);
    assert.strictEqual(inputBulk.value, ''); // should reset
    
    // Restore B3
    inputBulk.value = 'B3';
    const clickRestore = btnRestore.listeners['click'];
    assert.ok(clickRestore);
    clickRestore();
    
    assert.deepStrictEqual(state.excludedItems.sort(), ['B2', 'B4']);
    assert.strictEqual(inputBulk.value, ''); // should reset
  });

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
});
