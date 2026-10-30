extends Node3D
# The game: loads the world in the background, then the start menu; puts the hunter, the camera, the animals, the
# boats, the sea's animals, the day and night and the controls together, and saves every little while.
const WORLD := "res://world/world.scn"
const SAVE := "user://save.json"

var world: Node3D
var dn: DayNight
var player: Player
var rig: CameraRig
var animals: Animals
var sea: SeaLife
var boats: Array[Boat] = []
var ship: Boat
var hud: Hud
var touch: TouchControls
var ui: CanvasLayer
var water_mat: ShaderMaterial
var playing := false
var save_t := 0.0
var quality := "med"
var hd := HeightData.new()
var whales_taken := 0
var oil := 0
var wave_t := 0.0
var fog_now := 0.0028
var sailed := false        # has the hunter been on a boat yet (until then the way to the harbor shows)

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
	# the waves move on the screen and under the boats alike
	wave_t = fmod(wave_t + dt, 3600.0)
	Waves.t = wave_t
	if water_mat: water_mat.set_shader_parameter("wtime", wave_t)
	if not playing: return
	# a ship broken under him: into the water
	if player.boat and player.boat.is_sunk():
		var sb := player.boat
		_drop_from_boat()
		player.global_position = Vector3(sb.position.x + 3.0, WorldShape.WATER - 1.0, sb.position.z)
		player.swimming = true
	# the controls
	var mv := touch.move_vector()
	var kv := Input.get_vector("left", "right", "back", "fwd")
	player.move_in = kv if kv.length() > 0.1 else mv
	player.want_run = touch.run_on or Input.is_action_pressed("run")
	var lk := touch.take_look()
	rig.turn(lk.x * 0.006, lk.y * 0.004)
	player.cam_yaw = rig.yaw
	var a := player.action_here()
	touch.set_act(_act_label(a))
	var b := player.boat
	touch.set_label("attack", ("צלצל" if b.kind == "ship" else "") if b else null)
	touch.set_label("roll", "" if b else null)
	touch.set_label("run", ("מפרש" if b.kind == "ship" else "חתירה") if b else null)
	hud.update_stats(player, dn)
	hud.set_trophies(whales_taken, oil)
	_nav()
	_air(dt)
	save_t += dt
	if save_t > 20.0: save_t = 0.0; _save()

func _act_label(a: Dictionary) -> String:
	match a.get("kind", ""):
		"board": return "לעלות"
		"leave": return "לרדת"
		"butcher": return "לבתר"
	return a.get("label", "")

# which way, and how far, to a harbor: at sea the one ahead (the boat's bow decides; swimming: the nearer one);
# in the new world its harbor (the way home); in the jungle the harbor, until the hunter has sailed once
func _nav():
	var b := player.boat
	var p := b.position if b else player.position
	var at_sea := p.z > 470.0 and p.z < 1540.0 and (b != null or player.swimming)
	var id := ""
	if at_sea: id = ("new" if b.forward().z >= 0.0 else "jungle") if b else ("new" if p.z > 1000.0 else "jungle")
	elif p.z > 1540.0: id = "new"
	elif not sailed: id = "jungle"
	if id == "": hud.set_nav(""); return
	var hb := hd.harbor(id)
	if hb.is_empty(): hud.set_nav(""); return
	var to := Vector3(float(hb.x), 0, float(hb.z1)) - Vector3(p.x, 0, p.z)
	if not at_sea and to.length() < 45.0: hud.set_nav(""); return
	var f := Vector3(sin(rig.yaw), 0, cos(rig.yaw)); var r := Vector3(-f.z, 0, f.x)
	var ang := atan2(to.normalized().dot(r), to.normalized().dot(f))
	var arrows := ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]
	var i := posmod(int(round(ang / (PI / 4.0))), 8)
	hud.set_nav("%s  %s · %d מ׳" % [arrows[i], hb.name, int(to.length())])

# the air: clearer out at sea, so the far coast shows; the camera sees farther there too
func _air(dt: float):
	var p := player.boat.position if player.boat else player.position
	var dz := 0.0
	if p.z < 470.0: dz = 470.0 - p.z
	elif p.z > 1540.0: dz = p.z - 1540.0
	var sea_k := 1.0 - clampf(dz / 200.0, 0.0, 1.0)
	var base := 0.0028 if quality != "low" else 0.0045
	var want := lerpf(base, base * 0.5, sea_k)
	if p.z > 1540.0: want = lerpf(want, base * 0.75, clampf(dz / 200.0, 0.0, 1.0))
	fog_now = lerpf(fog_now, want, minf(1.0, dt * 0.5))
	dn.env.fog_density = fog_now
	var far0: float = {"high": 900.0, "med": 600.0, "low": 380.0}[quality]
	rig.cam.far = lerpf(far0, maxf(far0, 1300.0 if quality != "low" else 800.0), sea_k)

func _build():
	hud.set_loading("כמעט מוכן…")
	var w := world.get_node_or_null("Water") as MeshInstance3D
	if w: water_mat = w.material_override as ShaderMaterial
	player = Player.new(); player.game = self; add_child(player)
	player.said.connect(func(t): hud.msg(t))
	player.died.connect(_on_died)
	rig = CameraRig.new(); rig.target = player; add_child(rig)
	animals = Animals.new(); animals.day_night = dn; add_child(animals)
	sea = SeaLife.new(); add_child(sea)
	sea.said.connect(func(t): if t != "": hud.msg(t))
	sea.whale_hit.connect(func(_w): rig.shake = 0.3)
	_make_boats()
	sea.ship = ship
	_apply_quality()
	# behind the menu: the harbor and the ship at sunrise, from the beach
	var hb := hd.harbor("jungle")
	if hb.is_empty(): player.place(Vector3(64, 0, 24)); rig.yaw = -2.6
	else: player.place(Vector3(float(hb.x) - 26.0, 0, float(hb.shore) - 14.0)); rig.yaw = 0.55; rig.pitch = -0.12
	dn.time = 6.9; dn.apply()
	player.visible = false
	hud.has_save = FileAccess.file_exists(SAVE)
	hud.show_screen("menu")
	var shot := OS.get_environment("AMZ_SHOT")   # (checks of the exported game) start, wait, take a picture, quit
	if shot != "":
		_start(true)
		for i in 8: await get_tree().process_frame
		get_viewport().get_texture().get_image().save_png(shot)
		print("AMZ_SHOT saved, animals ", animals.list.size(), " boats ", boats.size())
		get_tree().quit()

# a rowboat at each harbor, and the whaling ship at the jungle's
func _make_boats():
	for hb in hd.places.get("harbors", []):
		var row := Boat.new(); add_child(row)
		row.setup("row", hd, Vector3(hb.row[0], 0, hb.row[1]), float(hb.row[2]))
		row.said.connect(func(t): hud.msg(t))
		row.set_meta("id", "row_" + str(hb.id)); boats.append(row)
		if hb.id == "jungle":
			ship = Boat.new(); add_child(ship)
			ship.setup("ship", hd, Vector3(hb.ship[0], 0, hb.ship[1]), float(hb.ship[2]))
			ship.said.connect(func(t): hud.msg(t))
			ship.set_meta("id", "ship"); boats.append(ship)

func _start(fresh: bool):
	var s := {} if fresh else _read_save()
	if player.boat: _drop_from_boat()
	player.state = "move"; player.anim_now = ""
	for b in boats:
		b.sunk_t = -1.0; b.hull = 100.0; b.visible = true; b.place(b.home, b.home_yaw)
	if s.is_empty():
		player.hp = 100; player.food = 85; player.water = 85; player.stam = 100
		var st: Array = hd.places.get("start", [64.0, 24.0])
		player.place(Vector3(st[0], 0, st[1])); player.face = -2.4; rig.yaw = -2.4; rig.pitch = -0.28
		dn.time = 8.0; dn.day = 1
		whales_taken = 0; oil = 0; sailed = false
	else:
		player.place(Vector3(s.x, 0, s.z)); player.face = s.get("face", 0.0); rig.yaw = player.face
		player.hp = s.hp; player.food = s.food; player.water = s.water; player.stam = s.get("stam", 100.0)
		dn.time = s.time; dn.day = int(s.day)
		whales_taken = int(s.get("whales", 0)); oil = int(s.get("oil", 0)); sailed = bool(s.get("sailed", false))
		for bs in s.get("boats", []):
			for b in boats:
				if b.get_meta("id") == bs.id:
					b.place(Vector3(bs.x, 0, bs.z), bs.yaw); b.hull = bs.get("hull", 100.0)
		var on: String = s.get("on_boat", "")
		for b in boats:
			if b.get_meta("id") == on: board(b)
	for c in animals.get_children(): c.queue_free()
	animals.list.clear()
	animals.player = player
	sea.clear_all()
	sea.player = player
	player.visible = true
	dn.running = true
	playing = true
	touch.visible = true
	hud.show_screen("")
	if fresh or s.is_empty(): hud.msg("יום ראשון בג׳ונגל. מים בנהר, ציד ביער, ובנמל שבחוף סירה וספינה")
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
	if player.boat: _drop_from_boat()
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

func dead_whale_near(p: Vector3, r: float) -> Node3D:
	return sea.dead_whale_near(p, r)

# ---- boats ----
func boat_near(p: Vector3, r: float) -> Boat:
	var best: Boat = null; var bd := r
	for b in boats:
		if b.is_sunk() or b.driver != null: continue
		var d := b.dist_to(p)
		if d < bd and absf(p.y - b.position.y) < 4.0: bd = d; best = b
	return best

func board(b: Boat):
	if b == null or b.is_sunk(): return
	player.boat = b; b.driver = player
	sailed = true
	player.state = "move"; player.swimming = false
	rig.boat = b
	if absf(angle_difference(rig.yaw, b.yaw)) > PI * 0.5: rig.yaw = b.yaw
	if b.kind == "ship": rig.pitch = minf(rig.pitch, -0.42)   # look over the ship, not into its sails
	if b.kind == "ship": hud.msg("על ספינת הציד. המקל מכוון, \"מפרש\" מהר יותר, \"צלצל\" זורק צלצל ללווייתן")
	else: hud.msg("בסירה. המקל מכוון, ליד החוף \"לרדת\". מעבר לים: העולם החדש")

# where the hunter would step off the boat: dry land or a pier close to it, or INF
func landing_spot() -> Vector3:
	var b := player.boat
	if b == null: return Vector3.INF
	var best := Vector3.INF; var bd := 1e9
	var reach: float = float(b.K.reach)
	for d in hd.decks:   # a pier first
		var px := clampf(b.position.x, d.x - d.hx + 0.6, d.x + d.hx - 0.6); var pz := clampf(b.position.z, d.z - d.hz + 0.6, d.z + d.hz - 0.6)
		var dd := b.dist_to(Vector3(px, 0, pz))
		if dd < reach * 0.6 and dd < bd: bd = dd; best = Vector3(px, d.top, pz)
	if best != Vector3.INF: return best
	return hd.land_near(b.position.x, b.position.z, float(b.K.len) * 0.5 + reach * 0.5)

func leave_boat():
	var spot := landing_spot()
	if spot == Vector3.INF: return
	_drop_from_boat()
	player.global_position = spot
	player.vy = 0.0
	hud.msg("ירדת לחוף")

func _drop_from_boat():
	var b := player.boat
	if b: b.driver = null; b.turn = 0.0
	player.boat = null; rig.boat = null

func throw_harpoon(from: Vector3, dir: Vector3):
	var hit_aim := sea.throw_harpoon(from, dir)
	if not hit_aim: hud.msg("אין לווייתן קרוב. מחכים שיעלה לנשום")

func butcher(w: Node3D):
	var wh := w as Whale
	if wh == null or wh.butchered: return
	wh.butcher()
	whales_taken += 1; oil += 3
	player.food = 100.0; player.hp = minf(100.0, player.hp + 40.0)
	hud.msg("בתרת את הלווייתן: בשר לימים, ושלוש חביות שמן")
	_save()

# ---- saving ----
func _save():
	if player == null or player.is_dead(): return
	var bs := []
	for b in boats:
		if b.is_sunk(): continue
		bs.append({"id": b.get_meta("id"), "x": b.position.x, "z": b.position.z, "yaw": b.yaw, "hull": b.hull})
	var pos := player.position
	if player.boat:   # (saved on a boat: comes back on it)
		pos = player.boat.position
	var s := {"v": 2, "x": pos.x, "z": pos.z, "face": player.face, "hp": player.hp, "food": player.food,
		"water": player.water, "stam": player.stam, "time": dn.time, "day": dn.day, "whales": whales_taken, "oil": oil, "sailed": sailed,
		"boats": bs, "on_boat": player.boat.get_meta("id") if player.boat else ""}
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

const SMALL_PLANTS := ["grass", "meadow", "flower", "plant_", "fern", "pebble"]
func _apply_quality():
	var vp := get_viewport()
	var k := {"high": 1.0, "med": 0.8, "low": 0.55}[quality] as float
	var plants := world.get_node("Plants")
	for c in plants.get_children():
		var mmi := c as MultiMeshInstance3D
		var nm := String(mmi.name)
		if not mmi.has_meta("range"): mmi.set_meta("range", mmi.visibility_range_end)
		var small := false
		for pre in SMALL_PLANTS: if nm.begins_with(pre): small = true
		mmi.visibility_range_end = float(mmi.get_meta("range")) * (k if small else lerpf(1.0, k, 0.6))
		mmi.visible = not (quality == "low" and (nm.begins_with("grass") or nm.begins_with("meadow") or nm.begins_with("pebble")))
		if mmi.cast_shadow != GeometryInstance3D.SHADOW_CASTING_SETTING_OFF or mmi.has_meta("shadow"):
			mmi.set_meta("shadow", true)
			var big := nm.begins_with("tree") or nm.begins_with("palm") or nm.begins_with("pine")
			mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if quality == "low" or (quality == "med" and not big) else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	dn.sun.shadow_enabled = quality != "low"
	dn.sun.directional_shadow_max_distance = 80.0 if quality == "high" else 45.0
	vp.scaling_3d_mode = Viewport.SCALING_3D_MODE_FSR if quality != "low" else Viewport.SCALING_3D_MODE_BILINEAR
	vp.scaling_3d_scale = {"high": 0.9, "med": 0.75, "low": 0.6}[quality]
	vp.msaa_3d = Viewport.MSAA_2X if quality == "high" else Viewport.MSAA_DISABLED
	dn.env.glow_enabled = quality != "low"
	fog_now = 0.0028 if quality != "low" else 0.0045
	dn.env.fog_density = fog_now
	rig.cam.far = {"high": 900.0, "med": 600.0, "low": 380.0}[quality]

func _keys():
	var keys := {"fwd": [KEY_W, KEY_UP], "back": [KEY_S, KEY_DOWN], "left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT],
		"run": [KEY_SHIFT], "attack": [KEY_J], "roll": [KEY_SPACE], "act": [KEY_E], "pause": [KEY_ESCAPE]}
	for a in keys:
		if InputMap.has_action(a): continue
		InputMap.add_action(a)
		for k in keys[a]:
			var ev := InputEventKey.new(); ev.physical_keycode = k; InputMap.action_add_event(a, ev)
