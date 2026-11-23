import { VASYA_TRANSLATIONS, pickRandomKent } from '../data/dialogues.js';

export class ChatFeed {
  constructor(containerEl, audio) {
    this.containerEl = containerEl;
    this.audio = audio;
    this.messages = [];
    this.lastTranslateTime = 0;
  }

  clear() {
    this.messages = [];
    if (this.containerEl) {
      this.containerEl.innerHTML = '';
    }
  }

  pushMessage(sender, text, type = 'normal', silent = false) {
    this.messages.push({ sender, text, type });
    if (this.messages.length > 26) {
      this.messages.shift();
      if (this.containerEl && this.containerEl.firstChild) {
        this.containerEl.removeChild(this.containerEl.firstChild);
      }
    }

    if (this.containerEl) {
      const div = document.createElement('div');
      div.className = `tg-msg ${type === 'vasya' ? 'vasya-quote' : type === 'alert' ? 'alert' : ''}`;

      const senderEl = document.createElement('span');
      senderEl.className = 'tg-msg-sender';
      senderEl.textContent = `${sender}:`;

      const textEl = document.createElement('span');
      textEl.textContent = text;

      div.appendChild(senderEl);
      div.appendChild(textEl);
      this.containerEl.appendChild(div);
      this.containerEl.scrollTop = this.containerEl.scrollHeight;
    }

    if (!silent && this.audio) {
      this.audio.playTelegramPing();
    }
  }

  translateVasyaPhrase(phrase) {
    const now = performance.now();
    if (now - this.lastTranslateTime < 3400) return;
    this.lastTranslateTime = now;

    this.pushMessage('Вася', `«${phrase}»`, 'vasya');
    const translation = VASYA_TRANSLATIONS[phrase];
    if (translation && Math.random() < 0.78) {
      const kent = pickRandomKent();
      setTimeout(() => {
        this.pushMessage(kent, translation, 'normal', true);
      }, 450);
    }
  }
}
