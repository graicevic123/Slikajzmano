(() => {
  'use strict';
  const S = window.SITE;
  const A = window.ALBUMS || [];
  const BLOGGER = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/';

  const UI = {
    sl: {
      skip: 'Skoči na vsebino', nav_label: 'Glavni meni', nav_albums: 'Albumi', nav_about: 'O meni', nav_contact: 'Kontakt',
      hero_label: 'Naslovna fotografija', albums_title: 'Albumi', filter_label: 'Izberi lokacijo', all: 'Vse',
      more: 'Pokaži več albumov', about_title: 'O meni', contact_title: 'Kontakt',
      back: 'Vsi albumi', open: 'Povečaj fotografijo', close: 'Zapri', prev: 'Prejšnja fotografija', next: 'Naslednja fotografija',
      newer: 'Novejši album', older: 'Starejši album', map: 'Odpri na zemljevidu',
      notfound: 'Tega albuma ni.', rights: 'Vse fotografije', photo_of: 'Fotografija'
    },
    en: {
      skip: 'Skip to content', nav_label: 'Main menu', nav_albums: 'Albums', nav_about: 'About', nav_contact: 'Contact',
      hero_label: 'Featured photograph', albums_title: 'Albums', filter_label: 'Choose a location', all: 'All',
      more: 'Show more albums', about_title: 'About', contact_title: 'Contact',
      back: 'All albums', open: 'Enlarge photo', close: 'Close', prev: 'Previous photo', next: 'Next photo',
      newer: 'Newer album', older: 'Older album', map: 'Open on map',
      notfound: 'This album doesn’t exist.', rights: 'All photographs', photo_of: 'Photo'
    }
  };

  const TONES = [['#2C3E50', '#8EA4B5'], ['#3A3D5B', '#C6A78A'], ['#1E3846', '#6C8C88'], ['#47496A', '#D4C3A0'], ['#23313D', '#58737F']];

  let lang = 'sl';
  try { const s = localStorage.getItem('szm-lang'); if (s === 'sl' || s === 'en') lang = s; } catch (e) { /* brez shrambe */ }
  let filter = 'all';
  let limit = S.pageSize || 24;
  let shown = [];      // fotografije v povečavi
  let shownAlbum = null;
  let lbIndex = 0;

  const $ = (sel) => document.querySelector(sel);
  const t = (k) => UI[lang][k];
  const L = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[lang] ?? v.sl) : v;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tone = (i) => { const [a, b] = TONES[Math.abs(i) % TONES.length]; return `linear-gradient(170deg, ${a}, ${b})`; };
  const fmtDate = (d) => new Intl.DateTimeFormat(lang === 'sl' ? 'sl-SI' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(d + 'T12:00:00'));
  // Slovenske množinske oblike: 1, 2, 3–4, 5+
  const plural = (n, sl, en) => {
    if (lang === 'en') return `${n} ${n === 1 ? en[0] : en[1]}`;
    const m = n % 100;
    return `${n} ${m === 1 ? sl[0] : m === 2 ? sl[1] : (m === 3 || m === 4) ? sl[2] : sl[3]}`;
  };
  const photos = (n) => plural(n, ['fotografija', 'fotografiji', 'fotografije', 'fotografij'], ['photo', 'photos']);
  const albumsN = (n) => plural(n, ['album', 'albuma', 'albumi', 'albumov'], ['album', 'albums']);

  // Fotografija je [id, datoteka, š, v] na Bloggerju ali [pot, š, v] lokalno
  const P = (f) => f.length === 4 ? { w: f[2], h: f[3], src: (size) => `${BLOGGER}${f[0]}/${size}/${f[1]}` }
    : { w: f[1], h: f[2], src: () => f[0] };

  function pic(f, alt, i, size, opts = {}) {
    const p = P(f);
    const ratio = opts.ratio || `${p.w} / ${p.h}`;
    const src = p.src(size);
    return `<span class="ph" data-src="${esc(src.split('/').pop())}" style="--ph:${tone(i)};aspect-ratio:${ratio}">` +
      `<img src="${esc(src)}" alt="${esc(alt)}" width="${p.w}" height="${p.h}"${opts.eager ? '' : ' loading="lazy"'} decoding="async" ` +
      `onerror="this.parentNode.classList.add('missing')"></span>`;
  }

  const labelCounts = A.reduce((m, a) => { a.l.forEach((x) => m.set(x, (m.get(x) || 0) + 1)); return m; }, new Map());
  const filterLabels = S.filterLabels || [...labelCounts].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([x]) => x);

  function renderStatic() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#lbClose').setAttribute('aria-label', t('close'));
    $('#lbPrev').setAttribute('aria-label', t('prev'));
    $('#lbNext').setAttribute('aria-label', t('next'));
  }

  function renderHero() {
    const a = (S.hero.album && A.find((x) => x.s === S.hero.album)) || A[0];
    if (!a) return;
    const f = a.f[S.hero.photo] || a.f[0];
    $('#heroMedia').innerHTML = pic(f, a.t, 0, 's2000', { eager: true });
    const cap = $('#heroCap');
    cap.href = `#album/${a.s}`;
    cap.innerHTML = `${esc(a.p || a.t)}<span class="note">${esc(fmtDate(a.d))}</span>`;
  }

  function filtered() { return filter === 'all' ? A : A.filter((a) => a.l.includes(filter)); }

  function renderFilters() {
    const list = filterLabels.includes(filter) || filter === 'all' ? filterLabels : [...filterLabels, filter];
    const items = [{ id: 'all', label: t('all') }, ...list.map((x) => ({ id: x, label: x }))];
    $('#filters').innerHTML = items.map((f) =>
      `<button type="button" data-filter="${esc(f.id)}" aria-pressed="${f.id === filter}">${esc(f.label)}</button>`).join('');
  }

  function renderAlbums() {
    const list = filtered();
    $('#albumCount').textContent = `${albumsN(list.length)}, ${photos(list.reduce((n, a) => n + a.f.length, 0))}`;
    $('#albums').innerHTML = list.slice(0, limit).map((a, i) =>
      `<li class="album-card"><a href="#album/${esc(a.s)}">${pic(a.f[0], a.t, i, 's800', { ratio: '3 / 2' })}` +
      `<h3>${esc(a.t)}</h3><p class="meta">${a.td ? (a.p ? `<span>${esc(a.p)}</span>` : '') : `<time datetime="${esc(a.d)}">${esc(fmtDate(a.d))}</time>`}` +
      `<span>${esc(photos(a.f.length))}</span></p></a></li>`).join('');
    $('#moreBtn').hidden = list.length <= limit;
  }

  function renderAbout() {
    $('#aboutBody').innerHTML = (S.about[lang] || S.about.sl).map((p) => `<p>${esc(p)}</p>`).join('') +
      `<p class="links">${S.links.filter((l) => l.url).map((l) =>
        `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p>`;
    $('#contactText').textContent = L(S.contact);
    $('#mail').href = `mailto:${S.email}`;
    $('#mail').textContent = S.email;
    $('#footText').textContent = `${t('rights')} © ${new Date().getFullYear()} ${S.author}`;
  }

  function renderAlbum(slug) {
    const i = A.findIndex((x) => x.s === slug);
    const el = $('#album');
    const back = `<a class="back" href="#albumi">${esc(t('back'))}</a>`;
    if (i < 0) {
      el.innerHTML = `${back}<h1 tabindex="-1">${esc(t('notfound'))}</h1>`;
      shownAlbum = null; shown = [];
      return;
    }
    const a = A[i];
    shownAlbum = a; shown = a.f;
    const place = a.p
      ? `<a href="https://www.openstreetmap.org/?mlat=${a.g[0]}&amp;mlon=${a.g[1]}#map=14/${a.g[0]}/${a.g[1]}" target="_blank" rel="noopener" title="${esc(t('map'))}">${esc(a.p)}</a>`
      : '';
    const labels = a.l.map((x) => `<a class="tag" href="#oznaka/${encodeURIComponent(x)}">${esc(x)}</a>`).join('');
    const nav = [
      i > 0 ? `<a href="#album/${esc(A[i - 1].s)}"><span>${esc(t('newer'))}</span>${esc(A[i - 1].t)}</a>` : '<span></span>',
      i < A.length - 1 ? `<a class="older" href="#album/${esc(A[i + 1].s)}"><span>${esc(t('older'))}</span>${esc(A[i + 1].t)}</a>` : ''
    ].join('');
    el.innerHTML = `${back}<header class="album-head"><h1 tabindex="-1">${esc(a.t)}</h1>` +
      `<p class="meta"><time datetime="${esc(a.d)}">${esc(fmtDate(a.d))}</time><span>${esc(photos(a.f.length))}</span>${place ? `<span>${place}</span>` : ''}</p>` +
      `<p class="tags">${labels}</p></header>` +
      `<div class="grid">${a.f.map((f, k) => `<button type="button" class="shot-btn" data-i="${k}" aria-label="${esc(t('open'))} ${k + 1}">` +
        `${pic(f, `${a.t}, ${t('photo_of').toLowerCase()} ${k + 1}`, k, 's800', { eager: k < 3 })}</button>`).join('')}</div>` +
      `<nav class="album-nav">${nav}</nav>`;
    document.title = `${a.t} | Slikaj z mano`;
  }

  function route() {
    const h = decodeURIComponent(location.hash || '');
    const home = $('#home');
    const album = $('#album');
    if (h.startsWith('#album/')) {
      renderAlbum(h.slice(7));
      home.hidden = true;
      album.hidden = false;
      window.scrollTo(0, 0);
      const h1 = album.querySelector('h1');
      if (h1) h1.focus({ preventScroll: true });
      return;
    }
    const wasAlbum = !album.hidden;
    album.hidden = true;
    home.hidden = false;
    document.title = 'Slikaj z mano';
    let target = null;
    if (h.startsWith('#oznaka/')) {
      const lab = h.slice(8);
      if (labelCounts.has(lab)) { filter = lab; limit = S.pageSize || 24; renderFilters(); renderAlbums(); }
      target = $('#albumi');
    } else if (h.length > 1) {
      target = document.getElementById(h.slice(1));
    }
    if (wasAlbum || h.startsWith('#oznaka/')) requestAnimationFrame(() => (target ? target.scrollIntoView() : window.scrollTo(0, 0)));
  }

  function renderAll() {
    renderStatic(); renderHero(); renderFilters(); renderAlbums(); renderAbout();
    if (!$('#album').hidden && shownAlbum) renderAlbum(shownAlbum.s);
  }

  // Povečava
  const lb = $('#lightbox');
  function drawLb() {
    const f = shown[lbIndex];
    const p = P(f);
    const m = $('#lbMedia');
    const src = p.src('s1600');
    m.classList.remove('missing');
    m.style.setProperty('--ph', tone(lbIndex));
    m.dataset.src = src.split('/').pop();
    m.innerHTML = `<img src="${esc(src)}" alt="${esc(shownAlbum.t)}, ${esc(t('photo_of').toLowerCase())} ${lbIndex + 1}" onerror="this.parentNode.classList.add('missing')">`;
    $('#lbCap').innerHTML = `${esc(shownAlbum.t)}<span class="count">${lbIndex + 1} / ${shown.length}</span>`;
    const multi = shown.length > 1;
    $('#lbPrev').hidden = !multi;
    $('#lbNext').hidden = !multi;
    // naloži sosednjo fotografijo vnaprej
    if (multi) { const n = new Image(); n.src = P(shown[(lbIndex + 1) % shown.length]).src('s1600'); }
  }
  function openLb(i) { lbIndex = i; drawLb(); if (!lb.open) lb.showModal(); }
  function step(d) { lbIndex = (lbIndex + d + shown.length) % shown.length; drawLb(); }

  $('#album').addEventListener('click', (e) => {
    const b = e.target.closest('.shot-btn');
    if (b) openLb(Number(b.dataset.i));
  });
  $('#lbClose').addEventListener('click', () => lb.close());
  $('#lbPrev').addEventListener('click', () => step(-1));
  $('#lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-inner')) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50 && shown.length > 1) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    limit = S.pageSize || 24;
    renderFilters(); renderAlbums();
  });
  $('#moreBtn').addEventListener('click', () => {
    const first = limit;
    limit += S.pageSize || 24;
    renderAlbums();
    const next = document.querySelectorAll('.album-card a')[first];
    if (next) next.focus({ preventScroll: true });
  });
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem('szm-lang', lang); } catch (e) { /* brez shrambe */ }
    renderAll();
  }));

  window.addEventListener('hashchange', route);
  renderAll();
  route();
})();
