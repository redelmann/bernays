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


import {withoutParents, setParents} from './Trees.js';
import {moveMainDiv} from './Utils.js';
import {goalToHTML, treeToHTML} from './Render.js';

function getKey(container) {
  return container.id ? 'bernays-state-' + container.id : 'bernays-state';
}

export function getState(container) {
  const elems = [];
  for (const child of container.children) {
    if (child.bernays && child.bernays.tree) {
      elems.push({
        tree: withoutParents(child.bernays.tree),
        x: parseFloat(child.getAttribute('data-x')) || 0,
        y: parseFloat(child.getAttribute('data-y')) || 0,
      });
    }
  }
  return elems;
}

export function saveState(container) {
  const encoded = JSON.stringify(getState(container));
  sessionStorage.setItem(getKey(container), encoded);
}

export function loadState(container) {
  const encoded = sessionStorage.getItem(getKey(container));
  if (encoded) {
    const elems = JSON.parse(encoded);
    for (const elem of elems) {
      setParents(elem.tree);
    }
    return elems;
  }
  return null;
}


export function restoreState(container, state) {
  clearState(container);
  addState(container, state);
}

export function clearState(container) {
  for (const main of container.querySelectorAll(".main")) {
    main.remove();
  }
}

export function addState(container, state) {
  for (const elem of state) {
    const treeDiv = 'goal' in elem.tree ? goalToHTML(elem.tree, true) : treeToHTML(elem.tree, true);
    treeDiv.classList.add("main");
    container.appendChild(treeDiv);
    moveMainDiv(treeDiv, elem.x, elem.y);
  }
}

async function asyncSaveToFile(string) {
  const file = await window.showSaveFilePicker({
    types: [{
      description: "Bernays",
      accept: {
        "text/plain": ['.brn']
      }
    }]
  });

  const writable = await file.createWritable();
  await writable.write(string);
  await writable.close();
}

function defaultSaveToFile(string) {
  const blob = new Blob([string], {type: "text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bernays.brn';
  a.click();
  URL.revokeObjectURL(url);
}

export function saveToFile(container) {
  const elems = getState(container);
  const string = JSON.stringify(elems);
  
  if (window.showSaveFilePicker) {
    asyncSaveToFile(string);
  }
  else {
    defaultSaveToFile(string);
  }
}

async function asyncLoadFromFile(container, replace) {
  const [handle] = await window.showOpenFilePicker({
    types: [{
      description: "Bernays",
      accept: {
        "text/plain": ['.brn']
      }
    }]
  });

  const file = await handle.getFile();
  const string = await file.text();

  const elems = JSON.parse(string);
  if (replace) {
    clearState(container);
  }
  addState(container, elems);
}

function defaultLoadFromFile(container, replace) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.brn';
  input.onchange = function () {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function () {
      const string = reader.result;
      const elems = JSON.parse(string);
      if (replace) {
        clearState(container);
      }
      restoreState(container, elems);
    };
    reader.readAsText(file);
  };
  input.click();
}

export function loadFromFile(container, replace) {
  if (window.showOpenFilePicker) {
    asyncLoadFromFile(container, replace);
  }
  else {
    defaultLoadFromFile(container, replace);
  }
}