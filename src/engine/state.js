export const projectiles = [];
export const drones = [];
export const bears = [];
export const bombs = [];
export const eagles = [];

export let hitStopTimer = 0;
export function updateHitStop(dt) {
  if (hitStopTimer > 0) hitStopTimer -= dt;
}
export function setHitStop(val) {
  hitStopTimer = val;
}
export const tombstones = [];
export const miniZombies = [];
export const shieldBoomerangs = [];
