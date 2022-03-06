import interact from 'interactjs';
import {exprEqual} from './Expr.js';
import {tokenize} from './Tokenizer.js';
import {parse} from './Parser.js';
import {updateSubtree, ruleToTree, updateUndischargedAssumptions, mergeWithGoal, finalizeMergeWithGoal} from './Trees.js'; 
import {goalToHTML, assumptionToHTML, treeToHTML, newGoalDialogHTML} from './Render.js';
import {initUI} from './UI.js';
import {loadState, saveState, restoreState, saveToFile, loadFromFile, clearState, addState} from './State.js';
import {undo, redo, snapshot, cancelSnapshot, getActiveContainer} from './Undo.js';
import {moveMainDiv} from './Utils.js';
import './Bernays.css';

function getContainer(elem) {
  let container = elem;
  while (container !== null && !container.classList.contains("bernays")) {
    container = container.parentNode;
  }
  return container;
}

function addGoal(expr, elem) {
  const exDiv = goalToHTML({ goal: expr }, true);
  exDiv.classList.add("main");
  const container = getContainer(elem);
  container.appendChild(exDiv);
  const x = (container.offsetWidth - exDiv.offsetWidth) / 2;
  const y = (container.offsetHeight - exDiv.offsetHeight) / 2;
  moveMainDiv(exDiv, x, y);
}

const dragMoveListeners = {
  move(event) {
    moveMainDiv(event.target, event.dx, -event.dy);
  },
  start(event) {
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
  if (interaction.pointerIsDown && !interaction.interacting()) {
    const container = getContainer(event.currentTarget);
    snapshot(container);
    if (event.altKey) {
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
  const elems = document.getElementsByClassName('alt-detach');
  if (event.altKey) {
    for (const elem of elems) {
      elem.classList.add('detach');
    }
  }
  else {
    for (const elem of elems) {
      elem.classList.remove('detach');
    }
  }
}
document.addEventListener('keydown', updateCursor);
document.addEventListener('keyup', updateCursor);
document.addEventListener('visibilitychange', updateCursor);

interact('.bernays .conclusion.interactive > div').draggable({
  manualStart: true,
  listeners: dragMoveListeners,
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('down', function(event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
    const container = getContainer(event.currentTarget);
    snapshot(container);
    if (event.altKey) {
      let elem = event.currentTarget;
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
    const dropGoal = event.target.bernays.tree;
    const dragTree = event.relatedTarget.bernays.tree;
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
    const dropGoal = event.target.bernays.tree.goal;     
    const savedValues = event.target.bernays.savedValues;
    if (savedValues) {
      const newTree = finalizeMergeWithGoal(savedValues);
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
      const dragExpr = event.relatedTarget.bernays.expr;

      if (!event.relatedTarget.bernays.scopeDiv.contains(event.target) || !exprEqual(dragExpr, dropGoal)) {
        return;
      }
      
      const tree = event.target.bernays.tree;
      const contextDiv = event.target.parentNode;
      const parentTree = tree.parent;
      console.assert(parentTree, "Parent of discharged goal was not set.");
      const assumptionTree = { assumption: dragExpr, parent: parentTree };
      updateSubtree(parentTree, tree, assumptionTree);
      const assumptionDiv = assumptionToHTML(assumptionTree, true);
      event.target.remove();
      contextDiv.appendChild(assumptionDiv);
    }
  },
  ondragleave(event) {
    event.target.classList.remove("over");
  },
  ondropdeactivate(event) {
    event.target.classList.remove("active");
  }
});

interact('.bernays .trash').dropzone({
  accept: '.main',
  checker: dropChecker,
  ondropactivate(event) {
    event.target.classList.add("active");
  },
  ondragenter(event) {
    event.target.classList.add("over");
  },
  ondrop(event) {
    event.relatedTarget.remove();
    event.target.classList.remove("over");
  },
  ondragleave(event) {
    event.target.classList.remove("over");
  },
  ondropdeactivate(event) {
    event.target.classList.remove("active");
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
  if (interaction.pointerIsDown && !interaction.interacting()) {
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
    }
  },
  modifiers: [],
  autoScroll: true
}).on('down', function (event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
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

interact('.bernays .new-goal').on('click', function(event) {
  const container = getContainer(event.target);
  container.bernays.showModal();
  const dialogDiv = newGoalDialogHTML(function(expr) {
    container.bernays.hideModal();
    dialogDiv.remove();
    snapshot(container);
    addGoal(expr, event.target);
  }, function() {
    container.bernays.hideModal();
    dialogDiv.remove();
  });
  container.appendChild(dialogDiv);
  dialogDiv.bernays.initFocus();
});

document.addEventListener("DOMContentLoaded", function () {
  const containers = document.getElementsByClassName("bernays");
  
  for (const container of containers) {
    const options = {};
    if (container.hasAttribute('data-include-rules')) {
      options.includeRules = new Set(container.getAttribute('data-include-rules').split(/\s+/));
    }
    if (container.hasAttribute('data-exclude-rules')) {
      options.excludeRules = new Set(container.getAttribute('data-exclude-rules').split(/\s+/));
    }
    initUI(container, options);
    const saved_state = loadState(container);
    if (saved_state) {
      restoreState(container, saved_state);
    }
    else if (container.hasAttribute('data-goal')) {
      addGoal(parse(tokenize(container.getAttribute('data-goal'))), container);
    }

    container.bernays.menu['about'].classList.add('disabled');
    container.bernays.menu['help'].classList.add('disabled');
    container.bernays.menu['settings'].classList.add('disabled');

    container.bernays.menu['undo'].classList.add('disabled');
    container.bernays.menu['redo'].classList.add('disabled');

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

    container.addEventListener("dragenter", function(event) {
      event.stopPropagation();
      event.preventDefault();
      container.bernays.counter++;
      if (container.bernays.counter === 1) {
        container.bernays.showModal();
      }
    });

    container.addEventListener("dragover", function(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });

    container.addEventListener("dragleave", function(event) {
      event.stopPropagation();
      event.preventDefault();
      container.bernays.counter--;
      if (container.bernays.counter === 0) {
        container.bernays.hideModal();
      }
    });

    container.addEventListener("drop", function(event) {
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
  }
});

window.addEventListener("beforeunload", function () {
  const containers = document.getElementsByClassName("bernays");
  for (const container of containers) {
    saveState(container);
  }
});

window.addEventListener("keyup", function (event) {
  if ((event.key === "z" || event.key === "Z") && event.ctrlKey) {
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