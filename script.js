/* ============================================================
   🎞️ 01. 메인 Hero 자동 페이드 슬라이더
============================================================ */
(() => {
  const slider = document.querySelector('.slider');
  if (!slider) return;

  const slides = [...slider.querySelectorAll('.slide, img.slide')];
  let idx = 0;

  const show = (i) => slides.forEach((s, k) => s.classList.toggle('active', k === i));
  show(0);

  setInterval(() => {
    idx = (idx + 1) % slides.length;
    show(idx);
  }, 3000);
})();

/* ============================================================
   🖼️ 02. 추억 사진 자동 스크롤 (index 프리뷰)
============================================================ */
(() => {
  const row = document.querySelector('.cardRow.autoScroll');
  if (!row) return;

  let scrollPos = 0;
  const scrollStep = () => {
    scrollPos += row.clientWidth;
    if (scrollPos >= row.scrollWidth) scrollPos = 0;
    row.scrollTo({ left: scrollPos, behavior: 'smooth' });
  };

  setInterval(scrollStep, 3000);
})();

/* ============================================================
   💬 03. 추억사진 전체보기 모달 (좌우 이동 기능 포함)
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

  const openModal = (index) => {
    const t = thumbs[index];
    if (!t) return;
    modalImg.src = t.dataset.full;
    caption.textContent = t.dataset.caption || '';
    modal.classList.add('open');
    current = index;
  };

  const closeModal = () => modal.classList.remove('open');
  const showNext = () => openModal((current + 1) % thumbs.length);
  const showPrev = () => openModal((current - 1 + thumbs.length) % thumbs.length);

  grid.addEventListener('click', (e) => {
    const t = e.target.closest('.thumb');
    if (t) openModal(thumbs.indexOf(t));
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) closeModal();
  });

  prevBtn?.addEventListener('click', showPrev);
  nextBtn?.addEventListener('click', showNext);

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'Escape') closeModal();
  });
})();

/* ============================================================
   📅 04. 함께한 날 수 계산
============================================================ */
(() => {
  const main = document.getElementById('dayBadge');
  const sinceEl = document.getElementById('sinceLine');
  if (!main || !sinceEl) return;

  const firstDate = new Date('2022-09-19');
  const today = new Date();
  const days = Math.floor((today - firstDate) / 86400000) + 1;

  const pad = (n) => String(n).padStart(2, '0');
  const y = firstDate.getFullYear();
  const m = pad(firstDate.getMonth() + 1);
  const d = pad(firstDate.getDate());

  main.textContent = `우리가 함께한 지 ${days}일째`;
  sinceEl.textContent = `${y}.${m}.${d} ~ 오늘`;
})();

/* ============================================================
   💖 05. 한 줄 칭찬 / 메시지 티커
============================================================ */
(() => {
  const el = document.getElementById('msgTicker');
  if (!el) return;

  const lines = [
    '오늘의 주인공은 국민 ✨',
    '성실의 아이콘, 자랑스러운 파워 J 📝',
    '늘 한결같이 따뜻한 사랑 ♥️',
    '오빤 내게 감동이야 🌼',
  ];

  let i = 0;
  el.textContent = lines[i];

  setInterval(() => {
    el.classList.add('ticker', 'fade');
    setTimeout(() => {
      i = (i + 1) % lines.length;
      el.textContent = lines[i];
      el.classList.remove('fade');
    }, 500);
  }, 3000);
})();

/* ============================================================
   💚 06. 하트 컨페티 (부드럽게 천천히 흩날리는 민트·핑크·하늘톤)
============================================================ */
(() => {
  const box = document.getElementById('confetti');
  if (!box) return;

  function launchConfetti() {
    // 💚 민트 + 💗 핑크 + 💙 하늘빛 조합
    const colors = ['#6bb7b5', '#ffb3c1', '#ffd6e0', '#cde7ff', '#bfeeea'];

    for (let i = 0; i < 36; i++) { // 🌸 하트 개수 24 → 36개로 증가
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = '♥';
      h.style.left = Math.random() * 100 + 'vw';
      h.style.bottom = '0';
      h.style.color = colors[i % colors.length];
      h.style.fontSize = 16 + Math.random() * 10 + 'px'; // 크기 약간 랜덤
      h.style.animationDelay = Math.random() * 0.8 + 's';
      h.style.animationDuration = 2 + Math.random() * 0.8 + 's'; // 🌿 2~2.8초 사이로 부드럽게
      box.appendChild(h);
      setTimeout(() => h.remove(), 2800);
    }
  }

  // 버튼 클릭 시 실행
  const btn = document.getElementById('confettiBtn');
  btn?.addEventListener('click', launchConfetti);
})();

/* ============================================================
   🔒 07. 이미지 저장 방지
============================================================ */
// 우클릭 방지
document.addEventListener(
  'contextmenu',
  (e) => {
    if (e.target.closest && e.target.closest('.no-download')) e.preventDefault();
  },
  { passive: false }
);

// 드래그 방지
document.querySelectorAll('.no-download img').forEach((img) => {
  img.setAttribute('draggable', 'false');
  img.addEventListener('dragstart', (e) => e.preventDefault());
});
