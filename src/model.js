(function(root){
  'use strict';
  const levels=[
    {
      "title": "Down to a point",
      "chapter": "WARM-UP",
      "answer": "cone",
      "options": [
        "pyramid",
        "cone",
        "cylinder"
      ],
      "clue": "Watch one full passage, then freeze a moment and circle it. Build a mental picture before guessing."
    },
    {
      "title": "Almost familiar",
      "chapter": "WARM-UP",
      "answer": "hexPrism",
      "options": [
        "octPrism",
        "cylinder",
        "hexPrism"
      ],
      "clue": "Compare the same moment from several viewpoints. Then check whether your explanation fits the whole passage."
    },
    {
      "title": "A quiet turn",
      "chapter": "WARM-UP",
      "answer": "twistedPrism",
      "options": [
        "twistedPrism",
        "counterTwist",
        "skewPrism",
        "twistedTaper"
      ],
      "clue": "Compare arrival, middle, and departure. Follow the position of each visible edge as well as its width."
    },
    {
      "title": "An opening elsewhere",
      "chapter": "WARM-UP",
      "answer": "tiltedRing",
      "options": [
        "ellipticRing",
        "thickRing",
        "tiltedRing",
        "torus"
      ],
      "clue": "Take your time. A convincing explanation must account for every moment and every viewpoint."
    },
    {
      "title": "Follow the same edge",
      "chapter": "WARM-UP",
      "answer": "twistedTrefoil",
      "options": [
        "counterTrefoil",
        "trefoilColumn",
        "taperTrefoil",
        "twistedTrefoil"
      ],
      "clue": "Take your time. A convincing explanation must account for every moment and every viewpoint."
    },
    {
      "title": "Beyond the obvious",
      "chapter": "ASSEMBLIES",
      "answer": "linkedRings",
      "options": [
        "parallelRings",
        "linkedRings",
        "offsetRings",
        "separateRings"
      ],
      "clue": "Count the separate pieces at each moment, and note when they appear, merge, and vanish. Then walk around to find which pieces sit in front."
    },
    {
      "title": "Around and around",
      "chapter": "ASSEMBLIES",
      "answer": "spring",
      "options": [
        "tightSpring",
        "doubleHelix",
        "spring",
        "twistedTrefoil"
      ],
      "clue": "Count the separate pieces at each moment, and note when they appear, merge, and vanish. Then walk around to find which pieces sit in front."
    },
    {
      "title": "Bare bones",
      "chapter": "ASSEMBLIES",
      "answer": "cubeFrame",
      "options": [
        "prismFrame",
        "cubeFrame",
        "octaFrame",
        "tiltedCubeFrame"
      ],
      "clue": "Count the separate pieces at each moment, and note when they appear, merge, and vanish. Then walk around to find which pieces sit in front."
    },
    {
      "title": "Something in orbit",
      "chapter": "ASSEMBLIES",
      "answer": "ringedPlanet",
      "options": [
        "flatPlanet",
        "uprightPlanet",
        "twinMoons",
        "ringedPlanet"
      ],
      "clue": "Count the separate pieces at each moment, and note when they appear, merge, and vanish. Then walk around to find which pieces sit in front."
    },
    {
      "title": "Strength in numbers",
      "chapter": "ASSEMBLIES",
      "answer": "ringChain",
      "options": [
        "ringChain",
        "ringRow",
        "flatEndChain",
        "ringStack"
      ],
      "clue": "Count the separate pieces at each moment, and note when they appear, merge, and vanish. Then walk around to find which pieces sit in front."
    },
    {
      "title": "The other hand",
      "chapter": "MIRRORS & KNOTS",
      "answer": "leftSpring",
      "options": [
        "spring",
        "leftTightSpring",
        "leftSpring",
        "doubleHelix",
        "tightSpring"
      ],
      "clue": "Some candidates are mirror images of one another. Step forward through time and note which way each piece drifts across your view, then check the same moment from a second side."
    },
    {
      "title": "Turning the other way",
      "chapter": "MIRRORS & KNOTS",
      "answer": "mirrorTrefoil",
      "options": [
        "twistedTrefoil",
        "mirrorTrefoil",
        "counterTrefoil",
        "taperTrefoil",
        "mirrorTaperTrefoil"
      ],
      "clue": "Some candidates are mirror images of one another. Step forward through time and note which way each piece drifts across your view, then check the same moment from a second side."
    },
    {
      "title": "Tied up",
      "chapter": "MIRRORS & KNOTS",
      "answer": "trefoilKnot",
      "options": [
        "wavyLoop",
        "cinquefoilKnot",
        "trefoilKnot",
        "torus",
        "linkedRings"
      ],
      "clue": "Count the separate pieces at each moment, and note when they appear, merge, and vanish. Then walk around to find which pieces sit in front."
    },
    {
      "title": "Inseparable",
      "chapter": "MIRRORS & KNOTS",
      "answer": "borromean",
      "options": [
        "ovalTriad",
        "ringChain",
        "borromean",
        "flatEndChain",
        "ringStack"
      ],
      "clue": "Count the separate pieces at each moment, and note when they appear, merge, and vanish. Then walk around to find which pieces sit in front."
    },
    {
      "title": "Through the looking glass",
      "chapter": "MIRRORS & KNOTS",
      "answer": "mirrorKnot",
      "options": [
        "trefoilKnot",
        "cinquefoilKnot",
        "wavyLoop",
        "mirrorKnot",
        "tiltedKnot",
        "tiltedMirrorKnot"
      ],
      "clue": "Some candidates are mirror images of one another. Step forward through time and note which way each piece drifts across your view, then check the same moment from a second side."
    }
  ];
  class Model {
    constructor(){this.speed=1;this.angle=0;this.completed=new Set();this.load(0);}
    load(index){this.index=index;this.time=.08;this.angle=0;this.playing=true;this.direction=1;this.selected=null;this.guessing=false;this.revealed=false;this.correct=false;}
    get level(){return levels[this.index];}
    beginGuess(){if(this.revealed)return false;this.guessing=true;this.playing=false;this.selected=null;return true;}
    endGuess(){this.guessing=false;if(!this.revealed)this.selected=null;}
    select(id){if(this.guessing&&!this.revealed&&this.level.options.includes(id))this.selected=id;}
    answer(){if(!this.guessing||!this.selected||this.revealed)return false;this.correct=this.selected===this.level.answer;this.revealed=true;this.guessing=false;this.playing=false;if(this.correct)this.completed.add(this.index);return true;}
    scrub(time){this.time=Math.min(1,Math.max(0,time));this.playing=false;}
    move(delta){this.angle=((this.angle+delta)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);}
    play(direction=this.direction){this.direction=direction;if(direction>0&&this.time>=1)this.time=0;if(direction<0&&this.time<=0)this.time=1;this.playing=true;}
    toggle(){if(this.playing)this.playing=false;else this.play();}
    tick(dt){if(!this.playing)return;this.time=Math.max(0,Math.min(1,this.time+Math.min(dt,.1)*this.direction*this.speed/16));if(this.time===0||this.time===1)this.playing=false;}
    save(){return JSON.stringify([...this.completed].map(i=>levels[i].answer));}
    restore(raw){try{const ids=JSON.parse(raw);if(Array.isArray(ids))this.completed=new Set(ids.map(id=>levels.findIndex(level=>level.answer===id)).filter(i=>i>=0));}catch{}}
    restoreLegacy(raw){try{const old=['sphere','cube','cone','cylinder','pyramid','ellipsoid','tiltedCube','torus','dumbbell'];const ids=JSON.parse(raw);if(Array.isArray(ids))this.restore(JSON.stringify(ids.filter(i=>Number.isInteger(i)&&i>=0&&i<old.length).map(i=>old[i])));}catch{}}

  }
  const api={levels,Model};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BTPModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
