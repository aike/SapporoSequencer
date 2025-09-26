// === 設定 ===
const rows = 6;
const cols = 8;
const samples = [
  "wav/synth.wav",
  "wav/bass.wav", 
  "wav/hihat.wav", 
  "wav/clap.wav", 
  "wav/snare.wav", 
  "wav/kick.wav", 
];

// === プレイヤー ===
const players = new Tone.Players(
  samples.reduce((obj, name) => { obj[name] = name; return obj; }, {}),
  () => console.log("samples loaded")
).toDestination();

// === グリッド状態 ===
const steps = Array.from({ length: rows }, () => Array(cols).fill(0));

const gridEl = document.getElementById("grid");

// パッド生成
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const pad = document.createElement("div");
    pad.className = "pad";
    pad.dataset.row = r;
    pad.dataset.col = c;
    pad.addEventListener("click", () => {
      steps[r][c] = !steps[r][c];
      pad.classList.toggle("on", steps[r][c]);
      saveState();
    });
    gridEl.appendChild(pad);
  }
}

// === シーケンサー ===
let currentCol = 0;

const seq = new Tone.Sequence((time, col) => {
  // カラムのハイライト
  nextStep();
  document.querySelectorAll(".pad").forEach(p => p.classList.remove("active"));
  for (let r = 0; r < rows; r++) {
    const pad = document.querySelector(`.pad[data-row="${r}"][data-col="${col}"]`);
    pad.classList.add("active");
    if (steps[r][col]) {
      players.player(samples[r]).start(time);
    }
  }
}, Array.from({ length: cols }, (_, i) => i), "16n");

seq.loop = true;

var click;
if (window.ontouchstart === null) {
	click = "touchstart";
} else{
	click = "click";
}

// === 再生ボタン ===
document.getElementById("startstop").addEventListener(click, async () => {
  await Tone.start();
  if (Tone.Transport.state !== "started") {
    Tone.Transport.bpm.value = Math.floor(parseInt(document.getElementById('bpmval').value) / 2);
    cursor = 0;
    seq.start(0);
    Tone.Transport.start();
  } else {
//        seq.stop();
    Tone.Transport.stop();
  }
});

document.getElementById("bpm").addEventListener(click, () => {
  const bpminput = document.getElementById("bpminput");
  if (bpminput.style.display === "block") {
    bpminput.style.display = "none";
  } else {
    bpminput.style.display = "block";
  }
});

document.getElementById("bpmval").addEventListener("change", () => {
  const bpm = parseInt(document.getElementById("bpmval").value);
  if (!isNaN(bpm) && bpm >= 60 && bpm <= 180) {
    Tone.Transport.bpm.value = Math.floor(bpm / 2);
    saveState();
  }
});

let currentXpos = -1;
let currentYpos = -1;

// currentXpos, currentYpos に基づいて Property パネルと 3D パッドを更新
function setPadstatus() {
  const x = currentXpos;
  const y = currentYpos;

  // Property パネル更新
  if (steps[y][x]) {
    document.getElementById('padstatus').innerText = "ON";
    document.getElementById('padstatus').style.backgroundColor = "#" + padcolor[1][y].toString(16).padStart(6, '0');
    document.getElementById('padstatus').style.color = "#ffffff";
  } else {
    document.getElementById('padstatus').innerText = "OFF";
    document.getElementById('padstatus').style.backgroundColor = "#" + padcolor[0][y].toString(16).padStart(6, '0');
    document.getElementById('padstatus').style.color = "#666666";
  }

  // 3D パッド更新
  var o = t.obj("p" + x + "_" + y);
  if (steps[y][x]) {
    o.material.color.set(padcolor[1][y]);
  } else {
    o.material.color.set(padcolor[0][y]);
  }
  t.setDirty();
}

// プロパティパネルのPadをタップしたとき
document.getElementById("padstatus").addEventListener(click, () => {
  steps[currentYpos][currentXpos] = !steps[currentYpos][currentXpos];
  setPadstatus();
  saveState();
});


function saveState() {
  const state = {
    steps: steps,
    bpm: parseInt(document.getElementById('bpmval').value)
  };
  localStorage.setItem("song", JSON.stringify(state));
  console.log("状態保存:");
}

function loadState() {
  const data = localStorage.getItem("song");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.steps && Array.isArray(parsed.steps)) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            steps[r][c] = parsed.steps[r][c];
          }
        }
      }
      if (parsed.bpm) {
        Tone.Transport.bpm.value = Math.floor(parsed.bpm / 2);
        document.getElementById('bpmval').value = parsed.bpm; // UIも反映
      }
      console.log("状態復帰:");
    } catch(e){ console.warn("復帰失敗:", e); }
  }
}

loadState();
