/* 第 117 轮起的共享取样器：首页背景换成 WebGL2（assets/flowfield.js）后，
   原来那套 `cv.getContext('2d').getImageData()` 全部失效（canvas 已被 webgl2 占用，
   再取 2d 返回 null）。WebGL 的 readPixels 只在「绘制完、同一帧内」有效，
   所以这里 hook WebGL2RenderingContext.drawArrays，在每次 drawArrays 之后立刻读一行像素，
   把指纹挂在 window.__gl 上：
     __gl.n      已采样帧数
     __gl.frames 总绘制次数（含未采样帧，用来判「还在画」）
     __gl.sig    [该行 RGB 均值, 该行最大亮度]（整数，便于比较）
     __gl.on     是否采样（默认 true；测帧率前设 false，readPixels 会打断 GPU 管线）
   只对 id="pmMist" 的 canvas 生效，其它 canvas 不采样。 */
export async function installGlSampler(page) {
  await page.evaluateOnNewDocument(() => {
    const proto = window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype;
    if (!proto || proto.__sampled) return;
    proto.__sampled = true;
    const orig = proto.drawArrays;
    window.__gl = { n: 0, frames: 0, on: true, sig: null, at: 0 };
    proto.drawArrays = function (...args) {
      const r = orig.apply(this, args);
      const cv = this.canvas;
      if (!cv || cv.id !== 'pmMist') return r;
      window.__gl.frames++;
      if (!window.__gl.on) return r;
      try {
        const w = this.drawingBufferWidth;
        const h = this.drawingBufferHeight;
        /* 采样 3 条横线（20% / 50% / 80% 高），每条给一个带一位小数的 RGB 均值：
           原版动效非常慢（420s / 460s / 90s 三个周期），取整会撞值，单行也不够灵敏。 */
        let sr = 0, sg = 0, sb = 0, sn = 0;
        const rows = [0.2, 0.5, 0.8].map(function (f) {
          const row = new Uint8Array(w * 4);
          this.readPixels(0, Math.max(0, Math.floor(h * f)), w, 1, this.RGBA, this.UNSIGNED_BYTE, row);
          let a = 0;
          for (let i = 0; i < row.length; i += 4) {
            sr += row[i]; sg += row[i + 1]; sb += row[i + 2]; sn++;
            a += (row[i] + row[i + 1] + row[i + 2]) / 3;
          }
          return +(a / (row.length / 4)).toFixed(2);
        }, this);
        window.__gl.n++;
        window.__gl.sig = rows;
        window.__gl.rgb = [Math.round(sr / sn), Math.round(sg / sn), Math.round(sb / sn)];
        window.__gl.at = performance.now();
      } catch (e) {
        window.__gl.err = String(e);
      }
      return r;
    };
  });
}
