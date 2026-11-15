export function dragonMouth(f) {
  return { x: f.x + f.facing * 100, y: f.y - 132 };
}

export function drawChineseDragon(c, f) {
  c.save();
  c.translate(f.x, f.y);
  c.scale(f.facing, 1);
  const t = f.animTime || 0;
  const path = (points, color, width) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  };
  const body = [];
  for (let i = 0; i <= 45; i++) {
    const p = i / 45,
      x = -160 + p * 225,
      y = -108 + Math.sin(p * Math.PI * 3.5 + t * 3) * 39 * (1 - p * 0.4);
    body.push([x, y]);
  }
  // Tail-to-head overlapping scales give the long Chinese silhouette.
  for (let i = 0; i < body.length; i++) {
    const [x, y] = body[i],
      r = 4 + (i / 45) * 22;
    c.fillStyle = i % 2 ? "#b82935" : "#d83c3e";
    c.strokeStyle = "#722332";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, y, r, r * 0.83, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    path(
      [
        [x - r * 0.5, y + r * 0.38],
        [x, y + r * 0.68],
        [x + r * 0.5, y + r * 0.38],
      ],
      "#e7b14b",
      3,
    );
    if (i % 3 === 0) {
      c.fillStyle = "#efb84b";
      c.beginPath();
      c.moveTo(x - 5, y - r * 0.6);
      c.lineTo(x - 9, y - r - 14);
      c.lineTo(x + 5, y - r * 0.7);
      c.fill();
    }
  }
  for (const [x, y, dir] of [
    [-80, -70, -1],
    [5, -82, 1],
  ]) {
    path(
      [
        [x, y],
        [x + dir * 20, y + 22],
        [x + dir * 8, y + 40],
      ],
      "#a72731",
      13,
    );
    for (let j = 0; j < 3; j++)
      path(
        [
          [x + dir * 8, y + 40],
          [x + dir * (17 + j * 6), y + 42 - j * 7],
        ],
        "#e9c76e",
        3,
      );
  }
  c.fillStyle = "#e6aa35";
  for (let i = 0; i < 10; i++) {
    c.beginPath();
    c.moveTo(43, -166 + i * 6);
    c.lineTo(20 - (i % 3) * 9, -178 + i * 8);
    c.lineTo(54, -157 + i * 6);
    c.fill();
  }
  path(
    [
      [59, -164],
      [45, -193],
      [55, -211],
    ],
    "#e3d0a0",
    7,
  );
  path(
    [
      [75, -164],
      [80, -195],
      [96, -202],
    ],
    "#e3d0a0",
    6,
  );
  c.fillStyle = "#d43c37";
  c.strokeStyle = "#692b31";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(43, -163);
  c.quadraticCurveTo(74, -190, 96, -158);
  c.lineTo(118, -150);
  c.lineTo(119, -136);
  c.lineTo(86, -136);
  c.lineTo(79, -116);
  c.lineTo(45, -124);
  c.closePath();
  c.fill();
  c.stroke();
  const open = f.dragonRush > 0 ? 18 : 4;
  c.fillStyle = "#3b1625";
  c.beginPath();
  c.moveTo(78, -137);
  c.lineTo(116, -136);
  c.lineTo(105, -120 + open);
  c.lineTo(80, -120 + open);
  c.fill();
  path(
    [
      [78, -119 + open],
      [104, -118 + open],
      [119, -129 + open],
    ],
    "#df733f",
    8,
  );
  c.fillStyle = "#fff1c2";
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(85 + i * 8, -137);
    c.lineTo(88 + i * 8, -128);
    c.lineTo(91 + i * 8, -137);
    c.fill();
  }
  c.fillStyle = "#f4db50";
  c.beginPath();
  c.ellipse(81, -157, 10, 6, -0.2, 0, Math.PI * 2);
  c.fill();
  path(
    [
      [84, -161],
      [84, -153],
    ],
    "#102b27",
    3,
  );
  path(
    [
      [65, -169],
      [87, -165],
    ],
    "#268d78",
    7,
  );
  for (const side of [-1, 1])
    path(
      [
        [103, -147],
        [126, -160 + side * 15],
        [143, -146 + side * 25 + Math.sin(t * 4) * 8],
      ],
      "#53b6a0",
      3,
    );
  path(
    [
      [63, -120],
      [49, -101],
      [63, -85],
    ],
    "#e6b748",
    6,
  );
  c.restore();
}
