/* VEDIT website — progressive enhancement only.
   Everything works without JS: reveals fall back to visible content,
   the FAQ uses native <details>, and anchors rely on CSS smooth scrolling. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     1. Reveal-on-scroll (IntersectionObserver, staggered siblings)
  --------------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(
    doc.querySelectorAll('[data-reveal]')
  );

  if (!reducedMotion && 'IntersectionObserver' in window) {
    // Stagger elements that share the same parent (cap the delay).
    var groups = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      var index = groups.get(parent) || 0;
      groups.set(parent, index + 1);
      el.style.transitionDelay = Math.min(index * 70, 420) + 'ms';
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------------
     2. Active nav-link highlighting while scrolling
  --------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(
    doc.querySelectorAll('.nav-links a[data-nav]')
  );
  var sectionIds = navLinks.map(function (a) { return a.getAttribute('data-nav'); });
  var ticking = false;

  function currentSectionId() {
    var probe = window.scrollY + 140; /* just below the sticky header */
    var current = null;
    sectionIds.forEach(function (id) {
      var el = doc.getElementById(id);
      if (el && el.offsetTop <= probe) { current = id; }
    });
    var atBottom = window.innerHeight + window.scrollY >=
      doc.documentElement.scrollHeight - 4;
    if (atBottom && sectionIds.length) { current = sectionIds[sectionIds.length - 1]; }
    return current;
  }

  function updateActiveNav() {
    ticking = false;
    var current = currentSectionId();
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('data-nav') === current;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if (navLinks.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateActiveNav);
      }
    }, { passive: true });
    updateActiveNav();
  }

  /* ---------------------------------------------------------------
     3. Copy button for the build-from-source block
  --------------------------------------------------------------- */
  var copyBtn = doc.querySelector('.copy-btn');
  if (copyBtn) {
    var copyLabel = copyBtn.querySelector('.copy-label');
    var resetTimer = null;

    function feedback(ok) {
      copyBtn.classList.toggle('copied', ok);
      copyLabel.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      if (resetTimer) { window.clearTimeout(resetTimer); }
      resetTimer = window.setTimeout(function () {
        copyBtn.classList.remove('copied');
        copyLabel.textContent = 'Copy';
      }, 1800);
    }

    function legacyCopy(text) {
      var ta = doc.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      doc.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
      doc.body.removeChild(ta);
      return ok;
    }

    copyBtn.addEventListener('click', function () {
      var target = doc.getElementById(copyBtn.getAttribute('data-copy'));
      if (!target) { return; }
      var text = (target.innerText || target.textContent || '').replace(/\s+$/, '');

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { feedback(true); },
          function () { feedback(legacyCopy(text)); }
        );
      } else {
        feedback(legacyCopy(text));
      }
    });
  }

  /* ---------------------------------------------------------------
     4. FAQ accordion — opening one item closes the others.
        Native <details> still works when JS is disabled.
  --------------------------------------------------------------- */
  var faqItems = Array.prototype.slice.call(doc.querySelectorAll('#faq details'));
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) { return; }
      faqItems.forEach(function (other) {
        if (other !== item) { other.open = false; }
      });
    });
  });
}());
