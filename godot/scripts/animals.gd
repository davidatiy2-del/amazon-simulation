class_name Animals
extends Node3D
# Keeps the land around the hunter alive: animals appear out of sight around him and fade away when he is far.
# Each kind lives in its own land: the jungle, or the new world across the sea.
const KINDS := {
	"deer": {"name": "צבי", "model": "res://assets/nf/deer.glb", "size": 1.25, "walk": 1.3, "run": 8.8, "hp": 60.0, "sense": 20.0,
		"role": "prey", "meat": 80.0, "bite": 0.0, "count": 12, "land": "jungle",
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack_Kick", "death": "Death", "hit": "Idle_HitReact_Left"}},
	"fox": {"name": "שועל", "model": "res://assets/nf/fox.glb", "size": 0.55, "walk": 1.5, "run": 7.5, "hp": 30.0, "sense": 15.0,
		"role": "prey", "meat": 30.0, "bite": 0.0, "count": 6, "land": "jungle",
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack", "death": "Death", "hit": "Idle_HitReact_Left"}},
	"wolf": {"name": "זאב רעמה", "model": "res://assets/nf/wolf.glb", "size": 1.0, "walk": 1.6, "run": 7.9, "hp": 85.0, "sense": 18.0,
		"role": "hunter", "meat": 50.0, "bite": 13.0, "count": 3, "night_count": 6, "land": "jungle",
		"colors": {"Main": Color(0.72, 0.34, 0.14), "Main_Light": Color(0.85, 0.62, 0.38), "Main_Dark": Color(0.18, 0.1, 0.07)},
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack", "death": "Death", "hit": "Idle_HitReact_Left"}},
	"frog": {"name": "צפרדע", "model": "res://assets/nf/frog.glb", "size": 0.22, "walk": 0.8, "run": 2.6, "hp": 8.0, "sense": 4.0,
		"role": "small", "meat": 6.0, "bite": 0.0, "count": 10, "shore": true, "land": "jungle",
		"colors": {"Frog_Main": Color(0.12, 0.45, 0.85)},
		"anims": {"idle": "Frog_Idle", "walk": "Frog_Jump", "run": "Frog_Jump", "attack": "Frog_Attack", "death": "Frog_Death"}},
	# ---- the new world ----
	"zebra": {"name": "זברה", "model": "res://assets/animals/Zebra.fbx", "size": 1.55, "walk": 1.4, "run": 9.5, "hp": 90.0, "sense": 24.0,
		"role": "prey", "meat": 90.0, "bite": 0.0, "count": 10, "herd": true, "land": "new",
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Run", "attack": "Jump", "death": "Death"}},
	"horse": {"name": "סוס בר", "model": "res://assets/animals/Horse.fbx", "size": 1.7, "walk": 1.5, "run": 10.5, "hp": 110.0, "sense": 26.0,
		"role": "prey", "meat": 100.0, "bite": 0.0, "count": 7, "herd": true, "land": "new",
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Run", "attack": "Jump", "death": "Death"}},
	"stag": {"name": "אייל", "model": "res://assets/nf/stag.glb", "size": 1.9, "walk": 1.3, "run": 9.0, "hp": 100.0, "sense": 22.0,
		"role": "prey", "meat": 95.0, "bite": 0.0, "count": 5, "land": "new",
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack_Headbutt", "death": "Death", "hit": "Idle_HitReact_Left"}},
	"greywolf": {"name": "זאב אפור", "model": "res://assets/nf/wolf.glb", "size": 1.05, "walk": 1.6, "run": 8.4, "hp": 90.0, "sense": 20.0,
		"role": "hunter", "meat": 50.0, "bite": 15.0, "count": 3, "night_count": 6, "herd": true, "land": "new",
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack", "death": "Death", "hit": "Idle_HitReact_Left"}},
}
var hd := HeightData.new()
var list: Array[Animal] = []
var player: Player
var day_night: DayNight
var frame := 0
var spawn_t := 0.0
var calm := false     # (tests) animals stand still

func _process(dt: float):
	if player == null: return
	frame += 1
	var night := day_night != null and day_night.is_night()
	var pp := player.boat.position if player.boat else player.position
	for i in range(list.size() - 1, -1, -1):
		var a: Animal = list[i]
		if not is_instance_valid(a): list.remove_at(i); continue
		var d := Vector2(a.position.x - pp.x, a.position.z - pp.z).length()
		if d > 200.0 or (a.is_dead() and a.dead_t > 240.0):
			a.queue_free(); list.remove_at(i); continue
		# far animals: think less often and stop animating
		var far := d > 90.0
		if far != a.far:
			a.far = far; a.visible = d < 150.0
			if a.ap: a.ap.speed_scale = 0.0 if far else 1.0
		if calm: continue
		if not far or (frame + i) % 6 == 0:
			a.tick(dt * (6.0 if far else 1.0), player, night)
	spawn_t -= dt
	if spawn_t <= 0.0:
		spawn_t = 1.5
		var land := land_at(pp.z)
		for key in KINDS:
			var k: Dictionary = KINDS[key]
			if k.land != land: continue
			var want: int = k.get("night_count", k.count) if night else k.count
			var have := 0
			for a in list: if a.kind == k and not a.is_dead(): have += 1
			if have < want: _spawn(k, pp, list.is_empty())

# which land's animals live around z: the jungle's, the new world's, or none (out at sea)
static func land_at(z: float) -> String:
	if z < 640.0: return "jungle"
	if z > 1380.0: return "new"
	return ""

static func in_land(land: String, x: float, z: float) -> bool:
	if absf(x) > 485.0: return false
	if land == "jungle": return z > -485.0 and z < 560.0
	return z > 1480.0 and z < 2535.0

func _spawn(k: Dictionary, pp: Vector3, first: bool) -> void:
	# herds: next to one of their own, if there is one
	var mate: Animal = null
	if k.get("herd", false) and randf() < 0.75:
		for a in list:
			if a.kind == k and not a.is_dead() and a.position.distance_to(pp) < 170.0: mate = a; break
	for tries in 20:
		var x: float; var z: float
		if mate:
			x = mate.position.x + randf_range(-9.0, 9.0); z = mate.position.z + randf_range(-9.0, 9.0)
			if Vector2(x - pp.x, z - pp.z).length() < 45.0: mate = null; continue
		else:
			var ang := randf() * TAU
			var r := randf_range(25.0 if first else 70.0, 150.0)
			x = pp.x + cos(ang) * r; z = pp.z + sin(ang) * r
		if not in_land(k.land, x, z): continue
		var depth := hd.water_depth(x, z)
		if k.get("shore", false):
			if depth > 0.0: continue
			var near := false
			for q in 8:
				var a2 := q * TAU / 8.0
				if hd.water_depth(x + cos(a2) * 4.0, z + sin(a2) * 4.0) > 0.2: near = true; break
			if not near: continue
		elif depth > 0.0 or hd.normal(x, z).y < 0.8: continue
		var n := Animal.new()
		add_child(n)
		n.setup(k, hd, Vector3(x, 0, z))
		list.append(n)
		return

func strike(from: Vector3, fwd: Vector3, reach: float, dmg: float) -> Animal:
	var best: Animal = null; var bd := reach
	for a in list:
		if not is_instance_valid(a) or a.is_dead(): continue
		var d := a.position + Vector3.UP * 0.4 - from; d.y *= 0.5
		var l := d.length() - float(a.kind.size) * 0.35
		if l > reach: continue
		if l > 0.6 and Vector2(d.x, d.z).normalized().dot(Vector2(fwd.x, fwd.z)) < 0.35: continue
		if l < bd: bd = l; best = a
	if best: best.hurt(dmg, from)
	return best

func corpse_near(p: Vector3, r: float) -> Animal:
	for a in list:
		if is_instance_valid(a) and a.is_dead() and a.meat > 0.5 and a.position.distance_to(p) < r + float(a.kind.size) * 0.4: return a
	return null
