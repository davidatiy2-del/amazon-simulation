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
