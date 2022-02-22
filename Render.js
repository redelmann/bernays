import {metaVariable} from './Expr.js';
import {tokenize} from './Tokenizer.js';
import {parse, ParseError} from './Parser.js';
import {pretty} from './Printer.js';

export function goalToHTML(subtree) {
  const goalDiv = document.createElement('div');
  goalDiv.classList.add("goal");
  const leftPad = document.createElement('span');
  leftPad.appendChild(document.createTextNode('['));
  leftPad.classList.add('pad');
  const rightPad = document.createElement('span');
  rightPad.appendChild(document.createTextNode(']'));
  rightPad.classList.add('pad');

  goalDiv.appendChild(leftPad);
  goalDiv.appendChild(document.createTextNode(pretty(subtree.goal)));
  goalDiv.appendChild(rightPad);
  goalDiv.bernays = { tree: subtree };
  return goalDiv;
}

export function assumptionToHTML(subtree) {
  const assumptionDiv = document.createElement('div');
  assumptionDiv.classList.add("assumption");
  assumptionDiv.appendChild(document.createTextNode("[" + pretty(subtree.assumption) + "]"));
  assumptionDiv.bernays = { tree: subtree };
  return assumptionDiv;
}

export function treeToHTML(tree) {
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
      const goalDiv = goalToHTML(subtree);
      hypothesisDiv.appendChild(goalDiv);
    }
    else if ('assumption' in subtree) {
      const assumptionDiv = assumptionToHTML(subtree);
      hypothesisDiv.appendChild(assumptionDiv);
    }
    else {
      hypothesisDiv.appendChild(treeToHTML(subtree));
    }
    hypothesesDiv.appendChild(hypothesisDiv);
  })

  const middleDiv = document.createElement('div');
  middleDiv.classList.add("middle");
  treeDiv.appendChild(middleDiv);

  const nameDiv = document.createElement('div');
  nameDiv.classList.add("name");
  nameDiv.appendChild(document.createTextNode(tree.rule.name));
  middleDiv.appendChild(nameDiv);

  const barDiv = document.createElement('div');
  barDiv.classList.add("bar");
  middleDiv.appendChild(barDiv);

  if (tree.discharge) {
    treeDiv.classList.add("has-discharge");
    const dischargeDiv = document.createElement('div');
    dischargeDiv.classList.add("discharge");

    dischargeDiv.bernays = { expr: tree.discharge, scopeDiv: hypothesesDiv, treeDiv: treeDiv };
    const iconDiv = document.createElement("i");
    iconDiv.classList.add("fa", "fa-star-o");
    dischargeDiv.appendChild(iconDiv);
    middleDiv.appendChild(dischargeDiv);
  }

  const conclusionDiv = document.createElement('div');
  conclusionDiv.classList.add("conclusion");

  const conclusionInnerDiv = document.createElement('div');
  conclusionInnerDiv.appendChild(document.createTextNode(pretty(tree.conclusion)));

  conclusionDiv.appendChild(conclusionInnerDiv);
  treeDiv.appendChild(conclusionDiv);

  return treeDiv;
}

export function newGoalDialogHTML(onValidate, onCancel) {
  const dialogDiv = document.createElement("div");
  dialogDiv.classList.add("dialog");

  const exprInput = exprInputHTML();
  dialogDiv.appendChild(exprInput);

  dialogDiv.bernays = { initFocus() { exprInput.focus(); } };

  const controlsDiv = document.createElement("div");
  controlsDiv.classList.add("controls");

  const confirmButton = document.createElement("a");
  confirmButton.classList.add("confirm");
  confirmButton.appendChild(document.createTextNode("Ajouter"));
  confirmButton.addEventListener("click", function(event) {
    if (!exprInput.bernays.is_valid) {
      exprInput.focus();
      return;
    }
    
    onValidate(exprInput.bernays.expr);
  });

  controlsDiv.appendChild(confirmButton);
  dialogDiv.appendChild(controlsDiv);

  return dialogDiv;
}

export function replacementsDialogHTML(tree, done, missing, onValidate, onCancel) {
  
  const replDiv = document.createElement("div");
  replDiv.classList.add("dialog");

  const tableElem = document.createElement("table");
  replDiv.appendChild(tableElem);

  for (const key in done) {
    const rowElem = document.createElement("tr");
    rowElem.classList.add("done");

    const varElem = document.createElement("td");
    varElem.classList.add("var");
    varElem.appendChild(document.createTextNode(pretty(metaVariable(key))));
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
    varElem.appendChild(document.createTextNode(pretty(metaVariable(varName))));
    rowElem.appendChild(varElem);

    const toElem = document.createElement("td");
    toElem.classList.add("var");
    toElem.appendChild(document.createTextNode("↦"));
    rowElem.appendChild(toElem);

    const exprElem = document.createElement("td");
    exprElem.classList.add("expr");

    const exprInput = exprInputHTML(metaVariable(varName));
    exprInputs.push([varName, exprInput]);

    exprElem.appendChild(exprInput);
    rowElem.appendChild(exprElem);
    tableElem.appendChild(rowElem);
  });

  replDiv.bernays = { initFocus() { exprInputs[0][1].select(); } };

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
  exprInput.addEventListener("change", function(event) {
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
  exprInput.addEventListener("input", function(event) {
    exprInput.classList.remove("invalid");
  })
  return exprInput;
}