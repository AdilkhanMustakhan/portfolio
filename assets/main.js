/* Adilkhan Mustakhan — portfolio v3: content logic (language, theme, globe, menu, accordions).
   Motion lives in motion.js; everything here works without it. */
var $=function(i){return document.getElementById(i)};
var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
var FINE=matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ---------- language ---------- */
function setLang(l){
  document.documentElement.lang=l;
  document.querySelectorAll("[data-en]").forEach(function(e){e.innerHTML=e.getAttribute("data-"+l)});
  document.querySelectorAll(".lang button").forEach(function(b){b.classList.toggle("on",b.dataset.l===l)});
  try{localStorage.setItem("lang",l)}catch(_){}
  window.dispatchEvent(new CustomEvent('langchange',{detail:l}));
}
document.querySelectorAll(".lang button").forEach(function(b){b.onclick=function(){setLang(b.dataset.l)}});
(function(){var s="en";try{s=localStorage.getItem("lang")||((navigator.language||"").slice(0,2)==="ru"?"ru":"en")}catch(_){}setLang(s)})();

/* ---------- giant word fits the width ---------- */
function fit(){var g=$('giant');if(!g)return;var w=g.parentNode.clientWidth;g.style.fontSize='100px';var k=w/g.getBoundingClientRect().width*100*.995;g.style.fontSize=k+'px'}
(function(){var g=$('giant'),t=g.textContent;g.setAttribute('aria-label',t);g.innerHTML=t.split('').map(function(c){return '<span aria-hidden="true">'+c+'</span>'}).join('');fit()})();
window.addEventListener('resize',fit);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){fit();window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('fontsready'))});

/* ---------- smooth-scroll helper (motion.js replaces it with Lenis) ---------- */
/* A section link stops with the section's label pill just under the header pills, every time.
   offsetTop is used (not getBoundingClientRect) so a label still mid-animation doesn't shift the stop. */
/* page position of an element in normal flow; a section that is pinned right now is measured by its placeholder */
window.absTop=function(el){var y=0,n=el;while(n){if(n.style&&n.style.position==='fixed'&&n.parentNode&&n.parentNode.classList&&n.parentNode.classList.contains('pin-spacer'))n=n.parentNode;y+=n.offsetTop;n=n.offsetParent}return y};
window.anchorY=function(target){
  if(target===0||target==null)return 0;
  var el=typeof target==='string'?document.querySelector(target):target;if(!el)return 0;
  var a=el.querySelector('.kicker')||el,y=window.absTop(a);
  var hb=document.querySelector('header .r').getBoundingClientRect().bottom;
  var max=(document.scrollingElement||document.documentElement).scrollHeight-innerHeight;
  return Math.max(0,Math.min(max,Math.round(y-hb-14)));
};
window.goTo=function(target){window.scrollTo({top:window.anchorY(target),behavior:RM?'auto':'smooth'})};
document.addEventListener('click',function(e){var a=e.target.closest('a[href^="#"]');if(!a)return;var h=a.getAttribute('href');
  e.preventDefault();closeMenu();window.goTo(h==='#'||h==='#top'?0:h);history.replaceState(null,'',h==='#top'?location.pathname:h)});

/* ---------- fullscreen menu ---------- */
var mbtn=$('mbtn'),menu=$('menu');
function closeMenu(){if(!document.body.classList.contains('menu'))return;document.body.classList.remove('menu');mbtn.setAttribute('aria-expanded','false');menu.setAttribute('aria-hidden','true');window.dispatchEvent(new Event('menutoggle'))}
mbtn.addEventListener('click',function(){var o=document.body.classList.toggle('menu');mbtn.setAttribute('aria-expanded',o);menu.setAttribute('aria-hidden',!o);window.dispatchEvent(new Event('menutoggle'));if(o){var f=menu.querySelector('a');f&&setTimeout(function(){f.focus({preventScroll:true})},300)}});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});

/* ---------- theme ---------- */
(function(){
  var b=$('thm'),r=document.documentElement;
  b.addEventListener('click',function(){
    var t=r.getAttribute('data-theme')==='light'?'dark':'light';
    r.classList.add('tt');r.setAttribute('data-theme',t);try{localStorage.setItem('theme',t)}catch(e){}
    document.querySelector('meta[name=theme-color]').setAttribute('content',t==='light'?'#f2efe8':'#0c0b0b');
    window.dispatchEvent(new Event('themechange'));setTimeout(function(){r.classList.remove('tt')},400);
  });
})();

/* ---------- résumé pill in header: hidden while the hero's own button is on screen ---------- */
(function(){var rb=$('rbtn'),hero=document.querySelector('.hero');
  function sc(){rb.classList.toggle('hide',window.scrollY<hero.offsetHeight*0.55)}
  window.addEventListener('scroll',sc,{passive:true});sc()})();

/* ---------- stats count up ---------- */
document.querySelectorAll('.stats b').forEach(function(b){
  var raw=b.textContent,m=raw.match(/^([\d.,]+(?:\s\d{3})*)(.*)$/);if(!m)return;
  var num=parseFloat(m[1].replace(/\s/g,'').replace(',','.')),dec=(m[1].split('.')[1]||'').length,suf=m[2],sp=m[1].indexOf(' ')>-1;
  if(isNaN(num)||RM||!('IntersectionObserver' in window))return;
  var done=false;
  new IntersectionObserver(function(es,o){if(es[0].isIntersecting&&!done){done=true;o.disconnect();
    var t0=performance.now();(function f(t){var p=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-p,3),v=num*e;
      var str=dec?v.toFixed(dec):Math.round(v).toString();if(sp)str=str.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
      b.textContent=str+suf;if(p<1)requestAnimationFrame(f)})(t0)}},{threshold:.5}).observe(b);
});

/* ---------- project rows: image preview follows the cursor ---------- */
(function(){
  if(!FINE||RM)return;
  var hp=$('hp'),im=hp.querySelector('img');
  var map=['','tracker_01','cases_02','set1_02_dashboard','set2_01_comparison','cases_05','cases_04','flyer','design_02','unicef_01','demoday_en_1'];
  var x=0,y=0,tx=0,ty=0,raf=0;
  function loop(){x+=(tx-x)*.14;y+=(ty-y)*.14;hp.style.transform='translate3d('+x+'px,'+y+'px,0) rotate('+((tx-x)*.03).toFixed(2)+'deg)';raf=requestAnimationFrame(loop)}
  document.querySelectorAll('details.case').forEach(function(d,i){
    var sm=d.querySelector('summary');if(!sm||!map[i])return;
    sm.addEventListener('mouseenter',function(e){if(d.open)return;im.src='img/'+map[i]+'.jpg';tx=x=e.clientX+28;ty=y=e.clientY-95;hp.classList.add('on');if(!raf)raf=requestAnimationFrame(loop)});
    sm.addEventListener('mousemove',function(e){tx=e.clientX+28;ty=e.clientY-95});
    function off(){hp.classList.remove('on')}
    sm.addEventListener('mouseleave',off);sm.addEventListener('click',off);
  });
  window.addEventListener('scroll',function(){hp.classList.remove('on')},{passive:true});
})();

/* ---------- accordions: smooth open/close ---------- */
document.querySelectorAll('details.case,details.more').forEach(function(d){
  var sm=d.querySelector(':scope>summary'),busy=null;if(!sm)return;
  sm.addEventListener('click',function(e){
    if(RM||!d.animate)return;e.preventDefault();
    if(busy)busy.cancel();
    var start=d.offsetHeight,opening=!d.open||d.classList.contains('closing'),end;
    d.style.overflow='hidden';
    if(opening){d.classList.remove('closing');d.open=true;end=d.scrollHeight}
    else{d.classList.add('closing');end=sm.offsetHeight}
    busy=d.animate({height:[start+'px',end+'px']},{duration:600,easing:'cubic-bezier(.2,.8,.2,1)'});
    busy.onfinish=function(){busy=null;d.style.overflow='';if(!opening){d.open=false;d.classList.remove('closing')}window.dispatchEvent(new Event('layoutchange'))};
    busy.oncancel=function(){d.style.overflow=''};
    if(opening)window.dispatchEvent(new CustomEvent('caseopen',{detail:d}));
  });
});

/* ---------- active section in the menu ---------- */
(function(){
  var links=[].slice.call(document.querySelectorAll('nav.mnav a[href^="#"]'));
  var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'))}),tick=0;
  function u(){tick=0;var y=innerHeight*.35,cur=-1;
    secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<=y)cur=i});
    links.forEach(function(a,i){a.classList.toggle('on',i===cur)})}
  document.addEventListener('scroll',function(){if(!tick){tick=1;requestAnimationFrame(u)}},{passive:true,capture:true});u();
})();

/* ---------- scroll progress + back to top ---------- */
(function(){
  var bar=$('prog'),b=$('totop'),pr=b.querySelector('.pr'),L=2*Math.PI*22,tick=0;
  function u(){tick=0;var h=document.scrollingElement||document.documentElement,m=h.scrollHeight-h.clientHeight,y=window.scrollY||h.scrollTop,p=m>0?Math.min(1,y/m):0;
    bar.style.transform='scaleX('+p+')';pr.style.strokeDashoffset=(L*(1-p)).toFixed(1);b.classList.toggle('on',y>innerHeight*.6)}
  document.addEventListener('scroll',function(){if(!tick){tick=1;requestAnimationFrame(u)}},{passive:true,capture:true});window.addEventListener('resize',u);u();
  b.addEventListener('click',function(){window.goTo(0);b.blur()});
})();

/* ===== [fx-1] route globe: dotted continents + great-circle arcs from Kokshetau ===== */
(function(){
  var cv=document.getElementById('globe');if(!cv||!cv.getContext)return;
  var ctx=cv.getContext('2d'),RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var M='AAAAAAAAAACEBCQhAWEJGQpISFZCEhAXkIQEhGAkAwEomQDIwA4AEDMDkZgMAOJmRyAZmJHcxOYk4zFpidrM2eL+t3bWvLed/f/p5X9/u2te38r2/vb2vbed/+7tbX//e3vd2s7//nbyv7+Vvbzt5X9vK3v92sre/lZ2u7WVvf7k5Wd/K1t52MrO/lKys7OUndzmZWd3LTkZzMtObnPyM5uenIznZSczOXkJzM9O7nPyE5menYznZqczObkJzc5OZnPzE5ue3Kzm56c3ObnJzc5uanPz05uc3NTm5zc1ObnJzc5OenPzk5ucnNTm5zc1OTnpzc5OenJz25qcnPTmpzc1ObnpzU5OanNzk5qcnPTmpyc1GbnJzU5OanNzk5qcnNRmpyc9GbnIzU5uajMzk56MnMRmpyc1GRnpzEZOajNT05yMjNRmJyc1GTmpzEZGajMT05ycnNTmJycxORmozE5OanMTkZyYjNTmJiMxOQmozExOanMTk5iYhNTmJiM1OQnIzk5GanMTEZichMRmJiMxOSnJz0ZCajNTEZyMhORmpiM5GamIz05CYjNTEZ6MhMRmoiE9GSmIzUZCYjNTEJqMlMRmoyE9GSmITUZKajNTkJqMlMTmoyU9GSmITUZKalNTkpqclMQmpyU1KSmJSU5KYlNTkpqclMSkpyUlOanJRU5KYlJRkpKUlMSgpyUlOSnJSU5KYlBTkpKc1MSkpyUlKSnJSU5KYlBTkpKUFESkpSU1KCnJSUoKYlJTkpKUFMCkpwU1KSnBSUpKMlJSgpKUlMCkpSUVKSlBSUpKYFJSgpqUlMCkpTUUKSlBSUpKYFJSmgqUlMCkpCQ0KakFSUpKYFJSkgoU1IKkpCQwKSkBBQpKQFJSEhoU1ICmpCQwqSkBBQpKQFJSEhhU1IKChSQgKakBDwpKQEFSEhAU1ICGhSQgKakBCgpqSEFCghAU1ICEhSQgKClBCApqQEJCihAQlICEhTQgICFFCApqQEJCihAQlKCEBRQgISFFCAhKQEJCghAQkKCEBQUgIWFFCAgKUELCAhAQkKKEFAUgISEJCAhIUEIKEhAQsqKEFAUgIQUJCAhJUUKKkpAQgoCEFCSgIQUJSAhJUEKKEpBQgoSEFCSgoQVJCChRQEIKElBQgoSkFCygIQUJKAhBQEIKElAQgqSkBCigIUUJKABBUEIKEFAAgoSUBCCgJUUJKABBUAoKEFAAooSUACCoBUUIKABBQgoAEFACooQUACCoBUQIKAFBUgoAEFQCooQUACCgBUQIKAFRQgoAEFACooQUAKCoBUQIKgFRQAqAFFQCogQUAKCgBUQIKgFRQIoAUFQiogQUAKigBUQoKgFRQgoAUFQiohQVCKigBQAqKBFRAgoEUFACohQVAKiEBQIqKAFRCgqEUFICgRUUCKCEBQIoKQFBigqEUEICgRQcAKDEBUIoKQFBigrEUEICgRQUgKDERQAoIQFAigpAUGICoBQUgKjFBQAoIQFQigpAVGICgBQQgKBFBSAqMQFACopAUAKCgBUYgOAFBSAoIQFACghAUAKCgBQQgKAFBSAoAUFACghAUAKCgBQQgKAFBCAoAUFACghAcAKCgRQAoKAFBCAoEUFCighAUAKCkRQAoKAFBCAoAUFCigBAUAKCkRQIoKFFBCIoAUFAigRQUAKCERQIoKFFACIoAUFCigRQUCKAERQAoKFFAiIoEUBKigRQUCKAERQAoKFFAiIoEUAIigRQUKKBERQIoCFFAiIoEUAIigRQUKKBERQIoAVFAiIoEUCIigRUEKKBERQIoERFAiIoUUCIigRUAKKBERQIqERFAioIUUCIigRUIKKBERQIqEBFAioAUUCIigRUICKBFRQIoEBFAioQUUCIigRUICKBEQgooEBFAioQEUCIigRQICKBEQgIoEBFAioQEUCIjARQICKBFQgIoEBFAigQEUCIhARQICKBFQgIoERGAigQEUCIhARQICKBFAgIoERGAigQEUCIhARQICIBFAgIoEBGAigQEUCIBARQICIAFAgIoERCACgQEQCIBABQICMAFAgIoERCACgQAQAIBABQACMAEAgAgAQCACAQAQAIBABAAAEAEAhAgAACACAAAQAIBABAAAEAEAgAgAQCACAAAQAIBCBAAAEAEAAAgAAAECAAAAAAAABAAAAAEAAAgAAAECAAAAAAACBAAAEAEAAAgAAAACAAAIAAACBAAAAAEAAAgAAAECAAAAAAACBAAAAAEAAAAAAAACAAAAAAACAAAAAAEAAAAAAAACAAAAAAACBAAAAAEAAAAAAAACAAAAAIAAAAAAAAEAAAAAAAACAAAAAIAAAAAAAAEAAAAAAAAAAAAAAIAAAAAAAAEAAAAAAAAAAAAAAIAAAAAAAAAAAAAAQAAAAAAAAIAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',bin=atob(M),N=16000,pts=[],i,D=Math.PI/180;
  for(i=0;i<N;i++){if(!(bin.charCodeAt(i>>3)&(128>>(i&7))))continue;var y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),th=i*2.399963;pts.push([Math.cos(th)*r,y,Math.sin(th)*r])}
  function v(lat,lon){lat*=D;lon*=D;return[Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)]}
  var home={p:v(53.28,69.39),en:'Kokshetau',ru:'Кокшетау'};
  var dest=[{p:v(41.01,28.98),en:'Istanbul',ru:'Стамбул'},{p:v(-1.29,36.82),en:'Kenya',ru:'Кения'},{p:v(48.86,2.35),en:'France',ru:'Франция'},{p:v(37.85,-77.46),en:'Virginia',ru:'Вирджиния'}];
  function slerp(a,b,t){var d=Math.acos(Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]))),s=Math.sin(d),k1=Math.sin((1-t)*d)/s,k2=Math.sin(t*d)/s;return[a[0]*k1+b[0]*k2,a[1]*k1+b[1]*k2,a[2]*k1+b[2]*k2,d]}
  dest.forEach(function(o){var A=[],j,S=72;for(j=0;j<=S;j++){var q=slerp(home.p,o.p,j/S),h=1+.16*(q[3]/Math.PI)*Math.sin(Math.PI*j/S);A.push([q[0]*h,q[1]*h,q[2]*h])}o.arc=A});
  var WW=0,yaw=-38*D,pitch=.6,tyaw=yaw,tp=pitch,mx=0,my=0,W=0,dpr=1,vis=true,raf=0,t0=performance.now(),drag=null,vel=0;
  var ink,mute,line,bg;function cols(){var css=getComputedStyle(document.documentElement);ink=css.getPropertyValue('--ink').trim()||'#111';mute=css.getPropertyValue('--mute').trim()||'#777';line=css.getPropertyValue('--line').trim()||'#e4e4e4';bg=css.getPropertyValue('--bg').trim()||'#fff'}cols();window.addEventListener('themechange',function(){cols();if(typeof draw==='function')try{draw(performance.now())}catch(e){}});
  var meta=document.querySelector('.h-meta'),hin=cv.parentNode;
  var htop=document.querySelector('.h-top');
  /* the globe takes only the free band between the name line and the role pills, with air above and below */
  function size(){dpr=Math.min(window.devicePixelRatio||1,2);
    var mob=innerWidth<=760,gap=mob?18:28,
      /* desktop: the globe sits on the right, beside the name line, from under the header down to the role pills */
      top=mob?htop.offsetTop+htop.offsetHeight+gap:Math.max(16,htop.offsetTop-12),avail=meta.offsetTop-top-gap;
    var w=Math.floor(Math.min(avail,mob?innerWidth*.86:Math.min(innerWidth*.4,560)));
    var ww=Math.min(Math.round(w*1.4),mob?innerWidth:innerWidth*.58);cv.style.display=w<170?'none':'';cv.style.top=top+'px';cv.style.width=ww+'px';cv.style.height=w+'px';W=Math.max(w,1);WW=ww;cv.width=Math.round(ww*dpr);cv.height=Math.round(W*dpr)}
  function rot(p){var cy=Math.cos(yaw),sy=Math.sin(yaw),x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy,cp=Math.cos(pitch),sp=Math.sin(pitch),y=p[1]*cp-z*sp;z=p[1]*sp+z*cp;return[x,y,z]}
  function ease(x){x=Math.min(1,Math.max(0,x));return 1-Math.pow(1-x,3)}
  function draw(now){
    var S=W*dpr,cx=WW*dpr/2,c=S/2,R=S*.41,fs=Math.max(9,Math.min(11,W/40)),j,k,q,lang=document.documentElement.lang==='ru'?'ru':'en';
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.globalAlpha=1;ctx.strokeStyle=line;ctx.lineWidth=dpr;ctx.beginPath();ctx.arc(cx,c,R,0,7);ctx.stroke();
    ctx.fillStyle=ink;
    for(j=0;j<pts.length;j++){q=rot(pts[j]);if(q[2]<-.05)continue;var z=Math.max(0,q[2]),s2=dpr*(.7+.9*z);ctx.globalAlpha=.12+.62*z;ctx.fillRect(cx+q[0]*R-s2/2,c-q[1]*R-s2/2,s2,s2)}
    var pr=RM?1:(now-t0-400)/1800;
    ctx.lineWidth=dpr*1.2;ctx.strokeStyle=ink;ctx.lineCap='round';
    ctx.font=(fs*dpr)+'px "Helvetica Neue",Helvetica,Arial,sans-serif';ctx.textBaseline='middle';
    for(k=0;k<dest.length;k++){var o=dest[k],A=o.arc,f=ease(pr-k*.12),n=Math.floor((A.length-1)*f);
      for(j=1;j<=n;j++){var a0=rot(A[j-1]),a1=rot(A[j]),zz=(a0[2]+a1[2])/2;if(zz<-.15)continue;ctx.globalAlpha=zz>0?.9:.18;ctx.beginPath();ctx.moveTo(cx+a0[0]*R,c-a0[1]*R);ctx.lineTo(cx+a1[0]*R,c-a1[1]*R);ctx.stroke()}
      if(f>=1){var e=rot(o.p);if(e[2]>-.05){var ex=cx+e[0]*R,ey=c-e[1]*R,al=Math.min(1,(e[2]+.05)*4);ctx.globalAlpha=al;ctx.fillStyle=ink;ctx.beginPath();ctx.arc(ex,ey,dpr*2.6,0,7);ctx.fill();
        ctx.globalAlpha=al;var lx=e[0]<0?ex-8*dpr:ex+8*dpr;ctx.textAlign=e[0]<0?'right':'left';ctx.lineWidth=4*dpr;ctx.strokeStyle=bg;ctx.lineJoin='round';ctx.strokeText(o[lang],lx,ey);ctx.fillStyle=mute;ctx.fillText(o[lang],lx,ey);ctx.lineWidth=dpr*1.2;ctx.strokeStyle=ink}}}
    var h=rot(home.p);if(h[2]>-.05){var hx=cx+h[0]*R,hy=c-h[1]*R,ha=Math.min(1,(h[2]+.05)*4);ctx.globalAlpha=ha;ctx.fillStyle=ink;ctx.beginPath();ctx.arc(hx,hy,dpr*3.6,0,7);ctx.fill();
      ctx.globalAlpha=ha*.35;ctx.strokeStyle=ink;ctx.lineWidth=dpr;ctx.beginPath();ctx.arc(hx,hy,dpr*8,0,7);ctx.stroke();
      ctx.globalAlpha=ha;ctx.textAlign='left';ctx.font='600 '+(fs*dpr)+'px "Helvetica Neue",Helvetica,Arial,sans-serif';ctx.lineWidth=4*dpr;ctx.strokeStyle=bg;ctx.lineJoin='round';ctx.strokeText(home[lang],hx+12*dpr,hy-1*dpr);ctx.fillStyle=ink;ctx.fillText(home[lang],hx+12*dpr,hy-1*dpr)}
    ctx.globalAlpha=1;
  }
  function loop(now){
    if(!drag){tyaw+=.0009+vel;vel*=.95}
    yaw+=(tyaw+mx*.3-yaw)*.07;pitch+=(tp+my*.18-pitch)*.07;
    draw(now);raf=vis?requestAnimationFrame(loop):0;
  }
  function start(){if(!raf&&!RM&&vis)raf=requestAnimationFrame(loop)}
  size();draw(performance.now());
  requestAnimationFrame(function(){cv.classList.add('on')});
  window.addEventListener('resize',function(){size();draw(performance.now())});
  document.querySelectorAll('.lang button').forEach(function(b){b.addEventListener('click',function(){setTimeout(function(){draw(performance.now())},0)})});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting&&!document.hidden;start()}).observe(cv);
  document.addEventListener('visibilitychange',function(){vis=!document.hidden;start()});
  var hero=document.querySelector('.hero');
  if(!RM&&matchMedia('(hover:hover) and (pointer:fine)').matches)hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});
  cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:tyaw,p:tp};vel=0;cv.classList.add('drag');try{cv.setPointerCapture(e.pointerId)}catch(_){}});
  cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=(e.clientX-drag.x)/W,dy=(e.clientY-drag.y)/W;vel=Math.max(-.01,Math.min(.01,dx*.02));tyaw=drag.yaw+dx*3;tp=Math.max(-.2,Math.min(1.2,drag.p+dy*2));if(RM){yaw=tyaw;pitch=tp;draw(1e9)}});
  function up(){if(drag){drag=null;cv.classList.remove('drag')}}
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  start();
})();

