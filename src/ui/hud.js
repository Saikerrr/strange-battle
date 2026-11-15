// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.drawFlagUA_base = function (x, y, w, h) {
    sbContext.ctx.fillStyle = "#0057b7";
    sbContext.ctx.fillRect(x, y, w, h / 2);
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.fillRect(x, y + h / 2, w, h / 2);
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.strokeRect(x, y, w, h);
  };

  sbContext.drawFlagRU_base = function (x, y, w, h) {
    sbContext.ctx.fillStyle = "#fff";
    sbContext.ctx.fillRect(x, y, w, h / 3);
    sbContext.ctx.fillStyle = "#0039a6";
    sbContext.ctx.fillRect(x, y + h / 3, w, h / 3);
    sbContext.ctx.fillStyle = "#d52b1e";
    sbContext.ctx.fillRect(x, y + (h * 2) / 3, w, h / 3);
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.strokeRect(x, y, w, h);
  };

  sbContext.drawFlagUS_base = function (x, y, w, h) {
    sbContext.ctx.fillStyle = "#b22234";
    for (let i = 0; i < 13; i++) {
      if (i % 2 === 0) sbContext.ctx.fillRect(x, y + (i * h) / 13, w, h / 13);
    }
    sbContext.ctx.fillStyle = "#3c3b6e";
    sbContext.ctx.fillRect(x, y, w * 0.4, h * 0.54);
    sbContext.ctx.fillStyle = "#fff";
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(
          x + w * 0.1 + j * w * 0.08,
          y + h * 0.1 + i * h * 0.15,
          1.5,
          0,
          Math.PI * 2,
        );
        sbContext.ctx.fill();
      }
    }
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.strokeRect(x, y, w, h);
  };

  sbContext.drawMiniPortrait_base = function (x, y, size, f) {
    const isUlt = f.ultTimer > 0;
    const c = f.colors;
    sbContext.ctx.save();
    sbContext.ctx.translate(x + size / 2, y + size / 2);
    sbContext.ctx.scale(size / 80, size / 80);

    // Голова
    sbContext.ctx.fillStyle = c.skin;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, 5, 22, 0, Math.PI * 2);
    sbContext.ctx.fill();

    // Щека
    sbContext.ctx.fillStyle = c.skinDark;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(-10, 8, 8, 0, Math.PI * 2);
    sbContext.ctx.fill();

    // Волосы
    sbContext.ctx.fillStyle = c.hair;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, -8, 22, Math.PI, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.fillRect(-22, -8, 44, 6);

    // Ухо
    sbContext.ctx.fillStyle = c.skinDark;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(-20, 5, 5, 0, Math.PI * 2);
    sbContext.ctx.fill();

    // Глаз
    if (isUlt) {
      const pulse = 0.5 + Math.sin(performance.now() / 100) * 0.5;
      sbContext.ctx.fillStyle = f.isUkraine
        ? `rgba(255,${200 + pulse * 55},0,1)`
        : `rgba(255,${30 + pulse * 100},0,1)`;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(10, 0, 5, 0, Math.PI * 2);
      sbContext.ctx.fill();
    } else {
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(10, 0, 5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#000";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(11, 0, 2.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(12, -1, 1, 0, Math.PI * 2);
      sbContext.ctx.fill();
    }

    // Бровь
    sbContext.ctx.strokeStyle = c.hair;
    sbContext.ctx.lineWidth = 2.5;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(5, -9);
    sbContext.ctx.lineTo(16, -10);
    sbContext.ctx.stroke();

    // Нос
    sbContext.ctx.strokeStyle = c.skinDark;
    sbContext.ctx.lineWidth = 1.5;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(17, 2);
    sbContext.ctx.lineTo(20, 7);
    sbContext.ctx.lineTo(16, 7);
    sbContext.ctx.stroke();

    // Рот
    sbContext.ctx.strokeStyle = "#5a2020";
    sbContext.ctx.lineWidth = 2;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(5, 18);
    sbContext.ctx.lineTo(16, 18);
    sbContext.ctx.stroke();

    // Шапка
    if (f.charType === "russia") {
      sbContext.ctx.fillStyle = "#4a3a20";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -8, 24, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillRect(-24, -8, 6, 15);
      sbContext.ctx.fillRect(18, -8, 6, 15);
      sbContext.ctx.fillStyle = "#d52b1e";
      sbContext.ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5 - Math.PI / 2;
        sbContext.ctx.lineTo(Math.cos(ang) * 6, -15 + Math.sin(ang) * 6);
      }
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
    } else if (f.charType === "ukraine") {
      sbContext.ctx.fillStyle = "#333";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -8, 24, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#0057b7";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -10, 16, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#ffd700";
      sbContext.ctx.fillRect(-18, -11, 36, 3);
    } else if (f.charType === "america") {
      sbContext.ctx.fillStyle = "#d52b1e";
      sbContext.ctx.fillRect(-18, -35, 36, 18);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.fillRect(-18, -30, 36, 5);
      sbContext.ctx.fillStyle = "#0039a6";
      sbContext.ctx.fillRect(-18, -20, 36, 5);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.fillRect(-18, -20, 36, 2);
      sbContext.ctx.fillStyle = "#d52b1e";
      sbContext.ctx.fillRect(-24, -15, 48, 5);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(-10, -17.5, 1.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -17.5, 1.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(10, -17.5, 1.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
    }

    sbContext.ctx.restore();
  };

  sbContext.drawSkillIconTop_base = function (
    x,
    y,
    key,
    icon,
    cd,
    blocked,
    size,
  ) {
    sbContext.ctx.fillStyle = "rgba(10,10,20,0.9)";
    sbContext.ctx.fillRect(x, y, size, size);
    sbContext.ctx.strokeStyle = cd > 0 ? "#444" : "#ffd700";
    sbContext.ctx.lineWidth = 2;
    sbContext.ctx.strokeRect(x, y, size, size);

    sbContext.ctx.font = size * 0.55 + "px Arial";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillStyle = "#fff";
    sbContext.ctx.fillText(icon, x + size / 2, y + size / 2 + 2);

    sbContext.ctx.font = "bold 11px Arial";
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.textBaseline = "top";
    sbContext.ctx.textAlign = "left";
    sbContext.ctx.fillText(key, x + 3, y + 3);
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";

    if (cd > 0) {
      sbContext.ctx.fillStyle = "rgba(0,0,0,0.75)";
      sbContext.ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.font = "bold " + size * 0.45 + "px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText(Math.ceil(cd), x + size / 2, y + size / 2);
    }
    if (blocked) {
      sbContext.ctx.fillStyle = "rgba(160,0,220,0.55)";
      sbContext.ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      sbContext.ctx.fillStyle = "#ff88ff";
      sbContext.ctx.font = "bold " + size * 0.45 + "px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText("🚫", x + size / 2, y + size / 2);
    }
  };

  sbContext.drawUltIcon_base = function (
    x,
    y,
    key,
    isReady,
    isCharging,
    chargeTimer,
    chargeDuration,
    size,
  ) {
    sbContext.ctx.fillStyle = "rgba(10,10,20,0.9)";
    sbContext.ctx.fillRect(x, y, size, size);

    if (isCharging) {
      const pulse = 0.5 + Math.sin(performance.now() / 100) * 0.5;
      sbContext.ctx.strokeStyle = `rgba(255,100,255,${0.5 + pulse * 0.5})`;
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.strokeRect(x, y, size, size);

      // Прогресс
      const prog = Math.min(1, chargeTimer / chargeDuration);
      sbContext.ctx.fillStyle = "rgba(255,0,255,0.3)";
      sbContext.ctx.fillRect(x + 2, y + size - 6, (size - 4) * prog, 4);
    } else if (isReady) {
      const pulse = 0.5 + Math.sin(performance.now() / 200) * 0.5;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.4 + pulse * 0.3;
      sbContext.ctx.fillStyle = "rgba(255,215,0,0.6)";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(
        x + size / 2,
        y + size / 2,
        size * 0.55,
        0,
        Math.PI * 2,
      );
      sbContext.ctx.fill();
      sbContext.ctx.restore();

      sbContext.ctx.strokeStyle = `rgba(255,215,0,${0.7 + pulse * 0.3})`;
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.strokeRect(x, y, size, size);
    } else {
      sbContext.ctx.strokeStyle = "#555";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.strokeRect(x, y, size, size);
    }

    sbContext.ctx.font = size * 0.6 + "px Arial";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillStyle = isReady ? "#ffd700" : "#888";
    sbContext.ctx.fillText("⚡", x + size / 2, y + size / 2 + 2);

    sbContext.ctx.font = "bold 11px Arial";
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.textBaseline = "top";
    sbContext.ctx.textAlign = "left";
    sbContext.ctx.fillText(key, x + 3, y + 3);
  };

  sbContext.drawTopPanel_base = function (f, side) {
    const panelW = 500;
    const panelH = 155;
    const x = side === "left" ? 20 : sbContext.W - panelW - 20;
    const y = 20;

    sbContext.ctx.save();

    // Фон
    const frameColor = f.isUkraine
      ? "#0057b7"
      : f.isAmerica
        ? "#d52b1e"
        : "#ffffff";
    sbContext.ctx.fillStyle = "rgba(15,10,25,0.92)";
    sbContext.ctx.beginPath();
    sbContext.ctx.roundRect(x, y, panelW, panelH, 10);
    sbContext.ctx.fill();

    // Рамка
    sbContext.ctx.strokeStyle = frameColor;
    sbContext.ctx.lineWidth = 3;
    sbContext.ctx.stroke();

    // Портрет
    const pSize = 110;
    const pX = side === "left" ? x + 15 : x + panelW - pSize - 15;
    const pY = y + 15;

    sbContext.ctx.fillStyle = "rgba(0,0,0,0.7)";
    sbContext.ctx.fillRect(pX, pY, pSize, pSize);
    sbContext.ctx.strokeStyle = "#ffd700";
    sbContext.ctx.lineWidth = 2;
    sbContext.ctx.strokeRect(pX, pY, pSize, pSize);

    sbContext.drawMiniPortrait(pX, pY, pSize, f);

    // Информация
    const infoX = side === "left" ? pX + pSize + 12 : x + 12;
    const infoRight = side === "left" ? x + panelW - 12 : pX - 12;
    const infoWidth = infoRight - infoX;

    // Имя
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.font = "bold 26px Impact, Arial Black, sans-serif";
    sbContext.ctx.textAlign = "left";
    sbContext.ctx.textBaseline = "top";
    sbContext.ctx.fillText(
      f.name.toUpperCase() + (f.isAI ? " [ИИ]" : ""),
      infoX,
      y + 12,
    );

    // HP бар
    const hpY = y + 48;
    const hpW = infoWidth;
    const hpH = 22;

    sbContext.ctx.fillStyle = "rgba(0,0,0,0.8)";
    sbContext.ctx.fillRect(infoX, hpY, hpW, hpH);

    const hpPct = Math.max(0, f.hp) / f.maxHp;
    const hpGrad = sbContext.ctx.createLinearGradient(infoX, 0, infoX + hpW, 0);
    hpGrad.addColorStop(0, "#33bb33");
    hpGrad.addColorStop(1, "#88ff88");
    sbContext.ctx.fillStyle = hpGrad;
    sbContext.ctx.fillRect(infoX + 2, hpY + 2, (hpW - 4) * hpPct, hpH - 4);

    sbContext.ctx.strokeStyle = "#ffd700";
    sbContext.ctx.lineWidth = 2;
    sbContext.ctx.strokeRect(infoX, hpY, hpW, hpH);

    sbContext.ctx.fillStyle = "#fff";
    sbContext.ctx.font = "bold 13px Arial";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillText(
      Math.ceil(f.hp) + " / " + f.maxHp,
      infoX + hpW / 2,
      hpY + hpH / 2,
    );

    // Статусы
    let statusY = y + 76;
    if (f.ultCharging) {
      const prog = Math.min(1, f.ultChargeTimer / f.ultChargeDuration);
      sbContext.ctx.fillStyle = "rgba(255,0,255,0.6)";
      sbContext.ctx.fillRect(infoX, statusY, hpW, 10);
      sbContext.ctx.fillStyle = "#ff66ff";
      sbContext.ctx.fillRect(infoX + 1, statusY + 1, (hpW - 2) * prog, 8);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.font = "bold 10px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText("⚡ ЗАРЯДКА УЛЬТЫ", infoX + hpW / 2, statusY + 5);
      statusY += 13;
    }
    if (f.ultTimer > 0) {
      const isZ = f.isUkraine;
      const isCap = f.isAmerica;
      const col = isZ ? "#88ff44" : isCap ? "#55aaff" : "#ff4400";
      const label = isZ
        ? "🧟 ЗОМБИ"
        : isCap
          ? "🛡 КАПИТАН АМЕРИКА"
          : "🤖 КИБОРГ";
      sbContext.ctx.fillStyle = "rgba(0,0,0,0.85)";
      sbContext.ctx.fillRect(infoX, statusY, hpW, 10);
      sbContext.ctx.fillStyle = col;
      sbContext.ctx.fillRect(
        infoX + 1,
        statusY + 1,
        (hpW - 2) * (f.ultTimer / 10),
        8,
      );
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.font = "bold 10px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText(
        label + " " + Math.ceil(f.ultTimer) + "с",
        infoX + hpW / 2,
        statusY + 5,
      );
      statusY += 13;
      if (f.isAmerica) {
        sbContext.ctx.fillStyle = "rgba(0,0,0,0.8)";
        sbContext.ctx.fillRect(infoX, statusY, hpW, 9);
        sbContext.ctx.fillStyle = f.shieldBroken ? "#666" : "#55aaff";
        sbContext.ctx.fillRect(
          infoX + 1,
          statusY + 1,
          (hpW - 2) * (f.shieldHp / 100),
          7,
        );
        sbContext.ctx.fillStyle = "#fff";
        sbContext.ctx.font = "bold 9px Arial";
        sbContext.ctx.fillText(
          "ЩИТ " + Math.ceil(f.shieldHp) + "/100",
          infoX + hpW / 2,
          statusY + 4.5,
        );
        statusY += 12;
      }
    }
    if (f.blockedTimer > 0) {
      sbContext.ctx.fillStyle = "rgba(80,0,120,0.85)";
      sbContext.ctx.fillRect(infoX, statusY, hpW, 10);
      sbContext.ctx.fillStyle = "#cc66ff";
      sbContext.ctx.fillRect(
        infoX + 1,
        statusY + 1,
        (hpW - 2) * (f.blockedTimer / 5),
        8,
      );
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.font = "bold 10px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText(
        "🚫 БЛОКИРОВКА " + Math.ceil(f.blockedTimer) + "с",
        infoX + hpW / 2,
        statusY + 5,
      );
    }

    // Скиллы
    const skills = sbContext.getPlayerSkills(f);
    const iconSize = 52;
    const iconGap = 6;
    const hasUlt = true;
    const totalIcons = skills.length + (hasUlt ? 1 : 0);

    const iconsStartX =
      side === "left"
        ? infoX
        : infoRight - totalIcons * (iconSize + iconGap) + iconGap;
    const iconsY = y + panelH - iconSize - 8;

    for (let i = 0; i < skills.length; i++) {
      const ix = iconsStartX + i * (iconSize + iconGap);
      sbContext.drawSkillIconTop(
        ix,
        iconsY,
        skills[i].key,
        skills[i].icon,
        skills[i].cd,
        f.blockedTimer > 0,
        iconSize,
      );
    }

    if (hasUlt) {
      const ultIx = iconsStartX + skills.length * (iconSize + iconGap);
      const keyLabel = f.controls.ult === "KeyR" ? "R" : "0";
      sbContext.drawUltIcon(
        ultIx,
        iconsY,
        keyLabel,
        !f.ultUsed && !f.ultCharging,
        f.ultCharging,
        f.ultChargeTimer,
        f.ultChargeDuration,
        iconSize,
      );
    }

    sbContext.ctx.restore();
  };

  sbContext.getPlayerSkills_base = function (f) {
    if (f.isUkraine) {
      return [
        {
          key: f === sbContext.p1 ? "Z" : "N1",
          icon: "🛸",
          cd: f.skillCd.drone,
        },
        {
          key: f === sbContext.p1 ? "X" : "N2",
          icon: "🚀",
          cd: f.skillCd.missile,
        },
        {
          key: f === sbContext.p1 ? "C" : "N3",
          icon: "💣",
          cd: f.skillCd.bombs,
        },
      ];
    } else if (f.isAmerica) {
      return [
        {
          key: f === sbContext.p1 ? "Z" : "N1",
          icon: "🇺🇸",
          cd: f.skillCd.flag,
        },
        {
          key: f === sbContext.p1 ? "X" : "N2",
          icon: "🦅",
          cd: f.skillCd.eagle,
        },
        {
          key: f === sbContext.p1 ? "C" : "N3",
          icon: "🍔",
          cd: f.skillCd.burger,
        },
      ];
    } else {
      return [
        {
          key: f === sbContext.p1 ? "Z" : "N1",
          icon: "🚫",
          cd: f.skillCd.blockade,
        },
        {
          key: f === sbContext.p1 ? "X" : "N2",
          icon: "🐻",
          cd: f.skillCd.bear,
        },
        {
          key: f === sbContext.p1 ? "C" : "N3",
          icon: "👊",
          cd: f.skillCd.uppercut,
        },
      ];
    }
  };

  sbContext.drawHUD_base = function () {
    sbContext.drawTopPanel(sbContext.p1, "left");
    sbContext.drawTopPanel(sbContext.p2, "right");

    // Центр — номер раунда
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.font = "bold 52px Impact, Arial Black, sans-serif";
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 8;
    sbContext.ctx.strokeText("" + sbContext.game.round, sbContext.W / 2, 55);
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.fillText("" + sbContext.game.round, sbContext.W / 2, 55);
    sbContext.ctx.font = "bold 14px Arial";
    sbContext.ctx.fillStyle = "#aaa";
    sbContext.ctx.fillText("РАУНД", sbContext.W / 2, 85);

    // Победы в раундах
    for (let i = 0; i < 2; i++) {
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(sbContext.W / 2 - 25 + i * 25, 105, 8, 0, Math.PI * 2);
      sbContext.ctx.fillStyle =
        i < sbContext.game.p1Wins ? "#ffd700" : "rgba(255,255,255,0.15)";
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#ffd700";
      sbContext.ctx.lineWidth = 1.5;
      sbContext.ctx.stroke();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(sbContext.W / 2 - 25 + i * 25, 130, 8, 0, Math.PI * 2);
      sbContext.ctx.fillStyle =
        i < sbContext.game.p2Wins ? "#ffd700" : "rgba(255,255,255,0.15)";
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#ffd700";
      sbContext.ctx.lineWidth = 1.5;
      sbContext.ctx.stroke();
    }

    // Маленькие индикаторы DASH / 2xJMP под панелями
    const drawMiniIndicator = (label, ready, x, y) => {
      sbContext.ctx.fillStyle = ready
        ? "rgba(85,255,136,0.3)"
        : "rgba(255,80,80,0.3)";
      sbContext.ctx.fillRect(x, y, 55, 18);
      sbContext.ctx.strokeStyle = ready ? "#55ff88" : "#ff5555";
      sbContext.ctx.lineWidth = 1.5;
      sbContext.ctx.strokeRect(x, y, 55, 18);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.font = "bold 11px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText(label, x + 27, y + 9);
    };

    drawMiniIndicator("DASH", sbContext.p1.dashCd <= 0, 20, 185);
    drawMiniIndicator("2xJMP", !sbContext.p1.doubleJumpUsed, 80, 185);

    drawMiniIndicator("DASH", sbContext.p2.dashCd <= 0, sbContext.W - 75, 185);
    drawMiniIndicator(
      "2xJMP",
      !sbContext.p2.doubleJumpUsed,
      sbContext.W - 135,
      185,
    );
  };

  sbContext.drawMessage_base = function () {
    if (sbContext.game.messageTimer <= 0) return;
    const elapsed =
      sbContext.game.messageMaxTimer - sbContext.game.messageTimer;
    let a = 1;
    if (elapsed < 0.15) a = elapsed / 0.15;
    else if (sbContext.game.messageTimer < 0.3)
      a = sbContext.game.messageTimer / 0.3;
    const scale = 0.6 + Math.min(1, elapsed * 4) * 0.4;
    sbContext.ctx.save();
    sbContext.ctx.globalAlpha = Math.max(0, Math.min(1, a));
    sbContext.ctx.translate(sbContext.W / 2, sbContext.H / 2 - 60);
    sbContext.ctx.scale(scale, scale);
    sbContext.ctx.font = "bold 84px Impact, Arial Black, sans-serif";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 12;
    sbContext.ctx.strokeText(sbContext.game.message, 0, 0);
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.fillText(sbContext.game.message, 0, 0);
    sbContext.ctx.restore();
  };

  sbContext.drawTopPanel_arena = function (f, side) {
    sbContext.drawTopPanel_base(f, side);
    if (f.ultCooldown > 0) {
      sbContext.ctx.save();
      const x = side === "left" ? 20 : sbContext.W - 520;
      sbContext.ctx.fillStyle = "rgba(0,0,0,.75)";
      sbContext.ctx.fillRect(x + 130, 178, 350, 15);
      sbContext.ctx.fillStyle = "#a8a8a8";
      sbContext.ctx.fillRect(x + 131, 179, 348 * (f.ultCooldown / 30), 13);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.font = "bold 10px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.fillText(
        "УЛЬТА: " + Math.ceil(f.ultCooldown) + "с",
        x + 305,
        185,
      );
      sbContext.ctx.restore();
    }
    if (f.skillHasteTimer > 0 || f.speedBoostTimer > 0) {
      sbContext.ctx.save();
      sbContext.ctx.font = "bold 12px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.fillStyle = f.skillHasteTimer > 0 ? "#d78aff" : "#ff6666";
      sbContext.ctx.fillText(
        f.skillHasteTimer > 0
          ? "МАГИЯ " + Math.ceil(f.skillHasteTimer) + "с"
          : "УСКОРЕНИЕ " + Math.ceil(f.speedBoostTimer) + "с",
        side === "left" ? 270 : sbContext.W - 270,
        198,
      );
      sbContext.ctx.restore();
    }
  };

  sbContext.drawFlagChina_interface = function (x, y, w, h) {
    sbContext.ctx.fillStyle = "#de2910";
    sbContext.ctx.fillRect(x, y, w, h);
    sbContext.ctx.fillStyle = "#ffde00";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(
      x + w * 0.22,
      y + h * 0.28,
      Math.max(2, h * 0.12),
      0,
      Math.PI * 2,
    );
    sbContext.ctx.fill();
    for (const [sx, sy] of [
      [0.43, 0.15],
      [0.52, 0.29],
      [0.52, 0.48],
      [0.43, 0.62],
    ]) {
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(
        x + w * sx,
        y + h * sy,
        Math.max(1.2, h * 0.035),
        0,
        Math.PI * 2,
      );
      sbContext.ctx.fill();
    }
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.strokeRect(x, y, w, h);
  };

  sbContext.drawMiniPortrait_interface = function (x, y, size, f) {
    sbContext.drawMiniPortrait_base(x, y, size, f);
    if (f.isChina) {
      sbContext.ctx.save();
      sbContext.ctx.translate(x + size / 2, y + size * 0.15);
      sbContext.ctx.fillStyle = "#171313";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -3, size * 0.1, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#171313";
      sbContext.ctx.lineWidth = Math.max(2, size * 0.07);
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, -3);
      sbContext.ctx.lineTo(size * 0.08, -size * 0.23);
      sbContext.ctx.stroke();
      sbContext.ctx.restore();
    }
  };
}
