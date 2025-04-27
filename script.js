let zTop = 1000;

/* ─────────────── Jeux list ─────────────── */
const gameSlugs = [
  'Ico',
  'Resident_Evil_0',
  'Resident_Evil',
  "Asura's_Wrath",
  'Metal_Gear_Solid_4',
  'Last_of_Us_Part_II',
  'Zelda_Skyward_Sword',
  "Zelda_Majora's_Mask",
  'Zelda_Ocarina_of_Time',
  'Shenmue_I_et_II',
];

/* ──────────────────────────────────────────
   Helpers for broken-overlay & separator
   ────────────────────────────────────────── */
function updateSeparator() {
  const sep  = document.getElementById('separator');
  const wins = [...document.querySelectorAll('.xp-window')];
  const visible = wins.filter(w => getComputedStyle(w).display !== 'none');
  sep.style.display = visible.length > 1 ? 'block' : 'none';
  visible.length === 0 ? showBrokenOverlay() : hideBrokenOverlay();
}
function hideBrokenOverlay() {
  document.getElementById('broken-overlay').classList.remove('visible');
}
function showBrokenOverlay() {
  document.getElementById('broken-overlay').classList.add('visible');
}

/* ─────────────── Window bootstrapping ─────────────── */
function setupWindow(win) {
  const title    = win.dataset.title || 'Fenêtre';
  const btnMin   = win.querySelector('.minimize');
  const btnMax   = win.querySelector('.maximize');
  const btnClose = win.querySelector('.close');
  const titlebar = win.querySelector('.titlebar');

  function bringToFront() { win.style.zIndex = ++zTop; }
  win.addEventListener('mousedown', bringToFront);
  win.bringToFront = bringToFront;

  /* DRAG for PC & Insta windows */
  if (win.id==='win-pc' || win.id==='win-insta') {
    let isDragging=false, offsetX=0, offsetY=0;
    titlebar.addEventListener('mousedown', e=>{
      if (e.button!==0||win.classList.contains('maximized')) return;
      isDragging=true; bringToFront();
      const rect = win.getBoundingClientRect();
      win.style.position='absolute'; win.style.margin='0';
      win.style.left=`${rect.left+window.scrollX}px`;
      win.style.top =`${rect.top +window.scrollY}px`;
      offsetX = e.clientX + window.scrollX - rect.left;
      offsetY = e.clientY + window.scrollY - rect.top;
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup',   stopDrag);
      e.preventDefault();
    });
    function onDrag(e){
      if(!isDragging) return;
      win.style.left=`${e.clientX+window.scrollX-offsetX}px`;
      win.style.top =`${e.clientY+window.scrollY-offsetY}px`;
    }
    function stopDrag(){
      isDragging=false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup',   stopDrag);
    }
  }

  /* Resize handle */
  let isResizing=false, startW=0, startH=0, startX=0, startY=0;
  const minW=200, minH=100;
  const handle=document.createElement('div');
  handle.className='resize-handle br';
  win.appendChild(handle);
  handle.addEventListener('mousedown', e=>{
    if(e.button!==0) return;
    isResizing=true; bringToFront();
    const rect=win.getBoundingClientRect();
    startW=rect.width; startH=rect.height;
    startX=e.clientX; startY=e.clientY;
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup',   stopResize);
    e.stopPropagation(); e.preventDefault();
  });
  function onResize(e){
    if(!isResizing) return;
    win.style.width  = `${Math.max(minW, startW + e.clientX - startX)}px`;
    win.style.height = `${Math.max(minH, startH + e.clientY - startY)}px`;
  }
  function stopResize(){
    isResizing=false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup',   stopResize);
  }

  /* Controls: maximize / minimize / close */
  btnMax.addEventListener('click', e=>{
    e.stopPropagation();
    const mx = win.classList.toggle('maximized');
    btnMax.textContent = mx ? '❐' : '☐';
    bringToFront();
  });
  btnMin.addEventListener('click', e=>{
    e.stopPropagation();
    win.style.display='none';
    const tb=document.getElementById('taskbar'),
          btn=document.createElement('button');
    btn.className='taskbar-btn';
    btn.textContent=title;
    btn.addEventListener('click',()=>{
      win.style.display=''; win.bringToFront();
      btn.remove(); updateSeparator();
    });
    tb.appendChild(btn);
    updateSeparator();
  });
  btnClose.addEventListener('click', e=>{
    e.stopPropagation();
    if(win.id==='win-pc'||win.id==='win-insta') win.style.display='none';
    else win.remove();
    updateSeparator();
  });
}

/* ───────── Twitch status + avatar hover swap ───────── */
const profileEl  = document.querySelector('.profile');
const statusText = document.getElementById('stream-text');
const avatarWrapper = document.querySelector('.avatar-wrapper');
const avatarImg     = avatarWrapper.querySelector('.avatar');
const defaultAvatar = avatarImg.src;

async function loadStatus(){
  try {
    const res        = await fetch('./twitch-status.json?ts='+Date.now());
    const { online } = await res.json();
    // toggle classes + text
    profileEl.classList.toggle('online',  online);
    profileEl.classList.toggle('offline', !online);
    statusText.textContent = online ? 'En Stream' : 'Pas en Stream';
  } catch(e){
    console.warn('Could not load Twitch status', e);
  }
}

// initial + every minute
loadStatus();
setInterval(loadStatus, 60_000);

// swap only the IMG on hover—no transform applied
avatarWrapper.addEventListener('mouseenter', ()=>{
  const isOnline = profileEl.classList.contains('online');
  avatarImg.src = isOnline
    ? '/images/twitchon.png'
    : '/images/twitchoff.png';
});
avatarWrapper.addEventListener('mouseleave', ()=>{
  avatarImg.src = defaultAvatar;
});

/* ───────── Primary link cards ───────── */
const primaryCards = document.querySelectorAll('.links.primary .link-card');
primaryCards.forEach(c=>{
  c.addEventListener('click', goToLink);
  c.querySelector('.menu').addEventListener('click', e=>e.stopPropagation());
});

function goToLink(){
  const dest=this.dataset.link;
  if(dest==='mon-pc'){
    const pc=document.getElementById('win-pc');
    pc.style.display='';
    pc.bringToFront();
    pc.style.position='fixed';
    pc.style.transition='none';
    requestAnimationFrame(()=>{
      const {width:w, height:h}=pc.getBoundingClientRect();
      pc.style.left=`${(innerWidth-w)/2}px`;
      pc.style.top =`${(innerHeight-h)/2}px`;
    });
    return;
  }
  if(dest==='insta'){
    const insta=document.getElementById('win-insta');
    insta.style.display=''; insta.bringToFront();
    insta.style.position='fixed'; insta.style.transition='none';
    requestAnimationFrame(()=>{
      const {width:w, height:h}=insta.getBoundingClientRect();
      insta.style.left=`${(innerWidth-w)/2}px`;
      insta.style.top =`${(innerHeight-h)/2}px`;
    });
    return;
  }
  const urlMap = {
    twitter:'https://x.com/MNKway_',
    'chaine-vod':'https://www.youtube.com/@mnkway/featured',
    letterboxd:'https://letterboxd.com/mnkway/',
    mangacollec:'https://www.mangacollec.com/user/mnkway/collection',
    tiktok:'https://www.tiktok.com/@devilmnkway'
  };
  if(urlMap[dest]) { window.open(urlMap[dest], '_blank'); return; }
  if(dest.startsWith('jeux/')) {
    window.location.href = `${dest}/game.html`;
    return;
  }
  window.location.href=`${dest}`;
}

/* ───────── Auto-load & search jeux ───────── */
function autoLoadJeux(){
  const c = document.getElementById('jeux-list');
  gameSlugs.forEach(slug=>{
    const label = slug.replace(/_/g,' ');
    const card  = document.createElement('div');
    card.className    ='link-card';
    card.dataset.link =`jeux/${slug}`;
    card.innerHTML    =`<span class="text">${label}</span><span class="menu">⋮</span>`;
    card.addEventListener('click',goToLink);
    card.querySelector('.menu').addEventListener('click',e=>e.stopPropagation());
    c.appendChild(card);
  });
}
function setupJeuxSearch(){
  const input = document.getElementById('game-search');
  if(!input) return;
  input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();
    document.querySelectorAll('#jeux-list .link-card').forEach(card=>{
      const title=card.querySelector('.text').textContent.toLowerCase();
      card.style.display= title.includes(q)?'':'none';
    });
  });
}

/* ───────── Boot everything ───────── */
document.querySelectorAll('.xp-window').forEach(setupWindow);
document.getElementById('reset-link')?.addEventListener('click',e=>{
  e.preventDefault(); location.reload();
});
autoLoadJeux();
setupJeuxSearch();
updateSeparator();
