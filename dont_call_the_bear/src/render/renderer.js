import { drawAssetOrPlaceholder, roundRect } from './placeholders.js';

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// Кроп-область віконного спрайту (1024x576) та точні координати вікон на main_room.png (1280x720)
const WINDOW_SPRITE_CROP = { sx: 408, sy: 142, sw: 208, sh: 275 };
const LEFT_WINDOW_RECT = { x: 345, y: 190, w: 216, h: 295 };
const RIGHT_WINDOW_RECT = { x: 718, y: 190, w: 216, h: 295 };

/**
 * Рендерить активну кімнату хатини, ведмедів, предмети, ліхтарик і сп'яніння.
 * Повертає масив інтерактивних хітбоксів у координатах 1280x720.
 */
export function renderGameScene(ctx, state, assetManager, settings = {}) {
  const showTag = settings.showPlaceholderTags !== false;
  const hotspots = [];

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (state.phase === 'jumpscare') {
    renderJumpscare(ctx, state, assetManager, showTag);
    ctx.restore();
    return hotspots;
  }

  // П'яне похитування камери та тряска
  const drunkAmp =
    state.wobbleStunTimer > 0
      ? 14
      : state.soberBoostTimer > 0
        ? 1.5
        : 1.2 + (state.nausea / 100) * 8.5;

  const swayX = Math.sin(state.drunkPhase * 1.1) * drunkAmp;
  const swayY = Math.cos(state.drunkPhase * 1.6) * drunkAmp * 0.65;
  const swayRot = Math.sin(state.drunkPhase * 0.85) * (drunkAmp * 0.0018);

  const shakeX = (Math.random() - 0.5) * 26 * state.screenShake;
  const shakeY = (Math.random() - 0.5) * 22 * state.screenShake;
  const panShift = state.roomTransition * 32;

  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2 + swayX + shakeX + panShift, CANVAS_HEIGHT / 2 + swayY + shakeY);
  ctx.rotate(swayRot);
  ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

  switch (state.currentRoom) {
    case 'door':
      renderDoorRoom(ctx, state, assetManager, showTag, hotspots);
      break;
    case 'windows':
      renderWindowsRoom(ctx, state, assetManager, showTag, hotspots);
      break;
    case 'chimney':
      renderChimneyRoom(ctx, state, assetManager, showTag, hotspots);
      break;
    case 'bathroom':
      renderBathroomRoom(ctx, state, assetManager, showTag, hotspots);
      break;
    default:
      renderWindowsRoom(ctx, state, assetManager, showTag, hotspots);
  }

  // Напівтемрява + промінь ліхтарика
  renderLightingOverlay(ctx, state);

  ctx.restore();

  // Віньєтка сп'яніння / нудоти
  renderNauseaVignette(ctx, state);

  ctx.restore();
  return hotspots;
}

function drawFullScene(ctx, assetManager, id, fallbackColor = '#0c0907') {
  const img = assetManager ? assetManager.getImage(id) : null;
  if (img) {
    drawAssetOrPlaceholder(ctx, assetManager, id, -20, -12, CANVAS_WIDTH + 40, CANVAS_HEIGHT + 24, {
      showTag: false,
      fit: 'cover'
    });
    return true;
  }
  ctx.fillStyle = fallbackColor;
  ctx.fillRect(-40, -40, CANVAS_WIDTH + 80, CANVAS_HEIGHT + 80);
  return false;
}

function renderDoorRoom(ctx, state, assetManager, showTag, hotspots) {
  const bear = state.bears.door;
  const sceneId =
    bear.stage === 3
      ? 'scene_door_opening'
      : bear.stage === 2
        ? 'scene_door_near'
        : bear.stage === 1
          ? 'scene_door_far'
          : 'bg_door';

  const rattleOffset =
    bear.stage === 2 ? Math.sin(state.timeSeconds * 44) * 3.5 : bear.stage === 3 ? 6 : 0;

  ctx.save();
  ctx.translate(rattleOffset, 0);
  drawFullScene(ctx, assetManager, sceneId, '#140c08');
  ctx.restore();

  // Індикатор засува в стилі FNaF
  const meterW = 240;
  const meterH = 22;
  const meterX = CANVAS_WIDTH / 2 - meterW / 2;
  const meterY = 535;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
  ctx.strokeStyle = state.isHoldingLock ? '#51cf66' : bear.stage >= 2 ? '#ff4d4d' : 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(meterX, meterY, meterW, meterH);
  ctx.strokeRect(meterX, meterY, meterW, meterH);

  const pct = state.lockIntegrity / 100;
  ctx.fillStyle = pct > 0.5 ? '#51cf66' : pct > 0.25 ? '#f59f00' : '#e03131';
  ctx.fillRect(meterX + 2, meterY + 2, Math.max(0, (meterW - 4) * pct), meterH - 4);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    state.isHoldingLock ? `ЗАСУВ ЗАТИСНУТО (${Math.round(state.lockIntegrity)}%)` : `ЗАСУВ: ${Math.round(state.lockIntegrity)}%`,
    CANVAS_WIDTH / 2,
    meterY + 15
  );

  if (state.lockPushProgress > 0.02) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(meterX, meterY + 26, meterW, 10);
    ctx.fillStyle = '#69db7c';
    ctx.fillRect(meterX + 2, meterY + 28, (meterW - 4) * state.lockPushProgress, 6);
  }

  hotspots.push({
    action: 'holdLock',
    type: 'hold',
    x: 520,
    y: 165,
    w: 240,
    h: 410,
    label: 'Тримати засув'
  });

  drawHorrorPrompt(
    ctx,
    CANVAS_WIDTH / 2,
    585,
    state.isHoldingLock ? 'ТРИМАЄМО...' : '[SPACE] ЗАСУВ',
    state.isHoldingLock ? '#51cf66' : bear.stage >= 2 ? '#ff4d4d' : '#d8c8b8'
  );
}

function renderWindowsRoom(ctx, state, assetManager, showTag, hotspots) {
  drawFullScene(ctx, assetManager, 'bg_windows', '#16100b');

  const litLeft = state.flashlightOn && state.aimX < 0.52;
  const litRight = state.flashlightOn && state.aimX >= 0.48;

  renderWindowOverlay(ctx, state.bears.leftWindow, LEFT_WINDOW_RECT, assetManager, false, litLeft);
  renderWindowOverlay(ctx, state.bears.rightWindow, RIGHT_WINDOW_RECT, assetManager, true, litRight);

  // Сковорідка на столику зліва
  const panX = 245;
  const panY = 505;
  const panW = 165;
  const panH = 120;

  ctx.save();
  if (state.panSwingTimer > 0) {
    ctx.translate(panX + panW / 2, panY + panH / 2);
    ctx.rotate(-Math.sin(state.panSwingTimer * 18) * 0.75);
    ctx.translate(-(panX + panW / 2), -(panY + panH / 2));
  }
  drawAssetOrPlaceholder(ctx, assetManager, 'prop_frying_pan', panX, panY, panW, panH, {
    showTag: false,
    alpha: state.panCooldown > 0 ? 0.45 : 1
  });
  ctx.restore();

  hotspots.push({
    action: 'pan',
    type: 'click',
    x: panX - 15,
    y: panY - 15,
    w: panW + 30,
    h: panH + 45,
    label: 'Сковорідка'
  });

  drawHorrorPrompt(
    ctx,
    panX + panW / 2,
    panY + panH + 18,
    state.panCooldown > 0 ? `${state.panCooldown.toFixed(1)}с` : '[Q] СКОВОРІДКА',
    state.bears.leftWindow.stage === 3 ? '#ff4d4d' : '#d8c8b8'
  );

  // Балончик справа
  const sprayX = 935;
  const sprayY = 475;
  const sprayW = 115;
  const sprayH = 155;

  drawAssetOrPlaceholder(ctx, assetManager, 'prop_spray', sprayX, sprayY, sprayW, sprayH, {
    showTag: false,
    alpha: state.sprayCooldown > 0 ? 0.45 : 1
  });

  if (state.sprayEffectTimer > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 132, 36, ${state.sprayEffectTimer * 0.65})`;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(
        850 + Math.cos(i) * 45 + (0.55 - state.sprayEffectTimer) * 80,
        345 + Math.sin(i * 2) * 55,
        16 + i * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  hotspots.push({
    action: 'spray',
    type: 'click',
    x: sprayX - 15,
    y: sprayY - 15,
    w: sprayW + 30,
    h: sprayH + 40,
    label: 'Балончик'
  });

  drawHorrorPrompt(
    ctx,
    sprayX + sprayW / 2,
    sprayY + sprayH + 16,
    state.sprayCooldown > 0 ? `${state.sprayCooldown.toFixed(1)}с` : '[E] БАЛОНЧИК',
    state.bears.rightWindow.stage >= 2 ? '#ff4d4d' : '#d8c8b8'
  );
}

function renderWindowOverlay(ctx, bear, rect, assetManager, flipX, lit) {
  if (bear.stage === 0) return;

  const spriteId =
    bear.stage === 3
      ? 'window_climbing'
      : bear.stage === 2
        ? 'window_looking'
        : 'window_looking';

  const img = assetManager ? assetManager.getImage(spriteId) : null;
  if (!img) return;

  ctx.save();
  ctx.globalAlpha = bear.stage === 1 ? (lit ? 0.52 : 0.16) : 1.0;

  if (flipX) {
    ctx.translate(rect.x + rect.w, rect.y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      img,
      WINDOW_SPRITE_CROP.sx,
      WINDOW_SPRITE_CROP.sy,
      WINDOW_SPRITE_CROP.sw,
      WINDOW_SPRITE_CROP.sh,
      0,
      0,
      rect.w,
      rect.h
    );
  } else {
    ctx.drawImage(
      img,
      WINDOW_SPRITE_CROP.sx,
      WINDOW_SPRITE_CROP.sy,
      WINDOW_SPRITE_CROP.sw,
      WINDOW_SPRITE_CROP.sh,
      rect.x,
      rect.y,
      rect.w,
      rect.h
    );
  }
  ctx.restore();
}

function renderChimneyRoom(ctx, state, assetManager, showTag, hotspots) {
  const bear = state.bears.chimney;
  const sceneId =
    state.fireActiveTimer > 0
      ? 'scene_chimney_fire'
      : bear.stage >= 2
        ? 'scene_chimney_bear'
        : 'bg_chimney';

  drawFullScene(ctx, assetManager, sceneId, '#140c08');

  // Частинки сажі при stage >= 1
  if (bear.stage >= 1 && state.fireActiveTimer <= 0) {
    ctx.fillStyle = 'rgba(10, 10, 12, 0.78)';
    const count = bear.stage * 10;
    for (let i = 0; i < count; i++) {
      const sx = 525 + ((i * 47) % 230);
      const sy = 345 + ((state.timeSeconds * 95 + i * 39) % 190);
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  hotspots.push({
    action: 'fire',
    type: 'click',
    x: 470,
    y: 310,
    w: 340,
    h: 270,
    label: 'Розпалити дим'
  });

  let tagText = '[SPACE] ДИМ';
  let tagColor = '#f59f00';
  if (state.fireActiveTimer > 0) {
    tagText = `ДИМ (${state.fireActiveTimer.toFixed(1)}с)`;
    tagColor = '#ffd43b';
  } else if (state.fireCooldown > 0) {
    tagText = `${state.fireCooldown.toFixed(1)}с`;
    tagColor = '#868e96';
  } else if (bear.stage >= 2) {
    tagColor = '#ff4d4d';
  }

  drawHorrorPrompt(ctx, 640, 620, tagText, tagColor);
}

function renderBathroomRoom(ctx, state, assetManager, showTag, hotspots) {
  const showCreepyBear =
    state.nausea >= 75 || state.isToiletLoud || state.wobbleStunTimer > 0;
  const sceneId = showCreepyBear ? 'scene_bathroom_bear' : 'bg_bathroom';

  drawFullScene(ctx, assetManager, sceneId, '#101518');

  // Банка розсолу на поличці / праворуч
  const brineX = 875;
  const brineY = 445;
  const brineW = 125;
  const brineH = 135;

  drawAssetOrPlaceholder(ctx, assetManager, 'prop_brine', brineX, brineY, brineW, brineH, {
    showTag: false,
    alpha: state.brineJars > 0 ? 1 : 0.22
  });

  hotspots.push({
    action: 'brine',
    type: 'click',
    x: brineX - 10,
    y: brineY - 10,
    w: brineW + 20,
    h: brineH + 30,
    label: 'Огірковий розсіл'
  });

  drawHorrorPrompt(
    ctx,
    brineX + brineW / 2,
    brineY + brineH + 14,
    `[R] РОЗСІЛ: ${state.brineJars}`,
    state.brineJars > 0 ? '#69db7c' : '#868e96'
  );

  // Хітбокси на унітазі
  hotspots.push({
    action: 'toiletQuiet',
    type: 'hold',
    x: 430,
    y: 380,
    w: 220,
    h: 260,
    label: 'Тихо'
  });

  hotspots.push({
    action: 'toiletLoud',
    type: 'hold',
    x: 650,
    y: 380,
    w: 220,
    h: 260,
    label: 'Швидко (Гучно)'
  });

  drawHorrorPrompt(
    ctx,
    535,
    648,
    state.isToiletQuiet ? 'ТИХО...' : '[SPACE] ТИХО',
    state.isToiletQuiet ? '#51cf66' : '#a5d8ff'
  );
  drawHorrorPrompt(
    ctx,
    765,
    648,
    state.isToiletLoud ? 'КЛИЧ!' : 'ГУЧНО!',
    state.isToiletLoud ? '#ff4d4d' : '#f59f00'
  );
}

function renderLightingOverlay(ctx, state) {
  ctx.save();
  const darkness =
    state.currentRoom === 'bathroom'
      ? 0.22
      : state.currentRoom === 'chimney' && state.fireActiveTimer > 0
        ? 0.14
        : 0.56;

  if (!state.flashlightOn) {
    ctx.fillStyle = `rgba(2, 3, 6, ${darkness})`;
    ctx.fillRect(-50, -50, CANVAS_WIDTH + 100, CANVAS_HEIGHT + 100);
    ctx.restore();
    return;
  }

  const beamX = state.aimX * CANVAS_WIDTH;
  const beamY = state.aimY * CANVAS_HEIGHT;
  const beamRadius = state.currentRoom === 'windows' ? 285 : 245;

  const grad = ctx.createRadialGradient(beamX, beamY, 24, beamX, beamY, beamRadius);
  grad.addColorStop(0, 'rgba(255, 246, 214, 0.15)');
  grad.addColorStop(0.55, 'rgba(2, 3, 6, 0.06)');
  grad.addColorStop(1, `rgba(2, 3, 6, ${darkness + 0.15})`);

  ctx.fillStyle = grad;
  ctx.fillRect(-50, -50, CANVAS_WIDTH + 100, CANVAS_HEIGHT + 100);
  ctx.restore();
}

function renderNauseaVignette(ctx, state) {
  if (state.nausea < 40 && state.brineEffectTimer <= 0 && state.wobbleStunTimer <= 0) return;

  ctx.save();
  const intensity = Math.max(0, (state.nausea - 40) / 60);
  if (intensity > 0) {
    const grad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      200,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      710
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(45, 130, 35, ${intensity * 0.48})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (state.brineEffectTimer > 0) {
    ctx.fillStyle = `rgba(116, 192, 252, ${state.brineEffectTimer * 0.22})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (state.wobbleStunTimer > 0) {
    ctx.fillStyle = 'rgba(220, 35, 35, 0.25)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  ctx.restore();
}

function renderJumpscare(ctx, state, assetManager, showTag) {
  ctx.fillStyle = '#090202';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const jitterX = (Math.random() - 0.5) * 48;
  const jitterY = (Math.random() - 0.5) * 38;
  const scale = 1.25 + Math.sin(state.jumpscareTimer * 38) * 0.12;

  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2 + jitterX, CANVAS_HEIGHT / 2 + jitterY);
  ctx.scale(scale, scale);
  ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

  const customJumpscare = assetManager ? assetManager.getImage('bear_jumpscare') : null;
  if (customJumpscare) {
    drawAssetOrPlaceholder(ctx, assetManager, 'bear_jumpscare', 120, 20, CANVAS_WIDTH - 240, CANVAS_HEIGHT - 90, {
      showTag: false,
      fit: 'contain'
    });
  } else {
    const fallbackId =
      state.jumpscareSource === 'chimney'
        ? 'scene_chimney_bear'
        : state.jumpscareSource === 'door'
          ? 'scene_door_opening'
          : state.jumpscareSource === 'leftWindow' || state.jumpscareSource === 'rightWindow'
            ? 'window_climbing'
            : 'scene_door_opening';

    const img = assetManager ? assetManager.getImage(fallbackId) : null;
    if (img) {
      drawAssetOrPlaceholder(ctx, assetManager, fallbackId, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, {
        showTag: false,
        fit: 'cover'
      });
    } else {
      drawAssetOrPlaceholder(
        ctx,
        assetManager,
        'bear_jumpscare',
        160,
        -20,
        CANVAS_WIDTH - 320,
        CANVAS_HEIGHT + 40,
        { showTag, eyeGlow: 2.2 }
      );
    }
  }

  // Червоне стробоскопне світіння
  if (Math.sin(state.jumpscareTimer * 55) > 0) {
    ctx.fillStyle = 'rgba(255, 20, 20, 0.16)';
    ctx.fillRect(-100, -100, CANVAS_WIDTH + 200, CANVAS_HEIGHT + 200);
  }
  ctx.restore();

  drawHorrorPrompt(
    ctx,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - 44,
    'Та ведмідь не є злий! Він вам приніс закарпатське',
    '#ffd8a8'
  );
}

function drawHorrorPrompt(ctx, cx, cy, text, accentColor = '#d8c8b8') {
  ctx.save();
  ctx.font = '700 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  const width = Math.max(140, ctx.measureText(text).width + 20);
  const height = 22;
  const x = cx - width / 2;
  const y = cy - height / 2;

  ctx.fillStyle = 'rgba(4, 4, 5, 0.84)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}
