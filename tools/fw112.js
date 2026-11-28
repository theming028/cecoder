/* ============================================================
   第 112 轮：任务总结页「完工烟花」
   —— 走到最后一道工序、看到总结页时放一轮烟花，给开发者一点情绪价值。
   实现要点（这页是浅色底，跟深色背景的烟花完全不是一套画法）：
   1) **不能用 'lighter' 加色混合** —— 白底上加色等于全白，什么都看不见；
      改成 source-over：每粒 = 一张柔光斑（低透明）+ 一个高饱和实心核，白底上才立得住；
   2) 拖尾不用整屏 destination-out 拖影（上一轮首页吃过全尺寸合成的亏），
      直接按速度方向画一小段线条，零额外状态；
   3) 一发 = 双壳（外层快而细 / 内层慢而实）+ 爆心闪光 + 冲击波环 + 30% 闪烁，
      6 波共 ~16 发、末波「齐射」，约 5 秒放完就 cancelAnimationFrame，页面回到零开销；
   4) prefers-reduced-motion 只画一帧静态爆点。
   ============================================================ */
(function sumFireworks() {
  var cv = document.getElementById('sumFw');
  if (!cv || !cv.getContext) return;
  var host = document.getElementById('panelMain');
  if (!host) return;
  var ctx = cv.getContext('2d');
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0, raf = 0, last = 0, t0 = 0;
  var rmq = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* 金 / 蓝 / 紫 / 品红 / 青：都比底色重，白底上读得出来 */
  var C = ['255,176,38', '55,112,247', '91,88,255', '255,86,138', '18,181,229'];
  var SPR = C.map(function (rgb) {
    var soft = document.createElement('canvas');
    soft.width = soft.height = 48;
    var c1 = soft.getContext('2d');
    var g1 = c1.createRadialGradient(24, 24, 0, 24, 24, 24);
    g1.addColorStop(0, 'rgba(' + rgb + ',.55)');
    g1.addColorStop(.35, 'rgba(' + rgb + ',.26)');
    g1.addColorStop(1, 'rgba(' + rgb + ',0)');
    c1.fillStyle = g1;
    c1.beginPath(); c1.arc(24, 24, 24, 0, 6.2831853); c1.fill();
    var core = document.createElement('canvas');
    core.width = core.height = 16;
    var c2 = core.getContext('2d');
    var g2 = c2.createRadialGradient(8, 8, 0, 8, 8, 8);
    /* 核不要白心：白心叠在柔光斑上会把中间洗浅，一圈圈看着像泡泡 */
    g2.addColorStop(0, 'rgba(' + rgb + ',1)');
    g2.addColorStop(.5, 'rgba(' + rgb + ',.92)');
    g2.addColorStop(.78, 'rgba(' + rgb + ',.35)');
    g2.addColorStop(1, 'rgba(' + rgb + ',0)');
    c2.fillStyle = g2;
    c2.beginPath(); c2.arc(8, 8, 8, 0, 6.2831853); c2.fill();
    return { soft: soft, core: core };
  });

  var rockets = [], parts = [];
  /* k = 这一波几发；末波齐射（big） */
  var waves = [
    { at: 0, k: 2 }, { at: 360, k: 2 }, { at: 760, k: 3 },
    { at: 1180, k: 2 }, { at: 1600, k: 3 }, { at: 2120, k: 3, big: 1 }
  ];
  var nextWave = 0;

  var size = function () {
    var r = host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  };

  var launch = function (big) {
    var ci = Math.floor(Math.random() * C.length);
    var x = W * (.1 + Math.random() * .8);
    rockets.push({
      x: x, y: H * 1.04, sx: x, sy: H * 1.04,
      tx: x + (Math.random() - .5) * W * .14,
      ty: H * (.06 + Math.random() * (big ? .26 : .22)),
      t: 0, dur: .2 + Math.random() * .1, c: ci, big: big ? 1 : 0
    });
  };

  var burst = function (x, y, ci, big) {
    var n = big ? 68 : 56, base = (big ? 260 : 215) + Math.random() * 85, i, a, v, lf, outer;
    /* 爆心闪光 + 冲击波环 */
    parts.push({ x: x, y: y, vx: 0, vy: 0, life: .3, max: .3, s: big ? 230 : 160, c: ci, flash: 1 });
    parts.push({ x: x, y: y, vx: 0, vy: 0, life: .34, max: .34, s: big ? 190 : 140, c: ci, ring: 1 });
    for (i = 0; i < n; i++) {
      a = (i / n) * 6.2831853 + Math.random() * .16;
      outer = i % 3 !== 0;
      v = base * (outer ? .8 + Math.random() * .6 : .34 + Math.random() * .32);
      lf = (outer ? .95 : 1.15) + Math.random() * .95;
      parts.push({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: lf, max: lf,
        s: outer ? 3.4 + Math.random() * 4.2 : 4.6 + Math.random() * 4.8,
        c: Math.random() < .3 ? (ci + 1 + (Math.random() < .5 ? 0 : 1)) % C.length : ci,
        ph: Math.random() * 6.2831853,
        tw: Math.random() < .3 ? 1 : 0
      });
    }
    /* 约 1/3 概率补一发小的，让每轮长得不一样 */
    if (!big && Math.random() < .34) {
      var dx = x + (Math.random() - .5) * 170, dy = Math.max(H * .08, y - 46 - Math.random() * 80);
      setTimeout(function () { burst(dx, dy, (ci + 2) % C.length, 0); }, 240);
    }
  };

  var drawParticles = function (dt, ts) {
    var i, p, ratio, a, s, sp, tx, ty, cs;
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i];
      p.vy += 300 * dt;
      var dg = 1 - 1.4 * dt;
      p.vx *= dg; p.vy *= dg;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ratio = p.life / p.max;
      a = Math.pow(ratio, 1.05);
      sp = SPR[p.c];
      if (p.flash) {                                  /* 爆心：一闪 */
        ctx.globalAlpha = a * .85;
        ctx.drawImage(sp.soft, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
        ctx.globalAlpha = a * .9;
        ctx.drawImage(sp.core, p.x - 20, p.y - 20, 40, 40);
        continue;
      }
      if (p.ring) {                                   /* 冲击波：一圈迅速扩散的细环 */
        var rr = p.s * (1 - ratio) + 14;
        ctx.globalAlpha = a * .16;
        ctx.strokeStyle = 'rgba(' + C[p.c] + ',1)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 6.2831853); ctx.stroke();
        continue;
      }
      if (p.tw) a *= .55 + .45 * Math.sin(ts * 26 + p.ph);   /* 闪烁 */
      if (a < .08) continue;                                  /* 快烧完了：肉眼看不出，别再画 */
      /* 拖尾：只给跑得快的（慢的粒子画了也看不出来，白白多吃一次 stroke） */
      if (p.vx * p.vx + p.vy * p.vy > 3600) {
        tx = p.x - p.vx * .07; ty = p.y - p.vy * .07;
        ctx.globalAlpha = Math.max(0, a * .45);
        ctx.strokeStyle = 'rgba(' + C[p.c] + ',1)';
        ctx.lineWidth = Math.max(1, p.s * .17);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      /* 柔光斑只给内层的粗粒子，细火花不加（远看没差别，省一半 drawImage） */
      if (p.s >= 5) {
        s = p.s * 2.6;
        ctx.globalAlpha = Math.max(0, a * .26);
        ctx.drawImage(sp.soft, p.x - s / 2, p.y - s / 2, s, s);
      }
      cs = p.s * (.7 + .2 * ratio);
      ctx.globalAlpha = Math.min(1, Math.max(0, a * 1.1));
      ctx.drawImage(sp.core, p.x - cs, p.y - cs, cs * 2, cs * 2);
    }
    ctx.globalAlpha = 1;
  };

  var frame = function (now) {
    var dt = Math.min(.05, (now - last) / 1000) || .016;
    last = now;
    while (nextWave < waves.length && (now - t0) >= waves[nextWave].at) {
      var w = waves[nextWave];
      for (var q = 0; q < w.k; q++) launch(w.big);
      nextWave++;
    }
    ctx.clearRect(0, 0, W, H);
    for (var i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i];
      r.t += dt;
      if (r.t >= r.dur) { burst(r.tx, r.ty, r.c, r.big); rockets.splice(i, 1); }
    }
    drawParticles(dt, (now - t0) / 1000);

    if (rockets.length || parts.length || nextWave < waves.length || (now - t0) < 6200) raf = requestAnimationFrame(frame);
    else { raf = 0; ctx.clearRect(0, 0, W, H); }
  };

  var start = function () {
    if (raf || rmq.matches) return;
    if (!W && !size()) return;
    t0 = performance.now();
    last = t0;
    raf = requestAnimationFrame(frame);
  };

  var stillFrame = function () {
    if (!W && !size()) return;
    ctx.clearRect(0, 0, W, H);
    var spots = [[.26, .2, 1], [.48, .1, 0], [.68, .26, 3], [.84, .14, 2], [.38, .34, 4]];
    for (var i = 0; i < spots.length; i++) {
      var x = W * spots[i][0], y = H * spots[i][1], sp = SPR[spots[i][2]];
      ctx.globalAlpha = .5;
      ctx.drawImage(sp.soft, x - 76, y - 76, 152, 152);
      for (var j = 0; j < 52; j++) {
        var ang = (j / 52) * 6.2831853, rad = 54 + (j % 9) * 11;
        var s = 5 + (j % 5) * 2;
        ctx.globalAlpha = .5 + (j % 3) * .14;
        ctx.drawImage(sp.core, x + Math.cos(ang) * rad - s, y + Math.sin(ang) * rad - s, s * 2, s * 2);
      }
    }
    ctx.globalAlpha = 1;
  };

  var boot = function (n) {
    if (size()) { if (rmq.matches) stillFrame(); else start(); return; }
    if (n < 120) requestAnimationFrame(function () { boot(n + 1); });
  };
  boot(0);

  if (window.ResizeObserver) new ResizeObserver(function () { if (size() && rmq.matches) stillFrame(); }).observe(host);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    else if (!rmq.matches && !raf && (rockets.length || parts.length)) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
})();
