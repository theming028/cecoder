/* 把 MasterGo DSL 打成可读树：node dump-tree.mjs layers/r44-left.json [more...] */
import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
if (!files.length) { console.error('用法: node dump-tree.mjs <dsl.json> ...'); process.exit(2); }

function load(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const styles = d.styles || {};
  return { d, styles };
}

function paintOf(styles, id) {
  const s = styles[id];
  if (!s) return null;
  const v = s.value;
  if (Array.isArray(v)) {
    if (v.length === 1) return v[0];
    return '[' + v.join(' | ') + ']';
  }
  return String(v);
}

function fmt(n, styles, depth, out) {
  const ls = n.layoutStyle || {};
  const w = ls.width, h = ls.height, x = ls.relativeX, y = ls.relativeY;
  const bits = [];
  if (w != null) bits.push(`${round(w)}x${round(h)}@${round(x)},${round(y)}`);
  if (n.cornerRadius != null) bits.push('r=' + n.cornerRadius);
  // 填充
  const fills = [];
  (n.path || []).forEach(p => { const f = paintOf(styles, p.fill); if (f) fills.push(f); });
  if (!fills.length && n.fill) { const f = paintOf(styles, n.fill); if (f) fills.push(f); }
  if (fills.length) bits.push('bg=' + [...new Set(fills)].join('+'));
  // 描边
  if (n.stroke) { const f = paintOf(styles, n.stroke); if (f) bits.push('stroke=' + f); }
  if (n.effect) {
    const e = styles[n.effect];
    if (e && (e.value || []).length) bits.push('fx=' + e.value.join(' '));
  }
  if (n.type === 'TEXT' || n.text != null) {
    const t = (n.text ?? n.characters ?? '').toString().replace(/\s+/g, ' ').slice(0, 40);
    bits.push('text="' + t + '"');
    const f = n.fontStyle ? styles[n.fontStyle] : null;
    if (f && f.value) bits.push(`font=${f.value.size}/${f.value.lineHeight}/${f.value.weight}`);
  }
  out.push('  '.repeat(depth) + `[${n.id}] ${n.name || n.type} ${bits.join(' ')}`);
  (n.children || []).forEach(c => fmt(c, styles, depth + 1, out));
}

const round = v => (v == null ? '' : Math.round(v * 100) / 100);

for (const f of files) {
  const { d, styles } = load(f);
  const out = [];
  (d.nodes || []).forEach(n => fmt(n, styles, 0, out));
  const txt = out.join('\n');
  const dest = f.replace(/\.json$/, '.tree.txt');
  fs.writeFileSync(dest, txt);
  console.log(`→ ${path.basename(dest)}  ${out.length} 行`);
}
