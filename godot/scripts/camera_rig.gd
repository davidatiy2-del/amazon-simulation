class_name CameraRig
extends Node3D
# A camera behind the hunter's shoulder: turned by dragging, it keeps above the ground and closes in when a slope is behind.
var target: Node3D
var hd := HeightData.new()
var yaw := 0.0          # 0: looking toward +z
var pitch := -0.28
var dist := 4.6
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
	var focus := target.position + Vector3.UP * 1.55
	position = position.lerp(focus, minf(1.0, dt * 14.0)) if position.distance_to(focus) < 6.0 else focus
	var back := Vector3(-sin(yaw) * cos(pitch), -sin(pitch), -cos(yaw) * cos(pitch))
	var d := dist
	# pull in when the ground is in the way
	for i in 6:
		var p := position + back * d
		if p.y > hd.height(p.x, p.z) + 0.35: break
		d *= 0.8
	var cp := position + back * d
	cp.y = maxf(cp.y, hd.height(cp.x, cp.z) + 0.35)
	if target is Player and (target as Player).swimming: cp.y = maxf(cp.y, WorldShape.WATER + 0.3)
	if shake > 0.0:
		shake = maxf(0.0, shake - dt * 2.5)
		cp += Vector3(randf() - 0.5, randf() - 0.5, 0) * shake * 0.15
	cam.global_position = cp
	cam.look_at(position + Vector3.UP * 0.15)
