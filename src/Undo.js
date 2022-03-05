import { getState, restoreState } from "./State.js";
import { setParents } from "./Trees.js";

if (!window.bernays) {
  window.bernays = {};
}
window.bernays.active_container = null;

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
} 

export function cancelSnapshot(container) {
  if (container.bernays.undo_stack.length > 0) {
    container.bernays.undo_stack.pop();
  }
}

export function undo(container) {
  const activeContainer = container || window.bernays.active_container;
  if (!canUndo(activeContainer)) {
    return false;
  }
  window.bernays.active_container = activeContainer;

  const oldElems = getState(activeContainer);
  for (const elem of oldElems) {
    setParents(elem.tree);
  }
  activeContainer.bernays.redo_stack.push(oldElems);

  const elems = activeContainer.bernays.undo_stack.pop();
  restoreState(activeContainer, elems);
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
  const activeContainer = container || window.bernays.active_container;
  if (!canRedo(activeContainer)) {
    return false;
  }
  window.bernays.active_container = activeContainer;

  const oldElems = getState(activeContainer);
  for (const elem of oldElems) {
    setParents(elem.tree);
  }
  activeContainer.bernays.undo_stack.push(oldElems);

  const elems = activeContainer.bernays.redo_stack.pop();
  restoreState(activeContainer, elems);
  return true;
}

export function canRedo(container) {
  const activeContainer = container || window.bernays.active_container;
  return activeContainer &&
       !activeContainer.bernays.is_modal_open() &&
       activeContainer.bernays.redo_stack &&
       activeContainer.bernays.redo_stack.length > 0;
}