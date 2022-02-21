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