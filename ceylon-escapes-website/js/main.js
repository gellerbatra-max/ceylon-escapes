/* Ceylon Escapes — shared interactions (v3) */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ICONS = 'img/icons.svg';
  const icon = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="${ICONS}#${id}"/></svg>`;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const isLocal = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname);

  document.documentElement.classList.remove('no-js');

  /* ------------------------------------------------------------
     Shared data: tours (used by season planner + wizard)
     ------------------------------------------------------------ */
  const TOURS = {
    'essential-sri-lanka': { name: 'Essential Sri Lanka', days: 8, price: '1,590', url: 'tour-essential-sri-lanka.html', img: 'photo-1612862862126-865765df2ded' },
    'winter-sun-east-coast': { name: 'Winter Sun: East Coast', days: 8, price: '1,490', url: 'plan.html?tour=winter-sun-east-coast', img: 'photo-1580910527739-556eb89f9d65' },
    'surf-and-safari': { name: 'Surf & Safari', days: 10, price: '1,890', url: 'plan.html?tour=surf-and-safari', img: 'photo-1517053589573-a5473fadffbd' },
    'family-wild': { name: 'Family Wild', days: 9, price: '1,690', url: 'plan.html?tour=family-wild', img: 'photo-1571406761758-9a3eed5338ef' },
    'tea-and-shore-honeymoon': { name: 'Tea & Shore Honeymoon', days: 11, price: '2,590', url: 'plan.html?tour=tea-and-shore-honeymoon', img: 'photo-1544015759-237f87d55ef3' },
    'the-grand-loop': { name: 'The Grand Loop', days: 14, price: '2,690', url: 'plan.html?tour=the-grand-loop', img: 'photo-1574611122955-5baa61496637' },
    'kandy-culture-express': { name: 'Kandy & Culture Express', days: 6, price: '1,190', url: 'plan.html?tour=kandy-culture-express', img: 'photo-1665849050332-8d5d7e59afb6' },
    'the-wild-south': { name: 'The Wild South', days: 7, price: '1,390', url: 'plan.html?tour=the-wild-south', img: 'photo-1661768508643-e260f6f8e06c' }
  };
  const unsplash = (id, w) => `https://images.unsplash.com/${id}?q=75&w=${w}&auto=format&fit=crop`;

  /* ------------------------------------------------------------
     Header: scrolled state + mobile drawer
     ------------------------------------------------------------ */
  const header = $('.site-header');
  const onScrollHeader = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  const drawer = $('#drawer');
  const menuBtn = $('.menu-btn');
  let lastFocus = null;
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('open'));
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
    const first = $('a, button', drawer);
    first && first.focus();
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { drawer.hidden = true; }, 260);
    lastFocus && lastFocus.focus();
  }
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', openDrawer);
    $$('[data-close-drawer]', drawer).forEach(b => b.addEventListener('click', closeDrawer));
    drawer.addEventListener('click', e => { if (e.target.closest('a')) closeDrawer(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeDrawer(); });
  }

  /* Mobile action bar: tuck away while the footer is on screen */
  const mbar = $('.mbar');
  const footer = $('.site-footer');
  if (mbar && footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => mbar.classList.toggle('hide', e.isIntersecting), { rootMargin: '0px 0px -120px 0px' }).observe(footer);
  }

  /* ------------------------------------------------------------
     Reveal on scroll (position sweep — robust to fast scrolling)
     ------------------------------------------------------------ */
  const revealEls = new Set($$('.reveal, .reveal-stagger'));
  function sweep() {
    const limit = window.innerHeight * 0.92;
    revealEls.forEach(el => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); revealEls.delete(el); }
    });
  }
  if (revealEls.size) {
    let ticking = false;
    const onScroll = () => {
      if (ticking || !revealEls.size) return;
      ticking = true;
      requestAnimationFrame(() => { sweep(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    sweep();
    setTimeout(() => { revealEls.forEach(el => el.classList.add('in')); revealEls.clear(); }, 5000);
  }

  /* ------------------------------------------------------------
     Month <select>s: next 12 months, starting from this month
     ------------------------------------------------------------ */
  function upcomingMonths() {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    });
  }
  $$('select[data-month-select]').forEach(sel => {
    const keep = sel.value;
    const first = sel.querySelector('option[value=""]');
    sel.innerHTML = '';
    if (first) sel.appendChild(first);
    upcomingMonths().forEach(m => sel.add(new Option(m, m)));
    if (keep) sel.value = keep;
  });

  /* ------------------------------------------------------------
     Carousels (rails) with arrow buttons + progress bar
     ------------------------------------------------------------ */
  $$('[data-rail]').forEach(rail => {
    const id = rail.id;
    const prev = $(`[data-rail-prev="${id}"]`);
    const next = $(`[data-rail-next="${id}"]`);
    const bar = $(`[data-rail-progress="${id}"] span`);
    const step = () => {
      const card = rail.firstElementChild;
      return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 20) : rail.clientWidth;
    };
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const p = max > 0 ? rail.scrollLeft / max : 0;
      if (prev) prev.disabled = rail.scrollLeft < 4;
      if (next) next.disabled = rail.scrollLeft > max - 4;
      if (bar) {
        const w = Math.min(100, (rail.clientWidth / rail.scrollWidth) * 100);
        bar.style.width = w + '%';
        bar.style.marginLeft = (p * (100 - w)) + '%';
      }
    };
    prev && prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });

  /* ------------------------------------------------------------
     Season planner: "where's sunny in <month>?"
     ------------------------------------------------------------ */
  const REGIONS = [
    { name: 'South & west coasts', short: 'south & west coasts', places: 'Galle · Mirissa · Bentota · Tangalle', great: [12, 1, 2, 3, 4], ok: [11] },
    { name: 'East coast', short: 'east coast', places: 'Trincomalee · Pasikuda · Arugam Bay', great: [5, 6, 7, 8, 9], ok: [4, 10] },
    { name: 'Cultural Triangle', short: 'Cultural Triangle', places: 'Sigiriya · Dambulla · Polonnaruwa', great: [4, 5, 6, 7, 8, 9], ok: [1, 2, 3, 10] },
    { name: 'Hill country', short: 'hill country', places: 'Kandy · Ella · Nuwara Eliya', great: [1, 2, 3, 4, 7, 8, 9], ok: [5, 6, 12] }
  ];
  const HAPPENING = {
    1: ['Aussie summer school holidays', 'Duruthu Perahera procession in Colombo', 'Blue whale season off Mirissa'],
    2: ['Navam Perahera in Colombo', 'Peak whale watching off the south coast', 'Crisp, clear mornings in tea country'],
    3: ['Blue whales off Mirissa', 'Dry, clear days in the hills', 'Quieter than peak season, same sunshine'],
    4: ['Sinhala & Tamil New Year (mid-April)', 'Easter school holidays', 'Arugam Bay surf season kicks off'],
    5: ['Vesak full moon — lanterns across the island', 'East coast season opens', 'Shoulder-season hotel prices'],
    6: ['Poson full moon festival', 'Aussie winter holidays begin', 'Arugam Bay at its best'],
    7: ['Kandy Esala Perahera begins', 'Winter school holidays', 'Glassy east-coast surf'],
    8: ['Kandy Esala Perahera — ten nights of processions', 'Minneriya elephant "Gathering" begins', 'Snorkelling at Pigeon Island'],
    9: ['Minneriya elephant Gathering', 'Spring school holidays start', 'Last weeks of the east coast season'],
    10: ['Inter-monsoon: short afternoon showers', 'Lush, green and uncrowded', 'Some of the year’s best hotel rates'],
    11: ['Quiet, green and great value', 'South coast drying out by month’s end', 'Perfect for a culture-and-food short break'],
    12: ['South & west coast season begins', 'Whales return to Mirissa', 'Christmas school holidays']
  };
  const SUGGEST = { 1: 'the-wild-south', 2: 'the-wild-south', 3: 'essential-sri-lanka', 4: 'essential-sri-lanka', 5: 'surf-and-safari', 6: 'surf-and-safari', 7: 'winter-sun-east-coast', 8: 'winter-sun-east-coast', 9: 'winter-sun-east-coast', 10: 'kandy-culture-express', 11: 'essential-sri-lanka', 12: 'the-wild-south' };
  const STATUS = {
    great: { label: 'At its best', icon: 'sun' },
    ok: { label: 'Good', icon: 'sparkle' },
    off: { label: 'Monsoon', icon: 'cloud-rain' }
  };
  const listJoin = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const statusOf = (r, m) => r.great.includes(m) ? 'great' : r.ok.includes(m) ? 'ok' : 'off';

  $$('[data-season]').forEach(root => {
    const tabs = $('.month-tabs', root);
    const panel = $('.season-panel', root);
    const nowM = new Date().getMonth() + 1;
    tabs.innerHTML = MONTHS.map((m, i) => `<button type="button" role="tab" id="st-${i + 1}" aria-controls="season-panel" aria-selected="false" data-m="${i + 1}">${m.slice(0, 3)}${i + 1 === nowM ? '<span class="now" title="This month"></span>' : ''}</button>`).join('');
    panel.id = 'season-panel';
    panel.setAttribute('role', 'tabpanel');

    function render(m) {
      $$('button', tabs).forEach(b => {
        const on = +b.dataset.m === m;
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', `st-${m}`);
      const greats = REGIONS.filter(r => statusOf(r, m) === 'great');
      const verdict = greats.length
        ? `<strong>${greats.length} of 4 regions</strong> are at their best — head for the ${listJoin(greats.map(r => r.short))}.`
        : `An in-between month: short tropical showers, lush scenery and <strong>the year’s best value</strong>.`;
      const t = TOURS[SUGGEST[m]];
      panel.innerHTML = `
        <div>
          <div class="season-month">${MONTHS[m - 1]}${m === nowM ? '' : ''}</div>
          <p class="season-verdict">${verdict}</p>
          <ul class="season-happening" role="list">${HAPPENING[m].map(h => `<li>${icon('sparkle')}<span>${h}</span></li>`).join('')}</ul>
          <a class="season-suggest" href="${t.url}">
            <img src="${unsplash(t.img, 200)}" alt="" loading="lazy">
            <div><small>Our pick for ${MONTHS[m - 1]}</small><b>${t.name}</b><span>${t.days} days · from A$${t.price} pp</span></div>
            ${icon('arrow-right')}
          </a>
        </div>
        <div>
          <div class="region-list">${REGIONS.map(r => {
            const s = statusOf(r, m);
            return `<div class="region ${s}"><h3>${r.name}</h3><p>${r.places}</p><span class="status ${s}">${icon(STATUS[s].icon)}${STATUS[s].label}</span></div>`;
          }).join('')}</div>
          <div class="season-legend"><span><i class="l-great"></i>At its best</span><span><i class="l-ok"></i>Good, a few showers</span><span><i class="l-off"></i>Monsoon — keep it short</span></div>
        </div>`;
    }
    tabs.addEventListener('click', e => {
      const b = e.target.closest('button[data-m]');
      if (b) render(+b.dataset.m);
    });
    tabs.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const cur = +$('[aria-selected="true"]', tabs).dataset.m;
      let n = e.key === 'ArrowRight' ? cur % 12 + 1 : e.key === 'ArrowLeft' ? (cur + 10) % 12 + 1 : e.key === 'Home' ? 1 : 12;
      render(n);
      const btn = $(`[data-m="${n}"]`, tabs);
      btn.focus();
    });
    render(nowM);
    // Keep the selected month visible on small screens
    const sel = $('[aria-selected="true"]', tabs);
    if (sel && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = sel.offsetLeft - tabs.clientWidth / 2 + sel.clientWidth / 2;
  });

  /* Month strips on destination rows */
  $$('[data-months]').forEach(el => {
    const great = (el.dataset.great || '').split(',').map(Number);
    const ok = (el.dataset.ok || '').split(',').map(Number);
    el.innerHTML = MONTHS.map((m, i) => {
      const n = i + 1;
      const s = great.includes(n) ? 'great' : ok.includes(n) ? 'ok' : 'off';
      return `<span class="${s}" title="${m}: ${s === 'great' ? 'best' : s === 'ok' ? 'good' : 'off-season'}">${m[0]}</span>`;
    }).join('');
    el.setAttribute('role', 'img');
    const bestNames = great.filter(Boolean).map(n => MONTHS[n - 1]).join(', ');
    el.setAttribute('aria-label', `Best months: ${bestNames || 'year-round'}`);
  });

  /* ------------------------------------------------------------
     Destinations page: sticky jump-nav scrollspy
     ------------------------------------------------------------ */
  const jump = $('.jump .chips');
  if (jump && 'IntersectionObserver' in window) {
    const links = $$('a[href^="#"]', jump);
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const a = map.get(e.target.id);
        if (!a) return;
        links.forEach(l => l.classList.toggle('active', l === a));
        jump.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    map.forEach((_, id) => { const t = document.getElementById(id); t && io.observe(t); });
  }

  /* ------------------------------------------------------------
     Tours page: filter chips (with counts) + sort + deep links
     ------------------------------------------------------------ */
  const grid = $('#tour-grid');
  if (grid) {
    const cards = $$('.t-card', grid);
    const chips = $$('[data-filter]');
    const sortSel = $('#sort');
    const countEl = $('#result-count');
    const empty = $('#empty');
    let filter = new URLSearchParams(location.search).get('filter') || 'all';
    if (!chips.some(c => c.dataset.filter === filter)) filter = 'all';

    chips.forEach(c => {
      const f = c.dataset.filter;
      const n = f === 'all' ? cards.length : cards.filter(card => card.dataset.tags.split(' ').includes(f)).length;
      c.insertAdjacentHTML('beforeend', ` <span class="count">${n}</span>`);
    });

    function apply() {
      let shown = 0;
      chips.forEach(c => c.setAttribute('aria-pressed', c.dataset.filter === filter));
      cards.forEach(card => {
        const on = filter === 'all' || card.dataset.tags.split(' ').includes(filter);
        card.classList.toggle('is-hidden', !on);
        if (on) shown++;
      });
      const key = sortSel ? sortSel.value : 'recommended';
      const by = {
        recommended: (a, b) => a.dataset.order - b.dataset.order,
        'price-asc': (a, b) => a.dataset.price - b.dataset.price,
        'price-desc': (a, b) => b.dataset.price - a.dataset.price,
        'days-asc': (a, b) => a.dataset.days - b.dataset.days,
        'days-desc': (a, b) => b.dataset.days - a.dataset.days
      }[key];
      cards.slice().sort(by).forEach(c => grid.appendChild(c));
      if (countEl) countEl.textContent = shown === 1 ? '1 trip' : `${shown} trips`;
      if (empty) empty.classList.toggle('show', shown === 0);
      const url = new URL(location.href);
      filter === 'all' ? url.searchParams.delete('filter') : url.searchParams.set('filter', filter);
      history.replaceState(null, '', url);
    }
    chips.forEach(c => c.addEventListener('click', () => { filter = c.dataset.filter; apply(); }));
    sortSel && sortSel.addEventListener('change', apply);
    $$('[data-reset-filter]').forEach(b => b.addEventListener('click', () => { filter = 'all'; apply(); }));
    apply();
  }

  /* ------------------------------------------------------------
     Itinerary: expand / collapse all days
     ------------------------------------------------------------ */
  $$('[data-expand-all]').forEach(btn => {
    const list = $$(btn.dataset.expandAll);
    const sync = () => { btn.textContent = list.every(d => d.open) ? 'Collapse all days' : 'Expand all days'; };
    btn.addEventListener('click', () => {
      const open = !list.every(d => d.open);
      list.forEach(d => { d.open = open; });
      sync();
    });
    list.forEach(d => d.addEventListener('toggle', sync));
    sync();
  });

  /* ------------------------------------------------------------
     Netlify Forms submit helper
     (Forms need "Form detection" enabled in the Netlify dashboard.)
     ------------------------------------------------------------ */
  async function submitForm(form, data) {
    const body = new URLSearchParams();
    body.append('form-name', form.getAttribute('name'));
    for (const [k, v] of data) body.append(k, v);
    if (isLocal) {
      console.info('[dev] Form "%s" would submit:', form.getAttribute('name'), Object.fromEntries(body));
      await new Promise(r => setTimeout(r, 600));
      return;
    }
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    if (!res.ok) throw new Error('Form submit failed: ' + res.status);
  }

  /* Newsletter */
  $$('form[data-newsletter]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('input[type="email"]', form);
      const note = $('small', form);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        note.textContent = 'That email doesn’t look quite right — mind checking it?';
        email.focus();
        return;
      }
      const btn = $('button', form);
      btn.disabled = true;
      try {
        await submitForm(form, new FormData(form));
        note.innerHTML = '<span class="ok">You’re on the list — first letter lands next month. Isthuthi!</span>';
        form.reset();
      } catch {
        note.textContent = 'Something went wrong — please try again, or email us instead.';
      } finally { btn.disabled = false; }
    });
  });

  /* ------------------------------------------------------------
     Plan wizard
     ------------------------------------------------------------ */
  const wizard = $('#wizard');
  if (wizard) {
    const form = $('form', wizard);
    const steps = $$('.w-step', wizard);
    const stepperItems = $$('.stepper li', wizard);
    const errBox = $('.w-error', wizard);
    const DRAFT_KEY = 'ce-plan-draft-v1';
    let current = 0;

    /* Counters (+/−) */
    $$('.counter', form).forEach(c => {
      const input = $('input', c);
      const out = $('output', c);
      const min = +input.min || 0;
      const max = +input.max || 12;
      const [dec, inc] = $$('button', c);
      const set = v => {
        input.value = Math.max(min, Math.min(max, v));
        out.textContent = input.value;
        dec.disabled = +input.value <= min;
        inc.disabled = +input.value >= max;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      dec.addEventListener('click', () => set(+input.value - 1));
      inc.addEventListener('click', () => set(+input.value + 1));
      c._set = set;
      set(+input.value);
    });

    const kidAges = $('#f-kid-ages');
    const syncKids = () => { if (kidAges) kidAges.closest('.field').hidden = +form.elements.kids.value === 0; };

    /* Tour chip */
    const tourInput = form.elements.tour;
    const tourChip = $('.tour-chip', wizard);
    function setTour(slug) {
      const t = TOURS[slug];
      tourInput.value = t ? `${t.name} (${t.days} days)` : '';
      if (tourChip) {
        tourChip.hidden = !t;
        if (t) $('span', tourChip).textContent = `Starting from: ${t.name} · ${t.days} days`;
      }
    }
    tourChip && $('button', tourChip).addEventListener('click', () => { setTour(null); saveDraft(); updateSummary(); });

    /* Summary sidebar */
    const sum = id => $(`[data-sum="${id}"]`);
    const valOf = name => {
      const el = form.elements.namedItem(name);
      if (!el) return '';
      if (el instanceof RadioNodeList) {
        const vals = Array.from(el).filter(i => i.checked).map(i => i.value);
        return el[0] && el[0].type === 'checkbox' ? vals : (vals[0] || '');
      }
      return el.type === 'checkbox' ? (el.checked ? [el.value] : []) : el.value;
    };
    function setSum(id, text) {
      const dd = sum(id);
      if (!dd) return;
      dd.textContent = text || 'Not chosen yet';
      dd.classList.toggle('empty-val', !text);
    }
    function updateSummary() {
      const month = valOf('month');
      const length = valOf('length');
      setSum('when', [month, length].filter(Boolean).join(' · '));
      const a = +valOf('adults'), k = +valOf('kids');
      setSum('who', `${a} adult${a === 1 ? '' : 's'}${k ? `, ${k} kid${k === 1 ? '' : 's'}` : ''}`);
      setSum('style', [valOf('style'), valOf('budget')].filter(Boolean).join(' · '));
      const ints = valOf('interests');
      setSum('interests', ints.length ? ints.join(', ') : '');
      setSum('tour', tourInput.value || 'Designed from scratch');
      sum('tour') && sum('tour').classList.remove('empty-val');
    }

    /* Draft persistence */
    function saveDraft() {
      try {
        const data = {};
        for (const [k, v] of new FormData(form)) {
          if (['bot-field'].includes(k)) continue;
          data[k] = k in data ? [].concat(data[k], v) : v;
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch { /* storage unavailable — fine */ }
    }
    function restoreDraft() {
      let data;
      try { data = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { data = null; }
      if (!data) return false;
      Object.entries(data).forEach(([k, v]) => setField(k, v));
      return true;
    }
    function setField(name, value) {
      const el = form.elements.namedItem(name);
      if (!el) return;
      const vals = [].concat(value);
      if (el instanceof RadioNodeList) {
        Array.from(el).forEach(i => { i.checked = vals.includes(i.value); });
      } else if (el.type === 'checkbox') {
        el.checked = vals.includes(el.value);
      } else if (el.closest('.counter')) {
        el.closest('.counter')._set(+vals[0]);
      } else if (el.tagName === 'SELECT') {
        const opt = Array.from(el.options).find(o => o.value === vals[0]) || Array.from(el.options).find(o => vals[0] && o.value.toLowerCase().startsWith(String(vals[0]).toLowerCase()));
        if (opt) el.value = opt.value;
      } else {
        el.value = vals[0];
      }
    }

    /* Prefill: saved draft first, then anything passed in the URL wins */
    const restored = restoreDraft();
    const q = new URLSearchParams(location.search);
    if (q.get('month')) setField('month', q.get('month'));
    if (q.get('length')) setField('length', q.get('length'));
    const party = q.get('party');
    if (party === 'solo') setField('adults', 1);
    if (party === 'couple') setField('adults', 2);
    if (party === 'friends') setField('adults', 4);
    if (party === 'family') { setField('adults', 2); if (+form.elements.kids.value === 0) setField('kids', 2); }
    if (q.get('interest')) setField('interests', [...valOf('interests'), q.get('interest')]);
    if (q.get('dest')) {
      const notes = form.elements.notes;
      const line = `I'd love to include: ${q.get('dest')}`;
      if (!notes.value.includes(line)) notes.value = (notes.value ? notes.value + '\n' : '') + line;
    }
    const tourSlug = q.get('tour');
    if (tourSlug) setTour(tourSlug);
    else if (tourInput.value) {
      const slug = Object.keys(TOURS).find(s => tourInput.value.startsWith(TOURS[s].name));
      setTour(slug || null);
    } else setTour(null);
    const draftNote = $('.draft-note', wizard);
    if (draftNote) draftNote.hidden = !restored;

    syncKids();
    updateSummary();
    form.addEventListener('input', () => { syncKids(); updateSummary(); saveDraft(); });
    form.addEventListener('change', () => { syncKids(); updateSummary(); saveDraft(); });

    /* Step navigation */
    function show(i, focus = true) {
      current = i;
      steps.forEach((s, n) => s.classList.toggle('active', n === i));
      stepperItems.forEach((li, n) => {
        li.classList.toggle('current', n === i);
        li.classList.toggle('done', n < i);
        n === i ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current');
      });
      errBox.classList.remove('show');
      if (focus) {
        const top = wizard.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 16;
        if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
        const h = $('h2', steps[i]);
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      }
    }
    function validate(i) {
      let ok = true;
      $$('[required]', steps[i]).forEach(f => {
        const field = f.closest('.field');
        const bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        field.classList.toggle('invalid', bad);
        f.setAttribute('aria-invalid', bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) {
        errBox.textContent = 'Just a couple of details missing — see the highlighted fields.';
        errBox.classList.add('show');
      }
      return ok;
    }
    $$('[required]', form).forEach(f => f.addEventListener('input', () => {
      if (f.closest('.field').classList.contains('invalid')) validate(current);
    }));

    wizard.addEventListener('click', e => {
      if (e.target.closest('[data-next]')) { if (validate(current)) show(current + 1); }
      if (e.target.closest('[data-back]')) show(current - 1);
    });
    // Enter in a text field goes to the next step rather than submitting early
    form.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches('input:not([type="checkbox"]):not([type="radio"])') && current < steps.length - 1) {
        e.preventDefault();
        if (validate(current)) show(current + 1);
      }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (current < steps.length - 1) { if (validate(current)) show(current + 1); return; }
      if (!validate(current)) return;
      const btn = $('[type="submit"]', form);
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      // Flatten multi-select interests into one field so it reads cleanly in the inbox
      const data = new FormData(form);
      const interests = data.getAll('interests');
      data.delete('interests');
      data.set('interests', interests.join(', ') || '—');
      try {
        await submitForm(form, data);
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        const first = (form.elements.namedItem('name').value || '').trim().split(' ')[0];
        const hi = $('[data-first-name]', wizard);
        if (hi && first) hi.textContent = `, ${first}`;
        form.hidden = true;
        $('.stepper', wizard).hidden = true;
        const ok = $('.w-success', wizard);
        ok.classList.add('show');
        $('h2', ok).setAttribute('tabindex', '-1');
        $('h2', ok).focus();
        wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        errBox.innerHTML = 'Sorry — that didn’t send. Please try again, or message us on <a href="https://wa.me/94771234567" target="_blank" rel="noopener">WhatsApp</a>.';
        errBox.classList.add('show');
      } finally {
        btn.disabled = false;
        btn.innerHTML = label;
      }
    });

    show(0, false);
  }

  /* Footer year */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
