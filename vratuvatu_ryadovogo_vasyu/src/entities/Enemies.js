import { dist, resolveWorldCollisions } from '../engine/Collision.js';

export function createEnemies(difficulty) {
  const clouds = [
    { x: 1020, y: 960, r: 120, vx: 46, vy: 28 },
    { x: 2240, y: 1080, r: 125, vx: -42, vy: 34 },
    { x: 3560, y: 1410, r: 115, vx: 38, vy: -32 },
    { x: 4680, y: 1410, r: 120, vx: -44, vy: 28 },
    { x: 4860, y: 2540, r: 120, vx: 40, vy: -34 },
  ];

  // Deadlines patrol major avenues and intersections (never inside buildings)
  const deadlines = [
    { x: 2320, y: 2490, radius: 18, homeX: 2320, homeY: 2490, patrolR: 180, angle: 0, stunTimer: 0, speed: 200 * difficulty.enemySpeedMult, label: 'ДЕДЛАЙН' },
    { x: 3680, y: 2490, radius: 18, homeX: 3680, homeY: 2490, patrolR: 200, angle: 2.1, stunTimer: 0, speed: 210 * difficulty.enemySpeedMult, label: 'ЛАБА' },
    { x: 5020, y: 2490, radius: 18, homeX: 5020, homeY: 2490, patrolR: 190, angle: 4.0, stunTimer: 0, speed: 215 * difficulty.enemySpeedMult, label: 'ТАСКА' },
    { x: 3000, y: 1930, radius: 18, homeX: 3000, homeY: 1930, patrolR: 170, angle: 1.0, stunTimer: 0, speed: 195 * difficulty.enemySpeedMult, label: 'МІТ' },
    { x: 4365, y: 1930, radius: 18, homeX: 4365, homeY: 1930, patrolR: 170, angle: 3.1, stunTimer: 0, speed: 205 * difficulty.enemySpeedMult, label: 'ДЕДЛАЙН' },
    { x: 1635, y: 3040, radius: 18, homeX: 1635, homeY: 3040, patrolR: 160, angle: 0.7, stunTimer: 0, speed: 195 * difficulty.enemySpeedMult, label: 'ЗВІТ' },
    { x: 4365, y: 820, radius: 18, homeX: 4365, homeY: 820, patrolR: 170, angle: 2.5, stunTimer: 0, speed: 205 * difficulty.enemySpeedMult, label: 'ДЕДЛАЙН' },
    { x: 3680, y: 3600, radius: 18, homeX: 3680, homeY: 3600, patrolR: 190, angle: 1.5, stunTimer: 0, speed: 205 * difficulty.enemySpeedMult, label: 'КУРСОВА' },
  ];

  // Warm Bed traps placed right in avenue crossroads so they never overlap buildings
  const beds = [
    { x: 1635, y: 1380, radius: 34, pullRadius: 165 },
    { x: 3000, y: 1380, radius: 34, pullRadius: 165 },
    { x: 4365, y: 2490, radius: 34, pullRadius: 160 },
    { x: 3000, y: 3600, radius: 34, pullRadius: 165 },
  ];

  return { clouds, deadlines, beds };
}

export class EnemySystem {
  constructor(difficulty) {
    this.difficulty = difficulty;
    const { clouds, deadlines, beds } = createEnemies(difficulty);
    this.clouds = clouds;
    this.deadlines = deadlines;
    this.beds = beds;
  }

  update(dt, { player, vasya, phase3, escortPigs, colliders, particles, audio, camera, chat }) {
    for (const c of this.clouds) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < 500 || c.x > 5400) c.vx *= -1;
      if (c.y < 420 || c.y > 3200) c.vy *= -1;

      if (dist(player.x, player.y, c.x, c.y) < c.r) {
        player.inCrisisCloud = true;
      }
      if (phase3 && vasya.state !== 'IN_DEN' && dist(vasya.x, vasya.y, c.x, c.y) < c.r) {
        vasya.inCrisisCloud = true;
        if (!vasya.isImmune()) {
          vasya.addTilt(14 * dt, 'medium', particles, chat);
        }
      }
    }

    for (const d of this.deadlines) {
      if (d.stunTimer > 0) {
        d.stunTimer -= dt;
        continue;
      }

      const canAggroVasya = phase3 && vasya.state !== 'IN_DEN' && vasya.state !== 'EXTRACTED';
      const distVasya = canAggroVasya ? dist(d.x, d.y, vasya.x, vasya.y) : Infinity;

      if (distVasya < 500) {
        const dx = vasya.x - d.x;
        const dy = vasya.y - d.y;
        const len = Math.hypot(dx, dy) || 1;
        d.x += (dx / len) * d.speed * dt;
        d.y += (dy / len) * d.speed * dt;
      } else {
        d.angle += dt * 1.1;
        const tx = d.homeX + Math.cos(d.angle) * d.patrolR;
        const ty = d.homeY + Math.sin(d.angle) * d.patrolR;
        const dx = tx - d.x;
        const dy = ty - d.y;
        const len = Math.hypot(dx, dy) || 1;
        if (len > 4) {
          d.x += (dx / len) * d.speed * 0.72 * dt;
          d.y += (dy / len) * d.speed * 0.72 * dt;
        }
      }

      resolveWorldCollisions(d, colliders);

      if (dist(d.x, d.y, player.x, player.y) < d.radius + player.radius + 8) {
        const dx = d.x - player.x;
        const dy = d.y - player.y;
        const len = Math.hypot(dx, dy) || 1;
        d.x += (dx / len) * 60;
        d.y += (dy / len) * 60;
        d.stunTimer = 2.4;
        particles.spawnBurst(d.x, d.y, '#b83527', 10, 120);
        particles.spawnSpeechBubble(player, 'ВІДБИВ!', {
          bg: '#ede6d6',
          fg: '#141311',
          duration: 1.0,
        });
        camera.shake(4, 0.14);
        continue;
      }

      if (canAggroVasya && dist(d.x, d.y, vasya.x, vasya.y) < d.radius + vasya.radius) {
        d.stunTimer = 2.8;
        if (!vasya.isImmune()) {
          vasya.addTilt(this.difficulty.deadlineDamage, 'medium', particles, chat);
          camera.shake(8, 0.25);
          particles.spawnBurst(vasya.x, vasya.y, '#b83527', 14, 120);

          if (escortPigs.length > 0 && Math.random() < 0.7) {
            const unluckyPig = escortPigs[escortPigs.length - 1];
            if (unluckyPig.spook(particles, audio)) {
              vasya.onPigSpooked(particles, chat, audio);
            }
          }
        } else {
          particles.spawnBurst(vasya.x, vasya.y, '#d6b87c', 10, 90);
        }
      }
    }

    if (phase3 && vasya.state !== 'IN_DEN' && vasya.state !== 'EXTRACTED' && !vasya.isImmune()) {
      for (const bed of this.beds) {
        const d = dist(vasya.x, vasya.y, bed.x, bed.y);
        if (d < bed.pullRadius) {
          const pullStrength = (1 - d / bed.pullRadius) * 150;
          const dx = bed.x - vasya.x;
          const dy = bed.y - vasya.y;
          const len = Math.hypot(dx, dy) || 1;
          vasya.x += (dx / len) * pullStrength * dt;
          vasya.y += (dy / len) * pullStrength * dt;
          if (d < bed.radius + vasya.radius + 8) {
            vasya.addTilt(16 * dt, 'critical', particles, chat);
          }
        }
      }
    }
  }

  render(ctx, cam, time) {
    ctx.save();
    ctx.translate(-cam.renderX, -cam.renderY);

    for (const bed of this.beds) {
      ctx.strokeStyle = 'rgba(184, 53, 39, 0.32)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bed.x - bed.pullRadius, bed.y - bed.pullRadius, bed.pullRadius * 2, bed.pullRadius * 2);

      ctx.fillStyle = '#5c3c2e';
      ctx.fillRect(bed.x - 26, bed.y - 18, 52, 36);
      ctx.strokeStyle = '#141311';
      ctx.lineWidth = 2;
      ctx.strokeRect(bed.x - 26, bed.y - 18, 52, 36);
      ctx.fillStyle = '#ede6d6';
      ctx.fillRect(bed.x - 22, bed.y - 14, 16, 28);
      ctx.fillStyle = '#9c3024';
      ctx.fillRect(bed.x - 4, bed.y - 16, 28, 32);

      ctx.fillStyle = '#d6b87c';
      ctx.font = '900 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ТЕПЛЕ ЛІЖКО', bed.x, bed.y - 24);
    }

    for (const c of this.clouds) {
      const grad = ctx.createRadialGradient(c.x, c.y, 16, c.x, c.y, c.r);
      grad.addColorStop(0, 'rgba(92, 68, 102, 0.48)');
      grad.addColorStop(0.65, 'rgba(54, 40, 61, 0.28)');
      grad.addColorStop(1, 'rgba(54, 40, 61, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r + Math.sin(time * 2 + c.x) * 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d6c6de';
      ctx.font = '900 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ХМАРА КРИЗИ', c.x, c.y);
    }

    for (const d of this.deadlines) {
      const stunned = d.stunTimer > 0;
      ctx.globalAlpha = stunned ? 0.45 : 1;

      const s = 18;
      ctx.fillStyle = stunned ? '#575248' : '#b83527';
      ctx.fillRect(d.x - s, d.y - s, s * 2, s * 2);
      ctx.strokeStyle = Math.sin(time * 10) > 0 ? '#ede6d6' : '#e59a24';
      ctx.lineWidth = 3;
      ctx.strokeRect(d.x - s, d.y - s, s * 2, s * 2);

      ctx.fillStyle = '#ede6d6';
      ctx.font = '900 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', d.x, d.y + 1);

      ctx.font = '900 10px monospace';
      ctx.fillStyle = '#e8b4ae';
      ctx.fillText(d.label, d.x, d.y - 26);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
