import { GRAVITY, JUMP_VELOCITY } from "../../src/engine/config.js";
export const FLOOR = 760;
export const SPEED = 360;
export const STRIDE = 216;
export const ATTACKS = {
  KeyF: { clip: "jab", contact: 0.34, radius: 24, power: 0.55 },
  KeyG: { clip: "kick", contact: 0.52, radius: 27, power: 0.8 },
  KeyH: { clip: "heavy", contact: 0.52, radius: 31, power: 1 },
};

export function createState() {
  return {
    player: {
      x: 430,
      y: FLOOR,
      vy: 0,
      grounded: true,
      jumpTime: 0,
      jumpFromPose: null,
      landingFromPose: null,
      landingTime: 0,
      facing: 1,
      vx: 0,
      distance: 0,
      idleTime: 0,
      runWeight: 0,
      attack: null,
    },
    dummy: { x: 1170, hits: 0, reaction: 0, flash: 0 },
    keys: new Set(),
    particles: [],
    time: 0,
  };
}
export function press(state, key, rig) {
  if (state.keys.has(key)) return false;
  state.keys.add(key);
  if (key === "KeyW") {
    const p = state.player;
    if (!p.grounded || p.attack) return false;
    p.jumpFromPose = currentPose(state, rig);
    p.grounded = false;
    p.jumpTime = 0;
    p.vy = JUMP_VELOCITY;
    p.landingTime = 0;
    return true;
  }
  const attack = ATTACKS[key];
  if (!attack || state.player.attack) return false;
  state.player.attack = {
    ...attack,
    time: 0,
    duration: rig.clips[attack.clip].duration,
    hit: false,
    fromPose: currentPose(state, rig),
  };
  state.player.vx = 0;
  return true;
}
export function release(state, key) {
  state.keys.delete(key);
}
export function clearInput(state) {
  state.keys.clear();
}

export function sample(rig, clip, time) {
  const data = rig.clips[clip];
  const t = data.loop
    ? (((time / data.duration) % 1) + 1) % 1
    : Math.max(0, Math.min(1, time / data.duration));
  const at = t * (data.frames.length - 1),
    a = Math.floor(at),
    b = Math.min(a + 1, data.frames.length - 1),
    mix = at - a;
  return data.frames[a].map((part, i) =>
    part.map((v, j) => v + (data.frames[b][i][j] - v) * mix),
  );
}
export function currentPose(state, rig) {
  const p = state.player;
  if (p.attack) {
    const target = sample(rig, p.attack.clip, p.attack.time),
      weight = Math.min(1, p.attack.time / 0.07);
    return target.map((part, i) =>
      part.map(
        (v, j) =>
          p.attack.fromPose[i][j] + (v - p.attack.fromPose[i][j]) * weight,
      ),
    );
  }
  if (!p.grounded) {
    const target = sample(
      rig,
      "jump",
      (p.jumpTime / ((-2 * JUMP_VELOCITY) / GRAVITY)) * rig.clips.jump.duration,
    );
    const weight = Math.min(1, p.jumpTime / 0.08);
    return target.map((part, i) =>
      part.map(
        (v, j) => p.jumpFromPose[i][j] + (v - p.jumpFromPose[i][j]) * weight,
      ),
    );
  }
  const idle = sample(rig, "idle", p.idleTime);
  const run = sample(
    rig,
    "run",
    (p.distance / rig.stride) * rig.clips.run.duration,
  );
  const ground = idle.map((part, i) =>
    part.map((v, j) => v + (run[i][j] - v) * p.runWeight),
  );
  if (p.landingTime > 0) {
    const weight = 1 - p.landingTime / 0.1;
    return ground.map((part, i) =>
      part.map(
        (v, j) =>
          p.landingFromPose[i][j] + (v - p.landingFromPose[i][j]) * weight,
      ),
    );
  }
  return ground;
}
export function hitPoint(state, rig, pose = currentPose(state, rig)) {
  const name = state.player.attack?.clip === "kick" ? "near_boot" : "near_fore";
  const index = rig.parts.findIndex((p) => p.name === name),
    part = pose[index];
  return {
    x: state.player.x + part[2] * state.player.facing,
    y: state.player.y + part[3],
  };
}
function overlapsDummy(point, dummy, radius) {
  return (
    Math.hypot(
      (point.x - dummy.x) / (58 + radius),
      (point.y - (FLOOR - 185)) / (110 + radius),
    ) <= 1 ||
    Math.hypot(point.x - dummy.x, point.y - (FLOOR - 295)) < 35 + radius
  );
}
export function update(state, rig, dt) {
  const p = state.player;
  state.time += dt;
  p.idleTime += dt;
  p.landingTime = Math.max(0, p.landingTime - dt);
  if (!p.grounded) {
    p.jumpTime += dt;
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.y >= FLOOR && p.vy > 0) {
      p.landingFromPose = currentPose(state, rig);
      p.landingTime = 0.1;
      p.y = FLOOR;
      p.vy = 0;
      p.grounded = true;
    }
  }
  state.dummy.reaction = Math.max(0, state.dummy.reaction - dt * 2.8);
  state.dummy.flash = Math.max(0, state.dummy.flash - dt);
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 500 * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  if (p.attack) {
    const a = p.attack,
      before = a.time;
    a.time = Math.min(a.duration, a.time + dt);
    const begin = a.duration * (a.contact - 0.055),
      end = a.duration * (a.contact + 0.1);
    if (!a.hit && a.time >= begin && before <= end) {
      const point = hitPoint(state, rig);
      if (overlapsDummy(point, state.dummy, a.radius)) {
        a.hit = true;
        state.dummy.hits++;
        state.dummy.reaction = a.power;
        state.dummy.flash = 0.11;
        for (let i = 0; i < 8; i++)
          state.particles.push({
            x: point.x,
            y: point.y,
            vx: (i % 2 ? 1 : -1) * (65 + i * 19),
            vy: -100 + i * 21,
            life: 0.18 + i * 0.012,
          });
      }
    }
    if (a.time >= a.duration) p.attack = null;
    p.runWeight = Math.max(0, p.runWeight - dt * 10);
    return;
  }
  const direction =
    Number(state.keys.has("KeyD")) - Number(state.keys.has("KeyA"));
  const target = direction * SPEED,
    acceleration = direction ? 2800 : 3600;
  p.vx += Math.max(
    -acceleration * dt,
    Math.min(acceleration * dt, target - p.vx),
  );
  const before = p.x;
  p.x = Math.max(190, Math.min(1410, p.x + p.vx * dt));
  if (before < state.dummy.x) p.x = Math.min(p.x, state.dummy.x - 82);
  else p.x = Math.max(p.x, state.dummy.x + 82);
  const moved = p.x - before;
  if (Math.abs(moved) < 0.0001) p.vx = 0;
  p.distance += Math.abs(moved);
  if (Math.abs(p.vx) > 2) p.facing = Math.sign(p.vx);
  const wanted = Math.min(1, Math.abs(p.vx) / SPEED);
  p.runWeight += Math.max(-dt * 10, Math.min(dt * 10, wanted - p.runWeight));
}
