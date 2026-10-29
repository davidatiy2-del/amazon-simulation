class_name Animal
extends Node3D
# One animal of the jungle: grazes and wanders; prey runs from the hunter, hunters stalk him. When it dies it stays
# as a carcass with meat on it for a while.

# kind: name, model, size, axis, walk, run, hp, sense, role (prey/hunter/small), meat, bite, colors, anims {idle, walk, run, eat, attack, death, hit}
var kind: Dictionary
var hd: HeightData
var model: Node3D
var ap: AnimationPlayer
var hp := 50.0
var state := "idle"
var t := 0.0
var next_t := 2.0
var target := Vector3.ZERO
var face := 0.0
var speed := 0.0
var meat := 0.0
var dead_t := 0.0
var bite_cool := 0.0
var anim_now := ""
var water_ok := false      # frogs keep to the shore
var far := false

func setup(k: Dictionary, h: HeightData, p: Vector3):
	kind = k; hd = h
	hp = k.hp; meat = k.meat
	model = ModelUtil.make(k.model, k.size, k.get("axis", 1))
	add_child(model)
	if k.has("colors"): ModelUtil.recolor(model, k.colors)
	ap = ModelUtil.find_player(model)
	if ap: ModelUtil.set_loops(ap, [k.anims.idle, k.anims.walk, k.anims.run, k.anims.get("eat", "")])
	face = randf() * TAU
	position = Vector3(p.x, hd.height(p.x, p.z), p.z)
	water_ok = k.get("shore", false)
	_play(k.anims.idle)
	next_t = randf_range(1.0, 5.0)

func _play(short: String, blend := 0.2, spd := 1.0):
	if ap == null or short == "": return
	var a := ModelUtil.anim(ap, short)
	if a == "" or a == anim_now: return
	anim_now = a
	ap.play(a, blend, spd)

func is_dead() -> bool: return state == "dead"

func hurt(dmg: float, from: Vector3):
	if state == "dead": return
	hp -= dmg
	if hp <= 0.0:
		state = "dead"; t = 0.0; speed = 0.0
		_play(kind.anims.death, 0.1)
		if ap: ap.get_animation(anim_now).loop_mode = Animation.LOOP_NONE
		return
	if kind.role == "hunter":
		state = "chase"; t = 0.0
	else:
		state = "flee"; t = 0.0; target = from
	if kind.anims.has("hit"): _play(kind.anims.hit, 0.05)

func take_meat(want: float) -> float:
	var got := minf(want, meat)
	meat -= got
	if meat <= 0.5: queue_free()
	return got

func _good_ground(x: float, z: float) -> bool:
	if absf(x) > 490.0 or absf(z) > 490.0: return false
	var d := hd.water_depth(x, z)
	if water_ok: return d < 0.3
	return d < 0.25 and hd.normal(x, z).y > 0.78

# the manager calls this (dt may cover several frames for far animals)
func tick(dt: float, player: Player, night: bool):
	t += dt
	if state == "dead":
		dead_t += dt
		return
	var to_p := player.position - position; to_p.y = 0.0
	var dist := to_p.length()
	var alive := not player.is_dead()
	bite_cool -= dt
	var sense: float = kind.sense * (1.4 if player.speed_now > 4.6 else (0.75 if player.speed_now < 0.3 else 1.0))
	match kind.role:
		"prey", "small":
			if alive and dist < sense and state != "flee": state = "flee"; t = 0.0
		"hunter":
			var range_: float = kind.sense * (1.5 if night else 1.0)
			if alive and dist < range_ and state != "chase" and state != "attack" and (night or player.hp < 70.0 or dist < kind.sense * 0.5): state = "chase"; t = 0.0
	var spd := 0.0
	match state:
		"idle":
			_play(kind.anims.get("eat", kind.anims.idle) if fmod(t, 9.0) > 5.0 and kind.anims.has("eat") else kind.anims.idle)
			if t > next_t:
				for i in 6:
					var a := randf() * TAU; var r := randf_range(6.0, 22.0)
					var c := position + Vector3(cos(a) * r, 0, sin(a) * r)
					if _good_ground(c.x, c.z): target = c; state = "walk"; t = 0.0; break
				next_t = randf_range(3.0, 9.0)
				if state == "idle": t = 0.0
		"walk":
			spd = kind.walk
			_play(kind.anims.walk, 0.2, 1.0)
			var d := target - position; d.y = 0.0
			if d.length() < 1.0 or t > 25.0: state = "idle"; t = 0.0
			else: face = lerp_angle(face, atan2(d.x, d.z), minf(1.0, dt * 3.0))
		"flee":
			spd = kind.run
			_play(kind.anims.run, 0.15, 1.0)
			var away := -to_p.normalized() if dist > 0.01 else Vector3.FORWARD
			# turn aside when the way ahead is water or a cliff
			for tries in 5:
				var p2 := position + away * 6.0
				if _good_ground(p2.x, p2.z): break
				away = away.rotated(Vector3.UP, 0.7 * (1 if tries % 2 == 0 else -1) * (tries + 1))
			face = lerp_angle(face, atan2(away.x, away.z), minf(1.0, dt * 6.0))
			if dist > sense * 2.4 or t > 14.0: state = "idle"; t = 0.0; next_t = 2.0
		"chase":
			spd = kind.run
			_play(kind.anims.run, 0.15, 1.0)
			face = lerp_angle(face, atan2(to_p.x, to_p.z), minf(1.0, dt * 7.0))
			if not alive or dist > kind.sense * 3.0 or t > 30.0: state = "idle"; t = 0.0
			elif dist < 1.9: state = "attack"; t = 0.0
		"attack":
			spd = 0.0
			face = lerp_angle(face, atan2(to_p.x, to_p.z), minf(1.0, dt * 8.0))
			if bite_cool <= 0.0:
				bite_cool = 1.3
				_play(kind.anims.attack, 0.08)
				anim_now = ""   # so the same attack plays again next time
				if dist < 2.4 and alive: player.hurt(kind.bite, "הותקפת על ידי " + kind.name, position)
			if dist > 2.6: state = "chase"; t = 0.0
			if not alive: state = "idle"; t = 0.0
	speed = move_toward(speed, spd, dt * 12.0)
	if speed > 0.01:
		var step := Vector3(sin(face), 0, cos(face)) * speed * dt
		var np := position + step
		if _good_ground(np.x, np.z) or state == "flee" or state == "chase": position = np
		else: state = "idle"; t = 0.0
	position = hd.push_out(position, 0.3)
	position.y = hd.height(position.x, position.z)
	if not water_ok and hd.water_depth(position.x, position.z) > 0.6: position.y = WorldShape.WATER - 0.6
	rotation.y = face
