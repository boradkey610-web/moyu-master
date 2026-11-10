// 用本机 Chrome 无头驱动真实游戏页面截图。
// 等待素材加载完成与画面稳定后逐场景截图，并抓取 #verify-result 的状态 JSON。
import puppeteer from '/Users/lijin15/.npm/_npx/702923228c2ce1e6/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const browser=await puppeteer.launch({
 executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
 headless:'new',args:['--no-first-run','--disable-gpu','--hide-scrollbars'],defaultViewport:{width:430,height:880,deviceScaleFactor:2}});
const scenes=process.argv[2] ? process.argv[2].split(',') : ['menu','work','dance','game','range','suspicion','stopping'];
const out=process.argv[3]||'/tmp/moyu-shots';
const page=await browser.newPage();
for(const scene of scenes){
 await page.goto(`http://127.0.0.1:4178/outputs/screenshot.html?scene=${scene}`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#office')?.dataset.artStatus==='ready'||document.querySelector('#office')?.dataset.artStatus==='degraded',{timeout:20000});
 await new Promise(r=>setTimeout(r,900)); // 让两帧渲染与动效沉淀
 const state=await page.evaluate(()=>document.querySelector('#verify-result')?.textContent||'NO RESULT');
 await page.screenshot({path:`${out}/${scene}.png`});
 console.log(scene,'=>',state);
}
await browser.close();
