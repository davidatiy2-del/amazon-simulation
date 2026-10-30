class_name City
extends Node3D
# One city: its people going about their day (to work, to the plaza and the tavern, home at night, guards at the
# gates), its horses in the stable and the knights who ride them out, its gates and its flags, who rules it, and its
# gold and food. People walk the streets on a graph (places.json, tools/citygen.gd). Who is near the camera is drawn
# in full, the rest as statues (scripts/people/crowd.gd). Soldiers who go to war leave the city (state "away") and
# come back when the war is over; those who fall are gone. The city's own soldiers defend it when it is attacked.
signal said(text: String)

class Person:
	var id := 0
	var role := ""
	var key := ""
	var home := -1             # a building (index in the city's data), -1: the barracks
	var pos := Vector3.ZERO
	var yaw := 0.0
	var path := PackedVector3Array()
	var pi := 0
	var goal := ""             # what they do when they get there
	var spot: Array = []       # [x, z, yaw] where they do it
	var state := "walk"        # walk, do, in (inside a building), away (at war, hunting), army (fighting here)
	var act := "idle"          # their move while doing
	var t := 0.0
	var speed := 1.4
	var phase := 0.0
	var mounted := -1          # the horse they ride (index), -1: on foot

var id := ""
var idx := 0                   # this city's number (for the crowd's ids)
var data: Dictionary
var owner_f := ""              # who rules it now
var hd := HeightData.new()
var crowd: Crowd
var dn: DayNight
var player: Node3D
var people: Array = []         # Person
var horses: Array = []         # {pos, yaw, key, slot, state, t, target, rider}
var astar := AStar3D.new()
var gy := 0.0
var gold := 0.0
var food := 0.0
var beasts := {}               # kind -> how many are kept here
var flags: Array = []
var doors := {}                # gate id -> its door (shown when shut)
var shut := false
var frame := 0
var hour_last := -1
var patrols := 0
var taken_horses := 0          # out of the stable (ridden by the player, at war)
var near := false              # the player is close (people are thought of every frame)
var beast_pen: Array = []      # beasts walking in their pens: {kind, pos, yaw, t, target, pen}
var greet_t := 0.0
static var _rng := RandomNumberGenerator.new()

func setup(city_id: String, n: int, d: Dictionary, c: Crowd, day: DayNight) -> City:
	id = city_id; idx = n; data = d; crowd = c; dn = day
	gy = float(d.get("ground", 3.0))
	var k: Dictionary = Kingdoms.CITIES.get(id, {})
	owner_f = k.get("owner", d.get("faction", "blue"))
	gold = float(k.get("gold", 300.0)); food = 500.0
	beasts = k.get("beasts", {}).duplicate()
	_rng.seed = hash(id)
	# the streets
	var nodes: Array = d.get("nodes", [])
	for i in nodes.size(): astar.add_point(i, Vector3(nodes[i][0], 0, nodes[i][1]))
	for e in d.get("edges", []): astar.connect_points(int(e[0]), int(e[1]))
	_make_people(k.get("plan", {}))
	_make_horses(int(k.get("horses", 0)))
	_make_beasts()
	_make_flags()
	_make_doors()
	return self

func faction() -> Dictionary: return Kingdoms.FACTIONS.get(owner_f, {})
func name_he() -> String: return String(data.get("name", id))
func center() -> Vector3: return Vector3(float(data.center[0]), gy, float(data.center[1]))
func is_mine() -> bool: return owner_f == "blue"
func dist_to(p: Vector3) -> float:
	var c := center()
	return maxf(0.0, maxf(absf(p.x - c.x) - float(data.hw), absf(p.z - c.z) - float(data.hd)))
func inside(p: Vector3, margin := 0.0) -> bool:
	var c := center()
	return absf(p.x - c.x) < float(data.hw) + margin and absf(p.z - c.z) < float(data.hd) + margin

# ---------------------------------------------------------------- people
func _make_people(plan: Dictionary):
	var homes: Array = data.get("homes", [])
	var hi := 0
	var pid := 0
	for role in plan:
		for i in int(plan[role]):
			var p := Person.new()
			p.id = pid; pid += 1
			p.role = role
			p.key = Kingdoms.register_look(crowd, owner_f, role, _rng.randi_range(0, 5))
			if role in Kingdoms.MILITARY: p.home = -1
			elif homes.size() > 0: p.home = int(homes[hi % homes.size()]); hi += 1
			p.speed = _rng.randf_range(1.25, 1.6)
			p.phase = _rng.randf()
			p.pos = _random_street_point()
			p.state = "walk"
			people.append(p)

func _random_street_point() -> Vector3:
	var nodes: Array = data.get("nodes", [])
	if nodes.is_empty(): return center()
	var n: Array = nodes[_rng.randi() % nodes.size()]
	return Vector3(float(n[0]) + _rng.randf_range(-2, 2), gy, float(n[1]) + _rng.randf_range(-2, 2))

func count(role: String) -> int:
	var n := 0
	for p: Person in people: if p.role == role and p.state != "away": n += 1
	return n

func counts() -> Dictionary:
	var c := {}
	for p: Person in people:
		if p.state == "away": continue
		c[p.role] = c.get(p.role, 0) + 1
	return c

func population() -> int:
	var n := 0
	for p: Person in people: if p.state != "away": n += 1
	return n

func soldiers() -> int:
	var n := 0
	for p: Person in people: if p.role in Kingdoms.MILITARY and p.state != "away": n += 1
	return n

# the day: what each one goes to do at this hour
func _plan(p: Person):
	var h := dn.time if dn else 12.0
	var mil: bool = p.role in Kingdoms.MILITARY
	var night := h < 6.0 or h >= 21.0
	var evening := h >= 18.0 and h < 21.0
	var noon := h >= 12.0 and h < 13.0
	if night:
		if mil and p.id % 6 == 0: _go_spot(p, "gate" if p.id % 12 == 0 else "guard", "guard")
		else: _go_home(p)
		return
	if evening and _rng.randf() < 0.7:
		var r := _rng.randf()
		if r < 0.45: _go_spot(p, "drink", "drink")
		elif r < 0.7 and data.spots.has("pray"): _go_spot(p, "pray", "pray")
		else: _go_plaza(p)
		return
	if noon and _rng.randf() < 0.5: _go_spot(p, "drink", "drink"); return
	var role: Dictionary = Kingdoms.ROLES.get(p.role, {})
	var kinds: Array = role.get("spots", [])
	if p.role == "hunter" and h > 7.0 and h < 16.0 and _rng.randf() < 0.5: _go_hunt(p); return
	if p.role == "builder": _go_build(p); return
	if p.role == "knight" and patrols < 3 and h > 8.0 and h < 17.0 and _rng.randf() < 0.25 and _free_horse() >= 0: _go_patrol(p); return
	for i in 4:
		if kinds.is_empty(): break
		var kind: String = kinds[_rng.randi() % kinds.size()]
		if data.spots.has(kind): _go_spot(p, kind, kind); return
	_go_plaza(p)

func _act_for(goal: String, p: Person) -> String:
	match goal:
		"train": return ["attack", "attack_b", "stab", "attack2h"][p.id % 4] if p.role != "archer" else "shoot"
		"drill": return ["attack", "block", "attack_b"][p.id % 3] if p.role != "archer" else "aim"
		"archer": return "shoot"
		"farm", "build", "smith", "chop": return "chop" if p.role in ["lumberjack", "smith", "builder"] else "work"
		"trade": return ["idle", "interact", "cheer"][p.id % 3]
		"drink": return ["idle", "cheer", "sit_floor"][p.id % 3]
		"pray": return "cast" if p.role == "healer" else "idle"
		"fish": return "use"
		"dock": return ["pickup", "use", "interact"][p.id % 3]
		"groom": return "interact"
		"guard": return "block" if p.id % 3 == 0 else "idle"
	return "idle"

func _go_spot(p: Person, kind: String, goal: String):
	var list: Array = data.spots.get(kind, [])
	if list.is_empty(): _go_plaza(p); return
	var s: Array = list[(p.id + _rng.randi() % 3) % list.size()]
	var jitter := Vector3(_rng.randf_range(-1.2, 1.2), 0, _rng.randf_range(-1.2, 1.2)) if kind in ["drink", "trade", "farm", "fish"] else Vector3.ZERO
	_walk_to(p, Vector3(float(s[0]), gy, float(s[1])) + jitter, goal, float(s[2]))

func _go_home(p: Person):
	var door: Vector3
	if p.home >= 0 and p.home < data.buildings.size():
		var b: Dictionary = data.buildings[p.home]
		door = Vector3(float(b.door[0]), gy, float(b.door[1]))
	else:
		door = _barracks_door(p.id)
	_walk_to(p, door, "home", 0.0)

func _barracks_door(n: int) -> Vector3:
	var bs := []
	for b in data.buildings: if b.t == "barracks" or b.t == "castle": bs.append(b)
	if bs.is_empty(): return center()
	var b: Dictionary = bs[n % bs.size()]
	return Vector3(float(b.door[0]), gy, float(b.door[1]))

func _go_plaza(p: Person):
	var pl: Array = data.get("plaza", data.center)
	_walk_to(p, Vector3(float(pl[0]) + _rng.randf_range(-12, 12), gy, float(pl[1]) + _rng.randf_range(-9, 9)), "chat", _rng.randf() * TAU)

func _go_build(p: Person):
	var bs: Array = data.buildings
	if bs.is_empty(): _go_plaza(p); return
	var b: Dictionary = bs[_rng.randi() % bs.size()]
	var f := Vector2(sin(float(b.yaw)), cos(float(b.yaw)))
	_walk_to(p, Vector3(float(b.door[0]) + f.y * 2.0, gy, float(b.door[1]) - f.x * 2.0), "build", float(b.yaw) + PI)

func _go_hunt(p: Person):
	var g := _gate("land")
	if g.is_empty(): _go_plaza(p); return
	_walk_to(p, Vector3(float(g.out[0]), gy, float(g.out[1])), "hunt", 0.0)

func _gate(gid: String) -> Dictionary:
	for g in data.get("gates", []): if g.id == gid: return g
	return {}

func _walk_to(p: Person, to: Vector3, goal: String, yaw: float):
	p.goal = goal; p.spot = [to.x, to.z, yaw]
	p.path = _route(p.pos, to)
	p.pi = 0
	p.state = "walk"

# a way along the streets from a to b
func _route(a: Vector3, b: Vector3) -> PackedVector3Array:
	var out := PackedVector3Array()
	if astar.get_point_count() == 0: out.append(b); return out
	var na := astar.get_closest_point(Vector3(a.x, 0, a.z)); var nb := astar.get_closest_point(Vector3(b.x, 0, b.z))
	var pts := astar.get_point_path(na, nb)
	for q in pts: out.append(Vector3(q.x, gy, q.z))
	out.append(b)
	return out

func _tick_person(p: Person, dt: float):
	match p.state:
		"in", "away", "army":
			if p.state == "in" or (p.state == "away" and p.goal == "hunt"):
				p.t -= dt
				if p.t <= 0.0:
					if p.goal == "hunt": food += 12.0; p.pos = _gate_pos("land", true)
					p.state = "walk"; p.goal = ""; _plan(p)
			return
		"walk":
			if p.pi >= p.path.size():
				_arrive(p); return
			var to := p.path[p.pi]
			var d := Vector3(to.x - p.pos.x, 0, to.z - p.pos.z)
			var step := p.speed * dt * (2.2 if p.mounted >= 0 else 1.0)
			if d.length() <= step:
				p.pos = Vector3(to.x, gy, to.z); p.pi += 1
			else:
				var dn2 := d / d.length()
				p.pos += dn2 * step
				p.yaw = lerp_angle(p.yaw, atan2(dn2.x, dn2.z), minf(1.0, dt * 8.0))
			if p.mounted >= 0 and p.mounted < horses.size():
				var hz: Dictionary = horses[p.mounted]
				hz.pos = p.pos; hz.yaw = p.yaw; hz.state = "ridden"
		"do":
			p.t -= dt
			if p.t <= 0.0: _plan(p)

func _arrive(p: Person):
	var s: Array = p.spot
	if s.size() >= 3 and p.goal != "chat": p.yaw = float(s[2])
	match p.goal:
		"home":
			p.state = "in"
			var h := dn.time if dn else 12.0
			p.t = (24.0 - h + 6.5) * 60.0 if h >= 18.0 else (6.5 - h) * 60.0 + 30.0
			if h >= 6.0 and h < 18.0: p.t = 60.0
		"hunt":
			p.state = "away"; p.t = _rng.randf_range(240.0, 600.0)
		"patrol":
			_end_patrol(p)
		_:
			p.state = "do"; p.act = _act_for(p.goal, p); p.t = _rng.randf_range(40.0, 140.0)

func _gate_pos(gid: String, inside_city: bool) -> Vector3:
	var g := _gate(gid)
	if g.is_empty(): return center()
	var q: Array = g["in"] if inside_city else g["out"]
	return Vector3(float(q[0]), gy, float(q[1]))

# ---------------------------------------------------------------- horses: in the stable, ridden on patrol
func _make_horses(n: int):
	var st: Dictionary = data.get("stable", {})
	var slots: Array = st.get("slots", [])
	if n <= 0 or slots.is_empty(): return
	var blanket: Color = faction().get("color", Color(0.3, 0.3, 0.3))
	for i in n:
		var col := i % Kingdoms.HORSE_COLORS.size()
		var key: String = "horse_%s_%d" % [owner_f, col]
		if not crowd.looks.has(key): crowd.register(key, Kingdoms.horse_def(col, blanket))
		var s: Array = slots[i % slots.size()]
		horses.append({"pos": Vector3(float(s[0]) + _rng.randf_range(-1.5, 1.5), gy, float(s[1]) + _rng.randf_range(-1.5, 1.5)), "yaw": _rng.randf() * TAU,
			"key": key, "col": col, "slot": i % slots.size(), "state": "idle", "t": _rng.randf_range(2.0, 20.0), "target": Vector3.ZERO, "away": false})

func horses_here() -> int:
	var n := 0
	for h in horses: if not h.away: n += 1
	return n

func _free_horse() -> int:
	for i in horses.size():
		var h: Dictionary = horses[i]
		if not h.away and h.state != "ridden": return i
	return -1

# a knight takes a horse and rides the streets around the city, then brings it back
func _go_patrol(p: Person):
	var hi := _free_horse()
	if hi < 0: _go_plaza(p); return
	var h: Dictionary = horses[hi]
	h.state = "ridden"
	p.mounted = hi
	patrols += 1
	p.pos = Vector3(float(data.stable.gate[0]), gy, float(data.stable.gate[1]))
	# a loop of streets: a few random nodes and back to the stable's gate
	var pts := PackedVector3Array()
	var cur := p.pos
	for i in 4:
		var target := _random_street_point()
		pts.append_array(_route(cur, target)); cur = target
	pts.append_array(_route(cur, p.pos))
	p.path = pts; p.pi = 0; p.goal = "patrol"; p.spot = [p.pos.x, p.pos.z, 0.0]; p.state = "walk"

func _end_patrol(p: Person):
	if p.mounted >= 0 and p.mounted < horses.size():
		var h: Dictionary = horses[p.mounted]
		h.state = "idle"; h.t = 5.0
		var s: Array = data.stable.slots[h.slot]
		h.pos = Vector3(float(s[0]), gy, float(s[1]))
	p.mounted = -1
	patrols = maxi(0, patrols - 1)
	_plan(p)

func _tick_horses(dt: float):
	var st: Dictionary = data.get("stable", {})
	if st.is_empty(): return
	for h in horses:
		if h.away or h.state == "ridden": continue
		h.t -= dt
		match h.state:
			"idle":
				if h.t <= 0.0:
					var slots: Array = st.slots
					var s: Array = slots[_rng.randi() % slots.size()]
					h.target = Vector3(float(s[0]) + _rng.randf_range(-2, 2), gy, float(s[1]) + _rng.randf_range(-2, 2))
					h.state = "walk"; h.t = 20.0
			"walk":
				var d: Vector3 = h.target - h.pos; d.y = 0.0
				if d.length() < 0.4 or h.t <= 0.0: h.state = "idle"; h.t = _rng.randf_range(6.0, 25.0)
				else:
					var dir := d.normalized()
					h.pos += dir * 1.0 * dt
					h.yaw = lerp_angle(h.yaw, atan2(dir.x, dir.z), minf(1.0, dt * 3.0))

# the player takes a horse out of the stable (returns its look key, or "")
func take_horse() -> Dictionary:
	var hi := _free_horse()
	if hi < 0: return {}
	var h: Dictionary = horses[hi]
	h.away = true
	return {"key": h.key, "col": h.col, "i": hi}

func return_horse(i: int):
	if i >= 0 and i < horses.size(): horses[i].away = false; horses[i].state = "idle"

func send_horses(n: int) -> int:
	var sent := 0
	for h in horses:
		if sent >= n: break
		if not h.away and h.state != "ridden": h.away = true; sent += 1
	return sent

func lose_horses(n: int):
	var lost := 0
	for i in range(horses.size() - 1, -1, -1):
		if lost >= n: break
		if horses[i].away: horses.remove_at(i); lost += 1

func add_horses(n: int):
	var st: Dictionary = data.get("stable", {})
	var slots: Array = st.get("slots", [])
	if slots.is_empty(): return
	var blanket: Color = faction().get("color", Color(0.3, 0.3, 0.3))
	for i in n:
		var col := _rng.randi() % Kingdoms.HORSE_COLORS.size()
		var key: String = "horse_%s_%d" % [owner_f, col]
		if not crowd.looks.has(key): crowd.register(key, Kingdoms.horse_def(col, blanket))
		var s: Array = slots[_rng.randi() % slots.size()]
		horses.append({"pos": Vector3(float(s[0]), gy, float(s[1])), "yaw": _rng.randf() * TAU, "key": key, "col": col, "slot": _rng.randi() % slots.size(), "state": "idle", "t": 3.0, "target": Vector3.ZERO, "away": false})

func horses_back():
	for h in horses: h.away = false

# ---------------------------------------------------------------- beasts in their pens
func _make_beasts():
	var pens: Array = data.get("pens", [])
	if pens.is_empty() and beasts.size() > 0:
		# a kennel by the training ground
		var tr: Array = data.get("train", data.center)
		pens = [{"x": float(tr[0]), "z": float(tr[1]), "r": 6.0, "kind": "any"}]
		data["pens"] = pens
	if pens.is_empty(): return
	for kind in beasts:
		var key: String = "beast_" + str(kind)
		if not crowd.looks.has(key): crowd.register(key, Kingdoms.beast_def(kind))
		var pen: Dictionary = pens[0]
		for p2 in pens:
			if p2.kind == "any" or ((kind in ["triceratops", "trex"]) == (p2.kind == "big") and not (p2.kind == "dog" and kind != "wardog")): pen = p2
		for i in int(beasts[kind]):
			var a := _rng.randf() * TAU; var r := _rng.randf() * float(pen.r)
			beast_pen.append({"kind": kind, "key": key, "pos": Vector3(float(pen.x) + cos(a) * r, gy, float(pen.z) + sin(a) * r), "yaw": _rng.randf() * TAU,
				"t": _rng.randf_range(1, 8), "target": Vector3.ZERO, "pen": pen, "move": "idle", "away": false})

func beasts_here() -> Dictionary:
	var c := {}
	for b in beast_pen: if not b.away: c[b.kind] = c.get(b.kind, 0) + 1
	return c

func _tick_beasts(dt: float):
	for b in beast_pen:
		if b.away: continue
		b.t -= dt
		if b.move == "idle":
			if b.t <= 0.0:
				var a := _rng.randf() * TAU; var r := _rng.randf() * float(b.pen.r)
				b.target = Vector3(float(b.pen.x) + cos(a) * r, gy, float(b.pen.z) + sin(a) * r); b.move = "walk"; b.t = 12.0
		else:
			var d: Vector3 = b.target - b.pos; d.y = 0.0
			if d.length() < 0.5 or b.t <= 0.0: b.move = "idle"; b.t = _rng.randf_range(3.0, 12.0)
			else:
				var dir := d.normalized(); b.pos += dir * 1.2 * dt; b.yaw = lerp_angle(b.yaw, atan2(dir.x, dir.z), minf(1.0, dt * 3.0))

# ---------------------------------------------------------------- flags, gates
func _make_flags():
	for f in flags: f.queue_free()
	flags.clear()
	for q in data.get("flags", []):
		var n := _flag_model()
		if n == null: continue
		add_child(n)
		n.global_position = Vector3(float(q[0]), gy, float(q[1]))
		flags.append(n)
	for t in data.get("towers", []):
		pass

func _flag_model() -> Node3D:
	var path := ""
	match owner_f:
		"blue", "red", "green": path = "res://assets/kaykit/town/flag_%s.gltf" % owner_f
		"black": path = "res://assets/pirate/flag-pirate-high.glb"
		_: path = "res://assets/kaykit/town/flag_yellow.gltf"
	var n: Node3D = (load(path) as PackedScene).instantiate()
	n.scale = Vector3.ONE * (4.5 if owner_f != "black" else 2.2)
	return n

func _make_doors():
	var wood := StandardMaterial3D.new(); wood.albedo_color = Color(0.42, 0.26, 0.15); wood.roughness = 0.9
	var iron := StandardMaterial3D.new(); iron.albedo_color = Color(0.25, 0.26, 0.28); iron.metallic = 0.5; iron.roughness = 0.5
	for g in data.get("gates", []):
		var d := Node3D.new(); add_child(d)
		d.global_position = Vector3(float(g.x), gy, float(g.z)); d.rotation.y = float(g.yaw)
		var dh := {"kk": 5.4, "pirate": 6.8, "tribal": 3.0}.get(String(data.get("style", "kk")), 5.0) as float
		var m := MeshInstance3D.new(); var bm := BoxMesh.new(); bm.size = Vector3(float(g.w) + 0.6, dh, 0.5); m.mesh = bm; m.material_override = wood
		m.position.y = dh * 0.5; d.add_child(m)
		for k in 3:
			var bar := MeshInstance3D.new(); var bb := BoxMesh.new(); bb.size = Vector3(float(g.w) + 0.7, 0.18, 0.6); bar.mesh = bb; bar.material_override = iron
			bar.position.y = dh * (0.18 + k * 0.32); d.add_child(bar)
		d.visible = false
		doors[g.id] = d

func set_shut(on: bool):
	if on == shut: return
	shut = on
	for g in data.get("gates", []):
		HeightData.set_gate(id, g, on)
		if doors.has(g.id): doors[g.id].visible = on

# the city changes hands: new flags, its people are now the new ruler's
func set_ruler(f: String):
	owner_f = f
	_make_flags()
	for p: Person in people:
		p.key = Kingdoms.register_look(crowd, owner_f, p.role, p.id)

# ---------------------------------------------------------------- every frame
func _process(dt: float):
	if dt > 0.1: dt = 0.1
	frame += 1
	var pp: Vector3 = player.global_position if player else Vector3.ZERO
	var dist := dist_to(pp)
	near = dist < 160.0
	# far away: think rarely
	var every := 1 if dist < 120.0 else (6 if dist < 400.0 else 30)
	if frame % every != 0: return
	var dts := dt * every
	var h := int(dn.time) if dn else 12
	if h != hour_last:
		hour_last = h
		if h in [6, 12, 13, 18, 21]:
			for p: Person in people:
				if p.state == "do" or (p.state == "in" and h == 6): p.t = _rng.randf_range(0.0, 25.0)
		if h == 0: _new_day()
	for p: Person in people: _tick_person(p, dts)
	_tick_horses(dts)
	_tick_beasts(dts)
	if dist < crowd.far_dist + 120.0: _draw()
	greet_t -= dts

func _draw():
	var base := idx * 100000
	for p: Person in people:
		if p.state == "in" or p.state == "away" or p.state == "army": continue
		var mv: String = p.act if p.state == "do" else ("ride" if p.mounted >= 0 else "walk")
		var y := gy
		var pos := p.pos
		if p.mounted >= 0:
			pos = p.pos + Vector3(0, 0.84, 0) + Vector3(sin(p.yaw), 0, cos(p.yaw)) * 0.12
			y = pos.y
		crowd.add(base + p.id, p.key, Vector3(pos.x, y, pos.z), p.yaw, mv, p.phase, p.speed / 1.4 if p.mounted < 0 else 1.0)
	for i in horses.size():
		var hz: Dictionary = horses[i]
		if hz.away: continue
		var mv: String = "walk" if hz.state == "walk" else ("run" if hz.state == "ridden" else "idle")
		crowd.add(base + 50000 + i, hz.key, hz.pos, hz.yaw, mv, float(i) * 0.37, 1.0 if mv != "walk" else 0.7)
	for i in beast_pen.size():
		var b: Dictionary = beast_pen[i]
		if b.away: continue
		crowd.add(base + 60000 + i, b.key, b.pos, b.yaw, b.move, float(i) * 0.31, 1.0)

# a new day: the city eats and earns
func _new_day():
	var pop := population()
	var made := 0.0
	for p: Person in people:
		if p.state == "away": continue
		match p.role:
			"farmer": made += 9.0
			"fisher": made += 7.0
			"hunter": made += 5.0
			"cook": made += 3.0
	food = maxf(0.0, food + made - pop * 0.9)
	var g := 0.0
	for p: Person in people:
		if p.state == "away": continue
		if p.role == "merchant": g += 6.0
		elif p.role == "smith": g += 3.0
		elif p.role == "sailor": g += 1.0
	gold += g + pop * 0.15

# someone near the player says something now and then
func greeting(pp: Vector3) -> String:
	if greet_t > 0.0 or not is_mine(): return ""
	var best: Person = null; var bd := 4.0
	for p: Person in people:
		if p.state == "in" or p.state == "away" or p.state == "army": continue
		var d := Vector2(p.pos.x - pp.x, p.pos.z - pp.z).length()
		if d < bd: bd = d; best = p
	if best == null: return ""
	greet_t = 9.0
	var r: Dictionary = Kingdoms.ROLES.get(best.role, {})
	var lines := ["שלום, ראש השבט!", "ראש השבט! הכול בסדר בעיר", "יום טוב לך, ראש השבט", "העיר משגשגת, ראש השבט"]
	if best.role in Kingdoms.MILITARY: lines = ["מוכן לפקודה, ראש השבט!", "החרב שלי שלך, ראש השבט", "נכבוש כל עיר שתבחר, ראש השבט!"]
	return "%s (%s): %s" % [r.get("name", ""), name_he(), lines[best.id % lines.size()]]

# ---------------------------------------------------------------- war
# soldiers leave the city for a campaign: returns how many of each actually went
func send_out(want: Dictionary) -> Dictionary:
	var sent := {}
	for p: Person in people:
		if not (p.role in want) or p.state == "away": continue
		if sent.get(p.role, 0) >= int(want[p.role]): continue
		if p.mounted >= 0: _end_patrol(p)
		p.state = "away"; p.goal = "war"
		sent[p.role] = sent.get(p.role, 0) + 1
	return sent

# they come home: alive (by role) come back to the gate; the fallen are gone
func come_home(alive: Dictionary):
	var left := alive.duplicate()
	var keep: Array = []
	for p: Person in people:
		if p.state == "away" and p.goal == "war":
			if left.get(p.role, 0) > 0:
				left[p.role] -= 1
				p.state = "walk"; p.goal = ""; p.pos = _gate_pos("sea", true); p.path = PackedVector3Array(); p.pi = 0
				keep.append(p)
			continue
		keep.append(p)
	people = keep

# new people join (from a conquered city, or recruits)
func add_people(role: String, n: int):
	var pid := 0
	for p: Person in people: pid = maxi(pid, p.id + 1)
	var homes: Array = data.get("homes", [])
	for i in n:
		var p := Person.new()
		p.id = pid; pid += 1; p.role = role
		p.key = Kingdoms.register_look(crowd, owner_f, role, _rng.randi_range(0, 5))
		p.home = -1 if role in Kingdoms.MILITARY else (int(homes[p.id % homes.size()]) if homes.size() > 0 else -1)
		p.speed = _rng.randf_range(1.25, 1.6); p.phase = _rng.randf()
		p.pos = _gate_pos("sea", true); p.state = "walk"
		people.append(p)

# the soldiers who are here now, to defend (taken out of the city's life while they fight)
func take_defenders() -> Array:
	var out := []
	for p: Person in people:
		if p.role in Kingdoms.MILITARY and p.state != "away":
			p.state = "army"
			out.append(p)
	return out

func release_defenders(alive_ids: Dictionary):
	var keep := []
	for p: Person in people:
		if p.state == "army":
			if alive_ids.has(p.id): p.state = "walk"; p.path = PackedVector3Array(); p.pi = 0; keep.append(p)
			continue
		keep.append(p)
	people = keep

func take_beasts() -> Array:
	var out := []
	for b in beast_pen:
		if not b.away: b.away = true; out.append(b)
	return out

func lose_beasts(kind_counts: Dictionary):
	var keep := []
	var left := kind_counts.duplicate()
	for b in beast_pen:
		if b.away and left.get(b.kind, 0) > 0: left[b.kind] -= 1; continue
		b.away = false
		keep.append(b)
	beast_pen = keep

func add_beasts(kind: String, n: int):
	var pens: Array = data.get("pens", [])
	var key: String = "beast_" + str(kind)
	if not crowd.looks.has(key): crowd.register(key, Kingdoms.beast_def(kind))
	var pen: Dictionary
	if pens.is_empty():
		var st: Dictionary = data.get("stable", {})
		if st.is_empty(): pen = {"x": center().x, "z": center().z, "r": 8.0, "kind": "any"}
		else: pen = {"x": st.x, "z": st.z, "r": minf(float(st.hx), float(st.hz)) * 0.7, "kind": "any"}
	else: pen = pens[0]
	for i in n:
		var a := _rng.randf() * TAU; var r := _rng.randf() * float(pen.r)
		beast_pen.append({"kind": kind, "key": key, "pos": Vector3(float(pen.x) + cos(a) * r, gy, float(pen.z) + sin(a) * r), "yaw": _rng.randf() * TAU,
			"t": _rng.randf_range(1, 8), "target": Vector3.ZERO, "pen": pen, "move": "idle", "away": false})

# ---------------------------------------------------------------- saving
func save_state() -> Dictionary:
	var c := {}
	for p: Person in people: c[p.role] = c.get(p.role, 0) + 1
	return {"owner": owner_f, "gold": gold, "food": food, "people": c, "horses": horses.size(), "beasts": _beast_counts()}

func _beast_counts() -> Dictionary:
	var c := {}
	for b in beast_pen: c[b.kind] = c.get(b.kind, 0) + 1
	return c

func load_state(s: Dictionary):
	if s.is_empty(): return
	if s.has("owner") and s.owner != owner_f: set_ruler(s.owner)
	gold = float(s.get("gold", gold)); food = float(s.get("food", food))
	# people: as many of each role as were saved
	var want: Dictionary = s.get("people", {})
	var have := {}
	var keep := []
	for p: Person in people:
		var n: int = have.get(p.role, 0)
		if n < int(want.get(p.role, 0)): have[p.role] = n + 1; keep.append(p)
	people = keep
	for role in want:
		var missing: int = int(want[role]) - int(have.get(role, 0))
		if missing > 0: add_people(role, missing)
	var hn := int(s.get("horses", horses.size()))
	if hn < horses.size(): horses.resize(hn)
	elif hn > horses.size(): add_horses(hn - horses.size())
	var bc: Dictionary = s.get("beasts", {})
	var keep_b := []
	var have_b := {}
	for b in beast_pen:
		var n: int = have_b.get(b.kind, 0)
		if n < int(bc.get(b.kind, 0)): have_b[b.kind] = n + 1; keep_b.append(b)
	beast_pen = keep_b
	for k in bc:
		var missing: int = int(bc[k]) - int(have_b.get(k, 0))
		if missing > 0: add_beasts(k, missing)
