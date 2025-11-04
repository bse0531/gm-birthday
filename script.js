/* ============================================================
   01) 메인 Hero 슬라이더 (부드럽게 + 중복타이머 방지)
============================================================ */
(function () {
  var slider = document.querySelector('.slider');
  if (!slider) return;

  if (slider.dataset.bound === '1') return;
  slider.dataset.bound = '1';

  var slides = Array.prototype.slice.call(slider.querySelectorAll('.slide, img.slide'));
  var i = 0, timer = null, DELAY = 3000;

  // 이미지 디코딩/프리로드
  slides.forEach(function (s, idx) {
    if (s.tagName === 'IMG') {
      s.decoding = 'async';
      s.loading = idx === 0 ? 'eager' : 'lazy';
    }
  });
  slides.slice(1).forEach(function (s) {
    var src = s.getAttribute('src') || (s.querySelector && s.querySelector('img') && s.querySelector('img').getAttribute('src'));
    if (src) { var im = new Image(); im.src = src; }
  });

  function show(n) {
    if (slides[i]) slides[i].classList.remove('active');
    i = (n + slides.length) % slides.length;
    if (slides[i]) slides[i].classList.add('active');
  }
  function next() { show(i + 1); }
  function start() { if (!timer) timer = setInterval(next, DELAY); }
  function stop()  { if (timer) { clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (e) { e.isIntersecting ? start() : stop(); });
  }, { threshold: 0.2 });
  io.observe(slider);

  // 간단 스와이프
  var x0 = null;
  slider.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  slider.addEventListener('pointerup', function (e) {
    if (x0 == null) return;
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { stop(); show(i + (dx < 0 ? 1 : -1)); start(); }
  });

  show(0); start();
})();


/* ============================================================
   02) 추억 사진 프리뷰: rAF 무한 가로 스크롤(부드럽게)
============================================================ */
/* ============================================================
   🖼️ 추억 사진 프리뷰: rAF 마키(트랙 복제, 이미지 로드 대기)
============================================================ */
(() => {
  const row = document.querySelector('.cardRow.autoScroll');
  if (!row) return;

  // 중복 바인딩 방지
  if (row.dataset.bound === '1') return;
  row.dataset.bound = '1';

  // 1) 기존 카드 수집
  const cards = Array.from(row.children);
  if (cards.length === 0) return;

  // 2) 트랙 생성하고, 기존 카드를 트랙으로 이동
  const track = document.createElement('div');
  track.className = 'marqueeTrack';
  cards.forEach(c => track.appendChild(c));
  row.appendChild(track);

  // 3) 이미지 로드 대기(폭 계산 정확히)
  const imgs = Array.from(track.querySelectorAll('img'));
  const decodes = imgs.map(img => (img.decode ? img.decode().catch(()=>{}) : Promise.resolve()));
  Promise.all(decodes).then(startMarquee);

  function startMarquee() {
    // 4) 트랙을 복제하여 이음새 없는 무한 루프 구성
    //    (트랙의 총폭 >= 컨테이너폭 * 2가 되도록 복제)
    const need = row.clientWidth * 2;
    let trackWidth = track.scrollWidth;
    while (trackWidth < need) {
      const clone = track.cloneNode(true);
      row.appendChild(clone);
      trackWidth += clone.scrollWidth;
    }

    // 5) 애니메이션 상태
    const tracks = Array.from(row.querySelectorAll('.marqueeTrack'));
    let x = 0;
    const SPEED = 40; // px/s
    let last = performance.now();
    let paused = false;

    // 6) rAF 루프
    function tick(now) {
      if (!paused) {
        const dt = (now - last) / 1000;
        x -= SPEED * dt; // 왼쪽으로 흐르도록 -
        // 한 트랙 폭 기준으로 모듈러 (첫번째 트랙의 폭 사용)
        const w = tracks[0].scrollWidth;
        if (Math.abs(x) >= w) x += w; // 한 폭 만큼 넘어가면 되돌림

        // 각 트랙의 위치 배치
        let offset = x;
        tracks.forEach((t, idx) => {
          t.style.transform = `translate3d(${offset}px,0,0)`;
          offset += t.scrollWidth;
        });
      }
      last = now;
      requestAnimationFrame(tick);
    }

    // 7) 가시성/상호작용/탭 비가시 처리
    const io = new IntersectionObserver(ents => {
      ents.forEach(e => {
        paused = !e.isIntersecting;
        last = performance.now();
      });
    }, { threshold: 0.15 });
    io.observe(row);

    ['pointerdown','mouseenter','focusin','touchstart'].forEach(ev => {
      row.addEventListener(ev, () => { paused = true; }, { passive: true });
    });
    ['pointerup','mouseleave','focusout','touchend','touchcancel'].forEach(ev => {
      row.addEventListener(ev, () => { paused = false; last = performance.now(); }, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      last = performance.now();
    });

    // 8) 시작!
    requestAnimationFrame(tick);
  }
})();


/* ============================================================
   03) (memories 전용) 모달: 좌우 이동/키보드 닫기
============================================================ */
(function () {
  var grid = document.querySelector('.grid');
  var modal = document.querySelector('.modal');
  if (!grid || !modal) return;

  var modalImg = modal.querySelector('img');
  var caption = modal.querySelector('.modalCaption');
  var prevBtn = modal.querySelector('.navBtn.prev');
  var nextBtn = modal.querySelector('.navBtn.next');
  var thumbs = Array.prototype.slice.call(grid.querySelectorAll('.thumb'));
  var current = 0;

  function openModal(i) {
    var t = thumbs[i]; if (!t) return;
    modalImg.src = t.dataset.full;
    caption.textContent = t.dataset.caption || '';
    modal.classList.add('open');
    current = i;
  }
  function closeModal() { modal.classList.remove('open'); }
  function showNext() { openModal((current + 1) % thumbs.length); }
  function showPrev() { openModal((current - 1 + thumbs.length) % thumbs.length); }

  grid.addEventListener('click', function (e) {
    var t = e.target.closest('.thumb');
    if (t) openModal(thumbs.indexOf(t));
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal || (e.target.closest && e.target.closest('[data-close]'))) closeModal();
  });
  if (prevBtn) prevBtn.addEventListener('click', showPrev);
  if (nextBtn) nextBtn.addEventListener('click', showNext);

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'Escape') closeModal();
  });
})();


/* ============================================================
   04) 함께한 날 수
============================================================ */
(function () {
  var main = document.getElementById('dayBadge');
  var sinceEl = document.getElementById('sinceLine');
  if (!main || !sinceEl) return;

  var firstDate = new Date('2022-09-19');
  var today = new Date();
  var days = Math.floor((today - firstDate) / 86400000) + 1;

  function pad(n) { return String(n).padStart(2,'0'); }
  var y = firstDate.getFullYear();
  var m = pad(firstDate.getMonth() + 1);
  var d = pad(firstDate.getDate());

  main.textContent = '우리가 함께한 지 ' + days + '일째';
  sinceEl.textContent = y + '.' + m + '.' + d + ' ~ 오늘';
})();


/* ============================================================
   05) 한 줄 칭찬 / 메시지 티커
============================================================ */
(function () {
  var el = document.getElementById('msgTicker');
  if (!el) return;

  var lines = [
    '오늘의 주인공은 국민 ✨',
    '늘 한결같이 따뜻한 사랑 ♥️',
    '성실의 아이콘, 든든한 파워 J 📝',
    '오빤 나의 자랑이야 🌼'
  ];
  var i = 0;
  el.textContent = lines[i];

  setInterval(function () {
    el.classList.add('ticker', 'fade');
    setTimeout(function () {
      i = (i + 1) % lines.length;
      el.textContent = lines[i];
      el.classList.remove('fade');
    }, 500);
  }, 3000);
})();


/* ============================================================
   06) 하트 컨페티(버튼 클릭) — 민트 팔레트
============================================================ */
(function () {
  var box = document.getElementById('confetti');
  var btn = document.getElementById('confettiBtn');
  if (!box || !btn) return;

  function launchConfetti() {
    var colors = ['#6bb7b5','#ffb3c1','#ffd6e0','#cde7ff','#bfeeea'];
    for (var i = 0; i < 30; i++) {
      var h = document.createElement('div');
      h.className = 'heart';
      h.textContent = '♥'; // 텍스트 하트 → 색 적용됨
      h.style.left = (Math.random() * 100) + 'vw';
      h.style.bottom = '-10px';
      h.style.color = colors[i % colors.length];
      h.style.fontSize = (16 + Math.random() * 12) + 'px';
      h.style.animationDelay = (Math.random() * 0.8) + 's';
      h.style.animationDuration = (2 + Math.random() * 0.8) + 's';
      box.appendChild(h);
      (function (node) {
        setTimeout(function () { node.remove(); }, 3200);
      })(h);
    }
  }
  btn.addEventListener('click', launchConfetti);
})();


/* ============================================================
   07) 이미지 저장 방지 (우클릭/드래그)
============================================================ */
document.addEventListener('contextmenu', function (e) {
  if (e.target.closest && e.target.closest('.no-download')) {
    e.preventDefault();
  }
}, { passive: false });

Array.prototype.forEach.call(
  document.querySelectorAll('.no-download img'),
  function (img) {
    img.setAttribute('draggable', 'false');
    img.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
);
