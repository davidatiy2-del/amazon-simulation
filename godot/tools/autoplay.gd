extends Node
# Plays a few moments by itself and takes pictures: godot --path . -- auto <out_dir>
# (software rendering is slow, so it works in frames, each one about a tenth of a second of game time)
var g: Node
var out := "/tmp"
var f := 0
var t0 := 0
func _ready():
	g = get_parent()
	var a := OS.get_cmdline_user_args()
	if a.size() > 1: out = a[1]
	t0 = Time.get_ticks_msec()
func snap(name: String):
	var img := get_viewport().get_texture().get_image()
	if img: img.save_png(out + "/" + name + ".png")
	print("shot ", name, " at ", (Time.get_ticks_msec() - t0) / 1000, " s")
func spawn(kind: String, p: Vector3) -> Animal:
	var n := Animal.new(); g.animals.add_child(n); n.setup(Animals.KINDS[kind], g.hd, p); g.animals.list.append(n); return n
var mode := ""
func _process(_dt: float):
	if g.world == null: return
	f += 1
	if OS.get_cmdline_user_args().size() > 2: mode = OS.get_cmdline_user_args()[2]
	if mode == "look": return _look()
	if mode == "sea": return _sea()
	if mode == "save": return _save_test()
	if mode == "ram": return _ram_test()
	if mode == "smoke": return _smoke()
	if mode == "city": return _city_test()
	if mode == "war": return _war_test()
	if mode == "battle": return _battle_test()
	if mode == "tour": return _tour()
	if f == 4: snap("menu")
	if f == 5: g._start(true); g.player.place(Vector3(70, 0, 40)); g.rig.yaw = 2.6; g.player.face = 2.6
	if f > 5 and f < 14: g.player.move_in = Vector2(0, 1)
	if f == 14: g.player.move_in = Vector2.ZERO
	if f == 18: snap("walk")
	if f == 19:
		g.animals.calm = true
		var p: Vector3 = g.player.position; var fw: Vector3 = g.player.forward()
		var d := spawn("deer", p + fw * 2.4); d.face = g.player.face + 1.5
		spawn("wolf", p + fw * 6.0 + fw.cross(Vector3.UP) * 2.5).face = g.player.face + 3.0
		spawn("frog", p + fw * 1.4 - fw.cross(Vector3.UP) * 0.8)
		spawn("fox", p + fw * 4.0 - fw.cross(Vector3.UP) * 2.0)
	if f == 23: snap("animals")
	if f == 24: g.animals.calm = false; g.player.attack()
	if f == 28: snap("attack")
	if f == 34: g.player.attack()
	if f == 44: g.player.attack()
	if f == 52: snap("after")
	if f == 53: g.dn.time = 21.5; g.dn.apply()
	if f == 56: snap("night")
	if f == 57: g._pause()
	if f == 60: snap("pause"); get_tree().quit()

# the hunter seen from the front in an open place, at several hours
const HOURS := [6.3, 9.0, 13.0, 18.4, 20.5, 0.5]
func _look():
	if f == 2:
		g._start(true); g.player.place(Vector3(40, 0, -70)); g.player.face = 0.4; g.animals.calm = true
		g.rig.set_process(false)
	var i := (f - 4) / 3
	if f >= 4 and (f - 4) % 3 == 0 and i < HOURS.size():
		g.dn.time = HOURS[i]; g.dn.apply()
		var p: Vector3 = g.player.position
		g.rig.cam.global_position = p + Vector3(sin(0.4) * 3.2, 1.6, cos(0.4) * 3.2) + Vector3(1.2, 0, 0)
		g.rig.cam.look_at(p + Vector3.UP * 1.1)
	if f >= 6 and (f - 6) % 3 == 0 and (f - 6) / 3 < HOURS.size(): snap("h%d" % ((f - 6) / 3))
	if f > 6 + HOURS.size() * 3: get_tree().quit()

# the harbor, the ship, a whale hunt, the crossing, the new world, a shark
var w: Whale
func _sea():
	var hd: HeightData = g.hd
	var hb: Dictionary = hd.harbor("jungle")
	if f == 2:
		g._start(true)
		g.player.global_position = Vector3(float(hb.x) + 1.5, float(hb.top), float(hb.z1) - 4.0)
		g.rig.yaw = 0.35; g.dn.time = 10.0; g.dn.apply()
	if f == 3:
		g.player.global_position = Vector3(64, 0, 24); g.player.place(g.player.global_position); g.rig.yaw = 0.7
		set_meta("p0", g.player.position)
	if f > 3 and f < 7: g.player.move_in = Vector2(1, 0)
	if f == 7:
		g.player.move_in = Vector2.ZERO
		var mv: Vector3 = g.player.position - get_meta("p0")
		var right: Vector3 = g.rig.cam.global_transform.basis.x
		print("stick right moved along the screen's right: ", snappedf(mv.normalized().dot(right), 0.01))
		g.player.global_position = Vector3(float(hb.x) + 1.5, float(hb.top), float(hb.z1) - 4.0)
	if f == 9: snap("s1_pier")
	if f == 10: g.board(g.ship)
	if f == 12: snap("s2_onship")
	if f == 13:
		g.ship.place(Vector3(100, 0, 760), 0.0)
		w = Whale.new(); g.sea.add_child(w); w.setup(hd, g.ship.position + Vector3(4, 0, 34)); g.sea.whales.append(w)
		w.down = false; w.depth_now = 0.3; w.breath_t = 200.0; w.face = 1.2; w.hp = 200.0
		var mesh := CreatureMesh.dolphin()
		for i in 3:
			var d := SeaLife.Dolphin.new(); g.sea.add_child(d); d.setup(hd, g.ship.position + Vector3(-8 + i * 3, 0, 14 + i * 2), mesh, i); g.sea.dolphins.append(d)
			d.jump_t = 0.2 + i * 0.3
		g.rig.yaw = 0.15
	if f == 16: w._blow()
	if f == 20:
		g.rig.set_process(false)
		g.rig.cam.global_position = w.global_position + Vector3(-22, 7, -4); g.rig.cam.look_at(w.global_position + Vector3(0, 2, 0))
		snap("s3_whale")
		g.rig.set_process(true)
	if f == 21: g.player.attack()
	if f == 26: snap("s4_harpoon")
	if f == 36: g.player.attack()
	if f == 52: snap("s5_dead")
	if f == 53:
		g.ship.place(w.position + Vector3(-12, 0, -4), 0.3)
	if f == 55:
		g.rig.set_process(false)
		g.rig.cam.global_position = w.global_position + Vector3(-6, 9, -24); g.rig.cam.look_at(w.global_position)
		snap("s5b_dead_close")
		g.rig.set_process(true)
		print("whale dead ", w.is_dead(), " action ", g.player.action_here().get("kind", ""))
		g.player.act()
	if f == 80: snap("s6_butcher"); print("whales ", g.whales_taken, " food ", g.player.food)
	if f == 81:
		g._drop_from_boat()
		var row: Boat = g.boats[0]
		var nb: Dictionary = hd.harbor("new")
		row.place(Vector3(float(nb.x) - 10.0, 0, float(nb.z1) - 30.0), 0.0)
		g.board(row); g.rig.yaw = 0.0
	if f == 86: snap("s7_rowing")
	if f == 87:
		g._drop_from_boat()
		var nb2: Dictionary = hd.harbor("new")
		g.player.global_position = Vector3(float(nb2.x), 0, float(nb2.shore) + 30.0); g.player.place(g.player.global_position)
		g.animals.calm = true
		var pp: Vector3 = g.player.position
		for k in [["zebra", Vector3(4, 0, 9)], ["zebra", Vector3(7, 0, 12)], ["horse", Vector3(-5, 0, 11)], ["stag", Vector3(-2, 0, 16)], ["greywolf", Vector3(9, 0, 18)]]:
			var a := Animal.new(); g.animals.add_child(a); a.setup(Animals.KINDS[k[0]], hd, pp + k[1]); g.animals.list.append(a); a.face = PI * 0.5
		g.rig.yaw = 0.0
	if f == 92: snap("s8_newworld")
	if f == 93:
		g.player.global_position = Vector3(60, -1.2, 1000); g.player.swimming = true
		var sh := SeaLife.Shark.new(); g.sea.add_child(sh); sh.setup(hd, Vector3(66, 0, 1009)); g.sea.sharks.append(sh)
		g.rig.yaw = 0.6
	if f == 99: snap("s9_shark"); print("hp after shark ", g.player.hp); get_tree().quit()

# saving on a boat at sea, and coming back on it
func _save_test():
	if f == 2:
		g._start(true)
		var row: Boat = g.boats[0]
		row.place(Vector3(40, 0, 800), 0.4); g.board(row)
		g.whales_taken = 2; g.oil = 6
	if f == 5:
		g._save()
		var row: Boat = g.boats[0]
		print("saved at ", row.position.snapped(Vector3(0.1, 0.1, 0.1)), " on ", row.get_meta("id"))
		g._drop_from_boat(); row.place(row.home, row.home_yaw); g.player.place(Vector3(64, 0, 24)); g.whales_taken = 0
	if f == 7: g._start(false)
	if f == 10:
		var b: Boat = g.player.boat
		print("back: on boat ", b != null and b.get_meta("id"), " at ", b.position.snapped(Vector3(0.1, 0.1, 0.1)) if b else null, " whales ", g.whales_taken, " oil ", g.oil)
		get_tree().quit()

# a whale rams the ship until it sinks: the hunter ends up in the water; a shark comes
var rw: Whale
func _ram_test():
	var hd: HeightData = g.hd
	if f == 2:
		g._start(true)
		g.ship.place(Vector3(80, 0, 800), 0.0); g.board(g.ship)
		rw = Whale.new(); g.sea.add_child(rw); rw.setup(hd, g.ship.position + Vector3(0, 0, 40)); g.sea.whales.append(rw)
		rw.down = false; rw.depth_now = 0.3; rw.breath_t = 200.0; rw.harpoons = 1; rw.state = "ram"; rw.face = PI
		g.ship.hull = 30.0
	if f > 2 and f < 160 and g.player.boat == null and not has_meta("sunk"):
		set_meta("sunk", f); print("frame ", f, ": the ship sank; hunter swimming ", g.player.swimming, " hull ", g.ship.hull)
	if f == 60:
		print("ship hull ", g.ship.hull, " sunk ", g.ship.is_sunk(), " whale state ", rw.state, " player on boat ", g.player.boat != null)
		rw.state = "ram"; rw.t = 0.0; rw.ram_cool = 0.0
	if f == 120:
		print("ship hull ", g.ship.hull, " sunk ", g.ship.is_sunk(), " player on boat ", g.player.boat != null, " swimming ", g.player.swimming)
		var sh := SeaLife.Shark.new(); g.sea.add_child(sh); sh.setup(hd, g.player.position + Vector3(5, 0, 5)); g.sea.sharks.append(sh)
	if f == 150: print("hp after the shark ", snappedf(g.player.hp, 0.1)); snap("ram"); get_tree().quit()

# ---------------------------------------------------------------- version 3: the city, riding, the war
func _smoke():
	if f == 2: g._start(true); print("start ok; cities ", g.cities.keys(), " fleet ", g.fleet.size())
	if f == 60:
		var h: City = g.cities.home
		print("home pop ", h.population(), " soldiers ", h.soldiers(), " horses ", h.horses_here(), " crowd ", g.crowd.stats, " looks ", g.crowd.looks.size())
		for id in g.cities: print("  ", id, " pop ", g.cities[id].population(), " beasts ", g.cities[id].beasts_here(), " owner ", g.cities[id].owner_f)
	if f == 61:
		g._take_horse_test()
	if f == 120:
		print("player horse ", g.player.horse != null, " pos ", g.player.global_position)
		var ok: bool = g.war.begin("pirate", {"knight": 10, "warrior": 30, "archer": 10}, {}, "conquer")
		print("war begin ", ok, " aboard ", g.war.men_aboard(), " state ", g.war.state)
	if f == 125:
		if g.player.horse: g.dismount()
		g.board(g.fleet[0])
		var pc: City = g.cities.pirate
		g.fleet[0].place(Vector3(float(pc.data.landing[0]), 0, float(pc.data.landing[1]) - 60.0), PI)
	if f == 140: print("can land ", g.war.can_land()); g.war.land(); print("state ", g.war.state, " units ", g.war.units.size(), " tally ", g.war.tally())
	if f == 145: g.war.set_order("all", "charge")
	if f == 400: print("battle tally ", g.war.tally(), " morale ", g.war.morale, " gate ", g.war.gate_hp, " state ", g.war.state)
	if f == 401: g.war.set_order("warrior", "ram")
	if f == 900: print("battle tally ", g.war.tally(), " morale ", g.war.morale, " gate ", g.war.gate_hp, " state ", g.war.state, " lost ", g.war.lost, " killed ", g.war.killed)
	if f == 901:
		if g.war.state == "battle": g.war._victory("test")
		g.war.decide("annex"); print("pirate owner ", g.cities.pirate.owner_f, " gold ", g.cities.home.gold)
	if f == 905: g.war.set_order("all", "retreat")
	if f == 1100:
		print("aboard ", g.war.men_aboard(), " tally ", g.war.tally())
		g.board(g.fleet[0]); print("war state ", g.war.state)
		var h: City = g.cities.home
		g.fleet[0].place(Vector3(float(h.data.landing[0]), 0, float(h.data.landing[1]) + 60.0), 0.0)
	if f == 1110: print("home again: state ", g.war.state, " soldiers ", g.cities.home.soldiers(), " pop ", g.cities.home.population())
	if f == 1115: g._save(); print("saved"); g._start(false); print("loaded: pirate owner ", g.cities.pirate.owner_f, " home pop ", g.cities.home.population())
	if f == 1120: get_tree().quit()

func _city_test():
	var h: City = g.cities.home if g.cities.has("home") else null
	if f == 2:
		g._start(true); g.dn.time = 10.0; g.dn.apply()
	if f == 3: g.rig.pitch = -0.18
	if f == 10: snap("c1_castle"); print("crowd ", g.crowd.stats)
	if f == 11:
		var pl: Array = h.data.plaza
		g.player.place(Vector3(float(pl[0]), 0, float(pl[1]) - 14.0)); g.player.face = 0.0; g.rig.yaw = 0.0; g.rig.pitch = -0.2
	if f == 18: snap("c2_plaza"); print("crowd ", g.crowd.stats)
	if f == 19:
		g._take_horse_test(); g.rig.yaw = g.player.face
	if f > 19 and f < 26: g.player.move_in = Vector2(0, 1); g.player.want_run = false
	if f == 26: g.player.move_in = Vector2.ZERO
	if f == 30:
		g.rig.set_process(false)
		var p: Vector3 = g.player.global_position; var fw := Vector3(sin(g.player.face), 0, cos(g.player.face))
		g.rig.cam.global_position = p + fw * 4.5 + Vector3(fw.z, 0, -fw.x) * 2.5 + Vector3(0, 1.2, 0); g.rig.cam.look_at(p + Vector3(0, 0.6, 0))
		snap("c3_ride")
		g.rig.set_process(true)
	if f == 31:
		var st: Dictionary = h.data.stable
		g.rig.set_process(false)
		g.rig.cam.global_position = Vector3(float(st.x), h.gy + 14.0, float(st.z) - float(st.hz) - 16.0); g.rig.cam.look_at(Vector3(float(st.x), h.gy, float(st.z)))
	if f == 36: snap("c4_stable"); g.rig.set_process(true)
	if f == 37: g.hud.show_screen(""); g.skin_menu.open(g.look, "שמור")
	if f == 42: snap("c5_skins")
	if f == 43: g.skin_menu.visible = false; g.dismount(); g._place_at_castle(); g._open_council()
	if f == 46: snap("c6_council")
	if f == 47: g.council.close(); g._open_panel(); g.council.open_city(h, g.war)
	if f == 50: snap("c7_city")
	if f == 51: g.council.close(); get_tree().quit()

func _war_test():
	if f == 2:
		g._start(true); g.dn.time = 9.5; g.dn.apply()
		var ok: bool = g.war.begin("lost", {"knight": 30, "warrior": 50, "archer": 24}, {}, "conquer")
		print("war ", ok, " aboard ", g.war.men_aboard())
		g.board(g.fleet[0])
		var tc: City = g.cities.lost
		var lp := Vector3(float(tc.data.landing[0]), 0, float(tc.data.landing[1]))
		g.fleet[0].place(lp + Vector3(0, 0, -95.0), 0.0)
		for i in range(1, g.fleet.size()):
			g.fleet[i].place(g.fleet[0].position + Vector3(((i % 2) * 2 - 1) * 16.0 * ((i + 1) / 2), 0, -26.0 * ((i + 1) / 2)), 0.0)
		g.rig.yaw = 0.0
	if f == 9: snap("w1_fleet"); print("can land ", g.war.can_land())
	if f == 10: g.war.land(); print("units ", g.war.units.size(), " tally ", g.war.tally()); g.rig.yaw = g.player.face; g.rig.pitch = -0.25
	if f == 16: snap("w2_landing"); print("crowd ", g.crowd.stats)
	if f == 17: g.war.set_order("all", "charge"); g.player.hp = 100000.0
	# fast forward the battle between pictures
	if f in [18, 19, 20]:
		for i in 25: g.war._battle(0.1); g.war._arrows(0.1)
		g.player.global_position = g.war.units[0].pos if g.war.units.size() > 0 else g.player.global_position
	if f == 24:
		g.rig.set_process(false)
		var c := Vector3.ZERO; var n := 0
		for u in g.war.units:
			if u.state != "dead" and u.state != "aboard": c += u.pos; n += 1
		c /= maxf(1.0, n)
		set_meta("bc", c)
		g.rig.cam.global_position = c + Vector3(-18, 14, -22); g.rig.cam.look_at(c)
	if f == 27: snap("w3_battle"); print("tally ", g.war.tally(), " morale ", g.war.morale)
	if f == 28:
		var c: Vector3 = get_meta("bc")
		g.rig.cam.global_position = c + Vector3(6, 3.0, -9); g.rig.cam.look_at(c + Vector3(0, 1.0, 0))
	if f == 31: snap("w4_battle_close")
	if f == 32:
		for i in 300:
			g.war._battle(0.1); g.war._arrows(0.1)
			if g.war.state != "battle": break
		print("after: state ", g.war.state, " tally ", g.war.tally())
		if g.war.state == "battle": g.war._victory("test")
		g.rig.set_process(true)
	if f == 36: g._show_victory()
	if f == 39: snap("w5_victory")
	if f == 40: get_tree().quit()

# a whole battle, quickly (run with --fixed-fps 30): prints how it goes
var bt_target := "north"
func _battle_test():
	var args := OS.get_cmdline_user_args()
	if args.size() > 3: bt_target = args[3]
	if f == 2:
		g._start(true)
		var want := {"knight": 40, "warrior": 70, "archer": 40}
		var ok: bool = g.war.begin(bt_target, want, {}, "conquer")
		g.board(g.fleet[0])
		var tc: City = g.cities[bt_target]
		var lp := Vector3(float(tc.data.landing[0]), 0, float(tc.data.landing[1]))
		var dir: Vector3 = (lp - tc.center()); dir.y = 0; dir = dir.normalized()
		g.fleet[0].place(lp + dir * 70.0, atan2(-dir.x, -dir.z))
		print("begin ", ok, " aboard ", g.war.men_aboard())
	if f == 4: g.war.land(); print("landed: tally ", g.war.tally())
	if f == 6: g.war.set_order("all", "charge"); g.player.hp = 100000.0
	if f == 300 or f == 600:
		# how long each system takes for one frame now (stepping them by hand)
		var t0 := Time.get_ticks_usec(); g.war._battle(1.0 / 30.0); var t1 := Time.get_ticks_usec()
		g.war._draw_units(); var t2 := Time.get_ticks_usec()
		g.crowd._process(1.0 / 30.0); var t3 := Time.get_ticks_usec()
		var tc: City = g.cities[bt_target]; tc._process(1.0 / 30.0); var t4 := Time.get_ticks_usec()
		g.animals._process(1.0 / 30.0); var t5 := Time.get_ticks_usec()
		print("battle %.1f ms, draw units %.1f ms, crowd %.1f ms, city %.1f ms, animals %.1f ms; items %d" % [(t1 - t0) / 1000.0, (t2 - t1) / 1000.0, (t3 - t2) / 1000.0, (t4 - t3) / 1000.0, (t5 - t4) / 1000.0, g.crowd.items.size()])
	if f > 6 and f % 150 == 0:
		var lost_n := 0
		for k in g.war.lost: lost_n += int(g.war.lost[k])
		print("t=%ds tally %s gate %d morale %d/%d lost %d killed %d state %s  process %.1f ms" % [f / 30, g.war.tally(), int(g.war.gate_hp), int(g.war.morale[0]), int(g.war.morale[1]), lost_n, g.war.killed, g.war.state, Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0])
		if g.war.state != "battle": print("outcome after ", f / 30, " s"); get_tree().quit()
	if f > 3600: print("no outcome after 120 s"); get_tree().quit()

# the menu, then a few views of the city with its people
func _tour():
	if f == 8: snap("t0_menu")
	if f == 9: g._start(true); g.dn.time = 16.5; g.dn.apply()
	var h: City = g.cities.get("home") if g.cities.has("home") else null
	if f == 14:
		g.rig.set_process(false)
		var c := h.center()
		g.rig.cam.global_position = c + Vector3(-70, 55, 125); g.rig.cam.look_at(c + Vector3(0, 0, 10))
	if f == 18: snap("t1_city_air")
	if f == 19:
		var pl: Array = h.data.plaza
		var c := Vector3(float(pl[0]), h.gy, float(pl[1]))
		g.player.place(c + Vector3(0, 0, -30))
		g.rig.cam.global_position = c + Vector3(22, 9, -26); g.rig.cam.look_at(c + Vector3(-4, 0, 8))
	if f == 26: snap("t2_plaza_low")
	if f == 27:
		var tr: Array = h.data.train
		var c := Vector3(float(tr[0]), h.gy, float(tr[1]))
		g.player.place(c + Vector3(0, 0, 25))
		g.rig.cam.global_position = c + Vector3(-14, 8, 20); g.rig.cam.look_at(c)
	if f == 34: snap("t3_training")
	if f == 35:
		var b: Boat = g.fleet[0]
		g.player.place(Vector3(b.position.x - 20, 0, b.position.z - 50))
		g.rig.cam.global_position = b.position + Vector3(-50, 18, -45); g.rig.cam.look_at(b.position + Vector3(10, 0, 0))
	if f == 40: snap("t4_fleet")
	if f == 41: get_tree().quit()
