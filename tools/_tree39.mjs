import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('tools/layers/p39-page.json','utf8'));
const root = (j.nodes||[])[0] || j;
const g = n => n.layoutStyle || {};
function line(n,d){
  const s=g(n);
  const bg = n._color ? ' bg=' + String(n._color).replace(/\s+/g,' ') : '';
  const r = s.radius!=null? ' r'+s.radius : (s.cornerRadius!=null?' r'+s.cornerRadius:'');
  const t = n.text ? ' text="'+String(n.text.content).replace(/\n/g,'\\n').slice(0,24)+'"' : '';
  const f = n.text ? ' f='+(n.text.style?.fontSize||'')+'/'+(n.text.style?.fontWeight||'')+(n.text.style?.color?' '+n.text.style.color:'') : '';
  console.log('  '.repeat(d)+`[${n.id}] ${n.name} ${s.width?Math.round(s.width)+'x'+Math.round(s.height):''}@${Math.round(s.relativeX||0)},${Math.round(s.relativeY||0)}${r}${bg}${t}${f}`);
}
function walk(n,d=0,maxd=3){ line(n,d); if(d<maxd)(n.children||[]).forEach(c=>walk(c,d+1,maxd)); }
const maxd = parseInt(process.argv[2]||'2',10);
walk(root,0,maxd);
