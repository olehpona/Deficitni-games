const SLIDES = [
  {
    tag: 'КАДР 1 / 4 // ДЕНЬ 31-Й ВЕЛИКОГО ІГНОРУ',
    caption:
      'Олег, Максим, Віталік, Тарас, Захар, Дмитро й Андрій місяць чекали хоча б слова. Останнє повідомлення Васі в чаті: «Хз» — і одна сіра галочка ✓.',
    sound: 'ping',
    draw(ctx, w, h, t) {
      ctx.fillStyle = '#141311';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#22201c';
      ctx.fillRect(140, 38, 620, 384);
      ctx.strokeStyle = '#e59a24';
      ctx.lineWidth = 6;
      ctx.strokeRect(140, 38, 620, 384);

      ctx.fillStyle = '#2c2924';
      ctx.fillRect(150, 48, 600, 44);
      ctx.fillStyle = '#e59a24';
      ctx.font = '900 17px monospace';
      ctx.fillText('КЕНТИ ГАЛИЧА (ОЛЕГ, МАКСИМ, ВІТАЛІК, ТАРАС...)', 170, 76);

      const msgs = [
        { who: 'Олег', text: 'Вася, ти де? Сьогодні збір на вокзалі!', y: 128, col: '#d6b87c' },
        { who: 'Максим', text: 'Братан, 31-й день ігнору вже пішов...', y: 174, col: '#d6b87c' },
        { who: 'Андрій', text: 'Схоже, він реально зник десь у Галичі.', y: 220, col: '#d6b87c' },
        { who: 'Вася', text: 'Хз   ✓', y: 280, col: '#cca8d8' },
      ];
      for (const m of msgs) {
        ctx.fillStyle = m.who === 'Вася' ? '#2d2331' : '#171614';
        ctx.fillRect(180, m.y - 24, 540, 36);
        ctx.strokeStyle = m.col;
        ctx.lineWidth = 2;
        ctx.strokeRect(180, m.y - 24, 540, 36);
        ctx.fillStyle = m.col;
        ctx.font = '900 15px monospace';
        ctx.fillText(`${m.who}: ${m.text}`, 196, m.y);
      }

      if (Math.sin(t * 6) > 0) {
        ctx.fillStyle = '#b83527';
        ctx.font = '900 20px monospace';
        ctx.fillText('STATUS: OFFLINE // 1 GREY CHECKMARK ✓', 215, 372);
      }
    },
  },
  {
    tag: 'КАДР 2 / 4 // ДЕ ЗАЛІГ ВАСЯ?',
    caption:
      'Вася заліг на дно в одному з кварталів Галича і зачинився зсередини. Опитай інформаторів (?) по місту, щоб вирахувати його схованку!',
    sound: 'siren',
    draw(ctx, w, h, t) {
      ctx.fillStyle = '#171614';
      ctx.fillRect(0, 0, w, h);

      // Dusk Galych block
      ctx.fillStyle = '#3b4d2b';
      ctx.fillRect(60, 40, 780, 380);
      ctx.fillStyle = '#2c2a28';
      ctx.fillRect(60, 290, 780, 90);
      ctx.fillStyle = '#635e56';
      ctx.fillRect(120, 80, 660, 200);

      // Panelka
      ctx.fillStyle = '#4f4d4a';
      ctx.fillRect(280, 60, 340, 240);
      ctx.strokeStyle = '#22201c';
      ctx.lineWidth = 5;
      ctx.strokeRect(280, 60, 340, 240);

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const lit = row === 1 && col === 2;
          ctx.fillStyle = lit ? (Math.sin(t * 7) > 0 ? '#e6a13e' : '#8d6b99') : '#1c1a17';
          ctx.fillRect(310 + col * 74, 86 + row * 60, 48, 36);
        }
      }

      ctx.fillStyle = '#ede6d6';
      ctx.fillRect(490, 82, 210, 46);
      ctx.strokeStyle = '#b83527';
      ctx.lineWidth = 4;
      ctx.strokeRect(490, 82, 210, 46);
      ctx.fillStyle = '#141311';
      ctx.font = '900 20px monospace';
      ctx.fillText('«Бля анлак»', 522, 112);

      ctx.fillStyle = '#e59a24';
      ctx.font = '900 18px monospace';
      ctx.fillText('ЗНАЙДИ 3 ЗАЧІПКИ (?) ПО МІСТУ!', 250, 405);
    },
  },
  {
    tag: 'КАДР 3 / 4 // СВИНКО-ТЕРАПІЯ ТА ПИВО',
    caption:
      'Без морської свинки (🐹) з Парку і тактичного пива (🍺) з АТБ Вася навіть двері не відчинить! Збери припаси перед штурмом Берлоги.',
    sound: 'squeak',
    draw(ctx, w, h, t) {
      ctx.fillStyle = '#2d3b20';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3b4d2b';
      ctx.fillRect(50, 40, 800, 380);

      ctx.fillStyle = '#273a1b';
      ctx.fillRect(90, 70, 140, 140);
      ctx.fillRect(670, 90, 150, 140);

      const bounce = Math.abs(Math.sin(t * 5)) * 12;
      ctx.save();
      ctx.translate(330, 230 - bounce);
      ctx.fillStyle = '#c46c2b';
      ctx.fillRect(-60, -40, 120, 80);
      ctx.strokeStyle = '#141311';
      ctx.lineWidth = 4;
      ctx.strokeRect(-60, -40, 120, 80);
      ctx.fillStyle = '#ede6d6';
      ctx.fillRect(-28, -32, 42, 64);
      ctx.fillStyle = '#141311';
      ctx.fillRect(36, -16, 10, 10);
      ctx.fillRect(36, 8, 10, 10);
      ctx.restore();

      ctx.save();
      ctx.translate(580, 225);
      ctx.fillStyle = '#c88324';
      ctx.fillRect(-34, -55, 68, 110);
      ctx.strokeStyle = '#141311';
      ctx.lineWidth = 4;
      ctx.strokeRect(-34, -55, 68, 110);
      ctx.fillStyle = '#ede6d6';
      ctx.fillRect(-34, -55, 68, 22);
      ctx.fillStyle = '#141311';
      ctx.font = '900 18px monospace';
      ctx.fillText('ПИВО', -22, 10);
      ctx.restore();

      ctx.fillStyle = '#e59a24';
      ctx.font = '900 20px monospace';
      ctx.fillText('уі-уі! // ПАРК (СВИНКИ) + АТБ (ПИВО І ШАУРМА)', 155, 400);
    },
  },
  {
    tag: 'КАДР 4 / 4 // ОСТАННІЙ ДИЗЕЛЬ',
    caption:
      'Останній дизель «Галич — Львів» чекає на пероні вокзалу! Вичисли Васю, відкрий Берлогу і доведи кента через провулки та дедлайни на поїзд.',
    sound: 'horn',
    draw(ctx, w, h, t) {
      ctx.fillStyle = '#1c1a17';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#3a3631';
      for (let x = 20; x < w; x += 36) {
        ctx.fillRect(x, 260, 14, 110);
      }
      ctx.fillStyle = '#787268';
      ctx.fillRect(0, 275, w, 6);
      ctx.fillRect(0, 345, w, 6);

      const tx = 140 + Math.sin(t * 2) * 8;
      ctx.fillStyle = '#2b4c7e';
      ctx.fillRect(tx, 165, 580, 145);
      ctx.strokeStyle = '#e59a24';
      ctx.lineWidth = 5;
      ctx.strokeRect(tx, 165, 580, 145);
      ctx.fillStyle = '#c89d42';
      ctx.fillRect(tx + 4, 265, 572, 20);
      ctx.fillStyle = '#e6c873';
      for (let wx = tx + 40; wx < tx + 450; wx += 85) {
        ctx.fillRect(wx, 188, 56, 46);
      }

      for (let i = 0; i < 4; i++) {
        const sy = 120 - ((t * 40 + i * 25) % 80);
        ctx.fillStyle = 'rgba(180, 175, 165, 0.45)';
        ctx.fillRect(tx + 120 - i * 22, sy, 26, 26);
      }

      ctx.fillStyle = '#e59a24';
      ctx.font = '900 22px monospace';
      ctx.fillText('ДИЗЕЛЬ «ГАЛИЧ — ЛЬВІВ» // ЧАС ПІШОВ!', 185, 420);
    },
  },
];

export class IntroSlideshow {
  constructor(audio) {
    this.audio = audio;
    this.screen = document.getElementById('screen-intro');
    this.canvas = document.getElementById('intro-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.tagEl = document.getElementById('intro-slide-tag');
    this.captionEl = document.getElementById('intro-caption');
    this.dotsEl = document.getElementById('intro-dots');
    this.btnNext = document.getElementById('btn-next-slide');
    this.btnSkip = document.getElementById('btn-skip-intro');

    this.active = false;
    this.index = 0;
    this.time = 0;
    this.rafId = null;
    this.onComplete = null;

    this.btnNext.addEventListener('click', () => this.next());
    this.btnSkip.addEventListener('click', () => this.finish());
    this.onKeyDown = (e) => {
      if (!this.active) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.finish();
      } else if (e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    };
    window.addEventListener('keydown', this.onKeyDown);
  }

  start(onComplete) {
    this.onComplete = onComplete;
    this.active = true;
    this.index = 0;
    this.time = 0;
    this.screen.classList.remove('hidden');
    this.screen.classList.add('active');
    this.applySlide(0);

    const loop = (now) => {
      if (!this.active) return;
      this.time = now / 1000;
      SLIDES[this.index].draw(this.ctx, this.canvas.width, this.canvas.height, this.time);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  applySlide(idx) {
    const s = SLIDES[idx];
    this.tagEl.textContent = s.tag;
    this.captionEl.textContent = s.caption;
    this.btnNext.textContent = idx === SLIDES.length - 1 ? 'НА ЗАВДАННЯ →' : 'ДАЛІ →';

    this.dotsEl.innerHTML = '';
    for (let i = 0; i < SLIDES.length; i++) {
      const dot = document.createElement('span');
      dot.className = `intro-dot ${i === idx ? 'active' : ''}`;
      this.dotsEl.appendChild(dot);
    }

    if (s.sound === 'ping') this.audio.playTelegramPing();
    else if (s.sound === 'siren') this.audio.playTiltSiren();
    else if (s.sound === 'squeak') this.audio.playGuineaPigSqueak(false);
    else if (s.sound === 'horn') this.audio.playTrainHorn();
  }

  next() {
    if (this.index < SLIDES.length - 1) {
      this.index += 1;
      this.applySlide(this.index);
    } else {
      this.finish();
    }
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.screen.classList.add('hidden');
    this.screen.classList.remove('active');
    if (this.onComplete) this.onComplete();
  }
}
