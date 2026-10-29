class_name TouchControls
extends Control
# Thumbs on a phone held sideways: the left thumb walks (the stick appears where it touches), the right thumb turns
# the camera by dragging, and round buttons on the right strike, roll, run, and eat or drink.
# Each finger is tracked by its own index, so walking and pressing a button work together.
signal pressed(action: String)

var stick_id := -1
var stick_origin := Vector2.ZERO
var stick_vec := Vector2.ZERO
var look_id := -1
var look_last := Vector2.ZERO
var look_delta := Vector2.ZERO
var run_on := false
var buttons := {}          # action -> {pos, r, label, down_id}
var act_label := ""
var font: Font
const STICK_R := 70.0

func _ready():
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	font = get_theme_default_font()
	resized.connect(_layout)
	_layout()

func _layout():
	var w := size.x; var h := size.y
	buttons = {
		"attack": {"pos": Vector2(w - 120, h - 125), "r": 62.0, "label": "תקיפה", "id": -1},
		"roll": {"pos": Vector2(w - 250, h - 85), "r": 44.0, "label": "התחמקות", "id": -1},
		"run": {"pos": Vector2(w - 95, h - 270), "r": 42.0, "label": "ריצה", "id": -1},
		"act": {"pos": Vector2(w - 245, h - 215), "r": 48.0, "label": "", "id": -1},
		"pause": {"pos": Vector2(52, 52), "r": 30.0, "label": "II", "id": -1},
	}
	queue_redraw()

func _button_at(p: Vector2) -> String:
	for k in buttons:
		var b: Dictionary = buttons[k]
		if k == "act" and act_label == "": continue
		if p.distance_to(b.pos) < b.r * 1.15: return k
	return ""

func _input(e: InputEvent):
	if not visible: return
	if e is InputEventScreenTouch:
		var p: Vector2 = e.position
		if e.pressed:
			var b := _button_at(p)
			if b != "":
				buttons[b].id = e.index
				if b == "run": run_on = not run_on
				else: pressed.emit(b)
				queue_redraw()
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
			if v.length() > STICK_R: stick_origin = e.position - v.normalized() * STICK_R; v = v.normalized() * STICK_R
			stick_vec = v / STICK_R
			queue_redraw()
		elif e.index == look_id:
			look_delta += e.position - look_last; look_last = e.position
		get_viewport().set_input_as_handled()

# the walk input: x right, y forward
func move_vector() -> Vector2:
	var v := Vector2(stick_vec.x, -stick_vec.y)
	return v if v.length() > 0.12 else Vector2.ZERO

func take_look() -> Vector2:
	var d := look_delta; look_delta = Vector2.ZERO
	return d

func set_act(label: String):
	if label != act_label: act_label = label; queue_redraw()

func _draw():
	if stick_id != -1:
		draw_circle(stick_origin, STICK_R, Color(1, 1, 1, 0.12))
		draw_arc(stick_origin, STICK_R, 0, TAU, 40, Color(1, 1, 1, 0.35), 2.0)
		draw_circle(stick_origin + stick_vec * STICK_R, 30.0, Color(1, 1, 1, 0.45))
	else:
		var hint := Vector2(150, size.y - 150)
		draw_arc(hint, STICK_R, 0, TAU, 40, Color(1, 1, 1, 0.16), 2.0)
		draw_circle(hint, 26.0, Color(1, 1, 1, 0.12))
	for k in buttons:
		var b: Dictionary = buttons[k]
		var label: String = act_label if k == "act" else b.label
		if label == "": continue
		var on: bool = b.id != -1 or (k == "run" and run_on)
		draw_circle(b.pos, b.r, Color(0.08, 0.12, 0.06, 0.55) if not on else Color(0.95, 0.75, 0.3, 0.6))
		draw_arc(b.pos, b.r, 0, TAU, 48, Color(1, 1, 1, 0.5), 2.0)
		var fs := 22 if b.r > 40.0 else 18
		var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_CENTER, -1, fs).x
		draw_string(font, b.pos + Vector2(-tw * 0.5, fs * 0.35), label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(1, 1, 1, 0.95))
