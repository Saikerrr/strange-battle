const assetNames = [
  "background",
  "logo",
  "pvp",
  "pve",
  "practice",
  "selectionBackground",
  "selectionReference",
  "flag_ua",
  "flag_ru",
  "flag_us",
  "flag_cn",
  "flag_jp",
  "flag_af",
];

export async function loadTitleImages() {
  const entries = await Promise.all(
    assetNames.map(
      (name) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            if (
              name === "background" ||
              name.startsWith("selection") ||
              name.startsWith("flag_")
            ) {
              resolve([name, image]);
              return;
            }
            const pixelImage = document.createElement("canvas");
            pixelImage.width = name === "logo" ? 350 : 180;
            pixelImage.height = Math.round(
              (pixelImage.width * image.naturalHeight) / image.naturalWidth,
            );
            pixelImage
              .getContext("2d")
              .drawImage(image, 0, 0, pixelImage.width, pixelImage.height);
            resolve([name, pixelImage]);
          };
          image.onerror = () =>
            reject(new Error(`Cannot load menu image: ${name}`));
          image.src = name.startsWith("flag_")
            ? new URL(
                `../../assets/flags/${name.slice(5)}.svg`,
                import.meta.url,
              ).href
            : new URL(
                `../../assets/menu/${{ selectionBackground: "selection-background", selectionReference: "selection-reference" }[name] || name}.png`,
                import.meta.url,
              ).href;
        }),
    ),
  );
  return Object.fromEntries(entries);
}

// Layout uses the same logical coordinates as the rest of the game's Canvas.
// Button PNGs have transparent margins; hit areas cover their visible banners.
export function titleLayout(width, height) {
  const buttonWidth = 360,
    buttonHeight = 120;
  return {
    logo: { x: (width - 700) / 2, y: 70, w: 700, h: 700 / 3 },
    buttons: ["pvp", "pve", "practice"].map((mode, index) => {
      const x = (width - buttonWidth) / 2,
        y = height / 2 - 85 + index * 120;
      return {
        mode,
        x,
        y,
        w: buttonWidth,
        h: buttonHeight,
        hit: {
          x: x + 10,
          y: y + 20,
          w: buttonWidth - 20,
          h: buttonHeight - 36,
        },
      };
    }),
  };
}

export function register(g, images) {
  const pointer = { x: -1, y: -1, down: false };
  const drift = { x: 0, y: 0 };
  const colors = { pvp: "#ff284b", pve: "#258dff", practice: "#c6c9e5" };
  const inside = (point, rect) =>
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h;
  g.titlePointer = pointer;
  g.drawTitleScreen = function () {
    const { ctx, W, H } = g,
      layout = titleLayout(W, H);
    for (const id of Object.keys(g.buttons)) delete g.buttons[id];
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#090916";
    ctx.fillRect(0, 0, W, H);
    if (images) {
      // Cover the canvas without stretching or adding a dark overlay.
      const scale =
        1.035 *
        Math.max(
          W / images.background.naturalWidth,
          H / images.background.naturalHeight,
        );
      const bw = images.background.naturalWidth * scale,
        bh = images.background.naturalHeight * scale;
      const targetX = pointer.x < 0 ? 0 : (pointer.x / W - 0.5) * -22;
      const targetY = pointer.y < 0 ? 0 : (pointer.y / H - 0.5) * -14;
      drift.x += (targetX - drift.x) * 0.12;
      drift.y += (targetY - drift.y) * 0.12;
      const bx = (W - bw) / 2 + drift.x,
        by = (H - bh) / 2 + drift.y;
      ctx.drawImage(images.background, bx, by, bw, bh);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const [nx, ny, rgb] of [
        [0.24, 0.04, "75,115,255"],
        [0.77, 0.045, "255,65,125"],
      ]) {
        const x = bx + bw * nx,
          y = by + bh * ny;
        const glow = ctx.createRadialGradient(x, y, 8, x, y, 230);
        const strength =
          0.16 + Math.sin(performance.now() / 1700 + nx * 5) * 0.018;
        glow.addColorStop(0, `rgba(${rgb},${strength})`);
        glow.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(x - 230, y - 230, 460, 460);
      }
      ctx.restore();
      const logo = layout.logo;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(images.logo, logo.x, logo.y, logo.w, logo.h);
    }
    let hovered = false;
    for (const button of layout.buttons) {
      g.buttons["play_" + button.mode] = { ...button.hit };
      const over = inside(pointer, button.hit);
      hovered ||= over;
      if (!images) continue;
      const scale = over ? (pointer.down ? 0.97 : 1.04) : 1;
      ctx.save();
      ctx.translate(button.x + button.w / 2, button.y + button.h / 2);
      ctx.scale(scale, scale);
      ctx.shadowColor = colors[button.mode];
      ctx.shadowBlur = over ? 27 : 14;
      if (over) ctx.filter = "brightness(1.13)";
      ctx.drawImage(
        images[button.mode],
        -button.w / 2,
        -button.h / 2,
        button.w,
        button.h,
      );
      ctx.restore();
    }
    g.canvas.style.cursor = hovered ? "pointer" : "default";
    ctx.restore();
  };
  g.attachTitlePointer = function () {
    const move = (event) => {
      const rect = g.canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * g.W;
      pointer.y = ((event.clientY - rect.top) / rect.height) * g.H;
      if (g.game.state === "title") g.render();
    };
    g.canvas.addEventListener("pointermove", move);
    g.canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      pointer.down = true;
      move(event);
    });
    window.addEventListener("pointerup", () => {
      pointer.down = false;
    });
    g.canvas.addEventListener("click", () => {
      if (g.game.state !== "title") {
        pointer.down = false;
        g.canvas.style.cursor = "default";
      }
    });
    g.canvas.addEventListener("pointerleave", () => {
      pointer.x = -1;
      pointer.y = -1;
      pointer.down = false;
      g.canvas.style.cursor = "default";
    });
    window.addEventListener("blur", () => {
      pointer.x = -1;
      pointer.y = -1;
      pointer.down = false;
    });
  };
}
