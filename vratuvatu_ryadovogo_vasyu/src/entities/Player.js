import { ITEM_TYPES } from '../data/config.js';
import { resolveWorldCollisions } from '../engine/Collision.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.baseSpeed = 275;
    this.sprintMult = 1.38;
    this.stamina = 100;
    this.maxStamina = 100;
    this.inCrisisCloud = false;
    this.inQueue = false;
    this.facingAngle = 0;
    this.walkPhase = 0;
    this.isMoving = false;

    this.inventory = [
      { type: 'cucumber', count: 1 },
      null,
      null,
      null,
    ];
    this.selectedSlot = 0;
  }

  getSelectedItem() {
    return this.inventory[this.selectedSlot];
  }

  hasBeerOrShaurma() {
    return this.inventory.some((slot) => slot && (slot.type === 'beer' || slot.type === 'shaurma'));
  }

  addItem(type) {
    const existing = this.inventory.find((slot) => slot && slot.type === type);
    if (existing) {
      existing.count += 1;
      return true;
    }
    const emptyIdx = this.inventory.findIndex((slot) => slot === null);
    if (emptyIdx !== -1) {
      this.inventory[emptyIdx] = { type, count: 1 };
      return true;
    }
    return false;
  }

  consumeSelected() {
    const slot = this.inventory[this.selectedSlot];
    if (!slot) return null;
    const type = slot.type;
    slot.count -= 1;
    if (slot.count <= 0) {
      this.inventory[this.selectedSlot] = null;
      const next = this.inventory.findIndex((s) => s !== null);
      if (next !== -1) this.selectedSlot = next;
    }
    return type;
  }

  update(dt, input, map, audio) {
    const { dx, dy } = input.getMovementVector();
    this.isMoving = dx !== 0 || dy !== 0;

    const wantsSprint = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const sprinting = wantsSprint && this.isMoving && this.stamina > 4;

    if (sprinting) {
      this.stamina = Math.max(0, this.stamina - 30 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 22 * dt);
    }

    this.inQueue = map.isInAtbQueue(this.x, this.y);

    let speed = this.baseSpeed * (sprinting ? this.sprintMult : 1);
    if (this.inQueue) speed *= 0.55;
    if (this.inCrisisCloud) speed *= 0.65;
    this.inCrisisCloud = false;

    if (this.isMoving) {
      this.x += dx * speed * dt;
      this.y += dy * speed * dt;
      this.facingAngle = Math.atan2(dy, dx);
      this.walkPhase += dt * (sprinting ? 15 : 10);
      audio.playStep(sprinting);
    }

    resolveWorldCollisions(this, map.buildings);
  }

  render(ctx, cam) {
    const sx = Math.round(this.x - cam.renderX);
    const sy = Math.round(this.y - cam.renderY);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.facingAngle);

    ctx.fillStyle = 'rgba(10, 9, 8, 0.55)';
    ctx.fillRect(-14, -14, 30, 30);

    const swing = this.isMoving ? Math.round(Math.sin(this.walkPhase) * 5) : 0;
    ctx.fillStyle = '#24211d';
    ctx.fillRect(swing - 4, -14, 8, 5);
    ctx.fillRect(-swing - 4, 9, 8, 5);

    // Classic GTA 2 olive/leather jacket
    ctx.fillStyle = '#3d5a80';
    ctx.fillRect(-10, -14, 20, 28);
    ctx.strokeStyle = '#141311';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -14, 20, 28);

    ctx.fillStyle = '#5c7fa3';
    ctx.fillRect(swing, -16, 10, 5);
    ctx.fillRect(-swing, 11, 10, 5);

    ctx.fillStyle = '#e6c89c';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#241e18';
    ctx.fillRect(-7, -7, 8, 14);

    ctx.restore();

    const held = this.getSelectedItem();
    if (held) {
      const meta = ITEM_TYPES[held.type];
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, sx + 18, sy - 14);
    }
  }
}
