(function(root){
  'use strict';
  const levels=[
  {
    "title": "A passing presence",
    "chapter": "FOUNDATIONS",
    "answer": "sphere",
    "options": [
      "cube",
      "sphere",
      "cone"
    ],
    "clue": "Watch one full passage, then freeze a moment and circle it. Build a mental picture before guessing."
  },
  {
    "title": "Around the corner",
    "chapter": "FOUNDATIONS",
    "answer": "cube",
    "options": [
      "cylinder",
      "cone",
      "cube"
    ],
    "clue": "Watch one full passage, then freeze a moment and circle it. Build a mental picture before guessing."
  },
  {
    "title": "Down to a point",
    "chapter": "FOUNDATIONS",
    "answer": "cone",
    "options": [
      "pyramid",
      "cone",
      "cylinder"
    ],
    "clue": "Watch one full passage, then freeze a moment and circle it. Build a mental picture before guessing."
  },
  {
    "title": "A steady presence",
    "chapter": "FOUNDATIONS",
    "answer": "cylinder",
    "options": [
      "sphere",
      "cube",
      "cylinder"
    ],
    "clue": "Watch one full passage, then freeze a moment and circle it. Build a mental picture before guessing."
  },
  {
    "title": "A different kind of point",
    "chapter": "FACETS & PROFILES",
    "answer": "pyramid",
    "options": [
      "cone",
      "pyramid",
      "frustum"
    ],
    "clue": "Watch one full passage, then freeze a moment and circle it. Build a mental picture before guessing."
  },
  {
    "title": "Another side to the story",
    "chapter": "FACETS & PROFILES",
    "answer": "ellipsoid",
    "options": [
      "ellipsoid",
      "sphere",
      "cylinder"
    ],
    "clue": "Compare the same moment from several viewpoints. Then check whether your explanation fits the whole passage."
  },
  {
    "title": "Almost familiar",
    "chapter": "FACETS & PROFILES",
    "answer": "hexPrism",
    "options": [
      "octPrism",
      "cylinder",
      "hexPrism"
    ],
    "clue": "Compare the same moment from several viewpoints. Then check whether your explanation fits the whole passage."
  },
  {
    "title": "An incomplete story",
    "chapter": "FACETS & PROFILES",
    "answer": "frustum",
    "options": [
      "pyramidFrustum",
      "cone",
      "cylinder",
      "frustum"
    ],
    "clue": "Compare the same moment from several viewpoints. Then check whether your explanation fits the whole passage."
  },
  {
    "title": "Two halves of a whole",
    "chapter": "CHANGING SECTIONS",
    "answer": "bipyramid",
    "options": [
      "doubleCone",
      "bipyramid",
      "ellipsoid",
      "tiltedCube"
    ],
    "clue": "Compare the same moment from several viewpoints. Then check whether your explanation fits the whole passage."
  },
  {
    "title": "An unexpected angle",
    "chapter": "CHANGING SECTIONS",
    "answer": "tiltedCube",
    "options": [
      "skewPrism",
      "bipyramid",
      "tiltedCube",
      "cube"
    ],
    "clue": "Compare the same moment from several viewpoints. Then check whether your explanation fits the whole passage."
  },
  {
    "title": "A shifting impression",
    "chapter": "CHANGING SECTIONS",
    "answer": "skewPrism",
    "options": [
      "twistedPrism",
      "tiltedCube",
      "cube",
      "skewPrism"
    ],
    "clue": "Compare arrival, middle, and departure. Follow the position of each visible edge as well as its width."
  },
  {
    "title": "A quiet turn",
    "chapter": "CHANGING SECTIONS",
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
    "title": "Through the narrow place",
    "chapter": "COMPOUND PROFILES",
    "answer": "hourglass",
    "options": [
      "dumbbell",
      "spindle",
      "hourglass",
      "doubleCone"
    ],
    "clue": "Compare arrival, middle, and departure. Follow the position of each visible edge as well as its width."
  },
  {
    "title": "The whole story",
    "chapter": "COMPOUND PROFILES",
    "answer": "dumbbell",
    "options": [
      "unequalDumbbell",
      "dumbbell",
      "threeBeads",
      "hourglass"
    ],
    "clue": "Compare arrival, middle, and departure. Follow the position of each visible edge as well as its width."
  },
  {
    "title": "Off the beaten path",
    "chapter": "COMPOUND PROFILES",
    "answer": "offcenterVase",
    "options": [
      "vase",
      "tiltedVase",
      "bellows",
      "offcenterVase"
    ],
    "clue": "Compare arrival, middle, and departure. Follow the position of each visible edge as well as its width."
  },
  {
    "title": "The space between",
    "chapter": "HIDDEN CONNECTIONS",
    "answer": "torus",
    "options": [
      "tiltedRing",
      "torus",
      "ellipticRing",
      "thickRing"
    ],
    "clue": "Take your time. A convincing explanation must account for every moment and every viewpoint."
  },
  {
    "title": "An opening elsewhere",
    "chapter": "HIDDEN CONNECTIONS",
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
    "title": "A recurring pattern",
    "chapter": "SPATIAL RECONSTRUCTION",
    "answer": "trefoilColumn",
    "options": [
      "trefoilColumn",
      "starColumn",
      "flutedColumn",
      "twistedTrefoil"
    ],
    "clue": "Take your time. A convincing explanation must account for every moment and every viewpoint."
  },
  {
    "title": "Follow the same edge",
    "chapter": "SPATIAL RECONSTRUCTION",
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
    "chapter": "SPATIAL RECONSTRUCTION",
    "answer": "linkedRings",
    "options": [
      "parallelRings",
      "linkedRings",
      "offsetRings",
      "separateRings"
    ],
    "clue": "Take your time. A convincing explanation must account for every moment and every viewpoint."
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
