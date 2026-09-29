/* Week 4 - Improved Observation Interface
   빠른 위치 탐색과 비교 관찰 기능
*/
(() => {
  'use strict';

  const viewer = window.InspectionViewer;
  const ui = document.querySelector('#student-ui');

  if (!viewer || !ui) return;

  const controls = viewer.controls;
  const model = viewer.model;

  // -----------------------------
  // UI
  // -----------------------------
  ui.innerHTML = `
    <div style="
      margin-top:16px;
      padding:12px;
      border:1px solid #c8d0d8;
      border-radius:8px;
      background:#f7f9fb;
    ">
      <strong style="display:block;margin-bottom:10px;">
        빠른 관찰
      </strong>

      <div style="margin-bottom:10px;">
        <div style="font-size:13px;margin-bottom:6px;">
          관찰 지점
        </div>

        <div style="
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:6px;
        ">
          <button class="btn quick-poi" data-id="P1">P1</button>
          <button class="btn quick-poi" data-id="P2">P2</button>
          <button class="btn quick-poi" data-id="P3">P3</button>
          <button class="btn quick-poi" data-id="P4">P4</button>
          <button class="btn quick-poi" data-id="P5">P5</button>
          <button class="btn quick-poi" data-id="P6">P6</button>
        </div>
      </div>

      <div>
        <div style="font-size:13px;margin-bottom:6px;">
          비교 관찰
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:6px;
        ">
          <button class="btn" id="quick-o1">
            O1 정면
          </button>

          <button class="btn" id="quick-o2">
            O2 오른쪽
          </button>

          <button class="btn" id="quick-home"
            style="grid-column:1 / 3;">
            전체 보기
          </button>
        </div>
      </div>

      <p style="
        margin:10px 0 0;
        font-size:12px;
        line-height:1.5;
      ">
        관찰 지점을 선택하면 해당 위치로 빠르게 이동합니다.
        이동 후 마우스로 시점을 추가 조절할 수 있습니다.
      </p >
    </div>
  `;

  // -----------------------------
  // Quaternion helpers
  // -----------------------------
  function normalize(q) {
    const n = Math.hypot(...q) || 1;
    return q.map(v => v / n);
  }

  function multiply(a, b) {
    return [
      a[3] * b[0] + a[0] * b[3] +
        a[1] * b[2] - a[2] * b[1],

      a[3] * b[1] - a[0] * b[2] +
        a[1] * b[3] + a[2] * b[0],

      a[3] * b[2] + a[0] * b[1] -
        a[1] * b[0] + a[2] * b[3],

      a[3] * b[3] - a[0] * b[0] -
        a[1] * b[1] - a[2] * b[2]
    ];
  }

  function cameraRotation(pitch, yaw) {
    const qYaw = [
      0,
      Math.sin(yaw / 2),
      0,
      Math.cos(yaw / 2)
    ];

    const qPitch = [
      Math.sin(pitch / 2),
      0,
      0,
      Math.cos(pitch / 2)
    ];

    return normalize(multiply(qYaw, qPitch));
  }

  // -----------------------------
  // P1 ~ P6 presets
  // -----------------------------
  const presets = {
    P1: {
      distance: 3.2,
      pitch: 0,
      yaw: 0
    },

    P2: {
      distance: 2.6,
      pitch: 0,
      yaw: 0
    },

    P3: {
      distance: 2.0,
      pitch: 0,
      yaw: 0
    },

    P4: {
      distance: 2.7,
      pitch: -0.15,
      yaw: 0
    },

    P5: {
      distance: 2.8,
      pitch: 0,
      yaw: Math.PI
    },

    P6: {
      distance: 2.5,
      pitch: 0,
      yaw: 0
    }
  };

  let mode = 'normal';

  function focusPOI(id) {
    const poi = model.poi.find(p => p.id === id);
    const preset = presets[id];

    if (!poi || !preset) return;

    mode = 'normal';

    controls.state.target = [...poi.position];
    controls.state.distance = preset.distance;
    controls.state.rotation =
      cameraRotation(preset.pitch, preset.yaw);

    controls.state.fov = 38;
    controls.state.actions++;
  }

  // -----------------------------
  // Buttons
  // -----------------------------
  ui.querySelectorAll('.quick-poi').forEach(button => {
    button.addEventListener('click', () => {
      focusPOI(button.dataset.id);
    });
  });

  document.querySelector('#quick-o1')
    .addEventListener('click', () => {
      mode = 'O1';
      controls.state.actions++;
    });

  document.querySelector('#quick-o2')
    .addEventListener('click', () => {
      mode = 'O2';
      controls.state.actions++;
    });

  document.querySelector('#quick-home')
    .addEventListener('click', () => {
      mode = 'normal';
      viewer.hidden.clear();
      controls.home();
      controls.state.actions++;
    });

  // -----------------------------
  // Rendering
  // -----------------------------
  viewer.render = () => {

    if (mode === 'O1') {
      const c =
        model.comparisons.find(item => item.id === 'O1');

      viewer.drawView({
        eye: [
          c.position[0],
          c.position[1],
          c.position[2] + 12
        ],

        target: [...c.position],

        up: [0, 1, 0],

        orthographic: true,

        halfHeight: 2.3
      });

      return;
    }

    if (mode === 'O2') {
      const c =
        model.comparisons.find(item => item.id === 'O2');

      viewer.drawView({
        eye: [
          c.position[0] + 12,
          c.position[1],
          c.position[2]
        ],

        target: [...c.position],

        up: [0, 1, 0],

        orthographic: true,

        halfHeight: 2.5
      });

      return;
    }

    const camera = controls.camera();

    viewer.drawView({
      eye: camera.eye,
      target: camera.target,
      up: camera.up,
      fov: controls.state.fov
    });
  };

})();
