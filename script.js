/* ============================================================
   01) 메인 Hero 슬라이더 (자동 전환 + 모바일 스와이프)
============================================================ */
(() => {
  const slider = document.querySelector('.slider');
  if (!slider || slider.dataset.bound === '1') return;
  slider.dataset.bound = '1';

  const slides = [...slider.querySelectorAll('.slide')];
  if (slides.length === 0) return;           // 0장 방어
  let i = 0, timer = null, DELAY = 3000;

  slides.forEach((s, idx) => {
    s.decoding = 'async';
    s.loading = idx === 0 ? 'eager' : 'lazy';
  });

  function show(n) {
    slides[i]?.classList.remove('active');
    i = slides.length ? ((n + slides.length) % slides.length) : 0;
    slides[i]?.classList.add('active');
  }
  function next() { show(i + 1); }
  function start() {
    if (slides.length <= 1) return;          // 1장이면 타이머 불필요
    if (!timer) timer = setInterval(next, DELAY);
  }
  function stop()  { if (timer) { clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('pageshow', () => start()); // bfcache 복귀 대비

  const io = new IntersectionObserver(ents => {
    ents.forEach(e => (e.isIntersecting ? start() : stop()));
  }, { threshold: 0.2 });
  io.observe(slider);

  // 모바일 스와이프 (pointer 이벤트)
  let x0 = null;
  slider.addEventListener('pointerdown', e => { x0 = e.clientX; }, { passive: true });
  slider.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { stop(); show(i + (dx < 0 ? 1 : -1)); start(); }
  }, { passive: true });
  slider.addEventListener('pointercancel', () => { x0 = null; }, { passive: true });

  show(0); start();
})();

/* ============================================================
   02) 추억 사진 프리뷰: 무한 마키 (모바일 전용, 빈칸 없이)
============================================================ */
(() => {
  const row = document.querySelector('.cardRow.autoScroll');
  if (!row || row.dataset.bound === '1') return;
  row.dataset.bound = '1';

  const cards = [...row.children];
  if (cards.length === 0) return;

  // 1) 트랙 구성 (기존 카드들을 첫 트랙으로 이동)
  const track = document.createElement('div');
  track.className = 'marqueeTrack';
  cards.forEach(c => track.appendChild(c));
  row.appendChild(track);

  // 2) 이미지 로드 대기 후 시작 (Safari 초기 프레임 깜빡임 방지)
  const imgs = [...track.querySelectorAll('img')];
  const decodes = imgs.map(img => (img.decode ? img.decode().catch(()=>{}) : Promise.resolve()));

  Promise.all(decodes).then(() => {
    row.offsetWidth; // 강제 리플로우
    startMarquee();
  });

  function startMarquee() {
    const SPEED = 40;                // px/s
    let x = 0;
    let last = performance.now();
    let paused = false;

    // --- 클론 빌드: 첫 트랙 폭 + 화면폭 + 여유 2배 확보 ---
    function buildClones() {
      // 기존 복제본 제거 → 첫 트랙만 남김
      const all = [...row.querySelectorAll('.marqueeTrack')];
      all.forEach((t, idx) => { if (idx) t.remove(); });

      const base = all[0] || track;
      const firstW = base.scrollWidth;
      let total = firstW;
      while (total < row.clientWidth + firstW * 2) {
        const clone = base.cloneNode(true);
        row.appendChild(clone);
        total += clone.scrollWidth;
      }
      return [...row.querySelectorAll('.marqueeTrack')];
    }

    let tracks = buildClones();

    function tick(now) {
      if (!paused) {
        const dt = (now - last) / 1000;
        x -= SPEED * dt;

        const w = tracks[0].scrollWidth || 1;
        // x를 항상 [-w, 0) 범위로 정규화 → 6 다음 바로 1 이어짐
        if (x <= -w) x += w;
        if (x > 0)   x -= w;

        let offset = x;
        tracks.forEach(t => {
          // 서브픽셀로 생기는 얇은 틈 방지
          t.style.transform = `translate3d(${Math.round(offset)}px,0,0)`;
          offset += t.scrollWidth;
        });
      }
      last = now;
      requestAnimationFrame(tick);
    }

    // 가시성 제어
    const io = new IntersectionObserver(ents => {
      ents.forEach(e => { paused = !e.isIntersecting; last = performance.now(); });
    }, { threshold: 0.15 });
    io.observe(row);

    // 📱 터치 시 일시정지/재개
    ['touchstart','pointerdown'].forEach(ev => {
      row.addEventListener(ev, () => { paused = true; }, { passive: true });
    });
    ['touchend','touchcancel','pointerup'].forEach(ev => {
      row.addEventListener(ev, () => { paused = false; last = performance.now(); }, { passive: true });
    });

    // 탭 숨김/복귀, bfcache 복귀
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      last = performance.now();
    });
    window.addEventListener('pageshow', () => { paused = false; last = performance.now(); });

    // 화면 회전/리사이즈 시 트랙 재빌드 (디바운스)
    let rebuildTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(() => {
        paused = true;
        tracks = buildClones();
        x = 0;
        last = performance.now();
        paused = false;
      }, 120);
    });

    requestAnimationFrame(tick);
  }
})();


/* ============================================================
   03) Memories 모달 (버튼/탭 닫기)
============================================================ */
(() => {
  const grid = document.querySelector('.grid');
  const modal = document.querySelector('.modal');
  if (!grid || !modal) return;

  const modalImg = modal.querySelector('img');
  const caption = modal.querySelector('.modalCaption');
  const prevBtn = modal.querySelector('.navBtn.prev');
  const nextBtn = modal.querySelector('.navBtn.next');
  const thumbs = [...grid.querySelectorAll('.thumb')];
  let current = 0;

  function openModal(i) {
    const t = thumbs[i];
    if (!t) return;
    modalImg.src = t.dataset.full;
    caption.textContent = t.dataset.caption || '';
    modal.classList.add('open');
    current = i;
  }
  function closeModal() { modal.classList.remove('open'); }
  function showNext() { openModal((current + 1) % thumbs.length); }
  function showPrev() { openModal((current - 1 + thumbs.length) % thumbs.length); }

  grid.addEventListener('click', e => {
    const t = e.target.closest('.thumb');
    if (t) openModal(thumbs.indexOf(t));
  });
  modal.addEventListener('click', e => {
    if (e.target === modal || e.target.closest('[data-close]')) closeModal();
  });
  prevBtn?.addEventListener('click', showPrev);
  nextBtn?.addEventListener('click', showNext);

  // (모바일은 키보드 드뭄이지만 안전망)
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'Escape') closeModal();
  });
})();

/* ============================================================
   04) 함께한 날 수
============================================================ */
(() => {
  const main = document.getElementById('dayBadge');
  const sinceEl = document.getElementById('sinceLine');
  if (!main || !sinceEl) return;

  const firstDate = new Date('2019-09-19'); // 필요한 날짜로 유지/수정
  const today = new Date();
  const days = Math.floor((today - firstDate) / 86400000) + 1;

  const pad = n => String(n).padStart(2,'0');
  const y = firstDate.getFullYear();
  const m = pad(firstDate.getMonth() + 1);
  const d = pad(firstDate.getDate());

  main.textContent = `우리가 함께한 지 ${days}일째`;
  sinceEl.textContent = `${y}.${m}.${d} ~ 오늘`;
})();

/* ============================================================
   05) 한 줄 칭찬 티커
============================================================ */
(() => {
  const el = document.getElementById('msgTicker');
  if (!el) return;

  const lines = [
    '오늘의 주인공은 국민 ✨',
    '늘 한결같이 따뜻한 사랑 ♥️',
    '성실의 아이콘, 든든한 파워 J 📝',
    '오빤 나의 자랑이야 🌼'
  ];
  let i = 0;
  el.textContent = lines[i];

  setInterval(() => {
    el.classList.add('ticker','fade');
    setTimeout(() => {
      i = (i + 1) % lines.length;
      el.textContent = lines[i];
      el.classList.remove('fade');
    }, 500);
  }, 3000);
})();

/* ============================================================
   06) 하트 컨페티
============================================================ */
(() => {
  const box = document.getElementById('confetti');
  const btn = document.getElementById('confettiBtn');
  if (!box || !btn) return;

  function launchConfetti() {
    const colors = ['#6bb7b5','#ffb3c1','#ffd6e0','#cde7ff','#bfeeea'];
    for (let i = 0; i < 30; i++) {
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = '♥';
      h.style.left = Math.random() * 100 + 'vw';
      h.style.bottom = '-10px';
      h.style.color = colors[i % colors.length];
      h.style.fontSize = 16 + Math.random() * 12 + 'px';
      h.style.animationDelay = Math.random() * 0.8 + 's';
      h.style.animationDuration = 2 + Math.random() * 0.8 + 's';
      box.appendChild(h);
      setTimeout(() => h.remove(), 3200);
    }
  }
  btn.addEventListener('click', launchConfetti);
})();

/* ============================================================
   07) 이미지 저장 방지
============================================================ */
document.addEventListener('contextmenu', e => {
  if (e.target.closest('.no-download')) e.preventDefault();
});
document.querySelectorAll('.no-download img').forEach(img => {
  img.setAttribute('draggable','false');
  img.addEventListener('dragstart', e => e.preventDefault());
});
