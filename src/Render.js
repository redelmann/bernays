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


import {metaVariable} from './Expr.js';
import {tokenize} from './Tokenizer.js';
import {parse} from './Parser.js';
import {pretty, verbosePrettyHTML} from './Printer.js';
import {_} from './Lang.js';
import {snapshot} from './Undo.js';
import {getContainer, closeContextualMenu, moveMainDiv, playSound} from './Utils.js';
import {freeMetaVariablesInTree, replaceInTree, setParents} from './Trees.js';
import {addState, clearState} from './State.js';

export function goalToHTML(subtree, is_interactive) {
  const goalDiv = document.createElement('div');
  if (is_interactive) {
    goalDiv.classList.add('interactive');
  }
  goalDiv.classList.add("goal", "alt-detach");
  const leftPad = document.createElement('span');
  leftPad.appendChild(document.createTextNode('['));
  leftPad.classList.add('pad');
  const rightPad = document.createElement('span');
  rightPad.appendChild(document.createTextNode(']'));
  rightPad.classList.add('pad');

  goalDiv.appendChild(leftPad);
  goalDiv.appendChild(verbosePrettyHTML(subtree.goal));
  goalDiv.appendChild(rightPad);
  goalDiv.bernays = { tree: subtree };
  return goalDiv;
}

export function assumptionToHTML(subtree, is_interactive) {
  const assumptionDiv = document.createElement('div');
  if (is_interactive) {
    assumptionDiv.classList.add('interactive');
  }
  assumptionDiv.classList.add("assumption", "alt-detach");
  const leftPad = document.createElement('span');
  leftPad.appendChild(document.createTextNode('['));
  const rightPad = document.createElement('span');
  rightPad.appendChild(document.createTextNode(']'));
  assumptionDiv.appendChild(leftPad);
  assumptionDiv.appendChild(verbosePrettyHTML(subtree.assumption));
  assumptionDiv.appendChild(rightPad);
  assumptionDiv.bernays = { tree: subtree };
  return assumptionDiv;
}

export function treeToHTML(tree, is_interactive) {
  const treeDiv = document.createElement('div');
  treeDiv.classList.add("tree");
  treeDiv.bernays = { tree: tree };

  const hypothesesDiv = document.createElement('div');
  hypothesesDiv.classList.add("hypotheses");
  treeDiv.appendChild(hypothesesDiv);

  tree.hypotheses.forEach(function(subtree) {
    const hypothesisDiv = document.createElement('div');
    hypothesisDiv.classList.add("hypothesis");
    if ('goal' in subtree) {
      const goalDiv = goalToHTML(subtree, is_interactive);
      hypothesisDiv.appendChild(goalDiv);
    }
    else if ('assumption' in subtree) {
      const assumptionDiv = assumptionToHTML(subtree, is_interactive);
      hypothesisDiv.appendChild(assumptionDiv);
    }
    else {
      hypothesisDiv.appendChild(treeToHTML(subtree, is_interactive));
    }
    hypothesesDiv.appendChild(hypothesisDiv);
  });

  const middleDiv = document.createElement('div');
  middleDiv.classList.add("middle");
  treeDiv.appendChild(middleDiv);

  const nameDiv = document.createElement('div');
  nameDiv.classList.add("name", "alt-detach");
  nameDiv.appendChild(document.createTextNode(tree.rule.name));
  if (is_interactive) {
    nameDiv.classList.add('interactive');
  }
  middleDiv.appendChild(nameDiv);

  const barDiv = document.createElement('div');
  barDiv.classList.add("bar", "alt-detach");
  if (is_interactive) {
    barDiv.classList.add('interactive');
  }
  middleDiv.appendChild(barDiv);

  if (tree.discharge) {
    treeDiv.classList.add("has-discharge");
    const dischargeDiv = document.createElement('div');
    dischargeDiv.classList.add("discharge");
    if (is_interactive) {
      dischargeDiv.classList.add('interactive');
    }

    dischargeDiv.bernays = { expr: tree.discharge, scopeDiv: hypothesesDiv, treeDiv: treeDiv };
    const iconDiv = document.createElement("i");
    iconDiv.classList.add("fa", "fa-star-o");
    dischargeDiv.appendChild(iconDiv);
    middleDiv.appendChild(dischargeDiv);
  }

  const conclusionDiv = document.createElement('div');
  conclusionDiv.classList.add("conclusion", "alt-detach");
  if (is_interactive) {
    conclusionDiv.classList.add('interactive');
  }

  const leftPad = document.createElement('span');
  leftPad.appendChild(document.createTextNode('['));
  leftPad.classList.add('pad');
  const rightPad = document.createElement('span');
  rightPad.appendChild(document.createTextNode(']'));
  rightPad.classList.add('pad');

  const conclusionInnerDiv = document.createElement('div');

  conclusionInnerDiv.appendChild(leftPad);
  conclusionInnerDiv.appendChild(verbosePrettyHTML(tree.conclusion));
  conclusionInnerDiv.appendChild(rightPad);

  conclusionDiv.appendChild(conclusionInnerDiv);
  treeDiv.appendChild(conclusionDiv);

  return treeDiv;
}

export function newGoalDialogHTML(onValidate, onCancel) {
  const dialogDiv = document.createElement("div");
  dialogDiv.classList.add("dialog");

  const titleElem = document.createElement("h1");
  titleElem.appendChild(document.createTextNode(_("new-goal")));
  dialogDiv.appendChild(titleElem);

  const exprInput = exprInputHTML();
  dialogDiv.appendChild(exprInput);

  dialogDiv.bernays = { initFocus() { exprInput.focus(); } };

  const controlsDiv = document.createElement("div");
  controlsDiv.classList.add("controls");

  const cancelButton = document.createElement("a");
  cancelButton.classList.add("cancel");
  cancelButton.appendChild(document.createTextNode(_("cancel")));
  cancelButton.addEventListener("click", function() {
    onCancel();
  });
  controlsDiv.appendChild(cancelButton);

  function checkDone() {
    if (!exprInput.bernays.is_valid) {
      exprInput.focus();
      return;
    }
    
    onValidate(exprInput.bernays.expr);
  }

  const confirmButton = document.createElement("a");
  confirmButton.classList.add("confirm");
  confirmButton.appendChild(document.createTextNode(_("add")));
  confirmButton.addEventListener("click", checkDone);
  controlsDiv.appendChild(confirmButton);

  dialogDiv.appendChild(controlsDiv);

  exprInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      checkDone(event);
    }
  });

  return dialogDiv;
}

export function newAxiomDialogHTML(onValidate, onCancel) {
  const dialogDiv = document.createElement("div");
  dialogDiv.classList.add("dialog");

  const titleElem = document.createElement("h1");
  titleElem.appendChild(document.createTextNode(_("new-axiom")));
  dialogDiv.appendChild(titleElem);

  const exprInput = exprInputHTML();
  dialogDiv.appendChild(exprInput);

  dialogDiv.bernays = { initFocus() { exprInput.focus(); } };

  const controlsDiv = document.createElement("div");
  controlsDiv.classList.add("controls");

  const cancelButton = document.createElement("a");
  cancelButton.classList.add("cancel");
  cancelButton.appendChild(document.createTextNode(_("cancel")));
  cancelButton.addEventListener("click", function() {
    onCancel();
  });
  controlsDiv.appendChild(cancelButton);

  function checkDone() {
    if (!exprInput.bernays.is_valid) {
      exprInput.focus();
      return;
    }
    
    onValidate(exprInput.bernays.expr);
  }

  const confirmButton = document.createElement("a");
  confirmButton.classList.add("confirm");
  confirmButton.appendChild(document.createTextNode(_("add")));
  confirmButton.addEventListener("click", checkDone);
  controlsDiv.appendChild(confirmButton);

  dialogDiv.appendChild(controlsDiv);

  exprInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      checkDone(event);
    }
  });

  return dialogDiv;
}

export function replacementsDialogHTML(metaVariables, onValidate, onCancel) {

  const replDiv = document.createElement("div");
  replDiv.classList.add("dialog");

  const titleElem = document.createElement("h1");
  titleElem.appendChild(document.createTextNode(_("specialize")));
  replDiv.appendChild(titleElem);

  const tableElem = document.createElement("table");
  replDiv.appendChild(tableElem);

  const exprInputs = [];

  metaVariables.forEach(function(varName) {
    const rowElem = document.createElement("tr");
    rowElem.classList.add("done");

    const varElem = document.createElement("td");
    varElem.classList.add("var");
    varElem.appendChild(verbosePrettyHTML(metaVariable(varName)));
    rowElem.appendChild(varElem);

    const toElem = document.createElement("td");
    toElem.classList.add("to");
    toElem.appendChild(document.createTextNode("↦"));
    rowElem.appendChild(toElem);

    const exprElem = document.createElement("td");
    exprElem.classList.add("value");

    const exprInput = exprInputHTML(metaVariable(varName));
    exprInputs.push([varName, exprInput]);

    exprElem.appendChild(exprInput);
    rowElem.appendChild(exprElem);
    tableElem.appendChild(rowElem);
  });

  replDiv.bernays = { initFocus() { exprInputs[0][1].select(); } };

  const controlsDiv = document.createElement("div");
  controlsDiv.classList.add("controls");

  const cancelButton = document.createElement("a");
  cancelButton.classList.add("cancel");
  cancelButton.appendChild(document.createTextNode(_("cancel")));
  cancelButton.addEventListener("click", function() {
    onCancel();
  });
  controlsDiv.appendChild(cancelButton);

  function checkDone() {
    const newReplacements = {};

    for (const [key, exprInput] of exprInputs) {
      if (!exprInput.bernays.is_valid) {
        exprInput.focus();
        return;
      }
      newReplacements[key] = exprInput.bernays.expr;
    }
    
    onValidate(newReplacements);
  }

  const confirmButton = document.createElement("a");
  confirmButton.classList.add("confirm");
  confirmButton.appendChild(document.createTextNode(_("apply")));
  confirmButton.addEventListener("click", checkDone);

  controlsDiv.appendChild(confirmButton);
  replDiv.appendChild(controlsDiv);

  for (let i = 0; i < exprInputs.length - 1; i++) {
    const exprInput = exprInputs[i][1];
    const nextExprInput = exprInputs[i + 1][1];

    exprInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        if (exprInput.bernays.is_valid) {
          nextExprInput.select();
        }
      }
    });
  }

  const lastExprInput = exprInputs[exprInputs.length - 1][1];
  lastExprInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      checkDone(event);
    }
  });

  return replDiv;
}

export function exprInputHTML(defaultExpr) {
  const exprInput = document.createElement("input");
  exprInput.classList.add("expr-input");
  exprInput.setAttribute("type", "text");
  if (defaultExpr) {
    exprInput.setAttribute("value", pretty(defaultExpr));
    exprInput.bernays = { expr: defaultExpr, is_valid: true };
  }
  else {
    exprInput.setAttribute("value", "");
    exprInput.bernays = { expr: null, is_valid: false };
  }
  exprInput.addEventListener("change", function() {
    try {
      const tokens = tokenize(exprInput.value);
      const expr = parse(tokens);
      exprInput.bernays.expr = expr;
      exprInput.bernays.is_valid = true;
      exprInput.classList.remove("invalid");
    } catch {
      exprInput.bernays.is_valid = false;
      exprInput.classList.add("invalid");
    }
  });
  exprInput.addEventListener("input", function() {
    exprInput.classList.remove("invalid");
  });
  return exprInput;
}

export function aboutDialogHTML(onClose) {
  const aboutDiv = document.createElement("div");
  aboutDiv.classList.add("dialog");

  const titleElem = document.createElement("h1");
  titleElem.appendChild(document.createTextNode(_("about")));
  aboutDiv.appendChild(titleElem);

  const textElem = document.createElement("p");
  textElem.appendChild(document.createTextNode(_("about_text")));
  aboutDiv.appendChild(textElem);

  const creditsElem = document.createElement("p");
  creditsElem.appendChild(document.createTextNode(_("about_credits")));
  aboutDiv.appendChild(creditsElem);

  const licenseElem = document.createElement("p");
  licenseElem.appendChild(document.createTextNode(_("about_license")));
  licenseElem.appendChild(document.createTextNode(" "));

  const linkToRepoElem = document.createElement("a");
  linkToRepoElem.setAttribute("href", "https://github.com/redelmann/bernays");
  linkToRepoElem.setAttribute("target", "_blank");
  linkToRepoElem.appendChild(document.createTextNode(_("about_source")));

  licenseElem.appendChild(linkToRepoElem);
  aboutDiv.appendChild(licenseElem);

  const controlsDiv = document.createElement("div");
  controlsDiv.classList.add("controls");

  const closeButton = document.createElement("a");
  closeButton.classList.add("cancel");
  closeButton.appendChild(document.createTextNode(_("close")));
  closeButton.addEventListener("click", function() {
    onClose();
  });
  controlsDiv.appendChild(closeButton);
  aboutDiv.appendChild(controlsDiv);

  return aboutDiv;
}

export function treeContextualMenuHTML(mainDiv) {
  const menuDiv = document.createElement("div");
  menuDiv.id = 'bernays-contextual-menu';
  menuDiv.classList.add("contextual-menu");

  const container = getContainer(mainDiv);
  const tree = mainDiv.bernays.tree;
  const freeMetaVariables = freeMetaVariablesInTree(tree);

  const specializeItem = document.createElement("a");
  specializeItem.appendChild(document.createTextNode(_("specialize") + "…"));
  if (freeMetaVariables.size === 0) {
    specializeItem.classList.add("disabled");
  }
  else {
    specializeItem.addEventListener("click", function () {
      closeContextualMenu();
      container.bernays.showModal();
      const dialogDiv = replacementsDialogHTML(freeMetaVariables, function(replacements) {
        snapshot(container);
        dialogDiv.remove();
        container.bernays.hideModal();
        let x = parseFloat(mainDiv.getAttribute('data-x')) || 0;
        const y = parseFloat(mainDiv.getAttribute('data-y')) || 0;
        const newTree = replaceInTree(tree, replacements);
        setParents(newTree);
        const newDiv = "goal" in newTree ? goalToHTML(newTree, true) : treeToHTML(newTree, true);
        newDiv.classList.add("main");
        x += mainDiv.offsetWidth / 2;
        mainDiv.remove();
        container.appendChild(newDiv);
        x -= newDiv.offsetWidth / 2;
        moveMainDiv(newDiv, x, y);
      }, function () {
        dialogDiv.remove();
        container.bernays.hideModal();
      });
      container.appendChild(dialogDiv);
      dialogDiv.bernays.initFocus();
    });
  }
  menuDiv.appendChild(specializeItem);

  menuDiv.appendChild(document.createElement("hr"));

  const deleteItem = document.createElement("a");
  deleteItem.appendChild(document.createTextNode(_("delete")));
  deleteItem.addEventListener("click", function () {
    snapshot(container);
    mainDiv.remove();
    playSound('woosh');
    closeContextualMenu();
  });
  menuDiv.appendChild(deleteItem);

  return menuDiv;
}

export function containerContextualMenuHTML(container) {
  const menuDiv = document.createElement("div");
  menuDiv.id = 'bernays-contextual-menu';
  menuDiv.classList.add("contextual-menu");

  const resetItem = document.createElement("a");
  resetItem.appendChild(document.createTextNode(_("reset")));
  resetItem.addEventListener("click", function () {
    snapshot(container);
    clearState(container);
    if(container.bernays.initState) {
      addState(container, container.bernays.initState);
    }
    playSound('woosh');
    closeContextualMenu();
  });
  menuDiv.appendChild(resetItem);
  return menuDiv;
}