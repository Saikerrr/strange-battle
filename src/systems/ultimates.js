// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.triggerUlt_base = function (f, opp) {
    if (f.ultUsed) return;
    f.ultUsed = true;
    f.state = "idle";
    f.hitstun = 0;
    f.attack = null;

    if (f.isAmerica) {
      f.ultTimer = 8;
      f.shieldHp = 100;
      f.shieldBroken = false;
      f.vx = 0;
      f.vy = 0;
      // Эффект приземления и вспышка превращения
      sbContext.spawnDust(f.x, f.y, 18);
      for (let i = 0; i < 34; i++) {
        const a = Math.random() * Math.PI * 2,
          sp = 100 + Math.random() * 360;
        sbContext.particles.push({
          x: f.x,
          y: f.y - 110,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 120,
          life: 0.8 + Math.random() * 0.4,
          maxLife: 1.2,
          color: ["#ffffff", "#55aaff", "#ff4444", "#ffd700"][
            Math.floor(Math.random() * 4)
          ],
          size: 4 + Math.random() * 7,
        });
      }
      sbContext.particles.push({
        x: f.x,
        y: f.y - 250,
        vx: 0,
        vy: -50,
        life: 1.8,
        maxLife: 1.8,
        color: "#ffd700",
        size: 44,
        isText: true,
        text: "КАПИТАН АМЕРИКА!",
      });
      sbContext.flash("rgba(255,255,255,0.8)");
      sbContext.doShake(28, 0.45);
      sbContext.playSound(880, 0.25, "triangle", 0.13);
      sbContext.playSound(440, 0.4, "sine", 0.1);
      for (const c of sbContext.crowd) c.excited = 3;
      return;
    }

    if (f.isUkraine) {
      f.ultTimer = 6;
      f.maxHp = Math.floor(f.maxHp * 1.2);
      f.hp = Math.min(f.maxHp, f.hp + 20);
      f.zombieWaveTimer = 0.3;
      sbContext.spawnLightning(f.x, f.y);
      sbContext.doShake(60, 1.0);
      sbContext.particles.push({
        x: f.x,
        y: f.y - 260,
        vx: 0,
        vy: -60,
        life: 2.0,
        maxLife: 2.0,
        color: "#88ff44",
        size: 56,
        isText: true,
        text: "ЗОМБИ!",
      });
      sbContext.particles.push({
        x: f.x,
        y: f.y - 210,
        vx: 0,
        vy: -40,
        life: 2.0,
        maxLife: 2.0,
        color: "#ffd700",
        size: 22,
        isText: true,
        text: "+20% MAX HP",
      });
      for (const c of sbContext.crowd) c.excited = 3;
      for (let k = 0; k < 3; k++) sbContext.killRandomSpectator();
    } else {
      f.ultTimer = 6;
      sbContext.spawnBigExplosion(f.x, f.y - 60);
      if (opp && !opp.dead) {
        const dir = opp.x > f.x ? 1 : -1;
        opp.takeDamage(15, dir);
        opp.vx = dir * 2400;
        opp.vy = -1500;
        opp.onGround = false;
        opp.hitstun = 1.5;
      }
      sbContext.doShake(38, 0.6);
      sbContext.playSound(50, 0.7, "sawtooth", 0.3);
      sbContext.playSound(1400, 0.3, "square", 0.15);
      sbContext.playSound(80, 0.5, "square", 0.2);
      sbContext.particles.push({
        x: f.x,
        y: f.y - 260,
        vx: 0,
        vy: -60,
        life: 2.0,
        maxLife: 2.0,
        color: "#ff4422",
        size: 56,
        isText: true,
        text: "КИБОРГ!",
      });
      sbContext.particles.push({
        x: f.x,
        y: f.y - 210,
        vx: 0,
        vy: -40,
        life: 2.0,
        maxLife: 2.0,
        color: "#ffaa00",
        size: 22,
        isText: true,
        text: "-50% УРОНА",
      });
      for (const c of sbContext.crowd) c.excited = 3;
      for (let k = 0; k < 3; k++) sbContext.killRandomSpectator();
    }
  };

  sbContext.triggerUlt_arena = function (f, opp) {
    sbContext.triggerUlt_base(f, opp);
    f.ultTimer = 10;
    f.ultCooldown = 0;
    f.ultUsed = true;
  };

  sbContext.triggerUlt_interface = function (f, opp) {
    if (f.isChina) {
      f.ultCharging = false;
      f.ultUsed = true;
      f.ultCooldown = 30;
      sbContext.sbSparkText(f.x, f.y - 180, "УЛЬТА КИТАЯ — ПОЗЖЕ", "#ffcf3c");
      return;
    }
    sbContext.triggerUlt_arena(f, opp);
  };
}
