(() => {
  'use strict';

  const viewer = window.InspectionViewer;
  const ui = document.querySelector('#student-ui');

  if (!viewer || !ui) return;

  const controls = viewer.controls;

  // P1 실제 위치
  const P1 = [-2, 1.6, 4.12];

  ui.innerHTML = `
    <div style="
      margin-top:16px;
      padding:12px;
      border:1px solid #999;
      border-radius:8px;
    ">
      <strong>빠른 관찰</strong>

      <div style="margin-top:10px;">
        <button
          id="goto-p1"
          class="btn"
          type="button"
          style="width:100%;">
          P1 빠른 이동
        </button>
      </div>

      <p style="
        margin:8px 0 0;
        font-size:12px;
        line-height:1.5;
      ">
        P1 안내판 앞으로 자동 이동합니다.
      </p >
    </div>
  `;

  document.querySelector('#goto-p1').addEventListener('click', () => {

    // P1을 회전 중심으로 설정
    controls.state.target = [...P1];

    // 가까이 이동
    controls.state.distance = 3.2;

    // P1은 +Z 방향을 향하고 있으므로
    // 정면에서 바라보는 카메라 방향으로 초기화
    controls.state.rotation = [0, 0, 0, 1];

    controls.state.actions++;
  });

})();
