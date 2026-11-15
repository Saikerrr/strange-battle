const codes = {
  ukraine: "ua",
  russia: "ru",
  america: "us",
  china: "cn",
  japan: "jp",
  afghanistan: "af",
};

// Accurate SVG designs remain intact. Cloth is a rendering effect, not painted symbols.
export function drawClothFlag(ctx, images, id, x, y, w = 48, h = 36) {
  const image = images?.["flag_" + codes[id]];
  if (!image) return false;
  const width = image.naturalWidth || image.width,
    height = image.naturalHeight || image.height,
    strips = 32;
  ctx.save();
  ctx.shadowColor = "#000b";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 2;
  // One shadow for the whole flag; per-strip shadows darken their neighbours.
  ctx.drawImage(image, x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  for (let i = 0; i < strips; i++) {
    const t = i / strips,
      fold =
        Math.sin(t * Math.PI * 4.4 + 0.35) * 1.3 +
        Math.sin(t * Math.PI * 2) * 0.5;
    ctx.drawImage(
      image,
      width * t,
      0,
      width / strips + 0.2,
      height,
      x + w * t,
      y + fold,
      w / strips + 0.4,
      h,
    );
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  for (let i = 0; i < strips; i++) {
    const t = i / strips,
      fold =
        Math.sin(t * Math.PI * 4.4 + 0.35) * 1.3 +
        Math.sin(t * Math.PI * 2) * 0.5;
    const light = Math.cos(t * Math.PI * 4.4 + 0.35);
    ctx.fillStyle =
      light > 0
        ? `rgba(255,240,221,${light * 0.16})`
        : `rgba(12,8,20,${-light * 0.3})`;
    ctx.fillRect(x + w * t, y + fold, w / strips + 0.4, h);
  }
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#ded6ca";
  for (let yy = y + 3; yy < y + h; yy += 3) ctx.fillRect(x, yy, w, 0.45);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#e2d9cb";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 2);
  ctx.lineTo(x + 1, y + h - 2);
  ctx.stroke();
  ctx.restore();
  return true;
}
