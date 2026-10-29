extends Node3D
# The game: loads the jungle in the background, then the start menu; puts the hunter, the camera, the animals, the
# day and night and the controls together, and saves every little while.
const WORLD := "res://world/world.scn"
const SAVE := "user://save.json"

var world: Node3D
var dn: DayNight
var player: Player
var rig: CameraRig
var animals: Animals
var hud: Hud
var touch: TouchControls
var ui: CanvasLayer
var playing := false
var save_t := 0.0
var quality := "med"
var hd := HeightData.new()

func _ready():
	_keys()
	ui = CanvasLayer.new(); add_child(ui)
	hud = Hud.new(); ui.add_child(hud)
	touch = TouchControls.new(); ui.add_child(touch); touch.visible = false
	ui.move_child(touch, 0)
	hud.show_screen("loading")
	hud.start_pressed.connect(_start)
	hud.resume_pressed.connect(_resume)
	hud.quality_changed.connect(_set_quality)
	touch.pressed.connect(_on_button)
	quality = _load_cfg().get("quality", "med")
	hud.quality = quality
	ResourceLoader.load_threaded_request(WORLD)
	dn = DayNight.new(); dn.running = false; add_child(dn)
	if OS.get_cmdline_user_args().has("auto"): add_child(load("res://tools/autoplay.gd").new())

func _process(dt: float):
	if world == null:
		var prog := []
		var st := ResourceLoader.load_threaded_get_status(WORLD, prog)
		if st == ResourceLoader.THREAD_LOAD_LOADED:
			world = (ResourceLoader.load_threaded_get(WORLD) as PackedScene).instantiate()
			add_child(world)
			_build()
		elif st == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			hud.set_loading("מגדלים ג׳ונגל… %d%%" % int(prog[0] * 100.0))
		elif st == ResourceLoader.THREAD_LOAD_FAILED:
			hud.set_loading("הטעינה נכשלה")
		return
	if not playing: return
	# the controls
	var mv := touch.move_vector()
	var kv := Input.get_vector("left", "right", "back", "fwd")
	player.move_in = kv if kv.length() > 0.1 else mv
	player.want_run = touch.run_on or Input.is_action_pressed("run")
	var lk := touch.take_look()
	rig.turn(lk.x * 0.006, lk.y * 0.004)
	player.cam_yaw = rig.yaw
	var a := player.action_here()
	touch.set_act(a.get("label", ""))
	hud.update_stats(player, dn)
	save_t += dt
	if save_t > 20.0: save_t = 0.0; _save()

func _build():
	hud.set_loading("כמעט מוכן…")
	player = Player.new(); player.game = self; add_child(player)
	player.said.connect(func(t): hud.msg(t))
	player.died.connect(_on_died)
	rig = CameraRig.new(); rig.target = player; add_child(rig)
	animals = Animals.new(); animals.day_night = dn; add_child(animals)
	_apply_quality()
	# the menu shows the river at dawn behind it
	player.place(Vector3(64, 0, 24)); rig.yaw = -2.6
	dn.time = 7.2; dn.apply()
	player.visible = false
	hud.has_save = FileAccess.file_exists(SAVE)
	hud.show_screen("menu")
	var shot := OS.get_environment("AMZ_SHOT")   # (checks of the exported game) start, wait, take a picture, quit
	if shot != "":
		_start(true)
		for i in 8: await get_tree().process_frame
		get_viewport().get_texture().get_image().save_png(shot)
		print("AMZ_SHOT saved, animals ", animals.list.size())
		get_tree().quit()

func _start(fresh: bool):
	var s := {} if fresh else _read_save()
	player.state = "move"; player.anim_now = ""
	if s.is_empty():
		player.hp = 100; player.food = 85; player.water = 85; player.stam = 100
		player.place(Vector3(64, 0, 24)); player.face = -2.4; rig.yaw = -2.4
		dn.time = 8.0; dn.day = 1
	else:
		player.place(Vector3(s.x, 0, s.z)); player.face = s.get("face", 0.0); rig.yaw = player.face
		player.hp = s.hp; player.food = s.food; player.water = s.water; player.stam = s.get("stam", 100.0)
		dn.time = s.time; dn.day = int(s.day)
	for c in animals.get_children(): c.queue_free()
	animals.list.clear()
	animals.player = player
	player.visible = true
	dn.running = true
	playing = true
	touch.visible = true
	hud.show_screen("")
	if fresh or s.is_empty(): hud.msg("יום ראשון בג׳ונגל. מים בנהר, ציד ביער")
	_save()

func _resume():
	playing = true; touch.visible = true; dn.running = true
	get_tree().paused = false
	hud.show_screen("")

func _pause():
	if not playing: return
	_save()
	playing = false; touch.visible = false; dn.running = false
	player.move_in = Vector2.ZERO
	hud.show_screen("pause")

func _on_button(b: String):
	if not playing: return
	match b:
		"attack": player.attack()
		"roll": player.roll()
		"act": player.act()
		"pause": _pause()

func _unhandled_input(e: InputEvent):
	if not playing: return
	if e.is_action_pressed("attack"): player.attack()
	elif e.is_action_pressed("roll"): player.roll()
	elif e.is_action_pressed("act"): player.act()
	elif e.is_action_pressed("pause"): _pause()
	elif e is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		rig.turn(e.relative.x * 0.006, e.relative.y * 0.004)

func _notification(what: int):
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		if playing: _pause()
		elif hud.screens.pause.visible: _resume()
	elif what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		if playing: _save()

func _on_died(cause: String):
	playing = false; touch.visible = false
	DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE))
	hud.has_save = false
	rig.shake = 1.0
	await get_tree().create_timer(2.2).timeout
	hud.show_death(cause)

# ---- what the hunter does to the world ----
func player_strike(from: Vector3, fwd: Vector3, reach: float, dmg: float):
	var hit := animals.strike(from, fwd, reach, dmg)
	if hit:
		rig.shake = 0.35
		if hit.is_dead(): hud.msg("צדת " + hit.kind.name + ". אפשר לאכול")

func corpse_near(p: Vector3, r: float) -> Node3D:
	return animals.corpse_near(p, r)

# ---- saving ----
func _save():
	if player == null or player.is_dead(): return
	var s := {"v": 1, "x": player.position.x, "z": player.position.z, "face": player.face, "hp": player.hp, "food": player.food,
		"water": player.water, "stam": player.stam, "time": dn.time, "day": dn.day}
	var f := FileAccess.open(SAVE, FileAccess.WRITE)
	if f: f.store_string(JSON.stringify(s)); f.close()

func _read_save() -> Dictionary:
	if not FileAccess.file_exists(SAVE): return {}
	var d = JSON.parse_string(FileAccess.get_file_as_string(SAVE))
	return d if d is Dictionary and d.has("x") else {}

func _load_cfg() -> Dictionary:
	var d = JSON.parse_string(FileAccess.get_file_as_string("user://settings.json")) if FileAccess.file_exists("user://settings.json") else null
	return d if d is Dictionary else {}

# ---- graphics ----
func _set_quality(q: String):
	quality = q
	var f := FileAccess.open("user://settings.json", FileAccess.WRITE)
	if f: f.store_string(JSON.stringify({"quality": q})); f.close()
	_apply_quality()

func _apply_quality():
	var vp := get_viewport()
	var k := {"high": 1.0, "med": 0.8, "low": 0.55}[quality] as float
	var plants := world.get_node("Plants")
	for c in plants.get_children():
		var mmi := c as MultiMeshInstance3D
		if not mmi.has_meta("range"): mmi.set_meta("range", mmi.visibility_range_end)
		var small := String(mmi.name).begins_with("grass") or String(mmi.name).begins_with("plant_") or String(mmi.name).begins_with("fern")
		mmi.visibility_range_end = float(mmi.get_meta("range")) * (k if small else lerpf(1.0, k, 0.6))
		if quality == "low" and String(mmi.name).begins_with("grass"): mmi.visible = false
		else: mmi.visible = true
		if mmi.cast_shadow != GeometryInstance3D.SHADOW_CASTING_SETTING_OFF:
			mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if quality == "low" or (quality == "med" and not String(mmi.name).begins_with("tree") and not String(mmi.name).begins_with("palm")) else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	dn.sun.shadow_enabled = quality != "low"
	dn.sun.directional_shadow_max_distance = 80.0 if quality == "high" else 45.0
	vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_FSR if quality != "low" else Viewport.SCALING_3D_MODE_BILINEAR
	vp.scaling_3d_scale = {"high": 0.9, "med": 0.75, "low": 0.6}[quality]
	vp.msaa_3d = Viewport.MSAA_2X if quality == "high" else Viewport.MSAA_DISABLED
	dn.env.glow_enabled = quality != "low"
	dn.env.fog_density = 0.0028 if quality != "low" else 0.0045
	rig.cam.far = {"high": 900.0, "med": 600.0, "low": 380.0}[quality]

func _keys():
	var keys := {"fwd": [KEY_W, KEY_UP], "back": [KEY_S, KEY_DOWN], "left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT],
		"run": [KEY_SHIFT], "attack": [KEY_J], "roll": [KEY_SPACE], "act": [KEY_E], "pause": [KEY_ESCAPE]}
	for a in keys:
		if InputMap.has_action(a): continue
		InputMap.add_action(a)
		for k in keys[a]:
			var ev := InputEventKey.new(); ev.physical_keycode = k; InputMap.action_add_event(a, ev)
