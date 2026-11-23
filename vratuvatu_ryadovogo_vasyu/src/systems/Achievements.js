const STORAGE_KEY = 'vasya_rescue_achievements_v1';

export const ACHIEVEMENTS_DEF = [
  {
    id: 'druzhba_narodiv',
    icon: '🍻',
    title: 'Дружба народів',
    description: 'Пройти гру без жодного падіння Васі в 100% тільт.',
  },
  {
    id: 'bratiky_ne_zavorkaly',
    icon: '💀',
    title: 'Братіки не заворкали',
    description: 'Вася випав у повний тільт 3+ рази за забіг.',
  },
  {
    id: 'filosof_vasylivky',
    icon: '📜',
    title: 'Філософ василівки',
    description: 'Почути всі унікальні фрази Васі за одну гру.',
  },
  {
    id: 'svynko_ryativnyk',
    icon: '🐹',
    title: 'Свинко-рятівник',
    description: 'Довезти до поїзда всіх 3 морських свинок.',
  },
  {
    id: 'speedrun_galych',
    icon: '⚡',
    title: 'Спідран по Галичу',
    description: 'Пройти операцію менше ніж за 90 секунд.',
  },
  {
    id: 'abonent_spyt',
    icon: '😴',
    title: 'Абонент в Галичі спить',
    description: '3 рази поспіль почути від мами, що Вася спить.',
  },
  {
    id: 'mamyn_argument',
    icon: '📞',
    title: 'Мамин аргумент',
    description: 'Зловити ті самі 10% і витягнути Васю з тільту через дзвінок мамі.',
  },
];

export class AchievementsSystem {
  constructor(toastContainer) {
    this.toastContainer = toastContainer;
    this.unlocked = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.unlocked));
    } catch {
      // ignore storage errors
    }
  }

  isUnlocked(id) {
    return Boolean(this.unlocked[id]);
  }

  getUnlockedCount() {
    return ACHIEVEMENTS_DEF.filter((a) => this.isUnlocked(a.id)).length;
  }

  getTotalCount() {
    return ACHIEVEMENTS_DEF.length;
  }

  unlock(id) {
    if (this.isUnlocked(id)) return false;
    const def = ACHIEVEMENTS_DEF.find((a) => a.id === id);
    if (!def) return false;
    this.unlocked[id] = Date.now();
    this.save();
    this.showToast(def);
    return true;
  }

  showToast(def) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'ach-toast';

    const icon = document.createElement('span');
    icon.style.fontSize = '22px';
    icon.textContent = def.icon;

    const info = document.createElement('div');
    const label = document.createElement('div');
    label.style.fontSize = '10px';
    label.style.fontWeight = '800';
    label.style.color = '#f59e0b';
    label.textContent = 'ДОСЯГНЕННЯ РОЗБЛОКОВАНО!';

    const title = document.createElement('div');
    title.style.fontSize = '13.5px';
    title.style.fontWeight = '800';
    title.textContent = def.title;

    info.appendChild(label);
    info.appendChild(title);
    toast.appendChild(icon);
    toast.appendChild(info);

    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3600);
  }
}
