const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../src/geometry.js');
const {Model,levels}=require('../src/model.js');
const extent=segments=>Math.max(...segments.flatMap(s=>[Math.hypot(...s.a),Math.hypot(...s.b)]));
test('sphere slices follow sqrt(1-z²), including vertex-aligned slices',()=>{
  for(const z of [-.9,-.5,0,.5,.9]){const segs=G.slice(G.shapes.sphere.mesh,z);assert.ok(segs.length>20);assert.ok(Math.abs(extent(segs)-Math.sqrt(1-z*z))<.006);}
  assert.equal(G.slice(G.shapes.sphere.mesh,1.1).length,0);
});
test('cube slices stay square; cone slices steadily narrow',()=>{
  for(const z of [-.8,0,.8]){const segs=G.slice(G.shapes.cube.mesh,z);assert.equal(segs.length,8);for(const s of segs)for(const [x,y] of [s.a,s.b])assert.ok(Math.abs(Math.abs(x)-.9)<1e-8||Math.abs(Math.abs(y)-.9)<1e-8);}
  const radii=[-.8,0,.8].map(z=>extent(G.slice(G.shapes.cone.mesh,z)));assert.ok(radii[0]>radii[1]&&radii[1]>radii[2]);
});
test('raycaster returns nearest boundary and ignores geometry behind observer',()=>{
  const seg=x=>({a:[x,-1],b:[x,1],normal:[1,0,0]});
  assert.equal(G.raycast([seg(3),seg(-1),seg(1)],[0,0],[1,0]).distance,1);
  assert.equal(G.raycast([seg(-1)],[0,0],[1,0]),null);
});
test('standing torus has a visible central gap from the side and occlusion end-on',()=>{
  const s=G.slice(G.shapes.torus.mesh,0);
  assert.equal(G.raycast(s,[0,4.2],[0,-1]),null);
  assert.ok(G.raycast(s,[4.2,0],[-1,0]));
  assert.ok(s.length>0);
});
test('every shape enters and leaves the timeline and stays inside the observer orbit',()=>{
  for(const shape of Object.values(G.shapes)){
    assert.equal(G.slice(shape.mesh,G.timeToZ(0)).length,0,shape.name);
    assert.equal(G.slice(shape.mesh,G.timeToZ(1)).length,0,shape.name);
    for(const v of shape.mesh.vertices){assert.ok(v.every(Number.isFinite));assert.ok(Math.hypot(v[0],v[1])<G.RADIUS);}
  }
});
test('every candidate pair is distinguishable using available time and viewpoints',()=>{
  const signatures=new Map();
  for(const id of Object.keys(G.shapes)){
    const values=[];
    for(const t of [.2,.32,.42,.5,.62,.76])for(const angle of [0,.45,.9,1.57]){
      const observations=G.observe(G.slice(G.shapes[id].mesh,G.timeToZ(t)),angle,100);
      values.push(...observations.map(hit=>hit?hit.brightness:0));
    }
    signatures.set(id,values);
  }
  for(const level of levels)for(let a=0;a<level.options.length;a++)for(let b=a+1;b<level.options.length;b++){
    const x=signatures.get(level.options[a]),y=signatures.get(level.options[b]);
    const difference=x.reduce((sum,v,i)=>sum+Math.abs(v-y[i]),0)/x.length;
    assert.ok(difference>.01,`${level.title}: ${level.options[a]} and ${level.options[b]} too similar (${difference})`);
  }
});
test('freeze allows movement; scrubbing never rewinds the observer',()=>{
  const m=new Model();m.scrub(.5);m.move(1.2);m.tick(.1);assert.equal(m.time,.5);assert.ok(Math.abs(m.angle-1.2)<1e-10);m.scrub(.2);assert.ok(Math.abs(m.angle-1.2)<1e-10);
});
test('forward/reverse stop at boundaries and can restart; all controls work on level one',()=>{
  const m=new Model();m.scrub(.999);m.play(1);m.tick(.1);assert.equal(m.time,1);assert.equal(m.playing,false);
  m.play(-1);m.tick(.1);assert.ok(m.time<1);m.scrub(.001);m.play(-1);m.tick(.1);assert.equal(m.time,0);assert.equal(m.playing,false);m.play(1);m.tick(.1);assert.ok(m.time>0);
});
test('fifteen distinct experiments have valid, unambiguous candidate sets',()=>{
  assert.equal(levels.length,15);assert.equal(new Set(levels.map(l=>l.answer)).size,15);
  for(const [index,level] of levels.entries()){
    assert.ok(level.options.includes(level.answer));assert.equal(new Set(level.options).size,level.options.length);
    assert.equal(level.options.length,index<2?3:index<10?4:index===14?6:5);
    for(const id of level.options)assert.ok(G.shapes[id],id);
  }
});
test('guessing is explicit, freezes time, and can be cancelled without losing the viewpoint',()=>{
  const m=new Model();m.scrub(.43);m.move(1.2);m.play();m.select(m.level.answer);
  assert.equal(m.selected,null);assert.equal(m.answer(),false);assert.equal(m.guessing,false);
  m.beginGuess();assert.equal(m.playing,false);m.select(m.level.answer);assert.equal(m.selected,'cone');
  m.endGuess();assert.equal(m.guessing,false);assert.equal(m.selected,null);assert.equal(m.revealed,false);assert.equal(m.time,.43);assert.ok(Math.abs(m.angle-1.2)<1e-10);
  m.beginGuess();assert.equal(m.answer(),false);m.load(1);assert.equal(m.guessing,false);
});
test('answer locking, retries, and completion survive the new guessing phase',()=>{
  const m=new Model();m.beginGuess();m.select('missing');assert.equal(m.selected,null);
  m.select(m.level.answer);assert.equal(m.answer(),true);assert.equal(m.correct,true);assert.ok(m.completed.has(0));m.select('pyramid');assert.equal(m.selected,'cone');assert.equal(m.answer(),false);assert.equal(m.beginGuess(),false);
  m.load(1);m.beginGuess();m.select('cylinder');m.answer();assert.equal(m.correct,false);assert.equal(m.completed.has(1),false);m.load(1);assert.equal(m.revealed,false);assert.equal(m.selected,null);
});
test('stable progress IDs keep solved puzzles that survive the reordering',()=>{
  const m=new Model();m.restoreLegacy('[2,7,999,-1,"2",null]');assert.deepEqual([...m.completed],[0]);
  m.restore('["cone","linkedRings","sphere","missing",999,null]');assert.deepEqual([...m.completed],[0,5]);
  const saved=m.save(),restored=new Model();restored.restore(saved);assert.deepEqual([...restored.completed],[0,5]);
  m.restore('garbage');assert.deepEqual([...m.completed],[0,5]);
});
