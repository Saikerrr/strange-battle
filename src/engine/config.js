// src/engine/config.js

export const ARENA_LEFT = 100;
export const ARENA_RIGHT = 3500;
export const GROUND_Y = 750;
export const GRAVITY = 2400;
export const MOVE_SPEED = 300;
export const JUMP_VELOCITY = -950;
export const DOUBLE_JUMP_VELOCITY = -800;
export const DASH_SPEED = 1500;
export const DASH_DURATION = 0.18;
export const DASH_CD = 1.2;
export const ULT_CHARGE_TIME = 2.0;

export const platforms = [
  { x: 400, y: 600, w: 200 },
  { x: 700, y: 470, w: 180 },
  { x: 1000, y: 590, w: 200 },
  { x: 1300, y: 450, w: 200 },
  { x: 1600, y: 580, w: 180 },
  { x: 1900, y: 440, w: 200 },
  { x: 2200, y: 590, w: 180 },
  { x: 2500, y: 480, w: 200 },
  { x: 2800, y: 580, w: 200 },
  { x: 3100, y: 460, w: 180 },
];

export const springs = [
  { x: 800, y: GROUND_Y, phase: 0 },
  { x: 2000, y: GROUND_Y, phase: 1.2 },
  { x: 3000, y: GROUND_Y, phase: 2.4 },
];

export const ATTACKS = {
  punch: {
    startup: 0.06,
    active: 0.08,
    recovery: 0.18,
    damage: 4,
    range: 55,
    hitY: -95,
    hitR: 28,
    knockback: 200,
  },
  kick: {
    startup: 0.1,
    active: 0.12,
    recovery: 0.25,
    damage: 7,
    range: 65,
    hitY: -55,
    hitR: 32,
    knockback: 280,
  },
  uppercut: {
    startup: 0.12,
    active: 0.1,
    recovery: 0.3,
    damage: 14,
    range: 55,
    hitY: -120,
    hitR: 38,
    launch: true,
    knockback: 150,
  },
  chargedPunch: {
    startup: 1.5,
    active: 0.15,
    recovery: 0.5,
    damage: 28,
    range: 95,
    hitY: -100,
    hitR: 50,
    knockback: 800,
    launch: true,
    cd: 2.5,
  },
};
export const SKILLS = {
  drone: { cd: 8 },
  missile: { cd: 10 },
  bombs: { cd: 10 },
};
export const SKILLS_RU = {
  blockade: { cd: 8 },
  bear: { cd: 12 },
  uppercut: { cd: 6 },
};
export const SKILLS_US = {
  flag: { cd: 10 },
  eagle: { cd: 7 },
  burger: { cd: 15 },
};
