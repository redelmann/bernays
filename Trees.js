import {replace, freeVariables} from './Expr.js';

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
    discharges: tree.discharges.map(function(expr) {
      return replace(expr, replacements);
    })
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

export function freeVariablesInTree(tree) {

  const res = new Set([])

  function go(subtree) {
    if ('goal' in subtree) {
      const extras = freeVariables(subtree.goal);
      for (const extra of extras) {
        res.add(extra);
      }
    }
    else if ('assumption' in subtree) {
      const extras = freeVariables(subtree.assumption);
      for (const extra of extras) {
        res.add(extra);
      }
    }
    else {
      const extras = freeVariables(subtree.conclusion);
      for (const extra of extras) {
        res.add(extra);
      }

      for (const expr of subtree.discharges) {
        const exprExtras = freeVariables(expr);
        for (const exprExtra of exprExtras) {
          res.add(exprExtra);
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

export function ruleToTree(rule) {
  const tree = {
    rule: rule,
    conclusion:rule.conclusion,
    hypotheses: rule.hypotheses.map(function(h) { return { goal: h }; }),
    discharges: rule.discharges.map(function(x) { return x; })
  };
  setParents(tree);
  return tree;
}

export function getRoot(tree) {
  var res = tree;
  while ('parent' in res) {
    res = res.parent;
  }
  return res;
}

export function getContextDischarges(tree) {
  var current = tree;
  const res = [];
  while ('parent' in current) {
    current = current.parent;
    for (const discharge of current.discharges) {
      res.push(discharge);
    }
  }
  return res;
}