// Simple auto-fading slider for index hero
(function(){
  const slider = document.querySelector('.slider');
  if(!slider) return;
  const slides = [...slider.querySelectorAll('.slide')];
  let idx = 0;
  function show(i){
    slides.forEach((s,k)=> s.classList.toggle('active', k===i));
  }
  show(0);
  setInterval(()=>{
    idx = (idx+1) % slides.length;
    show(idx);
  }, 3000);
})();

// Horizontal auto-scrolling row for memories preview
(function(){
  const row = document.querySelector('.cardRow.autoScroll');
  if(!row) return;
  let scrollPos = 0;
  setInterval(()=>{
    scrollPos += row.clientWidth; // move one 'page' per tick
    if (scrollPos >= row.scrollWidth) scrollPos = 0;
    row.scrollTo({left: scrollPos, behavior:'smooth'});
  }, 3000);
})();

// Modal for memories grid + 좌우 이동 기능
(function(){
  const grid = document.querySelector('.grid');
  const modal = document.querySelector('.modal');
  if(!grid || !modal) return;

  const modalImg = modal.querySelector('img');
  const caption = modal.querySelector('.modalCaption');
  const prevBtn = modal.querySelector('.navBtn.prev');
  const nextBtn = modal.querySelector('.navBtn.next');
  const thumbs = [...grid.querySelectorAll('.thumb')];
  let current = 0;

  function openModal(index){
    const t = thumbs[index];
    modalImg.src = t.dataset.full;
    caption.textContent = t.dataset.caption || '';
    modal.classList.add('open');
    current = index;
  }

  function closeModal(){
    modal.classList.remove('open');
  }

  function showNext(){
    current = (current + 1) % thumbs.length;
    openModal(current);
  }

  function showPrev(){
    current = (current - 1 + thumbs.length) % thumbs.length;
    openModal(current);
  }

  grid.addEventListener('click', (e)=>{
    const t = e.target.closest('.thumb');
    if(!t) return;
    openModal(thumbs.indexOf(t));
  });

  modal.addEventListener('click', (e)=>{
    if(e.target === modal || e.target.closest('[data-close]')) closeModal();
  });

  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);

  document.addEventListener('keydown', (e)=>{
    if(!modal.classList.contains('open')) return;
    if(e.key === 'ArrowRight') showNext();
    if(e.key === 'ArrowLeft') showPrev();
    if(e.key === 'Escape') closeModal();
  });
})();



// ① 함께한 날 수
(function(){
  const main = document.getElementById('dayBadge');
  const sinceEl = document.getElementById('sinceLine');
  if(!main || !sinceEl) return;

  const firstDate = new Date('2022-09-19'); // ← 실제 날짜로
  const today = new Date();
  const days = Math.floor((today - firstDate)/86400000) + 1;

  // YYYY.MM.DD 포맷
  const pad = n => String(n).padStart(2,'0');
  const y = firstDate.getFullYear();
  const m = pad(firstDate.getMonth()+1);
  const d = pad(firstDate.getDate());

  main.textContent = `우리가 함께한 지 ${days}일째`;
  sinceEl.textContent = `${y}.${m}.${d} ~ 오늘`;
})();

// ② 한 줄 칭찬/메시지 티커 (인용 카드)
(function(){
  const el = document.getElementById('msgTicker'); if(!el) return;
  const lines = [
    '오늘의 주인공은 국민 ✨',
    '성실의 아이콘, 자랑스러운 파워 J 📝',
    '늘 한결같이 따뜻한 사랑 ♥️',
    '오빤 내게 감동이야 🌼'
  ];
  let i = 0; el.textContent = lines[i];

  setInterval(()=>{
    el.classList.add('ticker','fade');               // 페이드 아웃
    setTimeout(()=>{
      i = (i+1) % lines.length;
      el.textContent = lines[i];
      el.classList.remove('fade');                   // 페이드 인
    }, 500);
  }, 3000);
})();

// 하트 컨페티 (상단 버튼 클릭 시 실행)
(function(){
  const box = document.getElementById('confetti');
  const btn = document.getElementById('confettiBtn');
  if(!box || !btn) return;

  function launchConfetti(){
    const colors = ['#D4B996','#ffb3c1','#ffd6e0','#cde7ff'];
    for(let i=0;i<24;i++){
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = '♥';
      h.style.left = Math.random()*100+'vw';
      h.style.bottom = '0';
      h.style.color = colors[i%colors.length];
      h.style.animationDelay = (Math.random()*0.6)+'s';
      box.appendChild(h);
      setTimeout(()=>h.remove(), 2000);
    }
  }

  btn.addEventListener('click', launchConfetti);
})();


// 🔒 이미지 우클릭·롱프레스 방지
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest && e.target.closest('.no-download')) {
    e.preventDefault();
  }
}, { passive: false });

// 🔒 드래그로 저장 방지
document.querySelectorAll('.no-download img').forEach(img => {
  img.setAttribute('draggable', 'false');
  img.addEventListener('dragstart', e => e.preventDefault());
});
