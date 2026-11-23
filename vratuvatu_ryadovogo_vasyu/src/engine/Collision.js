import { MAP_WIDTH, MAP_HEIGHT } from '../data/config.js';

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function circleRectResolve(entity, rect) {
  const closestX = clamp(entity.x, rect.x, rect.x + rect.w);
  const closestY = clamp(entity.y, rect.y, rect.y + rect.h);
  const dx = entity.x - closestX;
  const dy = entity.y - closestY;
  const d2 = dx * dx + dy * dy;

  if (d2 >= entity.radius * entity.radius) return false;

  const d = Math.sqrt(d2);
  if (d > 0.0001) {
    const overlap = entity.radius - d;
    entity.x += (dx / d) * overlap;
    entity.y += (dy / d) * overlap;
  } else {
    // Center inside rectangle: push out to nearest edge
    const leftPen = entity.x - rect.x;
    const rightPen = rect.x + rect.w - entity.x;
    const topPen = entity.y - rect.y;
    const bottomPen = rect.y + rect.h - entity.y;
    const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
    if (minPen === leftPen) entity.x = rect.x - entity.radius;
    else if (minPen === rightPen) entity.x = rect.x + rect.w + entity.radius;
    else if (minPen === topPen) entity.y = rect.y - entity.radius;
    else entity.y = rect.y + rect.h + entity.radius;
  }
  return true;
}

export function circleCircleResolve(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  const minDist = a.radius + b.radius;
  if (d === 0 || d >= minDist) return false;
  const overlap = (minDist - d) * 0.5;
  const nx = dx / d;
  const ny = dy / d;
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;
  return true;
}

export function resolveWorldCollisions(entity, colliders) {
  for (const rect of colliders) {
    circleRectResolve(entity, rect);
  }
  entity.x = clamp(entity.x, entity.radius + 16, MAP_WIDTH - entity.radius - 16);
  entity.y = clamp(entity.y, entity.radius + 16, MAP_HEIGHT - entity.radius - 16);
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
