// Status effects apply to the target, regardless of the target's country.
export function updateStatusEffects(g, fighter, dt) {
  fighter.burgerEatTimer = Math.max(0, (fighter.burgerEatTimer || 0) - dt);
  if (fighter.trainingDummy || fighter.hp <= 0) return;
  if (fighter.blastPushTimer > 0) {
    const elapsed = Math.min(dt, fighter.blastPushTimer);
    fighter.x += fighter.blastPushVelocity * elapsed;
    fighter.blastPushTimer = Math.max(0, fighter.blastPushTimer - dt);
    fighter.clampX();
  }
  if (fighter.burnTimer > 0) {
    fighter.burnTimer = Math.max(0, fighter.burnTimer - dt);
    fighter.burnInterval -= dt;
    if (fighter.burnInterval <= 0 && fighter.burnTicksLeft > 0) {
      fighter.burnInterval += 1;
      fighter.takeDamage(fighter.burnDmg, -fighter.facing);
      g.spawnHitSparks(fighter.x, fighter.y - 80, "#ff6600");
      if (--fighter.burnTicksLeft <= 0) fighter.burnTimer = 0;
    }
  }
  if (fighter.slowTimer > 0) {
    fighter.slowTimer = Math.max(0, fighter.slowTimer - dt);
    fighter.x -= fighter.vx * 0.5 * dt;
    fighter.clampX();
  }
}
