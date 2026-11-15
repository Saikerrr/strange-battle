export function drawBalalaika(c, x, y, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.fillStyle = "#bc7a31";
  c.strokeStyle = "#503421";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-42, 27);
  c.lineTo(36, 27);
  c.lineTo(-3, -30);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = "#e0ae62";
  c.beginPath();
  c.moveTo(-32, 21);
  c.lineTo(27, 21);
  c.lineTo(-3, -22);
  c.closePath();
  c.fill();
  c.fillStyle = "#493023";
  c.fillRect(-7, -92, 8, 68);
  c.fillRect(-10, -102, 14, 15);
  c.beginPath();
  c.arc(-3, -2, 8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#e3d3a8";
  c.lineWidth = 1;
  for (let i = -5; i < 1; i += 2) {
    c.beginPath();
    c.moveTo(i, -96);
    c.lineTo(i, 17);
    c.stroke();
  }
  c.restore();
}

export function drawBurger(c, x, y, progress) {
  c.save();
  c.translate(x, y);
  c.scale(1 - progress * 0.35, 1);
  c.fillStyle = "#d59138";
  c.beginPath();
  c.ellipse(0, -6, 20, 15, 0, Math.PI, 0);
  c.lineTo(20, -2);
  c.lineTo(-20, -2);
  c.fill();
  c.fillStyle = "#5a301c";
  c.fillRect(-20, 3, 40, 9);
  c.fillStyle = "#63a23c";
  c.beginPath();
  c.moveTo(-23, -1);
  for (let i = 0; i < 9; i++) c.lineTo(-23 + i * 6, i % 2 ? 5 : -1);
  c.lineTo(21, 5);
  c.fill();
  c.fillStyle = "#eebf36";
  c.beginPath();
  c.moveTo(-19, 3);
  c.lineTo(20, 3);
  c.lineTo(8, 11);
  c.closePath();
  c.fill();
  c.fillStyle = "#e7a44d";
  c.beginPath();
  c.roundRect(-20, 12, 40, 8, 4);
  c.fill();
  c.fillStyle = "#f4dd9e";
  for (let i = 0; i < 7; i++) {
    c.beginPath();
    c.ellipse(
      -13 + i * 4,
      -10 - Math.sin(i) * 3,
      1.7,
      0.8,
      0.3,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  c.restore();
}

export function drawRaptor(c, e) {
  c.save();
  c.translate(e.x, e.y);
  c.scale((e.facing || 1) * (e.scale || 1), e.scale || 1);
  const flap = Math.sin(e.timer * 14) * 22;
  // Layer long individual flight feathers over the darker wing membrane.
  for (const side of [-1, 1]) {
    c.save();
    c.scale(1, side);
    c.fillStyle = "#5d4029";
    c.beginPath();
    c.moveTo(6, 0);
    c.quadraticCurveTo(-15, -42 - flap, -48, -37 - flap);
    c.lineTo(-28, -7);
    c.closePath();
    c.fill();
    for (let i = 0; i < 8; i++) {
      c.strokeStyle = i % 2 ? "#8d6946" : "#4a3427";
      c.lineWidth = 6 - i * 0.3;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-7 - i * 3, -10 - i * 1.7);
      c.lineTo(-19 - i * 5, -36 - flap + i * 2);
      c.stroke();
    }
    c.restore();
  }
  c.fillStyle = "#4c3222";
  c.beginPath();
  c.moveTo(-20, -6);
  c.lineTo(-49, -13);
  c.lineTo(-44, 11);
  c.lineTo(-19, 7);
  c.fill();
  c.fillStyle = "#8a6140";
  c.beginPath();
  c.ellipse(-5, 0, 24, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#c8b692";
  c.beginPath();
  c.ellipse(19, -5, 13, 11, -0.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#d3ad4c";
  c.beginPath();
  c.moveTo(29, -8);
  c.quadraticCurveTo(45, -6, 33, 4);
  c.lineTo(33, -2);
  c.lineTo(26, -1);
  c.fill();
  c.fillStyle = "#1b1b14";
  c.beginPath();
  c.arc(25, -8, 2.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#e2be63";
  c.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    c.beginPath();
    c.moveTo(i * 10 - 3, 9);
    c.lineTo(i * 10 + 3, 18);
    c.lineTo(i * 10 + 9, 15);
    c.stroke();
  }
  c.restore();
}
