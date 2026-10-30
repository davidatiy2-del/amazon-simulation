class_name War
extends Node3D
# Conquest. Only the chief decides on a war (the war council, scripts/ui/council.gd): which city, with how many
# knights, warriors and archers, which beasts, and to what end (to take the city, to plunder it, or to make it pay).
# The soldiers and their horses board the fleet; the chief boards a ship and the fleet follows him across the sea.
# By the enemy's shore he gives the word to land: everyone comes ashore in ranks. Then he leads: follow me, hold,
# charge, shield wall, break the gate, back to the ships, each for all or for one kind of troops. The enemy shuts
# its gates, its archers shoot from the walls, its beasts of war (wolves, raptors, a triceratops, a T-rex, dogs)
# come out at them, and its chief stands by his castle. The city falls when its chief falls, when its soldiers are
# gone, or when it gives up (the chief can demand that it surrender). Then he chooses: take it, plunder it, or make
# it pay every day. The soldiers sail home with him; the fallen do not come back.
signal said(text: String)
signal changed
signal won(city_id: String)

class Unit:
	var id := 0
	var side := 0              # 0: ours, 1: theirs
	var kind := ""             # knight, warrior, archer, chief, or a beast's kind
	var beast := false
	var key := ""
	var horse_key := ""        # a knight's horse
	var hp := 100.0
	var max_hp := 100.0
	var dmg := 12.0
	var speed := 3.6
	var reach := 1.9
	var range := 0.0           # archers
	var armor := 1.0           # damage taken is multiplied by this
	var radius := 0.4
	var pos := Vector3.ZERO
	var yaw := 0.0
	var target: Unit = null
	var hit_player := false
	var state := "idle"        # idle, move, fight, dead, aboard
	var t := 0.0
	var cool := 0.0
	var move := "idle"
	var slot := Vector2.ZERO
	var hold := Vector3.ZERO
	var on_wall := false
	var person := -1           # who this was in the city
	var dead_t := 0.0
	var phase := 0.0
	var swing := 0
	var moving := 0.0
	var flee := false

var game: Node
var hd := HeightData.new()
var crowd: Crowd
var cities := {}
var fleet: Array = []           # Boat
var player: Player
var state := "peace"            # peace, sail, battle, won, home
var target := ""
var goal := "conquer"
var force := {}                 # what went: role -> count
var beasts_sent := {}           # kind -> count, and from which city: [[city, kind]]
var beast_from: Array = []
var horses_sent := 0
var units: Array = []
var arrows: Array = []
var balls: Array = []
var orders := {"knight": "follow", "warrior": "follow", "archer": "follow", "beast": "follow"}
var morale := [100.0, 100.0]
var chief: Unit = null
var gate_hp := 0.0
var gate_max := 600.0
var gate_open := false
var landed := false
var t := 0.0
var _id := 0
var grid := {}
var arrow_mesh: Mesh
var ball_mesh: Mesh
var cannon_t := 0.0
var alerted := false
var lost := {}                  # ours who fell: role -> count
var killed := 0
var choice_made := false
var loot := {"gold": 0.0, "horses": 0, "beasts": {}}
var tribute := {}               # city -> gold a day
var sallied := false
var on_player := 0              # how many enemies go for the chief now
var sound: Sound

func _ready():
	var am := CylinderMesh.new(); am.top_radius = 0.02; am.bottom_radius = 0.02; am.height = 0.9; am.radial_segments = 4; am.rings = 1
	var m := StandardMaterial3D.new(); m.albedo_color = Color(0.4, 0.3, 0.2); am.material = m
	arrow_mesh = am
	var sm := SphereMesh.new(); sm.radius = 0.35; sm.height = 0.7; sm.radial_segments = 8; sm.rings = 4
	var bm := StandardMaterial3D.new(); bm.albedo_color = Color(0.12, 0.12, 0.13); bm.metallic = 0.6; sm.material = bm
	ball_mesh = sm

func home() -> City: return cities.get("home", null)
func target_city() -> City: return cities.get(target, null)
func busy() -> bool: return state != "peace"

# ---------------------------------------------------------------- the council's numbers
func targets() -> Array:
	var out := []
	for id in ["pirate", "lost", "north"]:
		if cities.has(id): out.append(id)
	return out

func estimate(cid: String) -> Dictionary:
	var c: City = cities[cid]
	return {"soldiers": c.soldiers(), "beasts": c.beasts_here(), "horses": c.horses_here(), "gold": c.gold, "walls": c.data.get("style", "") != "tribal",
		"owner": c.owner_f, "dist": c.center().distance_to(home().center()) if home() else 0.0, "pop": c.population()}

func fleet_room() -> Dictionary:
	var men := 0; var hs := 0; var n := 0
	for b in fleet:
		if b.is_sunk(): continue
		men += b.capacity(); hs += b.horse_room(); n += 1
	return {"men": men, "horses": hs, "ships": n}

# our beasts of war, kept in the cities we hold
func our_beasts() -> Dictionary:
	var c := {}
	for id in cities:
		var city: City = cities[id]
		if not city.is_mine(): continue
		var b := city.beasts_here()
		for k in b: c[k] = c.get(k, 0) + int(b[k])
	return c

# ---------------------------------------------------------------- off to war
func begin(cid: String, want: Dictionary, beasts: Dictionary, g: String) -> bool:
	if state != "peace" or not cities.has(cid): return false
	var h := home()
	target = cid; goal = g
	force = h.send_out(want)
	horses_sent = h.send_horses(int(force.get("knight", 0)))
	# beasts from wherever we keep them
	beasts_sent = {}; beast_from = []
	for kind in beasts:
		var need := int(beasts[kind])
		for id in cities:
			var city: City = cities[id]
			if need <= 0 or not city.is_mine(): continue
			for b in city.beast_pen:
				if need <= 0: break
				if b.kind == kind and not b.away:
					b.away = true; need -= 1
					beasts_sent[kind] = beasts_sent.get(kind, 0) + 1
					beast_from.append([id, kind])
	_load_fleet()
	state = "sail"; landed = false; alerted = false; choice_made = false; sallied = false
	lost = {}; killed = 0; loot = {"gold": 0.0, "horses": 0, "beasts": {}}
	morale = [100.0, 100.0]
	var tc := target_city()
	gate_max = 2400.0 if tc.data.get("style", "") == "kk" else (1800.0 if tc.data.get("style", "") == "pirate" else 900.0)
	gate_hp = gate_max; gate_open = false
	if sound: sound.play("confirm")
	said.emit("הצבא עולה על הספינות: %s. עלה על ספינת המלחמה והפלג אל %s — הצי ילך אחריך" % [_force_text(force, beasts_sent), tc.name_he()])
	changed.emit()
	return true

func _force_text(f: Dictionary, b: Dictionary) -> String:
	var parts := []
	for r in ["knight", "warrior", "archer"]:
		if int(f.get(r, 0)) > 0: parts.append("%d %s" % [int(f[r]), Kingdoms.ROLES[r].pl])
	for k in b:
		if int(b[k]) > 0: parts.append("%d %s" % [int(b[k]), Kingdoms.BEASTS[k].pl])
	return ", ".join(parts) if parts.size() > 0 else "אין חיילים"

# who sails in which ship (and so, who drowns if it sinks)
func _load_fleet():
	var left := 0
	for r in force: left += int(force[r])
	for k in beasts_sent: left += int(beasts_sent[k])
	var hl := horses_sent
	var key := Kingdoms.register_look(crowd, "blue", "warrior", 1)
	for b in fleet:
		b.men = 0; b.horses_aboard = 0; b.crew_key = key
		if b.is_sunk(): continue
		var m: int = mini(left, b.capacity()); b.men = m; left -= m
		var hh: int = mini(hl, b.horse_room()); b.horses_aboard = hh; hl -= hh

func men_aboard() -> int:
	var n := 0
	for b in fleet: n += b.men
	return n

# ---------------------------------------------------------------- every frame
func _process(dt: float):
	if dt > 0.1: dt = 0.1
	t += dt
	_fleet_lead()
	_cannons(dt)
	_deck_figures()
	if state == "sail" or state == "home": _sailing(dt)
	if state == "battle" or state == "won": _battle(dt)
	_arrows(dt)
	_balls(dt)
	_draw_units()
	if sound: sound.battle(state == "battle")

# the ship the chief is on leads; the others take their places behind it
func _fleet_lead():
	var lead: Boat = player.boat if player and player.boat and player.boat in fleet else null
	var i := 0
	for b in fleet:
		if b == lead or b.is_sunk(): b.leader = null; continue
		if lead == null or b.anchored or (state == "peace"): b.leader = null; continue
		b.leader = lead
		var row := i / 2 + 1; var side := -1.0 if i % 2 == 0 else 1.0
		b.slot = Vector2(side * 16.0 * row * 0.8, 26.0 * row)
		i += 1

func _sailing(_dt: float):
	if state == "sail":
		var tc := target_city()
		if tc == null: return
		var lead: Boat = player.boat
		if lead and lead in fleet:
			var d := Vector2(lead.position.x - tc.center().x, lead.position.z - tc.center().z).length()
			if d < 420.0 and not alerted:
				alerted = true
				tc.set_shut(true)
				said.emit("%s ראו את הצי! השערים נסגרים, הלוחמים עולים על החומות" % tc.name_he())
	elif state == "home":
		var h := home()
		var lead: Boat = player.boat
		if lead and lead in fleet and h:
			var hp2 := Vector2(float(h.data.landing[0]), float(h.data.landing[1]))
			if Vector2(lead.position.x, lead.position.z).distance_to(hp2) < 170.0: _arrive_home()

# can the army land here (the chief's ship close to the target's shore)
func can_land() -> bool:
	if state != "sail" or player == null or player.boat == null or not (player.boat in fleet): return false
	var tc := target_city()
	var lp := Vector2(float(tc.data.landing[0]), float(tc.data.landing[1]))
	return Vector2(player.boat.position.x, player.boat.position.z).distance_to(lp) < 190.0

# ---------------------------------------------------------------- ashore
func land():
	if not can_land(): return
	var tc := target_city()
	for b in fleet:
		if b.is_sunk(): continue
		b.anchored = true; b.leader = null; b.speed = 0.0; b.men = 0; b.horses_aboard = 0
	var lp := Vector3(float(tc.data.landing[0]), tc.gy, float(tc.data.landing[1]))
	# everyone comes ashore near the landing place, in ranks facing the city
	var to_city := (tc.center() - lp); to_city.y = 0.0; to_city = to_city.normalized()
	var face := atan2(to_city.x, to_city.z)
	var right := Vector3(to_city.z, 0, -to_city.x)
	var n := 0
	var blue_knight := Kingdoms.look_key("blue", "knight", 0)
	var horses_left := horses_sent
	for role in ["knight", "warrior", "archer"]:
		for i in int(force.get(role, 0)):
			var key := Kingdoms.register_look(crowd, "blue", role, i)
			var u := _unit(0, role, key)
			if role == "knight" and horses_left > 0:
				horses_left -= 1
				u.horse_key = "horse_blue_%d" % (i % Kingdoms.HORSE_COLORS.size())
				if not crowd.looks.has(u.horse_key): crowd.register(u.horse_key, Kingdoms.horse_def(i % Kingdoms.HORSE_COLORS.size(), Kingdoms.FACTIONS.blue.color))
				u.speed = 6.5; u.hp *= 1.25; u.max_hp = u.hp; u.radius = 0.9
			var col := n % 24; var row := n / 24
			u.pos = _dry(lp + right * (col - 11.5) * 1.5 + to_city * (row * 1.8 - 2.0))
			u.yaw = face
			n += 1
	for kind in beasts_sent:
		for i in int(beasts_sent[kind]):
			var u := _beast_unit(0, kind)
			u.pos = _dry(lp - right * (15.0 + i * 2.5) + to_city * 3.0)
			u.yaw = face
	_assign_slots()
	for k in orders: orders[k] = "follow"
	# the chief comes ashore too
	# the chief stands in front of his army, but not right at the enemy's gate
	var front := lp + to_city * 3.0
	var gp := _gate_point(true)
	if Vector2(front.x - gp.x, front.z - gp.z).length() < 10.0: front = gp - to_city * 10.0
	if player.boat: game.leave_boat_to(_dry(front))
	player.face = face
	_defenders(tc)
	landed = true
	state = "battle"
	if sound: sound.play("land"); sound.play("confirm", Vector3.INF, -4.0)
	said.emit("נחתנו! %d לוחמים על החוף. הפקודות למטה: אחריי, להסתער, לעמוד, חומת מגנים, לפרוץ את השער" % n)
	changed.emit()

func _dry(p: Vector3) -> Vector3:
	if hd.water_depth(p.x, p.z) < 0.3: return Vector3(p.x, hd.ground(p.x, p.z), p.z)
	var q := hd.land_near(p.x, p.z, 30.0)
	return q if q != Vector3.INF else Vector3(p.x, hd.ground(p.x, p.z), p.z)

func _unit(side: int, role: String, key: String) -> Unit:
	var r: Dictionary = Kingdoms.ROLES.get(role, Kingdoms.ROLES.warrior)
	var u := Unit.new()
	_id += 1; u.id = _id; u.side = side; u.kind = role; u.key = key
	u.hp = float(r.get("hp", 100.0)); u.max_hp = u.hp
	u.dmg = float(r.get("dmg", 12.0)); u.speed = float(r.get("speed", 3.6))
	u.range = float(r.get("range", 0.0))
	u.armor = 0.6 if role == "knight" else 1.0
	u.phase = randf()
	units.append(u)
	return u

func _beast_unit(side: int, kind: String) -> Unit:
	var b: Dictionary = Kingdoms.BEASTS[kind]
	var u := Unit.new()
	_id += 1; u.id = _id; u.side = side; u.kind = kind; u.beast = true
	u.key = "beast_" + kind
	if not crowd.looks.has(u.key): crowd.register(u.key, Kingdoms.beast_def(kind))
	u.hp = float(b.hp); u.max_hp = u.hp; u.dmg = float(b.dmg); u.speed = float(b.speed); u.reach = float(b.reach)
	u.radius = float(b.size) * 0.35
	u.armor = 0.7 if kind in ["triceratops", "trex"] else 1.0
	u.phase = randf()
	units.append(u)
	return u

# the enemy: its soldiers at their posts, archers on the walls, beasts let out, its chief by the castle
func _defenders(tc: City):
	var people := tc.take_defenders()
	var gates: Array = tc.data.get("gates", [])
	var sea_gate: Dictionary = gates[0] if gates.size() > 0 else {}
	for g in gates: if g.id == "sea": sea_gate = g
	var gin := Vector3(float(sea_gate["in"][0]), tc.gy, float(sea_gate["in"][1])) if not sea_gate.is_empty() else tc.center()
	var towers: Array = tc.data.get("towers", [])
	var wall_spots := []
	# along the sea wall near the gate: the archers' places, up on the wall
	if not sea_gate.is_empty():
		var gp := Vector3(float(sea_gate.x), tc.gy, float(sea_gate.z))
		var f := Vector3(sin(float(sea_gate.yaw)), 0, cos(float(sea_gate.yaw))); var r := Vector3(f.z, 0, -f.x)
		var wall_h := 6.0 if tc.data.style == "kk" else (10.5 if tc.data.style == "pirate" else 0.0)
		for i in 12:
			var s := (6.5 + (i / 2) * 3.2) * (1.0 if i % 2 == 0 else -1.0)
			wall_spots.append(gp + r * s - f * 0.6 + Vector3(0, wall_h, 0))
	var wi := 0
	for p in people:
		var u := _unit(1, p.role, p.key)
		u.person = p.id
		if p.role == "knight" and tc.horses_here() > 0:
			var hz: Dictionary = tc.horses[u.id % tc.horses.size()]
			u.horse_key = hz.key; u.speed = 6.5; u.hp *= 1.25; u.max_hp = u.hp; u.radius = 0.9
		if p.role == "archer" and wi < wall_spots.size() and tc.data.style != "tribal":
			u.pos = wall_spots[wi]; u.on_wall = true; wi += 1
		else:
			u.pos = gin + Vector3(randf_range(-9, 9), 0, randf_range(-9, 9))
			u.pos = Vector3(u.pos.x, hd.ground(u.pos.x, u.pos.z), u.pos.z)
		u.hold = u.pos
		u.yaw = float(sea_gate.get("yaw", 0.0))
	for b in tc.take_beasts():
		var u := _beast_unit(1, b.kind)
		u.pos = _dry(Vector3(b.pos.x, 0, b.pos.z))
		u.hold = u.pos
		# beasts outside the walls go for the landing at once; the others wait in their pens
		u.state = "move"
	# the chief, by his castle door
	var cs: Dictionary = tc.data.get("castle", {})
	var cl := _chief_look(tc.owner_f)
	var ck := "chief_" + tc.owner_f
	if not crowd.looks.has(ck): crowd.register(ck, {"type": "person", "look": cl})
	chief = _unit(1, "chief", ck)
	chief.hp = 520.0 if tc.owner_f != "green" else 420.0; chief.max_hp = chief.hp; chief.dmg = 26.0; chief.armor = 0.6; chief.speed = 3.8
	var door: Array = cs.get("door", [tc.center().x, tc.center().z])
	chief.pos = Vector3(float(door[0]), tc.gy, float(door[1])); chief.hold = chief.pos

static func _chief_look(f: String) -> Dictionary:
	match f:
		"red": return Skins.look("knight", {"helmet": true, "cape": true, "weapon": "sword2", "cloth": Color(0.75, 0.12, 0.1), "metal": "gold", "skin": 0})
		"green": return Skins.look("barbarian", {"helmet": true, "cape": true, "weapon": "axe2", "cloth": Color(0.2, 0.55, 0.22), "metal": "bronze", "skin": 4})
		"black": return Skins.look("rogue", {"cape": true, "weapon": "sword", "shield": "shield_spike", "cloth": Color(0.12, 0.12, 0.14), "metal": "gold", "skin": 2})
	return Skins.look("knight", {"helmet": true, "cape": true, "weapon": "sword", "shield": "shield_badge", "cloth": Color(0.2, 0.42, 0.88), "metal": "gold", "skin": 1})

# ranks behind the chief: infantry in the middle, archers behind them, knights on the flanks, beasts in front
func _assign_slots():
	var ni := 0; var na := 0; var nk := 0; var nb := 0
	for u: Unit in units:
		if u.side != 0 or u.state == "dead" or u.state == "aboard": continue
		match u.kind:
			"warrior": u.slot = Vector2(((ni % 8) - 3.5) * 1.7, 4.0 + (ni / 8) * 1.9); ni += 1
			"archer": u.slot = Vector2(((na % 8) - 3.5) * 1.8, 4.0 + 2.0 + (ni / 8 + 1) * 1.9 + (na / 8) * 1.9); na += 1
			"knight": u.slot = Vector2((10.0 + (nk / 2 % 3) * 3.0) * (-1.0 if nk % 2 == 0 else 1.0), 2.0 + (nk / 6) * 3.4); nk += 1
			_: u.slot = Vector2(((nb % 5) - 2.0) * 2.6, -5.0 - (nb / 5) * 2.6); nb += 1

func group_of(u: Unit) -> String:
	if u.beast: return "beast"
	return u.kind

func set_order(grp: String, o: String):
	var kinds := ["knight", "warrior", "archer", "beast"] if grp == "all" else [grp]
	for k in kinds: orders[k] = o
	for u: Unit in units:
		if u.side == 0 and group_of(u) in kinds:
			u.hold = u.pos; u.target = null
	var words := {"follow": "אחריי!", "charge": "להסתער!", "hold": "לעמוד במקום!", "wall": "חומת מגנים!", "ram": "לפרוץ את השער!", "retreat": "לספינות!"}
	var who := {"all": "כולם", "knight": "אבירים", "warrior": "לוחמים", "archer": "קשתים", "beast": "חיות המלחמה"}
	said.emit("%s: %s" % [who.get(grp, ""), words.get(o, "")])

# ---------------------------------------------------------------- the battle
func _battle(dt: float):
	_build_grid()
	on_player = 0
	for u: Unit in units:
		if u.side == 1 and u.hit_player and u.state != "dead" and u.state != "aboard": on_player += 1
	var tc := target_city()
	var alive := [0, 0]; var power := [0.0, 0.0]
	for u: Unit in units:
		if u.state == "dead":
			u.dead_t += dt
			continue
		if u.state == "aboard": continue
		alive[u.side] += 1; power[u.side] += u.hp * (1.6 if u.horse_key != "" else 1.0)
		u.cool -= dt
		if u.side == 0: _think_ours(u, dt)
		else: _think_theirs(u, dt, tc)
	# morale: falls with losses and with the other side's strength
	for s in 2:
		var ratio: float = float(power[s]) / maxf(1.0, float(power[1 - s]))
		var want := clampf(40.0 + ratio * 40.0, 0.0, 100.0)
		morale[s] = move_toward(morale[s], want, dt * 3.0)
	units = units.filter(func(u): return not (u.state == "dead" and u.dead_t > 40.0))
	if state == "battle":
		# the enemy sallies out when it feels strong
		if not sallied and power[1] > power[0] * 1.35 and landed:
			sallied = true
			_open_gate(false)
			said.emit("%s יוצאים מהשערים להילחם!" % tc.name_he())
		var their_soldiers := 0
		for u: Unit in units:
			if u.side == 1 and u.state != "dead" and u != chief: their_soldiers += 1
		if chief and chief.state == "dead": _victory("המנהיג שלהם נפל")
		elif their_soldiers == 0 and landed: _victory("כל המגינים נפלו")
		elif morale[1] < 12.0: _victory("המגינים נשברו ונכנעו")
		elif alive[0] == 0 and men_aboard() == 0 and landed: _defeat()

func _build_grid():
	grid.clear()
	for u: Unit in units:
		if u.state == "dead" or u.state == "aboard": continue
		var k := Vector2i(int(floor(u.pos.x / 10.0)), int(floor(u.pos.z / 10.0)))
		if not grid.has(k): grid[k] = []
		grid[k].append(u)

# the nearest enemy, looking close first and farther only when no one is close
func _find(u: Unit, r: float) -> Unit:
	var o := _nearest_enemy(u, minf(r, 18.0))
	if o or r <= 18.0: return o
	o = _nearest_enemy(u, minf(r, 50.0))
	if o or r <= 50.0: return o
	# far: through the list (cheaper than the grid at this range)
	var best: Unit = null; var bd := r * r
	for v: Unit in units:
		if v.side == u.side or v.state == "dead" or v.state == "aboard": continue
		if v.on_wall and u.range <= 0.0: continue
		var d := u.pos.distance_squared_to(v.pos)
		if d < bd: bd = d; best = v
	return best

# the nearest enemy within r meters
func _nearest_enemy(u: Unit, r: float) -> Unit:
	var best: Unit = null; var bd := r * r
	var c := Vector2i(int(floor(u.pos.x / 10.0)), int(floor(u.pos.z / 10.0)))
	var rc := int(ceil(r / 10.0))
	for gx in range(c.x - rc, c.x + rc + 1):
		for gz in range(c.y - rc, c.y + rc + 1):
			var k := Vector2i(gx, gz)
			if not grid.has(k): continue
			for o: Unit in grid[k]:
				if o.side == u.side or o.state == "dead" or o.state == "aboard": continue
				if o.on_wall and u.range <= 0.0: continue
				var d := u.pos.distance_squared_to(o.pos)
				if d < bd: bd = d; best = o
	return best

func _think_ours(u: Unit, dt: float):
	var o: String = orders.get(group_of(u), "follow")
	var pp := player.global_position
	var pf := Vector3(sin(player.face), 0, cos(player.face)); var pr := Vector3(pf.z, 0, -pf.x)
	var goal_pos := u.pos
	var engage := 7.0
	match o:
		"follow", "wall":
			var tight := 0.65 if o == "wall" else 1.0
			goal_pos = pp - pf * u.slot.y * tight + pr * u.slot.x * tight
			engage = 6.0 if o == "follow" else 3.0
		"hold": goal_pos = u.hold; engage = 4.0
		"charge": engage = 140.0
		"ram":
			if u.kind in ["warrior", "knight"] and not gate_open: goal_pos = _gate_point(true); engage = 3.0
			else: engage = 40.0
		"retreat":
			goal_pos = _nearest_ship_landing(u.pos); engage = 0.0
	if u.range > 0.0: engage = maxf(engage, u.range)
	# a target (looked for twice a second, near first)
	if u.target and (u.target.state == "dead" or u.target.state == "aboard" or u.pos.distance_to(u.target.pos) > engage + 6.0): u.target = null
	if u.target == null and engage > 0.0 and u.t <= 0.0:
		u.t = randf_range(0.35, 0.6)
		u.target = _find(u, engage)
	u.t -= dt
	var at_gate := false
	if u.target and o == "charge" and _behind_walls(u, u.target) and u.range <= 0.0:
		goal_pos = _gate_point(true); u.target = null
		at_gate = u.pos.distance_to(goal_pos) < 3.5 and not u.beast
	if o == "retreat":
		if u.pos.distance_to(goal_pos) < 7.0:
			u.state = "aboard"
			for b in fleet:
				if b.anchored and not b.is_sunk(): b.men += 1; break
			return
		_move_to(u, goal_pos, dt, true)
		return
	if u.target: _fight(u, u.target, dt)
	elif (at_gate or (o == "ram" and u.kind in ["warrior", "knight"])) and not gate_open and u.pos.distance_to(goal_pos) < 3.5: _hit_gate(u, dt)
	else: _move_to(u, goal_pos, dt, o == "charge" or u.pos.distance_to(goal_pos) > 8.0)
	if o == "wall": u.armor = minf(u.armor, 0.55)

func _think_theirs(u: Unit, dt: float, tc: City):
	# the gate is broken: the archers come down from the walls to fight
	if u.on_wall and gate_open:
		u.on_wall = false
		var gi := _gate_point(false)
		u.pos = Vector3(gi.x + randf_range(-6, 6), 0, gi.z + randf_range(-6, 6)); u.pos.y = hd.ground(u.pos.x, u.pos.z)
		u.hold = u.pos
	var sight := 26.0 if not u.beast else 60.0
	if u.range > 0.0: sight = u.range + (8.0 if u.on_wall else 0.0)
	if sallied or gate_open: sight = maxf(sight, 70.0)
	if morale[1] < 25.0 and not u.beast:
		# broken: they run back to the castle
		u.flee = true
		var cs: Dictionary = tc.data.get("castle", {})
		var door: Array = cs.get("door", [tc.center().x, tc.center().z])
		_move_to(u, Vector3(float(door[0]), tc.gy, float(door[1])), dt, true)
		return
	if u.target and (u.target.state == "dead" or u.target.state == "aboard" or u.pos.distance_to(u.target.pos) > sight + 6.0): u.target = null
	if u.target == null and u.t <= 0.0:
		u.t = randf_range(0.35, 0.6)
		u.target = _find(u, sight)
	u.t -= dt
	# the player is a target too (but no more than a few go for him at once)
	var pd := u.pos.distance_to(player.global_position)
	var chase_player := not player.is_dead() and pd < minf(sight, 18.0) and (u.target == null or pd < u.pos.distance_to(u.target.pos))
	if chase_player and not u.hit_player and on_player >= 3: chase_player = false
	if chase_player != u.hit_player:
		on_player += 1 if chase_player else -1
		u.hit_player = chase_player
	if u == chief and not gate_open and u.target and u.target.pos.distance_to(u.hold) > 12.0: u.target = null; chase_player = false
	if chase_player and not u.on_wall:
		_fight_player(u, dt)
		return
	if u.target and not (u.on_wall and u.range <= 0.0):
		if u.on_wall:
			_shoot_from_wall(u, u.target)
		elif _behind_walls(u, u.target) and not gate_open and u.range <= 0.0:
			_move_to(u, u.hold, dt, false)
		else: _fight(u, u.target, dt)
	elif u.on_wall and chase_player:
		_shoot_from_wall(u, null)
	else:
		_move_to(u, u.hold, dt, false)

# is a wall between them (one inside a walled city, the other outside, and the gate shut)
func _behind_walls(a: Unit, b: Unit) -> bool:
	var tc := target_city()
	if tc == null or gate_open: return false
	return tc.inside(a.pos, -2.0) != tc.inside(b.pos, -2.0)

func _gate_point(outside: bool) -> Vector3:
	var tc := target_city()
	for g in tc.data.get("gates", []):
		if g.id == "sea":
			var q: Array = g["out"] if outside else g["in"]
			return Vector3(float(q[0]), tc.gy, float(q[1]))
	return tc.center()

func _hit_gate(u: Unit, dt: float):
	u.move = "attack" if u.horse_key == "" else "ride"
	var g := _gate_point(true)
	u.yaw = atan2(g.x - u.pos.x, g.z - u.pos.z) + PI
	if u.cool <= 0.0:
		u.cool = 1.2; u.swing += 1
		gate_hp -= u.dmg * 0.5
		u.move = ["attack", "attack_b", "attack2h"][u.swing % 3] if u.horse_key == "" else "ride"
		if gate_hp <= 0.0: _open_gate(true)

func _open_gate(broken: bool):
	if gate_open: return
	gate_open = true
	var tc := target_city()
	tc.set_shut(false)
	if broken:
		said.emit("השער נפרץ! קדימה, אל העיר!")
		if sound: sound.play("big_kill"); sound.play("impact")

func _nearest_ship_landing(p: Vector3) -> Vector3:
	var best := p; var bd := 1e9
	for b in fleet:
		if b.is_sunk() or not b.anchored: continue
		var q := hd.land_near(b.position.x, b.position.z, 40.0)
		if q == Vector3.INF: continue
		var d := q.distance_to(p)
		if d < bd: bd = d; best = q
	return best

func _move_to(u: Unit, goal_pos: Vector3, dt: float, fast: bool):
	var d := goal_pos - u.pos; d.y = 0.0
	var dist := d.length()
	if dist < 0.6:
		u.moving = 0.0
		u.move = "ride" if u.horse_key != "" else ("block" if orders.get(group_of(u), "") == "wall" and u.side == 0 else "idle")
		return
	var sp := u.speed * (1.0 if fast else 0.6)
	if u.side == 0 and orders.get(group_of(u), "") == "wall": sp *= 0.55
	if dist < 4.0: sp *= dist / 4.0 + 0.2
	var dir := d / dist
	u.yaw = lerp_angle(u.yaw, atan2(dir.x, dir.z), minf(1.0, dt * 6.0))
	_step(u, dir * minf(sp * dt, dist))
	u.moving = sp
	if u.horse_key != "": u.move = "ride"
	else: u.move = "run" if sp > 3.0 else "walk"

func _step(u: Unit, delta: Vector3):
	if u.on_wall: return
	var np := u.pos + delta
	np = hd.push_out(np, u.radius)
	# keep apart from the others
	var c := Vector2i(int(floor(np.x / 10.0)), int(floor(np.z / 10.0)))
	if grid.has(c):
		for o: Unit in grid[c]:
			if o == u or o.state == "dead": continue
			var dd := Vector3(np.x - o.pos.x, 0, np.z - o.pos.z)
			var min_d := u.radius + o.radius + 0.25
			var l := dd.length()
			if l < min_d and l > 0.001: np += dd / l * (min_d - l) * 0.5
	if hd.water_depth(np.x, np.z) > 1.0: return
	np.y = hd.ground(np.x, np.z)
	u.pos = np

func _fight(u: Unit, o: Unit, dt: float):
	var d := o.pos - u.pos; d.y = 0.0
	var dist := d.length()
	var reach := u.reach + o.radius + u.radius * 0.5
	if u.range > 0.0 and dist <= u.range:
		u.yaw = lerp_angle(u.yaw, atan2(d.x, d.z), minf(1.0, dt * 8.0))
		u.move = "aim"
		if u.cool <= 0.0:
			u.cool = randf_range(2.0, 2.8)
			u.move = "shoot"
			_shoot(u, o)
		return
	if dist > reach:
		_move_to(u, o.pos, dt, true)
		return
	u.yaw = lerp_angle(u.yaw, atan2(d.x, d.z), minf(1.0, dt * 10.0))
	if u.cool <= 0.0:
		u.cool = randf_range(1.0, 1.5)
		u.swing += 1
		var dmg := u.dmg * randf_range(0.8, 1.2)
		if u.horse_key != "" and u.moving > 4.5: dmg *= 1.8
		if u.kind in ["triceratops", "trex"]:
			# a sweep: everyone close in front is hit and thrown back
			var fw := d.normalized()
			for v: Unit in units:
				if v.side == u.side or v.state == "dead" or v.state == "aboard" or v == o: continue
				var dv := v.pos - u.pos; dv.y = 0.0
				if dv.length() < reach + 1.5 and dv.normalized().dot(fw) > 0.2:
					_damage(v, dmg * 0.7, u); v.pos += dv.normalized() * 2.0
			o.pos += fw * 2.4
		_damage(o, dmg, u)
		u.move = _attack_move(u)
		if sound: sound.play("hit", u.pos, -6.0, 0.11)
	elif u.cool > 0.6:
		pass
	else:
		u.move = "ride" if u.horse_key != "" else ("block" if u.kind == "knight" and u.side == 0 else "idle")

func _attack_move(u: Unit) -> String:
	if u.beast: return "attack"
	if u.horse_key != "": return "ride"
	var lk: Dictionary = crowd.looks.get(u.key, {}).get("look", {})
	var w: String = lk.get("weapon", "")
	if w in ["sword2", "axe2"]: return ["attack2h", "attack2h_b"][u.swing % 2]
	if w == "staff": return "cast_shoot"
	return ["attack", "attack_b", "attack_c", "stab"][u.swing % 4]

func _fight_player(u: Unit, dt: float):
	var pp := player.global_position
	var d := pp - u.pos; d.y = 0.0
	var dist := d.length()
	if u.range > 0.0 and dist <= u.range:
		u.yaw = atan2(d.x, d.z); u.move = "aim"
		if u.cool <= 0.0: u.cool = randf_range(2.2, 3.0); u.move = "shoot"; _shoot(u, null)
		return
	if dist > u.reach + 0.6: _move_to(u, pp, dt, true); return
	u.yaw = lerp_angle(u.yaw, atan2(d.x, d.z), minf(1.0, dt * 10.0))
	if u.cool <= 0.0:
		u.cool = randf_range(1.2, 1.7); u.swing += 1
		player.hurt(u.dmg * randf_range(0.25, 0.4), "נפלת בקרב מול " + _who(u), u.pos)
		u.move = _attack_move(u)

func _who(u: Unit) -> String:
	if u.beast: return Kingdoms.BEASTS[u.kind].name
	if u == chief: return Kingdoms.FACTIONS.get(target_city().owner_f, {}).get("chief", "המנהיג")
	return Kingdoms.ROLES.get(u.kind, {}).get("name", "לוחם")

func _shoot_from_wall(u: Unit, o: Unit):
	if u.cool > 0.0: u.move = "aim"; return
	var tp := player.global_position if o == null else o.pos
	if u.pos.distance_to(tp) > u.range + 8.0: return
	u.yaw = atan2(tp.x - u.pos.x, tp.z - u.pos.z)
	u.cool = randf_range(2.6, 3.6)
	u.move = "shoot"
	_shoot(u, o)

func _damage(o: Unit, dmg: float, by: Unit):
	if o.state == "dead": return
	o.hp -= dmg * o.armor
	if o.hp <= 0.0:
		o.hp = 0.0; o.state = "dead"; o.dead_t = 0.0
		o.move = "die"
		if sound: sound.play("kill" if not o.beast else "downed", o.pos, -4.0, 0.15)
		if o.side == 0:
			var k := group_of(o) if not o.beast else o.kind
			lost[k] = lost.get(k, 0) + 1
			morale[0] -= 1.5
		else:
			killed += 1
			morale[1] = maxf(0.0, morale[1] - (1.2 if o != chief else 60.0))
			if o == chief:
				said.emit("%s נפל!" % _who(o))
				if sound: sound.play("boss")

# ---------------------------------------------------------------- arrows and cannonballs
func _shoot(u: Unit, o: Unit):
	var from := u.pos + Vector3(0, 1.5, 0)
	var to := (o.pos if o else player.global_position) + Vector3(0, 1.0, 0)
	var flight := clampf(from.distance_to(to) / 26.0, 0.25, 1.4)
	var mi := MeshInstance3D.new(); mi.mesh = arrow_mesh; add_child(mi)
	mi.global_position = from
	if sound: sound.play("shoot", from, -8.0, 0.12)
	arrows.append({"node": mi, "from": from, "to": to, "t": 0.0, "T": flight, "target": o, "player": o == null, "dmg": u.dmg * randf_range(0.8, 1.15), "side": u.side})

func _arrows(dt: float):
	for i in range(arrows.size() - 1, -1, -1):
		var a: Dictionary = arrows[i]
		a.t += dt
		var k: float = a.t / a.T
		var mi: MeshInstance3D = a.node
		if k >= 1.0:
			if a.player:
				if player.global_position.distance_to(a.to) < 2.2 and not player.is_dead(): player.hurt(a.dmg * 0.55, "חץ פגע בך בקרב")
			elif a.target and a.target.state != "dead" and a.target.pos.distance_to(a.to - Vector3(0, 1, 0)) < 2.5:
				var armor: float = 0.5 if (a.target.side == 0 and orders.get(group_of(a.target), "") == "wall") else 1.0
				_damage(a.target, a.dmg * armor, null)
			mi.queue_free(); arrows.remove_at(i); continue
		var p: Vector3 = (a.from as Vector3).lerp(a.to, k) + Vector3(0, sin(k * PI) * 2.5, 0)
		var nxt: Vector3 = (a.from as Vector3).lerp(a.to, minf(1.0, k + 0.05)) + Vector3(0, sin(minf(1.0, k + 0.05) * PI) * 2.5, 0)
		mi.global_position = p
		if nxt.distance_to(p) > 0.001: mi.look_at(nxt, Vector3.UP); mi.rotate_object_local(Vector3.RIGHT, PI * 0.5)

# the pirates' cannons fire at the fleet when it comes close
func _cannons(dt: float):
	var pc: City = cities.get("pirate", null)
	if pc == null or pc.is_mine() or tribute.has("pirate"): return
	var guns: Array = pc.data.get("cannons", [])
	if guns.is_empty(): return
	cannon_t -= dt
	if cannon_t > 0.0: return
	cannon_t = 3.5
	var best: Boat = null; var bd := 170.0
	for b in fleet:
		if b.is_sunk(): continue
		var d := Vector2(b.position.x - pc.center().x, b.position.z - pc.center().z).length()
		if d < bd: bd = d; best = b
	if best == null: return
	var g: Array = guns[randi() % guns.size()]
	var from := Vector3(float(g[0]), pc.gy + 11.5, float(g[1]))
	var to := best.position + Vector3(randf_range(-6, 6), 1.0, randf_range(-6, 6))
	var mi := MeshInstance3D.new(); mi.mesh = ball_mesh; add_child(mi); mi.global_position = from
	balls.append({"node": mi, "from": from, "to": to, "t": 0.0, "T": clampf(from.distance_to(to) / 55.0, 0.8, 3.0), "ship": best})
	if bd < 120.0 and randf() < 0.3: said.emit("תותחי השודדים יורים על הצי!")

func _balls(dt: float):
	for i in range(balls.size() - 1, -1, -1):
		var a: Dictionary = balls[i]
		a.t += dt
		var k: float = a.t / a.T
		var mi: MeshInstance3D = a.node
		if k >= 1.0:
			var sh: Boat = a.ship
			if is_instance_valid(sh) and not sh.is_sunk() and sh.dist_to(a.to) < 3.0:
				sh.damage(9.0)
				if sh.is_sunk(): _ship_lost(sh)
			mi.queue_free(); balls.remove_at(i); continue
		mi.global_position = (a.from as Vector3).lerp(a.to, k) + Vector3(0, sin(k * PI) * 18.0, 0)

func _ship_lost(sh: Boat):
	if sh.men > 0:
		said.emit("%s טבעה עם %d לוחמים!" % [sh.label(), sh.men])
		lost["warrior"] = lost.get("warrior", 0) + sh.men
		# the drowned are taken from what went, the infantry first
		var m := sh.men
		for r in ["warrior", "archer", "knight"]:
			var take: int = mini(m, int(force.get(r, 0)))
			force[r] = int(force.get(r, 0)) - take; m -= take
		sh.men = 0
	horses_sent = maxi(0, horses_sent - sh.horses_aboard); sh.horses_aboard = 0

# ---------------------------------------------------------------- drawing
func _draw_units():
	for u: Unit in units:
		if u.state == "aboard": continue
		var mv := u.move
		if u.state == "dead": mv = "dead" if u.dead_t > 1.5 else "die"
		var p := u.pos
		if u.horse_key != "":
			var hm := "run" if u.moving > 4.0 else ("walk" if u.moving > 0.3 else "idle")
			if u.state == "dead": hm = "die"
			crowd.add(950000 + u.id, u.horse_key, p, u.yaw, hm, u.phase, maxf(0.6, u.moving / 7.0))
			if u.state != "dead":
				crowd.add(900000 + u.id, u.key, p + Vector3(0, 0.84, 0) + Vector3(sin(u.yaw), 0, cos(u.yaw)) * 0.12, u.yaw, "ride", u.phase)
			continue
		crowd.add(900000 + u.id, u.key, p, u.yaw, mv, u.phase, maxf(0.7, u.moving / 3.6) if mv in ["walk", "run"] else 1.0)

# a few soldiers on the decks of ships that carry them
func _deck_figures():
	if state == "peace": return
	for i in fleet.size():
		var b: Boat = fleet[i]
		if b.is_sunk() or b.men <= 0 or b.crew_key == "": continue
		var n: int = mini(6, 1 + b.men / 8)
		for k in n:
			var lp := Vector3(((k % 2) - 0.5) * 2.4, float(b.K.seat.y) - 0.1, -3.0 + (k / 2) * 3.2 + 2.0)
			var gp := b.global_transform * lp
			crowd.add(980000 + i * 10 + k, b.crew_key, gp, b.yaw, "idle", float(k) * 0.3)

# ---------------------------------------------------------------- the end of it
func _victory(why: String):
	if state != "battle": return
	state = "won"
	var tc := target_city()
	_open_gate(false)
	for u: Unit in units:
		if u.side == 1 and u.state != "dead": u.state = "aboard"   # (they lay down their arms)
	said.emit("ניצחון! %s. %s נכבשה — בחר מה לעשות בה" % [why, tc.name_he()])
	if sound: sound.play("level_up")
	won.emit(target)
	changed.emit()

# the chief's choice after a victory: "annex", "plunder", "tribute"
func decide(what: String):
	var tc := target_city()
	if tc == null or choice_made: return
	choice_made = true
	var h := home()
	# who of the defenders lived
	var alive_ids := {}
	for u: Unit in units:
		if u.side == 1 and u.person >= 0 and u.state == "aboard": alive_ids[u.person] = true
	tc.release_defenders(alive_ids)
	tc.set_shut(false)
	# the beasts that fell are gone, the others go back to their pens
	var alive_b := {}
	for u: Unit in units: if u.side == 1 and u.beast and u.state != "dead": alive_b[u.kind] = alive_b.get(u.kind, 0) + 1
	var taken := {}
	for b in tc.beast_pen: if b.away: taken[b.kind] = taken.get(b.kind, 0) + 1
	var dead_b := {}
	for k in taken: dead_b[k] = maxi(0, int(taken[k]) - int(alive_b.get(k, 0)))
	tc.lose_beasts(dead_b)
	match what:
		"annex":
			tc.set_ruler("blue")
			var g: float = tc.gold * 0.5; tc.gold -= g; h.gold += g
			loot.gold = g
			tribute.erase(target)
			said.emit("%s היא עכשיו שלך! %d תושבים חדשים, %d זהב לאוצר, וחיות המלחמה שלה בשירותך" % [tc.name_he(), tc.population(), int(g)])
		"plunder":
			var g2: float = tc.gold * 0.9; tc.gold -= g2; h.gold += g2
			loot.gold = g2
			var take_h := mini(tc.horses_here(), 16)
			for i in take_h: tc.horses.pop_back()
			loot.horses = take_h
			var lb := {}
			var keep := []
			for b in tc.beast_pen:
				if int(lb.get(b.kind, 0)) < 4: lb[b.kind] = int(lb.get(b.kind, 0)) + 1; continue
				keep.append(b)
			tc.beast_pen = keep
			loot.beasts = lb
			said.emit("בזזתם את %s: %d זהב, %d סוסים%s. השלל יגיע הביתה איתכם" % [tc.name_he(), int(g2), take_h, (" ו" + _force_text({}, lb)) if lb.size() > 0 else ""])
		"tribute":
			tribute[target] = 40.0 + tc.population() * 0.4
			var g3: float = tc.gold * 0.3; tc.gold -= g3; h.gold += g3
			loot.gold = g3
			said.emit("%s תשלם לך מס: %d זהב בכל יום, ומיד %d זהב" % [tc.name_he(), int(tribute[target]), int(g3)])
	changed.emit()

# back to the ships, then home
func go_home():
	if state != "won" and state != "battle": return
	set_order("all", "retreat")

func _defeat():
	state = "home"
	said.emit("הצבא שלנו הובס. מי שנשאר על הספינות — הביתה")
	changed.emit()

# the chief boarded a ship after the fighting: the army boards with him (after a victory), and the fleet sails home
func boarded(_b: Boat):
	if state == "won":
		for u: Unit in units: if u.side == 0 and u.state != "dead": u.state = "aboard"
		state = "home"
	elif state == "battle":
		var ashore := 0
		for u: Unit in units: if u.side == 0 and u.state != "dead" and u.state != "aboard": ashore += 1
		if ashore > 0:
			said.emit("%d לוחמים עדיין על החוף. תן פקודה \"לספינות\" כדי שיעלו" % ashore)
			return
		state = "home"
	if state == "home":
		for s2 in fleet: s2.anchored = false
		said.emit("הצי מפליג הביתה. נווט אל עיר הנמל")
		changed.emit()

func _arrive_home():
	var h := home()
	var alive := {}
	for u: Unit in units:
		if u.side == 0 and u.state == "aboard" and not u.beast: alive[u.kind] = alive.get(u.kind, 0) + 1
	# those who stayed on the ships all along (when the army never landed)
	if not landed:
		alive = force.duplicate()
	var horses_alive := 0
	for u: Unit in units: if u.side == 0 and u.state == "aboard" and u.horse_key != "": horses_alive += 1
	if not landed: horses_alive = horses_sent
	h.come_home(alive)
	h.lose_horses(horses_sent - horses_alive)
	h.horses_back()
	if int(loot.horses) > 0: h.add_horses(int(loot.horses))
	# beasts: the living go back to where they came from; the plundered ones join your city
	var beasts_alive := {}
	for u: Unit in units: if u.side == 0 and u.beast and u.state == "aboard": beasts_alive[u.kind] = beasts_alive.get(u.kind, 0) + 1
	if not landed: beasts_alive = beasts_sent.duplicate()
	for e in beast_from:
		var city: City = cities[e[0]]
		var ok: int = beasts_alive.get(e[1], 0)
		for b in city.beast_pen:
			if b.away and b.kind == e[1]:
				if ok > 0: b.away = false; ok -= 1; beasts_alive[e[1]] = ok
				break
	for id in cities:
		var city: City = cities[id]
		city.beast_pen = city.beast_pen.filter(func(b): return not b.away or not city.is_mine() or id == target)
	for k in loot.beasts: h.add_beasts(k, int(loot.beasts[k]))
	var back := 0
	for k in alive: back += int(alive[k])
	var fell := 0
	for k in lost: fell += int(lost[k])
	said.emit("חזרתם הביתה: %d לוחמים חזרו%s" % [back, (", %d נפלו בקרב" % fell) if fell > 0 else ""])
	for u: Unit in units: pass
	units.clear()
	for b in fleet:
		b.men = 0; b.horses_aboard = 0; b.anchored = false; b.leader = null
	state = "peace"; target = ""; landed = false
	changed.emit()

# the chief fell: the army carries him home and the campaign is over
func abort():
	if state == "peace": return
	for u: Unit in units:
		if u.side == 0 and u.state != "dead": u.state = "aboard"
	var tc := target_city()
	if tc:
		var alive_ids := {}
		for u: Unit in units: if u.side == 1 and u.person >= 0 and u.state != "dead": alive_ids[u.person] = true
		tc.release_defenders(alive_ids)
		tc.set_shut(false)
		for b in tc.beast_pen: b.away = false
	_arrive_home()
	for b in fleet:
		if not b.is_sunk(): b.place(b.home, b.home_yaw)

# the daily tribute of the cities that pay
func new_day():
	var h := home()
	for id in tribute:
		h.gold += float(tribute[id])

# the chief strikes: the enemy unit in front of him
func player_strike(from: Vector3, fwd: Vector3, reach: float, dmg: float) -> bool:
	if state != "battle" and state != "won": return false
	var best: Unit = null; var bd := reach + 0.6
	for u: Unit in units:
		if u.side != 1 or u.state == "dead" or u.state == "aboard" or u.on_wall: continue
		var d := u.pos + Vector3.UP * 0.8 - from; d.y *= 0.5
		var l := d.length() - u.radius
		if l > bd: continue
		if l > 0.6 and Vector2(d.x, d.z).normalized().dot(Vector2(fwd.x, fwd.z)) < 0.3: continue
		bd = l; best = u
	if best == null: return false
	_damage(best, dmg, null)
	if best.state != "dead": best.move = "hit"
	return true

# (the HUD) how many on each side
func tally() -> Dictionary:
	var c := {"ours": 0, "theirs": 0, "aboard": men_aboard()}
	for u: Unit in units:
		if u.state == "dead" or u.state == "aboard": continue
		if u.side == 0: c.ours += 1
		else: c.theirs += 1
	return c

# ---------------------------------------------------------------- saving (between battles only: a battle is saved as the fleet at sea)
func save_state() -> Dictionary:
	return {"state": state if state in ["peace", "sail", "home"] else ("sail" if not landed else "home"), "target": target, "goal": goal, "force": force,
		"horses": horses_sent, "beasts": beasts_sent, "from": beast_from, "tribute": tribute, "loot": loot, "landed": landed}

func load_state(s: Dictionary):
	if s.is_empty(): return
	tribute = s.get("tribute", {})
	var st: String = s.get("state", "peace")
	if st == "peace": return
	target = s.get("target", ""); goal = s.get("goal", "conquer")
	force = s.get("force", {}); horses_sent = int(s.get("horses", 0)); beasts_sent = s.get("beasts", {}); beast_from = s.get("from", [])
	loot = s.get("loot", {"gold": 0.0, "horses": 0, "beasts": {}})
	var h := home()
	h.send_out(force)
	h.send_horses(horses_sent)
	_load_fleet()
	landed = false
	state = st
	if st == "home": landed = false
	changed.emit()
