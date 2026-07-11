/* Ceylon Escapes — shared interactions */

// ----- Mobile nav -----
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
}

// ----- Sticky header shadow -----
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ----- Countdown to Jetstar launch (25 Aug 2026) -----
document.querySelectorAll('[data-countdown]').forEach(el => {
  const launch = new Date('2026-08-25T00:00:00+05:30');
  const days = Math.ceil((launch - new Date()) / 86400000);
  if (days > 1) {
    el.textContent = days + ' days to go';
  } else if (days === 1) {
    el.textContent = 'tomorrow!';
  } else {
    el.textContent = 'now flying';
  }
});

// ----- Accordions (FAQ + itinerary days) -----
document.querySelectorAll('.faq-item button, .day-item button').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item, .day-item');
    const body = item.querySelector('.faq-body, .day-body');
    const isOpen = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    body.style.maxHeight = isOpen ? body.scrollHeight + 'px' : '0px';
  });
});

// ----- Reveal on scroll -----
// Simple scroll-position check (rAF-throttled) instead of IntersectionObserver:
// survives fast scrolling and programmatic jumps without leaving content hidden.
const revealEls = new Set(document.querySelectorAll('.reveal'));
function sweepReveals() {
  const limit = window.innerHeight * 1.08;
  revealEls.forEach(el => {
    if (el.getBoundingClientRect().top < limit) {
      el.classList.add('in');
      revealEls.delete(el);
    }
  });
}
if (revealEls.size) {
  let ticking = false;
  const onScroll = () => {
    if (ticking || !revealEls.size) return;
    ticking = true;
    requestAnimationFrame(() => { sweepReveals(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  sweepReveals();
  // Safety net: whatever is still hidden after 4s becomes visible regardless.
  setTimeout(() => { revealEls.forEach(el => el.classList.add('in')); revealEls.clear(); }, 4000);
}

// ----- Tour filters (tours page) -----
const filterBar = document.querySelector('.filter-bar');
if (filterBar) {
  const cards = document.querySelectorAll('[data-tour]');
  filterBar.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const f = chip.dataset.filter;
    cards.forEach(card => {
      const tags = card.dataset.tour.split(' ');
      card.style.display = (f === 'all' || tags.includes(f)) ? '' : 'none';
    });
  });
}

// ----- Enquiry wizard (plan page) -----
const wizard = document.querySelector('.wizard');
if (wizard) {
  const steps = Array.from(wizard.querySelectorAll('.wizard-step'));
  const bars = Array.from(wizard.querySelectorAll('.wizard-progress span'));
  const err = wizard.querySelector('.wizard-error');
  let current = 0;

  function show(i) {
    steps.forEach((s, n) => s.classList.toggle('active', n === i));
    bars.forEach((b, n) => b.classList.toggle('done', n <= i));
    err.style.display = 'none';
    current = i;
    wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validate(i) {
    // Only the contact step has hard-required fields
    const required = steps[i].querySelectorAll('[required]');
    for (const f of required) {
      if (!f.value.trim()) {
        err.textContent = 'Please fill in your ' + (f.dataset.label || 'details') + ' so we can reach you.';
        err.style.display = 'block';
        f.focus();
        return false;
      }
    }
    const email = steps[i].querySelector('input[type="email"][required]');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      err.textContent = 'That email address doesn’t look quite right — mind checking it?';
      err.style.display = 'block';
      email.focus();
      return false;
    }
    return true;
  }

  wizard.addEventListener('click', e => {
    if (e.target.matches('[data-next]')) {
      if (validate(current)) show(current + 1);
    }
    if (e.target.matches('[data-back]')) show(current - 1);
    if (e.target.matches('[data-submit]')) {
      if (!validate(current)) return;
      // NOTE: hook this up to a form service (e.g. Formspree/Getform) or your
      // email backend before launch — right now it only shows the thank-you panel.
      wizard.querySelector('.wizard-form').style.display = 'none';
      wizard.querySelector('.wizard-progress').style.display = 'none';
      wizard.querySelector('.wizard-success').style.display = 'block';
      wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  show(0);
}

// ----- Footer year -----
document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});
