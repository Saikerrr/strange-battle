import * as config from "./config.js";
import * as colors from "./colors.js";
import * as audio from "./audio.js";
import * as effects from "./effects.js";
import * as state from "./state.js";
import { applySelections } from "../characters/roster.js";
import { register as registerSelection } from "../ui/selection.js";
import { register as registerControls } from "../ui/controls.js";
import { register as registerTitleMenu } from "../ui/title-menu.js";
import { startRound, endRound, updateGame } from "../systems/lifecycle.js";
import { initialize } from "./initialize.js";
import { attachInput } from "./input.js";
import { DIFFICULTY_CFG } from "../ai/difficulty.js";
import { register as registerCanvas } from "../engine/canvas.js";
import { register as registerHelpers } from "../engine/helpers.js";
import { register as registerProjectiles } from "../systems/projectiles.js";
import { register as registerRenderer } from "../rendering/renderer.js";
import { register as registerBehavior } from "../entities/behavior.js";
import { register as registerAmerica } from "../characters/america.js";
import { register as registerRussia } from "../characters/russia.js";
import { register as registerUkraine } from "../characters/ukraine.js";
import { register as registerUltimates } from "../systems/ultimates.js";
import { register as registerAI } from "../ai/controller.js";
import { register as registerCamera } from "../rendering/camera.js";
import { register as registerHUD } from "../ui/hud.js";
import { register as registerScreens } from "../ui/screens.js";
import { register as registerMatch } from "../systems/match.js";
import { register as registerPickups } from "../systems/pickups.js";
import { register as registerFighterSystems } from "../systems/fighter.js";
import { register as registerChina } from "../characters/china.js";
import { register as registerJapan } from "../characters/japan.js";
import { register as registerAfghanistan } from "../characters/afghanistan.js";
import { register as registerFighter } from "../entities/Fighter.js";
import { register as registerWorld } from "../rendering/world.js";
import { register as registerDrawing } from "../rendering/fighter.js";
import { register as registerObjects } from "../rendering/objects.js";
export function createGame({ bindInput = true, titleImages = null } = {}) {
  const g = {
    ...config,
    ...colors,
    ...audio,
    ...effects,
    ...state,
    DIFFICULTY_CFG,
  };
  for (const services of [audio, effects, state])
    for (const [key, value] of Object.entries(services))
      if (typeof value === "function") g[key + "Service"] = value;
  Object.defineProperties(g, {
    audioCtx: { get: () => audio.audioCtx },
    screenFlash: {
      get: () => effects.screenFlash,
      set: (value) => effects.setScreenFlash(value),
    },
    screenFlashColor: { get: () => effects.screenFlashColor },
    hitStopTimer: {
      get: () => state.hitStopTimer,
      set: (value) => state.setHitStop(value),
    },
  });
  registerCanvas(g);
  registerHelpers(g);
  registerProjectiles(g);
  registerRenderer(g);
  registerWorld(g);
  registerDrawing(g);
  registerObjects(g);
  registerBehavior(g);
  registerAmerica(g);
  registerRussia(g);
  registerUkraine(g);
  registerUltimates(g);
  registerAI(g);
  registerCamera(g);
  registerHUD(g);
  registerScreens(g);
  registerMatch(g);
  registerPickups(g);
  registerFighterSystems(g);
  registerChina(g);
  registerJapan(g);
  registerAfghanistan(g);
  registerFighter(g);
  g.resize = g.resize_base;
  g.initAudio = g.initAudioService;
  g.playSound = g.playSoundService;
  g.limbEnd = g.limbEnd_base;
  g.circleOverlap = g.circleOverlap_base;
  g.doShake = g.doShakeService;
  g.flash = g.flashService;
  g.spawnHitSparks = g.spawnHitSparksService;
  g.spawnKetchup = g.spawnKetchupService;
  g.spawnDust = g.spawnDustService;
  g.spawnBlood = g.spawnBloodService;
  g.spawnMuzzleFlash = g.spawnMuzzleFlashService;
  g.spawnExplosion = g.spawnExplosionService;
  g.spawnBigExplosion = g.spawnBigExplosionService;
  g.spawnLightning = g.spawnLightningService;
  g.updateParticles = g.updateParticles_afghanistan;
  g.updateEagles = g.updateEagles_interface;
  g.initCrowd = g.initCrowdService;
  g.killRandomSpectator = g.killRandomSpectatorService;
  g.drawCrowd = g.drawCrowd_base;
  g.triggerUlt = g.triggerUlt_afghanistan;
  g.updateAI = g.updateAI_afghanistan;
  g.launchDrone = g.launchDrone_arena;
  g.launchMissile = g.launchMissile_arena;
  g.updateDrones = g.updateDrones_base;
  g.updateBears = g.updateBears_interface;
  g.updateBombs = g.updateBombs_base;
  g.updateProjectiles = g.updateProjectiles_base;
  g.updateCamera = g.updateCamera_base;
  g.drawWorld = g.drawWorld_afghanistan;
  g.drawRefereeBackground = g.drawRefereeBackground_base;
  g.drawSprings = g.drawSprings_base;
  g.drawPlatforms = g.drawPlatforms_base;
  g.drawLimb = g.drawLimb_base;
  g.drawFighter = g.drawFighter_afghanistan;
  g.drawGlitchOverlay = g.drawGlitchOverlay_base;
  g.drawArm = g.drawArm_japan;
  g.drawLeg = g.drawLeg_base;
  g.drawLightningEffects = g.drawLightningEffects_base;
  g.drawExplosionRings = g.drawExplosionRings_base;
  g.drawZombieWaves = g.drawZombieWaves_base;
  g.drawBears = g.drawBears_base;
  g.drawBombs = g.drawBombs_base;
  g.drawEagles = g.drawEagles_interface;
  g.drawDrones = g.drawDrones_base;
  g.drawProjectiles = g.drawProjectiles_base;
  g.drawParticles = g.drawParticles_base;
  g.drawFlagUA = g.drawFlagUA_base;
  g.drawFlagRU = g.drawFlagRU_base;
  g.drawFlagUS = g.drawFlagUS_base;
  g.drawMiniPortrait = g.drawMiniPortrait_afghanistan;
  g.drawSkillIconTop = g.drawSkillIconTop_base;
  g.drawUltIcon = g.drawUltIcon_base;
  g.drawTopPanel = g.drawTopPanel_arena;
  g.getPlayerSkills = g.getPlayerSkills_afghanistan;
  g.drawHUD = g.drawHUD_base;
  g.drawMessage = g.drawMessage_base;
  g.button = g.button_base;

  g.drawSelectScreen = g.drawSelectScreen_afghanistan;

  g.drawCharCard = g.drawCharCard_china;

  g.goToTitle = g.goToTitle_base;
  g.goToSelect = g.goToSelect_base;
  g.goToControls = g.goToControls_base;
  g.startMatch = g.startMatch_interface;

  g.hitBtn = g.hitBtn_base;

  g.render = g.render_interface;
  g.loop = g.loop_base;
  g.sbSparkText = g.sbSparkText_arena;
  g.sbSpawnPickup = g.sbSpawnPickup_arena;
  g.sbApplyPickup = g.sbApplyPickup_arena;
  g.sbUpdatePickups = g.sbUpdatePickups_arena;
  g.sbDrawPickup = g.sbDrawPickup_arena;
  g.sbFirePistol = g.sbFirePistol_arena;
  g.sbUpdatePistol = g.sbUpdatePistol_arena;
  g.sbDrawPistolShots = g.sbDrawPistolShots_arena;
  g.sbSpawnRocket = g.sbSpawnRocket_arena;
  g.sbUpdateRockets = g.sbUpdateRockets_arena;
  g.sbDrawRockets = g.sbDrawRockets_arena;
  g.sbCastTomb = g.sbCastTomb_arena;
  g.sbUpdateTombs = g.sbUpdateTombs_interface;
  g.sbDrawTombs = g.sbDrawTombs_arena;
  g.sbDrawMiniZombies = g.sbDrawMiniZombies_arena;
  g.sbUpdateBoomerangs = g.sbUpdateBoomerangs_arena;
  g.sbDrawBoomerangs = g.sbDrawBoomerangs_arena;
  g.drawFlagChina = g.drawFlagChina_interface;

  g.sbDescription = g.sbDescription_afghanistan;
  g.sbDrawInfoPanel = g.sbDrawInfoPanel_interface;
  g.sbDrawPauseMenu = g.sbDrawPauseMenu_interface;
  g.sbConfigureDummy = g.sbConfigureDummy_interface;
  g.cnText = g.cnText_china;
  g.cnInit = g.cnInit_china;
  g.cnUpdateProjectiles = g.cnUpdateProjectiles_china;
  g.cnDrawProjectiles = g.cnDrawProjectiles_china;
  g.drawFlagJapan = g.drawFlagJapan_japan;
  g.drawKatana = g.drawKatana_japan;
  g.japanInitState = g.japanInitState_japan;
  g.jpDrawHelmet = g.jpDrawHelmet_japan;
  g.jpDrawStanceFX = g.jpDrawStanceFX_japan;
  g.jpDrawSlashArc = g.jpDrawSlashArc_japan;
  g.jpRenderFighter = g.jpRenderFighter_japan;
  g.jpDrawCuts = g.jpDrawCuts_japan;
  g.jpDrawSmoke = g.jpDrawSmoke_japan;
  g.jpMakeGhostFighter = g.jpMakeGhostFighter_japan;
  g.jpDrawGhostCopies = g.jpDrawGhostCopies_japan;
  g.drawFlagAfghanistan = g.drawFlagAfghanistan_afghanistan;
  g.afghanInitState = g.afghanInitState_afghanistan;
  g.drawPistol = g.drawPistol_afghanistan;
  g.drawAfghanCloak = g.drawAfghanCloak_afghanistan;
  g.drawAfghanPistolAttack = g.drawAfghanPistolAttack_afghanistan;
  g.drawAfghanBaseForm = g.drawAfghanBaseForm_afghanistan;
  g.drawAfghanUltForm = g.drawAfghanUltForm_afghanistan;
  g.drawAfghanCast = g.drawAfghanCast_afghanistan;
  g.drawAfghanCloaks = g.drawAfghanCloaks_afghanistan;
  g.drawAfghanNets = g.drawAfghanNets_afghanistan;
  g.drawAfghanNetOverlay = g.drawAfghanNetOverlay_afghanistan;
  g.drawAfghanProjectiles = g.drawAfghanProjectiles_afghanistan;
  g.updateAfghanProjectiles = g.updateAfghanProjectiles_afghanistan;
  g.initCrowd = () =>
    effects.initCrowd(g.ARENA_LEFT, g.ARENA_RIGHT, g.GROUND_Y);
  registerSelection(g);
  registerControls(g);
  registerTitleMenu(g, titleImages);
  g.applySelections = () => applySelections(g);
  g.startRound = () => startRound(g);
  g.endRound = (winner) => endRound(g, winner);
  g.updateGame = (dt) => updateGame(g, dt);
  initialize(g);
  if (bindInput) {
    attachInput(g);
    g.attachTitlePointer();
  }
  g.initCrowd();
  return g;
}
