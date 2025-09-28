/* ===============================
   SubtractiveSynth クラス本体
   =============================== */
class Synth {
  constructor(volume, delay) {

    this.noteTable = ["A1","C2","D2","E2","G2"];
    this.sequence = [0,0,0,0,0,0,0,0];

    // Nodes
    this.osc = new Tone.Oscillator({ type: "sawtooth", frequency: 220, detune:0 });
    this.filter = new Tone.Filter({ type: "lowpass", frequency: 1200, Q: 7 });
    this.ampEnv = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.15, sustain: 0.8, release: 0.3 });
    this.master = new Tone.Volume(volume);
    this.lfo = new Tone.LFO({ frequency: 0.1, min: 400, max: 3000 });
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.3, wet: 0.25 });

    // Routing
    if (delay) {
      this.osc.chain(this.filter, this.ampEnv, this.delay, this.master, Tone.Destination);
    } else {
      this.osc.chain(this.filter, this.ampEnv, this.master, Tone.Destination);
    }
    this.lfo.connect(this.filter.frequency);

    // State
    this._started = false;
  }

  /* ===== Lifecycle ===== */
  startAudio() {
    if (!this._started) {
      //await Tone.start();
      this.osc.start();
      this.lfo.start();
      this._started = true;
    }
  }

 // connect(nodeOrDest = Tone.Destination) { this.master.connect(nodeOrDest); }
 // disconnect() { this.master.disconnect(); }

  setNoteTable(noteTable) {
    this.noteTable = noteTable;
  }

  setNote(col) {
    const note = Math.floor(Math.random() * this.noteTable.length);
    this.sequence[col] = note;
    console.log(this.sequence);
  }

  /* ===== Performance ===== */
  noteOn(no) {
    const note = this.noteTable[this.sequence[no % this.sequence.length]];
    const freq = Tone.Frequency(note).toFrequency();
    this.osc.frequency.setValueAtTime(freq, Tone.now());
    this.ampEnv.triggerAttack();
  }

  noteOff(col) {
    this.ampEnv.triggerRelease();
  }
}
