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
  loadState
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
});
