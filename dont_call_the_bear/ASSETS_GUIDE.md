# Гід із заміни заглушок (асети та аудіо) — Don't Call the Bears

Усі картинки ведмедів, предметів, фонів і звуки зараз працюють на **процедурних заглушках та Web Audio синтезаторі**. Гра повністю іграбельна «з коробки», але будь-який елемент можна замінити на власний файл у два способи:

## Спосіб 1: Швидкий тест прямо у браузері
1. Запустіть гру (див. нижче «Як запустити локально»).
2. Натисніть **«Менеджер заглушок / асетів»** у меню або значок 🎨 під час гри.
3. Навпроти потрібного ID натисніть **«Завантажити»** і виберіть файл з диска.
   - Для аудіо можна одразу натиснути **▶**, щоб перевірити звучання.
   - При перезавантаженні сторінки тимчасове завантаження скинеться; для постійного підключення використовуйте Спосіб 2.

## Спосіб 2: Постійне підключення через `assets/manifest.js`
1. Покладіть ваші файли у папки:
   - картинки → `assets/images/`
   - звуки → `assets/audio/`
2. Відкрийте файл `assets/manifest.js`, знайдіть потрібний `id` і замініть `src: null` на шлях до файлу, наприклад:
   ```js
   src: './assets/images/bear_door_peek.png',
   ```

---

## Таблиця зображень (`IMAGE_MANIFEST`)

| ID | Назва | Рекомендований шлях | Рекомендований розмір / формат | Призначення |
| --- | --- | --- | --- | --- |
| `bear_door_peek` | Ведмідь заглядає у двері | `assets/images/bear_door_peek.png` | 500x700 PNG (прозорий фон) | Стадія 1-2 у віконці вхідних дверей |
| `bear_door_breach` | Ведмідь ламає двері | `assets/images/bear_door_breach.png` | 600x800 PNG (прозорий фон) | Критична стадія 3 при зламаному замку |
| `bear_window_far` | Ведмідь у лісі (далеко) | `assets/images/bear_window_far.png` | 400x400 PNG (прозорий фон) | Стадія 1 за вікном (видно під променем ліхтарика) |
| `bear_window_peek` | Ведмідь під вікном | `assets/images/bear_window_peek.png` | 480x480 PNG (прозорий фон) | Стадія 2 — притулився до шибки |
| `bear_window_climb` | Ведмідь лізе у вікно | `assets/images/bear_window_climb.png` | 550x550 PNG (прозорий фон) | Стадія 3 — прорив крізь вікно |
| `bear_chimney_peek` | Ведмідь у димарі | `assets/images/bear_chimney_peek.png` | 480x480 PNG (прозорий фон) | Очі та лапи у сажі в топці каміна |
| `bear_jumpscare` | Скрімер ведмедя | `assets/images/bear_jumpscare.png` | 1280x720 PNG (прозорий фон) | Повноекранний скрімер при програші |
| `prop_frying_pan` | Чавунна сковорідка | `assets/images/prop_frying_pan.png` | 256x256 PNG (прозорий фон) | Удар по ведмедю в лівому вікні |
| `prop_spray` | Перцевий балончик | `assets/images/prop_spray.png` | 256x256 PNG (прозорий фон) | Відлякувач для правого вікна |
| `prop_toilet` | Керамічний друг (унітаз) | `assets/images/prop_toilet.png` | 512x512 PNG (прозорий фон) | Унітаз у вбиральні |
| `prop_brine` | Банка огіркового розсолу | `assets/images/prop_brine.png` | 256x256 PNG (прозорий фон) | Миттєве зняття 35% нудоти |
| `bg_door` | Фон: Вхідні двері | `assets/images/bg_door.jpg` | 1280x720 PNG/JPG | Опціональний фон коридору |
| `bg_windows` | Фон: Вітальня з вікнами | `assets/images/bg_windows.jpg` | 1280x720 PNG/JPG | Опціональний фон вітальні |
| `bg_chimney` | Фон: Камін | `assets/images/bg_chimney.jpg` | 1280x720 PNG/JPG | Опціональний фон камінної зони |
| `bg_bathroom` | Фон: Вбиральня | `assets/images/bg_bathroom.jpg` | 1280x720 PNG/JPG | Опціональний фон вбиральні |

---

## Таблиця аудіо (`AUDIO_MANIFEST`)

Підтримуються формати **MP3, WAV, OGG**.

| ID | Назва | Рекомендований шлях | Loop | Призначення |
| --- | --- | --- | --- | --- |
| `ambient_forest` | Нічний ліс (фон) | `assets/audio/ambient_forest.mp3` | Так | Безперервний фон ночі |
| `footsteps_porch` | Кроки по ґанку | `assets/audio/footsteps_porch.mp3` | Ні | Підхід ведмедя до вхідних дверей |
| `door_rattle` | Смикання дверної ручки | `assets/audio/door_rattle.mp3` | Ні | Ведмідь ломиться у двері |
| `door_lock` | Закриття засува | `assets/audio/door_lock.mp3` | Ні | Клацання засува дверей |
| `window_scratch` | Дряпання скла | `assets/audio/window_scratch.mp3` | Ні | Панорамується вліво/вправо по вікнах |
| `bear_growl` | Рик ведмедя | `assets/audio/bear_growl.mp3` | Ні | Попередження та агресія |
| `pan_bonk` | Удар сковорідкою (BONK) | `assets/audio/pan_bonk.mp3` | Ні | Удар по ведмедю з лівого вікна |
| `spray_hiss` | Пшик балончика | `assets/audio/spray_hiss.mp3` | Ні | Використання перцевого балончика |
| `chimney_scrape` | Шурхіт у димарі | `assets/audio/chimney_scrape.mp3` | Ні | Сиплеться сажа у каміні |
| `fire_whoosh` | Спалах вогню і диму | `assets/audio/fire_whoosh.mp3` | Ні | Розпалювання каміна |
| `toilet_quiet` | Тихий візит | `assets/audio/toilet_quiet.mp3` | Ні | Тихе зняття нудоти у вбиральні |
| `toilet_loud` | Гучний «клик ведмедів» | `assets/audio/toilet_loud.mp3` | Ні | Гучний рик/позив, що приманює ведмедів |
| `brine_gulp` | Ковток розсолу | `assets/audio/brine_gulp.mp3` | Ні | Випивання огіркового розсолу |
| `flashlight_click` | Клац ліхтарика | `assets/audio/flashlight_click.mp3` | Ні | Увімкнення/вимкнення ліхтарика |
| `heartbeat` | Серцебиття / тривога | `assets/audio/heartbeat.mp3` | Ні | Пульс при високій нудоті |
| `jumpscare` | Скрімер | `assets/audio/jumpscare.mp3` | Ні | Звук при нападі ведмедя |
| `clock_chime` | Бій годинника / 06:00 | `assets/audio/clock_chime.mp3` | Ні | Зміна години та перемога на світанку |

---

## Як запустити локально

Оскільки гра використовує ES-модулі (`type="module"`), її потрібно відкривати через локальний HTTP-сервер (а не напряму як `file://`):

```bash
python3 -m http.server 8080
```

Після цього відкрийте у браузері: `http://localhost:8080`
