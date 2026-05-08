// PC-Speaker-Simulation via Web Audio API (Square-Wave wie das Original)
const Audio = {
  _ctx: null,
  muted: false,

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  },

  // freq in Hz, dur in ms  (wie Pascal sound(freq); delay(dur); nosound;)
  beep(freq, dur) {
    if (this.muted || !freq || freq < 20 || !dur) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = Math.max(20, Math.min(8000, freq));
      const t0 = ctx.currentTime;
      gain.gain.setValueAtTime(0.06, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / 1000 + 0.02);
      osc.start(t0);
      osc.stop(t0 + dur / 1000 + 0.03);
    } catch (_) { /* ignore */ }
  },

  toggle() {
    this.muted = !this.muted;
    if (!this.muted) this._getCtx(); // AudioContext während User-Geste starten
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = this.muted ? '🔇' : '🔊';
  },
};
