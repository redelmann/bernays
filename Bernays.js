import {constant, and, or, implies, not, metaVariable, fuse, replace, freeMetaVariables, exprEqual} from './Expr.js';
import {tokenize} from './Tokenizer.js';
import {parse} from './Parser.js';
import {pretty} from './Printer.js';
import {trueI, falseE, notI, notE, andI, andE1, andE2, orI1, orI2, implI, implE, notNotE, tnd, rules} from './Rules.js';
import {setParents, replaceInTree, freeMetaVariablesInTree, updateSubtree, ruleToTree, getContextDischarges, updateUndischargedAssumptions} from './Trees.js'; 
import {goalToHTML, assumptionToHTML, treeToHTML, newGoalDialogHTML, replacementsDialogHTML} from './Render.js';
import {initUI} from './UI.js';

function getContainer(elem) {
  var container = elem;
  while (!container.classList.contains("bernays")) {
    container = container.parentNode;
  }
  return container;
}

function addGoal(expr, elem) {
  const exDiv = goalToHTML({ goal: expr });
  exDiv.classList.add("main");
  const container = getContainer(elem);
  container.appendChild(exDiv);
  const x = (container.offsetWidth - exDiv.offsetWidth) / 2;
  const y = (container.offsetHeight - exDiv.offsetHeight) / 2;
  exDiv.style.left =  x + 'px';
  exDiv.style.bottom = y + 'px';
  exDiv.setAttribute('data-x', x);
  exDiv.setAttribute('data-y', y);
}

const dragMoveListeners = {
  move(event) {
    const target = event.target;
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) - event.dy;
    target.style.left = x + 'px';
    target.style.bottom = y + 'px';
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
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

interact('.bernays .main.tree > .conclusion > div, .bernays .goal.main').draggable({
  manualStart: true,
  listeners: dragMoveListeners,
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('move', function (event) {
  var interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
    var elem = event.currentTarget;
    while (elem && !elem.classList.contains("main")) {
      elem = elem.parentNode;
    }
    if (elem) {
      interaction.start({ name: 'drag' }, event.interactable, elem);
    }
  }
});

interact('.bernays .conclusion:not(.main > .conclusion) > div').draggable({
  manualStart: true,
  listeners: dragMoveListeners,
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('move', function (event) {
  var interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
    var elem = event.currentTarget;
    while (elem && !elem.classList.contains("tree")) {
      elem = elem.parentNode;
    }
    if (elem) {
      const tree = elem.bernays.tree;
      const expr = tree.conclusion;
      const goal = { goal: expr, parent: tree.parent };

      const container = getContainer(elem);


      var x = 0;
      var y = container.offsetHeight-elem.offsetHeight;

      var current = elem;
      while (current !== container) {
        x += current.offsetLeft;
        y -= current.offsetTop;
        current = current.offsetParent;
      }

      updateSubtree(tree.parent, tree, goal);
      tree.parent = null;

      updateUndischargedAssumptions(tree);

      const goalDiv = goalToHTML(goal);
      elem.parentNode.replaceChild(goalDiv, elem);

      const newDiv = treeToHTML(tree);
      newDiv.classList.add("main");

      container.appendChild(newDiv);

      newDiv.setAttribute('data-x', x);
      newDiv.setAttribute('data-y', y);
      newDiv.style.left = x + 'px';
      newDiv.style.bottom = y + 'px';

      interaction.start({ name: 'drag' }, event.interactable, newDiv);
    }
  }
});

interact('.bernays .assumption').on('doubletap', function (event) {
  const assumptionTree = event.target.bernays.tree;
  const expr = assumptionTree.assumption;
  const goalTree = { goal: expr, parent: assumptionTree.parent };
  const goalDiv = goalToHTML(goalTree);
  updateSubtree(assumptionTree.parent, assumptionTree, goalTree);
  event.target.parentNode.replaceChild(goalDiv, event.target);
});

interact('.bernays .goal:not(.current .goal)').dropzone({
  accept: '.main.tree, .main.assumption',
  overload: 0.6,
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
    const dropGoal = event.target.bernays.tree.goal;

    if (event.relatedTarget.classList.contains("tree")) {
      const dragTree = event.relatedTarget.bernays.tree;
      
      const replacements = fuse(dropGoal, dragTree.conclusion);
      if (replacements) {
        
        function update(repls) {
          const newSubtree = replaceInTree(dragTree, repls);
          setParents(newSubtree);
          const parentTree = event.target.bernays.tree.parent;
          if (parentTree) {
            updateSubtree(parentTree, event.target.bernays.tree, newSubtree);
          }
          const newDiv = treeToHTML(newSubtree);
          const contextDiv = event.target.parentNode;
          const x = parseFloat(event.target.getAttribute('data-x')) || 0;
          const y = parseFloat(event.target.getAttribute('data-y')) || 0;
          event.relatedTarget.remove();
          event.target.remove();
          contextDiv.appendChild(newDiv);
          if (!parentTree) {
            newDiv.classList.add("main");
            newDiv.setAttribute('data-x', x);
            newDiv.setAttribute('data-y', y);
            newDiv.style.left = x + 'px';
            newDiv.style.bottom = y + 'px';
          }
        }

        const freeVars = freeMetaVariablesInTree(dragTree);
        for (const handled in replacements) {
          freeVars.delete(handled);
        }
        if (freeVars.size > 0) {
          const container = getContainer(event.target);
          const dialog = replacementsDialogHTML(dragTree, replacements, freeVars, function(repls) {
            dialog.remove();
            container.bernays.hideModal();
            update(repls);
          });
          container.bernays.showModal();
          container.appendChild(dialog);
          dialog.bernays.initFocus();
        }
        else {
          update(replacements);
        }
      }
      else {
        event.target.classList.remove("over");
      }
    }
    else {
      const dragExpr = event.relatedTarget.bernays.expr;

      if (!event.relatedTarget.bernays.scopeDiv.contains(event.target) || !exprEqual(dragExpr, dropGoal)) {
        event.target.classList.remove("over");
        return;
      }
      
      const tree = event.target.bernays.tree;
      const contextDiv = event.target.parentNode;
      const parentTree = tree.parent;
      console.assert(parentTree, "Parent of discharged goal was not set.");
      const assumptionTree = { assumption: dragExpr, parent: parentTree };
      updateSubtree(parentTree, tree, assumptionTree);
      const assumptionDiv = assumptionToHTML(assumptionTree);
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
  overload: 0.6,
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
  var interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {
    const elem = treeToHTML(ruleToTree(event.currentTarget.bernays.rule));
    elem.classList.add("main");
    const container = getContainer(event.currentTarget);
    container.appendChild(elem);

    const y = container.offsetHeight - event.currentTarget.offsetTop - event.currentTarget.offsetHeight;
    const x = event.currentTarget.offsetLeft + (event.currentTarget.offsetWidth - elem.offsetWidth) / 2;

    elem.setAttribute('data-x', x)
    elem.setAttribute('data-y', y)
    
    elem.style.left = x + "px";
    elem.style.bottom = y + "px";

    interaction.start({ name: 'drag' }, event.interactable, elem);
  }
});

interact('.bernays :not(.current) .discharge').draggable({
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
  modifiers: dragMoveModifiers,
  autoScroll: true
}).on('move', function (event) {
  var interaction = event.interaction;
  if (interaction.pointerIsDown && !interaction.interacting()) {

    const elem = assumptionToHTML({ assumption: event.currentTarget.bernays.expr });
    elem.bernays = event.currentTarget.bernays;
    elem.classList.add("main");

    elem.bernays.scopeDiv.classList.add("active-scope");
    elem.bernays.treeDiv.classList.add("has-current");

    var treeDiv = event.currentTarget.bernays.treeDiv;
    treeDiv.appendChild(elem);

    const y = treeDiv.offsetHeight - event.currentTarget.offsetTop - event.currentTarget.offsetHeight;
    const x = event.currentTarget.offsetLeft + (event.currentTarget.offsetWidth - elem.offsetWidth) / 2;

    elem.setAttribute('data-x', x)
    elem.setAttribute('data-y', y)
    
    elem.style.left = x + "px";
    elem.style.bottom = y + "px";

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
  });
  container.appendChild(dialogDiv);
  dialogDiv.bernays.initFocus();
});

const containers = document.getElementsByClassName("bernays");

for (const container of containers) {
  initUI(container);
}

