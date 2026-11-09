// 다운로드 화면 배경: 아이콘(알록달록 적분)을 화면 크기에 맞춰 실시간 3D로 그려요. 그림 파일이 아니라서 어떤 화면에서도 선명해요.
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
  var scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(10, 7.6, 12.5); camera.lookAt(0, 2.1, 0);
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a1622, 0.55));
  var sun = new THREE.DirectionalLight(0xffffff, 1.15); sun.position.set(5, 12, 3); scene.add(sun);
  var warm = new THREE.DirectionalLight(0xffb48a, 0.4); warm.position.set(-8, 3, 7); scene.add(warm);
  var world = new THREE.Group(); scene.add(world);
  function lin(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

  // 다섯 빛깔 기둥: 블록이 차곡차곡 쌓여 점점 높아져요(아이콘의 리만 합 막대)
  var COLORS = [0xff7054, 0xffb03b, 0x84cc5c, 0x30beb2, 0x628ef6], COUNTS = [3, 5, 7, 10, 13];
  var SP = 1.22, SIZE = 0.96, H = 0.34, GAP = 0.04, x0 = -(COUNTS.length - 1) * SP / 2;
  var slab = new THREE.Mesh(new THREE.BoxGeometry(COUNTS.length * SP + 0.7, 0.32, 1.75), new THREE.MeshStandardMaterial({color: lin(0x262c3d), roughness: .9}));
  slab.position.y = -0.16; world.add(slab);
  slab.add(new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: .1})));
  var box = new THREE.BoxGeometry(SIZE, H - GAP, SIZE), edges = new THREE.EdgesGeometry(box), edgeMat = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: .3});
  var drops = [], order = 0, now0 = performance.now();
  COUNTS.forEach(function(n, c){
    var base = new THREE.Color(COLORS[c]);
    for (var k = 0; k < n; k++) {
      // 한 칸 걸러 조금 밝게: 쌓인 결이 보이게
      var col = base.clone().lerp(new THREE.Color(0xffffff), k % 2 ? 0.1 : 0).convertSRGBToLinear();
      var m = new THREE.Mesh(box, new THREE.MeshStandardMaterial({color: col, roughness: .5, metalness: .04}));
      m.add(new THREE.LineSegments(edges, edgeMat));
      var y = k * H + H / 2; m.position.set(x0 + c * SP, reduce ? y : y + 8, 0); world.add(m);
      if (!reduce) { m.visible = false; drops.push({m: m, to: y, start: now0 + 250 + order * 38}); }
      order++;
    }
  });

  // 기둥 꼭대기를 지나는 빛나는 곡선
  var pts = [new THREE.Vector3(x0 - SP * .55, COUNTS[0] * H * .55, 0)];
  COUNTS.forEach(function(n, c){ pts.push(new THREE.Vector3(x0 + c * SP, n * H + 0.34, 0)); });
  pts.push(new THREE.Vector3(x0 + (COUNTS.length - .35) * SP, COUNTS[COUNTS.length - 1] * H + 1.15, 0));
  var curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  var glow = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, depthWrite: false});
  var core = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0});
  world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.15, 12, false), glow));
  world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.05, 10, false), core));

  // 반짝이
  function starTexture(){
    var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"), h = 64;
    var grad = g.createRadialGradient(h, h, 0, h, h, h); grad.addColorStop(0, "rgba(255,255,255,.55)"); grad.addColorStop(.35, "rgba(255,240,220,.12)"); grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128); g.fillStyle = "#fff"; g.beginPath();
    g.moveTo(h, 8); g.quadraticCurveTo(h + 6, h - 6, 120, h); g.quadraticCurveTo(h + 6, h + 6, h, 120); g.quadraticCurveTo(h - 6, h + 6, 8, h); g.quadraticCurveTo(h - 6, h - 6, h, 8); g.fill();
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  var starTex = starTexture(), stars = [];
  [[pts[pts.length - 1], 1.25, 0], [new THREE.Vector3(x0 - SP * .9, COUNTS[2] * H + 0.9, 0.2), .62, 1.7], [new THREE.Vector3(x0 + SP * 1.6, COUNTS[4] * H + 0.8, -0.3), .42, 3.1]].forEach(function(s){
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({map: starTex, transparent: true, depthWrite: false, opacity: 0}));
    sp.position.copy(s[0]); sp.userData = {size: s[1], phase: s[2]}; sp.scale.set(s[1], s[1], 1); world.add(sp); stars.push(sp);
  });

  // 화면이 넓으면 그림을 왼쪽에, 좁으면 가운데 뒤쪽에
  function resize(){
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;   // 캔버스 실제 크기(폰에서는 섹션보다 작아요)
    renderer.setSize(w, h, false);
    var aspect = w / h, wide = w >= 860, view = wide ? Math.max(9.4, 7.2 / aspect * 1.9) : Math.max(10.5, 9 / aspect);
    camera.left = -view * aspect / 2; camera.right = view * aspect / 2; camera.top = view / 2; camera.bottom = -view / 2;
    if (wide) camera.setViewOffset(w, h, w * 0.23, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize); resize();

  var tx = 0, ty = 0, rx = 0, ry = 0;
  section.addEventListener("pointermove", function(e){ var r = section.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; });
  section.addEventListener("pointerleave", function(){ tx = ty = 0; });
  var visible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }).observe(section);

  var revealAt = reduce ? 0 : now0 + 250 + order * 38 + 500, last = performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i], t = (now - d.start) / 520;
      if (t < 0) continue; d.m.visible = true;
      if (t >= 1) { d.m.position.y = d.to; drops.splice(i, 1); continue; }
      var e = t < .75 ? (t / .75) * (t / .75) : 1 - Math.sin((t - .75) / .25 * Math.PI) * .05;
      d.m.position.y = d.to + 8 * (1 - Math.min(1, e));
    }
    var reveal = reduce ? 1 : Math.max(0, Math.min(1, (now - revealAt) / 700));
    glow.opacity = .17 * reveal; core.opacity = reveal;
    stars.forEach(function(s){ var tw = reduce ? 1 : .82 + Math.sin(now / 900 + s.userData.phase) * .18; s.material.opacity = reveal * tw; var k = s.userData.size * (reduce ? 1 : .92 + Math.sin(now / 1300 + s.userData.phase) * .08); s.scale.set(k, k, 1); });
    var sway = reduce ? 0 : Math.sin(now / 5200) * 0.07;
    ry += ((-0.1 + sway + tx * 0.35) - ry) * (reduce ? 1 : .05); rx += ((ty * 0.06) - rx) * (reduce ? 1 : .05);
    world.rotation.y = ry; world.rotation.x = rx; world.position.y = reduce ? 0 : Math.sin(now / 2100) * .06;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();
