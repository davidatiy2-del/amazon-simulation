class_name Horse
extends Node3D
# A horse the chief rides: taken from a stable (and given back there), or found loose. The stick turns it and moves
# it; "run" gallops. It walks on the ground, goes around buildings and stops at deep water. The rider sits on its
# back and moves with its stride.
const WALK := 3.6
const TROT := 6.5
const GALLOP := 11.5
var pup: AnimalPuppet
var hd := HeightData.new()
var yaw := 0.0
var speed := 0.0
var rider: Node3D = null
var city_id := ""           # the stable it came from
var stable_i := -1
var key := ""
var col := 0
var _bi := -1

func setup(def: Dictionary, k: String, c: int, pos: Vector3, y: float) -> Horse:
	key = k; col = c
	pup = AnimalPuppet.new(); pup.setup(def); add_child(pup)
	yaw = y
	position = Vector3(pos.x, hd.height(pos.x, pos.z), pos.z)
	rotation.y = yaw
	if pup.skel: _bi = pup.skel.find_bone("Body")
	return self

func forward() -> Vector3: return Vector3(sin(yaw), 0, cos(yaw))

# where the rider sits: on the back, moving with the stride
func saddle() -> Vector3:
	var p := global_position + Vector3(0, 0.74, 0) + forward() * 0.12
	if pup and pup.skel and _bi >= 0:
		var bt := pup.skel.global_transform * pup.skel.get_bone_global_pose(_bi)
		p = Vector3(global_position.x, bt.origin.y, global_position.z) + forward() * 0.12
	return p

# move: the wanted direction on the ground (length 0..1), fast: gallop
func drive(dir: Vector3, fast: bool, dt: float) -> void:
	var want := 0.0
	if dir.length() > 0.1:
		var wy := atan2(dir.x, dir.z)
		var diff := angle_difference(yaw, wy)
		yaw += clampf(diff, -1.0, 1.0) * dt * (3.2 if speed < 6.0 else 2.2)
		want = (GALLOP if fast else (TROT if dir.length() > 0.8 else WALK)) * dir.length() * maxf(0.0, cos(diff))
	speed = move_toward(speed, want, dt * (6.0 if want > speed else 9.0))
	_step(dt)

func _step(dt: float):
	if absf(speed) > 0.01:
		var np := position + forward() * speed * dt
		if hd.water_depth(np.x, np.z) > 1.1: speed = 0.0
		else: position = np
	position = hd.push_out(position, 0.75)
	position = hd.clamp_pos(position)
	position.y = hd.ground(position.x, position.z)
	rotation.y = yaw
	if pup:
		if speed > 7.5: pup.play("run", 0.2, speed / GALLOP * 1.1)
		elif speed > 0.4: pup.play("walk", 0.2, maxf(0.7, speed / WALK * 0.9))
		else: pup.play("idle", 0.3)

func _physics_process(dt: float):
	if rider == null:
		speed = move_toward(speed, 0.0, dt * 6.0)
		_step(dt)
