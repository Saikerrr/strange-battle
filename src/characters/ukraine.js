// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.fighter_castBombs_base = function () {
    const dir = this.facing;
    for (let i = 0; i < 5; i++) {
      sbContext.bombs.push({
        x: this.x + dir * (80 + i * 90 + Math.random() * 60),
        y: this.y - 900 - i * 90 - Math.random() * 80,
        vx: dir * 50,
        vy: 0,
        spin: Math.random() * Math.PI * 2,
        target: this === sbContext.p1 ? sbContext.p2 : sbContext.p1,
        owner: this,
        damage: 15,
        exploded: false,
        life: 6,
      });
    }
    sbContext.doShake(6, 0.15);
    sbContext.playSound(200, 0.4, "sawtooth", 0.08);
    sbContext.playSound(80, 0.3, "square", 0.1);
    sbContext.particles.push({
      x: this.x,
      y: this.y - 200,
      vx: 0,
      vy: -40,
      life: 1.2,
      maxLife: 1.2,
      color: "#ff8800",
      size: 26,
      isText: true,
      text: "💣 БОМБЫ!",
    });
  };

  sbContext.launchDrone_base = function (owner) {
    sbContext.drones.push({
      x: owner.x,
      y: owner.y - 160,
      owner,
      target: owner === sbContext.p1 ? sbContext.p2 : sbContext.p1,
      fireTimer: 0.3,
      life: 3.5,
      rotor: 0,
    });
  };

  sbContext.launchMissile_base = function (owner) {
    const target = owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
    sbContext.projectiles.push({
      x: owner.x,
      y: owner.y - 350,
      vx: 0,
      vy: 0,
      r: 12,
      damage: 20,
      owner,
      color: "#ff5544",
      type: "missile",
      target,
      homing: true,
      trail: [],
    });
  };

  sbContext.sbCastTomb_arena = function (owner) {
    const x = Math.max(
      sbContext.ARENA_LEFT + 80,
      Math.min(sbContext.ARENA_RIGHT - 80, owner.x + owner.facing * 170),
    );
    sbContext.tombstones.push({
      x,
      y: sbContext.GROUND_Y,
      hp: 5,
      owner,
      timer: 3,
      life: 10,
      dead: false,
    });
    sbContext.sbSparkText(
      x,
      sbContext.GROUND_Y - 180,
      "МОГИЛА ЗОМБИ",
      "#9bff73",
    );
    sbContext.doShake(5, 0.12);
  };

  sbContext.sbDrawTombs_arena = function () {
    for (const t of sbContext.tombstones) {
      sbContext.ctx.save();
      sbContext.ctx.translate(t.x, t.y);
      sbContext.ctx.fillStyle = "rgba(0,0,0,.35)";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(0, 0, 48, 10, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#555";
      sbContext.ctx.beginPath();
      sbContext.ctx.roundRect(-24, -85, 48, 78, 8);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#aaa";
      sbContext.ctx.lineWidth = 4;
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#888";
      sbContext.ctx.fillRect(-5, -72, 10, 48);
      sbContext.ctx.fillRect(-16, -55, 32, 8);
      sbContext.ctx.fillStyle = "#9dff73";
      sbContext.ctx.font = "bold 13px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.fillText("" + t.hp + "/5", 0, -98);
      sbContext.ctx.restore();
    }
  };

  sbContext.sbDrawMiniZombies_arena = function () {
    for (const z of sbContext.miniZombies) {
      sbContext.ctx.save();
      sbContext.ctx.translate(z.x, z.y);
      sbContext.ctx.fillStyle = "#72a84b";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, -28, 13, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#28351b";
      sbContext.ctx.fillRect(-10, -18, 20, 22);
      sbContext.ctx.strokeStyle = "#b7e878";
      sbContext.ctx.lineWidth = 4;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-7, -5);
      sbContext.ctx.lineTo(-18, 2);
      sbContext.ctx.moveTo(7, -5);
      sbContext.ctx.lineTo(18, 2);
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.fillRect(-5, -31, 4, 4);
      sbContext.ctx.fillRect(3, -31, 4, 4);
      if (z.state === "windup") {
        sbContext.ctx.strokeStyle = "#d9ff99";
        sbContext.ctx.lineWidth = 3;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, -35, 23, Math.PI, Math.PI * 2);
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.launchDrone_arena = function (owner) {
    sbContext.launchDrone_base(owner);
    if (owner.ultTimer > 0) {
      const d = sbContext.drones[sbContext.drones.length - 1];
      if (d) d.ultBomb = true;
    }
  };

  sbContext.launchMissile_arena = function (owner) {
    if (owner.ultTimer > 0 && owner.isUkraine) {
      const target = owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
      for (let i = 0; i < 2; i++)
        sbContext.projectiles.push({
          x: owner.x + (i ? 35 : -35),
          y: owner.y - 350 - i * 55,
          vx: 0,
          vy: 0,
          r: 14,
          damage: 20,
          owner,
          color: "#ff5544",
          type: "missile",
          target,
          homing: true,
          trail: [],
          healOwnerOnHit: true,
        });
    } else sbContext.launchMissile_base(owner);
  };

  sbContext.fighter_castBombs_arena = function () {
    if (this.ultTimer > 0 && this.isUkraine) sbContext.sbCastTomb(this);
    else sbContext.fighter_castBombs_base.call(this);
  };

  sbContext.sbUpdateTombs_interface = function (dt) {
    for (let i = sbContext.tombstones.length - 1; i >= 0; i--) {
      const t = sbContext.tombstones[i];
      t.life -= dt;
      t.timer -= dt;
      if (t.timer <= 0 && t.life > 0) {
        t.timer = 3;
        sbContext.miniZombies.push({
          x: t.x,
          y: sbContext.GROUND_Y,
          vx: 0,
          owner: t.owner,
          target: t.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1,
          state: "run",
          timer: 0,
          life: 7,
          hit: false,
        });
      }
      if (t.life <= 0 || t.hp <= 0) {
        sbContext.tombstones.splice(i, 1);
        sbContext.spawnDust(t.x, sbContext.GROUND_Y, 10);
      }
    }
    for (const t of sbContext.tombstones) {
      for (const attacker of [sbContext.p1, sbContext.p2]) {
        if (attacker === t.owner) continue;
        const a = attacker.attack;
        if (a && !a.hasHit && (a.type === "punch" || a.type === "kick")) {
          const cfg = sbContext.ATTACKS[a.type];
          if (
            a.timer >= a.startupEnd &&
            a.timer < a.activeEnd &&
            Math.abs(attacker.x - t.x) < cfg.range + 40 &&
            Math.abs(attacker.y - t.y) < 90
          ) {
            t.hp--;
            a.hasHit = true;
            sbContext.spawnHitSparks(t.x, t.y - 50, "#aaff77");
          }
        }
      }
    }
    for (const z of sbContext.miniZombies) {
      const enemy = z.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
      const a = enemy.attack;
      if (a && !a.hasHit && (a.type === "punch" || a.type === "kick")) {
        const cfg = sbContext.ATTACKS[a.type];
        if (
          a.timer >= a.startupEnd &&
          a.timer < a.activeEnd &&
          Math.abs(enemy.x - z.x) < cfg.range + 28 &&
          Math.abs(enemy.y - z.y) < 75
        ) {
          z.life = 0;
          a.hasHit = true;
          sbContext.spawnHitSparks(z.x, z.y - 25, "#aaff77");
        }
      }
    }
    for (let i = sbContext.miniZombies.length - 1; i >= 0; i--) {
      const z = sbContext.miniZombies[i];
      z.life -= dt;
      z.timer += dt;
      if (z.state === "run" && z.target && z.target.hp > 0) {
        const dx = z.target.x - z.x;
        z.vx = Math.sign(dx) * 185;
        z.x += z.vx * dt;
        if (Math.abs(dx) < 62 && Math.abs(z.target.y - z.y) < 90) {
          z.state = "windup";
          z.timer = 0;
        }
      } else if (z.state === "windup" && z.timer >= 0.5) {
        z.state = "jump";
        z.timer = 0;
        z.jumpAge = 0;
        z.jumpStartX = z.x;
        z.jumpDuration = 0.42;
      } else if (z.state === "jump") {
        z.jumpAge += dt;
        const pr = Math.min(1, z.jumpAge / z.jumpDuration);
        if (z.target && z.target.hp > 0) {
          z.x = z.jumpStartX + (z.target.x - z.jumpStartX) * pr;
        }
        z.y = sbContext.GROUND_Y - Math.sin(pr * Math.PI) * 95;
        if (pr >= 1) {
          if (z.target && z.target.hp > 0) {
            z.x = z.target.x;
            z.target.takeDamage(5, z.owner.x < z.target.x ? 1 : -1);
          }
          z.state = "explode";
          z.timer = 0;
          z.y = sbContext.GROUND_Y;
        }
      } else if (z.state === "explode" && !z.hit) {
        sbContext.spawnExplosion(z.x, sbContext.GROUND_Y - 35);
        z.hit = true;
        z.life = 0;
      }
      if (z.life <= 0) sbContext.miniZombies.splice(i, 1);
    }
  };
}
