(function(){
  'use strict';
  const G=BTPGeometry,{levels,Model}=BTPModel,R=BTPRender,$=id=>document.getElementById(id);
  const model=new Model(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storageKey='beyond-the-plane:solved:v2';
  try{const saved=localStorage.getItem(storageKey);if(saved!==null)model.restore(saved);else model.restoreLegacy(localStorage.getItem('beyond-the-plane:solved:v1'));}catch{}
  const guess=$('guess-dialog');let candidateYaw=.72;
  let dirty=true,choiceDirty=true,last=0,cachedTime=-1,segments=[],keys=new Set(),hold=0,revealYaw=.72,revealPitch=.48,drag=null;
  const levelButtons=levels.map((level,i)=>{
    const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0');b.title=level.title;b.setAttribute('aria-label',`Experiment ${i+1}: ${level.title}`);b.onclick=()=>load(i);$('level-buttons').append(b);return b;
  });
  function progress(){
    $('progress').textContent=`${model.completed.size} / ${levels.length} solved`;
    levelButtons.forEach((b,i)=>{b.classList.toggle('active',i===model.index);b.classList.toggle('solved',model.completed.has(i));b.setAttribute('aria-current',i===model.index?'step':'false');b.setAttribute('aria-label',`Experiment ${i+1}: ${levels[i].title}${model.completed.has(i)?', solved':''}`);});
  }
  function load(i){
    if(guess.open)guess.close();
    model.load(i);if(reduced)model.playing=false;cachedTime=-1;keys.clear();hold=0;
    $('chapter').textContent=`${String(i+1).padStart(2,'0')} / ${model.level.chapter}`;$('level-title').textContent=model.level.title;$('clue').textContent=model.level.clue;
    $('result').hidden=true;$('choices').replaceChildren();$('submit').disabled=true;$('submit').textContent='Choose a solid above';
    $('ready').hidden=false;
    progress();dirty=choiceDirty=true;sync();
  }
  function openGuess(){
    if(!model.beginGuess())return;
    keys.clear();hold=0;candidateYaw=.72;$('candidate-angle').value=41;
    $('choices').replaceChildren();$('submit').disabled=true;$('submit').textContent='Choose a solid above';
    for(const [index,id] of model.level.options.entries()){
      const b=document.createElement('button');b.className='choice';b.dataset.shape=id;b.setAttribute('aria-pressed','false');
      b.setAttribute('aria-label',`Choose ${G.shapes[id].name}`);
      const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');
      const info=document.createElement('span');info.className='choice-text';
      const letter=document.createElement('span');letter.className='choice-letter';letter.textContent=`HYPOTHESIS ${String.fromCharCode(65+index)}`;
      const name=document.createElement('span');name.className='choice-name';name.textContent=G.shapes[id].name;
      info.append(letter,name);const radio=document.createElement('span');radio.className='choice-radio';radio.setAttribute('aria-hidden','true');b.append(c,info,radio);
      b.onclick=()=>{model.select(id);for(const el of $('choices').children){el.classList.toggle('selected',el.dataset.shape===id);el.setAttribute('aria-pressed',String(el.dataset.shape===id));}$('submit').disabled=false;$('submit').textContent='Reveal the answer →';};
      $('choices').append(b);
    }
    guess.showModal();guess.scrollTop=0;sync();dirty=choiceDirty=true;
  }
  function clearGuess(){model.endGuess();$('choices').replaceChildren();choiceDirty=false;}
  $('ready').onclick=openGuess;
  $('close-guess').onclick=$('back-observe').onclick=()=>{guess.close();clearGuess();};
  guess.addEventListener('close',clearGuess);
  guess.addEventListener('cancel',clearGuess);
  $('candidate-angle').oninput=e=>{candidateYaw=Number(e.target.value)*Math.PI/180;choiceDirty=true;};
  function sync(){
    $('timeline').value=Math.round(model.time*1000);$('time-value').textContent=`${Math.round(model.time*100)}%`;
    const degrees=Math.round(model.angle*180/Math.PI)%360;$('angle').value=degrees;$('angle-value').textContent=`${degrees}°`;
    $('time-status').textContent=model.playing?(model.direction>0?'TIME FLOWING':'TIME REVERSING'):(model.time===0||model.time===1?'PASSAGE ENDED':'TIME FROZEN');
    $('time-status').classList.toggle('paused',!model.playing);$('play').textContent=model.playing?'Ⅱ Freeze time':'▶ Play forward';
    $('rewind').setAttribute('aria-pressed',String(model.playing&&model.direction===-1));
  }
  $('timeline').oninput=e=>{model.scrub(Number(e.target.value)/1000);dirty=true;sync();};
  $('angle').oninput=e=>{model.angle=Number(e.target.value)*Math.PI/180;dirty=true;sync();};
  $('play').onclick=()=>{if(model.playing)model.playing=false;else model.play(1);dirty=true;sync();};
  $('rewind').onclick=()=>{model.play(-1);dirty=true;sync();};
  $('restart').onclick=()=>{model.time=0;model.play(1);dirty=true;sync();};
  $('speed').onchange=e=>model.speed=Number(e.target.value);
  for(const [id,direction] of [['orbit-left',-1],['orbit-right',1]]){
    const b=$(id);b.onpointerdown=e=>{if(e.button!==0)return;b.setPointerCapture(e.pointerId);hold=direction;model.move(direction*.035);dirty=true;};
    const release=()=>hold=0;b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;
    b.onclick=e=>{if(e.detail===0){model.move(direction*Math.PI/18);dirty=true;sync();}};
  }
  $('submit').onclick=()=>{
    if(!model.answer())return;
    try{localStorage.setItem(storageKey,model.save());}catch{}
    guess.close();clearGuess();$('ready').hidden=true;
    $('result-label').textContent=model.correct?'HYPOTHESIS CONFIRMED':'A NEW WAY TO SEE IT';
    $('result-title').textContent=`${model.correct?'Confirmed':'Revealed'}: ${G.shapes[model.level.answer].name}.`;
    $('explanation').textContent=G.shapes[model.level.answer].explanation;
    $('next').textContent=model.index===levels.length-1?'Back to first experiment →':'Next experiment →';
    // Preserve the observed moment, except an empty endpoint needs a useful initial reveal.
    if(G.slice(G.shapes[model.level.answer].mesh,G.timeToZ(model.time)).length===0)model.scrub(.5);
    $('result').hidden=false;revealYaw=.72;revealPitch=.48;progress();sync();dirty=true;
    $('result-title').focus({preventScroll:true});$('result').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  };
  $('next').onclick=()=>{load((model.index+1)%levels.length);$('level-title').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});};
  $('retry').onclick=()=>{load(model.index);$('level-title').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});};
  const help=$('help-dialog');$('help').onclick=()=>{model.playing=false;keys.clear();hold=0;sync();help.showModal();};
  $('close-help').onclick=$('begin').onclick=()=>help.close();
  help.onclick=e=>{if(e.target===help){const r=help.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)help.close();}};
  document.addEventListener('keydown',e=>{
    if(guess.open||help.open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.target.tagName==='BUTTON'&&(e.code==='Space'||e.code==='Enter'))return;
    if(['ArrowLeft','ArrowRight','KeyA','KeyD','Space','KeyR','BracketLeft','BracketRight'].includes(e.code))e.preventDefault();
    if(e.code==='Space'&&!e.repeat)model.toggle();
    else if(e.code==='KeyR'&&!e.repeat)model.play(-1);
    else if(e.code==='BracketLeft')model.scrub(model.time-.01);
    else if(e.code==='BracketRight')model.scrub(model.time+.01);
    else keys.add(e.code);
    dirty=true;sync();
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  function suspend(){keys.clear();hold=0;model.playing=false;dirty=true;sync();}
  window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
  window.addEventListener('resize',()=>{dirty=choiceDirty=true;});
  const reveal=$('reveal');reveal.onpointerdown=e=>{reveal.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};};
  reveal.onpointermove=e=>{if(!drag)return;revealYaw-=(e.clientX-drag.x)*.008;revealPitch=Math.max(.12,Math.min(1.2,revealPitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};dirty=true;};
  reveal.onpointerup=reveal.onpointercancel=reveal.onlostpointercapture=()=>drag=null;
  function frame(now){
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    const movement=hold+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
    if(movement){model.move(movement*dt*1.15);dirty=true;}
    if(model.playing){model.tick(dt);dirty=true;}
    if(dirty){
      if(cachedTime!==model.time){segments=G.slice(G.shapes[model.level.answer].mesh,G.timeToZ(model.time));cachedTime=model.time;}
      const width=R.vision($('vision'),segments,model.angle);$('view-readout').textContent=`Visible coverage ${width.toFixed(1)}°`;
      if(model.revealed)R.solid(reveal,G.shapes[model.level.answer].mesh,{yaw:revealYaw,pitch:revealPitch,z:G.timeToZ(model.time),observer:model.angle});
      sync();dirty=false;
    }
    if(choiceDirty&&guess.open){for(const b of $('choices').children)R.solid(b.querySelector('canvas'),G.shapes[b.dataset.shape].mesh,{yaw:candidateYaw});choiceDirty=false;}
    requestAnimationFrame(frame);
  }
  load(0);requestAnimationFrame(frame);
})();
