// ─── Intro-Scene ─────────────────────────────────────────────────────────────
// Buchstaben-für-Buchstaben-Animation aus PROJEKT3/4.PAS
// Fix: _sleepResolve (aktueller Sleep) getrennt von _doneResolve (Autoren-Phase beenden)

const IntroScene = {
  _active: false,
  _sleepResolve: null,   // weckt nur den aktuellen Sleep auf
  _doneResolve: null,    // beendet die Autoren-Schleife → zum Menü
  _skipToAuthors: false, // Taste in Schreibphase → direkt zu Autoren-Anzeige

  start(_canvas, ctx) {
    this._active = true;
    this._skipToAuthors = false;
    this._sleepResolve = null;
    this._doneResolve = null;
    App.setHint('Beliebige Taste drücken zum Überspringen …');
    this._run(ctx);
  },

  stop() {
    this._active = false;
    if (this._sleepResolve) { const r = this._sleepResolve; this._sleepResolve = null; r(); }
    if (this._doneResolve)  { const r = this._doneResolve;  this._doneResolve  = null; r(); }
  },

  onKey() {
    if (!this._active) return;
    if (this._doneResolve) {
      // Wir sind in der Autoren-Schleife → Menü
      const sleep = this._sleepResolve; this._sleepResolve = null;
      const done  = this._doneResolve;  this._doneResolve  = null;
      if (sleep) sleep(); // aktuellen Sleep sofort beenden
      done();             // äußere Promise auflösen → switchTo MenuScene
    } else {
      // Wir sind noch in der Schreibphase → direkt zu Autoren springen
      this._skipToAuthors = true;
      if (this._sleepResolve) { const r = this._sleepResolve; this._sleepResolve = null; r(); }
    }
  },

  // ── Animation ──────────────────────────────────────────────────────────────
  async _run(ctx) {
    const sleep = ms => new Promise(res => {
      const id = setTimeout(res, ms);
      this._sleepResolve = () => { clearTimeout(id); res(); };
    });

    const cls = (c = 0) => {
      ctx.fillStyle = ega(c);
      ctx.fillRect(0, 0, 640, App.canvas.height);
    };

    const type = async (str, x, y, colorIdx, sizePx) => {
      if (!this._active || this._skipToAuthors) return;
      ctx.fillStyle = ega(colorIdx);
      ctx.font = `${sizePx}px VT323`;
      const cw = ctx.measureText('M').width;
      for (let i = 0; i < str.length; i++) {
        if (!this._active || this._skipToAuthors) return;
        ctx.fillText(str[i], x + i * cw, y + sizePx * 0.82);
        Audio.beep(5000, 18);
        await sleep(75);
      }
    };

    const pause = async ms => {
      if (!this._active || this._skipToAuthors) return;
      await sleep(ms);
    };

    // Zentriert auf 640px (VT323 ≈ 0.6 * sizePx Zeichenbreite)
    const cx = (str, sz) => Math.round((640 - str.length * sz * 0.6) / 2);

    // ── Phase 1: INFORMATIK SOFTWARE ───────────────────────────────────────
    if (!this._skipToAuthors) {
      cls();
      const s1 = 'INFORMATIK SOFTWARE';
      await type(s1, cx(s1, 26), 216, 10, 26);
      await pause(1200);
    }

    // ── Phase 2: PRÄSENTIERT ───────────────────────────────────────────────
    if (!this._skipToAuthors) {
      cls();
      const s2 = 'PRÄSENTIERT';
      await type(s2, cx(s2, 26), 216, 10, 26);
      await pause(1200);
    }

    // ── Phase 3: THE PROJECT (rot) + Rausch-Pixel ─────────────────────────
    if (!this._skipToAuthors) {
      cls();
      const s3 = 'THE PROJECT';
      await type(s3, cx(s3, 26), 216, 4, 26);

      // Roter Pixelregen (wie original: 50000 putpixel)
      for (let b = 0; b < 16 && !this._skipToAuthors && this._active; b++) {
        for (let i = 0; i < 500; i++) {
          ctx.fillStyle = ega(4);
          ctx.fillRect(Math.random() * 640 | 0, Math.random() * 100 | 0, 1, 1);
          ctx.fillRect(Math.random() * 100 | 0, Math.random() * 640 | 0, 1, 1);
        }
        await sleep(40);
      }

      if (!this._skipToAuthors) {
        const s4 = 'WOS WRITTEN BY...';
        await type(s4, cx(s4, 26), 280, 10, 26);
        await pause(1200);
      }
    }

    // ── Phase 4: Autoren-Namen – Farbwechsel ──────────────────────────────
    if (!this._active) return;
    cls();
    App.setHint('Beliebige Taste drücken …');

    const dev  = Math.random() < 0.5 ? 1 : 2;
    const pos1 = dev === 1 ? 60  : 260;
    const pos2 = dev === 1 ? 260 : 60;
    let fa = 1;
    let looping = true;

    const drawAuthors = async () => {
      while (this._active && looping) {
        fa = (fa % 15) + 1;
        cls();
        ctx.font = '80px VT323';
        ctx.fillStyle = ega(fa);
        ctx.fillText('Stefan Kriesel', 30, pos1 + 66);

        ctx.font = '36px VT323';
        ctx.fillStyle = ega(15);
        const andX = Math.round((640 - ctx.measureText('and').width) / 2);
        ctx.fillText('and', andX, 178);

        ctx.font = '80px VT323';
        ctx.fillStyle = ega(fa);
        ctx.fillText('Nico Winkler', 43, pos2 + 66);

        ctx.font = '18px VT323';
        ctx.fillStyle = ega(8);
        ctx.fillText('(c)1995  Informatik-Projekt', 196, 460);

        await sleep(110);
      }
    };

    await new Promise(res => {
      this._doneResolve = () => { looping = false; res(); };
      drawAuthors();
    });

    if (this._active) App.switchTo(MenuScene);
  },
};
