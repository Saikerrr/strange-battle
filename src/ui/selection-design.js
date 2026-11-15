import { drawTrainingDummy } from "../rendering/training-dummy.js";
import { drawClothFlag } from "./cloth-flags.js";
import { ROSTER } from "../characters/roster.js";

function frame(ctx, x, y, w, h, color = "#876e79", fill = "#17141edb") {
  const cut = Math.min(16, w / 5, h / 4);
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.lineTo(x, y + cut);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#463a49";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 7, y + 9, w - 14, h - 18);
  ctx.restore();
}

export function register(g, images) {
  const scroll = { p1: 0, p2: 0 },
    panels = {};
  let drag = null;
  g.selectScroll = scroll;
  const rowHeight = 68,
    viewHeight = 408;
  const maximum = () => Math.max(0, ROSTER.length * rowHeight - viewHeight);
  const clamp = (value) => Math.max(0, Math.min(maximum(), value));
  const contains = (x, y, b) =>
    x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  function panel(x, y, side, id) {
    const { ctx } = g,
      w = 520,
      h = 520,
      top = y + 52;
    frame(ctx, x, y, w, h);
    ctx.font = "italic bold 38px Impact,Arial";
    ctx.fillStyle = "#ccacb0";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      side === "p1" ? "P1" : g.game.mode === "pve" ? "P2 · ИИ" : "P2",
      x + 20,
      y + 25,
    );
    ctx.font = "13px Arial";
    ctx.fillStyle = "#ac91a4";
    ctx.textAlign = "right";
    ctx.fillText(
      side === "p1" ? "Shift · Z X C · R" : "Стрелки · Num 1 2 3",
      x + w - 18,
      y + 25,
    );
    const viewport = { x: x + 16, y: top, w: w - 42, h: viewHeight };
    panels[side] = viewport;
    scroll[side] = clamp(scroll[side]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.x, viewport.y, viewport.w, viewport.h);
    ctx.clip();
    ROSTER.forEach((c, i) => {
      const cy = top + i * rowHeight - scroll[side],
        cx = x + 16,
        cw = w - 42,
        ch = rowHeight - 5;
      if (cy + ch <= top || cy >= top + viewHeight) return;
      const selected = id === c.id;
      ctx.save();
      if (selected) {
        ctx.shadowColor = "#a550df";
        ctx.shadowBlur = 12;
      }
      frame(
        ctx,
        cx,
        cy,
        cw,
        ch,
        selected ? "#b37bd2" : "#5b485c",
        selected ? "#2c1b37ee" : "#11121ce8",
      );
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx + 5, cy + 5, cw - 10, ch - 10);
      ctx.clip();
      if (images?.selectionReference && i < 6) {
        ctx.globalAlpha = 0.47;
        ctx.drawImage(
          images.selectionReference,
          630,
          247 + i * 70,
          120,
          55,
          cx + 190,
          cy + 5,
          cw - 195,
          ch - 10,
        );
        ctx.globalAlpha = 1;
        const shade = ctx.createLinearGradient(cx + 170, 0, cx + cw - 35, 0);
        shade.addColorStop(0, "#11121c");
        shade.addColorStop(1, "#11121c00");
        ctx.fillStyle = shade;
        ctx.fillRect(cx + 170, cy + 5, cw - 175, ch - 10);
      }
      ctx.restore();
      if (!drawClothFlag(ctx, images, c.id, cx + 12, cy + 12, 48, 36))
        g[c.flag](cx + 12, cy + 13, 45, 29);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "bold 23px Impact,Arial";
      ctx.fillStyle = c.accent;
      ctx.fillText(c.name, cx + 70, cy + 21);
      ctx.fillStyle = "#d1c4c8";
      ctx.font = "12px Arial";
      ctx.fillText(c.teaser, cx + 70, cy + 45);
      const visibleY = Math.max(cy, top),
        visibleBottom = Math.min(cy + ch, top + viewHeight);
      g.buttons[side + c.key] = {
        x: cx,
        y: visibleY,
        w: cw,
        h: visibleBottom - visibleY,
        charId: c.id,
      };
      const q = { x: cx + cw - 39, y: cy + 15, w: 27, h: 31 };
      frame(ctx, q.x, q.y, q.w, q.h, "#ae8c8a", "#101018");
      ctx.fillStyle = "#dfc4b7";
      ctx.font = "bold 23px Arial";
      ctx.textAlign = "center";
      ctx.fillText("?", q.x + q.w / 2, q.y + q.h / 2);
      if (q.y >= top && q.y + q.h <= top + viewHeight)
        g.buttons[
          "info_" +
            (side === "p1" ? "P1" : g.game.mode === "pve" ? "P2 (ИИ)" : "P2") +
            "_" +
            c.id
        ] = { ...q, side: side === "p1" ? "P1" : "P2", charId: c.id };
    });
    ctx.restore();
    const track = { x: x + w - 20, y: top, w: 7, h: viewHeight };
    ctx.fillStyle = "#0b0911";
    ctx.fillRect(track.x, track.y, track.w, track.h);
    const thumbHeight = Math.max(
      36,
      viewHeight * Math.min(1, viewHeight / (ROSTER.length * rowHeight)),
    );
    const thumb = {
      x: track.x,
      y:
        top +
        (maximum()
          ? (scroll[side] / maximum()) * (viewHeight - thumbHeight)
          : 0),
      w: 7,
      h: thumbHeight,
    };
    ctx.fillStyle = maximum() ? "#967197" : "#39313c";
    ctx.fillRect(thumb.x, thumb.y, thumb.w, thumb.h);
    panels[side] = { ...viewport, track, thumb };
    ctx.textAlign = "center";
    ctx.fillStyle = "#c9b2b3";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Выбрано: " + g.sbName(id), x + w / 2, y + h - 29);
  }
  g.drawSelectScreen = () => {
    const { ctx, W, H } = g;
    for (const id of Object.keys(g.buttons)) delete g.buttons[id];
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#100d16";
    ctx.fillRect(0, 0, W, H);
    if (images?.selectionBackground)
      ctx.drawImage(images.selectionBackground, 0, 0, W, H);
    ctx.fillStyle = "#d0a8ad";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic bold 57px Impact,Arial";
    ctx.shadowColor = "#391625";
    ctx.shadowBlur = 6;
    ctx.fillText("ВЫБОР ПЕРСОНАЖА", W / 2, 94);
    ctx.shadowBlur = 0;
    panel(W / 2 - 540, 165, "p1", g.selections.p1);
    if (g.game.mode === "practice") {
      const x = W / 2 + 20;
      frame(ctx, x, 165, 520, 520);
      ctx.fillStyle = "#c5afb1";
      ctx.font = "bold 31px Impact,Arial";
      ctx.fillText("МАНЕКЕН", x + 260, 210);
      drawTrainingDummy(ctx, x + 260, 590, 1.4);
      ctx.font = "16px Arial";
      ctx.fillText("Фиксированный противник полигона", x + 260, 650);
      delete panels.p2;
    } else panel(W / 2 + 20, 165, "p2", g.selections.p2);
    if (g.game.mode === "pve") {
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = "#b6a1ac";
      ctx.textAlign = "right";
      ctx.fillText("СЛОЖНОСТЬ", W / 2 - 200, 720);
      for (const [i, d] of ["easy", "medium", "hard"].entries()) {
        const b = { x: W / 2 - 180 + i * 140, y: 701, w: 128, h: 35 };
        frame(
          ctx,
          b.x,
          b.y,
          b.w,
          b.h,
          g.game.difficulty === d ? "#ad72c5" : "#625364",
        );
        ctx.fillStyle = g.game.difficulty === d ? "#edcee9" : "#bdaab8";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          { easy: "ЛЕГКО", medium: "СРЕДНЕ", hard: "СЛОЖНО" }[d],
          b.x + b.w / 2,
          b.y + b.h / 2,
        );
        g.buttons["diff_" + d] = b;
      }
    }
    for (const [id, x, y, w, h, label, color] of [
      ["start", W / 2 - 245, 757, 490, 62, "▶ НАЧАТЬ МАТЧ", "#b782c9"],
      ["back", W / 2 - 125, 842, 250, 43, "← НАЗАД", "#b46c78"],
    ]) {
      frame(ctx, x, y, w, h, color, "#201525ed");
      ctx.fillStyle = color;
      ctx.font = "italic bold 28px Impact,Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + w / 2, y + h / 2);
      g.buttons[id] = { x, y, w, h };
    }
    if (g.game.infoPanel) g.sbDrawInfoPanel();
    ctx.restore();
  };
  g.sbDrawInfoPanel = () => {
    const { ctx, W, H } = g,
      info = g.game.infoPanel,
      data = g.sbDescription(info.charId),
      x = W / 2 - 350,
      y = 130,
      w = 700,
      h = 630;
    ctx.save();
    ctx.fillStyle = "#05030ab8";
    ctx.fillRect(0, 0, W, H);
    frame(ctx, x, y, w, h, "#92729d", "#17131ff5");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 28px Impact,Arial";
    ctx.fillStyle = "#d0acbf";
    ctx.fillText(g.sbName(info.charId) + " · СПОСОБНОСТИ", x + 28, y + 25);
    let yy = y + 80;
    const wrap = (text, max) => {
      let line = "";
      const lines = [];
      for (const word of text.split(" ")) {
        const next = line ? line + " " + word : word;
        if (ctx.measureText(next).width > max && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      if (line) lines.push(line);
      return lines;
    };
    for (const [title, description] of [
      ...data.skills,
      ["УЛЬТИМЕЙТ", data.ult],
    ]) {
      ctx.font = "bold 17px Arial";
      ctx.fillStyle = "#c696ca";
      ctx.fillText(title, x + 28, yy);
      yy += 27;
      ctx.font = "15px Arial";
      ctx.fillStyle = "#c6b8c6";
      for (const line of wrap(description, w - 56)) {
        ctx.fillText(line, x + 28, yy);
        yy += 21;
      }
      yy += 18;
    }
    ctx.textAlign = "center";
    ctx.font = "13px Arial";
    ctx.fillStyle = "#998899";
    ctx.fillText("КЛИК — ЗАКРЫТЬ", W / 2, y + h - 30);
    ctx.restore();
  };
  g.attachSelectionScroll = () => {
    const point = (e) => {
      const r = g.canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * g.W,
        y: ((e.clientY - r.top) / r.height) * g.H,
      };
    };
    g.canvas.addEventListener(
      "wheel",
      (e) => {
        if (g.game.state !== "select" || g.game.infoPanel) return;
        const p = point(e);
        for (const side of ["p1", "p2"])
          if (panels[side] && contains(p.x, p.y, panels[side])) {
            e.preventDefault();
            scroll[side] = clamp(
              scroll[side] + e.deltaY * (e.deltaMode === 1 ? 20 : 1),
            );
            g.render();
            return;
          }
      },
      { passive: false },
    );
    g.canvas.addEventListener("pointerdown", (e) => {
      if (
        e.button !== 0 ||
        g.game.state !== "select" ||
        g.game.infoPanel ||
        !maximum()
      )
        return;
      const p = point(e);
      for (const side of ["p1", "p2"]) {
        const panel = panels[side];
        if (
          panel &&
          contains(p.x, p.y, { ...panel.track, x: panel.track.x - 7, w: 21 })
        ) {
          drag = { side, y: p.y, scroll: scroll[side] };
        }
      }
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = point(e),
        panel = panels[drag.side];
      scroll[drag.side] = clamp(
        drag.scroll +
          ((p.y - drag.y) * maximum()) / (viewHeight - panel.thumb.h),
      );
      g.render();
    });
    window.addEventListener("pointerup", () => {
      drag = null;
    });
    window.addEventListener("blur", () => {
      drag = null;
    });
  };
}
