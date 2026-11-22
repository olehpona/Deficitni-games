/**
 * Реєстр асетів (зображень та аудіо) для гри "Don't Call the Bears".
 */

export const IMAGE_MANIFEST = [
  {
    id: 'bg_menu',
    name: 'Фон головного меню',
    expectedPath: './assets/images/bg_menu.webp',
    src: './assets/images/bg_menu.webp',
    recommendedSize: '16:9 / 4:3 JPG/PNG',
    category: 'scenes',
    description: 'Головний екран гри (трейл-камера у лісі).'
  },
  {
    id: 'intro_1_happy',
    name: 'Інтро 1: Задоволений Дмитро',
    expectedPath: './assets/images/intro_1_happy.webp',
    src: './assets/images/intro_1_happy.webp',
    recommendedSize: '4:3 / 16:9 PNG',
    category: 'scenes',
    description: 'Перший слайд передісторії.'
  },
  {
    id: 'intro_2_phone_off',
    name: 'Інтро 2: Вимкнений телефон',
    expectedPath: './assets/images/intro_2_phone_off.webp',
    src: './assets/images/intro_2_phone_off.webp',
    recommendedSize: '4:3 / 16:9 PNG',
    category: 'scenes',
    description: 'Другий слайд передісторії.'
  },
  {
    id: 'intro_3_phone_sms',
    name: 'Інтро 3: СМС від ведмедів',
    expectedPath: './assets/images/intro_3_phone_sms.webp',
    src: './assets/images/intro_3_phone_sms.webp',
    recommendedSize: '4:3 / 16:9 PNG',
    category: 'scenes',
    description: 'Третій слайд передісторії.'
  },
  {
    id: 'intro_4_shocked',
    name: 'Інтро 4: Шокований Дмитро',
    expectedPath: './assets/images/intro_4_shocked.webp',
    src: './assets/images/intro_4_shocked.webp',
    recommendedSize: '4:3 / 16:9 PNG',
    category: 'scenes',
    description: 'Четвертий слайд передісторії.'
  },
  {
    id: 'bg_door',
    name: 'Двері (чисто)',
    expectedPath: './assets/images/doors_without_bear.webp',
    src: './assets/images/doors_without_bear.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Коридор із вхідними дверима без ведмедя (стадія 0).'
  },
  {
    id: 'scene_door_far',
    name: 'Двері (ведмідь далеко)',
    expectedPath: './assets/images/doors_with_bear_far.webp',
    src: './assets/images/doors_with_bear_far.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Ведмідь наближається до вхідних дверей (стадія 1).'
  },
  {
    id: 'scene_door_near',
    name: 'Двері (ведмідь біля скла)',
    expectedPath: './assets/images/door_with_bear_near.webp',
    src: './assets/images/door_with_bear_near.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Ведмідь стоїть впритул і смикає ручку (стадія 2).'
  },
  {
    id: 'scene_door_opening',
    name: 'Двері (ведмідь ломиться)',
    expectedPath: './assets/images/door_with_bear_opening.webp',
    src: './assets/images/door_with_bear_opening.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Ведмідь уже вдирається у двері (критична стадія 3).'
  },
  {
    id: 'bg_windows',
    name: 'Вітальня (основа)',
    expectedPath: './assets/images/main_room.webp',
    src: './assets/images/main_room.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Вітальня з двома вікнами.'
  },
  {
    id: 'window_empty',
    name: 'Вікно (пусто / іній)',
    expectedPath: './assets/images/window_without_bear.webp',
    src: './assets/images/window_without_bear.webp',
    recommendedSize: 'PNG (прозорий фон)',
    category: 'scenes',
    description: 'Оверлей вікна без ведмедя.'
  },
  {
    id: 'window_looking',
    name: 'Вікно (ведмідь підглядає)',
    expectedPath: './assets/images/window_looking.webp',
    src: './assets/images/window_looking.webp',
    recommendedSize: 'PNG (прозорий фон)',
    category: 'scenes',
    description: 'Ведмідь притулився до шибки вікна (стадія 2).'
  },
  {
    id: 'window_climbing',
    name: 'Вікно (ведмідь лізе)',
    expectedPath: './assets/images/window_climbing.webp',
    src: './assets/images/window_climbing.webp',
    recommendedSize: 'PNG (прозорий фон)',
    category: 'scenes',
    description: 'Ведмідь розбив шибку і лізе в хату (стадія 3).'
  },
  {
    id: 'bg_chimney',
    name: 'Камін (спокійно)',
    expectedPath: './assets/images/chimney.webp',
    src: './assets/images/chimney.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Погашений камін без ведмедя.'
  },
  {
    id: 'scene_chimney_bear',
    name: 'Камін (ведмідь у топці)',
    expectedPath: './assets/images/chimney_with_bear.webp',
    src: './assets/images/chimney_with_bear.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Ведмідь вилазить з димаря.'
  },
  {
    id: 'scene_chimney_fire',
    name: 'Камін (вогонь і дим)',
    expectedPath: './assets/images/chimney_with_fire.webp',
    src: './assets/images/chimney_with_fire.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Розпалений камін, що відганяє ведмедя.'
  },
  {
    id: 'bg_bathroom',
    name: 'Вбиральня (спокійно)',
    expectedPath: './assets/images/bathroom.webp',
    src: './assets/images/bathroom.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Кімната з керамічним другом.'
  },
  {
    id: 'scene_bathroom_bear',
    name: 'Вбиральня (ведмідь у вікні)',
    expectedPath: './assets/images/bathroom_with_bear_screamer.webp',
    src: './assets/images/bathroom_with_bear_screamer.webp',
    recommendedSize: '16:9 PNG/JPG',
    category: 'scenes',
    description: 'Ведмідь підглядає у вікно вбиральні при високому ризику.'
  },
  {
    id: 'prop_frying_pan',
    name: 'Чавунна сковорідка',
    expectedPath: './assets/images/frying_pan.webp',
    src: './assets/images/frying_pan.webp',
    recommendedSize: 'PNG (прозорий фон)',
    category: 'props',
    description: 'Зброя проти ведмедя в лівому вікні.'
  },
  {
    id: 'prop_spray',
    name: 'Перцевий балончик',
    expectedPath: './assets/images/spray.webp',
    src: './assets/images/spray.webp',
    recommendedSize: 'PNG (прозорий фон)',
    category: 'props',
    description: 'Відлякувач для правого вікна.'
  },
  {
    id: 'prop_brine',
    name: 'Банка огіркового розсолу',
    expectedPath: './assets/images/cucumbers.webp',
    src: './assets/images/cucumbers.webp',
    recommendedSize: 'PNG (прозорий фон)',
    category: 'props',
    description: 'Рятівний розсіл для швидкого зниження нудоти.'
  },
  {
    id: 'bear_jumpscare',
    name: 'Скрімер ведмедя (Закарпатське)',
    expectedPath: './assets/images/bear_screamer.webp',
    src: './assets/images/bear_screamer.webp',
    recommendedSize: 'PNG (прозорий фон)',
    category: 'bears',
    description: 'Добрий ведмідь із Закарпатським під час скрімера.'
  }
];

export const AUDIO_MANIFEST = [
  {
    id: 'menu_music',
    name: 'Музика головного меню',
    expectedPath: './assets/audio/menu_music.mp3',
    src: './assets/audio/menu_music.mp3',
    loop: true,
    description: 'Весела пісня «Дмитро кликав ведмедів» — грає тільки в головному меню.'
  },
  {
    id: 'ambient_forest',
    name: 'Нічний ліс (фон)',
    expectedPath: './assets/audio/ambient_forest.mp3',
    src: null,
    loop: true,
    description: 'Безперервний фоновий ембієнт нічного лісу та вітру за стінами хатини.'
  },
  {
    id: 'footsteps_porch',
    name: 'Кроки по ґанку',
    expectedPath: './assets/audio/footsteps_porch.mp3',
    src: null,
    loop: false,
    description: 'Важкі кроки ведмедя на деревʼяних дошках перед дверима.'
  },
  {
    id: 'door_rattle',
    name: 'Смикання дверної ручки',
    expectedPath: './assets/audio/door_rattle.wav',
    src: './assets/audio/door_rattle.wav',
    loop: false,
    description: 'Гучне деренчання засува, коли ведмідь ломиться у двері.'
  },
  {
    id: 'door_lock',
    name: 'Закриття засува',
    expectedPath: './assets/audio/door_lock.wav',
    src: './assets/audio/door_lock.wav',
    loop: false,
    description: 'Металевий клац засува / ремонту замка.'
  },
  {
    id: 'window_scratch',
    name: 'Дряпання скла',
    expectedPath: './assets/audio/window_scratch.mp3',
    src: null,
    loop: false,
    description: 'Кігті по шибці лівого або правого вікна (панорамується вліво/вправо).'
  },
  {
    id: 'bear_growl',
    name: 'Рик ведмедя',
    expectedPath: './assets/audio/bear_growl.ogg',
    src: './assets/audio/bear_growl.ogg',
    loop: false,
    description: 'Глухий низький рик при небезпеці або просуванні.'
  },
  {
    id: 'pan_bonk',
    name: 'Удар сковорідкою (BONK)',
    expectedPath: './assets/audio/pan_bonk.wav',
    src: './assets/audio/pan_bonk.wav',
    loop: false,
    description: 'Соковитий дзвін чавунної сковорідки по ведмежій макітрі.'
  },
  {
    id: 'spray_hiss',
    name: 'Пшик балончика',
    expectedPath: './assets/audio/spray_hiss.wav',
    src: './assets/audio/spray_hiss.wav',
    loop: false,
    description: 'Різке шипіння аерозольного балончика.'
  },
  {
    id: 'chimney_scrape',
    name: 'Шурхіт у димарі',
    expectedPath: './assets/audio/chimney_scrape.mp3',
    src: null,
    loop: false,
    description: 'Падіння сажі та шкрябання в трубі каміна.'
  },
  {
    id: 'fire_whoosh',
    name: 'Спалах вогню і диму',
    expectedPath: './assets/audio/fire_whoosh.ogg',
    src: './assets/audio/fire_whoosh.ogg',
    loop: false,
    description: 'Розпалювання каміна та задимлення труби.'
  },
  {
    id: 'toilet_quiet',
    name: 'Тихий візит до керамічного друга',
    expectedPath: './assets/audio/toilet_quiet.mp3',
    src: null,
    loop: false,
    description: 'Акуратне, тихе полегшення без привертання уваги ведмедів.'
  },
  {
    id: 'toilet_loud',
    name: 'Гучний "КЛИЧ ВЕДМЕДІВ"',
    expectedPath: './assets/audio/toilet_loud.mp3',
    src: null,
    loop: false,
    description: 'Епічний рев у керамічного друга, який чути на весь ліс!'
  },
  {
    id: 'brine_gulp',
    name: 'Ковток розсолу',
    expectedPath: './assets/audio/brine_gulp.wav',
    src: './assets/audio/brine_gulp.wav',
    loop: false,
    description: 'Рятівне булькання огіркового розсолу.'
  },
  {
    id: 'flashlight_click',
    name: 'Клац ліхтарика',
    expectedPath: './assets/audio/flashlight_click.mp3',
    src: null,
    loop: false,
    description: 'Кнопка ліхтарика.'
  },
  {
    id: 'heartbeat',
    name: 'Серцебиття / тривога',
    expectedPath: './assets/audio/heartbeat.mp3',
    src: null,
    loop: false,
    description: 'Пульс при високій небезпеці чи критичній нудоті.'
  },
  {
    id: 'jumpscare',
    name: 'Скрімер',
    expectedPath: './assets/audio/jumpscare.ogg',
    src: './assets/audio/jumpscare.ogg',
    loop: false,
    description: 'Гучний ведмежий рев при програші.'
  },
  {
    id: 'clock_chime',
    name: 'Бій годинника / 06:00',
    expectedPath: './assets/audio/clock_chime.wav',
    src: './assets/audio/clock_chime.wav',
    loop: false,
    description: 'Сигнал зміни години або світанку.'
  }
];
