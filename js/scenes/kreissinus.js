// ─── KreisSinus-Scene ─────────────────────────────────────────────────────────
// Originalgetreue Simulation aus kreissinus-Prozedur (PROJEKT4.PAS)
// Rotierender Radiusvektor im Kreis → Sinus & Kosinus werden live gezeichnet

const KreisSinusScene = {
  _active: false,
  _raf: null,
  _state: 'input',   // 'input' | 'running'

  // Parameter (Eingabe-Screen)
  _inputs: [
    { prompt: 'Genauigkeit (1-9, Empfehlung: 3):', key: 'g', val: '' },
    { prompt: 'Pixel-Abstand (1-5, Empfehlung: 2):', key: 'p', val: '' },
    { prompt: 'Ton: Sinus (s)  Kosinus (c)  Beide (b)  Kein (k):', key: 'ton', val: '' },
  ],
  _inputIdx: 0,
  _blink: true,
  _blinkTimer: null,

  // Laufzustand
  _angle: Math.PI / 2,
  _curveX: 0,
  _g: 3,
  _p: 2,
  _ton: 'k',
  _c: 1,        // Farbwechsel-Flag (1 oder -1)
  _durchl: 0,
  _co1: 11, _co2: 12, _co11: 13, _co22: 14,

  // Canvas-Puffer für die akkumulierten Kurven
  _offscreen: null,

  start(canvas, ctx) {
    this._active = true;
    this._state = 'input';
    this._inputIdx = 0;
    this._inputs.forEach(i => i.val = '');
    this._blink = true;
    this._blinkTimer = setInterval(() => {
      this._blink = !this._blink;
      if (this._state === 'input') this._drawInput(ctx);
    }, 530);
    App.setHint('Parameter eingeben und ENTER drücken …');
    this._drawInput(ctx);
  },

  stop() {
    this._active = false;
    clearInterval(this._blinkTimer);
    cancelAnimationFrame(this._raf);
  },

  onKey(key) {
    if (!this._active) return;
    if (this._state === 'input') {
      this._handleInput(key, App.ctx);
    } else {
      if (key === 'Escape' || key === 'q' || key === 'Q') {
        App.switchTo(MenuScene);
      } else {
        // Beliebige Taste: Neustart der Animation
        this._resetAnim(App.ctx);
      }
    }
  },

  _handleInput(key, ctx) {
    const inp = this._inputs[this._inputIdx];
    if (key === 'Enter') {
      if (inp.key === 'ton') {
        // Einzeltaste – schon gesetzt via _handleInput
        this._startAnim(ctx);
        return;
      }
      if (inp.val === '') return; // Leer → ignorieren
      this._inputIdx++;
      if (this._inputIdx >= this._inputs.length - 1) {
        // Ton-Eingabe: nächste Taste direkt
        this._drawInput(ctx);
      } else {
        this._drawInput(ctx);
      }
    } else if (key === 'Backspace') {
      inp.val = inp.val.slice(0, -1);
      this._drawInput(ctx);
    } else if (inp.key === 'ton' && 'sbck'.includes(key.toLowerCase())) {
      inp.val = key.toLowerCase();
      this._startAnim(ctx);
    } else if (key.length === 1 && inp.key !== 'ton') {
      if (inp.val.length < 2) {
        inp.val += key;
        this._drawInput(ctx);
      }
    }
  },

  _drawInput(ctx) {
    ctx.fillStyle = ega(0);
    ctx.fillRect(0, 0, 640, 480);

    App.text(120, 30, 'KREISSINUS – PARAMETER', 10, 22);
    ctx.strokeStyle = ega(10);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(32, 58); ctx.lineTo(608, 58); ctx.stroke();

    let y = 100;
    this._inputs.forEach((inp, idx) => {
      const color = idx < this._inputIdx ? 8 : (idx === this._inputIdx ? 14 : 7);
      App.text(60, y, inp.prompt, color, 20);
      if (idx < this._inputIdx) {
        App.text(60, y + 24, '  ► ' + inp.val, 10, 20);
      } else if (idx === this._inputIdx) {
        const cursor = this._blink ? '█' : ' ';
        App.text(60, y + 24, '  > ' + inp.val + cursor, 14, 20);
      }
      y += 80;
    });

    App.text(60, 380, 'ENTER = bestätigen   ESC = Menü', 8, 18);
  },

  _startAnim(ctx) {
    const gInp = parseInt(this._inputs[0].val) || 3;
    const pInp = parseInt(this._inputs[1].val) || 2;
    this._g = Math.max(1, Math.min(9, gInp));
    this._p = Math.max(1, Math.min(5, pInp));
    this._ton = this._inputs[2].val || 'k';
    this._state = 'running';
    clearInterval(this._blinkTimer);
    App.setHint('ESC = Menü  |  Beliebige Taste = Neustart');
    this._resetAnim(ctx);
  },

  _resetAnim(ctx) {
    this._angle = Math.PI / 2;
    this._curveX = 0;
    this._c = 1;
    this._durchl = 0;
    // Offscreen-Leinwand für akkumulierte Kurven
    this._offscreen = document.createElement('canvas');
    this._offscreen.width = 640;
    this._offscreen.height = 480;
    this._drawBase(this._offscreen.getContext('2d'));
    this._loop(ctx);
  },

  _drawBase(ctx2) {
    // Schwarzer Hintergrund
    ctx2.fillStyle = ega(0);
    ctx2.fillRect(0, 0, 640, 480);
    // Mittel-Horizontale
    ctx2.strokeStyle = ega(15);
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(0, 240); ctx2.lineTo(640, 240);
    ctx2.stroke();
    // Kreis-Vertikale
    ctx2.beginPath();
    ctx2.moveTo(140, 140); ctx2.lineTo(140, 340);
    ctx2.stroke();
    // Kreis
    ctx2.strokeStyle = ega(15);
    ctx2.beginPath();
    ctx2.arc(140, 240, 100, 0, 2 * Math.PI);
    ctx2.stroke();
  },

  _loop(ctx) {
    if (!this._active || this._state !== 'running') return;

    // Werte berechnen (genau wie im Pascal-Original)
    const g = this._g;
    const p = this._p;
    const v = 2 * Math.PI + Math.PI / 2;
    const xm = 320, ym = 240;
    const circX = 140; // xm - 180

    // Winkel-Schritt
    this._angle += g / 100;
    this._curveX += p;

    if (this._angle >= v) {
      this._angle = Math.PI / 2;
      this._curveX = 0;
      this._durchl++;
      this._c = -this._c;
      // Neue Basis zeichnen (löscht und setzt Grundlinien)
      this._drawBase(this._offscreen.getContext('2d'));
    }

    const a = 100 * Math.sin(this._angle);  // Sinus-Komponente
    const b = 100 * Math.cos(this._angle);  // Kosinus-Komponente

    const oc = this._offscreen.getContext('2d');

    const co1  = this._c ===  1 ? this._co1  : this._co11;
    const co2  = this._c ===  1 ? this._co2  : this._co22;

    // ── Kurven-Pixel auf Offscreen ──────────────────────────────────────────
    const cx = xm + this._curveX;
    // "SinKurve" (enthält cos-Wert – so war's im Original)
    oc.fillStyle = ega(co1);
    oc.fillRect(cx, ym + Math.round(b), 1, 1);
    // "CosKurve" (enthält neg. sin-Wert)
    oc.fillStyle = ega(co2);
    oc.fillRect(cx, ym + Math.round(-a), 1, 1);

    // ── Live-Linien (im Kreis) ──────────────────────────────────────────────
    // Radial: Mittelpunkt → Punkt auf Kreis
    oc.strokeStyle = ega(15);
    oc.lineWidth = 1;
    oc.beginPath();
    oc.moveTo(circX, ym);
    oc.lineTo(circX + Math.round(a), ym + Math.round(b));
    oc.stroke();
    // Sinus-Strecke (senkrecht)
    oc.strokeStyle = ega(co1);
    oc.beginPath();
    oc.moveTo(circX + Math.round(a), ym);
    oc.lineTo(circX + Math.round(a), ym + Math.round(b));
    oc.stroke();
    // Kosinus-Waagerechte
    oc.strokeStyle = ega(co2);
    oc.beginPath();
    oc.moveTo(circX, ym + Math.round(b));
    oc.lineTo(circX + Math.round(a), ym + Math.round(b));
    oc.stroke();

    // ── Wischer-Linie ───────────────────────────────────────────────────────
    oc.strokeStyle = ega(0);
    oc.lineWidth = 1;
    oc.beginPath();
    oc.moveTo(cx + 1, 140); oc.lineTo(cx + 1, 340);
    oc.stroke();

    // ── Auf Haupt-Canvas übertragen ─────────────────────────────────────────
    ctx.drawImage(this._offscreen, 0, 0);

    // ── Kreis + Radius oben drauf (live, nicht persistent) ──────────────────
    ctx.strokeStyle = ega(15);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(circX, ym, 100, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(circX, ym);
    ctx.lineTo(circX + Math.round(a), ym + Math.round(b));
    ctx.stroke();
    // Punkt auf Kreis
    ctx.fillStyle = ega(15);
    ctx.beginPath();
    ctx.arc(circX + Math.round(a), ym + Math.round(b), 3, 0, 2 * Math.PI);
    ctx.fill();

    // ── Info-Text oben ──────────────────────────────────────────────────────
    // Lösche Infozeile
    ctx.fillStyle = ega(0);
    ctx.fillRect(0, 0, 640, 20);
    App.text(2,  1, 'Kosinus=' + Math.round(-a), co2, 18);
    App.text(220, 1, 'Sinus='  + Math.round(b),  co1, 18);
    App.text(410, 1, 'Durchläufe=' + this._durchl, 15, 18);

    // ── Ton ─────────────────────────────────────────────────────────────────
    if (this._ton === 's') Audio.beep(ym - Math.round(b), 4);
    if (this._ton === 'c') Audio.beep(xm - Math.round(-a), 4);
    if (this._ton === 'b') {
      Audio.beep(Math.abs(ym - Math.round(-a)), 3);
    }

    this._raf = requestAnimationFrame(() => this._loop(ctx));
  },
};
