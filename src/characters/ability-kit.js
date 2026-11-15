// Abilities keep their existing country handlers; the draft only routes slots.
const rows = [
  [
    "ukraine",
    "drone",
    "Дрон",
    "drone",
    8,
    100,
    1400,
    "Дрон преследует врага и стреляет снарядами по 3 урона.",
  ],
  [
    "ukraine",
    "missile",
    "Ракета",
    "missile",
    10,
    150,
    1400,
    "Самонаводящаяся ракета: 20 урона.",
  ],
  [
    "ukraine",
    "bombs",
    "Бомбардировка",
    "bomb",
    10,
    0,
    650,
    "Пять падающих бомб, по 15 урона за попадание.",
  ],
  [
    "russia",
    "blockade",
    "Блокада",
    "blockade",
    8,
    100,
    1000,
    "Снаряд блокирует способности противника и наносит 5 урона.",
  ],
  [
    "russia",
    "bear",
    "Медведь",
    "bear",
    12,
    70,
    650,
    "Медведь хватает противника и уносит его.",
  ],
  [
    "russia",
    "uppercut",
    "Балалайка",
    "balalaika",
    6,
    0,
    140,
    "Замах 0,5 с, затем удар на 15 урона.",
  ],
  [
    "america",
    "flag",
    "Флаг",
    "flag",
    10,
    120,
    1100,
    "Бросок флага: 12 урона при попадании.",
  ],
  [
    "america",
    "eagle",
    "Орёл",
    "eagle",
    7,
    80,
    1400,
    "Хищная птица пикирует на противника.",
  ],
  [
    "america",
    "burger",
    "Бургер",
    "burger",
    15,
    0,
    3500,
    "Восстанавливает здоровье тремя порциями.",
  ],
  [
    "china",
    "noodle",
    "Доширак",
    "noodles",
    15,
    80,
    700,
    "Первое нажатие достаёт лапшу. Следующие пять выпускают заряды; затем КД 15 с.",
  ],
  [
    "china",
    "firework",
    "Фейерверк",
    "firework",
    5,
    100,
    1000,
    "Взрыв на 10 урона, радиус 180.",
  ],
  [
    "china",
    "lantern",
    "Фонарь",
    "lantern",
    10,
    0,
    650,
    "Фонарь 4 с атакует противника в радиусе 300.",
  ],
  [
    "japan",
    "stance",
    "Рывок",
    "katana",
    10,
    80,
    600,
    "Подготовка 0,5 с, рывок сквозь врага: 15 урона.",
  ],
  [
    "japan",
    "parry",
    "Парирование",
    "parry",
    15,
    0,
    180,
    "Двуручная стойка отражает ближний удар: 20 урона и стан атакующему.",
  ],
  [
    "japan",
    "astral",
    "Астрал",
    "smoke",
    10,
    0,
    3500,
    "Временная неуязвимость и лечение. Повторное нажатие завершает астрал.",
  ],
  [
    "afghanistan",
    "c4",
    "C4",
    "bomb",
    5,
    60,
    600,
    "Удерживай для дальнего броска. До пяти бомб. Q / Num7 подрывает свои: по 15 урона врагу, обоим толчок.",
  ],
  [
    "afghanistan",
    "rifle",
    "Автомат",
    "rifle",
    8,
    100,
    1000,
    "Быстрая очередь: 5 патронов по 5 урона. Урон прерывает стрельбу.",
  ],
  [
    "afghanistan",
    "net",
    "Сетка",
    "net",
    10,
    50,
    800,
    "Попадание удерживает врага на месте 2 с. Атаковать и защищаться он может.",
  ],
];
export const ABILITIES = rows.map(
  ([country, key, name, art, cd, minRange, maxRange, text], i) => ({
    id: country + "." + key,
    country,
    key,
    name,
    art,
    cd,
    minRange,
    maxRange,
    text,
    index: i % 3,
  }),
);
export const abilityById = (id) => ABILITIES.find((a) => a.id === id);
export function hasSkills(f, country) {
  if (f.trainingDummy) return false;
  return f.draftLoadout && f.ultTimer <= 0
    ? f.draftLoadout.some((id) => abilityById(id)?.country === country)
    : f.charType === country;
}
export function updatesSkills(f, country) {
  return (
    f.charType === country ||
    f.draftLoadout?.some((id) => abilityById(id)?.country === country)
  );
}
export function skillDown(f, country, index) {
  if (!hasSkills(f, country)) return false;
  const slot =
    f.draftLoadout && f.ultTimer <= 0
      ? f.draftLoadout.findIndex((id) => {
          const a = abilityById(id);
          return a?.country === country && a.index === index;
        })
      : index;
  return slot >= 0 && f.isDown(f.controls["skill" + (slot + 1)]);
}
export function abilityCooldown(f, a) {
  const field = {
    stance: "japanStanceCd",
    parry: "japanParryCd",
    astral: "japanAstralCd",
    c4: "afghanC4Cd",
    rifle: "afghanRifleCd",
    net: "afghanNetCd",
    firework: "fireworkCd",
    lantern: "lanternCd",
  }[a.key];
  return (field ? f[field] : f.skillCd?.[a.key]) || 0;
}
const ultRows = {
  ukraine: [
    ["Ультра-дрон", "Дрон стреляет, затем взрывается у цели на 12 урона."],
    [
      "Две ракеты",
      "Две самонаводящиеся ракеты по 20 урона; попадания лечат владельца.",
    ],
    ["Надгробие", "Создаёт надгробие, выпускающее мини-зомби."],
  ],
  russia: [
    ["Ультра-блокада", "Усиленный блокирующий снаряд."],
    ["Ультра-медведь", "Медведь хватает и уносит врага."],
    ["Бомба", "Самонаводящаяся падающая бомба: 15 урона."],
  ],
  america: [
    ["Ультра-флаг", "Увеличенный снаряд-флаг."],
    ["Два орла", "Две крупные птицы атакуют с разных сторон."],
    ["Щит-бумеранг", "12 урона. Щит возвращается сразу после столкновения."],
  ],
  china: [
    ["Дыхание", "Огонь перед драконом: 15 урона и поджог."],
    ["Хвост", "Удар вокруг дракона: 12 урона и оглушение."],
    [
      "Захват",
      "Управляемый полёт: 10 при захвате, 15 при взрыве в пасти. КД 10 с.",
    ],
  ],
  japan: [
    ["Призрачный рывок", "Рывок с дополнительной призрачной копией."],
    ["Призрачное парирование", "Парирование с дополнительной атакой копии."],
    ["Призрачный астрал", "Неуязвимость, движение и усиленное лечение."],
  ],
  afghanistan: [
    ["Гранатный хаос", "За 2 с разбрасывает 12 гранат по 10 урона."],
    ["Миниган", "15 выстрелов по 2 урона за 1,5 с."],
    ["Самолёт", "Пикирующий самолёт: 30 урона. Один вызов за ульту."],
  ],
};
export function skillInfo(g, f, index) {
  if (f.trainingDummy)
    return {
      name: "Удар манекена",
      text: "Num1: обычный удар. Манекен неподвижен.",
    };
  if (f.ultTimer > 0) {
    const [name, text] = ultRows[f.charType][index];
    return { name, text };
  }
  return f.draftLoadout
    ? abilityById(f.draftLoadout[index])
    : ABILITIES.find((a) => a.country === f.charType && a.index === index);
}
export function passiveInfo(f) {
  if (!(f.ultTimer > 0)) return null;
  if (f.isUkraine)
    return {
      art: "aura",
      name: "Аура зомби",
      text: "Каждые 0,6 с наносит 4 урона врагу в радиусе 320. Работает автоматически.",
    };
  if (f.isAmerica)
    return {
      art: "shield",
      name: "Защитный щит",
      text: "Щит при блоке поглощает до 100 урона; входящий урон снижен вдвое. Полёт: прыжок — вверх, блок — вниз.",
    };
  if (f.isJapan)
    return {
      art: "ghost",
      name: "Призрачные копии",
      text: "Навыки создают атакующие копии; астрал лечит сильнее. Ультформа уменьшает входящий урон вдвое.",
    };
  if (f.charType === "russia" || f.isChina)
    return {
      art: "armor",
      name: "Стойкость ультформы",
      text: "Входящий урон уменьшен на 50% на время ульты.",
    };
  return null;
}
