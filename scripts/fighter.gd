extends Node2D

const ATTACKS := [
    [0.075, 0.075, 0.17, 5.0, 98.0, 185.0],
    [0.12, 0.095, 0.25, 8.0, 119.0, 330.0],
    [0.23, 0.10, 0.35, 13.0, 126.0, 570.0],
]

var profile: Dictionary
var loadout: Array
var body: Sprite2D
var arena
var side: int
var dummy := false
var hp := 100.0
var capacity := 100.0
var motion := Vector2.ZERO
var facing := 1.0
var floor_contact := true
var jumps := 2
var blocking := false
var stun := 0.0
var rooted := 0.0
var silenced := 0.0
var invulnerable := 0.0
var parry := 0.0
var guard := 0.0
var astral := 0.0
var burn := 0.0
var dash_time := 0.0
var dash_cd := 0.0
var ultimate := 0.0
var ultimate_used := false
var charge := 0.0
var cooldowns: Dictionary = {}
var ultimate_cooldowns: Dictionary = {}
var counters: Dictionary = {}
var attack := -1
var attack_clock := 0.0
var attack_hit := false
var queue := -1
var buffer := 0.0
var chain := 0
var cast := 0.0
var animation_time := 0.0
var pose := "idle"
var ai_wait := 0.0
var ai_walk := 0.0
var ai_block := false
var held_c4 := 0.0
var haste := 0.0
var speed_boost := 0.0
var bonus_shots := 0
var next_bonus_shot := 0.0

func setup(world, selected: Dictionary, skills: Array, player: int, is_dummy: bool) -> void:
    arena = world
    profile = selected
    loadout = skills
    side = player
    dummy = is_dummy
    capacity = 200.0 if dummy else 100.0
    hp = capacity
    body = Sprite2D.new()
    body.texture = arena.fighter_texture(str(profile.id))
    body.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
    body.centered = false
    add_child(body)

func center() -> Vector2:
    return position - Vector2(0, 85)

func request_attack(index: int) -> void:
    queue = index
    buffer = 0.15

func hit(amount: float, direction: float, impulse: float, source, melee := false, lift := 0.0) -> bool:
    if hp <= 0.0 or invulnerable > 0.0 or astral > 0.0:
        return false
    if melee and parry > 0.0 and is_instance_valid(source):
        parry = 0.0
        source.hit(20.0, -direction, 300.0, self)
        source.stun = 0.65
        if ultimate > 0.0:
            arena.ghost_strike(self, source)
        return false
    var defended := blocking and direction * facing < 0.0
    if ultimate > 0.0 and str(profile.id) in ["russia", "china", "japan", "america"]:
        amount *= 0.5
    if defended:
        if guard > 0.0:
            var absorbed := minf(guard, amount)
            guard -= absorbed
            amount -= absorbed
        amount *= 0.22
        impulse *= 0.22
        lift = 0.0
    else:
        stun = maxf(stun, 0.12 + minf(amount, 28.0) * 0.012)
        attack = -1
        cast = 0.0
        charge = 0.0
        if is_instance_valid(arena):
            arena.interrupt(self)
    hp = maxf(0.0, hp - amount)
    if not dummy:
        motion.x = direction * impulse
        if lift > 0.0:
            motion.y = -lift
            floor_contact = false
    arena.hit_feedback(center(), amount, defended, impulse)
    return true

func tick(dt: float, opponent, input: Dictionary) -> void:
    animation_time += dt
    haste = maxf(haste - dt, 0.0)
    speed_boost = maxf(speed_boost - dt, 0.0)
    var cooldown_step := dt * (2.0 if haste > 0.0 else 1.0)
    for key in cooldowns:
        cooldowns[key] = maxf(0.0, cooldowns[key] - cooldown_step)
    for key in ultimate_cooldowns:
        ultimate_cooldowns[key] = maxf(0.0, ultimate_cooldowns[key] - cooldown_step)
    for timer in ["stun", "rooted", "silenced", "invulnerable", "parry", "dash_time", "dash_cd", "cast", "buffer"]:
        set(timer, maxf(0.0, get(timer) - dt))
    if ultimate > 0.0:
        ultimate = maxf(0.0, ultimate - dt)
        arena.update_form(self, opponent, dt)
    if astral > 0.0:
        astral = maxf(0.0, astral - dt)
        hp = minf(capacity, hp + dt * (10.0 if ultimate > 0.0 else 6.0))
    if burn > 0.0:
        burn = maxf(0.0, burn - dt)
        hp = maxf(0.0, hp - dt * 3.0)
    if hp <= 0.0:
        blocking = false
        return
    if bonus_shots > 0:
        next_bonus_shot -= dt
        if next_bonus_shot <= 0.0:
            next_bonus_shot = 0.22
            bonus_shots -= 1
            arena.fire_pickup(self, opponent)
    var walk: float = input.get("move", 0.0)
    if attack < 0 and cast <= 0.0 and dash_time <= 0.0 and stun <= 0.0:
        facing = 1.0 if opponent.position.x >= position.x else -1.0
    blocking = input.get("block", false) and attack < 0 and cast <= 0.0 and stun <= 0.0 and dash_time <= 0.0
    if stun <= 0.0:
        if input.has("attack") and buffer <= 0.0:
            request_attack(input.attack)
        if input.get("detonate", false):
            arena.detonate(self)
        arena.process_skills(self, opponent, input, dt)
        if input.get("ult", false) and not ultimate_used and not dummy:
            charge += dt
            if charge >= 2.0:
                arena.activate_ultimate(self, opponent)
        else:
            charge = 0.0
        if not dummy and rooted <= 0.0 and astral <= 0.0:
            if input.get("jump", false) and jumps > 0:
                motion.y = -870.0 if jumps == 2 else -740.0
                jumps -= 1
                floor_contact = false
                arena.burst(position, Color("#bad9ff"), 5)
            if input.get("dash", false) and dash_cd <= 0.0 and attack < 0:
                dash_time = 0.16
                dash_cd = 1.1
                motion.x = signf(walk if walk != 0 else facing) * 1160.0
        if dash_time <= 0.0 and (attack < 0 or attack_clock < 0.09):
            var speed := 350.0 * (0.5 if blocking else 1.0)
            if speed_boost > 0.0:
                speed *= 1.32
            var target := walk * speed if rooted <= 0.0 and not dummy and (astral <= 0.0 or ultimate > 0.0) else 0.0
            motion.x = move_toward(motion.x, target, dt * (2400.0 if floor_contact else 1500.0))
    else:
        motion.x = move_toward(motion.x, 0.0, dt * 680.0)
    if buffer > 0.0 and stun <= 0.0 and cast <= 0.0 and dash_time <= 0.0 and astral <= 0.0:
        var can_chain: bool = attack >= 0 and attack_hit and queue > attack and attack_clock >= ATTACKS[attack][0] + ATTACKS[attack][1]
        if attack < 0 or can_chain:
            chain = chain + 1 if can_chain else 1
            attack = queue
            attack_clock = 0.0
            attack_hit = false
            blocking = false
            buffer = 0.0
    if attack >= 0:
        var frames: Array = ATTACKS[attack]
        var previous := attack_clock
        attack_clock += dt
        if not attack_hit and attack_clock >= frames[0] and previous < frames[0] + frames[1]:
            var offset: Vector2 = opponent.center() - center()
            if offset.x * facing >= -15.0 and absf(offset.x) <= frames[4] and absf(offset.y) <= 100.0:
                attack_hit = opponent.hit(frames[3] + chain - 1.0, facing, frames[5], self, true, 290.0 if attack == 2 else 0.0)
                if opponent.invulnerable <= 0.0 and opponent.astral <= 0.0:
                    attack_hit = true
        if attack >= 0 and attack_clock >= frames[0] + frames[1] + frames[2]:
            attack = -1
    if not dummy:
        var flight := ultimate > 0.0 and str(profile.id) in ["america", "china"]
        if flight and stun <= 0.0:
            motion.y = move_toward(motion.y, input.get("vertical", 0.0) * 490.0, 2100.0 * dt)
        else:
            motion.y += 2350.0 * dt
        var before := position
        position += motion * dt
        position.x = clampf(position.x, 90.0, 3510.0)
        position.y = maxf(180.0, position.y)
        arena.land(self, before)
    update_pose(dt)

func update_pose(dt: float) -> void:
    if not is_instance_valid(body):
        return
    var stage := Vector2.ZERO
    var angle := 0.0
    var stretch := Vector2.ONE
    pose = "idle"
    if hp <= 0.0:
        pose = "ko"
        angle = -1.48
        stage.y = -17
    elif stun > 0.0:
        pose = "hit"
        angle = -0.28
        stretch = Vector2(0.89, 1.08)
    elif attack >= 0:
        pose = ["punch", "kick", "heavy"][attack]
        var timing: Array = ATTACKS[attack]
        var reach := sin(clampf(attack_clock / (timing[0] + timing[1]), 0.0, 1.0) * PI * 0.5)
        reach *= clampf(1.0 - (attack_clock - timing[0] - timing[1]) / timing[2], 0.0, 1.0)
        stage.x = reach * (22.0 + attack * 7.0)
        angle = 0.38 * reach
        stretch = Vector2(1.0 + reach * 0.16, 1.0 - reach * 0.09)
    elif charge > 0.0 or cast > 0.0:
        pose = "cast"
        stage.y = -8.0 - sin(animation_time * 15.0) * 4.0
        angle = -0.13
    elif parry > 0.0:
        pose = "block"
        angle = -0.18
    elif blocking:
        pose = "block"
        stretch = Vector2(1.09, 0.83)
        angle = -0.18
    elif not floor_contact:
        pose = "jump"
        angle = clampf(motion.x / 2400.0, -0.23, 0.23) * facing
        stretch = Vector2(0.96, 1.06)
    elif absf(motion.x) > 45.0:
        pose = "run"
        var stride := fposmod(animation_time * 3.7, 1.0)
        stage.y = -sin(stride * PI) * 9.0
        angle = 0.10 * signf(motion.x) * facing
        stretch.y += sin(stride * TAU) * 0.026
    else:
        stretch.y += sin(animation_time * 3.7) * 0.021
    if arena.celebrating == side and hp > 0.0:
        pose = "victory"
        stage.y = -absf(sin(animation_time * 5.0)) * 25.0
        angle = -0.11
    var frame := pose
    if attack >= 0 and (attack_clock < ATTACKS[attack][0] * 0.75 or attack_clock > ATTACKS[attack][0] + ATTACKS[attack][1] + 0.08):
        frame = "idle"
    if pose == "run" and fposmod(animation_time * 3.7, 1.0) > 0.44:
        frame = "runstep"
    if ultimate > 0.0 and frame in ["idle", "cast", "jump", "run", "runstep"]:
        frame = "ultimate"
    body.texture = arena.fighter_texture(str(profile.id), frame)
    body.rotation = lerp_angle(body.rotation, angle * facing, minf(dt * 24.0, 1.0))
    body.position = stage * Vector2(facing, 1.0)
    if body.texture:
        var factor := (196.0 if dummy else 216.0) / body.texture.get_height()
        body.offset = Vector2(-body.texture.get_width() * 0.5, -body.texture.get_height())
        body.scale = stretch * factor * Vector2(facing, 1.0)
    body.modulate = Color("#ffd5ca") if stun > 0.0 else Color.WHITE
    if astral > 0.0:
        body.modulate = Color(0.64, 0.85, 1.0, 0.42)
    elif ultimate > 0.0:
        body.modulate = Color("#badfff") if str(profile.id) != "ukraine" else Color("#baff92")
