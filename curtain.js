const FONT_SIZE = 18;
const FONT_FAMILY = 'Courier New, monospace';
const STIFFNESS = 0.08;
const DAMPING = 0.75;
const COUPLING = 0.015;
const MOUSE_STRENGTH = 220;
const MOUSE_RADIUS = 90;

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
const LINES = TEXT.map(l => l.padEnd(COLS, ' '));

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
  canvas.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  pos = new Float32Array(COLS);
  vel = new Float32Array(COLS);

  requestAnimationFrame(loop);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  const metrics = ctx.measureText('M');
  charW = metrics.width;
  charH = FONT_SIZE * 1.5;
  const totalW = COLS * charW;
  const totalH = LINES.length * charH;
  textX = Math.floor((canvas.width - totalW) / 2);
  textY = Math.floor((canvas.height - totalH) / 2) + FONT_SIZE;
}

function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  const force = new Float32Array(COLS);

  // mouse force
  if (mouseX > -9000) {
    for (let c = 0; c < COLS; c++) {
      const cx = textX + c * charW + charW * 0.5;
      const dx = mouseX - cx;
      const dy = mouseY - (textY + (LINES.length * charH) * 0.5);
      const dist2 = dx * dx + dy * dy;
      const r2 = MOUSE_RADIUS * MOUSE_RADIUS;
      const gaussian = Math.exp(-dist2 / r2);
      force[c] += MOUSE_STRENGTH * gaussian;
    }
  }

  // spring + damping + neighbor coupling
  for (let c = 0; c < COLS; c++) {
    force[c] -= STIFFNESS * pos[c] / dt;
    force[c] -= DAMPING * vel[c] / dt;
    if (c > 0)        force[c] += COUPLING * (pos[c - 1] - pos[c]) / dt;
    if (c < COLS - 1) force[c] += COUPLING * (pos[c + 1] - pos[c]) / dt;
  }

  for (let c = 0; c < COLS; c++) {
    vel[c] += force[c] * dt * dt;
    pos[c] += vel[c] * dt;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'alphabetic';

  for (let row = 0; row < LINES.length; row++) {
    const line = LINES[row];
    const baseY = textY + row * charH;

    for (let col = 0; col < COLS; col++) {
      const ch = line[col];
      const x = textX + col * charW;
      const y = baseY + pos[col];

      // color: shift with displacement
      const t = Math.min(Math.abs(pos[col]) / 60, 1);
      const r = Math.round(220 + 35 * t);
      const g = Math.round(220 - 80 * t);
      const b = Math.round(220 - 120 * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;

      ctx.fillText(ch, x, y);
    }
  }
}

window.addEventListener('load', init);
