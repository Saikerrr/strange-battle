extends Control

const MENU_WIDTH := 1600.0
const MENU_HEIGHT := 900.0
const BACKGROUND := preload("res://assets/menu/background.png")
const LOGO := preload("res://assets/menu/logo.png")
const PVP := preload("res://assets/menu/pvp.png")
const PVE := preload("res://assets/menu/pve.png")
const PRACTICE := preload("res://assets/menu/practice.png")
const GLOW_SHADER := preload("res://shaders/soft_glow.gdshader")

var background: TextureRect
var content: Control
var logo: TextureRect
var buttons: Array[TextureButton] = []
var glows: Array[ColorRect] = []
var elapsed := 0.0
var pointer_offset := Vector2.ZERO


func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    background = TextureRect.new()
    background.texture = BACKGROUND
    background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
    background.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(background)

    content = Control.new()
    content.size = Vector2(MENU_WIDTH, MENU_HEIGHT)
    content.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(content)

    _make_light(Vector2(340, -150), Vector2(520, 610), Color(0.89, 0.93, 1.0, 0.12))
    _make_light(Vector2(740, -150), Vector2(520, 610), Color(0.89, 0.93, 1.0, 0.12))

    logo = TextureRect.new()
    logo.texture = LOGO
    logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
    logo.position = Vector2(450, 70)
    logo.size = Vector2(700, 233)
    logo.mouse_filter = Control.MOUSE_FILTER_IGNORE
    content.add_child(logo)

    var textures := [PVP, PVE, PRACTICE]
    var colors := [Color(0.85, 0.12, 0.22, 0.30), Color(0.18, 0.44, 0.9, 0.28), Color(0.85, 0.88, 0.92, 0.22)]
    for index in range(3):
        var center := Vector2(800, 425 + index * 120)
        var glow := _make_light(center - Vector2(240, 60), Vector2(480, 120), colors[index])
        glows.append(glow)

        var button := TextureButton.new()
        button.texture_normal = textures[index]
        button.ignore_texture_size = true
        button.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
        button.position = center - Vector2(180, 60)
        button.size = Vector2(360, 120)
        button.pivot_offset = button.size * 0.5
        button.focus_mode = Control.FOCUS_NONE
        button.mouse_entered.connect(_on_button_hover.bind(index, true))
        button.mouse_exited.connect(_on_button_hover.bind(index, false))
        button.button_down.connect(_on_button_down.bind(index))
        button.button_up.connect(_on_button_up.bind(index))
        content.add_child(button)
        buttons.append(button)

    resized.connect(_layout)
    _layout()


func _make_light(at: Vector2, dimensions: Vector2, tint: Color) -> ColorRect:
    var light := ColorRect.new()
    light.position = at
    light.size = dimensions
    light.mouse_filter = Control.MOUSE_FILTER_IGNORE
    var glow_material := ShaderMaterial.new()
    glow_material.shader = GLOW_SHADER
    glow_material.set_shader_parameter("glow_color", tint)
    glow_material.set_shader_parameter("intensity", 1.0)
    light.material = glow_material
    content.add_child(light)
    return light


func _layout() -> void:
    var viewport_size := size
    if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
        return
    var scale_factor: float = minf(viewport_size.x / MENU_WIDTH, viewport_size.y / MENU_HEIGHT)
    content.scale = Vector2.ONE * scale_factor
    content.position = (viewport_size - Vector2(MENU_WIDTH, MENU_HEIGHT) * scale_factor) * 0.5
    var background_scale: float = maxf(viewport_size.x / BACKGROUND.get_width(), viewport_size.y / BACKGROUND.get_height()) * 1.035
    background.size = Vector2(BACKGROUND.get_size()) * background_scale
    background.position = (viewport_size - background.size) * 0.5 + pointer_offset


func _process(delta: float) -> void:
    elapsed += delta
    var position_in_window := get_viewport().get_mouse_position()
    var normalized := Vector2(
        clampf(position_in_window.x / maxf(size.x, 1.0) * 2.0 - 1.0, -1.0, 1.0),
        clampf(position_in_window.y / maxf(size.y, 1.0) * 2.0 - 1.0, -1.0, 1.0)
    )
    pointer_offset = pointer_offset.lerp(Vector2(-normalized.x * 11.0, -normalized.y * 7.0), minf(1.0, delta * 4.0))
    background.position = (size - background.size) * 0.5 + pointer_offset
    logo.position = Vector2(450, 70 + sin(elapsed * 0.85) * 2.5) + pointer_offset * 0.10
    for index in range(buttons.size()):
        var glow_material := glows[index].material as ShaderMaterial
        var current: float = glow_material.get_shader_parameter("intensity")
        var target := 1.65 if buttons[index].is_hovered() else 1.0
        glow_material.set_shader_parameter("intensity", lerpf(current, target, minf(1.0, delta * 8.0)))


func _on_button_hover(index: int, hovered: bool) -> void:
    var button := buttons[index]
    var tween := create_tween().set_parallel(true)
    tween.tween_property(button, "scale", Vector2.ONE * (1.04 if hovered else 1.0), 0.16)
    tween.tween_property(button, "modulate", Color(1.13, 1.13, 1.13) if hovered else Color.WHITE, 0.16)


func _on_button_down(index: int) -> void:
    create_tween().tween_property(buttons[index], "scale", Vector2.ONE * 0.97, 0.07)


func _on_button_up(index: int) -> void:
    var target := 1.04 if buttons[index].is_hovered() else 1.0
    create_tween().tween_property(buttons[index], "scale", Vector2.ONE * target, 0.12)
