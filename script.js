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

// Modal for memories grid
(function(){
  const grid = document.querySelector('.grid');
  const modal = document.querySelector('.modal');
  if(!grid || !modal) return;
  const modalImg = modal.querySelector('img');
  const caption = modal.querySelector('.modalCaption');
  grid.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-full]');
    if(!t) return;
    modalImg.src = t.dataset.full;
    caption.textContent = t.dataset.caption || '';
    modal.classList.add('open');
  });
  modal.addEventListener('click', (e)=>{
    if(e.target === modal || e.target.closest('[data-close]')){
      modal.classList.remove('open');
    }
  });
})();


/ ① 함께한 날 수 (첫 만남 날짜로 바꿔주세요)
(function(){
  const el = document.getElementById('dayBadge'); if(!el) return;
  const firstDate = new Date('2022-09-19'); // ← 이 날짜를 실제로 변경
  const today = new Date();
  const days = Math.floor((today - firstDate)/86400000) + 1;
  el.textContent = `우리가 함께한 지 ${days}일째`;
})();

// ② 한 줄 칭찬/메시지 티커
(function(){
  const el = document.getElementById('msgTicker'); if(!el) return;
  const lines = [
    '오늘의 주인공은 국민 ✨',
    '성실의 아이콘, 자랑스러운 파워 J',
    '늘 한결같이 따뜻한 사랑',
    '오빤 내게 감동이야'
  ];
  let i=0; el.textContent = lines[i];
  setInterval(()=>{
    el.classList.add('fade');
    setTimeout(()=>{ i=(i+1)%lines.length; el.textContent=lines[i]; el.classList.remove('fade'); }, 500);
  }, 3000);
})();

// ③ 첫 방문에만 하트 컨페티
(function(){
  const key='seen_confetti_v1';
  if(localStorage.getItem(key)) return;
  localStorage.setItem(key,'1');
  const box = document.getElementById('confetti'); if(!box) return;
  const colors = ['#D4B996','#ffb3c1','#ffd6e0','#cde7ff'];
  for(let i=0;i<24;i++){
    const h=document.createElement('div');
    h.className='heart'; h.textContent='♥';
    h.style.left = Math.random()*100+'vw';
    h.style.bottom = '0';
    h.style.color = colors[i%colors.length];
    h.style.animationDelay = (Math.random()*0.6)+'s';
    box.appendChild(h);
    setTimeout(()=>h.remove(), 2000);
  }
})();
