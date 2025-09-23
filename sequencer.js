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
const steps = Array.from({ length: rows }, () => Array(cols).fill(false));

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
  console.log(Tone.Transport.state);
  if (Tone.Transport.state !== "started") {
    Tone.Transport.bpm.value = 70;
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
  }
});
