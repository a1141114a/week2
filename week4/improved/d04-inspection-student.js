(() => {
  'use strict';

  const viewer = window.InspectionViewer;
  const ui = document.querySelector('#student-ui');

  if (!viewer || !ui) return;

  const button = document.createElement('button');
  button.className = 'btn';
  button.type = 'button';
  button.textContent = 'P1 빠른 이동';

  button.style.marginTop = '12px';
  button.style.width = '100%';

  ui.appendChild(button);
})();
