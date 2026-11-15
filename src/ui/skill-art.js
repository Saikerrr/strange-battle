const kits = {
  ukraine: [
    ["drone", "missile", "bomb"],
    ["drone", "missile", "grave"],
  ],
  russia: [
    ["blockade", "bear", "balalaika"],
    ["blockade", "bear", "missile"],
  ],
  america: [
    ["flag", "eagle", "burger"],
    ["flag", "eagle", "shield"],
  ],
  china: [
    ["noodles", "firework", "lantern"],
    ["fire", "tail", "roar"],
  ],
  japan: [
    ["katana", "parry", "smoke"],
    ["katana", "parry", "smoke"],
  ],
  afghanistan: [
    ["bomb", "rifle", "net"],
    ["grenade", "minigun", "plane"],
  ],
};
export function skillArt(f, index) {
  return (kits[f.charType] || kits.russia)[f.ultTimer > 0 ? 1 : 0][index];
}

export function drawSkillArt(ctx, x, y, size, kind) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  const bg = ctx.createLinearGradient(0, 0, 64, 64);
  bg.addColorStop(0, "#293b4b");
  bg.addColorStop(0.55, "#121d2b");
  bg.addColorStop(1, "#090c14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "#d3c4a4";
  ctx.fillStyle = "#a4b0b9";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const line = (points) => {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const p of points.slice(1)) ctx.lineTo(...p);
    ctx.stroke();
  };
  const disk = (x, y, r, fill) => {
    if (fill) ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  if (kind === "punch") {
    ctx.fillStyle = "#bda184";
    ctx.beginPath();
    ctx.roundRect(14, 23, 37, 28, 8);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.roundRect(14 + i * 9, 15, 10, 22, 4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillRect(28, 48, 17, 10);
  } else if (["bomb", "grenade"].includes(kind)) {
    disk(31, 37, 17, "#414e33");
    ctx.fillStyle = "#7d8065";
    ctx.fillRect(25, 12, 13, 10);
    line([
      [37, 14],
      [45, 10],
      [48, 19],
    ]);
    if (kind === "grenade") {
      line([
        [17, 30],
        [45, 30],
      ]);
      line([
        [16, 39],
        [46, 39],
      ]);
      line([
        [26, 22],
        [26, 52],
      ]);
      line([
        [36, 22],
        [36, 52],
      ]);
    } else {
      ctx.strokeStyle = "#e9a64b";
      line([
        [42, 11],
        [48, 6],
        [51, 13],
      ]);
    }
  } else if (["missile", "firework"].includes(kind)) {
    ctx.save();
    ctx.translate(32, 30);
    ctx.rotate(0.6);
    ctx.fillStyle = kind === "firework" ? "#b6453d" : "#aab3b8";
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(10, -10);
    ctx.lineTo(10, 18);
    ctx.lineTo(-10, 18);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6a13d";
    ctx.beginPath();
    ctx.moveTo(-7, 20);
    ctx.lineTo(0, 34);
    ctx.lineTo(7, 20);
    ctx.fill();
    ctx.restore();
  } else if (["rifle", "minigun"].includes(kind)) {
    ctx.fillStyle = "#7e8d91";
    ctx.fillRect(12, 26, 35, 12);
    ctx.fillRect(39, 25, 18, 6);
    ctx.fillStyle = "#6d4e35";
    ctx.fillRect(6, 31, 12, 12);
    ctx.fillRect(24, 38, 8, 14);
    ctx.strokeRect(12, 26, 35, 12);
    if (kind === "minigun") {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = "#adb5ad";
        ctx.fillRect(37, 22 + i * 6, 23, 3);
      }
      ctx.fillStyle = "#c69e51";
      for (let i = 0; i < 4; i++) ctx.fillRect(12 + i * 6, 44, 4, 10);
    }
  } else if (["katana", "parry"].includes(kind)) {
    line([
      [15, 51],
      [50, 10],
      [55, 8],
      [54, 15],
      [24, 48],
    ]);
    ctx.strokeStyle = "#c29658";
    ctx.lineWidth = 5;
    line([
      [13, 42],
      [27, 54],
    ]);
    ctx.strokeStyle = "#8f3c48";
    line([
      [12, 54],
      [20, 45],
    ]);
    if (kind === "parry") {
      ctx.strokeStyle = "#7dc9e4";
      ctx.lineWidth = 2;
      line([
        [8, 12],
        [55, 53],
      ]);
      line([
        [31, 6],
        [29, 18],
      ]);
      line([
        [44, 11],
        [38, 20],
      ]);
    }
  } else if (kind === "shield" || kind === "armor") {
    if (kind === "shield") {
      disk(32, 32, 24, "#9b343c");
      disk(32, 32, 18, "#bfc6c5");
      disk(32, 32, 12, "#345681");
      ctx.fillStyle = "#f0e6cc";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5,
          r = i % 2 ? 4 : 10;
        ctx.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#8a939c";
      ctx.beginPath();
      ctx.moveTo(10, 12);
      ctx.lineTo(32, 7);
      ctx.lineTo(54, 12);
      ctx.lineTo(50, 41);
      ctx.lineTo(32, 58);
      ctx.lineTo(14, 41);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      line([
        [32, 13],
        [32, 49],
      ]);
    }
  } else if (kind === "burger") {
    ctx.fillStyle = "#d29d50";
    ctx.beginPath();
    ctx.ellipse(32, 23, 23, 13, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#719148";
    ctx.fillRect(9, 28, 46, 6);
    ctx.fillStyle = "#6b3e2c";
    ctx.fillRect(11, 35, 42, 9);
    ctx.fillStyle = "#d1a44e";
    ctx.fillRect(10, 46, 44, 8);
    ctx.strokeStyle = "#e5c996";
    for (const [px, py] of [
      [23, 16],
      [33, 12],
      [41, 17],
    ])
      line([
        [px, py],
        [px + 3, py + 1],
      ]);
  } else if (kind === "flag") {
    line([
      [15, 7],
      [15, 58],
    ]);
    ctx.fillStyle = "#c7b9a0";
    ctx.fillRect(18, 10, 36, 25);
    ctx.fillStyle = "#b04547";
    for (let i = 0; i < 4; i++) ctx.fillRect(18, 10 + i * 7, 36, 3);
    ctx.fillStyle = "#34547c";
    ctx.fillRect(18, 10, 15, 14);
  } else if (kind === "drone") {
    ctx.fillStyle = "#667b78";
    ctx.fillRect(23, 25, 18, 18);
    for (const [px, py] of [
      [13, 17],
      [51, 17],
      [13, 49],
      [51, 49],
    ]) {
      line([
        [32, 32],
        [px, py],
      ]);
      ctx.strokeStyle = "#a8cccd";
      ctx.beginPath();
      ctx.ellipse(px, py, 10, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    disk(32, 38, 4, "#db856b");
  } else if (kind === "bear") {
    disk(18, 16, 8, "#735442");
    disk(46, 16, 8, "#735442");
    disk(32, 33, 22, "#735442");
    ctx.strokeStyle = "#271e1b";
    disk(24, 29, 2, "#d9be87");
    disk(41, 29, 2, "#d9be87");
    disk(32, 40, 11, "#ad8b64");
    disk(32, 37, 4, "#291e1a");
  } else if (kind === "balalaika") {
    ctx.fillStyle = "#a47745";
    ctx.beginPath();
    ctx.moveTo(28, 23);
    ctx.lineTo(10, 55);
    ctx.lineTo(51, 55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    line([
      [30, 38],
      [45, 6],
    ]);
    disk(31, 43, 5, "#3a2923");
    ctx.strokeStyle = "#e8d6af";
    ctx.lineWidth = 1;
    line([
      [31, 50],
      [45, 8],
    ]);
  } else if (kind === "eagle" || kind === "plane") {
    ctx.fillStyle = kind === "eagle" ? "#b29b77" : "#a6afb6";
    ctx.beginPath();
    ctx.moveTo(31, 8);
    ctx.lineTo(39, 29);
    ctx.lineTo(59, 43);
    ctx.lineTo(39, 39);
    ctx.lineTo(42, 56);
    ctx.lineTo(32, 48);
    ctx.lineTo(22, 56);
    ctx.lineTo(25, 39);
    ctx.lineTo(5, 43);
    ctx.lineTo(25, 29);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (kind === "eagle") {
      ctx.fillStyle = "#e6d7b8";
      ctx.beginPath();
      ctx.arc(32, 19, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dca34b";
      ctx.fillRect(35, 18, 8, 3);
    }
  } else if (kind === "noodles" || kind === "lantern") {
    ctx.fillStyle = kind === "noodles" ? "#b44d32" : "#bc413c";
    ctx.beginPath();
    ctx.moveTo(12, 22);
    ctx.lineTo(52, 22);
    ctx.lineTo(44, 54);
    ctx.lineTo(20, 54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#e1be7c";
    if (kind === "noodles") {
      for (let i = 0; i < 4; i++)
        line([
          [16 + i * 8, 25],
          [20 + i * 7, 14],
          [18 + i * 8, 8],
        ]);
    } else {
      line([
        [25, 8],
        [39, 8],
        [43, 20],
      ]);
      line([
        [32, 54],
        [32, 61],
      ]);
      line([
        [22, 27],
        [25, 48],
      ]);
      line([
        [42, 27],
        [39, 48],
      ]);
    }
  } else if (kind === "net") {
    ctx.strokeStyle = "#b3bfc2";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      line([
        [8 + i * 8, 8],
        [8 + i * 8, 56],
      ]);
      line([
        [8, 8 + i * 8],
        [56, 8 + i * 8],
      ]);
    }
    ctx.strokeStyle = "#d6c3a2";
    ctx.strokeRect(7, 7, 50, 50);
  } else if (kind === "grave") {
    ctx.fillStyle = "#748075";
    ctx.beginPath();
    ctx.roundRect(16, 12, 32, 44, 11);
    ctx.fill();
    ctx.stroke();
    line([
      [32, 22],
      [32, 46],
    ]);
    line([
      [24, 31],
      [40, 31],
    ]);
  } else if (kind === "smoke" || kind === "ghost") {
    for (const [px, py, r] of [
      [20, 39, 13],
      [36, 31, 18],
      [48, 44, 11],
    ])
      disk(px, py, r, "#a3adb6");
    ctx.fillStyle = "#30354a";
    ctx.fillRect(30, 27, 4, 5);
    ctx.fillRect(41, 27, 4, 5);
  } else if (kind === "fire" || kind === "aura" || kind === "roar") {
    ctx.fillStyle = kind === "aura" ? "#7aa565" : "#d77a39";
    ctx.beginPath();
    ctx.moveTo(32, 5);
    ctx.bezierCurveTo(46, 25, 61, 33, 47, 51);
    ctx.bezierCurveTo(32, 66, 6, 50, 15, 32);
    ctx.lineTo(24, 20);
    ctx.lineTo(25, 37);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f0d089";
    ctx.beginPath();
    ctx.moveTo(32, 27);
    ctx.lineTo(41, 48);
    ctx.lineTo(23, 48);
    ctx.fill();
  } else if (kind === "tail") {
    ctx.strokeStyle = "#bf5c42";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(12, 15);
    ctx.bezierCurveTo(62, 6, 60, 54, 17, 50);
    ctx.stroke();
    ctx.strokeStyle = "#dfb96a";
    ctx.lineWidth = 3;
    line([
      [14, 10],
      [18, 21],
    ]);
    line([
      [29, 9],
      [31, 21],
    ]);
    line([
      [43, 15],
      [40, 26],
    ]);
  } else if (kind === "blockade") {
    ctx.strokeStyle = "#bf5965";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(32, 32, 23, 0, Math.PI * 2);
    ctx.stroke();
    line([
      [16, 48],
      [48, 16],
    ]);
  } else {
    ctx.strokeStyle = "#bd9fd4";
    ctx.lineWidth = 5;
    line([
      [35, 7],
      [20, 34],
      [34, 32],
      [27, 57],
      [48, 26],
      [34, 28],
      [35, 7],
    ]);
  }
  ctx.restore();
}
