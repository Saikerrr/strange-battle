extends SceneTree

const ARENA := preload("res://scenes/stick_fight.tscn")
var game
var failed := 0

func _initialize() -> void:
    call_deferred("verify")

func check(value: bool, message: String) -> void:
    if not value:
        failed += 1
        push_error(message)

func key(code: Key, down: bool) -> void:
    var event := InputEventKey.new()
    event.physical_keycode = code
    event.pressed = down
    Input.parse_input_event(event)

func verify() -> void:
    game = ARENA.instantiate()
    root.add_child(game)
    await process_frame
    if game.fighters.size() != 2:
        quit(1)
        return
    game.ready_time = 0
    var left = game.fighters[0]
    var right = game.fighters[1]
    await create_timer(0.72).timeout
    check(right.position.x < 1480, "CPU did not approach")
    key(KEY_TAB, true)
    key(KEY_TAB, false)
    await process_frame
    check(not game.versus_bot, "Tab did not enable local play")
    game.ready_time = 0
    key(KEY_D, true)
    key(KEY_LEFT, true)
    await create_timer(0.18).timeout
    key(KEY_D, false)
    key(KEY_LEFT, false)
    check(left.position.x > 1095 and right.position.x < 1465, "Both players must move")
    key(KEY_W, true)
    key(KEY_W, false)
    await create_timer(0.12).timeout
    check(left.position.y < 625, "Jump did not lift the fighter")
    key(KEY_ESCAPE, true)
    key(KEY_ESCAPE, false)
    var frozen: Vector2 = left.position
    await create_timer(0.10).timeout
    check(game.paused and frozen == left.position, "Pause did not freeze physics")
    key(KEY_R, true)
    key(KEY_R, false)
    await process_frame
    check(not game.paused and left.hp == 100 and right.hp == 100, "Restart did not reset health or pause")
    game.ready_time = 0
    left.position.x = 740
    right.position.x = 836
    key(KEY_DOWN, true)
    key(KEY_F, true)
    key(KEY_F, false)
    await create_timer(0.16).timeout
    check(right.hp > 92 and right.hp < 100, "Guard did not mitigate the hit")
    key(KEY_DOWN, false)
    for move in range(3):
        game.reset()
        game.ready_time = 0
        left.position.x = 740
        right.position.x = 836
        var code: Key = [KEY_F, KEY_G, KEY_H][move]
        key(code, true)
        key(code, false)
        await create_timer(0.32).timeout
        check(right.hp == [92.0, 87.0, 81.0][move], "Move did not hit once: %d" % move)
        if move == 2:
            check(right.motion.y < 0, "Uppercut did not launch its opponent")
    game.reset()
    game.ready_time = 0
    left.position.x = 740
    right.position.x = 836
    key(KEY_F, true)
    key(KEY_F, false)
    await create_timer(0.16).timeout
    key(KEY_G, true)
    key(KEY_G, false)
    await create_timer(0.35).timeout
    check(right.hp == 79.0, "Buffered kick failed to chain after punch")
    game.reset()
    game.ready_time = 0
    left.position.x = 740
    right.position.x = 836
    right.hp = 6
    key(KEY_KP_4, true)
    key(KEY_KP_4, false)
    await create_timer(0.21).timeout
    check(left.hp == 92, "Numpad attack did not hit")
    left.stun = 0
    left.motion = Vector2.ZERO
    right.motion = Vector2.ZERO
    left.position.x = 740
    right.position.x = 836
    key(KEY_H, true)
    key(KEY_H, false)
    await create_timer(0.27).timeout
    check(game.winner == 1 and right.hp == 0, "KO did not award the win")
    game.reset()
    game.ready_time = 0
    left.position.x = 510
    right.position.x = 1790
    key(KEY_W, true)
    key(KEY_W, false)
    await create_timer(0.62).timeout
    check(left.grounded() and is_equal_approx(left.position.y, 545.0), "Jump did not land on the first platform")
    key(KEY_S, true)
    key(KEY_W, true)
    key(KEY_W, false)
    await create_timer(0.33).timeout
    key(KEY_S, false)
    check(is_equal_approx(left.position.y, 680.0), "Drop through did not return to the ground")
    for side in range(2):
        for slot in range(3):
            game.reset()
            game.ready_time = 0
            var caster = game.fighters[side]
            var target = game.fighters[1 - side]
            caster.position.x = 620 if side == 0 else 830
            target.position.x = caster.position.x + caster.facing * (160 if slot != 0 else 205)
            var code: Key = [KEY_Z, KEY_X, KEY_C][slot] if side == 0 else [KEY_KP_1, KEY_KP_2, KEY_KP_3][slot]
            key(code, true)
            key(code, false)
            for frame in range(62):
                await physics_frame
            check(caster.cooldowns[slot] > 0, "Ability did not start its cooldown: %d:%d" % [side, slot])
            check(target.hp < 100, "Ability missed inside its effective range: %d:%d caster=%s target=%s cooldown=%s" % [side, slot, caster.position, target.position, caster.cooldowns[slot]])
    game.reset()
    game.ready_time = 0
    left.position.x = 120
    right.position.x = 2440
    await create_timer(0.79).timeout
    var frame_width: float = 1600.0 / game.camera.zoom.x
    check(frame_width >= 2450, "Camera did not widen for opposite ends of the arena")
    if DisplayServer.get_name() != "headless":
        game.reset()
        game.ready_time = 0
        left.position.x = 1082
        right.position.x = 1478
        game.update_hud()
        await process_frame
        await RenderingServer.frame_post_draw
        check(root.get_texture().get_image().save_png("res://verification/stick-fight.png") == OK, "Screenshot failed")
        key(KEY_C, true)
        key(KEY_C, false)
        key(KEY_KP_3, true)
        key(KEY_KP_3, false)
        await create_timer(0.42).timeout
        await RenderingServer.frame_post_draw
        check(root.get_texture().get_image().save_png("res://verification/stick-skills.png") == OK, "Skill screenshot failed")
    game.impact.stop()
    game.queue_free()
    await process_frame
    await process_frame
    print("STICK_FIGHT_CHECK failures=%d" % failed)
    quit(1 if failed else 0)
