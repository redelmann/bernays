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


export function moveMainDiv(div, dx, dy) {
  const x = (parseFloat(div.getAttribute('data-x')) || 0) + dx;
  const y = (parseFloat(div.getAttribute('data-y')) || 0) + dy;
  div.setAttribute('data-x', x);
  div.setAttribute('data-y', y);
  div.style.left = x + 'px';
  div.style.bottom = y + 'px';
}

export function getContainer(elem) {
  let container = elem;
  while (container !== null && !container.classList.contains("bernays")) {
    container = container.parentNode;
  }
  return container;
}

export function closeContextualMenu() {
  const menuDiv = document.getElementById('bernays-contextual-menu');
  if (menuDiv) {
    menuDiv.remove();
  }
}