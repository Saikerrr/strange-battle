extends Node2D

const KITS := [
    [["Импульс", 1.9], ["Прорыв", 3.2], ["Разряд", 4.7]],
    [["Уголёк", 2.2], ["Комета", 3.8], ["Кольцо", 5.0]],
]

var arena
var effects: Array[Dictionary] = []

func launch(f, slot: int) -> bool:
    if f.attack >= 0 or f.stun > 0 or f.guard or f.cast_time > 0 or f.cooldowns[slot] > 0 or f.hp <= 0:
        return false
    var kind: int = f.variant * 3 + slot
    var direction: float = f.facing
    var origin: Vector2 = f.position
    var spot := origin
    var speed := Vector2.ZERO
    var duration := 0.85
    var lock := 0.28
    match kind:
        0:
            spot += Vector2(direction * 58, -115)
            speed.x = direction * 780
            duration = 1.3
        1:
            f.motion.x = direction * 800
            lock = 0.30
            duration = 0.31
        2:
            spot += Vector2(direction * 160, -86)
            duration = 0.70
            lock = 0.48
        3:
            spot += Vector2(direction * 52, -114)
            speed = Vector2(direction * 525, -85)
            duration = 1.55
        4:
            f.motion = Vector2(direction * 370, -600)
            f.floor_y = -1
            lock = 0.68
            duration = 0.92
        5:
            spot.y -= 25
            duration = 0.78
            lock = 0.46
    if kind not in [1, 4]:
        f.motion.x *= 0.18
    f.cast_slot = slot
    f.cast_time = lock
    f.cooldowns[slot] = KITS[f.variant][slot][1]
    effects.append({"kind": kind, "owner": f, "p": spot, "v": speed, "direction": direction,
        "time": 0.0, "duration": duration, "hit": false, "landed": false})
    return true

func clear() -> void:
    effects.clear()
    queue_redraw()

func step(dt: float) -> void:
    for effect in effects:
        var f = effect.owner
        var target = arena.fighters[1 - f.variant]
        var previous: Vector2 = effect.p
        effect.time += dt
        var target_body: Vector2 = target.world_point(target.pose.hip) - Vector2(0, 22)
        match effect.kind:
            0, 3:
                if effect.kind == 3:
                    effect.v.y += dt * 185.0
                effect.p += effect.v * dt
                var close := Geometry2D.get_closest_point_to_segment(target_body, previous, effect.p)
                if not effect.hit and close.distance_to(target_body) <= (38.0 if effect.kind == 0 else 48.0):
                    strike(effect, target, 11.0 if effect.kind == 0 else 14.0, 275, 0)
                    effect.duration = minf(effect.duration, effect.time + 0.085)
                    effect.v = Vector2.ZERO
            1:
                effect.p = f.position + Vector2(effect.direction * 59, -93)
                if f.cast_time <= 0 and not effect.hit:
                    effect.duration = minf(effect.duration, effect.time + 0.045)
                elif not effect.hit and absf(target_body.y - effect.p.y) < 66 and absf(target_body.x - effect.p.x) < 57:
                    strike(effect, target, 13, 470, 0)
            2:
                var foot_gap: Vector2 = target.position - Vector2(effect.p.x, effect.p.y + 86)
                if effect.time >= 0.32 and effect.time <= 0.52 and not effect.hit and absf(foot_gap.x) < 72 and absf(foot_gap.y) < 142:
                    strike(effect, target, 18, 325, 485)
            4:
                if not effect.landed:
                    if f.stun > 0:
                        effect.duration = effect.time
                        continue
                    effect.p = f.position + Vector2(0, -23)
                    if effect.time > 0.24 and f.grounded():
                        effect.landed = true
                        effect.duration = effect.time + 0.30
                        f.cast_time = maxf(f.cast_time, 0.18)
                        if absf(target.position.y - f.position.y) < 80 and absf(target.position.x - f.position.x) < 146:
                            strike(effect, target, 17, 420, 270)
            5:
                var radius := clampf((effect.time - 0.23) / 0.33, 0, 1) * 255
                var gap: Vector2 = target.position - (effect.p + Vector2(0, 25))
                if not effect.hit and radius > 0 and absf(gap.y) < 64 and absf(gap.x) <= radius:
                    strike(effect, target, 16, 495, 70)
    effects.assign(effects.filter(func(effect): return effect.time < effect.duration))
    queue_redraw()

func strike(effect: Dictionary, target, damage: float, push: float, lift: float) -> void:
    if target.hp <= 0:
        return
    effect.hit = true
    var direction := 1.0 if target.position.x >= effect.p.x else -1.0
    if effect.kind in [0, 1, 3]:
        direction = effect.direction
    var protected: bool = target.guard and target.facing * direction < 0
    var hit := {"point": target.world_point(target.pose.hip) - Vector2(0, 25),
        "damage": damage, "push": push, "lift": lift, "direction": direction, "blocked": protected}
    target.receive(hit)
    arena.feedback(hit, effect.owner.tint)

func _draw() -> void:
    for effect in effects:
        var p: Vector2 = effect.p
        var direction: float = effect.direction
        var t: float = effect.time
        var color: Color = effect.owner.tint
        var white := color.lightened(0.70)
        match effect.kind:
            0:
                var tail := p - Vector2(direction * 96, 0)
                draw_line(tail, p, Color(color, 0.16), 28, true)
                draw_line(tail.lerp(p, 0.44), p, color, 8, true)
                draw_circle(p, 9, white, true, -1, true)
                draw_arc(p, 18 + sin(t * 40) * 3, -1.2, 1.2, 19, color, 2, true)
            1:
                for i in range(4):
                    var start := p - Vector2(direction * (173 - i * 28), 37 - i * 23)
                    draw_line(start, p + Vector2(direction * 28, (i - 1.5) * 17), Color(color, 0.24 + i * 0.12), 3.0 + i, true)
                draw_arc(p - Vector2(direction * 25, 8), 46, -1.2, 1.3, 32, white, 3, true)
            2:
                var boot := p + Vector2(0, 86)
                if t < 0.32:
                    draw_line(boot - Vector2(66, 0), boot + Vector2(66, 0), Color(color, 0.6), 3, true)
                    draw_line(boot, boot - Vector2(0, 210), Color(color, t * 0.85), 2, true)
                else:
                    var fade := clampf((0.70 - t) / 0.38, 0.0, 1.0)
                    for i in range(3):
                        var path := PackedVector2Array()
                        for point in range(8):
                            var x := sin(float(point * 7 + i * 8) + t * 36) * (12 + 8 * i)
                            path.append(boot + Vector2(x, -point * 37))
                        draw_polyline(path, Color(color, 0.25 * fade), 12 - i * 2, true)
                        draw_polyline(path, Color(white, fade), 2.0, true)
            3:
                draw_circle(p, 36, Color(color, 0.14), true, -1, true)
                draw_line(p - Vector2(direction * 68, 11), p, Color(color, 0.44), 15, true)
                draw_circle(p, 19, color, true, -1, true)
                draw_circle(p, 11, white, true, -1, true)
                draw_arc(p, 24, t * 11, t * 11 + 3.7, 20, white, 2.5, true)
            4:
                if effect.landed:
                    var radius: float = 37.0 + (0.30 - (effect.duration - t)) * 400.0
                    draw_set_transform(p, 0, Vector2(1, 0.33))
                    draw_arc(Vector2.ZERO, radius, 0, TAU, 40, Color(color, (effect.duration - t) * 2.7), 7, true)
                    draw_set_transform(Vector2.ZERO)
                else:
                    draw_line(p - Vector2(direction * 77, 81), p, Color(color, 0.27), 23, true)
                    draw_line(p - Vector2(direction * 48, 53), p, color, 5, true)
            5:
                var radius := maxf(13, clampf((t - 0.23) / 0.33, 0, 1) * 255)
                draw_set_transform(p, 0, Vector2(1, 0.25))
                draw_arc(Vector2.ZERO, radius, 0, TAU, 56, Color(color, clampf((0.78 - t) * 2, 0, 0.77)), 9, true)
                draw_arc(Vector2.ZERO, radius * 0.84, 0, TAU, 56, Color(white, clampf((0.75 - t) * 1.7, 0, 0.72)), 3, true)
                draw_set_transform(Vector2.ZERO)
