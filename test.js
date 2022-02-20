import {constant, and, or, implies, not, variable, fuse, replace, freeVariables, exprEqual} from './Expr.js';
import {tokenize} from './Tokenizer.js';
import {parse} from './Parser.js';
import {pretty} from './Printer.js';
import {trueI, falseE, notI, notE, andI, andE1, andE2, orI1, orI2, implI, implE, notNotE, tnd, rules} from './Rules.js';
import {setParents, replaceInTree, freeVariablesInTree, updateSubtree, ruleToTree, getContextDischarges} from './Trees.js'; 
import {goalToHTML, assumptionToHTML, treeToHTML} from './Render.js';
import {initUI, exprInputHTML} from './UI.js';

const container = document.getElementById("bernays");

const UI = initUI(container);

function replacementsDialogHTML(tree, done, missing, onValidate, onCancel) {
  const replDiv = document.createElement("div");
  replDiv.classList.add("dialog");

  const tableElem = document.createElement("table");
  replDiv.appendChild(tableElem);

  for (const key in done) {
    const rowElem = document.createElement("tr");
    rowElem.classList.add("done");

    const varElem = document.createElement("td");
    varElem.classList.add("var");
    varElem.appendChild(document.createTextNode(key));
    rowElem.appendChild(varElem);

    const toElem = document.createElement("td");
    toElem.classList.add("var");
    toElem.appendChild(document.createTextNode("↦"));
    rowElem.appendChild(toElem);

    const exprElem = document.createElement("td");
    exprElem.classList.add("expr");
    exprElem.appendChild(document.createTextNode(pretty(done[key])));
    rowElem.appendChild(exprElem);

    tableElem.appendChild(rowElem);
  }

  const exprInputs = [];

  missing.forEach(function(varName) {
    const rowElem = document.createElement("tr");
    rowElem.classList.add("done");

    const varElem = document.createElement("td");
    varElem.classList.add("var");
    varElem.appendChild(document.createTextNode(varName));
    rowElem.appendChild(varElem);

    const toElem = document.createElement("td");
    toElem.classList.add("var");
    toElem.appendChild(document.createTextNode("↦"));
    rowElem.appendChild(toElem);

    const exprElem = document.createElement("td");
    exprElem.classList.add("expr");

    const exprInput = exprInputHTML(variable(varName));
    exprInputs.push([varName, exprInput]);

    exprElem.appendChild(exprInput);
    rowElem.appendChild(exprElem);
    tableElem.appendChild(rowElem);
  });

  const controlsDiv = document.createElement("div");
  controlsDiv.classList.add("controls");

  const confirmButton = document.createElement("a");
  confirmButton.classList.add("confirm");
  confirmButton.appendChild(document.createTextNode("Appliquer"));
  confirmButton.addEventListener("click", function(event) {
    const newReplacements = {};

    for (const [key, exprInput] of exprInputs) {
      if (!exprInput.bernays.is_valid) {
        exprInput.focus();
        return;
      }
      newReplacements[key] = exprInput.bernays.expr;
    }

    for (const key in done) {
      newReplacements[key] = done[key];
    }
    
    onValidate(newReplacements);
  });

  controlsDiv.appendChild(confirmButton);
  replDiv.appendChild(controlsDiv);

  return replDiv;
}

function addGoal(expr) {
  const exDiv = goalToHTML({ goal: expr });
  exDiv.classList.add("main", "draggable");
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

const dragMoveModifiers = [];

interact('.bernays .draggable').draggable({
  listeners: dragMoveListeners,
  modifiers: dragMoveModifiers,
  autoScroll: true
});

interact('.bernays .goal:not(.current .goal)').dropzone({
  accept: '.main.tree',
  overload: 0.6,
  ondropactivate(event) {
    const dragTree = event.relatedTarget.bernays.tree;
    const dropGoal = event.target.bernays.tree.goal;
    if(fuse(dropGoal, dragTree.conclusion)) {
      event.target.classList.add("active");
    }
  },
  ondragenter(event) {
    event.target.classList.add("over");
  },
  ondrop(event) {
    const dragTree = event.relatedTarget.bernays.tree;
    const dropGoal = event.target.bernays.tree.goal;
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
          newDiv.classList.add("main", "draggable");
          newDiv.setAttribute('data-x', x);
          newDiv.setAttribute('data-y', y);
          newDiv.style.left = x + 'px';
          newDiv.style.bottom = y + 'px';
        }
      }

      const freeVars = freeVariablesInTree(dragTree);
      for (const handled in replacements) {
        freeVars.delete(handled);
      }
      if (freeVars.size > 0) {
        const dialog = replacementsDialogHTML(dragTree, replacements, freeVars, function(repls) {
          dialog.remove();
          UI.hideModal();
          update(repls);
        });
        UI.showModal();
        container.appendChild(dialog);
      }
      else {
        update(replacements);
      }
    }
    else {
      event.target.classList.remove("over");
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
    elem.classList.add("main", "draggable");
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

interact('.bernays .goal').on('doubletap', function(event) {
  const tree = event.target.bernays.tree;
  const discharges = getContextDischarges(tree);
  for (const discharge of discharges) {
    if (exprEqual(discharge, tree.goal)) {
      const contextDiv = event.target.parentNode;
      const parentTree = tree.parent;
      console.assert(parentTree, "Parent of discharged goal was not set.");
      const assumptionTree = { assumption: tree.goal, parent: parentTree };
      replaceInTree(parentTree, tree, assumptionTree);
      const assumptionDiv = assumptionToHTML(assumptionTree);
      event.target.remove();
      contextDiv.appendChild(assumptionDiv);
      break;
    }
  }
});

function getParameter(name) {
    var res = null;
    location.search
      .substr(1)
      .split("&")
      .forEach(function(item) {
        const parts = item.split("=");
        if (parts[0] === name) {
          res = decodeURIComponent(parts[1]);
        }
      });
    return res;
}

const goalExpr = getParameter('goal');
if (goalExpr) {
  addGoal(parse(tokenize(goalExpr)));
}


