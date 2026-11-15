// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.drawFlagJapan_japan = function (x, y, w, h) {
    sbContext.ctx.fillStyle = "#ffffff";
    sbContext.ctx.fillRect(x, y, w, h);
    sbContext.ctx.fillStyle = "#bc002d";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(
      x + w / 2,
      y + h / 2,
      Math.min(w, h) * 0.32,
      0,
      Math.PI * 2,
    );
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.strokeRect(x, y, w, h);
  };

  sbContext.drawKatana_japan = function (x, y, ang) {
    sbContext.ctx.save();
    sbContext.ctx.translate(x, y);
    sbContext.ctx.rotate(ang);
    sbContext.ctx.fillStyle = "#2a1a0a";
    sbContext.ctx.fillRect(-2, -3, 22, 6);
    sbContext.ctx.strokeStyle = "#1a0a00";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.strokeRect(-2, -3, 22, 6);
    sbContext.ctx.fillStyle = "#bc002d";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(24, 0, 7, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#8a001f";
    sbContext.ctx.lineWidth = 1.5;
    sbContext.ctx.stroke();
    const g = sbContext.ctx.createLinearGradient(30, -4, 30, 4);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.5, "#e0e0e0");
    g.addColorStop(1, "#909090");
    sbContext.ctx.fillStyle = g;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(30, -3);
    sbContext.ctx.lineTo(88, -2);
    sbContext.ctx.lineTo(95, 0);
    sbContext.ctx.lineTo(88, 2);
    sbContext.ctx.lineTo(30, 3);
    sbContext.ctx.closePath();
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#ffffff";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(30, -1);
    sbContext.ctx.lineTo(90, -0.5);
    sbContext.ctx.stroke();
    sbContext.ctx.fillStyle = "#d4af37";
    sbContext.ctx.fillRect(28, -3, 3, 6);
    sbContext.ctx.restore();
  };

  sbContext.japanInitState_japan = function (f) {
    f.japanStanceCd = 0;
    f.japanStanceTimer = 0;
    f._jpZHeld = false;
    f.japanParryCd = 0;
    f.japanParryPrep = 0;
    f.japanParryStance = 0;
    f._jpXHeld = false;
    f.japanAstralCd = 0;
    f.japanAstralTimer = 0;
    f.japanAstralHeal1 = false;
    f.japanAstralHeal2 = false;
    f.japanAstralFade = 0;
    f._jpCHeld = false;
    f.japanGhostActive = false;
    f.japanGhostBody = null;
  };

  sbContext.drawArm_japan = function (sx, sy, ang, len, c) {
    const f = sbContext._jpCurrentFighter;
    const isJp = f && f.isJapan && !f.trainingDummy;
    if (isJp && sx === 14) {
      const a = f.attack;
      if (a && a.type === "punch") {
        const ph =
          a.timer < a.startupEnd
            ? "startup"
            : a.timer < a.activeEnd
              ? "active"
              : "recovery";
        if (ph === "startup") {
          ang = -0.9;
          len = 50;
        } else if (ph === "active") {
          ang = 0.25;
          len = 58;
        } else {
          ang = 1.0;
          len = 48;
        }
      } else if (f.japanParryStance > 0) {
        ang = 0.2;
        len = 52;
      } else if (f.japanStanceTimer > 0) {
        ang = 0.35;
        len = 52;
      } else if (f.blocking) {
        ang = -0.3;
        len = 45;
      } else if (f.state === "idle" && !a && !f.ultCharging) {
        ang = 0.25;
        len = 46;
      }
    }
    if (
      isJp &&
      sx === -14 &&
      (f.japanParryStance > 0 || f.japanStanceTimer > 0 || f.japanParryPrep > 0)
    ) {
      ang = f.japanParryStance > 0 ? 0.22 : 0.4;
      len = 62;
    }
    sbContext.drawArm_base(sx, sy, ang, len, c);
    if (isJp && sx === 14) {
      const end = sbContext.limbEnd(sx, sy, ang, len);
      sbContext.drawKatana(end.x, end.y, ang);
    }
  };

  sbContext.jpDrawHelmet_japan = function (f) {
    if (!f.isJapan || f.trainingDummy) return;
    let bob = 0;
    if (f.state === "idle") bob = Math.sin(f.breathing || 0) * 2.5;
    else if (f.state === "walk")
      bob = Math.abs(Math.sin(f.walkCycle || 0)) * 5 + 1;
    else if (f.state === "jump" || f.state === "dash_air") bob = -3;
    else if (f.ultCharging) bob = 40;
    const hY = -142 + bob;
    sbContext.ctx.save();
    sbContext.ctx.translate(f.x, f.y);
    sbContext.ctx.scale(f.facing, 1);
    sbContext.ctx.fillStyle = "#1a1a1a";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, hY - 6, 24, Math.PI, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#bc002d";
    sbContext.ctx.lineWidth = 3;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, hY - 6, 24, Math.PI, Math.PI * 2);
    sbContext.ctx.stroke();
    sbContext.ctx.fillStyle = "#bc002d";
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(-24, hY - 6);
    sbContext.ctx.lineTo(-30, hY + 12);
    sbContext.ctx.lineTo(-16, hY + 4);
    sbContext.ctx.closePath();
    sbContext.ctx.fill();
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(24, hY - 6);
    sbContext.ctx.lineTo(30, hY + 12);
    sbContext.ctx.lineTo(16, hY + 4);
    sbContext.ctx.closePath();
    sbContext.ctx.fill();
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, hY - 24, 15, Math.PI * 1.15, Math.PI * 1.85);
    sbContext.ctx.arc(0, hY - 24, 10, Math.PI * 1.85, Math.PI * 1.15, true);
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#b8960a";
    sbContext.ctx.lineWidth = 1.5;
    sbContext.ctx.stroke();
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, hY - 22, 3, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.restore();
  };

  sbContext.jpDrawStanceFX_japan = function (f) {
    if (!f.isJapan) return;
    if (f.japanStanceTimer > 0) {
      sbContext.ctx.save();
      sbContext.ctx.translate(f.x, f.y);
      for (let i = 0; i < 5; i++) {
        const y = -140 + i * 20 + Math.sin(performance.now() * 0.02 + i) * 6;
        const x = -f.facing * (40 + i * 8);
        sbContext.ctx.globalAlpha = 0.6 - i * 0.1;
        sbContext.ctx.strokeStyle = "#ff4466";
        sbContext.ctx.lineWidth = 2;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(x, y);
        sbContext.ctx.lineTo(x - f.facing * 30, y);
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
    if (f.japanParryStance > 0) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha =
        0.5 + Math.sin(performance.now() * 0.02) * 0.2;
      sbContext.ctx.strokeStyle = "#ffdd44";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(f.x, f.y - 95, 55, 0, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.restore();
    }
    if (f.japanAstralTimer > 0) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha =
        0.3 + Math.sin(performance.now() * 0.01) * 0.1;
      sbContext.ctx.fillStyle = "#888";
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5 + performance.now() * 0.002;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(
          f.x + Math.cos(ang) * 30,
          f.y - 80 + Math.sin(ang) * 30,
          25,
          0,
          Math.PI * 2,
        );
        sbContext.ctx.fill();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.jpDrawSlashArc_japan = function (f) {
    if (!f.isJapan || !f.attack || f.attack.type !== "punch") return;
    const a = f.attack;
    if (a.timer < a.startupEnd || a.timer > a.activeEnd + 0.1) return;
    const prog = Math.min(
      1,
      (a.timer - a.startupEnd) / (a.activeEnd - a.startupEnd + 0.1),
    );
    const curAng = -0.9 + (0.25 + 0.9) * Math.min(1, prog * 1.6);
    sbContext.ctx.save();
    sbContext.ctx.translate(f.x, f.y);
    sbContext.ctx.scale(f.facing, 1);
    sbContext.ctx.globalAlpha = 0.85 * (1 - prog * 0.3);
    sbContext.ctx.strokeStyle = "#ffffff";
    sbContext.ctx.lineWidth = 6;
    sbContext.ctx.shadowColor = "#88ddff";
    sbContext.ctx.shadowBlur = 20;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(14, -105, 95, -1.05, curAng);
    sbContext.ctx.stroke();
    sbContext.ctx.strokeStyle = "rgba(200,230,255,0.5)";
    sbContext.ctx.lineWidth = 15;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(14, -105, 80, -1.05, curAng);
    sbContext.ctx.stroke();
    sbContext.ctx.restore();
  };

  sbContext.jpRenderFighter_japan = function (f) {
    sbContext._jpCurrentFighter = f;
    sbContext.drawFighter_china(f);
    sbContext._jpCurrentFighter = null;
    sbContext.jpDrawHelmet(f);
    sbContext.jpDrawStanceFX(f);
    sbContext.jpDrawSlashArc(f);
  };

  sbContext.drawFighter_japan = function (f) {
    if (
      f.isJapan &&
      f.japanGhostActive &&
      f.japanGhostBody &&
      !f.trainingDummy
    ) {
      const ox = f.x,
        oy = f.y,
        of = f.facing,
        os = f.state,
        oa = f.attack,
        ob = f.blocking,
        ou = f.ultTimer;
      f.x = f.japanGhostBody.x;
      f.y = f.japanGhostBody.y;
      f.facing = f.japanGhostBody.facing;
      f.state = "idle";
      f.attack = null;
      f.blocking = false;
      f.ultTimer = 0;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.45;
      sbContext.ctx.filter = "brightness(0.5) saturate(0)";
      sbContext.jpRenderFighter(f);
      sbContext.ctx.filter = "none";
      sbContext.ctx.restore();
      f.x = ox;
      f.y = oy;
      f.facing = of;
      f.state = os;
      f.attack = oa;
      f.blocking = ob;
      f.ultTimer = ou;
    }
    if (f.isJapan && f.japanGhostActive && !f.trainingDummy) {
      const ou = f.ultTimer;
      f.ultTimer = 0;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.72;
      sbContext.ctx.filter = "brightness(2) saturate(0)";
      sbContext.jpRenderFighter(f);
      sbContext.ctx.filter = "none";
      sbContext.ctx.restore();
      f.ultTimer = ou;
    } else if (f.isJapan && f.japanAstralTimer > 0) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.15;
      sbContext.jpRenderFighter(f);
      sbContext.ctx.restore();
    } else if (f.isJapan && f.japanAstralFade > 0) {
      const alpha =
        0.15 + (1 - f.japanAstralFade / sbContext.JAPAN_ASTRAL_FADE) * 0.85;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = alpha;
      sbContext.jpRenderFighter(f);
      sbContext.ctx.restore();
    } else {
      sbContext.jpRenderFighter(f);
    }
  };

  sbContext.jpDrawCuts_japan = function () {
    for (const cut of sbContext.japanCuts) {
      const a = cut.life / cut.maxLife;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = a;
      sbContext.ctx.strokeStyle = "#ffffff";
      sbContext.ctx.lineWidth = 4;
      sbContext.ctx.shadowColor = "#88ddff";
      sbContext.ctx.shadowBlur = 30;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(cut.x1, cut.y1);
      sbContext.ctx.lineTo(cut.x2, cut.y2);
      sbContext.ctx.stroke();
      sbContext.ctx.strokeStyle = `rgba(200,0,0,${a * 0.5})`;
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.shadowBlur = 10;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(cut.x1, cut.y1);
      sbContext.ctx.lineTo(cut.x2, cut.y2);
      sbContext.ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const t = Math.random();
        sbContext.ctx.fillStyle = `rgba(255,255,255,${a * 0.7})`;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(
          cut.x1 + (cut.x2 - cut.x1) * t,
          cut.y1 + (Math.random() - 0.5) * 20,
          2 + Math.random() * 2,
          0,
          Math.PI * 2,
        );
        sbContext.ctx.fill();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.jpDrawSmoke_japan = function () {
    for (const s of sbContext.japanSmoke) {
      const a = s.life / s.maxLife;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = a * 0.6;
      sbContext.ctx.fillStyle = "#888";
      const r = s.radius * (1 + (1 - a) * 0.8);
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 + s.life * 2;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(
          s.x + Math.cos(ang) * r * 0.3,
          s.y + Math.sin(ang) * r * 0.3,
          r * 0.5,
          0,
          Math.PI * 2,
        );
        sbContext.ctx.fill();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.jpMakeGhostFighter_japan = function (overrides) {
    return {
      x: 0,
      y: sbContext.GROUND_Y,
      facing: 1,
      isJapan: true,
      isUkraine: false,
      isAmerica: false,
      isChina: false,
      colors: sbContext.JAPAN_COLORS,
      state: "idle",
      attack: null,
      blocking: false,
      ultCharging: false,
      trainingDummy: false,
      animTime: 0,
      breathing: 0,
      walkCycle: 0,
      dashTrail: [],
      hitFlash: 0,
      hitstun: 0,
      starStunTimer: 0,
      blockedTimer: 0,
      koTimer: 0,
      ultTimer: 0,
      maxHp: 100,
      hp: 100,
      shieldHp: 100,
      shieldBroken: false,
      carried: false,
      doubleJumpUsed: false,
      doubleJumpCd: 0,
      carried: false,
      japanParryStance: 0,
      japanParryPrep: 0,
      japanStanceTimer: 0,
      japanAstralTimer: 0,
      japanAstralFade: 0,
      japanGhostActive: false,
      ...overrides,
    };
  };

  sbContext.jpDrawGhostCopies_japan = function () {
    for (const c of sbContext.japanGhostCopies) {
      if (c.type === "dash") {
        const still = c.timer > 0.15;
        const x = still ? c.fromX : c.toX;
        const fakeF = sbContext.jpMakeGhostFighter({
          x,
          y: sbContext.GROUND_Y,
          facing: c.facing,
          state: still ? "dash" : "dash_air",
        });
        sbContext.ctx.save();
        sbContext.ctx.globalAlpha = still ? 0.6 : 0.3;
        sbContext.ctx.filter = "brightness(2) saturate(0)";
        sbContext._jpCurrentFighter = fakeF;
        sbContext.drawFighter_china(fakeF);
        sbContext._jpCurrentFighter = null;
        sbContext.jpDrawHelmet(fakeF);
        sbContext.ctx.filter = "none";
        sbContext.ctx.restore();
      } else if (c.type === "parry" && c.target) {
        const x = c.target.x + c.facing * 60;
        const fakeF = sbContext.jpMakeGhostFighter({
          x,
          y: sbContext.GROUND_Y,
          facing: -c.facing,
          state: "idle",
          attack: {
            type: "punch",
            timer: 0.1,
            startupEnd: 0.06,
            activeEnd: 0.14,
            totalTime: 0.32,
            hasHit: true,
            spawned: true,
          },
        });
        sbContext.ctx.save();
        sbContext.ctx.globalAlpha = 0.7;
        sbContext.ctx.filter = "brightness(2) saturate(0)";
        sbContext._jpCurrentFighter = fakeF;
        sbContext.drawFighter_china(fakeF);
        sbContext._jpCurrentFighter = null;
        sbContext.jpDrawHelmet(fakeF);
        sbContext.ctx.filter = "none";
        sbContext.ctx.restore();
      }
    }
  };

  sbContext.fighter_reset_japan = function () {
    sbContext.fighter_reset_china.call(this);
    if (!this.isJapan) this.isJapan = this.charType === "japan";
    sbContext.japanInitState(this);
  };

  sbContext.fighter_takeDamage_japan = function (dmg, dir) {
    if (this.isJapan && this.japanAstralTimer > 0) return;
    if (
      this.isJapan &&
      this.japanParryStance > 0 &&
      sbContext._lastMeleeAttacker &&
      sbContext._lastMeleeAttacker !== this
    ) {
      const src = sbContext._lastMeleeAttacker;
      const a = src.attack;
      if (
        a &&
        ["punch", "kick", "uppercut", "chargedPunch"].includes(a.type) &&
        a.timer >= a.startupEnd &&
        a.timer < a.activeEnd
      ) {
        this.japanParryStance = 0;
        this.japanParryPrep = 0;
        this.japanParryCd = sbContext.JAPAN_PARRY_CD_OK;
        src.takeDamage(20, this.facing);
        src.hitstun = Math.max(src.hitstun, 1.0);
        src.vx = this.facing * 400;
        if (!src.starStunTimer || src.starStunTimer < 1.0)
          src.starStunTimer = 1.0;
        sbContext.spawnHitSparks(
          this.x + this.facing * 35,
          this.y - 90,
          "#ffffff",
        );
        sbContext.spawnHitSparks(src.x, src.y - 80, "#ffdd44");
        sbContext.flash("rgba(255,255,255,0.3)");
        sbContext.doShake(15, 0.2);
        sbContext.playSound(1200, 0.1, "triangle", 0.15);
        // Ghost parry — копия за врагом (только один источник урона — в updateParticles)
        if (this.japanGhostActive) {
          sbContext.japanGhostCopies.push({
            type: "parry",
            target: src,
            facing: this.facing,
            timer: 0.3,
            maxTimer: 0.3,
          });
        }
        return;
      }
    }
    sbContext.fighter_takeDamage_interface.call(this, dmg, dir);
  };

  sbContext.fighter_updateAttack_japan = function (dt, opponent) {
    const prev = sbContext._lastMeleeAttacker;
    sbContext._lastMeleeAttacker = this;
    sbContext.fighter_updateAttack_interface.call(this, dt, opponent);
    sbContext._lastMeleeAttacker = prev;
  };

  sbContext.fighter_castBlockade_japan = function () {
    if (this.isJapan) return;
    sbContext.fighter_castBlockade_arena.call(this);
  };

  sbContext.fighter_castBearSkill_japan = function () {
    if (this.isJapan) return;
    sbContext.fighter_castBearSkill_arena.call(this);
  };

  sbContext.fighter_startAttack_japan = function (type) {
    if (this.isJapan) {
      if (type === "uppercut") return;
      if (
        this.japanAstralTimer > 0 ||
        this.japanParryStance > 0 ||
        this.japanParryPrep > 0 ||
        this.ultCharging
      )
        return;
    }
    sbContext.fighter_startAttack_arena.call(this, type);
  };

  sbContext.fighter_japanTeleport_japan = function (opponent) {
    const startX = this.x;
    const endXRaw = startX + this.facing * sbContext.JAPAN_DASH_DIST;
    const endX = Math.max(
      sbContext.ARENA_LEFT + 30,
      Math.min(sbContext.ARENA_RIGHT - 30, endXRaw),
    );
    const pathY = this.y - 95;
    sbContext.japanCuts.push({
      x1: startX,
      y1: pathY,
      x2: endX,
      y2: pathY,
      life: 0.45,
      maxLife: 0.45,
      dir: this.facing,
    });
    if (opponent && opponent.hp > 0 && !opponent.carried) {
      const minX = Math.min(startX, endX),
        maxX = Math.max(startX, endX);
      if (
        opponent.x >= minX - 30 &&
        opponent.x <= maxX + 30 &&
        Math.abs(opponent.y - 80 - pathY) < 90
      ) {
        opponent.takeDamage(15, this.facing);
        sbContext.spawnKetchup(opponent.x, opponent.y - 80, this.facing, 20);
        sbContext.flash("rgba(200,0,0,0.35)");
        sbContext.doShake(14, 0.2);
        sbContext.playSound(150, 0.15, "sawtooth", 0.12);
      }
    }
    this.x = endX;
    this.clampX();
    this.japanStanceTimer = 0;
    this.state = "idle";
    sbContext.playSound(880, 0.08, "sine", 0.06);
    sbContext.playSound(1200, 0.06, "triangle", 0.04);
    if (this.japanGhostActive) {
      sbContext.japanGhostCopies.push({
        type: "dash",
        fromX: startX,
        toX: endX,
        pathY,
        facing: this.facing,
        timer: 0.5,
        maxTimer: 0.5,
        done: false,
        owner: this,
      });
    }
  };

  sbContext.fighter_update_japan = function (dt, opponent, allowInput) {
    if (!this.isJapan || this.trainingDummy) {
      sbContext.fighter_update_china.call(this, dt, opponent, allowInput);
      return;
    }
    if (this.japanStanceCd === undefined) sbContext.japanInitState(this);

    this.japanStanceCd = Math.max(0, this.japanStanceCd - dt);
    this.japanParryCd = Math.max(0, this.japanParryCd - dt);
    this.japanAstralCd = Math.max(0, this.japanAstralCd - dt);

    if (this.japanGhostActive && this.ultTimer <= 0) {
      this.japanGhostActive = false;
      this.japanGhostBody = null;
      this.ultTimer = 0;
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2,
          s = 100 + Math.random() * 200;
        sbContext.particles.push({
          x: this.x,
          y: this.y - 80,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 100,
          life: 0.8,
          maxLife: 0.8,
          color: ["#ffffff", "#ccccff", "#aaddff"][
            Math.floor(Math.random() * 3)
          ],
          size: 4 + Math.random() * 5,
        });
      }
      sbContext.playSound(1200, 0.3, "sine", 0.1);
    }

    if (
      this.japanGhostActive &&
      this.onGround &&
      allowInput &&
      this.japanAstralTimer <= 0
    ) {
      if (this.isDown(this.controls.left)) this.x -= 120 * dt;
      else if (this.isDown(this.controls.right)) this.x += 120 * dt;
      this.clampX();
    }

    // ===== ASTRAL =====
    if (this.japanAstralTimer > 0) {
      this.japanAstralTimer -= dt;
      if (allowInput) {
        if (this.isDown(this.controls.left)) this.vx = -sbContext.MOVE_SPEED;
        else if (this.isDown(this.controls.right))
          this.vx = sbContext.MOVE_SPEED;
        else this.vx = 0;
        if (
          this.isDown(this.controls.jump) &&
          this.onGround &&
          !this._jumpHeld
        ) {
          this.vy = sbContext.JUMP_VELOCITY;
          this.onGround = false;
          this._jumpHeld = true;
        } else if (!this.isDown(this.controls.jump)) this._jumpHeld = false;
      }
      if (!this.japanAstralHeal1 && this.japanAstralTimer <= 2) {
        this.japanAstralHeal1 = true;
        const h = this.japanGhostActive ? 10 : 5;
        this.hp = Math.min(this.maxHp, this.hp + h);
        sbContext.particles.push({
          x: this.x,
          y: this.y - 180,
          vx: 0,
          vy: -40,
          life: 1,
          maxLife: 1,
          color: "#66ff88",
          size: 20,
          isText: true,
          text: "+" + h + " HP",
        });
      }
      if (!this.japanAstralHeal2 && this.japanAstralTimer <= 1) {
        this.japanAstralHeal2 = true;
        const h = this.japanGhostActive ? 10 : 5;
        this.hp = Math.min(this.maxHp, this.hp + h);
        sbContext.particles.push({
          x: this.x,
          y: this.y - 180,
          vx: 0,
          vy: -40,
          life: 1,
          maxLife: 1,
          color: "#66ff88",
          size: 20,
          isText: true,
          text: "+" + h + " HP",
        });
      }
      if (this.japanAstralTimer <= 0) {
        this.japanAstralTimer = 0;
        this.japanAstralFade = sbContext.JAPAN_ASTRAL_FADE;
        this.japanAstralCd = sbContext.JAPAN_ASTRAL_CD;
        this.state = "idle";
      }
      if (allowInput && this.isDown(this.controls.skill3) && !this._jpCHeld) {
        this.japanAstralTimer = 0;
        this.japanAstralFade = sbContext.JAPAN_ASTRAL_FADE;
        this.japanAstralCd = sbContext.JAPAN_ASTRAL_CD;
      }
      this._jpCHeld = allowInput ? this.isDown(this.controls.skill3) : false;
      this.x += this.vx * dt;
      this.applyGravity(dt);
      this.clampX();
      return;
    }
    if (this.japanAstralFade > 0) {
      this.japanAstralFade = Math.max(0, this.japanAstralFade - dt);
    }

    // ===== DASH STANCE =====
    if (this.japanStanceTimer > 0) {
      if (this.hitstun > 0) {
        this.japanStanceTimer = 0;
        this.japanStanceCd = sbContext.JAPAN_DASH_CD;
      } else {
        this.japanStanceTimer -= dt;
        this.vx = 0;
        this.state = "dash";
        this.applyGravity(dt);
        if (this.japanStanceTimer <= 0) this.japanTeleport(opponent);
        return;
      }
    }

    // ===== PARRY PREP =====
    if (this.japanParryPrep > 0) {
      if (this.hitstun > 0) {
        this.japanParryPrep = 0;
        this.japanParryCd = sbContext.JAPAN_PARRY_CD_FAIL;
      } else {
        this.japanParryPrep -= dt;
        this.vx = 0;
        this.state = "idle";
        this.applyGravity(dt);
        if (this.japanParryPrep <= 0)
          this.japanParryStance = sbContext.JAPAN_PARRY_STANCE;
        return;
      }
    }

    // ===== PARRY STANCE =====
    if (this.japanParryStance > 0) {
      if (this.hitstun > 0) {
        this.japanParryStance = 0;
        this.japanParryCd = sbContext.JAPAN_PARRY_CD_FAIL;
      } else {
        this.japanParryStance -= dt;
        this.vx = 0;
        this.state = "block";
        this.applyGravity(dt);
        if (this.japanParryStance <= 0)
          this.japanParryCd = sbContext.JAPAN_PARRY_CD_FAIL;
        return;
      }
    }

    // ===== SKILL INPUT =====
    if (
      allowInput &&
      this.hp > 0 &&
      this.hitstun <= 0 &&
      !this.carried &&
      !this.ultCharging
    ) {
      const zDown = this.isDown(this.controls.skill1);
      const xDown = this.isDown(this.controls.skill2);
      const cDown = this.isDown(this.controls.skill3);

      if (zDown && !this._jpZHeld && this.japanStanceCd <= 0) {
        this._jpZHeld = true;
        this.japanStanceTimer = 0.5;
        this.japanStanceCd = sbContext.JAPAN_DASH_CD;
        this.state = "dash";
        this.vx = 0;
        sbContext.playSound(300, 0.15, "sine", 0.06);
        sbContext.particles.push({
          x: this.x,
          y: this.y - 200,
          vx: 0,
          vy: -40,
          life: 0.8,
          maxLife: 0.8,
          color: "#ff5566",
          size: 20,
          isText: true,
          text: "СТОЙКА",
        });
        return;
      }
      if (!zDown) this._jpZHeld = false;

      if (xDown && !this._jpXHeld && this.japanParryCd <= 0) {
        this._jpXHeld = true;
        this.japanParryPrep = sbContext.JAPAN_PARRY_PREP;
        this.state = "idle";
        this.vx = 0;
        sbContext.playSound(400, 0.1, "sine", 0.06);
        sbContext.particles.push({
          x: this.x,
          y: this.y - 200,
          vx: 0,
          vy: -40,
          life: 0.8,
          maxLife: 0.8,
          color: "#ffdd44",
          size: 18,
          isText: true,
          text: "ПАРИРОВАНИЕ",
        });
        return;
      }
      if (!xDown) this._jpXHeld = false;

      if (cDown && !this._jpCHeld && this.japanAstralCd <= 0) {
        this._jpCHeld = true;
        this.japanAstralTimer = sbContext.JAPAN_ASTRAL_DUR;
        this.japanAstralHeal1 = false;
        this.japanAstralHeal2 = false;
        this.vx = 0;
        sbContext.japanSmoke.push({
          x: this.x,
          y: this.y - 80,
          life: 1.0,
          maxLife: 1.0,
          radius: 60,
        });
        sbContext.playSound(200, 0.2, "sawtooth", 0.08);
        sbContext.playSound(400, 0.15, "sine", 0.06);
        sbContext.particles.push({
          x: this.x,
          y: this.y - 200,
          vx: 0,
          vy: -40,
          life: 1,
          maxLife: 1,
          color: "#aaaaff",
          size: 18,
          isText: true,
          text: "АСТРАЛ",
        });
        return;
      }
      if (!cDown) this._jpCHeld = false;
    }

    sbContext.fighter_update_china.call(this, dt, opponent, allowInput);
  };

  sbContext.triggerUlt_japan = function (f, opp) {
    if (!f.isJapan) {
      sbContext.triggerUlt_china.call(this, f, opp);
      return;
    }
    if (f.ultUsed) return;
    f.ultUsed = true;
    f.ultCharging = false;
    f.ultChargeTimer = 0;
    f.ultTimer = sbContext.JAPAN_ULT_DUR;
    f.ultCooldown = 0;
    f.japanGhostActive = true;
    f.japanGhostBody = { x: f.x, y: f.y, facing: f.facing };
    f.state = "idle";
    f.hitstun = 0;
    f.attack = null;
    f.vx = 0;
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2,
        s = 100 + Math.random() * 350;
      sbContext.particles.push({
        x: f.x,
        y: f.y - 100,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 150,
        life: 1.2 + Math.random() * 0.8,
        maxLife: 2.0,
        color: ["#ffffff", "#aaddff", "#ccccff"][Math.floor(Math.random() * 3)],
        size: 5 + Math.random() * 8,
      });
    }
    for (let i = 0; i < 3; i++) {
      sbContext.explosionRings.push({
        x: f.x,
        y: f.y - 100,
        r: 20 + i * 10,
        maxR: 350 + i * 80,
        life: 0.6 + i * 0.1,
        maxLife: 0.7,
        color: `rgba(200,220,255,`,
      });
    }
    sbContext.spawnKetchup(f.x, f.y - 80, f.facing, 25);
    sbContext.doShake(30, 0.6);
    sbContext.playSound(200, 0.4, "sawtooth", 0.15);
    sbContext.playSound(800, 0.3, "sine", 0.12);
    sbContext.particles.push({
      x: f.x,
      y: f.y - 260,
      vx: 0,
      vy: -60,
      life: 2.0,
      maxLife: 2.0,
      color: "#ffffff",
      size: 56,
      isText: true,
      text: "☠ ХАРАКИРИ",
    });
    for (const c of sbContext.crowd) c.excited = 3;
  };

  sbContext.updateParticles_japan = function (dt) {
    sbContext.updateParticlesService(dt);
    for (let i = sbContext.japanCuts.length - 1; i >= 0; i--) {
      sbContext.japanCuts[i].life -= dt;
      if (sbContext.japanCuts[i].life <= 0) sbContext.japanCuts.splice(i, 1);
    }
    for (let i = sbContext.japanSmoke.length - 1; i >= 0; i--) {
      sbContext.japanSmoke[i].life -= dt;
      if (sbContext.japanSmoke[i].life <= 0) sbContext.japanSmoke.splice(i, 1);
    }
    for (let i = sbContext.japanGhostCopies.length - 1; i >= 0; i--) {
      const c = sbContext.japanGhostCopies[i];
      c.timer -= dt;
      if (c.type === "dash") {
        if (!c.done && c.timer <= 0) {
          c.done = true;
          if (c.owner) {
            const target =
              c.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
            if (target && target.hp > 0) {
              const minX = Math.min(c.fromX, c.toX),
                maxX = Math.max(c.fromX, c.toX);
              if (
                target.x >= minX - 30 &&
                target.x <= maxX + 30 &&
                Math.abs(target.y - 80 - c.pathY) < 90
              ) {
                target.takeDamage(15, c.facing);
                sbContext.spawnKetchup(target.x, target.y - 80, c.facing, 15);
                sbContext.doShake(10, 0.15);
              }
            }
            sbContext.japanCuts.push({
              x1: c.fromX,
              y1: c.pathY,
              x2: c.toX,
              y2: c.pathY,
              life: 0.4,
              maxLife: 0.4,
              dir: c.facing,
            });
          }
          c.timer = 0.15;
        } else if (c.done && c.timer <= 0) {
          sbContext.japanGhostCopies.splice(i, 1);
        }
      } else if (c.type === "parry") {
        if (c.timer <= 0) {
          if (c.target && c.target.hp > 0) {
            c.target.takeDamage(10, c.facing);
            sbContext.spawnKetchup(c.target.x, c.target.y - 80, c.facing, 8);
            sbContext.spawnHitSparks(c.target.x, c.target.y - 80, "#88ddff");
            sbContext.japanCuts.push({
              x1: c.target.x - 50,
              y1: c.target.y - 90,
              x2: c.target.x + 50,
              y2: c.target.y - 90,
              life: 0.4,
              maxLife: 0.4,
              dir: c.facing,
            });
          }
          sbContext.japanGhostCopies.splice(i, 1);
        }
      }
    }
  };

  sbContext.drawWorld_japan = function (t) {
    sbContext.drawWorld_china(t);
    sbContext.jpDrawCuts();
    sbContext.jpDrawSmoke();
    sbContext.jpDrawGhostCopies();
  };

  sbContext.getPlayerSkills_japan = function (f) {
    if (f.isJapan) {
      return [
        {
          key: f === sbContext.p1 ? "Z" : "N1",
          icon: "⚡",
          cd: f.japanStanceCd || 0,
        },
        {
          key: f === sbContext.p1 ? "X" : "N2",
          icon: "🛡",
          cd: f.japanParryCd || 0,
        },
        {
          key: f === sbContext.p1 ? "C" : "N3",
          icon: "💨",
          cd: f.japanAstralTimer > 0 ? 0 : f.japanAstralCd || 0,
        },
      ];
    }
    return sbContext.getPlayerSkills_china(f);
  };

  sbContext.sbDescription_japan = function (id) {
    if (id === "japan")
      return {
        skills: [
          [
            "Z · МОЛНИЕНОСНЫЙ РЫВОК",
            "Стойка 0.5с → мгновенный рывок на 420 px. Пронзает противника (15 урона + кровь). Оставляет порез воздуха. КД 10с.",
          ],
          [
            "X · ПАРИРОВАНИЕ",
            "Подготовка 0.5с → стойка 1.5с (нельзя двигаться). При попадании ближней атаки — контра в 20 урона + 1с стан. КД 5с при успехе / 15с при провале.",
          ],
          [
            "C · АСТРАЛ",
            "Дымовая шашка → 3с невидимости и неуязвимости. +5 HP на 1с и +5 HP на 2с. Повторное нажатие — досрочное завершение. КД 10с после конца.",
          ],
        ],
        ult: "ХАРАКИРИ (2с подготовки, прерывается уроном). 10с управляешь призраком (+40% скорости). Апгрейды в призраке: dash создаёт копию (повтор траектории, 15 урона), parry — копия за врагом (+10 урона), astral лечит по 10 HP.",
      };
    return sbContext.sbDescription_china(id);
  };

  sbContext.drawMiniPortrait_japan = function (x, y, size, f) {
    sbContext.drawMiniPortrait_interface(x, y, size, f);
    if (f.isJapan) {
      sbContext.ctx.save();
      sbContext.ctx.translate(x + size / 2, y + size / 2);
      sbContext.ctx.scale(size / 80, size / 80);
      sbContext.ctx.fillStyle = "#1a1a1a";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -12, 24, Math.PI, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#bc002d";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -12, 24, Math.PI, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#bc002d";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-24, -12);
      sbContext.ctx.lineTo(-30, 6);
      sbContext.ctx.lineTo(-16, -2);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(24, -12);
      sbContext.ctx.lineTo(30, 6);
      sbContext.ctx.lineTo(16, -2);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#ffd700";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -30, 14, Math.PI * 1.15, Math.PI * 1.85);
      sbContext.ctx.arc(0, -30, 9, Math.PI * 1.85, Math.PI * 1.15, true);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
  };
}

export function initializeCharacter(sbContext) {
  sbContext.JAPAN_DASH_CD = 10;
  sbContext.JAPAN_DASH_DIST = 420;
  sbContext.JAPAN_PARRY_PREP = 0.5;
  sbContext.JAPAN_PARRY_STANCE = 1.5;
  sbContext.JAPAN_PARRY_CD_OK = 5;
  sbContext.JAPAN_PARRY_CD_FAIL = 15;
  sbContext.JAPAN_ASTRAL_DUR = 3;
  sbContext.JAPAN_ASTRAL_FADE = 1;
  sbContext.JAPAN_ASTRAL_CD = 10;
  sbContext.JAPAN_ULT_DUR = 10;
  sbContext.japanCuts = [];
  sbContext.japanSmoke = [];
  sbContext.japanGhostCopies = [];
  sbContext._jpCurrentFighter = null;
  sbContext._lastMeleeAttacker = null;
}
