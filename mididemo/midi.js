// midi.js


const rows = 6;
const cols = 8;
const steps = Array.from({ length: rows }, () => Array(cols).fill(0));
const mute = new Array(rows).fill(0);

/////////////////////

const CMD_STEP = 0;
const CMD_MUTE = 1;
const CMD_START = 2;
const CMD_STOP = 3;
const CMD_UP = 4;
const CMD_DOWN = 5;

const btnStart = 51;
const btnStop = 52;
const btnUp = 31;
const btnDown = 32;
const btnAlt = 49;
const btnMute = [39,38,37,36];

let viewOffset = 0;



navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess,onMIDIFailure);

let midi = null;
let inputs = [];
let outputs = [];
let selectedOutput = null;
let mididevicename = 'Jack 1';


function onMIDISuccess(m){
  midi = m;
  let it = midi.inputs.values();
  for(let o = it.next(); !o.done; o = it.next()){
    inputs.push(o.value);
  }
  let ot = midi.outputs.values();
  for(let o = ot.next(); !o.done; o = ot.next()){
    outputs.push(o.value);
    if (o.value.name.indexOf(mididevicename) >= 0) {
      selectedOutput = outputs.length - 1;
    }
  }

  for(let cnt=0;cnt < inputs.length;cnt++){
    inputs[cnt].onmidimessage = onMIDIEvent;
  }

  midi_AllOff();
  midi_ButtonOn(btnMute[0]);
  midi_ButtonOn(btnMute[1]);
  midi_ButtonOn(btnMute[2]);
  midi_ButtonOn(btnMute[3]);
  midi_ButtonOn(btnUp);
  midi_ButtonOff(btnAlt);

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      midi_PadOn(r, c, 5);
      //midi_PadOff(r, c);
    }
  }

  for (let r = 0; r < 4; r++) {
    for (let c = 8; c < 16; c++) {
      midi_PadOff(r, c);
    }
  }


}

function onMIDIFailure(msg){
  console.log("onMIDIFailure():"+msg);
}

function onMIDIEvent(e){
  if(e.data[0] == 0x90){
    console.log(e.data);
    let data = parseMidi(e.data[1], e.data[2]);

    if (data.cmd == CMD_STEP) {
      steps[data.tr][data.step] = !steps[data.tr][data.step];
      if (steps[data.tr][data.step]) {
        midi_PadOn(data.tr, data.step, 127);
      } else {
        midi_PadOn(data.tr, data.step, 5);
      }

    } else if (data.cmd == CMD_MUTE) {
      mute[data.tr] = !mute[data.tr];
      if (!mute[data.tr]) {
        midi_ButtonOn(btnMute[data.tr]);
      } else {
        midi_ButtonOff(btnMute[data.tr]);
      }

    } else if (data.cmd == CMD_UP) {
      midi_MoveOffset(-1);
    } else if (data.cmd == CMD_DOWN) {
      midi_MoveOffset(1);
    }
  }
}


function sendMIDINoteOn(nn, vel) {
  outputs[selectedOutput].send([0x90, nn, vel]);
}

function midi_ButtonOn(btn) {
  outputs[selectedOutput].send([0xB0, btn, 0x03]);
}

function midi_ButtonOff(btn) {
  outputs[selectedOutput].send([0xB0, btn, 0x00]);
}


function midi_PadOn(r, c, intensity=127) {
  outputs[selectedOutput].send([0xF0, 0x47, 0x7F, 0x43, 0x65, 0x00, 0x04, r * 0x10 + c, 0x00, 0x00, intensity, 0xF7]);
}

function midi_PadOff(r, c) {
  outputs[selectedOutput].send([0xF0, 0x47, 0x7F, 0x43, 0x65, 0x00, 0x04, r * 0x10 + c, 0x00, 0x00, 0x00, 0xF7]);
}


// たぶん機能しないので手動で全部オフする方がいい
function midi_AllOff() {
  outputs[selectedOutput].send([0xB0, 0x1B, 0x00]);
}

function midi_Array2Pad() {
}

function midi_ShowCursor(c) {  
}

function midi_MoveOffset(offset) {
  viewOffset += offset;
  if (viewOffset < 0) viewOffset = 0;
  if (viewOffset > 2) viewOffset = 2;

  switch (viewOffset) {
    case 0:
      midi_ButtonOn(btnUp);
      midi_ButtonOff(btnDown);
      break;
    case 1:
      midi_ButtonOff(btnUp);
      midi_ButtonOff(btnDown);
      break;
    case 2:
      midi_ButtonOff(btnUp);
      midi_ButtonOn(btnDown);
      break;
  } 

  midi_Array2Pad();
}


//function swMute(tr, mute) {
//  console.log(outputs);
//  outputs[selectedOutput].send([0xF0, 0x47, 0x7F, 0x43, 0x65, 0x00, 0x04, 0x23, 0x00, 0x00, 0x7F, 0xF7]);
//  outputs[selectedOutput].send([0xF0, 0x47, 0x7F, 0x43, 0x65, 0x00, 0x04, 0x00, 0x00, 0x00, 0x7F, 0xF7]);
//  outputs[selectedOutput].send([0xF0, 0x47, 0x7F, 0x43, 0x65, 0x00, 0x04, 0x50, 0x00, 0x00, 0x7F, 0xF7]);
//}

//                                                        write  length     idx   R     G     B
//  outputs[selectedOutput].send([0xF0, 0x47, 0x7F, 0x43, 0x65, 0x00, 0x04, 0x23, 0x00, 0x00, 0x7F, 0xF7]);
//  index = R*0x10 + C


function parseMidi(note, velocity) {
  let cmd = -1;
  let tr = -1;
  let step = -1;

  if (note >= 102 && note <= 117) {
    cmd = CMD_STEP;
    tr = 3;
    step = note - 102;
  } else if (note >= 86 && note <= 101) {
    cmd = CMD_STEP;
    tr = 2;
    step = note - 86;
  } else if (note >= 70 && note <= 85) {
    cmd = CMD_STEP;
    tr = 1;
    step = note - 70;
  } else if (note >= 54 && note <= 69) {
    cmd = CMD_STEP;
    tr = 0;
    step = note - 54;

  } else if (note == btnMute[0]) {
    cmd = CMD_MUTE;
    tr = 0;
  } else if (note == btnMute[1]) {
    cmd = CMD_MUTE;
    tr = 1;
  } else if (note == btnMute[2]) {
    cmd = CMD_MUTE;
    tr = 2;
  } else if (note == btnMute[3]) {
    cmd = CMD_MUTE;
    tr = 3;

  } else if (note == btnStart) {
    cmd = CMD_START;
  } else if (note == btnStop) {
    cmd = CMD_STOP;
  } else if (note == btnUp) {
    cmd = CMD_UP;
  } else if (note == btnDown) {
    cmd = CMD_DOWN;
  }

  return { cmd: cmd, tr: tr, step: step};
}

