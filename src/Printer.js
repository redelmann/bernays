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


export function pretty(expression) {

  function prettyAtom(expr) {
    switch (expr.kind) {
    case "Variable":
      return expr.name;
    case "MetaVariable":
      return expr.name;
    case "Constant":
      if (expr.value) {
        return "⊤";
      }
      else {
        return "⊥";
      }
    default:
      return "(" + prettyExpr(expr) + ")";
    }
  }

  function prettyNegation(expr) {
    let current = expr;
    let pre = "";
    while (current.kind === "Not") {
      current = current.inner;
      pre = pre + "¬";
    }
    return pre + prettyAtom(current);
  }

  function prettyBinary(expr, kind, op, below) {
    if (expr.kind === kind) {
      const left = below(expr.left);
      // Change here to remove unnecessary parentheses due to right associativity rule.
      // const right = prettyBinary(expr.right, kind, op, below);
      const right = below(expr.right);
      return left + " " + op + " " + right;
    }
    else {
      return below(expr);
    }
  }

  function prettyConjunction(expr) {
    return prettyBinary(expr, "And", "⋀", prettyNegation);
  }

  function prettyDisjunction(expr) {
    return prettyBinary(expr, "Or", "⋁", prettyConjunction);
  }

  function prettyImplication(expr) {
    return prettyBinary(expr, "Implies", "⇒", prettyDisjunction);
  }

  function prettyExpr(expr) {
    return prettyBinary(expr, "Iff", "⇔", prettyImplication);
  }

  return prettyExpr(expression);
}

export function verbosePrettyHTML(expr) {

  function parensVerbosePrettyHTML(inner) {
    if (["And", "Or", "Implies", "Iff"].includes(inner.kind)) {
      const parenSpan = document.createElement("span");
      parenSpan.classList.add("parens");
      const leftSpan = document.createElement("span");
      leftSpan.classList.add("parens-left");
      leftSpan.innerText = "(";
      parenSpan.appendChild(leftSpan);
      const childSpan = verbosePrettyHTML(inner);
      parenSpan.appendChild(childSpan);
      const rightSpan = document.createElement("span");
      rightSpan.classList.add("parens-right");
      rightSpan.innerText = ")";
      parenSpan.appendChild(rightSpan);
      return parenSpan;
    }
    else {
      return verbosePrettyHTML(inner);
    }
  }

  switch (expr.kind) {
  case "Variable": {
    const varSpan = document.createElement("span");
    varSpan.classList.add("variable");
    varSpan.innerText = expr.name;
    return varSpan;
  }
  case "MetaVariable": {
    const metaVarSpan = document.createElement("span");
    metaVarSpan.classList.add("metavariable");
    metaVarSpan.innerText = expr.name;
    return metaVarSpan;
  }
  case "Constant": {
    const constantSpan = document.createElement("span");
    constantSpan.classList.add("constant");
    const constant = expr.value ? "⊤" : "⊥";
    constantSpan.innerText = constant;
    return constantSpan;
  }
  case "Not": {
    const notSpan = document.createElement("span");
    notSpan.classList.add("unary");
    
    const opSpan = document.createElement("span");
    opSpan.className = "unary-op";
    opSpan.innerText = "¬";

    notSpan.appendChild(opSpan);
    notSpan.appendChild(parensVerbosePrettyHTML(expr.inner));
    return notSpan;
  }
  default: {
    const left = parensVerbosePrettyHTML(expr.left);
    const right = parensVerbosePrettyHTML(expr.right);
    const binSpan = document.createElement("span");
    binSpan.classList.add("binary");
    binSpan.appendChild(left);
    binSpan.appendChild(document.createTextNode(" "));
    const opSpan = document.createElement("span");
    opSpan.classList.add("binary-op");
    const ops = {
      "And": "⋀",
      "Or": "⋁",
      "Implies": "⇒",
      "Iff": "⇔"
    };
    opSpan.appendChild(document.createTextNode(ops[expr.kind]));
    binSpan.appendChild(opSpan);
    binSpan.appendChild(document.createTextNode(" "));
    binSpan.appendChild(right);
    return binSpan;
  }
  }
}

export function prettyHTML(expr) {

  function prettyAtom(expr) {
    switch (expr.kind) {
    case "Variable": {
      const varSpan = document.createElement("span");
      varSpan.classList.add("variable");
      varSpan.innerText = expr.name;
      return varSpan;
    }
    case "MetaVariable": {
      const metaVarSpan = document.createElement("span");
      metaVarSpan.classList.add("metavariable");
      metaVarSpan.innerText = expr.name;
      return metaVarSpan;
    }
    case "Constant": {
      const constantSpan = document.createElement("span");
      constantSpan.classList.add("constant");
      const constant = expr.value ? "⊤" : "⊥";
      constantSpan.innerText = constant;
      return constantSpan;
    }
    default: {
      const parenSpan = document.createElement("span");
      parenSpan.classList.add("parens");
      const leftSpan = document.createElement("span");
      leftSpan.classList.add("parens-left");
      leftSpan.innerText = "(";
      parenSpan.appendChild(leftSpan);
      const childSpan = prettyExpr(expr);
      parenSpan.appendChild(childSpan);
      const rightSpan = document.createElement("span");
      rightSpan.classList.add("parens-right");
      rightSpan.innerText = ")";
      parenSpan.appendChild(rightSpan);
      return parenSpan;
    }
    }
  }

  function prettyNegation(expr) {
    let current = expr;
    let parent = null;
    let context = null;
    while (current.kind === "Not") {
      current = current.inner;
      if (!parent) {
        parent = document.createElement("span");
        parent.className = "unary";
        context = parent;
      }
      else {
        const newContext = document.createElement("span");
        newContext.className = "unary";
        context.appendChild(newContext);
        context = newContext;
      }
      const opSpan = document.createElement("span");
      opSpan.className = "unary-op";
      opSpan.innerText = "¬";
      context.appendChild(opSpan);
    }
    const childSpan = prettyAtom(current);
    if (parent) {
      context.appendChild(childSpan);
      return parent;
    }
    else {
      return childSpan;
    }
  }

  function prettyBinary(expr, kind, op, below) {
    if (expr.kind === kind) {
      const left = below(expr.left);
      // Change here to remove unnecessary parentheses due to right associativity rule.
      // const right = prettyBinary(expr.right, kind, op, below);
      const right = below(expr.right);
      const binSpan = document.createElement("span");
      binSpan.classList.add("binary");
      binSpan.appendChild(left);
      binSpan.appendChild(document.createTextNode(" "));
      const opSpan = document.createElement("span");
      opSpan.classList.add("binary-op");
      opSpan.appendChild(document.createTextNode(op));
      binSpan.appendChild(opSpan);
      binSpan.appendChild(document.createTextNode(" "));
      binSpan.appendChild(right);
      return binSpan;
    }
    else {
      return below(expr);
    }
  }

  function prettyConjunction(expr) {
    return prettyBinary(expr, "And", "⋀", prettyNegation);
  }

  function prettyDisjunction(expr) {
    return prettyBinary(expr, "Or", "⋁", prettyConjunction);
  }

  function prettyImplication(expr) {
    return prettyBinary(expr, "Implies", "⇒", prettyDisjunction);
  }

  function prettyExpr(expr) {
    return prettyBinary(expr, "Iff", "⇔", prettyImplication);
  }

  const exprSpan = document.createElement("span");
  exprSpan.classList.add("expr");
  exprSpan.appendChild(prettyExpr(expr));
  return exprSpan;
}