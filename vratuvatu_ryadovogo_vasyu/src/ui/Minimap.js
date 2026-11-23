import { MAP_WIDTH, MAP_HEIGHT } from '../data/config.js';
import { H_ROADS, V_ROADS } from '../world/GalychMap.js';

export class Minimap {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
  }

  render({ map, player, vasya, pigs, pickups, deadlines, stage, hideoutDiscovered, cluesFound = 0 }) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const sx = w / MAP_WIDTH;
    const sy = h / MAP_HEIGHT;

    ctx.fillStyle = '#242b1d';
    ctx.fillRect(0, 0, w, h);

    for (const blk of map.blocks) {
      ctx.fillStyle =
        blk.surface === 'park'
          ? '#344726'
          : blk.surface === 'industrial'
            ? '#33312d'
            : '#3e3b36';
      ctx.fillRect(blk.x * sx, blk.y * sy, blk.w * sx, blk.h * sy);

      // Clue 1+: Highlight the suspect district on the radar!
      if (!hideoutDiscovered && stage === 1 && cluesFound >= 1 && blk.id === map.activeHideout?.blockId) {
        ctx.strokeStyle = '#e59a24';
        ctx.lineWidth = 2;
        ctx.strokeRect(blk.x * sx, blk.y * sy, blk.w * sx, blk.h * sy);
      }
    }

    ctx.fillStyle = '#181715';
    for (const hr of H_ROADS) {
      ctx.fillRect(0, hr.y * sy, w, Math.max(2, hr.h * sy));
    }
    for (const vr of V_ROADS) {
      ctx.fillRect(vr.x * sx, 0, Math.max(2, vr.w * sx), h);
    }

    ctx.fillStyle = '#635e56';
    for (const b of map.buildings) {
      ctx.fillRect(b.x * sx, b.y * sy, Math.max(2, b.w * sx), Math.max(2, b.h * sy));
    }

    ctx.fillStyle = '#d6b87c';
    for (const p of pickups) {
      if (p.collected) continue;
      ctx.fillRect(p.x * sx - 1, p.y * sy - 1, 2, 2);
    }

    // Clue 2: Show 2-3 suspect doors inside the target block
    if (!hideoutDiscovered && stage === 1 && cluesFound >= 2) {
      const tBlock = map.activeHideout?.blockId;
      const tType = map.activeHideout?.typeLabel;
      ctx.fillStyle = '#e59a24';
      for (const d of map.searchableDoors) {
        if (!d.checked && d.blockId === tBlock && d.typeLabel === tType) {
          ctx.fillRect(d.x * sx - 2.5, d.y * sy - 2.5, 5, 5);
        }
      }
    }

    if (stage === 1) {
      for (const inf of map.informants) {
        if (inf.questioned) continue;
        ctx.fillStyle = '#e59a24';
        ctx.fillRect(inf.x * sx - 3, inf.y * sy - 3, 6, 6);
      }
    }

    for (const pig of pigs) {
      ctx.fillStyle = pig.state === 'ESCORT' ? '#7a9e4b' : '#c96f32';
      ctx.fillRect(pig.x * sx - 2, pig.y * sy - 2, 4, 4);
    }

    ctx.fillStyle = '#b83527';
    for (const d of deadlines) {
      ctx.fillRect(d.x * sx - 2, d.y * sy - 2, 4, 4);
    }

    if (stage === 3) {
      const tx = (map.extractionZone.x + map.extractionZone.w / 2) * sx;
      const ty = (map.extractionZone.y + map.extractionZone.h / 2) * sy;
      ctx.strokeStyle = '#7a9e4b';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 6, ty - 6, 12, 12);
    } else if (hideoutDiscovered) {
      ctx.strokeStyle = '#e59a24';
      ctx.lineWidth = 2;
      ctx.strokeRect(map.berlogaDoor.x * sx - 6, map.berlogaDoor.y * sy - 6, 12, 12);
    }

    if (stage === 3) {
      ctx.fillStyle = '#8d6b99';
      ctx.fillRect(vasya.x * sx - 3, vasya.y * sy - 3, 6, 6);
    }

    ctx.fillStyle = '#ede6d6';
    ctx.fillRect(player.x * sx - 3, player.y * sy - 3, 6, 6);
    ctx.strokeStyle = '#141311';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x * sx - 3, player.y * sy - 3, 6, 6);
  }
}
