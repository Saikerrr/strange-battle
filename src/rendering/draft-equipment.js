import { drawBalalaika, drawBurger } from "./country-props.js";

// Borrowed equipment follows the chosen model; it never swaps country identity.
export function drawDraftFighter(g, original, f) {
  const active = f.draftLoadout && f.ultTimer <= 0 && !f.trainingDummy;
  const c = g.ctx;
  c.save();
  if (active && !f.isJapan && f.japanAstralTimer > 0) c.globalAlpha *= 0.25;
  original(f);
  c.restore();
  if (!active) return;
  c.save();
  c.translate(f.x, f.y);
  c.scale(f.facing, 1);
  const arm = (x, y) => {
    g.drawLimb(18, -109, 32, -105, 13, f.colors.shirt, f.colors.shirtDark);
    g.drawLimb(32, -105, x, y, 10, f.colors.skin, f.colors.skinDark);
  };
  if (!f.isAfghanistan && f.afghanRifleActive > 0) {
    arm(47, -103);
    c.fillStyle = "#303a32";
    c.fillRect(37, -113, 38, 13);
    c.fillRect(66, -110, 24, 5);
    c.fillRect(49, -101, 9, 17);
    c.fillStyle = "#795436";
    c.fillRect(26, -112, 15, 11);
  }
  if (!f.isJapan && (f.japanParryPrep > 0 || f.japanParryStance > 0)) {
    arm(48, -102);
    g.drawLimb(-14, -108, 48, -114, 10, f.colors.skin, f.colors.skinDark);
    g.drawKatana(48, -102, -1.35);
  }
  if (f.isAfghanistan && f.attack?.type === "uppercut") {
    arm(45, -151);
    drawBalalaika(c, 45, -151, f.attack.timer < 0.5 ? -0.6 : 1.15);
  }
  if (f.isAfghanistan && f.burgerEatTimer > 0) {
    arm(28, -177);
    drawBurger(c, 28, -177, (1.2 - f.burgerEatTimer) / 1.2);
  }
  if (f.isAfghanistan && f.noodleMode && f.noodleCharges > 0) {
    arm(44, -127);
    c.fillStyle = "#cc5624";
    c.fillRect(34, -144, 22, 27);
    c.strokeStyle = "#f8d78f";
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(37 + i * 5, -143);
      c.bezierCurveTo(32 + i * 5, -150, 45 + i * 3, -154, 39 + i * 4, -164);
      c.stroke();
    }
  }
  c.restore();
}
