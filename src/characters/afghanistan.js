import { hasSkills, updatesSkills, skillDown } from "./ability-kit.js";
import { drawAfghanBody, drawNetWrap } from "../rendering/afghan-body.js";
// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.drawFlagAfghanistan_afghanistan = function (x, y, w, h) {
    sbContext.ctx.fillStyle = "#000";
    sbContext.ctx.fillRect(x, y, w / 3, h);
    sbContext.ctx.fillStyle = "#d32011";
    sbContext.ctx.fillRect(x + w / 3, y, w / 3, h);
    sbContext.ctx.fillStyle = "#007a36";
    sbContext.ctx.fillRect(x + (w * 2) / 3, y, w / 3, h);
    sbContext.ctx.fillStyle = "#fff";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(
      x + w / 2,
      y + h / 2,
      Math.min(w, h) * 0.12,
      0,
      Math.PI * 2,
    );
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 1;
    sbContext.ctx.strokeRect(x, y, w, h);
  };

  sbContext.afghanInitState_afghanistan = function (f) {
    f.afghanC4Cd = 0;
    f.afghanC4Charging = false;
    f.afghanC4ChargeT = 0;
    f.afghanRifleCd = 0;
    f.afghanRifleActive = 0;
    f.afghanRifleTick = 0;
    f.afghanRifleShots = 0;
    f._afgDetonateHeld = false;
    f.afghanNetCd = 0;
    f._afgZHeld = false;
    f._afgXHeld = false;
    f._afgCHeld = false;
    f.afghanGrenadeChaos = 0;
    f.afghanGrenadeSpawnTimer = 0;
    f.afghanMinigunActive = 0;
    f.afghanMinigunTick = 0;
    f.afghanPlaneUsed = false;
    f.afghanPlaneCd = 0;
    f.afghanNetTimer = 0;
  };

  sbContext.drawPistol_afghanistan = function (x, y, ang) {
    sbContext.ctx.save();
    sbContext.ctx.translate(x, y);
    sbContext.ctx.rotate(ang);
    sbContext.ctx.fillStyle = "#2a2a2a";
    sbContext.ctx.fillRect(0, -4, 24, 8);
    sbContext.ctx.fillStyle = "#444";
    sbContext.ctx.fillRect(4, -3, 18, 2);
    sbContext.ctx.fillStyle = "#3a2a1a";
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(2, 4);
    sbContext.ctx.lineTo(10, 4);
    sbContext.ctx.lineTo(12, 16);
    sbContext.ctx.lineTo(4, 16);
    sbContext.ctx.closePath();
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#222";
    sbContext.ctx.lineWidth = 1.5;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(8, 8, 3, 0, Math.PI);
    sbContext.ctx.stroke();
    sbContext.ctx.fillStyle = "#111";
    sbContext.ctx.fillRect(24, -3, 4, 6);
    sbContext.ctx.restore();
  };

  sbContext.drawAfghanCloak_afghanistan = function (f, grabbing) {
    sbContext.ctx.save();
    sbContext.ctx.translate(f.x, f.y);
    sbContext.ctx.scale(f.facing, 1);
    const t = f.animTime || 0;
    const sway = Math.sin(t * 2) * 3;
    const pull = grabbing ? Math.sin(t * 15) * 4 : 0;
    sbContext.ctx.fillStyle = sbContext.AFGHANISTAN_COLORS.cloak;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(0, -195);
    sbContext.ctx.quadraticCurveTo(-38 + sway + pull, -120, -50 + sway, 0);
    sbContext.ctx.lineTo(50 + sway, 0);
    sbContext.ctx.quadraticCurveTo(38 + sway + pull, -120, 0, -195);
    sbContext.ctx.closePath();
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = sbContext.AFGHANISTAN_COLORS.cloakDark;
    sbContext.ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * 16;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(o + sway * 0.7, -185);
      sbContext.ctx.quadraticCurveTo(o - 5 + pull, -90, o - 3 + sway, 0);
      sbContext.ctx.stroke();
    }
    sbContext.ctx.fillStyle = "#1a1a1a";
    sbContext.ctx.beginPath();
    sbContext.ctx.ellipse(0, -172, 11, 15, 0, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.fillStyle = "#fff";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(-4, -174, 1.5, 0, Math.PI * 2);
    sbContext.ctx.arc(4, -174, 1.5, 0, Math.PI * 2);
    sbContext.ctx.fill();
    if (grabbing) {
      sbContext.ctx.fillStyle = sbContext.AFGHANISTAN_COLORS.skin;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(-18, -145, 7, 0, Math.PI * 2);
      sbContext.ctx.arc(18, -145, 7, 0, Math.PI * 2);
      sbContext.ctx.fill();
    }
    sbContext.ctx.restore();
  };

  sbContext.drawAfghanPistolAttack_afghanistan = function (f) {
    const a = f.attack;
    const phase =
      a.timer < a.startupEnd
        ? "startup"
        : a.timer < a.activeEnd
          ? "active"
          : "recovery";
    let ang,
      armLen = 50;
    if (phase === "startup") ang = 1.5 - (a.timer / a.startupEnd) * 1.5;
    else if (phase === "active") ang = 0;
    else ang = ((a.timer - a.activeEnd) / (a.totalTime - a.activeEnd)) * 1.5;
    sbContext.ctx.save();
    sbContext.ctx.translate(f.x, f.y);
    sbContext.ctx.scale(f.facing, 1);
    const sx = 14,
      sy = -105;
    const ex = sx + Math.cos(ang) * armLen,
      ey = sy + Math.sin(ang) * armLen;
    sbContext.drawLimb(
      sx,
      sy,
      ex,
      ey,
      11,
      sbContext.AFGHANISTAN_COLORS.shirt,
      sbContext.AFGHANISTAN_COLORS.shirtDark,
    );
    sbContext.ctx.fillStyle = sbContext.AFGHANISTAN_COLORS.skin;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.drawPistol(ex, ey, ang);
    sbContext.ctx.restore();
  };

  sbContext.drawAfghanBaseForm_afghanistan = function (f) {
    drawAfghanBody(sbContext, f, false);
  };

  sbContext.drawAfghanUltForm_afghanistan = function (f) {
    drawAfghanBody(sbContext, f, true);
  };

  sbContext.drawAfghanCast_afghanistan = function (f) {
    sbContext.drawAfghanCloak(f, true);
    sbContext.ctx.save();
    sbContext.ctx.globalAlpha = 0.3 + Math.sin(performance.now() * 0.02) * 0.15;
    sbContext.ctx.strokeStyle = "#ffaa44";
    sbContext.ctx.lineWidth = 2;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(
      f.x,
      f.y - 120,
      60 + Math.sin(performance.now() * 0.01) * 5,
      0,
      Math.PI * 2,
    );
    sbContext.ctx.stroke();
    sbContext.ctx.restore();
  };

  sbContext.drawAfghanCloaks_afghanistan = function () {
    for (const c of sbContext.afghanCloaks) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = Math.min(1, c.life * 2);
      sbContext.ctx.translate(c.x, c.y);
      sbContext.ctx.scale(1.35, 1.35);
      sbContext.ctx.rotate(c.rot);
      sbContext.ctx.scale(c.facing, 1);
      sbContext.ctx.fillStyle = sbContext.AFGHANISTAN_COLORS.cloak;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, -40);
      sbContext.ctx.quadraticCurveTo(-35, 0, -40, 50);
      sbContext.ctx.lineTo(40, 50);
      sbContext.ctx.quadraticCurveTo(35, 0, 0, -40);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = sbContext.AFGHANISTAN_COLORS.cloakDark;
      sbContext.ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const o = (i - 1) * 15;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(o, -35);
        sbContext.ctx.lineTo(o * 1.2, 45);
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.drawAfghanNets_afghanistan = function () {
    for (const n of sbContext.afghanNets) {
      sbContext.ctx.save();
      sbContext.ctx.translate(n.x, n.y);
      sbContext.ctx.rotate(performance.now() * 0.005);
      sbContext.ctx.strokeStyle = "#666";
      sbContext.ctx.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) {
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(i * 8, -25);
        sbContext.ctx.lineTo(i * 8 + 5, 25);
        sbContext.ctx.stroke();
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(-25, i * 8);
        sbContext.ctx.lineTo(25, i * 8 + 5);
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.drawAfghanNetOverlay_afghanistan = function (f) {
    drawNetWrap(sbContext.ctx, f);
  };

  sbContext.drawAfghanProjectiles_afghanistan = function () {
    for (const c of sbContext.afghanC4s) {
      sbContext.ctx.save();
      sbContext.ctx.translate(c.x, c.y);
      if (c.landed) {
        sbContext.ctx.fillStyle = "#4a3a20";
        sbContext.ctx.fillRect(-14, -14, 28, 14);
        sbContext.ctx.strokeStyle = "#000";
        sbContext.ctx.lineWidth = 1;
        sbContext.ctx.strokeRect(-14, -14, 28, 14);
        const blink = Math.sin(performance.now() * 0.01) > 0;
        sbContext.ctx.fillStyle = blink ? "#ff2222" : "#660000";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, -7, 3, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#ff8800";
        sbContext.ctx.font = "bold 9px Arial";
        sbContext.ctx.textAlign = "center";
        sbContext.ctx.fillText(c.owner === sbContext.p1 ? "Q" : "7", 0, 0);
      } else {
        sbContext.ctx.fillStyle = "#4a3a20";
        sbContext.ctx.fillRect(-10, -8, 20, 16);
        sbContext.ctx.fillStyle = "#ff2222";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, 0, 4, 0, Math.PI * 2);
        sbContext.ctx.fill();
      }
      sbContext.ctx.restore();
    }
    for (const b of sbContext.afghanBullets) {
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = 0.7;
      sbContext.ctx.fillStyle = "#ffcc44";
      sbContext.ctx.fillRect(b.x - 12, b.y - 1, 12, 2);
      sbContext.ctx.globalAlpha = 1;
      sbContext.ctx.fillStyle = "#ffaa00";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
    for (const g of sbContext.afghanGrenades) {
      sbContext.ctx.save();
      sbContext.ctx.translate(g.x, g.y);
      sbContext.ctx.rotate(performance.now() * 0.01 + g.x);
      sbContext.ctx.fillStyle = "#4a5a1a";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 7, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#2a3a0a";
      sbContext.ctx.lineWidth = 1.5;
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#666";
      sbContext.ctx.fillRect(-2, -10, 4, 5);
      sbContext.ctx.restore();
    }
    for (const p of sbContext.afghanPlanes) {
      sbContext.ctx.save();
      sbContext.ctx.translate(p.x, p.y);
      sbContext.ctx.scale(4, 4);
      sbContext.ctx.rotate(Math.PI * 0.05);
      sbContext.ctx.fillStyle = "#888";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, -15);
      sbContext.ctx.lineTo(15, 5);
      sbContext.ctx.lineTo(5, 5);
      sbContext.ctx.lineTo(5, 15);
      sbContext.ctx.lineTo(-5, 15);
      sbContext.ctx.lineTo(-5, 5);
      sbContext.ctx.lineTo(-15, 5);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#333";
      sbContext.ctx.lineWidth = 1.5;
      sbContext.ctx.stroke();
      sbContext.ctx.globalAlpha = 0.5;
      sbContext.ctx.fillStyle = "#ff4400";
      sbContext.ctx.fillRect(-3, -30, 6, 15);
      sbContext.ctx.restore();
    }
  };

  sbContext.updateAfghanProjectiles_afghanistan = function (dt) {
    for (const c of sbContext.afghanC4s) {
      if (!c.landed) {
        c.vy += 1400 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.y >= sbContext.GROUND_Y) {
          c.y = sbContext.GROUND_Y;
          c.landed = true;
          c.vx = 0;
          c.vy = 0;
        }
      }
    }
    for (const owner of [sbContext.p1, sbContext.p2]) {
      let landed = sbContext.afghanC4s.filter(
        (c) => c.owner === owner && c.landed,
      );
      while (landed.length > 5) {
        const oldest = landed.shift();
        sbContext.afghanC4s.splice(sbContext.afghanC4s.indexOf(oldest), 1);
      }
      const pressed = owner.isDown(owner === sbContext.p1 ? "KeyQ" : "Numpad7");
      if (
        pressed &&
        !owner._afgDetonateHeld &&
        owner.hp > 0 &&
        sbContext.game.state === "fighting"
      ) {
        for (const c of landed) {
          sbContext.spawnExplosion(c.x, c.y - 20);
          sbContext.doShake(14, 0.22);
          for (const fighter of [sbContext.p1, sbContext.p2])
            if (
              fighter.hp > 0 &&
              Math.hypot(fighter.x - c.x, fighter.y - 70 - (c.y - 20)) < 150
            ) {
              const dir = Math.sign(fighter.x - c.x) || fighter.facing;
              if (fighter !== owner) fighter.takeDamage(15, dir);
              fighter.blastPushTimer = 0.3;
              fighter.blastPushVelocity = dir * 600;
              fighter.vy = Math.min(fighter.vy, -300);
              fighter.onGround = false;
            }
          sbContext.afghanC4s.splice(sbContext.afghanC4s.indexOf(c), 1);
        }
      }
      owner._afgDetonateHeld = !!pressed;
    }
    for (let i = sbContext.afghanBullets.length - 1; i >= 0; i--) {
      const b = sbContext.afghanBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      const enemy = b.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
      if (
        enemy &&
        enemy.hp > 0 &&
        sbContext.circleOverlap({ x: b.x, y: b.y, r: 6 }, enemy.getHurtbox())
      ) {
        enemy.takeDamage(b.damage, Math.sign(b.vx) || 1);
        sbContext.spawnHitSparks(b.x, b.y, "#ffcc44");
        sbContext.afghanBullets.splice(i, 1);
        continue;
      }
      if (
        b.life <= 0 ||
        b.x < sbContext.ARENA_LEFT ||
        b.x > sbContext.ARENA_RIGHT
      )
        sbContext.afghanBullets.splice(i, 1);
    }
    for (let i = sbContext.afghanNets.length - 1; i >= 0; i--) {
      const n = sbContext.afghanNets[i];
      n.life -= dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      const t = n.target;
      if (
        t &&
        t.hp > 0 &&
        (t.afghanNetTimer || 0) <= 0 &&
        sbContext.circleOverlap({ x: n.x, y: n.y, r: 20 }, t.getHurtbox())
      ) {
        t.afghanNetTimer = 2.0;
        sbContext.afghanNets.splice(i, 1);
        sbContext.playSound(300, 0.15, "triangle", 0.1);
        continue;
      }
      if (n.life <= 0) sbContext.afghanNets.splice(i, 1);
    }
    for (let i = sbContext.afghanGrenades.length - 1; i >= 0; i--) {
      const g = sbContext.afghanGrenades[i];
      g.vy += 1200 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.y >= sbContext.GROUND_Y - 10) {
        sbContext.spawnExplosion(g.x, sbContext.GROUND_Y - 20);
        const enemy = g.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
        if (
          enemy &&
          enemy.hp > 0 &&
          Math.hypot(enemy.x - g.x, enemy.y - 80 - (sbContext.GROUND_Y - 20)) <
            90
        )
          enemy.takeDamage(g.damage, Math.sign(enemy.x - g.x) || 1);
        sbContext.afghanGrenades.splice(i, 1);
      }
    }
    for (let i = sbContext.afghanPlanes.length - 1; i >= 0; i--) {
      const p = sbContext.afghanPlanes[i];
      p.y += p.vy * dt;
      if (p.y >= sbContext.GROUND_Y - 100) {
        sbContext.spawnBigExplosion(p.x, sbContext.GROUND_Y - 50);
        const enemy = p.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
        if (enemy && enemy.hp > 0 && Math.abs(enemy.x - p.x) < 300)
          enemy.takeDamage(30, Math.sign(enemy.x - p.x) || 1);
        sbContext.afghanPlanes.splice(i, 1);
      }
    }
    for (let i = sbContext.afghanCloaks.length - 1; i >= 0; i--) {
      const c = sbContext.afghanCloaks[i];
      if (!c.landed) {
        c.vy += 1000 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.vrot * dt;
        if (c.y >= sbContext.GROUND_Y - 40) {
          c.y = sbContext.GROUND_Y - 40;
          c.vx = 0;
          c.vy = 0;
          c.vrot = 0;
          c.landed = true;
          c.life = Math.min(c.life, 4.0);
        }
      } else {
        c.life -= dt;
        if (c.life <= 0) sbContext.afghanCloaks.splice(i, 1);
      }
    }
  };

  sbContext.fighter_reset_afghanistan = function () {
    sbContext.fighter_reset_japan.call(this);
    this.isAfghanistan = this.charType === "afghanistan";
    sbContext.afghanInitState(this);
  };

  sbContext.fighter_castBlockade_afghanistan = function () {
    if (this.isAfghanistan) return;
    sbContext.fighter_castBlockade_japan.call(this);
  };

  sbContext.fighter_castBearSkill_afghanistan = function () {
    if (this.isAfghanistan) return;
    sbContext.fighter_castBearSkill_japan.call(this);
  };

  sbContext.fighter_startAttack_afghanistan = function (type) {
    if (this.isAfghanistan) {
      if (type === "uppercut") return;
      if (this.afghanRifleActive > 0 || this.afghanMinigunActive > 0) return;
    }
    sbContext.fighter_startAttack_japan.call(this, type);
  };

  sbContext.fighter_updateAttack_afghanistan = function (dt, opponent) {
    if (this.isAfghanistan && this.attack && this.attack.type === "punch") {
      const a = this.attack;
      a.timer += dt;
      if (a.timer >= a.startupEnd && a.timer < a.activeEnd && !a.hasHit) {
        a.hasHit = true;
        sbContext.afghanBullets.push({
          x: this.x + this.facing * 60,
          y: this.y - 100,
          vx: this.facing * 1500,
          vy: 0,
          owner: this,
          damage: 4,
          life: 1.5,
        });
        sbContext.spawnMuzzleFlash(
          this.x + this.facing * 65,
          this.y - 100,
          this.facing,
        );
        sbContext.playSound(800, 0.05, "square", 0.08);
      }
      if (a.timer >= a.totalTime) this.attack = null;
      return;
    }
    sbContext.fighter_updateAttack_japan.call(this, dt, opponent);
  };

  sbContext.fighter_takeDamage_afghanistan = function (dmg, dir) {
    const before = this.hp;
    if (this.isAfghanistan) {
      if (this.ultTimer > 0) {
        const saved = this.ultTimer;
        this.ultTimer = 0;
        sbContext.fighter_takeDamage_japan.call(this, dmg, dir);
        this.ultTimer = saved;
        if (this.hp < before) {
          this.afghanRifleActive = 0;
          this.afghanMinigunActive = 0;
        }
        return;
      }
    }
    sbContext.fighter_takeDamage_japan.call(this, dmg, dir);
    if (this.hp < before) {
      this.afghanRifleActive = 0;
      this.afghanMinigunActive = 0;
    }
  };

  sbContext.fighter_startDash_afghanistan = function () {
    if (this.afghanNetTimer > 0) return;
    sbContext.fighter_startDash_base.call(this);
  };

  sbContext.fighter_update_afghanistan = function (dt, opponent, allowInput) {
    if (!updatesSkills(this, "afghanistan") || this.trainingDummy) {
      const beforeX = this.x;
      sbContext.fighter_update_japan.call(this, dt, opponent, allowInput);
      if (this.afghanNetTimer > 0) {
        this.x = beforeX;
        this.afghanNetTimer -= dt;
        if (this.afghanNetTimer <= 0) this.afghanNetTimer = 0;
      }
      return;
    }
    if (this.afghanC4Cd === undefined) sbContext.afghanInitState(this);
    if (this.ultTimer <= 0) {
      this.afghanGrenadeChaos = 0;
      this.afghanMinigunActive = 0;
    }

    this.afghanC4Cd = Math.max(0, this.afghanC4Cd - dt);
    this.afghanRifleCd = Math.max(0, this.afghanRifleCd - dt);
    this.afghanNetCd = Math.max(0, this.afghanNetCd - dt);
    this.afghanPlaneCd = Math.max(0, this.afghanPlaneCd - dt);
    if (this.afghanNetTimer > 0) {
      this.afghanNetTimer -= dt;
      if (this.afghanNetTimer <= 0) this.afghanNetTimer = 0;
    }

    const beforeX = this.x;
    const canAct =
      allowInput &&
      hasSkills(this, "afghanistan") &&
      this.blockedTimer <= 0 &&
      this.hp > 0 &&
      this.hitstun <= 0 &&
      !this.carried &&
      !this.ultCharging &&
      !this.attack;

    if (canAct) {
      const zDown = skillDown(this, "afghanistan", 0);
      const xDown = skillDown(this, "afghanistan", 1);
      const cDown = skillDown(this, "afghanistan", 2);

      if (this.ultTimer > 0) {
        // ===== УЛЬТА =====
        if (zDown && !this._afgZHeld && this.afghanC4Cd <= 0) {
          this._afgZHeld = true;
          this.afghanGrenadeChaos = 2.0;
          this.afghanGrenadeSpawnTimer = 0;
          this.afghanC4Cd = 8;
          sbContext.particles.push({
            x: this.x,
            y: this.y - 220,
            vx: 0,
            vy: -40,
            life: 1.2,
            maxLife: 1.2,
            color: "#ff2200",
            size: 24,
            isText: true,
            text: "💣 ГРАНАТНЫЙ ХАОС",
          });
        }
        if (!zDown) this._afgZHeld = false;

        if (
          xDown &&
          !this._afgXHeld &&
          this.afghanRifleCd <= 0 &&
          this.afghanMinigunActive <= 0
        ) {
          this._afgXHeld = true;
          this.afghanMinigunActive = 1.5;
          this.afghanMinigunTick = 0;
          this.afghanRifleCd = 8;
          sbContext.particles.push({
            x: this.x,
            y: this.y - 220,
            vx: 0,
            vy: -40,
            life: 1.2,
            maxLife: 1.2,
            color: "#ffaa00",
            size: 24,
            isText: true,
            text: "🔥 МИНИГАН",
          });
        }
        if (!xDown) this._afgXHeld = false;

        if (
          cDown &&
          !this._afgCHeld &&
          this.afghanPlaneCd <= 0 &&
          !this.afghanPlaneUsed
        ) {
          this._afgCHeld = true;
          this.afghanPlaneUsed = true;
          this.afghanPlaneCd = 10;
          const target = this === sbContext.p1 ? sbContext.p2 : sbContext.p1;
          sbContext.afghanPlanes.push({
            x: target.x,
            y: -300,
            vy: 400,
            owner: this,
          });
          sbContext.particles.push({
            x: this.x,
            y: this.y - 240,
            vx: 0,
            vy: -50,
            life: 1.5,
            maxLife: 1.5,
            color: "#ff0000",
            size: 26,
            isText: true,
            text: "✈ АЛЛАХУ АКБАР",
          });
          sbContext.playSound(200, 0.5, "sawtooth", 0.15);
          sbContext.playSound(400, 0.3, "square", 0.1);
          sbContext.flash("rgba(255,100,0,0.3)");
        }
        if (!cDown) this._afgCHeld = false;
      } else {
        // ===== БАЗА =====
        if (
          zDown &&
          !this._afgZHeld &&
          this.afghanC4Cd <= 0 &&
          !this.afghanC4Charging
        ) {
          this._afgZHeld = true;
          this.afghanC4Charging = true;
          this.afghanC4ChargeT = 0;
          sbContext.playSound(400, 0.1, "sine", 0.05);
        }
        if (this.afghanC4Charging) {
          this.afghanC4ChargeT += dt;
          if (this.afghanC4ChargeT > 1.5) this.afghanC4ChargeT = 1.5;
          if (!zDown) {
            const charge = this.afghanC4ChargeT / 1.5;
            sbContext.afghanC4s.push({
              x: this.x + this.facing * 30,
              y: this.y - 120,
              vx: this.facing * (200 + charge * 500),
              vy: -300,
              owner: this,
              timer: 4.0,
              landed: false,
            });
            this.afghanC4Charging = false;
            this.afghanC4Cd = 5;
            sbContext.playSound(300, 0.15, "triangle", 0.08);
          }
        }
        if (!zDown) this._afgZHeld = false;

        if (
          xDown &&
          !this._afgXHeld &&
          this.afghanRifleCd <= 0 &&
          this.afghanRifleActive <= 0
        ) {
          this._afgXHeld = true;
          this.afghanRifleActive = 1;
          this.afghanRifleShots = 5;
          this.afghanRifleTick = 0;
          this.afghanRifleCd = 8;
          sbContext.playSound(500, 0.1, "square", 0.06);
        }
        if (!xDown) this._afgXHeld = false;

        if (cDown && !this._afgCHeld && this.afghanNetCd <= 0) {
          this._afgCHeld = true;
          this.afghanNetCd = 10;
          const target = this === sbContext.p1 ? sbContext.p2 : sbContext.p1;
          const dx = target.x - this.x,
            dy = target.y - 80 - (this.y - 90);
          const d = Math.max(0.1, Math.hypot(dx, dy));
          sbContext.afghanNets.push({
            x: this.x + this.facing * 40,
            y: this.y - 90,
            vx: (dx / d) * 900,
            vy: (dy / d) * 900,
            owner: this,
            target,
            life: 1.5,
          });
          sbContext.playSound(400, 0.1, "triangle", 0.06);
        }
        if (!cDown) this._afgCHeld = false;
      }
    }

    // Тики стрельбы
    if (this.afghanRifleActive > 0) {
      this.afghanRifleTick -= dt;
      if (
        this.afghanRifleTick <= 0 &&
        allowInput &&
        this.afghanRifleShots > 0 &&
        this.hitstun <= 0
      ) {
        this.afghanRifleTick = 0.09;
        this.afghanRifleShots--;
        if (this.afghanRifleShots === 0) this.afghanRifleActive = 0;
        sbContext.afghanBullets.push({
          x: this.x + this.facing * 60,
          y: this.y - 100,
          vx: this.facing * 1400,
          vy: 0,
          owner: this,
          damage: 5,
          life: 1.5,
        });
        sbContext.spawnMuzzleFlash(
          this.x + this.facing * 65,
          this.y - 100,
          this.facing,
        );
        sbContext.playSound(600, 0.03, "square", 0.05);
      }
    }
    if (this.afghanMinigunActive > 0) {
      this.afghanMinigunActive -= dt;
      this.afghanMinigunTick -= dt;
      if (this.afghanMinigunTick <= 0 && allowInput) {
        this.afghanMinigunTick = 0.1;
        sbContext.afghanBullets.push({
          x: this.x + this.facing * 60,
          y: this.y - 100 + (Math.random() - 0.5) * 20,
          vx: this.facing * 1800,
          vy: (Math.random() - 0.5) * 80,
          owner: this,
          damage: 2,
          life: 1.5,
        });
        sbContext.spawnMuzzleFlash(
          this.x + this.facing * 65,
          this.y - 100,
          this.facing,
        );
        sbContext.playSound(700, 0.02, "square", 0.04);
      }
    }
    if (this.afghanGrenadeChaos > 0) {
      this.afghanGrenadeChaos -= dt;
      this.afghanGrenadeSpawnTimer -= dt;
      if (this.afghanGrenadeSpawnTimer <= 0 && this.afghanGrenadeChaos > 0) {
        this.afghanGrenadeSpawnTimer = 0.167;
        const ang = Math.random() * Math.PI * 2;
        const speed = 250 + Math.random() * 250;
        sbContext.afghanGrenades.push({
          x: this.x + this.facing * Math.cos(this.animTime * 35 + 1) * 68,
          y: this.y - 120 + Math.sin(this.animTime * 35 + 1) * 42,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 250,
          owner: this,
          damage: 10,
          life: 3,
        });
        sbContext.playSound(500 + Math.random() * 200, 0.05, "square", 0.03);
      }
    }

    sbContext.fighter_update_japan.call(this, dt, opponent, allowInput);

    if (this.afghanRifleActive > 0 || this.afghanMinigunActive > 0) {
      const moved = this.x - beforeX;
      this.x = beforeX + moved * 0.4;
      this.clampX();
    }
    if (this.afghanNetTimer > 0) this.x = beforeX;
  };

  sbContext.triggerUlt_afghanistan = function (f, opp) {
    if (!f.isAfghanistan) {
      sbContext.triggerUlt_japan.call(this, f, opp);
      return;
    }
    if (f.ultUsed) return;
    f.ultUsed = true;
    f.ultCharging = false;
    f.ultChargeTimer = 0;
    f.ultTimer = sbContext.AFGHAN_ULT_DUR;
    f.ultCooldown = 0;
    f.afghanGrenadeChaos = 0;
    f.afghanMinigunActive = 0;
    f.afghanPlaneUsed = false;
    f.afghanPlaneCd = 0;
    f.state = "idle";
    f.hitstun = 0;
    f.attack = null;
    sbContext.afghanCloaks.push({
      x: f.x + f.facing * 20,
      y: f.y - 130,
      vx: -f.facing * 100 + (Math.random() - 0.5) * 80,
      vy: -350,
      rot: 0,
      vrot: (Math.random() - 0.5) * 8,
      life: 5.0,
      maxLife: 5.0,
      landed: false,
      facing: f.facing,
    });
    sbContext.flash("rgba(255,200,100,0.4)");
    sbContext.doShake(25, 0.4);
    sbContext.playSound(400, 0.3, "sawtooth", 0.12);
    sbContext.playSound(800, 0.2, "triangle", 0.1);
    sbContext.particles.push({
      x: f.x,
      y: f.y - 240,
      vx: 0,
      vy: -60,
      life: 2.0,
      maxLife: 2.0,
      color: "#ff8800",
      size: 40,
      isText: true,
      text: "ОБВЕШАН ОРУЖИЕМ!",
    });
    for (const c of sbContext.crowd) c.excited = 3;
  };

  sbContext.drawFighter_afghanistan = function (f) {
    if (!f.isAfghanistan) {
      sbContext.drawFighter_japan.call(this, f);
      if (f.afghanNetTimer > 0) sbContext.drawAfghanNetOverlay(f);
      return;
    }
    if (f.trainingDummy) {
      sbContext.drawFighter_japan.call(this, f);
      return;
    }
    if (f.ultTimer > 0) sbContext.drawAfghanUltForm(f);
    else if (f.ultCharging) sbContext.drawAfghanCast(f);
    else sbContext.drawAfghanBaseForm(f);
    if (f.afghanNetTimer > 0) sbContext.drawAfghanNetOverlay(f);
  };

  sbContext.updateParticles_afghanistan = function (dt) {
    sbContext.updateParticles_japan(dt);
    sbContext.updateAfghanProjectiles(dt);
  };

  sbContext.drawWorld_afghanistan = function (t) {
    sbContext.drawWorld_japan(t);
    sbContext.drawAfghanCloaks();
    sbContext.drawAfghanProjectiles();
    sbContext.drawAfghanNets();
  };

  sbContext.getPlayerSkills_afghanistan = function (f) {
    if (f.isAfghanistan) {
      if (f.ultTimer > 0) {
        return [
          {
            key: f === sbContext.p1 ? "Z" : "N1",
            icon: "💣",
            cd: f.afghanC4Cd || 0,
          },
          {
            key: f === sbContext.p1 ? "X" : "N2",
            icon: "🔥",
            cd: f.afghanRifleCd || 0,
          },
          {
            key: f === sbContext.p1 ? "C" : "N3",
            icon: "✈",
            cd: f.afghanPlaneCd || 0,
          },
        ];
      }
      return [
        {
          key: f === sbContext.p1 ? "Z" : "N1",
          icon: "💥",
          cd: f.afghanC4Cd || 0,
        },
        {
          key: f === sbContext.p1 ? "X" : "N2",
          icon: "🔫",
          cd: f.afghanRifleCd || 0,
        },
        {
          key: f === sbContext.p1 ? "C" : "N3",
          icon: "🕸",
          cd: f.afghanNetCd || 0,
        },
      ];
    }
    return sbContext.getPlayerSkills_japan(f);
  };

  sbContext.sbDescription_afghanistan = function (id) {
    if (id === "afghanistan")
      return {
        skills: [
          [
            "Z · C4",
            "Бросок C4, удержание увеличивает дальность. До 5 бомб на земле. Q / Num7 подрывает свои: 15 урона врагу, обоим отталкивание, радиус 150. КД 5с.",
          ],
          [
            "X · АВТОМАТ",
            "Быстрая очередь: ровно 5 патронов по 5 урона. Персонаж замедлен. Получение урона прерывает стрельбу.",
          ],
          [
            "C · СЕТКА",
            "Снаряд-сетка. При попадании фиксирует врага на 2с — движение запрещено, атаки/навыки/блок доступны.",
          ],
        ],
        ult: "ХАРАКИРИ (2с подготовки, прерывается уроном) → 10с ультра-форма. Z: гранатный хаос (12 гранат 10 dmg). X: миниган (15 выстр × 2 dmg). C: самолёт (30 dmg, 10с КД, 1 раз за ульту).",
      };
    return sbContext.sbDescription_japan(id);
  };

  sbContext.drawMiniPortrait_afghanistan = function (x, y, size, f) {
    sbContext.drawMiniPortrait_japan(x, y, size, f);
    if (f.isAfghanistan) {
      sbContext.ctx.save();
      sbContext.ctx.translate(x + size / 2, y + size * 0.35);
      sbContext.ctx.scale(size / 80, size / 80);
      sbContext.ctx.fillStyle = "#4a5a3a";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, -40);
      sbContext.ctx.quadraticCurveTo(-40, 0, -35, 40);
      sbContext.ctx.lineTo(35, 40);
      sbContext.ctx.quadraticCurveTo(40, 0, 0, -40);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#2a3a1a";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#1a1a1a";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(0, -10, 12, 16, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(-4, -12, 1.5, 0, Math.PI * 2);
      sbContext.ctx.arc(4, -12, 1.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
  };

  sbContext.drawSelectScreen_afghanistan = function () {
    sbContext.ctx.fillStyle = "#050505";
    sbContext.ctx.fillRect(0, 0, sbContext.W, sbContext.H);
    sbContext.ctx.font = "bold 50px Impact, Arial Black, sans-serif";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 8;
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.strokeText("ВЫБОР ПЕРСОНАЖА", sbContext.W / 2, 55);
    sbContext.ctx.fillText("ВЫБОР ПЕРСОНАЖА", sbContext.W / 2, 55);
    for (const k of Object.keys(sbContext.buttons)) delete sbContext.buttons[k];
    sbContext.drawSelectPanel(
      sbContext.W / 2 - 450,
      110,
      "P1",
      sbContext.selections.p1,
      ["p1u", "p1r", "p1a", "p1c", "p1j", "p1f"],
      "Shift · Z X C · R",
    );
    sbContext.drawSelectPanel(
      sbContext.W / 2 + 50,
      110,
      sbContext.game.mode === "pve" ? "P2 (ИИ)" : "P2",
      sbContext.selections.p2,
      ["p2u", "p2r", "p2a", "p2c", "p2j", "p2f"],
      sbContext.game.mode === "pve"
        ? "Управляется компьютером"
        : "Стрелки · Num 1 2 3",
    );
    if (sbContext.game.mode === "pve") {
      sbContext.ctx.fillStyle = "#ffd700";
      sbContext.ctx.font = "bold 16px Arial";
      sbContext.ctx.textAlign = "left";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText("СЛОЖНОСТЬ БОТА:", sbContext.W / 2 - 360, 700);
      const labels = {
        easy: "🟢 ЛЕГКО",
        medium: "🟡 СРЕДНЕ",
        hard: "🔴 СЛОЖНО",
      };
      ["easy", "medium", "hard"].forEach((d, i) => {
        const bx = sbContext.W / 2 - 200 + i * 140,
          by = 682,
          bw = 130,
          bh = 36;
        const sel = sbContext.game.difficulty === d;
        sbContext.ctx.fillStyle = sel
          ? "rgba(255,215,0,0.30)"
          : "rgba(0,0,0,0.65)";
        sbContext.ctx.fillRect(bx, by, bw, bh);
        sbContext.ctx.strokeStyle = sel ? "#ffd700" : "#666";
        sbContext.ctx.lineWidth = sel ? 3 : 1.5;
        sbContext.ctx.strokeRect(bx, by, bw, bh);
        sbContext.ctx.fillStyle = sel ? "#ffd700" : "#ccc";
        sbContext.ctx.font = "bold 15px Arial";
        sbContext.ctx.textAlign = "center";
        sbContext.ctx.fillText(labels[d], bx + bw / 2, by + bh / 2);
        sbContext.buttons["diff_" + d] = { x: bx, y: by, w: bw, h: bh };
      });
    }
    sbContext.button(
      sbContext.W / 2 - 180,
      760,
      360,
      65,
      "start",
      "▶ НАЧАТЬ МАТЧ",
      "#55ff88",
      "rgba(0,50,0,.5)",
    );
    sbContext.button(
      sbContext.W / 2 - 100,
      845,
      200,
      48,
      "back",
      "← НАЗАД",
      "#ff5555",
      "rgba(50,0,0,.5)",
    );
    if (sbContext.game.infoPanel) sbContext.sbDrawInfoPanel();
  };
}

export function initializeCharacter(sbContext) {
  sbContext.AFGHAN_ULT_DUR = 10;
  sbContext.afghanC4s = [];
  sbContext.afghanBullets = [];
  sbContext.afghanNets = [];
  sbContext.afghanGrenades = [];
  sbContext.afghanPlanes = [];
  sbContext.afghanCloaks = [];
}
