import {rules} from './Rules.js';

export function initUI(container, options) {
  const menuDiv = document.createElement("div");
  menuDiv.classList.add("menu");
  container.appendChild(menuDiv);

  const newGoalDiv = document.createElement("div");
  newGoalDiv.classList.add("new-goal");

  const plusIcon = document.createElement("i");
  plusIcon.classList.add("fa", "fa-plus");

  newGoalDiv.appendChild(plusIcon);
  menuDiv.appendChild(newGoalDiv);

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

  container.bernays = {
    showModal() {
      modalDiv.style.display = 'block';
    },
    hideModal() {
      modalDiv.style.display = 'none';
    }
  }
}