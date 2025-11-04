<script>
/* ============================================================
   01) 메인 Hero 슬라이더 (자동 전환 + 중복 방지)
============================================================ */
(() => {
  const slider = document.querySelector('.slider');
  if (!slider || slider.dataset.bound === '1') return;
  slider.dataset.bound = '1';

  const slides = [...slider.querySelectorAll('.slide')];
  let i = 0, timer = null, DELAY = 3000;

  slides.forEach((s, idx) => {
    s.decoding = 'async';
    s.loading  = idx === 0 ? 'eager' : 'lazy';
  });

  function show(n){ slides[i]?.classList.remove('active'); i = (n + slides.length) % slides.length; slides[i]?.classList.add('active'); }
  function next(){ show(i + 1); }
  function start(){ if (!timer) timer = setInterval(next, DELAY); }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  const io = new IntersectionObserver(ents => ents.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.2 });
  io.observe(slider);

  let x0 = null;
  slider.addEventListener('pointerdown', e => (x0 = e.clientX), { passive: true });
  slider.addEventListener('pointerup',   e => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { stop(); show(i + (dx < 0 ? 1 : -1)); start(); }
  }, { passive: true });

  show(0); start();
})();

/* ============================================================
   02) 추억 사진 프리뷰: 무한 마키 (트랙 회전 방식, 빈칸 방지)
============================================================ */
(() => {
  const row = document.querySelector('.cardRow.autoScroll');
  if (!row || row.dataset.bound === '1') return;
  row.dataset.bound = '1';

  const cards = [...row.children];
  if (!cards.length) return;

  // 1) 첫 트랙 구성
  const base = document.createElement('div');
  base.className = 'marqueeTrack';
  cards.forEach(c => base.appendChild(c));
  row.appendChild(base);

  // 2) 이미지 로드 대기 (폭 확정)
  const imgs = [...base.querySelectorAll('img')];
  const decodes = imgs.map(i => (i.decode ? i.decode().catch(()=>{}) : Promise.resolve()));
  Promise.all(decodes).then(() => {
    void row.offsetWidth; // Safari flicker guard
    start();
  });

  function start() {
    const SPEED = 40;      // px/s
    const EPS   = 0.5;     // 1px 미만 오차 흡수
    let paused  = false;
    let last    = performance.now();
    let x       = 0;       // 전체 벨트 오프셋

    // ▷ 뷰포트를 충분히 덮도록 복제 (기준폭 firstW 한 번만 측정)
    function ensureFill() {
      // 기존 추가분 제거, base만 남김
      const all = [...row.querySelectorAll('.marqueeTrack')];
      all.forEach((t, idx) => { if (idx) t.remove(); });
      const baseTrack = all[0] || base;

      // 레이아웃 강제 – 폭이 0으로 읽히는 타이밍 이슈 방지
      void baseTrack.offsetWidth;

      const firstW = Math.max(
        1,
        Math.round(baseTrack.scrollWidth || baseTrack.getBoundingClientRect().width)
      );
      let total = firstW;
      const need = row.clientWidth + firstW * 2; // 최소 2배 커버

      while (total < need) {
        row.appendChild(baseTrack.cloneNode(true));
        total += firstW; // 복제 폭을 다시 측정하지 않고 기준폭만 더함
      }
      return [...row.querySelectorAll('.marqueeTrack')];
    }

    let tracks = ensureFill();

    function tick(now) {
      if (!paused) {
        const dt = (now - last) / 1000;
        x -= SPEED * dt;

        // 트랙 회전: 왼쪽으로 완전히 빠진 트랙은 맨 뒤로 이동
        let offset = x;
        for (let idx = 0; idx < tracks.length; idx++) {
          const t = tracks[idx];
          const w = t.scrollWidth || 1;

          if (offset + w < -EPS) {
            const moved = tracks.shift();
            row.appendChild(moved);
            // moved를 꼬리 뒤에 붙였으니 offset 재계산
            const tailWidth = tracks.reduce((a,n)=>a + (n.scrollWidth || 0), 0);
            offset = x + tailWidth;
            tracks.push(moved);
          }

          t.style.transform = `translate3d(${Math.floor(offset)}px,0,0)`;
          offset += w;
        }
      }
      last = now;
      requestAnimationFrame(tick);
    }

    // 가시성/상호작용 제어
    const io = new IntersectionObserver(ents => {
      ents.forEach(e => { paused = !e.isIntersecting; last = performance.now(); });
    }, { threshold: 0.15 });
    io.observe(row);

    ['touchstart','pointerdown'].forEach(ev => row.addEventListener(ev, ()=>{ paused = true; }, { passive: true }));
    ['touchend','touchcancel','pointerup'].forEach(ev => row.addEventListener(ev, ()=>{ paused = false; last = performance.now(); }, { passive: true }));

    document.addEventListener('visibilitychange', () => { paused = document.hidden; last = performance.now(); });

    // 리사이즈 시에도 항상 충분히 덮도록 보정
    let rAF = null;
    const ro = new ResizeObserver(() => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        tracks = ensureFill();
        last = performance.now();
      });
    });
    ro.observe(row);

    requestAnimationFrame(tick);
  }
})();

/* ============================================================
   03) Memories 모달
============================================================ */
(() => {
  const grid  = document.querySelector('.grid');
  const modal = document.querySelector('.modal');
  if (!grid || !modal) return;

  const modalImg = modal.querySelector('img');
  const caption  = modal.querySelector('.modalCaption');
  const prevBtn  = modal.querySelector('.navBtn.prev');
  const nextBtn  = modal.querySelector('.navBtn.next');
  const thumbs   = [...grid.querySelectorAll('.thumb')];
  let current = 0;

  function openModal(i){
    const t = thumbs[i]; if (!t) return;
    modalImg.src = t.dataset.full;
    caption.textContent = t.dataset.caption || '';
    modal.classList.add('open');
    current = i;
  }
  function closeModal(){ modal.classList.remove('open'); }
  function showNext(){ openModal((current + 1) % thumbs.length); }
  function showPrev(){ openModal((current - 1 + thumbs.length) % thumbs.length); }

  grid.addEventListener('click', e => { const t = e.target.closest('.thumb'); if (t) openModal(thumbs.indexOf(t)); });
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
  prevBtn?.addEventListener('click', showPrev);
  nextBtn?.addEventListener('click', showNext);

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'Escape')     closeModal();
  });
})();

/* ============================================================
   04) 함께한 날 수
============================================================ */
(() => {
  const main = document.getElementById('dayBadge');
  const sinceEl = document.getElementById('sinceLine');
  if (!main || !sinceEl) return;

  const firstDate = new Date('2019-09-19');
  const today = new Date();
  const days = Math.floor((today - firstDate) / 86400000) + 1;

  const pad = n => String(n).padStart(2,'0');
  const y = firstDate.getFullYear();
  const m = pad(firstDate.getMonth() + 1);
  const d = pad(firstDate.getDate());

  main.textContent  = `우리가 함께한 지 ${days}일째`;
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
    '늘 한결같이 따뜻한 사랑 🧡',
    '오빤 나의 자랑이야 🌼',
    '성실의 아이콘, 든든한 파워 J 🍀'
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
document.addEventListener('contextmenu', e => { if (e.target.closest('.no-download')) e.preventDefault(); });
document.querySelectorAll('.no-download img').forEach(img => {
  img.setAttribute('draggable','false');
  img.addEventListener('dragstart', e => e.preventDefault());
});

/* ============================================================
   08) 다크모드 플로팅 토글 버튼 🌙/🌞 (자동 생성)
============================================================ */
(() => {
  const THEME_KEY = 'theme-mode';
  const root = document.documentElement;

  // 현재 테마 적용 (localStorage > 시스템 기본)
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') root.classList.add('dark');
  else if (saved === 'light') root.classList.remove('dark');
  else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) root.classList.add('dark');

  // 버튼 생성/삽입
  const fab = document.createElement('button');
  fab.id = 'themeFab';
  fab.className = 'themeFab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Toggle color theme');

  const setIcon = () => { fab.textContent = root.classList.contains('dark') ? '🌞' : '🌙'; };
  setIcon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(fab), { once: true });
  } else {
    document.body.appendChild(fab);
  }

  fab.addEventListener('click', () => {
    const dark = root.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    setIcon();
  }, { passive: true });

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', (e) => {
      if (localStorage.getItem(THEME_KEY)) return; // 사용자가 선택했으면 시스템 변화 무시
      if (e.matches) root.classList.add('dark'); else root.classList.remove('dark');
      setIcon();
    });
  }
})();
</script>
