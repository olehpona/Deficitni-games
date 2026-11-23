export const MAP_WIDTH = 6000;
export const MAP_HEIGHT = 4800;

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Хз (Легко)',
    stars: '★☆☆',
    timeLimit: 270, // 04:30
    passiveTiltRate: 1.8,
    enemySpeedMult: 0.85,
    deadlineDamage: 18,
    fogDarkness: 0.18,
    lightRadius: 430,
  },
  normal: {
    id: 'normal',
    name: 'Бля анлак (Нормально)',
    stars: '★★☆',
    timeLimit: 230, // 03:50
    passiveTiltRate: 2.9,
    enemySpeedMult: 1.0,
    deadlineDamage: 25,
    fogDarkness: 0.38,
    lightRadius: 345,
  },
  hard: {
    id: 'hard',
    name: 'Бля анал (Хардкор)',
    stars: '★★★',
    timeLimit: 195, // 03:15
    passiveTiltRate: 4.3,
    enemySpeedMult: 1.22,
    deadlineDamage: 32,
    fogDarkness: 0.62,
    lightRadius: 275,
  },
};

export const ITEM_TYPES = {
  beer: {
    id: 'beer',
    name: 'Тактичне пиво',
    icon: '🍺',
    tiltReduce: 40,
    color: '#e59a24',
    description: '-40% тільту Васі',
  },
  shaurma: {
    id: 'shaurma',
    name: 'Шаурма з вокзалу',
    icon: '🌯',
    tiltReduce: 30,
    staminaRestore: 60,
    color: '#c96f32',
    description: '-30% тільту + стаміна',
  },
  meme: {
    id: 'meme',
    name: 'Свіжий мем',
    icon: '📱',
    shieldDuration: 5,
    color: '#8aa39b',
    description: 'Щит від тільту на 5 сек',
  },
  cucumber: {
    id: 'cucumber',
    name: 'Огірок / Салат',
    icon: '🥬',
    color: '#7a9e4b',
    description: 'Приманює морських свинок',
  },
};

export const MOM_CALL_CONFIG = {
  cooldown: 35,
  ringDuration: 1.25,
  successChance: 0.1,
  buffDuration: 10,
  failLines: [
    '«Алло? Та Вася в Галичі спить, не чіпайте його»',
    '«Та він у себе в кімнаті спить, я щойно заглядала»',
    '«Який вокзал? Вася в Галичі спить!»',
  ],
  ultLine:
    '«Як це не відписує місяць?! Дай йому трубку! ВАСЯ, БИСТРО ЇДЬ ДО ХЛОПЦІВ, ГОДІ В СТЕЛЮ ДИВИТИСЬ!»',
};
