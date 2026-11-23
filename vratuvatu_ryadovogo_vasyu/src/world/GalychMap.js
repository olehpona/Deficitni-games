import { MAP_WIDTH, MAP_HEIGHT } from '../data/config.js';
import { BLOCK_W, BLOCK_H, createProps, isOnRoad, rectsOverlap } from './Props.js';

export { H_ROADS, V_ROADS, BLOCK_W, BLOCK_H, isOnRoad, rectsOverlap } from './Props.js';

const COL_X = [360, 1725, 3090, 4455];
const ROW_Y = [360, 1470, 2580, 3690];

// District templates with relative coordinates inside a 1185x930 city block
function getDistrictTemplates() {
  return [
    // 0: FIXED STATION (always Col 0, Row 3)
    {
      id: 'station',
      name: 'Залізничний Вокзал',
      surface: 'concrete',
      fixedSlot: { col: 0, row: 3 },
      isStation: true,
      buildings: [
        { dx: 70, dy: 60, w: 520, h: 165, label: 'ВОКЗАЛ ГАЛИЧ', roofColor: '#3d3f42', wallColor: '#57595e', accent: '#e59a24', kind: 'landmark' },
        { dx: 660, dy: 60, w: 220, h: 145, label: 'ДИСПЕТЧЕРСЬКА', roofColor: '#474542', wallColor: '#5e5b57', accent: '#d6b87c', kind: 'panelka' },
        { dx: 940, dy: 60, w: 175, h: 125, label: 'ШАУРМА АШОТА', roofColor: '#694122', wallColor: '#82522d', accent: '#e59a24', kind: 'house' },
      ],
      informants: [{ id: 'inf_ashot', name: 'Шаурміст Ашот', dx: 1020, dy: 230 }],
      pickups: [
        { type: 'shaurma', dx: 1020, dy: 285 },
        { type: 'cucumber', dx: 760, dy: 265 },
      ],
    },
    // 1: PARK WEST
    {
      id: 'park_west',
      name: 'Центральний Парк (Захід)',
      surface: 'park',
      isPark: true,
      buildings: [
        { dx: 75, dy: 70, w: 185, h: 125, label: 'СТОРОЖКА', roofColor: '#4e5d3a', wallColor: '#5c4b3a', accent: '#7a9e4b', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 870, dy: 70, w: 220, h: 140, label: 'ТИР ГАЛИЧ', roofColor: '#57524b', wallColor: '#444038', accent: '#b83527', kind: 'industrial' },
      ],
      bushes: [
        { dx: 160, dy: 420, r: 34 },
        { dx: 460, dy: 240, r: 38 },
        { dx: 720, dy: 300, r: 36 },
        { dx: 340, dy: 690, r: 38 },
        { dx: 820, dy: 710, r: 34 },
      ],
      pigSpawns: [
        { dx: 380, dy: 390 },
        { dx: 760, dy: 600 },
      ],
      informants: [{ id: 'inf_park', name: 'Сторож Парку', dx: 165, dy: 240 }],
      pickups: [
        { type: 'cucumber', dx: 540, dy: 490 },
        { type: 'meme', dx: 960, dy: 640 },
      ],
    },
    // 2: PARK EAST
    {
      id: 'park_east',
      name: 'Центральний Парк (Схід)',
      surface: 'park',
      isPark: true,
      buildings: [
        { dx: 290, dy: 70, w: 260, h: 140, label: 'ЛІТНЯ СЦЕНА', roofColor: '#6b4730', wallColor: '#523624', accent: '#e59a24', kind: 'kamianytsia' },
        { dx: 870, dy: 690, w: 225, h: 140, label: 'КАФЕ «ДУБОК»', roofColor: '#733f2e', wallColor: '#593022', accent: '#d6b87c', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
      ],
      bushes: [
        { dx: 180, dy: 200, r: 36 },
        { dx: 680, dy: 220, r: 38 },
        { dx: 940, dy: 280, r: 34 },
        { dx: 240, dy: 690, r: 38 },
        { dx: 620, dy: 720, r: 36 },
      ],
      pigSpawns: [
        { dx: 420, dy: 520 },
        { dx: 820, dy: 430 },
      ],
      pickups: [
        { type: 'cucumber', dx: 560, dy: 350 },
        { type: 'beer', dx: 720, dy: 740 },
      ],
    },
    // 3: ATB QUARTER
    {
      id: 'atb',
      name: 'Торговий квартал АТБ',
      surface: 'concrete',
      hasAtbQueue: true,
      buildings: [
        { dx: 240, dy: 80, w: 680, h: 255, label: 'АТБ-МАРКЕТ', roofColor: '#2c3d59', wallColor: '#3c5275', accent: '#e59a24', kind: 'landmark' },
        { dx: 75, dy: 620, w: 285, h: 165, label: 'ЖИВЕ ПИВО', roofColor: '#694020', wallColor: '#82522d', accent: '#e59a24', kind: 'kamianytsia', searchable: true, typeLabel: 'камʼяниця' },
        { dx: 450, dy: 620, w: 285, h: 165, label: 'АПТЕКА №1', roofColor: '#3f593b', wallColor: '#52704c', accent: '#7a9e4b', kind: 'kamianytsia' },
        { dx: 825, dy: 620, w: 285, h: 165, label: 'ЛОМБАРД', roofColor: '#592e2b', wallColor: '#733e3a', accent: '#b83527', kind: 'kamianytsia' },
      ],
      informants: [{ id: 'inf_atb', name: 'Охоронець АТБ', dx: 185, dy: 400 }],
      pickups: [
        { type: 'beer', dx: 150, dy: 510 },
        { type: 'beer', dx: 990, dy: 510 },
        { type: 'shaurma', dx: 580, dy: 525 },
        { type: 'cucumber', dx: 980, dy: 160 },
      ],
    },
    // 4: PANELKY MICRODISTRICT
    {
      id: 'panelky',
      name: 'Мікрорайон Панельки',
      surface: 'concrete',
      buildings: [
        { dx: 75, dy: 65, w: 380, h: 205, label: 'ПАНЕЛЬКА №1', roofColor: '#42403c', wallColor: '#59554f', accent: '#9b9384', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
        { dx: 620, dy: 65, w: 470, h: 215, label: 'ПАНЕЛЬКА №9', roofColor: '#3d3942', wallColor: '#544e59', accent: '#8d6b99', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
        { dx: 75, dy: 380, w: 140, h: 110, label: 'ТП-404', roofColor: '#57432a', wallColor: '#6e5638', accent: '#e59a24', kind: 'industrial' },
        { dx: 330, dy: 590, w: 330, h: 205, label: 'ХРУЩОВКА №3', roofColor: '#4a4742', wallColor: '#615d57', accent: '#9b9384', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
        { dx: 740, dy: 590, w: 350, h: 205, label: 'ПАНЕЛЬКА №5', roofColor: '#42403c', wallColor: '#59554f', accent: '#9b9384', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
      ],
      pickups: [
        { type: 'beer', dx: 350, dy: 430 },
        { type: 'meme', dx: 820, dy: 430 },
      ],
    },
    // 5: PRIVATE SECTOR NORTH
    {
      id: 'private_north',
      name: 'Приватний сектор (Північ)',
      surface: 'residential',
      buildings: [
        { dx: 75, dy: 70, w: 225, h: 150, label: 'ХАТА ДІДА БОГДАНА', roofColor: '#783c28', wallColor: '#8c765a', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 390, dy: 70, w: 220, h: 150, label: 'ХАТА №12', roofColor: '#69402b', wallColor: '#8a7254', accent: '#d6b87c', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 700, dy: 70, w: 130, h: 100, label: 'САРАЙ', roofColor: '#4f4a42', wallColor: '#635c52', accent: '#9b9384', kind: 'industrial' },
        { dx: 890, dy: 70, w: 215, h: 150, label: 'ХАТА №14', roofColor: '#753827', wallColor: '#8f785c', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 75, dy: 630, w: 240, h: 155, label: 'ХАТА №18', roofColor: '#495b36', wallColor: '#806e54', accent: '#7a9e4b', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 410, dy: 630, w: 240, h: 155, label: 'ХАТА №20', roofColor: '#783c28', wallColor: '#8a7254', accent: '#d6b87c', kind: 'house' },
        { dx: 780, dy: 630, w: 300, h: 155, label: 'ХАТА ПЕТРОВИЧА', roofColor: '#6c392a', wallColor: '#876f52', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
      ],
      gardens: [
        { dx: 90, dy: 380, w: 230, h: 115 },
        { dx: 810, dy: 380, w: 230, h: 115 },
      ],
      bushes: [{ dx: 520, dy: 430, r: 30 }],
      informants: [{ id: 'inf_bohdan', name: 'Дід Богдан', dx: 185, dy: 260 }],
      pickups: [
        { type: 'cucumber', dx: 640, dy: 430 },
        { type: 'beer', dx: 380, dy: 300 },
      ],
    },
    // 6: PRIVATE SECTOR SOUTH
    {
      id: 'private_south',
      name: 'Приватний сектор (Південь)',
      surface: 'residential',
      buildings: [
        { dx: 75, dy: 70, w: 240, h: 155, label: 'ХАТА №22', roofColor: '#753b27', wallColor: '#8c7458', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 410, dy: 70, w: 240, h: 155, label: 'ХАТА №24', roofColor: '#6c422c', wallColor: '#856c52', accent: '#d6b87c', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 745, dy: 70, w: 345, h: 160, label: 'ДАЧА ВІДЛЮДНИКА', roofColor: '#593b4b', wallColor: '#755668', accent: '#8d6b99', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 75, dy: 630, w: 260, h: 160, label: 'ХАТА №26', roofColor: '#495b36', wallColor: '#806e54', accent: '#7a9e4b', kind: 'house' },
        { dx: 430, dy: 630, w: 280, h: 160, label: 'КІОСК «КВАС»', roofColor: '#574632', wallColor: '#735e45', accent: '#e59a24', kind: 'house' },
        { dx: 810, dy: 630, w: 280, h: 160, label: 'ХАТА №28', roofColor: '#783c28', wallColor: '#8c765a', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
      ],
      gardens: [
        { dx: 90, dy: 380, w: 220, h: 110 },
        { dx: 820, dy: 380, w: 220, h: 110 },
      ],
      bushes: [{ dx: 540, dy: 430, r: 30 }],
      pickups: [{ type: 'shaurma', dx: 380, dy: 430 }],
    },
    // 7: LVIVSKA STREET
    {
      id: 'lvivska',
      name: 'Вулиця Львівська',
      surface: 'cobble',
      buildings: [
        { dx: 75, dy: 70, w: 250, h: 160, label: 'КАМʼЯНИЦЯ №1', roofColor: '#733e2c', wallColor: '#8a6b52', accent: '#e59a24', kind: 'kamianytsia', searchable: true, typeLabel: 'камʼяниця' },
        { dx: 410, dy: 70, w: 260, h: 160, label: 'ПЕРУКАРНЯ', roofColor: '#5c4b3b', wallColor: '#756350', accent: '#d6b87c', kind: 'kamianytsia' },
        { dx: 760, dy: 70, w: 330, h: 160, label: 'УНІВЕРМАГ', roofColor: '#4a4843', wallColor: '#615e57', accent: '#e59a24', kind: 'panelka' },
        { dx: 75, dy: 340, w: 235, h: 155, label: 'ХАТА №3', roofColor: '#6c3d2a', wallColor: '#856c52', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 410, dy: 340, w: 245, h: 155, label: 'НОТАРІУС', roofColor: '#52493f', wallColor: '#6e6255', accent: '#d6b87c', kind: 'kamianytsia' },
        { dx: 760, dy: 340, w: 330, h: 160, label: 'ХАТА З МАНСАРДОЮ', roofColor: '#5c3c4c', wallColor: '#7a5c6b', accent: '#8d6b99', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 75, dy: 630, w: 430, h: 185, label: 'МІСЬКРАДА', roofColor: '#4c4943', wallColor: '#66625a', accent: '#e59a24', kind: 'landmark' },
        { dx: 620, dy: 630, w: 470, h: 185, label: 'ПОЛІКЛІНІКА', roofColor: '#4a5248', wallColor: '#636c60', accent: '#7a9e4b', kind: 'panelka' },
      ],
      pickups: [{ type: 'shaurma', dx: 690, dy: 280 }],
    },
    // 8: OLD TOWN NORTH
    {
      id: 'old_town',
      name: 'Старе Місто',
      surface: 'cobble',
      buildings: [
        { dx: 75, dy: 65, w: 280, h: 170, label: 'ШКОЛА №2', roofColor: '#6f3d2c', wallColor: '#825c46', accent: '#e59a24', kind: 'kamianytsia' },
        { dx: 440, dy: 65, w: 270, h: 170, label: 'ГОТЕЛЬ «ДНІСТЕР»', roofColor: '#5a4d42', wallColor: '#706356', accent: '#d6b87c', kind: 'kamianytsia', searchable: true, typeLabel: 'камʼяниця' },
        { dx: 800, dy: 65, w: 295, h: 170, label: 'ПОШТА №1', roofColor: '#4d4a44', wallColor: '#635e56', accent: '#e59a24', kind: 'panelka' },
        { dx: 75, dy: 350, w: 250, h: 160, label: 'КАМʼЯНИЦЯ №4', roofColor: '#7a3e2c', wallColor: '#8a6852', accent: '#d6b87c', kind: 'kamianytsia', searchable: true, typeLabel: 'камʼяниця' },
        { dx: 420, dy: 350, w: 270, h: 160, label: 'МУЗЕЙ ГАЛИЧА', roofColor: '#6d3c2d', wallColor: '#7d5f49', accent: '#e59a24', kind: 'kamianytsia' },
        { dx: 780, dy: 350, w: 315, h: 160, label: 'БУДИНОК КУЛЬТУРИ', roofColor: '#524b43', wallColor: '#6b6359', accent: '#d6b87c', kind: 'panelka' },
        { dx: 75, dy: 640, w: 460, h: 185, label: 'СПОРТЗАЛ', roofColor: '#484744', wallColor: '#5c5954', accent: '#b83527', kind: 'industrial' },
        { dx: 630, dy: 640, w: 465, h: 185, label: 'ГІМНАЗІЯ', roofColor: '#6a4432', wallColor: '#7a5946', accent: '#e59a24', kind: 'kamianytsia' },
      ],
      pickups: [{ type: 'beer', dx: 540, dy: 570 }],
    },
    // 9: KAMIANYTSI QUARTER
    {
      id: 'kamianytsi',
      name: 'Квартал Камʼяниць',
      surface: 'cobble',
      buildings: [
        { dx: 75, dy: 70, w: 265, h: 160, label: 'ХАТА №5', roofColor: '#753c28', wallColor: '#8a7254', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 435, dy: 70, w: 280, h: 160, label: 'КРАМНИЦЯ «СВІТАНОК»', roofColor: '#4c593e', wallColor: '#637352', accent: '#7a9e4b', kind: 'kamianytsia' },
        { dx: 810, dy: 70, w: 285, h: 160, label: 'КАМʼЯНИЦЯ №9', roofColor: '#6d3b2b', wallColor: '#825c48', accent: '#d6b87c', kind: 'kamianytsia', searchable: true, typeLabel: 'камʼяниця' },
        { dx: 75, dy: 340, w: 340, h: 175, label: 'ПЕКАРНЯ', roofColor: '#6b4730', wallColor: '#805b42', accent: '#e59a24', kind: 'kamianytsia' },
        { dx: 510, dy: 340, w: 260, h: 175, label: 'ХАТА №11', roofColor: '#73412d', wallColor: '#8a6f54', accent: '#c96f32', kind: 'house', searchable: true, typeLabel: 'приватна хата' },
        { dx: 840, dy: 340, w: 255, h: 175, label: 'ГАЛАНТЕРЕЯ', roofColor: '#544d46', wallColor: '#6b635a', accent: '#d6b87c', kind: 'kamianytsia' },
        { dx: 75, dy: 630, w: 465, h: 190, label: 'ПТУ №14', roofColor: '#464542', wallColor: '#5e5b56', accent: '#9b9384', kind: 'panelka' },
        { dx: 630, dy: 630, w: 465, h: 190, label: 'ГУРТОЖИТОК', roofColor: '#4a4742', wallColor: '#615d57', accent: '#e59a24', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
      ],
      pickups: [{ type: 'meme', dx: 450, dy: 570 }],
    },
    // 10: EAST KHRUSHCHOVKAS
    {
      id: 'khrushchovkas',
      name: 'Хрущовки Східні',
      surface: 'concrete',
      buildings: [
        { dx: 75, dy: 70, w: 455, h: 195, label: 'ХРУЩОВКА №6', roofColor: '#484540', wallColor: '#615d56', accent: '#9b9384', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
        { dx: 625, dy: 70, w: 470, h: 195, label: 'ХРУЩОВКА №8', roofColor: '#43413d', wallColor: '#595650', accent: '#9b9384', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
        { dx: 75, dy: 360, w: 270, h: 175, label: 'ДИТСАДОК', roofColor: '#6b4d30', wallColor: '#826444', accent: '#e59a24', kind: 'kamianytsia' },
        { dx: 440, dy: 360, w: 280, h: 175, label: 'БІБЛІОТЕКА', roofColor: '#574e45', wallColor: '#706559', accent: '#d6b87c', kind: 'kamianytsia' },
        { dx: 810, dy: 360, w: 285, h: 175, label: 'ГАРАЖІ №4', roofColor: '#3f3e3b', wallColor: '#54524d', accent: '#c96f32', kind: 'industrial', searchable: true, typeLabel: 'гараж-бункер' },
        { dx: 75, dy: 630, w: 485, h: 190, label: 'ПАНЕЛЬКА №10', roofColor: '#42403c', wallColor: '#59554f', accent: '#9b9384', kind: 'panelka' },
        { dx: 650, dy: 630, w: 445, h: 190, label: 'ПАНЕЛЬКА №12', roofColor: '#45433f', wallColor: '#5e5a54', accent: '#9b9384', kind: 'panelka', searchable: true, typeLabel: 'панелька' },
      ],
      pickups: [{ type: 'shaurma', dx: 575, dy: 310 }],
    },
    // 11: STO & GARAGES
    {
      id: 'garages',
      name: 'СТО та Гаражі',
      surface: 'industrial',
      buildings: [
        { dx: 75, dy: 70, w: 320, h: 140, label: 'ГАРАЖІ А-1', roofColor: '#3e3d3a', wallColor: '#54524e', accent: '#e59a24', kind: 'industrial', searchable: true, typeLabel: 'гараж-бункер' },
        { dx: 465, dy: 70, w: 320, h: 140, label: 'ГАРАЖІ А-2', roofColor: '#3e3d3a', wallColor: '#54524e', accent: '#e59a24', kind: 'industrial' },
        { dx: 850, dy: 70, w: 250, h: 140, label: 'МИЙКА', roofColor: '#38464d', wallColor: '#4c5e66', accent: '#d6b87c', kind: 'industrial' },
        { dx: 75, dy: 330, w: 360, h: 170, label: 'СТО «У ПЕТРА»', roofColor: '#4d3a2c', wallColor: '#664e3c', accent: '#c96f32', kind: 'industrial' },
        { dx: 525, dy: 330, w: 575, h: 170, label: 'АВТОБАЗА', roofColor: '#3b3a38', wallColor: '#52504c', accent: '#e59a24', kind: 'industrial' },
        { dx: 75, dy: 620, w: 320, h: 180, label: 'ШИНОМОНТАЖ', roofColor: '#3d3b38', wallColor: '#54514d', accent: '#c96f32', kind: 'industrial' },
        { dx: 485, dy: 620, w: 615, h: 180, label: 'КОТЕЛЬНЯ №2', roofColor: '#4d3230', wallColor: '#664441', accent: '#b83527', kind: 'industrial' },
      ],
      informants: [{ id: 'inf_petro', name: 'Майстер Петро', dx: 255, dy: 540 }],
      pickups: [{ type: 'beer', dx: 470, dy: 265 }],
    },
    // 12: PROMZONA
    {
      id: 'promzona',
      name: 'Промзона Галича',
      surface: 'industrial',
      buildings: [
        { dx: 75, dy: 70, w: 420, h: 185, label: 'СКЛАД №4', roofColor: '#403e3b', wallColor: '#57544f', accent: '#e59a24', kind: 'industrial' },
        { dx: 600, dy: 70, w: 495, h: 185, label: 'АНГАР №9', roofColor: '#383d42', wallColor: '#4d5359', accent: '#d6b87c', kind: 'industrial' },
        { dx: 75, dy: 360, w: 400, h: 175, label: 'ЦЕХ ЗВАРЮВАННЯ', roofColor: '#473c33', wallColor: '#5e5045', accent: '#c96f32', kind: 'industrial' },
        { dx: 600, dy: 360, w: 495, h: 175, label: 'БУНКЕР-ГАРАЖ №13', roofColor: '#453847', wallColor: '#5c4b5e', accent: '#8d6b99', kind: 'industrial', searchable: true, typeLabel: 'гараж-бункер' },
        { dx: 75, dy: 640, w: 1020, h: 175, label: 'ЛОГІСТИЧНИЙ ТЕРМІНАЛ', roofColor: '#3c3b38', wallColor: '#52504c', accent: '#9b9384', kind: 'industrial' },
      ],
      pickups: [
        { type: 'shaurma', dx: 540, dy: 310 },
        { type: 'meme', dx: 540, dy: 580 },
      ],
    },
    // 13: STATION MARKET
    {
      id: 'market',
      name: 'Привокзальний Ринок',
      surface: 'cobble',
      buildings: [
        { dx: 75, dy: 70, w: 300, h: 180, label: 'БАЗАРНІ РЯДИ', roofColor: '#634931', wallColor: '#7a5c40', accent: '#e59a24', kind: 'kamianytsia' },
        { dx: 465, dy: 70, w: 300, h: 180, label: 'КАФЕ «ТРАНЗИТ»', roofColor: '#574338', wallColor: '#70584a', accent: '#d6b87c', kind: 'kamianytsia', searchable: true, typeLabel: 'камʼяниця' },
        { dx: 845, dy: 70, w: 255, h: 180, label: 'ПОШТОМАТ', roofColor: '#42474a', wallColor: '#595f63', accent: '#c96f32', kind: 'industrial' },
        { dx: 75, dy: 430, w: 465, h: 220, label: 'ПАКГАУЗ №1', roofColor: '#403e3a', wallColor: '#57544f', accent: '#9b9384', kind: 'industrial' },
        { dx: 630, dy: 430, w: 470, h: 220, label: 'БАГАЖНЕ ДЕПО', roofColor: '#3d3b38', wallColor: '#54514d', accent: '#9b9384', kind: 'industrial' },
      ],
      pickups: [{ type: 'beer', dx: 585, dy: 340 }],
    },
    // 14: WAREHOUSES
    {
      id: 'warehouses',
      name: 'Складська База',
      surface: 'industrial',
      buildings: [
        { dx: 75, dy: 70, w: 480, h: 220, label: 'СХОВИЩЕ ПАЛИВА', roofColor: '#4d3632', wallColor: '#664843', accent: '#b83527', kind: 'industrial' },
        { dx: 640, dy: 70, w: 460, h: 220, label: 'БАЗА БУДМАТЕРІАЛІВ', roofColor: '#45433f', wallColor: '#5c5954', accent: '#e59a24', kind: 'industrial', searchable: true, typeLabel: 'гараж-бункер' },
        { dx: 75, dy: 440, w: 1025, h: 220, label: 'ЗАЛІЗНИЧНІ МАЙСТЕРНІ', roofColor: '#3c3b38', wallColor: '#52504c', accent: '#9b9384', kind: 'industrial' },
      ],
      pickups: [{ type: 'meme', dx: 590, dy: 365 }],
    },
    // 15: DEPOT
    {
      id: 'depot',
      name: 'Депо і Вторсировина',
      surface: 'industrial',
      buildings: [
        { dx: 75, dy: 70, w: 480, h: 220, label: 'ДЕПО ЛОКОМОТИВІВ', roofColor: '#3e3d3a', wallColor: '#54524e', accent: '#e59a24', kind: 'industrial' },
        { dx: 645, dy: 70, w: 455, h: 220, label: 'ВТОРСИРОВИНА', roofColor: '#47433c', wallColor: '#5e5950', accent: '#c96f32', kind: 'industrial', searchable: true, typeLabel: 'гараж-бункер' },
        { dx: 75, dy: 440, w: 1025, h: 220, label: 'РЕМБАЗА №7', roofColor: '#3a3936', wallColor: '#504e4a', accent: '#9b9384', kind: 'industrial' },
      ],
      pickups: [{ type: 'beer', dx: 590, dy: 365 }],
    },
  ];
}

export class GalychMap {
  constructor() {
    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;

    this.blocks = [];
    this.buildings = [];
    this.informants = [];
    this.pickupSpawns = [];
    this.pigSpawns = [];
    this.searchableDoors = [];

    this.trainZone = { x: COL_X[0] + 70, y: ROW_Y[3] + 550, w: 720, h: 145 };
    this.extractionZone = { x: COL_X[0] + 70, y: ROW_Y[3] + 360, w: 680, h: 165 };
    this.playerSpawn = { x: COL_X[0] + 410, y: ROW_Y[3] + 440 };
    this.atbQueueZone = { x: 0, y: 0, w: 400, h: 125 };

    this.activeHideout = null;
    this.berlogaDoor = { x: 0, y: 0 };

    this.randomizeCityLayout();
  }

  randomizeCityLayout() {
    const templates = getDistrictTemplates();
    const stationTpl = templates.find((t) => t.id === 'station');
    const movable = templates.filter((t) => t.id !== 'station');

    // Fisher-Yates shuffle of 15 movable districts
    for (let i = movable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movable[i], movable[j]] = [movable[j], movable[i]];
    }

    // Build slot coordinates (all 16 slots except fixed [0,3] Station)
    const freeSlots = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (col === 0 && row === 3) continue;
        freeSlots.push({ col, row });
      }
    }

    const assigned = [{ tpl: stationTpl, slot: stationTpl.fixedSlot }];
    movable.forEach((tpl, idx) => {
      assigned.push({ tpl, slot: freeSlots[idx] });
    });

    this.blocks = [];
    this.buildings = [];
    this.informants = [];
    this.pickupSpawns = [];
    this.pigSpawns = [];
    this.searchableDoors = [];
    const gardens = [];
    const bushes = [];

    for (const { tpl, slot } of assigned) {
      const bx = COL_X[slot.col];
      const by = ROW_Y[slot.row];

      const blockObj = {
        id: tpl.id,
        col: slot.col,
        row: slot.row,
        x: bx,
        y: by,
        w: BLOCK_W,
        h: BLOCK_H,
        name: tpl.name,
        surface: tpl.surface,
        isPark: Boolean(tpl.isPark),
      };
      this.blocks.push(blockObj);

      if (tpl.hasAtbQueue) {
        this.atbQueueZone = { x: bx + 380, y: by + 350, w: 400, h: 125 };
      }

      for (const b of tpl.buildings) {
        const absB = {
          x: bx + b.dx,
          y: by + b.dy,
          w: b.w,
          h: b.h,
          label: b.label,
          roofColor: b.roofColor,
          wallColor: b.wallColor,
          accent: b.accent,
          kind: b.kind,
          blockId: tpl.id,
          blockName: tpl.name,
          searchable: Boolean(b.searchable),
          typeLabel: b.typeLabel || 'будівля',
        };
        if (
          !isOnRoad(absB.x + 1, absB.y + 1, 16) &&
          !isOnRoad(absB.x + absB.w - 1, absB.y + absB.h - 1, 16) &&
          !this.buildings.some((o) => rectsOverlap(absB, o, 12))
        ) {
          this.buildings.push(absB);
          if (absB.searchable) {
            this.searchableDoors.push({
              id: `door_${this.searchableDoors.length}`,
              building: absB,
              blockId: tpl.id,
              blockName: tpl.name,
              typeLabel: absB.typeLabel,
              label: absB.label,
              x: absB.x + absB.w / 2,
              y: absB.y + absB.h + 24,
              checked: false,
              isVasya: false,
            });
          }
        }
      }

      if (tpl.gardens) {
        for (const g of tpl.gardens) {
          gardens.push({ x: bx + g.dx, y: by + g.dy, w: g.w, h: g.h });
        }
      }
      if (tpl.bushes) {
        for (const bs of tpl.bushes) {
          bushes.push({ x: bx + bs.dx, y: by + bs.dy, r: bs.r });
        }
      }
      if (tpl.informants) {
        for (const inf of tpl.informants) {
          this.informants.push({
            id: inf.id,
            name: inf.name,
            x: bx + inf.dx,
            y: by + inf.dy,
            radius: 22,
            questioned: false,
          });
        }
      }
      if (tpl.pickups) {
        for (const p of tpl.pickups) {
          this.pickupSpawns.push({ type: p.type, x: bx + p.dx, y: by + p.dy });
        }
      }
      if (tpl.pigSpawns) {
        for (const ps of tpl.pigSpawns) {
          this.pigSpawns.push({ x: bx + ps.dx, y: by + ps.dy });
        }
      }
    }

    this.props = createProps(this.buildings, this.blocks, gardens, bushes);

    // Pick random Vasya hideout among searchable doors (prefer non-adjacent to station if possible)
    const farDoors = this.searchableDoors.filter((d) => d.y < 3200 || d.x > 1800);
    const pool = farDoors.length > 0 ? farDoors : this.searchableDoors;
    const chosenDoor = pool[Math.floor(Math.random() * pool.length)];
    chosenDoor.isVasya = true;
    chosenDoor.building.isVasyaHideout = true;

    this.activeHideout = {
      id: chosenDoor.id,
      door: { x: chosenDoor.x, y: chosenDoor.y },
      blockId: chosenDoor.blockId,
      districtHint: chosenDoor.blockName,
      typeLabel: chosenDoor.typeLabel,
      buildingLabel: chosenDoor.label,
    };
    this.berlogaDoor = { ...this.activeHideout.door };
    return this.activeHideout;
  }

  getZoneName(x, y) {
    for (const blk of this.blocks) {
      if (x >= blk.x && x <= blk.x + blk.w && y >= blk.y && y <= blk.y + blk.h) {
        return blk.name;
      }
    }
    return 'Проспекти Галича';
  }

  isInAtbQueue(x, y) {
    const z = this.atbQueueZone;
    return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
  }

  isInExtractionZone(x, y) {
    const z = this.extractionZone;
    return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
  }
}
