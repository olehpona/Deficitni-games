/**
 * Малює або завантажений асет із AssetManager, або стильну процедурну заглушку
 * з опціональним бейджем [ЗАГЛУШКА: id] для зручної заміни.
 */

export function drawAssetOrPlaceholder(ctx, assetManager, id, x, y, w, h, options = {}) {
  const {
    showTag = true,
    alpha = 1,
    fit = 'contain', // 'contain' | 'cover'
    flipX = false,
    accentColor = '#ff9838',
    eyeGlow = 1
  } = options;

  const img = assetManager ? assetManager.getImage(id) : null;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (flipX) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    x = 0;
    y = 0;
  }

  if (img) {
    drawImageFitted(ctx, img, x, y, w, h, fit);
    ctx.restore();
    return;
  }

  // Процедурна заглушка залежно від id
  drawProceduralPlaceholder(ctx, id, x, y, w, h, accentColor, eyeGlow);

  if (showTag && !id.startsWith('bg_')) {
    drawPlaceholderBadge(ctx, id, x, y, w, h);
  }

  ctx.restore();
}

function drawImageFitted(ctx, img, x, y, w, h, fit) {
  const iw = img.naturalWidth || img.width || w;
  const ih = img.naturalHeight || img.height || h;
  const scale = fit === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPlaceholderBadge(ctx, id, x, y, w, h) {
  const label = `[ЗАГЛУШКА: ${id}]`;
  ctx.save();
  ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
  const metrics = ctx.measureText(label);
  const padX = 7;
  const bw = Math.min(w - 6, metrics.width + padX * 2);
  const bh = 18;
  const bx = x + (w - bw) / 2;
  const by = y + h - bh - 4;

  ctx.fillStyle = 'rgba(10, 12, 16, 0.78)';
  ctx.strokeStyle = 'rgba(255, 168, 76, 0.55)';
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, bh, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffd09b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + bw / 2, by + bh / 2 + 0.5, bw - 8);
  ctx.restore();
}

function drawProceduralPlaceholder(ctx, id, x, y, w, h, accentColor, eyeGlow) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (id) {
    case 'bear_door_peek':
    case 'bear_window_far':
    case 'bear_window_peek': {
      drawBearSilhouette(ctx, cx, cy, Math.min(w, h), {
        menacing: id !== 'bear_window_far',
        claws: id === 'bear_window_peek',
        eyeColor: id === 'bear_window_far' ? '#ffd369' : '#ff4d2e',
        eyeGlow
      });
      break;
    }
    case 'bear_door_breach':
    case 'bear_window_climb': {
      drawBearSilhouette(ctx, cx, cy, Math.min(w, h), {
        menacing: true,
        claws: true,
        openMouth: true,
        eyeColor: '#ff2b1a',
        eyeGlow: 1.4
      });
      break;
    }
    case 'bear_chimney_peek': {
      // Темний силует з сажею та пазурами згори
      ctx.fillStyle = 'rgba(12, 10, 10, 0.92)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - h * 0.08, w * 0.34, h * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      drawGlowingEyes(ctx, cx, cy - h * 0.1, w * 0.12, '#ff5228', eyeGlow);
      // Пазурі
      ctx.strokeStyle = '#d7cbb8';
      ctx.lineWidth = 4;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * (w * 0.08), cy + h * 0.08);
        ctx.lineTo(cx + i * (w * 0.09), cy + h * 0.28);
        ctx.stroke();
      }
      break;
    }
    case 'bear_jumpscare': {
      drawBearSilhouette(ctx, cx, cy + h * 0.05, Math.min(w, h) * 1.15, {
        menacing: true,
        claws: true,
        openMouth: true,
        eyeColor: '#ff1e1e',
        eyeGlow: 2.0
      });
      break;
    }
    case 'prop_frying_pan': {
      // Ручка і чавунне коло
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.45);
      ctx.fillStyle = '#2d3138';
      ctx.strokeStyle = '#6c7380';
      ctx.lineWidth = 3;
      roundRect(ctx, -w * 0.06, h * 0.12, w * 0.12, h * 0.34, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1b1e23';
      ctx.beginPath();
      ctx.arc(0, -h * 0.08, Math.min(w, h) * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -h * 0.08, Math.min(w, h) * 0.21, -2.5, -1.2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'prop_spray': {
      ctx.save();
      ctx.fillStyle = '#c92a2a';
      ctx.strokeStyle = '#ff8787';
      ctx.lineWidth = 2;
      roundRect(ctx, cx - w * 0.16, cy - h * 0.18, w * 0.32, h * 0.5, 10);
      ctx.fill();
      ctx.stroke();
      // Ковпачок
      ctx.fillStyle = '#212529';
      roundRect(ctx, cx - w * 0.11, cy - h * 0.31, w * 0.22, h * 0.14, 4);
      ctx.fill();
      // Попереджувальна смужка
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(cx - w * 0.15, cy - h * 0.02, w * 0.3, h * 0.12);
      ctx.restore();
      break;
    }
    case 'prop_toilet': {
      ctx.save();
      // Бачок
      ctx.fillStyle = '#e9ecef';
      ctx.strokeStyle = '#adb5bd';
      ctx.lineWidth = 3;
      roundRect(ctx, cx - w * 0.22, cy - h * 0.38, w * 0.44, h * 0.3, 8);
      ctx.fill();
      ctx.stroke();
      // Кнопка зливу
      ctx.fillStyle = '#868e96';
      ctx.beginPath();
      ctx.arc(cx, cy - h * 0.32, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      // Нога
      ctx.fillStyle = '#dee2e6';
      roundRect(ctx, cx - w * 0.14, cy + h * 0.06, w * 0.28, h * 0.3, 8);
      ctx.fill();
      ctx.stroke();
      // Чаша
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.ellipse(cx, cy + h * 0.04, w * 0.27, h * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Вода всередині
      ctx.fillStyle = '#74c0fc';
      ctx.beginPath();
      ctx.ellipse(cx, cy + h * 0.05, w * 0.18, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'prop_brine': {
      ctx.save();
      // Скляна банка з огірками
      ctx.fillStyle = 'rgba(130, 201, 110, 0.45)';
      ctx.strokeStyle = '#b2f2bb';
      ctx.lineWidth = 3;
      roundRect(ctx, cx - w * 0.2, cy - h * 0.22, w * 0.4, h * 0.54, 14);
      ctx.fill();
      ctx.stroke();
      // Кришка
      ctx.fillStyle = '#e67700';
      roundRect(ctx, cx - w * 0.16, cy - h * 0.32, w * 0.32, h * 0.1, 4);
      ctx.fill();
      // Огірочки всередині
      ctx.fillStyle = '#37b24d';
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.06, cy + h * 0.05, w * 0.06, h * 0.14, -0.2, 0, Math.PI * 2);
      ctx.ellipse(cx + w * 0.07, cy + h * 0.08, w * 0.06, h * 0.13, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    default: {
      ctx.save();
      ctx.strokeStyle = accentColor;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.restore();
    }
  }
}

function drawBearSilhouette(ctx, cx, cy, size, opts) {
  const {
    menacing = false,
    claws = false,
    openMouth = false,
    eyeColor = '#ff5722',
    eyeGlow = 1
  } = opts;

  ctx.save();
  // Тіло / плечі
  ctx.fillStyle = '#18110d';
  ctx.strokeStyle = menacing ? '#4a2d1b' : '#2d1c12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.24, size * 0.36, size * 0.28, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Вуха
  ctx.beginPath();
  ctx.arc(cx - size * 0.21, cy - size * 0.22, size * 0.095, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.21, cy - size * 0.22, size * 0.095, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Голова
  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.06, size * 0.25, size * 0.23, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Морда
  ctx.fillStyle = '#2d1d14';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.02, size * 0.11, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ніс
  ctx.fillStyle = '#090706';
  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.01, size * 0.045, size * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  // Паща при прориві
  if (openMouth) {
    ctx.fillStyle = '#5c0c0c';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.075, size * 0.085, size * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8f9fa';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * size * 0.026 - 4, cy + size * 0.035);
      ctx.lineTo(cx + i * size * 0.026 + 4, cy + size * 0.035);
      ctx.lineTo(cx + i * size * 0.026, cy + size * 0.07);
      ctx.fill();
    }
  }

  // Очі що світяться
  drawGlowingEyes(ctx, cx, cy - size * 0.1, size * 0.095, eyeColor, eyeGlow);

  // Лапи / пазурі
  if (claws) {
    ctx.strokeStyle = '#dfd3c3';
    ctx.lineWidth = 4;
    for (const side of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + side * size * 0.26 + i * 7, cy + size * 0.1);
        ctx.lineTo(cx + side * size * 0.22 + i * 9, cy + size * 0.25);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function drawGlowingEyes(ctx, cx, cy, eyeSpread, color, glowStrength) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 16 * glowStrength;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - eyeSpread, cy, 5.5, 0, Math.PI * 2);
  ctx.arc(cx + eyeSpread, cy, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff5e6';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx - eyeSpread, cy, 2, 0, Math.PI * 2);
  ctx.arc(cx + eyeSpread, cy, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
