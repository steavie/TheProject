// ─── Sonnensystem-Scene ───────────────────────────────────────────────────────
// Originalgetreue Simulation aus UFO-Prozedur (PROJEKT4.PAS)
// Merkur, Venus, Erde+Mond, Mars+Phobos+Deimos, Jupiter+16 Monde, Saturn+Ring

const SolarScene = {
  _active: false,
  _raf: null,
  _last: 0,

  // Steuerung
  _showNames:   false,
  _showOrbits:  false,
  _showMoons:   false,
  _infoMode:    'dist',   // 'dist' | 'temp'

  // Winkel der Planeten (rad)
  _ang: {},

  // Sterne (einmalig generiert)
  _stars: [],

  // ── Konstanten aus PROJEKT4.PAS ──────────────────────────────────────────
  XM: 320, YM: 240,
  A: 1.5,  B: 0.75,   // Orbit-Stretch für Perspektiv-Ellipse

  // Orbit-Radien
  R: {
    merkur:  80 * 0.39,
    venus:   80 * 0.72,
    erde:    80 * 1.00,
    mars:    80 * 1.52,
    jupiter: 80 * 2.00,
    saturn:  80 * 2.50,
  },

  // Planeten-Körper-Radien (rx)
  RX: { merkur:2, venus:4, erde:4, mars:3, jupiter:10, saturn:6, mond:2 },

  // Orbital-Winkelgeschwindigkeiten (rad/frame bei 60fps, skaliert auf Originalwerte)
  // Original: x += 0.03 / Umlaufzeit_in_Jahren; bei ~delay(5) = 5ms ≈ 200fps
  // Hier: Skala so, dass es flüssig & erkennbar ist
  SPD: {
    merkur:  0.03 / 0.24,
    venus:   0.03 / 0.62,
    erde:    0.03 / 1.00,
    mars:    0.03 / 2.88,
    jupiter: 0.03 / 11.86,
    saturn:  0.03 / 29.46,
    mond:    0.03 / (1/12),
    io:      0.03 / (1/16),
    europa:  0.03 / (1/15),
    ganymed: 0.03 / (1/14),
    callisto:0.03 / (1/13),
    phobos:  0.03 / (1/5),
    deimos:  0.03 / (1/4),
  },

  // Jupiter-Mond-Radien (um Jupiter)
  J_RADII: [12,13,24,16,17,18,21,8,19,5,27,25],

  start(_canvas, ctx) {
    this._active = true;
    this._showNames  = false;
    this._showOrbits = false;
    this._showMoons  = false;
    this._infoMode   = 'dist';

    App.setHint('N=Namen  B=Bahnen  M=Monde  I/Z=Info  Q=Menü');

    // Anfangswinkel zufällig (wie im Original: 100/random(100)+1)
    const rnd = () => (100 / (Math.random() * 99 + 1));
    this._ang = {
      merkur: rnd(), venus: rnd(), erde: rnd(), mars: rnd(),
      jupiter: rnd(), saturn: rnd(),
      mond: rnd(), io: rnd(), europa: rnd(), ganymed: rnd(), callisto: rnd(),
      phobos: rnd(), deimos: rnd(),
    };
    // 12 unbekannte Jupiter-Monde
    this._junk = Array.from({length:12}, rnd);
    this._junkSpd = [1/2,1/1,1/10,1/9,1/4,1/4,1/6,1/5,1/4,1/3,1/2,1/1]
      .map(s => 0.03 * s);

    // Sterne generieren (wie im Original: 300 Pixel)
    this._stars = [];
    for (let i = 0; i < 300; i++) {
      this._stars.push({
        x: Math.random() * 640 | 0,
        y: Math.random() * 390 | 0,
        c: Math.random() < 0.7 ? 15 : 14,
      });
    }

    this._last = performance.now();
    this._raf = requestAnimationFrame(t => this._loop(ctx, t));
  },

  stop() {
    this._active = false;
    cancelAnimationFrame(this._raf);
  },

  onKey(key) {
    if (!this._active) return;
    switch (key.toLowerCase()) {
      case 'n': this._showNames  = !this._showNames;  break;
      case 'b': this._showOrbits = !this._showOrbits; break;
      case 'm': this._showMoons  = !this._showMoons;  break;
      case 'i': this._infoMode   = 'temp'; break;
      case 'z': this._infoMode   = 'dist'; break;
      case 'q': App.switchTo(MenuScene); break;
    }
  },

  _loop(ctx, now) {
    if (!this._active) return;

    const dt = Math.min(now - this._last, 50);
    this._last = now;
    const scale = dt / 16.67; // normalisiert auf 60fps

    // Winkel inkrementieren
    for (const [k, spd] of Object.entries(this.SPD)) {
      if (this._ang[k] !== undefined) this._ang[k] += spd * scale;
    }
    for (let i = 0; i < 12; i++) {
      this._junk[i] += this._junkSpd[i] * scale;
    }

    this._draw(ctx);
    this._raf = requestAnimationFrame(t => this._loop(ctx, t));
  },

  // ── Planeten-Position berechnen (wie im Original) ─────────────────────────
  pos(r, ang) {
    return {
      x: this.XM + r * this.A * Math.sin(ang),
      y: this.YM + r * this.B * Math.cos(ang),
    };
  },

  // ── Hauptzeichenroutine ───────────────────────────────────────────────────
  _draw(ctx) {
    const { XM, YM, A, B, R, RX } = this;

    // Hintergrund
    ctx.fillStyle = ega(0);
    ctx.fillRect(0, 0, 640, 400);

    // Sterne
    for (const s of this._stars) {
      ctx.fillStyle = ega(s.c);
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // ── Planetenbahnen (optional) ──────────────────────────────────────────
    if (this._showOrbits) {
      ctx.strokeStyle = ega(15);
      ctx.lineWidth = 0.5;
      for (const [, r] of Object.entries(R)) {
        ctx.beginPath();
        ctx.ellipse(XM, YM, r * A, r * B, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // ── Sonne ─────────────────────────────────────────────────────────────
    ctx.fillStyle = ega(14);
    ctx.beginPath();
    ctx.ellipse(XM, YM, 20, 15, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Sonnen-Glanz
    ctx.fillStyle = 'rgba(255,255,100,0.15)';
    ctx.beginPath();
    ctx.ellipse(XM, YM, 30, 22, 0, 0, 2 * Math.PI);
    ctx.fill();

    // ── Hilfsfunktion: Planet zeichnen ─────────────────────────────────────
    const planet = (key, colorIdx, rx, ry) => {
      const {x, y} = this.pos(R[key], this._ang[key]);
      ctx.fillStyle = ega(colorIdx);
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry ?? rx - 1, 0, 0, 2 * Math.PI);
      ctx.fill();
      return {x, y};
    };

    const moon = (cx, cy, orbR, ang, colorIdx, rx = 2, ry = 1) => {
      const x = cx + orbR * A * Math.sin(ang);
      const y = cy + orbR * B * Math.cos(ang);
      ctx.fillStyle = ega(colorIdx);
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
      ctx.fill();
      return {x, y};
    };

    const label = (x, y, str, colorIdx) => {
      ctx.fillStyle = ega(colorIdx);
      ctx.font = '14px VT323';
      ctx.fillText(str, x + 7, y - 6);
    };

    // ── Merkur ───────────────────────────────────────────────────────────
    const pm = planet('merkur', 10, RX.merkur);   // LightGreen
    if (this._showNames) label(pm.x, pm.y, 'Merkur', 10);

    // ── Venus ─────────────────────────────────────────────────────────────
    const pv = planet('venus', 13, RX.venus, RX.venus - 1);   // LightMagenta
    if (this._showNames) label(pv.x, pv.y, 'Venus', 13);

    // ── Erde ──────────────────────────────────────────────────────────────
    const pe = planet('erde', 9, RX.erde, RX.erde - 1);    // LightBlue
    if (this._showNames) label(pe.x, pe.y, 'Erde', 9);

    // Erdmond
    const mondPos = moon(pe.x, pe.y, 10, this._ang.mond, 15);
    if (this._showMoons) label(mondPos.x, mondPos.y, 'Mond', 15);

    // ── Mars ──────────────────────────────────────────────────────────────
    const pma = planet('mars', 4, RX.mars, RX.mars - 1);    // Red
    if (this._showNames) label(pma.x, pma.y, 'Mars', 4);

    // Mars-Monde
    const phobosPos = moon(pma.x, pma.y, 9, this._ang.phobos, 11, 1, 1);
    const deimosPos = moon(pma.x, pma.y, 12, this._ang.deimos, 1, 1, 1);
    if (this._showMoons) {
      label(phobosPos.x, phobosPos.y, 'Phobos', 11);
      label(deimosPos.x, deimosPos.y, 'Deimos', 1);
    }

    // ── Jupiter (+ Monde zuerst hinter Planet) ────────────────────────────
    const pj = this.pos(R.jupiter, this._ang.jupiter);

    // Jupiter-Galilei-Monde
    const ioPos  = moon(pj.x, pj.y, 11, this._ang.io,       9,  1, 1);
    const euPos  = moon(pj.x, pj.y, 15, this._ang.europa,   4,  1, 1);
    const ganPos = moon(pj.x, pj.y, 22, this._ang.ganymed,  14, 1, 1);
    const calPos = moon(pj.x, pj.y, 28, this._ang.callisto, 5,  1, 1);

    // 12 unbekannte Jupiter-Monde
    ctx.fillStyle = ega(15);
    for (let i = 0; i < 4; i++) {
      moon(pj.x, pj.y, this.J_RADII[i], this._junk[i], 15, 1, 1);
    }
    ctx.fillStyle = ega(10);
    for (let i = 4; i < 8; i++) {
      moon(pj.x, pj.y, this.J_RADII[i], this._junk[i], 10, 1, 1);
    }
    ctx.fillStyle = ega(12);
    for (let i = 8; i < 12; i++) {
      moon(pj.x, pj.y, this.J_RADII[i], this._junk[i], 12, 1, 1);
    }

    // Jupiter-Körper
    ctx.fillStyle = ega(14);
    ctx.beginPath();
    ctx.ellipse(pj.x, pj.y, RX.jupiter, RX.jupiter - 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Jupiter-Band (Fl.JUP)
    ctx.fillStyle = ega(4);
    ctx.beginPath();
    ctx.ellipse(pj.x + 3, pj.y - 1, 4, 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    if (this._showNames) label(pj.x, pj.y, 'Jupiter', 14);
    if (this._showMoons) {
      label(ioPos.x,  ioPos.y,  'Io',       2);
      label(euPos.x,  euPos.y,  'Europa',   4);
      label(ganPos.x, ganPos.y, 'Ganymed',  14);
      label(calPos.x, calPos.y, 'Callisto', 5);
    }

    // ── Saturn (+ Ring) ───────────────────────────────────────────────────
    const ps = this.pos(R.saturn, this._ang.saturn);

    // Ring hinten (untere Hälfte)
    ctx.strokeStyle = ega(14);
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.ellipse(ps.x, ps.y, 10 + i, 4, 0, 0, Math.PI);
      ctx.stroke();
    }

    // Saturn-Körper
    ctx.fillStyle = ega(7);
    ctx.beginPath();
    ctx.ellipse(ps.x, ps.y, RX.saturn, RX.saturn - 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Ring vorne (obere Hälfte)
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.ellipse(ps.x, ps.y, 10 + i, 4, 0, Math.PI, 2 * Math.PI);
      ctx.stroke();
    }

    if (this._showNames) label(ps.x, ps.y, 'Saturn', 7);

    // ── Info-Tabelle unten ────────────────────────────────────────────────
    this._drawTable(ctx);

    // ── Tastatur-Hinweise oben ────────────────────────────────────────────
    ctx.font = '13px VT323';
    ctx.fillStyle = ega(11);
    ctx.fillText('Planetenbahnen EIN/AUS = (-b-)', 2, 14);
    ctx.fillStyle = ega(10);
    ctx.fillText('Planetennamen EIN/AUS = (-n-)', 380, 14);
    ctx.fillStyle = ega(11);
    ctx.fillText('Mondnamen EIN/AUS = (-m-)', 2, 26);
    ctx.fillStyle = ega(14);
    ctx.fillText('Mehr Infos = (-i/z-)', 450, 26);
    ctx.fillStyle = ega(12);
    ctx.fillText('Quit = (-q-)', 2, 396);

    // Titel
    ctx.fillStyle = ega(13);
    ctx.font = '22px VT323';
    const title = 'Unser Universum';
    ctx.fillText(title, Math.round((640 - ctx.measureText(title).width) / 2), 36);
  },

  _drawTable(ctx) {
    const T = 402;   // Tabellenstart y
    const DY = 15;   // Zeilenabstand
    const SZ = 14;   // Schriftgröße

    // Trennlinie
    ctx.strokeStyle = ega(8);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, T - 2); ctx.lineTo(640, T - 2);
    ctx.stroke();

    ctx.fillStyle = ega(0);
    ctx.fillRect(0, T - 2, 640, 120);

    if (this._infoMode === 'dist') {
      App.text(2, T,         'Name    | Entf. von Sonne | Umlaufzeit  |  Ø km  | Rotationsdauer |', 14, SZ);
      App.text(2, T+DY,     '────────────────────────────────────────────────────────────────────', 8,  SZ);
      App.text(2, T+DY*2,   'Merkur  |      58 Mio.km  |    88 Tage |   4848 | 58t 15h 00min. |', 10, SZ);
      App.text(2, T+DY*3,   'Venus   |     108 Mio.km  |   225 Tage |  12104 |243t  2h 00min. |', 13, SZ);
      App.text(2, T+DY*4,   'Erde    |     149 Mio.km  |  1.00 Jahr |  12756 |     23h 56min. |',  9, SZ);
      App.text(2, T+DY*5,   'Mars    |     227 Mio.km  | 1.88 Jahre |   6794 |     24h 37min. |', 12, SZ);
      App.text(2, T+DY*6,   'Jupiter |     778 Mio.km  |11.86 Jahre | 142796 |      9h 55min. |', 14, SZ);
      App.text(2, T+DY*7,   'Saturn  |    1427 Mio.km  |29.46 Jahre | 120670 |     10h 14min. |',  7, SZ);
    } else {
      App.text(2, T,         'Name    | Monde |  Bekannteste Monde                   | Tagetemp. |', 15, SZ);
      App.text(2, T+DY,     '───────────────────────────────────────────────────────────────────', 8,  SZ);
      App.text(2, T+DY*2,   'Merkur  |   0   | ───────────────────────────────────  |  +170° C  |', 10, SZ);
      App.text(2, T+DY*3,   'Venus   |   0   | ───────────────────────────────────  |  +465° C  |', 13, SZ);
      App.text(2, T+DY*4,   'Erde    |   1   | Mond (auch Erdtrabant)               |   +15° C  |',  9, SZ);
      App.text(2, T+DY*5,   'Mars    |   2   | Phobos und Deimos                    |   -23° C  |', 12, SZ);
      App.text(2, T+DY*6,   'Jupiter |  16   | Io, Europa, Ganymed, Callisto        |  -150° C  |', 14, SZ);
      App.text(2, T+DY*7,   'Saturn  |  19   | Titan, Janus und Epimetheus          |  -180° C  |',  7, SZ);
    }
  },
};
