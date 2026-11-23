import { ITEM_TYPES } from '../data/config.js';

export class HUD {
  constructor() {
    this.layer = document.getElementById('hud-layer');
    this.tiltVal = document.getElementById('hud-tilt-val');
    this.tiltFill = document.getElementById('hud-tilt-fill');
    this.vasyaState = document.getElementById('hud-vasya-state');
    this.pigCount = document.getElementById('hud-pig-count');
    this.buffsEl = document.getElementById('hud-buffs');

    this.timerEl = document.getElementById('hud-timer');
    this.objectiveEl = document.getElementById('hud-objective');
    this.compassArrow = document.getElementById('hud-compass-arrow');
    this.compassDist = document.getElementById('hud-compass-dist');
    this.zoneNameEl = document.getElementById('hud-zone-name');

    this.staminaFill = document.getElementById('hud-stamina-fill');
    this.inventoryEl = document.getElementById('hud-inventory');
    this.actionPromptEl = document.getElementById('hud-action-prompt');
    this.muteIconEl = document.getElementById('mute-icon');
  }

  show() {
    this.layer.classList.remove('hidden');
  }

  hide() {
    this.layer.classList.add('hidden');
  }

  updateMuteIcon(muted) {
    this.muteIconEl.textContent = muted ? '🔇' : '🔊';
  }

  update({
    timeLeft,
    stage,
    cluesFound,
    player,
    vasya,
    escortCount,
    targetPos,
    zoneName,
    promptText,
    onSelectSlot,
  }) {
    const clamped = Math.max(0, Math.ceil(timeLeft));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    this.timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.timerEl.classList.toggle('urgent', clamped <= 45);

    if (stage === 1) {
      this.objectiveEl.textContent =
        cluesFound === 0
          ? 'ФАЗА 1: ОПИТАЙ ІНФОРМАТОРІВ (?) АБО ОБШУКУЙ ХАТИ [E]'
          : cluesFound === 1
            ? 'ФАЗА 1 (1/3): РАЙОН ВІДОМИЙ! ПИТАЙ ДАЛІ АБО СТУКАЙ В ХАТИ'
            : 'ФАЗА 1 (2/3): ПІДОЗРІЛІ ХАТИ НА РАДАРІ! ДОБИЙ 3-Й СЛІД АБО ШУКАЙ';
    } else if (stage === 2) {
      const hasPig = escortCount >= 1;
      const hasDrink = player.hasBeerOrShaurma();
      const missing = [];
      if (!hasPig) missing.push('СВИНКУ 🐹');
      if (!hasDrink) missing.push('ПИВО/ШАУРМУ 🍺');
      this.objectiveEl.textContent =
        missing.length > 0
          ? `ФАЗА 2: ЗБЕРИ ${missing.join(' І ')} ТА ЙДИ ДО БЕРЛОГИ`
          : 'ФАЗА 2: ВІДЧИНИ БЕРЛОГУ ВАСІ [E]!';
    } else {
      this.objectiveEl.textContent = 'ФАЗА 3: ДОВЕДИ ВАСЮ НА ВОКЗАЛ ДО ДИЗЕЛЯ!';
    }

    if (targetPos) {
      const dx = targetPos.x - player.x;
      const dy = targetPos.y - player.y;
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const meters = Math.round(Math.hypot(dx, dy) / 14);
      this.compassArrow.style.transform = `rotate(${angleDeg}deg)`;
      this.compassDist.textContent = `${meters} М`;
    }

    this.zoneNameEl.textContent = zoneName;

    const tiltInt = Math.round(vasya.tilt);
    this.tiltVal.textContent = `${tiltInt}%`;
    this.tiltFill.style.width = `${tiltInt}%`;
    this.vasyaState.textContent = `СТАТУС: ${vasya.getStateLabel()}`;
    this.pigCount.textContent = `${escortCount}/3`;

    const buffs = [];
    if (escortCount > 0) {
      buffs.push(
        `<span class="buff-pill pig">🐹 ТЕРАПІЯ${escortCount >= 2 ? ' ++' : ''}</span>`
      );
    }
    if (vasya.memeShieldTimer > 0) {
      buffs.push(`<span class="buff-pill">📱 ЩИТ ${Math.ceil(vasya.memeShieldTimer)}С</span>`);
    }
    if (vasya.momBuffTimer > 0) {
      buffs.push(`<span class="buff-pill mom">📞 МАМА ${Math.ceil(vasya.momBuffTimer)}С</span>`);
    }
    this.buffsEl.innerHTML = buffs.join('');

    this.staminaFill.style.width = `${Math.round(player.stamina)}%`;

    if (promptText) {
      this.actionPromptEl.classList.remove('hidden');
      this.actionPromptEl.textContent = promptText;
    } else {
      this.actionPromptEl.classList.add('hidden');
    }

    this.inventoryEl.innerHTML = '';
    player.inventory.forEach((slot, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `inv-slot ${player.selectedSlot === idx ? 'active' : ''}`;
      btn.onclick = () => onSelectSlot(idx);

      const key = document.createElement('span');
      key.className = 'inv-slot-key';
      key.textContent = String(idx + 1);
      btn.appendChild(key);

      if (slot) {
        const meta = ITEM_TYPES[slot.type];
        btn.title = `${meta.name}: ${meta.description}`;
        const icon = document.createElement('span');
        icon.className = 'inv-slot-icon';
        icon.textContent = meta.icon;
        btn.appendChild(icon);

        if (slot.count > 1) {
          const count = document.createElement('span');
          count.className = 'inv-slot-count';
          count.textContent = `x${slot.count}`;
          btn.appendChild(count);
        }
      }
      this.inventoryEl.appendChild(btn);
    });
  }
}
