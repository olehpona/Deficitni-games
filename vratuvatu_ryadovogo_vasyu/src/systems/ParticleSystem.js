export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.bubbles = [];
  }

  spawnParticle({
    x,
    y,
    vx = 0,
    vy = -25,
    life = 1.0,
    size = 6,
    color = '#ffffff',
    text = null,
    gravity = 0,
  }) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      size,
      color,
      text,
      gravity,
    });
  }

  spawnBurst(x, y, color, count = 10, speed = 80) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.4 + Math.random() * 0.8);
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.45 + Math.random() * 0.4,
        size: 4 + Math.random() * 4,
        color,
      });
    }
  }

  spawnCucumberFirework(x, y) {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.2;
      const spd = 90 + Math.random() * 140;
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 60,
        life: 1.4 + Math.random() * 0.6,
        size: 16,
        text: '🥬',
        gravity: 140,
      });
    }
  }

  spawnSpeechBubble(target, text, { bg = '#ffffff', fg = '#0f172a', duration = 2.4, urgent = false } = {}) {
    this.bubbles = this.bubbles.filter((b) => b.target !== target);
    this.bubbles.push({
      target,
      x: target.x,
      y: target.y,
      text,
      bg,
      fg,
      duration,
      life: duration,
      urgent,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      if (b.target) {
        b.x = b.target.x;
        b.y = b.target.y;
      }
      if (b.life <= 0) {
        this.bubbles.splice(i, 1);
      }
    }
  }

  render(ctx, cam) {
    ctx.save();
    ctx.translate(-cam.renderX, -cam.renderY);

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      if (p.text) {
        ctx.font = `900 ${p.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      } else {
        const s = Math.max(2, Math.round(p.size * (0.4 + 0.6 * alpha)));
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      }
    }
    ctx.globalAlpha = 1;

    // Crisp rectangular GTA 2 pixel speech bubbles
    for (const b of this.bubbles) {
      const alpha = Math.min(1, b.life * 2.5);
      ctx.globalAlpha = alpha;
      ctx.font = '900 13px monospace';
      const padX = 10;
      const w = Math.max(46, ctx.measureText(b.text).width + padX * 2);
      const h = 26;
      const bx = Math.round(b.x - w / 2);
      const by = Math.round(b.y - 56);

      ctx.fillStyle = '#000000';
      ctx.fillRect(bx + 3, by + 3, w, h);

      ctx.fillStyle = b.bg;
      ctx.fillRect(bx, by, w, h);
      ctx.strokeStyle = b.urgent ? '#e52521' : '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, w, h);

      ctx.fillStyle = b.bg;
      ctx.fillRect(Math.round(b.x - 4), by + h, 8, 6);

      ctx.fillStyle = b.fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, by + h / 2 + 1);
    }

    ctx.restore();
  }
}
