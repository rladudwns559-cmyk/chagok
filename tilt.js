// 다운로드 구역의 아이콘과 실제 화면이 마우스를 살짝 따라 기울어요
(function(){
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var tilt = document.getElementById("tilt");
  if (tilt) tilt.parentElement.addEventListener("pointermove", function(e){
    var r = tilt.getBoundingClientRect(), x = (e.clientX - (r.left + r.width/2)) / window.innerWidth, y = (e.clientY - (r.top + r.height/2)) / window.innerHeight;
    tilt.style.setProperty("--ty", (-14 + x * 26).toFixed(2) + "deg"); tilt.style.setProperty("--tx", (8 - y * 18).toFixed(2) + "deg");
  });
  Array.prototype.forEach.call(document.querySelectorAll(".shot"), function(s){
    var img = s.querySelector("img"), flip = s.parentElement.classList.contains("flip");
    s.addEventListener("pointermove", function(e){
      if (window.innerWidth < 860) return;
      var r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      img.style.setProperty("--ry", ((flip ? 13 : -13) * (1 - Math.abs(x) * .6) + x * 6).toFixed(2) + "deg"); img.style.setProperty("--rx", (5 - y * 6).toFixed(2) + "deg");
    });
    s.addEventListener("pointerleave", function(){ img.style.removeProperty("--ry"); img.style.removeProperty("--rx"); });
  });
})();
