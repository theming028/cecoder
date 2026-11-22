/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const F='file:///' + BASE + '/cecoder-home.html';
const b=await puppeteer.launch({executablePath:(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),headless:'new'});
const p=await b.newPage();
const errs=[]; p.on('pageerror',e=>errs.push('pageerror '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text())});
await p.setViewport({width:1440,height:900});
await p.goto(F,{waitUntil:'load'});
await p.addStyleTag({content:'.stage{width:872px !important}'}); /* 第 11 轮：基线按稿件 860 校验；第 16 轮 stage 盒含左右 6px 内边距，872 盒 = 860 内容 */
await p.evaluate(()=>localStorage.removeItem('cecoder.wsDrawer'));
await p.reload({waitUntil:'load'});
await p.addStyleTag({content:'.stage{width:872px !important}'});
let pass=0, fail=[];
const eq=(name,got,want,tol=1)=>{ const ok=got!=null && Math.abs(got-want)<=tol; ok?pass++:fail.push(name+' got='+got+' want='+want); };
const box=s=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];},s);

// --- 工作台 chip（选中）---
await p.click('[data-chips="process"] .chip[data-wb="通用"]');
await new Promise(r=>setTimeout(r,260));
let chips = await p.evaluate(()=>[...document.querySelectorAll('[data-chips="process"] .chip')].map(e=>Math.round(e.getBoundingClientRect().width)));
eq('chip 通用 选中宽', chips[0], 66); eq('chip 需求 未选宽', chips[1], 48);
const ic = await p.evaluate(()=>{const c=document.querySelectorAll('[data-chips="process"] .chip');return [getComputedStyle(c[0].querySelector('.chip-ico')).display, getComputedStyle(c[1].querySelector('.chip-ico')).display];});
if(ic[0]!=='none' && ic[1]==='none') pass++; else fail.push('chip 图标显隐 '+JSON.stringify(ic));

// --- 场景卡三态 ---
let s0 = await box('.scene'); eq('scene idle 高', s0[3], 80);
await p.click('#scIdle'); await new Promise(r=>setTimeout(r,420));
let s1 = await box('.scene'); eq('scene 看板高', s1[3], 192);
const cards = await p.evaluate(()=>[...document.querySelectorAll('.sc-metric,.sc-chart')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.x-290),Math.round(r.width),Math.round(r.height)]}));
eq('指标卡宽', cards[0][1], 143); eq('图表卡宽', cards[4][1], 200); eq('卡行 x0', cards[0][0], 21); eq('图表卡 x', cards[4][0], 640, 2);
await p.click('#scFold'); await new Promise(r=>setTimeout(r,420));
let s2 = await box('.scene'); eq('scene 折叠高', s2[3], 60);
await p.click('#scFold'); await new Promise(r=>setTimeout(r,420));
let s3 = await box('.scene'); eq('scene 再展开高', s3[3], 192);

// --- 侧栏拖宽 ---
await p.click('.menu-btn'); await new Promise(r=>setTimeout(r,360));
eq('抽屉默认宽', (await box('.ws-drawer'))[2], 320);
const rz = await box('.ws-resizer');
await p.mouse.move(rz[0]+2, rz[1]+300); await p.mouse.down();
await p.mouse.move(rz[0]+2+400, rz[1]+300, {steps:10}); await p.mouse.up();
await new Promise(r=>setTimeout(r,200));
eq('抽屉最大宽', (await box('.ws-drawer'))[2], 480);
const rz2 = await box('.ws-resizer');
await p.mouse.move(rz2[0]+2, rz2[1]+300); await p.mouse.down();
await p.mouse.move(rz2[0]+2-600, rz2[1]+300, {steps:10}); await p.mouse.up();
await new Promise(r=>setTimeout(r,200));
eq('抽屉最小宽', (await box('.ws-drawer'))[2], 300);
await p.mouse.move(rz2[0]+2, rz2[1]+300); await p.mouse.down();
await p.mouse.move(rz2[0]+2+96, rz2[1]+300, {steps:8}); await p.mouse.up();
await new Promise(r=>setTimeout(r,220));
const beforeReload = (await box('.ws-drawer'))[2];
// --- 记忆 ---
await p.reload({waitUntil:'load'}); await new Promise(r=>setTimeout(r,300));
await p.addStyleTag({content:'.stage{width:872px !important}'});
eq('刷新后宽度记忆', (await box('.ws-drawer'))[2], beforeReload);
if (await p.evaluate(()=>document.querySelector('.ws-drawer').classList.contains('is-open'))) pass++; else fail.push('刷新后应保持展开');
await p.click('.wd-collapse'); await new Promise(r=>setTimeout(r,320));
await p.reload({waitUntil:'load'}); await new Promise(r=>setTimeout(r,250));
if (!(await p.evaluate(()=>document.querySelector('.ws-drawer').classList.contains('is-open')))) pass++; else fail.push('刷新后应保持收起');

// --- 模态 ---
await p.click('.menu-btn'); await new Promise(r=>setTimeout(r,300));
await p.click('#wdSync'); await new Promise(r=>setTimeout(r,400));
const mb = await box('.cm-panel');
const pb = await box('.panel');
eq('模态 x', mb[0], 180); eq('模态 y', mb[1], pb[1] + 40); eq('模态 w', mb[2], 1080);
/* 第 18 轮：模态改为纵向自适应，高度 = 面板 - 80 */
eq('模态 h', mb[3], pb[3] - 80);
eq('模态左栏宽', (await box('.cm-left'))[2], 320);
eq('右内容区 x', (await box('.cm-right'))[0]+40, 540);
eq('右内容区宽', (await box('.cm-tabs'))[2], 680);
/* 第 18 轮：模态内部改用「相对模态顶边」的偏移校验（tabs +128、内容 +200） */
eq('tabs y', (await box('.cm-tabs'))[1] - mb[1], 128);
eq('内容 y', (await box('.cm-panes'))[1] - mb[1], 200);
eq('主按钮 x', (await box('#cmSync'))[0], 712);
/* 底部按钮贴着 footer，距模态底边 44 */
eq('主按钮 y', mb[1] + mb[3] - (await box('#cmSync'))[1], 44);
const cnt = await p.evaluate(()=>document.getElementById('cmCount').textContent);
if (cnt==='共 5 项，已选 3 项') pass++; else fail.push('计数初始 '+cnt);
await p.evaluate(()=>document.querySelectorAll('.cm-item')[3].click()); await new Promise(r=>setTimeout(r,180));
const cnt2 = await p.evaluate(()=>document.getElementById('cmCount').textContent);
if (cnt2==='共 5 项，已选 4 项') pass++; else fail.push('勾选后计数 '+cnt2);
await p.click('#cmAll'); await new Promise(r=>setTimeout(r,160));
if ((await p.evaluate(()=>document.getElementById('cmAll').textContent))==='反选') pass++; else fail.push('全选后应显示反选');
await p.click('#cmSync'); await new Promise(r=>setTimeout(r,300));
if ((await p.evaluate(()=>document.getElementById('cmSync').textContent))==='同步中') pass++; else fail.push('同步中文案');
await p.screenshot({path:'F-busy.png'});
await new Promise(r=>setTimeout(r,1600));
const msg = await p.evaluate(()=>{const m=document.querySelector('.cm-msg');return m? m.textContent:'(none)'});
if (msg==='云端任务同步完成') pass++; else fail.push('成功提示 '+msg);
await p.screenshot({path:'F-success.png'});
await p.keyboard.press('Escape'); await new Promise(r=>setTimeout(r,240));
if (!(await p.evaluate(()=>document.getElementById('syncModal').classList.contains('is-open')))) pass++;
else fail.push('Esc 未关闭模态');
if (await p.evaluate(()=>document.querySelector('.ws-drawer').classList.contains('is-open'))) pass++;
else fail.push('Esc 连带关闭了侧栏');

console.log('PASS', pass, 'FAIL', fail.length);
if (fail.length) console.log(fail.join('\n'));
console.log('errors:', errs.length?errs.join(' | '):'none');
await b.close();
