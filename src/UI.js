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


import {rules} from './Rules.js';
import {_} from './Lang.js';

export function initUI(container, options) {

  const topMenuDiv = document.createElement('div');
  topMenuDiv.classList.add('top-menu');
  container.appendChild(topMenuDiv);

  const titleElem = document.createElement('h1');
  titleElem.appendChild(document.createTextNode('Bernays'));
  topMenuDiv.appendChild(titleElem);

  const menuItems = [
    { name: 'new-goal', icon: 'plus' },
    { name: 'new-axiom', icon: 'asterisk' },
    { name: 'about', icon: 'info-circle' },
    { name: 'help', icon: 'question-circle' },
    { name: 'settings', icon: 'cog' },
    { name: 'reset', icon: 'refresh' },
    null,
    { name: 'undo', icon: 'undo' },
    { name: 'redo', icon: 'repeat' },
    { name: 'save', icon: 'save' },
    { name: 'load', icon: 'upload' },
  ];

  const menuDivs = {};

  for (const item of menuItems) {
    if (item === null) {
      const spacer = document.createElement('div');
      spacer.classList.add('spacer');
      topMenuDiv.appendChild(spacer);
      continue;
    }

    const menuItemDiv = document.createElement('div');
    menuItemDiv.classList.add('menu-item', item.name);

    const iconDiv = document.createElement('i');
    iconDiv.classList.add('fa', 'fa-' + item.icon);
    menuItemDiv.appendChild(iconDiv);

    const labelSpan = document.createElement('span');
    labelSpan.classList.add('label');
    labelSpan.appendChild(document.createTextNode(_(item.name)));
    menuItemDiv.appendChild(labelSpan);

    menuDivs[item.name] = menuItemDiv;

    topMenuDiv.appendChild(menuItemDiv);
  }

  const rulesMenuDiv = document.createElement("div");
  rulesMenuDiv.classList.add("rules-menu");
  container.appendChild(rulesMenuDiv);

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
    },
    menu: menuDivs,
  };
}