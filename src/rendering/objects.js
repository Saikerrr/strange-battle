import { drawRaptor } from "./country-props.js";
export function register(sbContext) {
  sbContext.drawLightningEffects_base = function () {
    for (const e of sbContext.lightningEffects) {
      const alpha = e.life / e.maxLife;
      sbContext.ctx.save();
      sbContext.ctx.globalAlpha = alpha;
      sbContext.ctx.strokeStyle = "#ffffff";
      sbContext.ctx.lineWidth = 10 * (1 - (1 - alpha) * 0.4);
      sbContext.ctx.shadowColor = "#88ccff";
      sbContext.ctx.shadowBlur = 40;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(e.x, 0);
      let cy = 0;
      while (cy < e.y - 30) {
        cy += 40 + Math.random() * 30;
        const cx = e.x + (Math.random() - 0.5) * 80;
        sbContext.ctx.lineTo(cx, cy);
      }
      sbContext.ctx.lineTo(e.x, e.y);
      sbContext.ctx.stroke();
      sbContext.ctx.strokeStyle = "#88ccff";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.shadowBlur = 20;
      for (let i = 0; i < 5; i++) {
        sbContext.ctx.beginPath();
        const startY = 100 + Math.random() * 400;
        sbContext.ctx.moveTo(e.x + (Math.random() - 0.5) * 40, startY);
        sbContext.ctx.lineTo(
          e.x + (Math.random() - 0.5) * 200,
          startY + 50 + Math.random() * 80,
        );
        sbContext.ctx.stroke();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.drawExplosionRings_base = function () {
    for (const r of sbContext.explosionRings) {
      const a = r.life / r.maxLife;
      sbContext.ctx.strokeStyle = r.color + a * 0.8 + ")";
      sbContext.ctx.lineWidth = 8 * a + 2;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      sbContext.ctx.stroke();
    }
  };

  sbContext.drawZombieWaves_base = function () {
    for (const w of sbContext.zombieWaves) {
      const a = w.life / w.maxLife;
      sbContext.ctx.strokeStyle = `rgba(140,255,80,${a * 0.7})`;
      sbContext.ctx.lineWidth = 4 * a + 1;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.strokeStyle = `rgba(200,255,150,${a * 0.4})`;
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.setLineDash([8, 8]);
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(w.x, w.y, w.r * 0.85, 0, Math.PI * 2);
      sbContext.ctx.stroke();
      sbContext.ctx.setLineDash([]);
    }
  };

  sbContext.drawBears_base = function () {
    for (const b of sbContext.bears) {
      sbContext.ctx.save();
      sbContext.ctx.translate(b.x, b.y);
      sbContext.ctx.scale(b.facing * (b.isUlt ? 1.55 : 1), b.isUlt ? 1.55 : 1);
      sbContext.ctx.fillStyle = "rgba(0,0,0,0.4)";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(0, 0, 65, 15, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      const phase = Math.sin(b.animTime * 25) * 15;
      sbContext.ctx.fillStyle = "#3a1a08";
      sbContext.ctx.fillRect(-40, -30, 22, 32);
      sbContext.ctx.fillRect(18, -30, 22, 32);
      sbContext.ctx.fillStyle = "#4a2a10";
      sbContext.ctx.fillRect(-40, -30 + phase, 22, 32);
      sbContext.ctx.fillRect(18, -30 - phase, 22, 32);
      const bodyGrad = sbContext.ctx.createLinearGradient(-55, -110, 55, 0);
      bodyGrad.addColorStop(0, "#5a3a18");
      bodyGrad.addColorStop(0.5, "#7a5a38");
      bodyGrad.addColorStop(1, "#4a2a10");
      sbContext.ctx.fillStyle = bodyGrad;
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(0, -65, 58, 52, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#2a1a08";
      sbContext.ctx.lineWidth = 3;
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#7a5a38";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(48, -105, 38, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#2a1a08";
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#4a2a10";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(28, -130, 13, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(66, -130, 13, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#8a6a48";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(75, -98, 20, 15, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#000";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(88, -98, 5.5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      const eyePulse = 0.5 + Math.sin(b.animTime * 15) * 0.5;
      sbContext.ctx.fillStyle = `rgba(255,${30 + eyePulse * 100},0,1)`;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(40, -108, 5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(62, -108, 5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(41, -109, 2, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(63, -109, 2, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#fff";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(76, -88);
      sbContext.ctx.lineTo(80, -80);
      sbContext.ctx.lineTo(73, -83);
      sbContext.ctx.fill();
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(83, -88);
      sbContext.ctx.lineTo(87, -80);
      sbContext.ctx.lineTo(80, -83);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#ddd";
      sbContext.ctx.fillRect(-35, 0, 5, 6);
      sbContext.ctx.fillRect(23, 0, 5, 6);
      sbContext.ctx.restore();
    }
  };

  sbContext.drawBombs_base = function () {
    for (const b of sbContext.bombs) {
      sbContext.ctx.save();
      sbContext.ctx.translate(b.x, b.y);
      sbContext.ctx.rotate(b.spin);
      const trailGrad = sbContext.ctx.createLinearGradient(0, -40, 0, 10);
      trailGrad.addColorStop(0, "rgba(255,80,0,0)");
      trailGrad.addColorStop(1, "rgba(255,150,0,0.7)");
      sbContext.ctx.fillStyle = trailGrad;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-6, 0);
      sbContext.ctx.lineTo(0, -50);
      sbContext.ctx.lineTo(6, 0);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#1a1a1a";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 18, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#444";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#666";
      sbContext.ctx.fillRect(-3, -22, 6, 8);
      sbContext.ctx.fillStyle = "#555";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(-6, -6, 5, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = "#ff0000";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(-5, -3, 3, 0, Math.PI * 2);
      sbContext.ctx.arc(5, -3, 3, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#ff2200";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(-3, 5);
      sbContext.ctx.lineTo(3, 5);
      sbContext.ctx.moveTo(0, 3);
      sbContext.ctx.lineTo(0, 8);
      sbContext.ctx.stroke();
      sbContext.ctx.restore();
    }
  };

  sbContext.drawDrones_base = function () {
    for (const d of sbContext.drones) {
      sbContext.ctx.save();
      sbContext.ctx.translate(d.x, d.y);
      sbContext.ctx.globalAlpha = 0.3;
      sbContext.ctx.fillStyle = "#ffdd00";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 0, 28, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.globalAlpha = 1;
      sbContext.ctx.fillStyle = "#2a2a2a";
      sbContext.ctx.beginPath();
      sbContext.ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#666";
      sbContext.ctx.lineWidth = 1.5;
      sbContext.ctx.stroke();
      sbContext.ctx.fillStyle = "#ff0000";
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(0, 3, 3, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "rgba(200,200,200,0.7)";
      sbContext.ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const rx = Math.cos(ang) * 22,
          ry = Math.sin(ang) * 14;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(0, 0);
        sbContext.ctx.lineTo(rx, ry);
        sbContext.ctx.stroke();
        const rot = d.rotor * 3 + i;
        sbContext.ctx.save();
        sbContext.ctx.translate(rx, ry);
        sbContext.ctx.rotate(rot);
        sbContext.ctx.strokeStyle = "rgba(150,220,255,0.8)";
        sbContext.ctx.lineWidth = 2;
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(-8, 0);
        sbContext.ctx.lineTo(8, 0);
        sbContext.ctx.stroke();
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(0, -8);
        sbContext.ctx.lineTo(0, 8);
        sbContext.ctx.stroke();
        sbContext.ctx.restore();
      }
      sbContext.ctx.restore();
    }
  };

  sbContext.drawProjectiles_base = function () {
    for (const p of sbContext.projectiles) {
      const isMissile = p.type === "missile";
      const isBullet = p.type === "drone_bullet";
      const isBlockade = p.type === "blockade";
      const isFlag = p.type === "flag";
      if (p.trail && p.trail.length) {
        for (let i = 0; i < p.trail.length; i++) {
          const tr = p.trail[i];
          const a = i / p.trail.length;
          sbContext.ctx.globalAlpha = a * 0.6;
          sbContext.ctx.fillStyle = p.color;
          const r = isMissile ? 12 * a : isBullet ? 4 * a : p.r * a;
          sbContext.ctx.beginPath();
          sbContext.ctx.arc(tr.x, tr.y, r, 0, Math.PI * 2);
          sbContext.ctx.fill();
        }
        sbContext.ctx.globalAlpha = 1;
      }
      if (isMissile) {
        sbContext.ctx.globalAlpha = 0.4;
        const g = sbContext.ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 30);
        g.addColorStop(0, "#ffaa00");
        g.addColorStop(1, "rgba(255,0,0,0)");
        sbContext.ctx.fillStyle = g;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.globalAlpha = 1;
        sbContext.ctx.fillStyle = "#ff3333";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#ffaa00";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        sbContext.ctx.fill();
        const ang = Math.atan2(p.vy, p.vx);
        sbContext.ctx.save();
        sbContext.ctx.translate(p.x, p.y);
        sbContext.ctx.rotate(ang);
        sbContext.ctx.fillStyle = "#ffffff";
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(8, 0);
        sbContext.ctx.lineTo(20, -4);
        sbContext.ctx.lineTo(20, 4);
        sbContext.ctx.closePath();
        sbContext.ctx.fill();
        sbContext.ctx.restore();
      } else if (isFlag) {
        sbContext.ctx.save();
        sbContext.ctx.translate(p.x, p.y);
        sbContext.ctx.rotate(Math.PI / 4 + performance.now() / 200);
        sbContext.ctx.scale(p.isUltFlag ? 2.25 : 1.5, p.isUltFlag ? 2.25 : 1.5);
        sbContext.ctx.globalAlpha = 0.4;
        sbContext.ctx.fillStyle = "#d52b1e";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.globalAlpha = 1;
        sbContext.ctx.fillStyle = "#d52b1e";
        sbContext.ctx.fillRect(-16, -10, 32, 20);
        sbContext.ctx.fillStyle = "#fff";
        sbContext.ctx.fillRect(-16, -4, 32, 4);
        sbContext.ctx.fillStyle = "#0039a6";
        sbContext.ctx.fillRect(-16, -10, 14, 12);
        sbContext.ctx.fillStyle = "#fff";
        for (let i = 0; i < 2; i++)
          for (let j = 0; j < 2; j++) {
            sbContext.ctx.beginPath();
            sbContext.ctx.arc(-12 + j * 6, -7 + i * 6, 1.5, 0, Math.PI * 2);
            sbContext.ctx.fill();
          }
        sbContext.ctx.fillStyle = "#886644";
        sbContext.ctx.fillRect(14, -12, 3, 30);
        sbContext.ctx.restore();
      } else if (isBlockade) {
        const pulse = 0.7 + Math.sin(performance.now() / 80) * 0.3;
        sbContext.ctx.globalAlpha = 0.5 * pulse;
        const g = sbContext.ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 40);
        g.addColorStop(0, "#cc66ff");
        g.addColorStop(0.5, "rgba(180,80,255,0.5)");
        g.addColorStop(1, "rgba(120,0,200,0)");
        sbContext.ctx.fillStyle = g;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.globalAlpha = 1;
        sbContext.ctx.strokeStyle = "#cc66ff";
        sbContext.ctx.lineWidth = 3;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        sbContext.ctx.stroke();
        sbContext.ctx.fillStyle = "#8800cc";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#ff88ff";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#fff";
        sbContext.ctx.font = "bold 12px Arial";
        sbContext.ctx.textAlign = "center";
        sbContext.ctx.textBaseline = "middle";
        sbContext.ctx.fillText("🚫", p.x, p.y);
      } else if (isBullet) {
        const dir = Math.sign(p.vx) || 1;
        const grad = sbContext.ctx.createLinearGradient(
          p.x - dir * 50,
          p.y,
          p.x,
          p.y,
        );
        grad.addColorStop(0, "rgba(255,180,0,0)");
        grad.addColorStop(1, "rgba(255,50,0,0.95)");
        sbContext.ctx.fillStyle = grad;
        sbContext.ctx.fillRect(p.x - dir * 50, p.y - 2, dir * 50, 4);
        sbContext.ctx.globalAlpha = 0.5;
        sbContext.ctx.fillStyle = p.color;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.globalAlpha = 1;
        sbContext.ctx.fillStyle = "#ffaa66";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "#fff";
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2);
        sbContext.ctx.fill();
      }
    }
  };

  sbContext.drawParticles_base = function () {
    for (const p of sbContext.particles) {
      const a = p.life / p.maxLife;
      sbContext.ctx.globalAlpha = a;
      if (p.isText) {
        sbContext.ctx.fillStyle = p.color;
        sbContext.ctx.font = "bold " + p.size + "px Arial";
        sbContext.ctx.textAlign = "center";
        sbContext.ctx.strokeStyle = "#000";
        sbContext.ctx.lineWidth = 4;
        sbContext.ctx.strokeText(p.text, p.x, p.y);
        sbContext.ctx.fillText(p.text, p.x, p.y);
      } else {
        sbContext.ctx.fillStyle = p.color;
        if (p.isKetchup) {
          sbContext.ctx.beginPath();
          sbContext.ctx.ellipse(
            p.x,
            p.y,
            p.size * 0.6,
            p.size * 0.9,
            p.x * 0.01,
            0,
            Math.PI * 2,
          );
          sbContext.ctx.fill();
        } else {
          sbContext.ctx.fillRect(
            p.x - p.size / 2,
            p.y - p.size / 2,
            p.size,
            p.size,
          );
        }
      }
    }
    sbContext.ctx.globalAlpha = 1;
  };

  sbContext.drawEagles_interface = function () {
    for (const e of sbContext.eagles) drawRaptor(sbContext.ctx, e);
  };
}
