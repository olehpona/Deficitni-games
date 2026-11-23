import { MAP_WIDTH, MAP_HEIGHT } from '../data/config.js';

export class Camera {
  constructor(viewWidth = 1280, viewHeight = 720) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  resize(width, height) {
    this.viewWidth = width;
    this.viewHeight = height;
  }

  snapTo(targetX, targetY) {
    this.x = this.clampX(targetX - this.viewWidth / 2);
    this.y = this.clampY(targetY - this.viewHeight / 2);
  }

  shake(magnitude = 8, duration = 0.25) {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt, targetX, targetY) {
    const desiredX = this.clampX(targetX - this.viewWidth / 2);
    const desiredY = this.clampY(targetY - this.viewHeight / 2);
    const smooth = 1 - Math.exp(-8 * dt);
    this.x += (desiredX - this.x) * smooth;
    this.y += (desiredY - this.y) * smooth;

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const intensity = this.shakeMagnitude * Math.max(0, this.shakeTime / 0.3);
      this.shakeOffsetX = (Math.random() * 2 - 1) * intensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * intensity;
      if (this.shakeTime <= 0) {
        this.shakeMagnitude = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }

  clampX(x) {
    return Math.max(0, Math.min(Math.max(0, MAP_WIDTH - this.viewWidth), x));
  }

  clampY(y) {
    return Math.max(0, Math.min(Math.max(0, MAP_HEIGHT - this.viewHeight), y));
  }

  get renderX() {
    return this.x + this.shakeOffsetX;
  }

  get renderY() {
    return this.y + this.shakeOffsetY;
  }
}
