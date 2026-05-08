// ─── Menu-Scene ───────────────────────────────────────────────────────────────
// DOS-Hauptmenü – roter Hintergrund, blauer Text, genau wie im Original

const MenuScene = {
  _active: false,
  _blinkOn: true,
  _blinkTimer: null,

  start(_canvas, ctx) {
    this._active = true;
    App.setHint('K = Kreissinus  |  O = Oszillograph  |  U = Universum  |  Q = Beenden');
    this._draw(ctx);
    // Blinkender Cursor-Effekt auf dem Cursor-Marker
    this._blinkTimer = setInterval(() => {
      if (!this._active) return;
      this._blinkOn = !this._blinkOn;
      this._drawCursor(ctx);
    }, 530);
  },

  stop() {
    this._active = false;
    clearInterval(this._blinkTimer);
  },

  onKey(key) {
    if (!this._active) return;
    switch (key.toLowerCase()) {
      case 'k': App.switchTo(KreisSinusScene); break;
      case 'o': App.switchTo(OsziScene);       break;
      case 'u': App.switchTo(SolarScene);      break;
      case 'q': App.switchTo(IntroScene);      break;
    }
  },

  _draw(ctx) {
    // Roter Hintergrund (wie textbackground(red) im Original)
    ctx.fillStyle = ega(4);
    ctx.fillRect(0, 0, 640, 480);

    // Weißer Rahmen
    ctx.strokeStyle = ega(15);
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 20, 580, 440);

    const T = (x, y, str, color, sz = 20) => App.text(x, y, str, color, sz);

    // ── Kopfzeile ──────────────────────────────────────────────────────────
    T(40, 28, 'INFORMATIK - SOFTWARE', 14, 22);   // Yellow

    // Trennlinie
    ctx.strokeStyle = ega(14);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 56); ctx.lineTo(608, 56);
    ctx.stroke();

    // ── "ENDE" oben rechts ─────────────────────────────────────────────────
    T(490, 28, 'ENDE = (-q-)', 12, 18);           // LightRed

    // ── Sinusfunktion-Menü ─────────────────────────────────────────────────
    T(60, 78, 'Möchten Sie die Sinusfunktion am', 9, 20);   // LightBlue
    T(60, 104, '                              Kreis        (dann -k-)', 9, 20);
    T(60, 130, '          ?-?-?-?-?          oder im', 9, 20);
    T(60, 156, '          ?       ?       Osszylographen  (dann -o-)', 9, 20);
    T(60, 182, '          ?-?-?-?-?           S E H E N  ?', 9, 20);

    // ── Universum ──────────────────────────────────────────────────────────
    T(60, 226, 'Wenn Du allerdings das UNIVERSUM sehen willst', 9, 20);
    T(60, 252, '                   mußt Du (-u-) drücken', 9, 20);

    // ── Trennlinie unten ───────────────────────────────────────────────────
    ctx.strokeStyle = ega(14);
    ctx.beginPath();
    ctx.moveTo(32, 400); ctx.lineTo(608, 400);
    ctx.stroke();

    // ── Copyright ──────────────────────────────────────────────────────────
    T(60, 408, '(c) 1995  Stefan Kriesel & Nico Winkler', 15, 20);
    T(60, 432, 'Informatik-Projekt  VGA/BGI  Turbo Pascal 7.0', 8, 18);

    // ── Sinus-Kurven-Dekozeichnung ─────────────────────────────────────────
    this._drawSineDeco(ctx);
  },

  _drawSineDeco(ctx) {
    // Kleine Sinus-Kurve als Deko
    ctx.strokeStyle = ega(11);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= 100; x++) {
      const y = 310 + Math.sin(x * 0.10) * 24;
      if (x === 0) ctx.moveTo(60 + x, y);
      else ctx.lineTo(60 + x, y);
    }
    ctx.stroke();

    // Kleiner Einheitskreis
    ctx.strokeStyle = ega(11);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(220, 310, 26, 0, 2 * Math.PI);
    ctx.stroke();
    // Statischer Radius bei 45°
    ctx.beginPath();
    ctx.moveTo(220, 310);
    ctx.lineTo(220 + 26 * Math.cos(Math.PI / 4), 310 - 26 * Math.sin(Math.PI / 4));
    ctx.stroke();
    // Punkt auf Kreis
    ctx.fillStyle = ega(14);
    ctx.beginPath();
    ctx.arc(220 + 26 * Math.cos(Math.PI / 4), 310 - 26 * Math.sin(Math.PI / 4), 2, 0, 2 * Math.PI);
    ctx.fill();
  },

  _drawCursor(ctx) {
    // Blinkender Cursor-Block innerhalb des ?-?-?-?-? Kastens (x≈180-285, y≈130-182)
    ctx.fillStyle = this._blinkOn ? ega(14) : ega(4);
    ctx.fillRect(195, 148, 10, 16);
  },
};
