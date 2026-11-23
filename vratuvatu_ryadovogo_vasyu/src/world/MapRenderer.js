import { H_ROADS, V_ROADS } from './GalychMap.js';

export class MapRenderer {
  constructor(map) {
    this.map = map;
    this.patterns = {};
  }

  ensurePatterns(ctx) {
    if (this.patterns.asphalt) return;

    // 1. 64x64 Cracked Asphalt with Aggregate & Oil Patches
    this.patterns.asphalt = this.makePattern(ctx, 64, 64, (p) => {
      p.fillStyle = '#2c2a28';
      p.fillRect(0, 0, 64, 64);
      // Fine gravel noise
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const hash = ((x * 73 + y * 139) % 17);
          if (hash < 3) {
            p.fillStyle = '#363430';
            p.fillRect(x, y, 2, 2);
          } else if (hash === 7) {
            p.fillStyle = '#22201e';
            p.fillRect(x + 1, y + 1, 2, 2);
          }
        }
      }
      // Subtle crack
      p.fillStyle = '#1b1a18';
      p.fillRect(12, 18, 12, 2);
      p.fillRect(24, 20, 6, 2);
      p.fillRect(30, 22, 8, 2);
      // Oil smudge
      p.fillStyle = 'rgba(18, 17, 15, 0.45)';
      p.fillRect(42, 40, 12, 8);
    });

    // 2. 64x64 Concrete Sidewalk Tiles
    this.patterns.concrete = this.makePattern(ctx, 64, 64, (p) => {
      p.fillStyle = '#5c574f';
      p.fillRect(0, 0, 64, 64);
      p.fillStyle = '#666158';
      p.fillRect(2, 2, 28, 28);
      p.fillRect(34, 34, 28, 28);
      p.fillStyle = '#524d46';
      p.fillRect(34, 2, 28, 28);
      p.fillRect(2, 34, 28, 28);
      // Grout seams
      p.fillStyle = '#3b3732';
      p.fillRect(0, 0, 64, 2);
      p.fillRect(0, 32, 64, 2);
      p.fillRect(0, 0, 2, 64);
      p.fillRect(32, 0, 2, 64);
      // Tiny moss/wear pixels
      p.fillStyle = '#475237';
      p.fillRect(28, 28, 4, 4);
      p.fillRect(60, 2, 3, 3);
    });

    // 3. 64x64 Olive Park Grass
    this.patterns.park = this.makePattern(ctx, 64, 64, (p) => {
      p.fillStyle = '#3b4d2b';
      p.fillRect(0, 0, 64, 64);
      for (let y = 0; y < 64; y += 8) {
        for (let x = 0; x < 64; x += 8) {
          const h = (x * 31 + y * 57) % 13;
          if (h < 4) {
            p.fillStyle = '#465934';
            p.fillRect(x + 2, y + 2, 4, 2);
            p.fillRect(x + 4, y, 2, 4);
          } else if (h === 8) {
            p.fillStyle = '#2d3b20';
            p.fillRect(x + 1, y + 4, 4, 3);
          } else if (h === 11) {
            p.fillStyle = '#524736';
            p.fillRect(x + 3, y + 3, 3, 2);
          }
        }
      }
    });

    // 4. 64x64 Residential Yard Grass & Soil
    this.patterns.residential = this.makePattern(ctx, 64, 64, (p) => {
      p.fillStyle = '#425230';
      p.fillRect(0, 0, 64, 64);
      p.fillStyle = '#4c5e38';
      p.fillRect(6, 8, 12, 8);
      p.fillRect(38, 34, 14, 10);
      p.fillStyle = '#4f4030';
      p.fillRect(16, 42, 8, 6);
      p.fillRect(46, 10, 6, 6);
    });

    // 5. 64x64 Old Town Cobblestone
    this.patterns.cobble = this.makePattern(ctx, 64, 64, (p) => {
      p.fillStyle = '#48433d';
      p.fillRect(0, 0, 64, 64);
      for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 8;
        for (let col = 0; col < 4; col++) {
          const sx = (col * 16 + offset) % 64;
          const sy = row * 16;
          p.fillStyle = (row + col) % 2 === 0 ? '#5c554c' : '#534c44';
          p.fillRect(sx + 1, sy + 1, 14, 14);
        }
      }
    });

    // 6. 64x64 Industrial Concrete Slab
    this.patterns.industrial = this.makePattern(ctx, 64, 64, (p) => {
      p.fillStyle = '#3b3936';
      p.fillRect(0, 0, 64, 64);
      p.strokeStyle = '#2b2926';
      p.lineWidth = 2;
      p.strokeRect(1, 1, 62, 62);
      p.fillStyle = '#47443f';
      p.fillRect(10, 14, 8, 6);
      p.fillRect(42, 38, 10, 8);
      p.fillStyle = '#5c412d';
      p.fillRect(24, 48, 6, 4);
    });
  }

  makePattern(ctx, w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const pctx = c.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    drawFn(pctx);
    return ctx.createPattern(c, 'repeat');
  }

  isVisible(cam, x, y, w, h, pad = 160) {
    return (
      x + w >= cam.renderX - pad &&
      x <= cam.renderX + cam.viewWidth + pad &&
      y + h >= cam.renderY - pad &&
      y <= cam.renderY + cam.viewHeight + pad
    );
  }

  renderBase(ctx, cam, time, { hideoutDiscovered = false, phase2 = false, cluesFound = 0 } = {}) {
    this.ensurePatterns(ctx);
    ctx.imageSmoothingEnabled = false;

    const vw = cam.viewWidth;
    const vh = cam.viewHeight;

    ctx.save();
    ctx.translate(-cam.renderX, -cam.renderY);

    // 0. Base suburban ground (eliminates any black void around map edges!)
    ctx.fillStyle = this.patterns.park || '#3b4d2b';
    ctx.fillRect(cam.renderX - 64, cam.renderY - 64, vw + 128, vh + 128);

    // 1. Render all 16 City Blocks with concrete sidewalks + interior surface
    for (const blk of this.map.blocks) {
      if (!this.isVisible(cam, blk.x, blk.y, blk.w, blk.h)) continue;

      // Outer concrete sidewalk apron
      ctx.fillStyle = this.patterns.concrete || '#5c574f';
      ctx.fillRect(blk.x, blk.y, blk.w, blk.h);

      // Curb edge
      ctx.strokeStyle = '#787268';
      ctx.lineWidth = 4;
      ctx.strokeRect(blk.x + 2, blk.y + 2, blk.w - 4, blk.h - 4);

      // Block interior surface (inset 38px from road edge)
      const pad = 38;
      ctx.fillStyle = this.patterns[blk.surface] || this.patterns.concrete;
      ctx.fillRect(blk.x + pad, blk.y + pad, blk.w - pad * 2, blk.h - pad * 2);
      ctx.strokeStyle = '#3b3732';
      ctx.lineWidth = 2;
      ctx.strokeRect(blk.x + pad, blk.y + pad, blk.w - pad * 2, blk.h - pad * 2);
    }

    // 2. Render Horizontal & Vertical Asphalt Roads
    ctx.fillStyle = this.patterns.asphalt || '#2c2a28';
    for (const hr of H_ROADS) {
      if (!this.isVisible(cam, 0, hr.y, this.map.width, hr.h)) continue;
      ctx.fillRect(0, hr.y, this.map.width, hr.h);
      // Curbs
      ctx.fillStyle = '#787268';
      ctx.fillRect(0, hr.y, this.map.width, 5);
      ctx.fillRect(0, hr.y + hr.h - 5, this.map.width, 5);
      ctx.fillStyle = this.patterns.asphalt;
    }
    for (const vr of V_ROADS) {
      if (!this.isVisible(cam, vr.x, 0, vr.w, this.map.height)) continue;
      ctx.fillRect(vr.x, 0, vr.w, this.map.height);
      ctx.fillStyle = '#787268';
      ctx.fillRect(vr.x, 0, 5, this.map.height);
      ctx.fillRect(vr.x + vr.w - 5, 0, 5, this.map.height);
      ctx.fillStyle = this.patterns.asphalt;
    }

    // Road center markings (strictly skipping intersections so lines never overlap!)
    ctx.fillStyle = '#c89d42';
    for (const hr of H_ROADS) {
      const cy = hr.y + hr.h / 2 - 3;
      for (let x = 20; x < this.map.width - 40; x += 68) {
        const inInter = V_ROADS.some((vr) => x + 36 > vr.x - 16 && x < vr.x + vr.w + 16);
        if (!inInter && this.isVisible(cam, x, cy, 36, 6, 40)) {
          ctx.fillRect(x, cy, 36, 6);
        }
      }
    }
    for (const vr of V_ROADS) {
      const cx = vr.x + vr.w / 2 - 3;
      for (let y = 20; y < this.map.height - 40; y += 68) {
        const inInter = H_ROADS.some((hr) => y + 36 > hr.y - 16 && y < hr.y + hr.h + 16);
        if (!inInter && this.isVisible(cam, cx, y, 6, 36, 40)) {
          ctx.fillRect(cx, y, 6, 36);
        }
      }
    }

    // Crosswalks at every intersection
    ctx.fillStyle = '#b5aea0';
    for (const vr of V_ROADS) {
      for (const hr of H_ROADS) {
        if (!this.isVisible(cam, vr.x - 24, hr.y - 24, vr.w + 48, hr.h + 48)) continue;
        // Clear intersection box slightly darker
        ctx.fillStyle = '#282624';
        ctx.fillRect(vr.x + 5, hr.y + 5, vr.w - 10, hr.h - 10);
        ctx.fillStyle = '#a8a194';
        for (let s = 18; s < vr.w - 22; s += 26) {
          ctx.fillRect(vr.x + s, hr.y - 14, 12, 16);
          ctx.fillRect(vr.x + s, hr.y + hr.h - 2, 12, 16);
        }
        for (let s = 18; s < hr.h - 22; s += 26) {
          ctx.fillRect(vr.x - 14, hr.y + s, 16, 12);
          ctx.fillRect(vr.x + vr.w - 2, hr.y + s, 16, 12);
        }
      }
    }

    // 3. Park footpaths & fountain inside whichever blocks are parks
    for (const blk of this.map.blocks) {
      if (!blk.isPark || !this.isVisible(cam, blk.x, blk.y, blk.w, blk.h)) continue;
      ctx.fillStyle = this.patterns.cobble || '#5c554c';
      ctx.fillRect(blk.x + 60, blk.y + blk.h / 2 - 30, blk.w - 120, 60);
      ctx.fillRect(blk.x + blk.w / 2 - 30, blk.y + 60, 60, blk.h - 120);
      // Fountain
      const fx = blk.x + blk.w / 2 - 48;
      const fy = blk.y + blk.h / 2 - 48;
      ctx.fillStyle = '#47433d';
      ctx.fillRect(fx, fy, 96, 96);
      ctx.fillStyle = '#3b5769';
      ctx.fillRect(fx + 12, fy + 12, 72, 72);
      const rip = Math.floor((Math.sin(time * 4) + 1) * 4);
      ctx.fillStyle = '#7596ab';
      ctx.fillRect(fx + 34 - rip, fy + 34 - rip, 28 + rip * 2, 28 + rip * 2);
    }

    // 4. Gardens (vegetable rows & wooden fences) inside residential blocks
    for (const g of this.map.props.gardens) {
      if (!this.isVisible(cam, g.x, g.y, g.w, g.h)) continue;
      ctx.fillStyle = '#3d2e22';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = '#6b4e33';
      ctx.lineWidth = 4;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      // Cabbage / potato rows
      ctx.fillStyle = '#536e38';
      for (let ry = g.y + 14; ry < g.y + g.h - 16; ry += 22) {
        for (let rx = g.x + 14; rx < g.x + g.w - 18; rx += 22) {
          ctx.fillRect(rx, ry, 12, 12);
        }
      }
    }

    // 5. Puddles
    for (const p of this.map.props.puddles) {
      if (!this.isVisible(cam, p.x - p.rx, p.y - p.ry, p.rx * 2, p.ry * 2)) continue;
      ctx.fillStyle = 'rgba(72, 88, 96, 0.45)';
      ctx.fillRect(p.x - p.rx, p.y - p.ry, p.rx * 2, p.ry * 2);
      ctx.fillStyle = 'rgba(148, 166, 173, 0.35)';
      const shift = Math.floor(Math.sin(time * 3 + p.x) * 5);
      ctx.fillRect(p.x - p.rx * 0.4 + shift, p.y - 4, p.rx * 0.8, 6);
    }

    // 6. Station platform, tracks, diesel train & ATB queue
    this.renderStation(ctx, cam, time);
    this.renderAtbQueue(ctx, cam, time);

    // 7. Searchable doors & active Hideout indicator
    this.renderSearchableDoors(ctx, cam, time, { hideoutDiscovered, phase2, cluesFound });
    if (hideoutDiscovered || phase2) {
      this.renderBerlogaDoor(ctx, cam, time);
    }

    // 8. Parked Vintage GTA 2 Cars
    for (const car of this.map.props.parkedCars) {
      if (!this.isVisible(cam, car.x, car.y, car.w, car.h)) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(car.x + 5, car.y + 5, car.w, car.h);
      ctx.fillStyle = car.color;
      ctx.fillRect(car.x, car.y, car.w, car.h);
      ctx.strokeStyle = '#141311';
      ctx.lineWidth = 3;
      ctx.strokeRect(car.x, car.y, car.w, car.h);
      ctx.fillStyle = '#758c96';
      if (car.w > car.h) {
        ctx.fillRect(car.x + 13, car.y + 4, 14, car.h - 8);
        ctx.fillRect(car.x + car.w - 20, car.y + 4, 10, car.h - 8);
      } else {
        ctx.fillRect(car.x + 4, car.y + 13, car.w - 8, 14);
        ctx.fillRect(car.x + 4, car.y + car.h - 20, car.w - 8, 10);
      }
    }

    // 9. Benches
    for (const b of this.map.props.benches) {
      if (!this.isVisible(cam, b.x, b.y, b.w, b.h)) continue;
      ctx.fillStyle = '#141311';
      ctx.fillRect(b.x + 4, b.y + 4, b.w, b.h);
      ctx.fillStyle = '#6b472a';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#8f6039';
      ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 10);
    }

    // 10. Detailed 2.5D GTA 2 Buildings
    for (const b of this.map.buildings) {
      if (!this.isVisible(cam, b.x, b.y, b.w, b.h, 80)) continue;
      const isActiveHideout =
        (hideoutDiscovered || phase2) && Boolean(b.isVasyaHideout);
      this.renderBuilding(ctx, b, time, isActiveHideout);
    }

    // 11. Informants (?)
    for (const inf of this.map.informants) {
      if (!this.isVisible(cam, inf.x - 40, inf.y - 40, 80, 80)) continue;
      this.renderInformant(ctx, inf, time);
    }

    // 12. Bushes
    for (const bush of this.map.props.bushes) {
      if (!this.isVisible(cam, bush.x - bush.r, bush.y - bush.r, bush.r * 2, bush.r * 2)) continue;
      const s = bush.r;
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(bush.x - s + 5, bush.y - s + 6, s * 2, s * 2);
      ctx.fillStyle = '#283b1b';
      ctx.fillRect(bush.x - s, bush.y - s, s * 2, s * 2);
      ctx.fillStyle = '#365024';
      ctx.fillRect(bush.x - s + 6, bush.y - s + 6, s * 1.4, s * 1.4);
      ctx.fillStyle = '#4f6e36';
      ctx.fillRect(bush.x - s + 10, bush.y - s + 10, s * 0.65, s * 0.65);
    }

    ctx.restore();
  }

  renderBuilding(ctx, b, time, isActiveHideout) {
    // 2.5D Drop Shadow
    ctx.fillStyle = 'rgba(10, 9, 8, 0.72)';
    ctx.fillRect(b.x + 16, b.y + 20, b.w, b.h);

    // South Facade Wall (bottom 22px strip)
    ctx.fillStyle = b.wallColor;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Facade Windows & Door
    for (let wx = b.x + 18; wx < b.x + b.w - 28; wx += 32) {
      const lit = (wx + b.y) % 64 === 0 || isActiveHideout;
      ctx.fillStyle = lit ? (isActiveHideout ? '#b882c4' : '#d6a449') : '#1c1a17';
      ctx.fillRect(wx, b.y + b.h - 15, 16, 11);
      ctx.strokeStyle = '#24211d';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, b.y + b.h - 15, 16, 11);
    }

    // Roof Inset
    const rx = b.x + 8;
    const ry = b.y + 8;
    const rw = b.w - 16;
    const rh = b.h - 28;
    ctx.fillStyle = b.roofColor;
    ctx.fillRect(rx, ry, rw, rh);

    if (b.kind === 'house') {
      // Shingled pitched roof with central ridge, shaded lower slope & brick chimney
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(rx, ry + rh / 2, rw, rh / 2);
      // Shingle tile rows
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      for (let ty = ry + 10; ty < ry + rh - 6; ty += 12) {
        ctx.fillRect(rx + 2, ty, rw - 4, 2);
      }
      // Roof ridge beam
      ctx.fillStyle = '#3a2419';
      ctx.fillRect(rx + 6, ry + rh / 2 - 4, rw - 12, 7);
      // Brick chimney
      ctx.fillStyle = '#733829';
      ctx.fillRect(rx + 20, ry + 14, 18, 18);
      ctx.fillStyle = '#241c18';
      ctx.fillRect(rx + 25, ry + 19, 8, 8);
      // Attic dormer
      ctx.fillStyle = '#a89a82';
      ctx.fillRect(rx + rw - 42, ry + 16, 20, 14);
    } else if (b.kind === 'kamianytsia') {
      // Parapet cornice + inner courtyard skylight + terracotta border
      ctx.strokeStyle = '#a3957f';
      ctx.lineWidth = 4;
      ctx.strokeRect(rx + 4, ry + 4, rw - 8, rh - 8);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(rx + 20, ry + 18, rw - 40, rh - 36);
      // Skylight window
      ctx.fillStyle = '#677e8a';
      ctx.fillRect(rx + rw / 2 - 22, ry + rh / 2 - 14, 44, 28);
      ctx.strokeStyle = '#292622';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + rw / 2 - 22, ry + rh / 2 - 14, 44, 28);
    } else if (b.kind === 'panelka') {
      // Tarred concrete panel seams + elevator shaft + TV antennas
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let px = rx + 40; px < rx + rw - 20; px += 52) {
        ctx.fillRect(px, ry, 2, rh);
      }
      ctx.fillStyle = '#2b2926';
      ctx.fillRect(rx + 24, ry + 18, 44, 32);
      ctx.fillRect(rx + rw - 76, ry + 20, 48, 30);
      // Antenna cross
      ctx.fillStyle = '#9b9384';
      ctx.fillRect(rx + rw / 2 - 1, ry + 10, 2, 24);
      ctx.fillRect(rx + rw / 2 - 12, ry + 16, 24, 2);
      if (isActiveHideout) {
        ctx.strokeStyle = Math.sin(time * 5) > 0 ? '#e59a24' : '#b882c4';
        ctx.lineWidth = 4;
        ctx.strokeRect(rx + 6, ry + 6, rw - 12, rh - 12);
      }
    } else if (b.kind === 'industrial') {
      // Corrugated metal ribs + skylights + rust patches
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let ix = rx + 12; ix < rx + rw - 12; ix += 18) {
        ctx.fillRect(ix, ry + 4, 6, rh - 8);
      }
      ctx.fillStyle = '#6e472b';
      ctx.fillRect(rx + 28, ry + 18, 22, 16);
      ctx.fillStyle = '#60747d';
      ctx.fillRect(rx + rw / 2 - 28, ry + 20, 56, 20);
    } else if (b.kind === 'landmark') {
      // Large HVAC units & rooftop parapet
      ctx.strokeStyle = '#877f72';
      ctx.lineWidth = 4;
      ctx.strokeRect(rx + 4, ry + 4, rw - 8, rh - 8);
      ctx.fillStyle = '#2c2a27';
      ctx.fillRect(rx + 36, ry + 24, 52, 36);
      ctx.fillRect(rx + rw - 100, ry + 24, 52, 36);
      ctx.fillStyle = '#575248';
      ctx.fillRect(rx + 44, ry + 32, 36, 20);
      ctx.fillRect(rx + rw - 92, ry + 32, 36, 20);
    }

    // Outer outline
    ctx.strokeStyle = isActiveHideout ? '#e59a24' : '#1f1d1a';
    ctx.lineWidth = isActiveHideout ? 4 : 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    // Building Nameplate
    ctx.font = '900 12px monospace';
    ctx.textAlign = 'center';
    const textW = ctx.measureText(b.label).width + 12;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2 - 6;
    ctx.fillStyle = 'rgba(20, 19, 17, 0.85)';
    ctx.fillRect(cx - textW / 2, cy - 10, textW, 18);
    ctx.fillStyle = isActiveHideout ? '#e59a24' : '#ede6d6';
    ctx.fillText(b.label, cx, cy + 3);
  }

  renderInformant(ctx, inf, time) {
    // Ground marker
    ctx.fillStyle = inf.questioned ? '#3b3732' : '#e59a24';
    ctx.fillRect(inf.x - 14, inf.y - 14, 28, 28);
    ctx.strokeStyle = '#141311';
    ctx.lineWidth = 2;
    ctx.strokeRect(inf.x - 14, inf.y - 14, 28, 28);

    // Head
    ctx.fillStyle = '#d6b87c';
    ctx.fillRect(inf.x - 6, inf.y - 6, 12, 12);

    if (!inf.questioned) {
      const bob = Math.round(Math.sin(time * 5) * 4);
      ctx.fillStyle = '#141311';
      ctx.fillRect(inf.x - 12, inf.y - 44 + bob, 24, 22);
      ctx.strokeStyle = '#e59a24';
      ctx.lineWidth = 2;
      ctx.strokeRect(inf.x - 12, inf.y - 44 + bob, 24, 22);
      ctx.fillStyle = '#e59a24';
      ctx.font = '900 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', inf.x, inf.y - 27 + bob);
    }

    ctx.fillStyle = '#141311';
    ctx.fillRect(inf.x - 54, inf.y + 18, 108, 15);
    ctx.fillStyle = inf.questioned ? '#9b9384' : '#d6b87c';
    ctx.font = '800 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(inf.name, inf.x, inf.y + 29);
  }

  renderSearchableDoors(ctx, cam, time, { hideoutDiscovered, phase2, cluesFound }) {
    const targetBlock = this.map.activeHideout?.blockId;
    const targetType = this.map.activeHideout?.typeLabel;

    for (const d of this.map.searchableDoors) {
      if (!this.isVisible(cam, d.x - 50, d.y - 50, 100, 100)) continue;
      if ((hideoutDiscovered || phase2) && d.isVasya) continue;

      const isSuspect =
        !d.checked &&
        ((cluesFound >= 1 && d.blockId === targetBlock && cluesFound < 2) ||
          (cluesFound >= 2 && d.blockId === targetBlock && d.typeLabel === targetType));

      // Threshold mat
      ctx.fillStyle = d.checked ? '#2c2924' : isSuspect ? '#e59a24' : '#574e42';
      ctx.fillRect(d.x - 16, d.y - 24, 32, 12);
      ctx.strokeStyle = '#141311';
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x - 16, d.y - 24, 32, 12);

      if (d.checked) {
        ctx.fillStyle = '#9b9384';
        ctx.font = '900 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✗ ПУСТО', d.x, d.y + 4);
      } else if (isSuspect) {
        const pulse = Math.sin(time * 7) > 0;
        ctx.strokeStyle = pulse ? '#e59a24' : '#ede6d6';
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x - 18, d.y - 12, 36, 22);
        ctx.fillStyle = '#e59a24';
        ctx.font = '900 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ПІДОЗРА [E]', d.x, d.y + 3);
      }
    }
  }

  renderStation(ctx, cam, time) {
    const t = this.map.trainZone;
    const ez = this.map.extractionZone;
    if (!this.isVisible(cam, ez.x - 80, ez.y - 80, 1185, 650)) return;

    // Platform
    ctx.fillStyle = '#524e47';
    ctx.fillRect(ez.x - 20, ez.y - 15, 820, 195);
    ctx.fillStyle = '#c89d42';
    ctx.fillRect(ez.x - 20, ez.y + 170, 820, 10);

    // Extraction zone
    const flash = Math.sin(time * 5) > 0 ? 0.25 : 0.14;
    ctx.fillStyle = `rgba(122, 158, 75, ${flash})`;
    ctx.fillRect(ez.x, ez.y, ez.w, ez.h);
    ctx.strokeStyle = '#7a9e4b';
    ctx.lineWidth = 3;
    ctx.strokeRect(ez.x, ez.y, ez.w, ez.h);

    ctx.fillStyle = '#cbe3a4';
    ctx.font = '900 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ПЕРОН ПОСАДКИ // ЕВАКУАЦІЯ', ez.x + ez.w / 2, ez.y + 26);

    // Tracks
    const trackY = t.y - 10;
    ctx.fillStyle = '#1c1a17';
    ctx.fillRect(ez.x - 40, trackY, 1120, 165);
    ctx.fillStyle = '#4f463d';
    for (let x = ez.x - 25; x < ez.x + 1060; x += 34) {
      ctx.fillRect(x, trackY + 15, 12, 130);
    }
    ctx.fillStyle = '#877f72';
    ctx.fillRect(ez.x - 40, trackY + 35, 1120, 6);
    ctx.fillRect(ez.x - 40, trackY + 125, 1120, 6);

    // Diesel train "ГАЛИЧ — ЛЬВІВ"
    ctx.fillStyle = '#141311';
    ctx.fillRect(t.x + 12, t.y + 14, t.w, t.h);
    ctx.fillStyle = '#2b4c7e';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.strokeStyle = '#c89d42';
    ctx.lineWidth = 3;
    ctx.strokeRect(t.x, t.y, t.w, t.h);

    ctx.fillStyle = '#c89d42';
    ctx.fillRect(t.x + 4, t.y + t.h - 30, t.w - 8, 14);
    ctx.fillStyle = '#e6c873';
    for (let wx = t.x + 30; wx < t.x + t.w - 110; wx += 74) {
      ctx.fillRect(wx, t.y + 22, 52, 34);
    }
    ctx.fillStyle = '#9fb3c8';
    ctx.fillRect(t.x + t.w - 88, t.y + 18, 66, 44);
    ctx.fillStyle = '#e6a13e';
    ctx.fillRect(t.x + t.w - 10, t.y + t.h / 2 - 8, 14, 20);
    ctx.fillStyle = '#141311';
    ctx.fillRect(t.x + 150, t.y - 12, 28, 16);

    ctx.fillStyle = '#ede6d6';
    ctx.font = '900 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ДИЗЕЛЬ «ГАЛИЧ — ЛЬВІВ»', t.x + 28, t.y + t.h - 38);
  }

  renderAtbQueue(ctx, cam, time) {
    const q = this.map.atbQueueZone;
    if (!this.isVisible(cam, q.x, q.y, q.w, q.h)) return;
    ctx.fillStyle = 'rgba(229, 154, 36, 0.16)';
    ctx.fillRect(q.x, q.y, q.w, q.h);
    ctx.strokeStyle = '#e59a24';
    ctx.lineWidth = 3;
    ctx.strokeRect(q.x, q.y, q.w, q.h);

    for (let i = 0; i < 6; i++) {
      const px = q.x + 40 + i * 62;
      const py = q.y + 66 + Math.floor(Math.sin(time * 2 + i) * 4);
      ctx.fillStyle = '#141311';
      ctx.fillRect(px - 10, py - 10, 22, 22);
      ctx.fillStyle = '#8a8275';
      ctx.fillRect(px - 12, py - 12, 22, 22);
    }

    ctx.fillStyle = '#e59a24';
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ЧЕРГА НА КАСІ (-45% ШВИДКОСТІ)', q.x + q.w / 2, q.y + 22);
  }

  renderBerlogaDoor(ctx, cam, time) {
    const d = this.map.berlogaDoor;
    if (!this.isVisible(cam, d.x - 160, d.y - 160, 320, 320)) return;

    const pulse = 135 + Math.sin(time * 4) * 20;
    const grad = ctx.createRadialGradient(d.x, d.y, 16, d.x, d.y, pulse);
    grad.addColorStop(0, 'rgba(141, 107, 153, 0.45)');
    grad.addColorStop(1, 'rgba(141, 107, 153, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(d.x, d.y, pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8d6b99';
    ctx.fillRect(d.x - 20, d.y - 20, 40, 40);
    ctx.strokeStyle = '#e59a24';
    ctx.lineWidth = 3;
    ctx.strokeRect(d.x - 20, d.y - 20, 40, 40);

    ctx.fillStyle = '#ede6d6';
    ctx.font = '900 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('БЕРЛОГА ВАСІ [E]', d.x, d.y + 38);
  }

  renderLighting(ctx, cam, player, difficulty, phase3) {
    const vw = cam.viewWidth;
    const vh = cam.viewHeight;

    // Warm sodium streetlamp pools
    ctx.save();
    ctx.translate(-cam.renderX, -cam.renderY);
    for (const lamp of this.map.props.streetLamps) {
      if (!this.isVisible(cam, lamp.x - 160, lamp.y - 160, 320, 320)) continue;
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, 145);
      g.addColorStop(0, 'rgba(230, 161, 62, 0.25)');
      g.addColorStop(1, 'rgba(230, 161, 62, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 145, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e6a13e';
      ctx.fillRect(lamp.x - 4, lamp.y - 4, 8, 8);
    }
    ctx.restore();

    const darkness = Math.min(0.8, difficulty.fogDarkness + (phase3 ? 0.14 : 0));
    if (darkness <= 0.05) return;

    const px = player.x - cam.renderX;
    const py = player.y - cam.renderY;
    const radius = difficulty.lightRadius * (phase3 ? 0.9 : 1);

    const vignette = ctx.createRadialGradient(px, py, radius * 0.25, px, py, radius * 1.45);
    vignette.addColorStop(0, 'rgba(14, 13, 11, 0)');
    vignette.addColorStop(0.65, `rgba(14, 13, 11, ${darkness * 0.52})`);
    vignette.addColorStop(1, `rgba(14, 13, 11, ${darkness})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, vw, vh);
  }
}
