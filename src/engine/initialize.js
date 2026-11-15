import { initializeInput } from "./input.js";
import { initializeCharacter as initializeChina } from "../characters/china.js";
import { initializeCharacter as initializeJapan } from "../characters/japan.js";
import { initializeCharacter as initializeAfghanistan } from "../characters/afghanistan.js";
export function initialize(sbContext) {
  initializeInput(sbContext);
  sbContext.CN_COLORS = sbContext.CHINA_COLORS;
  sbContext.canvas = document.getElementById("game");
  sbContext.ctx = sbContext.canvas.getContext("2d");
  sbContext.W = 1600;
  sbContext.H = 900;
  sbContext.canvas.width = sbContext.W;
  sbContext.canvas.height = sbContext.H;
  sbContext.resize();
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === "number") r = [r, r, r, r];
      this.beginPath();
      this.moveTo(x + r[0], y);
      this.lineTo(x + w - r[1], y);
      this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
      this.lineTo(x + w, y + h - r[2]);
      this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
      this.lineTo(x + r[3], y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
      this.lineTo(x, y + r[0]);
      this.quadraticCurveTo(x, y, x + r[0], y);
      this.closePath();
      return this;
    };
  }
  sbContext.camera = { x: 1800, y: 400, zoom: 1 };
  sbContext.selections = { p1: "ukraine", p2: "russia" };
  sbContext.buttons = {};
  sbContext.game = {
    state: "title",
    timer: 0,
    round: 1,
    p1Wins: 0,
    p2Wins: 0,
    message: "",
    messageTimer: 0,
    messageMaxTimer: 1,
    winner: 0,
    secondMsgShown: false,
    mode: "pvp",
  };
  sbContext.p1 = new sbContext.Fighter(
    1500,
    1,
    "ukraine",
    "Украина",
    sbContext.P1_CONTROLS,
  );
  sbContext.p2 = new sbContext.Fighter(
    2100,
    -1,
    "russia",
    "Россия",
    sbContext.P2_CONTROLS,
  );
  sbContext.lastTime = 0;
  sbContext.arenaPickupState = {
    item: null,
    spawnTimer: 7,
    respawnLock: 0,
    phase: 0,
  };
  sbContext.pistolShots = [];
  sbContext.ultRockets = [];
  sbContext.practiceDummy2 = new sbContext.Fighter(
    2550,
    -1,
    "russia",
    "МАНЕКЕН-БЛОК",
    sbContext.P2_CONTROLS,
  );
  sbContext.practiceDummy2.trainingDummy = true;
  sbContext.practiceDummy2.trainingBlock = true;
  sbContext.practiceDummy2.state = "block";
  sbContext.practiceDummy2.blocking = true;
  sbContext.sbRawDrawFighter18 = sbContext.drawFighter_base;
  sbContext.practiceDummies = [];
  if (sbContext.game.difficulty === undefined)
    sbContext.game.difficulty = "medium";
  initializeChina(sbContext);
  initializeJapan(sbContext);
  initializeAfghanistan(sbContext);
}
