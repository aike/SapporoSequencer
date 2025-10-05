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

let currentXpos = -1;
let currentYpos = -1;

// === プレイヤー ===
const players = new Tone.Players(
  samples.reduce((obj, name) => { obj[name] = name; return obj; }, {}),
  () => console.log("samples loaded")
).toDestination();

const synth = new Synth(-18, true);
synth.setNoteTable(["A4","C5","D5","E5","G5"]);
synth.ampEnv.attack = 0.01;
synth.lfo.frequency.value = 0.4;
synth.lfo.min = 800;
synth.lfo.max = 2000;
const synthBass = new Synth(-8, false);
synthBass.setNoteTable(["A1","A1","A1","A1","C2","D2","E2","E2","E2","G2"]);

// === グリッド状態 ===
const steps = Array.from({ length: rows }, () => Array(cols).fill(0));
const mute = new Array(rows).fill(0);

const gridEl = document.getElementById("grid");

// Debugパッド生成
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const pad = document.createElement("div");
    pad.className = "pad";
    pad.dataset.row = r;
    pad.dataset.col = c;
    pad.addEventListener("click", () => {
      steps[r][c] = !steps[r][c];
      if (steps[pad.dataset.row][pad.dataset.col]) {
        if (r === 0) {
          synth.setNote(pad.dataset.col);
        } else if (r === 1) {
          synthBass.setNote(pad.dataset.col);
        }
      }
      pad.classList.toggle("on", steps[r][c]);
      if (debug) {
        currentXpos = c;
        currentYpos = r;
        setPadCursor(c, r);
        setPadstatus();
      }
      saveState();
    });
    gridEl.appendChild(pad);
  }
}

// === シーケンサー ===
const seq = new Tone.Sequence((time, col) => {
  // カラムのハイライト
  nextStep();
  document.querySelectorAll(".pad").forEach(p => p.classList.remove("active"));
  for (let r = 0; r < rows; r++) {
    const pad = document.querySelector(`.pad[data-row="${r}"][data-col="${col}"]`);
    pad.classList.add("active");
    if (steps[r][col] && !mute[r]) {
      if (r === 0) {
        // シンセ
        synth.noteOn(col);
        setTimeout(() => { synth.noteOff(col); }, 100);
      } else if (r === 1) {
        // シンセベース
        synthBass.noteOn(col);
        setTimeout(() => { synthBass.noteOff(col); }, 100);
      } else {
        // サンプラー再生
        players.player(samples[r]).start(time);
      }
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
async function startstop() {
  await Tone.start();
  synth.startAudio();
  synthBass.startAudio();
  if (Tone.Transport.state !== "started") {
    Tone.Transport.bpm.value = Math.floor(parseInt(document.getElementById('bpmval').value) / 2);
    cursor = 0;
    seq.start(0);
    Tone.Transport.start();
  } else {
//        seq.stop();
    Tone.Transport.stop();
    showSteps();
  }

}

document.getElementById("startstop").addEventListener(click, () => {
  startstop();  
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

document.getElementById("s_sy").addEventListener(click, () => {
  mute[0] = !mute[0];
  document.getElementById("s_sy").classList.toggle("muted", mute[0]);
});
document.getElementById("s_bs").addEventListener(click, () => {
  mute[1] = !mute[1];
  document.getElementById("s_bs").classList.toggle("muted", mute[1]);
});
document.getElementById("s_hh").addEventListener(click, () => {
  mute[2] = !mute[2];
  document.getElementById("s_hh").classList.toggle("muted", mute[2]);
});
document.getElementById("s_cl").addEventListener(click, () => {
  mute[3] = !mute[3];
  document.getElementById("s_cl").classList.toggle("muted", mute[3]);
});
document.getElementById("s_sd").addEventListener(click, () => {
  mute[4] = !mute[4];
  document.getElementById("s_sd").classList.toggle("muted", mute[4]);
});
document.getElementById("s_bd").addEventListener(click, () => {
  mute[5] = !mute[5];
  document.getElementById("s_bd").classList.toggle("muted", mute[5]);
});

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      startstop();
    } else if (e.code === 'Digit1') {
      mute[0] = !mute[0];
      document.getElementById("s_sy").classList.toggle("muted", mute[0]);
    } else if (e.code === 'Digit2') {
      mute[1] = !mute[1];
      document.getElementById("s_bs").classList.toggle("muted", mute[1]);
    } else if (e.code === 'Digit3') {
      mute[2] = !mute[2];
      document.getElementById("s_hh").classList.toggle("muted", mute[2]);
    } else if (e.code === 'Digit4') {
      mute[3] = !mute[3];
      document.getElementById("s_cl").classList.toggle("muted", mute[3]);
    } else if (e.code === 'Digit5') {
      mute[4] = !mute[4];
      document.getElementById("s_sd").classList.toggle("muted", mute[4]);
    } else if (e.code === 'Digit6') {
      mute[5] = !mute[5];
      document.getElementById("s_bd").classList.toggle("muted", mute[5]); 
    }
  });


// currentXpos, currentYpos に基づいて Property パネルと 3D パッドを更新
function setPadstatus() {
  const x = currentXpos;
  const y = currentYpos;
  const address = toLocationString([x, y * 2 + 1]);
  $('address').innerText = address;
  $('instname').innerText = (y >= 0) ? instruments[y] : "";
  $('beatno').innerText = (y >= 0) ? (x + 1) : "";

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
  if (steps[currentYpos][currentXpos]) {
    if (currentYpos === 0) {
      synth.setNote(currentXpos);
    } else if (currentYpos === 1) {
      synthBass.setNote(currentXpos);
    }
  }
  setPadstatus();
  saveState();
});


function showDebugSteps() {
  // Debugパッド生成
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pad = document.querySelector('.pad[data-row="' + r + '"][data-col="' + c + '"]');
      if (steps[r][c]) {
        pad.classList.add("on");
      }
    }
  }
}

function saveState() {
  const state = {
    steps: steps,
    bpm: parseInt(document.getElementById('bpmval').value),
    synthseq: synth.sequence,
    bassseq: synthBass.sequence
  };
  if (debug) {
    localStorage.setItem("debugsong", JSON.stringify(state));
  } else {
    localStorage.setItem("song", JSON.stringify(state));
  }
  console.log("状態保存:");
}

function loadState() {
  let data;
  if (debug) {
    data = localStorage.getItem("debugsong");
  } else {
    data = localStorage.getItem("song");
  }
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
      if (parsed.synthseq && Array.isArray(parsed.synthseq)) {
        synth.sequence = parsed.synthseq;
      }
      if (parsed.bassseq && Array.isArray(parsed.bassseq)) {
        synthBass.sequence = parsed.bassseq;
      }
      console.log("状態復帰:");
    } catch(e){ console.warn("復帰失敗:", e); }
  }
}

if (!demo) {
  loadState();
  showDebugSteps();
}

