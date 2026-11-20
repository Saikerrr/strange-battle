extends SceneTree

const APP := preload("res://scenes/session.tscn")
var game
var failures: Array[String] = []

func _initialize() -> void:
    call_deferred("run")

func expect(value: bool, message: String) -> void:
    if not value:
        failures.append(message)
        push_error(message)

func key(code: Key, value: bool, location := KEY_LOCATION_UNSPECIFIED) -> void:
    var event := InputEventKey.new()
    event.physical_keycode = code
    event.location = location
    event.pressed = value
    Input.parse_input_event(event)

func advance(seconds: float) -> void:
    await create_timer(seconds).timeout

func screenshot(filename: String) -> void:
    if DisplayServer.get_name() == "headless":
        return
    await RenderingServer.frame_post_draw
    expect(root.get_texture().get_image().save_png("res://verification/" + filename) == OK, "Could not save " + filename)

func run() -> void:
    create_timer(30).timeout.connect(func():
        push_error("Game smoke test timed out")
        quit(1)
    )
    game = APP.instantiate()
    root.add_child(game)
    await process_frame
    expect(game.catalog.roster.size() == 6, "Expected six fighters")
    expect(game.catalog.abilities.size() == 18, "Expected eighteen draft skills")
    for fighter in game.catalog.roster:
        for pose in ["idle", "run", "runstep", "jump", "block", "punch", "kick", "heavy", "cast", "hit", "victory", "ultimate"]:
            expect(ResourceLoader.exists("res://assets/fighters/%s_%s.png" % [fighter.id, pose]), "Missing %s pose for %s" % [pose, fighter.id])
    game.title.buttons[0].pressed.emit()
    await advance(0.48)
    expect(game.mode == "pvp" and game.screen != null, "Title PvP action failed")
    await screenshot("godot-select.png")
    game.choose_fighter(game.catalog.roster[0])
    game.choose_fighter(game.catalog.roster[1])
    await advance(0.51)
    var arena = game.battle
    expect(is_instance_valid(arena), "Fighter selection did not enter the arena")
    if not is_instance_valid(arena):
        quit(1)
        return
    arena.clock = 0
    await physics_frame
    await physics_frame
    var a = arena.fighters[0]
    var b = arena.fighters[1]
    var start: float = a.position.x
    key(KEY_D, true)
    await advance(0.16)
    key(KEY_D, false)
    expect(a.position.x > start + 15.0, "P1 physical key did not move")
    var b_start: float = b.position.x
    key(KEY_LEFT, true)
    await advance(0.15)
    key(KEY_LEFT, false)
    expect(b.position.x < b_start - 15.0, "P2 physical key did not move")
    key(KEY_W, true)
    await advance(0.12)
    key(KEY_W, false)
    expect(a.position.y < 710, "Jump did not leave the floor")
    key(KEY_ESCAPE, true)
    key(KEY_ESCAPE, false)
    await process_frame
    expect(arena.paused and is_instance_valid(game.modal), "Escape did not pause")
    var frozen: Vector2 = a.position
    await advance(0.08)
    expect(a.position == frozen, "Physics advanced behind pause")
    arena.restart()
    arena.clock = 0
    await advance(0.05)
    a = arena.fighters[0]
    b = arena.fighters[1]
    a.position.x = 1680
    b.position.x = 1765
    key(KEY_F, true)
    key(KEY_F, false)
    await advance(0.14)
    expect(b.hp < b.capacity, "Basic hit missed at melee distance")
    arena.announcement = ""
    await screenshot("godot-battle.png")
    await advance(0.33)
    key(KEY_SHIFT, true, KEY_LOCATION_RIGHT)
    key(KEY_SHIFT, false, KEY_LOCATION_RIGHT)
    await advance(0.10)
    expect(b.dash_cd > 0.0 and a.dash_cd == 0.0, "Right Shift did not dash only for P2")

    arena.end_round(1)
    arena.clock = 0
    await advance(0.05)
    expect(arena.round_number == 2, "Round did not advance")
    arena.end_round(1)
    arena.clock = 0
    await advance(0.05)
    expect(arena.phase == "result" and is_instance_valid(game.modal), "Two wins did not show result")
    arena.restart()
    expect(arena.scores == [0, 0] and arena.round_number == 1, "Rematch did not reset score")

    var pairings := 0
    var activations := 0
    for left in game.catalog.roster:
        for right in game.catalog.roster:
            arena.picks = [left, right]
            arena.start_round()
            a = arena.fighters[0]
            b = arena.fighters[1]
            expect(a.body.texture != null and b.body.texture != null, "Missing fighter sprite in pairing")
            a.position.x = 1650
            b.position.x = 1776
            for f in [a, b]:
                var target = b if f == a else a
                for skill in arena.skills_for(f):
                    f.cast = 0
                    f.stun = 0
                    f.astral = 0
                    expect(arena.try_skill(f, target, skill), "Normal skill failed " + skill.id)
                    activations += 1
                arena.activate_ultimate(f, target)
                expect(f.ultimate > 0.0, "Ultimate failed " + f.profile.id)
                for skill in arena.skills_for(f):
                    f.cast = 0
                    f.stun = 0
                    f.astral = 0
                    expect(arena.try_skill(f, target, skill), "Ultimate skill failed " + skill.id)
                    activations += 1
            for _step in range(130):
                arena.fx.step(1.0 / 60.0)
            expect(a.position.is_finite() and b.position.is_finite(), "Nonfinite position in pairing")
            pairings += 1
            await process_frame

    for level in range(3):
        arena.difficulty = level
        arena.mode = "pve"
        arena.start_round()
        a = arena.fighters[0]
        b = arena.fighters[1]
        var action: Dictionary = arena.bot(b, a, 1.0 / 60.0)
        expect(action.move != 0.0 and b.ai_wait > 0.0, "AI did not approach on difficulty %d" % level)
    arena.mode = "practice"
    arena.picks = [game.catalog.roster[0], {"id": "dummy", "name": "Манекен", "accent": "#ffffff"}]
    arena.start_round()
    b = arena.fighters[1]
    expect(b.dummy and b.capacity == 200.0 and b.body.texture != null, "Practice dummy was not initialized")
    a = arena.fighters[0]
    a.position = Vector2(1650, 750)
    b.position = Vector2(1740, 750)
    arena.fx.make("c4", a, b, Vector2(1690, 700), Vector2.ZERO, 10.0, 15.0, 150.0)
    arena.fx.make("c4", b, a, Vector2(1690, 700), Vector2.ZERO, 10.0, 15.0, 150.0)
    arena.detonate(a)
    expect(b.hp == 185.0 and a.hp == 100.0 and absf(a.motion.x) > 0, "C4 must hurt the opponent and only push its owner")
    expect(arena.fx.objects.size() == 1 and arena.fx.objects[0].owner == b, "Detonation consumed another player's charge")
    arena.pickup = 0
    arena.pickup_point = a.position
    a.hp = 70.0
    arena.update_pickup(0.016)
    expect(a.hp == 85.0 and arena.pickup == -1, "Health pickup did not restore and consume")
    a.position = Vector2(800.0, 753.0)
    arena.land(a, Vector2(800.0, 741.0))
    expect(a.motion.y < -800 and not a.floor_contact, "Spring did not launch the player")

    game.show_title()
    await process_frame
    expect(game.music.playing, "Menu music did not restart")
    game.title.buttons[1].pressed.emit()
    await advance(0.45)
    expect(game.mode == "pve", "Title PvE action failed")
    game.select_fighter()
    game.choose_fighter(game.catalog.roster[2])
    expect(game.picks.size() == 1, "Normal PvE must let the player pick the opponent")
    game.choose_fighter(game.catalog.roster[3])
    await advance(0.46)
    expect(game.battle.mode == "pve" and game.battle.fighters[1].profile.id == "china", "Normal PvE ignored selected opponent")
    game.show_title()
    game.title.buttons[2].pressed.emit()
    await advance(0.45)
    game.choose_fighter(game.catalog.roster[2])
    await advance(0.46)
    expect(game.battle.mode == "practice" and game.battle.fighters[1].dummy, "Title practice flow failed")
    game.show_title()
    await process_frame
    for draft_mode in ["pvp", "pve"]:
        game.mode = draft_mode
        game.drafting = true
        game.picks.clear()
        game.begin_draft()
        if draft_mode == "pvp":
            await screenshot("godot-draft.png")
        while game.turn < 6:
            expect(game.offers.size() == 3, "Draft needs three offers")
            game.take_draft(0)
        var unique := {}
        for kit in game.kits:
            expect(kit.size() == 3, "Draft did not fill kit")
            for skill in kit:
                unique[skill.id] = true
        expect(unique.size() == 6, "Draft repeated abilities across players")
        game.picks = [game.catalog.roster[1], game.catalog.roster[3]]
        game.start_battle()
        arena = game.battle
        a = arena.fighters[0]
        b = arena.fighters[1]
        expect(arena.skills_for(a) == game.kits[0], "Draft loadout not applied")
        arena.activate_ultimate(a, b)
        expect(arena.skills_for(a)[0].country == "russia", "Ultimate did not switch to native loadout")
        a.ultimate = 0.0
        expect(arena.skills_for(a) == game.kits[0], "Draft loadout did not return after ultimate")

    game.show_title()
    await process_frame
    game.queue_free()
    await process_frame
    await process_frame
    print("GODOT_GAME_CHECK pairs=%d activations=%d failures=%d" % [pairings, activations, failures.size()])
    quit(0 if failures.is_empty() else 1)
