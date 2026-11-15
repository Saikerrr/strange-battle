export function register(g) {
  g.drawCrowd = (t) => {
    const { ctx } = g;
    for (const c of g.crowd) {
      if (!c.alive && c.deathTimer <= 0) continue;
      const bob = c.alive
        ? Math.sin(t * 2 + c.phase) * 1.5 +
          Math.sin(t * 9 + c.phase) * c.excited * 3
        : 15;
      const x = c.x,
        y = c.y + bob;
      ctx.save();
      ctx.globalAlpha = c.alive ? 1 : Math.max(0, c.deathTimer / 2.5);
      ctx.translate(x, y);
      ctx.fillStyle = `hsl(${c.hue},15%,${17 + c.row * 4}%)`;
      ctx.beginPath();
      ctx.ellipse(0, 12, c.size * 1.6, c.size * 1.8, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = `hsl(${15 + (c.hue % 25)},22%,${32 + c.row * 6}%)`;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -c.size * 0.75,
        c.size * 0.7,
        c.size * 0.9,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "#24202a";
      ctx.beginPath();
      ctx.ellipse(
        0,
        -c.size * 1.2,
        c.size * 0.77,
        c.size * 0.42,
        0,
        Math.PI,
        0,
      );
      ctx.fill();
      if (c.excited > 1) {
        ctx.strokeStyle = "#60515f";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-c.size, 7);
        ctx.lineTo(-c.size * 1.7, -12);
        ctx.moveTo(c.size, 7);
        ctx.lineTo(c.size * 1.7, -12);
        ctx.stroke();
      }
      ctx.restore();
    }
  };
  g.drawPlatforms = () => {
    const { ctx } = g;
    for (const p of g.platforms) {
      const metal = ctx.createLinearGradient(0, p.y, 0, p.y + 22);
      metal.addColorStop(0, "#8e8580");
      metal.addColorStop(0.2, "#4b424b");
      metal.addColorStop(1, "#25222c");
      ctx.fillStyle = metal;
      ctx.fillRect(p.x, p.y, p.w, 20);
      ctx.strokeStyle = "#a09282";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, 20);
      ctx.strokeStyle = "#2c2630";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p.x + 15, p.y + 20);
      ctx.lineTo(p.x + 42, p.y + 55);
      ctx.lineTo(p.x + p.w - 42, p.y + 55);
      ctx.lineTo(p.x + p.w - 15, p.y + 20);
      ctx.stroke();
      ctx.fillStyle = "#c8af6f";
      for (let x = p.x + 12; x < p.x + p.w; x += 28)
        ctx.fillRect(x, p.y + 4, 7, 3);
    }
  };
  g.drawWorld_base = (t) => {
    const { ctx, ARENA_LEFT: L, ARENA_RIGHT: R, GROUND_Y: Y } = g;
    const wall = ctx.createLinearGradient(0, -250, 0, Y);
    wall.addColorStop(0, "#10131f");
    wall.addColorStop(0.6, "#201b2b");
    wall.addColorStop(1, "#312530");
    ctx.fillStyle = wall;
    ctx.fillRect(L - 400, -400, R - L + 800, Y + 700);
    ctx.strokeStyle = "#36313e";
    ctx.lineWidth = 3;
    for (let y = -80; y < Y; y += 90) {
      ctx.beginPath();
      ctx.moveTo(L - 250, y);
      ctx.lineTo(R + 250, y);
      ctx.stroke();
      for (
        let x = L - 250 + (Math.round(y / 90) % 2 ? 80 : 0);
        x < R + 250;
        x += 160
      ) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 90);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = "#4c424f";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(L - 100, 60);
    ctx.lineTo(R + 100, 60);
    ctx.stroke();
    for (let x = L + 180; x < R; x += 540) {
      ctx.fillStyle = "#373440";
      ctx.fillRect(x - 31, 54, 62, 25);
      ctx.fillStyle = "#d9c2a1";
      ctx.fillRect(x - 22, 76, 44, 9);
      const glow = ctx.createLinearGradient(x, 82, x, Y);
      glow.addColorStop(0, "#eed9b12a");
      glow.addColorStop(1, "#aab3db02");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.moveTo(x - 22, 82);
      ctx.lineTo(x - 250, Y);
      ctx.lineTo(x + 250, Y);
      ctx.lineTo(x + 22, 82);
      ctx.fill();
      const lamp = ctx.createRadialGradient(x, 80, 3, x, 80, 100);
      lamp.addColorStop(0, "#f1d3a355");
      lamp.addColorStop(1, "#f1d3a300");
      ctx.fillStyle = lamp;
      ctx.fillRect(x - 100, -20, 200, 200);
    }
    for (let row = 0; row < 3; row++) {
      ctx.fillStyle = "#15131bd9";
      ctx.fillRect(L - 140, Y - 325 + row * 67, R - L + 280, 56);
      ctx.fillStyle = "#514250";
      ctx.fillRect(L - 140, Y - 270 + row * 67, R - L + 280, 5);
    }
    g.drawCrowd(t);
    ctx.strokeStyle = "#5f404c";
    ctx.lineWidth = 6;
    for (const yy of [Y - 108, Y - 65, Y - 22]) {
      ctx.beginPath();
      ctx.moveTo(L - 40, yy);
      ctx.lineTo(R + 40, yy);
      ctx.stroke();
    }
    ctx.fillStyle = "#36313d";
    for (const x of [L - 30, R + 12]) ctx.fillRect(x, Y - 140, 20, 150);
    const floor = ctx.createLinearGradient(0, Y, 0, Y + 260);
    floor.addColorStop(0, "#5c5356");
    floor.addColorStop(1, "#262732");
    ctx.fillStyle = floor;
    ctx.fillRect(L - 150, Y, R - L + 300, 400);
    ctx.strokeStyle = "#75696b";
    ctx.lineWidth = 2;
    ctx.strokeRect(L + 25, Y + 20, R - L - 50, 210);
    ctx.strokeStyle = "#38343e";
    for (let x = L; x < R; x += 125) {
      ctx.beginPath();
      ctx.moveTo(x, Y);
      ctx.lineTo(x + 25, Y + 300);
      ctx.stroke();
    }
    for (let y = Y + 40; y < Y + 320; y += 45) {
      ctx.beginPath();
      ctx.moveTo(L - 150, y);
      ctx.lineTo(R + 150, y);
      ctx.stroke();
    }
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#b99d9a";
    ctx.font = "italic bold 100px Impact,Arial";
    ctx.textAlign = "center";
    ctx.fillText("STRANGE BATTLE", (L + R) / 2, Y + 150);
    ctx.restore();
    g.drawPlatforms();
    g.drawSprings(t);
    g.drawRefereeBackground(t);
  };
}
