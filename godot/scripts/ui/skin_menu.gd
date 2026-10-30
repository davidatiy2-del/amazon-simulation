class_name SkinMenu
extends Control
# Choosing how the chief looks: ready-made looks, or one built piece by piece: the body (knight, warrior, sage, scout,
# hooded archer, or one of the classic hunters), helmet and cape, what he holds, the colors of his clothes and metal,
# and his skin. A turning preview shows it.
signal done(look: Dictionary)
signal back
const GOLD := Color(0.98, 0.82, 0.45)
var look: Dictionary = {}
var preview: Avatar
var vp: SubViewport
var holder: Node3D
var opts: VBoxContainer
var turn := 0.0
var moves := ["idle", "walk", "attack", "cheer", "run"]
var move_i := 0
var move_t := 0.0
var start_label := "להתחיל"

func _ready():
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg := ColorRect.new(); bg.color = Color(0.04, 0.06, 0.05, 0.97); bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT); add_child(bg)
	var hb := HBoxContainer.new(); hb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT); hb.add_theme_constant_override("separation", 12)
	hb.offset_left = 20; hb.offset_right = -20; hb.offset_top = 14; hb.offset_bottom = -14
	add_child(hb)
	# the options, on the right (Hebrew reads from the right)
	var sc := ScrollContainer.new(); sc.custom_minimum_size = Vector2(700, 0); sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	opts = VBoxContainer.new(); opts.add_theme_constant_override("separation", 8); opts.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(opts)
	# the preview, on the left
	var svc := SubViewportContainer.new(); svc.stretch = true; svc.size_flags_horizontal = Control.SIZE_EXPAND_FILL; svc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vp = SubViewport.new(); vp.own_world_3d = true; vp.transparent_bg = false; vp.msaa_3d = Viewport.MSAA_2X
	svc.add_child(vp)
	hb.add_child(svc); hb.add_child(sc)
	var env := WorldEnvironment.new(); var e := Environment.new(); e.background_mode = Environment.BG_COLOR; e.background_color = Color(0.12, 0.16, 0.13)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; e.ambient_light_color = Color(0.75, 0.75, 0.8); e.ambient_light_energy = 0.7
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC; env.environment = e; vp.add_child(env)
	var l := DirectionalLight3D.new(); l.rotation_degrees = Vector3(-35, 30, 0); l.light_energy = 1.2; l.shadow_enabled = true; vp.add_child(l)
	var l2 := DirectionalLight3D.new(); l2.rotation_degrees = Vector3(-20, 200, 0); l2.light_energy = 0.4; l2.light_color = Color(0.7, 0.8, 1.0); vp.add_child(l2)
	var floor_m := MeshInstance3D.new(); var cm := CylinderMesh.new(); cm.top_radius = 1.6; cm.bottom_radius = 1.7; cm.height = 0.12; floor_m.mesh = cm
	var fm := StandardMaterial3D.new(); fm.albedo_color = Color(0.35, 0.3, 0.22); floor_m.material_override = fm; floor_m.position.y = -0.06; vp.add_child(floor_m)
	holder = Node3D.new(); vp.add_child(holder)
	var cam := Camera3D.new(); cam.position = Vector3(0, 1.3, 4.9); cam.fov = 36; vp.add_child(cam); cam.look_at(Vector3(0, 0.92, 0))
	cam.current = true

func open(l: Dictionary, label := "להתחיל"):
	look = l.duplicate(); start_label = label
	visible = true
	_rebuild()

func _rebuild():
	if preview: preview.queue_free()
	preview = Avatar.new(); preview.setup(look, 1.8); holder.add_child(preview)
	preview.play(moves[move_i], 0.0)
	_draw()

func _process(dt: float):
	if not visible or holder == null: return
	turn += dt * 0.5
	holder.rotation.y = sin(turn) * 0.9
	move_t += dt
	if move_t > 3.2 and preview:
		move_t = 0.0; move_i = (move_i + 1) % moves.size()
		var mv: String = moves[move_i]
		if mv == "attack": mv = preview.attack_move(move_i)
		preview.play(mv, 0.2, 1.0, true)

func _label(t: String, fs := 20, col := Color(1, 1, 1)) -> Label:
	var l := Label.new(); l.text = t; l.add_theme_font_size_override("font_size", fs); l.add_theme_color_override("font_color", col)
	l.text_direction = Control.TEXT_DIRECTION_RTL; l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	return l

func _btn(t: String, on := false, w := 120.0, h := 46.0, col := Color(0, 0, 0, 0)) -> Button:
	var b := Button.new(); b.text = t; b.add_theme_font_size_override("font_size", 18); b.custom_minimum_size = Vector2(w, h)
	var sb := StyleBoxFlat.new()
	sb.bg_color = col if col.a > 0.0 else (Color(0.85, 0.62, 0.22) if on else Color(1, 1, 1, 0.1))
	sb.set_corner_radius_all(10); sb.border_color = Color(1, 0.85, 0.4) if on else Color(1, 1, 1, 0.25); sb.set_border_width_all(3 if on else 1)
	b.add_theme_stylebox_override("normal", sb); b.add_theme_stylebox_override("hover", sb); b.add_theme_stylebox_override("pressed", sb); b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	var fc := Color(0.1, 0.07, 0.02) if (on and col.a == 0.0) else Color(1, 1, 1)
	for k in ["font_color", "font_hover_color", "font_pressed_color"]: b.add_theme_color_override(k, fc)
	return b

func _row() -> HFlowContainer:
	var r := HFlowContainer.new(); r.add_theme_constant_override("h_separation", 8); r.add_theme_constant_override("v_separation", 8)
	r.alignment = FlowContainer.ALIGNMENT_END
	return r

func _put_opt(k: String, v):
	look[k] = v
	_rebuild()

func _draw():
	for c in opts.get_children(): c.queue_free()
	opts.add_child(_label("הדמות שלך", 38, GOLD))
	opts.add_child(_label("מוכנות", 20, Color(1, 1, 1, 0.7)))
	var pr := _row()
	for i in Skins.PLAYER_SKINS.size():
		var b := _btn(Skins.PLAYER_SKINS[i].name, false, 150, 42)
		b.pressed.connect(func(): look = Skins.player_look(i); _rebuild())
		pr.add_child(b)
	opts.add_child(pr)
	opts.add_child(_label("גוף", 20, Color(1, 1, 1, 0.7)))
	var br := _row()
	for k in ["knight", "barbarian", "mage", "rogue", "hooded", "adventurer", "hooded_adv", "elf", "monarch"]:
		var b := _btn(Skins.BASES[k].name, look.base == k, 108, 42)
		b.pressed.connect(func():
			var keep := look.duplicate()
			look = Skins.look(k, {"helmet": keep.get("helmet", true), "cape": keep.get("cape", true), "cloth": keep.get("cloth", Color(0, 0, 0, 0)), "metal": keep.get("metal", ""), "skin": keep.get("skin", 0)})
			look.weapon = ["sword", "axe", "staff", "dagger", "crossbow"][["knight", "barbarian", "mage", "rogue", "hooded"].find(k)] if Skins.is_kk(k) else "spear"
			_rebuild())
		br.add_child(b)
	opts.add_child(br)
	if not Skins.is_kk(look.base):
		opts.add_child(_label("לדמויות הקלאסיות יש חנית, וצבעים משלהן", 18, Color(1, 1, 1, 0.6)))
		_bottom(); return
	var acc: Dictionary = Skins.BASES[look.base].acc
	var tr := _row()
	if acc.has("helmet"):
		var hb := _btn("כובע / קסדה", look.get("helmet", false), 150)
		hb.pressed.connect(func(): _put_opt("helmet", not look.get("helmet", false)))
		tr.add_child(hb)
	if acc.has("cape"):
		var cb := _btn("גלימה", look.get("cape", false), 120)
		cb.pressed.connect(func(): _put_opt("cape", not look.get("cape", false)))
		tr.add_child(cb)
	opts.add_child(tr)
	opts.add_child(_label("נשק", 20, Color(1, 1, 1, 0.7)))
	var wr := _row()
	for w in [["sword", "חרב"], ["sword2", "חרב גדולה"], ["axe", "גרזן"], ["axe2", "גרזן כבד"], ["dagger", "פגיון"], ["crossbow", "קשת"], ["staff", "מטה"], ["mug", "כוס"], ["", "בלי"]]:
		var b := _btn(w[1], look.get("weapon", "") == w[0], 96, 42)
		b.pressed.connect(func():
			look.weapon = w[0]
			if w[0] in Skins.TWO_HANDED: look.shield = ""
			_rebuild())
		wr.add_child(b)
	opts.add_child(wr)
	if not (look.get("weapon", "") in Skins.TWO_HANDED):
		var sr := _row()
		for s in [["shield_badge", "מגן סמל"], ["shield_round", "מגן עגול"], ["shield_square", "מגן מרובע"], ["shield_spike", "מגן קוצים"], ["", "בלי מגן"]]:
			var b := _btn(s[1], look.get("shield", "") == s[0], 116, 42)
			b.pressed.connect(func(): _put_opt("shield", s[0]))
			sr.add_child(b)
		opts.add_child(sr)
	opts.add_child(_label("צבע הבגדים", 20, Color(1, 1, 1, 0.7)))
	var cr := _row()
	for c in Skins.CLOTHS:
		var col: Color = c[1]
		var cur: Color = look.get("cloth", Color(0, 0, 0, 0))
		var b := _btn(c[0], cur.is_equal_approx(col), 74, 42, col.darkened(0.15) if col.a > 0.0 else Color(0.3, 0.3, 0.3))
		b.pressed.connect(func(): _put_opt("cloth", col))
		cr.add_child(b)
	opts.add_child(cr)
	opts.add_child(_label("שריון ומתכת", 20, Color(1, 1, 1, 0.7)))
	var mr := _row()
	for m in [["", "כסף"], ["gold", "זהב"], ["dark", "ברזל כהה"], ["bronze", "ארד"]]:
		var b := _btn(m[1], look.get("metal", "") == m[0], 110, 42)
		b.pressed.connect(func(): _put_opt("metal", m[0]))
		mr.add_child(b)
	opts.add_child(mr)
	opts.add_child(_label("גוון עור", 20, Color(1, 1, 1, 0.7)))
	var kr := _row()
	for i in Skins.SKIN_TONES.size():
		var b := _btn(Skins.SKIN_NAMES[i], int(look.get("skin", 0)) == i, 86, 42, Skins.SKIN_TONES[i].darkened(0.2))
		b.pressed.connect(func(): _put_opt("skin", i))
		kr.add_child(b)
	opts.add_child(kr)
	_bottom()

func _bottom():
	var r := _row()
	var bk := _btn("חזרה", false, 150, 56)
	bk.pressed.connect(func(): visible = false; back.emit())
	var ok := _btn(start_label, true, 220, 56)
	ok.pressed.connect(func(): visible = false; done.emit(look.duplicate()))
	r.add_child(bk); r.add_child(ok)
	opts.add_child(r)
