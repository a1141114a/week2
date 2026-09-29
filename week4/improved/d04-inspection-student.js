(() => {
  'use strict';

  const viewer = window.InspectionViewer;
  const ui = document.querySelector('#student-ui');

  if (!viewer || !ui) return;

  ui.innerHTML = `
    <div style="
      margin-top:16px;
      padding:12px;
      border:2px solid #333;
      border-radius:8px;
    ">
      <strong>빠른 관찰</strong>

      <div style="
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:6px;
        margin-top:10px;
      ">
        <button class="btn">P1</button>
        <button class="btn">P2</button>
        <button class="btn">P3</button>
        <button class="btn">P4</button>
        <button class="btn">P5</button>
        <button class="btn">P6</button>
      </div>
    </div>
  `;
})();
