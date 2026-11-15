// src/engine/effects.js
import { playSound } from "./audio.js";

export const particles = [];
export const lightningEffects = [];
export const explosionRings = [];
export const zombieWaves = [];
export const crowd = [];

export const screenShake = { intensity: 0, timer: 0, duration: 0.2 };
export let screenFlash = 0;
export let screenFlashColor = "rgba(255,255,255,1)";

export function setScreenFlash(value) {
  screenFlash = Math.max(0, value);
}

export function doShake(i, d) {
  const intensity = Math.min(12, Math.max(0.6, i * 0.42));
  // Repeated projectiles must not keep restarting a full-strength earthquake.
  if (screenShake.timer > 0 && intensity < screenShake.intensity * 0.75) return;
  const remaining =
    screenShake.timer > 0
      ? (screenShake.intensity * screenShake.timer) / screenShake.duration
      : 0;
  screenShake.intensity = Math.max(remaining, intensity);
  screenShake.timer = Math.min(0.32, d * 0.75);
  screenShake.duration = screenShake.timer;
}

export function flash(c) {
  screenFlash = 0.3;
  screenFlashColor = c;
}

export function updateScreenFlash(dt) {
  if (screenFlash > 0) screenFlash -= dt;
}

export function spawnHitSparks(x, y, color) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 200 + Math.random() * 300;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.4,
      maxLife: 0.4,
      color,
      size: 4 + Math.random() * 4,
    });
  }
}

export function spawnKetchup(x, y, dir, amount) {
  for (let i = 0; i < amount; i++) {
    const a =
      (dir > 0 ? -Math.PI * 0.3 : -Math.PI * 0.7) + (Math.random() - 0.5) * 0.9;
    const speed = 150 + Math.random() * 450;
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 30,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 200 - Math.random() * 150,
      life: 1.4 + Math.random() * 0.6,
      maxLife: 2.0,
      color: ["#cc0000", "#8a0000", "#ff2222", "#d50000", "#a80000"][
        Math.floor(Math.random() * 5)
      ],
      size: 3 + Math.random() * 6,
      isKetchup: true,
      gravity: 1600,
    });
  }
}

export function spawnDust(x, y, n) {
  for (let i = 0; i < n; i++)
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y - 5,
      vx: (Math.random() - 0.5) * 200,
      vy: -Math.random() * 120,
      life: 0.5,
      maxLife: 0.5,
      color: "#8a7a5a",
      size: 6 + Math.random() * 5,
    });
}

export function spawnBlood(x, y) {
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 100 + Math.random() * 350;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 150,
      life: 0.9,
      maxLife: 0.9,
      color: ["#cc0000", "#8a0000", "#ff2222", "#aa0000"][
        Math.floor(Math.random() * 4)
      ],
      size: 3 + Math.random() * 5,
    });
  }
}

export function spawnMuzzleFlash(x, y, dir) {
  for (let i = 0; i < 10; i++) {
    const a =
      dir > 0
        ? (Math.random() - 0.5) * 0.7
        : Math.PI + (Math.random() - 0.5) * 0.7;
    const s = 300 + Math.random() * 300;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s + (Math.random() - 0.5) * 100,
      life: 0.15,
      maxLife: 0.15,
      color: ["#ffffaa", "#ffcc00", "#ff8800", "#ffffff"][
        Math.floor(Math.random() * 4)
      ],
      size: 3 + Math.random() * 4,
    });
  }
}

export function spawnExplosion(x, y) {
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2,
      s = 100 + Math.random() * 500;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.7,
      maxLife: 0.7,
      color: ["#ff8800", "#ffcc00", "#ff4400", "#ffff00", "#ff2200"][
        Math.floor(Math.random() * 5)
      ],
      size: 5 + Math.random() * 8,
    });
  }
  doShake(15, 0.25);
}

export function spawnBigExplosion(x, y) {
  explosionRings.push({
    x,
    y,
    r: 20,
    maxR: 700,
    life: 0.8,
    maxLife: 0.8,
    color: "rgba(255,200,50,",
  });
  explosionRings.push({
    x,
    y,
    r: 10,
    maxR: 400,
    life: 0.5,
    maxLife: 0.5,
    color: "rgba(255,100,0,",
  });
  explosionRings.push({
    x,
    y,
    r: 5,
    maxR: 200,
    life: 0.3,
    maxLife: 0.3,
    color: "rgba(255,255,200,",
  });
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 200 + Math.random() * 800;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 200 - Math.random() * 300,
      life: 1.0 + Math.random() * 0.8,
      maxLife: 1.8,
      color: ["#ff2200", "#ff8800", "#ffcc00", "#ffffff", "#ff4400"][
        Math.floor(Math.random() * 5)
      ],
      size: 6 + Math.random() * 12,
    });
  }
  for (let i = 0; i < 25; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 50 + Math.random() * 250;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 100,
      life: 1.5 + Math.random() * 0.5,
      maxLife: 2.0,
      color: ["#444", "#666", "#333", "#555"][Math.floor(Math.random() * 4)],
      size: 10 + Math.random() * 18,
      gravity: 200,
    });
  }
  doShake(34, 0.55);
  flash("rgba(255,180,0,0.8)");
}

export function spawnLightning(x, y) {
  lightningEffects.push({ x, y, life: 0.6, maxLife: 0.6 });
  for (let i = 0; i < 35; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 200 + Math.random() * 400;
    particles.push({
      x,
      y: y - 100,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 200,
      life: 0.8,
      maxLife: 0.8,
      color: ["#ffffff", "#ffff88", "#88ccff", "#aaddff"][
        Math.floor(Math.random() * 4)
      ],
      size: 3 + Math.random() * 6,
    });
  }
  doShake(80, 1.2);
  flash("rgba(220,240,255,0.85)");
  playSound(60, 0.5, "sawtooth", 0.2);
  playSound(2200, 0.15, "square", 0.1);
}

export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.gravity || 600) * dt;
    p.vx *= 0.95;
    p.vy *= 0.98;
  }
  for (let i = lightningEffects.length - 1; i >= 0; i--) {
    lightningEffects[i].life -= dt;
    if (lightningEffects[i].life <= 0) lightningEffects.splice(i, 1);
  }
  for (let i = explosionRings.length - 1; i >= 0; i--) {
    const r = explosionRings[i];
    r.life -= dt;
    r.r += (r.maxR - r.r) * dt * 8;
    if (r.life <= 0) explosionRings.splice(i, 1);
  }
  for (let i = zombieWaves.length - 1; i >= 0; i--) {
    const w = zombieWaves[i];
    w.life -= dt;
    w.r += (w.maxR - w.r) * dt * 10;
    if (w.life <= 0) zombieWaves.splice(i, 1);
  }
}

export function initCrowd(ARENA_LEFT, ARENA_RIGHT, GROUND_Y) {
  const arenaW = ARENA_RIGHT - ARENA_LEFT;
  const count = 60;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < count; i++) {
      const x =
        ARENA_LEFT +
        60 +
        (i * (arenaW - 120)) / (count - 1) +
        (Math.random() - 0.5) * 20;
      const y = GROUND_Y - 340 + row * 62;
      crowd.push({
        x,
        y,
        row,
        phase: Math.random() * Math.PI * 2,
        hue: Math.floor(Math.random() * 360),
        size: 11 + row * 3,
        excited: 0,
        alive: true,
        deathTimer: 0,
        fallX: 0,
        fallY: 0,
        deathRotation: 0,
      });
    }
  }
}

export function killRandomSpectator() {
  const alive = crowd.filter((c) => c.alive);
  if (!alive.length) return;
  const s = alive[Math.floor(Math.random() * alive.length)];
  s.alive = false;
  s.deathTimer = 2.5;
  s.fallX = s.x + (Math.random() - 0.5) * 40;
  s.fallY = s.y + 50 + Math.random() * 30;
  s.deathRotation = (Math.random() - 0.5) * 1.2;
  spawnBlood(s.x, s.y);
  playSound(300 + Math.random() * 200, 0.15, "sawtooth", 0.08);
}
