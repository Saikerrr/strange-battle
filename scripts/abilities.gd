extends RefCounted

var arena
var objects: Array[Dictionary] = []
const COLOR := {
    "ukraine": Color("#63c8ff"), "russia": Color("#ff514f"),
    "america": Color("#e2edff"), "china": Color("#ffb752"),
    "japan": Color("#dbabff"), "afghanistan": Color("#a1df63"),
}

func _init(world) -> void:
    arena = world

func make(kind: String, f, target, p: Vector2, velocity: Vector2, life: float, amount: float, radius: float, status := "") -> Dictionary:
    var item := {
        "kind": kind, "owner": f, "target": target, "p": p, "v": velocity,
        "life": life, "max_life": life, "amount": amount, "radius": radius,
        "status": status, "color": COLOR.get(f.profile.id, Color.WHITE), "clock": 0.0,
    }
    objects.append(item)
    return item

func shot(kind: String, f, target, speed: float, amount: float, radius := 31.0, status := "", y := 0.0) -> Dictionary:
    return make(kind, f, target, f.center() + Vector2(f.facing * 44, y), Vector2(speed * f.facing, 0), 2.5, amount, radius, status)

func spread(kind: String, f, target, count: int, impact: float, radius: float) -> void:
    for i in range(count):
        var offset := (i - (count - 1) * 0.5) * (96.0 if count == 5 else 47.0)
        make(kind, f, target, Vector2(target.position.x + offset, 185.0 - i * 34.0), Vector2(0, 600.0 + i * 11.0), 3.0, impact, radius)

func area(f, target, p: Vector2, radius: float, amount: float, status := "") -> bool:
    arena.burst(p, COLOR.get(f.profile.id, Color.WHITE), 17, radius)
    if p.distance_to(target.center()) <= radius and target.hit(amount, signf(target.position.x - p.x), 330.0, f):
        apply_status(target, status)
        return true
    return false

func apply_status(target, status: String) -> void:
    match status:
        "silence": target.silenced = 3.0
        "root": target.rooted = 2.0
        "stun": target.stun = maxf(target.stun, 0.6)
        "burn": target.burn = 2.0

func use(f, target, id: String, empowered: bool, power := 0.0) -> void:
    f.cast = 0.2
    arena.burst(f.center(), COLOR.get(f.profile.id, Color.WHITE), 5)
    match id:
        "drone":
            var drone := make("drone", f, target, f.center() - Vector2(0, 135), Vector2.ZERO, 4.2, 3, 25)
            drone.empowered = empowered
        "missile":
            var rocket := shot("missile", f, target, 480, 20, 36)
            rocket.empowered = empowered
            if empowered:
                var extra := shot("missile", f, target, 385, 20, 36, "", -85)
                extra.empowered = true
        "bombs":
            if empowered:
                make("grave", f, target, f.position + Vector2(f.facing * 150, -28), Vector2.ZERO, 5, 5, 44)
            else:
                spread("falling", f, target, 5, 15, 105)
        "blockade":
            shot("blockade", f, target, 740, 10 if empowered else 5, 54 if empowered else 34, "silence")
        "bear":
            var bear := shot("bear", f, target, 580, 16 if empowered else 10, 62, "stun", 31)
            bear.life = 1.7
        "uppercut":
            if empowered:
                make("homing_bomb", f, target, target.center() - Vector2(0, 330), Vector2(0, 560), 2.0, 15, 120)
            else:
                var swing := make("swing", f, target, f.center(), Vector2.ZERO, 0.5, 15, 145)
                swing.interruptible = true
                f.cast = 0.62
        "flag":
            shot("flag", f, target, 920, 18 if empowered else 12, 65 if empowered else 35)
        "eagle":
            make("eagle", f, target, target.center() + Vector2(-190, -255), Vector2(500, 500), 2, 10, 42)
            if empowered:
                make("eagle", f, target, target.center() + Vector2(200, -290), Vector2(-490, 500), 2, 10, 55)
        "burger":
            if empowered:
                var shield := shot("shield", f, target, 780, 12, 53)
                shield.returning = false
            else:
                var meal := make("meal", f, target, f.center(), Vector2.ZERO, 1.1, 7, 25)
                meal.interruptible = true
                f.cast = 1.12
        "noodle":
            if empowered:
                area(f, target, f.center() + Vector2(f.facing * 115, 0), 184, 15, "burn")
            elif not f.counters.has("noodle"):
                f.counters.noodle = 5
            else:
                shot("noodle", f, target, 660, 4, 25)
                f.counters.noodle -= 1
                if f.counters.noodle == 0:
                    f.counters.erase("noodle")
                    f.cooldowns.noodle = 15.0
        "firework":
            if empowered:
                area(f, target, f.center(), 208, 12, "stun")
            else:
                var fire := shot("firework", f, target, 590, 10, 35)
                fire.life = 0.65
        "lantern":
            if empowered:
                var grab := make("dragon_grab", f, target, f.center(), Vector2.ZERO, 1.4, 10, 100)
                grab.interruptible = true
                grab.caught = false
            else:
                make("lantern", f, target, f.center() + Vector2(f.facing * 145, -40), Vector2.ZERO, 4.0, 4, 300)
        "stance":
            var move := make("stance", f, target, f.center(), Vector2.ZERO, 0.5, 15, 265)
            move.empowered = empowered
            move.interruptible = true
            f.cast = 0.6
        "parry":
            f.cast = 0.0
            f.parry = 0.50
        "astral":
            f.cast = 0.0
            f.astral = 0.0 if f.astral > 0.0 else (2.6 if empowered else 2.0)
            if f.astral > 0.0 and empowered:
                arena.ghost_strike(f, target)
        "c4":
            if empowered:
                spread("grenade", f, target, 12, 10, 92)
            else:
                var bombs := objects.filter(func(obj): return obj.kind == "c4" and obj.owner == f)
                if bombs.size() >= 5:
                    objects.erase(bombs[0])
                var bomb := make("c4", f, target, f.center(), Vector2(f.facing * lerpf(180, 780, power), -360.0), 1800, 15, 150)
                bomb.armed = false
        "rifle":
            var gun := make("rifle", f, target, f.center(), Vector2.ZERO, 1.52 if empowered else 0.46, 2 if empowered else 5, 12)
            gun.remaining = 15 if empowered else 5
            gun.interval = 0.10 if empowered else 0.09
            gun.interruptible = true
            f.cast = gun.life
        "net":
            if empowered:
                make("plane", f, target, target.center() + Vector2(-410, -330), Vector2(740, 530), 2, 30, 142)
            else:
                shot("net", f, target, 680, 3, 44, "root")

func detonate(f) -> void:
    for bomb in objects.duplicate():
        if bomb.kind != "c4" or bomb.owner != f:
            continue
        var point: Vector2 = bomb.p
        area(f, bomb.target, point, 150, 15)
        if f.center().distance_to(point) < 150:
            f.motion = Vector2(560.0 * (1.0 if f.position.x >= point.x else -1.0), -290.0)
        objects.erase(bomb)

func interrupt(f) -> void:
    for item in objects.duplicate():
        if item.owner == f and item.get("interruptible", false):
            objects.erase(item)

func step(dt: float) -> void:
    for item in objects.duplicate():
        if not objects.has(item):
            continue
        item.life -= dt
        item.clock -= dt
        var owner = item.owner
        var target = item.target
        var point: Vector2 = item.p
        var delta: Vector2 = target.center() - point
        match item.kind:
            "drone":
                var desired: Vector2 = target.center() + Vector2(-owner.facing * 140, -135)
                var diving: bool = item.empowered and item.life <= 0.48
                if diving:
                    desired = target.center()
                item.p = point.move_toward(desired, dt * (720.0 if diving else 300.0))
                if item.clock <= 0:
                    item.clock = 0.56
                    var direction := delta.normalized()
                    make("bolt", owner, target, point, direction * 720, 1.3, 3, 21)
                if item.life <= 0 and item.empowered:
                    area(owner, target, item.p, 190, 12)
            "bear_carry":
                item.p.x = clampf(point.x + item.v.x * dt, 90.0, 3510.0)
                if not target.dummy:
                    target.position.x = item.p.x
                    target.motion = Vector2.ZERO
                    target.stun = maxf(target.stun, 0.1)
                    if item.life <= 0.0:
                        target.motion = Vector2(signf(item.v.x) * 470.0, -280.0)
            "grave", "lantern":
                if item.clock <= 0:
                    item.clock = 0.78
                    if item.kind == "grave":
                        make("zombie", owner, target, point - Vector2(0, 30), Vector2(390 * signf(delta.x), 0), 2.0, 5, 41)
                    elif delta.length() <= item.radius:
                        make("bolt", owner, target, point, delta.normalized() * 680, 0.65, 4, 23)
            "meal", "rifle":
                item.p = owner.center()
                if item.clock <= 0:
                    if item.kind == "meal":
                        item.clock = 0.44
                        owner.hp = minf(owner.capacity, owner.hp + item.amount)
                        arena.burst(owner.center(), Color("#79f6a6"), 6)
                    elif item.remaining > 0:
                        item.clock = item.interval
                        item.remaining -= 1
                        shot("bullet", owner, target, 1500, item.amount, 18)
                if item.kind == "rifle" and item.remaining <= 0:
                    item.life = 0.0
            "swing", "stance":
                item.p = owner.center() + Vector2(owner.facing * 46.0, 0.0)
                if item.life <= 0:
                    if item.kind == "swing":
                        if delta.x * owner.facing >= -28:
                            area(owner, target, item.p, 145, 15)
                    else:
                        var direction: float = owner.facing
                        var start: Vector2 = owner.center()
                        owner.position.x = clampf(owner.position.x + direction * 275, 90.0, 3510.0)
                        if delta.x * direction > -28 and absf(delta.x) < 306 and absf(delta.y) < 112:
                            target.hit(15, direction, 410, owner, true)
                            if item.empowered:
                                arena.ghost_strike(owner, target)
                        arena.burst(start, item.color, 16)
            "dragon_grab":
                item.p = owner.center() + Vector2(owner.facing * 45.0, 0.0)
                if not item.caught and delta.length() < 125 and target.hit(10, owner.facing, 0, owner):
                    item.caught = not target.blocking
                if item.caught:
                    target.stun = maxf(target.stun, 0.12)
                    target.motion = Vector2.ZERO
                    target.position = owner.position + Vector2(owner.facing * 85.0, -13.0)
                    if item.life <= 0:
                        area(owner, target, target.center(), 150, 15)
            "c4":
                if not item.armed:
                    item.v.y += 1040 * dt
                    item.p = point + item.v * dt
                    if item.p.y >= 742:
                        item.p.y = 742
                        item.v = Vector2.ZERO
                        item.armed = true
            _:
                move_attack(item, target, delta, dt)
        if item.life <= 0:
            objects.erase(item)

func move_attack(item: Dictionary, target, delta: Vector2, dt: float) -> void:
    var owner = item.owner
    if item.kind in ["missile", "eagle", "homing_bomb"]:
        var speed: float = item.v.length()
        item.v = item.v.lerp(delta.normalized() * speed, minf(dt * 3.8, 1.0))
    if item.kind == "shield" and (item.returning or item.life < 1.6):
        item.returning = true
        var back: Vector2 = owner.center() - item.p
        item.v = back.normalized() * 870
        if back.length() < 60:
            item.life = 0.0
        item.p += item.v * dt
        return
    var before: Vector2 = item.p
    item.p += item.v * dt
    var closest := Geometry2D.get_closest_point_to_segment(target.center(), before, item.p)
    var distance: float = target.center().distance_to(closest)
    if item.kind in ["falling", "grenade", "homing_bomb", "plane", "firework"]:
        var proximity: float = minf(item.radius, 76.0)
        if distance < proximity or item.p.y >= 748 or item.life <= 0:
            area(owner, target, Vector2(item.p.x, minf(item.p.y, 710.0)), 180 if item.kind == "firework" else item.radius, item.amount)
            item.life = 0.0
    elif distance <= item.radius + 27.0:
        var direction: float = signf(item.v.x)
        if target.hit(item.amount, direction, 240.0, owner):
            apply_status(target, item.status)
            if item.kind == "missile" and item.get("empowered", false):
                owner.hp = minf(owner.capacity, owner.hp + 7.0)
            if item.kind == "bear" and not target.blocking:
                item.kind = "bear_carry"
                item.p = target.center()
                item.v = Vector2(direction * 830.0, 0.0)
                item.life = 0.55
                return
        if item.kind == "shield":
            item.returning = true
        else:
            item.life = 0.0
