class_name Hud
extends Control
# The hunter's state at the top right (health, food, water, energy; the ship's hull when aboard), the time of day,
# the whales he has taken, the way to the other harbor when at sea, messages, and the screens: loading, the start
# menu, pause and death.
signal start_pressed(fresh: bool)
signal resume_pressed
signal quality_changed(q: String)
signal respawn_pressed
signal skin_pressed

var bars := {}
var clock: Label
var fps: Label
var trophies: Label
var nav: Label
var war_label: Label
var city_label: Label
var gate_row: HBoxContainer
var hull_row: HBoxContainer
var feed: VBoxContainer
var hurt_rect: ColorRect
var screens := {}
var quality := "med"
var has_save := false

const GOLD := Color(0.98, 0.82, 0.45)

func _ready():
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	hurt_rect = ColorRect.new(); hurt_rect.color = Color(0.6, 0.0, 0.0, 0.0); hurt_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hurt_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE; add_child(hurt_rect)
	# the bars, top right
	var box := VBoxContainer.new(); box.add_theme_constant_override("separation", 6)
	box.set_anchors_preset(Control.PRESET_TOP_RIGHT); box.position = Vector2(-300, 18); box.size = Vector2(280, 10)
	box.anchor_left = 1.0; box.anchor_right = 1.0; box.offset_left = -300; box.offset_right = -20; box.offset_top = 16
	add_child(box)
	for k in [["hp", "בריאות", Color(0.86, 0.27, 0.25)], ["food", "מזון", Color(0.93, 0.6, 0.25)], ["water", "מים", Color(0.3, 0.62, 0.95)], ["stam", "אנרגיה", Color(0.95, 0.85, 0.35)], ["hull", "ספינה", Color(0.66, 0.5, 0.32)]]:
		var row := HBoxContainer.new(); row.add_theme_constant_override("separation", 10)
		var pb := ProgressBar.new(); pb.max_value = 100; pb.show_percentage = false; pb.custom_minimum_size = Vector2(190, 14)
		pb.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		var bg := StyleBoxFlat.new(); bg.bg_color = Color(0, 0, 0, 0.45); bg.set_corner_radius_all(7)
		var fg := StyleBoxFlat.new(); fg.bg_color = k[2]; fg.set_corner_radius_all(7)
		pb.add_theme_stylebox_override("background", bg); pb.add_theme_stylebox_override("fill", fg)
		pb.fill_mode = ProgressBar.FILL_END_TO_BEGIN
		var l := _label(k[1], 17); l.custom_minimum_size = Vector2(70, 0); l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		row.add_child(pb); row.add_child(l)
		box.add_child(row); bars[k[0]] = pb
		if k[0] == "hull": hull_row = row; row.visible = false
	clock = _label("", 18); clock.position = Vector2(100, 34); add_child(clock)
	trophies = _label("", 16, GOLD); trophies.position = Vector2(100, 80); add_child(trophies)
	nav = _label("", 21, Color(0.85, 0.95, 1.0)); nav.set_anchors_preset(Control.PRESET_CENTER_TOP)
	nav.anchor_left = 0.5; nav.anchor_right = 0.5; nav.offset_left = -300; nav.offset_right = 300; nav.offset_top = 22
	nav.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; add_child(nav)
	fps = _label("", 13, Color(1, 1, 1, 0.5)); fps.position = Vector2(100, 60); add_child(fps)
	city_label = _label("", 15, Color(0.85, 0.95, 1.0)); city_label.position = Vector2(100, 98); city_label.size = Vector2(270, 24)
	city_label.clip_text = true; city_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT; add_child(city_label)
	war_label = _label("", 19, Color(1.0, 0.85, 0.6)); war_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	war_label.anchor_left = 0.5; war_label.anchor_right = 0.5; war_label.offset_left = -330; war_label.offset_right = 330; war_label.offset_top = 50
	war_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; add_child(war_label)
	gate_row = HBoxContainer.new(); gate_row.set_anchors_preset(Control.PRESET_CENTER_TOP); gate_row.anchor_left = 0.5; gate_row.anchor_right = 0.5
	gate_row.offset_left = -130; gate_row.offset_right = 130; gate_row.offset_top = 80; gate_row.alignment = BoxContainer.ALIGNMENT_CENTER
	var gpb := ProgressBar.new(); gpb.max_value = 100; gpb.show_percentage = false; gpb.custom_minimum_size = Vector2(180, 14); gpb.name = "GateBar"
	var gbg := StyleBoxFlat.new(); gbg.bg_color = Color(0, 0, 0, 0.5); gbg.set_corner_radius_all(7)
	var gfg := StyleBoxFlat.new(); gfg.bg_color = Color(0.6, 0.42, 0.25); gfg.set_corner_radius_all(7)
	gpb.add_theme_stylebox_override("background", gbg); gpb.add_theme_stylebox_override("fill", gfg)
	gate_row.add_child(gpb); gate_row.add_child(_label("השער", 16)); gate_row.visible = false; add_child(gate_row)
	feed = VBoxContainer.new(); feed.set_anchors_preset(Control.PRESET_CENTER_TOP)
	feed.anchor_left = 0.5; feed.anchor_right = 0.5; feed.offset_left = -250; feed.offset_right = 250; feed.offset_top = 76
	feed.alignment = BoxContainer.ALIGNMENT_BEGIN; feed.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(feed)
	_make_screens()

func _label(t: String, fs: int, col := Color(1, 1, 1)) -> Label:
	var l := Label.new(); l.text = t; l.add_theme_font_size_override("font_size", fs)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.7)); l.add_theme_constant_override("shadow_offset_x", 1); l.add_theme_constant_override("shadow_offset_y", 2)
	l.text_direction = Control.TEXT_DIRECTION_RTL
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _button(t: String, primary := false) -> Button:
	var b := Button.new(); b.text = t; b.add_theme_font_size_override("font_size", 26)
	b.custom_minimum_size = Vector2(320, 64)
	var sb := StyleBoxFlat.new(); sb.bg_color = Color(0.85, 0.62, 0.22) if primary else Color(1, 1, 1, 0.1)
	sb.set_corner_radius_all(14); sb.border_color = Color(1, 1, 1, 0.25); sb.set_border_width_all(0 if primary else 2)
	var sh := sb.duplicate(); sh.bg_color = sb.bg_color.lightened(0.15)
	b.add_theme_stylebox_override("normal", sb); b.add_theme_stylebox_override("hover", sh); b.add_theme_stylebox_override("pressed", sh); b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	b.add_theme_color_override("font_color", Color(0.12, 0.08, 0.02) if primary else Color(1, 1, 1))
	b.add_theme_color_override("font_hover_color", Color(0.12, 0.08, 0.02) if primary else Color(1, 1, 1))
	b.add_theme_color_override("font_pressed_color", Color(0.12, 0.08, 0.02) if primary else Color(1, 1, 1))
	return b

func _screen(name: String, dark := 0.55) -> VBoxContainer:
	var bg := ColorRect.new(); bg.color = Color(0.02, 0.04, 0.02, dark); bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg); bg.visible = false
	var cc := CenterContainer.new(); cc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT); bg.add_child(cc)
	var c := VBoxContainer.new()
	c.alignment = BoxContainer.ALIGNMENT_CENTER; c.add_theme_constant_override("separation", 14)
	cc.add_child(c)
	screens[name] = bg
	return c

func _make_screens():
	var c := _screen("loading", 1.0)
	screens.loading.color = Color(0.05, 0.09, 0.05)
	var t := _label("אמזוניה", 92, GOLD); t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; c.add_child(t)
	var l := _label("מגדלים ג׳ונגל…", 24, Color(1, 1, 1, 0.75)); l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; l.name = "LoadText"; c.add_child(l)

	c = _screen("menu", 0.35)
	t = _label("אמזוניה", 92, GOLD); t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; c.add_child(t)
	l = _label("ראש השבט של עיר הנמל: 300 תושבים, אורוות, צי ספינות. לצוד, לשוט, ולכבוש את הממלכות שמעבר לים.", 22, Color(1, 1, 1, 0.85))
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; c.add_child(l)
	var cont := _button("להמשיך מהשמירה", true); cont.name = "Cont"; c.add_child(cont)
	cont.pressed.connect(func(): start_pressed.emit(false))
	var nb := _button("מסע חדש", false); nb.name = "New"; c.add_child(nb)
	nb.pressed.connect(func(): start_pressed.emit(true))
	c.add_child(_quality_row())
	var note := _label("גרסה 3 · הממלכות: ערים, אבירים וסוסים, צי וכיבושים, חיות מלחמה", 16, Color(1, 1, 1, 0.55))
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; c.add_child(note)

	c = _screen("pause", 0.55)
	t = _label("הג׳ונגל מחכה", 54, GOLD); t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; c.add_child(t)
	var rb := _button("להמשיך", true); c.add_child(rb); rb.pressed.connect(func(): resume_pressed.emit())
	var skb := _button("הדמות שלי", false); c.add_child(skb); skb.pressed.connect(func(): skin_pressed.emit())
	c.add_child(_quality_row())

	c = _screen("death", 0.6)
	t = _label("המסע נגמר", 60, Color(1, 0.55, 0.45)); t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; c.add_child(t)
	l = _label("", 24); l.name = "Cause"; l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER; c.add_child(l)
	var wake := _button("להתעורר בעיר", true); wake.name = "Wake"; c.add_child(wake); wake.pressed.connect(func(): respawn_pressed.emit())
	var again := _button("מסע חדש", false); c.add_child(again); again.pressed.connect(func(): start_pressed.emit(true))

func _quality_row() -> HBoxContainer:
	var row := HBoxContainer.new(); row.alignment = BoxContainer.ALIGNMENT_CENTER; row.add_theme_constant_override("separation", 8)
	row.add_child(_label("גרפיקה:", 20))
	for q in [["high", "גבוהה"], ["med", "רגילה"], ["low", "חלשה"]]:
		var b := _button(q[1], false); b.custom_minimum_size = Vector2(110, 48); b.add_theme_font_size_override("font_size", 20)
		b.toggle_mode = true; b.set_meta("q", q[0]); b.button_pressed = q[0] == quality
		b.pressed.connect(func(): set_quality(q[0]); quality_changed.emit(q[0]))
		row.add_child(b)
	row.add_to_group("qrow")
	return row

func set_quality(q: String):
	quality = q
	for row in get_tree().get_nodes_in_group("qrow"):
		for b in row.get_children():
			if b is Button:
				b.button_pressed = b.get_meta("q") == q
				var sb: StyleBoxFlat = (b.get_theme_stylebox("normal") as StyleBoxFlat).duplicate()
				sb.bg_color = Color(0.85, 0.62, 0.22, 0.85) if b.button_pressed else Color(1, 1, 1, 0.1)
				b.add_theme_stylebox_override("normal", sb)

func show_screen(name: String):
	for k in screens: screens[k].visible = k == name
	if name == "menu":
		var cont: Button = screens.menu.find_child("Cont", true, false)
		cont.visible = has_save
		(screens.menu.find_child("New", true, false) as Button).text = "מסע חדש" if has_save else "להיכנס לג׳ונגל"
		set_quality(quality)

func set_loading(text: String):
	(screens.loading.find_child("LoadText", true, false) as Label).text = text

func show_death(cause: String):
	(screens.death.find_child("Cause", true, false) as Label).text = cause
	show_screen("death")

func msg(text: String):
	var l := _label(text, 20, Color(1, 0.96, 0.85)); l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART; l.custom_minimum_size = Vector2(500, 0)
	feed.add_child(l)
	if feed.get_child_count() > 3: feed.get_child(0).queue_free()
	var tw := create_tween(); tw.tween_interval(3.5); tw.tween_property(l, "modulate:a", 0.0, 0.8); tw.tween_callback(l.queue_free)

func update_stats(p: Player, dn: DayNight):
	bars.hp.value = p.hp; bars.food.value = p.food; bars.water.value = p.water; bars.stam.value = p.stam
	var on_ship := p.boat != null and p.boat.kind != "row"
	hull_row.visible = on_ship
	if on_ship: bars.hull.value = p.boat.hull
	var h := int(dn.time); var m := int((dn.time - h) * 60.0)
	clock.text = "יום %d · %02d:%02d" % [dn.day, h, m]
	fps.text = "%d FPS" % Engine.get_frames_per_second()
	hurt_rect.color.a = move_toward(hurt_rect.color.a, 0.0, 0.02)

func set_trophies(whales: int, oil: int):
	trophies.text = "" if whales == 0 else "לווייתנים: %d · חביות שמן: %d" % [whales, oil]

func set_nav(text: String):
	nav.text = text

func set_war(text: String, gate := -1.0):
	war_label.text = text
	gate_row.visible = gate >= 0.0
	if gate >= 0.0: (gate_row.get_node("GateBar") as ProgressBar).value = gate

func set_city(text: String):
	city_label.text = text

func flash_hurt():
	hurt_rect.color.a = 0.35
