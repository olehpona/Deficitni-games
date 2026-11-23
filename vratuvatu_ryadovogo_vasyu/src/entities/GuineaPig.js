import { dist, resolveWorldCollisions } from '../engine/Collision.js';

const PIG_PALETTES = [
  { body: '#c46c2b', patch: '#ede6d6', ear: '#8a4617' },
  { body: '#d6c39c', patch: '#59341a', ear: '#754624' },
  { body: '#8f5f24', patch: '#ede6d6', ear: '#5c3c14' },
  { body: '#cfc9be', patch: '#4f4a42', ear: '#6b6459' },
];

export class GuineaPig {
  constructor(id, x, y, paletteIndex, bushes) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.radius = 14;
    this.palette = PIG_PALETTES[paletteIndex % PIG_PALETTES.length];
    this.bushes = bushes;

    this.state = 'WILD';
    this.angle = Math.random() * Math.PI * 2;
    this.wanderTimer = 1 + Math.random() * 2;
    this.squeakTimer = 4 + Math.random() * 6;
    this.spookTimer = 0;
    this.targetBush = null;
    this.waddle = Math.random() * Math.PI * 2;
  }

  spook(particles, audio) {
    if (this.state === 'SPOOKED') return false;
    this.state = 'SPOOKED';
    this.spookTimer = 5.0;
    this.targetBush = this.findNearestBush();
    if (audio) audio.playGuineaPigSqueak(true);
    if (particles) {
      particles.spawnSpeechBubble(this, 'УІ-УІ-УІ!', {
        bg: '#f2dcb3',
        fg: '#6e1914',
        duration: 2.1,
        urgent: true,
      });
    }
    return true;
  }

  calmAndFollow(particles, audio) {
    this.state = 'ESCORT';
    this.spookTimer = 0;
    if (audio) audio.playGuineaPigSqueak(false);
    if (particles) {
      particles.spawnSpeechBubble(this, 'уі-уі!', {
        bg: '#ede6d6',
        fg: '#141311',
        duration: 1.6,
      });
    }
  }

  findNearestBush() {
    let best = this.bushes[0] || { x: this.homeX, y: this.homeY };
    let bestD = Infinity;
    for (const b of this.bushes) {
      const d = dist(this.x, this.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  update(dt, { player, vasya, followIndex, cucumbers, heldCucumber, colliders, particles, audio }) {
    this.waddle += dt * 10;
    this.squeakTimer -= dt;

    if (this.squeakTimer <= 0) {
      this.squeakTimer = 6 + Math.random() * 7;
      if (dist(this.x, this.y, player.x, player.y) < 550) {
        audio.playGuineaPigSqueak(false);
        particles.spawnSpeechBubble(this, 'уі-уі!', {
          bg: '#ede6d6',
          fg: '#141311',
          duration: 1.4,
        });
      }
    }

    if (this.state === 'SPOOKED') {
      this.spookTimer -= dt;
      const target = this.targetBush || { x: this.homeX, y: this.homeY };
      const d = dist(this.x, this.y, target.x, target.y);
      if (d > 16) {
        this.moveTowards(target.x, target.y, 310, dt);
      }
      if (this.spookTimer <= 0 || d <= 18) {
        this.state = 'WILD';
        this.homeX = this.x;
        this.homeY = this.y;
      }
      resolveWorldCollisions(this, colliders);
      return;
    }

    let lure = null;
    for (const c of cucumbers) {
      if (dist(this.x, this.y, c.x, c.y) < 380) {
        lure = c;
        break;
      }
    }
    if (!lure && heldCucumber && dist(this.x, this.y, player.x, player.y) < 300) {
      lure = player;
    }

    if (this.state === 'WILD') {
      if (lure) {
        this.moveTowards(lure.x, lure.y, 210, dt);
      } else {
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 1.5 + Math.random() * 2.5;
          const dx = this.homeX - this.x;
          const dy = this.homeY - this.y;
          if (Math.hypot(dx, dy) > 140) {
            this.angle = Math.atan2(dy, dx);
          } else {
            this.angle = Math.random() * Math.PI * 2;
          }
        }
        this.x += Math.cos(this.angle) * 56 * dt;
        this.y += Math.sin(this.angle) * 56 * dt;
      }
    } else if (this.state === 'ESCORT') {
      const anchor = vasya.state !== 'IN_DEN' ? vasya : player;
      const desiredDist = 46 + followIndex * 34;
      const d = dist(this.x, this.y, anchor.x, anchor.y);
      if (d > desiredDist) {
        const speed = d > 200 ? 330 : 265;
        this.moveTowards(anchor.x, anchor.y, speed, dt);
      }
    }

    resolveWorldCollisions(this, colliders);
  }

  moveTowards(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    this.angle = Math.atan2(dy, dx);
    this.x += (dx / d) * speed * dt;
    this.y += (dy / d) * speed * dt;
  }

  render(ctx, cam) {
    const sx = Math.round(this.x - cam.renderX);
    const sy = Math.round(this.y - cam.renderY);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    ctx.fillStyle = 'rgba(10, 9, 8, 0.45)';
    ctx.fillRect(-13, -8, 28, 18);

    const paw = Math.round(Math.sin(this.waddle) * 2);
    ctx.fillStyle = '#d9b4ad';
    ctx.fillRect(6 + paw, -11, 4, 4);
    ctx.fillRect(6 - paw, 7, 4, 4);
    ctx.fillRect(-8 - paw, -11, 4, 4);
    ctx.fillRect(-8 + paw, 7, 4, 4);

    ctx.fillStyle = this.palette.body;
    ctx.fillRect(-13, -9, 26, 18);
    ctx.strokeStyle = this.state === 'ESCORT' ? '#e59a24' : '#141311';
    ctx.lineWidth = 2;
    ctx.strokeRect(-13, -9, 26, 18);

    ctx.fillStyle = this.palette.patch;
    ctx.fillRect(-7, -6, 10, 11);

    ctx.fillStyle = this.palette.ear;
    ctx.fillRect(4, -11, 5, 4);
    ctx.fillRect(4, 7, 5, 4);

    ctx.fillStyle = '#141311';
    ctx.fillRect(8, -5, 3, 3);
    ctx.fillRect(8, 2, 3, 3);
    ctx.fillStyle = '#c46c72';
    ctx.fillRect(12, -2, 3, 4);

    ctx.restore();
  }
}

export function createGuineaPigs(bushes, customSpots = null) {
  const spots =
    customSpots && customSpots.length >= 4
      ? customSpots.slice(0, 4)
      : [
          { x: 740, y: 740 },
          { x: 1180, y: 980 },
          { x: 1960, y: 760 },
          { x: 2560, y: 660 },
        ];
  return spots.map((s, i) => new GuineaPig(`pig_${i}`, s.x, s.y, i, bushes));
}
