/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const ROOT=BASE;
const b=await puppeteer.launch({executablePath:(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),headless:'new',args:['--force-device-scale-factor=1']});
let pass=0; const fail=[];
const ok=(n,c,x)=>{ if(c) pass++; else fail.push(n+(x!==undefined?' ← '+x:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function mk(url,w=1440,h=900){
  const p=await b.newPage(); p.__e=[];
  p.on('pageerror',e=>p.__e.push('pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error')p.__e.push('console: '+m.text())});
  await p.setViewport({width:w,height:h});
  await p.goto('file:///'+ROOT+'/'+url,{waitUntil:'load'});
  await wait(650);
  return p;
}
const geo=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}},sel);

/* A 首页：新建任务回落地首页 */
let p=await mk('cecoder-session.html?tab=%E4%BC%9A%E8%AF%9D&id=1');
await p.evaluate(()=>document.querySelector('.wd-link[data-action="新建任务"]').click());
await wait(700);
ok('A1 会话页点新建任务 → 回首页', p.url().endsWith('cecoder-home.html'), p.url());
ok('A2 首页无 query（原始态）', !p.url().includes('?'), p.url());
ok('A3 首页 body data-page=home', await p.evaluate(()=>document.body.dataset.page)==='home');
ok('A4 落地时任务列表展开（第 41 轮：首页永远展开）', await p.evaluate(()=>document.getElementById('wsDrawer').classList.contains('is-open')));
await p.close();

/* B 任务页点新建任务 */
p=await mk('cecoder-task.html?tab=%E4%BB%BB%E5%8A%A1&id=0');
await p.evaluate(()=>document.querySelector('.wd-newtask[data-action="新建任务"]').click());
await wait(700);
ok('B1 任务页点新建任务 → 回首页', p.url().endsWith('cecoder-home.html'), p.url());
await p.close();

/* C 页签记忆 */
p=await mk('cecoder-home.html');
await p.evaluate(()=>localStorage.removeItem('cecoder.wdTab'));
await p.reload({waitUntil:'load'}); await wait(500);
ok('C1 首次进入默认「会话」', await p.evaluate(()=>document.querySelector('.wd-tab.is-active').dataset.wdTab)==='会话');
await p.evaluate(()=>document.querySelector('[data-wd-tab="会话"]').click());
await wait(200);
ok('C2 切到会话后写入记忆', await p.evaluate(()=>localStorage.getItem('cecoder.wdTab'))==='会话');
await p.reload({waitUntil:'load'}); await wait(600);
ok('C3 重载后停在「会话」', await p.evaluate(()=>document.querySelector('.wd-tab.is-active').dataset.wdTab)==='会话');
ok('C4 会话视图可见', await p.evaluate(()=>!document.getElementById('wdViewSession').hidden));
await p.evaluate(()=>document.querySelector('[data-wd-tab="任务"]').click());
await wait(200);
await p.reload({waitUntil:'load'}); await wait(600);
ok('C5 重载后停在「任务」', await p.evaluate(()=>document.querySelector('.wd-tab.is-active').dataset.wdTab)==='任务');
await p.close();

/* D 会话/任务页始终显示各自的页签 */
p=await mk('cecoder-session.html');
ok('D1 会话页抽屉停在「会话」', await p.evaluate(()=>document.querySelector('.wd-tab.is-active').dataset.wdTab)==='会话');
const tabs=await geo(p,'.chat-tabs'); const pm=await geo(p,'.panel-main');
ok('D2 抽屉展开时 chat-tabs 左间距 24', tabs.x-pm.x===24, tabs.x-pm.x);
/* 收起抽屉 → 44 让开菜单键 */
await p.evaluate(()=>document.querySelector('.menu-btn').click());
await wait(500);
const tabs2=await geo(p,'.chat-tabs'); const pm2=await geo(p,'.panel-main');
ok('D3 抽屉收起时左间距 44（让开菜单键）', tabs2.x-pm2.x===44, tabs2.x-pm2.x);
await p.screenshot({path:'R31-session-closed.png'});
await p.close();

p=await mk('cecoder-task.html');
ok('D4 任务页抽屉停在「任务」', await p.evaluate(()=>document.querySelector('.wd-tab.is-active').dataset.wdTab)==='任务');
const srcTask=fs.readFileSync(ROOT+'/cecoder-task.html','utf8');
/* 第 34 轮：标题栏换成工序进度模块，任务名只留在 <title> 里 */
ok('D5 任务页 <title> 默认「Cecoder · 任务执行」', srcTask.includes('<title>Cecoder \u00b7 \u4efb\u52a1\u6267\u884c</title>') && !srcTask.includes('id="tkTitle"'), '');
ok('D5b 任务页仍按任务名覆盖 <title>', (await p.title()) !== 'Cecoder \u00b7 \u4efb\u52a1\u6267\u884c', await p.title());
ok('D6 任务页无右栏（null 安全）', await p.evaluate(()=>!document.getElementById('rsDrawer')));
ok('D7 任务页无 JS 报错', p.__e.length===0, p.__e.join(' | '));
await p.close();

/* E 右栏：展开 / 拖宽 / 记忆 / Esc */
p=await mk('cecoder-session.html?id=0');
await p.evaluate(()=>localStorage.removeItem('cecoder.rsDrawer'));
await p.reload({waitUntil:'load'}); await wait(600);
ok('E1 默认收起', (await geo(p,'#rsDrawer')).w===0);
ok('E2 按钮 aria-expanded=false', (await p.$eval('#rsToggle',e=>e.getAttribute('aria-expanded')))==='false');
const before=await geo(p,'.stage');
const pmBase=await geo(p,'.panel-main');
await p.click('#rsToggle'); await wait(450);
const rs=await geo(p,'#rsDrawer');
/* 第 32 轮：默认宽度改成 panel-main 的一半 */
ok('E3 展开后宽 = panel-main 的一半', Math.abs(rs.w-Math.round(pmBase.w/2))<=1, rs.w+' / '+pmBase.w);
ok('E4 内容被挤压（stage 变窄）', (await geo(p,'.stage')).w<before.w);
/* 拖宽：向左拖 80 → 400 */
const rr=await geo(p,'#rsResizer');
await p.mouse.move(rr.x+2, rr.y+300);
await p.mouse.down();
await p.mouse.move(rr.x-78, rr.y+300, {steps:8});
await p.mouse.up();
await wait(300);
const rw=(await geo(p,'#rsDrawer')).w;
ok('E5 拖拽改宽生效（+78）', Math.abs(rw-(rs.w+78))<=4, rw+' vs '+(rs.w+78));
await p.reload({waitUntil:'load'}); await wait(700);
ok('E6 重载后右栏仍展开', (await geo(p,'#rsDrawer')).w>0);
ok('E7 重载后宽度被记住', Math.abs((await geo(p,'#rsDrawer')).w-rw)<=1, (await geo(p,'#rsDrawer')).w);
ok('E8 重载后按钮态同步', (await p.$eval('#rsToggle',e=>e.getAttribute('aria-expanded')))==='true');
await p.keyboard.press('Escape'); await wait(400);
ok('E9 Esc 先收右栏（不跳页）', p.url().includes('cecoder-session') && (await geo(p,'#rsDrawer')).w===0, p.url());
await p.keyboard.press('Escape'); await wait(600);
ok('E10 再按 Esc 回首页列表', p.url().includes('cecoder-home') && p.url().includes('sel='), p.url());
await p.close();

/* F 标签联动 */
p=await mk('cecoder-home.html');
await p.evaluate(()=>{localStorage.removeItem('cecoder.wdTab')});
await p.reload({waitUntil:'load'}); await wait(500);
ok('F1 初始无标签', await p.evaluate(()=>document.getElementById('cTags').hidden));
await p.click('[data-quick="技术任务"]'); await wait(350);
const t1=await p.evaluate(()=>{const t=document.querySelector('.c-tag');return {cls:t.className,txt:t.textContent.trim(),card:document.querySelector('.c-card').getBoundingClientRect().height}});
ok('F2 选快速任务 → 紫色标签', t1.cls.includes('is-quick') && t1.txt==='技术任务', JSON.stringify(t1));
ok('F3 卡片增高 34', Math.round(t1.card)===162, t1.card);
await p.click('[data-wb="架构"]'); await wait(350);
const t2=await p.evaluate(()=>{const t=document.querySelector('.c-tag');return {cls:t.className,txt:t.textContent.trim()}});
ok('F4 换工作台 → 蓝色标签', t2.cls.includes('is-wb') && t2.txt.startsWith('架构设计工作台 ·'), JSON.stringify(t2));
await p.click('.wb-opt:nth-child(3)'); await wait(250);  /* nth-child(3) = 数据模型 */
ok('F5 换子项 → 标签文字跟随', (await p.$eval('.c-tag-txt',e=>e.textContent.trim())).endsWith('· 数据模型'), await p.$eval('.c-tag-txt',e=>e.textContent.trim()));
await p.click('.c-tag-x'); await wait(350);
ok('F6 删标签 → 工作台取消选中', await p.evaluate(()=>!document.querySelector('[data-chips="process"] .chip.is-active')));
ok('F7 删标签 → 标签行消失且卡片回 128', await p.evaluate(()=>document.getElementById('cTags').hidden && Math.round(document.querySelector('.c-card').getBoundingClientRect().height)===128));
ok('F8 首页无 JS 报错', p.__e.length===0, p.__e.join(' | '));
await p.close();

await b.close();
console.log('\nPASS '+pass+'  FAIL '+fail.length);
fail.forEach(f=>console.log('  ✗ '+f));
