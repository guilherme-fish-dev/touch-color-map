let storage = {};
globalThis.window = {
  localStorage: {
    setItem: (key, val) => { storage[key] = val; },
    getItem: (key) => storage[key] || null,
    clear: () => { storage = {}; }
  }
};
globalThis.localStorage = globalThis.window.localStorage;

import test from 'node:test';
import assert from 'node:assert';
import { 
  state, 
  addRange, 
  removeRange, 
  toggleExclusion, 
  getEffectiveItems, 
  resetState,
  saveState,
  loadState,
  bulkExclude,
  bulkRestore
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

  await t.test('should save and load state via localStorage persistence', () => {
    resetState();
    window.localStorage.clear();
    
    // Add a range, which triggers saveState()
    addRange({ prefix: 'P', start: 1, end: 3, symbol: 'square', color: '#ff00ff' });
    
    // Assert localStorage has the saved state
    const savedData = window.localStorage.getItem('touch_color_map_state');
    assert.ok(savedData);
    const parsed = JSON.parse(savedData);
    assert.strictEqual(parsed.ranges.length, 1);
    assert.strictEqual(parsed.ranges[0].prefix, 'P');
    
    // Reset state in memory
    resetState();
    assert.strictEqual(state.ranges.length, 0);
    
    // Load from localStorage
    loadState();
    assert.strictEqual(state.ranges.length, 1);
    assert.strictEqual(state.ranges[0].prefix, 'P');
  });

  await t.test('should fallback gracefully when prefix is undefined', () => {
    resetState();
    // Should not throw, prefix should become ''
    const id = addRange({ start: 1, end: 3 });
    assert.strictEqual(state.ranges.length, 1);
    assert.strictEqual(state.ranges[0].prefix, '');
  });

  await t.test('should clean up stale excluded items when a range is removed', () => {
    resetState();
    const id = addRange({ prefix: 'H', start: 1, end: 5, symbol: 'circle', color: '#ff0000' });
    toggleExclusion('H3');
    toggleExclusion('H4');
    toggleExclusion('J2'); // exclusion from a different range
    
    assert.deepStrictEqual(state.excludedItems, ['H3', 'H4', 'J2']);
    
    removeRange(id);
    // H3 and H4 should be removed, J2 should remain
    assert.deepStrictEqual(state.excludedItems, ['J2']);
  });

  await t.test('Bulk Exclusions Parsing', () => {
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

  await t.test('Defensive Properties Initialization', () => {
    resetState();
    // Verify default properties
    assert.strictEqual(state.title, '');
    assert.strictEqual(state.subtitle, '');
    assert.strictEqual(state.footer, '');
    assert.strictEqual(state.labelPosition, 'inside');
    assert.strictEqual(state.gridColumns, 0);

    // Save and load persistence check
    state.title = 'My Title';
    state.subtitle = 'My Subtitle';
    state.footer = 'My Footer';
    state.labelPosition = 'above';
    state.gridColumns = 8;
    saveState();

    resetState();
    assert.strictEqual(state.title, '');

    loadState();
    assert.strictEqual(state.title, 'My Title');
    assert.strictEqual(state.subtitle, 'My Subtitle');
    assert.strictEqual(state.footer, 'My Footer');
    assert.strictEqual(state.labelPosition, 'above');
    assert.strictEqual(state.gridColumns, 8);
  });

  await t.test('Zero-start range calculations and limits', () => {
    resetState();
    // Add range with start=0
    const id = addRange({ prefix: 'Z', start: 0, end: 5 });
    
    // Check getEffectiveItems contains 0
    let items = getEffectiveItems(state.ranges[0]);
    assert.deepStrictEqual(items, [0, 1, 2, 3, 4, 5]);

    // Exclude Z0 and check reflow
    toggleExclusion('Z0');
    assert.ok(state.excludedItems.includes('Z0'));
    
    items = getEffectiveItems(state.ranges[0]);
    assert.deepStrictEqual(items, [1, 2, 3, 4, 5]);

    // Test limit validations
    // Range size: 0 to 1000 is 1001 items -> should throw
    assert.throws(() => {
      addRange({ prefix: 'Limit', start: 0, end: 1000 });
    }, /cannot contain more than 1000 items/);

    // Range size: 0 to 999 is 1000 items -> should pass
    const validId = addRange({ prefix: 'Limit', start: 0, end: 999 });
    assert.ok(validId);
    
    // Clean up
    removeRange(id);
    assert.ok(!state.excludedItems.includes('Z0'));
  });
});
