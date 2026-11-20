extends Control

const TITLE := preload("res://scenes/main_menu.tscn")
const ARENA := preload("res://scripts/arena.gd")
const SELECT_BG := preload("res://assets/menu/selection-background.png")
const DRAFT_BG := preload("res://assets/draft/background.png")
const DRAFT_CARD := preload("res://assets/draft/card.png")
const CLOTH := preload("res://shaders/flag_cloth.gdshader")
const CLICK := preload("res://assets/audio/click.ogg")
const HOVER := preload("res://assets/audio/hover.ogg")
const SWEEP := preload("res://assets/audio/transition.ogg")
const SONG := preload("res://assets/audio/dark-city.wav")
const FLAGS := ["ua", "ru", "us", "cn", "jp", "af"]
const LEVELS := ["Легко", "Средне", "Сложно"]

var catalog: Dictionary
var title: Control
var screen: Control
var battle: Node2D
var layer: CanvasLayer
var hud: Control
var modal: Control
var banner: Label
var meters: Array[ProgressBar] = []
var fighter_labels: Array[Label] = []
var skill_rows: Array[HBoxContainer] = []
var skills_shown := ["", ""]
var music: AudioStreamPlayer
var click: AudioStreamPlayer
var hover: AudioStreamPlayer
var sweep: AudioStreamPlayer
var cover: ColorRect
var transitioning := false
var mode := "pvp"
var drafting := false
var difficulty := 1
var picks: Array = []
var kits: Array = [[], []]
var available: Array = []
var offers: Array = []
var turn := 0

func _ready() -> void:
    catalog = JSON.parse_string(FileAccess.get_file_as_string("res://assets/game/catalog.json"))
    layer = CanvasLayer.new()
    add_child(layer)
    music = AudioStreamPlayer.new()
    music.stream = SONG
    music.volume_db = -12.0
    music.finished.connect(music.play)
    add_child(music)
    click = AudioStreamPlayer.new()
    click.stream = CLICK
    click.volume_db = -13.0
    add_child(click)
    hover = AudioStreamPlayer.new()
    hover.stream = HOVER
    hover.volume_db = -20.0
    add_child(hover)
    sweep = AudioStreamPlayer.new()
    sweep.stream = SWEEP
    sweep.volume_db = -17.0
    add_child(sweep)
    var fades := CanvasLayer.new()
    fades.layer = 20
    add_child(fades)
    cover = ColorRect.new()
    cover.color = Color(0.02, 0.025, 0.05, 1)
    cover.modulate.a = 0
    cover.mouse_filter = Control.MOUSE_FILTER_IGNORE
    fades.add_child(cover)
    cover.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    show_title()

func _process(_dt: float) -> void:
    if not is_instance_valid(battle) or battle.fighters.size() != 2:
        return
    banner.text = battle.announcement
    for index in range(2):
        var f = battle.fighters[index]
        meters[index].max_value = f.capacity
        meters[index].value = f.hp
        fighter_labels[index].text = "%s   %d / %d   %s" % [("МАНЕКЕН" if f.dummy else f.profile.name), ceili(f.hp), ceili(f.capacity), "◆".repeat(battle.scores[index])]
        update_skill_row(index, f)

func _unhandled_key_input(event: InputEvent) -> void:
    if transitioning or not event is InputEventKey or not event.pressed or event.echo:
        return
    if is_instance_valid(battle) and battle.phase == "result" and event.physical_keycode in [KEY_ENTER, KEY_R]:
        fade(return_to_selection)
        get_viewport().set_input_as_handled()

func full(control: Control, parent: Node) -> void:
    parent.add_child(control)
    control.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

func dispose(node) -> void:
    if is_instance_valid(node):
        var parent: Node = node.get_parent()
        if parent:
            parent.remove_child(node)
        node.queue_free()

func fade(action: Callable) -> void:
    if transitioning:
        return
    transitioning = true
    click.play()
    sweep.play()
    cover.mouse_filter = Control.MOUSE_FILTER_STOP
    var tween := create_tween()
    tween.tween_property(cover, "modulate:a", 1.0, 0.20)
    tween.tween_callback(action)
    tween.tween_property(cover, "modulate:a", 0.0, 0.20)
    await tween.finished
    cover.mouse_filter = Control.MOUSE_FILTER_IGNORE
    transitioning = false

func show_title() -> void:
    dispose(screen)
    dispose(hud)
    dispose(modal)
    dispose(battle)
    battle = null
    if not music.playing:
        music.volume_db = -12
        music.play()
    title = TITLE.instantiate()
    full(title, layer)
    title.mode_selected.connect(choose_mode)
    for item in title.buttons:
        item.mouse_entered.connect(hover.play)

func choose_mode(choice: String) -> void:
    fade(func():
        dispose(title)
        drafting = choice == "draft"
        mode = "pvp" if drafting else choice
        picks.clear()
        kits = [[], []]
        turn = 0
        if drafting:
            draft_setup()
        elif mode == "pve":
            levels()
        else:
            select_fighter()
    )

func style(bg: Color, border: Color, width := 1) -> StyleBoxFlat:
    var box := StyleBoxFlat.new()
    box.bg_color = bg
    box.border_color = border
    box.set_border_width_all(width)
    box.set_corner_radius_all(8)
    box.content_margin_left = 14
    box.content_margin_right = 14
    box.content_margin_top = 8
    box.content_margin_bottom = 8
    return box

func label(value: String, font_size: int, tint := Color.WHITE) -> Label:
    var node := Label.new()
    node.text = value
    node.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    node.add_theme_font_size_override("font_size", font_size)
    node.add_theme_color_override("font_color", tint)
    node.add_theme_color_override("font_outline_color", Color("#141528"))
    node.add_theme_constant_override("outline_size", 5)
    return node

func button(value: String, callback: Callable, minimum := Vector2(235, 62), tint := Color("#80a8d8")) -> Button:
    var node := Button.new()
    node.text = value
    node.custom_minimum_size = minimum
    node.focus_mode = Control.FOCUS_NONE
    node.add_theme_font_size_override("font_size", 21)
    node.add_theme_stylebox_override("normal", style(Color("#19243bdc"), tint.darkened(0.3), 2))
    node.add_theme_stylebox_override("hover", style(Color("#31476de9"), tint.lightened(0.3), 2))
    node.add_theme_stylebox_override("pressed", style(Color("#101b32"), tint.lightened(0.2), 2))
    node.pressed.connect(callback)
    if not is_instance_valid(battle):
        node.mouse_entered.connect(hover.play)
    return node

func horizontal(parent: Node, separation := 14) -> HBoxContainer:
    var row := HBoxContainer.new()
    row.alignment = BoxContainer.ALIGNMENT_CENTER
    row.add_theme_constant_override("separation", separation)
    parent.add_child(row)
    return row

func page(heading: String, bg: Texture2D) -> VBoxContainer:
    dispose(screen)
    screen = Control.new()
    full(screen, layer)
    var picture := TextureRect.new()
    picture.texture = bg
    picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
    picture.mouse_filter = Control.MOUSE_FILTER_IGNORE
    full(picture, screen)
    var shade := ColorRect.new()
    shade.color = Color(0.025, 0.03, 0.075, 0.43)
    shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
    full(shade, screen)
    var center := CenterContainer.new()
    full(center, screen)
    var stack := VBoxContainer.new()
    stack.alignment = BoxContainer.ALIGNMENT_CENTER
    stack.add_theme_constant_override("separation", 23)
    center.add_child(stack)
    stack.add_child(label(heading, 50))
    return stack

func back(parent: VBoxContainer, callback: Callable) -> void:
    horizontal(parent).add_child(button("Назад", func(): fade(callback), Vector2(170, 49)))

func levels() -> void:
    var stack := page("Сложность противника", SELECT_BG if not drafting else DRAFT_BG)
    var row := horizontal(stack)
    for index in range(3):
        row.add_child(button(LEVELS[index], func():
            difficulty = index
            fade(begin_draft if drafting else select_fighter)
        ))
    back(stack, draft_setup if drafting else show_title)

func draft_setup() -> void:
    var stack := page("Ability Draft", DRAFT_BG)
    var row := horizontal(stack)
    row.add_child(button("Против друга", func():
        mode = "pvp"
        fade(begin_draft)
    ))
    row.add_child(button("Против ИИ", func():
        mode = "pve"
        fade(levels)
    ))
    back(stack, show_title)

func begin_draft() -> void:
    available = catalog.abilities.duplicate()
    kits = [[], []]
    turn = 0
    roll()
    draft_screen()

func roll() -> void:
    var pool := available.duplicate()
    pool.shuffle()
    offers = pool.slice(0, 3)

func take_draft(index: int) -> void:
    var ability: Dictionary = offers[index]
    kits[turn % 2].append(ability)
    available.erase(ability)
    turn += 1
    if turn == 6:
        select_fighter()
        return
    roll()
    if mode == "pve" and turn % 2 == 1:
        take_draft(randi_range(0, 2))
    else:
        draft_screen()

func draft_screen() -> void:
    var stack := page("Игрок %d · навык %d / 3" % [turn % 2 + 1, turn / 2 + 1], DRAFT_BG)
    var row := horizontal(stack)
    for index in range(offers.size()):
        var offer: Dictionary = offers[index]
        var item := VBoxContainer.new()
        item.custom_minimum_size.x = 285
        row.add_child(item)
        var option := button(offer.name, func():
            click.play()
            take_draft(index)
        , Vector2(285, 100))
        var shell := StyleBoxTexture.new()
        shell.texture = DRAFT_CARD
        for side in [SIDE_LEFT, SIDE_TOP, SIDE_RIGHT, SIDE_BOTTOM]:
            shell.set_texture_margin(side, 18.0)
        shell.modulate_color = Color("#c2cee4")
        option.add_theme_stylebox_override("normal", shell)
        var lit := shell.duplicate() as StyleBoxTexture
        lit.modulate_color = Color("#ffffff")
        option.add_theme_stylebox_override("hover", lit)
        item.add_child(option)
        var info := label(offer.text, 18, Color("#d0dcf2"))
        info.custom_minimum_size = Vector2(285, 110)
        info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
        item.add_child(info)
    var summaries := PackedStringArray()
    for i in range(2):
        var names := PackedStringArray()
        for a in kits[i]:
            names.append(a.name)
        summaries.append("P%d  %s" % [i + 1, " · ".join(names)])
    stack.add_child(label("     /     ".join(summaries), 19, Color("#a9badb")))
    back(stack, draft_setup)

func select_fighter() -> void:
    var index := picks.size()
    var prompt := "Выбери бойца   ·   P%d" % (index + 1)
    if mode == "pve" and index == 1:
        prompt = "Выбери противника"
    var stack := page(prompt, SELECT_BG)
    var row := horizontal(stack, 11)
    for n in range(catalog.roster.size()):
        var fighter: Dictionary = catalog.roster[n]
        var tint := Color(fighter.accent)
        var item := VBoxContainer.new()
        item.custom_minimum_size.x = 173.0
        row.add_child(item)
        var flag := TextureRect.new()
        flag.texture = load("res://assets/flags/%s.svg" % FLAGS[n])
        flag.custom_minimum_size = Vector2(170, 82)
        flag.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
        flag.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
        var fabric := ShaderMaterial.new()
        fabric.shader = CLOTH
        fabric.set_shader_parameter("offset", n * 1.3)
        flag.material = fabric
        item.add_child(flag)
        var portrait := TextureRect.new()
        var asset := "res://assets/fighters/%s_idle.png" % fighter.id
        if ResourceLoader.exists(asset):
            portrait.texture = load(asset)
        portrait.custom_minimum_size = Vector2(170, 219)
        portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
        portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
        item.add_child(portrait)
        var choose := button(fighter.name, choose_fighter.bind(fighter), Vector2(170, 56), tint)
        var names := PackedStringArray()
        for skill in catalog.abilities:
            if skill.country == fighter.id:
                names.append("%s — %s" % [skill.name, skill.text])
        choose.tooltip_text = "\n".join(names)
        item.add_child(choose)
        choose.mouse_entered.connect(func():
            var tween := create_tween()
            tween.tween_property(portrait, "modulate", tint.lightened(0.67), 0.15)
        )
        choose.mouse_exited.connect(func():
            create_tween().tween_property(portrait, "modulate", Color.WHITE, 0.15)
        )
    if not picks.is_empty():
        stack.add_child(label("P1   " + picks[0].name, 22))
    back(stack, func():
        if not picks.is_empty():
            picks.pop_back()
            select_fighter()
        elif drafting:
            draft_setup()
        elif mode == "pve":
            levels()
        else:
            show_title()
    )

func choose_fighter(fighter: Dictionary) -> void:
    if transitioning:
        return
    picks.append(fighter)
    if picks.size() == 1:
        match mode:
            "pve":
                if drafting:
                    picks.append(catalog.roster.pick_random())
            "practice": picks.append({"id": "dummy", "name": "Манекен", "accent": "#becde1"})
    if picks.size() == 2:
        var audio := create_tween()
        audio.tween_property(music, "volume_db", -48, 0.26)
        audio.tween_callback(music.stop)
        fade(start_battle)
    else:
        click.play()
        select_fighter()

func start_battle() -> void:
    dispose(screen)
    dispose(hud)
    dispose(modal)
    dispose(battle)
    battle = ARENA.new()
    battle.configure(catalog, picks, kits, mode, difficulty)
    battle.pause_changed.connect(pause_screen)
    battle.result_changed.connect(result_screen)
    add_child(battle)
    battle_hud()

func battle_hud() -> void:
    hud = Control.new()
    hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
    full(hud, layer)
    meters.clear()
    fighter_labels.clear()
    skill_rows.clear()
    skills_shown = ["", ""]
    var margin := MarginContainer.new()
    margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
    for edge in ["left", "right", "top", "bottom"]:
        margin.add_theme_constant_override("margin_" + edge, 25)
    full(margin, hud)
    var frame := VBoxContainer.new()
    frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
    margin.add_child(frame)
    var top := horizontal(frame, 90)
    top.mouse_filter = Control.MOUSE_FILTER_IGNORE
    for side in range(2):
        var column := VBoxContainer.new()
        column.mouse_filter = Control.MOUSE_FILTER_IGNORE
        column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
        top.add_child(column)
        var name := label("", 26, Color("#ddeaff"))
        column.add_child(name)
        fighter_labels.append(name)
        var meter := ProgressBar.new()
        meter.show_percentage = false
        meter.custom_minimum_size.y = 21
        meter.fill_mode = ProgressBar.FILL_END_TO_BEGIN if side == 1 else ProgressBar.FILL_BEGIN_TO_END
        meter.add_theme_stylebox_override("background", style(Color("#162132"), Color("#566889"), 2))
        meter.add_theme_stylebox_override("fill", style(Color(picks[side].accent).darkened(0.10), Color(picks[side].accent).lightened(0.3), 1))
        column.add_child(meter)
        meters.append(meter)
    var space := Control.new()
    space.mouse_filter = Control.MOUSE_FILTER_IGNORE
    space.size_flags_vertical = Control.SIZE_EXPAND_FILL
    frame.add_child(space)
    banner = label("", 78)
    banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
    var center := CenterContainer.new()
    center.mouse_filter = Control.MOUSE_FILTER_IGNORE
    full(center, hud)
    center.add_child(banner)
    var bottom := horizontal(frame, 40)
    bottom.mouse_filter = Control.MOUSE_FILTER_IGNORE
    for side in range(2):
        var group := horizontal(bottom, 5)
        group.mouse_filter = Control.MOUSE_FILTER_IGNORE
        group.size_flags_horizontal = Control.SIZE_EXPAND_FILL
        skill_rows.append(group)

func update_skill_row(index: int, f) -> void:
    var group := skill_rows[index]
    var kit: Array = battle.skills_for(f)
    var signature: String = "dummy" if f.dummy else "%s-%s" % [f.ultimate > 0.0, f.profile.id]
    if skills_shown[index] != signature:
        for node in group.get_children():
            dispose(node)
        skills_shown[index] = signature
        if f.dummy:
            var dummy := button("Num1   Удар манекена", func(): pass, Vector2(190, 46))
            dummy.tooltip_text = "Манекен остаётся на месте. Num1 выполняет обычный удар."
            group.add_child(dummy)
            return
        for slot in range(kit.size()):
            var widget := button("", func(): pass, Vector2(130, 46))
            widget.add_theme_font_size_override("font_size", 15)
            widget.tooltip_text = kit[slot].text
            group.add_child(widget)
        var ultimate := button("Ульта", func(): pass, Vector2(112, 46), Color("#ffc678"))
        ultimate.add_theme_font_size_override("font_size", 15)
        var passive = f.profile.passive
        ultimate.tooltip_text = "Удерживай R / Num0 2 секунды. Одна ульта за раунд."
        if passive != null:
            ultimate.tooltip_text += "\n%s — %s" % [passive.name, passive.text]
        group.add_child(ultimate)
    if f.dummy:
        return
    for slot in range(kit.size()):
        var widget: Button = group.get_child(slot)
        var skill: Dictionary = kit[slot]
        var cd: Dictionary = f.ultimate_cooldowns if f.ultimate > 0.0 else f.cooldowns
        var remaining: float = cd.get(skill.key, 0.0)
        widget.text = ("%s  %d" % [skill.name, ceili(remaining)]) if remaining > 0 else ("%s · %s" % [["Z", "X", "C"][slot] if index == 0 else str(slot + 1), skill.name])
        widget.modulate.a = 0.66 if remaining > 0 else 1.0
    var ultimate: Button = group.get_child(kit.size())
    if f.ultimate > 0:
        ultimate.text = "УЛЬТА   %d" % ceili(f.ultimate)
    elif f.charge > 0:
        ultimate.text = "%d%%" % roundi(f.charge * 50)
    else:
        ultimate.text = "УЛЬТА" if f.ultimate_used else ("R · Ульта" if index == 0 else "Num0 · Ульта")

func overlay(heading: String) -> HBoxContainer:
    dispose(modal)
    modal = ColorRect.new()
    modal.color = Color(0.025, 0.04, 0.092, 0.86)
    full(modal, layer)
    var center := CenterContainer.new()
    full(center, modal)
    var stack := VBoxContainer.new()
    stack.add_theme_constant_override("separation", 23)
    center.add_child(stack)
    stack.add_child(label(heading, 54))
    return horizontal(stack)

func pause_screen(value: bool) -> void:
    dispose(modal)
    if not value:
        return
    var row := overlay("Пауза")
    row.add_child(button("Продолжить", func(): battle.set_paused(false)))
    row.add_child(button("Сначала", func(): battle.restart()))
    row.add_child(button("Выбор бойцов", func(): fade(return_to_selection)))
    row.add_child(button("В меню", func(): fade(show_title)))

func result_screen(winner: int) -> void:
    var row := overlay("Победа   ·   P%d" % winner)
    row.add_child(button("Реванш", func():
        dispose(modal)
        battle.restart()
    ))
    row.add_child(button("Выбор бойцов", func(): fade(return_to_selection)))
    row.add_child(button("В меню", func(): fade(show_title)))

func return_to_selection() -> void:
    dispose(modal)
    dispose(hud)
    dispose(battle)
    battle = null
    picks.clear()
    music.volume_db = -12
    music.play()
    select_fighter()
