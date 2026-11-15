// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.fighter_reset_arena = function () {
    sbContext.fighter_reset_base.call(this);
    this.ultCooldown = 0;
    this.skillHasteTimer = 0;
    this.speedBoostTimer = 0;
    this.pistolShotsLeft = 0;
    this.pistolShotTimer = 0;
    this.blockadeStunTicks = 0;
    this.blockadeStunTimer = 0;
    this.starStunTimer = 0;
    this.trainingDummy = false;
  };

  sbContext.fighter_takeDamage_arena = function (dmg, dir) {
    if (this.trainingDummy) return;
    sbContext.fighter_takeDamage_base.call(this, dmg, dir);
  };

  sbContext.fighter_update_arena = function (dt, opponent, allowInput) {
    if (this.trainingDummy) {
      this.hp = this.maxHp = 999999;
      this.vx = 0;
      this.vy = 0;
      this.y = sbContext.GROUND_Y;
      this.onGround = true;
      this.blocking = !!this.trainingBlock;
      this.state = this.blocking ? "block" : "idle";
      return;
    }
    const beforeUlt = this.ultTimer;
    if (this.blockadeStunTicks > 0) {
      this.blockadeStunTimer -= dt;
      if (this.blockadeStunTimer <= 0) {
        this.blockadeStunTicks--;
        this.blockadeStunTimer = 1;
        this.hitstun = Math.max(this.hitstun, 0.3);
        this.starStunTimer = 0.3;
      }
    }
    if (this.starStunTimer > 0)
      this.starStunTimer = Math.max(0, this.starStunTimer - dt);
    if (this.ultCooldown > 0) {
      this.ultCooldown = Math.max(0, this.ultCooldown - dt);
      if (this.ultCooldown === 0) this.ultUsed = false;
    }
    if (this.skillHasteTimer > 0) {
      this.skillHasteTimer = Math.max(0, this.skillHasteTimer - dt);
      for (const k in this.skillCd)
        this.skillCd[k] = Math.max(0, this.skillCd[k] - dt);
    }
    if (this.speedBoostTimer > 0)
      this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dt);
    sbContext.fighter_update_base.call(this, dt, opponent, allowInput);
    if (this.speedBoostTimer > 0 && this.hp > 0 && !this.trainingDummy) {
      this.x += this.vx * 0.38 * dt;
      this.clampX();
    }
    if (beforeUlt > 0 && this.ultTimer <= 0) {
      this.ultTimer = 0;
      this.ultCooldown = 30;
      this.ultUsed = true;
      sbContext.sbSparkText(this.x, this.y - 190, "УЛЬТА: КД 30 С", "#ffd45c");
    }
  };

  sbContext.fighter_startAttack_arena = function (type) {
    if (
      type === "uppercut" &&
      this.ultTimer > 0 &&
      !this.isUkraine &&
      !this.isAmerica
    ) {
      sbContext.sbSpawnRocket(
        this,
        this === sbContext.p1 ? sbContext.p2 : sbContext.p1,
      );
      return;
    }
    sbContext.fighter_startAttack_base.call(this, type);
  };

  sbContext.fighter_takeDamage_interface = function (dmg, dir) {
    if (this.trainingDummy && sbContext.game.mode === "practice") {
      this.hp -= dmg;
      this.hitFlash = 0.25;
      if (this.hp <= 0) {
        this.hp = 200;
        this.maxHp = 200;
        sbContext.sbSparkText(
          this.x,
          this.y - 180,
          "МАНЕКЕН ОБНОВЛЁН",
          "#bfeaff",
        );
      }
      return;
    }
    sbContext.fighter_takeDamage_arena.call(this, dmg, dir);
  };

  sbContext.fighter_update_interface = function (dt, opponent, allowInput) {
    if (this.trainingDummy && sbContext.game.mode === "practice") {
      this.maxHp = 200;
      if (this.hp <= 0) this.hp = 200;
      this.animTime += dt;
      this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
      this.vx = 0;
      this.vy = 0;
      this.y = sbContext.GROUND_Y;
      this.onGround = true;
      this.carried = false;
      this.blocking = false;
      this.state = "idle";
      return;
    }
    sbContext.fighter_update_arena.call(this, dt, opponent, allowInput);
  };

  sbContext.fighter_updateAttack_interface = function (dt, opponent) {
    sbContext.fighter_updateAttack_base.call(this, dt, opponent);
    if (
      sbContext.game.mode !== "practice" ||
      this !== sbContext.p1 ||
      !this.attack ||
      this.attack.hasHit
    )
      return;
    const a = this.attack,
      cfg = sbContext.ATTACKS[a.type];
    if (
      !cfg ||
      !["punch", "kick", "uppercut", "chargedPunch"].includes(a.type) ||
      a.timer < a.startupEnd ||
      a.timer >= a.activeEnd
    )
      return;
    const hb = {
      x: this.x + this.facing * cfg.range,
      y: this.y + cfg.hitY,
      r: cfg.hitR,
    };
    for (const d of sbContext.practiceDummies.slice(1)) {
      if (d.hp > 0 && sbContext.circleOverlap(hb, d.getHurtbox())) {
        d.takeDamage(cfg.damage, this.facing);
        if (cfg.knockback) d.vx = this.facing * cfg.knockback;
        a.hasHit = true;
        sbContext.spawnHitSparks(hb.x, hb.y, "#ffff88");
        sbContext.sbSparkText(
          d.x,
          d.y - 170,
          "-" + cfg.damage + " HP",
          "#ffe28a",
        );
        break;
      }
    }
  };
}
