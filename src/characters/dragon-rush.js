import { dragonMouth } from "../rendering/chinese-dragon.js";

export function releaseDragonVictim(f, resetting = false) {
  const victim = f.dragonVictim;
  if (victim) {
    victim.carried = false;
    if (!resetting) {
      victim.hitstun = Math.max(victim.hitstun, 0.3);
      victim.vy = 200;
      victim.onGround = false;
      victim.state = victim.hp > 0 ? "hit" : "ko";
    }
  }
  f.dragonVictim = null;
  f.dragonRush = 0;
  f.dragonGrabTime = 0;
}

export function updateDragonRush(g, f, dt, allowInput) {
  if (!(f.dragonRush > 0)) return false;
  if (f.hp <= 0 || f.ultTimer <= 0 || f.hitstun > 0) {
    releaseDragonVictim(f);
    return false;
  }
  f.dragonRush = Math.max(0, f.dragonRush - dt);
  const horizontal = allowInput
    ? Number(f.isDown(f.controls.right)) - Number(f.isDown(f.controls.left))
    : 0;
  const vertical = allowInput
    ? Number(f.isDown(f.controls.block)) - Number(f.isDown(f.controls.jump))
    : 0;
  f.x += (horizontal || f.facing) * 650 * dt;
  if (horizontal) f.facing = horizontal;
  f.y = Math.max(260, Math.min(g.GROUND_Y, f.y + vertical * 420 * dt));
  f.vx = 0;
  f.vy = 0;
  f.onGround = false;
  f.clampX();
  const mouth = dragonMouth(f),
    target = f.dragonTarget;
  if (
    !f.dragonVictim &&
    !f.dragonCaptured &&
    target &&
    target.hp > 0 &&
    !target.carried &&
    Math.hypot(mouth.x - target.x, mouth.y - (target.y - 100)) < 85
  ) {
    target.takeDamage(10, f.facing);
    f.dragonVictim = target;
    f.dragonCaptured = true;
    f.dragonGrabTime = 0.55;
    target.carried = true;
    target.attack = null;
    g.spawnHitSparks(mouth.x, mouth.y, "#ffd565");
  }
  if (f.dragonVictim) {
    const victim = f.dragonVictim;
    victim.x = mouth.x;
    victim.y = mouth.y + 100;
    victim.vx = 0;
    victim.vy = 0;
    victim.carried = true;
    f.dragonGrabTime -= dt;
    if (f.dragonGrabTime <= 0) {
      victim.takeDamage(15, f.facing);
      g.spawnExplosion(mouth.x, mouth.y);
      g.doShake(14, 0.25);
      releaseDragonVictim(f);
      return true;
    }
  }
  if (f.dragonRush <= 0) releaseDragonVictim(f);
  return true;
}
