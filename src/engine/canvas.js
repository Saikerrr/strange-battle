// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.resize_base = function () {
    const a = sbContext.W / sbContext.H;
    let w = innerWidth,
      h = innerHeight;
    if (w / h > a) w = h * a;
    else h = w / a;
    sbContext.canvas.style.position = "absolute";
    sbContext.canvas.style.width = w + "px";
    sbContext.canvas.style.height = h + "px";
    sbContext.canvas.style.left = (innerWidth - w) / 2 + "px";
    sbContext.canvas.style.top = (innerHeight - h) / 2 + "px";
  };
}
