export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.driveCurve = null;
    this.muted = false;
    this.musicTimer = 0;
    this.stepIndex = 0;
    this.isPlayingMusic = false;
    this.mode = 'menu'; // 'menu' | 'phase1' | 'phase2' | 'overdrive'
    this.lastStepTime = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.noiseBuffer) {
      const len = Math.floor(this.ctx.sampleRate * 0.35);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buf;
    }
    if (this.ctx && !this.driveCurve) {
      const n = 256;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((3 + 12) * x * 20 * (Math.PI / 180)) / (Math.PI + 12 * Math.abs(x));
      }
      this.driveCurve = curve;
    }
  }

  unlockFromUserGesture() {
    this.ensureContext();
    if (!this.isPlayingMusic) {
      this.startMusic('menu');
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  startMusic(mode = 'phase1') {
    this.ensureContext();
    this.mode = mode;
    this.isPlayingMusic = true;
    this.musicTimer = 0;
  }

  stopMusic() {
    this.isPlayingMusic = false;
  }

  updateMusic(dt, intensity = 0, mode = null) {
    if (!this.isPlayingMusic || this.muted || !this.ctx || this.ctx.state !== 'running') return;
    if (mode) this.mode = mode;

    const baseBpm =
      this.mode === 'menu'
        ? 108
        : this.mode === 'overdrive'
          ? 154
          : this.mode === 'phase2'
            ? 140
            : 124;
    const bpm = baseBpm + intensity * 10;
    const stepInterval = 60 / bpm / 4; // 16th-note groove

    this.musicTimer += dt;
    while (this.musicTimer >= stepInterval) {
      this.musicTimer -= stepInterval;
      this.playTacticalStep(this.stepIndex, intensity);
      this.stepIndex = (this.stepIndex + 1) % 64;
    }
  }

  playTacticalStep(step, intensity) {
    const now = this.ctx.currentTime;
    const barStep = step % 16;
    const isMenu = this.mode === 'menu';
    const isCombat = this.mode === 'phase2' || this.mode === 'overdrive';

    // 1. Syncopated GTA Breakbeat Kick (steps 0, 3, 6, 10 in breakbeat + heavy 8 in combat)
    const kickHits = isCombat
      ? barStep === 0 || barStep === 3 || barStep === 6 || barStep === 8 || barStep === 10
      : barStep === 0 || barStep === 6 || barStep === 10 || (step % 32 === 30);

    if (kickHits) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      gain.gain.setValueAtTime(isMenu ? 0.11 : 0.17, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    // 2. Crisp Rimshot (Menu) / Breakbeat Snare (Gameplay)
    const snareHits = barStep === 4 || barStep === 12 || (!isMenu && barStep === 15 && step % 32 >= 16);
    if (snareHits && this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = isMenu ? 1400 : 2100;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(isMenu ? 0.045 : 0.1, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + (isMenu ? 0.06 : 0.13));
      noise.connect(bp);
      bp.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.14);

      const body = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(isMenu ? 340 : 195, now);
      body.frequency.exponentialRampToValueAtTime(92, now + 0.07);
      bGain.gain.setValueAtTime(isMenu ? 0.04 : 0.08, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      body.connect(bGain);
      bGain.connect(this.ctx.destination);
      body.start(now);
      body.stop(now + 0.09);
    }

    // 3. Funk Shaker / 16th Hi-Hat
    if (this.noiseBuffer && (barStep % 2 === 0 || !isMenu)) {
      const hat = this.ctx.createBufferSource();
      hat.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = barStep % 4 === 2 ? 6200 : 8800;
      const hGain = this.ctx.createGain();
      hGain.gain.setValueAtTime(barStep % 4 === 2 ? 0.025 : 0.011, now);
      hGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.032);
      hat.connect(hp);
      hp.connect(hGain);
      hGain.connect(this.ctx.destination);
      hat.start(now);
      hat.stop(now + 0.04);
    }

    // 4. Tactical Funk-Action Bassline (E minor / Phrygian GTA vibe: E1=41.2, G1=49, A1=55, Bb1=58.27, B1=61.74)
    const bassSeq = [
      41.2, 0, 41.2, 82.41, 0, 41.2, 49.0, 0, 55.0, 0, 49.0, 0, 41.2, 0, 61.74, 55.0,
      41.2, 0, 41.2, 82.41, 0, 49.0, 55.0, 0, 58.27, 0, 55.0, 49.0, 41.2, 49.0, 55.0, 61.74,
    ];
    const bFreq = bassSeq[step % 32];
    if (bFreq > 0) {
      const bass = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      bass.type = isMenu ? 'triangle' : 'sawtooth';
      bass.frequency.setValueAtTime(isMenu ? bFreq : bFreq * 1.5, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isMenu ? 380 : 620 + intensity * 600, now);
      filter.Q.value = 3.5;

      gain.gain.setValueAtTime(isMenu ? 0.095 : 0.085, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.14);

      if (!isMenu && this.driveCurve) {
        const shaper = this.ctx.createWaveShaper();
        shaper.curve = this.driveCurve;
        bass.connect(shaper);
        shaper.connect(filter);
      } else {
        bass.connect(filter);
      }
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      bass.start(now);
      bass.stop(now + 0.15);
    }

    // 5. Rhodes Minor Stabs in Menu & Phase 1 (GTA 2 / Spy Night Vibe)
    if (barStep === 0 || barStep === 6 || barStep === 12) {
      const chordPool =
        step < 32
          ? [164.81, 196.0, 246.94, 293.66] // Em7
          : [146.83, 174.61, 220.0, 261.63]; // Dm7
      for (const freq of chordPool) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = isCombat ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(isMenu ? 0.018 : isCombat ? 0.02 : 0.016, now);
        g.gain.exponentialRampToValueAtTime(0.0008, now + (isCombat ? 0.22 : 0.34));
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      }
    }

    // 6. Tactical Spy / Action Lead Riff
    const leadMap = {
      0: 329.63,
      3: 392.0,
      6: 440.0,
      8: 493.88,
      11: 440.0,
      14: 392.0,
      16: 329.63,
      19: 392.0,
      22: 523.25,
      24: 493.88,
      28: 440.0,
      30: 392.0,
      32: 293.66,
      35: 349.23,
      38: 440.0,
      40: 466.16,
      44: 440.0,
      46: 392.0,
      48: 329.63,
      52: 493.88,
      54: 587.33,
      56: 659.25,
      60: 587.33,
      62: 493.88,
    };
    const lFreq = leadMap[step];
    if (lFreq && (isMenu ? step >= 32 : true)) {
      const lead = this.ctx.createOscillator();
      const lGain = this.ctx.createGain();
      lead.type = isMenu ? 'triangle' : isCombat ? 'square' : 'sawtooth';
      lead.frequency.setValueAtTime(isCombat ? lFreq * 2 : lFreq, now);
      lGain.gain.setValueAtTime(isMenu ? 0.025 : 0.036, now);
      lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
      lead.connect(lGain);
      lGain.connect(this.ctx.destination);
      lead.start(now);
      lead.stop(now + 0.22);
    }
  }

  playStep(sprint = false) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    if (now - this.lastStepTime < (sprint ? 0.17 : 0.26)) return;
    this.lastStepTime = now;

    // Gravel/asphalt crunch noise
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = sprint ? 1100 : 850;
    bp.Q.value = 1.4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(sprint ? 0.045 : 0.03, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + 0.06);
  }

  playDoorKnock() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.14, 0.28].forEach((offset) => {
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(165, t);
      osc.frequency.exponentialRampToValueAtTime(68, t + 0.07);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.085);
    });
  }

  playRadioChirp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.noiseBuffer) {
      const sq = this.ctx.createBufferSource();
      sq.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 2600;
      const sg = this.ctx.createGain();
      sg.gain.setValueAtTime(0.05, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      sq.connect(hp);
      hp.connect(sg);
      sg.connect(this.ctx.destination);
      sq.start(now);
      sq.stop(now + 0.065);
    }
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1320, now + 0.05);
    osc.frequency.setValueAtTime(1760, now + 0.1);
    g.gain.setValueAtTime(0.05, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now + 0.05);
    osc.stop(now + 0.19);
  }

  playGuineaPigSqueak(panicked = false) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const count = panicked ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const start = now + i * 0.11;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const base = panicked ? 1050 : 820;
      osc.frequency.setValueAtTime(base, start);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, start + 0.05);
      osc.frequency.exponentialRampToValueAtTime(base * 0.9, start + 0.09);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.095);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.1);
    }
  }

  playBeerOpen() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(1400, now);
    click.frequency.exponentialRampToValueAtTime(320, now + 0.045);
    clickGain.gain.setValueAtTime(0.11, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start(now);
    click.stop(now + 0.055);

    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2600;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now + 0.03);
      noise.stop(now + 0.23);
    }
  }

  playCrunch() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playTelegramPing() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174.66, now + 0.06);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playTrainHorn() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [185, 233.08].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.68);
    });
  }

  playTiltSiren() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(760, now + 0.22);
    osc.frequency.linearRampToValueAtTime(380, now + 0.45);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playPhoneRing() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const start = now + i * 0.55;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(425, start);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.setValueAtTime(0.08, start + 0.32);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.38);
    }
    const clickAt = now + 1.18;
    const click = this.ctx.createOscillator();
    const cGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(640, clickAt);
    cGain.gain.setValueAtTime(0.07, clickAt);
    cGain.gain.exponentialRampToValueAtTime(0.001, clickAt + 0.04);
    click.connect(cGain);
    cGain.connect(this.ctx.destination);
    click.start(clickAt);
    click.stop(clickAt + 0.045);
  }

  playMomUlt() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  playMomFail() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [330, 277.18].forEach((freq, idx) => {
      const t = now + idx * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }
}
