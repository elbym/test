const FONT_SIZE = 18;
const FONT_FAMILY = 'monospace';

// Rope physics
const ANCHOR_K  = 6.0;  // top-anchor spring
const SEGMENT_K = 4.5;  // coupling between rope segments (top→bottom)
const COL_K     = 0.12; // coupling between adjacent ropes (curtain fabric)
const DAMPING   = 1.8;  // velocity damping

// Finger interaction
const FINGER_K = 450;
const FINGER_R = 90;

const TEXT = [
  'Der Wind streicht sanft durch die alten Zeilen,',
  'er trägt die Worte fort ins weite Land.',
  'Die Buchstaben tanzen auf unsichtbaren Seilen,',
  'geformt von einer flüchtigen, warmen Hand.',
  'Kein Satz bleibt starr, kein Wort bleibt stumm,',
  'wenn Luft und Licht durch Zeichen ziehen.',
  'Die Sprache dreht sich leise, dreht sich um,',
  'wie Vorhang-Falten, die im Abend glühen.',
];

const COLS = Math.max(...TEXT.map(l => l.length));
const ROWS = TEXT.length;
const LINES = TEXT.map(l => l.padEnd(COLS, ' '));

let canvas, ctx;
let charW, charH;
let textX, textY;
let pos, vel;
let mouseX = -9999, mouseY = -9999;
let lastTime = 0;

function init() {
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });
  pos = new Float32Array(ROWS * COLS);
  vel = new Float32Array(ROWS * COLS);
  requestAnimationFrame(loop);
}

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  charW = ctx.measureText('M').width;
  charH = FONT_SIZE * 1.5;
  textX = Math.floor((canvas.width  - COLS * charW) / 2);
  textY = Math.floor((canvas.height - ROWS * charH) / 2) + FONT_SIZE;
}

function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.033);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  const acc = new Float32Array(ROWS * COLS);

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const i = row * COLS + col;
      let f = 0;

      // Velocity damping
      f -= DAMPING * vel[i];

      // Rope chain: top row anchored to ceiling, each segment follows the one above
      if (row === 0) {
        f -= ANCHOR_K * pos[i];
      } else {
        f += SEGMENT_K * (pos[(row - 1) * COLS + col] - pos[i]);
      }

      // Light coupling between adjacent ropes (curtain feel)
      if (col > 0)        f += COL_K * (pos[i - 1] - pos[i]);
      if (col < COLS - 1) f += COL_K * (pos[i + 1] - pos[i]);

      // Finger: push rope away from cursor based on current rope position
      if (mouseX > -9000) {
        const cx = textX + col * charW + pos[i];  // current x of this character
        const cy = textY + row * charH - charH * 0.5;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const d2 = dx * dx + dy * dy;
        const r2 = FINGER_R * FINGER_R;
        if (d2 < r2 * 9) {
          const dist = Math.sqrt(d2) + 0.1;
          const g = Math.exp(-d2 / r2);
          f += FINGER_K * g * dx / dist;  // push away from cursor
        }
      }

      acc[i] = f;
    }
  }

  for (let i = 0; i < ROWS * COLS; i++) {
    vel[i] += acc[i] * dt;
    pos[i] += vel[i] * dt;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'alphabetic';

  for (let row = 0; row < ROWS; row++) {
    const line  = LINES[row];
    const baseY = textY + row * charH;
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col;
      const x = textX + col * charW + pos[i];
      const t = Math.min(Math.abs(pos[i]) / 50, 1);
      const r = Math.round(220 + 35 * t);
      const g = Math.round(220 - 80 * t);
      const b = Math.round(220 - 120 * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillText(line[col], x, baseY);
    }
  }
}

window.addEventListener('load', init);
