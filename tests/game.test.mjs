import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../src/engine/create-game.js";
import { ROSTER } from "../src/characters/roster.js";
import {
  ABILITIES,
  abilityCooldown,
  skillDown,
  passiveInfo,
} from "../src/characters/ability-kit.js";

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
  g.game.draftEnabled = false;
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
      "play_draft",
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

test("C4 persists, caps landed charges per owner and detonates only owned bombs", () => {
  begin("afghanistan", "afghanistan");
  g.p1.x = 600;
  g.p2.x = 650;
  const bomb = (owner, x) => ({
    owner,
    x,
    y: g.GROUND_Y,
    landed: true,
    vx: 0,
    vy: 0,
    timer: 0,
  });
  const oldest = bomb(g.p1, 620),
    foreign = bomb(g.p2, 620);
  g.afghanC4s.push(
    oldest,
    ...Array.from({ length: 5 }, () => bomb(g.p1, 620)),
    foreign,
  );
  g.updateAfghanProjectiles(10);
  assert.equal(g.afghanC4s.length, 6);
  assert.ok(!g.afghanC4s.includes(oldest));
  const ownHP = g.p1.hp,
    enemyHP = g.p2.hp;
  g.keys.KeyQ = true;
  g.updateAfghanProjectiles(0);
  assert.deepEqual(g.afghanC4s, [foreign]);
  assert.equal(g.p1.hp, ownHP);
  assert.equal(g.p2.hp, enemyHP - 75);
  assert.equal(g.p1.blastPushTimer, 0.3);
  assert.equal(g.p2.blastPushVelocity, 600);
  g.keys.Numpad7 = true;
  g.updateAfghanProjectiles(0);
  assert.equal(g.afghanC4s.length, 0);
  assert.equal(g.p2.hp, enemyHP - 75);
  begin("afghanistan", "russia");
  assert.equal(g.p1.blastPushTimer, 0);
});

test("Afghan rifle fires exactly five rounds of five damage and C4 has a five second cooldown", () => {
  begin("afghanistan", "russia");
  g.keys.KeyX = true;
  g.p1.update(0.01, g.p2, true);
  g.keys.KeyX = false;
  for (let i = 0; i < 30; i++) g.p1.update(0.05, g.p2, true);
  assert.equal(g.afghanBullets.length, 5);
  assert.ok(g.afghanBullets.every((b) => b.damage === 5));
  assert.equal(g.p1.afghanRifleShots, 0);
  g.keys.KeyZ = true;
  g.p1.update(0.1, g.p2, true);
  g.keys.KeyZ = false;
  g.p1.update(0.01, g.p2, true);
  assert.equal(g.afghanC4s.length, 1);
  assert.equal(g.p1.afghanC4Cd, 5);
});

test("Russia balalaika has a half second windup, fifteen damage and unchanged cooldown", () => {
  begin("russia", "america");
  g.p1.x = 600;
  g.p2.x = 685;
  const hp = g.p2.hp;
  g.keys.KeyC = true;
  g.p1.update(0.01, g.p2, true);
  g.keys.KeyC = false;
  assert.equal(g.p1.skillCd.uppercut, 6);
  for (let i = 0; i < 47; i++) g.p1.update(0.01, g.p2, true);
  assert.equal(g.p2.hp, hp);
  for (let i = 0; i < 5; i++) g.p1.update(0.01, g.p2, true);
  assert.equal(g.p2.hp, hp - 15);
  assert.equal(g.p2.onGround, true);
});

test("American shield rebounds on first impact and cannot hit repeatedly", () => {
  begin("america", "russia");
  g.triggerUlt(g.p1, g.p2);
  g.p1.x = 600;
  g.p2.x = 750;
  const hp = g.p2.hp;
  g.p1.castBurger();
  const shield = g.shieldBoomerangs[0];
  for (let i = 0; i < 30 && !shield.hit; i++) g.sbUpdateBoomerangs(0.01);
  assert.equal(shield.hit, true);
  assert.ok(shield.vx < 0);
  assert.ok(shield.x < g.p2.x);
  assert.equal(g.p2.hp, hp - 12);
  for (let i = 0; i < 200; i++) g.sbUpdateBoomerangs(0.01);
  assert.equal(g.shieldBoomerangs.length, 0);
  assert.equal(g.p2.hp, hp - 12);
  begin("america", "russia");
  g.p1.castBurger();
  assert.equal(g.p1.burgerEatTimer, 1.2);
});

test("dragon captures for ten, explodes for fifteen, releases and resets safely on either side", () => {
  for (const side of [1, 2]) {
    begin(side === 1 ? "china" : "america", side === 2 ? "china" : "america");
    const f = side === 1 ? g.p1 : g.p2,
      enemy = side === 1 ? g.p2 : g.p1;
    f.x = 600;
    f.facing = 1;
    enemy.x = 730;
    g.triggerUlt(f, enemy);
    const hp = enemy.hp;
    g.keys[side === 1 ? "KeyC" : "Numpad3"] = true;
    f.update(0.01, enemy, true);
    g.keys[side === 1 ? "KeyC" : "Numpad3"] = false;
    assert.equal(f.roarCd, 10);
    f.update(0.01, enemy, true);
    assert.equal(enemy.hp, hp - 10);
    assert.equal(enemy.carried, true);
    for (let i = 0; i < 60; i++) f.update(0.01, enemy, true);
    assert.equal(enemy.hp, hp - 25);
    assert.equal(enemy.carried, false);
    assert.equal(f.dragonRush, 0);
    assert.ok(enemy.vy >= 200);
    f.dragonVictim = enemy;
    enemy.carried = true;
    f.dragonRush = 1;
    begin("russia", "japan");
    assert.equal(enemy.carried, false);
    assert.equal(enemy.hitstun, 0);
  }
});

test("dragon flight is steerable and releases its victim when interrupted", () => {
  begin("china", "america");
  g.triggerUlt(g.p1, g.p2);
  g.p1.x = 600;
  g.p2.x = 730;
  g.p1.facing = 1;
  g.p1.cnRoar(g.p2);
  g.p1.update(0.01, g.p2, true);
  assert.equal(g.p2.carried, true);
  g.keys.KeyA = true;
  g.keys.KeyW = true;
  const x = g.p1.x,
    y = g.p1.y;
  g.p1.update(0.05, g.p2, true);
  assert.ok(g.p1.x < x);
  assert.ok(g.p1.y < y);
  g.p1.hitstun = 0.5;
  g.p1.update(0.01, g.p2, true);
  assert.equal(g.p2.carried, false);
  assert.equal(g.p1.dragonRush, 0);
});

test("screen shake is weaker, bounded and forgets an expired large impact", () => {
  g.screenShake.timer = 0;
  g.doShake(100, 2);
  assert.equal(g.screenShake.intensity, 12);
  assert.equal(g.screenShake.duration, 0.32);
  const timer = g.screenShake.timer;
  g.doShake(2, 0.1);
  assert.equal(g.screenShake.timer, timer);
  g.screenShake.timer = 0;
  g.doShake(6, 0.1);
  assert.equal(g.screenShake.intensity, 2.52);
  assert.ok(g.screenShake.duration < 0.1);
});

test("draft alternates six globally unique picks, chooses models last and resets normal modes", () => {
  begin("russia", "america");
  g.beginDraft();
  for (let turn = 0; turn < 6; turn++) {
    assert.equal(g.draft.turn, turn);
    assert.equal(g.draft.picks[turn % 2].length, Math.floor(turn / 2));
    assert.equal(new Set(g.draft.offers).size, 3);
    assert.ok(g.draft.offers.every((id) => !g.draft.picks.flat().includes(id)));
    assert.equal(g.chooseDraftSkill("invalid"), false);
    assert.equal(g.chooseDraftSkill(g.draft.offers[0]), true);
    g.render();
  }
  assert.equal(g.game.state, "draftModel");
  assert.equal(new Set(g.draft.picks.flat()).size, 6);
  g.chooseDraftModel("china");
  g.chooseDraftModel("japan");
  assert.equal(g.game.state, "roundStart");
  assert.equal(g.p1.charType, "china");
  assert.deepEqual(g.p1.draftLoadout, g.draft.picks[0]);
  const kit = [...g.p1.draftLoadout];
  g.startRound();
  assert.deepEqual(g.p1.draftLoadout, kit);
  g.goToTitle();
  begin("russia", "america");
  assert.equal(g.p1.draftLoadout, null);
});

test("draft bot receives offers and completes both its skill and model turns", () => {
  begin("russia", "america", "pve");
  g.beginDraft();
  for (let round = 0; round < 3; round++) {
    g.chooseDraftSkill(g.draft.offers[0]);
    const offered = [...g.draft.offers];
    g.updateGame(0.8);
    assert.ok(offered.includes(g.draft.picks[1][round]));
  }
  g.chooseDraftModel("afghanistan");
  g.updateGame(0.8);
  assert.equal(g.game.state, "roundStart");
  assert.equal(g.p2.isAI, true);
  assert.equal(new Set([...g.p1.draftLoadout, ...g.p2.draftLoadout]).size, 6);
  g.goToTitle();
});

test("every ordinary ability works in every draft slot on every model and side", () => {
  for (const model of countries)
    for (const ability of ABILITIES)
      for (const slot of [0, 1, 2])
        for (const side of [1, 2]) {
          begin(model, model);
          const f = side === 1 ? g.p1 : g.p2,
            enemy = side === 1 ? g.p2 : g.p1;
          const others = ABILITIES.filter((a) => a.country !== ability.country)
            .slice(0, 2)
            .map((a) => a.id);
          f.draftLoadout = [...others];
          f.draftLoadout.splice(slot, 0, ability.id);
          f.x = 1500;
          enemy.x = 1800;
          const key =
            side === 1
              ? ["KeyZ", "KeyX", "KeyC"][slot]
              : ["Numpad1", "Numpad2", "Numpad3"][slot];
          g.keys[key] = true;
          assert.equal(skillDown(f, ability.country, ability.index), true);
          f.update(0.016, enemy, true);
          g.keys[key] = false;
          f.update(0.016, enemy, true);
          const activated =
            abilityCooldown(f, ability) > 0 ||
            (ability.key === "noodle" && f.noodleCharges === 5) ||
            (ability.key === "astral" && f.japanAstralTimer > 0) ||
            (ability.key === "parry" &&
              (f.japanParryPrep > 0 || f.japanParryStance > 0));
          assert.ok(activated, `${model} P${side} ${ability.id} slot${slot}`);
          g.render();
        }
});

test("draft borrowed rifle, astral, parry and C4 preserve their ongoing effects", () => {
  begin("america", "russia");
  g.p1.draftLoadout = ["afghanistan.rifle", "japan.astral", "afghanistan.c4"];
  g.keys.KeyZ = true;
  g.p1.update(0.01, g.p2, true);
  g.keys.KeyZ = false;
  for (let i = 0; i < 50; i++) g.p1.update(0.016, g.p2, true);
  assert.equal(g.afghanBullets.length, 5);
  g.keys.KeyX = true;
  g.p1.update(0.01, g.p2, true);
  g.keys.KeyX = false;
  const hp = g.p1.hp;
  g.p1.takeDamage(20, 1);
  assert.equal(g.p1.hp, hp);
  // Cancel the borrowed astral using its assigned slot, then charge C4 in slot C.
  g.p1.update(0.01, g.p2, true);
  g.keys.KeyX = true;
  g.p1.update(0.01, g.p2, true);
  g.keys.KeyX = false;
  assert.equal(g.p1.japanAstralTimer, 0);
  g.keys.KeyC = true;
  g.p1.update(0.1, g.p2, true);
  g.keys.KeyC = false;
  g.p1.update(0.01, g.p2, true);
  assert.equal(g.afghanC4s.length, 1);
  begin("america", "russia");
  g.p1.draftLoadout = ["japan.parry", "america.flag", "china.firework"];
  g.keys.KeyZ = true;
  g.p1.update(0.01, g.p2, true);
  g.keys.KeyZ = false;
  for (let i = 0; i < 55; i++) g.p1.update(0.01, g.p2, true);
  assert.ok(g.p1.japanParryStance > 0);
  g.p2.x = g.p1.x + 50;
  g.p2.facing = -1;
  const before = g.p1.hp;
  g.p2.startAttack("punch");
  g.p2.updateAttack(0.1, g.p1);
  assert.equal(g.p1.hp, before);
  assert.ok(g.p2.starStunTimer > 0);
});

test("full model ultimate replaces draft controls, icons, passives then restores picks", () => {
  for (const model of countries) {
    begin(model, "america");
    const f = g.p1;
    f.draftLoadout = ABILITIES.filter((a) => a.country !== model)
      .slice(0, 3)
      .map((a) => a.id);
    const before = [...f.draftLoadout];
    f.noodleMode = true;
    g.triggerUlt(f, g.p2);
    assert.equal(f.noodleMode, false);
    for (let i = 0; i < 3; i++) {
      g.keys[["KeyZ", "KeyX", "KeyC"][i]] = true;
      assert.equal(skillDown(f, model, i), true);
      g.keys[["KeyZ", "KeyX", "KeyC"][i]] = false;
    }
    assert.ok(passiveInfo(f) || model === "afghanistan");
    f.ultTimer = 0;
    assert.deepEqual(f.draftLoadout, before);
    g.keys.KeyZ = true;
    const a = ABILITIES.find((a) => a.id === before[0]);
    assert.equal(skillDown(f, a.country, a.index), true);
  }
});

test("HUD hover exposes normal, drafted, ultimate and passive text without changing combat", () => {
  begin("ukraine", "afghanistan");
  g.drawHUD();
  const first = g.hudHitAreas[0];
  g.hudPointer = { x: first.x + 10, y: first.y + 10 };
  drawnText.length = 0;
  g.drawHUD();
  assert.ok(drawnText.includes("Дрон"));
  g.p1.draftLoadout = ["america.burger", "china.lantern", "afghanistan.rifle"];
  drawnText.length = 0;
  g.drawHUD();
  assert.ok(drawnText.includes("Бургер"));
  g.triggerUlt(g.p1, g.p2);
  g.drawHUD();
  const passive = g.hudHitAreas.find((a) => a.info.name === "Аура зомби");
  assert.ok(passive);
  g.hudPointer = { x: passive.x + 5, y: passive.y + 5 };
  drawnText.length = 0;
  g.drawHUD();
  assert.ok(drawnText.includes("Аура зомби"));
  assert.equal(g.game.state, "fighting");
  g.hudPointer = null;
});

test("AI approaches, uses cooldown-ready draft skills, faces the target and reacts after observation", () => {
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    begin("russia", "japan", "pve");
    g.game.difficulty = "hard";
    g.p2.draftLoadout = ["america.burger", "afghanistan.rifle", "japan.parry"];
    g.p1.x = 1500;
    g.p2.x = 2400;
    g.updateAI(g.p2, g.p1);
    assert.equal(g.p2.aiKeys.Numpad2, true);
    assert.equal(g.p2.facing, -1);
    assert.equal(g.p2.aiKeys.ArrowRight, undefined);
    g.p2.afghanRifleCd = 8;
    g.updateAI(g.p2, g.p1);
    assert.equal(g.p2.aiKeys.Numpad2, undefined);
    assert.equal(g.p2.aiKeys.ArrowLeft, true);
    g.p2.x = 1580;
    g.p1.startAttack("chargedPunch");
    g.p2.aiMemory = null;
    g.updateAI(g.p2, g.p1);
    assert.equal(g.p2.aiKeys.Numpad3, undefined);
    g.updateAI(g.p2, g.p1);
    assert.equal(g.p2.aiKeys.Numpad3, true);
  } finally {
    Math.random = random;
  }
});

test("every hard AI can damage a stationary opponent without stat bonuses", () => {
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    for (const country of countries) {
      begin("russia", country, "pve");
      g.game.difficulty = "hard";
      for (
        let frame = 0;
        frame < 1200 && g.p1.hp === 100 && g.game.p2Wins === 0;
        frame++
      )
        g.updateGame(1 / 60);
      assert.ok(
        g.p1.hp < 100 || g.game.p2Wins > 0,
        country + " failed to engage",
      );
      assert.equal(g.p2.maxHp, 100, country + " must not get extra health");
    }
  } finally {
    Math.random = random;
  }
});
