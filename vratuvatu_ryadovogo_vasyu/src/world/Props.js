import { MAP_WIDTH, MAP_HEIGHT } from '../data/config.js';

export const H_ROADS = [
  { y: 180, h: 180 },
  { y: 1290, h: 180 },
  { y: 2400, h: 180 },
  { y: 3510, h: 180 },
  { y: 4620, h: 180 },
];

export const V_ROADS = [
  { x: 180, w: 180 },
  { x: 1545, w: 180 },
  { x: 2910, w: 180 },
  { x: 4275, w: 180 },
  { x: 5640, w: 180 },
];

export const BLOCK_W = 1185;
export const BLOCK_H = 930;

export function isOnRoad(x, y, pad = 0) {
  for (const r of H_ROADS) {
    if (y >= r.y - pad && y <= r.y + r.h + pad) return true;
  }
  for (const c of V_ROADS) {
    if (x >= c.x - pad && x <= c.x + c.w + pad) return true;
  }
  return false;
}

export function rectsOverlap(a, b, pad = 0) {
  return (
    a.x < b.x + b.w + pad &&
    a.x + a.w + pad > b.x &&
    a.y < b.y + b.h + pad &&
    a.y + a.h + pad > b.y
  );
}

export function createProps(buildings, blocks, extraGardens, extraBushes) {
  const streetLamps = [];
  for (const vr of V_ROADS) {
    for (const hr of H_ROADS) {
      streetLamps.push({ x: vr.x - 18, y: hr.y - 18, color: '#e6a13e' });
      streetLamps.push({ x: vr.x + vr.w + 18, y: hr.y + hr.h + 18, color: '#e6a13e' });
    }
  }

  // Puddles strictly inside road lanes (between intersections)
  const puddles = [
    { x: 950, y: 3560, rx: 56, ry: 24 },
    { x: 2320, y: 3630, rx: 64, ry: 26 },
    { x: 3680, y: 2480, rx: 60, ry: 24 },
    { x: 960, y: 1370, rx: 58, ry: 24 },
    { x: 4960, y: 1380, rx: 62, ry: 25 },
    { x: 270, y: 1960, rx: 28, ry: 54 },
    { x: 4365, y: 2980, rx: 26, ry: 58 },
  ];

  // Parked cars along road curbs (never in intersections)
  const carColors = ['#9c3024', '#c89d42', '#3c5a78', '#5c6b45', '#786e64', '#854632'];
  const parkedCars = [
    { x: 740, y: 3524, w: 68, h: 32, color: carColors[0] },
    { x: 830, y: 3524, w: 68, h: 32, color: carColors[1] },
    { x: 2100, y: 3524, w: 68, h: 32, color: carColors[2] },
    { x: 2200, y: 3524, w: 68, h: 32, color: carColors[3] },
    { x: 2500, y: 3642, w: 68, h: 32, color: carColors[4] },
    { x: 1120, y: 2414, w: 68, h: 32, color: carColors[5] },
    { x: 3520, y: 1304, w: 68, h: 32, color: carColors[0] },
    { x: 3960, y: 2532, w: 68, h: 32, color: carColors[1] },
    { x: 4800, y: 2414, w: 68, h: 32, color: carColors[2] },
    { x: 5020, y: 1422, w: 68, h: 32, color: carColors[3] },
    { x: 1559, y: 2920, w: 32, h: 68, color: carColors[4] },
    { x: 4289, y: 1920, w: 32, h: 68, color: carColors[5] },
  ];

  const bushes = extraBushes.filter((b) => {
    const box = { x: b.x - b.r - 6, y: b.y - b.r - 6, w: (b.r + 6) * 2, h: (b.r + 6) * 2 };
    if (isOnRoad(b.x, b.y, b.r + 20)) return false;
    for (const bld of buildings) {
      if (rectsOverlap(box, bld, 12)) return false;
    }
    return true;
  });

  const benches = [];
  for (const blk of blocks) {
    if (blk.surface === 'park') {
      benches.push({ x: blk.x + 260, y: blk.y + 420, w: 64, h: 20 });
      benches.push({ x: blk.x + 760, y: blk.y + 420, w: 64, h: 20 });
    }
  }

  return {
    streetLamps: streetLamps.filter(
      (l) => l.x > 20 && l.x < MAP_WIDTH - 20 && l.y > 20 && l.y < MAP_HEIGHT - 20
    ),
    puddles,
    gardens: extraGardens,
    bushes,
    parkedCars,
    benches,
  };
}
