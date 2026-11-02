/* Shared triangle meshes drive candidates, cross-sections, vision and reveals. */
(function(root) {
  'use strict';
  const TAU = Math.PI * 2, EPS = 1e-8;
  const sub = (a,b) => a.map((v,i)=>v-b[i]);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
  const norm = a => { const l=Math.hypot(...a)||1; return a.map(v=>v/l); };
  function mesh(vertices, faces) {
    return {vertices, faces, normals:faces.map(f=>norm(cross(sub(vertices[f[1]],vertices[f[0]]),sub(vertices[f[2]],vertices[f[0]]))))};
  }
  function parametric(fn, rows=32, cols=48) {
    const v=[], f=[];
    for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++) v.push(fn(j/rows,i/cols));
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) {
      const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
      f.push([a,c,b],[b,c,d]);
    }
    return mesh(v,f);
  }
  function revolve(profile, sides=48) {
    const v=[],f=[];
    for(const [z,r] of profile) for(let i=0;i<sides;i++) v.push([r*Math.cos(i*TAU/sides),r*Math.sin(i*TAU/sides),z]);
    for(let j=0;j<profile.length-1;j++) for(let i=0;i<sides;i++) {
      const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;
      f.push([a,b,c],[b,d,c]);
    }
    return mesh(v,f);
  }
  function transform(m, fn) { return mesh(m.vertices.map(fn),m.faces); }
  function rotate(m, ax=0, ay=0, az=0) {
    return transform(m, ([x,y,z])=>{
      [y,z]=[y*Math.cos(ax)-z*Math.sin(ax),y*Math.sin(ax)+z*Math.cos(ax)];
      [x,z]=[x*Math.cos(ay)+z*Math.sin(ay),-x*Math.sin(ay)+z*Math.cos(ay)];
      return [x*Math.cos(az)-y*Math.sin(az),x*Math.sin(az)+y*Math.cos(az),z];
    });
  }
  const box = mesh([[-.9,-.9,-.9],[.9,-.9,-.9],[.9,.9,-.9],[-.9,.9,-.9],[-.9,-.9,.9],[.9,-.9,.9],[.9,.9,.9],[-.9,.9,.9]],[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]);
  const sphere = parametric((u,v)=>[Math.sin(u*Math.PI)*Math.cos(v*TAU),Math.sin(u*Math.PI)*Math.sin(v*TAU),-Math.cos(u*Math.PI)]);
  const torus = parametric((u,v)=>[(.9+.32*Math.cos(v*TAU))*Math.cos(u*TAU),.32*Math.sin(v*TAU),(.9+.32*Math.cos(v*TAU))*Math.sin(u*TAU)],48,24);
  const dumbbellProfile = [];
  for(let i=0;i<=48;i++) {
    const z=-1.35+i*2.7/48;
    const r=Math.max(.22,Math.sqrt(Math.max(0,.65**2-(Math.abs(z)-.7)**2)));
    dumbbellProfile.push([z,i===0||i===48?0:r]);
  }
  const shapes = {
    sphere:{name:'Sphere',mesh:sphere,explanation:'A sphere leaves circular slices that grow, then shrink. At a frozen moment, the strip stays the same width as you walk around it.'},
    cube:{name:'Cube',mesh:box,explanation:'This upright cube leaves the same square throughout its passage. Freeze it and walk: the apparent width and face shading change as you pass its corners.'},
    cone:{name:'Cone',mesh:revolve([[-1.1,0],[-1.1,1],[1.1,0]]),explanation:'The cone enters broad end first. Its circular slice steadily narrows toward the tip. Walking around any one slice preserves its width.'},
    cylinder:{name:'Cylinder',mesh:revolve([[-1.1,0],[-1.1,.88],[1.1,.88],[1.1,0]]),explanation:'The cylinder leaves equal circular slices from its arrival until its departure. Both time and your position leave the strip width unchanged while it intersects your world.'},
    pyramid:{name:'Square pyramid',mesh:rotate(revolve([[-1.1,0],[-1.1,1.27],[1.1,0]],4),0,0,Math.PI/4),explanation:'The pyramid leaves shrinking squares. Its width changes through time, and walking around a frozen slice reveals corners: evidence that separates it from a cone.'},
    ellipsoid:{name:'Ellipsoid',mesh:transform(sphere,([x,y,z])=>[x*1.3,y*.62,z*1.1]),explanation:'This stretched sphere leaves ellipses. Each slice grows and shrinks, but its width also changes when you walk from the long side to the short side.'},
    tiltedCube:{name:'Tilted cube',mesh:rotate(box,.48,.53,.18),explanation:'The tilted cube cuts the plane at changing angles. Its polygonal slices grow, change their edges, then shrink. Inspect several moments to distinguish it from the upright solids.'},
    torus:{name:'Standing ring',mesh:torus,explanation:'This standing ring begins as a small slice, separates into two pieces, and joins again before leaving. Walk around the middle slice: the pieces can overlap in your view, hiding the gap.'},
    dumbbell:{name:'Dumbbell',mesh:revolve(dumbbellProfile),explanation:'Two rounded ends are connected by a narrow neck. The strip swells, narrows, swells again, then disappears. Each frozen slice is circular, so time reveals what walking alone cannot.'},
    hourglass:{name:'Hourglass',mesh:revolve([[-1.25,0],[-1.25,.9],[0,.22],[1.25,.9],[1.25,0]]),explanation:'The hourglass enters wide, narrows to a waist, and widens before leaving. Unlike the dumbbell, its broad flat ends appear and disappear abruptly.'}
  };
  // A capped stack of polygon rings supports skew, twist, lobes and changing profiles.
  function loft(sides, steps, point) {
    const vertices=[],faces=[];
    for(let j=0;j<=steps;j++)for(let i=0;i<sides;i++)vertices.push(point(i*TAU/sides,j/steps));
    for(let j=0;j<steps;j++)for(let i=0;i<sides;i++){
      const a=j*sides+i,b=j*sides+(i+1)%sides,c=a+sides,d=b+sides;
      faces.push([a,b,c],[b,d,c]);
    }
    for(const j of [0,steps]){
      const center=[0,0,0];for(let i=0;i<sides;i++)for(let k=0;k<3;k++)center[k]+=vertices[j*sides+i][k]/sides;
      const index=vertices.push(center)-1;
      for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;faces.push(j===0?[index,b,a]:[index,a,b]);}
    }
    return mesh(vertices,faces);
  }
  function column({sides=48,twist=t=>0,radius=(a,t)=>.85,center=t=>[0,0],height=2.2}={}){
    return loft(sides,40,(a,t)=>{const r=radius(a,t),turn=a+twist(t),c=center(t);return [c[0]+r*Math.cos(turn),c[1]+r*Math.sin(turn),(t-.5)*height];});
  }
  function combine(...meshes){
    const vertices=[],faces=[];
    for(const m of meshes){const offset=vertices.length;vertices.push(...m.vertices);faces.push(...m.faces.map(f=>f.map(i=>i+offset)));}
    return mesh(vertices,faces);
  }
  const translate=(m,x,y,z)=>transform(m,p=>[p[0]+x,p[1]+y,p[2]+z]);
  function ring(radius=.9,tube=.32){return parametric((u,v)=>[(radius+tube*Math.cos(v*TAU))*Math.cos(u*TAU),tube*Math.sin(v*TAU),(radius+tube*Math.cos(v*TAU))*Math.sin(u*TAU)],48,24);}
  const add=(id,name,m,explanation)=>shapes[id]={name,mesh:m,explanation};
  const squareColumn=options=>rotate(column({sides:4,radius:()=>1.05,...options}),0,0,Math.PI/4);
  add('hexPrism','Hexagonal prism',column({sides:6,radius:()=>.96}), 'Equal hexagonal slices persist through time. Walking reveals six repeating face transitions, compared with the smoother cylinder and the eight-sided prism.');
  add('octPrism','Octagonal prism',column({sides:8,radius:()=>.96}), 'The slices are constant octagons. A slow orbit reveals eight face transitions, even though the width is close to a cylinder.');
  add('frustum','Truncated cone',revolve([[-1.1,0],[-1.1,1],[1.1,.42],[1.1,0]]), 'Circular slices narrow steadily but never reach a tip: the small flat end leaves abruptly. This separates a truncated cone from a full cone.');
  add('pyramidFrustum','Truncated pyramid',rotate(revolve([[-1.1,0],[-1.1,1.27],[1.1,.53],[1.1,0]],4),0,0,Math.PI/4), 'Square slices shrink to a smaller square before vanishing. Orbiting a frozen slice reveals the corners that a truncated cone lacks.');
  add('doubleCone','Double cone',revolve([[-1.1,0],[0,1],[1.1,0]]), 'Circular slices expand linearly to a wide middle, then contract linearly. Every frozen slice is rotationally symmetric.');
  add('bipyramid','Square bipyramid',rotate(revolve([[-1.1,0],[0,1.27],[1.1,0]],4),0,0,Math.PI/4), 'Squares grow from a point and shrink back to a point. A frozen orbit distinguishes these corners from the double cone; time distinguishes it from a one-sided pyramid.');
  add('skewPrism','Skewed prism',squareColumn({center:t=>[(t-.5)*.85,0]}), 'Each slice is the same square, but its center drifts sideways. Follow the strip position as well as its width to separate a skew from a twist.');
  add('twistedPrism','Twisted prism',squareColumn({twist:t=>(t-.5)*Math.PI*.7}), 'Equal squares turn gradually through the passage. Compare the viewpoint where a flat face looks straight at you at several different times.');
  add('counterTwist','Reversing twist',squareColumn({twist:t=>Math.sin(t*Math.PI)*Math.PI*.7}), 'Square slices rotate one way and then back. Comparing only the first and last slices hides the change in direction in the middle.');
  add('twistedTaper','Twisted taper',squareColumn({radius:(a,t)=>1.15-.5*t,twist:t=>(t-.5)*Math.PI*.7}), 'The square slices both shrink and turn. Separate changes in size from changes in which face is pointing toward you.');
  add('spindle','Rounded spindle',revolve(Array.from({length:49},(_,i)=>{const t=i/48;return [(t-.5)*2.5,.95*Math.sin(Math.PI*t)**.65];})), 'Rounded circular slices swell toward the middle and taper to the ends. There is no narrow waist between separate bulges.');
  add('unequalDumbbell','Unequal dumbbell',transform(shapes.dumbbell.mesh,([x,y,z])=>{const k=.78+.2*z/1.35;return [x*k,y*k,z];}), 'The rounded ends have different sizes. A narrow waist connects them, and reversing the timeline helps compare the two peaks.');
  add('threeBeads','Triple bead',revolve(Array.from({length:73},(_,i)=>{const z=-1.4+i*2.8/72;const r=Math.max(.16,...[-.9,0,.9].map(c=>Math.sqrt(Math.max(0,.5**2-(z-c)**2))));return [z,i===0||i===72?0:r];})), 'Three rounded bulges are joined by narrow necks. Counting the peaks through a complete passage distinguishes it from a dumbbell.');
  const vaseRadius=(a,t)=>.4+.3*Math.sin(Math.PI*t)**2+.12*Math.cos(4*Math.PI*t);
  const vase=column({radius:vaseRadius});
  add('vase','Symmetric vase',vase,'Circular slices change radius around a fixed center. The lip and shoulders produce changes that a simple hourglass does not.');
  add('offcenterVase','Bent vase',column({radius:vaseRadius,center:t=>[.36*Math.sin(t*Math.PI*1.5),.15*Math.sin(t*TAU)]}), 'The radius changes while the slice center follows a curved path. Check both sides of the line and orbit several slices: a straight tilt cannot explain all of the drifting centers.');
  add('tiltedVase','Tilted vase',rotate(vase,0,.4,0), 'A straight vase crosses the plane at a tilt. Its oblique slices change shape and position, unlike the circular slices of a bent vase.');
  add('bellows','Bellows',column({radius:(a,t)=>.62+.2*Math.cos(t*6*Math.PI)}), 'The repeated ridges produce three narrowing-and-widening cycles. The slices stay circular and centered throughout.');
  add('tiltedRing','Tilted ring',rotate(torus,.57,.32,0), 'A tilted ring produces offset pieces whose shapes and spacing evolve through time. Trace the gaps from more than one side to reconstruct the tilted opening.');
  add('ellipticRing','Elliptical ring',transform(torus,([x,y,z])=>[x*1.17,y,z*.85]), 'The loop is stretched sideways and compressed vertically. Its separated middle pieces spread farther apart than those of a circular ring.');
  add('thickRing','Thick ring',ring(.78,.4),'A thicker tube surrounds a smaller hole. The separated slices have a different balance of gap width and visible material from the slender ring.');
  const lobeRadius=(lobes,depth)=>(a,t)=>.72+depth*Math.cos(lobes*a);
  add('trefoilColumn','Three-lobed column',column({sides:72,radius:lobeRadius(3,.24)}), 'A constant three-lobed slice repeats throughout the passage. Walking around it reveals three broad lobes, with concave valleys visible from suitable angles.');
  add('starColumn','Five-point column',column({sides:80,radius:lobeRadius(5,.24)}), 'Five broad points repeat around each slice. The shape stays constant through time; an orbit supplies the missing information.');
  add('flutedColumn','Six-fluted column',column({sides:72,radius:lobeRadius(6,.18)}), 'Six shallow flutes repeat around the slice. Count the repeating changes in edge shading during an orbit rather than relying on one silhouette.');
  add('twistedTrefoil','Twisted three-lobe',column({sides:72,radius:lobeRadius(3,.24),twist:t=>t*Math.PI*.85}), 'The three-lobed slices turn steadily along the solid. Track the same lobe across several moments: looking at just one slice hides the twist.');
  add('counterTrefoil','Reversing three-lobe',column({sides:72,radius:lobeRadius(3,.24),twist:t=>Math.sin(t*Math.PI)*Math.PI*.85}), 'The lobed slices turn and then reverse. A sequence of frozen observations reveals the reversal that a steady twist cannot explain.');
  add('taperTrefoil','Tapered three-lobe',column({sides:72,radius:(a,t)=>(.72+.24*Math.cos(3*a))*(1-.35*t),twist:t=>t*Math.PI*.85}), 'The lobed slices shrink as they turn. Track both the angular pattern and the overall width through time.');
  const smallRing=ring(.65,.12),sideRing=rotate(smallRing,0,0,Math.PI/2);
  const flatRing=rotate(smallRing,Math.PI/2,0,0);
  add('linkedRings','Linked rings',combine(translate(smallRing,-.325,0,0),translate(flatRing,.325,0,0)), 'Two perpendicular rings interlock: one stands upright and the other lies flat, threaded through it. Several separate pieces can hide behind each other; reconstruct their relative positions by combining time with a full orbit.');
  add('parallelRings','Parallel rings',combine(translate(smallRing,0,-.45,0),translate(smallRing,0,.45,0)), 'Two separate parallel rings cross together. Their middle slices can overlap from some viewpoints, but an orbit reveals their parallel arrangement.');
  add('offsetRings','Staggered rings',combine(translate(smallRing,0,-.35,-.4),translate(smallRing,0,.35,.4)), 'The two parallel rings cross at different heights. Their arrivals and departures are staggered, unlike rings that share the same vertical extent.');
  add('separateRings','Perpendicular rings',combine(translate(smallRing,-.65,0,0),translate(sideRing,.65,0,0)), 'Two perpendicular rings are spaced apart rather than linked. Look for the larger separation of their slice groups from several viewpoints.');
  // Tubes swept along space curves support springs, frames, chains and knots.
  function tube(curve,{radius=.13,steps=160,sides=12,closed=true}={}){
    const pts=Array.from({length:steps+1},(_,j)=>curve(j/steps));
    const tangent=j=>{const a=pts[closed?(j-1+steps)%steps:Math.max(0,j-1)],b=pts[closed?(j+1)%steps:Math.min(steps,j+1)];return norm(sub(b,a));};
    let n=norm(cross(tangent(0),Math.abs(tangent(0)[2])<.9?[0,0,1]:[1,0,0]));
    const vertices=[],faces=[],rows=closed?steps:steps+1;
    for(let j=0;j<rows;j++){
      const t=tangent(j);n=norm(sub(n,t.map(v=>v*dot(n,t))));const b=cross(t,n);
      for(let i=0;i<sides;i++){const a=i*TAU/sides;vertices.push(pts[j].map((v,k)=>v+radius*(Math.cos(a)*n[k]+Math.sin(a)*b[k])));}
    }
    for(let j=0;j<(closed?rows:rows-1);j++)for(let i=0;i<sides;i++){
      const nj=(j+1)%rows,a=j*sides+i,b=j*sides+(i+1)%sides,c=nj*sides+i,d=nj*sides+(i+1)%sides;
      faces.push([a,b,c],[b,d,c]);
    }
    if(!closed)for(const j of [0,rows-1]){
      const index=vertices.push(pts[j===0?0:steps].slice())-1;
      for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;faces.push(j===0?[index,b,a]:[index,a,b]);}
    }
    return mesh(vertices,faces);
  }
  const mirror=m=>mesh(m.vertices.map(([x,y,z])=>[-x,y,z]),m.faces.map(([a,b,c])=>[a,c,b]));
  const helix=({turns=2,strands=1,coil=.62,height=2.5,wire=.17,phase=0})=>combine(...Array.from({length:strands},(_,k)=>tube(s=>{const a=s*turns*TAU+k*TAU/strands+phase;return [coil*Math.cos(a),coil*Math.sin(a),(s-.5)*height];},{radius:wire,steps:Math.round(60*turns),closed:false})));
  add('spring','Spring',helix({}), 'A single wire coils upward through two full turns. Each slice is one small blob that circles the center as time passes; follow it to count the turns.');
  add('tightSpring','Tight spring',helix({turns:3}), 'The wire makes three full turns over the same height, so the blob circles the center faster than in a two-turn spring.');
  add('doubleHelix','Double helix',helix({strands:2,wire:.15}), 'Two wires wind around the same axis on opposite sides. Every slice holds two blobs that orbit together, always facing each other across the center.');
  add('leftSpring','Left-handed spring',mirror(helix({})), 'This spring is the mirror image of an ordinary spring. Its slice orbits the center in the opposite direction: note whether the blob drifts left or right in your view as time moves forward.');
  add('leftTightSpring','Left-handed tight spring',mirror(helix({turns:3})), 'A mirror-image spring with three turns. The orbit runs the opposite way to an ordinary spring, and faster than a two-turn coil.');
  const ringIn=(plane,r=.62,w=.11)=>tube(s=>{const a=s*TAU,c=r*Math.cos(a),d=r*Math.sin(a);return plane==='xz'?[c,0,d]:plane==='yz'?[0,c,d]:[c,d,0];},{radius:w,steps:72,sides:10});
  const chainRing=(plane,x)=>translate(ringIn(plane),x,0,0);
  add('ringChain','Three-ring chain',combine(chainRing('xz',-.9),chainRing('xy',0),chainRing('xz',.9)), 'Three rings hang in a chain: the outer two stand upright and the middle one lies flat, threaded through both. The flat ring appears all at once only around the middle moment.');
  add('flatEndChain','Flat-ended chain',combine(chainRing('xy',-.9),chainRing('xz',0),chainRing('xy',.9)), 'Three rings form a chain: the outer two lie flat and the middle one stands upright, threaded through both. Both flat rings cross your world at the same instant.');
  add('ringRow','Row of rings',combine(chainRing('xz',-1.55),chainRing('xy',0),chainRing('xz',1.55)), 'Three rings sit in a row without touching. Their pieces are spread farther apart than in a chain, where each ring threads through its neighbor.');
  add('ringStack','Stacked rings',combine(...[-.6,0,.6].map(y=>translate(ringIn('xz',.62,.11),0,y,0))), 'Three upright rings stand side by side like coins in a rack. From the front they hide one another; from the side they separate into three matching pairs.');
  const frame=(edges,w=.11)=>combine(...edges.map(([a,b])=>tube(s=>a.map((v,k)=>v+(b[k]-v)*s),{radius:w,steps:2,sides:10,closed:false})));
  const cubeCorners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(p=>p.map(v=>v*.78));
  const cubeEdges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].map(([a,b])=>[cubeCorners[a],cubeCorners[b]]);
  add('cubeFrame','Cube frame',frame(cubeEdges), 'Twelve rods outline a cube. Most slices show only four small dots at the corners; the full square outline flashes by only as the top and bottom edges cross your world.');
  add('tiltedCubeFrame','Tilted cube frame',rotate(frame(cubeEdges),.5,.45,.2), 'A tilted wire cube. Rods cross your world at different moments, so the dots appear, slide, and merge in an irregular order rather than all at once.');
  const octa=[[1.15,0,0],[-1.15,0,0],[0,1.15,0],[0,-1.15,0],[0,0,1.3],[0,0,-1.3]];
  add('octaFrame','Octahedron frame',frame([[0,2],[2,1],[1,3],[3,0],...[0,1,2,3].flatMap(i=>[[i,4],[i,5]])].map(([a,b])=>[octa[a],octa[b]])), 'Wire edges outline two pyramids joined at their bases. Four dots spread apart toward the middle, flash into a square, then gather again.');
  const tri=[0,1,2].map(i=>[1.05*Math.cos(i*TAU/3+.3),1.05*Math.sin(i*TAU/3+.3)]);
  add('prismFrame','Triangular frame',frame([...[0,1,2].flatMap(i=>[[[...tri[i],-1],[...tri[(i+1)%3],-1]],[[...tri[i],1],[...tri[(i+1)%3],1]],[[...tri[i],-1],[...tri[i],1]]])]), 'Nine rods outline a triangular prism. Only three dots persist through the middle of the passage, and a triangle flashes by at each end.');
  const planet=sphere=>transform(sphere,([x,y,z])=>[x*.5,y*.5,z*.5]);
  const orbit=(ax,ay)=>rotate(ringIn('xy',1.1,.09),ax,ay,0);
  add('ringedPlanet','Ringed sphere',combine(planet(shapes.sphere.mesh),orbit(.55,.2)), 'A sphere wears a tilted ring. The ring arrives first as two pieces on one side, sweeps across the sphere, and leaves on the other side.');
  add('flatPlanet','Level ringed sphere',combine(planet(shapes.sphere.mesh),orbit(0,0)), 'The ring lies level, so it crosses your world all at once: a single moment when the full circle surrounds the sphere’s widest slice.');
  add('uprightPlanet','Upright ringed sphere',combine(planet(shapes.sphere.mesh),orbit(Math.PI/2,0)), 'The ring stands upright around the sphere. Its two pieces sit on opposite sides throughout, with the sphere’s slice growing and shrinking between them.');
  add('twinMoons','Sphere with two moons',combine(planet(shapes.sphere.mesh),transform(shapes.sphere.mesh,([x,y,z])=>[x*.24+1.05,y*.24,z*.24+.5]),transform(shapes.sphere.mesh,([x,y,z])=>[x*.24-1.05,y*.24,z*.24-.5])), 'Two small moons float on opposite sides of the sphere at different heights. Each appears and vanishes on its own, unlike a continuous ring.');
  const knot=(p,q,w=.13)=>tube(s=>{const a=s*TAU,k=.8+.38*Math.cos(q*a);return [k*Math.cos(p*a),.38*Math.sin(q*a),k*Math.sin(p*a)];},{radius:w,steps:260});
  add('trefoilKnot','Trefoil knot',knot(2,3), 'A single closed tube ties itself in a trefoil knot, standing upright. Its slices break into several pieces that drift around one another as the knot crosses over itself.');
  add('mirrorKnot','Mirror trefoil knot',mirror(knot(2,3)), 'This is the mirror image of the trefoil knot; no rotation turns one into the other. Watch which way the crossing pieces drift as time moves forward, then compare from a second side.');
  add('cinquefoilKnot','Cinquefoil knot',knot(2,5,.11), 'A single tube winds around five times, tying a cinquefoil knot. Its slices carry more pieces than a trefoil, crowding and occluding one another.');
  add('wavyLoop','Wavy loop',tube(s=>{const a=s*TAU;return [.9*Math.cos(a),.32*Math.sin(3*a),.9*Math.sin(a)];},{radius:.15,steps:200}), 'An untied loop weaves forward and back three times. Like a knot, its pieces sway in depth, but there are only ever two of them in a slice.');
  const ellipse=(a,b,plane)=>tube(s=>{const c=a*Math.cos(s*TAU),d=b*Math.sin(s*TAU);return plane==='xy'?[c,d,0]:plane==='yz'?[0,c,d]:[d,0,c];},{radius:.1,steps:120,sides:10});
  add('borromean','Borromean rings',combine(ellipse(1.25,.55,'xy'),ellipse(1.25,.55,'yz'),ellipse(1.25,.55,'xz')), 'Three oval rings lie in three perpendicular planes. No two are linked, yet together they cannot be separated. Each ring meets your world differently: one all at once, one in two pieces that stay fixed, one in pieces that slide apart.');
  add('ovalTriad','Separated ovals',combine(translate(ellipse(1.1,.42,'xy'),0,0,-.9),ellipse(1.1,.42,'yz'),translate(ellipse(1.1,.42,'xz'),0,1.1,0)), 'Three perpendicular ovals float apart without passing through one another. Their pieces never share the center of a slice.');
  add('mirrorTrefoil','Mirrored twisted three-lobe',column({sides:72,radius:lobeRadius(3,.24),twist:t=>-t*Math.PI*.85}), 'The three-lobed slices turn steadily, but the opposite way to the ordinary twisted column. Track one lobe forward through time and note which way it drifts.');
  add('mirrorTaperTrefoil','Mirrored tapered three-lobe',column({sides:72,radius:(a,t)=>(.72+.24*Math.cos(3*a))*(1-.35*t),twist:t=>-t*Math.PI*.85}), 'The lobed slices shrink while turning the opposite way to the tapered three-lobe.');
  add('tiltedKnot','Tilted trefoil knot',rotate(shapes.trefoilKnot.mesh,.6,.35,0), 'The trefoil knot crosses your world at a tilt, so its pieces arrive and leave out of step instead of symmetrically.');
  add('tiltedMirrorKnot','Tilted mirror knot',rotate(shapes.mirrorKnot.mesh,.6,.35,0), 'A tilted mirror-image trefoil. Its pieces arrive out of step, drifting the opposite way to the tilted trefoil.');
  // Half-open edge crossings handle vertices exactly on the slicing plane.
  function slice(m,z) {
    const segments=[];
    for(let k=0;k<m.faces.length;k++) {
      const f=m.faces[k], pts=[];
      for(let i=0;i<3;i++) {
        const a=m.vertices[f[i]],b=m.vertices[f[(i+1)%3]];
        if((a[2]<=z&&b[2]>z)||(b[2]<=z&&a[2]>z)) {
          const t=(z-a[2])/(b[2]-a[2]);
          pts.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
        }
      }
      if(pts.length===2 && Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1])>EPS) segments.push({a:pts[0],b:pts[1],normal:m.normals[k]});
    }
    return segments;
  }
  const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0];
  function raycast(segments, origin, direction) {
    let closest=null;
    for(const segment of segments) {
      const edge=sub(segment.b,segment.a), offset=sub(segment.a,origin), den=cross2(direction,edge);
      if(Math.abs(den)<EPS) continue;
      const t=cross2(offset,edge)/den,u=cross2(offset,direction)/den;
      if(t>EPS&&u>=-EPS&&u<=1+EPS&&(!closest||t<closest.distance)) closest={distance:t,segment};
    }
    return closest;
  }
  const RADIUS=4.2,FOV=Math.PI/2,Z_EXTENT=1.8;
  function observe(segments, angle, count=480) {
    const origin=[RADIUS*Math.cos(angle),RADIUS*Math.sin(angle)];
    return Array.from({length:count},(_,i)=>{
      const bearing=angle+Math.PI+((i+.5)/count-.5)*FOV;
      const dir=[Math.cos(bearing),Math.sin(bearing)];
      const hit=raycast(segments,origin,dir);
      if(!hit) return null;
      const n=hit.segment.normal, planarLength=Math.hypot(n[0],n[1])||1;
      return {distance:hit.distance,brightness:.32+.68*Math.abs((n[0]*dir[0]+n[1]*dir[1])/planarLength)};
    });
  }
  const timeToZ=t=>(t*2-1)*Z_EXTENT;
  const api={TAU,sub,cross,dot,norm,mesh,rotate,shapes,slice,raycast,observe,timeToZ,RADIUS,FOV,Z_EXTENT};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.BTPGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
