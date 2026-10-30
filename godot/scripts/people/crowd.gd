class_name Crowd
extends Node3D
# Draws everyone in the world cheaply. Each frame the cities, the armies and the herds hand in who is where and what
# they do; the nearest few get full animated models (kept on the same person while they stay near), the others are
# drawn as baked statues in MultiMeshes, two frames for walking and running so they seem to step, and nobody is
# drawn beyond the view distance. A statue is baked once per shape and pose (tools/bake_crowd.gd bakes them ahead,
# into assets/bakes; a shape not baked there is baked here, a few at a time).
const POSES := ["idle", "walk0", "walk1", "run0", "run1", "act", "ride", "dead"]
const BAKE_DIR := "res://assets/bakes/"
var cam: Camera3D
var near_max := 24
var near_dist := 34.0
var far_dist := 115.0
var looks := {}              # key -> {type, look | model..., shape, mat}
var bakes := {}              # shape -> {pose: Mesh}
var mms := {}                # bucket -> MultiMeshInstance3D
var buckets := {}            # bucket -> PackedFloat32Array being filled
var counts := {}             # bucket -> instances this frame
var pool := {}               # key -> [free puppets]
var bound := {}              # ref -> puppet
var bound_key := {}          # ref -> key
var items: Array = []        # [ref, key, pos, yaw, move, phase, speed]
var t := 0.0
var _queue: Array = []       # shapes waiting to be baked
var _makers := 0
var baker: Node3D            # where puppets are made to be baked
var stats := {"near": 0, "far": 0}

func _ready():
	process_priority = 100   # after everyone has handed in

func register(key: String, def: Dictionary) -> void:
	if looks.has(key): return
	var d := def.duplicate()
	if d.type == "person":
		var lk: Dictionary = d.look
		d["shape"] = "p_%s_%s%s_%s_%s" % [lk.base, "h" if lk.get("helmet", false) else "", "c" if lk.get("cape", false) else "", lk.get("weapon", ""), lk.get("shield", "")]
		var b: Dictionary = Skins.BASES[lk.base]
		d["mat"] = Skins.material_for(b.tex, lk.get("cloth", Color(0, 0, 0, 0)), lk.get("metal", ""), int(lk.get("skin", 0))) if b.fam == "kk" else null
	else:
		d["shape"] = "a_" + key
		d["mat"] = null
	looks[key] = d

func add(ref: int, key: String, pos: Vector3, yaw: float, move: String, phase := 0.0, spd := 1.0) -> void:
	items.append([ref, key, pos, yaw, move, phase, spd])

# a puppet near the camera for this person now, if they have one (to attach things, or to check)
func puppet_of(ref: int) -> Node3D: return bound.get(ref, null)

static func pose_of(move: String) -> String:
	match move:
		"walk", "walk_b", "walk_carry": return "walk"
		"run", "run_b": return "run"
		"attack", "attack_b", "attack_c", "stab", "attack2h", "attack2h_b", "spin", "shoot", "chop", "work", "use", "interact", "pickup", "cast", "cast_shoot", "punch", "kick", "throw", "block", "aim": return "act"
		"ride", "sit", "sit_floor": return "ride"
		"die", "die_b", "dead", "lie": return "dead"
	return "idle"

func _process(dt: float):
	t += dt
	if cam == null: cam = get_viewport().get_camera_3d()
	if cam == null: items.clear(); return
	var cp := cam.global_position
	var fwd := -cam.global_transform.basis.z
	# who is near: sorted by distance, the closest get puppets
	var near: Array = []
	var far2 := far_dist * far_dist
	var vis: Array = []
	for it in items:
		var p: Vector3 = it[2]
		var d2 := cp.distance_squared_to(p)
		if d2 > far2: continue
		# behind the camera and not close: skip
		if d2 > 100.0 and (p - cp).dot(fwd) < -6.0: continue
		vis.append([d2, it])
	vis.sort_custom(func(a, b): return a[0] < b[0])
	var keep := {}
	var nd2 := near_dist * near_dist
	var made := 0
	for e in vis:
		var it: Array = e[1]
		if near.size() >= near_max or e[0] > nd2: break
		var ref: int = it[0]
		if bound.has(ref) and bound_key[ref] == it[1]: keep[ref] = true; near.append(it); continue
		var free: Array = pool.get(it[1], [])
		if free.is_empty() and made >= 2: continue
		keep[ref] = true; near.append(it)
	# free the puppets of those who went far
	for ref in bound.keys():
		if not keep.has(ref):
			var pu: Node3D = bound[ref]
			pu.visible = false
			if not pool.has(bound_key[ref]): pool[bound_key[ref]] = []
			pool[bound_key[ref]].append(pu)
			bound.erase(ref); bound_key.erase(ref)
	# the near ones: full models
	for it in near:
		var ref: int = it[0]; var key: String = it[1]
		var pu: Node3D = bound.get(ref, null)
		if pu == null:
			var free: Array = pool.get(key, [])
			if free.is_empty():
				pu = _make(key); made += 1
				if pu == null: continue
			else: pu = free.pop_back()
			bound[ref] = pu; bound_key[ref] = key
			pu.visible = true
		pu.global_position = it[2]
		pu.rotation = Vector3(0, it[3], 0)
		pu.play(it[4], 0.18, it[6])
	# the rest: statues
	for b in counts: counts[b] = 0
	var nfar := 0
	for e in vis:
		var it: Array = e[1]
		if keep.has(it[0]): continue
		var lk: Dictionary = looks.get(it[1], {})
		if lk.is_empty(): continue
		var pose := pose_of(it[4])
		if pose == "walk" or pose == "run": pose += "0" if fmod(t * (3.2 if pose == "run" else 2.2) * it[6] + float(it[5]), 1.0) < 0.5 else "1"
		var mesh: Mesh = _mesh(lk, pose)
		if mesh == null: continue
		var bk: String = lk.shape + "|" + str(lk.mat.get_instance_id() if lk.mat else 0) + "|" + pose
		if not buckets.has(bk): buckets[bk] = PackedFloat32Array(); counts[bk] = 0; _mm(bk, mesh, lk.mat)
		var buf: PackedFloat32Array = buckets[bk]
		var n: int = counts[bk]
		if buf.size() < (n + 1) * 12: buf.resize((n + 32) * 12)
		var yaw: float = it[3]; var p: Vector3 = it[2]
		var c := cos(yaw); var s := sin(yaw)
		var o := n * 12
		buf[o] = c; buf[o + 1] = 0.0; buf[o + 2] = s; buf[o + 3] = p.x
		buf[o + 4] = 0.0; buf[o + 5] = 1.0; buf[o + 6] = 0.0; buf[o + 7] = p.y
		buf[o + 8] = -s; buf[o + 9] = 0.0; buf[o + 10] = c; buf[o + 11] = p.z
		buckets[bk] = buf
		counts[bk] = n + 1
		nfar += 1
	for bk in mms:
		var mmi: MultiMeshInstance3D = mms[bk]
		var n: int = counts.get(bk, 0)
		var mm := mmi.multimesh
		if n == 0: mmi.visible = false; continue
		mmi.visible = true
		var buf: PackedFloat32Array = buckets[bk]
		var cap := buf.size() / 12
		if mm.instance_count != cap: mm.instance_count = cap
		mm.visible_instance_count = n
		RenderingServer.multimesh_set_buffer(mm.get_rid(), buf)
	stats.near = near.size(); stats.far = nfar
	items.clear()
	_bake_some()

func _mm(bk: String, mesh: Mesh, mat: Material):
	var mmi := MultiMeshInstance3D.new()
	var mm := MultiMesh.new(); mm.transform_format = MultiMesh.TRANSFORM_3D; mm.mesh = mesh
	mmi.multimesh = mm
	if mat: mmi.material_override = mat
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mmi.extra_cull_margin = 16384.0   # (it moves its instances itself; never cull the whole group)
	add_child(mmi)
	mms[bk] = mmi

func _mesh(lk: Dictionary, pose: String) -> Mesh:
	var sh: String = lk.shape
	if not bakes.has(sh):
		bakes[sh] = {}
		for p in POSES:
			var path: String = BAKE_DIR + sh + "_" + str(p) + ".res"
			if ResourceLoader.exists(path): bakes[sh][p] = load(path)
		if bakes[sh].size() < POSES.size(): _queue.append(lk)
	return bakes[sh].get(pose, bakes[sh].get("idle", null))

# bakes the statues of one shape now and then (when they were not baked ahead)
func _bake_some():
	if _queue.is_empty(): return
	var lk: Dictionary = _queue.pop_front()
	var pu := _make_raw(lk)
	if pu == null: return
	if baker == null: baker = Node3D.new(); add_child(baker); baker.visible = false
	baker.add_child(pu)
	var got: Dictionary = bakes[lk.shape]
	for p in POSES:
		if got.has(p): continue
		got[p] = Crowd.bake_pose(pu, p)
	pu.queue_free()

# a still mesh of a puppet in one of the POSES
static func bake_pose(pu: Node3D, pose: String) -> Mesh:
	var mv: String = {"idle": "idle", "walk0": "walk", "walk1": "walk", "run0": "run", "run1": "run", "act": "attack", "ride": "ride", "dead": "dead"}[pose]
	var ap: AnimationPlayer = pu.get("ap")
	var anim: String = pu.anim_name(mv) if pu.has_method("anim_name") else ""
	if pu is Avatar and pose == "ride": (pu as Avatar).set_riding(false)
	var len := ap.get_animation(anim).length if ap and anim != "" else 1.0
	var at: float = {"walk0": 0.25, "walk1": 0.75, "run0": 0.25, "run1": 0.75, "act": 0.45, "dead": 0.99, "idle": 0.0, "ride": 0.5}[pose] * len
	return PoseBake.bake(pu, ap, anim, at)

func _make(key: String) -> Node3D:
	var lk: Dictionary = looks.get(key, {})
	if lk.is_empty(): return null
	var pu := _make_raw(lk)
	if pu: add_child(pu)
	return pu

func _make_raw(lk: Dictionary) -> Node3D:
	if lk.type == "person":
		var av := Avatar.new()
		av.setup(lk.look, float(lk.get("height", 1.8)))
		return av
	var ap := AnimalPuppet.new()
	ap.setup(lk)
	return ap

func clear_all():
	for ref in bound.keys():
		var pu: Node3D = bound[ref]
		pu.visible = false
		if not pool.has(bound_key[ref]): pool[bound_key[ref]] = []
		pool[bound_key[ref]].append(pu)
	bound.clear(); bound_key.clear()
	for bk in mms: (mms[bk] as MultiMeshInstance3D).visible = false
