import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../src/engine/create-game.js";

const gradient = { addColorStop() {} };
const context = new Proxy(
  {},
  {
    get(target, key) {
      if (key in target) return target[key];
      if (key === "measureText") return () => ({ width: 100 });
      if (String(key).startsWith("create")) return () => gradient;
      return () => {};
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  },
);
const listeners = new Map();
const canvas = {
  style: {},
  getContext: () => context,
  addEventListener() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }),
};
globalThis.document = { getElementById: () => canvas };
globalThis.window = {
  addEventListener(type, fn) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(fn);
  },
};
globalThis.innerWidth = 1600;
globalThis.innerHeight = 900;
globalThis.CanvasRenderingContext2D = class {};
globalThis.requestAnimationFrame = () => {};
const g = createGame();
const countries = [
  "ukraine",
  "russia",
  "america",
  "china",
  "japan",
  "afghanistan",
];

function begin(p1, p2, mode = "pvp") {
  g.game.mode = mode;
  g.selections.p1 = p1;
  g.selections.p2 = p2;
  g.startMatch();
  g.game.state = "fighting";
  for (const k of Object.keys(g.keys)) delete g.keys[k];
  g.hitStopTimer = 0;
}
function step(frames = 60) {
  for (let i = 0; i < frames; i++) {
    g.updateGame(1 / 60);
    g.render();
  }
  for (const f of [g.p1, g.p2])
    for (const key of ["x", "y", "vx", "vy", "hp"])
      assert.ok(Number.isFinite(f[key]), `${f.charType}.${key}=${f[key]}`);
}
test("all countries can fight, use skills and ultimates on both sides", () => {
  for (const id of countries)
    for (const side of [1, 2]) {
      begin(side === 1 ? id : "russia", side === 2 ? id : "ukraine");
      const f = side === 1 ? g.p1 : g.p2;
      step(2);
      for (const action of [
        "punch",
        "kick",
        "special",
        "skill1",
        "skill2",
        "skill3",
      ]) {
        const code = Array.isArray(f.controls[action])
          ? f.controls[action][0]
          : f.controls[action];
        g.keys[code] = true;
        step(36);
        g.keys[code] = false;
        step(36);
      }
      g.triggerUlt(f, f === g.p1 ? g.p2 : g.p1);
      step(90);
    }
});
test("menus, descriptions and difficulty selection render for all countries", () => {
  for (const mode of ["pvp", "pve", "practice"])
    for (const id of countries) {
      begin(id, id, mode);
      for (const state of [
        "title",
        "select",
        "controls",
        "paused",
        "matchEnd",
      ]) {
        g.game.state = state;
        g.render();
      }
      g.game.state = "select";
      g.game.infoPanel = { side: "P1", charId: id };
      g.render();
      g.game.infoPanel = null;
    }
});
test("AI runs on each difficulty with every country", () => {
  for (const difficulty of ["easy", "medium", "hard"])
    for (const id of countries) {
      begin("japan", id, "pve");
      g.game.difficulty = difficulty;
      step(180);
      assert.ok(g.p2.aiTimer >= 0);
    }
});
test("practice damage and adding a dummy", () => {
  begin("afghanistan", "china", "practice");
  g.p2.takeDamage(205, 1);
  assert.equal(g.p2.hp, 200);
  g.render();
  const b = g.buttons.practice_add;
  g.handleClick(b.x + 10, b.y + 10);
  assert.equal(g.practiceDummies.length, 2);
  step(15);
});

test("ultimate charges through player input for every country and side", () => {
  for (const id of countries)
    for (const side of [1, 2]) {
      begin(side === 1 ? id : "russia", side === 2 ? id : "ukraine");
      const f = side === 1 ? g.p1 : g.p2;
      const code = Array.isArray(f.controls.ult)
        ? f.controls.ult[0]
        : f.controls.ult;
      g.keys[code] = true;
      step(290);
      g.keys[code] = false;
      assert.ok(f.ultTimer > 0, `${id} P${side} should activate its ultimate`);
    }
});

test("new rounds clear every country projectile and practice state", () => {
  begin("china", "japan", "practice");
  const lists = [
    "cnNoodle",
    "cnFireworks",
    "cnLanterns",
    "cnFireCones",
    "cnTails",
    "cnRoars",
    "japanCuts",
    "japanSmoke",
    "japanGhostCopies",
    "afghanC4s",
    "afghanBullets",
    "afghanNets",
    "afghanGrenades",
    "afghanPlanes",
    "afghanCloaks",
  ];
  for (const name of lists) g[name].push({ life: 10 });
  g.hitStopTimer = 2;
  g.screenFlash = 1;
  begin("afghanistan", "america", "pve");
  for (const name of lists) assert.equal(g[name].length, 0, name);
  assert.equal(g.practiceDummies.length, 0);
  assert.equal(g.hitStopTimer, 0);
  assert.equal(g.screenFlash, 0);
  assert.equal(g.p2.trainingDummy, false);
  assert.equal(g.p2.isAI, true);
  for (const f of [g.p1, g.p2])
    for (const flag of ["isJapan", "isChina", "isUkraine"])
      assert.equal(f[flag], false);
});

test("burn and slow affect non-Chinese targets", () => {
  begin("china", "russia");
  g.p2.burnTimer = 3;
  g.p2.burnInterval = 0;
  g.p2.burnDmg = 2;
  g.p2.burnTicksLeft = 3;
  g.p2.update(1 / 60, g.p1, false);
  assert.equal(g.p2.hp, 98);
  g.p2.slowTimer = 2;
  const before = g.p2.slowTimer;
  g.p2.update(1 / 60, g.p1, false);
  assert.ok(g.p2.slowTimer < before);
});

test("pause and hit stop freeze country-specific projectiles", () => {
  begin("china", "afghanistan");
  const missile = {
    x: 400,
    y: 400,
    vx: 100,
    vy: 0,
    life: 2,
    owner: g.p1,
    target: g.p2,
  };
  g.cnNoodle.push(missile);
  g.game.state = "paused";
  g.updateGame(0.1);
  assert.equal(missile.x, 400);
  g.game.state = "fighting";
  g.hitStopTimer = 0.2;
  g.updateGame(0.1);
  assert.equal(missile.x, 400);
  assert.ok(g.hitStopTimer < 0.2);
  g.startRound();
});

test("selection buttons and info panels work for all countries and difficulties", () => {
  begin("ukraine", "russia", "pve");
  g.game.state = "select";
  g.render();
  const click = (id) => {
    const b = g.buttons[id];
    assert.ok(b, id);
    g.handleClick(b.x + b.w / 2, b.y + b.h / 2);
  };
  const keys = ["u", "r", "a", "c", "j", "f"];
  for (const [i, id] of countries.entries())
    for (const side of ["p1", "p2"]) {
      click(side + keys[i]);
      assert.equal(g.selections[side], id);
    }
  for (const id of countries) {
    click("info_P1_" + id);
    assert.equal(g.game.infoPanel.charId, id);
    const prev = g.selections.p2;
    click("p2f");
    assert.equal(g.game.infoPanel, null);
    assert.equal(g.selections.p2, prev);
  }
  for (const difficulty of ["easy", "medium", "hard"]) {
    click("diff_" + difficulty);
    assert.equal(g.game.difficulty, difficulty);
  }
});

test("holding Enter cannot skip menus and losing focus releases controls", () => {
  begin("japan", "afghanistan");
  g.game.state = "select";
  for (const listener of listeners.get("keydown"))
    listener({ code: "Enter", repeat: true, preventDefault() {} });
  assert.equal(g.game.state, "select");
  g.keys.KeyD = true;
  g.game.state = "fighting";
  for (const listener of listeners.get("blur")) listener();
  assert.equal(g.keys.KeyD, undefined);
  assert.equal(g.game.state, "paused");
});
