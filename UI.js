import {rules} from './Rules.js';
import {tokenize} from './Tokenizer.js';
import {parse, ParseError} from './Parser.js';
import {pretty} from './Printer.js';

export function initUI(container, options) {
  const menuDiv = document.createElement("div");
  menuDiv.classList.add("menu");
  container.appendChild(menuDiv);

  for (const rule of rules) {
    const itemDiv = document.createElement("div");
    itemDiv.bernays = { rule: rule };
    itemDiv.classList.add("item");
    itemDiv.appendChild(document.createTextNode(rule.name));
    menuDiv.appendChild(itemDiv);
  }

  const trashDiv = document.createElement("div");
  trashDiv.classList.add("trash");
  const trashIcon = document.createElement("i");
  trashIcon.classList.add("fa", "fa-trash");
  trashDiv.appendChild(trashIcon);
  container.appendChild(trashDiv);

  const modalDiv = document.createElement("div");
  modalDiv.classList.add("modal");
  container.appendChild(modalDiv);

  return {
    showModal() {
      modalDiv.style.display = 'block';
    },
    hideModal() {
      modalDiv.style.display = 'none';
    }
  }
}

export function exprInputHTML(defaultExpr) {
  const exprInput = document.createElement("input");
  exprInput.classList.add("expr-input");
  exprInput.setAttribute("type", "text");
  exprInput.setAttribute("value", pretty(defaultExpr));
  exprInput.bernays = { expr: defaultExpr, is_valid: true };
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