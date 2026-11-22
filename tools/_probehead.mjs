const BASE=(process.env.CECODER_ROOT||process.cwd()).replace(/\\/g,'/');
import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const p=await b.newPage(); await p.setViewport({width:1440,height:900});
await p.goto('file:///'+BASE+'/_head-task.html?id=0',{waitUntil:'load'});
await p.evaluate(()=>{localStorage.setItem('cecoder.wsDrawer',JSON.stringify({open:true}));});
await p.reload({waitUntil:'load'}); await new Promise(r=>setTimeout(r,700));
console.log(JSON.stringify(await p.evaluate(()=>{
  const pm=document.querySelector('.panel-main').getBoundingClientRect();
  const t=document.getElementById('tkStepTrack').getBoundingClientRect();
  const icons=[...document.querySelectorAll('.ts-item > :first-child')].map(e=>{const r=e.getBoundingClientRect();return +(r.x+r.width/2-t.x).toFixed(2)});
  const links=[...document.querySelectorAll('.ts-link')].map(e=>{const r=e.getBoundingClientRect();return [+(r.x-t.x).toFixed(2), +r.width.toFixed(2)]});
  return {pmW:Math.round(pm.width), trackW:Math.round(t.width), icons, links};
})));
await b.close();
