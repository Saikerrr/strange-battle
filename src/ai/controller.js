// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.updateAI_interface2 = function (ai, player) {
    const diff =
      sbContext.DIFFICULTY_CFG[sbContext.game.difficulty] ||
      sbContext.DIFFICULTY_CFG.medium;
    ai.aiTimer =
      diff.decisionMin + Math.random() * (diff.decisionMax - diff.decisionMin);
    ai.aiKeys = {};
    if (
      ai.hp <= 0 ||
      ai.state === "hit" ||
      ai.state === "ko" ||
      ai.carried ||
      ai.ultCharging
    )
      return;
    if (Math.random() < diff.mistakeChance) return;

    const dx = player.x - ai.x,
      dist = Math.abs(dx),
      dir = dx > 0 ? 1 : -1;

    if (
      player.y < ai.y - 100 &&
      ai.onGround &&
      Math.random() < diff.jumpChance * 1.5
    )
      ai.aiKeys["ArrowUp"] = true;
    else if (
      player.y > ai.y + 50 &&
      ai.onGround &&
      Math.random() < diff.jumpChance
    )
      ai.aiKeys["ArrowDown"] = true;

    if (
      !ai.ultUsed &&
      (ai.ultCooldown === undefined || ai.ultCooldown <= 0) &&
      ai.hp < ai.maxHp * diff.ultThreshold &&
      Math.random() < 0.05
    ) {
      ai.aiKeys["Numpad0"] = true;
      return;
    }

    if (player.attack && dist < 150 && Math.random() < diff.blockChance) {
      ai.aiKeys["ArrowDown"] = true;
      return;
    }

    if (ai.isUkraine) {
      if (dist > 200 && dist < 1000) {
        if (ai.skillCd.missile <= 0 && Math.random() < diff.skillChance * 0.4)
          ai.aiKeys["Numpad2"] = true;
        else if (
          ai.skillCd.drone <= 0 &&
          Math.random() < diff.skillChance * 0.35
        )
          ai.aiKeys["Numpad1"] = true;
      }
      if (
        dist < 180 &&
        ai.skillCd.bombs <= 0 &&
        Math.random() < diff.skillChance * 0.3
      )
        ai.aiKeys["Numpad3"] = true;
    } else if (ai.isAmerica) {
      if (
        ai.hp < ai.maxHp * 0.7 &&
        ai.skillCd.burger <= 0 &&
        Math.random() < 0.35
      )
        ai.aiKeys["Numpad3"] = true;
      if (
        dist > 200 &&
        dist < 1000 &&
        ai.skillCd.flag <= 0 &&
        Math.random() < diff.skillChance * 0.4
      )
        ai.aiKeys["Numpad1"] = true;
      if (ai.skillCd.eagle <= 0 && Math.random() < diff.skillChance * 0.2)
        ai.aiKeys["Numpad2"] = true;
    } else if (ai.isChina) {
      if (ai.ultTimer > 0) {
        if (dist < 200 && ai.tailCd <= 0 && Math.random() < 0.6)
          ai.aiKeys["Numpad2"] = true;
        else if (dist < 280 && ai.roarCd <= 0 && Math.random() < 0.4)
          ai.aiKeys["Numpad3"] = true;
        else if (
          dist > 150 &&
          dist < 420 &&
          ai.breathCd <= 0 &&
          Math.random() < 0.5
        )
          ai.aiKeys["Numpad1"] = true;
      } else {
        if (ai.noodleCharges > 0 && Math.random() < 0.3)
          ai.aiKeys["Numpad1"] = true;
        else if (
          dist > 250 &&
          ai.fireworkCd <= 0 &&
          Math.random() < 0.25 * diff.skillChance
        )
          ai.aiKeys["Numpad2"] = true;
        else if (
          ai.lanternCd <= 0 &&
          dist > 300 &&
          Math.random() < 0.04 * diff.skillChance
        )
          ai.aiKeys["Numpad3"] = true;
        else if (
          ai.skillCd.noodle <= 0 &&
          ai.noodleCharges === 0 &&
          dist < 400 &&
          Math.random() < 0.03 * diff.skillChance
        )
          ai.aiKeys["Numpad1"] = true;
      }
    } else if (ai.isJapan) {
      if (
        dist > 200 &&
        dist < 600 &&
        ai.japanStanceCd <= 0 &&
        Math.random() < diff.skillChance * 0.5
      )
        ai.aiKeys["Numpad1"] = true;
      if (
        dist < 150 &&
        player.attack &&
        ai.japanParryCd <= 0 &&
        Math.random() < diff.skillChance * 0.4
      )
        ai.aiKeys["Numpad2"] = true;
      if (
        ai.hp < ai.maxHp * 0.4 &&
        ai.japanAstralCd <= 0 &&
        Math.random() < diff.skillChance * 0.15
      )
        ai.aiKeys["Numpad3"] = true;
    } else {
      if (
        dist > 200 &&
        dist < 1000 &&
        ai.skillCd.blockade <= 0 &&
        Math.random() < diff.skillChance * 0.4
      )
        ai.aiKeys["Numpad1"] = true;
      if (dist < 150 && ai.skillCd.uppercut <= 0 && Math.random() < 0.3)
        ai.aiKeys["Numpad3"] = true;
      if (dist < 250 && ai.skillCd.bear <= 0 && Math.random() < 0.2)
        ai.aiKeys["Numpad2"] = true;
    }

    if (dist < 95 && !ai.attack && Math.random() < diff.attackChance) {
      if (Math.random() < 0.15) ai.aiKeys["Numpad6"] = true;
      else if (Math.random() < 0.4) ai.aiKeys["Numpad4"] = true;
      else if (Math.random() < 0.4) ai.aiKeys["Numpad5"] = true;
    }

    if (
      !ai.attack &&
      !ai.blocking &&
      !ai.aiKeys["Numpad4"] &&
      !ai.aiKeys["Numpad5"] &&
      !ai.aiKeys["Numpad6"]
    ) {
      if (dist > 90) {
        const moveDir = Math.random() < diff.approach ? dir : -dir;
        ai.aiKeys[moveDir > 0 ? "ArrowRight" : "ArrowLeft"] = true;
        if (Math.random() < diff.jumpChance && ai.onGround)
          ai.aiKeys["ArrowUp"] = true;
        if (Math.random() < diff.dashChance && ai.dashCd <= 0)
          ai.aiKeys["ShiftRight"] = true;
      } else {
        if (Math.random() < 0.3)
          ai.aiKeys[dir > 0 ? "ArrowLeft" : "ArrowRight"] = true;
      }
    }
  };

  sbContext.updateAI_afghanistan = function (ai, player) {
    if (!ai.isAfghanistan) {
      sbContext.updateAI_interface2(ai, player);
      return;
    }
    const diff =
      sbContext.DIFFICULTY_CFG[sbContext.game.difficulty] ||
      sbContext.DIFFICULTY_CFG.medium;
    ai.aiTimer =
      diff.decisionMin + Math.random() * (diff.decisionMax - diff.decisionMin);
    ai.aiKeys = {};
    if (
      sbContext.afghanC4s.some(
        (c) =>
          c.owner === ai &&
          c.landed &&
          Math.hypot(player.x - c.x, player.y - 70 - (c.y - 20)) < 150,
      )
    )
      ai.aiKeys[ai === sbContext.p1 ? "KeyQ" : "Numpad7"] = true;
    if (
      ai.hp <= 0 ||
      ai.state === "hit" ||
      ai.state === "ko" ||
      ai.carried ||
      ai.ultCharging
    )
      return;
    if (Math.random() < diff.mistakeChance) return;
    const dx = player.x - ai.x,
      dist = Math.abs(dx),
      dir = dx > 0 ? 1 : -1;
    if (
      player.y < ai.y - 100 &&
      ai.onGround &&
      Math.random() < diff.jumpChance * 1.5
    )
      ai.aiKeys["ArrowUp"] = true;
    if (
      !ai.ultUsed &&
      (ai.ultCooldown === undefined || ai.ultCooldown <= 0) &&
      ai.hp < ai.maxHp * diff.ultThreshold &&
      Math.random() < 0.05
    ) {
      ai.aiKeys["Numpad0"] = true;
      return;
    }
    if (player.attack && dist < 150 && Math.random() < diff.blockChance) {
      ai.aiKeys["ArrowDown"] = true;
      return;
    }
    if (ai.ultTimer > 0) {
      if (dist < 200 && ai.afghanC4Cd <= 0 && Math.random() < 0.5)
        ai.aiKeys["Numpad1"] = true;
      if (
        dist > 200 &&
        dist < 800 &&
        ai.afghanRifleCd <= 0 &&
        Math.random() < 0.5
      )
        ai.aiKeys["Numpad2"] = true;
      if (
        dist > 300 &&
        ai.afghanPlaneCd <= 0 &&
        !ai.afghanPlaneUsed &&
        Math.random() < 0.3
      )
        ai.aiKeys["Numpad3"] = true;
    } else {
      if (
        dist > 300 &&
        ai.afghanRifleCd <= 0 &&
        Math.random() < diff.skillChance * 0.4
      )
        ai.aiKeys["Numpad2"] = true;
      if (
        dist > 200 &&
        dist < 500 &&
        ai.afghanC4Cd <= 0 &&
        Math.random() < diff.skillChance * 0.3
      )
        ai.aiKeys["Numpad1"] = true;
      if (
        dist > 100 &&
        dist < 400 &&
        ai.afghanNetCd <= 0 &&
        Math.random() < diff.skillChance * 0.3
      )
        ai.aiKeys["Numpad3"] = true;
    }
    if (dist < 95 && !ai.attack && Math.random() < diff.attackChance) {
      if (Math.random() < 0.15) ai.aiKeys["Numpad6"] = true;
      else if (Math.random() < 0.4) ai.aiKeys["Numpad4"] = true;
      else if (Math.random() < 0.4) ai.aiKeys["Numpad5"] = true;
    }
    if (
      !ai.attack &&
      !ai.blocking &&
      !ai.aiKeys["Numpad4"] &&
      !ai.aiKeys["Numpad5"] &&
      !ai.aiKeys["Numpad6"]
    ) {
      if (dist > 90) {
        const moveDir = Math.random() < diff.approach ? dir : -dir;
        ai.aiKeys[moveDir > 0 ? "ArrowRight" : "ArrowLeft"] = true;
        if (Math.random() < diff.jumpChance && ai.onGround)
          ai.aiKeys["ArrowUp"] = true;
        if (Math.random() < diff.dashChance && ai.dashCd <= 0)
          ai.aiKeys["ShiftRight"] = true;
      } else {
        if (Math.random() < 0.3)
          ai.aiKeys[dir > 0 ? "ArrowLeft" : "ArrowRight"] = true;
      }
    }
  };
}
