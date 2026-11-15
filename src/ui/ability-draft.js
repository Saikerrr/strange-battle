import {
  ABILITIES,
  abilityById,
  abilityCooldown,
} from "../characters/ability-kit.js";
import { ROSTER } from "../characters/roster.js";
import { drawSkillArt } from "./skill-art.js";
import { drawDraftFighter } from "../rendering/draft-equipment.js";

const draftStates = new Set(["draftSetup", "draftPick", "draftModel"]);
export function register(g, images) {
  const fighter = g.drawFighter;
  g.drawFighter = (f) => drawDraftFighter(g, fighter, f);
  const label = (text, x, y, size = 22, color = "#e8dce8") => {
    g.ctx.font = `bold ${size}px Arial`;
    g.ctx.fillStyle = color;
    g.ctx.textAlign = "center";
    g.ctx.textBaseline = "alphabetic";
    g.ctx.fillText(text, x, y);
  };
  const wrap = (text, x, y, width, size = 17) => {
    g.ctx.font = `${size}px Arial`;
    g.ctx.fillStyle = "#d1c7d3";
    g.ctx.textAlign = "left";
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? line + " " + word : word;
      if (line && g.ctx.measureText(next).width > width) {
        g.ctx.fillText(line, x, y);
        y += 25;
        line = word;
      } else line = next;
    }
    g.ctx.fillText(line, x, y);
    return y;
  };
  const hover = (b) =>
    g.draftPointer &&
    g.draftPointer.x >= b.x &&
    g.draftPointer.x <= b.x + b.w &&
    g.draftPointer.y >= b.y &&
    g.draftPointer.y <= b.y + b.h;
  function panel(id, x, y, w, h, title) {
    const b = { x, y, w, h };
    if (id) g.buttons[id] = b;
    const c = g.ctx;
    c.save();
    if (hover(b) && id) {
      c.shadowColor = "#bb8edb";
      c.shadowBlur = 20;
    }
    if (images?.draftCard) c.drawImage(images.draftCard, x, y, w, h);
    else {
      c.fillStyle = "#18131f";
      c.fillRect(x, y, w, h);
      c.strokeStyle = "#9474aa";
      c.strokeRect(x, y, w, h);
    }
    c.restore();
    if (title) label(title, x + w / 2, y + h / 2 + 7, 21);
  }
  function background(title, subtitle) {
    for (const id of Object.keys(g.buttons)) delete g.buttons[id];
    if (images?.draftBackground)
      g.ctx.drawImage(images.draftBackground, 0, 0, g.W, g.H);
    else {
      g.ctx.fillStyle = "#17121e";
      g.ctx.fillRect(0, 0, g.W, g.H);
    }
    label(title, g.W / 2, 82, 42);
    label(subtitle, g.W / 2, 126, 20, "#bba8c7");
    panel("draft_back", 35, 800, 190, 65, "НАЗАД");
  }
  function deal() {
    const d = g.draft,
      used = new Set(d.picks.flat());
    const pool = ABILITIES.filter((a) => !used.has(a.id));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    d.offers = pool.slice(0, 3).map((a) => a.id);
    d.botTimer = 0.7;
  }
  g.beginDraft = () => {
    g.game.draftEnabled = true;
    g.game.infoPanel = null;
    g.draft = {
      turn: 0,
      picks: [[], []],
      models: [null, null],
      modelTurn: 0,
      offers: [],
      botTimer: 0.7,
    };
    deal();
    g.game.state = "draftPick";
  };
  g.chooseDraftSkill = (id) => {
    const d = g.draft;
    if (
      g.game.state !== "draftPick" ||
      !d?.offers.includes(id) ||
      d.picks.flat().includes(id)
    )
      return false;
    d.picks[d.turn % 2].push(id);
    d.turn++;
    if (d.turn === 6) {
      g.game.state = "draftModel";
      d.modelTurn = 0;
      d.botTimer = 0.7;
    } else deal();
    return true;
  };
  g.chooseDraftModel = (id) => {
    const d = g.draft;
    if (g.game.state !== "draftModel" || !ROSTER.some((c) => c.id === id))
      return false;
    d.models[d.modelTurn] = id;
    d.modelTurn++;
    d.botTimer = 0.7;
    if (d.modelTurn === 2) {
      g.selections.p1 = d.models[0];
      g.selections.p2 = d.models[1];
      g.startMatch();
    }
    return true;
  };
  function picked() {
    const d = g.draft;
    for (let side = 0; side < 2; side++) {
      const x = 330 + side * 690;
      label(
        side === 1 && g.game.mode === "pve" ? "P2 · ИИ" : "P" + (side + 1),
        x + 150,
        735,
        18,
      );
      d.picks[side].forEach((id, i) => {
        const a = abilityById(id);
        drawSkillArt(g.ctx, x + i * 115, 752, 48, a.art);
        label(
          side === 0 ? ["Z", "X", "C"][i] : ["NUM1", "NUM2", "NUM3"][i],
          x + i * 115 + 24,
          818,
          14,
        );
      });
    }
  }
  const previews = new Map();
  function preview(country, x, y, scale) {
    let f = previews.get(country.id);
    if (!f) {
      f = new g.Fighter(0, 1, country.id, country.name, g.P1_CONTROLS);
      f.isChina = country.id === "china";
      f.isJapan = country.id === "japan";
      f.isAfghanistan = country.id === "afghanistan";
      f.colors = country.colors;
      f.reset();
      previews.set(country.id, f);
    }
    g.ctx.save();
    g.ctx.translate(x, y);
    g.ctx.scale(scale, scale);
    g.ctx.translate(-f.x, -f.y);
    g.drawFighter(f);
    g.ctx.restore();
  }
  function draw() {
    const d = g.draft;
    if (g.game.state === "draftSetup") {
      background(
        "ABILITY DRAFT",
        "Три навыка из общего пула. Затем модель и её полная ульта.",
      );
      panel("draft_pvp", 360, 240, 400, 270, "ПРОТИВ ДРУГА");
      panel("draft_pve", 840, 240, 400, 270, "ПРОТИВ ИИ");
      label("СЛОЖНОСТЬ ИИ", 800, 600, 19);
      ["easy", "medium", "hard"].forEach((diff, i) => {
        panel(
          "draft_diff_" + diff,
          460 + i * 240,
          630,
          220,
          90,
          ["ЛЕГКО", "СРЕДНЕ", "СЛОЖНО"][i],
        );
        if ((g.game.difficulty || "medium") === diff) {
          g.ctx.strokeStyle = "#bd96d6";
          g.ctx.lineWidth = 3;
          g.ctx.strokeRect(475 + i * 240, 640, 190, 69);
        }
      });
      return;
    }
    const side = g.game.state === "draftPick" ? d.turn % 2 : d.modelTurn;
    const who =
      side === 1 && g.game.mode === "pve" ? "ИИ" : "ИГРОК " + (side + 1);
    if (g.game.state === "draftPick") {
      background(
        "ABILITY DRAFT",
        `${who} · НАВЫК ${Math.floor(d.turn / 2) + 1} / 3${side === 1 && g.game.mode === "pve" ? " · выбирает…" : ""}`,
      );
      d.offers.forEach((id, i) => {
        const a = abilityById(id),
          x = 180 + i * 440,
          y = 185,
          w = 360,
          h = 500;
        panel("draft_skill_" + id, x, y, w, h);
        drawSkillArt(g.ctx, x + 132, y + 68, 96, a.art);
        label(a.name.toUpperCase(), x + w / 2, y + 207, 24);
        wrap(a.text, x + 44, y + 251, w - 88, 17);
        label(
          ROSTER.find((c) => c.id === a.country).name,
          x + w / 2,
          y + h - 65,
          15,
          "#af96bd",
        );
        label("ВЫБРАТЬ", x + w / 2, y + h - 35, 17);
      });
      picked();
    } else {
      background(
        "ВЫБОР МОДЕЛИ",
        `${who} · внешность, обычные удары и полная ульта выбранного бойца`,
      );
      ROSTER.forEach((country, i) => {
        const x = 75 + i * 245,
          y = 235,
          w = 225,
          h = 425;
        panel("draft_model_" + country.id, x, y, w, h);
        preview(country, x + w / 2, y + 310, 0.9);
        label(country.name, x + w / 2, y + 55, 18, country.accent);
        label("РОДНАЯ УЛЬТА", x + w / 2, y + h - 48, 13, "#bca7c9");
      });
      picked();
    }
  }
  const start = g.startMatch;
  g.startMatch = () => {
    const active =
      g.game.draftEnabled &&
      g.draft?.models.every(Boolean) &&
      g.draft?.picks.every((p) => p.length === 3);
    [g.p1, g.p2].forEach((f, i) => {
      f.draftLoadout = active ? [...g.draft.picks[i]] : null;
    });
    start();
  };
  const toSelect = g.goToSelect,
    toTitle = g.goToTitle,
    trigger = g.triggerUlt;
  g.goToSelect = () => {
    if (g.game.draftEnabled) g.beginDraft();
    else toSelect();
  };
  g.goToTitle = () => {
    g.game.draftEnabled = false;
    g.draft = null;
    g.p1.draftLoadout = g.p2.draftLoadout = null;
    toTitle();
  };
  g.triggerUlt = (f, opponent) => {
    if (f.draftLoadout && !f.ultUsed) {
      f.japanAstralTimer = 0;
      f.japanParryStance = 0;
      f.japanParryPrep = 0;
      f.japanStanceTimer = 0;
      f.afghanRifleActive = 0;
      f.afghanC4Charging = false;
      f.noodleMode = false;
    }
    trigger(f, opponent);
  };
  const skills = g.getPlayerSkills;
  g.getPlayerSkills = (f) =>
    f.draftLoadout && f.ultTimer <= 0
      ? f.draftLoadout.map((id, i) => ({
          key: f === g.p1 ? ["Z", "X", "C"][i] : ["N1", "N2", "N3"][i],
          cd: abilityCooldown(f, abilityById(id)),
        }))
      : skills(f);
  const update = g.updateGame;
  g.updateGame = (dt) => {
    if (!draftStates.has(g.game.state)) {
      update(dt);
      return;
    }
    if (
      g.game.mode === "pve" &&
      g.draft &&
      ((g.game.state === "draftPick" && g.draft.turn % 2 === 1) ||
        (g.game.state === "draftModel" && g.draft.modelTurn === 1))
    ) {
      g.draft.botTimer -= dt;
      if (g.draft.botTimer <= 0) {
        if (g.game.state === "draftPick")
          g.chooseDraftSkill(g.draft.offers[Math.floor(Math.random() * 3)]);
        else
          g.chooseDraftModel(
            ROSTER[Math.floor(Math.random() * ROSTER.length)].id,
          );
      }
    }
  };
  const render = g.render,
    title = g.drawTitleScreen,
    click = g.handleClick,
    enter = g.handleEnter;
  g.drawTitleScreen = () => {
    title();
    panel("play_draft", 605, 758, 390, 78, "ABILITY DRAFT");
    if (hover(g.buttons.play_draft)) g.canvas.style.cursor = "pointer";
  };
  g.render = () => {
    if (draftStates.has(g.game.state)) {
      draw();
      g.canvas.style.cursor = Object.values(g.buttons).some(hover)
        ? "pointer"
        : "default";
    } else render();
  };
  g.handleEnter = () => {
    if (!draftStates.has(g.game.state)) enter();
  };
  g.handleClick = (x, y) => {
    if (g.game.state === "title" && g.hitBtn("play_draft", x, y)) {
      g.game.draftEnabled = true;
      g.game.state = "draftSetup";
      return;
    }
    if (!draftStates.has(g.game.state)) {
      if (g.game.state === "title") g.game.draftEnabled = false;
      click(x, y);
      return;
    }
    if (g.hitBtn("draft_back", x, y)) {
      g.goToTitle();
      return;
    }
    if (g.game.state === "draftSetup") {
      for (const diff of ["easy", "medium", "hard"])
        if (g.hitBtn("draft_diff_" + diff, x, y)) g.game.difficulty = diff;
      for (const mode of ["pvp", "pve"])
        if (g.hitBtn("draft_" + mode, x, y)) {
          g.game.mode = mode;
          g.beginDraft();
        }
      return;
    }
    if (
      g.game.mode === "pve" &&
      ((g.game.state === "draftPick" && g.draft.turn % 2 === 1) ||
        (g.game.state === "draftModel" && g.draft.modelTurn === 1))
    )
      return;
    if (g.game.state === "draftPick")
      for (const id of g.draft.offers)
        if (g.hitBtn("draft_skill_" + id, x, y)) {
          g.chooseDraftSkill(id);
          return;
        }
    if (g.game.state === "draftModel")
      for (const c of ROSTER)
        if (g.hitBtn("draft_model_" + c.id, x, y)) {
          g.chooseDraftModel(c.id);
          return;
        }
  };
  g.attachDraftPointer = () => {
    g.canvas.addEventListener("pointermove", (e) => {
      const r = g.canvas.getBoundingClientRect();
      g.draftPointer = {
        x: ((e.clientX - r.left) / r.width) * g.W,
        y: ((e.clientY - r.top) / r.height) * g.H,
      };
    });
    g.canvas.addEventListener("pointerleave", () => {
      g.draftPointer = null;
    });
  };
}
