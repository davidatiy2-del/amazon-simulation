class_name Animals
extends Node3D
# Keeps the jungle around the hunter alive: animals appear out of sight around him and fade away when he is far.
const KINDS := {
	"deer": {"name": "צבי", "model": "res://assets/nf/deer.glb", "size": 1.25, "walk": 1.3, "run": 8.8, "hp": 60.0, "sense": 20.0,
		"role": "prey", "meat": 80.0, "bite": 0.0, "count": 12,
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack_Kick", "death": "Death", "hit": "Idle_HitReact_Left"}},
	"fox": {"name": "שועל", "model": "res://assets/nf/fox.glb", "size": 0.55, "walk": 1.5, "run": 7.5, "hp": 30.0, "sense": 15.0,
		"role": "prey", "meat": 30.0, "bite": 0.0, "count": 6,
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack", "death": "Death", "hit": "Idle_HitReact_Left"}},
	"wolf": {"name": "זאב רעמה", "model": "res://assets/nf/wolf.glb", "size": 1.0, "walk": 1.6, "run": 7.9, "hp": 85.0, "sense": 18.0,
		"role": "hunter", "meat": 50.0, "bite": 13.0, "count": 3, "night_count": 6,
		"colors": {"Main": Color(0.72, 0.34, 0.14), "Main_Light": Color(0.85, 0.62, 0.38), "Main_Dark": Color(0.18, 0.1, 0.07)},
		"anims": {"idle": "Idle", "walk": "Walk", "run": "Gallop", "eat": "Eating", "attack": "Attack", "death": "Death", "hit": "Idle_HitReact_Left"}},
	"frog": {"name": "צפרדע", "model": "res://assets/nf/frog.glb", "size": 0.22, "walk": 0.8, "run": 2.6, "hp": 8.0, "sense": 4.0,
		"role": "small", "meat": 6.0, "bite": 0.0, "count": 10, "shore": true,
		"colors": {"Frog_Main": Color(0.12, 0.45, 0.85)},
		"anims": {"idle": "Frog_Idle", "walk": "Frog_Jump", "run": "Frog_Jump", "attack": "Frog_Attack", "death": "Frog_Death"}},
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
	var pp := player.position
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
		for key in KINDS:
			var k: Dictionary = KINDS[key]
			var want: int = k.get("night_count", k.count) if night else k.count
			var have := 0
			for a in list: if a.kind == k and not a.is_dead(): have += 1
			if have < want: _spawn(k, pp, list.is_empty())

func _spawn(k: Dictionary, pp: Vector3, first: bool) -> void:
	for tries in 20:
		var ang := randf() * TAU
		var r := randf_range(25.0 if first else 70.0, 150.0)
		var x := pp.x + cos(ang) * r; var z := pp.z + sin(ang) * r
		if absf(x) > 480.0 or absf(z) > 480.0: continue
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
