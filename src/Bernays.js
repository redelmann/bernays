// Copyright 2022 Romain Edelmann
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import interact from 'interactjs';
import {exprEqual} from './Expr.js';
import {updateSubtree, ruleToTree, updateUndischargedAssumptions, mergeWithGoal, finalizeMergeWithGoal, isComplete} from './Trees.js'; 
import {goalToHTML, assumptionToHTML, treeToHTML, newGoalDialogHTML, newAxiomDialogHTML, aboutDialogHTML, treeContextualMenuHTML, containerContextualMenuHTML} from './Render.js';
import {initUI} from './UI.js';
import {loadState, saveState, saveToFile, loadFromFile, clearState, addState} from './State.js';
import {undo, redo, snapshot, cancelSnapshot, getActiveContainer} from './Undo.js';
import {moveMainDiv, getContainer, closeContextualMenu, playSound} from './Utils.js';
import {axiom} from './Rules.js';
import './Bernays.css';


function addGoal(expr, elem) {
  const exDiv = goalToHTML({ goal: expr }, true);
  exDiv.classList.add("main");
  const container = getContainer(elem);
  container.appendChild(exDiv);
  const x = (container.offsetWidth - exDiv.offsetWidth) / 2;
  const y = (container.offsetHeight - exDiv.offsetHeight) / 4;
  moveMainDiv(exDiv, x, y);
}

function addAxiom(expr, elem) {
  const exDiv = treeToHTML(ruleToTree(axiom(expr)), true);
  exDiv.classList.add("main");
  const container = getContainer(elem);
  container.appendChild(exDiv);
  const x = (container.offsetWidth - exDiv.offsetWidth) / 2;
  const y = (container.offsetHeight - exDiv.offsetHeight) / 4;
  moveMainDiv(exDiv, x, y);
}

const dragMoveListeners = {
  move(event) {
    moveMainDiv(event.target, event.dx, -event.dy);
  },
  start(event) {
    closeContextualMenu();
    event.target.classList.add("current");
  },
  end(event) {
    event.target.classList.remove("current");
  }
};

const dragMoveModifiers = [
  interact.modifiers.restrict({
    restriction: 'parent'
  })
];

interact('.bernays .goal.interactive, .bernays .assumption.interactive').draggable({
  manualStart: true,
  listeners: {
    move: dragMoveListeners.move,
    start: dragMoveListeners.start,
    end(event) {
      if (event.target.classList.contains("assumption")) {
        event.target.bernays.scopeDiv.classList.remove("active-scope");
        event.target.bernays.treeDiv.classList.remove("has-current");
        if (!event.relatedTarget) {
          playSound('woosh');
        }
        event.target.remove();
      }
      else {
        dragMoveListeners.end(event);
      }
    }
  },
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('down', function (event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting() && event.button === 0 && !event.ctrlKey) {
    const container = getContainer(event.currentTarget);
    snapshot(container);
    if (event.altKey) {
      playSound('separate');
      const elem = event.currentTarget;
      const tree = elem.bernays.tree;
      const newElem = 'goal' in tree ? goalToHTML(tree, true) : assumptionToHTML(tree, true);

      let x = 0;
      let y = container.offsetHeight-elem.offsetHeight;

      let current = elem;
      while (current !== container) {
        x += current.offsetLeft;
        y -= current.offsetTop;
        current = current.offsetParent;
      }

      newElem.classList.add("main");
      container.appendChild(newElem);
      moveMainDiv(newElem, x, y);

      if ('assumption' in tree) {
        const expr = tree.assumption;
        const goalTree = { goal: expr, parent: tree.parent };
        const goalDiv = goalToHTML(goalTree, true);
        updateSubtree(tree.parent, tree, goalTree);
        elem.parentNode.replaceChild(goalDiv, elem);

        let scopeDiv = null;
        let treeDiv = null;
        let current = goalDiv;
        while (!current.classList.contains("main")) {
          current = current.parentNode;
          if (current.classList.contains("tree") && 
              current.bernays.tree.discharge &&
              exprEqual(expr, current.bernays.tree.discharge)) {
            treeDiv = current;
            scopeDiv = current.childNodes[0];
          }
        }

        newElem.bernays.expr = expr;
        newElem.bernays.scopeDiv = scopeDiv;
        newElem.bernays.treeDiv = treeDiv;

        scopeDiv.classList.add("active-scope");
        treeDiv.classList.add("has-current");
      }

      interaction.start({ name: 'drag' }, event.interactable, newElem);
    }
    else {
      let elem = event.currentTarget;
      while (elem && !elem.classList.contains("main")) {
        elem = elem.parentNode;
      }
      if (elem) {
        interaction.start({ name: 'drag' }, event.interactable, elem);
      }
    }
  }
});

function updateCursor(event) {
  const shiftElems = document.getElementsByClassName('bernays');
  if (event.shiftKey) {
    for (const elem of shiftElems) {
      elem.classList.add("move");
    }
  }
  else {
    for (const elem of shiftElems) {
      elem.classList.remove("move");
    }
  }

  const altElems = document.getElementsByClassName('alt-detach');
  if (event.altKey) {
    for (const elem of altElems) {
      elem.classList.add('detach');
    }
  }
  else {
    for (const elem of altElems) {
      elem.classList.remove('detach');
    }
  }
}
document.addEventListener('keydown', updateCursor);
document.addEventListener('keyup', updateCursor);
document.addEventListener('visibilitychange', updateCursor);

interact(
  '.bernays .conclusion.interactive > div, ' +
  '.bernays .name.interactive, ' +
  '.bernays .bar.interactive').draggable({
  manualStart: true,
  listeners: dragMoveListeners,
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('down', function(event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting() && event.button === 0 && !event.ctrlKey) {
    const container = getContainer(event.currentTarget);
    snapshot(container);
    if (event.altKey) {
      playSound('separate');
      let elem = event.currentTarget;
      if (elem.classList.contains("name") || elem.classList.contains("bar")) {
        while (!elem.classList.contains("tree")) {
          elem = elem.parentNode;
        }
        elem = elem.childNodes[2].childNodes[0];
      }
      let conclusion_x = elem.offsetLeft;
      while (elem && !elem.classList.contains("tree")) {
        elem = elem.offsetParent;
        conclusion_x += elem.offsetLeft;
      }
      const tree = elem.bernays.tree;
      const expr = tree.conclusion;
      const goal = { goal: expr, parent: tree.parent };

      let x = 0;
      let y = container.offsetHeight-elem.offsetHeight;

      let current = elem;
      while (current !== container) {
        x += current.offsetLeft;
        y -= current.offsetTop;
        current = current.offsetParent;
      }

      let is_naked_goal = false;
      if (tree.parent) {
        updateSubtree(tree.parent, tree, goal);
        tree.parent = null;
      }
      else {
        is_naked_goal = true;
      }

      updateUndischargedAssumptions(tree);


      let mainDiv = elem;
      while (!mainDiv.classList.contains("main")) {
        mainDiv = mainDiv.parentNode;
      }
      let dx = mainDiv.offsetWidth;

      const goalDiv = goalToHTML(goal, true);
      if (is_naked_goal) {
        goalDiv.classList.add("main");
        moveMainDiv(goalDiv, conclusion_x, parseFloat(elem.getAttribute('data-y')));
      }
      elem.parentNode.replaceChild(goalDiv, elem);
      

      dx -= mainDiv.offsetWidth;
      dx /= 2;
      moveMainDiv(mainDiv, dx, 0);


      const newDiv = treeToHTML(tree, true);
      newDiv.classList.add("main");

      container.appendChild(newDiv);

      moveMainDiv(newDiv, x, y);

      updateCursor(event);

      interaction.start({ name: 'drag' }, event.interactable, newDiv);
    }
    else {
      let elem = event.currentTarget;
      while (elem && !elem.classList.contains("main")) {
        elem = elem.parentNode;
      }
      if (elem) {
        interaction.start({ name: 'drag' }, event.interactable, elem);
      }
    }
  }
});

interact(
  '.bernays .conclusion.interactive > div, ' + 
  '.bernays .goal.interactive, ' + 
  '.bernays .assumption.interactive, ' +
  '.bernays .bar.interactive, ' + 
  '.bernays .name.interactive').on('contextmenu', function (event) {
  event.stopPropagation();
  event.preventOriginalDefault();
  closeContextualMenu();

  let mainDiv = event.target;
  while (!mainDiv.classList.contains("main")) {
    mainDiv = mainDiv.parentNode;
  }
  const menu = treeContextualMenuHTML(mainDiv);
  document.body.appendChild(menu);
  menu.style.left = event.pageX + 'px';
  menu.style.top = event.pageY + 'px';
});

function dropChecker(dragEvent, event, dropped, dropzone, dropzoneElement, draggable, draggableElement) {
  const dropBoundingRect = dropzoneElement.getBoundingClientRect();
  const innerDraggableElem = draggableElement.classList.contains("tree") ? draggableElement.childNodes[2] : draggableElement;
  const dragBoundRect = innerDraggableElem.getBoundingClientRect();

  const dragCenter = {
    x: dragBoundRect.left + dragBoundRect.width / 2,
    y: dragBoundRect.top + dragBoundRect.height / 2
  };

  if (dragCenter.x < dropBoundingRect.left || dragCenter.x > dropBoundingRect.right ||
      dragCenter.y < dropBoundingRect.top || dragCenter.y > dropBoundingRect.bottom) {
    return false;
  }
  return true;
}

interact('.bernays .goal:not(.current .goal)').dropzone({
  accept: '.main.tree, .main.assumption, .main.goal',
  checker: dropChecker,
  ondropactivate(event) {
    if (getContainer(event.target) !== getContainer(event.relatedTarget)) {
      return;
    }
    const dropGoal = event.target.bernays.tree;
    const dragTree = event.relatedTarget.bernays.tree;
    if ("assumption" in dragTree) {
      if (!event.relatedTarget.bernays.scopeDiv.contains(event.target)) {
        return;
      }
    }
    const savedValues = mergeWithGoal(dragTree, dropGoal);
    if(savedValues) {
      event.target.bernays.savedValues = savedValues;
      event.target.classList.add("active");
    }
  },
  ondragenter(event) {
    event.target.classList.add("over");
  },
  ondrop(event) {
    event.target.classList.remove("over");
    const savedValues = event.target.bernays.savedValues;
    if (savedValues) {
      const newTree = finalizeMergeWithGoal(savedValues);
      if (isComplete(newTree)) {
        playSound('over');
      }
      else {
        playSound('ok');
      }
      const newDiv = 'goal' in newTree ? goalToHTML(newTree, true) : treeToHTML(newTree, true);
      newDiv.classList.add("main");
      
      let mainDiv = event.target;
      while (!mainDiv.classList.contains("main")) {
        mainDiv = mainDiv.parentNode;
      }
      
      const contextDiv = mainDiv.parentNode;
      let x = parseFloat(mainDiv.getAttribute('data-x')) || 0;
      const y = parseFloat(mainDiv.getAttribute('data-y')) || 0;
      let dx = mainDiv.offsetWidth;

      if (!mainDiv.classList.contains("tree") && newDiv.classList.contains("tree")) {
        x -= 30;
        dx += 30;
        if (newTree.discharge) {
          dx += 60;
        }
      }
      
      event.relatedTarget.remove();
      mainDiv.remove();
      contextDiv.appendChild(newDiv);

      dx -= newDiv.offsetWidth;
      dx /= 2;
      updateCursor(event);
      moveMainDiv(newDiv, x + dx, y);
    }
    else {
      playSound('not_ok');
    }
  },
  ondragleave(event) {
    event.target.classList.remove("over");
  },
  ondropdeactivate(event) {
    event.target.classList.remove("active");
    event.target.bernays.savedValues = null;
  }
});

interact('.bernays .rules-menu .item').draggable({
  manualStart: true,
  listeners: {
    start: dragMoveListeners.start,
    move: dragMoveListeners.move,
    end(event) {
      dragMoveListeners.end(event);
      if (!event.target.parentNode) {
        const container = getContainer(event.relatedTarget);
        if (container) {
          cancelSnapshot(container);
        }
      }
    }
  },
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('down', function (event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting() && event.button === 0 && !event.ctrlKey) {
    const container = getContainer(event.currentTarget);
    snapshot(container);
    const elem = treeToHTML(ruleToTree(event.currentTarget.bernays.rule), true);
    elem.classList.add("main");
    container.appendChild(elem);

    let x = event.currentTarget.offsetWidth / 2;
    let y = container.offsetHeight - event.currentTarget.offsetHeight;
    let current = event.currentTarget;
    while (current !== container) {
      x += current.offsetLeft;
      y -= current.offsetTop;
      y += current.scrollTop;
      current = current.offsetParent;
    }
    
    const childDiv = elem.childNodes[2].childNodes[0];
    x -= childDiv.offsetLeft + childDiv.offsetWidth / 2;

    moveMainDiv(elem, x, y);

    interaction.start({ name: 'drag' }, event.interactable, elem);
  }
});

interact('.bernays :not(.current) .discharge.interactive').draggable({
  manualStart: true,
  listeners: {
    move: dragMoveListeners.move,
    start: dragMoveListeners.start,
    end(event) {
      const container = getContainer(event.target);
      if (container) {
        cancelSnapshot(container);
      }
      event.target.bernays.scopeDiv.classList.remove("active-scope");
      event.target.bernays.treeDiv.classList.remove("has-current");
      event.target.remove();
      if (!event.relatedTarget) {
        playSound('woosh');
      }
    }
  },
  modifiers: [],
  autoScroll: true
}).on('down', function (event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting() && event.button === 0 && !event.ctrlKey) {
    const container = getContainer(event.currentTarget);
    snapshot(container);
    const tree = { assumption: event.currentTarget.bernays.expr };
    const elem = assumptionToHTML(tree, true);
    elem.bernays = event.currentTarget.bernays;
    elem.bernays.tree = tree;
    elem.classList.add("main");

    elem.bernays.scopeDiv.classList.add("active-scope");
    elem.bernays.treeDiv.classList.add("has-current");

    let treeDiv = event.currentTarget.bernays.treeDiv;
    treeDiv.appendChild(elem);

    const y = treeDiv.offsetHeight - event.currentTarget.offsetTop - event.currentTarget.offsetHeight;
    const x = event.currentTarget.offsetLeft + (event.currentTarget.offsetWidth - elem.offsetWidth) / 2;

    moveMainDiv(elem, x, y);

    interaction.start({ name: 'drag' }, event.interactable, elem);
  }
});

interact('.bernays').draggable({
  manualStart: true,
  listeners: {
    move(event) {
      if (!event.shiftKey) {
        event.interaction.stop();
        return;
      }
      for (const mainDiv of event.target.querySelectorAll(".main")) {
        moveMainDiv(mainDiv, event.dx, -event.dy);
      }
    },
    start() {},
    end() {}
  }
}).on('contextmenu', function (event) {
  if (event.currentTarget !== event.target) {
    return;
  }
  event.stopPropagation();
  event.preventOriginalDefault();
  const menu = containerContextualMenuHTML(event.target);
  document.body.appendChild(menu);
  menu.style.left = event.pageX + 'px';
  menu.style.top = event.pageY + 'px';
}).on('down', function (event) {
  closeContextualMenu();

  if (!event.shiftKey) {
    return;
  }

  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting() && event.button === 0 && !event.ctrlKey) {
    const container = getContainer(event.target);
    snapshot(container);
    interaction.start({ name: 'drag' }, event.interactable, event.currentTarget);
  }
}).styleCursor(false);

document.addEventListener("DOMContentLoaded", function () {
  const containers = document.getElementsByClassName("bernays");
  
  for (const container of containers) {

    const content = container.innerText;
    container.innerText = "";
    let initState = null;
    try {
      initState = JSON.parse(content);
    }
    catch(e) {
      if (content.trim() !== "") {
        console.log("Error parsing initial state: " + e);
      }
    }

    const options = {};
    if (container.hasAttribute('data-include-rules')) {
      options.includeRules = new Set(container.getAttribute('data-include-rules').split(/\s+/));
    }
    if (container.hasAttribute('data-exclude-rules')) {
      options.excludeRules = new Set(container.getAttribute('data-exclude-rules').split(/\s+/));
    }
    initUI(container, options);
    container.bernays.initState = initState;
    const savedState = loadState(container);
    if (savedState) {
      addState(container, savedState);
    }
    else if (container.bernays.initState) {
      addState(container, container.bernays.initState);
    }

    if (container.hasAttribute('data-hide-menu')) {
      container.classList.add("no-menu");
    }

    container.bernays.menu['help'].classList.add('disabled');
    container.bernays.menu['settings'].classList.add('disabled');

    container.bernays.menu['undo'].classList.add('disabled');
    container.bernays.menu['redo'].classList.add('disabled');

    container.bernays.menu['new-goal'].addEventListener('click', function () {
      container.bernays.showModal();
      const dialogDiv = newGoalDialogHTML(function(expr) {
        container.bernays.hideModal();
        dialogDiv.remove();
        snapshot(container);
        addGoal(expr, container);
      }, function() {
        container.bernays.hideModal();
        dialogDiv.remove();
      });
      container.appendChild(dialogDiv);
      dialogDiv.bernays.initFocus();
    });

    container.bernays.menu['new-axiom'].addEventListener('click', function () {
      container.bernays.showModal();
      const dialogDiv = newAxiomDialogHTML(function(expr) {
        container.bernays.hideModal();
        dialogDiv.remove();
        snapshot(container);
        addAxiom(expr, container);
      }, function() {
        container.bernays.hideModal();
        dialogDiv.remove();
      });
      container.appendChild(dialogDiv);
      dialogDiv.bernays.initFocus();
    });

    container.bernays.menu['about'].addEventListener('click', function() {
      container.bernays.showModal();
      const dialogDiv = aboutDialogHTML(function() {
        container.bernays.hideModal();
        dialogDiv.remove();
      });
      container.appendChild(dialogDiv);
    });

    container.bernays.menu['reset'].addEventListener('click', function() {
      snapshot(container);
      clearState(container);
      playSound('woosh');
      if(container.bernays.initState) {
        addState(container, container.bernays.initState);
      }
    });

    container.bernays.menu['undo'].addEventListener('click', function () { undo(container); });
    container.bernays.menu['redo'].addEventListener('click', function () { redo(container); });

    container.bernays.menu['save'].addEventListener('click', function () {
      saveToFile(container);
    });
    container.bernays.menu['load'].addEventListener('click', function () {
      snapshot(container);
      loadFromFile(container, true);
    });

    container.bernays.counter = 0;

    container.addEventListener("dragenter", function (event) {
      event.stopPropagation();
      event.preventDefault();
      container.bernays.counter++;
      if (container.bernays.counter === 1) {
        container.bernays.showModal();
      }
    });

    container.addEventListener("dragover", function (event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });

    container.addEventListener("dragleave", function (event) {
      event.stopPropagation();
      event.preventDefault();
      container.bernays.counter--;
      if (container.bernays.counter === 0) {
        container.bernays.hideModal();
      }
    });

    container.addEventListener("drop", function (event) {
      event.stopPropagation();
      event.preventDefault();
      container.bernays.counter = 0;
      container.bernays.hideModal();
      const fileList = event.dataTransfer.files;

      if (fileList.length == 0) {
        return;
      }

      snapshot(container);
      if (!event.shiftKey) {
        clearState(container);
      }

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        file.text().then(function(text) {
          const state = JSON.parse(text);
          addState(container, state);
        });
      }
    });

    const resizeObserver = new ResizeObserver(function(entries) {
      for (const entry of entries) {
        const target = entry.target;
        for (let i = 0; i < 3; i++) {
          target.classList.remove("hide-level-" + i);
        }
        for (let i = 2; i >= 0; i--) {
          const targetWidth = target.offsetWidth;
          const actualWidth = target.scrollWidth;
          if (targetWidth < actualWidth) {
            target.classList.add("hide-level-" + i);
          }
        }
      }
    });

    resizeObserver.observe(container.querySelector(".top-menu"));
  }
});

window.addEventListener("beforeunload", function () {
  const containers = document.getElementsByClassName("bernays");
  for (const container of containers) {
    saveState(container);
  }
});

window.addEventListener("keydown", function (event) {
  const modKey = window.navigator.platform.match(/Mac/i) ? event.metaKey : event.ctrlKey;

  if ((event.key === "z" || event.key === "Z") && modKey) {
    const container = getActiveContainer();
    if (!container || container.querySelector(".current")) {
      return;
    }
    if (event.shiftKey) {
      if (redo(container)) {
        event.preventDefault();
      }
    }
    else if (undo(container)) {
      event.preventDefault();
    }
  }
});

