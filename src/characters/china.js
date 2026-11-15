import { drawChineseDragon } from "../rendering/chinese-dragon.js";
import { releaseDragonVictim, updateDragonRush } from "./dragon-rush.js";
// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.cnText_china = function (x, y, txt, color = "#fff") {
    sbContext.particles.push({
      x,
      y,
      vx: 0,
      vy: -42,
      life: 1.2,
      maxLife: 1.2,
      color,
      size: 20,
      isText: true,
      text: txt,
    });
  };

  sbContext.cnInit_china = function (f) {
    if (f._cnInit) return;
    f._cnInit = true;
    f.noodleCharges = 0;
    f.noodleMode = false;
    f.fireworkCd = 0;
    f.lanternCd = 0;
    f.breathCd = 0;
    f.tailCd = 0;
    f.roarCd = 0;
    f.dragonRush = 0;
    f.dragonVictim = null;
    f.dragonCaptured = false;
    f.dragonGrabTime = 0;
    f.dragonTarget = null;
    f._cnZHeld = false;
    f._cnXHeld = false;
    f._cnCHeld = false;
    f.burnTimer = 0;
    f.burnInterval = 0;
    f.burnDmg = 0;
    f.burnTicksLeft = 0;
    f.slowTimer = 0;
    if (!f.skillCd.noodle) f.skillCd.noodle = 0;
  };

  sbContext.fighter_reset_china = function () {
    releaseDragonVictim(this, true);
    sbContext.fighter_reset_arena.call(this);
    this._cnInit = false;
    sbContext.cnInit(this);
    this.skillCd.noodle = 0;
  };

  sbContext.fighter_update_china = function (dt, opponent, allowInput) {
    const flying = this.isChina && this.dragonRush > 0;
    const flightY = this.y;
    sbContext.fighter_update_interface.call(
      this,
      dt,
      opponent,
      allowInput && !flying,
    );
    if (!this.isChina || this.trainingDummy) return;
    sbContext.cnInit(this);

    // Tick CDs (skillCd.noodle сам уменьшается в базе, не дублируем)
    this.fireworkCd = Math.max(0, this.fireworkCd - dt);
    this.lanternCd = Math.max(0, this.lanternCd - dt);
    this.breathCd = Math.max(0, this.breathCd - dt);
    this.tailCd = Math.max(0, this.tailCd - dt);
    this.roarCd = Math.max(0, this.roarCd - dt);
    if (flying) {
      this.y = flightY;
      if (updateDragonRush(sbContext, this, dt, allowInput)) return;
    }

    // Нельзя кастовать в ульте-зарядке / стане / переноске
    if (
      !allowInput ||
      this.hitstun > 0 ||
      this.carried ||
      this.hp <= 0 ||
      this.ultCharging
    )
      return;

    const zDown = this.isDown(this.controls.skill1);
    const xDown = this.isDown(this.controls.skill2);
    const cDown = this.isDown(this.controls.skill3);

    if (this.ultTimer > 0) {
      // === ДРАКОН: Z / X / C ===
      if (zDown && !this._cnZHeld && this.breathCd <= 0) {
        this.cnBreath(opponent);
        this.breathCd = 3;
        this._cnZHeld = true;
      }
      if (!zDown) this._cnZHeld = false;

      if (xDown && !this._cnXHeld && this.tailCd <= 0) {
        this.cnTail(opponent);
        this.tailCd = 4;
        this._cnXHeld = true;
      }
      if (!xDown) this._cnXHeld = false;

      if (cDown && !this._cnCHeld && this.roarCd <= 0) {
        this.cnRoar(opponent);
        this.roarCd = 10;
        this._cnCHeld = true;
      }
      if (!cDown) this._cnCHeld = false;
    } else {
      // === ОБЫЧНЫЕ: Z / X / C ===
      if (zDown && !this._cnZHeld) {
        this._cnZHeld = true;
        if (this.noodleCharges === 0 && this.skillCd.noodle <= 0) {
          this.noodleCharges = 5;
          this.noodleMode = true;
          sbContext.cnText(this.x, this.y - 200, "🍜 ДОШИРАК x5", "#ff8844");
          sbContext.playSound(600, 0.15, "sine", 0.08);
        } else if (this.noodleCharges > 0) {
          this.cnNoodleShot(opponent);
          this.noodleCharges--;
          if (this.noodleCharges === 0) {
            this.noodleMode = false;
            this.skillCd.noodle = 15;
            sbContext.particles.push({
              x: this.x + this.facing * 30,
              y: this.y - 90,
              vx: this.facing * 250,
              vy: -300,
              life: 0.8,
              maxLife: 0.8,
              color: "#ff6600",
              size: 12,
              gravity: 1200,
            });
            sbContext.cnText(this.x, this.y - 160, "ПУСТО!", "#ffaa44");
          }
        }
      }
      if (!zDown) this._cnZHeld = false;

      if (xDown && !this._cnXHeld && this.fireworkCd <= 0) {
        this.cnFirework(opponent);
        this.fireworkCd = 5;
        this._cnXHeld = true;
      }
      if (!xDown) this._cnXHeld = false;

      if (cDown && !this._cnCHeld && this.lanternCd <= 0) {
        this.cnLantern(opponent);
        this.lanternCd = 10;
        this._cnCHeld = true;
      }
      if (!cDown) this._cnCHeld = false;
    }
  };

  sbContext.fighter_cnNoodleShot_china = function (target) {
    const dir = this.facing;
    sbContext.cnNoodle.push({
      x: this.x + dir * 42,
      y: this.y - 90,
      vx: dir * 1400,
      vy: 0,
      r: 10,
      damage: 5,
      life: 1.5,
      owner: this,
      target,
      trail: [],
    });
    sbContext.spawnMuzzleFlash(this.x + dir * 45, this.y - 90, dir);
    sbContext.playSound(900, 0.06, "square", 0.06);
  };

  sbContext.fighter_cnFirework_china = function (target) {
    const dir = this.facing;
    sbContext.cnFireworks.push({
      x0: this.x + dir * 50,
      y0: this.y - 120,
      x: this.x + dir * 50,
      y: this.y - 120,
      tx: this.x + dir * 280,
      ty: this.y - 40,
      age: 0,
      duration: 0.6,
      owner: this,
      target,
      radius: 180,
      damage: 10,
    });
    sbContext.cnText(this.x, this.y - 170, "🎆 ФЕЙЕРВЕРК", "#ffcc00");
    sbContext.playSound(500, 0.15, "sine", 0.1);
    sbContext.playSound(800, 0.2, "triangle", 0.08);
  };

  sbContext.fighter_cnLantern_china = function (target) {
    sbContext.cnLanterns.push({
      x: this.x + this.facing * 30,
      y: this.y - 100,
      owner: this,
      life: 4,
      age: 0,
      fireCd: 0.3,
      radius: 300,
    });
    sbContext.cnText(this.x, this.y - 180, "🏮 ФОНАРЬ", "#ffcc00");
    sbContext.playSound(700, 0.2, "triangle", 0.1);
  };

  sbContext.fighter_cnBreath_china = function (target) {
    sbContext.cnFireCones.push({
      x: this.x,
      y: this.y - 80,
      dir: this.facing,
      length: 450,
      width: 200,
      life: 0.6,
      maxLife: 0.6,
      owner: this,
      hit: new Set(),
    });
    sbContext.playSound(200, 0.3, "sawtooth", 0.15);
    sbContext.doShake(8, 0.2);
  };

  sbContext.fighter_cnTail_china = function (target) {
    sbContext.cnTails.push({
      x: this.x,
      y: this.y - 80,
      radius: 200,
      life: 0.4,
      maxLife: 0.4,
      owner: this,
    });
    sbContext.playSound(120, 0.2, "sawtooth", 0.15);
    sbContext.doShake(15, 0.25);
    if (target && target.hp > 0 && Math.hypot(target.x - this.x, 0) < 200) {
      target.takeDamage(12, this.facing);
      target.hitstun = 0.4;
      target.starStunTimer = 0.4;
      target.vx = this.facing * 400;
      if (!target.onGround) target.vy = 200;
    }
  };

  sbContext.fighter_cnRoar_china = function (target) {
    this.dragonRush = 1.5;
    this.dragonTarget = target;
    this.dragonVictim = null;
    this.dragonCaptured = false;
    this.dragonGrabTime = 0;
    this.attack = null;
    this.vx = 0;
    this.vy = 0;
  };

  sbContext.triggerUlt_china = function (f, opp) {
    if (f.isChina) {
      if (f.ultUsed) return;
      f.ultUsed = true;
      f.ultTimer = 10;
      f.ultCooldown = 0;
      f.state = "idle";
      f.hitstun = 0;
      f.attack = null;
      f.maxHp = Math.floor(f.maxHp * 1.2);
      f.hp = Math.min(f.maxHp, f.hp + 20);

      for (let i = 0; i < 80; i++) {
        const a = Math.random() * Math.PI * 2,
          s = 100 + Math.random() * 400;
        sbContext.particles.push({
          x: f.x,
          y: f.y - 100,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 150,
          life: 1.2 + Math.random() * 0.8,
          maxLife: 2.0,
          color: ["#ffcc00", "#ffaa00", "#ff8800", "#ffffff"][
            Math.floor(Math.random() * 4)
          ],
          size: 5 + Math.random() * 8,
        });
      }
      for (let i = 0; i < 4; i++) {
        sbContext.explosionRings.push({
          x: f.x,
          y: f.y - 100,
          r: 20 + i * 10,
          maxR: 400 + i * 100,
          life: 0.6 + i * 0.1,
          maxLife: 0.7,
          color: `rgba(255,${200 - i * 30},0,`,
        });
      }
      sbContext.doShake(40, 0.8);
      sbContext.playSound(300, 0.5, "sawtooth", 0.2);
      sbContext.playSound(800, 0.3, "triangle", 0.15);
      sbContext.particles.push({
        x: f.x,
        y: f.y - 260,
        vx: 0,
        vy: -60,
        life: 2.0,
        maxLife: 2.0,
        color: "#ffcc00",
        size: 56,
        isText: true,
        text: "🐉 ДРАКОН!",
      });
      sbContext.cnText(f.x, f.y - 210, "+20% MAX HP", "#ffd700");
      for (const c of sbContext.crowd) c.excited = 3;
      return;
    }
    sbContext.triggerUlt_interface.call(this, f, opp);
  };

  sbContext.cnUpdateProjectiles_china = function (dt) {
    // Лапша
    for (let i = sbContext.cnNoodle.length - 1; i >= 0; i--) {
      const n = sbContext.cnNoodle[i];
      n.life -= dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.trail.push({ x: n.x, y: n.y });
      if (n.trail.length > 10) n.trail.shift();
      const t = n.target;
      if (
        t &&
        t.hp > 0 &&
        !t.carried &&
        Math.hypot(n.x - t.x, n.y - (t.y - 80)) < 50
      ) {
        t.takeDamage(n.damage, n.owner.facing);
        sbContext.spawnHitSparks(n.x, n.y, "#ffcc00");
        sbContext.cnNoodle.splice(i, 1);
        continue;
      }
      if (
        n.life <= 0 ||
        n.x < sbContext.ARENA_LEFT ||
        n.x > sbContext.ARENA_RIGHT
      )
        sbContext.cnNoodle.splice(i, 1);
    }

    // Фейерверк
    for (let i = sbContext.cnFireworks.length - 1; i >= 0; i--) {
      const f = sbContext.cnFireworks[i];
      f.age += dt;
      const p = Math.min(1, f.age / f.duration);
      f.x = f.x0 + (f.tx - f.x0) * p;
      f.y = f.y0 + (f.ty - f.y0) * p - Math.sin(p * Math.PI) * 220;
      if (p >= 1) {
        const colors = [
          "#ff0044",
          "#ffcc00",
          "#00ccff",
          "#cc00ff",
          "#00ff88",
          "#ff6600",
        ];
        for (let b = 0; b < 3; b++) {
          setTimeout(() => {
            for (let j = 0; j < 20; j++) {
              const a = Math.random() * Math.PI * 2,
                s = 150 + Math.random() * 300;
              sbContext.particles.push({
                x: f.tx,
                y: f.ty,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 100,
                life: 1.0 + Math.random() * 0.5,
                maxLife: 1.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 6,
                gravity: 400,
              });
            }
          }, b * 150);
        }
        const t = f.target;
        if (
          t &&
          t.hp > 0 &&
          Math.hypot(t.x - f.tx, t.y - 80 - f.ty) < f.radius
        ) {
          t.takeDamage(f.damage, f.owner.facing);
        }
        sbContext.doShake(8, 0.2);
        sbContext.playSound(1200, 0.1, "triangle", 0.1);
        sbContext.cnFireworks.splice(i, 1);
      }
    }

    // Фонарь
    for (let i = sbContext.cnLanterns.length - 1; i >= 0; i--) {
      const l = sbContext.cnLanterns[i];
      l.life -= dt;
      l.age += dt;
      l.fireCd -= dt;
      if (l.life <= 0) {
        sbContext.cnLanterns.splice(i, 1);
        continue;
      }
      if (l.fireCd <= 0) {
        l.fireCd = 0.6;
        const enemy = l.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
        if (
          enemy &&
          enemy.hp > 0 &&
          Math.hypot(enemy.x - l.x, enemy.y - 80 - (l.y - 100)) < l.radius
        ) {
          const dx = enemy.x - l.x,
            dy = enemy.y - 80 - (l.y - 100);
          const d = Math.max(0.1, Math.hypot(dx, dy));
          sbContext.cnNoodle.push({
            x: l.x,
            y: l.y - 100,
            vx: (dx / d) * 800,
            vy: (dy / d) * 800,
            r: 6,
            damage: 3,
            life: 1.5,
            owner: l.owner,
            target: enemy,
            trail: [],
          });
          sbContext.playSound(1400, 0.04, "square", 0.05);
        }
      }
    }

    // Дыхание
    for (let i = sbContext.cnFireCones.length - 1; i >= 0; i--) {
      const c = sbContext.cnFireCones[i];
      c.life -= dt;
      if (c.life <= 0) {
        sbContext.cnFireCones.splice(i, 1);
        continue;
      }
      const t = c.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
      if (t && t.hp > 0 && !c.hit.has(t)) {
        const along = (t.x - c.owner.x) * c.dir;
        const perp = Math.abs(t.y - 80 - (c.owner.y - 80));
        if (along > 0 && along < c.length && perp < c.width / 2) {
          c.hit.add(t);
          t.takeDamage(15, c.dir);
          t.burnTimer = 3;
          t.burnInterval = 1;
          t.burnDmg = 3;
          t.burnTicksLeft = 3;
          sbContext.spawnHitSparks(t.x, t.y - 80, "#ff4400");
        }
      }
    }

    for (let i = sbContext.cnTails.length - 1; i >= 0; i--) {
      sbContext.cnTails[i].life -= dt;
      if (sbContext.cnTails[i].life <= 0) sbContext.cnTails.splice(i, 1);
    }
    for (let i = sbContext.cnRoars.length - 1; i >= 0; i--) {
      sbContext.cnRoars[i].life -= dt;
      if (sbContext.cnRoars[i].life <= 0) sbContext.cnRoars.splice(i, 1);
    }
  };

  sbContext.cnDrawProjectiles_china = function () {
    // Лапша
    for (const n of sbContext.cnNoodle) {
      for (let i = 0; i < n.trail.length; i++) {
        sbContext.ctx.globalAlpha = (i / n.trail.length) * 0.5;
        sbContext.ctx.fillStyle = "#ffcc00";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(n.trail[i].x, n.trail[i].y, 4, 0, Math.PI * 2);
        sbContext.ctx.fill();
      }
      sbContext.ctx.globalAlpha = 1;
      sbContext.ctx.save();
      sbContext.ctx.translate(n.x, n.y);
      sbContext.ctx.rotate(Math.atan2(n.vy, n.vx));
      sbContext.ctx.strokeStyle = "#ffcc00";
      sbContext.ctx.lineWidth = 5;
      sbContext.ctx.lineCap = "round";
      sbContext.ctx.beginPath();
      for (let i = -15; i <= 15; i += 3) {
        const yy = Math.sin(i * 0.5 + performance.now() * 0.02) * 3;
        if (i === -15) sbContext.ctx.moveTo(i, yy);
        else sbContext.ctx.lineTo(i, yy);
      }
      sbContext.ctx.stroke();
      sbContext.ctx.strokeStyle = "#fff";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.stroke();
      sbContext.ctx.restore();
    }

    // Фейерверк
    for (const f of sbContext.cnFireworks) {
      sbContext.ctx.save();
      sbContext.ctx.translate(f.x, f.y);
      sbContext.ctx.scale(1.6, 1.6);
      sbContext.ctx.fillStyle = "#c93437";
      sbContext.ctx.strokeStyle = "#f2c457";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.beginPath();
      sbContext.ctx.roundRect(-6, -19, 12, 28, 3);
      sbContext.ctx.fill();
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#e9b545";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-9, -19);
      sbContext.ctx.lineTo(0, -30);
      sbContext.ctx.lineTo(9, -19);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.globalAlpha = 0.4;
      sbContext.ctx.fillStyle = "#ff6600";
      for (let i = 1; i <= 3; i++) {
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(-i * 8, i * 10, 6 - i, 0, Math.PI * 2);
        sbContext.ctx.fill();
      }
      sbContext.ctx.globalAlpha = 1;
      sbContext.ctx.fillStyle = "#ffcc00";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 7, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 3, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }

    // Фонарь
    for (const l of sbContext.cnLanterns) {
      const bob = Math.sin(l.age * 3) * 5;
      sbContext.ctx.save();
      sbContext.ctx.translate(l.x, l.y - 100 + bob);
      const glow = sbContext.ctx.createRadialGradient(0, 0, 20, 0, 0, l.radius);
      glow.addColorStop(0, "rgba(255,180,0,0.25)");
      glow.addColorStop(0.5, "rgba(255,120,0,0.1)");
      glow.addColorStop(1, "rgba(255,80,0,0)");
      sbContext.ctx.fillStyle = glow;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, l.radius, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#cc1100";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(0, 0, 22, 30, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#ffcc00";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.stroke();
      sbContext.ctx.strokeStyle = "#ff8800";
      sbContext.ctx.lineWidth = 1;
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(0, 0, 15, 22, 0, 0, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#ffcc00";
      sbContext.ctx.fillRect(-8, -32, 16, 4);
      sbContext.ctx.fillRect(-8, 28, 16, 4);
      sbContext.ctx.strokeStyle = "#ffcc00";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, 32);
      sbContext.ctx.lineTo(0, 45);
      sbContext.ctx.stroke();
      sbContext.ctx.restore();
    }

    // Конус дыхания
    for (const c of sbContext.cnFireCones) {
      const a = c.life / c.maxLife;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = a;
      sbContext.ctx.translate(c.owner.x, c.owner.y - 80);
      sbContext.ctx.scale(c.dir, 1);
      const grad = sbContext.ctx.createRadialGradient(0, 0, 0, 0, 0, c.length);
      grad.addColorStop(0, "rgba(255,255,100,0.9)");
      grad.addColorStop(0.4, "rgba(255,150,0,0.6)");
      grad.addColorStop(1, "rgba(255,50,0,0)");
      sbContext.ctx.fillStyle = grad;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, 0);
      sbContext.ctx.lineTo(c.length, -c.width / 2);
      sbContext.ctx.lineTo(c.length, c.width / 2);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      for (let i = 0; i < 12; i++) {
        const px = Math.random() * c.length;
        const py = (Math.random() - 0.5) * c.width * (px / c.length);
        sbContext.ctx.fillStyle = `rgba(255,${180 + Math.random() * 75},0,${a})`;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(px, py, 3 + Math.random() * 4, 0, Math.PI * 2);
        sbContext.ctx.fill();
      }
      sbContext.ctx.restore();
    }

    // Хвост
    for (const t of sbContext.cnTails) {
      const a = t.life / t.maxLife;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = a;
      sbContext.ctx.strokeStyle = "#ffcc00";
      sbContext.ctx.lineWidth = 8;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(t.x, t.y, t.radius * (1 - a * 0.5), 0, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.strokeStyle = "#fff";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(t.x, t.y, t.radius * (1 - a * 0.5), 0, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.restore();
    }

    // Рёв
    for (const r of sbContext.cnRoars) {
      const a = r.life / r.maxLife;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = a;
      for (let ring = 0; ring < 3; ring++) {
        const rr = r.radius * (1 - a * 0.5) + ring * 40;
        sbContext.ctx.strokeStyle = `rgba(255,215,0,${a})`;
        sbContext.ctx.lineWidth = 4 - ring;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.updateGame_china = function (dt) {
    sbContext.updateGame_interface(dt);
    if (sbContext.game.state === "fighting") sbContext.cnUpdateProjectiles(dt);
  };

  sbContext.drawWorld_china = function (t) {
    sbContext.drawWorld_interface(t);
    sbContext.cnDrawProjectiles();
  };

  sbContext.getPlayerSkills_china = function (f) {
    if (f.isChina) {
      if (f.ultTimer > 0) {
        return [
          {
            key: f === sbContext.p1 ? "Z" : "N1",
            icon: "🔥",
            cd: f.breathCd || 0,
          },
          {
            key: f === sbContext.p1 ? "X" : "N2",
            icon: "🌀",
            cd: f.tailCd || 0,
          },
          {
            key: f === sbContext.p1 ? "C" : "N3",
            icon: "📢",
            cd: f.roarCd || 0,
          },
        ];
      }
      const zCd = f.noodleMode ? 0 : f.skillCd.noodle || 0;
      const zIcon = f.noodleMode ? "🍜" + f.noodleCharges : "🍜";
      return [
        { key: f === sbContext.p1 ? "Z" : "N1", icon: zIcon, cd: zCd },
        {
          key: f === sbContext.p1 ? "X" : "N2",
          icon: "🎆",
          cd: f.fireworkCd || 0,
        },
        {
          key: f === sbContext.p1 ? "C" : "N3",
          icon: "🏮",
          cd: f.lanternCd || 0,
        },
      ];
    }
    return sbContext.getPlayerSkills_base(f);
  };

  sbContext.drawFighter_china = function (f) {
    if (f.isChina && !f.trainingDummy && f.ultTimer > 0) {
      drawChineseDragon(sbContext.ctx, f);
      return;
    }
    sbContext.drawFighter_interface(f);
    if (!f.isChina) return;

    // Доширак в руке
    if (
      f.noodleMode &&
      f.noodleCharges > 0 &&
      f.ultTimer <= 0 &&
      !f.trainingDummy
    ) {
      sbContext.ctx.save();
      sbContext.ctx.translate(f.x + f.facing * 42, f.y - 85);
      sbContext.ctx.scale(f.facing, 1);
      sbContext.ctx.fillStyle = "#ff6600";
      sbContext.ctx.beginPath();
      sbContext.ctx.roundRect(-12, -15, 24, 30, 3);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#cc3300";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#ffaa44";
      sbContext.ctx.fillRect(-12, -15, 24, 6);
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.font = "bold 14px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.strokeStyle = "#ffe59b";
      sbContext.ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(-9 + i * 4, -11);
        sbContext.ctx.bezierCurveTo(
          -14 + i * 4,
          -20,
          0 + i * 3,
          -21,
          -5 + i * 4,
          -29,
        );
        sbContext.ctx.stroke();
      }
      sbContext.ctx.strokeStyle = "#795032";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(3, -13);
      sbContext.ctx.lineTo(22, -36);
      sbContext.ctx.moveTo(8, -12);
      sbContext.ctx.lineTo(27, -34);
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#ffcc00";
      sbContext.ctx.font = "bold 12px Arial";
      sbContext.ctx.fillText("x" + f.noodleCharges, 22, -12);
      sbContext.ctx.restore();
    }
  };

  sbContext.sbDescription_china = (function (prev) {
    return function (id) {
      if (id === "china") {
        return {
          skills: [
            [
              "Z · ДОШИРАК",
              "Берёт доширак, получает 5 зарядов. Каждое нажатие — выстрел лапшой по 5 урона. Кд 15 сек после всех выстрелов.",
            ],
            [
              "X · ФЕЙЕРВЕРК",
              "Запускает фейерверк по дуге. Взрыв 10 урона в радиусе 180. Кд 5 сек.",
            ],
            [
              "C · БУМАЖНЫЙ ФОНАРЬ",
              "Ставит фонарь на 4 сек. Стреляет огоньками (3 урона) каждые 0.6 сек по ближайшему врагу. Кд 10 сек.",
            ],
          ],
          ult: "На 10 сек превращается в китайского дракона: +20% HP. Z — Дыхание (15 + поджог), X — Хвост (12 + оглушение), C — управляемый полёт: захват в пасть (10), взрыв (15), сброс врага. КД C — 10с, как у фонаря. Направление полёта — клавиши движения.",
        };
      }
      return prev(id);
    };
  })(sbContext.sbDescription_interface);

  sbContext.drawCharCard_china = function (
    x,
    y,
    w,
    h,
    charId,
    selected,
    btnId,
  ) {
    sbContext.drawCharCard_base(x, y, w, h, charId, selected, btnId);
    if (charId === "china") {
      sbContext.ctx.save();
      sbContext.ctx.fillStyle = "rgba(15,10,25,0.92)";
      sbContext.ctx.fillRect(x + 15, y + 65, w - 30, 32);
      sbContext.ctx.fillStyle = "#ddd";
      sbContext.ctx.font = "12px Arial";
      sbContext.ctx.textAlign = "left";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText(
        "🍜 Доширак · 🎆 Фейерверк · 🏮 Фонарь",
        x + 20,
        y + 75,
      );
      sbContext.ctx.fillStyle = "#ffcf3c";
      sbContext.ctx.fillText("🐉 УЛЬТ: превращение в дракона", x + 20, y + 92);
      sbContext.ctx.restore();
    }
  };
}

export function initializeCharacter(sbContext) {
  sbContext.cnNoodle = [];
  sbContext.cnFireworks = [];
  sbContext.cnLanterns = [];
  sbContext.cnFireCones = [];
  sbContext.cnTails = [];
  sbContext.cnRoars = [];
  sbContext.cnInit(sbContext.p1);
  sbContext.cnInit(sbContext.p2);
}
