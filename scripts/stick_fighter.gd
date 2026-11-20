extends Node2D

const FLOOR := 680.0
const MIN_X := 105.0
const MAX_X := 2455.0
# Startup, active, recovery, damage, push, lift.
const MOVES := [
    [0.09, 0.08, 0.19, 8.0, 210.0, 0.0],
    [0.15, 0.10, 0.26, 13.0, 365.0, 0.0],
    [0.24, 0.11, 0.34, 19.0, 545.0, 360.0],
]

var tint := Color.WHITE
var variant := 0
var floor_y := FLOOR
var drop_time := 0.0
var cast_time := 0.0
var cast_slot := -1
var cooldowns := [0.0, 0.0, 0.0]
var hp := 100.0
var facing := 1.0
var motion := Vector2.ZERO
var attack := -1
var phase := 0.0
var contact := false
var stun := 0.0
var guard := false
var dash := 0.0
var dash_cd := 0.0
var buffered := -1
var buffer := 0.0
var gait := 0.0
var age := 0.0
var flash := 0.0
var victory := false
var pose: Dictionary = {}

func reset(at: float, direction: float) -> void:
    position = Vector2(at, FLOOR)
    facing = direction
    hp = 100
    motion = Vector2.ZERO
    attack = -1
    buffered = -1
    stun = 0
    guard = false
    dash = 0
    dash_cd = 0
    buffer = 0
    flash = 0
    victory = false
    floor_y = FLOOR
    drop_time = 0
    cast_time = 0
    cast_slot = -1
    cooldowns = [0.0, 0.0, 0.0]
    refresh_pose()

func grounded() -> bool:
    return floor_y >= 0 and absf(position.y - floor_y) < 1.0

func step(dt: float, input: Dictionary, enemy_x: float, platforms: Array) -> void:
    age += dt
    stun = maxf(stun - dt, 0)
    dash = maxf(dash - dt, 0)
    dash_cd = maxf(dash_cd - dt, 0)
    flash = maxf(flash - dt, 0)
    buffer = maxf(buffer - dt, 0)
    cast_time = maxf(cast_time - dt, 0)
    drop_time = maxf(drop_time - dt, 0)
    for slot in range(3):
        cooldowns[slot] = maxf(cooldowns[slot] - dt, 0)
    var on_surface := grounded()
    var move: float = input.get("move", 0)
    if input.has("attack"):
        buffered = input.attack
        buffer = 0.17
    if attack < 0 and dash <= 0 and stun <= 0 and cast_time <= 0:
        facing = 1.0 if position.x <= enemy_x else -1.0
    guard = bool(input.get("guard", false)) and on_surface and stun <= 0 and dash <= 0 and attack < 0 and cast_time <= 0
    if hp > 0 and stun <= 0 and cast_time <= 0:
        if input.get("jump", false) and on_surface and attack < 0:
            if guard and floor_y < FLOOR:
                drop_time = 0.22
                position.y += 4
                motion.y = 100
                guard = false
            elif not guard:
                motion.y = -830
        if input.get("drop", false) and on_surface and floor_y < FLOOR:
            drop_time = 0.22
            position.y += 4
            motion.y = 100
            guard = false
        if input.get("dash", false) and dash_cd <= 0 and attack < 0 and not guard:
            dash = 0.13
            dash_cd = 0.62
            motion.x = (move if move != 0 else facing) * 970
        var follow_up: bool = attack >= 0 and contact and buffered == attack + 1 and phase >= MOVES[attack][0] + MOVES[attack][1]
        if buffer > 0 and dash <= 0 and not guard and (attack < 0 or follow_up):
            attack = buffered
            phase = 0
            buffer = 0
            contact = false
            motion.x *= 0.35
        if dash <= 0:
            var target_speed := move * (155.0 if guard else 390.0) if attack < 0 else 0.0
            motion.x = move_toward(motion.x, target_speed, dt * (3200.0 if on_surface else 1800.0))
    elif cast_time <= 0 or stun > 0:
        motion.x = move_toward(motion.x, 0, dt * 1120)
    if attack >= 0:
        phase += dt
        var move_data: Array = MOVES[attack]
        if phase >= move_data[0] + move_data[1] + move_data[2]:
            attack = -1
    var last_y := position.y
    motion.y += 2320.0 * dt
    position += motion * dt
    position.x = clampf(position.x, MIN_X, MAX_X)
    floor_y = -1.0
    if motion.y >= 0 and drop_time <= 0:
        for ledge in platforms:
            if position.x >= ledge.x and position.x <= ledge.z and last_y <= ledge.y + 0.5 and position.y >= ledge.y:
                if floor_y < 0 or ledge.y < floor_y:
                    floor_y = ledge.y
    if position.y >= FLOOR:
        floor_y = FLOOR
    if floor_y >= 0:
        position.y = floor_y
        motion.y = 0
    if on_surface and absf(motion.x) > 25 and attack < 0 and not guard:
        gait += motion.x * facing * dt * 0.033
    refresh_pose()

func hit_scan(enemy) -> Dictionary:
    if attack < 0 or contact or enemy.hp <= 0:
        return {}
    var data: Array = MOVES[attack]
    if phase < data[0] or phase >= data[0] + data[1]:
        return {}
    var tip := world_point(pose.front_foot if attack == 1 else pose.front_hand)
    var abdomen: Vector2 = enemy.world_point(enemy.pose.hip)
    var chest: Vector2 = enemy.world_point(enemy.pose.shoulder)
    var head: Vector2 = enemy.world_point(enemy.pose.head)
    var radius := 24.0 if attack == 1 else 19.0
    var start := tip - Vector2(facing * 43, -25 if attack == 2 else 0)
    var torso_points := Geometry2D.get_closest_points_between_segments(start, tip, abdomen, chest)
    var head_point := Geometry2D.get_closest_point_to_segment(head, start, tip)
    if torso_points[0].distance_to(torso_points[1]) > radius + 13 and head_point.distance_to(head) > radius + 22:
        return {}
    var blocked: bool = enemy.guard and enemy.facing * (position.x - enemy.position.x) > 0
    return {"point": torso_points[0] if attack != 2 else head_point, "damage": data[3], "push": data[4], "lift": data[5], "direction": facing, "blocked": blocked}

func receive(hit: Dictionary) -> void:
    var blocked: bool = hit.blocked
    var damage: float = hit.damage
    hp = maxf(0, hp - (floorf(damage * 0.18) if blocked else damage))
    stun = 0.14 if blocked else 0.22 + damage * 0.004
    attack = -1
    cast_time = 0
    dash = 0
    flash = 0.14
    motion.x = hit.direction * hit.push * (0.36 if blocked else 1.0)
    if not blocked and hit.lift > 0:
        motion.y = -hit.lift

func world_point(local_point: Vector2) -> Vector2:
    return position + Vector2(local_point.x * facing, local_point.y)

func joint(origin: Vector2, end: Vector2, bend: float, length: float) -> Vector2:
    var direction := end - origin
    if direction.length_squared() < 0.01:
        return origin
    var depth := sqrt(maxf(length * length - direction.length_squared() * 0.25, 0))
    return (origin + end) * 0.5 + direction.normalized().orthogonal() * depth * bend

func refresh_pose() -> void:
    var bounce := sin(age * 6.0) * 2.5
    var hip := Vector2(-4, -77 + bounce * 0.65)
    var shoulder := hip + Vector2(11, -49)
    var front_foot := Vector2(30, -6)
    var back_foot := Vector2(-32, -6)
    var front_hand := shoulder + Vector2(43, 8)
    var back_hand := shoulder + Vector2(17, 13)
    if victory:
        front_hand = shoulder + Vector2(36, -64)
        back_hand = shoulder + Vector2(-37, -57)
    elif hp <= 0:
        hip = Vector2(-14, -10)
        shoulder = Vector2(-64, -15)
        front_foot = Vector2(71, -7)
        back_foot = Vector2(54, -4)
        front_hand = Vector2(-10, -6)
        back_hand = Vector2(-92, -9)
    elif stun > 0:
        shoulder += Vector2(-28, 7)
        front_hand = shoulder + Vector2(47, 27)
        back_hand = shoulder + Vector2(-40, 8)
        if guard:
            front_hand = shoulder + Vector2(30, -21)
    elif guard:
        hip += Vector2(-10, 15)
        shoulder += Vector2(-7, 14)
        front_hand = shoulder + Vector2(35, -24)
        back_hand = shoulder + Vector2(28, 1)
    elif cast_time > 0:
        if cast_slot == 0:
            front_hand = shoulder + Vector2(66, -11)
            back_hand = shoulder + Vector2(17, 13)
        elif cast_slot == 1:
            shoulder += Vector2(18, -4)
            front_hand = shoulder + Vector2(54, 23)
            back_hand = shoulder + Vector2(-33, 21)
        else:
            hip.y += 9
            shoulder.y += 6
            front_hand = shoulder + Vector2(40, -48)
            back_hand = shoulder + Vector2(-23, -32)
    elif attack >= 0:
        var data: Array = MOVES[attack]
        var extension := 0.0
        if phase < data[0]:
            extension = -sin(phase / data[0] * PI) * 0.36
        elif phase < data[0] + data[1]:
            extension = 1.0
        else:
            extension = 1.0 - smoothstep(0.0, data[2], phase - data[0] - data[1])
        match attack:
            0:
                shoulder.x += 24 * extension
                front_hand += Vector2(63, -8) * extension
            1:
                hip += Vector2(12, -15) * extension
                shoulder += Vector2(-14, 6) * extension
                front_foot = front_foot.lerp(Vector2(128, -106), maxf(0, extension))
                back_foot.x += 10 * extension
                back_hand -= Vector2(18, -8) * extension
            2:
                hip += Vector2(19, -4) * extension
                shoulder += Vector2(33, -19) * extension
                front_hand += Vector2(72, -41) * extension
    elif not grounded():
        hip += Vector2(0, 4)
        shoulder += Vector2(7, -3)
        front_foot = Vector2(43, -29)
        back_foot = Vector2(-39, -19)
        front_hand = shoulder + Vector2(45, 1)
        back_hand = shoulder + Vector2(-26, 24)
    elif absf(motion.x) > 40:
        var wave := sin(gait)
        var lift := cos(gait)
        front_foot = Vector2(wave * 53, -maxf(0, lift) * 30)
        back_foot = Vector2(-wave * 53, -maxf(0, -lift) * 30)
        shoulder += Vector2(19 * signf(motion.x) * facing, -absf(lift) * 7)
        front_hand = shoulder + Vector2(-wave * 32 + 12, 31)
        back_hand = shoulder + Vector2(wave * 32 + 12, 31)
    var head := shoulder + Vector2(8, -28)
    if hp <= 0:
        head = shoulder + Vector2(-26, -3)
    pose = {"hip": hip, "shoulder": shoulder, "front_foot": front_foot, "back_foot": back_foot,
        "front_hand": front_hand, "back_hand": back_hand, "head": head}
    queue_redraw()

func segment(points: PackedVector2Array, color: Color, width: float) -> void:
    draw_polyline(points, Color("#08101b"), width + 4, true)
    for p in points:
        draw_circle(p, width * 0.5 + 2, Color("#08101b"), true, -1.0, true)
    draw_polyline(points, color, width, true)
    for p in points:
        draw_circle(p, width * 0.5, color, true, -1.0, true)

func _draw() -> void:
    if pose.is_empty():
        return
    draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
    var main := tint.lerp(Color.WHITE, flash * 4.0)
    var shadow := tint.darkened(0.41)
    var hip: Vector2 = pose.hip
    var shoulder: Vector2 = pose.shoulder
    var head: Vector2 = pose.head
    var lead_foot: Vector2 = pose.front_foot
    var rear_foot: Vector2 = pose.back_foot
    var hand: Vector2 = pose.front_hand
    var rear_hand: Vector2 = pose.back_hand
    var rear_hip := hip - Vector2(6, 0)
    var lead_hip := hip + Vector2(6, 0)
    var rear_shoulder := shoulder + Vector2(8, 2)
    var lead_shoulder := shoulder - Vector2(5, 0)
    segment(PackedVector2Array([rear_hip, joint(rear_hip, rear_foot, -1, 41), rear_foot]), shadow, 12)
    segment(PackedVector2Array([rear_foot - Vector2(4, 0), rear_foot + Vector2(15, 0)]), shadow, 11)
    segment(PackedVector2Array([rear_shoulder, joint(rear_shoulder, rear_hand, 1, 27), rear_hand]), shadow, 11)
    draw_circle(rear_hand, 8, shadow.lightened(0.15), true, -1.0, true)
    segment(PackedVector2Array([lead_hip, joint(lead_hip, lead_foot, -1, 42), lead_foot]), main, 13)
    segment(PackedVector2Array([lead_foot - Vector2(4, 0), lead_foot + Vector2(16, 0)]), main, 12)
    segment(PackedVector2Array([hip, shoulder, head]), main, 17 if variant == 0 else 23)
    draw_line(shoulder, hip, main.lightened(0.32), 2.6, true)
    segment(PackedVector2Array([lead_shoulder, joint(lead_shoulder, hand, 1, 27), hand]), main, 12)
    draw_circle(hand, 11 if variant == 0 else 13, Color("#08101b"), true, -1.0, true)
    draw_circle(hand, 8 if variant == 0 else 10, main.lightened(0.26), true, -1.0, true)
    draw_circle(head, 25, Color("#07101c"), true, -1.0, true)
    draw_circle(head, 21, main, true, -1.0, true)
    draw_arc(head, 17, 3.22, 5.13, 26, main.lightened(0.64), 2.0, true)
    if hp > 0:
        draw_line(head + Vector2(-4, -3), head + Vector2(17, -5), Color("#091220"), 8.0, true)
        draw_line(head + Vector2(6, -4), head + Vector2(15, -5), main.lightened(0.73), 2.0, true)
        if variant == 0:
            var knot := shoulder + Vector2(-4, -12)
            var tail := knot + Vector2(-33 - absf(motion.x) * 0.035, 9 + sin(age * 15) * 4)
            draw_polyline(PackedVector2Array([knot, knot.lerp(tail, 0.53) - Vector2(0, 4), tail]), main.lightened(0.32), 6.0, true)
        else:
            draw_circle(shoulder - Vector2(4, 0), 12, shadow, true, -1.0, true)
            draw_arc(shoulder - Vector2(4, 0), 9, 2.7, 5.4, 14, main.lightened(0.5), 2, true)
    if guard and hp > 0:
        draw_arc(shoulder + Vector2(22, 4), 45, -1.1, 1.2, 28, Color(main, 0.33), 2.5, true)
    if attack >= 0 and phase >= MOVES[attack][0] and phase < MOVES[attack][0] + MOVES[attack][1]:
        var tip: Vector2 = lead_foot if attack == 1 else hand
        draw_line(tip - Vector2(36, 9 if attack != 2 else -19), tip + Vector2(9, 0), Color(main.lightened(0.46), 0.62), 3.5, true)
