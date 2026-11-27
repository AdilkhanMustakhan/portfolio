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
    /* manifesto: text is fully lit at 75% of the pin, then holds still before the page moves on */
    var mfST = ScrollTrigger.create({
      trigger: mfStage, start: 'top top', end: '+=150%', pin: true, anticipatePin: 1,
      onUpdate: function (st) { light(mf.querySelectorAll('.c'), Math.min(1, st.progress / 0.75)); },
      onRefresh: function (st) { light(mf.querySelectorAll('.c'), Math.min(1, st.progress / 0.75)); }
    });
    scrubs.push({ st: mfST, update: function (st) { light(mf.querySelectorAll('.c'), Math.min(1, st.progress / 0.75)); } });
    document.querySelectorAll('h2.scrub').forEach(function (h) {
      var upd = function (st) { light(h.querySelectorAll('.c'), st.progress); };
      var st = ScrollTrigger.create({ trigger: h, start: 'top 90%', end: 'top 40%', onUpdate: upd, onRefresh: upd });
      scrubs.push({ st: st, update: upd });
    });
    splitAll();
    window.addEventListener('langchange', function () { splitAll(); marqueeFit(); layoutScene(); ScrollTrigger.refresh(); });

    /* the line with the eye draws in, everywhere it appears */
    document.querySelectorAll('.eye-line').forEach(function (l) {
      var inPin = !!l.closest('#manifesto');
      gsap.timeline({ scrollTrigger: { trigger: inPin ? '#manifesto' : l, start: inPin ? 'top 85%' : 'top 92%', end: inPin ? 'top top' : 'top 45%', scrub: 0.6 } })
        .from(l, { scaleX: 0, transformOrigin: '50% 50%', ease: 'none' })
        .from(l.querySelector('.eye'), { scale: 0, rotation: -90, ease: 'back.out(1.6)' }, 0.4);
    });

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
      gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 75%', end: 'top top', scrub: 0.6 } })
        .to(q('.d0'), { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0)
        .to(q('.g1 :is(rect,path)'), { strokeDashoffset: 0, duration: 0.8, stagger: 0.08, ease: 'power1.inOut' }, 0.3);
      /* 2) pinned: the rest, one idea at a time */
      var tl = sceneTL = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: '+=230%', scrub: 0.7, pin: true, anticipatePin: 1 } });
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
      tl.to({}, { duration: 1.0 });          /* hold: everything is visible before the page moves on */
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

    /* ---------- the thread: one line and one ball that run through the whole site ----------
       Stops are real elements, in reading order. Each stop owns a scroll position: for elements in
       normal flow, the moment they reach the focus line; inside pinned scenes, a point of the pin's
       progress. Between two stops the ball travels along an S-curve drawn between their live screen
       positions, so it stays attached to the content (pins and entrance animations included).
       In the lists the thread runs down the left margin, so it never crosses text. */
    (function () {
      var svg = document.getElementById('thread'), ball = document.getElementById('ball');
      var dim = svg.querySelector('.dim'), lit = svg.querySelector('.lit'), nodesG = svg.querySelector('.nodes');
      html.classList.add('thread');
      var D = sceneTL.duration();
      var focus = function () { return innerHeight * 0.46; };
      var gutEl = document.querySelector('#work .wrap'), mg = 18;
      var margin = function () { return mg; };
      function measureMargin() { mg = Math.max(8, (parseFloat(getComputedStyle(gutEl).paddingLeft) || 20) * 0.45); }
      function absTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
      /* where a stop sits on screen right now */
      function pos(st) {
        var r = st.el.getBoundingClientRect();
        if (st.side) return { x: margin(), y: r.top + r.height / 2 };
        return { x: r.left + r.width * (st.ax == null ? 0.5 : st.ax), y: r.top + r.height * (st.ay == null ? 0.5 : st.ay) };
      }
      var stops = [];
      function add(el, o) { if (el && el.getClientRects().length && (el.offsetHeight || el.getBoundingClientRect().height)) stops.push(Object.assign({ el: el }, o || {})); }   /* skip hidden ones (closed lists) */
      function build() {
        measureMargin(); stops = [];
        add(document.getElementById('globe'), { at: 0 });
        var eye = document.querySelector('#manifesto .eye');
        add(eye, { st: mfST, f: 0, eye: 1 }); add(eye, { st: mfST, f: 0.82, eye: 1 });
        add(eye, { st: mfST, f: 1, side: 1 });                       /* rolls out along the eye's own line to the margin */
        var sc = sceneTL.scrollTrigger, t1 = document.querySelector('#scene .t1');
        add(document.querySelector('#scene .kicker'), { st: sc, f: 0, side: 1, node: 1 });
        add(t1, { st: sc, f: 0.5 / D, side: 1 });                    /* down the margin to the label row… */
        [['t1', 0.6], ['t2', 2.2], ['t3', 3.8], ['t4', 5.0]].forEach(function (t) { add(document.querySelector('#scene .' + t[0]), { st: sc, f: (t[1] + 0.35) / D, ax: 0 }); });   /* the ball docks on each label's edge, never on its text */
        add(document.querySelector('#scene .t4'), { st: sc, f: 1, ax: 0 });
        add(document.querySelector('#work .kicker'), { side: 1, node: 1 });
        document.querySelectorAll('#work .stats > div:first-child, details.case > summary').forEach(function (e) { add(e, { side: 1, node: 1 }); });
        add(document.querySelector('.marquee'), { side: 1 });
        add(document.querySelector('#skills .kicker'), { side: 1, node: 1 });
        document.querySelectorAll('.sk > div').forEach(function (e, i) { if (i === 0 || innerWidth <= 1100) add(e, { side: 1, node: 1 }); });
        add(document.querySelector('#experience .kicker'), { side: 1, node: 1 });
        document.querySelectorAll('.xp > h3, .xp > .xr, .xp > details > .xr').forEach(function (e) { add(e, { side: 1, node: 1 }); });
        add(document.querySelector('#contact .kicker'), { side: 1, node: 1 });
        var talk = document.querySelector('.talk-btn');
        add(talk, { side: 1 });                                       /* …and in from the margin: the ball ends inside "let's talk" */
        add(talk, { last: 1, ay: 0.8 });                            /* below the words, inside the circle */
        /* scroll position of each stop */
        var max = ScrollTrigger.maxScroll(window), prev = -1e9, f = focus();
        stops.forEach(function (st) {
          var s;
          if (st.at === 0) s = 0;
          else if (st.st) s = st.st.start + st.f * (st.st.end - st.st.start);
          else if (st.last) s = max;
          else s = absTop(st.el) + st.el.offsetHeight / 2 - f;
          s = Math.min(max, Math.max(s, prev + 30));
          st.s = s; prev = s;
        });
        if (stops.length) stops[stops.length - 1].s = Math.max(stops[stops.length - 1].s, max);
        nodesG.innerHTML = stops.map(function (st, i) { return st.node ? '<circle data-i="' + i + '" r="4.5"/>' : ''; }).join('');
      }
      function curve(a, b) {             /* S-curve that leaves and arrives vertically */
        var dy = (b.y - a.y) * 0.5;
        return [a, { x: a.x, y: a.y + dy }, { x: b.x, y: b.y - dy }, b];
      }
      function at(c, t) {                /* point on a cubic + the part of it up to t (de Casteljau) */
        var l = function (p, q) { return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }; };
        var p01 = l(c[0], c[1]), p12 = l(c[1], c[2]), p23 = l(c[2], c[3]), a = l(p01, p12), b = l(p12, p23), p = l(a, b);
        return { p: p, head: [c[0], p01, a, p] };
      }
      var D2 = function (c) { return 'M' + c[0].x.toFixed(1) + ' ' + c[0].y.toFixed(1) + 'C' + c[1].x.toFixed(1) + ' ' + c[1].y.toFixed(1) + ' ' + c[2].x.toFixed(1) + ' ' + c[2].y.toFixed(1) + ' ' + c[3].x.toFixed(1) + ' ' + c[3].y.toFixed(1); };
      var bx = gsap.quickSetter(ball, 'x', 'px'), by = gsap.quickSetter(ball, 'y', 'px'), last = '';
      function frame() {
        if (!stops.length) return;
        var y = lenis ? lenis.scroll : scrollY, i = 0;
        while (i < stops.length - 1 && stops[i + 1].s <= y) i++;
        var a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
        var t = b === a ? 0 : Math.min(1, Math.max(0, (y - a.s) / (b.s - a.s)));
        t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;     /* ease in-out between stops */
        var lo = Math.max(0, i - 6), hi = Math.min(stops.length - 1, i + 7), P = [];
        for (var k = lo; k <= hi; k++) P[k] = pos(stops[k]);
        var d = '', dl = '';
        for (k = lo; k < hi; k++) { var c = curve(P[k], P[k + 1]); d += D2(c); if (k < i) dl += D2(c); }
        var cur = b === a ? { p: P[i], head: null } : at(curve(P[i], P[i + 1]), t);
        if (cur.head) dl += D2(cur.head);
        dim.setAttribute('d', d); lit.setAttribute('d', dl);
        bx(cur.p.x); by(cur.p.y);
        nodesG.querySelectorAll('circle').forEach(function (n) {
          var k = +n.dataset.i;
          if (k < lo || k > hi) { n.style.display = 'none'; return; }
          n.style.display = ''; n.setAttribute('cx', P[k].x.toFixed(1)); n.setAttribute('cy', P[k].y.toFixed(1));
          n.classList.toggle('on', k <= i);
        });
        /* inside an eye the ball becomes the eye's pupil */
        var inEye = (a.eye && t < 0.08) || (b.eye && t > 0.92) || (a.eye && b.eye && a.el === b.el);
        if (inEye + '' !== last) { last = inEye + ''; ball.classList.toggle('pupil', inEye); }
      }
      build();
      ScrollTrigger.addEventListener('refresh', build);
      window.addEventListener('langchange', function () { setTimeout(build, 50); });
      window.addEventListener('layoutchange', function () { setTimeout(build, 50); });
      gsap.ticker.add(frame);
    })();

    /* ---------- blocks rise in as they enter ---------- */
    gsap.utils.toArray('.kicker, .lead, .stats > div, .xp h3, .certs, .earlier, details.more, .talk, .links .pill, .sk h3').forEach(function (el) {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    ScrollTrigger.batch('details.case, .xr', {
      start: 'top 94%', once: true,
      onEnter: function (els) {
        els.forEach(function (e) { e.classList.add('in'); });
        gsap.from(els, { y: 40, opacity: 0, duration: 1.1, ease: EXPO, stagger: 0.07 });
      }
    });
    ScrollTrigger.batch('.sk li', {
      start: 'top 95%', once: true,
      onEnter: function (els) { gsap.from(els, { y: 24, scale: 0.7, opacity: 0, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.03 }); }
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

      document.querySelectorAll('.pill, .talk-btn, .logo').forEach(function (el) {
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
