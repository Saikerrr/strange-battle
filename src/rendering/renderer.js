export function register(sbContext) {
  sbContext.render_base = function () {
    if (sbContext.game.state === "title") {
      sbContext.drawTitleScreen();
      return;
    }
    if (sbContext.game.state === "select") {
      sbContext.drawSelectScreen();
      return;
    }
    if (sbContext.game.state === "controls") {
      sbContext.drawControlsScreen();
      return;
    }

    const sky = sbContext.ctx.createLinearGradient(0, 0, 0, sbContext.H);
    sky.addColorStop(0, "#1a0a2a");
    sky.addColorStop(0.5, "#4a1a3a");
    sky.addColorStop(1, "#8a3a2a");
    sbContext.ctx.fillStyle = sky;
    sbContext.ctx.fillRect(0, 0, sbContext.W, sbContext.H);

    sbContext.ctx.save();
    if (sbContext.screenShake.timer > 0) {
      const s =
        sbContext.screenShake.intensity *
        (sbContext.screenShake.timer / sbContext.screenShake.duration);
      sbContext.ctx.translate(
        (Math.random() - 0.5) * s,
        (Math.random() - 0.5) * s,
      );
    }
    sbContext.ctx.translate(sbContext.W / 2, sbContext.H / 2);
    sbContext.ctx.scale(sbContext.camera.zoom, sbContext.camera.zoom);
    sbContext.ctx.translate(-sbContext.camera.x, -sbContext.camera.y);

    sbContext.drawWorld(performance.now() / 1000);
    sbContext.drawZombieWaves();
    sbContext.drawBears();
    sbContext.drawFighter(sbContext.p1);
    sbContext.drawFighter(sbContext.p2);
    if (sbContext.p1.blockedTimer > 0)
      sbContext.drawGlitchOverlay(sbContext.p1);
    if (sbContext.p2.blockedTimer > 0)
      sbContext.drawGlitchOverlay(sbContext.p2);
    sbContext.drawDrones();
    sbContext.drawBombs();
    sbContext.drawProjectiles();
    sbContext.drawEagles();
    sbContext.drawLightningEffects();
    sbContext.drawExplosionRings();
    sbContext.drawParticles();

    sbContext.ctx.restore();

    if (sbContext.screenFlash > 0) {
      sbContext.ctx.fillStyle = sbContext.screenFlashColor;
      sbContext.ctx.globalAlpha = sbContext.screenFlash * 2;
      sbContext.ctx.fillRect(0, 0, sbContext.W, sbContext.H);
      sbContext.ctx.globalAlpha = 1;
    }

    sbContext.drawHUD();
    if (
      sbContext.game.mode === "practice" &&
      sbContext.game.state === "fighting"
    ) {
      sbContext.ctx.save();
      sbContext.ctx.fillStyle = "rgba(0,0,0,.72)";
      sbContext.ctx.fillRect(sbContext.W / 2 - 245, sbContext.H - 54, 490, 34);
      sbContext.ctx.fillStyle = "#bfeaff";
      sbContext.ctx.font = "bold 15px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.fillText(
        "ПОЛИГОН  ·  МАНЕКЕНЫ ПО 200 HP  ·  + — ДОБАВИТЬ",
        sbContext.W / 2,
        sbContext.H - 32,
      );
      sbContext.ctx.restore();
    }
    sbContext.drawMessage();

    if (sbContext.game.state === "matchEnd") {
      sbContext.ctx.fillStyle = "rgba(0,0,0,0.55)";
      sbContext.ctx.fillRect(0, 0, sbContext.W, sbContext.H);
      if (Math.floor(performance.now() / 500) % 2 === 0) {
        sbContext.ctx.font = "bold 22px Arial";
        sbContext.ctx.textAlign = "center";
        sbContext.ctx.fillStyle = "#fff";
        sbContext.ctx.fillText(
          "Нажмите R или кликните для выбора персонажей",
          sbContext.W / 2,
          sbContext.H - 100,
        );
      }
    }
  };

  sbContext.render_interface = function () {
    sbContext.render_base();
    if (sbContext.game.state === "paused") sbContext.sbDrawPauseMenu();
    if (
      sbContext.game.mode === "practice" &&
      sbContext.game.state === "fighting"
    ) {
      const x = sbContext.W - 105,
        y = sbContext.H / 2 - 38;
      sbContext.ctx.save();
      sbContext.ctx.fillStyle = "rgba(0,0,0,.72)";
      sbContext.ctx.fillRect(x - 8, y - 8, 86, 86);
      sbContext.ctx.fillStyle = "#193d25";
      sbContext.ctx.fillRect(x, y, 70, 70);
      sbContext.ctx.strokeStyle = "#75ff9c";
      sbContext.ctx.lineWidth = 4;
      sbContext.ctx.strokeRect(x, y, 70, 70);
      sbContext.ctx.fillStyle = "#75ff9c";
      sbContext.ctx.font = "bold 58px Arial";
      sbContext.ctx.textAlign = "center";
      sbContext.ctx.textBaseline = "middle";
      sbContext.ctx.fillText("+", x + 35, y + 34);
      sbContext.ctx.restore();
      sbContext.buttons.practice_add = { x, y, w: 70, h: 70 };
    }
  };
}
