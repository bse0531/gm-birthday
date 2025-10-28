/* ===== 01. 메인 Hero 자동 페이드 슬라이더 ===== */
(function(){
  var slider = document.querySelector('.slider');
  if(!slider) return;
  var slides = Array.prototype.slice.call(slider.querySelectorAll('.slide, img.slide'));
  var idx = 0;
  function show(i){ slides.forEach(function(s,k){ s.classList.toggle('active', k===i); }); }
  show(0);
  setInterval(function(){
    idx = (idx+1) % slides.length;
    show(idx);
  }, 3000);
})();

/* ===== 02. 추억 사진 자동 스크롤(프리뷰) ===== */
(function(){
  var row = document.querySelector('.cardRow.autoScroll');
  if(!row) return;
  var scrollPos = 0;
  setInterval(function(){
    scrollPos += row.clientWidth;
    if(scrollPos >= row.scrollWidth) scrollPos = 0;
    row.scrollTo({left: scrollPos, behavior: 'smooth'});
  }, 3000);
})();

/* ===== 03. (memories 전용) 모달: 좌우 이동 ===== */
(function(){
  var grid = document.querySelector('.grid');
  var modal = document.querySelector('.modal');
  if(!grid || !modal) return;

  var modalImg = modal.querySelector('img');
  var caption = modal.querySelector('.modalCaption');
  var prevBtn = modal.querySelector('.navBtn.prev');
  var nextBtn = modal.querySelector('.navBtn.next');
  var thumbs = Array.prototype.slice.call(grid.querySelectorAll('.thumb'));
  var current = 0;

  function openModal(i){
    var t = thumbs[i]; if(!t) return;
    modalImg.src = t.dataset.full;
    caption.textContent = t.dataset.caption || '';
    modal.classList.add('open');
    current = i;
  }
  function closeModal(){ modal.classList.remove('open'); }
  function showNext(){ openModal((current+1) % thumbs.length); }
  function showPrev(){ openModal((current-1+thumbs.length) % thumbs.length); }

  grid.addEventListener('click', function(e){
    var t = e.target.closest('.thumb');
    if(t) openModal(thumbs.indexOf(t));
  });
  modal.addEventListener('click', function(e){
    if(e.target === modal || e.target.closest('[data-close]')) closeModal();
  });
  if(prevBtn) prevBtn.addEventListener('click', showPrev);
  if(nextBtn) nextBtn.addEventListener('click', showNext);
  document.addEventListener('keydown', function(e){
    if(!modal.classList.contains('open')) return;
    if(e.key==='ArrowRight') showNext();
    if(e.key==='ArrowLeft') showPrev();
    if(e.key==='Escape') closeModal();
  });
})();

/* ===== 04. 함께한 날 수 ===== */
(function(){
  var main = document.getElementById('dayBadge');
  var sinceEl = document.getElementById('sinceLine');
  if(!main || !sinceEl) return;

  var firstDate = new Date('2022-09-19');
  var today = new Date();
  var days = Math.floor((today - firstDate) / 86400000) + 1;

  var pad = function(n){ return String(n).padStart(2,'0'); };
  var y = firstDate.getFullYear();
  var m = pad(firstDate.getMonth()+1);
  var d = pad(firstDate.getDate());

  main.textContent = '우리가 함께한 지 ' + days + '일째';
  sinceEl.textContent = y + '.' + m + '.' + d + ' ~ 오늘';
})();

/* ===== 05. 한 줄 칭찬/메시지 티커 ===== */
(function(){
  var el = document.getElementById('msgTicker');
  if(!el) return;
  var lines = [
    '오늘의 주인공은 국민 ✨',
    '성실의 아이콘, 자랑스러운 파워 J 📝',
    '늘 한결같이 따뜻한 사랑 ♥️',
    '오빤 내게 감동이야 🌼'
  ];
  var i = 0;
  el.textContent = lines[i];
  setInterval(function(){
    el.classList.add('ticker','fade');
    setTimeout(function(){
      i = (i+1) % lines.length;
      el.textContent = lines[i];
      el.classList.remove('fade');
    }, 500);
  }, 3000);
})();

/* ===== 06. 하트 컨페티(버튼 클릭) ===== */
(function(){
  var box = document.getElementById('confetti');
  var btn = document.getElementById('confettiBtn');
  if(!box || !btn) return;             // 두 요소 모두 있어야 작동

  function launchConfetti(){
    var colors = ['#6bb7b5','#ffb3c1','#ffd6e0','#cde7ff','#bfeeea'];
    for(var i=0;i<30;i++){
      var h = document.createElement('div');
      h.className = 'heart';
      h.textContent = '♥';             // 이모지 말고 텍스트 하트(색 적용됨)
      h.style.left = (Math.random()*100)+'vw';
      h.style.bottom = '-10px';
      h.style.color = colors[i % colors.length];
      h.style.fontSize = (16 + Math.random()*12) + 'px';
      h.style.animationDelay = (Math.random()*0.8) + 's';
      h.style.animationDuration = (2 + Math.random()*0.8) + 's';
      box.appendChild(h);
      setTimeout(function(node){ node.remove(); }, 3200, h);
    }
  }
  btn.addEventListener('click', launchConfetti);
})();

/* ===== 07. 이미지 저장 방지 ===== */
document.addEventListener('contextmenu', function(e){
  if(e.target.closest && e.target.closest('.no-download')){
    e.preventDefault();
  }
}, {passive:false});

Array.prototype.forEach.call(
  document.querySelectorAll('.no-download img'),
  function(img){
    img.setAttribute('draggable','false');
    img.addEventListener('dragstart', function(e){ e.preventDefault(); });
  }
);
