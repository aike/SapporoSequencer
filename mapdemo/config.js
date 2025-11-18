const georows = 12;
const geocols = 8;

// demo=1 ならばデモモード（位置情報を使わずにランダムに音を鳴らす）
const $ = (id) => document.getElementById(id);
let url_string = window.location.href;
let url = new URL(url_string);

let demo = url.searchParams.get("demo");
let debug = url.searchParams.get("debug");

