import {replace, freeMetaVariables, metaVariable, exprEqual, unify} from './Expr.js';

export function withoutParents(tree) {
  if ('goal' in tree) {
    return { goal: tree.goal };
  }
  if ('assumption' in tree) {
    return { assumption: tree.assumption };
  }

  return {
    rule: tree.rule,
    conclusion: tree.conclusion,
    hypotheses: tree.hypotheses.map(withoutParents),
    discharge: tree.discharge
  };
}

export function setParents(tree) {
  if (!('hypotheses' in tree)) {
    return;
  }
  tree.hypotheses.forEach(function(subtree) {
    subtree.parent = tree;
    setParents(subtree);
  });
}

export function replaceInTree(tree, replacements) {
  if ('goal' in tree) {
    return { goal: replace(tree.goal, replacements) };
  }
  if ('assumption' in tree) {
    return { assumption: replace(tree.assumption, replacements) };
  }

  return {
    rule: tree.rule,
    conclusion: replace(tree.conclusion, replacements),
    hypotheses: tree.hypotheses.map(function(hypothesis) {
      return replaceInTree(hypothesis, replacements);
    }),
    discharge: replace(tree.discharge, replacements)
  };
}

export function updateSubtree(tree, old_subtree, new_subtree) {
  if (!('hypotheses' in tree)) {
    return;
  }
  for (let i = 0; i < tree.hypotheses.length; i++) {
    if (tree.hypotheses[i] === old_subtree) {
      tree.hypotheses[i] = new_subtree;
      new_subtree.parent = tree;
    }
  }
}

export function updateUndischargedAssumptions(tree) {
  function go(tree, exprs) {
    if ('assumption' in tree) {
      return;
    }
    else if ('goal' in tree) {
      return;
    }
    else {
      let newExprs = exprs;
      if (tree.discharge) {
        newExprs = newExprs.slice();
        newExprs.push(tree.discharge);
      }
      for (let i = 0; i < tree.hypotheses.length; i++) {
        go(tree.hypotheses[i], newExprs);
        if ('assumption' in tree.hypotheses[i]) {
          let ok = false;
          const assumption = tree.hypotheses[i].assumption;
          for (const expr of newExprs) {
            if (exprEqual(expr, assumption)) {
              ok = true;
              break;
            }
          }
          if (!ok) {
            tree.hypotheses[i] = { goal: assumption, parent: tree };
          }
        }
      }
    }
  }

  go(tree, []);
}

export function freeMetaVariablesInTree(tree) {

  const res = new Set([]);

  function go(subtree) {
    if ('goal' in subtree) {
      const extras = freeMetaVariables(subtree.goal);
      for (const extra of extras) {
        res.add(extra);
      }
    }
    else if ('assumption' in subtree) {
      const extras = freeMetaVariables(subtree.assumption);
      for (const extra of extras) {
        res.add(extra);
      }
    }
    else {
      const extras = freeMetaVariables(subtree.conclusion);
      for (const extra of extras) {
        res.add(extra);
      }

      if (subtree.discharge) {
        const dischargeExtras = freeMetaVariables(subtree.discharge);
        for (const dischargeExtra of dischargeExtras) {
          res.add(dischargeExtra);
        }
      }

      for (const hypothesis of subtree.hypotheses) {
        go(hypothesis);
      }
    }
  }

  go(tree);
  return res;
}

function nextName(name) {
  if (name === 'Z') {
    return 'X1';
  }
  else if (name.length === 1) {
    return String.fromCharCode(name.charCodeAt(0) + 1);
  }
  else {
    const number = parseInt(name.slice(1));
    return name.slice(0, 1) + (number + 1);
  }
}

function freshenMetaVariablesInTree(tree, otherTree) {
  const treeMetaVars = freeMetaVariablesInTree(tree);
  const otherTreeMetaVars = freeMetaVariablesInTree(otherTree);
  const conflicts = new Set([]);
  const used = new Set(otherTreeMetaVars);
  for (const treeMetaVar of treeMetaVars) {
    if (otherTreeMetaVars.has(treeMetaVar)) {
      conflicts.add(treeMetaVar);
    }
    used.add(treeMetaVar);
  }
  const replacements = {};
  var next = "A";
  for (const conflict of conflicts) {
    while (used.has(next)) {
      next = nextName(next);
    }
    replacements[conflict] = metaVariable(next);
    used.add(next);
  }

  return replaceInTree(tree, replacements);
}

export function mergeWithGoal(tree, goal) {
  let goalTree = goal;
  while (goalTree.parent) {
    goalTree = goalTree.parent;
  }

  // We do not want to rename metavariables in case of an assumption,
  // as the assumption comes from the same namespace.
  const renamedTree = 'assumption' in tree ? tree : freshenMetaVariablesInTree(tree, goalTree);
  const goalExpr = goal.goal;
  let renamedTreeExpr;
  if ('goal' in renamedTree) {
    renamedTreeExpr = renamedTree.goal;
  }
  else if ('assumption' in renamedTree) {
    renamedTreeExpr = renamedTree.assumption;
  }
  else {
    renamedTreeExpr = renamedTree.conclusion;
  }

  // We use a different order in the case of assumptions
  // to preserve the name of metavariables in the assumption if possible.
  const unifier = 'assumption' in tree ? 
    unify(goalExpr, renamedTreeExpr) :
    unify(renamedTreeExpr, goalExpr);
  if (unifier === null) {
    return null;
  }
  return [renamedTree, goal, goalTree, unifier];
}

export function finalizeMergeWithGoal(savedValues) {
  let [renamedTree, goal, goalTree, unifier] = savedValues;

  let newTree;
  if (goal.parent) {
    updateSubtree(goal.parent, goal, renamedTree);
    newTree = replaceInTree(goalTree, unifier);
  }
  else {
    newTree = replaceInTree(renamedTree, unifier);
  }

  setParents(newTree);
  return newTree;
}

export function ruleToTree(rule) {
  const tree = {
    rule: rule,
    conclusion:rule.conclusion,
    hypotheses: rule.hypotheses.map(function(h) { return { goal: h }; }),
    discharge: rule.discharge
  };
  setParents(tree);
  return tree;
}

export function getRoot(tree) {
  let res = tree;
  while ('parent' in res) {
    res = res.parent;
  }
  return res;
}

export function getContextDischarges(tree) {
  let current = tree;
  const res = [];
  while ('parent' in current) {
    current = current.parent;
    if (current.discharge) {
      res.push(current.discharge);
    }
  }
  return res;
}