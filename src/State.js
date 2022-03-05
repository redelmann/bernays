import {withoutParents, setParents} from './Trees.js';
import {moveMainDiv} from './Utils.js';
import {goalToHTML, treeToHTML} from './Render.js';

function getKey(container) {
  return container.id ? 'bernays-state-' + container.id : 'bernays-state';
}

export function getState(container) {
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
  return elems;
}

export function saveState(container) {
  const encoded = JSON.stringify(getState(container));
  sessionStorage.setItem(getKey(container), encoded);
}

export function loadState(container) {
  const encoded = sessionStorage.getItem(getKey(container));
  if (encoded) {
    const elems = JSON.parse(encoded);
    for (const elem of elems) {
      setParents(elem.tree);
    }
    return elems;
  }
  return null;
}


export function restoreState(container, state) {
  for (const main of container.querySelectorAll(".main")) {
    main.remove();
  }
  for (const elem of state) {
    const treeDiv = 'goal' in elem.tree ? goalToHTML(elem.tree, true) : treeToHTML(elem.tree, true);
    treeDiv.classList.add("main");
    container.appendChild(treeDiv);
    moveMainDiv(treeDiv, elem.x, elem.y);
  }
}