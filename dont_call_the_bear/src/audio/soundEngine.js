/**
 * Аудіорушій на Web Audio API.
 * Якщо для конкретного id завантажено власний файл через AssetManager — грає його.
 * Інакше генерує впізнаваний процедурний звук (заглушку) зі стереопанорамуванням.
 */
export class SoundEngine {
  constructor(assetManager) {
    this.assetManager = assetManager;
    this.ctx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.muted = false;
    this.volume = 0.75;
    this.ambientHandle = null;
    this.ambientActive = false;
    this.menuAudio = null;
  }

  async init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.#createNoiseBuffer(2.0);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (this.ctx) {
      await this.assetManager.decodePendingAudio(this.ctx);
    }
    return this.ctx;
  }

  getContext() {
    return this.ctx;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.03
      );
    }
    if (this.menuAudio) {
      this.menuAudio.muted = this.muted;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    }
    if (this.menuAudio) {
      this.menuAudio.volume = this.volume * 0.65;
    }
  }

  async startMenuMusic(src = './assets/audio/menu_music.mp3') {
    if (typeof Audio === 'undefined') return false;
    if (!this.menuAudio) {
      this.menuAudio = new Audio(src);
      this.menuAudio.loop = true;
    }
    this.menuAudio.muted = this.muted;
    this.menuAudio.volume = this.volume * 0.65;
    if (!this.menuAudio.paused) return true;
    try {
      await this.menuAudio.play();
      return true;
    } catch {
      return false;
    }
  }

  stopMenuMusic() {
    if (!this.menuAudio) return;
    this.menuAudio.pause();
    this.menuAudio.currentTime = 0;
  }

  #createNoiseBuffer(seconds = 1.5) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = white * 0.65 + lastOut * 0.8;
    }
    return buffer;
  }

  #createOutputChain(pan = 0, volume = 1) {
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(2, volume));

    if (typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      gainNode.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gainNode.connect(this.masterGain);
    }
    return gainNode;
  }

  async play(id, { pan = 0, volume = 1 } = {}) {
    await this.init();
    if (!this.ctx || !this.masterGain) return;

    const customBuffer = this.assetManager.getAudioBuffer(id);
    const out = this.#createOutputChain(pan, volume);

    if (customBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = customBuffer;
      source.connect(out);
      source.start();
      return;
    }

    this.#playSynth(id, out);
  }

  async startAmbient() {
    await this.init();
    if (!this.ctx || this.ambientActive) return;
    this.ambientActive = true;

    const customAmbient = this.assetManager.getAudioBuffer('ambient_forest');
    const out = this.#createOutputChain(0, 0.35);

    if (customAmbient) {
      const source = this.ctx.createBufferSource();
      source.buffer = customAmbient;
      source.loop = true;
      source.connect(out);
      source.start();
      this.ambientHandle = {
        stop: () => {
          try {
            source.stop();
            out.disconnect();
          } catch {
            // ignore
          }
        }
      };
      return;
    }

    // Синтезований нічний вітер + легкий гул лісу
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 310;
    filter.Q.value = 1.8;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.14;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 130;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const drone = this.ctx.createOscillator();
    drone.type = 'triangle';
    drone.frequency.value = 54;
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(out);
    drone.connect(droneGain);
    droneGain.connect(out);

    noise.start();
    lfo.start();
    drone.start();

    this.ambientHandle = {
      stop: () => {
        try {
          noise.stop();
          lfo.stop();
          drone.stop();
          out.disconnect();
        } catch {
          // ignore
        }
      }
    };
  }

  stopAmbient() {
    this.ambientActive = false;
    if (this.ambientHandle) {
      this.ambientHandle.stop();
      this.ambientHandle = null;
    }
  }

  async restartAmbient() {
    this.stopAmbient();
    await this.startAmbient();
  }

  #playSynth(id, out) {
    const now = this.ctx.currentTime;

    switch (id) {
      case 'ambient_forest': {
        this.#noiseBurst(out, now, 1.2, 360, 'bandpass', 0.25);
        break;
      }
      case 'footsteps_porch': {
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.21;
          this.#tone(out, 'triangle', 95 - i * 8, 42, t, 0.14, 0.35);
          this.#noiseBurst(out, t, 0.09, 260, 'lowpass', 0.22);
        }
        break;
      }
      case 'door_rattle': {
        for (let i = 0; i < 4; i++) {
          const t = now + i * 0.075;
          this.#noiseBurst(out, t, 0.06, 950 + i * 120, 'bandpass', 0.32);
          this.#tone(out, 'square', 170, 95, t, 0.065, 0.18);
        }
        break;
      }
      case 'door_lock': {
        this.#tone(out, 'square', 460, 740, now, 0.06, 0.22);
        this.#tone(out, 'triangle', 260, 140, now + 0.055, 0.09, 0.28);
        break;
      }
      case 'window_scratch': {
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.11;
          this.#noiseBurst(out, t, 0.09, 2400 + i * 350, 'bandpass', 0.26);
          this.#tone(out, 'sawtooth', 1100, 1850, t, 0.08, 0.08);
        }
        break;
      }
      case 'bear_growl': {
        this.#tone(out, 'sawtooth', 88, 52, now, 0.55, 0.32);
        this.#tone(out, 'triangle', 124, 72, now, 0.5, 0.24);
        this.#noiseBurst(out, now, 0.48, 320, 'lowpass', 0.22);
        break;
      }
      case 'pan_bonk': {
        // Металевий чавунний BONK
        this.#tone(out, 'triangle', 680, 320, now, 0.32, 0.45);
        this.#tone(out, 'sine', 1040, 520, now, 0.38, 0.3);
        this.#tone(out, 'square', 390, 210, now, 0.14, 0.22);
        this.#noiseBurst(out, now, 0.07, 1600, 'highpass', 0.25);
        break;
      }
      case 'spray_hiss': {
        this.#noiseBurst(out, now, 0.38, 3600, 'highpass', 0.36);
        break;
      }
      case 'chimney_scrape': {
        this.#noiseBurst(out, now, 0.34, 650, 'bandpass', 0.32);
        this.#tone(out, 'triangle', 140, 82, now + 0.06, 0.25, 0.2);
        break;
      }
      case 'fire_whoosh': {
        this.#noiseBurst(out, now, 0.55, 420, 'lowpass', 0.45);
        this.#noiseBurst(out, now + 0.08, 0.45, 1100, 'bandpass', 0.24);
        break;
      }
      case 'toilet_quiet': {
        this.#noiseBurst(out, now, 0.32, 480, 'lowpass', 0.14);
        this.#tone(out, 'sine', 165, 120, now, 0.24, 0.12);
        break;
      }
      case 'toilet_loud': {
        // Епічний "клик ведмедів"
        this.#tone(out, 'sawtooth', 190, 85, now, 0.72, 0.4);
        this.#tone(out, 'triangle', 135, 65, now + 0.04, 0.75, 0.35);
        this.#noiseBurst(out, now, 0.68, 700, 'bandpass', 0.35);
        break;
      }
      case 'brine_gulp': {
        this.#tone(out, 'sine', 280, 520, now, 0.1, 0.26);
        this.#tone(out, 'sine', 330, 610, now + 0.12, 0.11, 0.26);
        this.#noiseBurst(out, now + 0.2, 0.08, 1200, 'bandpass', 0.12);
        break;
      }
      case 'flashlight_click': {
        this.#tone(out, 'square', 1300, 850, now, 0.03, 0.18);
        break;
      }
      case 'heartbeat': {
        this.#tone(out, 'sine', 78, 42, now, 0.12, 0.38);
        this.#tone(out, 'sine', 72, 38, now + 0.16, 0.12, 0.28);
        break;
      }
      case 'jumpscare': {
        this.#tone(out, 'sawtooth', 180, 440, now, 0.9, 0.52);
        this.#tone(out, 'square', 92, 230, now, 0.9, 0.42);
        this.#noiseBurst(out, now, 0.95, 1400, 'bandpass', 0.62);
        break;
      }
      case 'clock_chime': {
        this.#tone(out, 'sine', 660, 658, now, 0.55, 0.28);
        this.#tone(out, 'sine', 880, 876, now + 0.22, 0.65, 0.25);
        break;
      }
      default: {
        this.#tone(out, 'sine', 440, 320, now, 0.15, 0.2);
      }
    }
  }

  #tone(out, type, startFreq, endFreq, startTime, duration, peakGain) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, startFreq), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(out);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  #noiseBurst(out, startTime, duration, filterFreq, filterType, peakGain) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(startTime);
    src.stop(startTime + duration + 0.02);
  }
}
