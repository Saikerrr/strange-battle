// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.fighter_castBlockade_base = function () {
    sbContext.projectiles.push({
      x: this.x + this.facing * 50,
      y: this.y - 90,
      vx: this.facing * 900,
      vy: 0,
      r: 16,
      damage: 5,
      owner: this,
      color: "#cc66ff",
      type: "blockade",
      trail: [],
    });
    sbContext.spawnMuzzleFlash(
      this.x + this.facing * 55,
      this.y - 90,
      this.facing,
    );
    sbContext.doShake(5, 0.1);
    sbContext.playSound(400, 0.15, "triangle", 0.1);
    sbContext.playSound(600, 0.1, "sawtooth", 0.08);
  };

  sbContext.fighter_castBearSkill_base = function () {
    const startX = this.x + this.facing * 40;
    sbContext.bears.push({
      x: Math.max(
        sbContext.ARENA_LEFT + 80,
        Math.min(sbContext.ARENA_RIGHT - 80, startX),
      ),
      y: this.y,
      facing: this.facing,
      vx: this.facing * 650,
      owner: this,
      target: this === sbContext.p1 ? sbContext.p2 : sbContext.p1,
      carrying: null,
      life: 1.2,
      animTime: 0,
    });
    sbContext.spawnDust(this.x, this.y, 15);
    sbContext.doShake(10, 0.2);
    sbContext.playSound(60, 0.4, "sawtooth", 0.15);
    sbContext.particles.push({
      x: this.x,
      y: this.y - 180,
      vx: 0,
      vy: -40,
      life: 1.0,
      maxLife: 1.0,
      color: "#ffaa44",
      size: 28,
      isText: true,
      text: "МЕДВЕДЬ!",
    });
  };

  sbContext.sbSpawnRocket_arena = function (owner, target) {
    sbContext.ultRockets.push({
      x: target.x + (Math.random() - 0.5) * 360,
      y: -250,
      vx: 0,
      vy: 150,
      owner,
      target,
      life: 4,
      age: 0,
      hit: false,
    });
    sbContext.playSound(180, 0.25, "sawtooth", 0.1);
  };

  sbContext.sbUpdateRockets_arena = function (dt) {
    for (let i = sbContext.ultRockets.length - 1; i >= 0; i--) {
      const r = sbContext.ultRockets[i];
      r.life -= dt;
      r.age += dt;
      if (r.target && r.target.hp > 0) {
        const tx = r.target.x,
          ty = r.target.y - 55;
        r.vx += (tx - r.x) * dt * 1.4;
        r.vx = Math.max(-360, Math.min(360, r.vx));
        r.x += r.vx * dt;
        r.y += Math.max(260, (ty - r.y) * 1.8) * dt;
      }
      if (
        !r.hit &&
        r.target &&
        Math.hypot(r.x - r.target.x, r.y - (r.target.y - 60)) < 55
      ) {
        r.hit = true;
        r.target.takeDamage(15, r.owner.facing);
        sbContext.spawnExplosion(r.x, r.y);
        sbContext.spawnHitSparks(r.x, r.y, "#ffb347");
        r.life = 0;
      }
      if (r.life <= 0) sbContext.ultRockets.splice(i, 1);
    }
  };

  sbContext.sbDrawRockets_arena = function () {
    for (const r of sbContext.ultRockets) {
      sbContext.ctx.save();
      sbContext.ctx.translate(r.x, r.y);
      sbContext.ctx.rotate(Math.PI / 2 + Math.atan2(r.vy, r.vx) * 0.18);
      const g = sbContext.ctx.createRadialGradient(0, 18, 2, 0, 18, 36);
      g.addColorStop(0, "#fff4a0");
      g.addColorStop(1, "rgba(255,80,0,0)");
      sbContext.ctx.fillStyle = g;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 18, 36, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#aaa";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(0, -28);
      sbContext.ctx.lineTo(12, 12);
      sbContext.ctx.lineTo(8, 27);
      sbContext.ctx.lineTo(-8, 27);
      sbContext.ctx.lineTo(-12, 12);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#d33";
      sbContext.ctx.fillRect(-11, 0, 22, 10);
      sbContext.ctx.fillStyle = "#ffb52e";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-7, 25);
      sbContext.ctx.lineTo(0, 48 + Math.random() * 7);
      sbContext.ctx.lineTo(7, 25);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
  };

  sbContext.fighter_castBlockade_arena = function () {
    sbContext.fighter_castBlockade_base.call(this);
    if (this.ultTimer > 0) {
      const p = sbContext.projectiles[sbContext.projectiles.length - 1];
      if (p) p.type = "blockade_ult";
    }
  };

  sbContext.fighter_castBearSkill_arena = function () {
    if (this.ultTimer > 0) {
      const target = this === sbContext.p1 ? sbContext.p2 : sbContext.p1;
      sbContext.bears.push({
        x: Math.max(
          sbContext.ARENA_LEFT + 80,
          Math.min(sbContext.ARENA_RIGHT - 80, this.x + this.facing * 55),
        ),
        y: this.y,
        facing: this.facing,
        vx: this.facing * 690,
        owner: this,
        target,
        carrying: null,
        life: 2.4,
        animTime: 0,
        isUlt: true,
        phase: "run",
      });
      sbContext.spawnDust(this.x, this.y, 16);
      sbContext.doShake(9, 0.2);
      sbContext.playSound(60, 0.4, "sawtooth", 0.15);
    } else sbContext.fighter_castBearSkill_base.call(this);
  };
}
