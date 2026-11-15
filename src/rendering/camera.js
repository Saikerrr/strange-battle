// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.updateCamera_base = function (dt) {
    const midX = (sbContext.p1.x + sbContext.p2.x) / 2;
    const dist = Math.abs(sbContext.p1.x - sbContext.p2.x);
    let desiredZoom = 1;
    if (dist > 800) desiredZoom = Math.max(0.45, 1 - (dist - 800) / 2400);
    sbContext.camera.zoom +=
      (desiredZoom - sbContext.camera.zoom) * Math.min(1, dt * 2.5);
    const halfViewW = sbContext.W / sbContext.camera.zoom / 2;
    const camMinX = sbContext.ARENA_LEFT + halfViewW;
    const camMaxX = sbContext.ARENA_RIGHT - halfViewW;
    let targetX;
    if (camMinX < camMaxX) targetX = Math.max(camMinX, Math.min(camMaxX, midX));
    else targetX = (sbContext.ARENA_LEFT + sbContext.ARENA_RIGHT) / 2;
    sbContext.camera.x += (targetX - sbContext.camera.x) * Math.min(1, dt * 6);
    sbContext.camera.y = 400;
  };
}
