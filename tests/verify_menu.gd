extends SceneTree


func _initialize() -> void:
    call_deferred("_verify")


func _verify() -> void:
    var result := change_scene_to_file("res://scenes/main_menu.tscn")
    assert(result == OK, "Menu scene failed to load")
    await process_frame
    await process_frame
    var menu := current_scene
    assert(menu != null and menu.buttons.size() == 3, "Expected three menu buttons")
    assert(menu.logo.texture != null and menu.background.texture != null, "Missing artwork")
    assert(menu.buttons[0].texture_normal != null, "Missing PVP image")
    assert(menu.buttons[1].texture_normal != null, "Missing PVE image")
    assert(menu.buttons[2].texture_normal != null, "Missing practice image")
    assert(menu.background.size.x >= menu.size.x and menu.background.size.y >= menu.size.y, "Background does not cover window")
    Input.warp_mouse(Vector2(50, 360))
    await create_timer(0.3).timeout
    var left_position: Vector2 = menu.background.position
    Input.warp_mouse(Vector2(1200, 360))
    await create_timer(0.3).timeout
    assert(menu.background.position.x < left_position.x - 6.0, "Cursor parallax did not move")

    DisplayServer.window_set_size(Vector2i(1000, 600))
    for frame in range(5):
        await process_frame
    assert(menu.background.size.x >= menu.size.x and menu.background.size.y >= menu.size.y, "Small window has empty background edges")
    for button in menu.buttons:
        var bounds: Rect2 = button.get_global_rect()
        assert(bounds.position.x >= 0.0 and bounds.end.x <= menu.size.x, "Button exceeds window width")
        assert(bounds.position.y >= 0.0 and bounds.end.y <= menu.size.y, "Button exceeds window height")
    DisplayServer.window_set_size(Vector2i(1280, 720))
    for frame in range(5):
        await process_frame
    menu.buttons[0].mouse_entered.emit()
    await create_timer(0.2).timeout
    assert(menu.buttons[0].scale.x > 1.0, "PVP hover animation did not start")
    print("MENU_CHECK_OK 3 buttons, artwork, background coverage")
    await RenderingServer.frame_post_draw
    var image := get_root().get_texture().get_image()
    var destination := ProjectSettings.globalize_path("res://verification/menu.png")
    var saved := image.save_png(destination)
    assert(saved == OK, "Could not save menu screenshot")
    print("MENU_SCREENSHOT_OK ", destination)
    quit()
