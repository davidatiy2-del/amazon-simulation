extends Node3D
# The game: loads the world in the background, then the start menu and the chief's look; puts the chief, the camera,
# the animals, the cities with their people, the fleet, the war, the sea's animals, the day and night and the
# controls together, and saves every little while.
const WORLD := "res://world/world.scn"
const SAVE := "user://save.json"

var world: Node3D
var dn: DayNight
var player: Player
var rig: CameraRig
var animals: Animals
var sea: SeaLife
var boats: Array[Boat] = []
var ship: Boat                 # the whaling ship
var fleet: Array = []          # your city's warships and transports
var horses: Array = []         # horses out of the stables (Horse)
var hud: Hud
var touch: TouchControls
var council: Council
var skin_menu: SkinMenu
var ui: CanvasLayer
var crowd: Crowd
var war: War
var cities := {}               # id -> City
var water_mat: ShaderMaterial
var playing := false
var save_t := 0.0
var quality := "med"
var hd := HeightData.new()
var whales_taken := 0
var oil := 0
var wave_t := 0.0
var fog_now := 0.0028
var sailed := false
var day_last := -1
var look: Dictionary = {}      # the chief's look
var pending_fresh := false
var shot_mode := ""
var sound: Sound

func _ready():
	_keys()
	ui = CanvasLayer.new(); add_child(ui)
	hud = Hud.new(); ui.add_child(hud)
	touch = TouchControls.new(); ui.add_child(touch); touch.visible = false
	ui.move_child(touch, 0)
	council = Council.new(); ui.add_child(council)
	council.closed.connect(_council_closed)
	skin_menu = SkinMenu.new(); ui.add_child(skin_menu); skin_menu.visible = false
	skin_menu.done.connect(_skin_done)
	skin_menu.back.connect(_skin_back)
	hud.show_screen("loading")
	hud.start_pressed.connect(_start_pressed)
	hud.resume_pressed.connect(_resume)
	hud.quality_changed.connect(_set_quality)
	hud.respawn_pressed.connect(_respawn)
	hud.skin_pressed.connect(func(): hud.show_screen(""); skin_menu.open(look, "שמור"))
	touch.pressed.connect(_on_button)
	var cfg := _load_cfg()
	quality = cfg.get("quality", "med")
	look = _look_from(cfg.get("look", {}))
	hud.quality = quality
	ResourceLoader.load_threaded_request(WORLD)
	for wp in warm_paths(): if ResourceLoader.exists(wp): ResourceLoader.load_threaded_request(wp)
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
			hud.set_loading("בונים את הממלכה… %d%%" % int(prog[0] * 100.0))
		elif st == ResourceLoader.THREAD_LOAD_FAILED:
			hud.set_loading("הטעינה נכשלה")
		return
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
	var mv := touch.move_vector()
	var kv := Input.get_vector("left", "right", "back", "fwd")
	player.move_in = kv if kv.length() > 0.1 else mv
	player.want_run = touch.run_on or Input.is_action_pressed("run")
	var lk := touch.take_look()
	rig.turn(lk.x * 0.006, lk.y * 0.004)
	player.cam_yaw = rig.yaw
	var a := player.action_here()
	touch.set_act(a.get("label", ""))
	var b := player.boat
	touch.set_label("attack", ("צלצל" if b.kind == "ship" else "") if b else null)
	touch.set_label("roll", "" if (b or player.horse) else null)
	touch.set_label("run", ("מפרש" if b.kind != "row" else "חתירה") if b else ("דהירה" if player.horse else null))
	var mine := _city_here(player.global_position, 30.0)
	touch.set_label("council", null if (mine != null and mine.is_mine() and not war.busy()) else "")
	touch.set_label("city", null if mine != null else "")
	touch.battle = war.state == "battle" or war.state == "won"
	hud.update_stats(player, dn)
	hud.set_trophies(whales_taken, oil)
	_hud_lines(mine)
	_nav()
	_air(dt)
	if mine and mine.near:
		var g := mine.greeting(player.global_position)
		if g != "": hud.msg(g)
	if dn.day != day_last:
		if day_last >= 0: war.new_day()
		day_last = dn.day
	save_t += dt
	if save_t > 20.0: save_t = 0.0; _save()

func _hud_lines(here: City):
	var h: City = cities.get("home", null)
	if here:
		var st: String = "שלך" if here.is_mine() else String(Kingdoms.FACTIONS.get(here.owner_f, {}).get("short", ""))
		hud.set_city("%s (%s) · %d תושבים · %d זהב" % [here.name_he(), st, here.population(), int(here.gold)])
	elif h:
		hud.set_city("זהב: %d · לוחמים בבית: %d · סוסים: %d" % [int(h.gold), h.soldiers(), h.horses_here()])
	match war.state:
		"peace": hud.set_war("")
		"sail":
			var tc := war.target_city()
			var on_fleet := player.boat != null and player.boat in fleet
			hud.set_war(("בדרך אל %s · %d לוחמים בספינות%s" % [tc.name_he(), war.men_aboard(), " · ליד החוף: \"נחיתה\"" if war.can_land() else ""]) if on_fleet else "הצבא בספינות שבנמל — עלה על ספינת המלחמה")
		"battle", "won":
			var c := war.tally()
			var tc := war.target_city()
			var txt := "%s · שלנו: %d · שלהם: %d · מורל %d/%d" % [tc.name_he(), c.ours, c.theirs, int(war.morale[0]), int(war.morale[1])]
			if war.state == "won": txt = "%s שלך · פקודה \"לספינות\" ואז לעלות על ספינה" % tc.name_he()
			var gate := -1.0
			if war.state == "battle" and not war.gate_open and tc.data.get("style", "") != "tribal": gate = war.gate_hp / war.gate_max * 100.0
			hud.set_war(txt, gate)
		"home": hud.set_war("הצי חוזר הביתה · נווט אל עיר הנמל")

func _city_here(p: Vector3, margin := 0.0) -> City:
	for id in cities:
		var c: City = cities[id]
		if c.inside(p, margin): return c
	return null

# which way, and how far: the war's target when sailing to war, home when sailing back, else to a harbor
func _nav():
	var b := player.boat
	var p := b.position if b else player.position
	var dest := Vector3.INF; var dname := ""
	if war.state == "sail" and war.target_city():
		var tc := war.target_city()
		dest = Vector3(float(tc.data.landing[0]), 0, float(tc.data.landing[1])); dname = tc.name_he()
		if not (b and b in fleet):
			var hb0 := hd.harbor("jungle")
			if not hb0.is_empty(): dest = Vector3(float(hb0.x) + 50.0, 0, float(hb0.z1)); dname = "ספינות הצי"
	elif war.state == "home" or war.state == "won":
		var h: City = cities.get("home")
		if war.state == "home" or (b and b in fleet):
			dest = Vector3(float(h.data.landing[0]), 0, float(h.data.landing[1])); dname = h.name_he()
	if dest == Vector3.INF:
		var at_sea := p.z > 470.0 and p.z < 1540.0 and (b != null or player.swimming)
		var id := ""
		if at_sea: id = ("new" if b.forward().z >= 0.0 else "jungle") if b else ("new" if p.z > 1000.0 else "jungle")
		elif p.z > 1540.0: id = "new"
		elif not sailed and _city_here(p) == null and p.z < 200.0: id = "jungle"
		if id == "": hud.set_nav(""); return
		var hb := hd.harbor(id)
		if hb.is_empty(): hud.set_nav(""); return
		dest = Vector3(float(hb.x), 0, float(hb.z1)); dname = hb.name
		var to0 := dest - Vector3(p.x, 0, p.z)
		if not at_sea and to0.length() < 45.0: hud.set_nav(""); return
	var to := dest - Vector3(p.x, 0, p.z)
	if to.length() < 30.0: hud.set_nav(""); return
	var f := Vector3(sin(rig.yaw), 0, cos(rig.yaw)); var r := Vector3(-f.z, 0, f.x)
	var ang := atan2(to.normalized().dot(r), to.normalized().dot(f))
	var arrows := ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]
	var i := posmod(int(round(ang / (PI / 4.0))), 8)
	hud.set_nav("%s  %s · %d מ׳" % [arrows[i], dname, int(to.length())])

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

# the models of people, their gear, horses, beasts and flags: loaded with the world and kept, so nobody waits for a
# disk read in the middle of a battle
static func warm_paths() -> Array:
	var out := []
	for k in Skins.BASES: out.append(Skins.BASES[k].file)
	for g in Skins.GEAR.values(): out.append(Skins.GEAR_DIR + str(g) + ".gltf")
	for b in Kingdoms.BEASTS.values(): out.append(b.model)
	out.append(Kingdoms.horse_def(0, Color(0, 0, 0, 0)).model)
	for f in ["blue", "red", "green", "yellow"]: out.append("res://assets/kaykit/town/flag_%s.gltf" % f)
	out.append("res://assets/pirate/flag-pirate-high.glb")
	return out

# one of each body drawn for a few frames out of sight, under the city's ground in front of the menu's camera,
# so the graphics card prepares their shaders now and not when the first of them comes near
func _warm_draw(at: Vector3):
	var holder := Node3D.new(); add_child(holder)
	var defs: Array = []
	for k in Skins.BASES: defs.append(Skins.look(k, {"helmet": true, "cape": true, "weapon": "sword" if Skins.is_kk(k) else "spear", "shield": "shield_round" if Skins.is_kk(k) else ""}))
	for b in Kingdoms.BEASTS: defs.append(Kingdoms.beast_def(b))
	defs.append(Kingdoms.horse_def(0, Color(0.7, 0.1, 0.1)))
	for i in defs.size():
		var d: Dictionary = defs[i]
		var n: Node3D = AnimalPuppet.new().setup(d) if d.get("type", "") == "animal" else Avatar.new().setup(d, 1.8)
		holder.add_child(n)
		n.position = at + Vector3((i % 6) * 3.0 - 7.5, 0, (i / 6) * 3.0)
	for k in 4: await get_tree().process_frame
	holder.queue_free()

func _build():
	hud.set_loading("כמעט מוכן…")
	for wp in warm_paths(): if ResourceLoader.exists(wp): ModelUtil.keep(wp, ResourceLoader.load_threaded_get(wp))
	var w := world.get_node_or_null("Water") as MeshInstance3D
	if w: water_mat = w.material_override as ShaderMaterial
	crowd = Crowd.new(); add_child(crowd)
	player = Player.new(); player.game = self; player.look = look; add_child(player)
	player.said.connect(func(t): hud.msg(t))
	player.died.connect(_on_died)
	rig = CameraRig.new(); rig.target = player; add_child(rig)
	crowd.cam = rig.cam
	sound = Sound.new(); add_child(sound); sound.cam = rig.cam
	animals = Animals.new(); animals.day_night = dn; add_child(animals)
	sea = SeaLife.new(); add_child(sea)
	sea.said.connect(func(t): if t != "": hud.msg(t))
	sea.whale_hit.connect(func(_w): rig.shake = 0.3)
	# the cities
	var n := 0
	for id in hd.places.get("cities", {}):
		var c := City.new(); add_child(c)
		c.setup(id, n, hd.places.cities[id], crowd, dn); c.player = player
		c.said.connect(func(t): hud.msg(t))
		cities[id] = c; n += 1
	_make_boats()
	sea.ship = ship
	war = War.new(); war.game = self; war.crowd = crowd; war.cities = cities; war.fleet = fleet; war.player = player; add_child(war)
	war.said.connect(func(t): hud.msg(t))
	war.sound = sound
	war.won.connect(func(_c): await get_tree().create_timer(1.6).timeout; _show_victory())
	_apply_quality()
	# behind the menu: your city and its harbor at sunrise, from the beach
	var h: City = cities.get("home")
	if h:
		var lp := Vector3(float(h.data.landing[0]), 0, float(h.data.landing[1]))
		player.place(lp + Vector3(0, 0, -20))
		rig.set_process(false)
		rig.cam.global_position = lp + Vector3(85, 20, 105)
		rig.cam.look_at(h.center() + Vector3(-15, 10, 30))
		var wat := h.center() + Vector3(-15, 0, 30); wat.y = h.gy - 7.0
		_warm_draw(wat)
	dn.time = 6.9; dn.apply()
	player.visible = false
	hud.has_save = FileAccess.file_exists(SAVE)
	hud.show_screen("menu")
	var shot := OS.get_environment("AMZ_SHOT")   # (checks of the exported game) start, wait, take a picture, quit
	if shot != "":
		_start(true)
		for i in 30: await get_tree().process_frame
		get_viewport().get_texture().get_image().save_png(shot)
		print("AMZ_SHOT saved, animals ", animals.list.size(), " boats ", boats.size(), " people ", crowd.stats)
		get_tree().quit()

# a rowboat at each harbor, the whaling ship at the jungle's, and your city's fleet at its piers
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
	# the fleet: a warship at each of the city's two piers, the transports anchored off them
	var spots := []
	for pp in hd.places.get("piers", []): spots.append(Vector3(float(pp.ship[0]), 0, float(pp.ship[1])))
	if spots.is_empty(): spots.append(Vector3(150, 0, 470))
	var kinds := ["war", "war", "transport", "transport", "transport"]
	for i in kinds.size():
		var base: Vector3 = spots[i % spots.size()]
		var at := base if i < spots.size() else base + Vector3(-6.0 + 24.0 * ((i - spots.size()) % 2), 0, 30.0 + 26.0 * ((i - spots.size()) / 2))
		var f := Boat.new(); add_child(f)
		f.setup(kinds[i], hd, at, 0.0)
		for k in 30:
			if f.fits(f.position.x, f.position.z, 0.0) == "": break
			f.place(f.position + Vector3(0, 0, 6.0), 0.0)
		f.home = Vector3(f.position.x, 0, f.position.z)
		f.said.connect(func(t): hud.msg(t))
		f.set_meta("id", "fleet_%d" % i)
		boats.append(f); fleet.append(f)

func _start_pressed(fresh: bool):
	if fresh:
		pending_fresh = true
		hud.show_screen("")
		skin_menu.open(look, "לצאת לדרך")
	else:
		_start(false)

func _skin_done(l: Dictionary):
	look = l
	_save_cfg()
	if player:
		player.set_look(look)
	if pending_fresh:
		pending_fresh = false
		_start(true)
	elif not playing:
		hud.show_screen("pause" if player and player.visible else "menu")
	else:
		hud.show_screen("pause")

func _skin_back():
	if pending_fresh:
		pending_fresh = false; hud.show_screen("menu")
	else: hud.show_screen("pause")

func _start(fresh: bool):
	var s := {} if fresh else _read_save()
	if player.boat: _drop_from_boat()
	if player.horse: dismount()
	for hz in horses: if is_instance_valid(hz): hz.queue_free()
	horses.clear()
	player.state = "move"
	if war.busy(): war.abort()
	for b in boats:
		b.sunk_t = -1.0; b.hull = 100.0; b.visible = true; b.place(b.home, b.home_yaw); b.anchored = false; b.leader = null; b.men = 0
	# the cities as they were made, then as they were saved
	for id in cities:
		var c: City = cities[id]
		var fresh_city := City.new()
		add_child(fresh_city)
		fresh_city.setup(id, c.idx, c.data, crowd, dn); fresh_city.player = player
		fresh_city.said.connect(func(t): hud.msg(t))
		c.queue_free()
		cities[id] = fresh_city
	crowd.clear_all()
	war.cities = cities
	war.state = "peace"; war.units.clear(); war.tribute = {}
	if s.is_empty():
		player.hp = 100; player.food = 85; player.water = 85; player.stam = 100
		_place_at_castle()
		dn.time = 8.0; dn.day = 1
		whales_taken = 0; oil = 0; sailed = false
	else:
		if s.has("look"): look = _look_from(s.look); player.set_look(look)
		player.place(Vector3(s.x, 0, s.z)); player.face = s.get("face", 0.0); rig.yaw = player.face
		player.hp = s.hp; player.food = s.food; player.water = s.water; player.stam = s.get("stam", 100.0)
		dn.time = s.time; dn.day = int(s.day)
		whales_taken = int(s.get("whales", 0)); oil = int(s.get("oil", 0)); sailed = bool(s.get("sailed", false))
		var cs: Dictionary = s.get("cities", {})
		for id in cs:
			if cities.has(id): cities[id].load_state(cs[id])
		for bs in s.get("boats", []):
			for b in boats:
				if b.get_meta("id") == bs.id:
					b.place(Vector3(bs.x, 0, bs.z), bs.yaw); b.hull = bs.get("hull", 100.0)
		war.load_state(s.get("war", {}))
		var on: String = s.get("on_boat", "")
		for b in boats:
			if b.get_meta("id") == on: board(b)
	day_last = dn.day
	for c in animals.get_children(): c.queue_free()
	animals.list.clear()
	animals.player = player
	sea.clear_all()
	sea.player = player
	player.visible = true
	rig.set_process(true)
	dn.running = true
	playing = true
	touch.visible = true
	hud.show_screen("")
	if fresh or s.is_empty():
		hud.msg("יום ראשון כראש השבט של עיר הנמל: 300 תושבים, אורווה, וצי בנמל")
		await get_tree().create_timer(4.0).timeout
		if playing: hud.msg("\"מועצה\" — לצאת לכיבוש · \"העיר\" — מצב העיר · באורווה — לקחת סוס")
	_save()

func _place_at_castle():
	var h: City = cities.get("home")
	if h == null: player.place(Vector3(64, 0, 24)); return
	var th: Array = h.data.spots.get("throne", [[h.center().x, h.center().z, 0.0]])[0]
	var yaw: float = th[2]
	player.place(Vector3(float(th[0]), 0, float(th[1])) + Vector3(sin(yaw), 0, cos(yaw)) * 6.0)
	player.face = yaw; rig.yaw = yaw; rig.pitch = -0.22

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
		"council": _open_council()
		"city":
			var c := _city_here(player.global_position, 30.0)
			if c: _open_panel(); council.open_city(c, war)
		_:
			if b.begins_with("o_"): war.set_order(touch.sel_group, b.substr(2))

func _open_council():
	var c := _city_here(player.global_position, 30.0)
	if c == null or not c.is_mine(): hud.msg("את מועצת המלחמה כונסים בעיר שלך"); return
	_open_panel(); council.open_council(war)

func _open_panel():
	playing = false; touch.visible = false; player.move_in = Vector2.ZERO

func _council_closed():
	if not hud.screens.pause.visible and not skin_menu.visible:
		playing = true; touch.visible = true

func _show_victory():
	if war.state != "won" or war.choice_made: return
	_open_panel(); council.open_victory(war)

func _unhandled_input(e: InputEvent):
	if not playing: return
	if e.is_action_pressed("attack"): player.attack()
	elif e.is_action_pressed("roll"): player.roll()
	elif e.is_action_pressed("act"): player.act()
	elif e.is_action_pressed("pause"): _pause()
	elif e is InputEventKey and e.pressed and not e.echo:
		match (e as InputEventKey).physical_keycode:
			KEY_C: _open_council()
			KEY_1: war.set_order(touch.sel_group, "follow")
			KEY_2: war.set_order(touch.sel_group, "charge")
			KEY_3: war.set_order(touch.sel_group, "hold")
			KEY_4: war.set_order(touch.sel_group, "wall")
			KEY_5: war.set_order(touch.sel_group, "ram")
			KEY_6: war.set_order(touch.sel_group, "retreat")
	elif e is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		rig.turn(e.relative.x * 0.006, e.relative.y * 0.004)

func _notification(what: int):
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		if council.visible: council.close()
		elif skin_menu.visible: skin_menu.visible = false; _skin_back()
		elif playing: _pause()
		elif hud.screens.pause.visible: _resume()
	elif what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		if playing: _save()

func _on_died(cause: String):
	playing = false; touch.visible = false
	if player.boat: _drop_from_boat()
	rig.shake = 1.0
	await get_tree().create_timer(2.2).timeout
	hud.show_death(cause)

# the chief wakes up in his city: the war (if any) is over
func _respawn():
	if war.busy(): war.abort()
	player.state = "move"; player.hp = 60.0; player.food = maxf(player.food, 50.0); player.water = maxf(player.water, 50.0); player.stam = 100.0
	player.avatar.play("idle", 0.0, 1.0, true)
	_place_at_castle()
	dn.time = clampf(dn.time + 3.0, 0.0, 23.9)
	playing = true; touch.visible = true; dn.running = true
	hud.show_screen("")
	hud.msg("התעוררת בטירה. האנשים שלך הביאו אותך הביתה")
	_save()

# ---- what the chief does to the world ----
func player_strike(from: Vector3, fwd: Vector3, reach: float, dmg: float):
	if war.player_strike(from, fwd, reach, dmg): rig.shake = 0.3; sound.play("hit"); return
	var hit := animals.strike(from, fwd, reach, dmg)
	if hit:
		rig.shake = 0.35
		sound.play("hit")
		if hit.is_dead(): hud.msg("צדת " + hit.kind.name + ". אפשר לאכול")

func on_player_hurt():
	hud.flash_hurt()
	sound.play("hurt", Vector3.INF, -3.0, 0.4)

func corpse_near(p: Vector3, r: float) -> Node3D:
	return animals.corpse_near(p, r)

func dead_whale_near(p: Vector3, r: float) -> Node3D:
	return sea.dead_whale_near(p, r)

# the city's things, the war's things: what the act button does here
func extra_action(p: Player) -> Dictionary:
	if war.can_land(): return {"kind": "land", "label": "נחיתה", "first": true}
	if p.boat or p.state != "move": return {}
	var pos := p.global_position
	var c := _city_here(pos, 4.0)
	if war.state == "battle" and war.target_city():
		var g := war._gate_point(true)
		if pos.distance_to(g) < 14.0 and not war.gate_open: return {"kind": "surrender", "label": "לדרוש כניעה"}
	if c == null: return {}
	if c.is_mine():
		var st: Dictionary = c.data.get("stable", {})
		if not st.is_empty() and p.horse == null and Vector2(pos.x - float(st.gate[0]), pos.z - float(st.gate[1])).length() < 6.0:
			return {"kind": "take_horse", "label": "לקחת סוס" if c.horses_here() > 0 else ""}
		if p.horse and not st.is_empty() and Vector2(pos.x - float(st.gate[0]), pos.z - float(st.gate[1])).length() < 7.0:
			return {"kind": "return_horse", "label": "להחזיר לאורווה"}
		for s in c.data.spots.get("throne", []):
			if Vector2(pos.x - float(s[0]), pos.z - float(s[1])).length() < 5.0 and not war.busy(): return {"kind": "council", "label": "מועצת מלחמה"}
		if p.food < 90.0 or p.water < 90.0:
			for s in c.data.spots.get("drink", []):
				if Vector2(pos.x - float(s[0]), pos.z - float(s[1])).length() < 3.5: return {"kind": "tavern", "label": "לאכול ולשתות"}
		if p.water < 95.0:
			for s in c.data.spots.get("water", []):
				if Vector2(pos.x - float(s[0]), pos.z - float(s[1])).length() < 3.5: return {"kind": "well", "label": "לשתות"}
	return {}

func do_action(a: Dictionary):
	match a.kind:
		"land": war.land()
		"council": _open_council()
		"surrender":
			var c := war.tally()
			var tc := war.target_city()
			if war.morale[1] < 45.0 or c.theirs < maxi(4, c.ours / 3):
				war._victory("%s נכנעו בלי קרב נוסף" % tc.name_he())
			else:
				war.morale[1] = minf(100.0, war.morale[1] + 8.0)
				hud.msg("%s: \"לעולם לא!\" — הם עדיין חזקים מדי. החלש אותם קודם" % Kingdoms.FACTIONS.get(tc.owner_f, {}).get("chief", "המנהיג"))
		"take_horse": _take_horse(); sound.play("step")
		"return_horse":
			var hz := player.horse
			dismount()
			if hz:
				var c := _city_here(hz.global_position, 6.0)
				if c and hz.city_id == c.id: c.return_horse(hz.stable_i)
				horses.erase(hz); hz.queue_free()
				hud.msg("הסוס חזר לאורווה")
		"tavern":
			player.food = 100.0; player.water = 100.0; player.hp = minf(100.0, player.hp + 25.0)
			player._play("cheer", 0.15, 1.0, true)
			hud.msg("אכלת ושתית בבית המרזח. לחיים, ראש השבט!")
			sound.play("coin", Vector3.INF, -6.0)
		"well":
			player.water = 100.0
			player._play("interact", 0.15)
			hud.msg("שתית מים קרים מהבאר")

func _take_horse():
	var c := _city_here(player.global_position, 4.0)
	if c == null: return
	var got := c.take_horse()
	if got.is_empty(): hud.msg("אין סוסים פנויים באורווה"); return
	var st: Dictionary = c.data.stable
	var hz := Horse.new(); add_child(hz)
	var def := Kingdoms.horse_def(int(got.col), Kingdoms.FACTIONS.blue.color)
	hz.setup(def, got.key, int(got.col), Vector3(float(st.gate[0]), 0, float(st.gate[1])), player.face)
	hz.city_id = c.id; hz.stable_i = int(got.i)
	horses.append(hz)
	player.mount(hz)

# (tests) take a horse at the home stable
func _take_horse_test():
	var h: City = cities.get("home")
	var st: Dictionary = h.data.stable
	player.place(Vector3(float(st.gate[0]), 0, float(st.gate[1])))
	_take_horse()

func horse_near(p: Vector3, r: float) -> Horse:
	for hz in horses:
		if is_instance_valid(hz) and hz.rider == null and hz.global_position.distance_to(p) < r: return hz
	return null

func dismount():
	var hz := player.horse
	if hz == null: return
	player.unmount_body()
	var side := Vector3(cos(hz.yaw), 0, -sin(hz.yaw)) * 1.4
	player.place(hz.global_position + side)
	player.face = hz.yaw

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
	if player.horse: dismount()
	player.boat = b; b.driver = player
	sailed = true
	b.anchored = false; b.leader = null
	player.state = "move"; player.swimming = false
	rig.boat = b
	if absf(angle_difference(rig.yaw, b.yaw)) > PI * 0.5: rig.yaw = b.yaw
	if b.kind != "row": rig.pitch = minf(rig.pitch, -0.42)   # look over the ship, not into its sails
	if b in fleet:
		if war.state == "sail": hud.msg("%s מובילה את הצי. נווט אל %s, וליד החוף: \"נחיתה\"" % [b.label(), war.target_city().name_he()])
		elif war.state == "peace": hud.msg("%s. הצי מפליג למלחמה רק אחרי החלטה במועצה" % b.label())
		war.boarded(b)
	elif b.kind == "ship": hud.msg("על ספינת הציד. המקל מכוון, \"מפרש\" מהר יותר, \"צלצל\" זורק צלצל ללווייתן")
	else: hud.msg("בסירה. המקל מכוון, ליד החוף \"לרדת\"")

# where the chief would step off the boat: dry land or a pier close to it, or INF
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

# the army lands: the chief steps ashore at the given place
func leave_boat_to(p: Vector3):
	_drop_from_boat()
	player.global_position = p
	player.vy = 0.0

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
	var h: City = cities.get("home")
	if h: h.food += 60.0; h.gold += 30.0
	hud.msg("בתרת את הלווייתן: בשר לימים, ושלוש חביות שמן (העיר קיבלה בשר וזהב)")
	_save()

# ---- saving ----
func _save():
	if player == null or player.is_dead(): return
	var bs := []
	for b in boats:
		if b.is_sunk(): continue
		bs.append({"id": b.get_meta("id"), "x": b.position.x, "z": b.position.z, "yaw": b.yaw, "hull": b.hull})
	var pos := player.position
	if player.boat: pos = player.boat.position
	if war.state == "battle" or war.state == "won":
		# a battle is not saved as it is: the save keeps the chief by his ships
		var lead: Boat = null
		for b in fleet: if not b.is_sunk(): lead = b; break
		if lead: pos = lead.position
	var cs := {}
	for id in cities: cs[id] = cities[id].save_state()
	var s := {"v": 3, "x": pos.x, "z": pos.z, "face": player.face, "hp": player.hp, "food": player.food,
		"water": player.water, "stam": player.stam, "time": dn.time, "day": dn.day, "whales": whales_taken, "oil": oil, "sailed": sailed,
		"boats": bs, "on_boat": player.boat.get_meta("id") if player.boat else "", "look": _look_to(look), "cities": cs, "war": war.save_state()}
	var f := FileAccess.open(SAVE, FileAccess.WRITE)
	if f: f.store_string(JSON.stringify(s)); f.close()

func _read_save() -> Dictionary:
	if not FileAccess.file_exists(SAVE): return {}
	var d = JSON.parse_string(FileAccess.get_file_as_string(SAVE))
	return d if d is Dictionary and d.has("x") else {}

func _load_cfg() -> Dictionary:
	var d = JSON.parse_string(FileAccess.get_file_as_string("user://settings.json")) if FileAccess.file_exists("user://settings.json") else null
	return d if d is Dictionary else {}

func _save_cfg():
	var f := FileAccess.open("user://settings.json", FileAccess.WRITE)
	if f: f.store_string(JSON.stringify({"quality": quality, "look": _look_to(look)})); f.close()

# looks in JSON: colors as arrays
static func _look_to(l: Dictionary) -> Dictionary:
	var o := l.duplicate()
	if o.get("cloth") is Color:
		var c: Color = o.cloth; o.cloth = [c.r, c.g, c.b, c.a]
	return o

static func _look_from(d: Dictionary) -> Dictionary:
	if d.is_empty() or not Skins.BASES.has(d.get("base", "")): return Skins.player_look(0)
	var l := d.duplicate()
	if l.get("cloth") is Array and l.cloth.size() == 4: l.cloth = Color(l.cloth[0], l.cloth[1], l.cloth[2], l.cloth[3])
	elif not (l.get("cloth") is Color): l.cloth = Color(0, 0, 0, 0)
	l.skin = int(l.get("skin", 0))
	return l

# ---- graphics ----
func _set_quality(q: String):
	quality = q
	_save_cfg()
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
	# the crowds: how many in full, how far they are drawn
	crowd.near_max = {"high": 32, "med": 22, "low": 12}[quality]
	crowd.near_dist = {"high": 40.0, "med": 32.0, "low": 22.0}[quality]
	crowd.far_dist = {"high": 140.0, "med": 110.0, "low": 75.0}[quality]
	# the cities' buildings cast shadows only on high
	var cn := world.get_node_or_null("Cities")
	if cn:
		for m in cn.find_children("*", "MeshInstance3D", true, false):
			(m as MeshInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if quality != "low" else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

func _keys():
	var keys := {"fwd": [KEY_W, KEY_UP], "back": [KEY_S, KEY_DOWN], "left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT],
		"run": [KEY_SHIFT], "attack": [KEY_J], "roll": [KEY_SPACE], "act": [KEY_E], "pause": [KEY_ESCAPE]}
	for a in keys:
		if InputMap.has_action(a): continue
		InputMap.add_action(a)
		for k in keys[a]:
			var ev := InputEventKey.new(); ev.physical_keycode = k; InputMap.action_add_event(a, ev)
