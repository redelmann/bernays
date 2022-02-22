
export const MetaVariable = "MetaVariable";
export const Constant = "Constant";
export const And = "And";
export const Or = "Or";
export const Implies = "Implies";
export const Not = "Not";

export function exprEqual(left, right) {
  if (left.kind !== right.kind) {
    return false;
  }
  switch (left.kind) {
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
  const es = exprs.slice()
  if (es.length == 0) {
    throw new Error("ands: exprs is empty.")
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
  const es = exprs.slice()
  if (es.length == 0) {
    throw new Error("ors: exprs is empty.")
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
  const es = exprs.slice()
  if (es.length == 0) {
    throw new Error("ors: exprs is empty.")
  }
  while (es.length > 1) {
    const right = es.pop();
    const left = es.pop();
    es.push(implies(left, right));
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

export function fuse(expr, pattern) {
  const matches = {};
  const queue = [];
  queue.push([expr, pattern]);
  while (queue.length > 0) {
    const [e, p] = queue.shift();
    switch (p.kind) {
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
