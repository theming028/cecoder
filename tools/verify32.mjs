/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const ROOT=BASE;
const b=await puppeteer.launch({executablePath:(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),headless:'new',args:['--force-device-scale-factor=1']});
let pass=0; const fail=[];
const ok=(n,c,x)=>{ if(c) pass++; else fail.push(n+(x!==undefined?' ← '+x:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function mk(url,w=1440,h=900,seed){
  const p=await b.newPage(); p.__e=[];
  p.on('pageerror',e=>p.__e.push('pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error')p.__e.push('console: '+m.text())});
  await p.setViewport({width:w,height:h});
  if (seed) await p.evaluateOnNewDocument(seed);
  await p.goto('file:///'+ROOT+'/'+url,{waitUntil:'load'});
  await wait(700);
  return p;
}
const geo=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}},sel);

/* A 任务页分组「更多」 */
let p=await mk('cecoder-home.html',1440,900,()=>{try{localStorage.setItem('cecoder.wsDrawer',JSON.stringify({open:true}));localStorage.setItem('cecoder.wdTab','任务');}catch(e){}});
const heads=await p.evaluate(()=>[...document.querySelectorAll('#wdViewTask .wd-grp-head')].map(h=>({
  name:h.querySelector('.wd-grp-name').textContent, hasMore:!!h.querySelector('.wd-grp-more'),
  tag:h.tagName, role:h.getAttribute('role'), tab:h.getAttribute('tabindex')
})));
ok('A1 任务页 5 个分组都有「更多」', heads.length===5 && heads.every(h=>h.hasMore), JSON.stringify(heads.map(h=>h.name+':'+h.hasMore)));
ok('A2 分组头是 div[role=button] 可聚焦', heads.every(h=>h.tag==='DIV'&&h.role==='button'&&h.tab==='0'));
ok('A3 默认宽度 0（不出现在常态）', (await p.evaluate(()=>getComputedStyle(document.querySelector('#wdHead2 .wd-grp-more')).width))==='0px');
/* hover 出现 */
const h2=await p.$('#wdHead2'); const bb2=await h2.boundingBox();
await p.mouse.move(bb2.x+60, bb2.y+18); await wait(320);
ok('A4 hover 分组头 → 按钮展开 20', (await p.evaluate(()=>getComputedStyle(document.querySelector('#wdHead2 .wd-grp-more')).width))==='20px');
/* 点击弹出菜单 */
await (await p.$('#wdHead2 .wd-grp-more')).click(); await wait(320);
const menu=await p.evaluate(()=>{
  const m=document.getElementById('wdGrpMenu');
  return {hidden:m.hidden, title:m.dataset.title,
    items:[...m.querySelectorAll('.wd-menu-item')].map(i=>i.textContent.trim()),
    divs:m.querySelectorAll('.wd-menu-div').length};
});
ok('A5 菜单 4 项 + 1 条分隔线', JSON.stringify(menu.items)===JSON.stringify(['置顶','打开文件夹','编辑分组','移除分组']) && menu.divs===1, JSON.stringify(menu));
ok('A6 菜单标题 = 分组名', menu.title==='银行柜面业务', menu.title);
ok('A7 点「更多」不折叠分组', (await p.$eval('#wdHead2',e=>e.getAttribute('aria-expanded')))==='false');
/* Esc 关闭 */
await p.keyboard.press('Escape'); await wait(250);
ok('A8 Esc 关菜单', await p.evaluate(()=>document.getElementById('wdGrpMenu').hidden));
/* 置顶 */
const before=await p.evaluate(()=>[...document.querySelectorAll('#wdViewTask .wd-groups > .wd-grp .wd-grp-name')].map(e=>e.textContent));
await p.mouse.move(bb2.x+60, bb2.y+18); await wait(300);
await (await p.$('#wdHead2 .wd-grp-more')).click(); await wait(250);
await p.evaluate(()=>document.querySelector('#wdGrpMenu [data-grp-act="置顶"]').click()); await wait(400);
const after=await p.evaluate(()=>[...document.querySelectorAll('#wdViewTask .wd-groups > .wd-grp .wd-grp-name')].map(e=>e.textContent));
ok('A9 置顶把分组移到首位', after[0]==='银行柜面业务' && after.length===before.length, JSON.stringify(after));
ok('A10 置顶后 toast 出现', (await p.evaluate(()=>[...document.querySelectorAll('.semi-toast')].map(e=>e.textContent))).some(t=>t.startsWith('置顶')));
/* 移除 */
const h5=await p.$('#wdHead5'); const bb5=await h5.boundingBox();
await p.mouse.move(bb5.x+60, bb5.y+18); await wait(300);
await (await p.$('#wdHead5 .wd-grp-more')).click(); await wait(250);
await p.evaluate(()=>document.querySelector('#wdGrpMenu [data-grp-act="移除分组"]').click()); await wait(500);
ok('A11 移除分组后该行消失', await p.evaluate(()=>![...document.querySelectorAll('#wdViewTask .wd-grp-name')].some(e=>e.textContent==='AI Native Factory')));
ok('A12 首页无 JS 报错', p.__e.length===0, p.__e.join(' | '));
await p.close();

/* B 会话页：内置分组无「更多」，自建分组有 */
p=await mk('cecoder-home.html?tab=%E4%BC%9A%E8%AF%9D',1440,900,()=>{try{localStorage.setItem('cecoder.wsDrawer',JSON.stringify({open:true}));}catch(e){}});
const sHeads=await p.evaluate(()=>[...document.querySelectorAll('#wdViewSession .wd-grp-head')].map(h=>({n:h.querySelector('.wd-grp-name').textContent,m:!!h.querySelector('.wd-grp-more')})));
const builtin=['普通会话','数字分身会话','工作台会话'];
ok('B1 内置 3 个分组无「更多」', sHeads.filter(h=>builtin.includes(h.n)).every(h=>!h.m), JSON.stringify(sHeads));
ok('B2 自建分组（Nutstore / AI Native Factory）有「更多」', sHeads.filter(h=>!builtin.includes(h.n)).every(h=>h.m) && sHeads.filter(h=>!builtin.includes(h.n)).length===2, JSON.stringify(sHeads));
ok('B3 会话页 5 个分组', sHeads.length===5);
await p.close();

/* C 右栏默认一半 + 跟随 + 拖拽记忆 */
p=await mk('cecoder-session.html?id=0',1440,900,()=>{try{localStorage.setItem('cecoder.wsDrawer',JSON.stringify({open:true}));if(!sessionStorage.getItem('seedDone')){localStorage.removeItem('cecoder.rsDrawer');sessionStorage.setItem('seedDone','1');}}catch(e){}});
const pmBefore=await geo(p,'.panel-main');
await p.click('#rsToggle'); await wait(520);
const rs1=await geo(p,'#rsDrawer');
ok('C1 默认宽度 = panel-main 的一半', Math.abs(rs1.w-Math.round(pmBefore.w/2))<=1, rs1.w+' / '+pmBefore.w);
ok('C2 打开后 panel-main 也被压成一半', Math.abs((await geo(p,'.panel-main')).w-rs1.w)<=1);
/* 左栏收起 → 基准变宽 → 右栏跟随 */
await p.evaluate(()=>document.querySelector('.menu-btn').click()); await wait(600);
const pm2=await geo(p,'.panel-main'), rs2=await geo(p,'#rsDrawer');
ok('C3 收起左栏后右栏跟随变宽（≈一半）', rs2.w>rs1.w && Math.abs(rs2.w-(pm2.w+rs2.w)/2)<=2, rs2.w+' / pm2 '+pm2.w);
/* 拖拽后记住 */
const rr=await geo(p,'#rsResizer');
await p.mouse.move(rr.x+2, rr.y+300); await p.mouse.down();
await p.mouse.move(rr.x+60, rr.y+300, {steps:6}); await p.mouse.up(); await wait(350);
const rw=(await geo(p,'#rsDrawer')).w;
ok('C4 拖拽改宽生效（变窄 60）', Math.abs(rw-(rs2.w-60))<=4, rw);
await p.reload({waitUntil:'load'}); await wait(700);
ok('C5 重载后记住手动宽度', Math.abs((await geo(p,'#rsDrawer')).w-rw)<=1, (await geo(p,'#rsDrawer')).w);
ok('C6 新图标存在（右列填充 path）', await p.evaluate(()=>!!document.querySelector('#rsToggle .rs-fill')));
await p.close();

/* D 新建会话 → 首页形态 */
p=await mk('cecoder-session.html?id=1',1440,900,()=>{try{localStorage.removeItem('cecoder.rsDrawer');}catch(e){}});
await p.evaluate(()=>document.querySelector('#wdViewSession .wd-newtask').click());
await wait(900);
ok('D1 跳到首页并带 new=1', p.url().includes('cecoder-home.html') && p.url().includes('new=1'), p.url());
ok('D2 抽屉保持展开且停在会话页签', await p.evaluate(()=>document.getElementById('wsDrawer').classList.contains('is-open') && document.querySelector('.wd-tab.is-active').dataset.wdTab==='会话'));
ok('D3 右侧是首页形态（hero 可见）', await p.evaluate(()=>document.body.dataset.page==='home' && !!document.querySelector('.hero')));
ok('D4 不预选任何会话', await p.evaluate(()=>document.querySelectorAll('.wd-sess-card.is-sel').length)===0);
ok('D5 焦点落在输入框', await p.evaluate(()=>document.activeElement.classList.contains('c-input')));
ok('D6 新建会话无 JS 报错', p.__e.length===0, p.__e.join(' | '));
await p.close();

/* E 键盘：分组头 Enter 折叠 / Tab 聚焦 */
p=await mk('cecoder-home.html',1440,900,()=>{try{localStorage.setItem('cecoder.wsDrawer',JSON.stringify({open:true}));localStorage.setItem('cecoder.wdTab','任务');}catch(e){}});
await p.evaluate(()=>{document.getElementById('wdHead4').focus();});
await p.keyboard.press('Enter'); await wait(250);
ok('E1 Enter 展开分组', (await p.$eval('#wdHead4',e=>e.getAttribute('aria-expanded')))==='true');
await p.keyboard.press('Space'); await wait(250);
ok('E2 空格再收起', (await p.$eval('#wdHead4',e=>e.getAttribute('aria-expanded')))==='false');
ok('E3 键盘聚焦时按钮可见', (await p.evaluate(()=>getComputedStyle(document.querySelector('#wdHead4 .wd-grp-more')).width))==='20px');
await p.close();

await b.close();
console.log('\nPASS '+pass+'  FAIL '+fail.length);
fail.forEach(f=>console.log('  ✗ '+f));
