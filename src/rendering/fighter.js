export function register(sbContext) {
  sbContext.drawLimb_base = function (x1, y1, x2, y2, w, color, darkColor) {
    const dx = x2 - x1,
      dy = y2 - y1,
      len = Math.hypot(dx, dy);
    if (len < 0.5) return;
    const ang = Math.atan2(dy, dx);
    sbContext.ctx.save();
    sbContext.ctx.translate(x1, y1);
    sbContext.ctx.rotate(ang);
    const g = sbContext.ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    g.addColorStop(0, darkColor);
    g.addColorStop(0.5, color);
    g.addColorStop(1, darkColor);
    sbContext.ctx.fillStyle = g;
    sbContext.ctx.beginPath();
    sbContext.ctx.roundRect(0, -w / 2, len, w, w / 2);
    sbContext.ctx.fill();
    sbContext.ctx.restore();
  };

  sbContext.drawFighter_base = function (f) {
    const t = f.animTime || 0;
    const isUlt = f.ultTimer > 0;
    const isZombie = isUlt && f.isUkraine;
    const isCyborg = isUlt && !f.isUkraine && !f.isAmerica && !f.isChina;
    const isPatriot = isUlt && f.isAmerica;
    const isBlocked = f.blockedTimer > 0;
    const isCharging = f.ultCharging;

    const c = {
      ...f.colors,
      shirt: isZombie
        ? "#3a5a1a"
        : isCyborg
          ? "#5a0a0a"
          : isPatriot
            ? "#0645a5"
            : f.colors.shirt,
      shirtDark: isZombie
        ? "#1a2a08"
        : isCyborg
          ? "#2a0505"
          : isPatriot
            ? "#02245c"
            : f.colors.shirtDark,
      shirtLight: isZombie
        ? "#5a8a2a"
        : isCyborg
          ? "#a01818"
          : isPatriot
            ? "#2875e8"
            : f.colors.shirtLight,
      skin: isZombie
        ? "#7a9a4a"
        : isCyborg
          ? "#a86a5a"
          : isPatriot
            ? "#f0c090"
            : f.colors.skin,
      skinDark: isZombie
        ? "#5a7a2a"
        : isCyborg
          ? "#7a3a2a"
          : isPatriot
            ? "#d0a070"
            : f.colors.skinDark,
      hair: isZombie
        ? "#2a3a0a"
        : isCyborg
          ? "#1a0505"
          : isPatriot
            ? "#ffd700"
            : f.colors.hair,
    };

    for (const tr of f.dashTrail) {
      const a = tr.life / tr.maxLife;
      sbContext.ctx.globalAlpha = a * 0.35;
      sbContext.ctx.fillStyle = c.shirt;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(tr.x, tr.y - 80, 35, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.globalAlpha = 1;
    }

    sbContext.ctx.save();
    if (isBlocked)
      sbContext.ctx.translate(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 4,
      );
    sbContext.ctx.translate(f.x, f.y);
    const bodyScale = isUlt
      ? f.isAmerica
        ? 1
        : 1.7
      : isCharging
        ? f.isAmerica
          ? 1
          : 0.9
        : 1;
    sbContext.ctx.scale(f.facing * bodyScale, bodyScale);
    if (f.state === "ko") {
      const prog = Math.min(1, f.koTimer * 2.5);
      sbContext.ctx.rotate((-prog * Math.PI) / 2);
    }

    let bob = 0,
      armL = 1.3,
      armR = 1.3,
      legL = 1.5,
      legR = 1.5;
    let armLenL = 45,
      armLenR = 45,
      legLenL = 62,
      legLenR = 62;
    let headOffset = 0,
      torsoLean = 0,
      headTilt = 0;

    if (isUlt) {
      bob = 6 + Math.sin(t * 6) * 3;
      torsoLean = 0.15;
      armLenL = f.isAmerica ? 45 : 55;
      armLenR = f.isAmerica ? 45 : 55;
      legLenL = f.isAmerica ? 62 : 65;
      legLenR = f.isAmerica ? 62 : 65;
    }

    // Анимация зарядки ульты
    if (isCharging) {
      const prog = f.ultChargeTimer / f.ultChargeDuration;
      if (f.isAmerica) {
        // Капитан возносится: руки широко вверх, ноги вместе
        const phase = Math.max(0, Math.min(1, (f.ultChargeTimer - 2) / 2));
        bob = -Math.sin((phase * Math.PI) / 2) * 58 + Math.sin(t * 8) * 2;
        torsoLean = 0;
        headOffset = 0;
        armL = -2.25;
        armR = -0.9;
        armLenL = 58;
        armLenR = 58;
        legL = 1.5;
        legR = 1.5;
        legLenL = 52;
        legLenR = 52;
      } else if (f.isUkraine) {
        // Падает на колени, руки вверх
        bob = 30 + Math.sin(t * 15) * 5;
        torsoLean = 0.5;
        headOffset = 5;
        legL = 2.4;
        legR = 2.4;
        legLenL = 35 + prog * 5;
        legLenR = 35 + prog * 5;
        armL = -1.8;
        armR = -1.8;
        armLenL = 50 + prog * 10;
        armLenR = 50 + prog * 10;
      } else {
        // Сворачивается в клубок
        bob = 40 + Math.sin(t * 20) * 3;
        torsoLean = 0.8;
        headOffset = 10;
        legL = 2.6;
        legR = 2.6;
        legLenL = 28 + prog * 5;
        legLenR = 28 + prog * 5;
        armL = 1.5;
        armR = 1.5;
        armLenL = 20 + prog * 10;
        armLenR = 20 + prog * 10;
      }
    } else if (f.state === "idle") {
      if (!isUlt) {
        const breathe = Math.sin(f.breathing || 0);
        bob = breathe * 2.5;
        armL = 1.2 + breathe * 0.08;
        armR = 1.4 - breathe * 0.08;
        headTilt = Math.sin((f.breathing || 0) * 0.5) * 0.04;
      }
    } else if (f.state === "walk") {
      const cy = Math.sin(f.walkCycle || 0);
      const cy2 = Math.cos(f.walkCycle || 0);
      bob = Math.abs(cy) * 5 + 1;
      legL = 1.5 + cy * 0.6;
      legR = 1.5 - cy * 0.6;
      legLenL = 60 + cy2 * 8;
      legLenR = 60 - cy2 * 8;
      armL = 1.3 - cy * 0.5;
      armR = 1.3 + cy * 0.5;
      torsoLean = 0.12;
      headOffset = cy * 2;
      headTilt = cy2 * 0.03;
    } else if (f.state === "jump" || f.state === "dash_air") {
      legL = 1.8;
      legR = 1.4;
      legLenL = 58;
      legLenR = 55;
      armL = 1.6;
      armR = 0.6;
      bob = -3;
      torsoLean = -0.05;
    } else if (f.state === "block") {
      armL = -0.3;
      armR = -0.5;
      armLenL = 38;
      armLenR = 40;
      legL = 1.5 + (f.vx ? Math.sin(f.walkCycle) * 0.3 : 0);
      legR = 1.6 - (f.vx ? Math.sin(f.walkCycle) * 0.3 : 0);
      bob = 3;
      torsoLean = -0.05;
    } else if (f.state === "hit") {
      torsoLean = -0.18;
      headOffset = -6;
      armL = 0.7;
      armR = 0.9;
      bob = -2;
    } else if (f.state === "dash") {
      torsoLean = 0.3;
      armL = 1.8;
      armR = 1.6;
      legL = 1.9;
      legR = 1.3;
    } else if (f.state === "carried") {
      torsoLean = 0.35;
      armL = -0.7;
      armR = -1.0;
      legL = 1.2 + Math.sin(t * 15) * 0.5;
      legR = 1.2 - Math.sin(t * 15) * 0.5;
      headOffset = 4;
      bob = -5;
    }

    if (f.attack) {
      const a = f.attack;
      let phase;
      if (a.timer < a.startupEnd) phase = "startup";
      else if (a.timer < a.activeEnd) phase = "active";
      else phase = "recovery";
      if (a.type === "punch") {
        if (phase === "startup") {
          armR = 1.7;
          torsoLean = -0.1;
        } else if (phase === "active") {
          armR = 0.05;
          armLenR = 58;
          torsoLean = 0.1;
        } else {
          armR = 0.7;
          torsoLean = 0.02;
        }
      } else if (a.type === "kick") {
        if (phase === "startup") {
          legR = 1.7;
          torsoLean = -0.08;
        } else if (phase === "active") {
          legR = 0.3;
          legLenR = 72;
          torsoLean = 0.15;
        } else {
          legR = 1.3;
          torsoLean = 0.02;
        }
      } else if (a.type === "uppercut") {
        if (phase === "startup") {
          armR = 1.5;
          torsoLean = 0.2;
          bob = 4;
        } else if (phase === "active") {
          armR = -1.5;
          armLenR = 68;
          torsoLean = -0.2;
          bob = -8;
        } else {
          armR = 0.5;
        }
      } else if (a.type === "chargedPunch") {
        const prog = phase === "startup" ? a.timer / a.startupEnd : 1;
        if (phase === "startup") {
          bob = 5 + prog * 8;
          torsoLean = -0.3 * prog;
          armR = 1.5 - prog * 0.3;
          armLenR = 40 + prog * 5;
          const hX = 14 + Math.cos(armR) * armLenR;
          const hY = -105 + bob + Math.sin(armR) * armLenR;
          const glowSize = 10 + prog * 40;
          const gg = sbContext.ctx.createRadialGradient(
            hX,
            hY,
            2,
            hX,
            hY,
            glowSize,
          );
          gg.addColorStop(0, `rgba(255,255,200,${0.6 * prog})`);
          gg.addColorStop(0.4, `rgba(255,200,0,${0.4 * prog})`);
          gg.addColorStop(1, "rgba(255,100,0,0)");
          sbContext.ctx.fillStyle = gg;
          sbContext.ctx.beginPath();
          sbContext.ctx.arc(hX, hY, glowSize, 0, Math.PI * 2);
          sbContext.ctx.fill();
        } else if (phase === "active") {
          torsoLean = 0.4;
          armR = 0.05;
          armLenR = 100;
          bob = -3;
          const hX = 14 + Math.cos(armR) * armLenR;
          const hY = -105 + bob + Math.sin(armR) * armLenR;
          const gg = sbContext.ctx.createRadialGradient(hX, hY, 5, hX, hY, 70);
          gg.addColorStop(0, "rgba(255,255,255,0.95)");
          gg.addColorStop(0.3, "rgba(255,220,0,0.7)");
          gg.addColorStop(1, "rgba(255,80,0,0)");
          sbContext.ctx.fillStyle = gg;
          sbContext.ctx.beginPath();
          sbContext.ctx.arc(hX, hY, 70, 0, Math.PI * 2);
          sbContext.ctx.fill();
        } else {
          torsoLean = 0.15;
          armR = 0.3;
          armLenR = 80;
        }
      }
    }

    if (sbContext.game.state === "roundEnd") {
      const winner = sbContext.p1.hp > 0 ? sbContext.p1 : sbContext.p2;
      if (f === winner && f.hp > 0) {
        armR = -1.4;
        bob = Math.sin(t * 6) * 3;
      }
    }

    const sy = -105 + bob,
      hy = -60 + bob;

    // Красный плащ Капитана Америки
    if (isPatriot) {
      const flap = Math.sin(t * 8) * 7;
      sbContext.ctx.fillStyle = "#a81720";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-17, sy + 2);
      sbContext.ctx.quadraticCurveTo(-48, sy + 24 + flap, -58, sy + 100 + flap);
      sbContext.ctx.quadraticCurveTo(-28, sy + 87 + flap, 2, sy + 68 + flap);
      sbContext.ctx.lineTo(8, sy + 8);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#ef3340";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.stroke();
    }

    sbContext.ctx.fillStyle = "rgba(0,0,0,0.35)";
    sbContext.ctx.beginPath();
    sbContext.ctx.ellipse(0, 0, 35, 8, 0, 0, Math.PI * 2);
    sbContext.ctx.fill();

    sbContext.drawLeg(
      -6,
      hy,
      legL,
      legLenL,
      c,
      f.onGround ? 0 : 0.9,
      f.isJapan,
    );
    sbContext.drawArm(-14, sy, armL, armLenL, c);

    sbContext.ctx.fillStyle = c.shorts;
    sbContext.ctx.beginPath();
    sbContext.ctx.roundRect(-18, hy - 5, 36, 25, 5);
    sbContext.ctx.fill();
    sbContext.ctx.fillStyle = c.shortsDark;
    sbContext.ctx.fillRect(-18, hy + 17, 36, 3);
    if (isZombie) {
      sbContext.ctx.fillStyle = c.skin;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(-8, hy + 8, 4, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(10, hy + 14, 3, 0, Math.PI * 2);
      sbContext.ctx.fill();
    }

    sbContext.ctx.save();
    if (torsoLean) {
      sbContext.ctx.translate(0, sy);
      sbContext.ctx.rotate(torsoLean);
      sbContext.ctx.translate(0, -sy);
    }
    if (headTilt) {
      sbContext.ctx.translate(0, -142 + bob);
      sbContext.ctx.rotate(headTilt);
      sbContext.ctx.translate(0, 142 - bob);
    }
    const shirtGrad = sbContext.ctx.createLinearGradient(-22, 0, 22, 0);
    shirtGrad.addColorStop(0, c.shirtDark);
    shirtGrad.addColorStop(0.4, c.shirtLight);
    shirtGrad.addColorStop(1, c.shirtDark);
    sbContext.ctx.fillStyle = shirtGrad;
    const torsoW = isUlt ? (f.isAmerica ? 44 : 62) : 44;
    sbContext.ctx.beginPath();
    sbContext.ctx.roundRect(-torsoW / 2, sy - 5, torsoW, 50, 8);
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = c.shirtDark;
    sbContext.ctx.lineWidth = 1.5;
    sbContext.ctx.stroke();

    if (isUlt) {
      sbContext.ctx.fillStyle = isZombie ? "#7a9a4a" : "#a86a5a";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(-12, sy + 12, 8, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(15, sy + 22, 6, 0, Math.PI * 2);
      sbContext.ctx.fill();
      if (isZombie) {
        sbContext.ctx.strokeStyle = "#4a6a1a";
        sbContext.ctx.lineWidth = 2;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(-18, sy + 5);
        sbContext.ctx.lineTo(-8, sy + 15);
        sbContext.ctx.stroke();
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(12, sy + 25);
        sbContext.ctx.lineTo(20, sy + 35);
        sbContext.ctx.stroke();
      } else {
        sbContext.ctx.strokeStyle = isPatriot ? "#0039a6" : "#5a0a0a";
        sbContext.ctx.lineWidth = 3;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(-15, sy + 10);
        sbContext.ctx.lineTo(-5, sy + 20);
        sbContext.ctx.stroke();
      }
    }

    sbContext.ctx.fillStyle = c.shirtDark;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(-8, sy - 3);
    sbContext.ctx.lineTo(0, sy + 6);
    sbContext.ctx.lineTo(8, sy - 3);
    sbContext.ctx.lineTo(4, sy - 3);
    sbContext.ctx.lineTo(0, sy + 1);
    sbContext.ctx.lineTo(-4, sy - 3);
    sbContext.ctx.closePath();
    sbContext.ctx.fill();

    sbContext.ctx.fillStyle = c.belt || "#2a2a2a";
    sbContext.ctx.fillRect(-torsoW / 2 + 2, sy + 40, torsoW - 4, 5);
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.fillRect(-4, sy + 40, 8, 5);
    if (isPatriot) {
      // Белая звезда и красно-белые полосы на костюме
      sbContext.ctx.fillStyle = "#ffffff";
      sbContext.ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5,
          r = i % 2 === 0 ? 12 : 5;
        const x = Math.cos(a) * r,
          y = sy + 17 + Math.sin(a) * r;
        if (i === 0) sbContext.ctx.moveTo(x, y);
        else sbContext.ctx.lineTo(x, y);
      }
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#d52b1e";
      sbContext.ctx.fillRect(-17, sy + 31, 34, 4);
      sbContext.ctx.fillStyle = "#ffffff";
      sbContext.ctx.fillRect(-17, sy + 37, 34, 3);
    }
    sbContext.ctx.restore();

    sbContext.drawLeg(
      6,
      hy,
      legR,
      legLenR,
      c,
      f.onGround ? 0 : 0.75,
      f.isJapan,
    );

    sbContext.ctx.fillStyle = c.skin;
    sbContext.ctx.fillRect(headOffset - 7, -122 + bob, 14, 12);

    const hY = -142 + bob + (torsoLean ? -5 : 0);
    sbContext.ctx.fillStyle = c.skin;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(headOffset, hY, 19, 0, Math.PI * 2);
    sbContext.ctx.fill();

    if (isZombie || isCyborg || isPatriot) {
      const pulse = 0.5 + Math.sin(t * 20) * 0.5;
      const eyeColor = isZombie
        ? `rgba(255,${200 + pulse * 55},0,1)`
        : isPatriot
          ? `rgba(255,255,255,1)`
          : `rgba(255,${30 + pulse * 100},0,1)`;
      sbContext.ctx.fillStyle = eyeColor;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset + 8, hY - 2, 5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset - 2, hY - 2, 4.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = `rgba(255,255,255,${0.7 + pulse * 0.3})`;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset + 8, hY - 2, 2, 0, Math.PI * 2);
      sbContext.ctx.fill();
      if (isZombie) {
        sbContext.ctx.fillStyle = `rgba(200,100,0,0.8)`;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(headOffset + 14, hY - 8, 2.5, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(headOffset - 10, hY - 6, 2, 0, Math.PI * 2);
        sbContext.ctx.fill();
      }
    } else {
      sbContext.ctx.fillStyle = c.skinDark;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset - 10, hY + 3, 8, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset + 8, hY - 2, 5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#000";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset + 9, hY - 2, 2.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset + 10, hY - 3, 1, 0, Math.PI * 2);
      sbContext.ctx.fill();
    }

    sbContext.ctx.fillStyle = c.hair;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(headOffset, hY - 8, 19, Math.PI, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.fillRect(headOffset - 19, hY - 8, 38, 6);

    sbContext.ctx.fillStyle = c.skinDark;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(headOffset - 17, hY, 5, 0, Math.PI * 2);
    sbContext.ctx.fill();

    sbContext.ctx.strokeStyle = c.hair;
    sbContext.ctx.lineWidth = 2.5;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(headOffset + 3, hY - 11);
    sbContext.ctx.lineTo(headOffset + 14, hY - 12);
    sbContext.ctx.stroke();

    if (
      f.state === "hit" ||
      f.state === "ko" ||
      f.state === "carried" ||
      isCharging
    ) {
      sbContext.ctx.fillStyle = "#300";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(headOffset + 10, hY + 12, 5, 4, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
    } else if (isZombie) {
      sbContext.ctx.fillStyle = "#300";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(headOffset + 8, hY + 12, 8, 5, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      for (let i = 0; i < 4; i++) {
        sbContext.ctx.fillRect(headOffset + 3 + i * 3, hY + 8, 2, 4);
      }
    } else {
      sbContext.ctx.strokeStyle = "#5a2020";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(headOffset + 5, hY + 12);
      sbContext.ctx.lineTo(headOffset + 15, hY + 12);
      sbContext.ctx.stroke();
    }

    if (f.charType === "russia") {
      sbContext.ctx.fillStyle = "#4a3a20";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset, hY - 8, 20, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillRect(headOffset - 20, hY - 8, 6, 15);
      sbContext.ctx.fillRect(headOffset + 14, hY - 8, 6, 15);
      sbContext.ctx.fillStyle = "#d52b1e";
      const starAng = Math.PI / 5;
      sbContext.ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        sbContext.ctx.lineTo(
          headOffset + Math.cos(i * 2 * starAng - Math.PI / 2) * 6,
          hY - 14 + Math.sin(i * 2 * starAng - Math.PI / 2) * 6,
        );
      }
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
    } else if (f.charType === "ukraine") {
      sbContext.ctx.fillStyle = "#333";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset, hY - 8, 20, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#0057b7";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset, hY - 10, 14, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#ffd700";
      sbContext.ctx.fillRect(headOffset - 15, hY - 11, 30, 3);
    } else if (f.charType === "america" && isPatriot) {
      // Синий шлем с белой буквой A и крылышками
      sbContext.ctx.fillStyle = "#063b91";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset, hY - 7, 21, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillRect(headOffset - 21, hY - 8, 42, 12);
      sbContext.ctx.fillStyle = "#ffffff";
      sbContext.ctx.font = "bold 17px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.fillText("A", headOffset, hY - 10);
      sbContext.ctx.fillStyle = "#d52b1e";
      sbContext.ctx.fillRect(headOffset - 21, hY + 1, 42, 4);
    } else if (f.charType === "america") {
      sbContext.ctx.fillStyle = "#d52b1e";
      sbContext.ctx.fillRect(headOffset - 15, hY - 35, 30, 15);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.fillRect(headOffset - 15, hY - 30, 30, 5);
      sbContext.ctx.fillStyle = "#0039a6";
      sbContext.ctx.fillRect(headOffset - 15, hY - 20, 30, 5);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.fillRect(headOffset - 15, hY - 20, 30, 2);
      sbContext.ctx.fillStyle = "#d52b1e";
      sbContext.ctx.fillRect(headOffset - 20, hY - 15, 40, 5);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset - 8, hY - 17.5, 1.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset, hY - 17.5, 1.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(headOffset + 8, hY - 17.5, 1.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
    }

    sbContext.drawArm(14, sy, armR, armLenR, c);

    // Щит: на руке всегда виден в форме Капитана, при блоке выдвигается вперёд
    if (isPatriot) {
      const shieldX = f.blocking ? 54 : 39,
        shieldY = f.blocking ? -91 : -78;
      sbContext.ctx.save();
      sbContext.ctx.translate(shieldX, shieldY);
      sbContext.ctx.rotate(f.blocking ? -0.12 : 0.08);
      sbContext.ctx.fillStyle = f.shieldBroken ? "#555" : "#b9c5d3";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-17, -27);
      sbContext.ctx.quadraticCurveTo(0, -34, 17, -27);
      sbContext.ctx.lineTo(15, 8);
      sbContext.ctx.quadraticCurveTo(10, 27, 0, 34);
      sbContext.ctx.quadraticCurveTo(-10, 27, -15, 8);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = f.shieldBroken ? "#333" : "#e8edf5";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.stroke();
      if (!f.shieldBroken) {
        sbContext.ctx.fillStyle = "#d52b1e";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, -2, 21, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#ffffff";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, -2, 15, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#d52b1e";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, -2, 9, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#ffffff";
        sbContext.ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5,
            r = i % 2 === 0 ? 7 : 3;
          const x = Math.cos(a) * r,
            y = -2 + Math.sin(a) * r;
          if (i === 0) sbContext.ctx.moveTo(x, y);
          else sbContext.ctx.lineTo(x, y);
        }
        sbContext.ctx.closePath();
        sbContext.ctx.fill();
      }
      sbContext.ctx.restore();
    }

    if (f.hitFlash > 0) {
      sbContext.ctx.globalCompositeOperation = "source-atop";
      sbContext.ctx.fillStyle = `rgba(255,255,255,${f.hitFlash * 0.7})`;
      sbContext.ctx.fillRect(-60, -190, 120, 210);
      sbContext.ctx.globalCompositeOperation = "source-over";
    }
    sbContext.ctx.restore();

    if (isZombie) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.3 + Math.sin(t * 12) * 0.15;
      const ag = sbContext.ctx.createRadialGradient(
        f.x,
        f.y - 100,
        10,
        f.x,
        f.y - 100,
        150,
      );
      ag.addColorStop(0, "rgba(120,255,80,0.4)");
      ag.addColorStop(1, "rgba(80,180,40,0)");
      sbContext.ctx.fillStyle = ag;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(f.x, f.y - 100, 150, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = `rgba(180,255,100,${0.6 + Math.sin(t * 20) * 0.3})`;
      sbContext.ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + t * 3;
        const x1 = f.x + Math.cos(ang) * 90;
        const y1 = f.y - 100 + Math.sin(ang) * 90;
        const x2 = f.x + Math.cos(ang) * 130;
        const y2 = f.y - 100 + Math.sin(ang) * 130;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(x1, y1);
        sbContext.ctx.lineTo(x2, y2);
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
    if (isPatriot) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.18 + Math.sin(t * 8) * 0.06;
      const ag = sbContext.ctx.createRadialGradient(
        f.x,
        f.y - 100,
        15,
        f.x,
        f.y - 100,
        125,
      );
      ag.addColorStop(0, "rgba(100,180,255,0.65)");
      ag.addColorStop(1, "rgba(255,255,255,0)");
      sbContext.ctx.fillStyle = ag;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(f.x, f.y - 100, 125, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
    if (isCyborg) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.35 + Math.sin(t * 12) * 0.2;
      const ag = sbContext.ctx.createRadialGradient(
        f.x,
        f.y - 100,
        10,
        f.x,
        f.y - 100,
        150,
      );
      ag.addColorStop(0, "rgba(255,60,20,0.5)");
      ag.addColorStop(1, "rgba(255,20,0,0)");
      sbContext.ctx.fillStyle = ag;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(f.x, f.y - 100, 150, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = `rgba(255,100,50,${0.6 + Math.sin(t * 15) * 0.3})`;
      sbContext.ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 + t * 2;
        const x1 = f.x + Math.cos(ang) * 100;
        const y1 = f.y - 100 + Math.sin(ang) * 100;
        const x2 = f.x + Math.cos(ang) * 140;
        const y2 = f.y - 100 + Math.sin(ang) * 140;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(x1, y1);
        sbContext.ctx.lineTo(x2, y2);
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }

    // Аура зарядки ульты
    if (isCharging) {
      const prog = f.ultChargeTimer / f.ultChargeDuration;
      const color = f.isUkraine
        ? `rgba(100,200,255,${0.4 + prog * 0.4})`
        : f.isAmerica
          ? `rgba(160,210,255,${0.4 + prog * 0.4})`
          : `rgba(255,100,0,${0.4 + prog * 0.4})`;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.5 + Math.sin(t * 20) * 0.3;
      const ag = sbContext.ctx.createRadialGradient(
        f.x,
        f.y - 80,
        20,
        f.x,
        f.y - 80,
        100 + prog * 50,
      );
      ag.addColorStop(0, color);
      ag.addColorStop(1, "rgba(0,0,0,0)");
      sbContext.ctx.fillStyle = ag;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(f.x, f.y - 80, 100 + prog * 50, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
  };

  sbContext.drawGlitchOverlay_base = function (f) {
    sbContext.ctx.save();
    for (let i = 0; i < 6; i++) {
      const y = f.y - 190 + Math.random() * 200;
      const h = 6 + Math.random() * 14;
      const xOffset = (Math.random() - 0.5) * 45;
      const colors = [
        "rgba(255,0,255,0.45)",
        "rgba(0,255,255,0.4)",
        "rgba(255,255,255,0.3)",
        "rgba(160,0,255,0.45)",
      ];
      sbContext.ctx.fillStyle =
        colors[Math.floor(Math.random() * colors.length)];
      sbContext.ctx.fillRect(
        f.x - 55 + xOffset,
        y,
        110 + Math.random() * 40,
        h,
      );
    }
    sbContext.ctx.globalAlpha =
      0.25 + Math.sin(performance.now() / 100) / 100 + 0.15;
    const g = sbContext.ctx.createRadialGradient(
      f.x,
      f.y - 80,
      10,
      f.x,
      f.y - 80,
      110,
    );
    g.addColorStop(0, "rgba(180,80,255,0.6)");
    g.addColorStop(1, "rgba(150,50,220,0)");
    sbContext.ctx.fillStyle = g;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(f.x, f.y - 80, 110, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.globalAlpha = 1;
    sbContext.ctx.fillStyle = "#ff44ff";
    sbContext.ctx.font = "bold 15px Arial";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 4;
    sbContext.ctx.strokeText("⚠ БЛОКИРОВКА", f.x, f.y - 210);
    sbContext.ctx.fillText("⚠ БЛОКИРОВКА", f.x, f.y - 210);
    sbContext.ctx.fillStyle = "#ffaaaa";
    sbContext.ctx.font = "bold 13px Arial";
    sbContext.ctx.strokeText(Math.ceil(f.blockedTimer) + "с", f.x, f.y - 228);
    sbContext.ctx.fillText(Math.ceil(f.blockedTimer) + "с", f.x, f.y - 228);
    sbContext.ctx.restore();
  };

  sbContext.drawArm_base = function (sx, sy, ang, len, c) {
    const end = sbContext.limbEnd(sx, sy, ang, len),
      sl = sbContext.limbEnd(sx, sy, ang, 18);
    sbContext.drawLimb(sx, sy, sl.x, sl.y, 14, c.shirt, c.shirtDark);
    sbContext.drawLimb(sl.x, sl.y, end.x, end.y, 11, c.skin, c.skinDark);
    sbContext.ctx.fillStyle = c.skin;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(end.x, end.y, 7, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = c.skinDark;
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(end.x, end.y, 4.5, 0, Math.PI * 2);
    sbContext.ctx.stroke();
  };

  sbContext.drawLeg_base = function (
    hx,
    hy,
    ang,
    len,
    c,
    bend = 0,
    pants = false,
  ) {
    const kn = sbContext.limbEnd(hx, hy, ang + bend, len * 0.46),
      end = sbContext.limbEnd(kn.x, kn.y, ang - bend * 1.4, len * 0.54);
    sbContext.drawLimb(hx, hy, kn.x, kn.y, 16, c.shorts, c.shortsDark);
    sbContext.drawLimb(
      kn.x,
      kn.y,
      end.x,
      end.y,
      12,
      pants ? c.shorts : c.skin,
      pants ? c.shortsDark : c.skinDark,
    );
    sbContext.ctx.save();
    sbContext.ctx.translate(end.x, end.y);
    sbContext.ctx.rotate(ang);
    sbContext.ctx.fillStyle = c.shoes;
    sbContext.ctx.beginPath();
    sbContext.ctx.roundRect(-5, -8, 17, 13, 4);
    sbContext.ctx.fill();
    sbContext.ctx.fillStyle = c.shoesDark;
    sbContext.ctx.fillRect(-5, 3, 17, 2);
    sbContext.ctx.restore();
  };

  sbContext.drawFighter_interface = function (f) {
    sbContext.sbRawDrawFighter18(f);
    if (f.isChina) {
      sbContext.ctx.save();
      sbContext.ctx.translate(f.x, f.y);
      sbContext.ctx.scale(f.facing, 1);
      // Hair cap and topknot, with a short tied tail.
      sbContext.ctx.fillStyle = "#171313";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -158, 19, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillRect(-19, -158, 38, 6);
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -184, 8, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#171313";
      sbContext.ctx.lineWidth = 5;
      sbContext.ctx.lineCap = "round";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, -184);
      sbContext.ctx.quadraticCurveTo(12, -194, 8, -207);
      sbContext.ctx.stroke();
      // Gold trim and a small chest emblem.
      sbContext.ctx.strokeStyle = "#f3c83d";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-13, -105);
      sbContext.ctx.lineTo(13, -105);
      sbContext.ctx.moveTo(-13, -80);
      sbContext.ctx.lineTo(13, -80);
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#ffdf42";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -91, 6, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
    if (f.hitstun > 0 || f.starStunTimer > 0) {
      sbContext.ctx.save();
      sbContext.ctx.translate(f.x, f.y - 225);
      const t = performance.now() / 150;
      for (let i = 0; i < 4; i++) {
        const a = t + (i * Math.PI) / 2,
          x = Math.cos(a) * 25,
          y = Math.sin(a) * 8;
        sbContext.ctx.fillStyle = "#ffe66d";
        sbContext.ctx.strokeStyle = "#8a5b00";
        sbContext.ctx.lineWidth = 1.5;
        sbContext.ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const rr = k % 2 ? 4 : 11,
            ang = -Math.PI / 2 + (k * Math.PI) / 5,
            px = x + Math.cos(ang) * rr,
            py = y + Math.sin(ang) * rr;
          if (k === 0) sbContext.ctx.moveTo(px, py);
          else sbContext.ctx.lineTo(px, py);
        }
        sbContext.ctx.closePath();
        sbContext.ctx.fill();
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
    if (
      sbContext.game.mode === "practice" &&
      sbContext.game.state === "fighting" &&
      f === sbContext.p2
    ) {
      for (const d of sbContext.practiceDummies.slice(1)) {
        sbContext.sbRawDrawFighter18(d);
        sbContext.ctx.save();
        sbContext.ctx.fillStyle = "#fff";
        sbContext.ctx.font = "bold 13px Arial";
        sbContext.ctx.textAlign = "center";
        sbContext.ctx.fillText(Math.ceil(d.hp) + " / 200 HP", d.x, d.y - 225);
        sbContext.ctx.restore();
      }
    }
  };
}
