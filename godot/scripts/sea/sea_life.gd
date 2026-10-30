class_name SeaLife
extends Node3D
# The sea's animals around the hunter: whales out in the deep water, sharks that go for anyone swimming there,
# dolphins that come to play beside a boat, gulls over the coasts and the ships. Also the harpoons the ship throws
# and the ropes that tie them to a whale.
var hd := HeightData.new()
var player: Player
var ship: Boat                # the whaling ship
var whales: Array[Whale] = []
var sharks: Array = []
var dolphins: Array = []
var gulls: Array = []
var harpoons: Array = []
var rope: MeshInstance3D
var frame := 0
var spawn_t := 0.0
var calm := false             # (tests) nothing moves
signal said(text: String)
signal whale_hit(w: Whale)

func _ready():
	rope = MeshInstance3D.new()
	var cm := CylinderMesh.new(); cm.top_radius = 0.035; cm.bottom_radius = 0.035; cm.height = 1.0; cm.radial_segments = 5; cm.rings = 1
	var m := StandardMaterial3D.new(); m.albedo_color = Color(0.78, 0.68, 0.48); m.roughness = 0.9
	cm.material = m; rope.mesh = cm; rope.visible = false
	add_child(rope)

# where the hunter is: on board, or on foot
func _center() -> Vector3:
	return player.boat.position if player.boat else player.position

func _process(dt: float):
	if player == null: return
	frame += 1
	var c := _center()
	var at_sea := c.z > 330.0 and c.z < 1680.0
	spawn_t -= dt
	if spawn_t <= 0.0:
		spawn_t = 2.0
		_despawn(c)
		if at_sea:
			if whales.size() < 3: _spawn_whale(c)
			if sharks.size() < 3: _spawn_shark(c)
			if dolphins.size() < 4 and randf() < 0.5: _spawn_pod(c)
		if (at_sea or hd.water_depth(c.x, c.z) > 0.5 or _near_coast(c)) and gulls.size() < 5: _spawn_gull(c)
	if calm: return
	for w in whales:
		if not is_instance_valid(w): continue
		var d := Vector2(w.position.x - c.x, w.position.z - c.z).length()
		var far := d > 260.0
		if far != w.far:
			w.far = far
			if w.ap: w.ap.speed_scale = 0.0 if far else 1.0
		if not far or (frame % 5) == 0: w.tick(dt * (5.0 if far else 1.0), ship)
	for s in sharks: if is_instance_valid(s): s.tick(dt, player)
	for d in dolphins: if is_instance_valid(d): d.tick(dt, player)
	for g in gulls: if is_instance_valid(g): g.tick(dt, c)
	_harpoons(dt)
	_rope(dt)

func _near_coast(c: Vector3) -> bool:
	return (c.z > 300.0 and c.z < 520.0) or (c.z > 1500.0 and c.z < 1700.0)

func _despawn(c: Vector3):
	for arr in [whales, sharks, dolphins, gulls]:
		for i in range(arr.size() - 1, -1, -1):
			var n = arr[i]
			if not is_instance_valid(n): arr.remove_at(i); continue
			var d := Vector2(n.position.x - c.x, n.position.z - c.z).length()
			var lim := 700.0 if arr == whales else (420.0 if arr == sharks else 300.0)
			if arr == whales and (n.harpoons > 0 or (n.is_dead() and not n.butchered and n.dead_t < 400.0)): lim = 1200.0
			if d > lim: n.queue_free(); arr.remove_at(i)

func _deep_spot(c: Vector3, rmin: float, rmax: float, depth: float) -> Vector3:
	for i in 16:
		var a := randf() * TAU; var r := randf_range(rmin, rmax)
		var x := c.x + cos(a) * r; var z := c.z + sin(a) * r
		if hd.in_bounds(x, z) and hd.water_depth(x, z) > depth: return Vector3(x, 0, z)
	return Vector3.INF

func _spawn_whale(c: Vector3):
	var p := _deep_spot(c, 150.0 if whales.is_empty() else 220.0, 520.0, 18.0)
	if p == Vector3.INF: return
	var w := Whale.new(); add_child(w); w.setup(hd, p); whales.append(w)

func _spawn_shark(c: Vector3):
	var p := _deep_spot(c, 70.0, 260.0, 7.0)
	if p == Vector3.INF: return
	var s := Shark.new(); add_child(s); s.setup(hd, p); sharks.append(s)

func _spawn_pod(c: Vector3):
	var p := _deep_spot(c, 90.0, 260.0, 6.0)
	if p == Vector3.INF: return
	var mesh := CreatureMesh.dolphin()
	for i in 4:
		var d := Dolphin.new(); add_child(d); d.setup(hd, p + Vector3(randf_range(-6, 6), 0, randf_range(-6, 6)), mesh, i); dolphins.append(d)

func _spawn_gull(c: Vector3):
	var g := Gull.new(); add_child(g); g.setup(c); gulls.append(g)

# ---------- harpoons ----------
# throws a harpoon from `from` at the nearest whale in reach, or straight ahead
func throw_harpoon(from: Vector3, ahead: Vector3) -> bool:
	var best: Whale = null; var bd := 46.0
	for w in whales:
		if not is_instance_valid(w) or w.is_dead(): continue
		var d := from.distance_to(w.back())
		var dir := (w.back() - from).normalized()
		if d < bd and dir.dot(ahead) > -0.2: bd = d; best = w
	var h := Harpoon.new(); add_child(h)
	if best:
		var T := clampf(bd / 32.0, 0.35, 1.4)
		var aim := best.back() + best.fwd() * best.speed * T
		h.launch(from, aim, T, best)
	else:
		var aim := from + ahead * 28.0; aim.y = WorldShape.WATER
		h.launch(from, aim, 0.9, null)
	harpoons.append(h)
	return best != null

func _harpoons(dt: float):
	for i in range(harpoons.size() - 1, -1, -1):
		var h: Harpoon = harpoons[i]
		if not is_instance_valid(h): harpoons.remove_at(i); continue
		var res := h.step(dt)
		if res == "hit":
			var w := h.target
			w.harpoons += 1
			w.hurt(110.0, h.start)
			whale_hit.emit(w)
			if w.is_dead(): said.emit("הלווייתן מת! מתקרבים אליו כדי לבתר אותו")
			else: said.emit("פגעת! (%d)" % w.harpoons)
		elif res == "miss":
			said.emit("החטאת" if h.target else "")
		if res != "": harpoons.remove_at(i)

# the rope from the ship's bow to the whale it caught; it tows the ship, and snaps if it is pulled too far
func _rope(dt: float):
	rope.visible = false
	if ship == null: return
	ship.tow = Vector3.ZERO
	if ship.is_sunk(): return
	for w in whales:
		if not is_instance_valid(w) or w.harpoons <= 0 or w.is_dead(): continue
		var a := ship.global_transform * Vector3(0, 1.4, 9.0)
		var b := w.back()
		var d := a.distance_to(b)
		if d > 80.0:
			w.harpoons = 0; said.emit("החבל נקרע. הלווייתן ברח")
			continue
		rope.visible = true
		rope.global_transform = Transform3D(_basis_y(b - a), (a + b) * 0.5)
		rope.scale = Vector3(1.0, d, 1.0)
		if d > 38.0:
			var pull := (b - a); pull.y = 0.0
			ship.tow = pull.normalized() * minf(3.5, (d - 38.0) * 0.2)
		break

static func _basis_y(dir: Vector3) -> Basis:
	var y := dir.normalized()
	var x := y.cross(Vector3.FORWARD if absf(y.dot(Vector3.FORWARD)) < 0.9 else Vector3.RIGHT).normalized()
	var z := x.cross(y).normalized()
	return Basis(x, y, z)

func dead_whale_near(p: Vector3, r: float) -> Whale:
	for w in whales:
		if is_instance_valid(w) and w.is_dead() and not w.butchered and Vector2(w.position.x - p.x, w.position.z - p.z).length() < r + Whale.LEN * 0.5: return w
	return null

func clear_all():
	for arr in [whales, sharks, dolphins, gulls, harpoons]:
		for n in arr: if is_instance_valid(n): n.queue_free()
		arr.clear()


# ======================================================================================
class Harpoon extends Node3D:
	var start := Vector3.ZERO
	var vel := Vector3.ZERO
	var t := 0.0
	var T := 1.0
	var target: Whale = null
	var aim := Vector3.ZERO
	const G := Vector3(0, -9.8, 0)
	func launch(from: Vector3, to: Vector3, flight: float, w: Whale):
		start = from; position = from; T = flight; target = w; aim = to
		vel = (to - from) / T - 0.5 * G * T
		var shaft := MeshInstance3D.new(); var cm := CylinderMesh.new(); cm.top_radius = 0.03; cm.bottom_radius = 0.03; cm.height = 2.2; cm.radial_segments = 5; cm.rings = 1
		var wood := StandardMaterial3D.new(); wood.albedo_color = Color(0.45, 0.31, 0.18); cm.material = wood
		shaft.mesh = cm; shaft.rotation.x = PI * 0.5; add_child(shaft)
		var tip := MeshInstance3D.new(); var cone := CylinderMesh.new(); cone.top_radius = 0.0; cone.bottom_radius = 0.07; cone.height = 0.35; cone.radial_segments = 5; cone.rings = 1
		var iron := StandardMaterial3D.new(); iron.albedo_color = Color(0.3, 0.3, 0.33); iron.metallic = 0.6; iron.roughness = 0.4; cone.material = iron
		tip.mesh = cone; tip.rotation.x = PI * 0.5; tip.position.z = 1.25; add_child(tip)
	# "hit", "miss" or "" while flying
	func step(dt: float) -> String:
		t += dt
		if t < T:
			position += vel * dt; vel += G * dt
			if vel.length() > 0.1: look_at(position + vel, Vector3.UP); rotate_object_local(Vector3.UP, PI)
			return ""
		var hit := target != null and is_instance_valid(target) and target.reachable() and position.distance_to(target.back()) < Whale.LEN * 0.45
		if hit:
			# it stays in the whale's back
			var w := target
			var gt := global_transform
			get_parent().remove_child(self); w.add_child(self); global_transform = gt
			return "hit"
		queue_free()
		return "miss"


# ======================================================================================
class Shark extends Node3D:
	var hd: HeightData
	var model: Node3D
	var face := 0.0
	var speed := 2.5
	var home := Vector3.ZERO
	var t := 0.0
	var bite_cool := 0.0
	var chasing := false
	func setup(h: HeightData, p: Vector3):
		hd = h
		model = ModelUtil.make("res://assets/nf/fish.glb", 3.2, 2)
		model.position.y = -0.95   # under the water; the fin's tip shows
		add_child(model)
		home = p; position = p; face = randf() * TAU; t = randf() * 10.0
	func tick(dt: float, player: Player):
		t += dt; bite_cool -= dt
		var p := player.position
		var swimming := player.boat == null and player.swimming and hd.water_depth(p.x, p.z) > 3.5
		var to := p - position; to.y = 0.0
		var dist := to.length()
		chasing = swimming and dist < 40.0 and not player.is_dead()
		var want: float
		if chasing:
			want = atan2(to.x, to.z); speed = move_toward(speed, 6.2, dt * 3.0)
			if dist < 2.4 and bite_cool <= 0.0:
				bite_cool = 1.6
				player.hurt(17.0, "כריש תקף אותך במים", position)
		else:
			# circles around its place
			var c := home + Vector3(cos(t * 0.12) * 22.0, 0, sin(t * 0.12) * 22.0)
			var tc := c - position
			want = atan2(tc.x, tc.z); speed = move_toward(speed, 2.6, dt)
		face = lerp_angle(face, want, minf(1.0, dt * 2.0))
		var np := position + Vector3(sin(face), 0, cos(face)) * speed * dt
		if hd.water_depth(np.x, np.z) > 2.5: position = np
		else: face += dt * 2.0
		position.y = Waves.level(position.x, position.z, 20.0)
		rotation = Vector3(0, face + sin(t * (9.0 if chasing else 5.0)) * 0.1, 0)


# ======================================================================================
class Dolphin extends Node3D:
	var hd: HeightData
	var face := 0.0
	var speed := 4.0
	var t := 0.0
	var jump_t := -1.0
	var next_jump := 3.0
	var idx := 0
	var y := -0.7
	func setup(h: HeightData, p: Vector3, mesh: Mesh, i: int):
		hd = h; idx = i
		var mi := MeshInstance3D.new(); mi.mesh = mesh; add_child(mi)
		position = p; face = randf() * TAU; next_jump = randf_range(1.0, 6.0)
	func tick(dt: float, player: Player):
		t += dt
		var want := face
		var spd := 4.0
		var b := player.boat
		if b != null and Vector2(b.position.x - position.x, b.position.z - position.z).length() < 140.0:
			# they come to swim beside the boat, a little ahead of it
			var side := Vector3(b.forward().z, 0, -b.forward().x) * (5.0 + idx * 2.5) * (1.0 if idx % 2 == 0 else -1.0)
			var goal := b.position + b.forward() * (8.0 + idx * 3.0) + side
			var tg := goal - position; tg.y = 0
			want = atan2(tg.x, tg.z)
			spd = clampf(absf(b.speed) + tg.length() * 0.4, 3.0, 12.0)
		else:
			want = face + sin(t * 0.3 + idx) * 0.4
		face = lerp_angle(face, want, minf(1.0, dt * 1.6))
		speed = move_toward(speed, spd, dt * 4.0)
		var np := position + Vector3(sin(face), 0, cos(face)) * speed * dt
		if hd.water_depth(np.x, np.z) > 2.5: position.x = np.x; position.z = np.z
		else: face += dt * 2.5
		# out of the water in an arc, now and then
		next_jump -= dt
		var pitch := 0.0
		var w := Waves.level(position.x, position.z, 20.0)
		if jump_t >= 0.0:
			jump_t += dt
			var k := jump_t / 1.3
			y = -0.8 + sin(k * PI) * 2.6
			pitch = -cos(k * PI) * 0.9
			if k >= 1.0: jump_t = -1.0; next_jump = randf_range(2.5, 7.0)
		else:
			y = -0.4 + sin(t * 1.7 + idx) * 0.15
			if next_jump <= 0.0: jump_t = 0.0
		position.y = w + y
		rotation = Vector3(pitch, face, 0)


# ======================================================================================
class Gull extends Node3D:
	var model: Node3D
	var ang := 0.0
	var rad := 18.0
	var hgt := 14.0
	var spd := 0.4
	var center := Vector3.ZERO
	func setup(c: Vector3):
		model = ModelUtil.make("res://assets/animals/Eagle.fbx", 1.5, 0)
		add_child(model)
		var ap := ModelUtil.find_player(model)
		if ap:
			var a := ModelUtil.anim(ap, "Flying")
			if a != "": ap.get_animation(a).loop_mode = Animation.LOOP_LINEAR; ap.play(a, 0.0, 1.4)
		ang = randf() * TAU; rad = randf_range(12.0, 34.0); hgt = randf_range(9.0, 22.0); spd = randf_range(0.25, 0.45) * (1 if randf() < 0.5 else -1)
		center = c
	func tick(dt: float, c: Vector3):
		center = center.lerp(c, minf(1.0, dt * 0.3))
		ang += spd * dt * 18.0 / rad
		position = center + Vector3(cos(ang) * rad, hgt + sin(ang * 3.0) * 1.5, sin(ang) * rad)
		var dir := Vector3(-sin(ang), 0, cos(ang)) * signf(spd)
		rotation = Vector3(0, atan2(dir.x, dir.z), -0.35 * signf(spd))
