// Clothing, equipment and hands share one coordinate space; the face stays clear.
export function drawAfghanBody(g, f, ultimate = false) {
  const c = g.ctx,
    t = f.animTime || 0;
  c.save();
  c.translate(f.x, f.y);
  c.scale(f.facing, 1);
  if (f.hp <= 0) c.rotate(-1.2);
  const stride = Math.sin(f.walkCycle || 0) * (Math.abs(f.vx) > 10 ? 15 : 2);
  const shape = (points, color, stroke = "#30291e") => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  };
  const line = (points, color, width) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke();
  };
  for (const side of [-1, 1]) {
    const x = side * 17,
      step = side * stride;
    line(
      [
        [x, -77],
        [x + step * 0.5, -38],
        [x + step, -9],
      ],
      ultimate ? "#c9b68d" : "#655440",
      ultimate ? 25 : 18,
    );
    line(
      [
        [x + step - 6, -6],
        [x + step + 14, -6],
      ],
      "#28231c",
      11,
    );
  }
  if (ultimate) {
    // Slung weapons sit behind the shoulders rather than across the face.
    line(
      [
        [-27, -113],
        [-38, -181],
      ],
      "#444b35",
      12,
    );
    shape(
      [
        [-48, -180],
        [-30, -184],
        [-35, -201],
      ],
      "#687047",
    );
    line(
      [
        [26, -91],
        [38, -168],
      ],
      "#353532",
      9,
    );
    line(
      [
        [31, -118],
        [48, -127],
      ],
      "#61472f",
      8,
    );
  }
  shape(
    [
      [-28, -164],
      [25, -164],
      [35, -79],
      [22, -69],
      [-30, -72],
      [-38, -95],
    ],
    ultimate ? "#d4bf94" : "#735237",
  );
  if (!ultimate) {
    shape(
      [
        [-27, -173],
        [11, -176],
        [34, -113],
        [39, -63],
        [-42, -60],
        [-38, -125],
      ],
      "#795739",
    );
    line(
      [
        [-20, -156],
        [-27, -100],
        [-31, -69],
      ],
      "#a17b51",
      3,
    );
    line(
      [
        [3, -162],
        [15, -105],
        [24, -69],
      ],
      "#503d2b",
      3,
    );
  } else {
    shape(
      [
        [-26, -158],
        [-12, -164],
        [26, -98],
        [18, -85],
      ],
      "#493d2c",
    );
    shape(
      [
        [22, -158],
        [30, -151],
        [-20, -89],
        [-30, -97],
      ],
      "#554633",
    );
    for (let i = 0; i < 7; i++) {
      line(
        [
          [-18 + i * 5, -151 + i * 8],
          [-23 + i * 5, -145 + i * 8],
        ],
        "#c9aa54",
        4,
      );
      line(
        [
          [20 - i * 5, -150 + i * 8],
          [25 - i * 5, -144 + i * 8],
        ],
        "#c9aa54",
        4,
      );
    }
    line(
      [
        [-29, -82],
        [29, -82],
      ],
      "#55432c",
      10,
    );
    for (let x = -23; x < 30; x += 13) {
      c.fillStyle = "#515a32";
      c.fillRect(x, -87, 8, 13);
    }
  }
  const shooting = f.afghanRifleActive > 0 || f.afghanMinigunActive > 0;
  const chaos = f.afghanGrenadeChaos > 0;
  let hand = [26, -115];
  for (const side of [-1, 1]) {
    const end = chaos
      ? [Math.cos(t * 35 + side) * 68, -120 + Math.sin(t * 35 + side) * 42]
      : shooting
        ? [45 + side * 9, -107]
        : [side * 15, -112];
    line(
      [[side * 25, -149], [side * 37, chaos ? end[1] - 10 : -121], end],
      ultimate ? "#bfa77f" : "#886340",
      17,
    );
    line(
      [
        [end[0] - 3, end[1]],
        [end[0] + 3, end[1]],
      ],
      "#b68c64",
      10,
    );
    if (side === 1) hand = end;
  }
  // Cap, neck, face and beard are drawn after the clothing.
  c.fillStyle = "#b68c64";
  c.fillRect(-9, -177, 18, 17);
  c.beginPath();
  c.ellipse(0, -188, 20, 26, 0, 0, Math.PI * 2);
  c.fill();
  shape(
    [
      [-19, -187],
      [-13, -175],
      [12, -174],
      [21, -188],
      [15, -164],
      [-3, -158],
      [-17, -170],
    ],
    "#352b23",
  );
  shape(
    [
      [-21, -201],
      [-17, -212],
      [13, -215],
      [23, -202],
      [19, -197],
      [-20, -196],
    ],
    "#a69473",
  );
  line(
    [
      [-17, -202],
      [18, -204],
    ],
    "#d1bd96",
    4,
  );
  line(
    [
      [6, -192],
      [13, -192],
    ],
    "#241e18",
    2,
  );
  shape(
    [
      [16, -189],
      [23, -183],
      [16, -181],
    ],
    "#bd936b",
  );
  if (shooting) {
    c.fillStyle = "#353b39";
    c.fillRect(22, -115, 48, 13);
    c.fillStyle = "#795333";
    c.fillRect(14, -115, 15, 17);
    if (f.afghanMinigunActive > 0) {
      for (let i = 0; i < 4; i++) {
        c.fillStyle = i % 2 ? "#939b98" : "#49514e";
        c.fillRect(53, -122 + i * 6, 43, 4);
      }
      c.fillStyle = "#252c2a";
      c.fillRect(63, -126, 10, 30);
      c.fillRect(83, -124, 6, 26);
      c.fillStyle = "#b39448";
      c.fillRect(28, -101, 18, 12);
    } else {
      c.fillStyle = "#141b18";
      c.fillRect(62, -112, 30, 5);
      c.fillRect(41, -104, 10, 19);
    }
  } else if (f.attack?.type === "punch") g.drawPistol(hand[0], hand[1], -0.15);
  c.restore();
}

export function drawNetWrap(c, f) {
  if (!(f.afghanNetTimer > 0)) return;
  c.save();
  c.translate(f.x, f.y);
  if (f.ultTimer > 0 && (f.charType === "russia" || f.isUkraine))
    c.scale(1.7, 1.7);
  c.beginPath();
  c.ellipse(0, -112, 58, 113, 0, 0, Math.PI * 2);
  c.clip();
  c.strokeStyle = "#b7b3a0";
  c.lineWidth = 2;
  c.globalAlpha = 0.85;
  for (let i = -280; i < 280; i += 18) {
    c.beginPath();
    c.moveTo(-65, i);
    c.lineTo(65, i + 130);
    c.stroke();
    c.beginPath();
    c.moveTo(-65, i);
    c.lineTo(65, i - 130);
    c.stroke();
  }
  c.restore();
}
