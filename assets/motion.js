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
        lenis.scrollTo(t === 0 ? 0 : t, { duration: 1.6, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
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
    gsap.set('#giant', { clipPath: 'inset(-10% -5% -2% -5%)' });
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

    /* hero drifts away as you scroll */
    gsap.to('#giant', { yPercent: 35, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('#globe', { y: -80, scale: 0.86, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* ---------- letter-by-letter "lighting up" text (manifesto + section titles) ---------- */
    var textTriggers = [];
    function buildText() {
      textTriggers.forEach(function (t) { t.kill(); });
      textTriggers = [];
      var mf = document.querySelector('.mf'), stage = document.querySelector('#manifesto .stage');
      var chars = split(mf);
      var tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: '+=160%', scrub: 0.6, pin: true, anticipatePin: 1 } });
      tl.fromTo(chars, { opacity: 0.14 }, { opacity: 1, stagger: 0.08, ease: 'none', duration: 0.6 }, 0)
        .fromTo('#manifesto .eye i', { x: -18 }, { x: 18, ease: 'none', duration: tl.duration() || 1 }, 0);
      textTriggers.push(tl.scrollTrigger);
      document.querySelectorAll('h2.scrub').forEach(function (h) {
        var cs = split(h);
        var tw = gsap.fromTo(cs, { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: h, start: 'top 88%', end: 'top 30%', scrub: 0.5 } });
        textTriggers.push(tw.scrollTrigger);
      });
    }
    buildText();
    window.addEventListener('langchange', function () { buildText(); marqueeFit(); ScrollTrigger.refresh(); });

    /* the line with the eye draws in, everywhere it appears */
    document.querySelectorAll('.eye-line').forEach(function (l) {
      gsap.timeline({ scrollTrigger: { trigger: l, start: 'top 92%', end: 'top 45%', scrub: 0.6 } })
        .from(l, { scaleX: 0, transformOrigin: '50% 50%', ease: 'none' })
        .from(l.querySelector('.eye'), { scale: 0, rotation: -90, ease: 'back.out(1.6)' }, 0.4);
    });

    /* ---------- line-art scene: drawn by the scroll ---------- */
    (function () {
      var stage = document.querySelector('#scene .stage');
      var box = stage.querySelector('.art-box');
      var strokes = stage.querySelectorAll('svg.art :is(path,rect,circle,ellipse,polyline,line):not(.solid)');
      strokes.forEach(function (s) { s.setAttribute('pathLength', '1'); s.style.strokeDasharray = '1 1'; s.style.strokeDashoffset = '1'; });
      var dots = stage.querySelectorAll('svg.art .dot');
      gsap.set(dots, { scale: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' });
      var rot = { t1: -7, t2: 4, t3: -4, t4: 0 };
      function draw(sel) { return stage.querySelectorAll('svg.art ' + sel + ' :is(path,rect,circle,ellipse,polyline,line):not(.solid)'); }
      function pop(tl, cls, at) {
        var el = stage.querySelector('.' + cls);
        tl.fromTo(el, { scale: 0, rotation: rot[cls] - 30 }, { scale: 1, rotation: rot[cls], duration: 0.8, ease: 'back.out(1.7)' }, at);
      }
      var tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: '+=320%', scrub: 0.8, pin: true, anticipatePin: 1 } });
      tl.to(stage.querySelector('.d0'), { strokeDashoffset: 0, duration: 1.2, ease: 'none' }, 0)
        .to(draw('.g1'), { strokeDashoffset: 0, duration: 1.2, stagger: 0.12, ease: 'power1.inOut' }, 0.6)
        .to(stage.querySelectorAll('.g1 .dot'), { scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(3)' }, 1.6);
      pop(tl, 't1', 1.8);
      tl.to(draw('.g2'), { strokeDashoffset: 0, duration: 1.2, stagger: 0.1, ease: 'power1.inOut' }, 2.6)
        .to(stage.querySelectorAll('.g2 .dot'), { scale: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(3)' }, 3.5);
      pop(tl, 't2', 3.7);
      tl.to(draw('.g3'), { strokeDashoffset: 0, duration: 1.2, stagger: 0.1, ease: 'power1.inOut' }, 4.5);
      pop(tl, 't3', 5.6);
      tl.to(draw('.g4'), { strokeDashoffset: 0, duration: 0.8, stagger: 0.1, ease: 'power1.inOut' }, 6.4)
        .to(stage.querySelectorAll('.g4 .dot'), { scale: 1, duration: 0.4, ease: 'back.out(3)' }, 7);
      pop(tl, 't4', 7.1);
      tl.from(stage.querySelector('.scene-cap'), { opacity: 0, y: 20, duration: 0.6 }, 7.4)
        .to({}, { duration: 0.6 });
      /* on tall (phone) screens the "camera" pans from one drawing to the next */
      var mm = gsap.matchMedia();
      mm.add('(max-aspect-ratio: 1/1)', function () {
        var w = function () { return box.offsetWidth; };
        tl.fromTo(box, { x: function () { return w() * 0.29; } }, { x: 0, duration: 2.4, ease: 'power2.inOut' }, 1.9)
          .to(box, { x: function () { return -w() * 0.3; }, duration: 2.2, ease: 'power2.inOut' }, 4.1)
          .to(box, { x: 0, duration: 1.2, ease: 'power2.inOut' }, 6.2);
        return function () { gsap.set(box, { x: 0 }); };
      });
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

    /* ---------- cursor dot, magnetic pills, logo eyes (mouse only) ---------- */
    if (FINE) {
      html.classList.add('cur');
      var cur = document.getElementById('cur'), lab = cur.querySelector('span');
      var qx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
      var eyes = document.querySelectorAll('.logo-dots i');
      window.addEventListener('pointermove', function (e) {
        qx(e.clientX); qy(e.clientY);
        eyes.forEach(function (i) {
          var r = i.getBoundingClientRect(), a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
          gsap.to(i, { rotation: a, duration: 0.5, ease: 'power3' });
        });
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
        var d = s === 'label' ? 84 : s === 'link' ? 44 : 10;
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
