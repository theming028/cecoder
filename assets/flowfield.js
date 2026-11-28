/* ============================================================
   第 117 轮：首页背景 = 参考站（www.deepseek.com）原版实现
   —— 线上 bundle 里的 WebGL2 片元着色器「pattern」：checks 图案 → 噪声域扭曲
      → 8 段漩涡 → 三段颜色 mixer（#8AA3D6 / #FFF / #FFF）。
      参数原封不动取他们首页 hero 传进去的那一组：
      speed 14 / distortion 20 / swirl 12 / swirlIterations 8 / scale .5 /
      rotation -5 / proportion 50 / softness 100 / shape checks / shapeScale 10 /
      offset (0, 65) / grain 0。
   时间驱动也照抄：pattern 用 3 条不同周期的正弦（420s / 460s / 90s）累加相位，
      loop1、loop2 给图案加漂移，loop3 是漩涡的 (sin, cos) 相位。
   尺寸 maxDpr 1.5 × RENDER 0.7；帧率 30fps（原版 1e3/30 节流）；IntersectionObserver +
   visibilitychange 暂停；prefers-reduced-motion 只画一帧（preserveDrawingBuffer）。
   第 118 轮做了一轮纯成本优化（构图不变）：绘制缓冲 0.7 倍、常量 uniform 只设一次、
   时间/尺寸 uniform 只在 resize 时刷、powerPreference 不再强制 low-power。
   第二层是他们的静态网格 canvas（spacing 90 / 线 10% / 点 4%），
   两层挂同一条 mask：顶部不透明、到底部淡出。
   ============================================================ */
(function dsFlowField() {
  'use strict';
  var canvas = document.getElementById('pmMist');
  if (!canvas || !canvas.getContext) return;
  if ((document.body.getAttribute('data-page') || 'home') !== 'home') return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = canvas.getContext('webgl2', {
    alpha: true, premultipliedAlpha: false,
    powerPreference: 'default', preserveDrawingBuffer: !!reduced
  });
  if (!gl) { canvas.style.display = 'none'; return; }

  /* ------- 着色器（逐字搬运，未改一行） ------- */
  var VERT = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

  var FRAG = `#version 300 es
precision mediump float;

uniform vec2 u_loop1, u_loop2, u_loop3, u_loop4;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform vec4 u_color4;
uniform vec4 u_color5;
uniform vec4 u_color6;
uniform float u_colorCount;
uniform float u_grain;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;
uniform vec2 u_offset;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec3 blend_multi(float mixer, float softness) {
  float edge = 1.0 - softness;
  vec3 col = u_color1.rgb;
  if (u_colorCount > 1.5) {
    float r1 = smoothstep(0.0 + 0.35 * edge, 0.7 - 0.35 * edge, mixer);
    col = mix(col, u_color2.rgb, r1);
  }
  if (u_colorCount > 2.5) {
    float r2 = smoothstep(0.3 + 0.35 * edge, 1.0 - 0.35 * edge, mixer);
    col = mix(col, u_color3.rgb, r2);
  }
  if (u_colorCount > 3.5) {
    col = mix(col, u_color4.rgb, smoothstep(0.4, 0.75, mixer));
  }
  if (u_colorCount > 4.5) {
    col = mix(col, u_color5.rgb, smoothstep(0.55, 0.85, mixer));
  }
  if (u_colorCount > 5.5) {
    col = mix(col, u_color6.rgb, smoothstep(0.7, 0.95, mixer));
  }
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  float noise_scale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;
  uv += u_offset;

  float n1 = noise(uv + u_loop1);
  float n2 = noise(uv * 2. - u_loop2);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= 30.0; i++) {
    if (i > iterations_number) break;
    uv.x += clamp(u_swirl, 0., 2.) / i * (u_loop3.y * cos(i * 1.5 * uv.y) - u_loop3.x * sin(i * 1.5 * uv.y));
    uv.y += clamp(u_swirl, 0., 2.) / i * (u_loop3.y * cos(i * uv.x) - u_loop3.x * sin(i * uv.x));
  }

  float proportion = clamp(u_proportion, 0., 1.);

  float shape = 0.;
  float mixer = 0.;
  if (u_shape < .5) {
    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  vec3 col = blend_multi(mixer, clamp(u_softness, 0., 1.));
  fragColor = vec4(col, 1.0);

  if (u_grain > 0.0) {
    float g = random(gl_FragCoord.xy + u_loop3 * 100.0);
    fragColor.rgb += (g - 0.5) * u_grain;
  }
}`;

  var compile = function (type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
    if (window.console) console.error('bg shader:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  };
  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  /* ------- 首页传的那组参数 ------- */
  var OPT = {
    type: 'pattern',
    colors: ['#8AA3D6', '#FFFFFF', '#FFFFFF'],
    grain: 0, speed: 14, shape: 'checks', shapeScale: 10,
    rotation: -5, proportion: 50, softness: 100,
    distortion: 20, swirl: 12, swirlIterations: 8,
    scale: 0.5, offsetX: 0, offsetY: 65
  };
  var SHAPES = { checks: 0, stripes: 1, gradient: 2 };
  var hex2rgb = function (h) {
    var t = h.replace('#', '');
    return [parseInt(t.slice(0, 2), 16) / 255, parseInt(t.slice(2, 4), 16) / 255, parseInt(t.slice(4, 6), 16) / 255];
  };
  /* 第 118 轮：色值只算一次（原来每帧 map 出 6 组数组再逐个 uniform4f） */
  var COLORS = [0, 1, 2, 3, 4, 5].map(function (i) {
    return i < OPT.colors.length ? hex2rgb(OPT.colors[i]) : [0, 0, 0];
  });

  /* ------- 时间 uniform：原版 makeClock 的 pattern 分支 ------- */
  var TAU = Math.PI * 2;
  var PATTERN_PERIODS = [420, 460, 90];
  var clock = (function () {
    var list = PATTERN_PERIODS.map(function (period, i) {
      return {
        period: period,
        uniform: gl.getUniformLocation(prog, 'u_loop' + (i + 1)),
        elapsed: 0,
        radius: 0.07 * period / TAU
      };
    });
    return function (dt) {
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        it.elapsed = ((it.elapsed + dt) % it.period + it.period) % it.period;
        var ang = it.elapsed / it.period * TAU;
        var s = Math.sin(ang), c = Math.cos(ang);
        if (i === 2) gl.uniform2f(it.uniform, s, c);
        else gl.uniform2f(it.uniform, it.radius * (s + c - 1), it.radius * (s + 1 - c));
      }
    };
  })();

  var U = {};
  ['u_pixelRatio', 'u_resolution', 'u_scale', 'u_offset', 'u_rotation', 'u_color1', 'u_color2',
   'u_color3', 'u_color4', 'u_color5', 'u_color6', 'u_colorCount', 'u_grain', 'u_proportion',
   'u_softness', 'u_shape', 'u_shapeScale', 'u_distortion', 'u_swirl', 'u_swirlIterations'
  ].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

  /* ------- 第 118 轮：性能改造（观感不变，只砍成本） -------
     ① 常量 uniform 挪到初始化时设一次 —— 原来每帧刷 20 个 uniform、还每帧新建 6 组
        色值数组，这些值从头到尾没变过；
     ② 绘制缓冲按 CSS 尺寸 × RENDER(0.7) 给：片元着色器是这层唯一的成本大头，
        片元数直接砍到 49%。着色器里 uv 是「CSS 像素坐标」量纲
        （uv *= u_resolution 之后又 /= u_pixelRatio），所以把 u_pixelRatio 一起折算，
        构图、纹理尺度与全分辨率逐像素一致，只是被双线性放大；
        这个 pattern 的特征尺度在 100px 以上（noise 波长 ≈ 285px、checks 更粗），
        0.7 倍放大肉眼看不出来；
     ③ 与尺寸相关的两个 uniform（resolution / pixelRatio）挪进 fit()，只在尺寸变时刷；
     ④ powerPreference 从 low-power 改 default —— low-power 会主动请求集显，
        这个着色器在集显上就是顿的，交给浏览器按机器选。 */
  var RENDER = 0.7;
  var setStaticUniforms = function () {
    var c = COLORS;
    gl.uniform1f(U.u_scale, OPT.scale);
    gl.uniform2f(U.u_offset, (OPT.offsetX || 0) / 100, (OPT.offsetY || 0) / 100);
    gl.uniform1f(U.u_rotation, OPT.rotation / 90);
    gl.uniform4f(U.u_color1, c[0][0], c[0][1], c[0][2], 1);
    gl.uniform4f(U.u_color2, c[1][0], c[1][1], c[1][2], 1);
    gl.uniform4f(U.u_color3, c[2][0], c[2][1], c[2][2], 1);
    gl.uniform4f(U.u_color4, c[3][0], c[3][1], c[3][2], 1);
    gl.uniform4f(U.u_color5, c[4][0], c[4][1], c[4][2], 1);
    gl.uniform4f(U.u_color6, c[5][0], c[5][1], c[5][2], 1);
    gl.uniform1f(U.u_colorCount, OPT.colors.length);
    gl.uniform1f(U.u_grain, OPT.grain);
    gl.uniform1f(U.u_proportion, OPT.proportion / 100);
    gl.uniform1f(U.u_softness, OPT.softness / 100);
    gl.uniform1f(U.u_shape, SHAPES[OPT.shape]);
    gl.uniform1f(U.u_shapeScale, OPT.shapeScale / 100);
    gl.uniform1f(U.u_distortion, OPT.distortion / 100);
    gl.uniform1f(U.u_swirl, OPT.swirl / 50);
    gl.uniform1f(U.u_swirlIterations, OPT.swirlIterations);
  };
  setStaticUniforms();

  /* 每帧只做两件事：推进时间、画一个全屏四边形 */
  var draw = function (dtMs) {
    clock(0.001 * dtMs * (OPT.speed / 14));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  var fit = function () {
    var r = canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var css = Math.min(window.devicePixelRatio || 1, 1.5);
    var d = css * RENDER;                 /* 一个 CSS 像素落多少片元 */
    var pw = Math.max(2, Math.round(r.width * d));
    var ph = Math.max(2, Math.round(r.height * d));
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    gl.viewport(0, 0, pw, ph);
    gl.uniform2f(U.u_resolution, pw, ph);
    /* 着色器里 uv = (fragCoord - res/2) * noise_scale / u_pixelRatio，
       要让它等于「CSS 像素坐标 × noise_scale」，u_pixelRatio 就得取「缓冲 / CSS」的比值
       （原版 dpr 下正好等于 devicePixelRatio，dpr 因子里外抵消，所以图案不随 dpr 变尺度）。
       现在缓冲是 CSS × 0.7，这里传 0.35/0.7/1.0…，构图与全分辨率逐像素一致。 */
    gl.uniform1f(U.u_pixelRatio, d);
    return true;
  };

  var raf = 0, lastDraw = 0, prevAt = null, visible = true, dead = false;
  var FRAME = 1000 / 30;
  var loop = function (now) {
    raf = 0;
    if (dead || !visible || document.hidden) return;
    if (!lastDraw || now - lastDraw >= FRAME - 2) {
      var dt = prevAt === null ? 0 : Math.min(Math.max(0, now - prevAt), 100);
      prevAt = now;
      lastDraw = now;
      draw(dt);
    }
    raf = requestAnimationFrame(loop);
  };
  var start = function () {
    if (dead || raf || reduced) return;
    prevAt = null;
    raf = requestAnimationFrame(loop);
  };
  var stop = function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  var boot = function (n) {
    if (dead) return;
    if (fit()) {
      if (reduced) { draw(0); return; }
      start();
      return;
    }
    if (n < 120) requestAnimationFrame(function () { boot(n + 1); });
  };
  boot(0);

  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      if (fit() && reduced) draw(0);
    }).observe(canvas);
  } else {
    window.addEventListener('resize', function () { if (fit() && reduced) draw(0); });
  }
  if (typeof window.IntersectionObserver === 'function') {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  window.addEventListener('pagehide', function () { dead = true; stop(); });
})();

/* ============================================================
   第 117 轮：第二层 —— 他们那张静态网格（ds-flow-field-canvas）
   90px 间距的方格，只有相邻点之间的短线（两端各缩进 10px，超过 20px 才画），
   线宽 .5、颜色 rgb(60,100,160) 10%；点位 r=1.8、4%。画一次就够，不参与动画。
   ============================================================ */
(function dsFlowGrid() {
  'use strict';
  var cv = document.getElementById('pmGrid');
  if (!cv || !cv.getContext) return;
  if ((document.body.getAttribute('data-page') || 'home') !== 'home') return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var COLOR = '60, 100, 160', SPACING = 90, LINE_OPACITY = 0.1, DOT_OPACITY = 0.04;
  var pts = [], cols = 0, rows = 0, W = 0, H = 0;

  var build = function () {
    cols = Math.ceil(W / SPACING) + 1;
    rows = Math.ceil(H / SPACING) + 1;
    var ox = (W - (cols - 1) * SPACING) / 2;
    var oy = (H - (rows - 1) * SPACING) / 2;
    pts = [];
    for (var r = 0; r < rows; r++) {
      for (var l = 0; l < cols; l++) pts.push({ x: ox + l * SPACING, y: oy + r * SPACING });
    }
  };
  var edge = function (a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
    if (len <= 20) return;
    var ix = dx / len * 10, iy = dy / len * 10;
    ctx.beginPath();
    ctx.moveTo(a.x + ix, a.y + iy);
    ctx.lineTo(b.x - ix, b.y - iy);
    ctx.stroke();
  };
  var paint = function () {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(' + COLOR + ', ' + LINE_OPACITY + ')';
    ctx.lineWidth = 0.5;
    var r, l;
    for (r = 0; r < rows; r++) for (l = 0; l < cols - 1; l++) edge(pts[r * cols + l], pts[r * cols + l + 1]);
    for (l = 0; l < cols; l++) for (r = 0; r < rows - 1; r++) edge(pts[r * cols + l], pts[(r + 1) * cols + l]);
    ctx.fillStyle = 'rgba(' + COLOR + ', ' + DOT_OPACITY + ')';
    for (var i = 0; i < pts.length; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 1.8, 0, TAU_TWO_PI);
      ctx.fill();
    }
  };
  var TAU_TWO_PI = Math.PI * 2;
  var fit = function () {
    var rect = cv.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    /* 第 118 轮：上限 2 → 1.5 —— 4K/Retina 下这块静态纹理能到 2200×1700，
       每帧都要参与合成，1.5 倍下 0.5px 细线仍然清晰，显存与带宽省一半 */
    var d = Math.min(window.devicePixelRatio || 1, 1.5);
    W = rect.width;
    H = rect.height;
    cv.width = Math.round(W * d);
    cv.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    build();
    paint();
    return true;
  };
  if (!fit()) requestAnimationFrame(function () { fit(); });
  if (window.ResizeObserver) new ResizeObserver(fit).observe(cv);
  else window.addEventListener('resize', fit);
})();
