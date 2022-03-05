import {rules} from './Rules.js';

export function initUI(container, options) {
  const rulesMenuDiv = document.createElement("div");
  rulesMenuDiv.classList.add("rules-menu");
  container.appendChild(rulesMenuDiv);

  const newGoalDiv = document.createElement("div");
  newGoalDiv.classList.add("new-goal");

  const plusIcon = document.createElement("i");
  plusIcon.classList.add("fa", "fa-plus");

  newGoalDiv.appendChild(plusIcon);
  rulesMenuDiv.appendChild(newGoalDiv);

  const activeRules = rules.slice();

  if (options && 'includeRules' in options) {
    for (let i = activeRules.length - 1; i >= 0; i--) {
      const rule = activeRules[i];
      if (!options.includeRules.has(rule.code)) {
        activeRules.splice(i, 1);
      }
    }
  }

  if (options && 'excludeRules' in options) {
    for (let i = activeRules.length - 1; i >= 0; i--) {
      const rule = activeRules[i];
      if (options.excludeRules.has(rule.code)) {
        activeRules.splice(i, 1);
      }
    }
  }

  for (const rule of activeRules) {
    const itemDiv = document.createElement("div");
    itemDiv.bernays = { rule: rule };
    itemDiv.classList.add("item");
    itemDiv.appendChild(document.createTextNode(rule.name));
    rulesMenuDiv.appendChild(itemDiv);
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

  let modal_open = false;
  container.bernays = {
    is_modal_open() {
      return modal_open;
    },
    showModal() {
      modal_open = true;
      modalDiv.style.display = 'block';
    },
    hideModal() {
      modal_open = false;
      modalDiv.style.display = 'none';
    }
  };
}