// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.limbEnd_base = function (x, y, a, l) {
    return { x: x + Math.cos(a) * l, y: y + Math.sin(a) * l };
  };

  sbContext.circleOverlap_base = function (a, b) {
    const dx = a.x - b.x,
      dy = a.y - b.y,
      r = a.r + b.r;
    return dx * dx + dy * dy <= r * r;
  };

  sbContext.sbSparkText_arena = function (x, y, text, color = "#ffffff") {
    sbContext.particles.push({
      x,
      y,
      vx: 0,
      vy: -42,
      life: 1,
      maxLife: 1,
      color,
      size: 20,
      isText: true,
      text,
    });
  };
}
