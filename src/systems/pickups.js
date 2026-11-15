// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.sbSpawnPickup_arena = function () {
    const types = ["heal", "magic", "speed", "pistol"];
    const type = types[Math.floor(Math.random() * types.length)];
    const x =
      sbContext.ARENA_LEFT +
      180 +
      Math.random() * (sbContext.ARENA_RIGHT - sbContext.ARENA_LEFT - 360);
    sbContext.arenaPickupState.item = {
      type,
      x,
      y: sbContext.GROUND_Y - 34,
      age: 0,
      pulse: Math.random() * 6,
    };
    sbContext.playSound(660, 0.18, "sine", 0.06);
  };

  sbContext.sbApplyPickup_arena = function (f, type) {
    if (type === "heal") {
      f.hp = Math.min(f.maxHp, f.hp + 15);
      sbContext.sbSparkText(f.x, f.y - 180, "+15 HP", "#65ff75");
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2,
          s = 70 + Math.random() * 170;
        sbContext.particles.push({
          x: f.x,
          y: f.y - 80,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 60,
          life: 0.8,
          maxLife: 0.8,
          color: "#65ff75",
          size: 5 + Math.random() * 4,
        });
      }
    } else if (type === "magic") {
      f.skillHasteTimer = 15;
      sbContext.sbSparkText(f.x, f.y - 180, "МАГИЯ: КД ×2", "#d78aff");
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2,
          s = 80 + Math.random() * 180;
        sbContext.particles.push({
          x: f.x,
          y: f.y - 90,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 80,
          life: 1,
          maxLife: 1,
          color: "#d78aff",
          size: 5 + Math.random() * 5,
        });
      }
    } else if (type === "speed") {
      f.speedBoostTimer = 9;
      sbContext.sbSparkText(f.x, f.y - 180, "УСКОРЕНИЕ!", "#ff5555");
      for (let i = 0; i < 18; i++)
        sbContext.particles.push({
          x: f.x + (Math.random() - 0.5) * 60,
          y: f.y - 60 - Math.random() * 70,
          vx: (Math.random() - 0.5) * 160,
          vy: -Math.random() * 150,
          life: 0.6,
          maxLife: 0.6,
          color: "#ff5555",
          size: 5 + Math.random() * 4,
        });
    } else if (type === "pistol") {
      f.pistolShotsLeft = 3;
      f.pistolShotTimer = 0;
      sbContext.sbSparkText(f.x, f.y - 180, "ПИСТОЛЕТ: 3 ВЫСТРЕЛА", "#ffe16a");
    }
    sbContext.playSound(900, 0.12, "triangle", 0.09);
  };

  sbContext.sbUpdatePickups_arena = function (dt) {
    sbContext.arenaPickupState.phase += dt;
    if (!sbContext.arenaPickupState.item) {
      if (sbContext.arenaPickupState.respawnLock > 0)
        sbContext.arenaPickupState.respawnLock = Math.max(
          0,
          sbContext.arenaPickupState.respawnLock - dt,
        );
      else {
        sbContext.arenaPickupState.spawnTimer -= dt;
        if (sbContext.arenaPickupState.spawnTimer <= 0) {
          sbContext.sbSpawnPickup();
          sbContext.arenaPickupState.spawnTimer = 12 + Math.random() * 7;
        }
      }
      return;
    }
    const it = sbContext.arenaPickupState.item;
    it.age += dt;
    it.pulse += dt * 4;
    for (const f of [sbContext.p1, sbContext.p2]) {
      if (
        f.hp > 0 &&
        !f.trainingDummy &&
        Math.hypot(f.x - it.x, f.y - it.y) < 64
      ) {
        sbContext.sbApplyPickup(f, it.type);
        sbContext.arenaPickupState.item = null;
        sbContext.arenaPickupState.respawnLock = 10;
        sbContext.arenaPickupState.spawnTimer = 0;
        break;
      }
    }
  };

  sbContext.sbDrawPickup_arena = function () {
    const it = sbContext.arenaPickupState.item;
    if (!it) return;
    const pulse = 1 + Math.sin(it.pulse) * 0.12;
    const cfg = {
      heal: ["#4cff69", "✚"],
      magic: ["#d47bff", "✦"],
      speed: ["#ff4141", "➤"],
      pistol: ["#ffd45c", "▰"],
    }[it.type];
    sbContext.ctx.save();
    sbContext.ctx.translate(it.x, it.y);
    sbContext.ctx.scale(pulse, pulse);
    const glow = sbContext.ctx.createRadialGradient(0, 0, 5, 0, 0, 58);
    glow.addColorStop(0, cfg[0] + "bb");
    glow.addColorStop(1, cfg[0] + "00");
    sbContext.ctx.fillStyle = glow;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, 0, 58, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.shadowColor = cfg[0];
    sbContext.ctx.shadowBlur = 24;
    sbContext.ctx.fillStyle = "rgba(12,12,24,.92)";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, 0, 25, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = cfg[0];
    sbContext.ctx.lineWidth = 4;
    sbContext.ctx.stroke();
    sbContext.ctx.shadowBlur = 0;
    sbContext.ctx.fillStyle = cfg[0];
    sbContext.ctx.font = "bold 30px Arial";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillText(cfg[1], 0, 1);
    sbContext.ctx.fillStyle = "#fff";
    sbContext.ctx.font = "bold 13px Arial";
    sbContext.ctx.fillText(
      {
        heal: "ЛЕЧЕНИЕ",
        magic: "МАГИЯ",
        speed: "СКОРОСТЬ",
        pistol: "ПИСТОЛЕТ",
      }[it.type],
      0,
      -43,
    );
    sbContext.ctx.restore();
  };

  sbContext.sbFirePistol_arena = function (f) {
    const target = f === sbContext.p1 ? sbContext.p2 : sbContext.p1;
    sbContext.pistolShots.push({
      x: f.x + f.facing * 38,
      y: f.y - 95,
      vx: f.facing * 820,
      vy: 0,
      owner: f,
      target,
      life: 2.2,
      r: 9,
      trail: [],
    });
    sbContext.spawnMuzzleFlash(f.x + f.facing * 42, f.y - 95, f.facing);
    sbContext.playSound(720, 0.06, "square", 0.07);
  };

  sbContext.sbUpdatePistol_arena = function (dt) {
    for (const f of [sbContext.p1, sbContext.p2]) {
      if (f.pistolShotsLeft > 0) {
        f.pistolShotTimer -= dt;
        if (f.pistolShotTimer <= 0) {
          sbContext.sbFirePistol(f);
          f.pistolShotsLeft--;
          f.pistolShotTimer = 0.22;
        }
      }
    }
    for (let i = sbContext.pistolShots.length - 1; i >= 0; i--) {
      const b = sbContext.pistolShots[i],
        t = b.target;
      b.life -= dt;
      if (t && t.hp > 0) {
        const desired = Math.max(-390, Math.min(390, (t.y - 85 - b.y) * 2.1));
        b.vy += (desired - b.vy) * Math.min(1, dt * 3.5);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 8) b.trail.shift();
      if (
        t &&
        t.hp > 0 &&
        sbContext.circleOverlap({ x: b.x, y: b.y, r: b.r }, t.getHurtbox())
      ) {
        t.takeDamage(5, b.owner.facing);
        sbContext.spawnHitSparks(b.x, b.y, "#ffe16a");
        sbContext.pistolShots.splice(i, 1);
        continue;
      }
      if (
        b.life <= 0 ||
        b.x < sbContext.ARENA_LEFT ||
        b.x > sbContext.ARENA_RIGHT
      )
        sbContext.pistolShots.splice(i, 1);
    }
  };

  sbContext.sbDrawPistolShots_arena = function () {
    for (const b of sbContext.pistolShots) {
      sbContext.ctx.save();
      sbContext.ctx.strokeStyle = "rgba(255,225,100,.45)";
      sbContext.ctx.lineWidth = 5;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(b.x - b.owner.facing * 24, b.y);
      sbContext.ctx.lineTo(b.x, b.y);
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#fff4a8";
      sbContext.ctx.shadowColor = "#ffb52e";
      sbContext.ctx.shadowBlur = 16;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.restore();
    }
  };
}
