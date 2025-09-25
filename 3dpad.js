
const padcolor = [
  [0x000022, 0x001122, 0x002222, 0x002200, 0x221100, 0x220000],
  [0x0000ff, 0x004488, 0x008844, 0x00ff00, 0x884400, 0xff0000]
];
const instruments = ["SYNTH", "BASS", "HI-HAT", "CLAP", "SNARE", "KICK"];

var t = new ThreePiece("pad", 1000, 667);
var r = -Math.PI / 2;
var data = [
  //{obj:"PerspectiveCamera",  x:0, y:1.4, z:1.95, rx:-0.7, rz: 0.04},
  {obj:"PerspectiveCamera",  x:0.0, y:1.3, z:2, rx:-0.65, ry:-0.01, rz: 0.04},
];

var py = 0.87;
var px = 0.96;

// グリッド線
for (var i = 0; i <= 30; i++) {
  var j = i - 15;
	// data.push({obj:'line',x:j*px-px*0.6,y:-0.0,z:-50,tx:j*px-px*0.6,ty:-0.0,tz:50,col:0x006600});
	// data.push({obj:'line',x:-50,y:-0.0,z:j*py-py*0.5,tx:50,ty:-0.0,tz:j*py-py*0.5,col:0x006600});
}

// 6x8 のパッド
for (y = 0; y < 6; y++) {
  for (x = 0; x < 8; x++) {
    var nm = "p"+x+"_"+y;
    data.push({obj:"Plane", name:nm, x: x*px-3, z:y*py+0.9, w:px*0.85, h:py*0.85, rx: r, col:padcolor[0][y]});
  }
}

// 現在位置
const cx = 0;
const cy = 100;
data.push({obj:"Plane", name:"poscursor", x: cx*px-3, y:-0.01, z:cy*py+0.9, w:px, h:py, rx: r, col:0xFFFFFF});

data.push({obj:"Plane", name:"start", x: -0.5, z:-1.75, w:px*0.85*1.8, h:py*0.7*2, rx: r, col:0xFF0000});
data.push({obj:"Plane", name:"bpm", x: 2.5, z:0, w:px*0.5, h:py*0.5, rx: r, col:0xFFFF00});



t.useDirtyFlag();
t.eval(data);

var cursor = 0;
var nextStep = function() {
  for (var y = 0; y < 6; y++) {
    for (var x = 0; x < 8; x++) {
      var o = t.obj("p" + x + "_" + y);
      if (x == cursor) {
        if (steps[y][x]) {
          o.material.color.set(padcolor[0][y]);
        } else {
          o.material.color.set(padcolor[1][y]);
        }
      } else {
        if (steps[y][x]) {
          o.material.color.set(padcolor[1][y]);
        } else {
          o.material.color.set(padcolor[0][y]);
        }
      }
    }
  }
  cursor = (cursor + 1) % 8;
  t.setDirty();
};

function setPadCursor(x, y) {
  var o = t.obj("poscursor");
  if (o) {
    if (x < 0) {
      o.position.z = 100; // 見えないところに隠す
    } else {
      o.position.x = x * px - 3;
      o.position.z = y * py + 0.9;  
    }
    t.setDirty();
  }
}

function showSteps() {
  for (var y = 0; y < 6; y++) {
    for (var x = 0; x < 8; x++) {
      var o = t.obj("p" + x + "_" + y);
      if (steps[y][x]) {
        o.material.color.set(padcolor[1][y]);
      } else {
        o.material.color.set(padcolor[0][y]);
      }
    }
  }
  t.setDirty();
}
