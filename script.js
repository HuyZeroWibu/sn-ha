/* =====================================================
   CONFIG — chỉnh nội dung thiệp ở đây
   Dùng {name}, {birth}, {age} trong chữ để tự điền.
   Trong lời chúc: xuống đoạn bằng một dòng trống.
   ===================================================== */
const CONFIG = {
  name: 'Vũ Khánh Hà',
  birthDay: 29, birthMonth: 11, birthYear: 2011,   // 29/11/2011
  birthText: '29/11/2011',

  title: 'Chúc Mừng Sinh Nhật',
  subtitle: 'Sinh nhật {birth} · tuổi {age} 🎂',
  openButton: 'Mở Thiệp Cho {name}',

  introWords: ['HAPPY', 'BIRTHDAY', 'TO', 'YOU'],  // chữ hiện lần lượt ở màn mở đầu
  rainColor: '#ff2d95',                            // màu mưa chữ mặc định
  rainText: 'HAPPYBIRTHDAY',

  youtubeId: 'S7KA4tQ483o',                        // nhạc nền: youtu.be/S7KA4tQ483o

  pages: [
    { title: 'Gửi {name},',
      text: 'Chúc mừng sinh nhật {name}!\n\nChúc bạn tuổi {age} thật nhiều sức khỏe, thật nhiều niềm vui và luôn được yêu thương.' },
    { title: 'Một điều ước nhỏ',
      text: 'Mong mọi điều bạn đang cố gắng đều sẽ được đền đáp, và mỗi ngày của bạn đều có một lý do để mỉm cười.' },
    { title: 'Lời cuối',
      text: 'Cảm ơn vì bạn đã ở đây. Hôm nay là ngày của bạn, hãy vui hết mình nhé!\n\nHappy Birthday! 🎉' }
  ]
};

/* ===================== CÀI ĐẶT (lưu trên máy) ===================== */
'use strict';
const $ = id => document.getElementById(id);
const sleep = (ms, id) => new Promise((res, rej) => setTimeout(() => id !== runId ? rej('abort') : res(), ms));
let S = { sound: true, music: true, confetti: true, book: true, rain: CONFIG.rainColor };
try { Object.assign(S, JSON.parse(localStorage.getItem('bday') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('bday', JSON.stringify(S)); } catch (e) {} };

const age = new Date().getFullYear() - CONFIG.birthYear;
const fmt = s => s.replace(/\{name\}/g, CONFIG.name).replace(/\{birth\}/g, CONFIG.birthText).replace(/\{age\}/g, age);

/* ===================== ÂM THANH (Web Audio) ===================== */
let ac = null;
function A() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(f, d = .12, type = 'sine', v = .07, when = 0) {
  if (!S.sound) return;
  const a = A(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
function whoosh() {
  if (!S.sound) return;
  const a = A(), n = a.sampleRate * .25, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.setValueAtTime(500, a.currentTime); f.frequency.exponentialRampToValueAtTime(2200, a.currentTime + .22);
  g.gain.value = .12; s.connect(f).connect(g).connect(a.destination); s.start();
}
const sfx = {
  click: () => tone(660, .09, 'triangle'),
  count: () => tone(520, .2, 'sine', .1),
  word:  () => tone(784, .15, 'triangle'),
  flip:  whoosh,
  chime: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .45, 'sine', .07, i * .11))
};

/* ===================== NHẠC NỀN (YouTube ẩn) ===================== */
let yt = null, ytReady = false, started = false;
function syncMusic() {
  if (!ytReady || !started) return;
  try { (S.sound && S.music) ? (yt.setVolume(55), yt.playVideo()) : yt.pauseVideo(); } catch (e) {}
}
window.onYouTubeIframeAPIReady = () => {
  yt = new YT.Player('yt', {
    videoId: CONFIG.youtubeId,
    playerVars: { controls: 0, loop: 1, playlist: CONFIG.youtubeId, playsinline: 1 },
    events: { onReady: () => { ytReady = true; syncMusic(); } }
  });
};
(function () { const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true; document.head.appendChild(s); })();

/* ===================== CANVAS: mưa chữ + hạt + sparkle + confetti ===================== */
const cv = $('fx'), cx = cv.getContext('2d');
const off = document.createElement('canvas'), ox = off.getContext('2d', { willReadFrequently: true });
let W = 0, H = 0, FS = 18, drops = [], sparks = [], rainAlpha = 1, T = 0;

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  FS = W < 600 ? 16 : 20;
  drops = Array.from({ length: Math.ceil(W / FS) }, () => Math.random() * -30);
  sparks = Array.from({ length: W < 600 ? 28 : 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .6, v: Math.random() * .3 + .1, p: Math.random() * 6 }));
}
addEventListener('resize', resize); resize();

/* --- hạt chấm ghép thành số / chữ / trái tim --- */
let P = [], mode = 'idle', tScale = 1, grow = false, beat = false, dAlpha = 1;

function sampleShape(kind, txt) {
  off.width = W; off.height = H; ox.clearRect(0, 0, W, H); ox.fillStyle = '#fff';
  if (kind === 'heart') {
    const s = Math.min(W, H) * .027; ox.beginPath();
    for (let t = 0, first = true; t <= Math.PI * 2 + .02; t += .02, first = false) {
      const x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      first ? ox.moveTo(W / 2 + x * s, H / 2 + y * s) : ox.lineTo(W / 2 + x * s, H / 2 + y * s);
    }
    ox.fill();
  } else {
    ox.textAlign = 'center'; ox.textBaseline = 'middle';
    const fs = Math.min(H * .34, (W * .88) / (txt.length * .7));
    ox.font = `800 ${fs}px "Arial Black", Impact, sans-serif`; ox.fillText(txt, W / 2, H / 2);
  }
  const step = W < 600 ? 5 : 7, d = ox.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  return pts;
}
async function shape(kind, txt, id, sound) {
  const step = W < 600 ? 5 : 7;
  P = sampleShape(kind, txt).map(([tx, ty]) => ({ x: Math.random() * W, y: Math.random() * H, tx, ty, vx: 0, vy: 0, r: step * .42 }));
  mode = 'form'; dAlpha = 1; tScale = 1; grow = kind === 'digit'; beat = kind === 'heart';
  sound && sound();
  await sleep(650, id); mode = 'hold';
  await sleep(kind === 'heart' ? 1500 : 650, id);
  P.forEach(p => { p.vx = (p.tx - W / 2) * .018 + (Math.random() - .5) * 3; p.vy = (p.ty - H / 2) * .018 + (Math.random() - .5) * 3; });
  mode = 'dissolve'; await sleep(520, id);
  P = []; mode = 'idle';
}

/* --- confetti (chữ nhật, trái tim, cánh hoa) --- */
let C = [];
const CCOL = ['#ff6fa5', '#ffd54a', '#7fd1ff', '#fff', '#ff9fc3', '#b36bff'];
function burst(x, y, n = 26) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = Math.random() * 5 + 2;
    C.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
      s: Math.random() * 7 + 6, shape: i % 3, col: CCOL[i % CCOL.length], life: 1 });
  }
}

function frame(ts) {
  T = ts / 1000; cx.clearRect(0, 0, W, H);

  // mưa chữ
  const txt = CONFIG.rainText; cx.font = `700 ${FS}px "Be Vietnam Pro", monospace`; cx.textAlign = 'left'; cx.fillStyle = S.rain;
  for (let i = 0; i < drops.length; i++) {
    const head = Math.floor(drops[i]);
    for (let k = 0; k < 10; k++) {
      const row = head - k; if (row < 0) continue;
      cx.globalAlpha = (1 - k / 10) * rainAlpha * (k === 0 ? 1 : .8);
      cx.fillText(txt[(i * 3 + row) % txt.length], i * FS, row * FS);
    }
    drops[i] += .22 + (i % 5) * .05;
    if (drops[i] * FS > H + 10 * FS && Math.random() > .975) drops[i] = Math.random() * -10;
  }

  // sparkle trôi lơ lửng
  cx.fillStyle = '#ffe9a8';
  for (const s of sparks) {
    s.y -= s.v; if (s.y < -5) { s.y = H + 5; s.x = Math.random() * W; }
    cx.globalAlpha = .35 + .35 * Math.sin(T * 2 + s.p);
    cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.3); cx.fill();
  }

  // hạt chấm
  if (P.length) {
    if (mode === 'hold' && grow) tScale += (1.12 - tScale) * .04;
    if (mode === 'hold' && beat) tScale = 1 + .05 * Math.sin(T * 9);
    if (mode === 'dissolve') dAlpha = Math.max(0, dAlpha - .035);
    cx.save(); cx.translate(W / 2, H / 2); cx.scale(tScale, tScale); cx.translate(-W / 2, -H / 2);
    cx.globalAlpha = dAlpha; cx.fillStyle = '#ff7ab8'; cx.beginPath();
    for (const p of P) {
      if (mode === 'form') { p.x += (p.tx - p.x) * .14; p.y += (p.ty - p.y) * .14; }
      else if (mode === 'hold') { p.x = p.tx + Math.sin(T * 3 + p.ty) * 1; p.y = p.ty + Math.cos(T * 3 + p.tx) * 1; }
      else if (mode === 'dissolve') { p.x += p.vx; p.y += p.vy; }
      cx.moveTo(p.x + p.r, p.y); cx.arc(p.x, p.y, p.r, 0, 6.3);
    }
    cx.fill(); cx.restore();
  }

  // confetti
  for (let i = C.length - 1; i >= 0; i--) {
    const c = C[i]; c.vy += .14; c.x += c.vx; c.y += c.vy; c.rot += c.vr; c.life -= .008;
    if (c.life <= 0 || c.y > H + 30) { C.splice(i, 1); continue; }
    cx.save(); cx.globalAlpha = Math.min(1, c.life * 2); cx.translate(c.x, c.y); cx.rotate(c.rot); cx.fillStyle = c.col;
    if (c.shape === 0) cx.fillRect(-c.s / 2, -c.s / 3, c.s, c.s * .66);
    else if (c.shape === 1) { cx.font = `${c.s * 2}px sans-serif`; cx.textAlign = 'center'; cx.fillText('♥', 0, c.s * .6); }
    else { cx.beginPath(); cx.ellipse(0, 0, c.s * .8, c.s * .4, 0, 0, 6.3); cx.fill(); }
    cx.restore();
  }
  cx.globalAlpha = 1; requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ===================== LUỒNG TRẢI NGHIỆM ===================== */
let runId = 0, inParty = false;
const show = id => ['gate', 'intro', 'celebrate'].forEach(s => $(s).classList.toggle('on', s === id));

async function runIntro() {
  const id = ++runId; inParty = false;
  document.body.classList.remove('party'); rainAlpha = 1;
  show('intro'); $('openBtn').hidden = true; $('skipBtn').hidden = false; $('replayBtn').hidden = true;
  try {
    await sleep(600, id);
    for (const n of ['3', '2', '1']) await shape('digit', n, id, sfx.count);
    for (const w of CONFIG.introWords) await shape('text', w, id, sfx.word);
    await shape('heart', '', id, sfx.chime);
    $('openBtn').hidden = false;
  } catch (e) { if (e !== 'abort') throw e; }
}

function goCelebrate() {
  runId++; P = []; mode = 'idle'; inParty = true;
  document.body.classList.add('party'); rainAlpha = .3;
  show('celebrate'); $('skipBtn').hidden = true; $('replayBtn').hidden = false;
  cur = 0; renderPage(0); applyBook();
  burst(W / 2, H * .3, 40); sfx.chime();
}

/* ===================== SÁCH KỶ NIỆM ===================== */
let cur = 0, busy = false;
const letter = $('letter');
function renderPage(i) {
  const p = CONFIG.pages[i], box = $('pgText');
  $('pgTitle').textContent = fmt(p.title); box.textContent = '';
  fmt(p.text).split(/\n\s*\n/).forEach(t => { const el = document.createElement('p'); el.textContent = t; box.appendChild(el); });
  $('pgNum').textContent = `${i + 1} / ${CONFIG.pages.length}`;
  $('prevBtn').disabled = i === 0; $('nextBtn').disabled = i === CONFIG.pages.length - 1;
}
function flip(dir) {
  const ni = cur + dir; if (busy || ni < 0 || ni >= CONFIG.pages.length) return;
  busy = true; sfx.flip(); letter.classList.add(dir > 0 ? 'out-l' : 'out-r');
  setTimeout(() => {
    cur = ni; renderPage(cur); letter.classList.remove('out-l', 'out-r'); letter.classList.add(dir > 0 ? 'in-r' : 'in-l');
    setTimeout(() => { letter.classList.remove('in-r', 'in-l'); busy = false; }, 330);
  }, 300);
}
const applyBook = () => { $('bookWrap').hidden = !S.book; };

/* ===================== GẮN SỰ KIỆN ===================== */
$('title').textContent = CONFIG.title + ' ' + CONFIG.name;
$('sub').textContent = fmt(CONFIG.subtitle);
$('openBtn').textContent = fmt(CONFIG.openButton);

$('gateBtn').onclick = () => { started = true; A(); sfx.click(); syncMusic(); runIntro(); };
$('skipBtn').onclick = () => { sfx.click(); goCelebrate(); };
$('openBtn').onclick = goCelebrate;
$('replayBtn').onclick = () => { sfx.click(); runIntro(); };
$('prevBtn').onclick = () => flip(-1);
$('nextBtn').onclick = () => flip(1);

const soundLabel = () => { $('soundBtn').textContent = 'Âm thanh: ' + (S.sound ? 'Bật' : 'Tắt'); $('soundBtn').setAttribute('aria-pressed', S.sound); };
$('soundBtn').onclick = () => { S.sound = !S.sound; save(); soundLabel(); syncMusic(); sfx.click(); };

$('gearBtn').onclick = () => { sfx.click(); $('panel').hidden = !$('panel').hidden; };
$('closePanel').onclick = () => { $('panel').hidden = true; };
$('optBook').onchange = e => { S.book = e.target.checked; save(); applyBook(); };
$('optMusic').onchange = e => { S.music = e.target.checked; save(); syncMusic(); };
$('optConfetti').onchange = e => { S.confetti = e.target.checked; save(); };
$('optRain').onchange = e => { S.rain = e.target.value; save(); };
$('optBook').checked = S.book; $('optMusic').checked = S.music; $('optConfetti').checked = S.confetti; $('optRain').value = S.rain;
soundLabel();

// ripple khi bấm nút
document.addEventListener('click', e => {
  const b = e.target.closest('.btn'); if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement('span');
  s.className = 'rip'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 650);
});
// chạm màn hình bắn confetti
document.addEventListener('pointerdown', e => {
  if (!inParty || !S.confetti || e.target.closest('.btn,.panel,.letter-wrap')) return;
  burst(e.clientX, e.clientY);
});
