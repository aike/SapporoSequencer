
var coltbl = [
  [0x000022, 0x001122, 0x002222, 0x002200, 0x221100, 0x220000],
  [0x0000ff, 0x0088ff, 0x00ffff, 0x00ff00, 0xff8800, 0xff0000]
];


var t = new ThreePiece("bg2", 1500/2, 1000/2);
var r = -Math.PI / 2;
var data = [
  {obj:"PerspectiveCamera",  x:0, y:1.4, z:1.95, rx:-0.7, rz: 0.04},
];

var py = 0.87;
var px = 0.96;

// グリッド線
for (var i = 0; i <= 30; i++) {
  var j = i - 15;
	// data.push({obj:'line',x:j*px-px*0.6,y:-0.0,z:-50,tx:j*px-px*0.6,ty:-0.0,tz:50,col:0x006600});
	// data.push({obj:'line',x:-50,y:-0.0,z:j*py-py*0.5,tx:50,ty:-0.0,tz:j*py-py*0.5,col:0x006600});
}

for (y = 0; y < 6; y++) {
  for (x = 0; x < 8; x++) {
    var nm = "p"+x+"_"+y;
    data.push({obj:"Plane", name:nm, x: x*px-3, z:y*py+0.9, w:px*0.85, h:py*0.85, rx: r, col:coltbl[0][y]});
  }
}

data.push({obj:"Plane", name:"start", x: -0.7, z:-1.6, w:px*0.85*2, h:py*0.85*2, rx: r, col:0xFF0000});
data.push({obj:"Plane", name:"start", x: 2.4, z:0, w:px*0.5, h:py*0.5, rx: r, col:0xFFFF00});



t.useDirtyFlag();
t.eval(data);

var cursor = 0;
var nextStep = function() {
  for (var y = 0; y < 6; y++) {
    for (var x = 0; x < 8; x++) {
      var o = t.obj("p" + x + "_" + y);
      if (x == cursor) {
        if (steps[y][x]) {
          o.material.color.set(coltbl[0][y]);
        } else {
          o.material.color.set(coltbl[1][y]);
        }
      } else {
        if (steps[y][x]) {
          o.material.color.set(coltbl[1][y]);
        } else {
          o.material.color.set(coltbl[0][y]);
        }
      }
    }
  }
  cursor = (cursor + 1) % 8;
  t.setDirty();
};
