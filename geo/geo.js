/*
  方針：
  - 四隅（UL, LL, UR, LR）で定義される凸四角形と単位正方形（(u,v)∈[0,1]^2）の間に
    射影変換（3×3ホモグラフィ行列）H を構成。
  - H の逆行列 Hinv で (lon,lat,1) を (u,v,1) に変換（同次座標→正規化）。
  - 0≤u≤1, 0≤v≤1 ならタイル内。列=floor(u*cols), 行=floor(v*rows)。
    端がちょうど1になる場合は最大インデックスにクランプ。
*/

const rows = 12;
const cols = 8;

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
//console.log("quad =", quad);

// --- 射影変換（単位正方形→四角形）行列を直接構成する既知の公式 ---
function buildHomographyFromUnitSquareToQuad(q) {
  const {P00, P10, P01, P11} = q;

  const x00 = P00.x, y00 = P00.y;
  const x10 = P10.x, y10 = P10.y;
  const x01 = P01.x, y01 = P01.y;
  const x11 = P11.x, y11 = P11.y;
  //console.log("xy =", x00, y00, x10, y10, x01, y01, x11, y11);

  const dx1 = x10 - x11;
  const dy1 = y10 - y11;
  const dx2 = x01 - x11;
  const dy2 = y01 - y11;
  const dx3 = x00 - x10 + x11 - x01;
  const dy3 = y00 - y10 + y11 - y01;

  const denom = dx1*dy2 - dy1*dx2;
  //console.log("dx1,dy1 =", dx1, dy1);
  //console.log("dx2,dy2 =", dx2, dy2);
  //console.log("denom =", denom);


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
const $ = (id) => document.getElementById(id);
const resultEl = $('result');
const geoStatusEl = $('geoStatus');

function showResult(lat, lon) {
  const jo  = ["北1","北1","大通","大通","南1","南1","南1","南2","南2","南2","南3","南3"];
  const cho = ["西8","西7","西6","西5","西4","西3","西2","西1"];


  try {
    const {u, v} = latlonToUV(lat, lon);
    //console.log(`u=${u}, v=${v}`);
    const tile = uvToTile(u, v, rows, cols);

    const uvStr = `u=${u.toFixed(6)}, v=${v.toFixed(6)}`;
    const posStr = `lat=${lat}, lon=${lon}`;

    if (!tile.inside) {
      resultEl.innerHTML = `
        ${posStr}<br>
        ${uvStr}<br>
        <span class="ng">→ 範囲外（どのタイルにも含まれません）</span>
      `;
    } else {
      // 行・列は 0 始まり。人向け表示として 1 始まりも併記
      //const human = `行=${tile.row+1}/${rows}, 列=${tile.col+1}/${cols}`;
      const human = jo[tile.row] + cho[tile.col];
      resultEl.innerHTML = `
        ${human}<br><br>
        ${posStr}<br>
        ${uvStr}<br>
        row=${tile.row}, col=${tile.col}
      `;
    }
  } catch (e) {
    resultEl.innerHTML = `<span class="ng">エラー: ${e.message}</span>`;
  }
}

$('btnManual').addEventListener('click', () => {
  const latlonStr = $('latlon').value.split(',').map(s => s.trim());
  const lat = parseFloat(latlonStr[0]);
  const lon = parseFloat(latlonStr[1]);
  showResult(lat, lon);
});

$('btnGeo').addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    geoStatusEl.textContent = 'このブラウザは Geolocation に非対応です。';
    return;
  }
  geoStatusEl.textContent = '現在地を取得中...';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      geoStatusEl.textContent = `取得成功（精度±${Math.round(pos.coords.accuracy)}m）`;
      showResult(lat, lon);
    },
    (err) => {
      geoStatusEl.textContent = `取得失敗: ${err.message}`;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
});

// 起動時にサンプル座標で一回判定
const latlonStr = $('latlon').value.split(',').map(s => s.trim());
showResult(parseFloat(latlonStr[0]),  parseFloat(latlonStr[1]));
