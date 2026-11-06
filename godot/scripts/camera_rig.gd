class_name CameraRig
extends Node3D
# A camera behind the chief's shoulder. Dragging turns it. It follows where the chief is drawn (between physics ticks,
# so it is smooth at any frame rate), and it never goes into the ground, walls or buildings: a small sphere
# is swept from his head toward where the camera wants to be, and the camera stays in front of what it touches (closing
# in fast, easing back out slowly). While he runs and nobody turns the camera, it slowly swings behind him. On a boat it
# stands back so the whole boat is in view.
var target: Node3D
var boat: Boat = null
var hd := HeightData.new()
var yaw := 0.0          # 0: looking toward +z
var pitch := -0.28
var dist := 4.6
var dist_now := 4.6
var cam: Camera3D
var shake := 0.0
var follow := true      # swing behind him while he moves
var focus := Vector3.ZERO
var _has_focus := false
var _idle := 0.0        # seconds since the camera was turned by hand

func _ready():
	process_priority = 50   # after the chief, his horse and the boats are drawn for this frame
	cam = Camera3D.new(); cam.fov = 68.0; cam.near = 0.1; cam.far = 900.0
	add_child(cam); cam.current = true

func turn(dx: float, dy: float):
	yaw -= dx
	pitch = clampf(pitch - dy, -1.15, 0.45)
	if absf(dx) + absf(dy) > 0.0001: _idle = 0.0

# the next frame goes straight to the target (after a jump: respawn, landing, boarding)
func snap(): _has_focus = false

func _process(dt: float):
	if target == null: return
	_idle += dt
	var want_focus: Vector3
	var want_dist := dist
	if boat != null:
		want_focus = boat.visual_transform().origin + Vector3.UP * (7.0 if boat.kind != "row" else 1.8)
		want_dist = float(boat.K.cam)
	else:
		want_focus = (target.visual_position() if target.has_method("visual_position") else target.global_position) + Vector3.UP * 1.55
	if not _has_focus or focus.distance_to(want_focus) > 10.0:
		focus = want_focus; _has_focus = true; dist_now = want_dist
	else:
		focus = focus.lerp(want_focus, 1.0 - exp(-dt * 20.0))
	_follow(dt)
	var back := Vector3(-sin(yaw) * cos(pitch), -sin(pitch), -cos(yaw) * cos(pitch))
	# what is between his head and the camera
	var frac := WorldCollision.sweep(focus, focus + back * want_dist, 0.3)
	var d := want_dist if frac >= 1.0 else maxf(0.5, want_dist * frac - 0.15)
	dist_now = lerpf(dist_now, d, 1.0 - exp(-dt * (28.0 if d < dist_now else 3.0)))
	var cp := focus + back * dist_now
	cp.y = maxf(cp.y, hd.ground(cp.x, cp.z) + 0.3)
	if boat != null or (target is Player and (target as Player).swimming): cp.y = maxf(cp.y, WorldShape.WATER + 0.6)
	if shake > 0.0:
		shake = maxf(0.0, shake - dt * 2.5)
		cp += Vector3(randf() - 0.5, randf() - 0.5, 0) * shake * 0.15
	cam.global_position = cp
	cam.look_at(focus + Vector3.UP * 0.15)

# while he moves on and nobody turns the camera, it slowly swings behind him
func _follow(dt: float):
	if not follow or boat != null or not (target is Player): return
	var pl := target as Player
	if _idle < 1.4 or pl.state != "move": return
	var moving := pl.speed_now > 2.2 if pl.horse == null else pl.horse.speed > 2.5
	if not moving: return
	var behind := pl.face
	if absf(angle_difference(yaw, behind)) > 2.4: return   # (walking toward the camera: leave it)
	yaw = lerp_angle(yaw, behind, 1.0 - exp(-dt * (0.9 if pl.horse == null else 1.4)))
