// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.fighter_castFlag_base = function () {
    sbContext.projectiles.push({
      x: this.x + this.facing * 50,
      y: this.y - 90,
      vx: this.facing * 1200,
      vy: 0,
      r: 24,
      damage: 12,
      owner: this,
      color: "#d52b1e",
      type: "flag",
      trail: [],
    });
    sbContext.spawnMuzzleFlash(
      this.x + this.facing * 55,
      this.y - 90,
      this.facing,
    );
    sbContext.doShake(6, 0.1);
    sbContext.playSound(400, 0.15, "triangle", 0.1);
  };

  sbContext.fighter_castBurger_base = function () {
    this.healTicks = 3;
    this.healTimer = 0.7;
    sbContext.particles.push({
      x: this.x,
      y: this.y - 200,
      vx: 0,
      vy: -40,
      life: 1.0,
      maxLife: 1.0,
      color: "#55ff55",
      size: 26,
      isText: true,
      text: "🍔 БУРГЕР!",
    });
    sbContext.playSound(600, 0.2, "sine", 0.08);
  };

  sbContext.sbUpdateBoomerangs_arena = function (dt) {
    for (let i = sbContext.shieldBoomerangs.length - 1; i >= 0; i--) {
      const b = sbContext.shieldBoomerangs[i];
      b.age += dt;
      b.life -= dt;
      const target = b.target;
      const returning = b.age > 0.55;
      if (!returning && target && target.hp > 0) {
        const dy = target.y - 85 - b.y;
        b.vy += (Math.max(-220, Math.min(220, dy * 1.8)) - b.vy) * dt * 3;
      } else {
        const dx = b.owner.x - b.x,
          dy = b.owner.y - 85 - b.y,
          d = Math.hypot(dx, dy) || 1;
        b.vx += ((dx / d) * 850 - b.vx) * dt * 4;
        b.vy += ((dy / d) * 850 - b.vy) * dt * 4;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (
        !b.hit &&
        target &&
        target.hp > 0 &&
        sbContext.circleOverlap({ x: b.x, y: b.y, r: 24 }, target.getHurtbox())
      ) {
        target.takeDamage(12, b.owner.facing);
        b.hit = true;
        sbContext.spawnHitSparks(b.x, b.y, "#65baff");
      }
      if (b.life <= 0 || Math.hypot(b.owner.x - b.x, b.owner.y - 85 - b.y) < 38)
        sbContext.shieldBoomerangs.splice(i, 1);
    }
  };

  sbContext.sbDrawBoomerangs_arena = function () {
    for (const b of sbContext.shieldBoomerangs) {
      sbContext.ctx.save();
      sbContext.ctx.translate(b.x, b.y);
      sbContext.ctx.rotate(b.age * 15);
      sbContext.ctx.shadowColor = "#55aaff";
      sbContext.ctx.shadowBlur = 18;
      sbContext.ctx.fillStyle = "#b9d9f5";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 23, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#1b4e9b";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 12, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#fff";
      sbContext.ctx.lineWidth = 4;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 18, 0, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.restore();
    }
  };

  sbContext.fighter_castFlag_arena = function () {
    sbContext.fighter_castFlag_base.call(this);
    const p = sbContext.projectiles[sbContext.projectiles.length - 1];
    if (this.ultTimer > 0 && p) {
      p.isUltFlag = true;
      p.r = 34;
    }
  };

  sbContext.fighter_castBurger_arena = function () {
    if (this.ultTimer > 0 && this.isAmerica) {
      sbContext.shieldBoomerangs.push({
        x: this.x + this.facing * 45,
        y: this.y - 90,
        vx: this.facing * 760,
        vy: -80,
        owner: this,
        target: this === sbContext.p1 ? sbContext.p2 : sbContext.p1,
        age: 0,
        life: 2.6,
        hit: false,
      });
      sbContext.playSound(500, 0.16, "triangle", 0.1);
      sbContext.sbSparkText(this.x, this.y - 170, "ЩИТ-БУМЕРАНГ!", "#65baff");
    } else sbContext.fighter_castBurger_base.call(this);
  };

  sbContext.fighter_castEagle_interface = function () {
    const target = this === sbContext.p1 ? sbContext.p2 : sbContext.p1,
      count = this.ultTimer > 0 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const fromLeft = count === 1 ? this.facing > 0 : i === 0;
      sbContext.eagles.push({
        x: fromLeft ? sbContext.ARENA_LEFT + 25 : sbContext.ARENA_RIGHT - 25,
        y: -130 - i * 55,
        target,
        owner: this,
        state: "swoop",
        timer: 0,
        scale: this.ultTimer > 0 ? 1.65 : 1.25,
        laneOffset: count === 2 ? (i === 0 ? -24 : 24) : 0,
        facing: target.x >= this.x ? 1 : -1,
      });
    }
    sbContext.playSound(800, 0.2, "triangle", 0.1);
    sbContext.playSound(1200, 0.1, "sine", 0.1);
  };
}
