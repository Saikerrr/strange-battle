extends Node2D

const FLOOR := 680.0
# Startup, active, recovery, damage, push, lift.
const MOVES := [
    [0.09, 0.08, 0.19, 8.0, 210.0, 0.0],
    [0.15, 0.10, 0.26, 13.0, 365.0, 0.0],
    [0.24, 0.11, 0.34, 19.0, 545.0, 360.0],
]

var tint := Color.WHITE
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
    refresh_pose()

func step(dt: float, input: Dictionary, enemy_x: float) -> void:
    age += dt
    stun = maxf(stun - dt, 0)
    dash = maxf(dash - dt, 0)
    dash_cd = maxf(dash_cd - dt, 0)
    flash = maxf(flash - dt, 0)
    buffer = maxf(buffer - dt, 0)
    var grounded := position.y >= FLOOR
    var move: float = input.get("move", 0)
    if input.has("attack"):
        buffered = input.attack
        buffer = 0.17
    if attack < 0 and dash <= 0 and stun <= 0:
        facing = 1.0 if position.x <= enemy_x else -1.0
    guard = bool(input.get("guard", false)) and grounded and stun <= 0 and dash <= 0 and attack < 0
    if hp > 0 and stun <= 0:
        if input.get("jump", false) and grounded and attack < 0 and not guard:
            motion.y = -780
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
            motion.x = move_toward(motion.x, target_speed, dt * (3200.0 if grounded else 1800.0))
    else:
        motion.x = move_toward(motion.x, 0, dt * 1120)
    if attack >= 0:
        phase += dt
        var move_data: Array = MOVES[attack]
        if phase >= move_data[0] + move_data[1] + move_data[2]:
            attack = -1
    motion.y += 2320.0 * dt
    position += motion * dt
    position.x = clampf(position.x, 138, 1462)
    if position.y >= FLOOR:
        position.y = FLOOR
        motion.y = 0
    if grounded and absf(motion.x) > 25 and attack < 0 and not guard:
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
    var hip := Vector2(0, -77 + bounce)
    var shoulder := hip + Vector2(9, -50)
    var front_foot := Vector2(36, -3)
    var back_foot := Vector2(-36, -3)
    var front_hand := shoulder + Vector2(48, 4)
    var back_hand := shoulder + Vector2(24, -17)
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
        back_hand = shoulder + Vector2(24, -13)
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
    elif position.y < FLOOR - 1:
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
    var head := shoulder + Vector2(12, -27)
    if hp <= 0:
        head = shoulder + Vector2(-26, -3)
    pose = {"hip": hip, "shoulder": shoulder, "front_foot": front_foot, "back_foot": back_foot,
        "front_hand": front_hand, "back_hand": back_hand, "head": head}
    queue_redraw()

func segment(points: PackedVector2Array, color: Color, width: float) -> void:
    draw_polyline(points, Color("#08101b"), width + 6, true)
    draw_polyline(points, color, width, true)
    for p in points:
        draw_circle(p, width * 0.48, color, true, -1.0, true)

func _draw() -> void:
    if pose.is_empty():
        return
    draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
    var main := tint.lerp(Color.WHITE, flash * 4.0)
    var shadow := tint.darkened(0.53)
    var hip: Vector2 = pose.hip
    var shoulder: Vector2 = pose.shoulder
    var head: Vector2 = pose.head
    var lead_foot: Vector2 = pose.front_foot
    var rear_foot: Vector2 = pose.back_foot
    var hand: Vector2 = pose.front_hand
    var rear_hand: Vector2 = pose.back_hand
    segment(PackedVector2Array([hip, joint(hip, rear_foot, -1, 44), rear_foot, rear_foot + Vector2(13, 0)]), shadow, 10)
    segment(PackedVector2Array([shoulder, joint(shoulder, rear_hand, 1, 32), rear_hand]), shadow, 9)
    segment(PackedVector2Array([hip, joint(hip, lead_foot, -1, 44), lead_foot, lead_foot + Vector2(15, 0)]), main, 11)
    segment(PackedVector2Array([hip, shoulder, head]), main, 13)
    segment(PackedVector2Array([shoulder, joint(shoulder, hand, 1, 35), hand]), main, 10)
    draw_circle(hand, 10, main.lightened(0.26), true, -1.0, true)
    draw_circle(head, 26, Color("#07101c"), true, -1.0, true)
    draw_circle(head, 22, main, true, -1.0, true)
    draw_arc(head, 18, 3.22, 5.13, 26, main.lightened(0.52), 2.0, true)
    if hp > 0:
        draw_line(head + Vector2(3, -4), head + Vector2(17, -7), Color("#091220"), 4.0, true)
        draw_line(shoulder + Vector2(-4, -9), shoulder + Vector2(-29 - absf(motion.x) * 0.07, 2 + sin(age * 15) * 6), main.lightened(0.25), 5.0, true)
    if guard and hp > 0:
        draw_arc(shoulder + Vector2(22, 4), 45, -1.1, 1.2, 28, Color(main, 0.33), 2.5, true)
    if attack >= 0 and phase >= MOVES[attack][0] and phase < MOVES[attack][0] + MOVES[attack][1]:
        var tip: Vector2 = lead_foot if attack == 1 else hand
        draw_line(tip - Vector2(36, 9 if attack != 2 else -19), tip + Vector2(9, 0), Color(main.lightened(0.46), 0.62), 3.5, true)
