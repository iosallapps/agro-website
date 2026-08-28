/* Agrondo: Farm Tracker — agrondo.com
   Vanilla, no dependencies, no third party request.
   Every rest state lives behind the .js class, so if this file never
   arrives the page is complete, visible and readable. */

(function () {
  'use strict';

  var root = document.documentElement;

  /* Tell the inline head watchdog this file arrived. The watchdog strips the
     .js class if we never run, which un-hides every reveal rest state. The
     inline snippet and this file do not share a fate: the HTML can land and
     this request can drop, and that must not leave the page blank. */
  root.classList.add('ready');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* ----------------------------------------------------------
     1. Stagger index
     Children of [data-stagger] get their own --i so the reveal
     transition delays cascade. Capped in CSS at 420ms.
     ---------------------------------------------------------- */
  each($$('[data-stagger]'), function (group) {
    each(group.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  /* ----------------------------------------------------------
     2. Counters
     The final value is already printed in the HTML. This only
     re-animates it. Nothing is invisible before it runs.
     ---------------------------------------------------------- */
  function runCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';

    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;

    var final = el.textContent;
    if (reduced) return;

    var start = null;
    var dur = 900;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4); /* easeOutQuart */
      if (p < 1) {
        el.textContent = String(Math.round(target * eased));
        requestAnimationFrame(frame);
      } else {
        el.textContent = final;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------
     3. Rotation timeline
     Nodes fill left to right, 90ms apart, then stop. No pulse.
     ---------------------------------------------------------- */
  function runRotation(el) {
    if (el.dataset.ran) return;
    el.dataset.ran = '1';
    var nodes = $$('.rot__node', el);
    each(nodes, function (node, i) {
      setTimeout(function () { node.classList.add('is-on'); }, i * 90);
    });
  }

  /* ----------------------------------------------------------
     4. Reveals, one observer for the whole page
     ---------------------------------------------------------- */
  var revealTargets = $$('.reveal, .dim, .rot, [data-count]');

  function activate(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-count')) runCounter(el);
    if (el.classList.contains('rot')) runRotation(el);
    each($$('[data-count]', el), runCounter);
  }

  if (hasIO && revealTargets.length) {
    /* Arm the states that render finished by default, immediately
       before they are observed, so a failed script leaves them drawn. */
    if (!reduced) {
      each($$('.dim'), function (d) { d.classList.add('is-armed'); });
      each($$('.rot'), function (r) { r.classList.add('is-armed'); });
    }

    var io = new IntersectionObserver(function (entries, obs) {
      each(entries, function (entry) {
        if (!entry.isIntersecting) return;
        activate(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 18% 0px' });

    each(revealTargets, function (el) {
      /* Anything already on screen at load reveals without waiting */
      io.observe(el);
    });
  } else {
    each(revealTargets, activate);
  }

  /* The hero reveals on load. Nothing in it waits on a decode any more:
     the plan behind the type is inline SVG and arrives with the HTML. */
  each($$('.hero .reveal'), function (el) { el.classList.add('in'); });

  /* ----------------------------------------------------------
     5. Nav: scrolled state and scrollspy
     One passive listener, throttled to one frame.

     There is no parallax here. There used to be, on the photo columns,
     and the photographs are gone: the site draws its own plates instead
     of buying pictures of farms that were never stood in.
     ---------------------------------------------------------- */
  var nav = $('[data-nav]');
  var ticking = false;

  function onFrame() {
    ticking = false;
    if (nav) {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onFrame);
  }

  if (nav) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onFrame();
  }

  /* Scrollspy: underline the section you are reading */
  var navLinks = $$('.nav__links a[href^="#"]');
  if (hasIO && navLinks.length) {
    var linkFor = {};
    var spied = [];

    each(navLinks, function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      linkFor[id] = link;
      spied.push(section);
    });

    if (spied.length) {
      var spy = new IntersectionObserver(function (entries) {
        each(entries, function (entry) {
          var link = linkFor[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            each(navLinks, function (l) { l.classList.remove('is-active'); });
            link.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });

      each(spied, function (s) { spy.observe(s); });
    }
  }

  /* ----------------------------------------------------------
     6. FAQ accordion
     Native details and summary do the work. This only makes the
     group exclusive, so one answer is open at a time.
     ---------------------------------------------------------- */
  each($$('.faq'), function (faq) {
    var items = $$('.faq__item', faq);
    each(items, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        each(items, function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  });

  /* ----------------------------------------------------------
     7. Nav disclosure, removed
     A hamburger handler used to sit here, bound to [data-nav-toggle]
     and [data-nav-panel]. No page ever carried either attribute, so
     it shipped in every download and ran on nothing. The subpages
     now keep their links on a second row, in CSS, which works with
     this file blocked. Nothing here to replace it with.
     ---------------------------------------------------------- */
})();

/* ============================================================
   LANGUAGE
   The site is static, so there is no server to read an IP and no
   geo lookup: that would mean calling a third party, which the
   privacy page promises this site never does. The browser's own
   language list is a better signal anyway, since a Romanian
   working in Germany wants Romanian, not German.
   ============================================================ */
(function () {
  'use strict';

  var SHIPPED = ['de','es','fr','it','nl','pl','pt-BR','pt-PT','ro','sv','tr','ja','ko','zh-Hans','zh-Hant'];
  var KEY = 'agrondo.lang';

  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  /* Remember an explicit choice, so detection never argues with the user. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.langs__item');
    if (a) store(a.getAttribute('hreflang') || 'en');
  });

  /* Written by the picker's own markup: the page we are on right now. */
  var here = document.documentElement.getAttribute('lang') || 'en';
  if (here !== 'en') { store(here); return; }

  /* Only the English pages auto-redirect, and only when nothing is stored,
     so a deliberate visit to /de/ is never bounced and a return visit is
     never redirected twice. */
  if (stored()) return;

  var tags = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || ''];

  function resolve(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-');
    var i;
    for (i = 0; i < SHIPPED.length; i++) {
      if (SHIPPED[i].toLowerCase() === t.toLowerCase()) return SHIPPED[i];
    }
    var base = t.split('-')[0].toLowerCase();
    var rest = t.slice(base.length + 1).toLowerCase();
    /* Portuguese and Chinese need the region, and a bare tag has to pick one. */
    if (base === 'pt') return rest === 'br' ? 'pt-BR' : 'pt-PT';
    if (base === 'zh') {
      if (rest.indexOf('hant') > -1 || rest === 'tw' || rest === 'hk' || rest === 'mo') return 'zh-Hant';
      return 'zh-Hans';
    }
    if (base === 'en') return 'en';
    for (i = 0; i < SHIPPED.length; i++) {
      if (SHIPPED[i].toLowerCase() === base) return SHIPPED[i];
    }
    return null;
  }

  var match = null;
  for (var i = 0; i < tags.length && !match; i++) match = resolve(tags[i]);

  /* English, or a language this site does not carry, both stay here. */
  if (!match || match === 'en') { store('en'); return; }

  var path = location.pathname;
  var page = path.replace(/^\/+/, '');
  if (page === '' || page === 'index.html') page = '';
  store(match);
  location.replace('/' + match + '/' + page + location.search + location.hash);
})();
