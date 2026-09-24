/* ==========================================================================
   Forest Cafe — main.js
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll lock ---------- */
  var locks = 0;
  function lockScroll() { locks++; document.body.classList.add('no-scroll'); }
  function unlockScroll() { locks = Math.max(0, locks - 1); if (!locks) document.body.classList.remove('no-scroll'); }

  /* ======================================================================
     1. Preloader — always finishes, even if the video never loads
     ====================================================================== */
  (function preloader() {
    var pre = $('#preloader');
    var loadVid = $('#loadingVideo');
    var heroVid = $('#heroVideo');
    if (!pre) return;

    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      pre.classList.add('is-done');
      unlockScroll();
      if (heroVid) {
        var p = heroVid.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked — poster frame stays */ });
      }
      setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 900);
    }

    lockScroll();

    if (reduceMotion) { finish(); return; }

    if (loadVid) {
      loadVid.addEventListener('ended', finish);
      loadVid.addEventListener('error', function () { pre.classList.add('no-video'); });
      var play = loadVid.play();
      if (play && play.catch) play.catch(function () { pre.classList.add('no-video'); });
    } else {
      pre.classList.add('no-video');
    }

    // hard stop: nobody waits longer than 6 seconds for an intro
    setTimeout(finish, 6000);
    $('#skipIntro') && $('#skipIntro').addEventListener('click', finish);
    window.addEventListener('load', function () {
      setTimeout(function () { if (!finished && loadVid && !loadVid.duration) finish(); }, 1500);
    });
  }());

  /* ======================================================================
     2. Navbar: stuck state + scrollspy
     ====================================================================== */
  (function navbar() {
    var nav = $('#nav');

    function onScroll() {
      if (!nav) return;
      nav.classList.toggle('is-stuck', window.scrollY > 60);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var links = $$('#navLinks a');
    var targets = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);

    if ('IntersectionObserver' in window && targets.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });

      targets.forEach(function (t) { spy.observe(t); });
    }
  }());

  /* ======================================================================
     3. Scroll progress + back to top
     ====================================================================== */
  (function scrollUi() {
    var bar = $('#progressBar');
    var top = $('#toTop');

    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      if (bar) bar.style.width = pct + '%';
      if (top) top.classList.toggle('is-on', window.scrollY > 700);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }());

  /* ======================================================================
     4. Reveal on scroll
     ====================================================================== */
  (function reveals() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }());

  /* ======================================================================
     5. Cafe photo stack + full gallery + lightbox
     ====================================================================== */
  var galleryImages = [
    'CafeImg/cafe-01.jpg', 'CafeImg/cafe-05.jpg', 'CafeImg/cafe-06.jpg',
    'CafeImg/cafe-11.jpg', 'CafeImg/cafe-14.jpg', 'CafeImg/cafe-18.jpg',
    'CafeImg/cafe-19.jpg', 'CafeImg/cafe-20.jpg', 'CafeImg/cafe-22.jpg'
  ];

  (function stack() {
    var cards = $$('#cardsStack .photo-card');
    if (!cards.length) return;
    var positions = [0, 1, 2, 3, 4];
    var wrapper = $('.cards-wrapper');
    var autoTimer = null;

    function paint() {
      cards.forEach(function (card, i) {
        card.className = 'photo-card pos-' + positions[i];
      });
    }

    function next() {
      positions.push(positions.shift()); paint();
    }
    function prev() {
      positions.unshift(positions.pop()); paint();
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(next, 2800);
    }
    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
    }

    $('#nextCard') && $('#nextCard').addEventListener('click', function () {
      next(); startAuto();
    });
    $('#prevCard') && $('#prevCard').addEventListener('click', function () {
      prev(); startAuto();
    });
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        openLightbox(parseInt(card.dataset.index, 10) || 0);
      });
    });

    if (wrapper) {
      wrapper.addEventListener('mouseenter', stopAuto);
      wrapper.addEventListener('mouseleave', startAuto);
    }

    startAuto();
  }());

  (function galleryToggle() {
    var def = $('#galleryDefault');
    var full = $('#galleryFull');
    if (!def || !full) return;

    $('#exploreCafeBtn') && $('#exploreCafeBtn').addEventListener('click', function () {
      def.classList.add('is-hidden');
      full.classList.add('is-open');
      full.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    $('#closeGalleryBtn') && $('#closeGalleryBtn').addEventListener('click', function () {
      full.classList.remove('is-open');
      def.classList.remove('is-hidden');
      $('#cafe').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    $$('#galleryGrid .grid-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openLightbox(parseInt(btn.dataset.index, 10) || 0);
      });
    });
  }());

  var lb = $('#lightbox');
  var lbImg = $('#lbImage');
  var lbCounter = $('#lbCounter');
  var lbIndex = 0;

  function openLightbox(i) {
    if (!lb) return;
    lbIndex = (i + galleryImages.length) % galleryImages.length;
    lbImg.src = galleryImages[lbIndex];
    lbImg.alt = 'Forest Cafe photo ' + (lbIndex + 1) + ' of ' + galleryImages.length;
    lbCounter.textContent = (lbIndex + 1) + ' / ' + galleryImages.length;
    lb.classList.add('is-open');
    lockScroll();
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    unlockScroll();
  }
  if (lb) {
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', function () { openLightbox(lbIndex - 1); });
    $('#lbNext').addEventListener('click', function () { openLightbox(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  }

  /* ======================================================================
     6. Menu tabs + full menu modal
     ====================================================================== */
  (function menu() {
    var tabs = $$('.menu-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', String(on));
        });
        $$('.menu-panel').forEach(function (p) {
          p.classList.toggle('is-active', p.id === 'panel-' + tab.dataset.menu);
        });
      });
    });

    var modal = $('#menuModal');
    if (!modal) return;
    function open() { modal.classList.add('is-open'); lockScroll(); }
    function close() { modal.classList.remove('is-open'); unlockScroll(); }
    $('#viewMenuBtn') && $('#viewMenuBtn').addEventListener('click', open);
    $('#closeMenuModal').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  }());

  /* ======================================================================
     7. Room tabs + room modal
     ====================================================================== */
  (function rooms() {
    var tabs = $$('.room-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', String(on));
        });
        $$('.room-grid').forEach(function (g) {
          g.classList.toggle('is-active', g.id === 'grid-' + tab.dataset.room);
        });
      });
    });

    var modal = $('#roomModal');
    if (!modal) return;

    function close() { modal.classList.remove('is-open'); unlockScroll(); }

    $$('.room-card').forEach(function (card) {
      card.addEventListener('click', function () {
        $('#roomModalImg').src = card.dataset.image;
        $('#roomModalImg').alt = card.dataset.title + ', ' + card.dataset.category;
        $('#roomModalTitle').textContent = card.dataset.title;
        $('#roomModalDesc').textContent = card.dataset.desc;
        modal.classList.add('is-open');
        lockScroll();
      });
    });

    $('#roomModalClose').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  }());

  /* ======================================================================
     8. Newsletter
     ====================================================================== */
  (function newsletter() {
    var form = $('#newsletterForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#nlEmail');
      var msg = $('#newsletterMsg');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (!ok) {
        msg.style.color = '#E6A07A';
        msg.textContent = 'That email does not look right.';
        return;
      }
      msg.style.color = '#9DC77F';
      msg.textContent = 'Done. First letter goes out on the 1st.';
      input.value = '';
    });
  }());

  /* ======================================================================
     9. Escape closes whatever is open
     ====================================================================== */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var open = $('.modal.is-open, .lightbox.is-open, .room-modal.is-open');
      if (!open) return;
      open.classList.remove('is-open');
      unlockScroll();
      return;
    }
    if ($('#lightbox') && $('#lightbox').classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') openLightbox(lbIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(lbIndex + 1);
    }
  });

  /* ---------- year ---------- */
  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
}());
