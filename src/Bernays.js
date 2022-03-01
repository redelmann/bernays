import interact from 'interactjs';
import {fuse, exprEqual} from './Expr.js';
import {tokenize} from './Tokenizer.js';
import {parse} from './Parser.js';
import {setParents, replaceInTree, freeMetaVariablesInTree, updateSubtree, ruleToTree, updateUndischargedAssumptions} from './Trees.js'; 
import {goalToHTML, assumptionToHTML, treeToHTML, newGoalDialogHTML, replacementsDialogHTML} from './Render.js';
import {initUI} from './UI.js';
import './Bernays.css';

function getContainer(elem) {
  let container = elem;
  while (!container.classList.contains("bernays")) {
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
        event.target.classList.remove("current");
      }
    }
  },
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('move', function (event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
    if (event.altKey) {
      const elem = event.currentTarget;
      const tree = elem.bernays.tree;
      const newElem = 'goal' in tree ? goalToHTML(tree, true) : assumptionToHTML(tree, true);
      const container = getContainer(event.currentTarget);

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
}).on('move', function(event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
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

      const container = getContainer(elem);

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

function moveMainDiv(div, dx, dy) {
  const x = (parseFloat(div.getAttribute('data-x')) || 0) + dx;
  const y = (parseFloat(div.getAttribute('data-y')) || 0) + dy;
  div.setAttribute('data-x', x);
  div.setAttribute('data-y', y);
  div.style.left = x + 'px';
  div.style.bottom = y + 'px';
}

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

function update(event, dragTree, repls) {
  const newSubtree = replaceInTree(dragTree, repls);
  setParents(newSubtree);
  const parentTree = event.target.bernays.tree.parent;
  if (parentTree) {
    updateSubtree(parentTree, event.target.bernays.tree, newSubtree);
  }
  const newDiv = treeToHTML(newSubtree, true);

  let mainDiv = event.target;
  while (!mainDiv.classList.contains("main")) {
    mainDiv = mainDiv.parentNode;
  }

  const contextDiv = event.target.parentNode;
  const x = parseFloat(event.target.getAttribute('data-x')) || 0;
  const y = parseFloat(event.target.getAttribute('data-y')) || 0;
  let dx = mainDiv.offsetWidth;
  event.relatedTarget.remove();
  event.target.remove();
  contextDiv.appendChild(newDiv);
  if (!parentTree) {
    newDiv.classList.add("main");
    mainDiv = newDiv;
    moveMainDiv(newDiv, x, y);
    dx -= 30;
    if (newSubtree.discharge) {
      dx += 60;
    }
  }
  dx -= mainDiv.offsetWidth;
  dx /= 2;
  updateCursor(event);
  moveMainDiv(mainDiv, dx, 0);
}

interact('.bernays .goal:not(.current .goal)').dropzone({
  accept: '.main.tree, .main.assumption',
  checker: dropChecker,
  ondropactivate(event) {
    const dropGoal = event.target.bernays.tree.goal;
    if (event.relatedTarget.classList.contains("tree")) {
      const dragTree = event.relatedTarget.bernays.tree;
      if(fuse(dropGoal, dragTree.conclusion)) {
        event.target.classList.add("active");
      }
    }
    else {
      if (!event.relatedTarget.bernays.scopeDiv.contains(event.target)) {
        return;
      }
      const dragExpr = event.relatedTarget.bernays.expr;
      const dropGoal = event.target.bernays.tree.goal;
      if(exprEqual(dropGoal, dragExpr)) {
        event.target.classList.add("active");
      }
    }
  },
  ondragenter(event) {
    event.target.classList.add("over");
  },
  ondrop(event) {
    event.target.classList.remove("over");
    const dropGoal = event.target.bernays.tree.goal;

    if (event.relatedTarget.classList.contains("tree")) {
      const dragTree = event.relatedTarget.bernays.tree;
      
      const replacements = fuse(dropGoal, dragTree.conclusion);
      if (replacements) {

        const freeVars = freeMetaVariablesInTree(dragTree);
        for (const handled in replacements) {
          freeVars.delete(handled);
        }
        if (freeVars.size > 0) {
          const container = getContainer(event.target);
          const dialog = replacementsDialogHTML(dragTree, replacements, freeVars, function(repls) {
            dialog.remove();
            container.bernays.hideModal();
            update(event, dragTree, repls);
          }, function() {
            dialog.remove();
            container.bernays.hideModal();
          });
          container.bernays.showModal();
          container.appendChild(dialog);
          dialog.bernays.initFocus();
        }
        else {
          update(event, dragTree, replacements);
        }
      }
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

interact('.bernays .menu .item').draggable({
  manualStart: true,
  listeners: dragMoveListeners,
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('move', function (event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
    const elem = treeToHTML(ruleToTree(event.currentTarget.bernays.rule), true);
    elem.classList.add("main");
    const container = getContainer(event.currentTarget);
    container.appendChild(elem);

    let x = event.currentTarget.offsetWidth / 2;
    let y = container.offsetHeight - event.currentTarget.offsetHeight;
    let current = event.currentTarget;
    while (current !== container) {
      x += current.offsetLeft;
      y -= current.offsetTop;
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
      event.target.bernays.scopeDiv.classList.remove("active-scope");
      event.target.bernays.treeDiv.classList.remove("has-current");
      event.target.remove();
    }
  },
  modifiers: [],
  autoScroll: true
}).on('move', function (event) {
  let interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {

    const elem = assumptionToHTML({ assumption: event.currentTarget.bernays.expr }, true);
    elem.bernays = event.currentTarget.bernays;
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
    if (container.hasAttribute('data-goal')) {
      addGoal(parse(tokenize(container.getAttribute('data-goal'))), container);
    }
  }
});

