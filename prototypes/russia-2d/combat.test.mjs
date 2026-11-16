import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createState,
  press,
  release,
  clearInput,
  update,
  sample,
  currentPose,
  SPEED,
  STRIDE,
  FLOOR,
} from "./combat.mjs";
const rig = JSON.parse(
  readFileSync(new URL("./assets/russia-rig.json", import.meta.url), "utf8"),
);
const step = (s, seconds) => {
  for (let t = 0; t < seconds - 1e-8; t += 1 / 120)
    update(s, rig, Math.min(1 / 120, seconds - t));
};

test("evaluated Blender clips loop and animate independent limbs", () => {
  assert.equal(rig.parts.length, 14);
  assert.match(rig.source, /Blender/);
  for (const name of ["idle", "run"]) {
    const clip = rig.clips[name];
    clip.frames[0]
      .flat()
      .forEach((v, i) =>
        assert.ok(Math.abs(v - clip.frames.at(-1).flat()[i]) < 0.01),
      );
  }
  for (const name of ["near_boot", "far_boot", "tail_back"]) {
    const i = rig.parts.findIndex((p) => p.name === name);
    const values = rig.clips.run.frames.map((f) => f[i][2]);
    assert.ok(
      Math.max(...values) - Math.min(...values) >
        (name === "tail_back" ? 2 : 10),
      name + " must actually move",
    );
  }
});

test("hands stay at coat pockets and behind the coat in idle, locomotion and jump", () => {
  for (const name of ["idle", "run", "jump"])
    for (const frame of rig.clips[name].frames) {
      for (const [fore, tail, offset] of [
        ["near_fore", "tail_front", 6],
        ["far_fore", "tail_back", -1],
      ]) {
        const hand = frame[rig.parts.findIndex((p) => p.name === fore)],
          pocket = frame[rig.parts.findIndex((p) => p.name === tail)];
        assert.ok(
          Math.abs(hand[2] - pocket[0] - offset) < 0.1,
          name + " wrist leaves pocket horizontally",
        );
        assert.ok(
          Math.abs(hand[3] - pocket[1] - 27) < 0.1,
          name + " wrist leaves pocket vertically",
        );
        assert.ok(hand[4] < pocket[4], name + " hand must render under coat");
      }
    }
  const idle = rig.clips.idle.frames[0];
  for (const side of ["near", "far"]) {
    const arm = idle[rig.parts.findIndex((p) => p.name === side + "_upper")],
      fore = idle[rig.parts.findIndex((p) => p.name === side + "_fore")];
    assert.ok(
      Math.abs(
        Math.hypot(arm[2] - arm[0], arm[3] - arm[1]) +
          Math.hypot(fore[2] - fore[0], fore[3] - fore[1]) -
          115,
      ) < 0.02,
    );
  }
  const attack = sample(rig, "jab", rig.clips.jab.duration * 0.34);
  assert.ok(
    attack[rig.parts.findIndex((p) => p.name === "near_fore")][4] >
      attack[rig.parts.findIndex((p) => p.name === "torso")][4],
  );
});

test("support knees are straighter and swing feet do not lift to the waist", () => {
  for (let phase = 0; phase < 1; phase += 0.01) {
    const pose = sample(rig, "run", phase * rig.clips.run.duration),
      side = phase < 0.5 ? "near" : "far";
    const a = pose[rig.parts.findIndex((p) => p.name === side + "_thigh")],
      b = pose[rig.parts.findIndex((p) => p.name === side + "_shin")];
    const u = [a[2] - a[0], a[3] - a[1]],
      v = [b[2] - b[0], b[3] - b[1]];
    const angle =
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v),
          ),
        ),
      ) *
        180) /
      Math.PI;
    assert.ok(angle < 45, "support knee too bent: " + angle);
    for (const name of ["near_boot", "far_boot"])
      assert.ok(
        pose[rig.parts.findIndex((p) => p.name === name)][3] > -26,
        "foot lifted too far",
      );
  }
});

test("W jumps once, keeps hands in pockets, lands, and can jump again after release", () => {
  const s = createState();
  assert.equal(press(s, "KeyW", rig), true);
  step(s, 0.2);
  assert.equal(s.player.grounded, false);
  assert.ok(s.player.y < FLOOR - 100);
  assert.equal(press(s, "KeyW", rig), false);
  const pose = currentPose(s, rig);
  assert.ok(pose[rig.parts.findIndex((p) => p.name === "near_fore")][4] < 0);
  step(s, 1.2);
  assert.equal(s.player.grounded, true);
  assert.equal(s.player.y, FLOOR);
  step(s, 0.5);
  assert.equal(s.player.y, FLOOR);
  assert.equal(press(s, "KeyW", rig), false);
  release(s, "KeyW");
  assert.equal(press(s, "KeyW", rig), true);
  press(s, "KeyH", rig);
  step(s, 1.5);
  assert.equal(s.player.grounded, true);
  assert.equal(s.player.y, FLOOR);
});
test("run support soles stay on the floor and fixed in world space", () => {
  for (const [bone, start, end] of [
    ["near_boot", 0, 0.49],
    ["far_boot", 0.5, 0.99],
  ]) {
    const i = rig.parts.findIndex((p) => p.name === bone);
    let planted = null;
    for (let p = start; p <= end; p += 0.01) {
      const part = sample(rig, "run", p * rig.clips.run.duration)[i];
      const world = p * STRIDE + part[2];
      assert.ok(Math.abs(part[3]) < 0.05, "sole left floor: " + bone);
      planted ??= world;
      assert.ok(Math.abs(world - planted) < 0.05, "support foot slid: " + bone);
    }
  }
});
test("run accelerates, stops promptly and phase follows travelled distance", () => {
  const s = createState();
  press(s, "KeyD", rig);
  step(s, 0.5);
  assert.equal(s.player.vx, SPEED);
  assert.ok(s.player.x > 570);
  assert.ok(s.player.distance > 140);
  release(s, "KeyD");
  step(s, 0.15);
  assert.equal(s.player.vx, 0);
  const x = s.player.x;
  step(s, 0.5);
  assert.equal(s.player.x, x);
  press(s, "KeyA", rig);
  step(s, 0.2);
  assert.equal(s.player.facing, -1);
  clearInput(s);
  step(s, 0.15);
  assert.equal(s.player.vx, 0);
});
test("each attack has one contact, misses out of range, cannot repeat while held", () => {
  for (const key of ["KeyF", "KeyG", "KeyH"]) {
    const s = createState();
    s.player.x = 1030;
    assert.equal(press(s, key, rig), true);
    const duration = s.player.attack.duration;
    step(s, duration * 0.12);
    assert.equal(s.dummy.hits, 0, "damage before windup");
    step(s, duration);
    assert.equal(s.dummy.hits, 1, key);
    step(s, 1);
    assert.equal(s.dummy.hits, 1);
    assert.equal(press(s, key, rig), false);
    assert.equal(s.player.attack, null);
    release(s, key);
    s.player.x = 250;
    press(s, key, rig);
    step(s, 2);
    assert.equal(s.dummy.hits, 1, "out-of-range attack hit");
    assert.equal(s.dummy.x, 1170);
  }
});
test("attacks blend from current pose and end in the idle stance", () => {
  const s = createState();
  press(s, "KeyD", rig);
  step(s, 0.3);
  const before = currentPose(s, rig);
  press(s, "KeyF", rig);
  assert.deepEqual(currentPose(s, rig), before);
  release(s, "KeyD");
  step(s, 1);
  assert.equal(s.player.attack, null);
  const p = currentPose(s, rig);
  assert.ok(p.flat().every(Number.isFinite));
  for (const [x, facing] of [
    [190, -1],
    [1410, 1],
  ]) {
    s.player.x = x;
    s.player.facing = facing;
    release(s, "KeyF");
    press(s, "KeyH", rig);
    step(s, 0.5);
    for (const part of currentPose(s, rig))
      for (const local of [part[0], part[2]])
        assert.ok(x + local * facing > 0 && x + local * facing < 1600);
    step(s, 1);
  }
});
