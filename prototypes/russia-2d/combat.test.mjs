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
  for (const name of ["near_fore", "near_boot", "far_boot", "tail_back"]) {
    const i = rig.parts.findIndex((p) => p.name === name);
    const values = rig.clips.run.frames.map((f) => f[i][2]);
    assert.ok(
      Math.max(...values) - Math.min(...values) > 10,
      name + " must actually move",
    );
  }
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
