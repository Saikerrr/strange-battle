extends Node2D

const FIGHTER := preload("res://scripts/stick_fighter.gd")
const ABILITIES := preload("res://scripts/stick_abilities.gd")
const FLOOR := 680.0
const WIDTH := 2560.0
const PLATFORMS := [
    Vector3(290, 545, 575), Vector3(648, 413, 889), Vector3(1000, 525, 1208),
    Vector3(1210, 392, 1350), Vector3(1352, 525, 1560), Vector3(1671, 413, 1912),
    Vector3(1985, 545, 2270),
]
const BLUE := Color("#62e3f5")
const ORANGE := Color("#ff9368")
const BINDINGS := [
    [[KEY_A], [KEY_D], [KEY_W], [KEY_S], [KEY_F], [KEY_G], [KEY_H], [KEY_SHIFT], [KEY_Z], [KEY_X], [KEY_C]],
    [[KEY_LEFT], [KEY_RIGHT], [KEY_UP], [KEY_DOWN], [KEY_KP_4, KEY_COMMA], [KEY_KP_5, KEY_PERIOD], [KEY_KP_6, KEY_SLASH], [KEY_SHIFT], [KEY_KP_1, KEY_1], [KEY_KP_2, KEY_2], [KEY_KP_3, KEY_3]],
]

var fighters: Array = []
var world: Node2D
var camera: Camera2D
var abilities: Node2D
var skill_labels: Array[Label] = []
var held: Array[Dictionary] = [{}, {}]
var tapped: Array[Dictionary] = [{}, {}]
var screen: CanvasLayer
var ui: Control
var health: Array[ProgressBar] = []
var notice: Label
var hint: Label
var versus_bot := true
var paused := false
var ready_time := 0.8
var winner := -1
var hitstop := 0.0
var shake := 0.0
var age := 0.0
var bot_clock := 0.0
var bot_walk := 0.0
var bot_guard := false
var particles: Array[Dictionary] = []
var impact: AudioStreamPlayer

func _ready() -> void:
    world = Node2D.new()
    add_child(world)
    camera = Camera2D.new()
    add_child(camera)
    camera.make_current()
    abilities = ABILITIES.new()
    abilities.arena = self
    for color in [BLUE, ORANGE]:
        var fighter := FIGHTER.new()
        fighter.tint = color
        fighter.variant = fighters.size()
        world.add_child(fighter)
        fighters.append(fighter)
    world.add_child(abilities)
    create_hud()
    impact = AudioStreamPlayer.new()
    impact.max_polyphony = 4
    impact.volume_db = -19
    impact.stream = make_impact()
    add_child(impact)
    reset()

func reset() -> void:
    fighters[0].reset(1064, 1)
    fighters[1].reset(1496, -1)
    held = [{}, {}]
    tapped = [{}, {}]
    particles.clear()
    world.position = Vector2.ZERO
    camera.position = Vector2(WIDTH * 0.5, 450)
    camera.zoom = Vector2.ONE
    camera.offset = Vector2.ZERO
    abilities.clear()
    winner = -1
    paused = false
    ready_time = 0.75
    hitstop = 0
    shake = 0
    bot_clock = 0
    bot_walk = 0
    bot_guard = false
    hint.text = "Tab   " + ("Против ИИ" if versus_bot else "Два игрока") + "     ·     R   Заново     ·     Esc   Пауза"
    update_hud()

func _notification(what: int) -> void:
    if what == NOTIFICATION_APPLICATION_FOCUS_OUT and is_node_ready():
        paused = true
        held = [{}, {}]
        tapped = [{}, {}]
        update_hud()

func _input(event: InputEvent) -> void:
    if not event is InputEventKey or event.echo:
        return
    if event.pressed:
        match event.physical_keycode:
            KEY_TAB:
                versus_bot = not versus_bot
                reset()
                get_viewport().set_input_as_handled()
                return
            KEY_R:
                reset()
                return
            KEY_ESCAPE:
                paused = not paused
                held = [{}, {}]
                tapped = [{}, {}]
                update_hud()
                return
    if paused:
        return
    for side in range(2):
        for action in range(BINDINGS[side].size()):
            if event.physical_keycode not in BINDINGS[side][action]:
                continue
            if action == 7 and event.location != (KEY_LOCATION_LEFT if side == 0 else KEY_LOCATION_RIGHT):
                continue
            if event.pressed:
                if not held[side].has(action):
                    tapped[side][action] = true
                held[side][action] = true
            else:
                held[side].erase(action)

func player_input(side: int) -> Dictionary:
    var input := {
        "move": float(held[side].has(1)) - float(held[side].has(0)),
        "jump": tapped[side].has(2),
        "guard": held[side].has(3),
        "dash": tapped[side].has(7),
    }
    for attack in range(3):
        if tapped[side].has(attack + 4):
            input.attack = attack
        if tapped[side].has(attack + 8):
            input.skill = attack
    return input

func cpu_input(dt: float) -> Dictionary:
    var cpu = fighters[1]
    var rival = fighters[0]
    var offset: Vector2 = rival.position - cpu.position
    var distance := absf(offset.x)
    var action: Dictionary = {}
    bot_clock -= dt
    if bot_clock <= 0:
        bot_clock = randf_range(0.14, 0.24)
        var danger: bool = (rival.attack >= 0 or rival.cast_time > 0) and distance < 170 and absf(offset.y) < 64
        bot_guard = danger and randf() < 0.59
        bot_walk = signf(offset.x) if distance > 122 else (-signf(offset.x) if distance < 76 and randf() < 0.45 else 0.0)
        if not bot_guard and distance < 148 and absf(offset.y) < 74 and randf() < 0.69:
            action.attack = cpu.attack + 1 if cpu.attack in [0, 1] and cpu.contact else [0, 0, 1, 2].pick_random()
        if distance > 360 and randf() < 0.13:
            action.dash = true
        if distance < 172 and offset.y < -75 and randf() < 0.15:
            action.jump = true
        if cpu.grounded() and offset.y > 85 and cpu.floor_y < FLOOR and distance < 195:
            action.drop = true
        if not bot_guard and absf(offset.y) < 84 and randf() < 0.32:
            if distance > 180 and distance < 570 and cpu.cooldowns[0] <= 0:
                action.skill = 0
            elif distance > 132 and distance < 260 and cpu.grounded() and cpu.cooldowns[1] <= 0:
                action.skill = 1
            elif distance < 207 and cpu.cooldowns[2] <= 0:
                action.skill = 2
    action.move = bot_walk
    action.guard = bot_guard
    return action

func _physics_process(dt: float) -> void:
    if paused:
        return
    age += dt
    var left = fighters[0]
    var right = fighters[1]
    if ready_time > 0:
        ready_time = maxf(ready_time - dt, 0)
        tapped = [{}, {}]
    elif hitstop > 0:
        hitstop = maxf(hitstop - dt, 0)
    elif winner < 0:
        var left_input := player_input(0)
        var right_input := cpu_input(dt) if versus_bot else player_input(1)
        if left_input.has("skill") and not left_input.guard:
            abilities.launch(left, left_input.skill)
        if right_input.has("skill") and not right_input.guard:
            abilities.launch(right, right_input.skill)
        left.step(dt, left_input, right.position.x, PLATFORMS)
        right.step(dt, right_input, left.position.x, PLATFORMS)
        tapped = [{}, {}]
        separate()
        var first: Dictionary = left.hit_scan(right)
        var second: Dictionary = right.hit_scan(left)
        if not first.is_empty():
            left.contact = true
            right.receive(first)
            feedback(first, BLUE)
        if not second.is_empty():
            right.contact = true
            left.receive(second)
            feedback(second, ORANGE)
        abilities.step(dt)
        if minf(left.hp, right.hp) <= 0.0:
            winner = 0 if left.hp == right.hp else (1 if left.hp > right.hp else 2)
            if winner > 0:
                fighters[winner - 1].victory = true
    else:
        for f in fighters:
            f.step(dt, {}, fighters[1 if f == left else 0].position.x, PLATFORMS)
        abilities.clear()
    shake = move_toward(shake, 0.0, dt * 60.0)
    var separation: float = absf(left.position.x - right.position.x)
    var zoom_level := clampf(1530.0 / (separation + 390.0), 0.60, 1.0)
    camera.zoom = camera.zoom.lerp(Vector2.ONE * zoom_level, minf(dt * 4.6, 1))
    var half_frame := minf(800.0 / camera.zoom.x, WIDTH * 0.5)
    var center := clampf((left.position.x + right.position.x) * 0.5, half_frame, WIDTH - half_frame)
    camera.position.x = lerpf(camera.position.x, center, minf(dt * 7, 1))
    var highest := minf(left.position.y, right.position.y)
    var camera_y := clampf(highest + 36.0, 325.0, 450.0)
    camera.position.y = lerpf(camera.position.y, camera_y, minf(dt * 5.5, 1))
    camera.offset = Vector2(sin(age * 129.0), cos(age * 142.0)) * shake
    for spark in particles:
        spark.life -= dt
        spark.p += spark.v * dt
        spark.v.y += 480 * dt
    particles.assign(particles.filter(func(spark): return spark.life > 0))
    update_hud()
    queue_redraw()

func separate() -> void:
    var left = fighters[0]
    var right = fighters[1]
    var gap: Vector2 = right.position - left.position
    if absf(gap.y) >= 86 or absf(gap.x) >= 89:
        return
    var direction := 1.0 if gap.x >= 0 else -1.0
    var center := clampf((right.position.x + left.position.x) * 0.5, FIGHTER.MIN_X + 45, FIGHTER.MAX_X - 45)
    left.position.x = center - direction * 44.5
    right.position.x = center + direction * 44.5

func feedback(hit: Dictionary, color: Color) -> void:
    var blocked: bool = hit.blocked
    hitstop = maxf(hitstop, 0.036 if blocked else (0.084 if hit.lift > 0 else 0.057))
    shake = 2.2 if blocked else (7.0 if hit.lift > 0 else 4.2)
    impact.pitch_scale = 1.63 if blocked else (0.89 if hit.lift > 0 else 1.19)
    impact.play()
    var spark_tint := Color("#a8faff") if blocked else color.lerp(Color.WHITE, 0.42)
    for i in range(8 if blocked else 17):
        var direction := Vector2.from_angle(randf() * TAU)
        particles.append({"p": hit.point, "v": direction * randf_range(100, 480), "life": randf_range(0.11, 0.37), "color": spark_tint})

func make_impact() -> AudioStreamWAV:
    var audio := AudioStreamWAV.new()
    audio.mix_rate = 22050
    audio.format = AudioStreamWAV.FORMAT_16_BITS
    var samples := PackedByteArray()
    samples.resize(4400)
    for i in range(2200):
        var t := float(i) / 22050.0
        var mix := sin(TAU * (155 - 625 * t) * t) * 0.62 + randf_range(-0.34, 0.34)
        samples.encode_s16(i * 2, int(mix * exp(-t * 42) * 23000.0))
    audio.data = samples
    return audio

func hud_label(value: String, size_px: int, color: Color, area: Rect2, alignment := HORIZONTAL_ALIGNMENT_CENTER) -> Label:
    var label := Label.new()
    label.text = value
    label.position = area.position
    label.size = area.size
    label.horizontal_alignment = alignment
    label.mouse_filter = Control.MOUSE_FILTER_IGNORE
    label.add_theme_font_size_override("font_size", size_px)
    label.add_theme_color_override("font_color", color)
    ui.add_child(label)
    return label

func create_hud() -> void:
    screen = CanvasLayer.new()
    add_child(screen)
    ui = Control.new()
    ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
    screen.add_child(ui)
    hud_label("ВОЛЬТ   ·   P1", 27, BLUE, Rect2(94, 54, 600, 34), HORIZONTAL_ALIGNMENT_LEFT)
    hud_label("ГОРН   ·   P2", 27, ORANGE, Rect2(906, 54, 600, 34), HORIZONTAL_ALIGNMENT_RIGHT)
    for index in range(2):
        var bar := ProgressBar.new()
        bar.position = Vector2(94 if index == 0 else 906, 96)
        bar.size = Vector2(600, 14)
        bar.max_value = 100
        bar.show_percentage = false
        bar.fill_mode = ProgressBar.FILL_BEGIN_TO_END if index == 0 else ProgressBar.FILL_END_TO_BEGIN
        bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
        var track := StyleBoxFlat.new()
        track.bg_color = Color("#233345")
        bar.add_theme_stylebox_override("background", track)
        var fill := StyleBoxFlat.new()
        fill.bg_color = BLUE if index == 0 else ORANGE
        bar.add_theme_stylebox_override("fill", fill)
        ui.add_child(bar)
        health.append(bar)
        for slot in range(3):
            var x := (94 if index == 0 else 906) + slot * 202
            var panel := ColorRect.new()
            panel.position = Vector2(x, 124)
            panel.size = Vector2(194, 36)
            panel.color = Color("#101b2aed")
            panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
            ui.add_child(panel)
            skill_labels.append(hud_label("", 18, BLUE if index == 0 else ORANGE, Rect2(x, 130, 194, 29)))
    notice = hud_label("", 57, Color("#e1f4ff"), Rect2(350, 280, 900, 93))
    hud_label("A/D  Движение   W  Прыжок   S  Блок   F/G/H  Удары   Shift  Рывок", 19, Color("#a2c9d7"), Rect2(62, 766, 706, 31), HORIZONTAL_ALIGNMENT_LEFT)
    hud_label("Стрелки  Движение   Num4/5/6  Удары   Shift  Рывок", 19, Color("#d7b6ad"), Rect2(832, 766, 706, 31), HORIZONTAL_ALIGNMENT_RIGHT)
    hint = hud_label("", 20, Color("#8299ac"), Rect2(365, 835, 870, 38))

func update_hud() -> void:
    for i in range(2):
        health[i].value = fighters[i].hp
        for slot in range(3):
            var remaining: float = fighters[i].cooldowns[slot]
            var shortcut: String = ["Z", "X", "C"][slot] if i == 0 else "Num%d" % (slot + 1)
            var name: String = ABILITIES.KITS[i][slot][0]
            var label := skill_labels[i * 3 + slot]
            label.text = "%s   %s" % [shortcut if remaining <= 0 else "%.1f" % remaining, name]
            label.modulate.a = 1.0 if remaining <= 0 else 0.5
    if paused:
        notice.text = "ПАУЗА"
    elif winner >= 0:
        notice.text = "НИЧЬЯ" if winner == 0 else "P%d  ПОБЕДИЛ" % winner
    else:
        notice.text = "БОЙ" if ready_time > 0 else ""

func _draw() -> void:
    draw_rect(Rect2(-400, -400, WIDTH + 800, 1800), Color("#0c1421"))
    for i in range(22):
        var y := 125.0 + i * 26.0
        draw_rect(Rect2(0, y, WIDTH, 26), Color("#162b3a").lerp(Color("#0e1827"), float(i) / 22.0))
    for index in range(4):
        var x := 176 + 734.0 * index
        var is_blue := index % 2 == 0
        var slant := 125.0 if is_blue else -125.0
        draw_colored_polygon(PackedVector2Array([Vector2(x - 23, 114), Vector2(x + 23, 114), Vector2(x + slant + 300, FLOOR), Vector2(x + slant - 300, FLOOR)]), Color(BLUE if is_blue else ORANGE, 0.065))
        draw_line(Vector2(x - 23, 114), Vector2(x + 23, 114), Color(BLUE if is_blue else ORANGE, 0.62), 4, true)
    for i in range(10):
        var column := 108 + i * 260.0
        draw_line(Vector2(column, 171), Vector2(column, FLOOR), Color("#1c3141"), 8)
        draw_line(Vector2(column + 12, 171), Vector2(column + 12, FLOOR), Color("#142433"), 2)
    for y in [391.0, 415.0, 536.0, 560.0]:
        draw_line(Vector2(89, y), Vector2(WIDTH - 89, y), Color("#1d3141"), 2)
    for x in [455.0, 1280.0, 2105.0]:
        draw_arc(Vector2(x, 481), 187, PI, TAU, 70, Color("#233b4b"), 2.0, true)
        draw_arc(Vector2(x, 481), 166, PI, TAU, 70, Color("#203646"), 2.0, true)
        draw_line(Vector2(x, 312), Vector2(x, 627), Color("#263c4d"), 2.0)
    for i in range(32):
        var x := 172.0 + i * 74.0
        draw_rect(Rect2(x, 599, 31, 3), Color("#294758"))
    draw_rect(Rect2(0, FLOOR, WIDTH, 480), Color("#0b121d"))
    draw_rect(Rect2(0, FLOOR + 4, WIDTH, 47), Color("#182737"))
    for i in range(21):
        var x := 66.0 + i * 128.0
        draw_line(Vector2(x, FLOOR + 5), Vector2((x - WIDTH / 2) * 1.16 + WIDTH / 2, FLOOR + 50), Color("#283d4f"), 2.0)
    draw_line(Vector2(89, FLOOR), Vector2(WIDTH - 89, FLOOR), Color("#6d919f"), 3, true)
    draw_line(Vector2(103, FLOOR), Vector2(466, FLOOR), Color(BLUE, 0.84), 3, true)
    draw_line(Vector2(WIDTH - 466, FLOOR), Vector2(WIDTH - 103, FLOOR), Color(ORANGE, 0.84), 3, true)
    for ledge in PLATFORMS:
        var left := Vector2(ledge.x, ledge.y)
        var right := Vector2(ledge.z, ledge.y)
        draw_colored_polygon(PackedVector2Array([left, right, right + Vector2(-17, 17), left + Vector2(17, 17)]), Color("#1b3042"))
        draw_line(left, right, Color("#7499ae"), 3.0, true)
        draw_line(left + Vector2(23, 10), right + Vector2(-23, 10), Color("#355b71"), 3, true)
    for f in fighters:
        var surface := FLOOR
        for ledge in PLATFORMS:
            if f.position.x >= ledge.x and f.position.x <= ledge.z and f.position.y <= ledge.y + 1.0:
                surface = minf(surface, ledge.y)
        var gap: float = surface - f.position.y
        draw_set_transform(Vector2(f.position.x, surface - 1), 0.0, Vector2(1, 0.18))
        draw_circle(Vector2.ZERO, 47.0 + gap * 0.13, Color(0.02, 0.05, 0.08, clampf(0.8 - gap * 0.002, 0.25, 0.8)), true, -1.0, true)
        draw_set_transform(Vector2.ZERO)
    for spark in particles:
        var bright := Color(spark.color, minf(1.0, spark.life * 5.0))
        draw_line(spark.p - spark.v * 0.025, spark.p, bright, 3.3, true)
