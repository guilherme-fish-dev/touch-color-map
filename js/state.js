export let state = {
  theme: 'dark',
  paperSize: 'a4',
  symbolScale: 1.0,
  ranges: [],
  excludedItems: []
};

export function resetState() {
  state.theme = 'dark';
  state.paperSize = 'a4';
  state.symbolScale = 1.0;
  state.ranges = [];
  state.excludedItems = [];
}

export function addRange({ prefix, start, end, symbol, color }) {
  const id = 'range-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  state.ranges.push({
    id,
    prefix: (prefix || '').trim(),
    start: parseInt(start, 10),
    end: parseInt(end, 10),
    symbol: symbol || 'circle',
    color: color || '#6366f1'
  });
  saveState();
  return id;
}

export function removeRange(id) {
  const range = state.ranges.find(r => r.id === id);
  if (range) {
    state.excludedItems = state.excludedItems.filter(label => {
      // check if label matches range.prefix + [range.start...range.end]
      if (range.prefix && !label.startsWith(range.prefix)) return true;
      const numStr = range.prefix ? label.slice(range.prefix.length) : label;
      const num = parseInt(numStr, 10);
      if (isNaN(num)) return true;
      const inRange = num >= range.start && num <= range.end;
      return !inRange;
    });
    state.ranges = state.ranges.filter(r => r.id !== id);
    saveState();
  }
}

export function toggleExclusion(label) {
  const idx = state.excludedItems.indexOf(label);
  if (idx > -1) {
    state.excludedItems.splice(idx, 1);
  } else {
    state.excludedItems.push(label);
  }
  saveState();
}

export function getEffectiveItems(range) {
  const items = [];
  for (let i = range.start; i <= range.end; i++) {
    const label = `${range.prefix}${i}`;
    if (!state.excludedItems.includes(label)) {
      items.push(i);
    }
  }
  return items;
}

export function saveState() {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('touch_color_map_state', JSON.stringify(state));
  }
}

export function loadState() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('touch_color_map_state');
    if (saved) {
      try {
        Object.assign(state, JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
  }
}
