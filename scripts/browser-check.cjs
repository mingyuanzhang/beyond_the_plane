/* Optional browser smoke test. Uses installed Chrome and Node's built-in CDP client. */
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'beyond-plane-browser-'));
const artifacts=path.join(root,'artifacts');fs.mkdirSync(artifacts,{recursive:true});
const server=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{env:{...process.env,PORT:'4328'},stdio:'ignore'});
const browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeLog='';browser.stderr.on('data',chunk=>chromeLog+=chunk);
browser.on('error',error=>chromeLog+=error.message);
let ws;
(async()=>{
  let port;
  for(let i=0;i<300;i++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);if(port)break;}catch{}await delay(100);}
  assert.ok(port,`Chrome starts: ${chromeLog}`);console.log('Chrome connected.');
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  const pending=new Map(),errors=[];let serial=0;
  ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);pending.delete(message.id);if(message.error)p.reject(message.error);else p.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text+': '+message.params.exceptionDetails.exception?.description);};
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
  async function run(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
  async function navigate(url){await send('Page.navigate',{url});for(let i=0;i<100;i++){await delay(50);if(await run('document.readyState === "complete" && document.querySelectorAll("#level-buttons button").length === 20'))return;}throw Error('Page did not load');}
  async function shot(name){await delay(100);const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(artifacts,name),Buffer.from(data,'base64'));}
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
  await navigate('http://127.0.0.1:4328/');console.log('Game loaded.');
  assert.equal(await run('document.querySelectorAll(".choice").length'),0,'no candidates before guessing');
  assert.equal(await run('document.querySelectorAll("#level-buttons button").length'),20);
  await run('document.getElementById("timeline").value=500;document.getElementById("timeline").dispatchEvent(new Event("input"))');
  assert.equal(await run('document.getElementById("time-status").textContent'),'TIME FROZEN');
  const startTime=await run('document.getElementById("timeline").value');
  await run('document.getElementById("angle").value=90;document.getElementById("angle").dispatchEvent(new Event("input"))');
  await delay(100);
  assert.equal(await run('document.getElementById("timeline").value'),startTime);
  assert.equal(await run('document.getElementById("angle-value").textContent'),'90°');
  await shot('desktop.png');
  await run('document.getElementById("rewind").click()');await delay(200);
  assert.ok(Number(await run('document.getElementById("timeline").value'))<500);
  await run('document.getElementById("play").click()');
  await run('document.getElementById("ready").click()');await delay(120);
  assert.equal(await run('document.getElementById("guess-dialog").open'),true);
  assert.equal(await run('document.querySelectorAll(".choice").length'),3);
  assert.equal(await run('document.getElementById("time-status").textContent'),'TIME FROZEN');
  const frozenState=await run('[document.getElementById("timeline").value,document.getElementById("angle").value]');
  await shot('guess-desktop.png');
  await run('document.getElementById("back-observe").click()');await delay(100);
  assert.equal(await run('document.querySelectorAll(".choice").length'),0,'returning to observation removes candidates');
  assert.deepEqual(await run('[document.getElementById("timeline").value,document.getElementById("angle").value]'),frozenState);
  await run('document.getElementById("ready").click()');await delay(60);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(80);
  assert.equal(await run('document.getElementById("guess-dialog").open'),false,'Escape closes guessing');
  assert.equal(await run('document.querySelectorAll(".choice").length'),0);
  await run('document.getElementById("ready").click()');await delay(60);
  await run('document.querySelector("[data-shape=sphere]").click();document.getElementById("submit").click()');await delay(500);
  assert.equal(await run('document.getElementById("result").hidden'),false);
  assert.equal(await run('document.getElementById("result-label").textContent'),'HYPOTHESIS CONFIRMED');
  assert.equal(await run('document.getElementById("progress").textContent'),'1 / 20 solved');
  await shot('reveal.png');
  await run('document.getElementById("next").click()');
  assert.equal(await run('document.getElementById("level-title").textContent'),'Around the corner');
  await run('document.getElementById("ready").click()');await delay(60);
  await run('document.querySelector("[data-shape=cone]").click();document.getElementById("submit").click()');
  assert.equal(await run('document.getElementById("result-label").textContent'),'A NEW WAY TO SEE IT');
  await run('document.getElementById("retry").click()');assert.equal(await run('document.getElementById("result").hidden'),true);
  await run('document.getElementById("help").click()');assert.equal(await run('document.getElementById("help-dialog").open'),true);await run('document.getElementById("begin").click()');
  // Every level renders and reveals without an exception.
  const answers=require('../src/model.js').levels.map(level=>level.answer);
  for(let i=0;i<answers.length;i++){
    await run(`document.querySelectorAll('#level-buttons button')[${i}].click();document.getElementById('timeline').value=500;document.getElementById('timeline').dispatchEvent(new Event('input'));`);
    await delay(60);
    assert.equal(await run('document.querySelectorAll(".choice").length'),0,'new level hides all choices');
    await run('document.getElementById("ready").click()');await delay(60);
    if(i===19)await shot('advanced-choices.png');
    await run(`document.querySelector('[data-shape="${answers[i]}"]').click();document.getElementById('submit').click()`);
    await delay(60);
    assert.equal(await run('document.getElementById("result-label").textContent'),'HYPOTHESIS CONFIRMED');
  }
  assert.equal(await run('document.getElementById("progress").textContent'),'20 / 20 solved');
  await navigate('http://127.0.0.1:4328/');assert.equal(await run('document.getElementById("progress").textContent'),'20 / 20 solved');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await run('document.querySelectorAll("#level-buttons button")[19].click();document.getElementById("timeline").value=500;document.getElementById("timeline").dispatchEvent(new Event("input"));document.getElementById("angle").value=90;document.getElementById("angle").dispatchEvent(new Event("input"));window.scrollTo(0,0)');await delay(200);
  assert.equal(await run('document.documentElement.scrollWidth<=window.innerWidth'),true,'mobile has no horizontal overflow');
  await shot('mobile.png');
  for(const width of [320,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await delay(100);
    assert.equal(await run(`Array.from(document.querySelectorAll('.transport button,.speed')).every(el=>{const r=el.getBoundingClientRect(),p=document.querySelector('.observation').getBoundingClientRect();return r.left>=p.left&&r.right<=p.right;})`),true,'transport controls fit at '+width+'px');
  }
  // Exercise real keyboard events and held pointer movement while frozen.
  await run('document.activeElement.blur()');
  const beforeKey=Number(await run('document.getElementById("angle").value'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await delay(150);
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await delay(60);
  assert.ok(Number(await run('document.getElementById("angle").value'))>beforeKey,'keyboard orbit moves');
  assert.equal(await run('document.getElementById("timeline").value'),'500','keyboard movement preserves frozen time');
  await run('document.getElementById("orbit-right").scrollIntoView({block:"center"})');await delay(100);
  const button=await run('(()=>{const r=document.getElementById("orbit-right").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
  const beforeHold=Number(await run('document.getElementById("angle").value'));
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...button,button:'left',clickCount:1});await delay(150);
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...button,button:'left',clickCount:1});await delay(80);
  assert.ok(Number(await run('document.getElementById("angle").value'))>beforeHold,'held movement button moves');
  const afterHold=await run('document.getElementById("angle").value');await delay(120);
  assert.equal(await run('document.getElementById("angle").value'),afterHold,'pointer release stops walking');

  await run('document.getElementById("ready").click()');await delay(100);await shot('mobile-choices.png');
  assert.equal(await run('document.querySelectorAll(".choice").length'),4);
  for(const width of [320,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await delay(100);
    assert.equal(await run('document.getElementById("guess-dialog").scrollWidth<=document.getElementById("guess-dialog").clientWidth'),true,'guess dialog fits narrow screen');
  }
  await run('document.getElementById("candidate-angle").value=160;document.getElementById("candidate-angle").dispatchEvent(new Event("input"))');await delay(100);
  await run('document.querySelector("[data-shape=linkedRings]").click();document.getElementById("submit").click()');await delay(150);
  assert.equal(await run('document.getElementById("guess-dialog").open'),false);
  assert.equal(await run('document.getElementById("result-label").textContent'),'HYPOTHESIS CONFIRMED');
  await run('document.getElementById("next").click()');await delay(100);
  assert.equal(await run('document.getElementById("level-title").textContent'),'A passing presence');
  assert.equal(await run('document.querySelectorAll(".choice").length'),0);

  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  // File URL is a supported launch path, with no server or module loader.
  await navigate(pathToFileURL(path.join(root,'index.html')).href);
  await run('document.getElementById("timeline").value=500;document.getElementById("timeline").dispatchEvent(new Event("input"))');await delay(100);
  assert.ok(await run('document.getElementById("vision").width>0'));
  assert.equal(await run('document.getElementById("time-status").textContent'),'TIME FROZEN');
  assert.deepEqual(errors,[],'no browser runtime errors');
  console.log('PASS: desktop, mobile, freeze/move, reverse, correct/wrong answers, retry, all 20 reveals, persistence, help, direct file launch.');
  console.log(`Screenshots: ${artifacts}`);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(ws)ws.close();browser.kill();server.kill();await delay(300);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}});
