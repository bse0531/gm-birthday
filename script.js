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
