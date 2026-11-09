// 다운로드 화면 배경: 최근 몇 달의 공부 기록이 3D 도시처럼 펼쳐진 풍경.
// 하루가 기둥 하나, 공부한 만큼 블록이 쌓여요. 멀수록 어둠에 잠기고, 맨 앞의 '오늘'만 주황으로 빛나요.
// 그림 파일이 아니라 화면 크기에 맞춰 실시간으로 그리기 때문에 어떤 화면에서도 선명해요.
(function(){
  "use strict";
  var canvas = document.getElementById("bg"), section = canvas && canvas.parentElement;
  if (!canvas) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ok = !!window.THREE && (function(){ try { var c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch(e){ return false; } })();
  if (!ok) { canvas.hidden = true; var fb = document.getElementById("bg-fallback"); if (fb) fb.hidden = false; return; }
  var THREE = window.THREE;
  var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  var NIGHT = 0x141823, scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(NIGHT).convertSRGBToLinear(), 20, 52);
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x141020, 0.5));
  var sun = new THREE.DirectionalLight(0xffffff, 1.05); sun.position.set(-6, 14, 8); scene.add(sun);
  var warm = new THREE.DirectionalLight(0xff9a6a, 0.35); warm.position.set(10, 4, 10); scene.add(warm);

  // 기록 만들기: 가로는 주(週), 안쪽으로는 요일. 주말은 조금 적고, 최근으로 올수록 조금씩 늘어요.
  var WEEKS = 18, DAYS = 7, CELL = 1.0, H = 0.3, SIZE = 0.78;
  var seed = 7; function rnd(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var cols = [], total = 0;
  for (var w = 0; w < WEEKS; w++) for (var d = 0; d < DAYS; d++) {
    var trend = 0.55 + 0.45 * (w / (WEEKS - 1)), weekend = d >= 5 ? 0.55 : 1;
    var n = Math.round(Math.max(0, (rnd() * 1.1 + 0.15) * 8 * trend * weekend - (rnd() < 0.12 ? 8 : 0)));
    var isToday = w === WEEKS - 1 && d === DAYS - 1;   // 가장 최근 주의 맨 앞 칸이 '오늘'
    if (isToday) n = 9;
    cols.push({w: w, d: d, n: n, today: isToday}); total += n;
  }
  // 공부량에 따라 색: 적을수록 파랑, 많을수록 초록·노랑 (앱의 다섯 색)
  var RAMP = [0x628ef6, 0x30beb2, 0x84cc5c, 0xffb03b, 0xff7054].map(function(h){ return new THREE.Color(h); });
  function rampColor(t){ t = Math.max(0, Math.min(0.999, t)) * (RAMP.length - 2); var i = Math.floor(t); return RAMP[i].clone().lerp(RAMP[i + 1], t - i); }

  var geo = new THREE.BoxGeometry(SIZE, H - 0.035, SIZE);
  var mat = new THREE.MeshStandardMaterial({roughness: .55, metalness: .05});
  var mesh = new THREE.InstancedMesh(geo, mat, total); scene.add(mesh);
  var blocks = [], m4 = new THREE.Matrix4(), col = new THREE.Color();
  var x0 = -(WEEKS - 1) * CELL / 2, z0 = -(DAYS - 1) * CELL / 2;
  cols.forEach(function(c){
    for (var k = 0; k < c.n; k++) {
      var i = blocks.length;
      // 오늘만 또렷한 주황, 나머지는 배경으로 물러나게 밤색을 살짝 섞어요
      var tint = c.today ? new THREE.Color(0xff7054) : rampColor(c.n / 9).lerp(new THREE.Color(NIGHT), 0.22);
      if (k % 2) tint.lerp(new THREE.Color(0xffffff), 0.08);
      mesh.setColorAt(i, tint.convertSRGBToLinear());
      // 최근 주가 카메라 가까이(왼쪽), 지난 주들은 오른쪽 어둠 속으로
      blocks.push({x: x0 + (WEEKS - 1 - c.w) * CELL, z: z0 + c.d * CELL, y: k * H + H / 2, delay: (WEEKS - 1 - c.w) * 70 + c.d * 22 + k * 30, today: c.today});
    }
  });
  mesh.instanceColor.needsUpdate = true;
  // 바닥 판과 희미한 칸 선
  var floor = new THREE.Mesh(new THREE.BoxGeometry(WEEKS * CELL + 1.2, 0.2, DAYS * CELL + 1.2), new THREE.MeshStandardMaterial({color: new THREE.Color(0x1f2535).convertSRGBToLinear(), roughness: .95}));
  floor.position.y = -0.1; scene.add(floor);
  var grid = new THREE.GridHelper(Math.max(WEEKS, DAYS) * CELL, Math.max(WEEKS, DAYS), 0x3a4358, 0x2a3142);
  grid.material.transparent = true; grid.material.opacity = .35; grid.scale.set(WEEKS / Math.max(WEEKS, DAYS), 1, DAYS / Math.max(WEEKS, DAYS)); grid.position.y = 0.005; scene.add(grid);
  // '오늘' 기둥 위의 빛
  var todayCol = cols.filter(function(c){ return c.today; })[0];
  var glow = new THREE.PointLight(0xff8a5c, 0, 6); glow.position.set(x0 + (WEEKS - 1 - todayCol.w) * CELL, todayCol.n * H + 0.8, z0 + todayCol.d * CELL); scene.add(glow);

  function place(t){
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i], p = reduce ? 1 : Math.max(0, Math.min(1, (t - b.delay) / 600));
      var e = 1 - Math.pow(1 - p, 3), s = p <= 0 ? 0.0001 : 1;
      m4.makeScale(s, s, s); m4.setPosition(b.x, b.y + (1 - e) * 6, b.z); mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  // 화면이 넓으면 도시를 왼쪽 아래로 넓게, 글은 오른쪽. 좁으면 위쪽에.
  var wide = true;
  function resize(){
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; wide = w >= 860;
    if (wide) camera.setViewOffset(w, h, w * 0.02, -h * 0.17, w, h); else camera.clearViewOffset();
    camera.fov = wide ? 30 : 44; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize); resize();

  var px = 0, py = 0, cx = 0, cy = 0;
  section.addEventListener("pointermove", function(e){ var r = section.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; });
  section.addEventListener("pointerleave", function(){ px = py = 0; });
  var visible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }).observe(section);

  var start = performance.now(), introEnd = reduce ? 0 : WEEKS * 70 + DAYS * 22 + 9 * 30 + 700, settled = false;
  function frame(now){
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    var t = now - start;
    if (!settled) { place(t); if (t > introEnd) settled = true; }
    // 천천히 떠다니는 카메라 + 마우스를 따라 살짝
    var drift = reduce ? 0 : Math.sin(now / 7000) * 0.9;
    cx += ((px * 2.2 + drift) - cx) * (reduce ? 1 : .04); cy += ((py * -1.2) - cy) * (reduce ? 1 : .04);
    camera.position.set(-5 + cx, (wide ? 8 : 12) + cy, wide ? 20.5 : 24); camera.lookAt(0.6 + cx * .3, 0.6, 0);
    glow.intensity = (settled || reduce ? 1 : Math.min(1, t / introEnd)) * (reduce ? 1.4 : 1.2 + Math.sin(now / 900) * 0.35);
    renderer.render(scene, camera);
  }
  place(reduce ? 1e9 : 0); requestAnimationFrame(frame);
})();
