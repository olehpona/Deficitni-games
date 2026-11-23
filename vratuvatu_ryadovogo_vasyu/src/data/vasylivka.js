export const VASYLIVKA_POOLS = {
  calm: ['Да', 'Хз', 'Хз хз', 'Дружба народів'],
  medium: ['Бля анлак', 'Бля кал', 'Братіки не заворкали', 'Хз хз'],
  critical: ['Бля анал', 'Бля анлак', 'Пж пж', 'Бля кал'],
  gift: ['Да', 'Дружба народів', 'Пж пж'],
};

export const ALL_UNIQUE_PHRASES = [
  'Да',
  'Хз',
  'Хз хз',
  'Дружба народів',
  'Бля анлак',
  'Бля кал',
  'Братіки не заворкали',
  'Бля анал',
  'Пж пж',
];

export const VASYLIVKA_DICTIONARY = [
  {
    phrase: '«Да»',
    meaning: 'Універсальна згода, схвалення пива, або відповідь на запитання будь-якої складності.',
  },
  {
    phrase: '«Хз»',
    meaning: 'Базовий стан душі Васі. Може означати як легку задуму, так і початок 31-денного ігнору.',
  },
  {
    phrase: '«Хз хз»',
    meaning: 'Подвійний сумнів. Ситуація наближається до турбулентності, варто готувати огірок або пиво.',
  },
  {
    phrase: '«Дружба народів»',
    meaning: 'Найвищий рівень гармонії. Зʼявляється, коли поруч кент, холодне пиво і морські свинки.',
  },
  {
    phrase: '«Бля анлак»',
    meaning: 'Екзистенційна констатація несправедливості буття. Зазвичай після зустрічі з Дедлайном.',
  },
  {
    phrase: '«Бля кал»',
    meaning: 'Різке погіршення морального стану. Потрібна термінова свинко-терапія або шаурма.',
  },
  {
    phrase: '«Братіки не заворкали»',
    meaning: 'Сигнал критичної втоми команди. Вася втрачає віру в операцію — закиньте йому пиво.',
  },
  {
    phrase: '«Бля анал»',
    meaning: 'ПОВНИЙ ТІЛЬТ (100%). Свинка втекла, дедлайни душать. Спамте E або викликайте маму!',
  },
  {
    phrase: '«Пж пж»',
    meaning: 'Благання відпустити назад у тепле ліжко, або непереборне бажання погладити морську свинку.',
  },
];

export function pickVasylivkaPhrase(context, { hasPigOrBeer = false, isBegging = false } = {}) {
  if (context === 'gift') {
    if (isBegging) return 'Пж пж';
    return hasPigOrBeer && Math.random() < 0.65 ? 'Дружба народів' : 'Да';
  }
  if (context === 'calm') {
    if (hasPigOrBeer && Math.random() < 0.45) return 'Дружба народів';
    const pool = VASYLIVKA_POOLS.calm;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (context === 'medium') {
    const pool = VASYLIVKA_POOLS.medium;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (context === 'critical') {
    if (isBegging && Math.random() < 0.5) return 'Пж пж';
    const pool = VASYLIVKA_POOLS.critical;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return 'Хз';
}
