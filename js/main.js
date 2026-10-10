// Small progressive enhancements: the page works without JavaScript.
(function () {
  const nav = document.querySelector('.nav');
  const menuBtn = document.querySelector('.menu-btn');

  // Menu is transparent over the hero and turns white once the page scrolls
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  // Dropdowns: click to open (needed on touch screens and in the mobile menu)
  document.querySelectorAll('.dropdown').forEach((dd) => {
    const btn = dd.querySelector('.drop-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !dd.classList.contains('open');
      document.querySelectorAll('.dropdown.open').forEach((o) => {
        o.classList.remove('open');
        o.querySelector('.drop-btn').setAttribute('aria-expanded', 'false');
      });
      dd.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach((o) => o.classList.remove('open'));
  });

  // Close the mobile menu after choosing a link
  document.querySelectorAll('.menu a').forEach((a) => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Milestone marks: each bar shows marks of earlier milestones (light) + this one (green),
  // like a running total. Set data-marks="6" on a milestone <li> to fill it in.
  let runningTotal = 0;
  document.querySelectorAll('.ms').forEach((m) => {
    const marks = parseFloat(m.dataset.marks);
    const prev = m.querySelector('.pb-prev');
    const cur = m.querySelector('.pb-cur');
    if (isNaN(marks)) return;           // marks not set yet: label stays "TBC", bar stays empty
    m.querySelector('.marks-val').textContent = marks;
    prev.style.width = runningTotal + '%';
    cur.style.width = marks + '%';
    cur.textContent = marks + '%';
    runningTotal += marks;
  });

  // Milestones: the select box and the nav dropdown both highlight one milestone
  const select = document.getElementById('milestone-select');
  function showMilestone(id, scroll) {
    document.querySelectorAll('.ms').forEach((m) => m.classList.toggle('selected', m.dataset.id === id));
    if (select.value !== id) select.value = id;
    const target = document.querySelector('.ms[data-id="' + id + '"]');
    if (scroll && target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  select.addEventListener('change', () => showMilestone(select.value, true));
  document.querySelectorAll('[data-milestone]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showMilestone(a.dataset.milestone, true);
    });
  });
  // Start on the next upcoming milestone
  const next = document.querySelector('.ms:not(.done)');
  if (next) showMilestone(next.dataset.id, false);

  // Highlight the current section in the menu
  const links = Array.from(document.querySelectorAll('.menu > a[href^="#"]'));
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  // Contact form: sent to the group inbox through FormSubmit (formsubmit.co), then a
  // "Submitted" message is shown. If sending fails, the visitor gets a mail link instead.
  const INBOX = 'sahaya.researchteam@gmail.com';
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  function showStatus(kind, html) {
    status.className = 'form-status ' + kind;
    status.innerHTML = html;
    status.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    status.hidden = true;
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + INBOX, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: f.name.value,
          email: f.email.value,
          message: f.message.value,
          _subject: '[Sahaya website] Query from ' + f.name.value,
          _template: 'table',
          _captcha: 'false'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || 'send failed');
      showStatus('ok', '<strong>Submitted!</strong> Thank you, ' + f.name.value.replace(/[<>&]/g, '') +
        '. Your message has been sent to Team Sahaya and we will reply to your e-mail soon.');
      f.reset();
    } catch (err) {
      const mail = 'mailto:' + INBOX + '?subject=' + encodeURIComponent('[Sahaya website] Query from ' + f.name.value) +
        '&body=' + encodeURIComponent(f.message.value + '\n\n' + f.name.value + '\n' + f.email.value);
      const reason = String(err && err.message || '');
      const detail = reason && reason !== 'send failed' && !/Failed to fetch|NetworkError|Load failed/i.test(reason)
        ? ' <br><small>Reason: ' + reason.replace(/[<>&]/g, '') + '</small>'
        : ' Please check your internet connection and try again.';
      showStatus('err', '<strong>Sorry, your message could not be sent.</strong>' + detail + ' You can also <a href="' +
        mail + '">e-mail us directly</a>.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });
})();
