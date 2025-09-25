/*
  方針：
  - 四隅（UL, LL, UR, LR）で定義される凸四角形と単位正方形（(u,v)∈[0,1]^2）の間に
    射影変換（3×3ホモグラフィ行列）H を構成。
  - H の逆行列 Hinv で (lon,lat,1) を (u,v,1) に変換（同次座標→正規化）。
  - 0≤u≤1, 0≤v≤1 ならタイル内。列=floor(u*cols), 行=floor(v*rows)。
    端がちょうど1になる場合は最大インデックスにクランプ。
*/

const debug = false;

const georows = 12;
const geocols = 8;

const $ = (id) => document.getElementById(id);
if (debug) {
  $('grid').style.display = "block";
  $('debugpanel').style.display = "block";
  $('fakeLocation').checked = true;
  console.log($('fakeLocation').checked);
} else {
  $('grid').style.display = "none";
  $('debugpanel').style.display = "none";
  $('fakeLocation').checked = false;
  startTrackingGeo();
}

// 与えられた四隅（[lat, lon]） ※x=lon, y=lat で扱う(latitude=緯度=縦方向, longitude=経度=横方向)
const UL = [43.0612055051849, 141.34356396606748];
const LL = [43.054498061440476, 141.34513787652156];
const UR = [43.06288148831574, 141.3566695269474];
const LR = [43.05619956794043, 141.35834433062803];

// (x,y) = (lon,lat) に変換して四隅を用意（単位正方形の対応：UL=(0,0), UR=(1,0), LL=(0,1), LR=(1,1)）
const quad = {
  // x=lon, y=lat
  P00: { x: UL[1], y: UL[0] }, // (u=0,v=0)
  P10: { x: UR[1], y: UR[0] }, // (u=1,v=0)
  P01: { x: LL[1], y: LL[0] }, // (u=0,v=1)
  P11: { x: LR[1], y: LR[0] }, // (u=1,v=1)
};

// --- 射影変換（単位正方形→四角形）行列を直接構成する既知の公式 ---
function buildHomographyFromUnitSquareToQuad(q) {
  const {P00, P10, P01, P11} = q;

  const x00 = P00.x, y00 = P00.y;
  const x10 = P10.x, y10 = P10.y;
  const x01 = P01.x, y01 = P01.y;
  const x11 = P11.x, y11 = P11.y;

  const dx1 = x10 - x11;
  const dy1 = y10 - y11;
  const dx2 = x01 - x11;
  const dy2 = y01 - y11;
  const dx3 = x00 - x10 + x11 - x01;
  const dy3 = y00 - y10 + y11 - y01;

  const denom = dx1*dy2 - dy1*dx2;

  // g, h は射影成分
  const g = (dx3*dy2 - dy3*dx2) / denom;
  const h = (dx1*dy3 - dy1*dx3) / denom;

  // 行列 H（u,v,1)^T → (x,y,w)^T, 最後に (x/w, y/w)
  const H = [
    [x10 - x00 + g*x10,   x01 - x00 + h*x01,   x00],
    [y10 - y00 + g*y10,   y01 - y00 + h*y01,   y00],
    [g,                   h,                   1  ],
  ];
  return H;
}

// 3x3 逆行列（adjugate / det）
function invert3x3(M) {
  const a=M[0][0], b=M[0][1], c=M[0][2];
  const d=M[1][0], e=M[1][1], f=M[1][2];
  const g=M[2][0], h=M[2][1], i=M[2][2];

  const A =  (e*i - f*h);
  const B = -(d*i - f*g);
  const C =  (d*h - e*g);
  const D = -(b*i - c*h);
  const E =  (a*i - c*g);
  const F = -(a*h - b*g);
  const G =  (b*f - c*e);
  const H = -(a*f - c*d);
  const I =  (a*e - b*d);

  const det = a*A + b*B + c*C;
  if (Math.abs(det) < 1e-18) throw new Error("行列が特異です（逆行列なし）");

  const inv = [
    [A/det, D/det, G/det],
    [B/det, E/det, H/det],
    [C/det, F/det, I/det],
  ];
  return inv;
}

// 同次座標に H を適用してデカルトへ
function applyHomography(H, x, y) {
  const X = H[0][0]*x + H[0][1]*y + H[0][2]*1;
  const Y = H[1][0]*x + H[1][1]*y + H[1][2]*1;
  const W = H[2][0]*x + H[2][1]*y + H[2][2]*1;
  return { x: X/W, y: Y/W, w: W };
}

// 準備：H（unit→quad）と Hinv（quad→unit）
const H = buildHomographyFromUnitSquareToQuad(quad);
//console.log("H =", H);
const Hinv = invert3x3(H);
//console.log("Hinv =", Hinv);

// 緯度経度（lat,lon）→ (u,v) を計算（u:横0..1, v:縦0..1）
function latlonToUV(lat, lon) {
  // x=lon, y=lat として Hinv を適用
  const {x:u, y:v} = applyHomography(Hinv, lon, lat);
  return {u, v};
}

// (u,v) → タイルの行・列を判定
function uvToTile(u, v, rows, cols) {
  // 少しの数値誤差に寛容に（±1e-9）
  const eps = 1e-9;
  if (u < -eps || v < -eps || u > 1+eps || v > 1+eps) {
    return { inside: false };
  }
  // 正確に1をまたぐ誤差をクランプ
  const uu = Math.min(1, Math.max(0, u));
  const vv = Math.min(1, Math.max(0, v));

  let col = Math.floor(uu * cols); // 0..cols-1
  let row = Math.floor(vv * rows); // 0..rows-1

  // ちょうど1.0 のとき floor(1*cols)=cols になるので最大にクランプ
  if (col >= cols) col = cols - 1;
  if (row >= rows) row = rows - 1;

  return { inside: true, row, col };
}

// UI 部分
const resultEl = $('result');
const geoStatusEl = $('geoStatus');

// [0-7, 0-11]または[-1,-1]の結果を返す。[col, row]の順
function calcColRow(lat, lon) {
  try {
    const {u, v} = latlonToUV(lat, lon);
    const tile = uvToTile(u, v, georows, geocols);
    if (!tile.inside) {
      return [-1, -1];
    } else {
      return [tile.col, tile.row];
    }
  } catch (e) {
    return [-1, -1];
  }
  // ここには来ないはず
  return [-1, -1];
}

function toLocationString(colrow) {
  const [col, row] = colrow;
  if (col < 0 || col >= geocols || row < 0 || row >= georows) return "";
  //const jo  = ["北1","北1","大通","大通","南1","南1","南1","南2","南2","南2","南3","南3"];
  //const cho = ["西8","西7","西6","西5","西4","西3","西2","西1"];
  const jo  = ["N1","N1","Odori","Odori","S1","S1","S1","S2","S2","S2","S3","S3"];
  const cho = ["W8","W7","W6","W5","W4","W3","W2","W1"];
  return jo[row] + cho[col];
}

function toXY(colrow) {
  const [col, row] = colrow;
  return [col, Math.floor(row / 2)];
}

// Geolocation API で現在地を取得。非同期処理なので結果はcallback(lat, lon)で受け取る
function getGeoStatus(infoElm, callback) {
  if (!('geolocation' in navigator)) {
    infoElm.textContent = 'このブラウザは Geolocation に非対応です。';
    return;
  }
  infoElm.textContent = '現在地を取得中...';
//  navigator.geolocation.getCurrentPosition(
  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      infoElm.textContent = `取得成功（精度±${Math.round(pos.coords.accuracy)}m）`;
      callback(lat, lon);
    },
    (err) => {
      infoElm.textContent = `取得失敗: ${err.message}`;
      clearGeoStatus();
    },
    {
      enableHighAccuracy: true,
      timeout: 3000,
      maximumAge: 0,
    }
  );
}

// 指定緯度経度での状態を表示
function showGeoStatus(lat, lon) {
  trackcount++;
  $('trackcount').innerText = trackcount;

  console.log(`showGeoStatus: ${lat}, ${lon}`);
  const colrow = calcColRow(lat, lon);
  const xy = toXY(colrow);
  const x = xy[0];
  const y = xy[1];
  console.log(`  => colrow=${colrow}, xy=${xy}`);
  const address = toLocationString(colrow);
  $('latlon').value = `${lat}, ${lon}`;
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
  //$('latlon').value = `${lat}, ${lon}`;
  $('southwest').innerText = "";
  $('xy').innerText = "";
  setPadCursor(-1, -1);
}

let trackcount = 0;

function startTrackingGeo() {
  if ($('fakeLocation').checked) {
    trackingFakeGeo();
  } else {
    getGeoStatus($('geoStatus'), (lat, lon) => {
      // TODO 間引き処理
      showGeoStatus(lat, lon);
    });
  }
}

function trackingFakeGeo() {
  // Fake位置情報を使用
  const latlonStr = $('latlon').value.split(',').map(s => s.trim());
  let lat = parseFloat(latlonStr[0]);
  let lon = parseFloat(latlonStr[1]);
  if ($('fakeMoving').checked) {
    // Fake移動
    lat = LR[0] + Math.random() * (UL[0] - LR[0]);
    lon = LL[1] + Math.random() * (UR[1] - LL[1]);
    $('latlon').value = `${lat}, ${lon}`;
  }
  showGeoStatus(lat, lon);

  setTimeout(trackingFakeGeo, 2000);
}

// 位置情報取得ボタン
$('btnGeo').addEventListener('click', startTrackingGeo);


// 起動時にサンプル座標で一回判定
console.log($('latlon').value);
const latlonStr = $('latlon').value.split(',').map(s => s.trim());
showGeoStatus(parseFloat(latlonStr[0]), parseFloat(latlonStr[1]));

