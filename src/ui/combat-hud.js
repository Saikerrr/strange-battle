import { drawSkillArt, skillArt } from "./skill-art.js";

export function register(g) {
  function card(x, y, size, kind, key, cd, blocked = false) {
    const { ctx } = g;
    ctx.fillStyle = "#080b12";
    ctx.fillRect(x - 3, y - 3, size + 6, size + 6);
    drawSkillArt(ctx, x, y, size, kind);
    ctx.strokeStyle = blocked ? "#84505b" : cd > 0 ? "#4d5162" : "#928092";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    if (cd > 0 || blocked) {
      ctx.fillStyle = "#060914b8";
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = "#d7c3ce";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(blocked ? "×" : Math.ceil(cd), x + size / 2, y + size * 0.6);
    }
    if (key) {
      ctx.fillStyle = "#0a0b13d9";
      ctx.fillRect(x, y, 27, 17);
      ctx.fillStyle = "#d7c5cc";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(key, x + 3, y + 12);
    }
  }
  function panel(f, x) {
    const { ctx } = g,
      y = 18,
      w = 565,
      h = 185;
    const metal = ctx.createLinearGradient(x, y, x, y + h);
    metal.addColorStop(0, "#34313a");
    metal.addColorStop(0.2, "#171821");
    metal.addColorStop(1, "#0b0d15");
    ctx.fillStyle = metal;
    ctx.strokeStyle = "#68616c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 9);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#39343f";
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 13, y + 28, 100, 137);
    ctx.clip();
    ctx.fillStyle = "#1b202a";
    ctx.fillRect(x + 13, y + 28, 100, 137);
    // Render the same fighter's upper body, with its current expression and form.
    ctx.translate(x + 63, y + (f.isAfghanistan ? 230 : 200));
    const portraitScale =
      f.ultTimer > 0 &&
      !f.isAmerica &&
      !f.isAfghanistan &&
      !f.isChina &&
      !f.isJapan
        ? 0.58
        : 0.96;
    ctx.scale(portraitScale, portraitScale);
    ctx.translate(-f.x, -f.y);
    g.drawFighter(f);
    ctx.restore();
    ctx.strokeStyle = "#74606e";
    ctx.strokeRect(x + 13, y + 28, 100, 137);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 21px Impact,Arial";
    ctx.fillStyle = "#d7c3bf";
    ctx.fillText(f.trainingDummy ? "МАНЕКЕН" : f.name, x + 128, y + 26);
    const barX = x + 128,
      barY = y + 40,
      barW = 420;
    ctx.fillStyle = "#080b10";
    ctx.fillRect(barX, barY, barW, 23);
    const green = ctx.createLinearGradient(0, barY, 0, barY + 23);
    green.addColorStop(0, "#679e58");
    green.addColorStop(1, "#2e623e");
    ctx.fillStyle = green;
    ctx.fillRect(
      barX + 1,
      barY + 1,
      (barW - 2) * Math.max(0, f.hp / f.maxHp),
      21,
    );
    ctx.strokeStyle = "#78716c";
    ctx.strokeRect(barX, barY, barW, 23);
    ctx.fillStyle = "#e1ddd0";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      Math.ceil(Math.max(0, f.hp)) + " / " + f.maxHp,
      barX + barW / 2,
      barY + 16,
    );
    const skills = f.trainingDummy
      ? [{ key: "N1", cd: 0 }]
      : g.getPlayerSkills(f);
    skills.forEach((s, i) =>
      card(
        barX + i * 73,
        y + 77,
        62,
        f.trainingDummy ? "punch" : skillArt(f, i),
        s.key,
        s.cd,
        f.blockedTimer > 0,
      ),
    );
    const charge = f.ultCharging
      ? Math.max(0, f.ultChargeDuration - f.ultChargeTimer)
      : f.ultCooldown || 0;
    if (!f.trainingDummy)
      card(
        barX + 219,
        y + 77,
        62,
        {
          ukraine: "aura",
          russia: "armor",
          america: "shield",
          china: "fire",
          japan: "katana",
          afghanistan: "minigun",
        }[f.charType] || "ultimate",
        f === g.p1 ? "R" : "0",
        charge,
      );
    if (f.ultTimer > 0) {
      ctx.fillStyle = "#9d74bc";
      ctx.fillRect(barX, y + 66, barW * Math.min(1, f.ultTimer / 10), 4);
      const passive = f.isUkraine
        ? "aura"
        : f.charType === "russia"
          ? "armor"
          : f.isAmerica
            ? "shield"
            : f.isJapan
              ? "ghost"
              : null;
      if (passive) {
        card(barX + 302, y + 84, 48, passive, null, 0);
        ctx.fillStyle = "#a98aaf";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("ПАССИВНО", barX + 326, y + 148);
      }
    }
    ctx.font = "11px Arial";
    ctx.fillStyle = "#a99aa9";
    ctx.textAlign = "left";
    ctx.fillText(
      "ДЭШ " +
        (f.dashCd > 0 ? Math.ceil(f.dashCd) + "с" : "ГОТОВ") +
        "    ПРЫЖОК " +
        (f.doubleJumpUsed ? "1/2" : "2/2"),
      barX,
      y + 170,
    );
    if (f.ultTimer > 0) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#c19bd2";
      ctx.fillText("УЛЬТА " + Math.ceil(f.ultTimer) + "с", x + w - 18, y + 170);
    }
  }
  g.drawHUD = () => {
    const { ctx, W } = g;
    ctx.save();
    panel(g.p1, 18);
    panel(g.p2, W - 583);
    ctx.textAlign = "center";
    ctx.fillStyle = "#cfb6bd";
    ctx.font = "bold 42px Impact,Arial";
    ctx.fillText(g.game.round, W / 2, 61);
    ctx.font = "12px Arial";
    ctx.fillStyle = "#9d8c9e";
    ctx.fillText("РАУНД", W / 2, 82);
    for (const [row, wins] of [
      [0, g.game.p1Wins],
      [1, g.game.p2Wins],
    ])
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i < wins ? "#b48aaf" : "#272331";
        ctx.strokeStyle = "#796477";
        ctx.beginPath();
        ctx.arc(W / 2 - 14 + i * 28, 108 + row * 24, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    ctx.restore();
  };
}
