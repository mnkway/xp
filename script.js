let zTop = 1000;

// ───────────────────────────────────────────────────────────
// Helpers for broken-overlay & separator
function updateSeparator() {
  const sep = document.getElementById('separator');
  if (!sep) return;
  const wins    = [...document.querySelectorAll('.xp-window')];
  const visible = wins.filter(w => getComputedStyle(w).display !== 'none');
  sep.style.display = visible.length > 1 ? 'block' : 'none';
  visible.length === 0 ? showBrokenOverlay() : hideBrokenOverlay();
}
function hideBrokenOverlay() { 
  document.getElementById('broken-overlay')
          .classList.remove('visible');
}
function showBrokenOverlay() { 
  document.getElementById('broken-overlay')
          .classList.add('visible');
}
// ───────────────────────────────────────────────────────────

function setupWindow(win) {
  const title    = win.dataset.title || 'Fenêtre';
  const btnMin   = win.querySelector('.minimize');
  const btnMax   = win.querySelector('.maximize');
  const btnClose = win.querySelector('.close');
  const titlebar = win.querySelector('.titlebar');

  // bring-to-front
  function bringToFront() {
    win.style.zIndex = ++zTop;
  }
  win.addEventListener('mousedown', bringToFront);
  win.bringToFront = bringToFront;

  // ─────────────── DRAGGING for Mon PC ────────────────────
  if (win.id === 'win-pc') {
    let isDragging = false,
        dragOffsetX = 0,
        dragOffsetY = 0;

    titlebar.addEventListener('mousedown', e => {
      if (e.button !== 0 || win.classList.contains('maximized')) return;
      isDragging = true;
      bringToFront();

      // switch to absolute & lock to current spot
      const rect = win.getBoundingClientRect();
      win.style.position = 'absolute';
      win.style.margin   = '0';
      win.style.left     = rect.left + 'px';
      win.style.top      = rect.top  + 'px';

      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;

      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup',   stopDrag);
      e.preventDefault();
    });

    function onDrag(e) {
      if (!isDragging) return;
      win.style.left = `${e.clientX - dragOffsetX}px`;
      win.style.top  = `${e.clientY - dragOffsetY}px`;
    }
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup',   stopDrag);
    }
  }

  // ─────────────── RESIZING ───────────────────────────────
  let isResizing     = false,
      resizeStartX   = 0,
      resizeStartY   = 0,
      startW         = 0,
      startH         = 0;
  const minW = 200, minH = 100;
  const handle = document.createElement('div');
  handle.className = 'resize-handle br';
  win.appendChild(handle);

  handle.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isResizing = true;
    bringToFront();
    const rect = win.getBoundingClientRect();
    startW       = rect.width;
    startH       = rect.height;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup',   stopResize);
    e.stopPropagation();
    e.preventDefault();
  });

  function onResize(e) {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;
    win.style.width  = `${Math.max(minW, startW + dx)}px`;
    win.style.height = `${Math.max(minH, startH + dy)}px`;
  }
  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup',   stopResize);
  }

  // ─────────────── WINDOW CONTROLS ────────────────────────
  btnMax.addEventListener('click', e => {
    e.stopPropagation();
    const isMax = win.classList.toggle('maximized');
    btnMax.textContent = isMax ? '❐' : '☐';
    bringToFront();
  });

  btnMin.addEventListener('click', e => {
    e.stopPropagation();
    win.style.display = 'none';
    const tb      = document.getElementById('taskbar');
    const taskBtn = document.createElement('button');
    taskBtn.className   = 'taskbar-btn';
    taskBtn.textContent = title;
    taskBtn.addEventListener('click', () => {
      win.style.display = '';
      bringToFront();
      taskBtn.remove();
      updateSeparator();
    });
    tb.appendChild(taskBtn);
    updateSeparator();
  });

  btnClose.addEventListener('click', e => {
    e.stopPropagation();
    if (win.id === 'win-pc') {
      win.style.display = 'none';
    } else {
      win.remove();
    }
    updateSeparator();
  });
}

// ───────────────────────────────────────────────────────────
// Initialize all windows
document.querySelectorAll('.xp-window').forEach(setupWindow);

// Reset overlay on “broken” click
document.getElementById('reset-link')?.addEventListener('click', e => {
  e.preventDefault();
  window.location.reload();
});

// Twitch status check
const clientId    = 'YOUR_CLIENT_ID';
const accessToken = 'YOUR_OAUTH_TOKEN';
const user        = 'mnkway';
const profileEl   = document.querySelector('.profile');
const statusText  = document.getElementById('stream-text');

async function checkStream() {
  const res = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${user}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  const json = await res.json();
  if (json.data && json.data.length) {
    profileEl.classList.replace('offline', 'online');
    statusText.textContent = 'En Stream';
  } else {
    profileEl.classList.replace('online', 'offline');
    statusText.textContent = 'Pas en Stream';
  }
}
checkStream();
setInterval(checkStream, 60_000);

// Link cards wiring
const primaryCards = document.querySelectorAll('.links.primary .link-card');
primaryCards.forEach(c => {
  c.addEventListener('click', goToLink);
  c.querySelector('.menu').addEventListener('click', e => e.stopPropagation());
});

function goToLink() {
  const dest = this.dataset.link;

  // Mon PC popup
  if (dest === 'mon-pc') {
    const pcWin = document.getElementById('win-pc');
    if (!pcWin) return;
    pcWin.style.display = '';
    pcWin.bringToFront();
    pcWin.style.position = 'absolute';
    pcWin.style.transition = 'none';
    requestAnimationFrame(() => {
      const { width: w, height: h } = pcWin.getBoundingClientRect();
      pcWin.style.left = `${(window.innerWidth - w) / 2}px`;
      pcWin.style.top  = `${(window.innerHeight - h) / 2}px`;
    });
    return;
  }

  // External profile links
  const urlMap = {
    instagram:    'https://www.instagram.com/mnkway/',
    twitter:      'https://x.com/MNKway_',
    'chaine-vod': 'https://www.youtube.com/@mnkway/featured',
    letterboxd:   'https://letterboxd.com/mnkway/'
  };
  if (urlMap[dest]) {
    window.open(urlMap[dest], '_blank');
    return;
  }

  // Jeux entries → /jeux/Slug/game.html
  if (dest.startsWith('jeux/')) {
    window.location.href = `/${dest}/game.html`;
    return;
  }

  // Fallback for any other relative link
  window.location.href = `/${dest}`;
}

async function autoLoadJeux() {
  const container = document.getElementById('jeux-list');

  // 1) Fetch directory listing from GitHub
  const owner = 'mnkway';
  const repo  = 'retro-xp';
  const res   = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/jeux`, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });
  const items = await res.json();

  // 2) Filter for directories & append a card per game
  const jeux = items
    .filter(item => item.type === 'dir')
    .map(item  => item.name);

  jeux.forEach(slug => {
    const label = slug.replace(/_/g, ' ');
    const card  = document.createElement('div');
    card.className    = 'link-card';
    card.dataset.link = `jeux/${slug}`;
    card.innerHTML    = `<span class="text">${label}</span><span class="menu">⋮</span>`;
    card.addEventListener('click', goToLink);
    card.querySelector('.menu')
        .addEventListener('click', e => e.stopPropagation());
    container.appendChild(card);
  });
}

// Kick off & separator check
autoLoadJeux();
updateSeparator();
