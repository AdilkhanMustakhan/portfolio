/* Adilkhan Mustakhan — portfolio v3: motion layer (GSAP + ScrollTrigger + Lenis).
   Progressive: without these libraries, with reduced motion, or on error the page stays fully readable. */
(function () {
  var html = document.documentElement;
  var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  function off() { html.classList.remove('m', 'pre'); }
  if (RM || !window.gsap || !window.ScrollTrigger) { off(); return; }
  try { run(); } catch (e) { console.error(e); off(); }

  function run() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    var EXPO = 'expo.out';

    /* ---------- smooth scroll ---------- */
    var lenis = null;
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      window.goTo = function (t) {
        lenis.scrollTo(window.anchorY(t), { duration: 1.6, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
      };
      window.addEventListener('menutoggle', function () {
        document.body.classList.contains('menu') ? lenis.stop() : lenis.start();
      });
    }
    var refresh = function () { ScrollTrigger.refresh(); };
    window.addEventListener('layoutchange', refresh);
    window.addEventListener('fontsready', refresh);
    window.addEventListener('load', refresh);

    /* ---------- split text into words / letters (screen readers get the plain text) ---------- */
    function esc(c) { return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c; }
    function split(el) {
      var text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(/\s+/).map(function (w) {
        return '<span class="w" aria-hidden="true">' + Array.from(w).map(function (c) { return '<span class="c">' + esc(c) + '</span>'; }).join('') + '</span>';
      }).join(' ');
      return el.querySelectorAll('.c');
    }

    /* ---------- preloader → hero intro ---------- */
    var giantChars = document.querySelectorAll('#giant span');
    gsap.set('#giant', { clipPath: 'inset(-8% -5% 0% -5%)' });  /* letters rise in from below and leave upward through this mask */
    function intro(delay) {
      var tl = gsap.timeline({ delay: delay || 0 });
      tl.from(giantChars, { yPercent: 115, duration: 1.4, ease: EXPO, stagger: 0.05 }, 0)
        .from('header .l > *, header .r > *:not(.rbtn)', { y: -30, opacity: 0, duration: 1, ease: EXPO, stagger: 0.05 }, 0.2)
        .from('.h-top > *', { y: 24, opacity: 0, duration: 1, ease: EXPO, stagger: 0.08 }, 0.35)
        .from('.h-meta .roles span, .h-links .pill', { y: 24, opacity: 0, duration: 0.9, ease: EXPO, stagger: 0.04 }, 0.45);
      return tl;
    }
    if (html.classList.contains('pre')) {
      lenis && lenis.stop();
      window.scrollTo(0, 0);
      var pre = document.getElementById('pre'), num = pre.querySelector('.num'), cnt = { v: 0 };
      gsap.set(pre.querySelectorAll('circle'), { scale: 0, transformOrigin: '50% 50%' });
      gsap.timeline({
        onComplete: function () {
          html.classList.remove('pre');
          try { sessionStorage.setItem('pre', '1'); } catch (e) {}
          lenis && lenis.start();
        }
      })
        .to(pre.querySelector('.ln'), { scaleX: 1, duration: 0.9, ease: 'expo.inOut' })
        .to(pre.querySelector('.o'), { scale: 1, duration: 0.7, ease: 'back.out(1.6)' }, 0.55)
        .to(pre.querySelector('.d'), { scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.8)
        .to(cnt, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: function () { num.textContent = Math.round(cnt.v); } }, 0)
        .to(pre.querySelector('.d'), { x: 30, duration: 0.35, ease: 'power2.inOut', yoyo: true, repeat: 1 }, 1.25)
        .to(pre.querySelectorAll('svg, .ln, .num'), { opacity: 0, duration: 0.3 }, 1.9)
        .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 1.95)
        .add(intro(), 2.25);
    } else {
      intro(0.1);
    }

    /* ---------- PORTFOLIO: letters stretch toward the cursor, scatter upward on scroll ---------- */
    (function () {
      var hero = document.querySelector('.hero');
      gsap.set(giantChars, { transformOrigin: '50% 100%' });
      gsap.to(giantChars, {
        y: function (i) { var h = document.getElementById('giant').offsetHeight; return -h * (0.55 + ((i * 47) % 5) * 0.14); }, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('#globe', { y: -90, scale: 0.86, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      if (!FINE) return;
      var qs = Array.prototype.map.call(giantChars, function (c) { return gsap.quickTo(c, 'scaleY', { duration: 0.6, ease: 'power3' }); });
      var giant = document.getElementById('giant');   /* only while the mouse is over the letters themselves */
      giant.addEventListener('pointermove', function (e) {
        giantChars.forEach(function (c, i) {
          var r = c.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / Math.max(r.width, 1);
          qs[i](1 + 0.28 * Math.exp(-dx * dx * 0.9));
        });
      });
      giant.addEventListener('pointerleave', function () { qs.forEach(function (q) { q(1); }); });
    })();

    /* ---------- letters light up with the scroll (manifesto pinned, section titles in flow) ----------
       The triggers are made once; switching language only re-splits the text. */
    function light(chars, t) {
      var n = chars.length, k = t * (n + 6);
      for (var i = 0; i < n; i++) chars[i].style.opacity = (0.14 + 0.86 * Math.min(1, Math.max(0, (k - i) / 6))).toFixed(3);
    }
    var mf = document.querySelector('.mf'), mfStage = document.querySelector('#manifesto .stage'), mfEye = mfStage.querySelector('.eye i');
    var scrubs = [];
    function splitAll() {
      split(mf);
      document.querySelectorAll('h2.scrub').forEach(function (h) { split(h); });
      scrubs.forEach(function (s) { s.update(s.st); });
    }
    /* ---------- manifesto (as on motion.zajno) ----------
       A horizon line with the eye draws in as the chapter arrives; the ball is the eye's pupil.
       The text rises from below, each line lighting up as it climbs, and slides away under the line.
       When the last words are gone, the pupil grows into a circle that becomes the next chapter. */
    var circle = mfStage.querySelector('.mf-circle'), mfEyeEl = mfStage.querySelector('.eye'), pupil = mfEyeEl.querySelector('i');
    var mask = mfStage.querySelector('.mf-mask'), charTops = [], maskH = 0, textH = 0;
    var clear = 0;
    function measureMf() {
      maskH = mask.clientHeight;
      clear = mfEyeEl.offsetHeight / 2 + Math.max(22, maskH * 0.06);      /* the text always starts below the eye, with air */
      mf.style.fontSize = '';
      textH = mf.offsetHeight;
      var room = maskH - clear - 20;
      if (textH > room) { mf.style.fontSize = (parseFloat(getComputedStyle(mf).fontSize) * room / textH).toFixed(1) + 'px'; textH = mf.offsetHeight; }
      charTops = Array.prototype.map.call(mf.querySelectorAll('.c'), function (c) { return c.offsetTop + c.offsetHeight / 2; });
      var sr = mfStage.getBoundingClientRect(), er = mfEyeEl.getBoundingClientRect();
      var cx = er.left + er.width / 2 - sr.left, cy = er.top + er.height / 2 - sr.top;
      var R = Math.max(Math.hypot(cx, cy), Math.hypot(sr.width - cx, cy), Math.hypot(cx, sr.height - cy), Math.hypot(sr.width - cx, sr.height - cy));
      gsap.set(circle, { left: cx, top: cy, width: 2 * R + 4, height: 2 * R + 4, marginLeft: -R - 2, marginTop: -R - 2 });
    }
    var ease2 = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };
    /* pin = 300% of the screen:
       0–30%  the text stands in the middle and lights up letter by letter
       33–48% once fully lit, it slides up and disappears under the line (the eye watches it go)
       50–66% the pupil grows into a circle that becomes the next chapter · last screen: that chapter slides over */
    var mfLook = 0;
    function mfUpdate(st) {
      var p = st.progress, cs = mf.querySelectorAll('.c');
      if (cs.length !== charTops.length) measureMf();
      light(cs, clamp01(p / 0.3));
      var ex = ease2(clamp01((p - 0.33) / 0.15)), y0 = Math.max(clear, (maskH - textH) / 2), y = y0 - ex * (y0 + textH + 16);
      gsap.set(mf, { y: y });
      mfLook = ex;
      var cp = clamp01((p - 0.5) / 0.16);
      gsap.set(circle, { scale: ease2(cp) });
      pupil.style.opacity = cp > 0.02 ? 0 : 1;
    }
    var mfST = ScrollTrigger.create({
      trigger: mfStage, start: 'top top', end: '+=300%', pin: true, anticipatePin: 1, refreshPriority: 10,
      onUpdate: mfUpdate, onRefresh: function (st) { measureMf(); mfUpdate(st); }
    });
    scrubs.push({ st: mfST, update: function (st) { measureMf(); mfUpdate(st); } });
    /* the line and the eye arrive with the chapter */
    gsap.timeline({ scrollTrigger: { trigger: '#manifesto', start: 'top 85%', end: 'top 15%', scrub: 0.6 } })
      .from(mfStage.querySelector('.eye-line'), { scaleX: 0, transformOrigin: '50% 50%', ease: 'none' })
      .from(mfEyeEl, { scale: 0, rotation: -90, ease: 'back.out(1.6)' }, 0.45)
      .from(pupil, { scale: 0, ease: 'back.out(3)' }, 0.8);
    document.querySelectorAll('h2.scrub').forEach(function (h) {
      var upd = function (st) { light(h.querySelectorAll('.c'), st.progress); };
      var st = ScrollTrigger.create({ trigger: h, start: 'top 90%', end: 'top 40%', onUpdate: upd, onRefresh: upd });
      scrubs.push({ st: st, update: upd });
    });
    splitAll();
    window.addEventListener('langchange', function () { splitAll(); marqueeFit(); layoutScene(); ScrollTrigger.refresh(); });

    /* the line with the eye draws in, everywhere it appears */
    document.querySelectorAll('.foot-line').forEach(function (l) {
      var inPin = false;
      gsap.timeline({ scrollTrigger: { trigger: l, start: 'top 96%', once: true }, defaults: { duration: 1.1 } })   /* plays once: it sits at the very bottom, where a scroll-scrub could never finish */
        .from(l, { scaleX: 0, transformOrigin: '50% 50%', ease: 'expo.out' })
        .from(l.querySelector('.eye'), { scale: 0, rotation: -90, ease: 'back.out(1.6)', duration: 0.8 }, 0.35);
    });


    /* ---------- eyes that look at you: the two in the logo and the big one on the line ---------- */
    (function () {
      var logo = Array.prototype.map.call(document.querySelectorAll('.eye2'), function (e) {
        return { el: e, ball: e.querySelector('i'), pupil: e.querySelector('b'), bx: gsap.quickTo(e.querySelector('i'), 'x', { duration: 0.4, ease: 'power3' }), by: gsap.quickTo(e.querySelector('i'), 'y', { duration: 0.4, ease: 'power3' }), px: gsap.quickTo(e.querySelector('b'), 'x', { duration: 0.3, ease: 'power3' }), py: gsap.quickTo(e.querySelector('b'), 'y', { duration: 0.3, ease: 'power3' }) };
      });
      var big = { el: mfEyeEl, px: gsap.quickTo(pupil, 'x', { duration: 0.5, ease: 'power3' }), py: gsap.quickTo(pupil, 'y', { duration: 0.5, ease: 'power3' }) };
      var mx = innerWidth / 2, my = innerHeight / 2, has = false;
      function look() {
        logo.forEach(function (e) {
          var r = e.el.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
          e.bx(dx / d * 3 * k); e.by(dy / d * 3 * k); e.px(dx / d * 7 * k); e.py(dy / d * 7 * k);
        });
        var r = big.el.getBoundingClientRect();
        if (mfLook > 0.01) { big.px(0); big.py(-26 * Math.min(1, mfLook * 3)); return; }      /* watches the text leave */
        var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 240);
        big.px(dx / d * 24 * k); big.py(dy / d * 24 * k);
      }
      window.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; mx = e.clientX; my = e.clientY; has = true; look(); }, { passive: true });
      /* on phones (no mouse) the eyes glance the way the page is moving */
      var lastY = 0;
      gsap.ticker.add(function () {
        var y = lenis ? lenis.scroll : scrollY, v = y - lastY; lastY = y;
        if (!has) { my = innerHeight / 2 + Math.max(-1, Math.min(1, v / 20)) * innerHeight; mx = innerWidth / 2; }
        look();
      });
      /* blink now and then */
      (function blink() {
        gsap.to(logo.map(function (e) { return e.ball; }), { scaleY: 0.08, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.in' });
        gsap.delayedCall(2.5 + Math.random() * 4, blink);
      })();
    })();

    /* ---------- line-art scene ----------
       Fits one screen under the header. It starts drawing while it scrolls in (no empty screen),
       then holds in place until every drawing and label is done, pauses, and lets go. */
    var layoutScene, sceneTL;
    (function () {
      var stage = document.querySelector('#scene .stage'), area = stage.querySelector('.art-area'), box = stage.querySelector('.art-box');
      var tall = matchMedia('(max-aspect-ratio: 1/1)');
      var VW = 1440, VH = 760;
      layoutScene = function () {
        var aw = area.clientWidth, ah = area.clientHeight, w;
        if (tall.matches) { w = Math.min(aw * 2.05, ah * VW / VH); } else { w = Math.min(aw, ah * VW / VH); }
        box.style.width = w + 'px'; box.style.height = (w * VH / VW) + 'px';
        box.style.setProperty('--s', (w / VW).toFixed(4));
      };
      layoutScene();
      window.addEventListener('resize', layoutScene);
      ScrollTrigger.addEventListener('refreshInit', layoutScene);

      var shapes = ':is(path,rect,circle,ellipse,polyline,line):not(.solid)';
      stage.querySelectorAll('svg.art ' + shapes).forEach(function (s) { s.setAttribute('pathLength', '1'); s.style.strokeDasharray = '1 1'; s.style.strokeDashoffset = '1'; });
      gsap.set(stage.querySelectorAll('svg.art .dot'), { scale: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' });
      var q = function (sel) { return stage.querySelectorAll('svg.art ' + sel); };
      var rot = { t1: -6, t2: 3, t3: -4, t4: 0 };
      gsap.set(stage.querySelectorAll('.tag'), { scale: 0 });
      function pop(tl, cls, at) {
        tl.fromTo(stage.querySelector('.' + cls), { scale: 0, rotation: rot[cls] - 28 }, { scale: 1, rotation: rot[cls], duration: 0.6, ease: 'back.out(1.7)' }, at);
      }
      /* 1) while the section scrolls into view: base line, axis and bars */
      gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top top', scrub: 0.6 } })
        .to(q('.d0'), { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0)
        .to(q('.g1 :is(rect,path)'), { strokeDashoffset: 0, duration: 0.8, stagger: 0.08, ease: 'power1.inOut' }, 0.3);
      /* 2) pinned: the rest, one idea at a time */
      var tl = sceneTL = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: '+=280%', scrub: 0.7, pin: true, anticipatePin: 1, refreshPriority: 9 } });
      tl.to(q('.g1 polyline'), { strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut' }, 0)
        .to(q('.g1 .dot'), { scale: 1, duration: 0.3, stagger: 0.07, ease: 'back.out(3)' }, 0.2);
      pop(tl, 't1', 0.6);
      tl.to(q('.g2 ' + shapes), { strokeDashoffset: 0, duration: 1, stagger: 0.07, ease: 'power1.inOut' }, 1.2)
        .to(q('.g2 .dot'), { scale: 1, duration: 0.3, stagger: 0.1, ease: 'back.out(3)' }, 2.0);
      pop(tl, 't2', 2.2);
      tl.to(q('.g3 ' + shapes), { strokeDashoffset: 0, duration: 1, stagger: 0.07, ease: 'power1.inOut' }, 2.8);
      pop(tl, 't3', 3.8);
      tl.to(q('.g4 ' + shapes), { strokeDashoffset: 0, duration: 0.7, stagger: 0.1, ease: 'power1.inOut' }, 4.4);
      pop(tl, 't4', 5.0);
      tl.to({}, { duration: 0.7 });          /* hold: everything is visible… */
      /* …then a panel sweeps in from the right and wipes the scene away */
      tl.fromTo(stage.querySelector('.wipe'), { xPercent: 101 }, { xPercent: 0, duration: 1.1, ease: 'power3.inOut' }, 6.3)
        .to({}, { duration: 0.2 });
      /* tall phone screens: the "camera" moves from one drawing to the next */
      gsap.matchMedia().add('(max-aspect-ratio: 1/1)', function () {
        var w = function () { return box.offsetWidth; };
        gsap.set(box, { x: function () { return w() * 0.255; } });
        tl.to(box, { x: 0, duration: 0.8, ease: 'power2.inOut' }, 1.0)
          .to(box, { x: function () { return -w() * 0.3; }, duration: 0.8, ease: 'power2.inOut' }, 2.6)
          .to(box, { x: 0, duration: 0.8, ease: 'power2.inOut' }, 4.3);
        return function () { gsap.set(box, { x: 0 }); };
      });
    })();

    /* rows passing under a still mouse don't light up while the page is moving */
    (function () {
      var t = 0;
      function mark() { html.classList.add('scrolling'); clearTimeout(t); t = setTimeout(function () { html.classList.remove('scrolling'); }, 160); }
      if (lenis) lenis.on('scroll', mark); else window.addEventListener('scroll', mark, { passive: true });
    })();

    /* ---------- tilted word bands: three huge words sweep across in opposite directions ---------- */
    function fillBands() {
      document.querySelectorAll('#bands .row').forEach(function (r) {
        var t = r.getAttribute('data-' + (html.lang === 'ru' ? 'ru' : 'en')).replace(/&amp;/g, '&');
        r.innerHTML = new Array(5).join('<span>' + t.replace(/&/g, '&amp;') + '</span>');
      });
    }
    fillBands();
    window.addEventListener('langchange', fillBands);
    var bandsST = { trigger: '#bands', start: 'top top', endTrigger: '#work', end: 'top top', scrub: 0.6 };
    ScrollTrigger.create({ trigger: '#bands', start: 'top top', endTrigger: '#work', end: 'top top', pin: true, pinSpacing: false, refreshPriority: 8 });
    gsap.fromTo('#bands .b1 .row', { xPercent: 0 }, { xPercent: -22, ease: 'none', scrollTrigger: Object.assign({}, bandsST, { start: 'top bottom' }) });
    gsap.fromTo('#bands .b2 .row', { xPercent: -24 }, { xPercent: 0, ease: 'none', scrollTrigger: Object.assign({}, bandsST, { start: 'top bottom' }) });
    gsap.fromTo('#bands .b3 .row', { xPercent: -4 }, { xPercent: -26, ease: 'none', scrollTrigger: Object.assign({}, bandsST, { start: 'top bottom' }) });
    gsap.fromTo('#bands .band', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#bands', start: 'top bottom', end: 'top top', scrub: 0.6 } });

    /* ---------- stacked sheets: each chapter slides up over the previous one, which stays and dims ---------- */
    var sheets = ['#bands', '#work', '#skills', '#experience'].map(function (q) { return document.querySelector(q); });
    sheets.forEach(function (sh, i) {
      var next = sheets[i + 1] || document.getElementById('contact');
      if (i > 0) ScrollTrigger.create({
        trigger: sh, pin: true, pinSpacing: false, refreshPriority: 8 - i,
        start: function () { return sh.offsetHeight > innerHeight ? 'bottom bottom' : 'top top'; },
        endTrigger: next, end: 'top top'
      });
      if (sh.classList.contains('sheet')) gsap.fromTo(sh, { '--dim': 0 }, { '--dim': 0.6, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
    });
    /* stat circles drift sideways while they pass */
    gsap.matchMedia().add('(min-width: 761px)', function () {
      gsap.fromTo('#work .stats', { x: function () { return innerWidth * 0.07; } }, { x: function () { return -innerWidth * 0.05; }, ease: 'none',
        scrollTrigger: { trigger: '#work .stats', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    });

    /* ---------- blocks rise in as they enter ---------- */
    gsap.utils.toArray('.kicker, .lead, .stats > div, .xp h3, .certs, .earlier, details.more, #contact .mail, .c-actions, .c-now, .c-card, .sk h3').forEach(function (el) {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    ScrollTrigger.batch('details.case', {
      start: 'top 94%', once: true,
      onEnter: function (els) { els.forEach(function (e) { e.classList.add('in'); }); gsap.from(els, { y: 40, opacity: 0, duration: 1.1, ease: EXPO, stagger: 0.07 }); }
    });
    ScrollTrigger.batch('.xr', {           /* job rows rise in from below */
      start: 'top 94%', once: true,
      onEnter: function (els) { els.forEach(function (e) { e.classList.add('in'); }); gsap.from(els, { y: 70, opacity: 0, duration: 1.2, ease: EXPO, stagger: 0.09 }); }
    });
    ScrollTrigger.batch('.sk li', {        /* skill pills rise in from below */
      start: 'top 95%', once: true,
      onEnter: function (els) { gsap.from(els, { y: 46, opacity: 0, duration: 1, ease: EXPO, stagger: 0.03 }); }
    });
    /* case images unmask when a project opens */
    window.addEventListener('caseopen', function (e) {
      var imgs = e.detail.querySelectorAll('.imgs img, .gal a');
      if (imgs.length) gsap.fromTo(imgs, { clipPath: 'inset(100% 0% 0% 0% round 18px)', y: 40 }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', y: 0, duration: 1.2, ease: EXPO, stagger: 0.06, delay: 0.15, clearProps: 'clipPath,transform' });
    });

    /* ---------- marquee that follows scroll direction and speed ---------- */
    var mq, track = document.querySelector('.marquee .track');
    function marqueeFit() {
      if (mq) mq.kill();
      gsap.set(track, { xPercent: 0 });
      mq = gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
      mq.totalTime(26 * 400);
    }
    marqueeFit();
    var dir = 1;
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onToggle: function (s) { s.isActive ? mq.play() : mq.pause(); },
      onUpdate: function (s) {
        dir = s.direction;
        var boost = 1 + Math.min(Math.abs(s.getVelocity()) / 350, 5);
        gsap.to(mq, { timeScale: dir * boost, duration: 0.2, overwrite: true });
        gsap.to(mq, { timeScale: dir, duration: 1.2, delay: 0.25 });
      }
    });

    /* ---------- cursor dot and magnetic pills (mouse only) ---------- */
    if (FINE) {
      html.classList.add('cur');
      var cur = document.getElementById('cur'), lab = cur.querySelector('span');
      var qx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
      window.addEventListener('pointermove', function (e) {
        qx(e.clientX); qy(e.clientY);
      }, { passive: true });
      var state = '', last = null;
      document.addEventListener('pointerover', function (e) { last = e.target; look(e.target); });
      document.addEventListener('click', function () { setTimeout(function () { last && look(last); }, 30); });
      window.addEventListener('langchange', function () { state = ''; last && look(last); });
      function look(t) {
        var s = '', txt = '';
        if (t.closest('details.case:not([open]) > summary')) { s = 'label'; txt = html.lang === 'ru' ? 'открыть' : 'open'; }
        else if (t.closest('details.case[open] > summary')) { s = 'label'; txt = html.lang === 'ru' ? 'закрыть' : 'close'; }
        else if (t.closest('#globe')) { s = 'label'; txt = html.lang === 'ru' ? 'крутить' : 'drag'; }
        else if (t.closest('a, button, summary, .lang')) { s = 'link'; }
        if (s + txt === state) return;
        state = s + txt; lab.textContent = txt;
        cur.classList.toggle('big', s === 'label');
        var d = s === 'label' ? 84 : s === 'link' ? 40 : 0;   /* the scroll ball is the page's dot; the cursor only shows over things you can use */
        gsap.to(cur, { width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, duration: 0.45, ease: 'power3' });
      }
      document.addEventListener('pointerleave', function () { gsap.to(cur, { opacity: 0, duration: 0.2 }); });
      document.addEventListener('pointerenter', function () { gsap.to(cur, { opacity: 1, duration: 0.2 }); });

      document.querySelectorAll('.pill, .eyes').forEach(function (el) {
        var big = el.classList.contains('talk-btn'), k = big ? 0.35 : 0.25;
        var mx, my, back;   /* created on first hover and never "overwrite", so they can't cut the intro short */
        el.addEventListener('pointermove', function (e) {
          if (!mx) { back && back.kill(); mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }); my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' }); }
          var r = el.getBoundingClientRect();
          mx((e.clientX - (r.left + r.width / 2)) * k); my((e.clientY - (r.top + r.height / 2)) * k);
        });
        el.addEventListener('pointerleave', function () {
          if (!mx) return;
          mx = my = null;
          back = gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
        });
      });
    }
  }
})();
