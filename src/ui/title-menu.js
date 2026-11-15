const assetNames = ["background", "logo", "pvp", "pve", "practice"];

export async function loadTitleImages() {
  const entries = await Promise.all(
    assetNames.map(
      (name) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve([name, image]);
          image.onerror = () =>
            reject(new Error(`Cannot load menu image: ${name}`));
          image.src = new URL(
            `../../assets/menu/${name}.png`,
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
    logo: { x: (width - 650) / 2, y: 35, w: 650, h: 325 },
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
      const scale = Math.max(
        W / images.background.naturalWidth,
        H / images.background.naturalHeight,
      );
      const bw = images.background.naturalWidth * scale,
        bh = images.background.naturalHeight * scale;
      ctx.drawImage(images.background, (W - bw) / 2, (H - bh) / 2, bw, bh);
      const logo = layout.logo;
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
      if (g.game.state === "title") g.drawTitleScreen();
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
