
export const Variable = "Variable";
export const MetaVariable = "MetaVariable";
export const Constant = "Constant";
export const And = "And";
export const Or = "Or";
export const Implies = "Implies";
export const Not = "Not";
export const Iff = "Iff";

export function exprEqual(left, right) {
  if (left.kind !== right.kind) {
    return false;
  }
  switch (left.kind) {
    case "Variable": {
      return left.name === right.name;
    }
    case "MetaVariable": {
      return left.name === right.name;
    }
    case "Constant": {
      return left.value === right.value;
    }
    case "Not": {
      return exprEqual(left.inner, right.inner);
    }
    default: {
      return exprEqual(left.left, right.left) &&
             exprEqual(left.right, right.right);
    }
  }
}

export function variable(name) {
  return { kind: Variable, name: name };
}

export function metaVariable(name) {
  return { kind: MetaVariable, name: name };
}

export function constant(value) {
  return { kind: Constant, value: value };
}

export function and(left, right) {
  return { kind: And, left: left, right: right };
}

export function ands(exprs) {
  const es = exprs.slice();
  if (es.length == 0) {
    throw new Error("ands: exprs is empty.");
  }
  while (es.length > 1) {
    const right = es.pop();
    const left = es.pop();
    es.push(and(left, right));
  }
  return es[0];
}

export function or(left, right) {
  return { kind: Or, left: left, right: right };
}

export function ors(exprs) {
  const es = exprs.slice();
  if (es.length == 0) {
    throw new Error("ors: exprs is empty.");
  }
  while (es.length > 1) {
    const right = es.pop();
    const left = es.pop();
    es.push(or(left, right));
  }
  return es[0];
}

export function implies(left, right) {
  return { kind: Implies, left: left, right: right };
}

export function impliess(exprs) {
  const es = exprs.slice();
  if (es.length == 0) {
    throw new Error("ors: exprs is empty.");
  }
  while (es.length > 1) {
    const right = es.pop();
    const left = es.pop();
    es.push(implies(left, right));
  }
  return es[0];
}

export function iff(left, right) {
  return { kind: Iff, left: left, right: right };
}

export function iffs(exprs) {
  const es = exprs.slice();
  if (es.length == 0) {
    throw new Error("iffs: exprs is empty.");
  }
  while (es.length > 1) {
    const right = es.pop();
    const left = es.pop();
    es.push(iff(left, right));
  }
  return es[0];
}

export function not(expr) {
  return { kind: Not, inner: expr };
}


export function replace(within, replacements) {
  if (!within) {
    return within;
  }

  switch (within.kind) {
    case "Variable": {
      return within;
    }
    case "MetaVariable": {
      if (within.name in replacements) {
        return replacements[within.name];
      }
      else {
        return within;
      }
    }
    case "Constant": {
      return within;
    }
    case "Not": {
      return {
        kind: within.kind,
        inner: replace(within.inner, replacements)
      }
    }
    default: {
      return { 
        kind: within.kind, 
        left: replace(within.left, replacements), 
        right: replace(within.right, replacements)
      };
    }
  }
}

export function freeMetaVariables(expression) {
  const vars = new Set([]);

  function go(expr) {
    switch(expr.kind) {
      case "Variable": {
        break;
      }
      case "MetaVariable": {
        vars.add(expr.name);
        break;
      }
      case "Constant": {
        break;
      }
      case "Not": {
        go(expr.inner);
        break;
      }
      default: {
        go(expr.left);
        go(expr.right);
        break;
      }
    }
  }

  go(expression);
  return vars;
}

export function freeVariables(expression) {
  const vars = new Set([]);

  function go(expr) {
    switch(expr.kind) {
      case "Variable": {
        vars.add(expr.name);
        break;
      }
      case "MetaVariable": {
        break;
      }
      case "Constant": {
        break;
      }
      case "Not": {
        go(expr.inner);
        break;
      }
      default: {
        go(expr.left);
        go(expr.right);
        break;
      }
    }
  }

  go(expression);
  return vars;
}

export function fuse(expr, pattern) {
  const matches = {};
  const queue = [];
  queue.push([expr, pattern]);
  while (queue.length > 0) {
    const [e, p] = queue.shift();
    switch (p.kind) {
      case "Variable": {
        if (e.kind !== "Variable" || p.name !== e.name) {
          return null;
        }
        break;
      }
      case "MetaVariable": {
        if (p.name in matches) {
          if (!exprEqual(e, matches[p.name])) {
            return null;
          }
        }
        else {
          matches[p.name] = e;
        }
        break;
      }
      case "Constant": {
        if (e.kind !== "Constant" || p.value !== e.value) {
          return null;
        }
        break;
      }
      case "Not": {
        if (e.kind !== "Not") {
          return null;
        }
        queue.push([e.inner, p.inner]);
        break;
      }
      default: {
        if (p.kind !== e.kind) {
          return null;
        }
        queue.push([e.left, p.left]);
        queue.push([e.right, p.right]);
        break;
      }
    }
  }
  return matches;
}

function updateUnifier(unifier, key, value) {
  for (const k in unifier) {
    unifier[k] = replace(unifier[k], { [key]: value });
  }
  unifier[key] = replace(value, unifier);
}

export function unify(expr_1, expr_2) {
  const unifier = {};
  const queue = [];
  queue.push([expr_1, expr_2]);
  while (queue.length > 0) {
    const [e1, e2] = queue.shift();
    if (exprEqual(e1, e2)) {
      continue;
    }
    if (e1.kind === MetaVariable) {
      if (freeMetaVariables(e2).has(e1.name)) {
        return null;
      }

      if (e1.name in unifier) {
        queue.push([e2, unifier[e1.name]]);
      }
      else {
        updateUnifier(unifier, e1.name, e2);
      }
    }
    else if (e2.kind === MetaVariable) {
      if (freeMetaVariables(e1).has(e2.name)) {
        return null;
      }

      if (e2.name in unifier) {
        queue.push([e1, unifier[e2.name]]);
      }
      else {
        updateUnifier(unifier, e2.name, e1);
      }
    }
    else {
      if (e1.kind !== e2.kind) {
        return null;
      }

      // At this point, e1 and e2 are not strictly equal.
      if (e1.kind === "Constant" || e1.kind === "Variable") {
        return null;
      }

      if (e1.kind === "Not") {
        queue.push([e1.inner, e2.inner]);
      }
      else {
        queue.push([e1.left, e2.left]);
        queue.push([e1.right, e2.right]);
      }
    }
    
  }
  return unifier;
}
