import {withoutParents, setParents} from './Trees.js';

function getKey(container) {
  return container.id ? 'bernays-state-' + container.id : 'bernays-state';
}

export function saveState(container) {
  const elems = [];
  for (const child of container.children) {
    if (child.bernays && child.bernays.tree) {
      elems.push({
        tree: withoutParents(child.bernays.tree),
        x: parseFloat(child.getAttribute('data-x')) || 0,
        y: parseFloat(child.getAttribute('data-y')) || 0,
      });
    }
  }

  const encoded = JSON.stringify(elems);
  localStorage.setItem(getKey(container), encoded);
}

export function loadState(container) {
  const encoded = localStorage.getItem(getKey(container));
  if (encoded) {
    const elems = JSON.parse(encoded);
    for (const elem of elems) {
      setParents(elem.tree);
    }
    return elems;
  }
  return null;
}