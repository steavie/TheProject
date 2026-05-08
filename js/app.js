// Zentrale App – Scene-Manager, Eingabe, Canvas-Helfer
const App = {
  canvas: null,
  ctx: null,
  current: null,

  init() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');

    document.addEventListener('keydown', e => {
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
        e.preventDefault();
      if (!Audio.muted) Audio._getCtx(); // AudioContext bei erster User-Geste aufwecken
      if (this.current && this.current.onKey) this.current.onKey(e.key);
    });

    document.getElementById('mute-btn').addEventListener('click', () => Audio.toggle());

    this.switchTo(IntroScene);
  },

  switchTo(scene) {
    if (this.current && this.current.stop) this.current.stop();
    this.current = scene;
    scene.start(this.canvas, this.ctx);
  },

  setHint(txt) {
    const el = document.getElementById('hint-text');
    if (el) el.textContent = txt;
  },

  // ── Canvas-Helfer ─────────────────────────────────────

  cls(colorIdx = 0) {
    this.ctx.fillStyle = ega(colorIdx);
    this.ctx.fillRect(0, 0, 640, this.canvas.height);
  },

  pixel(x, y, colorIdx) {
    this.ctx.fillStyle = ega(colorIdx);
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  },

  line(x1, y1, x2, y2, colorIdx) {
    const ctx = this.ctx;
    ctx.strokeStyle = ega(colorIdx);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
    ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
    ctx.stroke();
  },

  rect(x1, y1, x2, y2, colorIdx) {
    const ctx = this.ctx;
    ctx.strokeStyle = ega(colorIdx);
    ctx.lineWidth = 1;
    const lx = Math.min(x1, x2), rx = Math.max(x1, x2);
    const ty = Math.min(y1, y2), by = Math.max(y1, y2);
    ctx.strokeRect(lx + 0.5, ty + 0.5, rx - lx, by - ty);
  },

  fillEllipse(cx, cy, rx, ry, colorIdx) {
    const ctx = this.ctx;
    ctx.fillStyle = ega(colorIdx);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fill();
  },

  ellipseArc(cx, cy, rx, ry, a1deg, a2deg, colorIdx) {
    const ctx = this.ctx;
    ctx.strokeStyle = ega(colorIdx);
    ctx.lineWidth = 1;
    // BGI: angle 0=right, wächst gegen Uhrzeigersinn (wegen y↓ wirkt es im Uhrzeigersinn)
    const a1 = -a1deg * Math.PI / 180;
    const a2 = -a2deg * Math.PI / 180;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, a1, a2, true); // ccw in math = cw on screen
    ctx.stroke();
  },

  // VT323-Text wie BGI outtextxy (x/y = obere linke Ecke des Textes)
  text(x, y, str, colorIdx, sizePx = 18) {
    const ctx = this.ctx;
    ctx.fillStyle = ega(colorIdx);
    ctx.font = `${sizePx}px VT323`;
    ctx.fillText(str, x, y + sizePx * 0.82);
  },
};

window.addEventListener('load', () => {
  document.fonts.ready.then(() => App.init());
});
