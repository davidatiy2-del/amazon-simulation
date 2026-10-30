class_name Whale
extends Node3D
# A humpback whale in the open sea. It cruises, comes up to breathe (and blows), then dives deep for a while.
# Harpoons only reach it near the surface. Hurt, it flees close under the surface, sometimes turns on the ship and rams
# it. Dead, it floats belly up until it is butchered.
const LEN := 14.0
const MAX_HP := 880.0
var hd: HeightData
var model: Node3D
var ap: AnimationPlayer
var body_h := 3.0           # its height, meters
var hp := MAX_HP
var state := "swim"         # swim, flee, ram, dead
var t := 0.0
var face := 0.0
var speed := 2.0
var target := Vector3.ZERO
var down := false           # deep under the water
var breath_t := 0.0         # time left in this phase (up or down)
var depth_now := 0.0        # how far its back is under the water line
var spout: CPUParticles3D
var ram_cool := 6.0
var dead_t := 0.0
var harpoons := 0           # stuck in it, with ropes to the ship
var butchered := false
var far := false

func setup(h: HeightData, p: Vector3):
	hd = h
	model = ModelUtil.make("res://assets/animals/Whale.fbx", LEN, 2)
	add_child(model)
	ModelUtil.recolor(model, {"Material.001": Color(0.2, 0.25, 0.31), "Material.002": Color(0.8, 0.83, 0.86)})
	var bb := ModelUtil.body_bounds(model.get_child(0))
	body_h = maxf(2.0, bb.size.y * model.get_child(0).scale.y)
	ap = ModelUtil.find_player(model)
	if ap:
		var a := ModelUtil.anim(ap, "ArmatureAction")
		if a != "": ap.get_animation(a).loop_mode = Animation.LOOP_LINEAR; ap.play(a, 0.0, 0.6)
	_make_spout()
	position = Vector3(p.x, 0, p.z); face = randf() * TAU
	down = randf() < 0.5; breath_t = randf_range(4.0, 14.0)
	depth_now = 9.0 if down else 0.3
	_pick_target()

func _make_spout():
	spout = CPUParticles3D.new()
	spout.emitting = false; spout.amount = 60; spout.lifetime = 1.8; spout.explosiveness = 0.15
	spout.direction = Vector3.UP; spout.spread = 9.0; spout.initial_velocity_min = 7.0; spout.initial_velocity_max = 10.0
	spout.gravity = Vector3(0, -6.0, 0); spout.scale_amount_min = 0.5; spout.scale_amount_max = 1.1
	spout.damping_min = 1.0; spout.damping_max = 2.0
	var q := QuadMesh.new(); q.size = Vector2(0.9, 0.9)
	var m := StandardMaterial3D.new(); m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED; m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_color = Color(0.95, 0.97, 1.0, 0.6); m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	# a soft round puff
	var gt := GradientTexture2D.new(); gt.fill = GradientTexture2D.FILL_RADIAL; gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1.0, 0.5)
	var gr := Gradient.new(); gr.set_color(0, Color(1, 1, 1, 1)); gr.set_color(1, Color(1, 1, 1, 0)); gt.gradient = gr; gt.width = 64; gt.height = 64
	m.albedo_texture = gt
	q.material = m; spout.mesh = q
	spout.position = Vector3(0, body_h, LEN * 0.22)
	add_child(spout)

func is_dead() -> bool: return state == "dead"
# near enough the surface for a harpoon to reach it
func reachable() -> bool: return state != "dead" and depth_now < 2.6
# its back: where harpoons stick and ropes tie
func back() -> Vector3: return global_position + Vector3.UP * body_h * 0.85
func fwd() -> Vector3: return Vector3(sin(face), 0, cos(face))

func _pick_target():
	for i in 12:
		var a := randf() * TAU; var r := randf_range(60.0, 180.0)
		var c := position + Vector3(cos(a) * r, 0, sin(a) * r)
		if hd.in_bounds(c.x, c.z) and hd.water_depth(c.x, c.z) > 16.0: target = c; return
	target = position - fwd() * 50.0

func hurt(dmg: float, from: Vector3) -> void:
	if state == "dead": return
	hp -= dmg
	if hp <= 0.0:
		hp = 0.0; state = "dead"; t = 0.0; speed = 0.0; harpoons = 0
		if ap: ap.pause()
		return
	if state != "ram": state = "flee"; t = 0.0
	down = false; breath_t = randf_range(6.0, 12.0)
	target = position + (position - from).normalized() * 150.0

# the manager calls this; ship: the whaling ship (or null)
func tick(dt: float, ship: Boat) -> void:
	t += dt
	ram_cool -= dt
	if state == "dead":
		dead_t += dt
		# it rolls over; rolled over, its belly (the bottom of the model) floats just above the water
		var roll := lerpf(rotation.z, PI * 0.92, minf(1.0, dt * 0.5))
		rotation = Vector3(0, face, roll)
		var w := Waves.level(position.x, position.z, 30.0)
		var k := clampf(roll / (PI * 0.92), 0.0, 1.0)
		position.y = lerpf(w - body_h + 0.25, w + 0.35, k)
		return
	# breathing: some time up at the surface (blowing now and then), some time deep down
	breath_t -= dt
	if breath_t <= 0.0:
		down = not down if state == "swim" else (randf() < 0.25)
		breath_t = randf_range(18.0, 30.0) if down else randf_range(10.0, 16.0)
		if not down: _blow()
	if not down and state != "dead" and fmod(t, 7.0) < dt: _blow()
	var want_depth := 9.0 if down else 0.25
	if state == "flee" and down: want_depth = 4.5
	depth_now = move_toward(depth_now, want_depth, dt * 1.2)
	# where to go
	var spd := 2.0
	match state:
		"swim":
			if Vector2(target.x - position.x, target.z - position.z).length() < 12.0 or t > 60.0: _pick_target(); t = 0.0
		"flee":
			spd = 5.6 if hp > MAX_HP * 0.3 else 3.6
			if t > 35.0: state = "swim"; t = 0.0; _pick_target()
			# sometimes it turns on the ship
			if ship != null and not ship.is_sunk() and ram_cool <= 0.0 and harpoons > 0:
				var dsh := Vector2(ship.position.x - position.x, ship.position.z - position.z).length()
				if dsh < 30.0 and randf() < 0.5: state = "ram"; t = 0.0; down = false
				ram_cool = 10.0
		"ram":
			spd = 7.5
			if ship == null or ship.is_sunk(): state = "flee"; t = 0.0
			else:
				target = ship.position
				if ship.dist_to(position + fwd() * LEN * 0.45) < 1.5:
					ship.damage(22.0)
					state = "flee"; t = 0.0; ram_cool = 14.0
					target = position - fwd() * 120.0
				elif t > 8.0: state = "flee"; t = 0.0
	var to := target - position; to.y = 0.0
	if to.length() > 0.5: face = lerp_angle(face, atan2(to.x, to.z), minf(1.0, dt * (0.9 if state == "ram" else 0.35)))
	speed = move_toward(speed, spd, dt * 1.5)
	var np := position + fwd() * speed * dt
	if hd.in_bounds(np.x, np.z) and hd.water_depth(np.x + fwd().x * LEN * 0.6, np.z + fwd().z * LEN * 0.6) > 9.0: position.x = np.x; position.z = np.z
	else: _pick_target(); face += dt * 0.8
	position.y = Waves.level(position.x, position.z, 30.0) - body_h + 0.25 - depth_now
	rotation = Vector3(-0.08 if depth_now < want_depth - 0.3 else (0.08 if depth_now > want_depth + 0.3 else 0.0), face, 0.0)

func _blow():
	if spout and not far: spout.restart(); spout.emitting = true

func butcher() -> void:
	butchered = true
	var tw := create_tween(); tw.tween_property(self, "position:y", position.y - 8.0, 6.0); tw.tween_callback(queue_free)
