import { toggleExclusion, removeRange, getEffectiveItems, state } from './state.js';

export const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

export function renderColorPresets(activeColor, onSelect) {
  const container = document.getElementById('color-presets');
  if (!container) return;
  container.innerHTML = '';
  
  PRESET_COLORS.forEach(color => {
    const dot = document.createElement('div');
    dot.className = `preset-dot ${color === activeColor ? 'active' : ''}`;
    dot.style.backgroundColor = color;
    dot.addEventListener('click', () => onSelect(color));
    container.appendChild(dot);
  });
}

export function renderActiveRanges(onDelete) {
  const list = document.getElementById('active-ranges-list');
  if (!list) return;
  list.innerHTML = '';

  if (state.ranges.length === 0) {
    list.innerHTML = '<p class="subtitle-text" style="text-align: center; padding: 12px 0;">No active ranges</p>';
    return;
  }

  state.ranges.forEach(range => {
    const card = document.createElement('div');
    card.className = 'range-card';
    card.innerHTML = `
      <div class="range-card-info">
        <div class="range-card-color-indicator" style="background-color: ${range.color}"></div>
        <span><strong>${range.prefix || 'No Prefix'}</strong> (${range.start}-${range.end})</span>
      </div>
      <button class="btn-icon" title="Delete Range">&times;</button>
    `;

    card.querySelector('.btn-icon').addEventListener('click', () => {
      removeRange(range.id);
      onDelete();
    });

    list.appendChild(card);
  });
}

// Helper to generate SVG string based on symbol type
function getSymbolSVG(type, color, size) {
  if (type === 'heart') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="stroke: ${color};">
        <path d="M12 4.419C12 4.419 10.082 0 6.004 0C2.69 0 0 2.5 0 5.862C0 11.233 12 18 12 18S24 11.233 24 5.862C24 2.5 21.31 0 17.996 0C13.918 0 12 4.419 12 4.419Z" />
      </svg>
    `;
  }
  // Default circle
  const radius = 10;
  const center = 12;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="stroke: ${color};">
      <circle cx="${center}" cy="${center}" r="${radius}" />
    </svg>
  `;
}

export function renderPrintSheet(onToggleItem) {
  const container = document.getElementById('sheet-content');
  if (!container) return;
  container.innerHTML = '';

  if (state.ranges.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #64748b; margin-top: 100px;">Add ranges from the sidebar to populate your coloring tracker sheet.</div>';
    return;
  }

  // Size of symbols scaled
  const size = Math.round(36 * state.symbolScale);

  state.ranges.forEach(range => {
    const section = document.createElement('section');
    section.className = 'range-section';

    // Header
    const header = document.createElement('div');
    header.className = 'range-section-header';
    header.style.color = range.color;
    header.style.borderBottomColor = range.color;
    header.innerHTML = `
      <span>Range: ${range.prefix ? range.prefix + ' ' : ''}${range.start} to ${range.end}</span>
    `;
    section.appendChild(header);

    // Grid of symbols
    const grid = document.createElement('div');
    grid.className = 'grid-container';

    const items = getEffectiveItems(range);
    items.forEach(num => {
      const label = `${range.prefix}${num}`;
      const item = document.createElement('div');
      item.className = 'symbol-item';
      item.title = `Click to exclude ${label}`;

      const shape = document.createElement('div');
      shape.className = 'symbol-shape';
      shape.innerHTML = getSymbolSVG(range.symbol, range.color, size);

      const textLabel = document.createElement('span');
      textLabel.className = 'symbol-label';
      textLabel.style.color = range.color;
      textLabel.innerText = label;

      shape.appendChild(textLabel);
      item.appendChild(shape);

      item.addEventListener('click', () => {
        // Fade-out visual cue before removal
        item.classList.add('fade-out');
        setTimeout(() => {
          toggleExclusion(label);
          onToggleItem();
        }, 150);
      });

      grid.appendChild(item);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
