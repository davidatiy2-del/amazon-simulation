extends SceneTree
# Builds the jungle once, offline: heights (world/height.bin), the ground in chunks with a near and a far version,
# the water, the plants (MultiMesh per area and kind), collision, and the trunks that block the way (world/trunks.bin).
# Run: godot --headless --path . --script tools/worldgen.gd
const N := WorldShape.N
const CELL := WorldShape.CELL
const HALF := 512.0
var S := WorldShape.new()
var H := PackedFloat32Array()
var D := PackedFloat32Array()   # distance to the water's edge (negative in the water)
var rng := RandomNumberGenerator.new()
var trunks := PackedFloat32Array()  # x, z, r

func idx(i: int, j: int) -> int: return clampi(j, 0, N - 1) * N + clampi(i, 0, N - 1)
func hat(x: float, z: float) -> float:
	var fx := (x + HALF) / CELL; var fz := (z + HALF) / CELL
	var i := int(floor(fx)); var j := int(floor(fz)); var tx := fx - i; var tz := fz - j
	return lerpf(lerpf(H[idx(i, j)], H[idx(i + 1, j)], tx), lerpf(H[idx(i, j + 1)], H[idx(i + 1, j + 1)], tx), tz)
func dat(x: float, z: float) -> float:
	var i := int(round((x + HALF) / CELL)); var j := int(round((z + HALF) / CELL))
	return D[idx(i, j)]
func normal_at(i: int, j: int) -> Vector3:
	return Vector3(H[idx(i - 1, j)] - H[idx(i + 1, j)], 2.0 * CELL, H[idx(i, j - 1)] - H[idx(i, j + 1)]).normalized()

func _init():
	var t0 := Time.get_ticks_msec()
	H.resize(N * N); D.resize(N * N)
	for j in N:
		for i in N:
			var x := -HALF + i * CELL; var z := -HALF + j * CELL
			var d := S.channel(x, z)
			D[j * N + i] = d; H[j * N + i] = S.height_d(x, z, d)
	print("heights ", Time.get_ticks_msec() - t0, " ms")
	DirAccess.make_dir_recursive_absolute("res://world")
	var f := FileAccess.open("res://world/height.bin", FileAccess.WRITE); f.store_buffer(H.to_byte_array()); f.close()
	var root := Node3D.new(); root.name = "World"
	_ground(root)
	print("ground ", Time.get_ticks_msec() - t0, " ms")
	_water(root)
	_collision(root)
	_plants(root)
	print("plants ", Time.get_ticks_msec() - t0, " ms")
	f = FileAccess.open("res://world/trunks.bin", FileAccess.WRITE); f.store_buffer(trunks.to_byte_array()); f.close()
	_own(root, root)
	var ps := PackedScene.new(); ps.pack(root)
	var err := ResourceSaver.save(ps, "res://world/world.scn", ResourceSaver.FLAG_COMPRESS)
	print("saved ", err, " total ", Time.get_ticks_msec() - t0, " ms, trunks ", trunks.size() / 3)
	quit()

func _own(n: Node, root: Node):
	for c in n.get_children():
		c.owner = root; _own(c, root)

# ---------- the ground ----------
func ground_color(i: int, j: int) -> Color:
	var h := H[idx(i, j)]; var d := D[idx(i, j)]; var n := normal_at(i, j)
	var x := -HALF + i * CELL; var z := -HALF + j * CELL
	var fo := S.forest_at(x, z)
	var grass := Color(0.30, 0.45, 0.15).lerp(Color(0.17, 0.27, 0.10), fo)   # open grass .. shaded forest floor
	var c := grass
	if h > 22.0: c = c.lerp(Color(0.42, 0.45, 0.3), smoothstep(22.0, 40.0, h))
	var steep := 1.0 - n.y
	c = c.lerp(Color(0.42, 0.36, 0.28), smoothstep(0.12, 0.3, steep))           # dirt on slopes
	c = c.lerp(Color(0.48, 0.47, 0.44), smoothstep(0.32, 0.5, steep))           # rock on cliffs
	if d < 9.0: c = c.lerp(Color(0.40, 0.33, 0.22), smoothstep(9.0, 2.0, d))    # muddy banks
	if d < 1.5: c = c.lerp(Color(0.62, 0.55, 0.40), smoothstep(1.5, -0.5, d))   # sand at the edge
	if d < -1.0: c = c.lerp(Color(0.30, 0.27, 0.19), smoothstep(-1.0, -4.0, d)) # river bed
	return c

func _ground(root: Node3D):
	var mat := ShaderMaterial.new(); mat.shader = load("res://shaders/terrain.gdshader")
	var noise := FastNoiseLite.new(); noise.seed = 5; noise.frequency = 0.04; noise.fractal_octaves = 4
	var img := noise.get_seamless_image(256, 256, false, false, 0.15)
	img.convert(Image.FORMAT_RGB8); img.generate_mipmaps()
	mat.set_shader_parameter("detail", ImageTexture.create_from_image(img))
	var g := Node3D.new(); g.name = "Ground"; root.add_child(g)
	var CH := 32   # cells per chunk (64 m)
	for cz in 16:
		for cx in 16:
			for lod in 2:
				var step := 1 if lod == 0 else 4
				var mi := MeshInstance3D.new(); mi.name = "G%d_%d_%d" % [cx, cz, lod]
				mi.mesh = _chunk_mesh(cx * CH, cz * CH, CH, step); mi.material_override = mat
				mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
				if lod == 0: mi.visibility_range_end = 230.0; mi.visibility_range_end_margin = 10.0
				else: mi.visibility_range_begin = 230.0; mi.visibility_range_begin_margin = 10.0
				mi.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_DISABLED
				g.add_child(mi)

func _chunk_mesh(i0: int, j0: int, n: int, step: int) -> ArrayMesh:
	var m := n / step + 1
	var v := PackedVector3Array(); var nr := PackedVector3Array(); var col := PackedColorArray(); var ix := PackedInt32Array()
	for b in m:
		for a in m:
			var i := i0 + a * step; var j := j0 + b * step
			v.append(Vector3(-HALF + i * CELL, H[idx(i, j)], -HALF + j * CELL))
			nr.append(normal_at(i, j)); col.append(ground_color(i, j))
	for b in m - 1:
		for a in m - 1:
			var k := b * m + a
			ix.append_array([k, k + 1, k + m, k + 1, k + m + 1, k + m])
	var arr := []; arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = v; arr[Mesh.ARRAY_NORMAL] = nr; arr[Mesh.ARRAY_COLOR] = col; arr[Mesh.ARRAY_INDEX] = ix
	var am := ArrayMesh.new(); am.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	return am

# ---------- the water ----------
func _water(root: Node3D):
	var mat := ShaderMaterial.new(); mat.shader = load("res://shaders/water.gdshader")
	var img := Image.create_from_data(N, N, false, Image.FORMAT_RF, H.to_byte_array())
	mat.set_shader_parameter("heights", ImageTexture.create_from_image(img))
	mat.set_shader_parameter("world_size", HALF * 2.0 + CELL)
	var pm := PlaneMesh.new(); pm.size = Vector2(1100, 1100); pm.subdivide_width = 110; pm.subdivide_depth = 110
	var w := MeshInstance3D.new(); w.name = "Water"; w.mesh = pm; w.material_override = mat; w.position.y = WorldShape.WATER
	w.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(w)

func _collision(root: Node3D):
	var body := StaticBody3D.new(); body.name = "GroundBody"; root.add_child(body)
	var cs := CollisionShape3D.new(); var hs := HeightMapShape3D.new()
	hs.map_width = N; hs.map_depth = N
	var half := PackedFloat32Array(); half.resize(N * N)
	for k in N * N: half[k] = H[k] / CELL
	hs.map_data = half; cs.shape = hs; cs.scale = Vector3(CELL, CELL, CELL)
	body.add_child(cs)

# ---------- the plants ----------
# name, file, scale range, grid cell (m), what decides where it grows, shadows, how far it is drawn, trunk radius
var KINDS := [
	["tree_common", ["CommonTree_1", "CommonTree_3", "CommonTree_5"], Vector2(2.0, 3.3), 8.5, "forest", true, 460.0, 0.55],
	["tree_twisted", ["TwistedTree_1", "TwistedTree_3"], Vector2(0.85, 1.25), 21.0, "giant", true, 520.0, 0.9],
	["palm", ["@palm"], Vector2(4.5, 7.5), 8.0, "palm", true, 360.0, 0.35],
	["bush", ["Bush_Common", "Bush_Common_Flowers"], Vector2(1.0, 2.0), 4.5, "under", true, 150.0, 0.0],
	["fern", ["Fern_1"], Vector2(1.3, 2.4), 3.0, "under", false, 80.0, 0.0],
	["plant_big", ["Plant_1_Big", "Plant_7_Big"], Vector2(1.0, 1.8), 4.0, "under", false, 90.0, 0.0],
	["plant", ["Plant_1", "Plant_7", "Flower_3_Group", "Flower_4_Group", "Mushroom_Common", "Mushroom_Laetiporus"], Vector2(0.8, 1.4), 3.0, "floor", false, 55.0, 0.0],
	["grass", ["Grass_Common_Tall", "Grass_Wispy_Tall"], Vector2(0.9, 1.5), 1.7, "grass", false, 45.0, 0.0],
	["rock", ["Rock_Medium_1", "Rock_Medium_2", "Rock_Medium_3"], Vector2(0.5, 1.4), 16.0, "rock", true, 220.0, 0.0],
]
# how often each variant is picked (the rest: equal)
const WEIGHTS := {"bush": [4, 1], "plant": [3, 3, 1, 1, 1, 1]}

func _mesh_of(name: String) -> Array:
	var sc: Node
	if name == "@palm": sc = load("res://assets/nf/tree_palm.glb").instantiate()
	else: sc = load("res://assets/nature/" + name + ".gltf").instantiate()
	var mi: MeshInstance3D = sc.find_children("*", "MeshInstance3D", true, false)[0]
	var x := ModelUtil.rel_xform(mi, sc); var mesh := mi.mesh
	if name == "@palm":   # its leaves come out turquoise: make them a jungle green
		mesh = mesh.duplicate()
		for q in mesh.get_surface_count():
			var m: Material = mesh.surface_get_material(q)
			if m is StandardMaterial3D and m.resource_name.begins_with("leafs"):
				m = m.duplicate(); m.albedo_color = Color(0.36, 0.62, 0.2); mesh.surface_set_material(q, m)
			elif m is StandardMaterial3D:
				m = m.duplicate(); m.albedo_color = Color(0.62, 0.47, 0.34); mesh.surface_set_material(q, m)
	sc.free()
	return [mesh, x]

# small plants fade out (dithered) right in front of the camera, so a leaf never fills the screen
func _faded(mesh: Mesh, near: float) -> Mesh:
	var m2: Mesh = mesh.duplicate()
	for q in m2.get_surface_count():
		var mat: Material = m2.surface_get_material(q)
		if mat is BaseMaterial3D:
			var c: BaseMaterial3D = mat.duplicate()
			c.distance_fade_mode = BaseMaterial3D.DISTANCE_FADE_PIXEL_DITHER
			c.distance_fade_min_distance = near * 0.35; c.distance_fade_max_distance = near
			m2.surface_set_material(q, c)
	return m2

func _wants(rule: String, x: float, z: float, h: float, d: float, n: Vector3) -> float:
	var fo := S.forest_at(x, z)
	match rule:
		"forest": return 0.0 if d < 6.0 or n.y < 0.78 or h > 34.0 else 0.15 + fo * 0.85
		"giant": return 0.0 if d < 14.0 or n.y < 0.85 or h > 26.0 else smoothstep(0.55, 0.9, fo) * 0.75
		"palm": return 0.0 if d < 3.0 or n.y < 0.85 else (0.55 if d < 26.0 else 0.06 * (1.0 - fo))
		"under": return 0.0 if d < 1.5 or n.y < 0.7 else 0.25 + fo * 0.55
		"floor": return 0.0 if d < 1.0 or n.y < 0.75 else 0.18 + fo * 0.25
		"grass": return 0.0 if d < 0.5 or n.y < 0.8 else (1.0 - fo) * 0.75 + (0.35 if d < 12.0 else 0.0)
		"rock": return 0.0 if d < -0.5 else (0.25 if d < 8.0 else 0.0) + smoothstep(0.1, 0.35, 1.0 - n.y) * 0.8 + 0.04
	return 0.0

func _plants(root: Node3D):
	var p := Node3D.new(); p.name = "Plants"; root.add_child(p)
	rng.seed = 1234
	for k in KINDS:
		# the area each group covers: small for plants seen only up close, since a group is hidden by its middle's distance
		var VC := 64.0 if k[6] > 150.0 else (32.0 if k[0] == "grass" else 64.0)
		var meshes := []
		for nm in k[1]:
			var mx := _mesh_of(nm)
			if k[0] in ["bush", "fern", "plant_big", "plant", "grass"]: mx[0] = _faded(mx[0], 2.6 if k[0] in ["bush", "plant_big"] else 1.6)
			meshes.append(mx)
		# per area of 128 m and per variant: the transforms
		var buckets := {}
		var cell: float = k[3]
		var cnt := int(1024.0 / cell)
		for b in cnt:
			for a in cnt:
				var x := -HALF + (a + rng.randf()) * cell; var z := -HALF + (b + rng.randf()) * cell
				var i := int(round((x + HALF) / CELL)); var j := int(round((z + HALF) / CELL))
				var h := hat(x, z); var d := D[idx(i, j)]; var n := normal_at(i, j)
				if h < 0.15: continue
				if rng.randf() > _wants(k[4], x, z, h, d, n): continue
				var vi := rng.randi() % meshes.size()
				if WEIGHTS.has(k[0]):
					var wl: Array = WEIGHTS[k[0]]; var tot := 0
					for wv in wl: tot += wv
					var r := rng.randi() % tot; vi = 0
					while r >= wl[vi]: r -= wl[vi]; vi += 1
				var s := rng.randf_range(k[2].x, k[2].y)
				var key := Vector3i(int((x + HALF) / VC), int((z + HALF) / VC), vi)
				if not buckets.has(key): buckets[key] = []
				var bas := Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(s, s * rng.randf_range(0.9, 1.15), s))
				var t: Transform3D = Transform3D(bas, Vector3(x, h - 0.08, z)) * (meshes[vi][1] as Transform3D)
				buckets[key].append(t)
				if k[7] > 0.0: trunks.append_array([x, z, k[7] * s / (k[2].x + k[2].y) * 2.0])
				elif k[0] == "rock": trunks.append_array([x, z, 1.1 * s])
		var total := 0
		for key in buckets:
			var ts: Array = buckets[key]
			var mm := MultiMesh.new(); mm.transform_format = MultiMesh.TRANSFORM_3D; mm.mesh = meshes[key.z][0]
			mm.instance_count = ts.size()
			for q in ts.size(): mm.set_instance_transform(q, ts[q])
			var mmi := MultiMeshInstance3D.new(); mmi.name = "%s_%d_%d_%d" % [k[0], key.x, key.y, key.z]; mmi.multimesh = mm
			mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if k[5] else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			mmi.visibility_range_end = k[6] + VC * 0.7; mmi.visibility_range_end_margin = 20.0
			mmi.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_DISABLED
			p.add_child(mmi); total += ts.size()
		print(k[0], ": ", total, " in ", buckets.size(), " groups")
