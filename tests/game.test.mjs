import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../src/engine/create-game.js";
import { ROSTER } from "../src/characters/roster.js";

const gradient = { addColorStop() {} };
const drawnText = [];
const context = new Proxy(
  {},
  {
    get(target, key) {
      if (key in target) return target[key];
      if (key === "measureText") return () => ({ width: 100 });
      if (key === "fillText") return (text) => drawnText.push(String(text));
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
const canvasListeners = new Map();
const canvas = {
  style: {},
  getContext: () => context,
  addEventListener(type, fn) {
    if (!canvasListeners.has(type)) canvasListeners.set(type, []);
    canvasListeners.get(type).push(fn);
  },
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

test("Enter does nothing on the title screen; three buttons still choose their modes", () => {
  g.goToTitle();
  g.game.mode = "practice";
  for (const listener of listeners.get("keydown"))
    listener({ code: "Enter", repeat: false, preventDefault() {} });
  assert.equal(g.game.state, "title");
  assert.equal(g.game.mode, "practice");
  for (const mode of ["pvp", "pve", "practice"]) {
    g.goToTitle();
    g.render();
    assert.deepEqual(Object.keys(g.buttons).sort(), [
      "play_practice",
      "play_pve",
      "play_pvp",
    ]);
    const b = g.buttons["play_" + mode];
    g.handleClick(b.x + b.w / 2, b.y + b.h / 2);
    assert.equal(g.game.mode, mode);
    assert.equal(g.game.state, "select");
  }
});

test("selection scrolls independently as the roster grows and clips hidden hit areas", () => {
  ROSTER.push(
    { ...ROSTER[0], id: "test-extra-1", key: "extra1" },
    { ...ROSTER[1], id: "test-extra-2", key: "extra2" },
  );
  try {
    g.game.mode = "pvp";
    g.game.state = "select";
    g.render();
    for (const fn of canvasListeners.get("wheel"))
      fn({
        clientX: 400,
        clientY: 300,
        deltaY: 300,
        deltaMode: 0,
        preventDefault() {},
      });
    assert.ok(g.selectScroll.p1 > 0);
    assert.equal(g.selectScroll.p2, 0);
    assert.equal(g.buttons.p1u, undefined);
    assert.ok(g.buttons.p1extra2);
  } finally {
    ROSTER.splice(-2);
    g.selectScroll.p1 = 0;
    g.selectScroll.p2 = 0;
  }
});

test("practice has a fixed dummy and starting a match skips the controls screen", () => {
  g.game.mode = "practice";
  g.game.state = "select";
  g.render();
  for (const c of ROSTER) assert.equal(g.buttons["p2" + c.key], undefined);
  const b = g.buttons.start;
  g.handleClick(b.x + b.w / 2, b.y + b.h / 2);
  assert.equal(g.game.state, "roundStart");
  assert.equal(g.p2.trainingDummy, true);
});

test("moving block runs at half speed and stops immediately when direction is released", () => {
  begin("russia", "ukraine");
  g.keys.KeyD = true;
  g.keys.KeyS = true;
  const x = g.p1.x;
  g.p1.update(0.1, g.p2, true);
  assert.equal(g.p1.blocking, true);
  assert.equal(g.p1.vx, g.MOVE_SPEED * 0.5);
  assert.ok(Math.abs(g.p1.x - x - 15) < 0.01);
  g.keys.KeyD = false;
  const stopped = g.p1.x;
  g.p1.update(0.1, g.p2, true);
  assert.equal(g.p1.vx, 0);
  assert.equal(g.p1.x, stopped);
});

test("practice dummies recover from stun, cannot move, and P2 can punch on Num1", () => {
  begin("russia", "afghanistan", "practice");
  const d = g.p2,
    x = d.x;
  d.hitstun = 0.5;
  d.starStunTimer = 0.5;
  g.keys.ArrowRight = true;
  for (let i = 0; i < 60; i++) d.update(1 / 60, g.p1, true);
  assert.equal(d.x, x);
  assert.equal(d.hitstun, 0);
  assert.equal(d.starStunTimer, 0);
  g.keys.Numpad1 = true;
  d.update(1 / 60, g.p1, true);
  assert.equal(d.attack.type, "punch");
  const extra = new g.Fighter(2600, 1, "russia", "манекен", g.P2_CONTROLS);
  g.sbConfigureDummy(extra);
  extra.hitstun = 0.3;
  extra.starStunTimer = 0.3;
  g.practiceDummies.push(extra);
  g.keys.Numpad1 = false;
  step(40);
  assert.equal(extra.hitstun, 0);
  assert.equal(extra.starStunTimer, 0);
});

test("combat HUD uses artwork instead of emoji and exposes actual ultimate passives", () => {
  begin("ukraine", "afghanistan");
  g.triggerUlt(g.p1, g.p2);
  drawnText.length = 0;
  g.drawHUD();
  assert.ok(drawnText.includes("ПАССИВНО"));
  assert.ok(
    drawnText.every((text) => !/[\p{Extended_Pictographic}]/u.test(text)),
  );
});
