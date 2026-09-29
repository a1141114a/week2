(() => {
  'use strict';

  const viewer = window.InspectionViewer;
  const ui = document.querySelector('#student-ui');

  if (!viewer || !ui) return;

  const controls = viewer.controls;

  // P1~P6 실제 명판 정보
  const points = {
    P1: {
      target: [-2, 1.6, 4.12],
      distance: 3.2,
      rotation: [0, 0, 0, 1]
    },

    P2: {
      target: [3, 1.25, -2.085],
      distance: 2.2,
      rotation: [0, 0, 0, 1]
    },

    P3: {
      target: [-3, 4.05, 1.315],
      distance: 1.5,
      rotation: [0, 0, 0, 1]
    },

    P4: {
      target: [0.5, 9.42, -0.435],
      distance: 2.5,
      rotation: [0, 0, 0, 1]
    },

    // P5는 명판이 반대 방향을 보고 있음
    P5: {
      target: [0, 4.6, -4.4],
      distance: 2.4,
      rotation: [0, 1, 0, 0]
    },

    P6: {
      target: [11, 1.4, 1.565],
      distance: 2.0,
      rotation: [0, 0, 0, 1]
    }
  };

  ui.innerHTML = `
    <div style="
      margin-top:16px;
      padding:12px;
      border:1px solid #999;
      border-radius:8px;
    ">

      <strong>빠른 관찰</strong>

      <p style="
        margin:6px 0 10px;
        font-size:12px;
        line-height:1.5;
      ">
        관찰할 위치를 선택하면 해당 명판 앞으로 빠르게 이동합니다.
      </p >

      <div style="
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:6px;
      ">
        <button class="btn quick" data-point="P1">P1</button>
        <button class="btn quick" data-point="P2">P2</button>
        <button class="btn quick" data-point="P3">P3</button>

        <button class="btn quick" data-point="P4">P4</button>
        <button class="btn quick" data-point="P5">P5</button>
        <button class="btn quick" data-point="P6">P6</button>
      </div>

      <hr style="margin:12px 0;">

      <strong>비교 관찰</strong>

      <p style="
        margin:6px 0 10px;
        font-size:12px;
        line-height:1.5;
      ">
        비교 과제에 필요한 직교 시점으로 전환합니다.
      </p >

      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:6px;
      ">
        <button class="btn" id="view-o1">
          O1 전면
        </button>

        <button class="btn" id="view-o2">
          O2 오른쪽
        </button>
      </div>

      <button
        class="btn"
        id="student-home"
        style="width:100%;margin-top:6px;"
      >
        전체 보기
      </button>

      <p id="view-status" style="
        margin:9px 0 0;
        font-size:12px;
        line-height:1.5;
      ">
        자유 관찰 모드
      </p >

    </div>
  `;

  const status = document.querySelector('#view-status');

  // --------------------------------------------------
  // P1~P6 빠른 이동
  // --------------------------------------------------

  document.querySelectorAll('.quick').forEach(button => {

    button.addEventListener('click', () => {

      // 직교 뷰가 켜져 있었다면 해제
      viewer.render = null;

      const id = button.dataset.point;
      const p = points[id];

      controls.state.target = [...p.target];
      controls.state.distance = p.distance;
      controls.state.rotation = [...p.rotation];

      controls.state.actions++;

      status.textContent = `${id} 명판 관찰 중`;
    });

  });

  // --------------------------------------------------
  // O1 : 전면 직교 뷰
  // --------------------------------------------------

  document.querySelector('#view-o1').addEventListener('click', () => {

    const target = [-5.3, 2.6, 6];

    const camera = {
      eye: [
        target[0],
        target[1],
        target[2] + 18
      ],

      target: target,

      up: [0, 1, 0],

      orthographic: true,

      halfHeight: 3.0,

      near: 0.02,
      far: 100
    };

    viewer.render = function(api) {
      api.drawView(camera);
    };

    controls.state.actions++;

    status.textContent =
      'O1 전면 직교 뷰 — 파랑 A와 주황 B 패널 비교';

  });

  // --------------------------------------------------
  // O2 : 오른쪽 측면 직교 뷰
  // --------------------------------------------------

  document.querySelector('#view-o2').addEventListener('click', () => {

    const target = [10.8, 4.75, -0.3];

    const camera = {
      eye: [
        target[0] + 18,
        target[1],
        target[2]
      ],

      target: target,

      up: [0, 1, 0],

      orthographic: true,

      halfHeight: 3.0,

      near: 0.02,
      far: 100
    };

    viewer.render = function(api) {
      api.drawView(camera);
    };

    controls.state.actions++;

    status.textContent =
      'O2 오른쪽 직교 뷰 — A와 B 장치의 돌출 정도 비교';

  });

  // --------------------------------------------------
  // 전체 보기
  // --------------------------------------------------

  document.querySelector('#student-home').addEventListener('click', () => {

    viewer.render = null;

    controls.home();

    controls.state.actions++;

    status.textContent = '자유 관찰 모드';

  });

})();
