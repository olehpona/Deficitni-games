import { dist, clamp, resolveWorldCollisions } from '../engine/Collision.js';
import { pickVasylivkaPhrase } from '../data/vasylivka.js';

export class Vasya {
  constructor(x, y, difficulty) {
    this.x = x;
    this.y = y;
    this.denX = x;
    this.denY = y;
    this.radius = 19;
    this.difficulty = difficulty;

    this.state = 'IN_DEN';
    this.tilt = 15;
    this.memeShieldTimer = 0;
    this.momBuffTimer = 0;
    this.shaurmaBoostTimer = 0;
    this.inCrisisCloud = false;

    this.facingAngle = Math.PI / 2;
    this.walkPhase = 0;
    this.isMoving = false;

    this.comaPressCount = 0;
    this.comaCountTotal = 0;
    this.heardPhrases = new Set();

    this.speechCooldown = 2.0;
    this.lastPhrase = 'Хз';
    this.particles = null;
    this.chat = null;
    this.audio = null;
  }

  attachSystems({ particles, chat, audio }) {
    this.particles = particles;
    this.chat = chat;
    this.audio = audio;
  }

  isImmune() {
    return this.memeShieldTimer > 0 || this.momBuffTimer > 0;
  }

  say(phrase, { bg = '#ede6d6', fg = '#141311', urgent = false, duration = 2.4 } = {}) {
    this.lastPhrase = phrase;
    this.heardPhrases.add(phrase);
    if (this.particles) {
      this.particles.spawnSpeechBubble(this, phrase, { bg, fg, urgent, duration });
    }
    if (this.chat) {
      this.chat.translateVasyaPhrase(phrase);
    }
  }

  addTilt(amount, context = 'medium', particles = this.particles, chat = this.chat) {
    if (this.state === 'IN_DEN' || this.state === 'EXTRACTED') return;
    if (amount > 0 && this.isImmune()) return;

    const prevTilt = this.tilt;
    this.tilt = clamp(this.tilt + amount, 0, 100);

    if (amount > 5 && this.speechCooldown <= 0) {
      this.speechCooldown = 2.2;
      const phrase = pickVasylivkaPhrase(this.tilt >= 90 ? 'critical' : context);
      this.say(phrase, { urgent: this.tilt >= 90 });
    }

    if (prevTilt < 100 && this.tilt >= 100) {
      this.enterComa(particles, chat);
    }
  }

  enterComa() {
    if (this.state === 'COMA') return;
    this.state = 'COMA';
    this.comaPressCount = 0;
    this.comaCountTotal += 1;
    if (this.audio) this.audio.playTiltSiren();
    const phrase = pickVasylivkaPhrase('critical', { isBegging: true });
    this.say(phrase, { bg: '#e8b4ae', fg: '#5e1410', urgent: true, duration: 3.0 });
  }

  wakeFromComa(newTilt = 52) {
    this.tilt = clamp(newTilt, 0, 99);
    this.comaPressCount = 0;
    this.state = this.momBuffTimer > 0 ? 'MOM_BUFF' : this.tilt >= 46 ? 'SLOWED' : 'FOLLOWING';
    const phrase = pickVasylivkaPhrase('gift');
    this.say(phrase, { bg: '#d6e3bf', fg: '#263612', duration: 2.2 });
  }

  applyItem(type, player) {
    if (type === 'beer') {
      this.tilt = Math.max(0, this.tilt - 40);
      if (this.state === 'COMA') this.wakeFromComa(this.tilt);
      this.say(pickVasylivkaPhrase('gift', { hasPigOrBeer: true }), {
        bg: '#f2dcb3',
        fg: '#4f3307',
      });
      if (this.audio) this.audio.playBeerOpen();
      if (this.particles) this.particles.spawnBurst(this.x, this.y, '#e59a24', 12, 95);
    } else if (type === 'shaurma') {
      this.tilt = Math.max(0, this.tilt - 30);
      this.shaurmaBoostTimer = 4.0;
      player.stamina = Math.min(player.maxStamina, player.stamina + 60);
      if (this.state === 'COMA') this.wakeFromComa(this.tilt);
      this.say(pickVasylivkaPhrase('gift'), { bg: '#eed0b4', fg: '#57290b' });
      if (this.audio) this.audio.playCrunch();
      if (this.particles) this.particles.spawnBurst(this.x, this.y, '#c96f32', 12, 95);
    } else if (type === 'meme') {
      this.memeShieldTimer = 5.0;
      this.say('Да', { bg: '#d2ded8', fg: '#1c2b24' });
      if (this.audio) this.audio.playTelegramPing();
      if (this.particles) this.particles.spawnBurst(this.x, this.y, '#d6b87c', 14, 100);
    } else if (type === 'cucumber') {
      this.say('Пж пж', { bg: '#d6e3bf', fg: '#263612' });
      if (this.audio) this.audio.playCrunch();
    }
  }

  applyMomBuff(duration) {
    this.tilt = 0;
    this.comaPressCount = 0;
    this.momBuffTimer = duration;
    this.state = 'MOM_BUFF';
    this.say('Пж пж', { bg: '#d6e3bf', fg: '#263612', duration: 1.4 });
    setTimeout(() => {
      if (this.state !== 'EXTRACTED') {
        this.say('Да', { bg: '#d6e3bf', fg: '#263612', duration: 2.0 });
      }
    }, 900);
    if (this.particles) {
      this.particles.spawnBurst(this.x, this.y, '#7a9e4b', 20, 140);
    }
  }

  onPigSpooked(particles, chat, audio) {
    if (this.state === 'IN_DEN' || this.state === 'EXTRACTED') return;
    if (!this.isImmune()) {
      this.tilt = clamp(this.tilt + 35, 0, 100);
    }
    const phrase = Math.random() < 0.55 ? 'Бля анал' : 'Пж пж';
    this.say(phrase, { bg: '#e8b4ae', fg: '#5e1410', urgent: true, duration: 2.6 });
    if (this.tilt >= 100) {
      this.enterComa(particles, chat, audio);
    }
  }

  pressMoralSupport() {
    if (this.state !== 'COMA') return false;
    this.comaPressCount += 1;
    if (this.particles) {
      this.particles.spawnBurst(this.x, this.y, '#e59a24', 6, 70);
    }
    if (this.comaPressCount >= 5) {
      this.wakeFromComa(55);
      return true;
    }
    return false;
  }

  update(dt, { player, escortPigsCount, colliders }) {
    if (this.state === 'IN_DEN' || this.state === 'EXTRACTED') return;

    if (this.memeShieldTimer > 0) this.memeShieldTimer = Math.max(0, this.memeShieldTimer - dt);
    if (this.momBuffTimer > 0) this.momBuffTimer = Math.max(0, this.momBuffTimer - dt);
    if (this.shaurmaBoostTimer > 0) this.shaurmaBoostTimer = Math.max(0, this.shaurmaBoostTimer - dt);
    if (this.speechCooldown > 0) this.speechCooldown -= dt;

    if (!this.isImmune() && this.state !== 'COMA') {
      if (escortPigsCount === 0) {
        this.tilt = clamp(this.tilt + this.difficulty.passiveTiltRate * dt, 0, 100);
      } else if (escortPigsCount === 2) {
        this.tilt = Math.max(0, this.tilt - 2.6 * dt);
      } else if (escortPigsCount >= 3) {
        this.tilt = Math.max(0, this.tilt - 4.5 * dt);
      }

      if (this.tilt >= 100) {
        this.enterComa();
      }
    }

    if (this.state !== 'COMA') {
      if (this.momBuffTimer > 0) {
        this.state = 'MOM_BUFF';
      } else if (this.tilt >= 46) {
        this.state = 'SLOWED';
      } else {
        this.state = 'FOLLOWING';
      }
    }

    if (this.speechCooldown <= 0) {
      this.speechCooldown = 5.5 + Math.random() * 4.5;
      const ctxKey =
        this.state === 'COMA' ? 'critical' : this.tilt >= 46 ? 'medium' : 'calm';
      const phrase = pickVasylivkaPhrase(ctxKey, {
        hasPigOrBeer: escortPigsCount > 0,
        isBegging: this.state === 'COMA',
      });
      this.say(phrase, { urgent: this.state === 'COMA' });
    }

    this.isMoving = false;
    if (this.state === 'COMA') {
      const dDen = dist(this.x, this.y, this.denX, this.denY);
      if (dDen > 20) {
        const dx = this.denX - this.x;
        const dy = this.denY - this.y;
        this.x += (dx / dDen) * 44 * dt;
        this.y += (dy / dDen) * 44 * dt;
      }
    } else {
      const dPlayer = dist(this.x, this.y, player.x, player.y);
      if (dPlayer > 58) {
        let speed = 248;
        if (this.state === 'SLOWED') speed = 185;
        if (escortPigsCount >= 1) speed *= 1.12;
        if (escortPigsCount >= 2) speed *= 1.1;
        if (this.shaurmaBoostTimer > 0) speed *= 1.25;
        if (this.momBuffTimer > 0) speed = 370;
        if (this.inCrisisCloud && !this.isImmune()) speed *= 0.62;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.x += (dx / dPlayer) * speed * dt;
        this.y += (dy / dPlayer) * speed * dt;
        this.facingAngle = Math.atan2(dy, dx);
        this.walkPhase += dt * 10;
        this.isMoving = true;
      }
    }

    this.inCrisisCloud = false;
    resolveWorldCollisions(this, colliders);
  }

  getStateLabel() {
    switch (this.state) {
      case 'IN_DEN':
        return 'ХОВАЄТЬСЯ В ГАЛИЧІ (✓)';
      case 'FOLLOWING':
        return 'ЙДЕ ЗА ТОБОЮ (СПОКІЙНИЙ)';
      case 'SLOWED':
        return 'ТІЛЬТУЄ (СПОВІЛЬНЕНИЙ)';
      case 'COMA':
        return `ПОВНИЙ ТІЛЬТ! ТИСНИ E (${this.comaPressCount}/5)`;
      case 'MOM_BUFF':
        return `МАМА СКАЗАЛА! (+50% ШВ, ${Math.ceil(this.momBuffTimer)}С)`;
      case 'EXTRACTED':
        return 'НА ПЕРОНІ!';
      default:
        return 'ХЗ';
    }
  }

  render(ctx, cam, time) {
    if (this.state === 'IN_DEN') return;

    const sx = Math.round(this.x - cam.renderX);
    const sy = Math.round(this.y - cam.renderY);

    ctx.save();
    ctx.translate(sx, sy);

    if (this.momBuffTimer > 0) {
      ctx.strokeStyle = '#7a9e4b';
      ctx.lineWidth = 3;
      ctx.strokeRect(-26, -26, 52, 52);
    } else if (this.memeShieldTimer > 0) {
      ctx.strokeStyle = '#d6b87c';
      ctx.lineWidth = 3;
      ctx.strokeRect(-24, -24, 48, 48);
    }

    ctx.save();
    ctx.rotate(this.facingAngle);

    ctx.fillStyle = 'rgba(10, 9, 8, 0.55)';
    ctx.fillRect(-14, -14, 30, 30);

    if (this.state === 'COMA') {
      ctx.fillStyle = '#5c3c63';
      ctx.fillRect(-13, -13, 26, 26);
      ctx.strokeStyle = '#b83527';
      ctx.lineWidth = 3;
      ctx.strokeRect(-13, -13, 26, 26);
      ctx.fillStyle = '#d6b87c';
      ctx.fillRect(-6, -6, 12, 12);
    } else {
      const swing = this.isMoving ? Math.round(Math.sin(this.walkPhase) * 5) : 0;
      ctx.fillStyle = '#785685';
      ctx.fillRect(-10, -14, 20, 28);
      ctx.strokeStyle = '#141311';
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -14, 20, 28);

      ctx.fillStyle = '#8d6b99';
      ctx.fillRect(swing, -16, 10, 5);
      ctx.fillRect(-swing, 11, 10, 5);

      ctx.fillStyle = '#e6c89c';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#472f4f';
      ctx.fillRect(-8, -8, 10, 16);
    }

    ctx.restore();

    ctx.fillStyle = '#141311';
    ctx.fillRect(-24, 20, 48, 14);
    ctx.fillStyle = Math.sin(time * 6) > 0 && this.state === 'COMA' ? '#b83527' : '#d6b87c';
    ctx.font = '900 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ВАСЯ', 0, 31);

    ctx.restore();
  }
}
