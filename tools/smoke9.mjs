/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const F='file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
for (const [w,h] of [[1920,1080],[1440,900],[1280,800],[1024,768],[960,700]]) {
  const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('pageerror '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await p.setViewport({width:w,height:h});
  await p.goto(F,{waitUntil:'load'});
  await p.evaluate(()=>{localStorage.setItem('cecoder.wsDrawer',JSON.stringify({open:false}));localStorage.setItem('cecoder.wdTab','任务');}); /* 第 38 轮：默认展开/默认会话页签，这里要收起 + 任务基线 */
  await p.reload({waitUntil:'load'});
  await new Promise(r=>setTimeout(r,300));
  // 交互冒烟：看板 → 折叠 → 点空白展开；抽屉 → 搜索 → 过滤 → 清 → 排序 → 折叠组
  await p.click('#scIdle'); await new Promise(r=>setTimeout(r,300));
  await p.click('#scFold'); await new Promise(r=>setTimeout(r,300));
  const sc=await p.evaluate(()=>{const r=document.getElementById('scene').getBoundingClientRect();return [r.x+10,r.y+r.height/2];});
  await p.mouse.click(sc[0],sc[1]); await new Promise(r=>setTimeout(r,300));
  await p.click('.menu-btn'); await new Promise(r=>setTimeout(r,600));
  await p.click('#wdSearchBtn'); await new Promise(r=>setTimeout(r,200));
  await p.type('#wdSearchInput','任务'); await new Promise(r=>setTimeout(r,200));
  await p.click('#wdSearchClear'); await new Promise(r=>setTimeout(r,200));
  await p.click('#wdSortBtn'); await new Promise(r=>setTimeout(r,200));
  await p.click('.wd-menu-item[data-sort="updated"]'); await new Promise(r=>setTimeout(r,250));
  await p.evaluate(()=>document.querySelector('#wdViewTask > .wd-grp > .wd-grp-head').click());
  await new Promise(r=>setTimeout(r,250));
  await p.evaluate(()=>{const ta=document.querySelector('.c-input'); ta.value=Array.from({length:16},(_,i)=>'行'+(i+1)).join('\n'); ta.dispatchEvent(new Event('input',{bubbles:true}));});
  await new Promise(r=>setTimeout(r,250));
  const of = await p.evaluate(()=>({sw:document.documentElement.scrollWidth, iw:window.innerWidth, comp:document.querySelector('.composer').getBoundingClientRect().bottom, panel:document.querySelector('.panel').getBoundingClientRect().bottom}));
  console.log(w+'x'+h, JSON.stringify(of), errs.length?('ERR '+errs.join('|')):'no-err');
  await p.close();
}
await b.close();
