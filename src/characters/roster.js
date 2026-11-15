import {
  UKRAINE_COLORS,
  RUSSIA_COLORS,
  AMERICAN_COLORS,
  CHINA_COLORS,
  JAPAN_COLORS,
  AFGHANISTAN_COLORS,
} from "../engine/colors.js";

// Selection, names, palettes and flags share this single list.
export const ROSTER = [
  {
    id: "ukraine",
    key: "u",
    name: "УКРАИНА",
    colors: UKRAINE_COLORS,
    accent: "#ffd700",
    flag: "drawFlagUA",
    teaser: "Дрон · Ракета · Бомбы",
  },
  {
    id: "russia",
    key: "r",
    name: "РОССИЯ",
    colors: RUSSIA_COLORS,
    accent: "#ff7777",
    flag: "drawFlagRU",
    teaser: "Блокада · Медведь · Балалайка",
  },
  {
    id: "america",
    key: "a",
    name: "АМЕРИКА",
    colors: AMERICAN_COLORS,
    accent: "#f25a5a",
    flag: "drawFlagUS",
    teaser: "Флаг · Орёл · Бургер",
  },
  {
    id: "china",
    key: "c",
    name: "КИТАЙ",
    colors: CHINA_COLORS,
    accent: "#ffcf3c",
    flag: "drawFlagChina",
    teaser: "Доширак · Фейерверк · Фонарь",
  },
  {
    id: "japan",
    key: "j",
    name: "ЯПОНИЯ",
    colors: JAPAN_COLORS,
    accent: "#ff5566",
    flag: "drawFlagJapan",
    teaser: "Рывок · Парирование · Астрал",
  },
  {
    id: "afghanistan",
    key: "f",
    name: "АФГАНИСТАН",
    colors: AFGHANISTAN_COLORS,
    accent: "#4aff9a",
    flag: "drawFlagAfghanistan",
    teaser: "C4 · Автомат · Сетка",
  },
];

export function applySelections(g) {
  for (const [fighter, id] of [
    [g.p1, g.selections.p1],
    [g.p2, g.selections.p2],
  ]) {
    const character = ROSTER.find((c) => c.id === id) || ROSTER[0];
    fighter.charType = character.id;
    fighter.isUkraine = character.id === "ukraine";
    fighter.isAmerica = character.id === "america";
    fighter.isChina = character.id === "china";
    fighter.isJapan = character.id === "japan";
    fighter.isAfghanistan = character.id === "afghanistan";
    fighter.colors = character.colors;
    fighter.name = character.name;
    fighter.trainingDummy = false;
    fighter.trainingBlock = false;
  }
  g.p1.isAI = false;
  g.p2.isAI = g.game.mode === "pve";
}
