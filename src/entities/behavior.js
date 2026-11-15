import { hasSkills, skillDown } from "../characters/ability-kit.js";
// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.fighter_reset_base = function () {
    this.maxHp = 100;
    this.blastPushTimer = 0;
    this.blastPushVelocity = 0;
    this._afgDetonateHeld = false;
    this.hp = 100;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.state = "idle";
    this.attack = null;
    this.hitstun = 0;
    this.hitFlash = 0;
    this.blocking = false;
    this.specialCd = 0;
    this.koTimer = 0;
    this.y = sbContext.GROUND_Y;
    this.skillCd = {
      drone: 0,
      missile: 0,
      bombs: 0,
      blockade: 0,
      bear: 0,
      uppercut: 0,
      flag: 0,
      eagle: 0,
      burger: 0,
    };
    this.blockedTimer = 0;
    this.carried = false;
    this.doubleJumpUsed = false;
    this.doubleJumpCd = 0;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.dashTrail = [];
    this.ultUsed = false;
    this.ultTimer = 0;
    this.zombieWaveTimer = 0;
    this.ultCharging = false;
    this.ultChargeTimer = 0;
    this._ultKeyHeld = false;
    this.ultChargeDuration = this.isAmerica ? 4.0 : sbContext.ULT_CHARGE_TIME;
    this.shieldHp = 100;
    this.shieldBroken = false;
    this.dropCooldown = 0;
    this.animTime = 0;
    this.walkCycle = 0;
    this.burgerEatTimer = 0;
    this.breathing = 0;
    this.bleedTimer = 0;
    this.bleedTickTimer = 0;
    this.healTicks = 0;
    this.healTimer = 0;
    this.aiKeys = {};
    this.aiTimer = 0;
    this.aiMemory = null;
  };

  sbContext.fighter_getSkillCd_base = function (name) {
    let cd = sbContext.SKILLS[name]
      ? sbContext.SKILLS[name].cd
      : sbContext.SKILLS_RU[name]
        ? sbContext.SKILLS_RU[name].cd
        : sbContext.SKILLS_US[name]
          ? sbContext.SKILLS_US[name].cd
          : 0;
    return cd;
  };

  sbContext.fighter_update_base = function (dt, opponent, allowInput) {
    this.animTime += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    this.specialCd = Math.max(0, this.specialCd - dt);
    this.blockedTimer = Math.max(0, this.blockedTimer - dt);
    this.dropCooldown = Math.max(0, this.dropCooldown - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.doubleJumpCd = Math.max(0, this.doubleJumpCd - dt);
    for (const k in this.skillCd)
      this.skillCd[k] = Math.max(0, this.skillCd[k] - dt);

    if (this.carried) {
      this.state = "carried";
      return;
    }

    // Сброс флага удержания ульты
    if (!this.isDown(this.controls.ult)) {
      this._ultKeyHeld = false;
    }

    // Запуск зарядки ульты для всех персонажей
    if (
      allowInput &&
      this.isDown(this.controls.ult) &&
      !this.ultUsed &&
      !this.ultCharging &&
      this.hp > 0 &&
      !this._ultKeyHeld
    ) {
      this.ultChargeDuration = this.isAmerica ? 4.0 : sbContext.ULT_CHARGE_TIME;
      this.ultCharging = true;
      this.ultChargeTimer = 0;
      this._ultKeyHeld = true;
      this.vx = 0;
      this.state = "ult_charge";
      sbContext.playSound(300, 0.3, "sawtooth", 0.1);
      sbContext.particles.push({
        x: this.x,
        y: this.y - 200,
        vx: 0,
        vy: -40,
        life: 1.5,
        maxLife: 1.5,
        color: "#ffcc00",
        size: 24,
        isText: true,
        text: "ЗАРЯДКА УЛЬТЫ!",
      });
    }

    // Обработка зарядки ульты
    if (this.ultCharging) {
      this.ultChargeTimer += dt;
      this.state = "ult_charge";
      this.vx = 0;
      if (this.isAmerica && this.ultChargeTimer >= 2 && Math.random() < 0.65) {
        const a = Math.random() * Math.PI * 2,
          r = 45 + Math.random() * 75;
        sbContext.particles.push({
          x: this.x + Math.cos(a) * r,
          y: this.y - 110 + Math.sin(a) * r,
          vx: Math.cos(a) * -100,
          vy: -120 - Math.random() * 100,
          life: 0.55,
          maxLife: 0.55,
          color: ["#ffffff", "#55aaff", "#ff4444", "#ffd700"][
            Math.floor(Math.random() * 4)
          ],
          size: 4 + Math.random() * 5,
        });
      }

      // Частицы зарядки
      if (Math.random() < 0.7) {
        if (this.isUkraine) {
          // Синие электрические искры
          const angle = Math.random() * Math.PI * 2;
          const r = 30 + Math.random() * 80;
          sbContext.particles.push({
            x: this.x + Math.cos(angle) * r,
            y: this.y - 80 + Math.sin(angle) * r,
            vx: Math.cos(angle) * -180,
            vy: Math.sin(angle) * -180 - 100,
            life: 0.5,
            maxLife: 0.5,
            color: ["#88ccff", "#ffffff", "#aaddff", "#ffff00"][
              Math.floor(Math.random() * 4)
            ],
            size: 3 + Math.random() * 5,
          });
        } else {
          // Красные огненные искры
          const angle = Math.random() * Math.PI * 2;
          const r = 20 + Math.random() * 60;
          sbContext.particles.push({
            x: this.x + Math.cos(angle) * r,
            y: this.y - 80 + Math.sin(angle) * r,
            vx: Math.cos(angle) * -150,
            vy: Math.sin(angle) * -150 - 80,
            life: 0.5,
            maxLife: 0.5,
            color: ["#ff4400", "#ffcc00", "#ffffff", "#ff8800"][
              Math.floor(Math.random() * 4)
            ],
            size: 3 + Math.random() * 5,
          });
        }
      }

      // Нарастающая тряска
      const shakeI = 3 + (this.ultChargeTimer / this.ultChargeDuration) * 20;
      sbContext.doShake(shakeI, 0.08);

      if (this.ultChargeTimer >= this.ultChargeDuration) {
        this.ultCharging = false;
        sbContext.triggerUlt(this, opponent);
      }
      this.applyGravity(dt);
      return;
    }

    if (this.ultTimer > 0) {
      this.ultTimer -= dt;
      if (this.isUkraine) {
        this.zombieWaveTimer -= dt;
        if (this.zombieWaveTimer <= 0) {
          this.zombieWaveTimer = 0.6;
          if (opponent && !opponent.dead) {
            const dist = Math.hypot(opponent.x - this.x, opponent.y - this.y);
            if (dist < 320) {
              opponent.takeDamage(4, opponent.x > this.x ? 1 : -1);
            }
          }
          sbContext.zombieWaves.push({
            x: this.x,
            y: this.y - 40,
            r: 30,
            maxR: 320,
            life: 0.5,
            maxLife: 0.5,
          });
          sbContext.playSound(150, 0.12, "sawtooth", 0.08);
          sbContext.doShake(6, 0.1);
        }
      }
    }

    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.bleedTickTimer -= dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.5;
        this.takeDamage(2, -this.facing);
        sbContext.spawnKetchup(this.x, this.y - 80, -this.facing, 3);
      }
    }

    if (this.healTicks > 0) {
      this.healTimer -= dt;
      if (this.healTimer <= 0) {
        this.healTimer = 0.7;
        this.healTicks--;
        this.hp = Math.min(this.maxHp, this.hp + 5);
        for (let i = 0; i < 10; i++) {
          const a = Math.random() * Math.PI * 2,
            s = 50 + Math.random() * 150;
          sbContext.particles.push({
            x: this.x,
            y: this.y - 80,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 50,
            life: 0.6,
            maxLife: 0.6,
            color: "#55ff55",
            size: 4 + Math.random() * 4,
          });
        }
        sbContext.particles.push({
          x: this.x,
          y: this.y - 100,
          vx: 0,
          vy: -50,
          life: 1.0,
          maxLife: 1.0,
          color: "#55ff55",
          size: 20,
          isText: true,
          text: "+5 HP",
        });
        sbContext.playSound(800, 0.1, "sine", 0.08);
      }
    }

    if (this.hp > 0 && !this.attack && this.hitstun <= 0) {
      const wantL = this.isDown(this.controls.left);
      const wantR = this.isDown(this.controls.right);
      if (wantL && !wantR) this.facing = -1;
      else if (wantR && !wantL) this.facing = 1;
    }

    if (this.hp <= 0) {
      this.koTimer += dt;
      this.applyGravity(dt);
      this.x += this.vx * dt;
      this.vx *= 0.9;
      this.clampX();
      return;
    }
    if (this.hitstun > 0) {
      this.hitstun -= dt;
      this.x += this.vx * dt;
      this.vx *= 0.85;
      if (this.hitstun <= 0) this.state = "idle";
      this.clampX();
      this.applyGravity(dt);
      return;
    }
    if (this.attack) {
      this.updateAttack(dt, opponent);
      this.applyGravity(dt);
      this.x += this.vx * dt;
      this.vx *= 0.9;
      this.clampX();
      return;
    }
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx = this.dashDir * sbContext.DASH_SPEED;
      this.x += this.vx * dt;
      this.clampX();
      this.applyGravity(dt);
      this.dashTrail.push({ x: this.x, y: this.y, life: 0.3, maxLife: 0.3 });
      this.state = this.onGround ? "dash" : "dash_air";
      return;
    }

    let moving = false;
    if (allowInput) {
      const cd = this.skillCd;
      if (this.blockedTimer <= 0) {
        if (hasSkills(this, "ukraine")) {
          if (skillDown(this, "ukraine", 0) && cd.drone <= 0) {
            sbContext.launchDrone(this);
            cd.drone = sbContext.SKILLS.drone.cd;
            sbContext.playSound(800, 0.15, "triangle", 0.08);
          }
          if (skillDown(this, "ukraine", 1) && cd.missile <= 0) {
            sbContext.launchMissile(this);
            cd.missile = sbContext.SKILLS.missile.cd;
            sbContext.playSound(300, 0.3, "sawtooth", 0.1);
          }
          if (skillDown(this, "ukraine", 2) && cd.bombs <= 0) {
            this.castBombs();
            cd.bombs = sbContext.SKILLS.bombs.cd;
          }
        }
        if (hasSkills(this, "america")) {
          if (skillDown(this, "america", 0) && cd.flag <= 0) {
            this.castFlag();
            cd.flag = sbContext.SKILLS_US.flag.cd;
          }
          if (skillDown(this, "america", 1) && cd.eagle <= 0) {
            this.castEagle();
            cd.eagle = sbContext.SKILLS_US.eagle.cd;
          }
          if (skillDown(this, "america", 2) && cd.burger <= 0) {
            this.castBurger();
            cd.burger = sbContext.SKILLS_US.burger.cd;
          }
        }
        if (hasSkills(this, "russia")) {
          if (skillDown(this, "russia", 0) && cd.blockade <= 0) {
            sbContext.fighter_castBlockade_arena.call(this);
            cd.blockade = sbContext.SKILLS_RU.blockade.cd;
          }
          if (skillDown(this, "russia", 1) && cd.bear <= 0) {
            sbContext.fighter_castBearSkill_arena.call(this);
            cd.bear = sbContext.SKILLS_RU.bear.cd;
          }
          if (skillDown(this, "russia", 2) && cd.uppercut <= 0) {
            if (this.ultTimer > 0) this.startAttack("uppercut");
            else sbContext.fighter_startAttack_base.call(this, "uppercut");
            cd.uppercut = sbContext.SKILLS_RU.uppercut.cd;
          }
        }
      }
      if (this.isDown(this.controls.dash) && this.dashCd <= 0) {
        this.startDash();
      }

      const flying = this.isAmerica && this.ultTimer > 0;
      const wantS = this.isDown(this.controls.block);
      const wantMove =
        this.isDown(this.controls.left) || this.isDown(this.controls.right);
      if (wantS && (this.onGround || flying)) {
        if (flying) {
          this.blocking = true;
        } else {
          const onPlat = this.getStandingPlatform();
          if (onPlat && !wantMove) {
            this.onGround = false;
            this.vy = 60;
            this.dropCooldown = 0.35;
            this.blocking = false;
            this.doubleJumpUsed = false;
          } else {
            this.blocking = true;
          }
        }
      } else {
        this.blocking = false;
      }

      if (this.blocking && !flying) {
        const direction =
          Number(this.isDown(this.controls.right)) -
          Number(this.isDown(this.controls.left));
        this.vx = direction * sbContext.MOVE_SPEED * 0.5;
        moving = direction !== 0;
        if (moving) this.walkCycle += dt * 8;
      }

      if (!this.blocking) {
        if (this.isDown(this.controls.left)) {
          this.vx = -sbContext.MOVE_SPEED * (this.facing > 0 ? 0.7 : 1);
          moving = true;
        } else if (this.isDown(this.controls.right)) {
          this.vx = sbContext.MOVE_SPEED * (this.facing < 0 ? 0.7 : 1);
          moving = true;
        } else this.vx = 0;

        if (this.isDown(this.controls.jump)) {
          if (this.onGround && !this._jumpHeld) {
            this.vy = sbContext.JUMP_VELOCITY;
            this.onGround = false;
            this.doubleJumpUsed = false;
            sbContext.spawnDust(this.x, this.y, 4);
            sbContext.playSound(400, 0.06, "sine", 0.03);
            this._jumpHeld = true;
          } else if (
            !this.onGround &&
            !this.doubleJumpUsed &&
            !this._jumpHeld
          ) {
            this.vy = sbContext.DOUBLE_JUMP_VELOCITY;
            this.doubleJumpUsed = true;
            this.doubleJumpCd = 3;
            for (let i = 0; i < 10; i++) {
              const a = Math.random() * Math.PI * 2,
                s = 80 + Math.random() * 150;
              sbContext.particles.push({
                x: this.x,
                y: this.y - 30,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 60,
                life: 0.4,
                maxLife: 0.4,
                color: "#aaddff",
                size: 4 + Math.random() * 4,
              });
            }
            sbContext.playSound(600, 0.08, "sine", 0.05);
            this._jumpHeld = true;
          }
        } else {
          this._jumpHeld = false;
        }

        if (this.isDown(this.controls.punch)) this.startAttack("punch");
        else if (this.isDown(this.controls.kick)) this.startAttack("kick");
        else if (this.isDown(this.controls.special) && this.specialCd <= 0) {
          this.startAttack("chargedPunch");
          this.specialCd = sbContext.ATTACKS.chargedPunch.cd;
        }
      } else if (flying) {
        // Во время полёта можно двигаться по горизонтали, не опуская щит
        if (this.isDown(this.controls.left)) {
          this.vx = -sbContext.MOVE_SPEED * (this.facing > 0 ? 0.7 : 1);
          moving = true;
        } else if (this.isDown(this.controls.right)) {
          this.vx = sbContext.MOVE_SPEED * (this.facing < 0 ? 0.7 : 1);
          moving = true;
        } else this.vx = 0;
      }
    } else {
      this.blocking = false;
      this.vx = 0;
    }

    this.x += this.vx * dt;
    this.clampX();
    if (this.isAmerica && this.ultTimer > 0) {
      const rise = this.isDown(this.controls.jump);
      const descend = this.isDown(this.controls.block);
      const flySpeed = sbContext.MOVE_SPEED * 1.55;
      if (rise && !descend) this.y -= flySpeed * dt;
      else if (descend) this.y += flySpeed * dt;
      this.y = Math.max(120, Math.min(sbContext.GROUND_Y, this.y));
      this.onGround = this.y >= sbContext.GROUND_Y - 1;
      this.vy = 0;
    } else {
      this.applyGravity(dt);
    }

    if (!this.onGround) this.state = "jump";
    else if (this.blocking) this.state = "block";
    else if (moving) {
      this.state = "walk";
      this.walkCycle += dt * 10;
    } else {
      this.state = "idle";
      this.breathing += dt * 3;
    }
  };

  sbContext.fighter_startDash_base = function () {
    this.dashTimer = sbContext.DASH_DURATION;
    this.dashCd = sbContext.DASH_CD;
    this.dashDir = this.facing;
    this.vy = 0;
    this.dashTrail = [];
    sbContext.playSound(500, 0.1, "sine", 0.06);
    sbContext.playSound(700, 0.08, "triangle", 0.04);
  };

  sbContext.fighter_getStandingPlatform_base = function () {
    for (const plat of sbContext.platforms) {
      if (
        Math.abs(this.y - plat.y) < 5 &&
        this.x + 25 > plat.x &&
        this.x - 25 < plat.x + plat.w
      ) {
        return plat;
      }
    }
    return null;
  };

  sbContext.fighter_applyGravity_base = function (dt) {
    if (this.isAmerica && this.ultTimer > 0) {
      this.vy = 0;
      this.onGround = false;
      return;
    }
    if (this.onGround) {
      if (this.y >= sbContext.GROUND_Y - 2) return;
      if (!this.getStandingPlatform()) this.onGround = false;
      else return;
    }
    this.vy += sbContext.GRAVITY * dt;
    const prevY = this.y;
    this.y += this.vy * dt;

    if (this.vy > 0 && this.dropCooldown <= 0) {
      for (const plat of sbContext.platforms) {
        if (this.x + 25 > plat.x && this.x - 25 < plat.x + plat.w) {
          if (prevY <= plat.y && this.y >= plat.y) {
            this.y = plat.y;
            this.vy = 0;
            this.onGround = true;
            this.doubleJumpUsed = false;
            this.doubleJumpCd = 0;
            sbContext.spawnDust(this.x, plat.y, 4);
            return;
          }
        }
      }
    }

    if (this.y >= sbContext.GROUND_Y) {
      let onSpring = false;
      for (const s of sbContext.springs) {
        if (Math.abs(this.x - s.x) < 45) {
          onSpring = true;
          this.vy = -1500;
          this.onGround = false;
          this.doubleJumpUsed = false;
          sbContext.spawnDust(this.x, sbContext.GROUND_Y, 12);
          sbContext.playSound(300, 0.15, "sine", 0.08);
          sbContext.playSound(800, 0.1, "triangle", 0.05);
          break;
        }
      }
      if (!onSpring) {
        this.y = sbContext.GROUND_Y;
        this.vy = 0;
        this.onGround = true;
        this.doubleJumpUsed = false;
        this.doubleJumpCd = 0;
        if (Math.abs(prevY - sbContext.GROUND_Y) > 30)
          sbContext.spawnDust(this.x, sbContext.GROUND_Y, 5);
      }
    }
  };

  sbContext.fighter_clampX_base = function () {
    this.x = Math.max(
      sbContext.ARENA_LEFT + 30,
      Math.min(sbContext.ARENA_RIGHT - 30, this.x),
    );
  };

  sbContext.fighter_startAttack_base = function (type) {
    const cfg = sbContext.ATTACKS[type] || sbContext.ATTACKS.punch;
    this.attack = {
      type,
      timer: 0,
      totalTime: cfg.startup + cfg.active + cfg.recovery,
      startupEnd: cfg.startup,
      activeEnd: cfg.startup + cfg.active,
      hasHit: false,
      spawned: false,
    };
    if (type === "punch") sbContext.playSound(180, 0.05, "square", 0.05);
    else if (type === "kick") sbContext.playSound(140, 0.07, "square", 0.06);
    else if (type === "uppercut")
      sbContext.playSound(120, 0.1, "sawtooth", 0.12);
    else if (type === "chargedPunch") {
      sbContext.playSound(150, 0.3, "sawtooth", 0.1);
      sbContext.particles.push({
        x: this.x,
        y: this.y - 200,
        vx: 0,
        vy: -40,
        life: 1.2,
        maxLife: 1.2,
        color: "#ffaa00",
        size: 24,
        isText: true,
        text: "ЗАРЯД...",
      });
    }
  };

  sbContext.fighter_updateAttack_base = function (dt, opponent) {
    const a = this.attack;
    a.timer += dt;
    let phase;
    if (a.timer < a.startupEnd) phase = "startup";
    else if (a.timer < a.activeEnd) phase = "active";
    else phase = "recovery";

    if (a.type === "chargedPunch" && phase === "startup") {
      if (Math.random() < 0.6) {
        const angle = Math.random() * Math.PI * 2;
        const r = 40 + Math.random() * 60;
        sbContext.particles.push({
          x: this.x + Math.cos(angle) * r + this.facing * 30,
          y: this.y - 90 + Math.sin(angle) * r,
          vx: -Math.cos(angle) * 180,
          vy: -Math.sin(angle) * 180,
          life: 0.35,
          maxLife: 0.35,
          color: Math.random() < 0.5 ? "#ffcc00" : "#ff8800",
          size: 3 + Math.random() * 4,
        });
      }
    }

    if (phase === "active" && !a.hasHit) {
      if (
        a.type === "punch" ||
        a.type === "kick" ||
        a.type === "uppercut" ||
        a.type === "chargedPunch"
      ) {
        const cfg = sbContext.ATTACKS[a.type];
        const hb = {
          x: this.x + this.facing * cfg.range,
          y: this.y + cfg.hitY,
          r: cfg.hitR,
        };
        if (sbContext.circleOverlap(hb, opponent.getHurtbox())) {
          opponent.takeDamage(cfg.damage, this.facing);
          if (cfg.knockback) opponent.vx = this.facing * cfg.knockback;
          if (cfg.launch) {
            opponent.vy = -900;
            opponent.onGround = false;
          }
          a.hasHit = true;
          sbContext.spawnHitSparks(hb.x, hb.y, "#ffff88");
          sbContext.doShake(
            a.type === "chargedPunch"
              ? 30
              : a.type === "uppercut"
                ? 16
                : a.type === "kick"
                  ? 10
                  : 6,
            a.type === "chargedPunch" ? 0.35 : 0.15,
          );
          sbContext.hitStopTimer = a.type === "chargedPunch" ? 0.15 : 0.06;
          for (const c of sbContext.crowd)
            c.excited = a.type === "chargedPunch" ? 3 : 1.5;
          sbContext.playSound(
            a.type === "chargedPunch" ? 80 : 200,
            0.15,
            "square",
            0.12,
          );
          if (a.type === "chargedPunch") {
            sbContext.flash("rgba(255,200,0,0.4)");
            sbContext.particles.push({
              x: hb.x,
              y: hb.y,
              vx: 0,
              vy: -60,
              life: 1.0,
              maxLife: 1.0,
              color: "#ffaa00",
              size: 32,
              isText: true,
              text: "БУМ!",
            });
          }
          if (Math.random() < 0.35) sbContext.killRandomSpectator();
        }
      }
    }
    if (a.timer >= a.totalTime) this.attack = null;
  };

  sbContext.fighter_getHurtbox_base = function () {
    return { x: this.x, y: this.y - 80, r: 42 };
  };

  sbContext.fighter_isDown_base = function (code) {
    if (this.isAI) {
      if (Array.isArray(code)) return code.some((c) => this.aiKeys[c] === true);
      return this.aiKeys[code] === true;
    }
    if (Array.isArray(code))
      return code.some((c) => sbContext.keys[c] === true);
    return sbContext.keys[code] === true;
  };

  sbContext.fighter_takeDamage_base = function (dmg, dir) {
    // Последние две секунды превращения Америки неуязвимы
    if (this.isAmerica && this.ultCharging && this.ultChargeTimer >= 2) return;

    // Щит Капитана Америки поглощает первые 100 единиц урона при блоке
    if (
      this.isAmerica &&
      this.ultTimer > 0 &&
      this.blocking &&
      this.shieldHp > 0
    ) {
      const absorbed = Math.min(dmg, this.shieldHp);
      this.shieldHp -= absorbed;
      dmg -= absorbed;
      sbContext.spawnHitSparks(
        this.x - this.facing * 35,
        this.y - 100,
        "#55bbff",
      );
      sbContext.playSound(520, 0.07, "triangle", 0.09);
      if (this.shieldHp <= 0 && !this.shieldBroken) {
        this.shieldHp = 0;
        this.shieldBroken = true;
        sbContext.particles.push({
          x: this.x,
          y: this.y - 150,
          vx: 0,
          vy: -45,
          life: 1.2,
          maxLife: 1.2,
          color: "#ffcc44",
          size: 24,
          isText: true,
          text: "ЩИТ СЛОМАН!",
        });
        sbContext.doShake(10, 0.18);
      }
      if (dmg <= 0) return;
    }

    // Прерывание зарядки ульты
    if (this.ultCharging) {
      this.ultCharging = false;
      this.ultChargeTimer = 0;
      if (this.state === "ult_charge") this.state = "idle";
      sbContext.particles.push({
        x: this.x,
        y: this.y - 200,
        vx: 0,
        vy: -40,
        life: 1.0,
        maxLife: 1.0,
        color: "#ff4444",
        size: 24,
        isText: true,
        text: "ПРЕРВАНО!",
      });
      sbContext.playSound(200, 0.2, "sawtooth", 0.1);
    }

    if (this.ultTimer > 0 && !this.isUkraine) {
      dmg *= 0.5;
    }
    if (
      this.blocking &&
      this.onGround &&
      !(this.isAmerica && this.ultTimer > 0)
    ) {
      this.hp -= dmg * 0.15;
      this.hitFlash = Math.max(this.hitFlash, 0.3);
      sbContext.spawnHitSparks(this.x - dir * 20, this.y - 80, "#88aaff");
      sbContext.playSound(400, 0.05, "triangle", 0.06);
      return;
    }
    this.hp -= dmg;
    this.hitFlash = 0.5;
    this.hitstun = Math.min(0.4, dmg * 0.04);
    this.vx = dir * (150 + dmg * 15);
    this.state = "hit";
    sbContext.spawnHitSparks(this.x, this.y - 80, "#ff8888");
    sbContext.spawnKetchup(
      this.x,
      this.y - 80,
      dir,
      Math.min(18, 4 + Math.floor(dmg)),
    );
    sbContext.playSound(250, 0.08, "sawtooth", 0.08);
    if (this.attack && this.attack.type === "chargedPunch") {
      this.attack = null;
      sbContext.particles.push({
        x: this.x,
        y: this.y - 140,
        vx: 0,
        vy: -40,
        life: 0.8,
        maxLife: 0.8,
        color: "#ff4444",
        size: 20,
        isText: true,
        text: "ПРЕРВАНО",
      });
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = "ko";
      this.vx = dir * 200;
      sbContext.doShake(25, 0.3);
      sbContext.playSound(100, 0.6, "sawtooth", 0.15);
      for (let k = 0; k < 3; k++) sbContext.killRandomSpectator();
    }
  };
}
