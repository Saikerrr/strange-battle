// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.goToTitle_base = function () {
    sbContext.game.state = "title";
    sbContext.game.message = "";
  };

  sbContext.goToSelect_base = function () {
    sbContext.game.state = "select";
    sbContext.game.message = "";
  };

  sbContext.goToControls_base = function () {
    sbContext.game.state = "controls";
  };

  sbContext.startMatch_base = function () {
    sbContext.applySelections();
    sbContext.game.p1Wins = 0;
    sbContext.game.p2Wins = 0;
    sbContext.game.round = 1;
    sbContext.startRound();
  };

  sbContext.startRound_base = function () {
    sbContext.p1.reset();
    sbContext.p2.reset();
    sbContext.p1.x = 1500;
    sbContext.p2.x = 2100;
    sbContext.projectiles.length = 0;
    sbContext.particles.length = 0;
    sbContext.drones.length = 0;
    sbContext.bears.length = 0;
    sbContext.bombs.length = 0;
    sbContext.eagles.length = 0;
    sbContext.lightningEffects.length = 0;
    sbContext.explosionRings.length = 0;
    sbContext.zombieWaves.length = 0;
    sbContext.camera.x = 1800;
    sbContext.camera.zoom = 1;
    sbContext.game.state = "roundStart";
    sbContext.game.timer = 0;
    sbContext.game.secondMsgShown = false;
    sbContext.game.message = "РАУНД " + sbContext.game.round;
    sbContext.game.messageTimer = 1.5;
    sbContext.game.messageMaxTimer = 1.5;
    sbContext.playSound(440, 0.2, "triangle", 0.08);
  };

  sbContext.endRound_base = function (winner) {
    if (sbContext.game.state !== "fighting") return;
    sbContext.game.state = "roundEnd";
    sbContext.game.timer = 0;
    sbContext.game.winner = winner;
    sbContext.game.secondMsgShown = false;
    sbContext.game.message =
      sbContext.p1.hp <= 0 && sbContext.p2.hp <= 0 ? "ДВОЙНОЕ K.O." : "K.O.";
    sbContext.game.messageTimer = 1.0;
    sbContext.game.messageMaxTimer = 1.0;
    if (winner === 1) sbContext.game.p1Wins++;
    else if (winner === 2) sbContext.game.p2Wins++;
    sbContext.projectiles.length = 0;
    sbContext.drones.length = 0;
    sbContext.bears.length = 0;
    sbContext.bombs.length = 0;
    sbContext.doShake(20, 0.4);
  };

  sbContext.updateGame_base = function (dt) {
    if (
      sbContext.game.state === "title" ||
      sbContext.game.state === "select" ||
      sbContext.game.state === "controls" ||
      sbContext.game.state === "matchEnd"
    ) {
      return;
    }
    if (sbContext.hitStopTimer > 0) {
      sbContext.hitStopTimer -= dt;
      return;
    }
    sbContext.game.timer += dt;

    if (sbContext.game.state === "roundStart") {
      if (sbContext.game.timer >= 1.5) {
        sbContext.game.state = "fighting";
        sbContext.game.timer = 0;
        sbContext.game.message = "БОЙ!";
        sbContext.game.messageTimer = 0.8;
        sbContext.game.messageMaxTimer = 0.8;
        sbContext.playSound(660, 0.15, "square", 0.1);
      }
    } else if (sbContext.game.state === "fighting") {
      if (sbContext.p1.hp <= 0 || sbContext.p2.hp <= 0)
        sbContext.endRound(sbContext.p1.hp <= 0 ? 2 : 1);
    } else if (sbContext.game.state === "roundEnd") {
      if (!sbContext.game.secondMsgShown && sbContext.game.timer >= 1.0) {
        sbContext.game.secondMsgShown = true;
        sbContext.game.message =
          sbContext.game.winner === 0
            ? "НИЧЬЯ"
            : "ИГРОК " + sbContext.game.winner;
        sbContext.game.messageTimer = 1.5;
        sbContext.game.messageMaxTimer = 1.5;
      }
      if (sbContext.game.timer >= 2.5) {
        if (sbContext.game.p1Wins >= 2 || sbContext.game.p2Wins >= 2) {
          sbContext.game.state = "matchEnd";
          sbContext.game.timer = 0;
          sbContext.game.message =
            sbContext.game.p1Wins >= 2 ? "P1 ЧЕМПИОН" : "P2 ЧЕМПИОН";
          sbContext.game.messageTimer = 999;
          sbContext.game.messageMaxTimer = 999;
          for (const c of sbContext.crowd) c.excited = 3;
        } else {
          sbContext.game.round++;
          sbContext.startRound();
        }
      }
    }

    const allow = sbContext.game.state === "fighting";

    if (sbContext.game.mode === "pve" && sbContext.p2.isAI && allow) {
      sbContext.p2.aiTimer -= dt;
      if (sbContext.p2.aiTimer <= 0) {
        sbContext.p2.aiTimer = 0.1 + Math.random() * 0.15;
        sbContext.updateAI(sbContext.p2, sbContext.p1);
      }
    }

    sbContext.p1.update(dt, sbContext.p2, allow);
    sbContext.p2.update(dt, sbContext.p1, allow);

    // Коллизия — фикс перепрыгивания
    const dy = Math.abs(sbContext.p1.y - sbContext.p2.y);
    if (
      !sbContext.p1.carried &&
      !sbContext.p2.carried &&
      Math.abs(sbContext.p1.x - sbContext.p2.x) < 60 &&
      dy < 70 &&
      sbContext.p1.dashTimer <= 0 &&
      sbContext.p2.dashTimer <= 0
    ) {
      const mid = (sbContext.p1.x + sbContext.p2.x) / 2;
      if (sbContext.p1.x < sbContext.p2.x) {
        sbContext.p1.x = mid - 30;
        sbContext.p2.x = mid + 30;
      } else {
        sbContext.p1.x = mid + 30;
        sbContext.p2.x = mid - 30;
      }
      sbContext.p1.clampX();
      sbContext.p2.clampX();
    }

    sbContext.updateProjectiles(dt);
    sbContext.updateDrones(dt);
    sbContext.updateBears(dt);
    sbContext.updateBombs(dt);
    sbContext.updateEagles(dt);
    sbContext.updateParticles(dt);
    sbContext.updateCamera(dt);

    for (const f of [sbContext.p1, sbContext.p2]) {
      for (let i = f.dashTrail.length - 1; i >= 0; i--) {
        f.dashTrail[i].life -= dt;
        if (f.dashTrail[i].life <= 0) f.dashTrail.splice(i, 1);
      }
    }

    if (sbContext.game.messageTimer > 0) sbContext.game.messageTimer -= dt;
    if (sbContext.screenShake.timer > 0) sbContext.screenShake.timer -= dt;
    if (sbContext.screenFlash > 0) sbContext.screenFlash -= dt;

    for (const c of sbContext.crowd) {
      c.excited = Math.max(0, c.excited - dt * 1.5);
      if (!c.alive) c.deathTimer -= dt;
    }
  };

  sbContext.loop_base = function (now) {
    requestAnimationFrame(sbContext.loop);
    if (!sbContext.lastTime) sbContext.lastTime = now;
    let dt = (now - sbContext.lastTime) / 1000;
    sbContext.lastTime = now;
    if (dt > 0.1) dt = 0.1;
    sbContext.updateGame(dt);
    sbContext.render();
  };

  sbContext.startMatch_arena = function () {
    sbContext.startMatch_base();
    if (sbContext.game.mode === "practice") {
      sbContext.p2.isAI = false;
      sbContext.p2.trainingDummy = true;
      sbContext.p2.trainingBlock = false;
      sbContext.p2.name = "МАНЕКЕН";
      sbContext.p2.colors = {
        shirt: "#777",
        shirtDark: "#444",
        shirtLight: "#aaa",
        shorts: "#555",
        shortsDark: "#333",
        skin: "#b8a58f",
        skinDark: "#877764",
        hair: "#333",
        shoes: "#222",
        shoesDark: "#111",
        belt: "#555",
      };
      sbContext.p1.hp = 100;
      sbContext.p1.maxHp = 100;
    }
  };

  sbContext.startRound_arena = function () {
    sbContext.startRound_base();
    if (sbContext.game.mode === "practice" && sbContext.p2) {
      sbContext.p2.trainingDummy = true;
      sbContext.p2.trainingBlock = false;
      sbContext.practiceDummy2.x = 2550;
      sbContext.practiceDummy2.y = sbContext.GROUND_Y;
      sbContext.practiceDummy2.trainingBlock = true;
      sbContext.practiceDummy2.blocking = true;
      sbContext.practiceDummy2.state = "block";
    }
  };

  sbContext.updateGame_arena = function (dt) {
    sbContext.updateGame_base(dt);
    if (sbContext.game.state === "fighting") {
      if (sbContext.game.mode === "practice")
        sbContext.practiceDummy2.animTime += dt;
      sbContext.sbUpdatePickups(dt);
      sbContext.sbUpdatePistol(dt);
      sbContext.sbUpdateRockets(dt);
      sbContext.sbUpdateBoomerangs(dt);
      sbContext.sbUpdateTombs(dt);
    }
  };

  sbContext.startRound_arena2 = function () {
    sbContext.startRound_arena();
    sbContext.arenaPickupState.item = null;
    sbContext.arenaPickupState.spawnTimer = 6;
    sbContext.arenaPickupState.respawnLock = 0;
    sbContext.pistolShots.length = 0;
    sbContext.tombstones.length = 0;
    sbContext.miniZombies.length = 0;
    sbContext.ultRockets.length = 0;
    sbContext.shieldBoomerangs.length = 0;
  };

  sbContext.updateGame_interface = function (dt) {
    if (sbContext.game.state === "paused") return;
    sbContext.updateGame_arena(dt);
    if (
      sbContext.game.mode === "practice" &&
      sbContext.game.state === "fighting"
    ) {
      for (const d of sbContext.practiceDummies.slice(1)) {
        d.update(dt, sbContext.p1, false);
      }
    }
  };

  sbContext.sbConfigureDummy_interface = function (d) {
    d.trainingDummy = true;
    d.trainingBlock = false;
    d.isAI = false;
    d.hp = 200;
    d.maxHp = 200;
    d.name = "МАНЕКЕН";
    d.charType = "dummy";
    d.isUkraine = false;
    d.isAmerica = false;
    d.isChina = false;
    d.isJapan = false;
    d.isAfghanistan = false;
    d.state = "idle";
    d.blocking = false;
    d.carried = false;
    d.colors = {
      shirt: "#777",
      shirtDark: "#444",
      shirtLight: "#aaa",
      shorts: "#555",
      shortsDark: "#333",
      skin: "#b8a58f",
      skinDark: "#877764",
      hair: "#333",
      shoes: "#222",
      shoesDark: "#111",
      belt: "#555",
    };
    return d;
  };

  sbContext.startMatch_interface = function () {
    sbContext.startMatch_arena();
    if (sbContext.game.mode === "practice") {
      sbContext.sbConfigureDummy(sbContext.p2);
      sbContext.practiceDummies.length = 0;
      sbContext.practiceDummies.push(sbContext.p2);
    }
  };

  sbContext.startRound_interface = function () {
    sbContext.startRound_arena2();
    if (sbContext.game.mode === "practice") {
      sbContext.sbConfigureDummy(sbContext.p2);
      sbContext.practiceDummies.length = 0;
      sbContext.practiceDummies.push(sbContext.p2);
    }
  };
}
