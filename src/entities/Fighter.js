import { updateStatusEffects } from "../systems/status.js";
// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.Fighter = class Fighter {
    constructor(x, facing, charType, name, controls) {
      this.x = x;
      this.y = sbContext.GROUND_Y;
      this.facing = facing;
      this.charType = charType;
      this.isUkraine = charType === "ukraine";
      this.isAmerica = charType === "america";
      this.colors = this.isUkraine
        ? sbContext.UKRAINE_COLORS
        : this.isAmerica
          ? sbContext.AMERICAN_COLORS
          : sbContext.RUSSIA_COLORS;
      this.name = name;
      this.controls = controls;
      this.hp = 100;
      this.maxHp = 100;
      this.vx = 0;
      this.vy = 0;
      this.onGround = true;
      this.state = "idle";
      this.animTime = 0;
      this.attack = null;
      this.hitstun = 0;
      this.hitFlash = 0;
      this.blocking = false;
      this.specialCd = 0;
      this.walkCycle = 0;
      this.koTimer = 0;
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
      this.dashDir = 0;
      this.dashTrail = [];

      this.ultUsed = false;
      this.ultTimer = 0;
      this.zombieWaveTimer = 0;
      this.ultCharging = false;
      this.ultChargeTimer = 0;
      this.ultChargeDuration = this.isAmerica ? 4.0 : sbContext.ULT_CHARGE_TIME;
      this._ultKeyHeld = false;
      this.shieldHp = 100;
      this.shieldBroken = false;

      this.dropCooldown = 0;
      this.breathing = Math.random() * Math.PI * 2;
      this.bleedTimer = 0;
      this.bleedTickTimer = 0;
      this.healTicks = 0;
      this.healTimer = 0;

      this.isAI = false;
      this.aiKeys = {};
      this.aiTimer = 0;
    }
    reset(...args) {
      return sbContext.fighter_reset_afghanistan.apply(this, args);
    }
    getSkillCd(...args) {
      return sbContext.fighter_getSkillCd_base.apply(this, args);
    }
    castFlag(...args) {
      return sbContext.fighter_castFlag_arena.apply(this, args);
    }
    castEagle(...args) {
      return sbContext.fighter_castEagle_interface.apply(this, args);
    }
    castBurger(...args) {
      return sbContext.fighter_castBurger_arena.apply(this, args);
    }
    update(...args) {
      sbContext.fighter_update_afghanistan.apply(this, args);
      updateStatusEffects(sbContext, this, args[0]);
    }
    startDash(...args) {
      return sbContext.fighter_startDash_afghanistan.apply(this, args);
    }
    getStandingPlatform(...args) {
      return sbContext.fighter_getStandingPlatform_base.apply(this, args);
    }
    castBlockade(...args) {
      return sbContext.fighter_castBlockade_afghanistan.apply(this, args);
    }
    castBearSkill(...args) {
      return sbContext.fighter_castBearSkill_afghanistan.apply(this, args);
    }
    castBombs(...args) {
      return sbContext.fighter_castBombs_arena.apply(this, args);
    }
    applyGravity(...args) {
      return sbContext.fighter_applyGravity_base.apply(this, args);
    }
    clampX(...args) {
      return sbContext.fighter_clampX_base.apply(this, args);
    }
    startAttack(...args) {
      return sbContext.fighter_startAttack_afghanistan.apply(this, args);
    }
    updateAttack(...args) {
      return sbContext.fighter_updateAttack_afghanistan.apply(this, args);
    }
    getHurtbox(...args) {
      return sbContext.fighter_getHurtbox_base.apply(this, args);
    }
    isDown(...args) {
      return sbContext.fighter_isDown_base.apply(this, args);
    }
    takeDamage(...args) {
      return sbContext.fighter_takeDamage_afghanistan.apply(this, args);
    }
    cnNoodleShot(...args) {
      return sbContext.fighter_cnNoodleShot_china.apply(this, args);
    }
    cnFirework(...args) {
      return sbContext.fighter_cnFirework_china.apply(this, args);
    }
    cnLantern(...args) {
      return sbContext.fighter_cnLantern_china.apply(this, args);
    }
    cnBreath(...args) {
      return sbContext.fighter_cnBreath_china.apply(this, args);
    }
    cnTail(...args) {
      return sbContext.fighter_cnTail_china.apply(this, args);
    }
    cnRoar(...args) {
      return sbContext.fighter_cnRoar_china.apply(this, args);
    }
    japanTeleport(...args) {
      return sbContext.fighter_japanTeleport_japan.apply(this, args);
    }
  };
}
