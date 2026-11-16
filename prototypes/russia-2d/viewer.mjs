import { drawTrainingDummy } from "../../src/rendering/training-dummy.js";
import {
  FLOOR,
  createState,
  press,
  release,
  clearInput,
  currentPose,
  update,
  hitPoint,
} from "./combat.mjs";
import { drawRig } from "./rig-renderer.mjs";

const canvas = document.getElementById("preview"),
  ctx = canvas.getContext("2d");
const controlled = new Set(["KeyA", "KeyD", "KeyF", "KeyG", "KeyH"]);
try {
  const rig = await fetch(
    new URL("./assets/russia-rig.json", import.meta.url),
  ).then((r) => r.json());
  const texture = new Image();
  texture.src = new URL("./assets/" + rig.texture, import.meta.url).href;
  await texture.decode();
  const state = createState();
  let paused = false,
    last = performance.now(),
    remainder = 0;
  function render() {
    ctx.fillStyle = "#242b32";
    ctx.fillRect(0, 0, 1600, 900);
    const haze = ctx.createLinearGradient(0, 200, 0, FLOOR);
    haze.addColorStop(0, "#242b32");
    haze.addColorStop(1, "#333c44");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 200, 1600, FLOOR - 200);
    ctx.fillStyle = "#2d363e";
    ctx.fillRect(0, FLOOR, 1600, 900 - FLOOR);
    ctx.strokeStyle = "#56626b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR);
    ctx.lineTo(1600, FLOOR);
    ctx.stroke();
    ctx.strokeStyle = "#39444c";
    ctx.lineWidth = 1;
    for (let x = -400; x < 2000; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR);
      ctx.lineTo(800 + (x - 800) * 1.3, 900);
      ctx.stroke();
    }
    for (const x of [state.player.x, state.dummy.x]) {
      ctx.fillStyle = "#10161a55";
      ctx.beginPath();
      ctx.ellipse(x, FLOOR + 4, 52, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const d = state.dummy;
    ctx.save();
    ctx.translate(d.x, FLOOR);
    ctx.rotate(Math.sin(state.time * 27) * d.reaction * 0.045);
    ctx.translate(-d.x, -FLOOR);
    if (d.flash > 0) ctx.filter = "brightness(1.6)";
    drawTrainingDummy(ctx, d.x, FLOOR - 10, 1.7);
    ctx.restore();
    const pose = currentPose(state, rig);
    drawRig(
      ctx,
      texture,
      rig,
      pose,
      state.player.x,
      FLOOR,
      state.player.facing,
    );
    const a = state.player.attack;
    if (
      a &&
      a.time / a.duration > a.contact - 0.035 &&
      a.time / a.duration < a.contact + 0.08
    ) {
      const point = hitPoint(state, rig, pose);
      ctx.save();
      ctx.strokeStyle = "#eee1d38a";
      ctx.lineWidth = a.clip === "heavy" ? 7 : 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(
        point.x - state.player.facing * 30,
        point.y,
        40,
        a.clip === "kick" ? -0.8 : -1.2,
        a.clip === "kick" ? 0.7 : 0.5,
      );
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#e5c6a0";
    for (const p of state.particles) {
      ctx.globalAlpha = Math.min(1, p.life * 5);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#d1d7dc";
    ctx.textAlign = "left";
    ctx.fillText("РОССИЯ", 70, 70);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#b4bfc7";
    ctx.textAlign = "center";
    ctx.fillText(
      "A / D — бег     F — быстрый удар     G — удар ногой     H — сильный удар",
      800,
      850,
    );
  }
  function step(dt) {
    let remaining = Math.min(dt, 5);
    while (remaining > 1e-8) {
      const part = Math.min(1 / 120, remaining);
      update(state, rig, part);
      remaining -= part;
    }
    render();
  }
  window.addEventListener("keydown", (e) => {
    if (!controlled.has(e.code)) return;
    e.preventDefault();
    if (!e.repeat) press(state, e.code, rig);
  });
  window.addEventListener("keyup", (e) => {
    if (controlled.has(e.code)) {
      e.preventDefault();
      release(state, e.code);
    }
  });
  window.addEventListener("blur", () => {
    clearInput(state);
    paused = true;
    state.player.vx = 0;
    state.player.runWeight = 0;
    render();
  });
  window.addEventListener("focus", () => {
    paused = false;
    last = performance.now();
  });
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused) {
      remainder += dt;
      while (remainder >= 1 / 120) {
        update(state, rig, 1 / 120);
        remainder -= 1 / 120;
      }
      render();
    }
    requestAnimationFrame(loop);
  }
  window.russiaPrototype = {
    ready: true,
    state,
    rig,
    texture,
    render,
    step,
    press: (key) => press(state, key, rig),
    release: (key) => release(state, key),
    pause: () => {
      paused = true;
    },
    resume: () => {
      paused = false;
      last = performance.now();
    },
  };
  render();
  requestAnimationFrame(loop);
} catch (error) {
  document.getElementById("error").hidden = false;
  document.getElementById("error").textContent =
    "Не удалось открыть прототип: " + error.message;
  console.error(error);
}
