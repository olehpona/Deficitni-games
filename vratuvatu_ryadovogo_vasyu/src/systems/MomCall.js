import { MOM_CALL_CONFIG } from '../data/config.js';
import { pickEventLine } from '../data/dialogues.js';

export class MomCallSystem {
  constructor({ audio, chat, particles, achievements, camera }) {
    this.audio = audio;
    this.chat = chat;
    this.particles = particles;
    this.achievements = achievements;
    this.camera = camera;

    this.popupEl = document.getElementById('mom-phone-popup');
    this.statusEl = document.getElementById('mom-phone-status');
    this.bodyEl = document.getElementById('mom-phone-body');
    this.cooldownOverlayEl = document.getElementById('mom-cooldown-overlay');

    this.reset();
  }

  reset() {
    this.cooldownRemaining = 0;
    this.isRinging = false;
    this.ringTimer = 0;
    this.popupTimer = 0;
    this.consecutiveFails = 0;
    this.hidePopup();
    this.updateCooldownUI();
  }

  trigger(vasya) {
    if (this.cooldownRemaining > 0 || this.isRinging) return false;

    this.cooldownRemaining = MOM_CALL_CONFIG.cooldown;
    this.isRinging = true;
    this.ringTimer = MOM_CALL_CONFIG.ringDuration;
    this.popupTimer = 0;
    this.pendingVasya = vasya;

    this.audio.playPhoneRing();
    this.showPopup('Виклик...', 'Гудки... (425 Hz)', '');
    return true;
  }

  update(dt, vasya) {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }
    this.updateCooldownUI();

    if (this.isRinging) {
      this.ringTimer -= dt;
      if (this.ringTimer <= 0) {
        this.isRinging = false;
        this.resolveCall(vasya || this.pendingVasya);
      }
    } else if (this.popupTimer > 0) {
      this.popupTimer -= dt;
      if (this.popupTimer <= 0) {
        this.hidePopup();
      }
    }
  }

  resolveCall(vasya) {
    const isUlt = Math.random() < MOM_CALL_CONFIG.successChance;

    if (isUlt) {
      this.consecutiveFails = 0;
      this.audio.playMomUlt();
      this.camera.shake(10, 0.35);
      this.showPopup('На лінії!', MOM_CALL_CONFIG.ultLine, 'success');
      this.popupTimer = 5.2;

      const hadTilt = vasya.tilt > 0 || vasya.state === 'COMA';
      vasya.applyMomBuff(MOM_CALL_CONFIG.buffDuration);
      if (hadTilt) {
        this.achievements.unlock('mamyn_argument');
      }

      const line = pickEventLine('momUlt');
      if (line) {
        this.chat.pushMessage(line.sender, line.text, 'alert');
      }
    } else {
      this.consecutiveFails += 1;
      this.audio.playMomFail();
      const lines = MOM_CALL_CONFIG.failLines;
      const failLine = lines[Math.floor(Math.random() * lines.length)];
      this.showPopup('Відповідь', failLine, 'fail');
      this.popupTimer = 4.2;

      if (vasya.state === 'COMA' || vasya.tilt >= 100) {
        vasya.say('Бля анлак', { urgent: true, duration: 2.5 });
      } else {
        vasya.say(Math.random() < 0.5 ? 'Да' : 'Хз', { duration: 2.0 });
      }

      const chatLine = pickEventLine('momFail');
      if (chatLine) {
        this.chat.pushMessage(chatLine.sender, chatLine.text, 'normal');
      }

      if (this.consecutiveFails >= 3) {
        this.achievements.unlock('abonent_spyt');
      }
    }
  }

  showPopup(status, body, variant) {
    if (!this.popupEl) return;
    this.popupEl.classList.remove('hidden', 'success', 'fail');
    if (variant) this.popupEl.classList.add(variant);
    this.statusEl.textContent = status;
    this.bodyEl.textContent = body;
  }

  hidePopup() {
    if (!this.popupEl) return;
    this.popupEl.classList.add('hidden');
  }

  updateCooldownUI() {
    if (!this.cooldownOverlayEl) return;
    if (this.cooldownRemaining > 0) {
      this.cooldownOverlayEl.classList.remove('hidden');
      this.cooldownOverlayEl.textContent = `${Math.ceil(this.cooldownRemaining)}с`;
    } else {
      this.cooldownOverlayEl.classList.add('hidden');
    }
  }
}
