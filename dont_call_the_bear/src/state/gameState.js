/**
 * Чиста логіка симуляції гри "Don't Call the Bears" (без DOM-залежностей).
 */

export const ROOMS = ['door', 'windows', 'chimney', 'bathroom'];

export const ROOM_LABELS = {
  door: 'Вхідні двері',
  windows: 'Вітальня (вікна)',
  chimney: 'Камін',
  bathroom: 'Керамічний друг'
};

export const NIGHT_CONFIGS = [
  {
    night: 1,
    title: 'Ніч 1: Легкий перегар',
    subtitle: 'Ти ледь тримаєшся на ногах, а під вікнами вже хтось шарудить.',
    duration: 180, // 30 сек / год
    nauseaRate: 1.6,
    aggression: 0.85,
    chimneyStartHour: 1.0,
    doorTickBase: 14,
    leftTickBase: 13,
    rightTickBase: 14,
    chimneyTickBase: 17,
    breachGrace: {
      door: 3.5,
      leftWindow: 4.5,
      rightWindow: 4.5,
      chimney: 5.0
    }
  },
  {
    night: 2,
    title: 'Ніч 2: Ведмежий рейв',
    subtitle: 'Ведмеді рознюхали шашлики й перегар. Тримай засув і камін!',
    duration: 210, // 35 сек / год
    nauseaRate: 2.0,
    aggression: 1.15,
    chimneyStartHour: 0.5,
    doorTickBase: 11.5,
    leftTickBase: 11,
    rightTickBase: 11.5,
    chimneyTickBase: 14,
    breachGrace: {
      door: 3.5,
      leftWindow: 4.0,
      rightWindow: 4.0,
      chimney: 4.5
    }
  },
  {
    night: 3,
    title: 'Ніч 3: Повний шатун',
    subtitle: 'Усі ведмеді лісу зібралися на твій клич. Протримайся до 06:00!',
    duration: 240, // 40 сек / год
    nauseaRate: 2.4,
    aggression: 1.45,
    chimneyStartHour: 0,
    doorTickBase: 9.5,
    leftTickBase: 9.0,
    rightTickBase: 9.5,
    chimneyTickBase: 11.5,
    breachGrace: {
      door: 3.2,
      leftWindow: 3.6,
      rightWindow: 3.6,
      chimney: 4.0
    }
  }
];

export const DEATH_TIPS = {
  door: {
    killer: 'Ведмідь-вибивайло з ґанку',
    tip: 'Коли чуєш смикання ручки — біжи до Вхідних дверей [1] і ЗАТИСНИ «Тримати засув», поки він не відступить.'
  },
  leftWindow: {
    killer: 'Лісовий ведмідь з лівого вікна',
    tip: 'Світи ліхтариком [F] на ліве вікно, коли він підглядає. Якщо вже лізе всередину — бий чавунною СКОВОРІДКОЮ!'
  },
  rightWindow: {
    killer: 'Нахабний ведмідь з правого вікна',
    tip: 'Праве вікно не боїться світла так сильно — пшикай ПЕРЦЕВИМ БАЛОНЧИКОМ, коли він біля шибки або лізе в хату.'
  },
  chimney: {
    killer: 'Сажотрус з димаря',
    tip: 'Чуєш шурхіт і бачиш сажу в каміні [3] — вмикай «Розпалити дим», поки лапи не спустилися вниз!'
  }
};

export function createBearEntity(tickBase) {
  return {
    stage: 0, // 0 = далеко/немає, 1 = підходить, 2 = біля входу, 3 = прорив
    progressTimer: 0,
    nextAdvanceAt: tickBase,
    breachTimer: 0,
    flashlightBurn: 0,
    soundRepeatTimer: 0
  };
}

export function createGameState(nightIndex = 1, rng = Math.random) {
  const config = NIGHT_CONFIGS.find((n) => n.night === nightIndex) || NIGHT_CONFIGS[0];

  return {
    phase: 'playing', // 'playing' | 'paused' | 'jumpscare' | 'gameover' | 'victory'
    night: config.night,
    nightConfig: config,
    rng,

    timeSeconds: 0,
    lastHourAnnounced: 0,
    currentRoom: 'windows',
    roomTransition: 0,

    // Гравець і стан сп'яніння
    nausea: 18,
    noise: 0, // 0..1
    brineJars: 3,
    soberBoostTimer: 0,
    wobbleStunTimer: 0,
    drunkPhase: 0,
    heartbeatTimer: 0,

    // Ліхтарик
    flashlightOn: false,
    flashlightBattery: 100,
    aimX: 0.5, // 0..1 по ширині екрана
    aimY: 0.5,

    // Двері та замок
    lockIntegrity: 100,
    isHoldingLock: false,
    lockPushProgress: 0, // 0..1 (~1.6с утримання)

    // Вбиральня
    isToiletQuiet: false,
    isToiletLoud: false,
    toiletSoundTimer: 0,

    // КД та анімаційні таймери інструментів
    panCooldown: 0,
    panSwingTimer: 0,
    sprayCooldown: 0,
    sprayEffectTimer: 0,
    fireActiveTimer: 0,
    fireCooldown: 0,
    brineEffectTimer: 0,

    // Ведмеді
    bears: {
      door: createBearEntity(config.doorTickBase),
      leftWindow: createBearEntity(config.leftTickBase),
      rightWindow: createBearEntity(config.rightTickBase),
      chimney: createBearEntity(config.chimneyTickBase)
    },

    // Ефекти камери та фідбек
    screenShake: 0,
    jumpscareSource: null,
    jumpscareTimer: 0,
    deathInfo: null,

    // Статистика ночі
    stats: {
      repels: 0,
      callsTriggered: 0,
      brineUsed: 0,
      quietRelieves: 0
    },

    // Черги подій для звуків та візуальних підказок
    soundEvents: [],
    audioCues: [],
    cueSeq: 1
  };
}

export function getCurrentHour(state) {
  const ratio = Math.min(1, Math.max(0, state.timeSeconds / state.nightConfig.duration));
  return ratio * 6; // 0..6
}

export function formatGameClock(state) {
  const totalGameMinutes = Math.floor(getCurrentHour(state) * 60);
  const clamped = Math.min(360, Math.max(0, totalGameMinutes));
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function queueSound(state, id, { pan = 0, volume = 1 } = {}) {
  state.soundEvents.push({ id, pan, volume });
}

export function pushAudioCue(state, text, room, pan = 0, urgent = false, ttl = 2.8) {
  state.audioCues.push({
    id: state.cueSeq++,
    text,
    room,
    pan,
    urgent,
    ttl,
    maxTtl: ttl
  });
  if (state.audioCues.length > 5) {
    state.audioCues.shift();
  }
}

export function clearHoldActions(state) {
  state.isHoldingLock = false;
  state.isToiletQuiet = false;
  state.isToiletLoud = false;
}

export function setRoom(state, room) {
  if (!ROOMS.includes(room) || state.phase !== 'playing') return false;
  if (state.currentRoom === room) return false;
  clearHoldActions(state);
  state.currentRoom = room;
  state.roomTransition = 1;
  return true;
}

export function turnRoom(state, delta) {
  const idx = ROOMS.indexOf(state.currentRoom);
  const nextIdx = (idx + delta + ROOMS.length) % ROOMS.length;
  return setRoom(state, ROOMS[nextIdx]);
}

export function toggleFlashlight(state, forceValue = null) {
  if (state.phase !== 'playing') return false;
  const next = forceValue === null ? !state.flashlightOn : Boolean(forceValue);
  if (next && state.flashlightBattery <= 2) {
    state.flashlightOn = false;
    return false;
  }
  if (next !== state.flashlightOn) {
    state.flashlightOn = next;
    queueSound(state, 'flashlight_click', { volume: 0.75 });
  }
  return state.flashlightOn;
}

export function setHoldLock(state, holding) {
  if (state.phase !== 'playing' || state.currentRoom !== 'door') {
    state.isHoldingLock = false;
    return;
  }
  if (holding && !state.isHoldingLock) {
    queueSound(state, 'door_lock', { volume: 0.65 });
  }
  state.isHoldingLock = Boolean(holding);
}

export function setToiletHold(state, mode, holding) {
  if (state.phase !== 'playing' || state.currentRoom !== 'bathroom') {
    state.isToiletQuiet = false;
    state.isToiletLoud = false;
    return;
  }
  if (mode === 'quiet') {
    state.isToiletQuiet = Boolean(holding);
    if (holding) {
      state.isToiletLoud = false;
      state.toiletSoundTimer = 0;
    }
  } else if (mode === 'loud') {
    state.isToiletLoud = Boolean(holding);
    if (holding) {
      state.isToiletQuiet = false;
      state.toiletSoundTimer = 0;
    }
  }
}

export function triggerFryingPan(state) {
  if (state.phase !== 'playing' || state.currentRoom !== 'windows') return false;
  if (state.panCooldown > 0) return false;

  state.panCooldown = 1.2;
  state.panSwingTimer = 0.35;
  state.screenShake = Math.max(state.screenShake, 0.35);
  queueSound(state, 'pan_bonk', { pan: -0.65, volume: 1.0 });

  const bear = state.bears.leftWindow;
  if (bear.stage >= 2) {
    resetBear(bear, state.nightConfig.leftTickBase, state.rng, 1.15);
    state.stats.repels += 1;
    pushAudioCue(state, 'BONK! Лівого ведмедя оглушено!', 'windows', -0.75, false, 2.2);
    return true;
  }
  pushAudioCue(state, 'Змах сковорідкою (вхолосту)', 'windows', -0.65, false, 1.4);
  return false;
}

export function triggerPepperSpray(state) {
  if (state.phase !== 'playing' || state.currentRoom !== 'windows') return false;
  if (state.sprayCooldown > 0) return false;

  state.sprayCooldown = 1.8;
  state.sprayEffectTimer = 0.55;
  queueSound(state, 'spray_hiss', { pan: 0.65, volume: 0.95 });

  const bear = state.bears.rightWindow;
  if (bear.stage >= 2) {
    resetBear(bear, state.nightConfig.rightTickBase, state.rng, 1.1);
    state.stats.repels += 1;
    pushAudioCue(state, 'ПШИК! Правий ведмідь відступив!', 'windows', 0.75, false, 2.2);
    return true;
  }
  pushAudioCue(state, 'Пшик у праве вікно', 'windows', 0.65, false, 1.4);
  return false;
}

export function triggerChimneyFire(state) {
  if (state.phase !== 'playing' || state.currentRoom !== 'chimney') return false;
  if (state.fireCooldown > 0) return false;

  state.fireActiveTimer = 4.0;
  state.fireCooldown = 8.0;
  queueSound(state, 'fire_whoosh', { pan: 0.25, volume: 0.95 });

  const bear = state.bears.chimney;
  if (bear.stage >= 2) {
    resetBear(bear, state.nightConfig.chimneyTickBase, state.rng, 1.2);
    state.stats.repels += 1;
    pushAudioCue(state, 'ДИМ! Ведмідь вилетів із димаря!', 'chimney', 0.25, false, 2.4);
    return true;
  }
  pushAudioCue(state, 'Камін димить (димар захищено 4с)', 'chimney', 0.25, false, 2.0);
  return true;
}

export function useBrine(state) {
  if (state.phase !== 'playing') return false;
  if (state.brineJars <= 0) return false;

  state.brineJars -= 1;
  state.nausea = Math.max(0, state.nausea - 35);
  state.soberBoostTimer = 15.0;
  state.brineEffectTimer = 0.8;
  state.stats.brineUsed += 1;
  queueSound(state, 'brine_gulp', { pan: 0, volume: 0.95 });
  pushAudioCue(state, 'Огірковий розсіл! -35% нудоти', state.currentRoom, 0, false, 2.2);
  return true;
}

function resetBear(bear, baseTick, rng, delayMultiplier = 1.0) {
  const jitter = 0.85 + rng() * 0.35;
  bear.stage = 0;
  bear.progressTimer = 0;
  bear.nextAdvanceAt = baseTick * jitter * delayMultiplier;
  bear.breachTimer = 0;
  bear.flashlightBurn = 0;
  bear.soundRepeatTimer = 0;
}

function triggerJumpscare(state, source) {
  clearHoldActions(state);
  state.flashlightOn = false;
  state.phase = 'jumpscare';
  state.jumpscareSource = source;
  state.jumpscareTimer = 1.35;
  state.screenShake = 1.0;
  state.deathInfo = DEATH_TIPS[source] || DEATH_TIPS.door;
  queueSound(state, 'jumpscare', { pan: 0, volume: 1.0 });
}

function triggerBearCall(state, reasonText) {
  state.nausea = 55;
  state.wobbleStunTimer = 2.2;
  state.noise = 1.0;
  state.screenShake = Math.max(state.screenShake, 0.8);
  state.stats.callsTriggered += 1;
  clearHoldActions(state);

  queueSound(state, 'toilet_loud', { pan: 0, volume: 1.0 });
  queueSound(state, 'bear_growl', { pan: -0.5, volume: 0.8 });
  pushAudioCue(state, reasonText, 'bathroom', 0, true, 3.5);

  // Усі ведмеді прокидаються та підходять ближче
  const keys = ['door', 'leftWindow', 'rightWindow', 'chimney'];
  for (const key of keys) {
    const bear = state.bears[key];
    if (bear.stage < 2) {
      bear.stage += 1;
      bear.progressTimer = bear.nextAdvanceAt * 0.55;
    } else {
      bear.progressTimer += bear.nextAdvanceAt * 0.4;
    }
  }
}

export function stepGame(state, rawDt) {
  const dt = Math.min(Math.max(rawDt, 0), 0.1);
  if (dt <= 0) return;

  // Оновити візуальні підказки
  for (let i = state.audioCues.length - 1; i >= 0; i--) {
    state.audioCues[i].ttl -= dt;
    if (state.audioCues[i].ttl <= 0) {
      state.audioCues.splice(i, 1);
    }
  }

  state.screenShake = Math.max(0, state.screenShake - dt * 1.9);
  state.roomTransition = Math.max(0, state.roomTransition - dt * 5.0);

  if (state.phase === 'jumpscare') {
    state.jumpscareTimer -= dt;
    if (state.jumpscareTimer <= 0) {
      state.phase = 'gameover';
    }
    return;
  }

  if (state.phase !== 'playing') return;

  // Час ночі
  state.timeSeconds += dt;
  const hourFloat = getCurrentHour(state);
  const wholeHour = Math.floor(hourFloat);
  if (wholeHour > state.lastHourAnnounced && wholeHour < 6) {
    state.lastHourAnnounced = wholeHour;
    queueSound(state, 'clock_chime', { pan: 0, volume: 0.65 });
    pushAudioCue(state, `На годиннику 0${wholeHour}:00`, state.currentRoom, 0, false, 2.5);
  }

  if (state.timeSeconds >= state.nightConfig.duration) {
    state.timeSeconds = state.nightConfig.duration;
    clearHoldActions(state);
    state.flashlightOn = false;
    state.phase = 'victory';
    queueSound(state, 'clock_chime', { pan: 0, volume: 1.0 });
    return;
  }

  // Таймери інструментів
  state.panCooldown = Math.max(0, state.panCooldown - dt);
  state.panSwingTimer = Math.max(0, state.panSwingTimer - dt);
  state.sprayCooldown = Math.max(0, state.sprayCooldown - dt);
  state.sprayEffectTimer = Math.max(0, state.sprayEffectTimer - dt);
  state.fireActiveTimer = Math.max(0, state.fireActiveTimer - dt);
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  state.brineEffectTimer = Math.max(0, state.brineEffectTimer - dt);
  state.soberBoostTimer = Math.max(0, state.soberBoostTimer - dt);
  state.wobbleStunTimer = Math.max(0, state.wobbleStunTimer - dt);

  // Ліхтарик
  if (state.flashlightOn) {
    state.flashlightBattery = Math.max(0, state.flashlightBattery - 10 * dt);
    if (state.flashlightBattery <= 0) {
      state.flashlightOn = false;
      queueSound(state, 'flashlight_click', { volume: 0.6 });
    }
  } else {
    state.flashlightBattery = Math.min(100, state.flashlightBattery + 16 * dt);
  }

  // Шум затухає, якщо не кричимо в унітаз
  let targetNoise = 0.05;
  if (state.currentRoom === 'bathroom' && state.isToiletQuiet) {
    targetNoise = 0.14;
  } else if (state.currentRoom === 'bathroom' && state.isToiletLoud) {
    targetNoise = 1.0;
  }
  state.noise += (targetNoise - state.noise) * Math.min(1, dt * 6);

  // Нудота і Керамічний друг
  const nauseaGrowthScale = state.soberBoostTimer > 0 ? 0.6 : 1.0;
  const isRelieving =
    state.currentRoom === 'bathroom' && (state.isToiletQuiet || state.isToiletLoud);

  if (isRelieving) {
    const drainRate = state.isToiletLoud ? 38 : 17;
    state.nausea = Math.max(0, state.nausea - drainRate * dt);
    state.toiletSoundTimer -= dt;
    if (state.toiletSoundTimer <= 0) {
      if (state.isToiletLoud) {
        queueSound(state, 'toilet_loud', { pan: 0, volume: 0.85 });
        pushAudioCue(state, 'ГУЧНО! Ведмеді це чують!', 'bathroom', 0, true, 1.3);
        state.toiletSoundTimer = 0.85;
      } else {
        queueSound(state, 'toilet_quiet', { pan: 0, volume: 0.6 });
        state.toiletSoundTimer = 0.95;
        if (state.nausea <= 1) {
          state.stats.quietRelieves += 1;
        }
      }
    }
    if (state.nausea <= 0) {
      clearHoldActions(state);
    }
  } else {
    state.nausea = Math.min(100, state.nausea + state.nightConfig.nauseaRate * nauseaGrowthScale * dt);
  }

  // Оновлення п'яного хитання
  state.drunkPhase += dt * (state.nausea > 65 ? 2.8 : 1.5);

  if (state.nausea >= 78 && state.nausea < 100) {
    state.heartbeatTimer -= dt;
    if (state.heartbeatTimer <= 0) {
      queueSound(state, 'heartbeat', { volume: 0.55 });
      state.heartbeatTimer = 1.35;
    }
  }

  // Аварійний виклик ведмедів, якщо нудота досягла 100%
  if (state.nausea >= 100) {
    triggerBearCall(state, 'ОЙ-ЙОЙ! Ти "покликав ведмедів" посеред хати!');
  }

  // Множник агресії від шуму та ночі
  const noiseBoost = 1 + state.noise * 1.15;
  const agg = state.nightConfig.aggression * noiseBoost;

  // 1. Вхідні двері
  stepDoorBear(state, dt, agg);
  if (state.phase !== 'playing') return;

  // 2. Ліве вікно
  stepLeftWindowBear(state, dt, agg);
  if (state.phase !== 'playing') return;

  // 3. Праве вікно
  stepRightWindowBear(state, dt, agg);
  if (state.phase !== 'playing') return;

  // 4. Камін / Димар
  stepChimneyBear(state, dt, agg, hourFloat);
}

function stepDoorBear(state, dt, agg) {
  const bear = state.bears.door;
  const holding = state.currentRoom === 'door' && state.isHoldingLock;

  if (holding) {
    state.lockIntegrity = Math.min(100, state.lockIntegrity + 36 * dt);
    if (bear.stage >= 2) {
      state.lockPushProgress += dt / 1.6;
      if (state.lockPushProgress >= 1) {
        state.lockPushProgress = 0;
        resetBear(bear, state.nightConfig.doorTickBase, state.rng, 1.1);
        state.stats.repels += 1;
        queueSound(state, 'door_lock', { pan: 0, volume: 1.0 });
        pushAudioCue(state, 'Засув витримав! Ведмідь відступив від дверей.', 'door', 0, false, 2.2);
      }
      return;
    }
  } else {
    state.lockPushProgress = Math.max(0, state.lockPushProgress - dt * 0.8);
  }

  if (bear.stage < 2) {
    bear.progressTimer += dt * agg;
    if (bear.progressTimer >= bear.nextAdvanceAt) {
      bear.progressTimer = 0;
      bear.stage += 1;
      if (bear.stage === 1) {
        queueSound(state, 'footsteps_porch', { pan: 0, volume: 0.75 });
        pushAudioCue(state, 'Кроки на ґанку біля дверей', 'door', 0, false, 2.4);
      } else if (bear.stage === 2) {
        bear.soundRepeatTimer = 0;
        queueSound(state, 'door_rattle', { pan: 0, volume: 0.9 });
        pushAudioCue(state, 'ХТОСЬ СМИКАЄ ДВЕРІ!', 'door', 0, true, 2.8);
      }
    }
  } else if (bear.stage === 2) {
    // Ведмідь ломиться у двері — руйнує замок
    const lockDrain = 14.5 * state.nightConfig.aggression;
    state.lockIntegrity = Math.max(0, state.lockIntegrity - lockDrain * dt);

    bear.soundRepeatTimer -= dt;
    if (bear.soundRepeatTimer <= 0) {
      bear.soundRepeatTimer = 2.4;
      queueSound(state, 'door_rattle', { pan: 0, volume: 0.85 });
      pushAudioCue(state, 'Деренчить засув дверей!', 'door', 0, true, 2.0);
    }

    if (state.lockIntegrity <= 0) {
      bear.stage = 3;
      bear.breachTimer = state.nightConfig.breachGrace.door;
      queueSound(state, 'bear_growl', { pan: 0, volume: 1.0 });
      pushAudioCue(state, 'ДВЕРІ ВІДЧИНЕНІ! ХАПАЙ ЗАСУВ!', 'door', 0, true, 3.0);
    }
  } else if (bear.stage === 3) {
    bear.breachTimer -= dt;
    if (bear.breachTimer <= 0) {
      triggerJumpscare(state, 'door');
    }
  }
}

function stepLeftWindowBear(state, dt, agg) {
  const bear = state.bears.leftWindow;
  const shiningLeft =
    state.currentRoom === 'windows' && state.flashlightOn && state.aimX < 0.52;

  if (bear.stage === 2 && shiningLeft) {
    bear.flashlightBurn += dt;
    if (bear.flashlightBurn >= 1.4) {
      resetBear(bear, state.nightConfig.leftTickBase, state.rng, 1.05);
      state.stats.repels += 1;
      queueSound(state, 'bear_growl', { pan: -0.75, volume: 0.65 });
      pushAudioCue(state, 'Світло злякало ведмедя з лівого вікна!', 'windows', -0.75, false, 2.2);
      return;
    }
  } else {
    bear.flashlightBurn = Math.max(0, bear.flashlightBurn - dt * 0.5);
  }

  if (bear.stage < 3) {
    const lightSlow = shiningLeft && bear.stage <= 1 ? 0.35 : 1.0;
    bear.progressTimer += dt * agg * lightSlow;

    if (bear.progressTimer >= bear.nextAdvanceAt) {
      bear.progressTimer = 0;
      bear.stage += 1;
      if (bear.stage === 2) {
        bear.soundRepeatTimer = 0;
        queueSound(state, 'window_scratch', { pan: -0.75, volume: 0.85 });
        pushAudioCue(state, 'Дряпання по лівому вікну!', 'windows', -0.75, true, 2.6);
      } else if (bear.stage === 3) {
        bear.breachTimer = state.nightConfig.breachGrace.leftWindow;
        queueSound(state, 'bear_growl', { pan: -0.75, volume: 0.95 });
        pushAudioCue(state, 'ЛІЗЕ В ЛІВЕ ВІКНО! БИЙ СКОВОРІДКОЮ!', 'windows', -0.75, true, 3.2);
      }
    } else if (bear.stage === 2) {
      bear.soundRepeatTimer -= dt;
      if (bear.soundRepeatTimer <= 0) {
        bear.soundRepeatTimer = 3.2;
        queueSound(state, 'window_scratch', { pan: -0.75, volume: 0.7 });
      }
    }
  } else if (bear.stage === 3) {
    bear.breachTimer -= dt;
    if (bear.breachTimer <= 0) {
      triggerJumpscare(state, 'leftWindow');
    }
  }
}

function stepRightWindowBear(state, dt, agg) {
  const bear = state.bears.rightWindow;
  const shiningRight =
    state.currentRoom === 'windows' && state.flashlightOn && state.aimX >= 0.48;

  if (bear.stage < 3) {
    const lightSlow = shiningRight && bear.stage <= 2 ? 0.5 : 1.0;
    bear.progressTimer += dt * agg * lightSlow;

    if (bear.progressTimer >= bear.nextAdvanceAt) {
      bear.progressTimer = 0;
      bear.stage += 1;
      if (bear.stage === 2) {
        bear.soundRepeatTimer = 0;
        queueSound(state, 'window_scratch', { pan: 0.75, volume: 0.85 });
        pushAudioCue(state, 'Стукіт і дряпання у праве вікно!', 'windows', 0.75, true, 2.6);
      } else if (bear.stage === 3) {
        bear.breachTimer = state.nightConfig.breachGrace.rightWindow;
        queueSound(state, 'bear_growl', { pan: 0.75, volume: 0.95 });
        pushAudioCue(state, 'ЛІЗЕ В ПРАВЕ ВІКНО! ПШИКАЙ БАЛОНЧИКОМ!', 'windows', 0.75, true, 3.2);
      }
    } else if (bear.stage === 2) {
      bear.soundRepeatTimer -= dt;
      if (bear.soundRepeatTimer <= 0) {
        bear.soundRepeatTimer = 3.2;
        queueSound(state, 'window_scratch', { pan: 0.75, volume: 0.7 });
      }
    }
  } else if (bear.stage === 3) {
    bear.breachTimer -= dt;
    if (bear.breachTimer <= 0) {
      triggerJumpscare(state, 'rightWindow');
    }
  }
}

function stepChimneyBear(state, dt, agg, hourFloat) {
  const bear = state.bears.chimney;
  if (hourFloat < state.nightConfig.chimneyStartHour) return;

  // Активний дим блокує й відганяє ведмедя в димарі
  if (state.fireActiveTimer > 0) {
    if (bear.stage >= 2) {
      resetBear(bear, state.nightConfig.chimneyTickBase, state.rng, 1.15);
      state.stats.repels += 1;
    } else {
      bear.progressTimer = Math.max(0, bear.progressTimer - dt * 2);
    }
    return;
  }

  if (bear.stage < 3) {
    bear.progressTimer += dt * agg;
    if (bear.progressTimer >= bear.nextAdvanceAt) {
      bear.progressTimer = 0;
      bear.stage += 1;
      if (bear.stage === 1) {
        queueSound(state, 'chimney_scrape', { pan: 0.25, volume: 0.6 });
        pushAudioCue(state, 'Хтось тупотить на даху біля димаря', 'chimney', 0.25, false, 2.2);
      } else if (bear.stage === 2) {
        bear.soundRepeatTimer = 0;
        queueSound(state, 'chimney_scrape', { pan: 0.25, volume: 0.85 });
        pushAudioCue(state, 'Із каміна сиплеться сажа!', 'chimney', 0.25, true, 2.6);
      } else if (bear.stage === 3) {
        bear.breachTimer = state.nightConfig.breachGrace.chimney;
        queueSound(state, 'bear_growl', { pan: 0.25, volume: 0.95 });
        pushAudioCue(state, 'ЛАПИ В КАМІНІ! РОЗПАЛЮЙ ДИМ!', 'chimney', 0.25, true, 3.2);
      }
    } else if (bear.stage === 2) {
      bear.soundRepeatTimer -= dt;
      if (bear.soundRepeatTimer <= 0) {
        bear.soundRepeatTimer = 3.5;
        queueSound(state, 'chimney_scrape', { pan: 0.25, volume: 0.7 });
      }
    }
  } else if (bear.stage === 3) {
    bear.breachTimer -= dt;
    if (bear.breachTimer <= 0) {
      triggerJumpscare(state, 'chimney');
    }
  }
}
