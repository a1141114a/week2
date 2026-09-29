/* Week 4 - Improved Observation Interface
   P1~P6 quick navigation + O1/O2 orthographic comparison views
*/

(() => {
  const viewer = window.InspectionViewer;
  if (!viewer) return;

  const ui = document.querySelector('#student-ui');
  if (!ui) return;

  const model = viewer.model;
  const controls = viewer.controls;

  // ---------- quaternion helpers ----------
  function normalize(v) {
    const n = Math.hypot(...v) || 1;
    return v.map(x => x / n);
  }

  function quatFromEuler(pitch, yaw) {
    const sx = Math.sin(pitch / 2);
    const cx = Math.cos(pitch / 2);
    const sy = Math.sin(yaw / 2);
    const cy = Math.cos(yaw / 2);

    // Same general rotation convention as the provided controls.
    return normalize([
      sx * cy,
      cx * sy,
      -sx * sy,
      cx * cy
    ]);
  }

  // ---------- P1~P6 camera presets ----------
  // yaw here controls the camera's horizontal viewing direction.
  // distance is intentionally fairly close so that small labels are readable.
  const poiViews = {
    P1: { distance: 4.0, pitch: 0.00, yaw: 0.00 },
    P2: { distance: 3.0, pitch: 0.00, yaw: 0.00 },
    P3: { distance: 2.5, pitch: 0.00, yaw: 0.00 },
    P4: { distance: 3.0, pitch: -0.15, yaw: 0.00 },
    P5: { distance: 3.2, pitch: 0.00, yaw: Math.PI },
    P6: { distance: 2.8, pitch: 0.00, yaw: 0.00 }
  };

  function focusPOI(id) {
    const poi = model.poi.find(p => p.id === id);
    if (!poi) return;

    const preset = poiViews[id];

    controls.state.target = [...poi.position];
    controls.state.distance = preset.distance;
    controls.state.rotation =
      quatFromEuler(preset.pitch, preset.yaw);
    controls.state.fov = 38;
    controls.state.actions++;

    currentMode = 'normal';
  }

  // ---------- O1 / O2 comparison mode ----------
  let currentMode = 'normal';

  function comparisonView(id) {
    const comparison =
      model.comparisons.find(c => c.id === id);

    if (!comparison) return;

    currentMode = id;
  }

  // ---------- reset ----------
  function showAll() {
    currentMode = 'normal';

    if (viewer.hidden) {
      viewer.hidden.clear();
    }

    controls.home();
  }

  // ---------- custom rendering ----------
  // Normal mode keeps the professor's original interactive camera.
  // O1/O2 use exact orthographic views.
  viewer.render = (v) => {
    const canvas = v.canvas;

    if (currentMode === 'O1') {
      const c = model.comparisons.find(x => x.id === 'O1');

      v.drawView({
        eye: [
          c.position[0],
          c.position[1],
          c.position[2] + 12
        ],
        target: [...c.position],
        up: [0, 1, 0],
        fov: 45,
        orthographic: true,
        halfHeight: 2.2
      }, [0, 0, canvas.width, canvas.height]);

      return;
    }

    if (currentMode === 'O2') {
      const c = model.comparisons.find(x => x.id === 'O2');

      v.drawView({
        eye: [
          c.position[0] + 12,
          c.position[1],
          c.position[2]
        ],
        target: [...c.position],
        up: [0, 1, 0],
        fov: 45,
        orthographic: true,
        halfHeight: 2.5
      }, [0, 0, canvas.width, canvas.height]);

      return;
    }

    const cam = controls.camera();

    v.drawView({
      eye: cam.eye,
      target: cam.target,
      up: cam.up,
      fov: controls.state.fov,
      orthographic: false
    }, [0, 0, canvas.width, canvas.height]);
  };

  // ---------- UI ----------
  ui.innerHTML = `
    <div class="student-panel">
      <div class="student-title">
        빠른 관찰
      </div>

      <div class="student-section">
        <span class="student-label">관찰 지점</span>
        <button data-poi="P1">P1</button>
        <button data-poi="P2">P2</button>
        <button data-poi="P3">P3</button>
        <button data-poi="P4">P4</button>
        <button data-poi="P5">P5</button>
        <button data-poi="P6">P6</button>
      </div>

      <div class="student-section">
        <span class="student-label">비교 관찰</span>
        <button id="view-o1">O1 정면</button>
        <button id="view-o2">O2 오른쪽</button>
        <button id="view-home">전체 보기</button>
      </div>

      <div class="student-help">
        버튼으로 관찰 위치를 빠르게 찾은 후
        마우스로 시점을 추가 조절할 수 있습니다.
      </div>
    </div>
  `;

  ui.querySelectorAll('[data-poi]').forEach(button => {
    button.addEventListener('click', () => {
      focusPOI(button.dataset.poi);
    });
  });

  ui.querySelector('#view-o1')
    .addEventListener('click', () => comparisonView('O1'));

  ui.querySelector('#view-o2')
    .addEventListener('click', () => comparisonView('O2'));

  ui.querySelector('#view-home')
    .addEventListener('click', showAll);
})();
