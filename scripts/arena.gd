extends Node2D

signal result_changed(winner: int)
signal pause_changed(value: bool)

const FIGHTER := preload("res://scripts/fighter.gd")
const ABILITY_EFFECTS := preload("res://scripts/abilities.gd")
const FLOOR := 750.0
const SPRINGS := [800.0, 2000.0, 3000.0]
const PICKUPS := [
    ["ЛЕЧЕНИЕ", "+", Color("#7beaaa")],
    ["МАГИЯ", "✦", Color("#cda2ff")],
    ["СКОРОСТЬ", "»", Color("#ff827b")],
    ["ПИСТОЛЕТ", "3", Color("#ffd279")],
]
const SPANS := [Vector3(410, 591, 235), Vector3(875, 468, 250), Vector3(1390, 561, 285),
    Vector3(1930, 561, 285), Vector3(2475, 468, 250), Vector3(2940, 591, 235)]
const P1 := [[KEY_A], [KEY_D], [KEY_W], [KEY_S], [KEY_F], [KEY_G], [KEY_H],
    [KEY_R], [KEY_SHIFT], [KEY_Z], [KEY_X], [KEY_C], [KEY_Q]]
const P2 := [[KEY_LEFT], [KEY_RIGHT], [KEY_UP], [KEY_DOWN], [KEY_KP_4, KEY_COMMA],
    [KEY_KP_5, KEY_PERIOD], [KEY_KP_6, KEY_SLASH], [KEY_KP_0, KEY_0], [KEY_SHIFT],
    [KEY_KP_1, KEY_1], [KEY_KP_2, KEY_2], [KEY_KP_3, KEY_3], [KEY_KP_7]]
const DIFFICULTY := [Vector3(0.46, 0.43, 0.22), Vector3(0.23, 0.69, 0.52), Vector3(0.12, 0.91, 0.79)]
const BACKDROP := preload("res://assets/game/arena.png")

var roster: Array
var ability_list: Array
var picks: Array
var drafts: Array
var mode: String
var difficulty: int
var fighters: Array = []
var textures: Dictionary = {}
var native_kits: Dictionary = {}
var ultimate_kits: Dictionary = {}
var fx: RefCounted
var particles: Array[Dictionary] = []
var rings: Array[Dictionary] = []
var captions: Array[Dictionary] = []
var camera: Camera2D
var sfx: AudioStreamPlayer
var tone: AudioStreamWAV
var celebrating := 0
var round_number := 1
var scores := [0, 0]
var phase := "intro"
var clock := 1.35
var announcement := ""
var age := 0.0
var hitstop := 0.0
var shake := 0.0
var paused := false
var down: Array[Dictionary] = [{}, {}]
var pressed: Array[Dictionary] = [{}, {}]
var pickup_clock := 6.0
var pickup := -1
var pickup_point := Vector2.ZERO

func configure(data: Dictionary, chosen: Array, kits: Array, game_mode: String, level: int) -> void:
    roster = data.roster
    ability_list = data.abilities
    picks = chosen.duplicate()
    drafts = kits.duplicate(true)
    mode = game_mode
    difficulty = level
    for profile in roster:
        var native := ability_list.filter(func(a): return a.country == profile.id)
        native_kits[profile.id] = native
        var empowered: Array = []
        for slot in range(native.size()):
            var skill: Dictionary = native[slot].duplicate()
            skill.name = profile.ultimate[slot].name
            skill.text = profile.ultimate[slot].text
            empowered.append(skill)
        ultimate_kits[profile.id] = empowered

func _ready() -> void:
    fx = ABILITY_EFFECTS.new(self)
    camera = Camera2D.new()
    add_child(camera)
    sfx = AudioStreamPlayer.new()
    sfx.max_polyphony = 8
    sfx.volume_db = -16.0
    tone = make_impact()
    sfx.stream = tone
    add_child(sfx)
    start_round()

func fighter_texture(id: String, pose := "idle") -> Texture2D:
    if id == "dummy":
        return preload("res://assets/fighters/dummy_idle.svg")
    var key := id + "_" + pose
    if not textures.has(key):
        var path := "res://assets/fighters/%s.png" % key
        if ResourceLoader.exists(path):
            textures[key] = load(path)
        elif pose != "idle":
            return fighter_texture(id)
        else:
            return null
    return textures[key]

func start_round() -> void:
    fx.objects.clear()
    for f in fighters:
        f.queue_free()
    fighters.clear()
    particles.clear()
    rings.clear()
    captions.clear()
    clear_input()
    celebrating = 0
    hitstop = 0.0
    shake = 0.0
    pickup = -1
    pickup_clock = 6.0
    for index in range(2):
        var fighter := FIGHTER.new()
        add_child(fighter)
        var profile: Dictionary = picks[index]
        var kit: Array = drafts[index]
        fighter.setup(self, profile, kit, index + 1, mode == "practice" and index == 1)
        fighter.position = Vector2(1480.0 if index == 0 else (1680.0 if mode == "practice" else 2120.0), FLOOR)
        fighter.facing = 1.0 if index == 0 else -1.0
        fighter.update_pose(1.0)
        fighters.append(fighter)
    camera.position = Vector2(1800, 462)
    camera.zoom = Vector2.ONE
    phase = "intro"
    clock = 1.35
    announcement = "ПОЛИГОН" if mode == "practice" else "РАУНД %d" % round_number

func restart() -> void:
    scores = [0, 0]
    round_number = 1
    phase = "intro"
    set_paused(false)
    start_round()

func clear_input() -> void:
    down = [{}, {}]
    pressed = [{}, {}]

func set_paused(value: bool) -> void:
    if phase == "result":
        return
    paused = value
    clear_input()
    pause_changed.emit(value)

func _notification(what: int) -> void:
    if what == NOTIFICATION_APPLICATION_FOCUS_OUT and is_node_ready() and phase != "result":
        set_paused(true)

func _input(event: InputEvent) -> void:
    if not event is InputEventKey or event.echo:
        return
    if event.physical_keycode == KEY_ESCAPE and event.pressed:
        set_paused(not paused)
        get_viewport().set_input_as_handled()
        return
    if paused:
        return
    for player in range(2):
        var bindings: Array = P1 if player == 0 else P2
        for index in range(bindings.size()):
            if event.physical_keycode not in bindings[index]:
                continue
            if index == 8 and event.location != (KEY_LOCATION_LEFT if player == 0 else KEY_LOCATION_RIGHT):
                continue
            if event.pressed:
                if not down[player].get(index, false):
                    pressed[player][index] = true
                down[player][index] = true
            else:
                down[player].erase(index)

func human(player: int) -> Dictionary:
    var held: Dictionary = down[player]
    var tap: Dictionary = pressed[player]
    var input := {
        "move": float(held.has(1)) - float(held.has(0)),
        "vertical": float(held.has(3)) - float(held.has(2)),
        "jump": tap.has(2), "block": held.has(3), "dash": tap.has(8),
        "ult": held.has(7), "detonate": tap.has(12), "skills": [], "held": [],
    }
    for i in range(3):
        if tap.has(i + 4):
            input.attack = i
        if tap.has(i + 9):
            input.skills.append(i)
        if held.has(i + 9):
            input.held.append(i)
    return input

func bot(f, target, dt: float) -> Dictionary:
    var cfg: Vector3 = DIFFICULTY[difficulty]
    var dx: float = target.position.x - f.position.x
    var distance := absf(dx)
    var input := {"skills": [], "held": [], "ult": f.hp < (64.0 - difficulty * 8.0)}
    f.ai_wait -= dt
    if f.ai_wait <= 0.0:
        f.ai_wait = randf_range(cfg.x * 0.85, cfg.x * 1.15)
        var threatened: bool = target.attack >= 0 and distance < 153 and absf(target.position.y - f.position.y) < 108
        for item in fx.objects:
            if item.owner == target and item.p.distance_to(f.center()) < 180.0 and item.v.dot(f.center() - item.p) > 0.0:
                threatened = true
                break
        f.ai_block = threatened and randf() < cfg.z
        f.ai_walk = signf(dx) if distance > 112 else (-signf(dx) if distance < 60 else 0.0)
        if distance < 135 and randf() < cfg.y and not f.ai_block:
            input.attack = (f.attack + 1) % 3 if f.attack >= 0 and f.attack_hit else randi_range(0, 1)
        if not f.ai_block and randf() < cfg.y:
            var skills: Array = skills_for(f)
            var candidates := []
            for slot in range(skills.size()):
                var skill: Dictionary = skills[slot]
                var cooling: Dictionary = f.ultimate_cooldowns if f.ultimate > 0.0 else f.cooldowns
                if cooling.get(skill.key, 0.0) > 0:
                    continue
                if skill.key in ["burger", "astral"] and f.hp > f.capacity - 18:
                    continue
                if skill.key == "parry" and not threatened:
                    continue
                if distance <= float(skill.maxRange) and distance >= minf(float(skill.minRange), 75.0):
                    candidates.append(slot)
            if not candidates.is_empty():
                input.skills.append(candidates.pick_random())
        input.jump = (target.position.y < f.position.y - 90 and randf() < cfg.y) or (threatened and not f.ai_block and randf() < 0.15)
        input.dash = distance > 360 and randf() < cfg.z * 0.45
        for item in fx.objects:
            if item.kind == "c4" and item.owner == f and item.p.distance_to(target.center()) <= 145:
                input.detonate = true
                break
    input.move = f.ai_walk
    input.block = f.ai_block
    input.vertical = clampf((target.position.y - f.position.y) / 150.0, -1.0, 1.0)
    return input

func _physics_process(dt: float) -> void:
    if paused or fighters.size() != 2:
        return
    age += dt
    clock -= dt
    if phase == "intro" and clock <= 0.0:
        phase = "fight"
        clock = 0.72
        announcement = "БОЙ!" if mode != "practice" else ""
    elif phase == "fight" and clock <= 0.0:
        announcement = ""
    elif phase == "outro" and clock <= 0.0:
        if scores.max() >= 2:
            phase = "result"
            result_changed.emit(celebrating)
        else:
            round_number += 1
            start_round()
    if phase == "fight":
        if hitstop > 0.0:
            hitstop -= dt
        else:
            var p1: Node2D = fighters[0]
            var p2: Node2D = fighters[1]
            p1.tick(dt, p2, human(0))
            var input := human(1)
            if mode == "pve":
                input = bot(p2, p1, dt)
            elif mode == "practice":
                input = {"attack": 0} if pressed[1].has(9) else {}
            p2.tick(dt, p1, input)
            separate(p1, p2)
            fx.step(dt)
            update_pickup(dt)
            pressed = [{}, {}]
            if p1.hp <= 0.0 or p2.hp <= 0.0:
                if mode == "practice":
                    start_round()
                else:
                    end_round(0 if p1.hp <= 0.0 and p2.hp <= 0.0 else (2 if p1.hp <= 0.0 else 1))
    else:
        pressed = [{}, {}]
        for f in fighters:
            f.animation_time += dt
            f.update_pose(dt)
    update_camera(dt)
    animate_fx(dt)
    queue_redraw()

func separate(a, b) -> void:
    var dx: float = b.position.x - a.position.x
    if absf(dx) >= 62.0 or absf(a.position.y - b.position.y) > 95 or a.dash_time > 0 or b.dash_time > 0:
        return
    var direction := 1.0 if dx >= 0.0 else -1.0
    if b.dummy:
        a.position.x = b.position.x - direction * 62.0
    else:
        var middle: float = (a.position.x + b.position.x) * 0.5
        a.position.x = clampf(middle - direction * 31.0, 90, 3510)
        b.position.x = clampf(middle + direction * 31.0, 90, 3510)

func land(f, previous: Vector2) -> void:
    var ground := FLOOR
    var hit: bool = f.position.y >= FLOOR
    if f.motion.y >= 0.0:
        for span in SPANS:
            if f.position.x >= span.x and f.position.x <= span.x + span.z and previous.y <= span.y + 2.0 and f.position.y >= span.y:
                ground = span.y
                hit = true
                break
    if hit:
        if ground == FLOOR:
            for spring in SPRINGS:
                if absf(f.position.x - spring) < 43.0:
                    f.position.y = FLOOR - 1.0
                    f.motion.y = -1360.0
                    f.jumps = 1
                    f.floor_contact = false
                    burst(f.position, Color("#ffb174"), 13, 90)
                    return
        if not f.floor_contact and f.motion.y >= 0.0:
            burst(Vector2(f.position.x, ground), Color("#819ebc"), 4)
        f.position.y = ground
        f.motion.y = 0.0
        f.jumps = 2
    f.floor_contact = hit

func update_pickup(dt: float) -> void:
    if pickup < 0:
        pickup_clock -= dt
        if pickup_clock <= 0.0:
            pickup = randi_range(0, PICKUPS.size() - 1)
            pickup_point = Vector2(randf_range(250.0, 3350.0), FLOOR - 37.0)
        return
    for fighter in fighters:
        if fighter.dummy or fighter.hp <= 0.0 or fighter.position.distance_to(pickup_point) > 64.0:
            continue
        match pickup:
            0: fighter.hp = minf(fighter.capacity, fighter.hp + 15.0)
            1: fighter.haste = 15.0
            2: fighter.speed_boost = 9.0
            3:
                fighter.bonus_shots = 3
                fighter.next_bonus_shot = 0.0
        var info: Array = PICKUPS[pickup]
        captions.append({"p": fighter.center() - Vector2(0, 78), "t": 0.62, "text": info[0], "color": info[2]})
        burst(pickup_point, info[2], 16)
        pickup = -1
        pickup_clock = 10.0
        break

func fire_pickup(fighter, target) -> void:
    fx.shot("bullet", fighter, target, 850.0, 5.0, 18.0)

func end_round(winner: int) -> void:
    celebrating = winner
    if winner > 0:
        scores[winner - 1] += 1
    phase = "outro"
    clock = 2.1
    announcement = "ДВОЙНОЙ K.O." if winner == 0 else "K.O."
    fx.objects.clear()
    shake = 7.0

func skills_for(f) -> Array:
    if f.dummy:
        return []
    if f.ultimate <= 0.0 and not f.loadout.is_empty():
        return f.loadout
    return ultimate_kits[f.profile.id] if f.ultimate > 0.0 else native_kits[f.profile.id]

func process_skills(f, target, input: Dictionary, dt: float) -> void:
    if f.dummy:
        return
    var kit := skills_for(f)
    var held: Array = input.get("held", [])
    var taps: Array = input.get("skills", [])
    if f.silenced > 0.0:
        f.held_c4 = 0.0
        return
    for i in range(kit.size()):
        var a: Dictionary = kit[i]
        if a.key == "c4" and f.ultimate <= 0.0:
            if i in held and f.cooldowns.get("c4", 0.0) <= 0.0:
                f.held_c4 = minf(f.held_c4 + dt, 0.81)
                continue
            if f.held_c4 > 0.0 or (i in taps and not held.has(i)):
                var power: float = f.held_c4 / 0.81
                f.held_c4 = 0.0
                try_skill(f, target, a, power)
            continue
        if i in taps:
            try_skill(f, target, a)

func try_skill(f, target, a: Dictionary, power := 0.0) -> bool:
    var empowered: bool = f.ultimate > 0.0
    var cooldowns: Dictionary = f.ultimate_cooldowns if empowered else f.cooldowns
    var key: String = a.key
    if key == "astral" and f.astral > 0.0:
        f.astral = 0.0
        return true
    if f.cast > 0.0 or f.attack >= 0 or f.stun > 0.0 or f.astral > 0.0 or cooldowns.get(key, 0.0) > 0.0:
        return false
    if f.ultimate > 0.0 and f.profile.id == "afghanistan" and key == "net" and f.counters.get("plane", false):
        return false
    if not (key == "noodle" and not empowered):
        cooldowns[key] = 10.0 if empowered and f.profile.id == "china" and key == "lantern" else float(a.cd) * (0.65 if empowered else 1.0)
    if empowered and f.profile.id == "afghanistan" and key == "net":
        f.counters.plane = true
    fx.use(f, target, key, empowered, power)
    return true

func activate_ultimate(f, target) -> void:
    if f.ultimate_used:
        return
    f.ultimate_used = true
    f.ultimate = 10.0
    f.charge = 0.0
    f.attack = -1
    f.cast = 0.58
    f.invulnerable = 0.35
    f.ultimate_cooldowns.clear()
    match f.profile.id:
        "ukraine":
            f.capacity += 20
            f.hp = minf(f.capacity, f.hp + 20)
            f.counters.aura = 0.6
        "america": f.guard = 100
        "russia":
            if f.center().distance_to(target.center()) <= 270:
                target.hit(15, f.facing, 700, f, false, 210)
        "china":
            f.motion.y = -480
    burst(f.center(), Color(f.profile.accent), 28, 196)
    shake = 7.0

func update_form(f, target, dt: float) -> void:
    if f.ultimate <= 0.0:
        f.guard = 0.0
        return
    if f.profile.id == "ukraine":
        f.counters.aura -= dt
        if f.counters.aura <= 0.0:
            f.counters.aura = 0.6
            if f.center().distance_to(target.center()) < 320:
                target.hp = maxf(0, target.hp - (4.0 if target.astral <= 0.0 else 0.0))
                burst(target.center(), Color("#a9e772"), 4)

func ghost_strike(f, target) -> void:
    fx.make("ghost", f, target, target.center() + Vector2(-f.facing * 110, 0), Vector2(f.facing * 575, 0), 0.7, 7, 41)

func detonate(f) -> void:
    fx.detonate(f)

func interrupt(f) -> void:
    fx.interrupt(f)

func update_camera(dt: float) -> void:
    var a: Node2D = fighters[0]
    var b: Node2D = fighters[1]
    var viewport := get_viewport_rect().size
    var reference := minf(viewport.x / 1600.0, viewport.y / 900.0)
    var target_zoom := clampf(1510.0 / (absf(a.position.x - b.position.x) + 470.0), 0.37, 1.0) * reference
    camera.zoom = camera.zoom.lerp(Vector2.ONE * target_zoom, minf(dt * 5.0, 1.0))
    var half_width := viewport.x * 0.5 / maxf(camera.zoom.x, 0.1)
    var middle: Vector2 = (a.position + b.position) * 0.5
    var center_x := 1800.0 if half_width > 1750.0 else clampf(middle.x, half_width, 3600.0 - half_width)
    camera.position = camera.position.lerp(Vector2(center_x, lerpf(420.0, 486.0, clampf((middle.y - 320.0) / 430.0, 0.0, 1.0))), minf(dt * 6.0, 1.0))
    shake = move_toward(shake, 0.0, dt * 42.0)
    camera.offset = Vector2(sin(age * 113.0), cos(age * 155.0)) * shake

func make_impact() -> AudioStreamWAV:
    var wave := AudioStreamWAV.new()
    wave.format = AudioStreamWAV.FORMAT_16_BITS
    wave.mix_rate = 22050
    var bytes := PackedByteArray()
    bytes.resize(4400)
    for i in range(2200):
        var t := float(i) / 22050.0
        var envelope := exp(-t * 44.0)
        var sample := int((sin(TAU * (156.0 - t * 740.0) * t) + randf_range(-0.42, 0.42)) * envelope * 11800.0)
        bytes.encode_s16(i * 2, sample)
    wave.data = bytes
    return wave

func hit_feedback(p: Vector2, amount: float, defended: bool, impulse: float) -> void:
    var color := Color("#7cdcff") if defended else Color("#ffdb91")
    burst(p, color, 7 if defended else 12, 48)
    captions.append({"p": p - Vector2(0, 30), "t": 0.62, "text": "БЛОК" if defended else "%d" % ceili(amount), "color": color})
    hitstop = maxf(hitstop, 0.025 if defended else (0.055 if amount >= 10 else 0.035))
    shake = maxf(shake, minf(impulse / 120.0, 7.0))
    sfx.pitch_scale = randf_range(0.87, 1.28) if not defended else 1.6
    sfx.play()

func burst(p: Vector2, color: Color, count: int, radius := 0.0) -> void:
    if radius > 0.0:
        rings.append({"p": p, "t": 0.34, "r": radius, "color": color})
    for i in range(count):
        var angle := randf() * TAU
        var velocity := Vector2(cos(angle), sin(angle)) * randf_range(80.0, 520.0)
        particles.append({"p": p, "v": velocity, "t": randf_range(0.14, 0.48), "color": color})

func animate_fx(dt: float) -> void:
    for p in particles:
        p.t -= dt
        p.p += p.v * dt
        p.v.y += 380.0 * dt
    for r in rings:
        r.t -= dt
    for c in captions:
        c.t -= dt
        c.p.y -= 105.0 * dt
    particles.assign(particles.filter(func(p): return p.t > 0))
    rings.assign(rings.filter(func(p): return p.t > 0))
    captions.assign(captions.filter(func(p): return p.t > 0))

func _draw() -> void:
    draw_rect(Rect2(-5000, -5000, 13600, 10000), Color("#0c1222"))
    draw_texture_rect(BACKDROP, Rect2(0, -222, 3600, 971), false, Color("#8a9cbd"))
    for i in range(47):
        var shimmer := maxf(0, sin(age * (3.0 if celebrating else 1.6) + i * 1.92))
        if shimmer > 0.94:
            var x := i * 79.0
            var y := 500.0 + fposmod(sin(i * 21.78) * 164, 139.0)
            draw_circle(Vector2(x, y), 3.5, Color(0.66, 0.82, 1.0, (shimmer - 0.94) * 8.0))
    draw_rect(Rect2(0, FLOOR, 3600, 260), Color("#172137"))
    draw_rect(Rect2(0, FLOOR + 3, 3600, 16), Color("#25334d"))
    draw_line(Vector2(0, FLOOR), Vector2(3600, FLOOR), Color("#83b6e6"), 3)
    for i in range(28):
        draw_line(Vector2(i * 140, FLOOR + 13), Vector2(i * 156 - 260, FLOOR + 265), Color("#253452"), 2)
    for offset in [40.0, 94.0, 174.0]:
        draw_line(Vector2(0, FLOOR + offset), Vector2(3600, FLOOR + offset), Color("#253452"), 2)
    for spring in SPRINGS:
        draw_rect(Rect2(spring - 44, FLOOR - 5, 88, 18), Color("#b46a4c"))
        draw_line(Vector2(spring - 41, FLOOR - 5), Vector2(spring + 41, FLOOR - 5), Color("#ffd498"), 3)
    if pickup >= 0:
        var item: Array = PICKUPS[pickup]
        var point := pickup_point + Vector2(0, sin(age * 4.0) * 7.0)
        draw_circle(point, 29, Color(item[2], 0.27), true, -1.0, true)
        draw_circle(point, 22, Color("#1a243d"), true, -1.0, true)
        draw_circle(point, 22, item[2], false, 2.5, true)
        draw_string(ThemeDB.fallback_font, point + Vector2(-21, 8), item[1], HORIZONTAL_ALIGNMENT_CENTER, 42, 24, item[2])
    for span in SPANS:
        var ledge := Rect2(span.x, span.y, span.z, 22)
        draw_rect(ledge.grow(5.0), Color(0.09, 0.20, 0.42, 0.45))
        draw_rect(ledge, Color("#303d58"))
        draw_line(ledge.position, ledge.position + Vector2(span.z, 0), Color("#b2d4f5"), 3)
        draw_rect(Rect2(span.x + 10, span.y + 13, span.z - 20, 3), Color("#5686bd"))
    for f in fighters:
        var p := Vector2(f.position.x, FLOOR + 2)
        draw_set_transform(p, 0.0, Vector2(1.0, 0.22))
        draw_circle(Vector2.ZERO, 55.0, Color(0.02, 0.05, 0.09, 0.70), true, -1.0, true)
        draw_set_transform(Vector2.ZERO)
        if f.ultimate > 0.0 or f.charge > 0.0 or f.parry > 0.0:
            var warning_color := Color(f.profile.accent)
            warning_color.a = 0.5
            draw_arc(f.center(), 82 + 9 * sin(age * 10.0), age * 5.0, age * 5.0 + 4.9, 40, warning_color, 5.0, true)
    if fx != null:
        for item in fx.objects:
            draw_ability(item)
    for r in rings:
        var color: Color = r.color
        color.a = r.t * 2.5
        draw_arc(r.p, maxf(1.0, r.r * (1.0 - r.t / 0.39)), 0, TAU, 48, color, 3.0, true)
    for p in particles:
        var color: Color = p.color
        color.a = clampf(p.t * 4.0, 0.0, 1.0)
        draw_line(p.p, p.p - p.v * 0.017, color, 2.5, true)
    for c in captions:
        var color: Color = c.color
        color.a = minf(c.t * 3.0, 1.0)
        draw_string(ThemeDB.fallback_font, c.p, c.text, HORIZONTAL_ALIGNMENT_CENTER, 56, 23, color)

func draw_ability(item: Dictionary) -> void:
    var p: Vector2 = item.p
    var color: Color = item.color
    var radius := clampf(item.radius * 0.40, 6, 49)
    var trim := color.lightened(0.55)
    match item.kind:
        "drone", "plane", "eagle":
            var direction: Vector2 = item.v.normalized() if item.v.length() > 0 else Vector2.RIGHT
            draw_set_transform(p, direction.angle())
            var wings := PackedVector2Array([Vector2(radius, 0), Vector2(-radius * 0.65, -radius * 0.8), Vector2(-radius * 0.28, 0), Vector2(-radius * 0.65, radius * 0.8)])
            draw_colored_polygon(wings, color)
            draw_line(Vector2(-radius * 0.45, 0), Vector2(radius, 0), trim, 3.0, true)
            draw_set_transform(Vector2.ZERO)
        "c4", "grave", "lantern":
            draw_rect(Rect2(p - Vector2(17, 17), Vector2(34, 30)), Color("#273040"))
            draw_rect(Rect2(p - Vector2(17, 17), Vector2(34, 30)), color, false, 3)
            draw_circle(p, 4 + sin(age * 10.0) * 2, trim)
        "bear", "bear_carry":
            draw_set_transform(p, 0.0, Vector2(signf(item.v.x), 1.0))
            draw_rect(Rect2(-50, -24, 78, 53), Color("#80544b"))
            draw_circle(Vector2(27, -9), 29.0, Color("#9d6555"))
            draw_circle(Vector2(14, -36), 9.0, Color("#9d6555"))
            draw_circle(Vector2(37, -32), 8.0, Color("#9d6555"))
            draw_circle(Vector2(49, 0), 13.0, Color("#cf9b78"))
            draw_circle(Vector2(53, -3), 5.0, Color("#281f29"))
            draw_set_transform(Vector2.ZERO)
        "shield":
            draw_circle(p, 29, Color("#de5a69"), true, -1.0, true)
            draw_circle(p, 22, Color("#eeeaff"), true, -1.0, true)
            draw_circle(p, 15, Color("#4e91e0"), true, -1.0, true)
            draw_string(ThemeDB.fallback_font, p + Vector2(-9, 7), "★", HORIZONTAL_ALIGNMENT_LEFT, -1, 22, Color.WHITE)
        "swing", "stance", "dragon_grab", "meal", "rifle":
            draw_arc(p, radius + 15 * sin(age * 13.0), 0, TAU, 28, color, 3.0, true)
        _:
            var trail: Vector2 = item.v.normalized() * (radius * 3.4)
            draw_line(p - trail, p, color, radius * 0.57, true)
            draw_circle(p, radius, Color(color, 0.39), true, -1.0, true)
            draw_circle(p, radius * 0.48, trim, true, -1.0, true)
