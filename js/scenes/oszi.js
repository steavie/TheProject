// ─── Oszillograph-Scene ───────────────────────────────────────────────────────
// Originalgetreue Simulation aus oszilograph-Prozedur (PROJEKT4.PAS)
// Sinus-Kurve auf einem Oszilloskop-Raster, mit PC-Speaker-Ton

const OsziScene = {
  _active: false,
  _state: 'input1',   // 'input1' | 'input2' | 'running'
  _blink: true,
  _blinkTimer: null,
  _raf: null,

  // Parameter
  _b: 2,      // Periodenzahl (float)
  _a: 100,    // Amplitude (*50 wie im Original)
  _inputBuf: '',

  // Animations-State
  _q: 120,    // aktuelles q (120..520 wie im Original)

  // Ton-State (Oszillator läuft kontinuierlich)
  _tonCtx: null,
  _tonOsc: null,
  _tonGain: null,

  start(canvas, ctx) {
    this._active = true;
    this._state = 'input1';
    this._inputBuf = '';
    this._blink = true;
    this._blinkTimer = setInterval(() => {
      this._blink = !this._blink;
      if (this._state !== 'running') this._drawInput(ctx);
    }, 530);
    App.setHint('Periodenzahl eingeben und ENTER drücken …');
    this._drawInput(ctx);
  },

  stop() {
    this._active = false;
    clearInterval(this._blinkTimer);
    cancelAnimationFrame(this._raf);
    this._stopTone();
  },

  onKey(key) {
    if (!this._active) return;
    if (this._state === 'running') {
      if (key === 'Escape' || key === 'q' || key === 'Q') {
        App.switchTo(MenuScene);
      } else {
        // Neuzeichnen
        this._restartAnim(App.ctx);
      }
      return;
    }
    if (key === 'Enter') {
      this._confirmInput(App.ctx);
    } else if (key === 'Backspace') {
      this._inputBuf = this._inputBuf.slice(0, -1);
      this._drawInput(App.ctx);
    } else if (key.length === 1 && this._inputBuf.length < 6) {
      this._inputBuf += key;
      this._drawInput(App.ctx);
    }
  },

  _confirmInput(ctx) {
    if (this._state === 'input1') {
      const val = parseFloat(this._inputBuf);
      this._b = isNaN(val) || val <= 0 ? 2 : val;
      this._inputBuf = '';
      this._state = 'input2';
      App.setHint('Amplitude eingeben und ENTER drücken …');
      this._drawInput(ctx);
    } else if (this._state === 'input2') {
      const val = parseInt(this._inputBuf);
      const a = isNaN(val) || val <= 0 ? 2 : val;
      this._a = a * 50; // wie im Original: a:=a*50
      this._inputBuf = '';
      this._startAnim(ctx);
    }
  },

  _drawInput(ctx) {
    ctx.fillStyle = ega(0);
    ctx.fillRect(0, 0, 640, 480);

    App.text(100, 30, 'OSZILLOGRAPH – PARAMETER', 13, 22);
    ctx.strokeStyle = ega(13);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(32, 58); ctx.lineTo(608, 58); ctx.stroke();

    const cursor = this._blink ? '█' : ' ';

    if (this._state === 'input1') {
      App.text(60, 120, '*Bitte geben Sie die Periodenzahl', 11, 20);
      App.text(60, 144, ' von 0 bis 2π ein*', 11, 20);
      App.text(60, 192, '> ' + this._inputBuf + cursor, 14, 22);
    } else {
      App.text(60, 80, '*Periodenzahl:', 8, 18);
      App.text(200, 80, String(this._b), 14, 18);

      App.text(60, 136, '*Bitte geben Sie die Amplitude', 11, 20);
      App.text(60, 160, ' der Sinuskurve ein*', 11, 20);
      App.text(60, 208, '> ' + this._inputBuf + cursor, 14, 22);
    }

    App.text(60, 380, 'ENTER = bestätigen   ESC = Menü', 8, 18);
  },

  _startAnim(ctx) {
    this._state = 'running';
    clearInterval(this._blinkTimer);
    App.setHint('ESC = Menü  |  Beliebige Taste = Neuzeichnen');
    this._restartAnim(ctx);
  },

  _restartAnim(ctx) {
    cancelAnimationFrame(this._raf);
    this._stopTone();
    this._q = 120;

    // Raster zeichnen
    this._drawGrid(ctx);

    // Ton-Oszillator starten (kontinuierlich, Frequenz wird laufend angepasst)
    this._startTone();

    this._raf = requestAnimationFrame(() => this._step(ctx));
  },

  _drawGrid(ctx) {
    // Schwarzer Hintergrund
    ctx.fillStyle = ega(0);
    ctx.fillRect(0, 0, 640, 480);

    // Titel (Magenta wie im Original: setcolor(13))
    App.text(10, 0, '                      Der Oszillograph mit der Sinusfunktion', 13, 18);

    // Rahmen: rectangle(xm-200, ym+200, xm+200, ym-200) = (120,40) bis (520,440)
    ctx.strokeStyle = ega(13);
    ctx.lineWidth = 1;
    ctx.strokeRect(120, 40, 400, 400);

    // Achsen
    ctx.strokeStyle = ega(13);
    // Horizontal durch Mitte (ym=240)
    ctx.beginPath(); ctx.moveTo(120, 240); ctx.lineTo(520, 240); ctx.stroke();
    // Vertikal durch Mitte (xm=320)
    ctx.beginPath(); ctx.moveTo(320, 40); ctx.lineTo(320, 440); ctx.stroke();

    // Skalenstriche (alle 50px)
    const ticks = [-150, -100, -50, 50, 100, 150];
    for (const d of ticks) {
      // Horizontal: x-Achse Striche
      ctx.beginPath(); ctx.moveTo(320 + d, 230); ctx.lineTo(320 + d, 250); ctx.stroke();
      // Vertikal: y-Achse Striche
      ctx.beginPath(); ctx.moveTo(310, 240 + d); ctx.lineTo(330, 240 + d); ctx.stroke();
    }
  },

  _step(ctx) {
    if (!this._active || this._state !== 'running') return;

    // Pro Frame mehrere Pixel zeichnen (wie das Original in einer schnellen Schleife)
    const stepsPerFrame = 8;
    for (let s = 0; s < stepsPerFrame; s++) {
      if (this._q > 520) {
        // Eine Periode fertig → kurze Pause, dann neu
        this._q = 120;
        this._drawGrid(ctx);
        break;
      }

      const y = 240 + Math.round(this._a * Math.sin(this._b * Math.PI * this._q / 180));

      // Clamp auf Raster
      if (y >= 40 && y <= 440) {
        ctx.fillStyle = ega(14); // Yellow wie im Original
        ctx.fillRect(this._q, y, 1, 1);
      }

      // Ton-Frequenz anpassen (wie sound(q + trunc(a*sin(...))))
      const freq = this._q + Math.round(this._a * Math.sin(this._b * Math.PI * this._q / 180));
      this._setToneFreq(Math.max(40, Math.min(4000, freq)));

      this._q++;
    }

    this._raf = requestAnimationFrame(() => this._step(ctx));
  },

  // ── Dauerton (Web Audio) ──────────────────────────────────────────────────
  _startTone() {
    if (Audio.muted) return;
    try {
      const ctx = Audio._getCtx();
      this._tonOsc = ctx.createOscillator();
      this._tonGain = ctx.createGain();
      this._tonOsc.connect(this._tonGain);
      this._tonGain.connect(ctx.destination);
      this._tonOsc.type = 'square';
      this._tonOsc.frequency.value = 440;
      this._tonGain.gain.value = 0.04;
      this._tonOsc.start();
    } catch (_) {}
  },

  _setToneFreq(freq) {
    if (this._tonOsc && !Audio.muted) {
      try { this._tonOsc.frequency.value = freq; } catch (_) {}
    }
  },

  _stopTone() {
    try { if (this._tonOsc) { this._tonOsc.stop(); this._tonOsc = null; } } catch (_) {}
  },
};
