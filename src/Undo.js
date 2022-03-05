import { getState, restoreState } from "./State.js";
import { setParents } from "./Trees.js";

if (!window.bernays) {
  window.bernays = {};
}
window.bernays.active_container = null;

export function getActiveContainer() {
  return window.bernays.active_container;
}

export function snapshot(container) {
  window.bernays.active_container = container;
  if (!container.bernays.undo_stack) {
    container.bernays.undo_stack = [];
  }
  const elems = getState(container);
  for (const elem of elems) {
    setParents(elem.tree);
  }
  container.bernays.undo_stack.push(elems);
  container.bernays.redo_stack = [];

  if (container.bernays.menu) {
    container.bernays.menu.undo.classList.remove('disabled');
    container.bernays.menu.redo.classList.add('disabled');
  }
} 

export function cancelSnapshot(container) {
  window.bernays.active_container = container;
  if (container.bernays.undo_stack.length > 0) {
    container.bernays.undo_stack.pop();
  }

  if (container.bernays.menu) {
    if (container.bernays.undo_stack.length > 0) {
      container.bernays.menu.undo.classList.remove('disabled');
    }
    else {
      container.bernays.menu.undo.classList.add('disabled');
    }
    container.bernays.menu.redo.classList.add('disabled');
  }
}

export function undo(container) {
  if (!canUndo(container)) {
    return false;
  }
  window.bernays.active_container = container;

  const oldElems = getState(container);
  for (const elem of oldElems) {
    setParents(elem.tree);
  }
  container.bernays.redo_stack.push(oldElems);

  const elems = container.bernays.undo_stack.pop();
  restoreState(container, elems);

  if (container.bernays.menu) {
    container.bernays.menu.redo.classList.remove('disabled');
    if (container.bernays.undo_stack.length === 0) {
      container.bernays.menu.undo.classList.add('disabled');
    }
  }
  return true;
}

export function canUndo(container) {
  const activeContainer = container || window.bernays.active_container;
  return activeContainer && 
       !activeContainer.bernays.is_modal_open() &&
       activeContainer.bernays.undo_stack &&
       activeContainer.bernays.undo_stack.length > 0;
}

export function redo(container) {
  if (!canRedo(container)) {
    return false;
  }
  window.bernays.active_container = container;

  const oldElems = getState(container);
  for (const elem of oldElems) {
    setParents(elem.tree);
  }
  container.bernays.undo_stack.push(oldElems);

  const elems = container.bernays.redo_stack.pop();
  restoreState(container, elems);

  if (container.bernays.menu) {
    container.bernays.menu.undo.classList.remove('disabled');
    if (container.bernays.redo_stack.length === 0) {
      container.bernays.menu.redo.classList.add('disabled');
    }
  }
  
  return true;
}

export function canRedo(container) {
  const activeContainer = container || window.bernays.active_container;
  return activeContainer &&
       !activeContainer.bernays.is_modal_open() &&
       activeContainer.bernays.redo_stack &&
       activeContainer.bernays.redo_stack.length > 0;
}