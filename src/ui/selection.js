import { ROSTER } from "../characters/roster.js";

export function register(g) {
  g.sbName = (id) => ROSTER.find((c) => c.id === id)?.name || "ПЕРСОНАЖ";
  g.drawSelectPanel = function (x, y, label, current, ids, hint) {
    const { ctx } = g,
      w = 400;
    ctx.fillStyle = "rgba(255,255,255,.04)";
    ctx.fillRect(x, y, w, 550);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, 550);
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#ffd700";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, x + 16, y + 10);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#888";
    ctx.textAlign = "right";
    ctx.fillText(hint, x + w - 18, y + 18);
    ROSTER.forEach((c, i) => {
      const cx = x + 12,
        cy = y + 42 + i * 74,
        cw = w - 24,
        ch = 74,
        selected = current === c.id;
      ctx.fillStyle = selected
        ? "rgba(255,215,0,.15)"
        : "rgba(255,255,255,.035)";
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = selected ? "#ffd700" : "rgba(255,255,255,.22)";
      ctx.lineWidth = selected ? 3 : 1.5;
      ctx.strokeRect(cx, cy, cw, ch);
      g[c.flag](cx + 10, cy + 8, 40, 24);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "bold 20px Impact,Arial Black,sans-serif";
      ctx.fillStyle = c.accent;
      ctx.fillText(c.name, cx + 60, cy + 20);
      ctx.font = "11px Arial";
      ctx.fillStyle = "#ddd";
      ctx.fillText(c.teaser, cx + 12, cy + 54);
      const side = label === "P1" ? "p1" : "p2";
      g.buttons[side + c.key] = { x: cx, y: cy, w: cw, h: ch, charId: c.id };
      const qx = cx + cw - 26,
        qy = cy + 4;
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillRect(qx, qy, 20, 20);
      ctx.strokeStyle = "#e6d18a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(qx, qy, 20, 20);
      ctx.fillStyle = "#ffe28a";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("?", qx + 10, qy + 10);
      g.buttons["info_" + label + "_" + c.id] = {
        x: qx,
        y: qy,
        w: 20,
        h: 20,
        side: label,
        charId: c.id,
      };
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px Arial";
    ctx.fillText("Выбрано: " + g.sbName(current), x + w / 2, y + 528);
  };
  g.handleClick = function (x, y) {
    const hit = (id) => g.hitBtn(id, x, y),
      { game } = g;
    if (game.state === "paused") {
      if (hit("pause_continue")) game.state = game.pausedFrom || "fighting";
      else if (hit("pause_select")) g.goToSelect();
      else if (hit("pause_title")) g.goToTitle();
      else return;
      game.pausedFrom = null;
      game.infoPanel = null;
      return;
    }
    if (game.state === "select") {
      if (game.infoPanel) {
        game.infoPanel = null;
        return;
      }
      // Small info buttons overlap their cards and must be checked first.
      for (const [id, b] of Object.entries(g.buttons))
        if (id.startsWith("info_") && hit(id)) {
          game.infoPanel = { side: b.side, charId: b.charId };
          return;
        }
      for (const side of ["p1", "p2"])
        for (const c of ROSTER)
          if (hit(side + c.key)) {
            g.selections[side] = c.id;
            return;
          }
      if (game.mode === "pve")
        for (const d of Object.keys(g.DIFFICULTY_CFG))
          if (hit("diff_" + d)) {
            game.difficulty = d;
            return;
          }
      if (hit("start")) g.goToControls();
      else if (hit("back")) g.goToTitle();
      return;
    }
    if (game.state === "title") {
      for (const mode of ["pvp", "pve", "practice"])
        if (hit("play_" + mode)) {
          game.mode = mode;
          g.goToSelect();
          return;
        }
    } else if (game.state === "controls") {
      if (hit("start_match")) g.startMatch();
      else if (hit("back_select")) g.goToSelect();
    } else if (game.state === "matchEnd") g.goToSelect();
    else if (
      game.state === "fighting" &&
      game.mode === "practice" &&
      hit("practice_add")
    ) {
      const dx = Math.max(
        g.ARENA_LEFT + 80,
        Math.min(g.ARENA_RIGHT - 80, g.p1.x + g.p1.facing * 230),
      );
      const dummy = new g.Fighter(
        dx,
        -g.p1.facing,
        "russia",
        "МАНЕКЕН",
        g.P2_CONTROLS,
      );
      g.sbConfigureDummy(dummy);
      g.practiceDummies.push(dummy);
      g.sbSparkText(dx, g.GROUND_Y - 180, "МАНЕКЕН +200 HP", "#bfeaff");
    }
  };
  g.handleEnter = function () {
    if (g.game.infoPanel) {
      g.game.infoPanel = null;
      return;
    }
    if (g.game.state === "select") g.goToControls();
    else if (g.game.state === "controls") g.startMatch();
    else if (g.game.state === "matchEnd") g.goToSelect();
  };
}
