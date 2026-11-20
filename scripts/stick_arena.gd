extends Node2D

const FIGHTER := preload("res://scripts/stick_fighter.gd")
const FLOOR := 680.0
const BLUE := Color("#62e3f5")
const ORANGE := Color("#ff9368")
const BINDINGS := [
    [[KEY_A], [KEY_D], [KEY_W], [KEY_S], [KEY_F], [KEY_G], [KEY_H], [KEY_SHIFT]],
    [[KEY_LEFT], [KEY_RIGHT], [KEY_UP], [KEY_DOWN], [KEY_KP_4, KEY_COMMA], [KEY_KP_5, KEY_PERIOD], [KEY_KP_6, KEY_SLASH], [KEY_SHIFT]],
]

var fighters: Array = []
var world: Node2D
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
    for color in [BLUE, ORANGE]:
        var fighter := FIGHTER.new()
        fighter.tint = color
        world.add_child(fighter)
        fighters.append(fighter)
    create_hud()
    impact = AudioStreamPlayer.new()
    impact.max_polyphony = 4
    impact.volume_db = -19
    impact.stream = make_impact()
    add_child(impact)
    reset()

func reset() -> void:
    fighters[0].reset(584, 1)
    fighters[1].reset(1016, -1)
    held = [{}, {}]
    tapped = [{}, {}]
    particles.clear()
    world.position = Vector2.ZERO
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
        var danger: bool = rival.attack >= 0 and distance < 162 and absf(offset.y) < 55
        bot_guard = danger and randf() < 0.59
        bot_walk = signf(offset.x) if distance > 122 else (-signf(offset.x) if distance < 76 and randf() < 0.45 else 0.0)
        if not bot_guard and distance < 148 and absf(offset.y) < 74 and randf() < 0.69:
            action.attack = cpu.attack + 1 if cpu.attack in [0, 1] and cpu.contact else [0, 0, 1, 2].pick_random()
        if distance > 360 and randf() < 0.13:
            action.dash = true
        if distance < 172 and offset.y < -75 and randf() < 0.15:
            action.jump = true
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
        left.step(dt, player_input(0), right.position.x)
        right.step(dt, cpu_input(dt) if versus_bot else player_input(1), left.position.x)
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
        if minf(left.hp, right.hp) <= 0.0:
            winner = 0 if left.hp == right.hp else (1 if left.hp > right.hp else 2)
            if winner > 0:
                fighters[winner - 1].victory = true
    else:
        for f in fighters:
            f.step(dt, {}, fighters[1 if f == left else 0].position.x)
    shake = move_toward(shake, 0.0, dt * 60.0)
    world.position = Vector2(sin(age * 129.0), cos(age * 142.0)) * shake
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
    var center := clampf((right.position.x + left.position.x) * 0.5, 183, 1417)
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
    hud_label("P1", 27, BLUE, Rect2(94, 54, 600, 34), HORIZONTAL_ALIGNMENT_LEFT)
    hud_label("P2", 27, ORANGE, Rect2(906, 54, 600, 34), HORIZONTAL_ALIGNMENT_RIGHT)
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
    notice = hud_label("", 57, Color("#e1f4ff"), Rect2(350, 280, 900, 93))
    hud_label("A/D  Движение   W  Прыжок   S  Блок   F/G/H  Удары   Shift  Рывок", 19, Color("#a2c9d7"), Rect2(62, 766, 706, 31), HORIZONTAL_ALIGNMENT_LEFT)
    hud_label("Стрелки  Движение   Num4/5/6  Удары   Shift  Рывок", 19, Color("#d7b6ad"), Rect2(832, 766, 706, 31), HORIZONTAL_ALIGNMENT_RIGHT)
    hint = hud_label("", 20, Color("#8299ac"), Rect2(365, 835, 870, 38))

func update_hud() -> void:
    for i in range(2):
        health[i].value = fighters[i].hp
    if paused:
        notice.text = "ПАУЗА"
    elif winner >= 0:
        notice.text = "НИЧЬЯ" if winner == 0 else "P%d  ПОБЕДИЛ" % winner
    else:
        notice.text = "БОЙ" if ready_time > 0 else ""

func _draw() -> void:
    draw_rect(Rect2(0, 0, 1600, 900), Color("#0c1421"))
    for i in range(22):
        var y := 125.0 + i * 26.0
        draw_rect(Rect2(0, y, 1600, 26), Color("#162b3a").lerp(Color("#0e1827"), float(i) / 22.0))
    draw_colored_polygon(PackedVector2Array([Vector2(246, 113), Vector2(326, 113), Vector2(850, FLOOR), Vector2(68, FLOOR)]), Color(0.27, 0.83, 0.92, 0.065))
    draw_colored_polygon(PackedVector2Array([Vector2(1274, 113), Vector2(1354, 113), Vector2(1532, FLOOR), Vector2(750, FLOOR)]), Color(1, 0.36, 0.24, 0.070))
    for column in [111.0, 406.0, 696.0, 904.0, 1194.0, 1489.0]:
        draw_line(Vector2(column, 171), Vector2(column, FLOOR), Color("#1c3141"), 8)
        draw_line(Vector2(column + 12, 171), Vector2(column + 12, FLOOR), Color("#142433"), 2)
    for y in [391.0, 415.0, 536.0, 560.0]:
        draw_line(Vector2(89, y), Vector2(1511, y), Color("#1d3141"), 2)
    draw_arc(Vector2(800, 484), 187, PI, TAU, 70, Color("#233b4b"), 2.0, true)
    draw_arc(Vector2(800, 484), 166, PI, TAU, 70, Color("#203646"), 2.0, true)
    draw_line(Vector2(800, 312), Vector2(800, 627), Color("#263c4d"), 2.0)
    for i in range(18):
        var x := 172.0 + i * 74.0
        draw_rect(Rect2(x, 599, 31, 3), Color("#294758"))
    draw_rect(Rect2(0, FLOOR, 1600, 220), Color("#0b121d"))
    draw_rect(Rect2(0, FLOOR + 4, 1600, 47), Color("#182737"))
    for i in range(13):
        var x := 66.0 + i * 128.0
        draw_line(Vector2(x, FLOOR + 5), Vector2((x - 800) * 1.23 + 800, FLOOR + 50), Color("#283d4f"), 2.0)
    draw_line(Vector2(89, FLOOR), Vector2(1511, FLOOR), Color("#6d919f"), 3, true)
    draw_line(Vector2(103, FLOOR), Vector2(423, FLOOR), Color(BLUE, 0.84), 3, true)
    draw_line(Vector2(1177, FLOOR), Vector2(1497, FLOOR), Color(ORANGE, 0.84), 3, true)
    for f in fighters:
        var gap: float = FLOOR - f.position.y
        draw_set_transform(Vector2(f.position.x, FLOOR - 1), 0.0, Vector2(1, 0.18))
        draw_circle(Vector2.ZERO, 47.0 + gap * 0.13, Color(0.02, 0.05, 0.08, clampf(0.8 - gap * 0.002, 0.25, 0.8)), true, -1.0, true)
        draw_set_transform(Vector2.ZERO)
    for spark in particles:
        var bright := Color(spark.color, minf(1.0, spark.life * 5.0))
        draw_line(spark.p - spark.v * 0.025, spark.p, bright, 3.3, true)
