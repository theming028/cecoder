/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const F='file:///' + BASE + '/cecoder-home.html';
const b=await puppeteer.launch({executablePath:(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),headless:'new'});
let pass=0;const fail=[];
const ok=(n,c,x)=>{if(c)pass++;else fail.push(n+(x!==undefined?' ← '+x:''));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

for(const [w,h] of [[1440,900],[1366,768],[1280,800],[960,700]]){
  const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.setViewport({width:w,height:h});
  await p.goto(F,{waitUntil:'load'});
  await p.evaluate(()=>localStorage.setItem('cecoder.wsDrawer',JSON.stringify({open:true,w:320})));
  await p.reload({waitUntil:'load'});
  await wait(700);
  const base=await p.evaluate(()=>{
    const st=document.querySelector('.stage');
    return {sw:st.scrollWidth,cw:st.clientWidth,sh:st.scrollHeight,ch:st.clientHeight,
      docX:document.documentElement.scrollWidth,docW:document.documentElement.clientWidth};
  });
  ok(`${w} 无横向溢出`, base.sw<=base.cw+1 && base.docX<=base.docW, JSON.stringify(base));

  await p.click('#wdSync'); await wait(400);
  const m=await p.evaluate(()=>{
    const d=document.getElementById('syncModal').querySelector('.cm-panel');
    const pt=document.querySelector('.panel').getBoundingClientRect();
    const r=d.getBoundingClientRect();
    return {w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),bot:Math.round(r.bottom),
      inside:r.top>=pt.top-0.5&&r.bottom<=pt.bottom+0.5&&r.left>=pt.left-0.5&&r.right<=pt.right+0.5,
      title:!!document.getElementById('cmTitle').textContent};
  });
  ok(`${w} 同步弹窗不出面板`, m.inside, JSON.stringify(m));
  ok(`${w} 弹窗宽度随面板收缩`, m.w<=1080 && m.w>400, String(m.w));
  ok(`${w} 弹窗头可见`, m.title);
  await p.screenshot({path:`R12-modal-${w}x${h}.png`,captureBeyondViewport:false});
  await p.keyboard.press('Escape'); await wait(250);
  ok(`${w} Esc 关闭同步弹窗`, await p.evaluate(()=>!document.getElementById('syncModal').classList.contains('is-open')));
  ok(`${w} 抽屉仍在（Esc 不误收）`, await p.evaluate(()=>document.getElementById('wsDrawer').classList.contains('is-open')));

  /* 工序弹窗 */
  await p.click('[data-quick="缺陷修复"]'); await wait(400);
  /* 第 13 轮决策：编辑工序暂不弹窗（qfOpenEdit 接线保留但注释）——
     qfEdit 点击只出 toast，#qfModal 保持隐藏。这里改为验证「不弹窗」。 */
  await p.click('#qfEdit'); await wait(300);
  const q=await p.evaluate(()=>{
    const m=document.getElementById('qfModal');
    const toast=document.querySelector('.semi-toast');
    return { notOpen: !m.classList.contains('is-open'),
      ariaHidden: m.getAttribute('aria-hidden') === 'true',
      noPanel: !document.querySelector('.qm-panel') || document.querySelector('.qm-panel').getBoundingClientRect().width === 0,
      toastTxt: toast ? toast.textContent : null };
  });
  ok(`${w} 编辑工序不弹窗（第 13 轮决策）`, q.notOpen && q.ariaHidden && q.noPanel, JSON.stringify(q));
  /* 第 13 轮：接线注释掉、未给 toast —— 图标只是可聚焦 button */
  ok(`${w} 弹窗 DOM 保留（qfOpenEdit 可回接）`, await p.evaluate(()=>!!document.getElementById('qfModal') && !!document.querySelector('#qfModal .qm-panel') && !!document.getElementById('qmSave')), '');
  ok(`${w} 无报错`, errs.length===0, errs.join('|'));
  await p.close();
}
console.log('PASS '+pass+' / '+(pass+fail.length));
fail.forEach(f=>console.log('  FAIL '+f));
await b.close();
