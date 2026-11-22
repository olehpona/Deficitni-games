import { AssetManager } from './assets/assetManager.js';
import { SoundEngine } from './audio/soundEngine.js';
import {
  NIGHT_CONFIGS,
  createGameState,
  stepGame,
  formatGameClock,
  setRoom,
  turnRoom,
  toggleFlashlight,
  setHoldLock,
  setToiletHold,
  triggerFryingPan,
  triggerPepperSpray,
  triggerChimneyFire,
  useBrine,
  clearHoldActions
} from './state/gameState.js';
import { renderGameScene, CANVAS_WIDTH, CANVAS_HEIGHT } from './render/renderer.js';

const assetManager = new AssetManager();
const soundEngine = new SoundEngine(assetManager);

const settings = {
  showPlaceholderTags: true,
  showAudioCues: true
};

let selectedNight = 1;
let selectedMenuIndex = 0;
let state = null;
let rafId = null;
let lastFrameTime = 0;
let activeHotspots = [];
let activeAssetTab = 'images';
let lastOutcomeShown = null;
let lastRenderedRoom = null;
let introActive = false;
let introTimer = null;
let introResolve = null;

const INTRO_SLIDES = [
  {
    src: './assets/images/intro_1_happy.webp',
    caption: 'Після пʼянки кенти десь зникли. Ти покликав ведмедів і задоволений пішов додому...',
    duration: 2900,
    sound: null
  },
  {
    src: './assets/images/intro_2_phone_off.webp',
    caption: 'У хатині тихо. На столі лежить телефон...',
    duration: 2100,
    sound: null
  },
  {
    src: './assets/images/intro_3_phone_sms.webp',
    caption: 'ДЗИНЬ! Схоже, вони тебе почули...',
    duration: 3300,
    sound: 'clock_chime'
  },
  {
    src: './assets/images/intro_4_shocked.webp',
    caption: 'ВОНИ ВЖЕ БЛИЗЬКО. Протримайся до 06:00!',
    duration: 2800,
    sound: 'bear_growl'
  }
];

// DOM-елементи
const screenMenu = document.getElementById('screen-menu');
const screenIntro = document.getElementById('screen-intro');
const screenGame = document.getElementById('screen-game');
const introImgA = document.getElementById('intro-img-a');
const introImgB = document.getElementById('intro-img-b');
const introCaptionEl = document.getElementById('intro-caption');
const introDotsEl = document.getElementById('intro-dots');
const nightButtonsEl = document.getElementById('night-buttons');
const nightSubtitleEl = document.getElementById('night-subtitle');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const hudClockVal = document.getElementById('hud-clock-value');
const hudNightTitle = document.getElementById('hud-night-title');
const hudNauseaVal = document.getElementById('hud-nausea-val');
const hudNauseaBar = document.getElementById('hud-nausea-bar');
const meterNauseaBox = document.getElementById('meter-nausea-box');
const hudBatteryVal = document.getElementById('hud-battery-val');
const hudBatteryBar = document.getElementById('hud-battery-bar');
const hudNoiseVal = document.getElementById('hud-noise-val');
const hudNoiseBar = document.getElementById('hud-noise-bar');

const audioCuesLayer = document.getElementById('audio-cues-layer');
const soberBadge = document.getElementById('sober-badge');
const soberTimerEl = document.getElementById('sober-timer');
const roomActionsEl = document.getElementById('room-actions');
const btnFlashlight = document.getElementById('btn-flashlight');
const btnBrineQuick = document.getElementById('btn-brine-quick');
const brineCountEl = document.getElementById('brine-count');
const btnMute = document.getElementById('btn-mute');

const modalEntry = document.getElementById('modal-entry');
const modalHelp = document.getElementById('modal-help');
const modalPause = document.getElementById('modal-pause');
const modalGameover = document.getElementById('modal-gameover');
const modalVictory = document.getElementById('modal-victory');
const modalAssets = document.getElementById('modal-assets');

const gameoverKillerEl = document.getElementById('gameover-killer');
const gameoverTipEl = document.getElementById('gameover-tip');
const victoryStatsEl = document.getElementById('victory-stats');
const btnNextNight = document.getElementById('btn-next-night');

const assetListContainer = document.getElementById('asset-list-container');
const countImagesEl = document.getElementById('count-images');
const countAudioEl = document.getElementById('count-audio');
const togglePlaceholderTags = document.getElementById('toggle-placeholder-tags');
const toggleAudioCues = document.getElementById('toggle-audio-cues');

async function bootstrap() {
  renderNightSelector();
  bindUIEvents();
  await assetManager.preloadManifest();
  renderAssetManager();

  // Спроба запустити музику меню (якщо браузер блокує автоплей — запуститься при першому кліку/клавіші в меню)
  const started = await soundEngine.startMenuMusic();
  if (!started) {
    const unlockMenuAudio = async (e) => {
      if (state || introActive || !screenMenu.classList.contains('active')) return;
      if (e.target && e.target.closest && e.target.closest('#btn-start-game')) return;
      const ok = await soundEngine.startMenuMusic();
      if (ok) {
        window.removeEventListener('pointerdown', unlockMenuAudio);
        window.removeEventListener('keydown', unlockMenuAudio);
      }
    };
    window.addEventListener('pointerdown', unlockMenuAudio);
    window.addEventListener('keydown', unlockMenuAudio);
  }
}

function renderNightSelector() {
  nightButtonsEl.innerHTML = '';
  for (const cfg of NIGHT_CONFIGS) {
    const btn = document.createElement('button');
    btn.className = `night-btn ${cfg.night === selectedNight ? 'active' : ''}`;
    btn.textContent = cfg.title;
    btn.addEventListener('click', () => {
      selectedNight = cfg.night;
      renderNightSelector();
    });
    nightButtonsEl.appendChild(btn);
  }
  const activeCfg = NIGHT_CONFIGS.find((n) => n.night === selectedNight) || NIGHT_CONFIGS[0];
  if (nightSubtitleEl) {
    nightSubtitleEl.textContent = activeCfg.subtitle;
  }
}

async function playIntroAndStartNight(nightNum) {
  selectedNight = nightNum;
  soundEngine.stopMenuMusic();
  await soundEngine.init();

  hideAllModals();
  screenMenu.classList.remove('active');
  screenIntro.classList.remove('fade-out');
  screenIntro.classList.add('active');
  introActive = true;

  let usingA = true;
  introImgA.classList.remove('active');
  introImgB.classList.remove('active');

  const showSlide = (idx) => {
    const slide = INTRO_SLIDES[idx];
    const targetImg = usingA ? introImgA : introImgB;
    const prevImg = usingA ? introImgB : introImgA;
    usingA = !usingA;

    targetImg.src = slide.src;
    requestAnimationFrame(() => {
      targetImg.classList.add('active');
      prevImg.classList.remove('active');
    });

    introCaptionEl.textContent = slide.caption;
    if (slide.sound) {
      soundEngine.play(slide.sound, { volume: 0.85 });
    }

    introDotsEl.innerHTML = INTRO_SLIDES.map(
      (_, i) => `<span class="intro-dot ${i <= idx ? 'active' : ''}"></span>`
    ).join('');
  };

  await new Promise((resolve) => {
    let index = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (introTimer) clearTimeout(introTimer);
      introTimer = null;
      introResolve = null;
      introActive = false;
      screenIntro.classList.add('fade-out');
      setTimeout(() => {
        screenIntro.classList.remove('active', 'fade-out');
        resolve();
      }, 550);
    };

    const advance = () => {
      if (finished) return;
      index += 1;
      if (index >= INTRO_SLIDES.length) {
        finish();
        return;
      }
      showSlide(index);
      if (introTimer) clearTimeout(introTimer);
      introTimer = setTimeout(advance, INTRO_SLIDES[index].duration);
    };

    introResolve = finish;
    showSlide(0);
    introTimer = setTimeout(advance, INTRO_SLIDES[0].duration);
  });

  await startNight(nightNum);
}

async function startNight(nightNum) {
  selectedNight = nightNum;
  soundEngine.stopMenuMusic();
  await soundEngine.init();
  await soundEngine.startAmbient();

  state = createGameState(nightNum);
  lastOutcomeShown = null;
  lastRenderedRoom = null;

  hideAllModals();
  screenMenu.classList.remove('active');
  screenIntro.classList.remove('active', 'fade-out');
  screenGame.classList.add('active');

  hudNightTitle.textContent = `Ніч ${state.night}`;
  rebuildRoomActionButtons();
  updateHUD();

  if (rafId) cancelAnimationFrame(rafId);
  lastFrameTime = performance.now();
  rafId = requestAnimationFrame(gameLoop);
}

function returnToMenu() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  soundEngine.stopAmbient();
  state = null;
  hideAllModals();
  screenGame.classList.remove('active');
  screenMenu.classList.add('active');
  renderNightSelector();
  soundEngine.startMenuMusic();
}

function gameLoop(now) {
  if (!state) return;
  const rawDt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  const dt = Math.min(rawDt, 0.1);

  if (state.phase === 'playing' || state.phase === 'jumpscare') {
    stepGame(state, dt);
  }

  // Програти чергу звукових подій
  while (state.soundEvents.length > 0) {
    const ev = state.soundEvents.shift();
    soundEngine.play(ev.id, { pan: ev.pan, volume: ev.volume });
  }

  activeHotspots = renderGameScene(ctx, state, assetManager, settings);
  updateHUD();
  checkOutcomeModals();

  rafId = requestAnimationFrame(gameLoop);
}

function checkOutcomeModals() {
  if (!state) return;
  if (state.phase === 'gameover' && lastOutcomeShown !== 'gameover') {
    lastOutcomeShown = 'gameover';
    soundEngine.stopAmbient();
    gameoverKillerEl.textContent = `Причина: ${state.deathInfo?.killer || 'Ведмідь у хаті'}`;
    gameoverTipEl.textContent = `💡 Порада: ${state.deathInfo?.tip || ''}`;
    modalGameover.classList.remove('hidden');
  } else if (state.phase === 'victory' && lastOutcomeShown !== 'victory') {
    lastOutcomeShown = 'victory';
    soundEngine.stopAmbient();
    const hasNext = state.night < NIGHT_CONFIGS.length;
    btnNextNight.classList.toggle('hidden', !hasNext);

    victoryStatsEl.innerHTML = `
      <div class="stat-card"><strong>${state.stats.repels}</strong><span>Відбитих атак</span></div>
      <div class="stat-card"><strong>${state.stats.callsTriggered}</strong><span>Випадкових «кличів»</span></div>
      <div class="stat-card"><strong>${state.stats.brineUsed}</strong><span>Випито розсолу</span></div>
    `;
    modalVictory.classList.remove('hidden');
  }
}

function updateHUD() {
  if (!state) return;

  hudClockVal.textContent = formatGameClock(state);

  const nauseaPct = Math.round(state.nausea);
  hudNauseaVal.textContent = `${nauseaPct}%`;
  hudNauseaBar.style.width = `${nauseaPct}%`;
  meterNauseaBox.classList.toggle('danger-pulse', nauseaPct >= 75);

  const batPct = Math.round(state.flashlightBattery);
  hudBatteryVal.textContent = `${batPct}%`;
  hudBatteryBar.style.width = `${batPct}%`;

  const noisePct = Math.round(state.noise * 100);
  hudNoiseBar.style.width = `${noisePct}%`;
  hudNoiseVal.textContent = noisePct > 60 ? 'ГУЧНО!' : noisePct > 22 ? 'Помірно' : 'Тихо';

  if (state.soberBoostTimer > 0) {
    soberBadge.classList.remove('hidden');
    soberTimerEl.textContent = Math.ceil(state.soberBoostTimer);
  } else {
    soberBadge.classList.add('hidden');
  }

  btnFlashlight.classList.toggle('on', state.flashlightOn);
  btnFlashlight.textContent = state.flashlightOn ? '[F] Ліхтарик: УВІМК' : '[F] Ліхтарик: ВИМК';

  brineCountEl.textContent = String(state.brineJars);
  btnBrineQuick.disabled = state.brineJars <= 0 || state.phase !== 'playing';

  // Підсвітка кнопок кімнат при активній небезпеці
  document.querySelectorAll('.room-btn').forEach((btn) => {
    const room = btn.dataset.room;
    btn.classList.toggle('active', room === state.currentRoom);
    const hasAlert =
      (room === 'door' && state.bears.door.stage >= 2) ||
      (room === 'windows' &&
        (state.bears.leftWindow.stage >= 2 || state.bears.rightWindow.stage >= 2)) ||
      (room === 'chimney' && state.bears.chimney.stage >= 2) ||
      (room === 'bathroom' && state.nausea >= 78);
    btn.classList.toggle('alert', hasAlert);
  });

  if (lastRenderedRoom !== state.currentRoom) {
    lastRenderedRoom = state.currentRoom;
    rebuildRoomActionButtons();
  } else {
    refreshRoomActionButtonStates();
  }

  renderAudioCues();
}

function rebuildRoomActionButtons() {
  if (!state) return;
  roomActionsEl.innerHTML = '';

  if (state.currentRoom === 'door') {
    const holdBtn = document.createElement('button');
    holdBtn.id = 'act-hold-lock';
    holdBtn.className = 'btn btn-action btn-secondary';
    holdBtn.textContent = '[Space] Тримати засув';
    bindHoldButton(holdBtn, (holding) => setHoldLock(state, holding));
    roomActionsEl.appendChild(holdBtn);
  } else if (state.currentRoom === 'windows') {
    const panBtn = document.createElement('button');
    panBtn.id = 'act-pan';
    panBtn.className = 'btn btn-action btn-secondary';
    panBtn.textContent = '[Q] Сковорідка (Ліво)';
    panBtn.addEventListener('click', () => triggerFryingPan(state));

    const sprayBtn = document.createElement('button');
    sprayBtn.id = 'act-spray';
    sprayBtn.className = 'btn btn-action btn-secondary';
    sprayBtn.textContent = '[E] Балончик (Право)';
    sprayBtn.addEventListener('click', () => triggerPepperSpray(state));

    roomActionsEl.append(panBtn, sprayBtn);
  } else if (state.currentRoom === 'chimney') {
    const fireBtn = document.createElement('button');
    fireBtn.id = 'act-fire';
    fireBtn.className = 'btn btn-action btn-secondary';
    fireBtn.textContent = '[Space] Розпалити дим';
    fireBtn.addEventListener('click', () => triggerChimneyFire(state));
    roomActionsEl.appendChild(fireBtn);
  } else if (state.currentRoom === 'bathroom') {
    const quietBtn = document.createElement('button');
    quietBtn.id = 'act-toilet-quiet';
    quietBtn.className = 'btn btn-action btn-success';
    quietBtn.textContent = '[Space] Тихо (-17%/с)';
    bindHoldButton(quietBtn, (holding) => setToiletHold(state, 'quiet', holding));

    const loudBtn = document.createElement('button');
    loudBtn.id = 'act-toilet-loud';
    loudBtn.className = 'btn btn-action btn-danger';
    loudBtn.textContent = 'Швидко — Гучно! (-38%/с)';
    bindHoldButton(loudBtn, (holding) => setToiletHold(state, 'loud', holding));

    roomActionsEl.append(quietBtn, loudBtn);
  }

  refreshRoomActionButtonStates();
}

function refreshRoomActionButtonStates() {
  if (!state) return;

  const holdBtn = document.getElementById('act-hold-lock');
  if (holdBtn) {
    holdBtn.classList.toggle('btn-holding', state.isHoldingLock);
    holdBtn.textContent = state.isHoldingLock
      ? `Тримаємо засув (${Math.round(state.lockIntegrity)}%)`
      : `[Space] Тримати засув (${Math.round(state.lockIntegrity)}%)`;
  }

  const panBtn = document.getElementById('act-pan');
  if (panBtn) {
    panBtn.disabled = state.panCooldown > 0;
    panBtn.textContent =
      state.panCooldown > 0
        ? `[Q] Сковорідка (${state.panCooldown.toFixed(1)}с)`
        : '[Q] Сковорідка (Ліво)';
  }

  const sprayBtn = document.getElementById('act-spray');
  if (sprayBtn) {
    sprayBtn.disabled = state.sprayCooldown > 0;
    sprayBtn.textContent =
      state.sprayCooldown > 0
        ? `[E] Балончик (${state.sprayCooldown.toFixed(1)}с)`
        : '[E] Балончик (Право)';
  }

  const fireBtn = document.getElementById('act-fire');
  if (fireBtn) {
    fireBtn.disabled = state.fireCooldown > 0;
    if (state.fireActiveTimer > 0) {
      fireBtn.textContent = `🔥 Димить (${state.fireActiveTimer.toFixed(1)}с)`;
    } else if (state.fireCooldown > 0) {
      fireBtn.textContent = `Охолодження (${state.fireCooldown.toFixed(1)}с)`;
    } else {
      fireBtn.textContent = '[Space] Розпалити дим';
    }
  }

  const quietBtn = document.getElementById('act-toilet-quiet');
  if (quietBtn) {
    quietBtn.classList.toggle('btn-holding', state.isToiletQuiet);
  }
  const loudBtn = document.getElementById('act-toilet-loud');
  if (loudBtn) {
    loudBtn.classList.toggle('btn-holding-loud', state.isToiletLoud);
  }
}

function renderAudioCues() {
  if (!state || !settings.showAudioCues) {
    audioCuesLayer.innerHTML = '';
    return;
  }

  audioCuesLayer.innerHTML = '';
  for (const cue of state.audioCues) {
    const badge = document.createElement('button');
    badge.className = `cue-badge ${cue.urgent ? 'urgent' : ''}`;
    const dir = cue.pan < -0.25 ? '⬅ Зліва' : cue.pan > 0.25 ? 'Праворуч ➡' : '● Попереду';
    badge.innerHTML = `<span class="cue-dir">${dir}</span><span>${cue.text}</span>`;
    badge.addEventListener('click', () => {
      if (state && state.phase === 'playing') {
        setRoom(state, cue.room);
      }
    });
    audioCuesLayer.appendChild(badge);
  }
}

function bindHoldButton(btn, onHoldChange) {
  const start = (e) => {
    e.preventDefault();
    onHoldChange(true);
  };
  const stop = () => onHoldChange(false);

  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('pointerleave', stop);
}

function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  return { x, y };
}

function findHotspotAt(x, y) {
  for (let i = activeHotspots.length - 1; i >= 0; i--) {
    const hs = activeHotspots[i];
    if (x >= hs.x && x <= hs.x + hs.w && y >= hs.y && y <= hs.y + hs.h) {
      return hs;
    }
  }
  return null;
}

function togglePause() {
  if (!state) return;
  if (state.phase === 'playing') {
    clearHoldActions(state);
    state.phase = 'paused';
    modalPause.classList.remove('hidden');
  } else if (state.phase === 'paused') {
    modalPause.classList.add('hidden');
    state.phase = 'playing';
    lastFrameTime = performance.now();
  }
}

function hideAllModals() {
  modalHelp.classList.add('hidden');
  modalPause.classList.add('hidden');
  modalGameover.classList.add('hidden');
  modalVictory.classList.add('hidden');
  modalAssets.classList.add('hidden');
}

function bindUIEvents() {
  const enterMenuWithSound = async () => {
    modalEntry.classList.add('hidden');
    await soundEngine.init();
    await soundEngine.startMenuMusic();
  };

  document.getElementById('btn-enter-game').addEventListener('click', enterMenuWithSound);

  document.getElementById('btn-start-game').addEventListener('click', () => {
    playIntroAndStartNight(selectedNight);
  });

  document.getElementById('btn-skip-intro').addEventListener('click', () => {
    if (introActive && introResolve) introResolve();
  });

  document.getElementById('btn-how-to-play').addEventListener('click', () => {
    modalHelp.classList.remove('hidden');
  });

  document.getElementById('btn-open-assets-menu').addEventListener('click', () => {
    openAssetModal();
  });
  document.getElementById('btn-open-assets-game').addEventListener('click', () => {
    if (state && state.phase === 'playing') togglePause();
    openAssetModal();
  });
  document.getElementById('btn-open-assets-pause').addEventListener('click', () => {
    openAssetModal();
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.closeModal).classList.add('hidden');
    });
  });

  btnMute.addEventListener('click', () => {
    soundEngine.setMuted(!soundEngine.muted);
    btnMute.textContent = soundEngine.muted ? '🔇' : '🔊';
  });

  document.getElementById('btn-pause').addEventListener('click', togglePause);
  document.getElementById('btn-resume').addEventListener('click', togglePause);
  document.getElementById('btn-pause-menu').addEventListener('click', returnToMenu);

  document.getElementById('btn-retry-night').addEventListener('click', () => {
    startNight(selectedNight);
  });
  document.getElementById('btn-gameover-menu').addEventListener('click', returnToMenu);
  document.getElementById('btn-next-night').addEventListener('click', () => {
    const next = Math.min(NIGHT_CONFIGS.length, selectedNight + 1);
    startNight(next);
  });
  document.getElementById('btn-victory-menu').addEventListener('click', returnToMenu);

  document.getElementById('btn-turn-left').addEventListener('click', () => {
    if (state) turnRoom(state, -1);
  });
  document.getElementById('btn-turn-right').addEventListener('click', () => {
    if (state) turnRoom(state, 1);
  });

  document.querySelectorAll('.room-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state) setRoom(state, btn.dataset.room);
    });
  });

  btnFlashlight.addEventListener('click', () => {
    if (state) toggleFlashlight(state);
  });

  btnBrineQuick.addEventListener('click', () => {
    if (state) useBrine(state);
  });

  // Сцена Canvas: наведення ліхтарика та кліки/утримання по хітбоксах
  canvas.addEventListener('pointermove', (e) => {
    if (!state) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    state.aimX = Math.max(0, Math.min(1, x / CANVAS_WIDTH));
    state.aimY = Math.max(0, Math.min(1, y / CANVAS_HEIGHT));
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (!state || state.phase !== 'playing') return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    state.aimX = Math.max(0, Math.min(1, x / CANVAS_WIDTH));
    state.aimY = Math.max(0, Math.min(1, y / CANVAS_HEIGHT));

    const hs = findHotspotAt(x, y);
    if (!hs) return;

    if (hs.action === 'holdLock') setHoldLock(state, true);
    else if (hs.action === 'toiletQuiet') setToiletHold(state, 'quiet', true);
    else if (hs.action === 'toiletLoud') setToiletHold(state, 'loud', true);
    else if (hs.action === 'pan') triggerFryingPan(state);
    else if (hs.action === 'spray') triggerPepperSpray(state);
    else if (hs.action === 'fire') triggerChimneyFire(state);
    else if (hs.action === 'brine') useBrine(state);
  });

  const releaseAllHolds = () => {
    if (state) clearHoldActions(state);
  };
  window.addEventListener('pointerup', releaseAllHolds);
  window.addEventListener('pointercancel', releaseAllHolds);
  window.addEventListener('blur', releaseAllHolds);

  // Ініціалізація вибору пункту головного меню
  const menuButtons = Array.from(document.querySelectorAll('.fnaf-menu-btn'));
  const syncMenuSelection = (playTick = false) => {
    menuButtons.forEach((btn, idx) => {
      btn.classList.toggle('selected', idx === selectedMenuIndex);
    });
    if (playTick) {
      soundEngine.play('flashlight_click', { volume: 0.45 });
    }
  };
  menuButtons.forEach((btn, idx) => {
    btn.addEventListener('mouseenter', () => {
      if (selectedMenuIndex !== idx) {
        selectedMenuIndex = idx;
        syncMenuSelection(false);
      }
    });
  });
  syncMenuSelection(false);

  // Клавіатура
  window.addEventListener('keydown', (e) => {
    if (!modalEntry.classList.contains('hidden')) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        enterMenuWithSound();
      }
      return;
    }

    if (introActive) {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        if (introResolve) introResolve();
      }
      return;
    }

    // Навігація в головному меню стрілочками
    if (!state) {
      const anyModalOpen =
        !modalHelp.classList.contains('hidden') || !modalAssets.classList.contains('hidden');

      if (e.code === 'Escape' && anyModalOpen) {
        hideAllModals();
        return;
      }
      if (anyModalOpen) return;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        selectedMenuIndex = (selectedMenuIndex - 1 + menuButtons.length) % menuButtons.length;
        syncMenuSelection(true);
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        selectedMenuIndex = (selectedMenuIndex + 1) % menuButtons.length;
        syncMenuSelection(true);
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        selectedNight = selectedNight <= 1 ? NIGHT_CONFIGS.length : selectedNight - 1;
        renderNightSelector();
        soundEngine.play('flashlight_click', { volume: 0.45 });
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        selectedNight = selectedNight >= NIGHT_CONFIGS.length ? 1 : selectedNight + 1;
        renderNightSelector();
        soundEngine.play('flashlight_click', { volume: 0.45 });
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        menuButtons[selectedMenuIndex]?.click();
      }
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (!modalAssets.classList.contains('hidden')) {
        modalAssets.classList.add('hidden');
        return;
      }
      if (state.phase === 'playing' || state.phase === 'paused') {
        togglePause();
      }
      return;
    }

    if (state.phase !== 'playing') return;

    if (e.code === 'Digit1') setRoom(state, 'door');
    else if (e.code === 'Digit2') setRoom(state, 'windows');
    else if (e.code === 'Digit3') setRoom(state, 'chimney');
    else if (e.code === 'Digit4') setRoom(state, 'bathroom');
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') turnRoom(state, -1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') turnRoom(state, 1);
    else if (e.code === 'KeyF' && !e.repeat) toggleFlashlight(state);
    else if (e.code === 'KeyQ' && !e.repeat) triggerFryingPan(state);
    else if (e.code === 'KeyE' && !e.repeat) triggerPepperSpray(state);
    else if (e.code === 'KeyR' && !e.repeat) useBrine(state);
    else if (e.code === 'Space') {
      e.preventDefault();
      if (state.currentRoom === 'door') setHoldLock(state, true);
      else if (state.currentRoom === 'bathroom') setToiletHold(state, 'quiet', true);
      else if (state.currentRoom === 'chimney' && !e.repeat) triggerChimneyFire(state);
      else if (state.currentRoom === 'windows' && !e.repeat) {
        if (state.aimX < 0.5) triggerFryingPan(state);
        else triggerPepperSpray(state);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (!state) return;
    if (e.code === 'Space') {
      clearHoldActions(state);
    }
  });

  // Менеджер асетів і налаштування
  togglePlaceholderTags.addEventListener('change', (e) => {
    settings.showPlaceholderTags = e.target.checked;
  });
  toggleAudioCues.addEventListener('change', (e) => {
    settings.showAudioCues = e.target.checked;
  });

  document.querySelectorAll('.asset-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeAssetTab = tab.dataset.tab;
      document.querySelectorAll('.asset-tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === activeAssetTab);
      });
      renderAssetManager();
    });
  });
}

function openAssetModal() {
  renderAssetManager();
  modalAssets.classList.remove('hidden');
}

function renderAssetManager() {
  const { images, audio } = assetManager.getStatusList();
  countImagesEl.textContent = String(images.length);
  countAudioEl.textContent = String(audio.length);

  const list = activeAssetTab === 'images' ? images : audio;
  assetListContainer.innerHTML = '';

  for (const item of list) {
    const row = document.createElement('div');
    row.className = 'asset-row';

    const info = document.createElement('div');
    info.className = 'asset-info';
    info.innerHTML = `
      <div class="asset-title-line">
        <strong>${item.name}</strong>
        <code>${item.id}</code>
        <span class="asset-status ${item.loaded ? 'loaded' : ''}">${item.statusLabel}</span>
      </div>
      <div class="asset-meta">
        ${item.description}<br />
        Шлях: <code>${item.expectedPath}</code>${item.recommendedSize ? ` · Розмір: <strong>${item.recommendedSize}</strong>` : ''}
        ${item.error ? `<br /><span style="color:#ff8787">${item.error}</span>` : ''}
      </div>
    `;

    const controls = document.createElement('div');
    controls.className = 'asset-controls';

    if (item.type === 'audio') {
      const playBtn = document.createElement('button');
      playBtn.className = 'btn btn-icon';
      playBtn.title = 'Прослухати звук';
      playBtn.textContent = '▶';
      playBtn.addEventListener('click', async () => {
        await soundEngine.play(item.id, { volume: 0.9 });
      });
      controls.appendChild(playBtn);
    }

    const uploadLabel = document.createElement('label');
    uploadLabel.className = 'upload-label';
    uploadLabel.textContent = 'Завантажити';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = item.type === 'images' || item.type === 'image' ? 'image/*' : 'audio/*';
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (item.type === 'image') {
        await assetManager.setCustomImageFile(item.id, file);
      } else {
        await soundEngine.init();
        await assetManager.setCustomAudioFile(item.id, file, soundEngine.getContext());
        if (item.id === 'ambient_forest' && soundEngine.ambientActive) {
          await soundEngine.restartAmbient();
        }
      }
      renderAssetManager();
    });
    uploadLabel.appendChild(fileInput);
    controls.appendChild(uploadLabel);

    if (item.loaded) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-outline';
      resetBtn.style.padding = '5px 9px';
      resetBtn.style.fontSize = '12px';
      resetBtn.textContent = 'Скинути';
      resetBtn.addEventListener('click', async () => {
        if (item.type === 'image') {
          await assetManager.resetImage(item.id);
        } else {
          await assetManager.resetAudio(item.id, soundEngine.getContext());
          if (item.id === 'ambient_forest' && soundEngine.ambientActive) {
            await soundEngine.restartAmbient();
          }
        }
        renderAssetManager();
      });
      controls.appendChild(resetBtn);
    }

    row.append(info, controls);
    assetListContainer.appendChild(row);
  }
}

bootstrap();
