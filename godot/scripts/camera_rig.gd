class_name CameraRig
extends Node3D
# A camera behind the hunter's shoulder: turned by dragging, it keeps above the ground and the water, and closes in
# when a slope is behind. On a boat it stands back so the whole boat is in view.
var target: Node3D
var boat: Boat = null
var hd := HeightData.new()
var yaw := 0.0          # 0: looking toward +z
var pitch := -0.28
var dist := 4.6
var dist_now := 4.6
var cam: Camera3D
var shake := 0.0

func _ready():
	cam = Camera3D.new(); cam.fov = 68.0; cam.near = 0.1; cam.far = 900.0
	add_child(cam); cam.current = true

func turn(dx: float, dy: float):
	yaw -= dx
	pitch = clampf(pitch - dy, -1.15, 0.45)

func _process(dt: float):
	if target == null: return
	var focus: Vector3
	var want_dist := dist
	if boat != null:
		focus = boat.position + Vector3.UP * (7.0 if boat.kind == "ship" else 1.8)
		want_dist = float(boat.K.cam)
	else:
		focus = target.position + Vector3.UP * 1.55
	dist_now = lerpf(dist_now, want_dist, minf(1.0, dt * 2.5))
	position = position.lerp(focus, minf(1.0, dt * 14.0)) if position.distance_to(focus) < 6.0 else focus
	var back := Vector3(-sin(yaw) * cos(pitch), -sin(pitch), -cos(yaw) * cos(pitch))
	var d := dist_now
	# pull in when the ground is in the way
	for i in 6:
		var p := position + back * d
		if p.y > hd.ground(p.x, p.z) + 0.35: break
		d *= 0.8
	var cp := position + back * d
	cp.y = maxf(cp.y, hd.ground(cp.x, cp.z) + 0.35)
	if boat != null or (target is Player and (target as Player).swimming): cp.y = maxf(cp.y, WorldShape.WATER + 0.6)
	if shake > 0.0:
		shake = maxf(0.0, shake - dt * 2.5)
		cp += Vector3(randf() - 0.5, randf() - 0.5, 0) * shake * 0.15
	cam.global_position = cp
	cam.look_at(position + Vector3.UP * 0.15)
