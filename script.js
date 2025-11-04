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
    s.loading = idx === 0 ? 'eager' : 'lazy';
  });

  function show(n) {
    slides[i]?.classList.remove('active');
    i = (n + slides.length) % slides.length;
    slides[i]?.classList.add('active');
  }
  function next() { show(i + 1); }
  function start() { if (!timer) timer = setInterval(next, DELAY); }
  function stop()  { if (timer) { clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  const io = new IntersectionObserver(ents => {
    ents.forEach(e => e.isIntersecting ? start() : stop());
  }, { threshold: 0.2 });
  io.observe(slider);

  let x0 = null;
  slider.addEventListener('pointerdown', e => x0 = e.clientX, { passive: true });
  slider.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { stop(); show(i + (dx < 0 ? 1 : -1)); start(); }
  }, { passive: true });

  show(0); start();
})();

/* ============================================================
   02) 추억 사진 프리뷰: 무한 마키 (데스크탑 리사이즈 안정화)
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

  // 2) 이미지 디코드 대기
  const imgs = [...track.querySelectorAll('img')];
  const decodes = imgs.map(img => (img.decode ? img.decode().catch(()=>{}) : Promise.resolve()));
  Promise.all(decodes).then(() => {
    row.offsetWidth; // Safari 깜빡임 방지
    startMarquee();
  });

  function startMarquee() {
    const SPEED = 40;
    const EPS   = 0.001;           // 정규화 경계치 여유
    let x = 0;
    let last = performance.now();
    let paused = false;

    function buildClones() {
  // 1) 기존 추가분 제거 (항상 1개만 남김)
  const all = [...row.querySelectorAll('.marqueeTrack')];
  all.forEach((t, idx) => { if (idx) t.remove(); });
  const base = all[0] || track;

  // 2) 레이아웃 강제 계산(사파리 방지)
  //    base 폭을 확실히 얻기 위해 reflow 한 번
  void base.offsetWidth;

  // 3) 기준 폭 측정
  const firstW = Math.max(1, Math.round(base.scrollWidth || base.getBoundingClientRect().width));

  // 4) "컨테이너폭 + 기준폭*2" 이상이 될 때까지 복제
  //    (기준폭을 매번 그대로 더해서 타이밍/레이아웃 이슈 회피)
  let total = firstW;
  const need = row.clientWidth + firstW * 2;
  while (total < need) {
    row.appendChild(base.cloneNode(true));
    total += firstW;
  }

  return [...row.querySelectorAll('.marqueeTrack')];
}


    let tracks = buildClones();

    function normalizeX(w) {
      // x를 (-w, 0] 범위로 강제 정규화
      while (x <= -w - EPS) x += w;
      while (x > 0 + EPS)   x -= w;
      // 경계값에 걸리면 살짝 안쪽으로
      if (Math.abs(x + w) <= EPS) x = -w + EPS;
      if (Math.abs(x) <= EPS)     x = -EPS;
    }

    function tick(now) {
      if (!paused) {
        const dt = (now - last) / 1000;
        x -= SPEED * dt;

        const w = tracks[0].scrollWidth || 1;
        normalizeX(w);

        let offset = x;
        tracks.forEach(t => {
          t.style.transform = `translate3d(${Math.floor(offset)}px,0,0)`; // 앞당김으로 겹침/깜빡임 제거
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

    // 모바일/데스크탑 상호작용 시 일시정지/재개
    ['touchstart','pointerdown'].forEach(ev => {
      row.addEventListener(ev, () => { paused = true; }, { passive: true });
    });
    ['touchend','touchcancel','pointerup'].forEach(ev => {
      row.addEventListener(ev, () => { paused = false; last = performance.now(); }, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      last = performance.now();
    });
    window.addEventListener('pageshow', () => { paused = false; last = performance.now(); });

    // === 가로 폭 변할 때만 재빌드 (진행도 보존 + rAF 코얼레스) ===
    let containerW = row.clientWidth;
    let roRAF = null;
    const ro = new ResizeObserver(entries => {
      const wNow = Math.round(entries[0].contentRect.width || row.clientWidth);
      if (Math.abs(wNow - containerW) < 2) return; // 세로/주소창 변화 무시
      containerW = wNow;

      if (roRAF) cancelAnimationFrame(roRAF);
      roRAF = requestAnimationFrame(() => {
        const wOld = tracks[0].scrollWidth || 1;
        let progress = (-x) / wOld;              // 0~1
        // 경계값에서 점프 방지
        if (!isFinite(progress)) progress = 0;
        progress = Math.min(Math.max(progress, 0), 0.9999);

        paused = true;

        const all = [...row.querySelectorAll('.marqueeTrack')];
        all.forEach((t, idx) => { if (idx) t.remove(); });
        const base = all[0] || track;
        const firstW = base.scrollWidth;
        let total = firstW;
        while (total < row.clientWidth + firstW * 3) {
          const clone = base.cloneNode(true);
          row.appendChild(clone);
          total += clone.scrollWidth;
        }
        tracks = [...row.querySelectorAll('.marqueeTrack')];

        const wNew = tracks[0].scrollWidth || 1;
        x = -progress * wNew;
        normalizeX(wNew);

        last = performance.now();
        paused = false;
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

  const firstDate = new Date('2019-09-19');
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
document.addEventListener('contextmenu', e => {
  if (e.target.closest('.no-download')) e.preventDefault();
});
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
  if (saved === 'dark') {
    root.classList.add('dark');
  } else if (saved === 'light') {
    root.classList.remove('dark');
  } else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    }
  }

  // 버튼 생성/삽입
  const fab = document.createElement('button');
  fab.id = 'themeFab';
  fab.className = 'themeFab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Toggle color theme');

  const setIcon = () => {
    const dark = root.classList.contains('dark');
    fab.textContent = dark ? '🌞' : '🌙';
  };
  setIcon();

  // 안전하게 body 끝에 추가
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(fab), { once: true });
  } else {
    document.body.appendChild(fab);
  }

  // 토글 동작
  fab.addEventListener('click', () => {
    const dark = root.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    setIcon();
  }, { passive: true });

  // 시스템 테마가 바뀌었을 때(사용자가 수동 선택 안 했으면만) 반영
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', (e) => {
      const userSet = localStorage.getItem(THEME_KEY); // 있으면 사용자 우선
      if (userSet) return;
      if (e.matches) root.classList.add('dark'); else root.classList.remove('dark');
      setIcon();
    });
  }
})();
