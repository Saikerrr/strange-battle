export function drawRig(ctx, texture, rig, pose, x, y, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  const order = rig.parts
    .map((_, i) => i)
    .sort(
      (a, b) =>
        (pose[a][4] ?? rig.parts[a].layer) - (pose[b][4] ?? rig.parts[b].layer),
    );
  for (const i of order) {
    const part = rig.parts[i],
      [ax, ay, bx, by] = pose[i];
    const [sx, sy, sw, sh] = part.uv,
      length = Math.hypot(bx - ax, by - ay);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(Math.atan2(by - ay, bx - ax) - Math.PI / 2);
    ctx.drawImage(
      texture,
      sx,
      sy,
      sw,
      sh,
      -part.width * part.pivot,
      -part.overlap,
      part.width,
      length + part.overlap * 2,
    );
    ctx.restore();
  }
  ctx.restore();
}
