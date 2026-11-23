import { ITEM_TYPES } from '../data/config.js';

export function createWorldPickups(map) {
  const spawns = map ? map.pickupSpawns : [];
  return spawns.map((s, idx) => ({
    id: `pickup_${idx}`,
    type: s.type,
    x: s.x,
    y: s.y,
    radius: 20,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
  }));
}

export class ThrownItemManager {
  constructor() {
    this.projectiles = [];
    this.cucumbersOnGround = [];
  }

  throwItem(type, startX, startY, targetX, targetY) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const d = Math.hypot(dx, dy);
    const maxDist = 300;
    const clampedDist = Math.min(d, maxDist);
    const angle = d > 0.001 ? Math.atan2(dy, dx) : 0;

    this.projectiles.push({
      type,
      startX,
      startY,
      endX: startX + Math.cos(angle) * clampedDist,
      endY: startY + Math.sin(angle) * clampedDist,
      progress: 0,
      duration: 0.34,
    });
  }

  update(dt, onLandCallback) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.progress += dt / p.duration;
      if (p.progress >= 1) {
        this.projectiles.splice(i, 1);
        if (p.type === 'cucumber') {
          this.cucumbersOnGround.push({
            x: p.endX,
            y: p.endY,
            life: 12,
          });
        }
        onLandCallback(p.type, p.endX, p.endY);
      }
    }

    for (let i = this.cucumbersOnGround.length - 1; i >= 0; i--) {
      this.cucumbersOnGround[i].life -= dt;
      if (this.cucumbersOnGround[i].life <= 0) {
        this.cucumbersOnGround.splice(i, 1);
      }
    }
  }

  render(ctx, cam, pickups, time) {
    ctx.save();
    ctx.translate(-cam.renderX, -cam.renderY);

    for (const p of pickups) {
      if (p.collected) continue;
      const meta = ITEM_TYPES[p.type];
      const bob = Math.round(Math.sin(time * 4 + p.bobOffset) * 3);

      ctx.fillStyle = '#171614';
      ctx.fillRect(p.x - 18, p.y - 18 + bob, 36, 36);
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 18, p.y - 18 + bob, 36, 36);

      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, p.x, p.y + bob);
    }

    for (const c of this.cucumbersOnGround) {
      ctx.strokeStyle = '#7a9e4b';
      ctx.lineWidth = 2;
      const r = 18 + Math.round(Math.sin(time * 6) * 3);
      ctx.strokeRect(c.x - r, c.y - r, r * 2, r * 2);
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥬', c.x, c.y);
    }

    for (const pr of this.projectiles) {
      const t = pr.progress;
      const x = pr.startX + (pr.endX - pr.startX) * t;
      const y = pr.startY + (pr.endY - pr.startY) * t - Math.sin(t * Math.PI) * 42;
      const meta = ITEM_TYPES[pr.type];
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, x, y);
    }

    ctx.restore();
  }
}
