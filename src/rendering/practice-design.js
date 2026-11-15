import { drawTrainingDummy } from "./training-dummy.js";

export function register(g) {
  const draw = g.drawFighter;
  g.drawFighter = (f) => {
    if (!f.trainingDummy) {
      draw(f);
      return;
    }
    const dummies = f === g.p2 ? g.practiceDummies : [f];
    for (const d of dummies) {
      const { ctx } = g;
      ctx.save();
      if (d.hitFlash > 0) {
        ctx.shadowColor = "#f2d19b";
        ctx.shadowBlur = 18;
      }
      drawTrainingDummy(ctx, d.x, d.y);
      if (d.attack) {
        const active =
          d.attack.timer >= d.attack.startupEnd &&
          d.attack.timer < d.attack.activeEnd;
        ctx.fillStyle = "#b39b7b";
        ctx.strokeStyle = "#624f3d";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(d.x + d.facing * 27, d.y - 116);
        ctx.lineTo(d.x + d.facing * (active ? 83 : 47), d.y - 100);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          d.x + d.facing * (active ? 83 : 47),
          d.y - 100,
          12,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (d.hitstun > 0 || d.starStunTimer > 0) {
        ctx.strokeStyle = "#d7ba75";
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const x = d.x - 22 + i * 22;
          ctx.beginPath();
          ctx.moveTo(x - 5, d.y - 218);
          ctx.lineTo(x + 5, d.y - 207);
          ctx.moveTo(x + 5, d.y - 218);
          ctx.lineTo(x - 5, d.y - 207);
          ctx.stroke();
        }
      }
      if (d !== g.p2) {
        ctx.fillStyle = "#d1c3ad";
        ctx.font = "13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(d.hp) + " / 200", d.x, d.y - 230);
      }
      ctx.restore();
    }
  };
}
