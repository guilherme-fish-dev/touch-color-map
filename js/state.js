export let state = {
  theme: 'dark',
  paperSize: 'a4',
  symbolScale: 1.0,
  ranges: [],
  excludedItems: [],
  title: '',
  subtitle: '',
  footer: '',
  labelPosition: 'inside',
  gridColumns: 0,
  groupRanges: true,
  sortAlphanumerically: true
};

export function resetState() {
  state.theme = 'dark';
  state.paperSize = 'a4';
  state.symbolScale = 1.0;
  state.ranges = [];
  state.excludedItems = [];
  state.title = '';
  state.subtitle = '';
  state.footer = '';
  state.labelPosition = 'inside';
  state.gridColumns = 0;
  state.groupRanges = true;
  state.sortAlphanumerically = true;
}

export function addRange({ type = 'range', customItems = '', prefix, start, end, symbol, color }) {
  const id = 'range-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  
  if (type === 'custom') {
    const items = customItems.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) {
      throw new Error('Custom items list cannot be empty.');
    }
    if (items.length > 1000) {
      throw new Error('A single custom list cannot contain more than 1000 items.');
    }
    state.ranges.push({
      id,
      type: 'custom',
      items,
      symbol: symbol || 'circle',
      color: color || '#6366f1'
    });
  } else {
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);

    if (isNaN(startNum) || isNaN(endNum)) {
      throw new Error('Start and end numbers must be integers.');
    }
    if (startNum < 0) {
      throw new Error('Start number must be 0 or greater.');
    }
    if (startNum > endNum) {
      throw new Error('Start number must be less than or equal to end number.');
    }
    const rangeSize = endNum - startNum + 1;
    if (rangeSize > 1000) {
      throw new Error('A single range rule cannot contain more than 1000 items.');
    }

    state.ranges.push({
      id,
      type: 'range',
      prefix: (prefix || '').trim(),
      start: startNum,
      end: endNum,
      symbol: symbol || 'circle',
      color: color || '#6366f1'
    });
  }
  saveState();
  return id;
}

export function removeRange(id) {
  const range = state.ranges.find(r => r.id === id);
  if (range) {
    if (range.type === 'custom') {
      state.excludedItems = state.excludedItems.filter(label => !range.items.includes(label));
    } else {
      state.excludedItems = state.excludedItems.filter(label => {
        const rangePrefix = range.prefix || '';
        if (rangePrefix && !label.startsWith(rangePrefix)) return true;
        const numStr = rangePrefix ? label.slice(rangePrefix.length) : label;
        const num = parseInt(numStr, 10);
        if (isNaN(num)) return true;
        const inRange = num >= range.start && num <= range.end;
        return !inRange;
      });
    }
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
  const start = typeof range.start === 'number' ? range.start : 0;
  const end = typeof range.end === 'number' ? range.end : 0;
  const prefix = range.prefix || '';
  for (let i = start; i <= end; i++) {
    const label = `${prefix}${i}`;
    if (!state.excludedItems.includes(label)) {
      items.push(i);
    }
  }
  return items;
}

export function getEffectiveLabels(range) {
  if (range.type === 'custom') {
    return (range.items || []).filter(label => !state.excludedItems.includes(label));
  }
  return getEffectiveItems(range).map(num => `${range.prefix || ''}${num}`);
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
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.theme === 'string') state.theme = parsed.theme;
          if (typeof parsed.paperSize === 'string') state.paperSize = parsed.paperSize;
          if (typeof parsed.symbolScale === 'number' && !isNaN(parsed.symbolScale)) {
            state.symbolScale = parsed.symbolScale;
          }
          if (Array.isArray(parsed.ranges)) {
            state.ranges = parsed.ranges.filter(r => r && typeof r === 'object' && r.id);
          }
          if (Array.isArray(parsed.excludedItems)) {
            state.excludedItems = parsed.excludedItems.filter(item => typeof item === 'string');
          }
          if (typeof parsed.title === 'string') state.title = parsed.title;
          if (typeof parsed.subtitle === 'string') state.subtitle = parsed.subtitle;
          if (typeof parsed.footer === 'string') state.footer = parsed.footer;
          if (parsed.labelPosition === 'inside' || parsed.labelPosition === 'above' || parsed.labelPosition === 'below') {
            state.labelPosition = parsed.labelPosition;
          }
          if (typeof parsed.gridColumns === 'number' && [0, 5, 8, 10, 12].includes(parsed.gridColumns)) {
            state.gridColumns = parsed.gridColumns;
          }
          if (typeof parsed.groupRanges === 'boolean') {
            state.groupRanges = parsed.groupRanges;
          }
          if (typeof parsed.sortAlphanumerically === 'boolean') {
            state.sortAlphanumerically = parsed.sortAlphanumerically;
          }
        }
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
  }
}

export function parseBulkExpression(expression) {
  if (!expression || typeof expression !== 'string') return [];
  const items = [];
  const parts = expression.split(',');
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    const rangeMatch = part.match(/^([A-Za-z0-9]*?)(\d+)\s*-\s*([A-Za-z0-9]*?)(\d+)$/);
    if (rangeMatch) {
      const prefix1 = rangeMatch[1];
      const startNum = parseInt(rangeMatch[2], 10);
      const prefix2 = rangeMatch[3];
      const endNum = parseInt(rangeMatch[4], 10);

      if (prefix1 && prefix2 && prefix1 !== prefix2) {
        throw new Error('Mixed prefixes are not supported in ranges.');
      }

      const rangeSize = Math.abs(endNum - startNum) + 1;
      if (rangeSize > 1000) {
        throw new Error('Bulk range size cannot exceed 1000 items.');
      }

      const prefix = prefix2 || prefix1 || '';
      
      const start = Math.min(startNum, endNum);
      const end = Math.max(startNum, endNum);
      for (let i = start; i <= end; i++) {
        items.push(`${prefix}${i}`);
      }
    } else {
      items.push(part);
    }
  }
  return items;
}

export function bulkExclude(expression) {
  const items = parseBulkExpression(expression);
  for (const item of items) {
    if (!state.excludedItems.includes(item)) {
      state.excludedItems.push(item);
    }
  }
  saveState();
}

export function bulkRestore(expression) {
  const items = parseBulkExpression(expression);
  state.excludedItems = state.excludedItems.filter(item => !items.includes(item));
  saveState();
}

export function naturalCompare(a, b) {
  const aChunks = String(a).split(/(\d+(?:\.\d+)?)/);
  const bChunks = String(b).split(/(\d+(?:\.\d+)?)/);
  
  const minLen = Math.min(aChunks.length, bChunks.length);
  for (let i = 0; i < minLen; i++) {
    const aChunk = aChunks[i];
    const bChunk = bChunks[i];
    
    if (aChunk === bChunk) continue;
    
    const aNum = parseFloat(aChunk);
    const bNum = parseFloat(bChunk);
    
    const aIsNaN = isNaN(aNum);
    const bIsNaN = isNaN(bNum);
    
    if (!aIsNaN && !bIsNaN) {
      return aNum - bNum;
    }
    
    return aChunk.localeCompare(bChunk, undefined, { numeric: true, sensitivity: 'base' });
  }
  
  return aChunks.length - bChunks.length;
}

export function getProfiles() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const saved = localStorage.getItem('touch_color_map_profiles');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to parse profiles", e);
    return [];
  }
}

export function saveProfile(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Profile name cannot be empty.');
  }
  const profiles = getProfiles();
  const id = 'profile-' + Date.now();
  const newProfile = {
    id,
    name: name.trim(),
    timestamp: Date.now(),
    data: {
      theme: state.theme,
      paperSize: state.paperSize,
      symbolScale: state.symbolScale,
      ranges: JSON.parse(JSON.stringify(state.ranges)),
      excludedItems: [...state.excludedItems],
      title: state.title,
      subtitle: state.subtitle,
      footer: state.footer,
      labelPosition: state.labelPosition,
      gridColumns: state.gridColumns,
      groupRanges: state.groupRanges,
      sortAlphanumerically: state.sortAlphanumerically
    }
  };
  
  const existingIndex = profiles.findIndex(p => p.name.toLowerCase() === name.trim().toLowerCase());
  if (existingIndex > -1) {
    newProfile.id = profiles[existingIndex].id;
    profiles[existingIndex] = newProfile;
  } else {
    profiles.push(newProfile);
  }
  
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('touch_color_map_profiles', JSON.stringify(profiles));
  }
  return newProfile.id;
}

export function loadProfile(id) {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === id);
  if (!profile) {
    throw new Error('Profile not found.');
  }
  const data = profile.data;
  if (data) {
    if (typeof data.theme === 'string') state.theme = data.theme;
    if (typeof data.paperSize === 'string') state.paperSize = data.paperSize;
    if (typeof data.symbolScale === 'number') state.symbolScale = data.symbolScale;
    if (Array.isArray(data.ranges)) state.ranges = JSON.parse(JSON.stringify(data.ranges));
    if (Array.isArray(data.excludedItems)) state.excludedItems = [...data.excludedItems];
    if (typeof data.title === 'string') state.title = data.title;
    if (typeof data.subtitle === 'string') state.subtitle = data.subtitle;
    if (typeof data.footer === 'string') state.footer = data.footer;
    if (typeof data.labelPosition === 'string') state.labelPosition = data.labelPosition;
    if (typeof data.gridColumns === 'number') state.gridColumns = data.gridColumns;
    if (typeof data.groupRanges === 'boolean') state.groupRanges = data.groupRanges;
    if (typeof data.sortAlphanumerically === 'boolean') state.sortAlphanumerically = data.sortAlphanumerically;
    saveState();
  }
}

export function deleteProfile(id) {
  let profiles = getProfiles();
  profiles = profiles.filter(p => p.id !== id);
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('touch_color_map_profiles', JSON.stringify(profiles));
  }
}

export function exportToJSON() {
  const exportData = {
    theme: state.theme,
    paperSize: state.paperSize,
    symbolScale: state.symbolScale,
    ranges: state.ranges,
    excludedItems: state.excludedItems,
    title: state.title,
    subtitle: state.subtitle,
    footer: state.footer,
    labelPosition: state.labelPosition,
    gridColumns: state.gridColumns,
    groupRanges: state.groupRanges,
    sortAlphanumerically: state.sortAlphanumerically
  };
  return JSON.stringify(exportData, null, 2);
}

export function importFromJSON(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid JSON format.');
  }
  
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid configuration data.');
  }
  
  if (!Array.isArray(parsed.ranges)) {
    throw new Error('Invalid configuration: "ranges" must be an array.');
  }
  if (!Array.isArray(parsed.excludedItems)) {
    throw new Error('Invalid configuration: "excludedItems" must be an array.');
  }
  
  if (typeof parsed.theme === 'string') state.theme = parsed.theme;
  if (typeof parsed.paperSize === 'string') state.paperSize = parsed.paperSize;
  if (typeof parsed.symbolScale === 'number' && !isNaN(parsed.symbolScale)) state.symbolScale = parsed.symbolScale;
  state.ranges = parsed.ranges.filter(r => r && typeof r === 'object' && r.id);
  state.excludedItems = parsed.excludedItems.filter(item => typeof item === 'string');
  if (typeof parsed.title === 'string') state.title = parsed.title;
  if (typeof parsed.subtitle === 'string') state.subtitle = parsed.subtitle;
  if (typeof parsed.footer === 'string') state.footer = parsed.footer;
  if (parsed.labelPosition === 'inside' || parsed.labelPosition === 'above' || parsed.labelPosition === 'below') {
    state.labelPosition = parsed.labelPosition;
  }
  if (typeof parsed.gridColumns === 'number') state.gridColumns = parsed.gridColumns;
  if (typeof parsed.groupRanges === 'boolean') state.groupRanges = parsed.groupRanges;
  if (typeof parsed.sortAlphanumerically === 'boolean') state.sortAlphanumerically = parsed.sortAlphanumerically;
  
  saveState();
}

