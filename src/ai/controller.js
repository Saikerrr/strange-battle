import { ABILITIES, abilityById } from "../characters/ability-kit.js";

const keyFor = (f, action) => {
  const key = f.controls[action];
  return Array.isArray(key) ? key[0] : key;
};
function incomingProjectile(g, ai) {
  const objects = [
    ...g.projectiles,
    ...g.afghanBullets,
    ...g.afghanNets,
    ...g.cnNoodle,
  ];
  return objects.some((p) => {
    if (p.owner === ai || !p.owner) return false;
    const vx = p.vx || 0,
      vy = p.vy || 0,
      speed2 = vx * vx + vy * vy;
    if (speed2 < 1) return false;
    const dx = ai.x - p.x,
      dy = ai.y - 90 - p.y;
    const time = (dx * vx + dy * vy) / speed2;
    return (
      time > 0 && time < 0.6 && Math.hypot(dx - vx * time, dy - vy * time) < 75
    );
  });
}
function options(g, ai) {
  const normal =
    ai.draftLoadout && ai.ultTimer <= 0
      ? ai.draftLoadout.map(abilityById)
      : ABILITIES.filter((a) => a.country === ai.charType);
  const cds = g.getPlayerSkills(ai);
  return normal.map((a, index) => {
    let min = a.minRange,
      max = a.maxRange,
      kind = a.key;
    if (ai.ultTimer > 0) {
      kind = ai.charType + index;
      if (ai.isUkraine) {
        min = 0;
        max = index === 2 ? 650 : 1400;
      }
      if (ai.charType === "russia") {
        min = 0;
        max = index === 2 ? 1400 : a.maxRange;
      }
      if (ai.isAmerica) {
        min = 0;
        max = index === 2 ? 700 : 1400;
      }
      if (ai.isChina) {
        min = 0;
        max = [450, 200, 700][index];
      }
      if (ai.isAfghanistan) {
        min = 0;
        max = [400, 1000, 1400][index];
      }
    }
    return {
      ...a,
      index,
      kind,
      minRange: min,
      maxRange: max,
      remaining: cds[index]?.cd || 0,
    };
  });
}

export function register(g) {
  g.updateAI_afghanistan = function (ai, player) {
    const diff = g.DIFFICULTY_CFG[g.game.difficulty] || g.DIFFICULTY_CFG.medium;
    ai.aiTimer =
      diff.decisionMin + Math.random() * (diff.decisionMax - diff.decisionMin);
    ai.aiKeys = {};
    const mem =
      ai.aiMemory ||
      (ai.aiMemory = { previous: null, lastSkill: null, combo: 0 });
    const dist = Math.abs(player.x - ai.x),
      dir = player.x >= ai.x ? 1 : -1;
    const observation = {
      melee: !!player.attack && dist < 175,
      danger: incomingProjectile(g, ai),
    };
    const previous = mem.previous;
    mem.previous = observation;
    if (
      ai.hp <= 0 ||
      ai.hitstun > 0 ||
      ai.state === "ko" ||
      ai.carried ||
      ai.ultCharging
    )
      return;
    const press = (action) => {
      if (
        action.startsWith("skill") ||
        action === "punch" ||
        action === "kick"
      ) {
        delete ai.aiKeys[keyFor(ai, "left")];
        delete ai.aiKeys[keyFor(ai, "right")];
        ai.facing = dir;
      }
      ai.aiKeys[keyFor(ai, action)] = true;
    };
    const move = (direction) => press(direction > 0 ? "right" : "left");
    // React only after a threat has been observed on a preceding decision.
    const melee = previous?.melee && observation.melee;
    const danger = previous?.danger && observation.danger;
    if (Math.random() < diff.mistakeChance) {
      mem.lastSkill = null;
      return;
    }
    if (
      g.afghanC4s.some(
        (b) =>
          b.owner === ai &&
          b.landed &&
          Math.hypot(player.x - b.x, player.y - 70 - (b.y - 20)) < 150,
      )
    )
      ai.aiKeys[ai === g.p1 ? "KeyQ" : "Numpad7"] = true;

    const skills = options(g, ai);
    if (ai.afghanRifleActive > 0 || ai.afghanMinigunActive > 0) {
      ai.facing = dir;
      return;
    }
    const candidates = skills
      .filter(
        (a) => a.remaining <= 0 && dist >= a.minRange && dist <= a.maxRange,
      )
      .map((a) => {
        let score = 7;
        if (a.kind === "burger") score = ai.hp < ai.maxHp * 0.78 ? 15 : -100;
        if (
          a.kind === "parry" ||
          (ai.isJapan && ai.ultTimer > 0 && a.index === 1)
        )
          score = melee ? 20 : -100;
        if (
          a.kind === "astral" ||
          (ai.isJapan && ai.ultTimer > 0 && a.index === 2)
        )
          score = ai.hp < ai.maxHp * 0.55 || danger ? 16 : -100;
        if (a.kind === "uppercut") score = dist < 135 ? 14 : -100;
        if (a.kind === "noodle") score = ai.noodleCharges > 0 ? 10 : 6;
        if (
          a.kind === "c4" &&
          (ai.afghanC4Charging ||
            g.afghanC4s.filter((b) => b.owner === ai).length >= 5)
        )
          score = -100;
        if (
          ai.isAfghanistan &&
          ai.ultTimer > 0 &&
          a.index === 2 &&
          ai.afghanPlaneUsed
        )
          score = -100;
        return { ...a, score };
      })
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score);

    const defensive = candidates.find(
      (a) =>
        a.kind === "parry" ||
        a.kind === "astral" ||
        (ai.isJapan && ai.ultTimer > 0 && a.index > 0),
    );
    if ((melee || danger) && Math.random() < diff.blockChance) {
      if (defensive && mem.lastSkill !== defensive.index) {
        press("skill" + (defensive.index + 1));
        mem.lastSkill = defensive.index;
        return;
      }
      if (ai.onGround) {
        press("block");
        if (danger) move(-dir);
      } else move(-dir);
      mem.lastSkill = null;
      return;
    }

    const wantUlt =
      !ai.ultUsed &&
      (ai.ultCooldown || 0) <= 0 &&
      ai.hp < ai.maxHp * diff.ultThreshold;
    if (wantUlt && (dist > 430 || player.hitstun > 1)) {
      press("ult");
      mem.lastSkill = null;
      return;
    }
    const rangedReady = candidates.some(
      (a) => a.maxRange >= 700 && a.kind !== "burger" && a.kind !== "astral",
    );
    const desired = wantUlt ? 550 : rangedReady ? 310 : 85;
    if (dist > desired + 45) move(dir);
    else if (dist < desired - 70) move(-dir);
    // Pursue elevated opponents rather than jumping randomly on flat ground.
    if (
      player.y < ai.y - 70 &&
      dist < 650 &&
      (ai.onGround || (!ai.doubleJumpUsed && ai.vy > 0))
    )
      press("jump");
    if (
      dist > 700 &&
      ai.dashCd <= 0 &&
      ai.onGround &&
      Math.random() < diff.dashChance * 3
    )
      press("dash");
    if (ai.x < g.ARENA_LEFT + 90) move(1);
    if (ai.x > g.ARENA_RIGHT - 90) move(-1);
    if (
      ai.attack ||
      ai.japanStanceTimer > 0 ||
      ai.japanParryPrep > 0 ||
      ai.japanParryStance > 0 ||
      ai.japanAstralTimer > 0
    )
      return;
    const best = candidates[0];
    if (best && ai.blockedTimer <= 0 && Math.random() < diff.skillChance) {
      // Edge-triggered abilities (noodles, parry, rifle) need a released frame.
      if (mem.lastSkill !== best.index) {
        press("skill" + (best.index + 1));
        mem.lastSkill = best.index;
        return;
      }
    }
    mem.lastSkill = null;
    if (dist < 110 && Math.abs(player.y - ai.y) < 100) {
      mem.combo++;
      press(mem.combo % 3 === 0 ? "kick" : "punch");
    }
  };
  g.updateAI_interface2 = g.updateAI_afghanistan;
}
