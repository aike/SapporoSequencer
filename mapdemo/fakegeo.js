

$('grid').style.display = "none";
$('debugpanel').style.display = "none";
$('fakeLocation').checked = false;
startTrackingGeo();


// UI 部分
const resultEl = $('result');
const geoStatusEl = $('geoStatus');

function toLocationString(colrow) {
  const [col, row] = colrow;
  if (col < 0 || col >= geocols || row < 0 || row >= georows) return "";
  const jo  = ["N1","N1","Odori","Odori","S1","S1","S1","S2","S2","S2","S3","S3"];
  const cho = ["W8","W7","W6","W5","W4","W3","W2","W1"];
  return jo[row] + " " + cho[col];
}

function toXY(colrow) {
  const [col, row] = colrow;
  return [col, Math.floor(row / 2)];
}


async function poll() {
  try {
    const response = await fetch('geodata');
    //console.log("Fetched geodata");
    const text = await response.text();
    const colrow = JSON.parse(text);
    showGeoStatus(colrow);
    //console.log(text);
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(poll, 1000);
  }
}


// 指定緯度経度での状態を表示
function showGeoStatus(colrow) {
  trackcount++;
  $('trackcount').innerText = trackcount;

  const xy = toXY(colrow);
  const x = xy[0];
  const y = xy[1];
  console.log(`  => colrow=${colrow}, xy=${xy}`);
  const address = toLocationString(colrow);
  $('southwest').innerText = address;
  $('xy').innerText = `${x},${y}`;

  currentXpos = x;
  currentYpos = y;
  $('address').innerText = address;
  $('instname').innerText = (y >= 0) ? instruments[y] : "";
  $('beatno').innerText = (colrow[1] >= 0) ? (colrow[0] + 1) : "";
  if (x >= 0) {
    $('padproperty').style.display = "block";
    setPadstatus();
  } else {
    $('padproperty').style.display = "none";
  }
  setPadCursor(xy[0], xy[1]);
}

// 指定緯度経度での状態を表示
function clearGeoStatus() {
  $('southwest').innerText = "";
  $('xy').innerText = "";
  setPadCursor(-1, -1);
}

let trackcount = 0;

function startTrackingGeo() {
  poll();
}


// 起動時にサンプル座標で一回判定
const latlonStr = $('latlon').value.split(',').map(s => s.trim());
showGeoStatus([-1, -1]);
showSteps();
