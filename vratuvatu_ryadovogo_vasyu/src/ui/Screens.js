import { VASYLIVKA_DICTIONARY } from '../data/vasylivka.js';
import { ACHIEVEMENTS_DEF } from '../systems/Achievements.js';

export class ScreensManager {
  constructor(achievements) {
    this.achievements = achievements;
    this.briefingScreen = document.getElementById('screen-briefing');
    this.endingScreen = document.getElementById('screen-ending');
    this.endingCard = document.getElementById('ending-card');

    this.dictModal = document.getElementById('modal-dict');
    this.achModal = document.getElementById('modal-achievements');
    this.menuAchCount = document.getElementById('menu-ach-count');

    this.selectedDifficulty = 'normal';
    this.initBriefingControls();
  }

  initBriefingControls() {
    const cards = document.querySelectorAll('.diff-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedDifficulty = card.dataset.diff;
      });
    });

    document.getElementById('btn-open-dict').addEventListener('click', () => {
      this.renderDictionary();
      this.dictModal.classList.remove('hidden');
    });

    document.getElementById('btn-open-achievements').addEventListener('click', () => {
      this.renderAchievements();
      this.achModal.classList.remove('hidden');
    });

    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close');
        document.getElementById(targetId)?.classList.add('hidden');
      });
    });

    this.refreshAchievementCount();
  }

  refreshAchievementCount() {
    this.menuAchCount.textContent = `${this.achievements.getUnlockedCount()}/${this.achievements.getTotalCount()}`;
  }

  renderDictionary() {
    const list = document.getElementById('dict-list');
    list.innerHTML = '';
    for (const entry of VASYLIVKA_DICTIONARY) {
      const item = document.createElement('div');
      item.className = 'dict-item';

      const phrase = document.createElement('div');
      phrase.className = 'dict-phrase';
      phrase.textContent = entry.phrase;

      const meaning = document.createElement('div');
      meaning.className = 'dict-meaning';
      meaning.textContent = entry.meaning;

      item.appendChild(phrase);
      item.appendChild(meaning);
      list.appendChild(item);
    }
  }

  renderAchievements() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    for (const def of ACHIEVEMENTS_DEF) {
      const unlocked = this.achievements.isUnlocked(def.id);
      const row = document.createElement('div');
      row.className = `ach-item ${unlocked ? 'unlocked' : ''}`;

      const icon = document.createElement('div');
      icon.className = 'ach-icon';
      icon.textContent = unlocked ? def.icon : '🔒';

      const body = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'ach-title';
      title.textContent = def.title;

      const desc = document.createElement('div');
      desc.className = 'ach-desc';
      desc.textContent = def.description;

      body.appendChild(title);
      body.appendChild(desc);
      row.appendChild(icon);
      row.appendChild(body);
      list.appendChild(row);
    }
  }

  showBriefing() {
    this.refreshAchievementCount();
    this.endingScreen.classList.add('hidden');
    this.briefingScreen.classList.remove('hidden');
  }

  hideAll() {
    this.briefingScreen.classList.add('hidden');
    this.endingScreen.classList.add('hidden');
    this.dictModal.classList.add('hidden');
    this.achModal.classList.add('hidden');
  }

  showEnding({ type, elapsed, pigsSaved, comaCount, phrasesCount, difficultyName, onRetry, onMenu }) {
    this.endingCard.className = `ending-card ${type === 'defeat' ? 'defeat' : type === 'secret' ? 'secret' : ''}`;

    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (type === 'defeat') {
      this.endingCard.innerHTML = `
        <div class="ending-badge">ОПЕРАЦІЯ ПРОВАЛЕНА • ДИЗЕЛЬ ПІШОВ</div>
        <h2 class="ending-title">ПОЇЗД ПОЇХАВ БЕЗ ВАС</h2>
        <div class="tg-defeat-window">
          <div class="tg-defeat-head">
            <strong>Вася</strong>
            <span class="tg-last-seen">був у мережі давно</span>
          </div>
          <div class="tg-defeat-msg">Бля анлак</div>
          <div class="tg-defeat-msg">Хз <span style="color:#64748b;font-size:11px;margin-left:8px;">✓</span></div>
        </div>
        <div class="ending-stats">
          <div class="stat-box"><div class="stat-label">Складність</div><div class="stat-value">${difficultyName}</div></div>
          <div class="stat-box"><div class="stat-label">Падінь у 100% тільт</div><div class="stat-value">${comaCount}</div></div>
        </div>
        <div class="ending-actions">
          <button id="end-menu-btn" class="secondary-cta">В брифінг</button>
          <button id="end-retry-btn" class="primary-cta">Спробувати ще раз</button>
        </div>
      `;
    } else {
      const isSecret = type === 'secret';
      const rank = isSecret
        ? 'ЛЕГЕНДА ГАЛИЧА'
        : elapsed < 90
          ? 'S (БЛИСКАВКА)'
          : comaCount === 0
            ? 'A (ДРУЖБА НАРОДІВ)'
            : 'B (ВИТЯГЛИ КЕНТА)';
      const verdict = isSecret ? 'Дружба народів' : comaCount === 0 ? 'Дружба народів' : 'Да';

      this.endingCard.innerHTML = `
        <div class="ending-badge">${isSecret ? 'СЕКРЕТНА ПЕРЕМОГА • ПОВЕЛИТЕЛЬ СВИНОК' : 'МІСІЯ ВИКОНАНА • ВАСЯ В ДИЗЕЛІ'}</div>
        <h2 class="ending-title">${isSecret ? 'ДРУЖБА НАРОДІВ: ЛЕГЕНДА ГАЛИЧА!' : 'РЯДОВОГО ВАСЮ ЕВАКУЙОВАНО!'}</h2>
        <div class="ending-verdict">
          <div style="font-size:12px;color:#d8b4fe;margin-bottom:4px;">Фінальний вердикт Васі на пероні:</div>
          <div style="font-size:24px;font-weight:900;color:#ffffff;">«${verdict}»</div>
        </div>
        <div class="ending-stats">
          <div class="stat-box"><div class="stat-label">Час евакуації</div><div class="stat-value">${timeStr}</div></div>
          <div class="stat-box"><div class="stat-label">Свинок врятовано</div><div class="stat-value">🐹 ${pigsSaved}/3</div></div>
          <div class="stat-box"><div class="stat-label">Ранг забігу</div><div class="stat-value">${rank}</div></div>
          <div class="stat-box"><div class="stat-label">Фраз василівки</div><div class="stat-value">${phrasesCount}/9</div></div>
        </div>
        <div class="ending-actions">
          <button id="end-menu-btn" class="secondary-cta">В брифінг</button>
          <button id="end-retry-btn" class="primary-cta">Ще один забіг</button>
        </div>
      `;
    }

    this.endingScreen.classList.remove('hidden');
    document.getElementById('end-retry-btn').onclick = onRetry;
    document.getElementById('end-menu-btn').onclick = onMenu;
  }
}
