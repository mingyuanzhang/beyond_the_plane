(function(root){
  'use strict';
  const G=root.BTPGeometry;
  function context(canvas){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return {ctx,w,h};
  }
  function vision(canvas,segments,angle){
    const {ctx,w,h}=context(canvas),margin=24,width=w-margin*2,y=h*.48;
    ctx.strokeStyle='#293c44';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(w-margin,y);ctx.stroke();
    const ticks=12;
    for(let i=0;i<=ticks;i++){const x=margin+width*i/ticks;ctx.beginPath();ctx.moveTo(x,y+28);ctx.lineTo(x,y+28+(i%3===0?7:3));ctx.stroke();}
    ctx.font='9px ui-monospace, monospace';ctx.fillStyle='#91a7ad';ctx.textAlign='center';
    ctx.fillText('−45°',margin+10,y+53);ctx.fillText('0°',w/2,y+53);ctx.fillText('+45°',w-margin-10,y+53);
    const count=Math.max(180,Math.min(720,Math.ceil(width))),rays=G.observe(segments,angle,count);
    let hits=0;
    for(let i=0;i<count;i++){
      const hit=rays[i];if(!hit)continue;hits++;
      const b=hit.brightness;ctx.fillStyle=`rgb(${Math.round(153*b)},${Math.round(235*b)},${Math.round(204*b)})`;
      const left=Math.round(margin+i*width/count),right=Math.round(margin+(i+1)*width/count);
      ctx.fillRect(left,Math.round(y)-6,right-left,12);
    }
    if(!hits){ctx.fillStyle='#a1b1b5';ctx.font='11px system-ui';ctx.fillText(segments.length?'No visible edge at this angle':'Nothing intersects your world at this moment',w/2,y-25);}
    ctx.fillStyle='#8ba09f';ctx.font='8px system-ui';ctx.fillText('THE VISIBLE EDGE',w/2,23);
    return hits/count*90;
  }
  function solid(canvas,m,{yaw=.72,pitch=.42,z=null,observer=0}={}){
    const {ctx,w,h}=context(canvas),reveal=z!==null,scale=Math.min(w/(reveal?6.5:3.8),h/(reveal?4.8:3.2));
    const eye=[Math.cos(yaw)*Math.cos(pitch),Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch)];
    const right=[-Math.sin(yaw),Math.cos(yaw),0],up=G.cross(eye,right);
    const project=p=>[w/2+G.dot(p,right)*scale,h*.49-G.dot(p,up)*scale,G.dot(p,eye)];
    const offset=p=>[p[0],p[1],p[2]-(reveal?z:0)];
    const vertices=m.vertices.map(p=>project(offset(p))),polygons=[];
    const light=G.norm([-.4,-.65,1]);
    for(let i=0;i<m.faces.length;i++){
      const f=m.faces[i],pts=f.map(j=>vertices[j]),n=m.normals[i];
      // Two-sided shading keeps the renderer independent of mesh winding.
      const intensity=.40+.60*Math.abs(G.dot(n,light));
      polygons.push({pts,depth:pts.reduce((s,p)=>s+p[2],0)/3,fill:`rgb(${Math.round(112*intensity)},${Math.round(194*intensity)},${Math.round(169*intensity)})`});
    }
    if(reveal){const pts=[[-1.8,-1.8,0],[1.8,-1.8,0],[1.8,1.8,0],[-1.8,1.8,0]].map(project);polygons.push({pts,depth:0,fill:'rgba(239,189,123,.16)',stroke:'rgba(239,189,123,.65)'});}
    polygons.sort((a,b)=>a.depth-b.depth);
    for(const p of polygons){ctx.beginPath();p.pts.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fillStyle=p.fill;ctx.fill();ctx.strokeStyle=p.stroke||p.fill;ctx.lineWidth=p.stroke?1:.5;ctx.stroke();}
    if(reveal){
      // Highlight the whole slice as an explanatory x-ray contour after answering.
      ctx.strokeStyle='#d4ffe9';ctx.lineWidth=2.3;ctx.beginPath();
      for(const s of G.slice(m,z)){const a=project([...s.a,0]),b=project([...s.b,0]);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}ctx.stroke();
      const pos=[Math.cos(observer)*2.3,Math.sin(observer)*2.3,0],p=project(pos),center=project([0,0,0]);
      ctx.setLineDash([3,5]);ctx.strokeStyle='#efbd7b88';ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(center[0],center[1]);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#efbd7b';ctx.beginPath();ctx.arc(p[0],p[1],4,0,G.TAU);ctx.fill();ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText('YOU · direction',p[0],p[1]+17);
    }else{
      ctx.strokeStyle='#839a9c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w-9,12);ctx.lineTo(w-9,28);ctx.lineTo(w-12,24);ctx.moveTo(w-9,28);ctx.lineTo(w-6,24);ctx.stroke();
    }
  }
  root.BTPRender={vision,solid};
})(globalThis);
