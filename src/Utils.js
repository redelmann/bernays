export function moveMainDiv(div, dx, dy) {
  const x = (parseFloat(div.getAttribute('data-x')) || 0) + dx;
  const y = (parseFloat(div.getAttribute('data-y')) || 0) + dy;
  div.setAttribute('data-x', x);
  div.setAttribute('data-y', y);
  div.style.left = x + 'px';
  div.style.bottom = y + 'px';
}