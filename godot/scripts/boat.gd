class_name Boat
extends Node3D
# A boat on the water: the rowboat ("row") crosses the sea; the whaling ship ("ship") is big, fast under sail, and
# carries the harpoons. The hunter steers with the same stick he walks with: the boat turns toward where the stick
# points (from the camera's view) and moves when it faces that way. It rides the waves, stops in shallow water and at
# the piers, and when its hull is broken (the ship, by a whale) it sinks and a new one waits at its harbor.
const KINDS := {
	"row": {"name": "סירה", "model": "res://assets/pirate/boat-row-large.glb", "scale": 1.9, "sink": 0.2, "draft": 0.45,
		"len": 5.4, "wid": 2.4, "speed": 5.6, "fast": 8.2, "turn": 1.25, "accel": 1.1, "seat": Vector3(0, 0.38, -0.4), "cam": 7.5, "reach": 6.0},
	"ship": {"name": "ספינת הציד", "model": "res://assets/pirate/ship-large.glb", "scale": 1.45, "sink": 1.55, "draft": 1.9,
		"len": 19.0, "wid": 7.0, "speed": 7.5, "fast": 10.5, "turn": 0.42, "accel": 0.4, "seat": Vector3(0, 1.5, -4.0), "cam": 26.0, "reach": 14.0},
}
var kind: String
var K: Dictionary
var hd: HeightData
var model: Node3D
var yaw := 0.0
var speed := 0.0
var turn := 0.0
var home := Vector3.ZERO
var home_yaw := 0.0
var driver: Player = null
var hull := 100.0
var sunk_t := -1.0          # >= 0 while sinking or waiting to come back
var bump_t := 0.0
var bob_y := 0.0
var pitch := 0.0
var roll := 0.0
var depth_here := 0.0
var tow := Vector3.ZERO     # a roped whale pulling the ship
signal said(text: String)

func setup(k: String, h: HeightData, pos: Vector3, y: float):
	kind = k; K = KINDS[k]; hd = h
	model = (load(K.model) as PackedScene).instantiate()
	model.scale = Vector3.ONE * float(K.scale)
	model.position.y = -float(K.sink)
	add_child(model)
	for m in model.find_children("*", "MeshInstance3D", true, false):
		(m as MeshInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	home = Vector3(pos.x, 0, pos.z); home_yaw = y
	place(pos, y)

func place(pos: Vector3, y: float):
	position = Vector3(pos.x, WorldShape.WATER, pos.z); yaw = y; speed = 0.0
	_float(0.0)

func label() -> String: return K.name

# the driver's place: on the rowboat's middle bench, at the ship's helm
func seat() -> Transform3D:
	var s: Vector3 = K.seat
	return global_transform * Transform3D(Basis.IDENTITY, s)

func forward() -> Vector3: return Vector3(sin(yaw), 0, cos(yaw))

# how far the point p is from the boat's sides (0 inside)
func dist_to(p: Vector3) -> float:
	var d := p - position; d.y = 0
	var f := forward(); var r := Vector3(f.z, 0, -f.x)
	var a := absf(d.dot(f)) - float(K.len) * 0.5; var b := absf(d.dot(r)) - float(K.wid) * 0.5
	return Vector2(maxf(a, 0.0), maxf(b, 0.0)).length()

# can the boat be here: deep enough under it, inside the world, not in a pier
func fits(x: float, z: float, y: float) -> String:
	var fx := sin(y); var fz := cos(y); var rx := cos(y); var rz := -sin(y)
	var L := float(K.len) * 0.5; var W := float(K.wid) * 0.5
	for pr in [[1.0, 0.0], [0.6, 0.8], [0.6, -0.8], [0.0, 1.0], [0.0, -1.0], [-0.6, 0.8], [-0.6, -0.8], [-1.0, 0.0]]:
		var px: float = x + fx * L * pr[0] + rx * W * pr[1]; var pz: float = z + fz * L * pr[0] + rz * W * pr[1]
		if not hd.in_bounds(px, pz): return "edge"
		if hd.on_deck(px, pz): return "pier"
		if hd.water_depth(px, pz) < float(K.draft): return "shallow"
	return ""

func _physics_process(dt: float):
	if dt > 0.1: dt = 0.1
	bump_t -= dt
	if sunk_t >= 0.0:
		_sinking(dt); return
	var want_speed := 0.0
	if driver != null and not driver.is_dead():
		var d := driver._move_dir()
		if d.length() > 0.1:
			var want := atan2(d.x, d.z)
			var diff := angle_difference(yaw, want)
			var facing := maxf(0.0, cos(diff))
			turn = clampf(diff, -1.0, 1.0)
			var fast := driver.want_run and (kind == "ship" or driver.stam > 3.0)
			want_speed = facing * d.length() * float(K.fast if fast else K.speed)
			if fast and kind == "row": driver.stam = maxf(0.0, driver.stam - 6.0 * dt)
		else:
			turn = 0.0
	else:
		turn = 0.0
	yaw += turn * dt * float(K.turn) * (0.35 + minf(1.0, absf(speed) / 3.0) * 0.65)
	speed = move_toward(speed, want_speed, dt * float(K.accel) * (1.0 if want_speed > speed else 1.6))
	if absf(speed) > 0.01:
		var nx := position.x + sin(yaw) * speed * dt; var nz := position.z + cos(yaw) * speed * dt
		var why := fits(nx, nz, yaw)
		if why == "":
			position.x = nx; position.z = nz
		else:
			if absf(speed) > 1.2 and bump_t <= 0.0 and driver != null:
				bump_t = 2.5
				said.emit({"shallow": "רדוד מדי כאן", "pier": "המזח חוסם", "edge": "כאן נגמר העולם"}[why])
			speed *= -0.25
	if tow.length() > 0.01:
		var tx := position.x + tow.x * dt; var tz := position.z + tow.z * dt
		if fits(tx, tz, yaw) == "": position.x = tx; position.z = tz
	_float(dt)

# rides the waves: up and down with the water, tilting with it
func _float(dt: float):
	depth_here = hd.water_depth(position.x, position.z)
	var f := forward(); var r := Vector3(f.z, 0, -f.x)
	var L := float(K.len) * 0.45; var W := float(K.wid) * 0.45
	var hb := Waves.level(position.x + f.x * L, position.z + f.z * L, hd.water_depth(position.x + f.x * L, position.z + f.z * L))
	var hs := Waves.level(position.x - f.x * L, position.z - f.z * L, hd.water_depth(position.x - f.x * L, position.z - f.z * L))
	var hr := Waves.level(position.x + r.x * W, position.z + r.z * W, depth_here)
	var hl := Waves.level(position.x - r.x * W, position.z - r.z * W, depth_here)
	var k := 1.0 if dt == 0.0 else minf(1.0, dt * 3.0)
	bob_y = lerpf(bob_y, (hb + hs + hr + hl) * 0.25, k)
	pitch = lerpf(pitch, atan2(hs - hb, L * 2.0) * 0.8, k)
	roll = lerpf(roll, atan2(hl - hr, W * 2.0) * 0.8 - turn * minf(1.0, absf(speed) / 6.0) * (0.06 if kind == "ship" else 0.03), k)
	position.y = bob_y
	rotation = Vector3(pitch, yaw, roll)

# a whale's blow, or rocks
func damage(amount: float) -> void:
	if kind != "ship" or sunk_t >= 0.0: return
	hull = maxf(0.0, hull - amount)
	if hull <= 0.0:
		sunk_t = 0.0
		said.emit("הספינה נשברה וטובעת! ספינה חדשה תחכה בנמל")

func _sinking(dt: float):
	sunk_t += dt
	if sunk_t < 8.0:
		position.y -= dt * 0.9
		rotation = Vector3(pitch + sunk_t * 0.03, yaw, roll + sunk_t * 0.06)
		visible = true
	else:
		visible = false
	if sunk_t > 90.0:   # a new ship at the harbor
		sunk_t = -1.0; hull = 100.0; visible = true
		place(home, home_yaw)

func is_sunk() -> bool: return sunk_t >= 0.0

# the ship's hull mends slowly near its harbor
func _process(dt: float):
	if kind == "ship" and sunk_t < 0.0 and hull < 100.0 and Vector2(position.x - home.x, position.z - home.z).length() < 60.0:
		hull = minf(100.0, hull + 4.0 * dt)
