import {pretty} from './Printer.js';

export function goalToHTML(subtree) {
  const goalDiv = document.createElement('div');
  goalDiv.classList.add("goal");
  goalDiv.appendChild(document.createTextNode(pretty(subtree.goal)));
  goalDiv.bernays = { tree: subtree };
  return goalDiv;
}

export function assumptionToHTML(subtree) {
  const assumptionDiv = document.createElement('div');
  assumptionDiv.classList.add("assumption");
  assumptionDiv.appendChild(document.createTextNode("[" + pretty(subtree.assumption) + "]"));
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

  const conclusionDiv = document.createElement('div');
  conclusionDiv.classList.add("conclusion");
  conclusionDiv.appendChild(document.createTextNode(pretty(tree.conclusion)));
  treeDiv.appendChild(conclusionDiv);

  return treeDiv;
}