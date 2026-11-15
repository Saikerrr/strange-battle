import { ROSTER } from "../characters/roster.js";

export function register(g) {
  g.drawControlsPanel = function (x, y, w, label, id) {
    const c = ROSTER.find((c) => c.id === id),
      { ctx } = g,
      first = label === "P1";
    ctx.fillStyle = "rgba(255,255,255,.04)";
    ctx.fillRect(x, y, w, 570);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, 570);
    g[c.flag](x + 15, y + 15, 50, 30);
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#ffd700";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label + " · " + c.name, x + 80, y + 30);
    const skills = c.teaser.split(" · ");
    const rows = [
      [first ? "W A S D" : "Стрелки", "движение / прыжок / блок"],
      [
        first ? "W повторно в воздухе" : "↑ повторно в воздухе",
        "двойной прыжок",
      ],
      [first ? "Shift LEFT" : "Shift RIGHT", "дэш"],
      [
        first ? "F" : "Num4 / ,",
        id === "afghanistan" ? "пистолет" : "удар кулаком",
      ],
      [first ? "G" : "Num5 / .", "удар ногой"],
      [first ? "H" : "Num6 / /", "сильный удар"],
      [first ? "Z" : "Num1 / 1", skills[0]],
      [first ? "X" : "Num2 / 2", skills[1]],
      [first ? "C" : "Num3 / 3", skills[2]],
      [
        first ? "R" : "Num0 / 0",
        "ультимейт: зарядка " + (id === "america" ? "4" : "2") + " с",
      ],
    ];
    rows.forEach(([key, text], i) => {
      const yy = y + 78 + i * 47;
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 15px Arial";
      ctx.fillText(key, x + 20, yy);
      ctx.fillStyle = "#ddd";
      ctx.font = "13px Arial";
      ctx.fillText(text, x + 20, yy + 19);
    });
  };
  g.drawControlsScreen = function () {
    const { ctx, W, H, game } = g;
    for (const key of Object.keys(g.buttons)) delete g.buttons[key];
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "bold 50px Impact,Arial Black,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("УПРАВЛЕНИЕ", W / 2, 60);
    if (game.mode === "pve") {
      g.drawControlsPanel(W / 2 - 460, 130, 420, "P1", g.selections.p1);
      ctx.fillStyle = "#55ff88";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("P2 УПРАВЛЯЕТСЯ ИИ", W / 2 + 250, 300);
      ctx.fillStyle = "#aaa";
      ctx.font = "16px Arial";
      ctx.fillText(
        "Ваш противник: " + g.sbName(g.selections.p2),
        W / 2 + 250,
        340,
      );
    } else if (game.mode === "practice") {
      g.drawControlsPanel(W / 2 - 210, 130, 420, "P1", g.selections.p1);
    } else {
      g.drawControlsPanel(W / 2 - 460, 130, 420, "P1", g.selections.p1);
      g.drawControlsPanel(W / 2 + 40, 130, 420, "P2", g.selections.p2);
    }
    ctx.textAlign = "center";
    ctx.font = "15px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText(
      game.mode === "practice"
        ? "ПОЛИГОН: манекены по 200 HP · + — добавить манекен"
        : "ESC — пауза · ENTER — начать матч",
      W / 2,
      730,
    );
    g.button(
      W / 2 - 180,
      760,
      360,
      65,
      "start_match",
      "▶ В БОЙ!",
      "#55ff88",
      "rgba(0,50,0,.6)",
    );
    g.button(
      W / 2 - 100,
      845,
      200,
      48,
      "back_select",
      "← НАЗАД",
      "#ff5555",
      "rgba(50,0,0,.5)",
    );
  };
}
