// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.button_base = function (
    x,
    y,
    w,
    h,
    id,
    label,
    color = "#ffd700",
    bg = "rgba(0,0,0,0.5)",
  ) {
    sbContext.ctx.fillStyle = bg;
    sbContext.ctx.fillRect(x, y, w, h);
    sbContext.ctx.strokeStyle = color;
    sbContext.ctx.lineWidth = 3;
    sbContext.ctx.strokeRect(x, y, w, h);
    sbContext.ctx.fillStyle = color;
    sbContext.ctx.font = "bold 28px Impact, Arial Black, sans-serif";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillText(label, x + w / 2, y + h / 2);
    sbContext.buttons[id] = { x, y, w, h };
  };

  sbContext.drawCharCard_base = function (x, y, w, h, charId, selected, btnId) {
    const isUA = charId === "ukraine";
    const isAM = charId === "america";
    const borderColor = selected ? "#ffd700" : "rgba(255,255,255,0.2)";
    sbContext.ctx.fillStyle = selected
      ? "rgba(255,215,0,0.15)"
      : "rgba(255,255,255,0.03)";
    sbContext.ctx.fillRect(x, y, w, h);
    sbContext.ctx.strokeStyle = borderColor;
    sbContext.ctx.lineWidth = selected ? 4 : 2;
    sbContext.ctx.strokeRect(x, y, w, h);

    if (isUA) sbContext.drawFlagUA(x + 15, y + 15, 60, 40);
    else if (isAM) sbContext.drawFlagUS(x + 15, y + 15, 60, 40);
    else sbContext.drawFlagRU(x + 15, y + 15, 60, 40);

    sbContext.ctx.fillStyle = isUA ? "#ffd700" : isAM ? "#d52b1e" : "#ff4444";
    sbContext.ctx.font = "bold 28px Impact, Arial Black, sans-serif";
    sbContext.ctx.textAlign = "left";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillText(
      isUA ? "УКРАИНА" : isAM ? "АМЕРИКА" : "РОССИЯ",
      x + 90,
      y + 35,
    );

    sbContext.ctx.font = "13px Arial";
    sbContext.ctx.fillStyle = "#ddd";
    if (isUA) {
      sbContext.ctx.fillText(
        "🛸 Дрон · 🚀 Джавелин · 💣 Бомбы",
        x + 20,
        y + 75,
      );
      sbContext.ctx.fillStyle = "#88ff44";
      sbContext.ctx.fillText("УЛЬТ: призыв молнии и зомби", x + 20, y + 100);
      sbContext.ctx.fillStyle = "#aaa";
      sbContext.ctx.fillText("+20% max HP · Иммунитет", x + 20, y + 122);
    } else if (isAM) {
      sbContext.ctx.fillText("🇺🇸 Флаг · 🦅 Ястреб · 🍔 Бургер", x + 20, y + 75);
      sbContext.ctx.fillStyle = "#aaa";
      sbContext.ctx.fillText(
        "Флаг 12 dmg + кровотечение (10с)",
        x + 20,
        y + 100,
      );
      sbContext.ctx.fillStyle = "#aaa";
      sbContext.ctx.fillText(
        "Бургер лечит 15 HP (3 тика, 15с)",
        x + 20,
        y + 122,
      );
    } else {
      sbContext.ctx.fillText(
        "🚫 Блокировка · 🐻 Медведь · 👊 Апперкот",
        x + 20,
        y + 75,
      );
      sbContext.ctx.fillStyle = "#ff8844";
      sbContext.ctx.fillText("УЛЬТ: Взрыв 15 dmg + стан", x + 20, y + 100);
      sbContext.ctx.fillStyle = "#aaa";
      sbContext.ctx.fillText("-50% урона · откидывает", x + 20, y + 122);
    }

    sbContext.buttons[btnId] = { x, y, w, h, charId };
  };

  sbContext.hitBtn_base = function (id, sx, sy) {
    const b = sbContext.buttons[id];
    if (!b) return false;
    return sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h;
  };

  sbContext.sbDescription_interface = function (id) {
    if (id === "ukraine")
      return {
        skills: [
          [
            "Z · ДРОН",
            "Дрон преследует противника и стреляет автоматическими снарядами по 3 урона. Во время ульты в конце дополнительно взрывается рядом с целью и наносит 12 урона.",
          ],
          [
            "X · РАКЕТА",
            "Самонаводящаяся ракета наносит 20 урона при попадании.",
          ],
          [
            "C · БОМБАРДИРОВКА",
            "С неба падают 5 бомб. Каждая наносит 15 урона при попадании.",
          ],
        ],
        ult: "На 10 секунд Украина превращается в зомби-форму: получает прибавку к максимальному здоровью и выпускает вокруг себя волны, повреждающие близкого противника.",
      };
    if (id === "russia")
      return {
        skills: [
          [
            "Z · БЛОКАДА",
            "Быстрый снаряд наносит 5 урона. Во время ульты попадание запускает серию коротких оглушений.",
          ],
          [
            "X · МЕДВЕДЬ",
            "Медведь хватает противника, тащит его и кусает. Захват удерживает врага; обычная атака наносит примерно 20 урона за полный захват.",
          ],
          [
            "C · АППЕРКОТ",
            "Мощный удар подбрасывает противника и наносит 14 урона.",
          ],
        ],
        ult: "На 10 секунд Россия превращается в киборга: получает усиленную форму и повышенную стойкость к входящему урону, а ультимативный удар отбрасывает противника.",
      };
    if (id === "america")
      return {
        skills: [
          [
            "Z · ФЛАГ",
            "Флаг летит по прямой, наносит 12 урона и накладывает кровотечение.",
          ],
          [
            "X · ОРЁЛ",
            "Орёл пикирует на противника и наносит 10 урона при атаке.",
          ],
          [
            "C · БУРГЕР",
            "Восстанавливает до 15 здоровья тремя порциями по 5 HP.",
          ],
        ],
        ult: "На 10 секунд Америка становится Капитаном: получает щит, возможность летать и особую защиту.",
      };
    return {
      skills: [
        [
          "Z / X / C · ПОКА НЕТ",
          "Навыки персонажа ещё не добавлены. Китай пока находится в реестре и доступен для выбора как тестовая модель.",
        ],
      ],
      ult: "Ультимейт будет разработан позже.",
    };
  };

  sbContext.sbDrawInfoPanel_interface = function () {
    const info = sbContext.game.infoPanel,
      data = sbContext.sbDescription(info.charId);
    const x = info.side === "P1" ? 15 : sbContext.W - 435,
      y = 235,
      w = 420,
      h = 500;
    sbContext.ctx.save();
    sbContext.ctx.fillStyle = "rgba(5,8,18,.97)";
    sbContext.ctx.fillRect(x, y, w, h);
    sbContext.ctx.strokeStyle = info.charId === "china" ? "#ffcf3c" : "#ffd45c";
    sbContext.ctx.lineWidth = 3;
    sbContext.ctx.strokeRect(x, y, w, h);
    sbContext.ctx.fillStyle = "#ffd45c";
    sbContext.ctx.font = "bold 24px Arial";
    sbContext.ctx.textAlign = "left";
    sbContext.ctx.textBaseline = "top";
    sbContext.ctx.fillText(
      sbContext.sbName(info.charId) + " · СПОСОБНОСТИ",
      x + 18,
      y + 18,
    );
    sbContext.ctx.fillStyle = "#fff";
    sbContext.ctx.font = "bold 15px Arial";
    let yy = y + 62;
    const wrap = (str, max = 48) => {
      const words = str.split(" "),
        lines = [];
      let line = "";
      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (test.length > max && line) {
          lines.push(line);
          line = word;
        } else line = test;
      }
      if (line) lines.push(line);
      return lines;
    };
    for (const skill of data.skills) {
      sbContext.ctx.fillStyle = "#ffd45c";
      sbContext.ctx.font = "bold 15px Arial";
      sbContext.ctx.fillText(skill[0], x + 18, yy);
      yy += 23;
      sbContext.ctx.fillStyle = "#e7e7e7";
      sbContext.ctx.font = "13px Arial";
      for (const line of wrap(skill[1], 49)) {
        sbContext.ctx.fillText(line, x + 18, yy);
        yy += 18;
      }
      yy += 15;
    }
    sbContext.ctx.fillStyle = "#8fd4ff";
    sbContext.ctx.font = "bold 15px Arial";
    sbContext.ctx.fillText("УЛЬТИМЕЙТ", x + 18, yy);
    yy += 23;
    sbContext.ctx.fillStyle = "#e7e7e7";
    sbContext.ctx.font = "13px Arial";
    for (const line of wrap(data.ult, 49)) {
      sbContext.ctx.fillText(line, x + 18, yy);
      yy += 18;
    }
    sbContext.ctx.fillStyle = "#ffcf3c";
    sbContext.ctx.font = "bold 15px Arial";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.fillText(
      "НАЖМИ ? ЕЩЁ РАЗ ИЛИ КЛИКНИ ВНЕ ПАНЕЛИ",
      x + w / 2,
      y + h - 20,
    );
    sbContext.ctx.restore();
  };

  sbContext.sbDrawPauseMenu_interface = function () {
    sbContext.ctx.save();
    sbContext.ctx.fillStyle = "rgba(0,0,0,.78)";
    sbContext.ctx.fillRect(0, 0, sbContext.W, sbContext.H);
    sbContext.ctx.fillStyle = "#ffd45c";
    sbContext.ctx.font = "bold 56px Impact,Arial Black,sans-serif";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillText("ПАУЗА", sbContext.W / 2, sbContext.H / 2 - 220);
    sbContext.button(
      sbContext.W / 2 - 190,
      sbContext.H / 2 - 125,
      380,
      68,
      "pause_continue",
      "▶ ПРОДОЛЖИТЬ",
      "#55ff88",
      "rgba(0,45,0,.75)",
    );
    sbContext.button(
      sbContext.W / 2 - 190,
      sbContext.H / 2 - 35,
      380,
      68,
      "pause_select",
      "ВЫБОР ПЕРСОНАЖЕЙ",
      "#ffd45c",
      "rgba(45,35,0,.75)",
    );
    sbContext.button(
      sbContext.W / 2 - 190,
      sbContext.H / 2 + 55,
      380,
      68,
      "pause_title",
      "В ГЛАВНОЕ МЕНЮ",
      "#ff7777",
      "rgba(45,0,0,.75)",
    );
    sbContext.ctx.fillStyle = "#aaa";
    sbContext.ctx.font = "15px Arial";
    sbContext.ctx.fillText(
      "ESC — продолжить",
      sbContext.W / 2,
      sbContext.H / 2 + 165,
    );
    sbContext.ctx.restore();
  };
}
