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
	get_viewport().get_texture().get_image().save_png(out + "/" + name + ".png"); print("shot ", name, " at ", (Time.get_ticks_msec() - t0) / 1000, " s")
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
