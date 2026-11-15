export function register(sbContext) {
  sbContext.drawCrowd_base = function (t) {
    for (const c of sbContext.crowd) {
      if (!c.alive) {
        const prog = Math.min(1, (2.5 - c.deathTimer) / 1.2);
        const cx = c.x + (c.fallX - c.x) * prog,
          cy = c.y + (c.fallY - c.y) * prog;
        sbContext.ctx.save();
        sbContext.ctx.translate(cx, cy);
        sbContext.ctx.rotate((c.deathRotation || 0) + prog * Math.PI * 0.65);
        sbContext.ctx.fillStyle = `hsl(${c.hue},20%,12%)`;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, 0, c.size, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = `hsl(${c.hue},10%,30%)`;
        sbContext.ctx.beginPath();
        sbContext.ctx.arc(0, -c.size * 0.9, c.size * 0.65, 0, Math.PI * 2);
        sbContext.ctx.fill();
        sbContext.ctx.fillStyle = "rgba(160,0,0,0.75)";
        sbContext.ctx.beginPath();
        sbContext.ctx.ellipse(
          0,
          c.size * 0.5,
          c.size * 1.5,
          c.size * 0.4,
          0,
          0,
          Math.PI * 2,
        );
        sbContext.ctx.fill();
        sbContext.ctx.restore();
        continue;
      }
      const bob =
        Math.sin(t * 2 + c.phase) * 2 +
        c.excited * Math.sin(t * 15 + c.phase) * 8;
      sbContext.ctx.fillStyle = `hsl(${c.hue},60%,${28 + c.row * 5}%)`;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(c.x, c.y + bob, c.size, 0, Math.PI * 2);
      sbContext.ctx.fill();
      sbContext.ctx.fillStyle = `hsl(${c.hue},40%,${55 + c.row * 5}%)`;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(
        c.x,
        c.y + bob - c.size * 0.9,
        c.size * 0.65,
        0,
        Math.PI * 2,
      );
      sbContext.ctx.fill();
    }
  };

  sbContext.drawWorld_base = function (t) {
    sbContext.ctx.fillStyle = "#1a0a1a";
    for (let i = 0; i < 70; i++) {
      const x = sbContext.ARENA_LEFT + i * 60 + (i % 2) * 25;
      const h = 50 + ((i * 37) % 90);
      sbContext.ctx.fillRect(x, sbContext.GROUND_Y - 150 - h, 48, h);
    }
    const wall = sbContext.ctx.createLinearGradient(
      0,
      sbContext.GROUND_Y - 550,
      0,
      sbContext.GROUND_Y,
    );
    wall.addColorStop(0, "#3a2030");
    wall.addColorStop(1, "#1a0a15");
    sbContext.ctx.fillStyle = wall;
    sbContext.ctx.fillRect(
      sbContext.ARENA_LEFT,
      sbContext.GROUND_Y - 550,
      sbContext.ARENA_RIGHT - sbContext.ARENA_LEFT,
      550,
    );
    sbContext.ctx.strokeStyle = "rgba(0,0,0,0.3)";
    sbContext.ctx.lineWidth = 1;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 60; col++) {
        const x = sbContext.ARENA_LEFT + col * 58 + (row % 2) * 29;
        const y = sbContext.GROUND_Y - 550 + row * 55;
        if (x < sbContext.ARENA_RIGHT) sbContext.ctx.strokeRect(x, y, 58, 55);
      }
    }
    for (let i = 0; i < 18; i++) {
      const tx = sbContext.ARENA_LEFT + 100 + i * 200;
      if (tx > sbContext.ARENA_RIGHT - 50) break;
      const ty = sbContext.GROUND_Y - 400;
      sbContext.ctx.fillStyle = "#4a3a20";
      sbContext.ctx.fillRect(tx - 4, ty, 8, 30);
      const flick = 1 + Math.sin(t * 8 + i * 1.3) * 0.3;
      const fg = sbContext.ctx.createRadialGradient(
        tx,
        ty - 10,
        2,
        tx,
        ty - 10,
        35 * flick,
      );
      fg.addColorStop(0, "rgba(255,255,200,0.95)");
      fg.addColorStop(0.4, "rgba(255,150,40,0.7)");
      fg.addColorStop(1, "rgba(255,80,0,0)");
      sbContext.ctx.fillStyle = fg;
      sbContext.ctx.beginPath();
      sbContext.ctx.arc(tx, ty - 10, 35 * flick, 0, Math.PI * 2);
      sbContext.ctx.fill();
    }
    sbContext.drawCrowd(t);
    sbContext.drawRefereeBackground(t);
    sbContext.ctx.fillStyle = "#6a4a2a";
    sbContext.ctx.fillRect(
      sbContext.ARENA_LEFT,
      sbContext.GROUND_Y - 80,
      sbContext.ARENA_RIGHT - sbContext.ARENA_LEFT,
      12,
    );
    sbContext.ctx.fillStyle = "#4a2a1a";
    sbContext.ctx.fillRect(
      sbContext.ARENA_LEFT,
      sbContext.GROUND_Y - 70,
      sbContext.ARENA_RIGHT - sbContext.ARENA_LEFT,
      4,
    );
    for (let x = sbContext.ARENA_LEFT; x < sbContext.ARENA_RIGHT; x += 60) {
      sbContext.ctx.fillStyle = "#5a3a20";
      sbContext.ctx.fillRect(x, sbContext.GROUND_Y - 85, 6, 22);
    }
    const floor = sbContext.ctx.createLinearGradient(
      0,
      sbContext.GROUND_Y,
      0,
      sbContext.GROUND_Y + 200,
    );
    floor.addColorStop(0, "#5a4a30");
    floor.addColorStop(1, "#2a1a10");
    sbContext.ctx.fillStyle = floor;
    sbContext.ctx.fillRect(
      sbContext.ARENA_LEFT,
      sbContext.GROUND_Y,
      sbContext.ARENA_RIGHT - sbContext.ARENA_LEFT,
      200,
    );
    sbContext.ctx.strokeStyle = "rgba(0,0,0,0.35)";
    sbContext.ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const y = sbContext.GROUND_Y + 10 + i * 15;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(sbContext.ARENA_LEFT, y);
      sbContext.ctx.lineTo(sbContext.ARENA_RIGHT, y);
      sbContext.ctx.stroke();
    }
    for (let i = 0; i < 65; i++) {
      const x = sbContext.ARENA_LEFT + i * 56;
      const sp = (x - 1800) * 0.8;
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(x, sbContext.GROUND_Y);
      sbContext.ctx.lineTo(x + sp, sbContext.GROUND_Y + 200);
      sbContext.ctx.stroke();
    }
    sbContext.ctx.save();
    sbContext.ctx.globalAlpha = 0.12;
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.font = "bold 90px Impact, Arial Black, sans-serif";
    sbContext.ctx.textAlign = "center";
    sbContext.ctx.textBaseline = "middle";
    sbContext.ctx.fillText("ARENA", 1800, sbContext.GROUND_Y + 100);
    sbContext.ctx.restore();

    sbContext.drawSprings(t);
    sbContext.drawPlatforms();
  };

  sbContext.drawRefereeBackground_base = function (t) {
    const rx = sbContext.ARENA_LEFT + 300;
    const ry = sbContext.GROUND_Y - 175;
    sbContext.ctx.save();
    sbContext.ctx.translate(rx, ry);
    sbContext.ctx.translate(0, Math.sin(t * 2) * 1.5);
    sbContext.ctx.scale(0.7, 0.7);
    sbContext.ctx.fillStyle = "#1a1a1a";
    sbContext.ctx.fillRect(-12, -30, 8, 30);
    sbContext.ctx.fillRect(4, -30, 8, 30);
    sbContext.ctx.fillStyle = "#000";
    sbContext.ctx.beginPath();
    sbContext.ctx.roundRect(-14, -50, 28, 22, 4);
    sbContext.ctx.fill();
    for (let i = -5; i <= 5; i++) {
      sbContext.ctx.fillStyle = i % 2 === 0 ? "#000" : "#fff";
      sbContext.ctx.fillRect(i * 4, -90, 4, 42);
    }
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 1.5;
    sbContext.ctx.strokeRect(-22, -90, 44, 42);
    sbContext.ctx.strokeStyle = "#ffd700";
    sbContext.ctx.lineWidth = 2;
    sbContext.ctx.beginPath();
    sbContext.ctx.moveTo(0, -90);
    sbContext.ctx.lineTo(0, -78);
    sbContext.ctx.stroke();
    sbContext.ctx.fillStyle = "#ffd700";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, -74, 4, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.fillStyle = "#f0c090";
    sbContext.ctx.fillRect(-28, -88, 8, 25);
    sbContext.ctx.fillRect(20, -88, 8, 25);
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, -108, 16, 0, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.fillStyle = "#3a2010";
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(0, -113, 16, Math.PI, Math.PI * 2);
    sbContext.ctx.fill();
    sbContext.ctx.strokeStyle = "#000";
    sbContext.ctx.lineWidth = 2;
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(5, -108, 5, 0, Math.PI * 2);
    sbContext.ctx.stroke();
    sbContext.ctx.beginPath();
    sbContext.ctx.arc(-5, -108, 5, 0, Math.PI * 2);
    sbContext.ctx.stroke();
    sbContext.ctx.restore();
  };

  sbContext.drawSprings_base = function (t) {
    for (const s of sbContext.springs) {
      const wob = Math.sin(t * 4 + s.phase) * 2;
      sbContext.ctx.fillStyle = "#333";
      sbContext.ctx.fillRect(s.x - 32, sbContext.GROUND_Y - 8, 64, 8);
      sbContext.ctx.strokeStyle = "#888";
      sbContext.ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        const y = sbContext.GROUND_Y - 12 - i * 7 + wob * (i / 4);
        sbContext.ctx.beginPath();
        sbContext.ctx.moveTo(s.x - 22, y);
        sbContext.ctx.lineTo(s.x + 22, y - 4);
        sbContext.ctx.stroke();
      }
      const topY = sbContext.GROUND_Y - 44;
      sbContext.ctx.fillStyle = "#ff4400";
      sbContext.ctx.beginPath();
      sbContext.ctx.roundRect(s.x - 28, topY, 56, 10, 3);
      sbContext.ctx.fill();
      sbContext.ctx.strokeStyle = "#aa2200";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.strokeRect(s.x - 28, topY, 56, 10);
      sbContext.ctx.fillStyle = "#ffd700";
      sbContext.ctx.beginPath();
      sbContext.ctx.moveTo(s.x, topY - 16);
      sbContext.ctx.lineTo(s.x - 10, topY - 5);
      sbContext.ctx.lineTo(s.x + 10, topY - 5);
      sbContext.ctx.closePath();
      sbContext.ctx.fill();
    }
  };

  sbContext.drawPlatforms_base = function () {
    for (const p of sbContext.platforms) {
      sbContext.ctx.fillStyle = "rgba(0,0,0,0.35)";
      sbContext.ctx.fillRect(p.x + 8, p.y + 15, p.w, 8);
      const grad = sbContext.ctx.createLinearGradient(0, p.y, 0, p.y + 22);
      grad.addColorStop(0, "#8a6a4a");
      grad.addColorStop(1, "#4a3a20");
      sbContext.ctx.fillStyle = grad;
      sbContext.ctx.fillRect(p.x, p.y, p.w, 22);
      sbContext.ctx.fillStyle = "#aa8a6a";
      sbContext.ctx.fillRect(p.x, p.y, p.w, 5);
      sbContext.ctx.fillStyle = "#3a2a1a";
      sbContext.ctx.fillRect(p.x + 8, p.y + 22, 8, 18);
      sbContext.ctx.fillRect(p.x + p.w - 16, p.y + 22, 8, 18);
      sbContext.ctx.strokeStyle = "#2a1a0a";
      sbContext.ctx.lineWidth = 2;
      sbContext.ctx.strokeRect(p.x, p.y, p.w, 22);
      sbContext.ctx.fillStyle = "#5a9e3a";
      for (let i = 0; i < 6; i++) {
        const gx = p.x + 10 + (i * (p.w - 20)) / 5;
        sbContext.ctx.fillRect(gx, p.y - 3, 3, 4);
      }
    }
  };

  sbContext.drawWorld_interface = function (t) {
    sbContext.drawWorld_base(t);
    sbContext.sbDrawPickup();
    sbContext.sbDrawTombs();
    sbContext.sbDrawMiniZombies();
    sbContext.sbDrawRockets();
    sbContext.sbDrawBoomerangs();
    sbContext.sbDrawPistolShots();
  };
}
