const combatCollections = [
  "projectiles",
  "drones",
  "bears",
  "bombs",
  "eagles",
  "pistolShots",
  "tombstones",
  "miniZombies",
  "ultRockets",
  "shieldBoomerangs",
  "cnNoodle",
  "cnFireworks",
  "cnLanterns",
  "cnFireCones",
  "cnTails",
  "cnRoars",
  "japanGhostCopies",
  "afghanC4s",
  "afghanBullets",
  "afghanNets",
  "afghanGrenades",
  "afghanPlanes",
];

export function startRound(g) {
  g.startRound_interface();
  for (const name of [
    ...combatCollections,
    "japanCuts",
    "japanSmoke",
    "afghanCloaks",
  ])
    g[name].length = 0;
  if (g.game.mode !== "practice") g.practiceDummies.length = 0;
  g.arenaPickupState.phase = 0;
  g.screenShake.timer = 0;
  g.screenFlash = 0;
  g.hitStopTimer = 0;
  g._lastMeleeAttacker = null;
  g._jpCurrentFighter = null;
  for (const key of Object.keys(g.keys)) delete g.keys[key];
}

export function endRound(g, winner) {
  if (g.game.state !== "fighting") return;
  g.endRound_base(winner);
  for (const name of combatCollections) g[name].length = 0;
  for (const fighter of [g.p1, g.p2]) {
    fighter.carried = false;
    fighter.aiKeys = {};
  }
}

export function updateGame(g, dt) {
  if (!["roundStart", "fighting", "roundEnd"].includes(g.game.state)) return;
  // Freeze all combat systems together, including character-specific projectiles.
  if (g.hitStopTimer > 0) {
    g.updateHitStop(dt);
    return;
  }
  g.updateGame_china(dt);
}
