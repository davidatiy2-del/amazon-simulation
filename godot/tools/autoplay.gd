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
	if mode == "touch": return _touch()
	if mode == "walk": return _walk_test()
	if mode == "stand": return _stand_test()
	if mode == "deer": return _deer_test()
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
	if f == 18:
		snap("t1_city_air")
		for bk in g.crowd.mms:
			var mmi: MultiMeshInstance3D = g.crowd.mms[bk]
			if not mmi.visible: continue
			var mm := mmi.multimesh
			var ab: AABB = mm.mesh.get_aabb() if mm.mesh else AABB()
			if bk.begins_with("a_") or ab.size.length() > 8.0: print("bucket ", bk, " n ", mm.visible_instance_count, " mesh aabb ", ab.size, " mmi scale ", mmi.global_transform.basis.get_scale())
		for ref in g.crowd.bound:
			var pu: Node3D = g.crowd.bound[ref]
			if pu.visible: print("puppet ", g.crowd.bound_key[ref], " at ", pu.global_position, " scale ", pu.global_transform.basis.get_scale())
		for hz in g.horses: print("horse ", hz.global_position)
		for a in g.animals.list: print("animal ", a.kind.name, " at ", a.global_position, " scale ", a.model.scale if a.model else "")
		# anything big drawn near the city
		var hc: Vector3 = g.cities.home.center()
		for n in g.get_tree().root.find_children("*", "GeometryInstance3D", true, false):
			var gi := n as GeometryInstance3D
			if not gi.is_visible_in_tree() or gi is MultiMeshInstance3D: continue
			var ab := gi.global_transform * gi.get_aabb()
			if ab.size.length() > 25.0 and ab.get_center().distance_to(hc) < 120.0 and not String(gi.get_path()).contains("Cities") and not String(gi.get_path()).contains("Ground") and not String(gi.get_path()).contains("Plants"):
				print("BIG ", gi.get_path(), " size ", ab.size, " at ", ab.get_center())
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
# ---------------------------------------------------------------- real thumbs: touches through the input system
var tl: Array = []          # log lines
var last_p := Vector3.ZERO
var stuck_n := 0
# (positions are given in the screen's canvas units; the window may be scaled, so they are turned into its pixels)
func _touch_ev(idx: int, pos: Vector2, down: bool):
	var xf := get_viewport().get_final_transform()
	var e := InputEventScreenTouch.new(); e.index = idx; e.position = xf * pos; e.pressed = down
	Input.parse_input_event(e)
func _drag_ev(idx: int, pos: Vector2, rel: Vector2):
	var xf := get_viewport().get_final_transform()
	var e := InputEventScreenDrag.new(); e.index = idx; e.position = xf * pos; e.relative = xf.basis_xform(rel)
	Input.parse_input_event(e)
func _touch():
	var vs: Vector2 = g.touch.size
	var base := Vector2(150, vs.y - 150)
	if f == 3: g._start(true)
	if f < 6: return
	var k := f - 6
	var seg := k / 120              # each 4 s: another direction
	var ph := k % 120
	var dirs := [Vector2(0, -1), Vector2(1, -1), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1), Vector2(-1, 1), Vector2(-1, 0), Vector2(-1, -1), Vector2(0, -1), Vector2(0, -1)]
	if seg >= dirs.size():
		_touch_ev(0, base, false)
		print("TOUCH DONE stuck_frames=", stuck_n)
		get_tree().quit(); return
	var dv: Vector2 = (dirs[seg] as Vector2).normalized() * 60.0
	if ph == 0: _touch_ev(0, base, true)
	if ph == 1: _drag_ev(0, base + dv, dv)
	if ph == 110: _touch_ev(0, base + dv, false)
	# the other thumb: strike, act, turn the camera
	if ph == 40: _touch_ev(1, Vector2(vs.x - 120, vs.y - 125), true)
	if ph == 42: _touch_ev(1, Vector2(vs.x - 120, vs.y - 125), false)
	if ph == 70: _touch_ev(1, Vector2(vs.x - 245, vs.y - 215), true)
	if ph == 72: _touch_ev(1, Vector2(vs.x - 245, vs.y - 215), false)
	if ph == 80: _touch_ev(2, Vector2(vs.x * 0.7, vs.y * 0.4), true)
	if ph > 80 and ph < 90: _drag_ev(2, Vector2(vs.x * 0.7 + (ph - 80) * 6, vs.y * 0.4), Vector2(6, 0))
	if ph == 90: _touch_ev(2, Vector2(vs.x * 0.7 + 60, vs.y * 0.4), false)
	var pl: Player = g.player
	var p := pl.position
	var gr: float = g.hd.ground(p.x, p.z)
	var pushing := ph > 2 and ph < 110 and pl.state == "move"
	if pushing and p.distance_to(last_p) < 0.01: stuck_n += 1
	if ph % 15 == 0:
		print("seg %d ph %3d pos (%.1f, %.2f, %.1f) ground %.2f float %.2f state %s swim %s spd %.1f move_in %s blocked %s act '%s' rig_yaw %.2f" % [seg, ph, p.x, p.y, p.z, gr, p.y - gr, pl.state, pl.swimming, pl.speed_now, pl.move_in, g.hd.blocked(p.x, p.z, 0.3), g.touch.act_label, g.rig.yaw])
	last_p = p

# ---------------------------------------------------------------- walking the city's streets to its gate, stable and piers
var wroute: PackedVector3Array = PackedVector3Array()
var wi := 0
var wgoal := 0
var wbest := 1e9
var wbest_f := 0
var wlog := []
func _walk_goals() -> Array:
	var h: City = g.cities.home
	var goals := []
	goals.append(["stable", Vector3(float(h.data.stable.gate[0]), 0, float(h.data.stable.gate[1]))])
	var plaza := Vector3(float(h.data.plaza[0]), 0, float(h.data.plaza[1])) if h.data.plaza is Array else h.center()
	for gt in h.data.gates:
		goals.append(["plaza", plaza])
		goals.append(["gate " + str(gt.id), Vector3(float(gt.x), 0, float(gt.z))])
	var pp: Dictionary = g.hd.places.piers[0]
	goals.append(["plaza", plaza])
	goals.append(["gate sea", Vector3(float(h.data.gates[0].x), 0, float(h.data.gates[0].z))])
	goals.append(["pier start", Vector3(float(pp.x), 0, float(pp.z0) + 3.0)])
	return goals
func _walk_test():
	if f == 3:
		g._start(true); print("start at ", g.player.global_position)
		g.player.died.connect(func(c): print("DIED: ", c, " at ", g.player.global_position, " frame ", f))
		var orig_hurt = g.player.hurt
	if f > 3 and g.player.hp < 99.0 and f % 30 == 0: print("  hp %.1f at %s" % [g.player.hp, g.player.global_position])
	if f < 6: return
	var goals := _walk_goals()
	var pl: Player = g.player
	if wgoal >= goals.size():
		# the last: out along the last pier to the warship
		var pp: Dictionary = g.hd.places.piers[0]
		var end := Vector3(float(pp.x), 0, float(pp.z1) - 4.0)
		var to := end - pl.global_position; to.y = 0
		_steer(to)
		if f % 30 == 0: print("PIER pos %s y %.2f swim %s act '%s'" % [pl.global_position, pl.global_position.y, pl.swimming, pl.action_here().get("label", "")])
		if to.length() < 1.5 or f > wbest_f + 900:
			print("WALK END at pier end: dist %.1f swim %s y %.2f action '%s'" % [to.length(), pl.swimming, pl.global_position.y, pl.action_here().get("label", "")])
			for bt in g.fleet: print("   fleet ", bt.kind, " at ", bt.position, " dist ", bt.dist_to(pl.global_position), " K.len ", bt.K.len, " wid ", bt.K.wid)
			get_tree().quit()
		return
	var goal: Vector3 = goals[wgoal][1]
	if wroute.is_empty():
		wroute = g.cities.home._route(pl.global_position, goal) if not goals[wgoal][0].begins_with("pier") else PackedVector3Array()
		wroute.append(goal)
		wi = 0; wbest = 1e9; wbest_f = f
		print("-> ", goals[wgoal][0], " route ", wroute.size(), " pts")
	var tgt: Vector3 = wroute[min(wi, wroute.size() - 1)]
	var to := tgt - pl.global_position; to.y = 0
	if to.length() < 1.2 and wi < wroute.size() - 1: wi += 1
	var left := (goal - pl.global_position); left.y = 0
	if left.length() < wbest - 0.5: wbest = left.length(); wbest_f = f
	_steer(to)
	var inside := WorldCollision.overlaps(pl.global_position, 0.2, 1.4)
	if inside: print("  INSIDE something at ", pl.global_position)
	if f - wbest_f == 60:
		var cnt := pl.get_slide_collision_count()
		var cols := []
		for ci in cnt:
			var kc := pl.get_slide_collision(ci)
			cols.append([kc.get_normal(), kc.get_collider_rid(), kc.get_position()])
		print("  no progress: state %s vel %s floor %s wall %s ceil %s move_in %s cols %s ground %.2f" % [pl.state, pl.velocity, pl.is_on_floor(), pl.is_on_wall(), pl.is_on_ceiling(), pl.move_in, cols, g.hd.ground(pl.global_position.x, pl.global_position.z)])
	if left.length() < 2.0 or f - wbest_f > 150:
		print("   %s: %s (left %.1f m, frame %d) pos %s" % [goals[wgoal][0], "REACHED" if left.length() < 2.0 else "STUCK", left.length(), f, pl.global_position])
		wgoal += 1; wroute = PackedVector3Array(); wbest_f = f
func _steer(to: Vector3):
	var pl: Player = g.player
	var want := atan2(to.x, to.z)
	g.rig.yaw = lerp_angle(g.rig.yaw, want, 0.2)
	var rel := angle_difference(g.rig.yaw, want)
	pl.move_in = Vector2(-sin(rel), cos(rel)) if to.length() > 0.3 else Vector2.ZERO
	pl.want_run = true

func _stand_test():
	if f == 3:
		g._start(true)
		g.player.died.connect(func(c): print("DIED: ", c, " at ", g.player.global_position, " frame ", f))
		g.player.place(Vector3(156.7, 0, 301.4))
	if f > 3 and f % 60 == 0: print("f %d hp %.1f state %s pos %s food %.1f water %.1f" % [f, g.player.hp, g.player.state, g.player.global_position, g.player.food, g.player.water])
	if f > 3200: get_tree().quit()

var deers := []
func _deer_test():
	var h: City = g.cities.get("home") if g.cities.has("home") else null
	if f == 9: g._start(true); g.dn.time = 12.0; g.dn.apply()
	if f == 12:
		var c := h.center() + Vector3(0, 0, -60)
		g.player.place(c)
		g.animals.calm = true
		for k in ["deer", "fox", "wolf"]:
			var a := spawn(k, c + Vector3(-4 + deers.size() * 4, 0, 8))
			deers.append(a)
		g.rig.set_process(false)
		g.rig.cam.global_position = c + Vector3(0, 4, -6); g.rig.cam.look_at(c + Vector3(0, 1, 8))
	if f >= 13 and f <= 20:
		for a in deers:
			var mi: MeshInstance3D = a.find_children("*", "MeshInstance3D", true, false)[0]
			print("f %d %s aabb %s vis %s" % [f, a.kind.name, (mi.global_transform * mi.get_aabb()).size, a.visible])
	if f == 20: snap("deer_test")
	if f == 21: get_tree().quit()
