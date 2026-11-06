class_name TouchControls
extends Control
# Thumbs on a phone held sideways: the left thumb walks (the stick appears where it touches), the right thumb turns
# the camera by dragging, and round buttons on the right strike, roll, run, and act (eat, drink, board, ride...).
# Each finger is tracked by its own index, so walking, turning and pressing buttons all work together.
#
# Kept out of the screen's unsafe edges (rounded corners, the camera's notch), sized for thumbs (the stick and the
# buttons grow on small, dense screens), a short buzz on each press, and every touch is forgotten whenever the
# controls hide or the game loses the screen, so no finger is ever left "held down".
signal pressed(action: String)

var stick_id := -1
var stick_origin := Vector2.ZERO
var stick_vec := Vector2.ZERO
var look_id := -1
var look_last := Vector2.ZERO
var look_delta := Vector2.ZERO
var run_on := false
var buttons := {}          # action -> {pos, r, label, id}
var act_label := ""
var labels := {}           # action -> a label in place of the usual one ("" hides the button)
var font: Font
var battle := false        # the orders' buttons show
var sel_group := "all"
var haptics := true
var safe := Rect2()        # the part of the screen that is safe to draw buttons in (canvas units)
var stick_r := 80.0
const DEAD := 0.12
const ORDERS := [["o_follow", "אחריי"], ["o_charge", "להסתער"], ["o_hold", "לעמוד"], ["o_wall", "מגנים"], ["o_ram", "לפרוץ"], ["o_retreat", "לספינות"]]
const GROUPS := [["g_all", "כולם"], ["g_knight", "אבירים"], ["g_warrior", "לוחמים"], ["g_archer", "קשתים"], ["g_beast", "חיות"]]

func _ready():
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	font = get_theme_default_font()
	resized.connect(_layout)
	visibility_changed.connect(release_all)
	_layout()

func _notification(what: int):
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT or what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_WINDOW_FOCUS_OUT:
		release_all()

# every finger lifted (the controls hid, a panel opened, the app lost the screen)
func release_all():
	stick_id = -1; stick_vec = Vector2.ZERO
	look_id = -1; look_delta = Vector2.ZERO
	for k in buttons: buttons[k].id = -1
	queue_redraw()

# the safe part of the screen, in this control's units
static func safe_rect(c: Control) -> Rect2:
	var full := Rect2(Vector2.ZERO, c.size)
	var vp := c.get_viewport()
	if vp == null: return full
	var sr := DisplayServer.get_display_safe_area()
	var ws := DisplayServer.window_get_size()
	if sr.size.x <= 0 or ws.x <= 0: return full
	var inv := vp.get_final_transform().affine_inverse()
	var r := inv * Rect2(sr)
	return full.intersection(r) if full.intersects(r) else full

func _layout():
	safe = safe_rect(self)
	var l := safe.position.x; var t := safe.position.y; var r := safe.end.x; var b := safe.end.y
	# bigger on small dense screens (a phone held sideways is about 720 units high whatever its pixels)
	var dpi := float(DisplayServer.screen_get_dpi())
	var k := clampf(dpi / 300.0, 1.0, 1.25) if dpi > 0 else 1.0
	stick_r = 80.0 * k
	buttons = {
		"attack": {"pos": Vector2(r - 125 * k, b - 130 * k), "r": 66.0 * k, "label": "תקיפה", "id": -1},
		"roll": {"pos": Vector2(r - 265 * k, b - 88 * k), "r": 46.0 * k, "label": "התחמקות", "id": -1},
		"run": {"pos": Vector2(r - 100 * k, b - 285 * k), "r": 44.0 * k, "label": "ריצה", "id": -1},
		"act": {"pos": Vector2(r - 262 * k, b - 228 * k), "r": 54.0 * k, "label": "", "id": -1, "act": true},
		"pause": {"pos": Vector2(l + 52, t + 52), "r": 32.0, "label": "II", "id": -1},
		"council": {"pos": Vector2(l + 52, t + 134), "r": 36.0, "label": "מועצה", "id": -1, "small": true},
		"city": {"pos": Vector2(l + 52, t + 216), "r": 36.0, "label": "העיר", "id": -1, "small": true},
	}
	# the orders, in two rows in the middle of the bottom
	var cx := (l + r) * 0.5 - 30.0
	for i in ORDERS.size():
		buttons[ORDERS[i][0]] = {"pos": Vector2(cx + (i - 2.5) * 80.0, b - 60.0), "r": 35.0, "label": ORDERS[i][1], "id": -1, "bar": true, "small": true}
	for i in GROUPS.size():
		buttons[GROUPS[i][0]] = {"pos": Vector2(cx + (i - 2.0) * 80.0, b - 144.0), "r": 31.0, "label": GROUPS[i][1], "id": -1, "bar": true, "small": true, "group": true}
	queue_redraw()

func _label_of(k: String) -> String:
	if k == "act": return act_label
	if buttons[k].get("bar", false) and not battle: return ""
	return labels.get(k, buttons[k].label)

func _button_at(p: Vector2) -> String:
	var best := ""; var bd := 1e9
	for k in buttons:
		var b: Dictionary = buttons[k]
		if _label_of(k) == "": continue
		var d := p.distance_to(b.pos)
		if d < b.r * 1.25 and d < bd: bd = d; best = k
	return best

func _input(e: InputEvent):
	if not visible: return
	if e is InputEventScreenTouch:
		var p: Vector2 = e.position
		if e.pressed:
			var b := _button_at(p)
			if b != "":
				buttons[b].id = e.index
				if haptics: Input.vibrate_handheld(18)
				if b == "run": run_on = not run_on
				else: pressed.emit(b)
			elif p.x < size.x * 0.45 and stick_id == -1:
				stick_id = e.index; stick_origin = p; stick_vec = Vector2.ZERO
			elif look_id == -1:
				look_id = e.index; look_last = p
		else:
			if e.index == stick_id: stick_id = -1; stick_vec = Vector2.ZERO
			if e.index == look_id: look_id = -1
			for k in buttons: if buttons[k].id == e.index: buttons[k].id = -1
		queue_redraw()
		get_viewport().set_input_as_handled()
	elif e is InputEventScreenDrag:
		if e.index == stick_id:
			var v: Vector2 = (e.position - stick_origin)
			# the stick follows a thumb that slides past its edge
			if v.length() > stick_r: stick_origin = e.position - v.normalized() * stick_r; v = v.normalized() * stick_r
			stick_vec = v / stick_r
			queue_redraw()
		elif e.index == look_id:
			look_delta += e.position - look_last; look_last = e.position
		get_viewport().set_input_as_handled()

# the walk input: x right, y forward (a small dead zone, then from 0 smoothly)
func move_vector() -> Vector2:
	var v := Vector2(stick_vec.x, -stick_vec.y)
	var l := v.length()
	if l < DEAD: return Vector2.ZERO
	return v / l * minf(1.0, (l - DEAD) / (1.0 - DEAD))

func take_look() -> Vector2:
	var d := look_delta; look_delta = Vector2.ZERO
	return d

func set_act(label: String):
	if label != act_label: act_label = label; queue_redraw()

# a button's label for now: "" hides it, null brings back its own
func set_label(k: String, label) -> void:
	var cur = labels.get(k, null)
	if cur == label: return
	if label == null: labels.erase(k)
	else: labels[k] = label
	queue_redraw()

func _draw():
	if stick_id != -1:
		draw_circle(stick_origin, stick_r, Color(1, 1, 1, 0.12))
		draw_arc(stick_origin, stick_r, 0, TAU, 48, Color(1, 1, 1, 0.38), 2.5)
		draw_circle(stick_origin + stick_vec * stick_r, stick_r * 0.4, Color(1, 1, 1, 0.5))
	else:
		var hint := Vector2(safe.position.x + 160, safe.end.y - 160)
		draw_arc(hint, stick_r, 0, TAU, 48, Color(1, 1, 1, 0.16), 2.0)
		draw_circle(hint, stick_r * 0.33, Color(1, 1, 1, 0.12))
	for k in buttons:
		var b: Dictionary = buttons[k]
		var label: String = _label_of(k)
		if label == "": continue
		var on: bool = b.id != -1 or (k == "run" and run_on) or (b.get("group", false) and k.substr(2) == sel_group)
		var base_col := Color(0.08, 0.12, 0.06, 0.55)
		if b.get("bar", false) and not b.get("group", false): base_col = Color(0.35, 0.08, 0.05, 0.6)
		if b.get("act", false): base_col = Color(0.55, 0.38, 0.08, 0.72)   # the context action stands out
		var r: float = b.r * (0.94 if b.id != -1 else 1.0)
		draw_circle(b.pos, r, base_col if not on else Color(0.95, 0.75, 0.3, 0.7))
		draw_arc(b.pos, r, 0, TAU, 48, Color(1, 1, 1, 0.55), 2.0)
		var fs := 22 if b.r > 40.0 else 18
		if b.get("small", false): fs = 15
		var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_CENTER, -1, fs).x
		if tw > r * 1.8: fs = int(fs * r * 1.8 / tw); tw = font.get_string_size(label, HORIZONTAL_ALIGNMENT_CENTER, -1, fs).x
		draw_string(font, b.pos + Vector2(-tw * 0.5, fs * 0.35), label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(1, 1, 1, 0.95))
