class_name Horse
extends CharacterBody3D
# A horse the chief rides: taken from a stable (and given back there), or found loose. The stick turns it and moves
# it; "run" gallops. It is a physics body like the chief (walls, buildings and trunks stop it, it walks up slopes),
# and it stops at deep water. The rider sits on its back and moves with its stride.
const WALK := 3.6
const TROT := 6.5
const GALLOP := 11.5
const GRAV := 22.0
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
var smooth := Smooth.new()       # draws the horse between physics ticks

func setup(def: Dictionary, k: String, c: int, pos: Vector3, y: float) -> Horse:
	key = k; col = c
	collision_layer = WorldCollision.L_HORSE
	collision_mask = WorldCollision.SOLID
	var cs := CollisionShape3D.new()
	var cap := CapsuleShape3D.new(); cap.radius = 0.5; cap.height = 2.3
	cs.shape = cap; cs.rotation.x = PI * 0.5; cs.position = Vector3(0, 0.52, 0)
	add_child(cs)
	floor_snap_length = 0.6
	floor_max_angle = deg_to_rad(46.0)
	floor_constant_speed = true
	max_slides = 4
	pup = AnimalPuppet.new(); pup.setup(def); add_child(pup)
	pup.top_level = true
	yaw = y
	position = Vector3(pos.x, hd.ground(pos.x, pos.z) + 0.05, pos.z)
	rotation.y = yaw
	if pup.skel: _bi = pup.skel.find_bone("Body")
	smooth.snap(self, pup)
	return self

func _process(_dt: float):
	smooth.draw(pup)

func visual_position() -> Vector3: return pup.global_position if pup else global_position

func forward() -> Vector3: return Vector3(sin(yaw), 0, cos(yaw))

# where the rider sits: on the back, moving with the stride (the back's height in the drawn horse, over the body)
func saddle() -> Vector3:
	var h := 0.74
	if pup and pup.skel and _bi >= 0:
		var bt := pup.skel.global_transform * pup.skel.get_bone_global_pose(_bi)
		h = bt.origin.y - pup.global_position.y
	return global_position + Vector3(0, h, 0) + forward() * 0.12

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
	var p := global_position
	var v := forward() * speed
	# deep water ahead: it will not go in
	var ahead := p + forward() * clampf(speed * 0.4, 1.0, 4.0)
	if speed > 0.0 and hd.water_depth(ahead.x, ahead.z) > 1.1: speed = 0.0; v = Vector3.ZERO
	velocity.x = v.x; velocity.z = v.z
	if is_on_floor(): velocity.y = 0.0
	else: velocity.y -= GRAV * dt
	move_and_slide()
	# a wall in the way slows it down to what it really managed
	var moved := global_position - p; moved.y = 0.0
	var real := moved.length() / dt if dt > 0.0 else 0.0
	if real < absf(speed) - 0.6: speed = real * signf(speed)
	var c := hd.clamp_pos(global_position)
	if c.x != global_position.x or c.z != global_position.z: global_position = Vector3(c.x, global_position.y, c.z)
	var g := hd.height(global_position.x, global_position.z)
	if global_position.y < g - 1.5: global_position.y = g + 0.05; velocity.y = 0.0
	rotation = Vector3(0, yaw, 0)
	if pup:
		if speed > 7.5: pup.play("run", 0.2, speed / GALLOP * 1.1)
		elif speed > 0.4: pup.play("walk", 0.2, maxf(0.7, speed / WALK * 0.9))
		else: pup.play("idle", 0.3)

func _physics_process(dt: float):
	if rider == null:
		speed = move_toward(speed, 0.0, dt * 6.0)
		_step(dt)
	smooth.tick(self)
