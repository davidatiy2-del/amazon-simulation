extends SceneTree
# Builds the world once, offline: heights (world/height.bin), the ground in chunks with a near and a far version, the
# water, the plants (MultiMesh per area and kind), the harbors with their piers, collision, the trunks that block the
# way (world/trunks.bin) and the places the game needs (world/places.json).
# Run WITH a renderer (the plants' positions are lost without one):
#   godot --path . --rendering-driver vulkan --script tools/worldgen.gd
const NX := WorldShape.NX
const NZ := WorldShape.NZ
const CELL := WorldShape.CELL
const X0 := WorldShape.X0
const Z0 := WorldShape.Z0
var S := WorldShape.new()
var H := PackedFloat32Array()
var D := PackedFloat32Array()      # meters to the nearest water of any kind (negative in it)
var C := PackedFloat32Array()      # meters inland from the sea's coast (negative at sea)
var rng := RandomNumberGenerator.new()
var trunks := PackedFloat32Array()  # x, z, r
var places := {}
var keep_clear: Array = []          # [x, z, r]: no plants here (piers, boats, the wreck)
var PAINT := PackedColorArray()     # streets, plazas and fields painted on the ground (alpha: how much)
var cities := {}

func idx(i: int, j: int) -> int: return clampi(j, 0, NZ - 1) * NX + clampi(i, 0, NX - 1)
func ci(x: float) -> int: return int(round((x - X0) / CELL))
func cj(z: float) -> int: return int(round((z - Z0) / CELL))
func hat(x: float, z: float) -> float:
	var fx := (x - X0) / CELL; var fz := (z - Z0) / CELL
	var i := int(floor(fx)); var j := int(floor(fz)); var tx := fx - i; var tz := fz - j
	return lerpf(lerpf(H[idx(i, j)], H[idx(i + 1, j)], tx), lerpf(H[idx(i, j + 1)], H[idx(i + 1, j + 1)], tx), tz)
func normal_at(i: int, j: int) -> Vector3:
	return Vector3(H[idx(i - 1, j)] - H[idx(i + 1, j)], 2.0 * CELL, H[idx(i, j - 1)] - H[idx(i, j + 1)]).normalized()

func _init():
	var t0 := Time.get_ticks_msec()
	H.resize(NX * NZ); D.resize(NX * NZ); C.resize(NX * NZ)
	for j in NZ:
		var z := Z0 + j * CELL
		for i in NX:
			var x := X0 + i * CELL
			var d := S.channel(x, z); var s := S.land_s(x, z)
			var k := j * NX + i
			D[k] = minf(d, s); C[k] = s; H[k] = S.height_d(x, z, d, s)
	print("heights ", Time.get_ticks_msec() - t0, " ms")
	DirAccess.make_dir_recursive_absolute("res://world")
	var f := FileAccess.open("res://world/height.bin", FileAccess.WRITE); f.store_buffer(H.to_byte_array()); f.close()
	var root := Node3D.new(); root.name = "World"
	_harbors(root)
	_cities(root)
	_ground(root)
	print("ground ", Time.get_ticks_msec() - t0, " ms")
	_water(root)
	_collision(root)
	_plants(root)
	print("plants ", Time.get_ticks_msec() - t0, " ms")
	f = FileAccess.open("res://world/trunks.bin", FileAccess.WRITE); f.store_buffer(trunks.to_byte_array()); f.close()
	places["cities"] = cities
	f = FileAccess.open("res://world/places.json", FileAccess.WRITE); f.store_string(JSON.stringify(places, "\t")); f.close()
	_own(root, root)
	var ps := PackedScene.new(); ps.pack(root)
	var err := ResourceSaver.save(ps, "res://world/world.scn", ResourceSaver.FLAG_COMPRESS)
	print("saved ", err, " total ", Time.get_ticks_msec() - t0, " ms, trunks ", trunks.size() / 3)
	quit()

func _own(n: Node, root: Node):
	for c in n.get_children():
		c.owner = root
		if c.scene_file_path == "": _own(c, root)   # (an instanced model keeps its own insides)

# ---------- the ground ----------
func ground_color(i: int, j: int) -> Color:
	var k := idx(i, j)
	var h := H[k]; var d := D[k]; var s := C[k]; var n := normal_at(i, j)
	var x := X0 + i * CELL; var z := Z0 + j * CELL
	var c: Color
	if S.is_new_world(z):
		var pn := S.pines_at(x, z, h)
		var dry := 0.5 + 0.5 * S.forest.get_noise_2d(x * 0.7, z * 0.7)
		c = Color(0.42, 0.52, 0.19).lerp(Color(0.55, 0.56, 0.24), dry * 0.6).lerp(Color(0.24, 0.31, 0.14), smoothstep(0.45, 0.8, pn))
		if h > 18.0: c = c.lerp(Color(0.46, 0.46, 0.4), smoothstep(18.0, 34.0, h))
	elif S.is_island(x, z):
		c = Color(0.36, 0.52, 0.18).lerp(Color(0.22, 0.36, 0.12), smoothstep(25.0, 70.0, s) * 0.8)
		if h > 16.0: c = c.lerp(Color(0.31, 0.27, 0.24), smoothstep(16.0, 30.0, h))      # the volcano's dark rock
		if h > 36.0: c = c.lerp(Color(0.2, 0.17, 0.16), smoothstep(36.0, 44.0, h))
	else:
		var fo := S.forest_at(x, z)
		c = Color(0.30, 0.45, 0.15).lerp(Color(0.17, 0.27, 0.10), fo)   # open grass .. shaded forest floor
		if h > 22.0: c = c.lerp(Color(0.42, 0.45, 0.3), smoothstep(22.0, 40.0, h))
	var steep := 1.0 - n.y
	c = c.lerp(Color(0.42, 0.36, 0.28), smoothstep(0.12, 0.3, steep))           # dirt on slopes
	c = c.lerp(Color(0.48, 0.47, 0.44), smoothstep(0.32, 0.5, steep))           # rock on cliffs
	if s < 26.0 and d >= -0.5:
		c = c.lerp(Color(0.80, 0.73, 0.55), smoothstep(26.0, 8.0, s))             # the sea's sandy beaches
	elif d < 9.0:
		c = c.lerp(Color(0.40, 0.33, 0.22), smoothstep(9.0, 2.0, d))            # muddy river banks
		if d < 1.5: c = c.lerp(Color(0.62, 0.55, 0.40), smoothstep(1.5, -0.5, d))
	var pc := PAINT[k] if PAINT.size() > k else Color(0, 0, 0, 0)
	if pc.a > 0.0: c = c.lerp(Color(pc.r, pc.g, pc.b), pc.a)
	if h < -0.3:
		if s < 0.0: c = Color(0.74, 0.68, 0.5).lerp(Color(0.28, 0.36, 0.33), smoothstep(-1.0, -14.0, h))   # the sea floor
		else: c = c.lerp(Color(0.30, 0.27, 0.19), smoothstep(-1.0, -4.0, h))                                # river bed
	return c

func _ground(root: Node3D):
	var mat := ShaderMaterial.new(); mat.shader = load("res://shaders/terrain.gdshader")
	var noise := FastNoiseLite.new(); noise.seed = 5; noise.frequency = 0.04; noise.fractal_octaves = 4
	var img := noise.get_seamless_image(256, 256, false, false, 0.15)
	img.convert(Image.FORMAT_RGB8); img.generate_mipmaps()
	mat.set_shader_parameter("detail", ImageTexture.create_from_image(img))
	var g := Node3D.new(); g.name = "Ground"; root.add_child(g)
	var CH := 32   # cells per chunk (64 m)
	var made := 0
	for cz in (NZ - 1) / CH:
		for cx in (NX - 1) / CH:
			# deep sea, never seen through the water: no ground there
			var top := -1e9
			for b in range(0, CH + 1, 4):
				for a in range(0, CH + 1, 4): top = maxf(top, H[idx(cx * CH + a, cz * CH + b)])
			if top < -9.0: continue
			for lod in 2:
				var step := 1 if lod == 0 else 4
				var mi := MeshInstance3D.new(); mi.name = "G%d_%d_%d" % [cx, cz, lod]
				mi.mesh = _chunk_mesh(cx * CH, cz * CH, CH, step); mi.material_override = mat
				mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
				if lod == 0: mi.visibility_range_end = 230.0; mi.visibility_range_end_margin = 10.0
				else: mi.visibility_range_begin = 230.0; mi.visibility_range_begin_margin = 10.0
				mi.visibility_range_fade_mode = GeometryInstance3D.VISIBILITY_RANGE_FADE_DISABLED
				g.add_child(mi)
			made += 1
	print("ground chunks ", made)

func _chunk_mesh(i0: int, j0: int, n: int, step: int) -> ArrayMesh:
	var m := n / step + 1
	var v := PackedVector3Array(); var nr := PackedVector3Array(); var col := PackedColorArray(); var ix := PackedInt32Array()
	for b in m:
		for a in m:
			var i := i0 + a * step; var j := j0 + b * step
			v.append(Vector3(X0 + i * CELL, H[idx(i, j)], Z0 + j * CELL))
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
	# red: the ground's height; green: 1 where the water is the sea (or close to it)
	var hs := PackedFloat32Array(); hs.resize(NX * NZ * 2)
	for k in NX * NZ:
		hs[k * 2] = H[k]; hs[k * 2 + 1] = clampf((30.0 - C[k]) / 30.0, 0.0, 1.0)
	var img := Image.create_from_data(NX, NZ, false, Image.FORMAT_RGF, hs.to_byte_array())
	mat.set_shader_parameter("heights", ImageTexture.create_from_image(img))
	mat.set_shader_parameter("world_origin", Vector2(X0 - CELL * 0.5, Z0 - CELL * 0.5))
	mat.set_shader_parameter("world_size", Vector2(NX * CELL, NZ * CELL))
	var pm := PlaneMesh.new(); pm.size = Vector2(5200, 6600); pm.subdivide_width = 170; pm.subdivide_depth = 210
	var w := MeshInstance3D.new(); w.name = "Water"; w.mesh = pm; w.material_override = mat
	w.position = Vector3(X0 + WorldShape.SIZE_X * 0.5, WorldShape.WATER, Z0 + WorldShape.SIZE_Z * 0.5)
	w.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	w.extra_cull_margin = 4.0
	root.add_child(w)
	# the dark deep under the open sea (where no sea floor is drawn)
	var ab := MeshInstance3D.new(); ab.name = "Abyss"
	var apm := PlaneMesh.new(); apm.size = Vector2(5200, 6600); ab.mesh = apm
	var am := StandardMaterial3D.new(); am.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED; am.albedo_color = Color(0.015, 0.06, 0.1)
	ab.material_override = am; ab.position = Vector3(w.position.x, -13.0, w.position.z)
	ab.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(ab)

func _collision(root: Node3D):
	var body := StaticBody3D.new(); body.name = "GroundBody"; root.add_child(body)
	var cs := CollisionShape3D.new(); var hs := HeightMapShape3D.new()
	hs.map_width = NX; hs.map_depth = NZ
	var half := PackedFloat32Array(); half.resize(NX * NZ)
	for k in NX * NZ: half[k] = H[k] / CELL
	hs.map_data = half; cs.shape = hs; cs.scale = Vector3(CELL, CELL, CELL)
	cs.position = Vector3(X0 + WorldShape.SIZE_X * 0.5, 0, Z0 + WorldShape.SIZE_Z * 0.5)
	body.add_child(cs)


# ---------------------------------------------------------------- the cities (tools/citygen.gd), the volcano, more piers
const PAINT_COLORS := {"road": Color(0.53, 0.43, 0.31, 0.9), "plaza": Color(0.5, 0.48, 0.44, 0.92), "yard": Color(0.5, 0.42, 0.3, 0.75), "field": Color(0.56, 0.46, 0.22, 0.85)}
func _cities(root: Node3D):
	var cg := CityGen.new()
	cg.S = S; cg.hat = hat
	cities = cg.build_all(root)
	keep_clear.append_array(cg.keep_clear)
	PAINT.resize(NX * NZ)
	PAINT.fill(Color(0, 0, 0, 0))
	# inside the walls: trodden grass
	for id in WorldShape.CITIES:
		var c: Array = WorldShape.CITIES[id]
		_paint(c[0], c[1], c[2], c[3], Color(0.4, 0.45, 0.24, 0.45), 6.0)
	for pdef in cg.paint:
		_paint(pdef[1], pdef[2], pdef[3], pdef[4], PAINT_COLORS.get(pdef[0], Color(0.5, 0.45, 0.35, 0.7)), 2.5)
	print("cities ", cities.keys(), " buildings ", cities.home.buildings.size(), " homes ", cities.home.homes.size(), " nodes ", cities.home.nodes.size())
	# the volcano: a glowing crater and smoke
	var v: Vector3 = S.volcano
	var lava := MeshInstance3D.new(); lava.name = "Lava"
	var cm := CylinderMesh.new(); cm.top_radius = 10.5; cm.bottom_radius = 10.5; cm.height = 0.4; cm.radial_segments = 24; lava.mesh = cm
	var lm := StandardMaterial3D.new(); lm.albedo_color = Color(1.0, 0.35, 0.05); lm.emission_enabled = true; lm.emission = Color(1.0, 0.32, 0.04); lm.emission_energy_multiplier = 2.5
	lava.material_override = lm; lava.position = Vector3(v.x, hat(v.x, v.y) + 1.2, v.y); root.add_child(lava)
	var smoke := CPUParticles3D.new(); smoke.name = "Smoke"
	smoke.amount = 40; smoke.lifetime = 14.0; smoke.preprocess = 14.0; smoke.direction = Vector3.UP; smoke.spread = 12.0
	smoke.initial_velocity_min = 3.0; smoke.initial_velocity_max = 5.0; smoke.gravity = Vector3(0.6, 0.4, 0.2)
	smoke.scale_amount_min = 6.0; smoke.scale_amount_max = 14.0; smoke.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE; smoke.emission_sphere_radius = 5.0
	var q := QuadMesh.new(); q.size = Vector2(1, 1)
	var sm := StandardMaterial3D.new(); sm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED; sm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	sm.albedo_color = Color(0.32, 0.3, 0.3, 0.35); sm.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	var gt := GradientTexture2D.new(); gt.fill = GradientTexture2D.FILL_RADIAL; gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1.0, 0.5)
	var gr := Gradient.new(); gr.set_color(0, Color(1, 1, 1, 1)); gr.set_color(1, Color(1, 1, 1, 0)); gt.gradient = gr; gt.width = 64; gt.height = 64
	sm.albedo_texture = gt; q.material = sm; smoke.mesh = q
	smoke.position = lava.position + Vector3(0, 2, 0); root.add_child(smoke)
	keep_clear.append([v.x, v.y, 30.0])

func _paint(x: float, z: float, hx: float, hz: float, col: Color, soft: float):
	var i0 := ci(x - hx - soft); var i1 := ci(x + hx + soft); var j0 := cj(z - hz - soft); var j1 := cj(z + hz + soft)
	for j in range(maxi(0, j0), mini(NZ, j1 + 1)):
		for i in range(maxi(0, i0), mini(NX, i1 + 1)):
			var px := X0 + i * CELL; var pz := Z0 + j * CELL
			var dx := maxf(0.0, absf(px - x) - hx); var dz := maxf(0.0, absf(pz - z) - hz)
			var w := (1.0 - smoothstep(0.0, soft, sqrt(dx * dx + dz * dz))) * col.a
			if w <= 0.0: continue
			var k := j * NX + i
			var old := PAINT[k]
			var a := old.a + w * (1.0 - old.a)
			var c := Color(col.r, col.g, col.b).lerp(Color(old.r, old.g, old.b), old.a * (1.0 - w) / maxf(0.001, a)) if old.a > 0.0 else Color(col.r, col.g, col.b)
			PAINT[k] = Color(c.r, c.g, c.b, a)

# more piers by your city for its fleet: at a fixed x along the jungle's coast
func _pier_at(hb: Node3D, x: float, id: String) -> Dictionary:
	var dir := 1.0
	var zc := S.coast_jungle(x)
	var shore := INF
	var z := zc - 80.0
	for q in 120:
		if hat(x, z) < 0.15: shore = z; break
		z += 2.0
	if shore == INF: return {}
	var L := 0.0
	while L < 80.0 and hat(x, shore + L) > -4.0: L += 1.0
	if L >= 80.0: return {}
	var L2: float = ceil((L + 8.0) / PIER_PIECE) * PIER_PIECE
	var hp := {"id": id, "x": x, "shore": shore, "len": L, "dir": dir, "z0": shore - 6.0, "z1": shore - 6.0 + L2, "top": PIER_TOP, "yaw": 0.0}
	hp["ship"] = [x + 9.0, float(hp.z1) - 7.0, 0.0]
	_build_pier(hb, hp)
	return hp

# ---------- the harbors: a pier from the beach out to deep water, a rowboat and a ship ----------
const PIER_TOP := 1.05       # the planks, above the water
const PIER_PIECE := 5.0      # one platform piece (Kenney's dock, scaled)
func _harbors(root: Node3D):
	var hb := Node3D.new(); hb.name = "Harbors"; root.add_child(hb)
	places["harbors"] = []
	var jungle := _find_harbor(10.0, 230.0, 1.0)
	var neww := _find_harbor(-160.0, 120.0, -1.0)
	for e in [[jungle, "jungle", "נמל הג׳ונגל"], [neww, "new", "נמל העולם החדש"]]:
		var hp: Dictionary = e[0]
		if hp.is_empty(): print("NO HARBOR for ", e[1]); continue
		hp["id"] = e[1]; hp["name"] = e[2]
		_build_pier(hb, hp)
		places.harbors.append(hp)
	# two more piers east of the jungle's harbor: your city's fleet moors there
	places["piers"] = []
	if not jungle.is_empty():
		for k in 2:
			var px: float = float(jungle.x) + 42.0 * (k + 1)
			var pp := _pier_at(hb, px, "home_%d" % (k + 2))
			if not pp.is_empty(): places.piers.append(pp)
	# the wreck of an old ship on the big island's beach
	var isl: Vector3 = S.islands[0]
	var best := Vector3.ZERO; var bd := 1e9
	for a in 48:
		var ang := a * TAU / 48.0
		for r in range(int(isl.z) - 30, int(isl.z) + 30, 2):
			var p := Vector2(isl.x + cos(ang) * r, isl.y + sin(ang) * r)
			var h := hat(p.x, p.y)
			if absf(h - (-0.6)) < bd: bd = absf(h + 0.6); best = Vector3(p.x, h, p.y)
	var wreck: Node3D = load("res://assets/pirate/ship-wreck.glb").instantiate()
	wreck.name = "Wreck"; wreck.scale = Vector3.ONE * 1.7
	wreck.position = Vector3(best.x, -0.9, best.z); wreck.rotation = Vector3(0.08, atan2(best.x - isl.x, best.z - isl.y) + 1.3, 0.12)
	hb.add_child(wreck)
	keep_clear.append([best.x, best.z, 14.0])
	places["wreck"] = [best.x, best.z]
	places["start"] = [64.0, 24.0]
	keep_clear.append([64.0, 24.0, 7.0])   # a clear spot to wake up in

# along the coast between x_from and x_to: where deep water is closest to a gentle beach, far from the river mouth.
# dir: +1 when the sea is toward +z (the jungle's coast), -1 when toward -z (the new world's)
func _find_harbor(x_from: float, x_to: float, dir: float) -> Dictionary:
	var best := {}; var bs := -1e9
	var x := x_from
	while x <= x_to:
		var zc := S.coast_jungle(x) if dir > 0.0 else S.coast_new(x)
		# the shore: the first point, walking toward the sea, where the ground goes under the water
		var shore := INF
		var z := zc - 80.0 * dir
		for q in 100:
			if hat(x, z) < 0.15: shore = z; break
			z += 2.0 * dir
		if shore == INF: x += 6.0; continue
		# how long a pier must be to reach water 4 m deep
		var L := 0.0
		while L < 70.0 and hat(x, shore + L * dir) > -4.0: L += 1.0
		if L >= 70.0: x += 6.0; continue
		var land_ok := true
		for q in range(4, 28, 4):
			var hh := hat(x, shore - q * dir)
			if hh < 0.1 or hh > 8.0: land_ok = false
		var river := D[idx(ci(x), cj(shore - 10.0 * dir))]
		if not land_ok or S.channel(x, shore - 10.0 * dir) < 30.0: x += 6.0; continue
		var sc := -absf(L - 22.0) - absf(x - (x_from + x_to) * 0.5) * 0.05
		if river < 0.0: sc -= 100.0
		if sc > bs: bs = sc; best = {"x": x, "shore": shore, "len": L, "dir": dir}
		x += 6.0
	if best.is_empty(): return best
	var L2: float = ceil((best.len + 8.0) / PIER_PIECE) * PIER_PIECE
	var z0: float = best.shore - 6.0 * dir           # the pier starts on the sand
	var z1: float = z0 + L2 * dir
	best["z0"] = z0; best["z1"] = z1; best["top"] = PIER_TOP
	best["yaw"] = 0.0 if dir > 0.0 else PI          # facing the sea
	# the ship lies along the pier's far end; the rowboat beside the pier, in shallow water
	var sx: float = best.x + 9.0
	best["ship"] = [sx, z1 - 7.0 * dir, best.yaw]
	var rz: float = best.shore + 6.0 * dir
	for q in 30:
		if hat(best.x - 6.0, rz) < -0.7: break
		rz += 1.0 * dir
	best["row"] = [best.x - 6.0, rz, best.yaw + 0.25]
	return best

var pile_mesh: CylinderMesh
func _build_pier(hb: Node3D, hp: Dictionary):
	var dock: PackedScene = load("res://assets/pirate/structure-platform-dock.glb")
	if pile_mesh == null:
		pile_mesh = CylinderMesh.new(); pile_mesh.top_radius = 0.16; pile_mesh.bottom_radius = 0.18; pile_mesh.height = 1.0; pile_mesh.radial_segments = 6; pile_mesh.rings = 1
		var wm := StandardMaterial3D.new(); wm.albedo_color = Color(0.36, 0.25, 0.16); wm.roughness = 0.9; pile_mesh.material = wm
	var dir: float = hp.dir
	var n := int(absf(float(hp.z1) - float(hp.z0)) / PIER_PIECE)
	var k := PIER_PIECE / 2.5
	for q in n:
		var p: Node3D = dock.instantiate()
		p.scale = Vector3(k, k, k)
		var zc: float = float(hp.z0) + (q + 0.5) * PIER_PIECE * dir
		p.position = Vector3(hp.x, PIER_TOP - 0.70 * k, zc)    # (the planks are 0.7 up in the model)
		p.rotation.y = 0.0 if dir > 0.0 else PI
		hb.add_child(p)
		# wooden piles from the planks down into the sea floor
		for side in [-1.0, 1.0]:
			var px: float = hp.x + side * 2.2
			var floor_y := hat(px, zc)
			if floor_y > PIER_TOP - 1.6: continue
			var pile := MeshInstance3D.new(); pile.mesh = pile_mesh
			var top := PIER_TOP - 0.9
			pile.position = Vector3(px, (top + floor_y) * 0.5, zc); pile.scale = Vector3(1, top - floor_y, 1)
			hb.add_child(pile)
	# barrels and crates on the beach at its start
	var props := ["barrel", "chest", "crate", "crate-bottles", "barrel"]
	for q in props.size():
		var pr: Node3D = (load("res://assets/pirate/%s.glb" % props[q]) as PackedScene).instantiate()
		var px: float = hp.x + (-5.0 if q % 2 == 0 else 5.0) + rng.randf_range(-1.0, 1.0)
		var pz: float = float(hp.z0) - (2.0 + q * 2.2) * dir
		pr.scale = Vector3.ONE * 1.6; pr.position = Vector3(px, hat(px, pz), pz); pr.rotation.y = rng.randf() * TAU
		hb.add_child(pr)
	var mid := (float(hp.z0) + float(hp.z1)) * 0.5
	keep_clear.append([hp.x, mid, absf(float(hp.z1) - float(hp.z0)) * 0.5 + 12.0])
	keep_clear.append([hp.x, float(hp.z0) - 14.0 * dir, 16.0])
	keep_clear.append([hp.ship[0], hp.ship[1], 14.0])
	if hp.has("row"): keep_clear.append([hp.row[0], hp.row[1], 6.0])

# ---------- the plants ----------
# name, files, scale range, grid cell (m), rule, shadows, how far it is drawn, trunk radius
var KINDS := [
	["tree_common", ["CommonTree_1", "CommonTree_3", "CommonTree_5"], Vector2(2.0, 3.3), 8.5, "forest", true, 460.0, 0.55],
	["tree_twisted", ["TwistedTree_1", "TwistedTree_3"], Vector2(0.85, 1.25), 21.0, "giant", true, 520.0, 0.9],
	["palm", ["@palm"], Vector2(4.5, 7.5), 8.0, "palm", true, 360.0, 0.35],
	["pine", ["Pine_5", "Pine_1", "Pine_4"], Vector2(1.5, 2.4), 9.0, "pine", true, 520.0, 0.5],
	["tree_plain", ["CommonTree_2", "CommonTree_4"], Vector2(1.6, 2.4), 24.0, "plain_tree", true, 520.0, 0.5],
	["dead_tree", ["DeadTree_3"], Vector2(0.9, 1.2), 40.0, "dead", true, 420.0, 0.5],
	["bush", ["Bush_Common", "Bush_Common_Flowers"], Vector2(1.0, 2.0), 4.5, "under", true, 150.0, 0.0],
	["fern", ["Fern_1"], Vector2(1.3, 2.4), 3.0, "fern", false, 80.0, 0.0],
	["plant_big", ["Plant_1_Big", "Plant_7_Big"], Vector2(1.0, 1.8), 4.0, "fern", false, 90.0, 0.0],
	["plant", ["Plant_1", "Plant_7", "Flower_3_Group", "Flower_4_Group", "Mushroom_Common", "Mushroom_Laetiporus"], Vector2(0.8, 1.4), 3.0, "floor", false, 55.0, 0.0],
	["grass", ["Grass_Common_Tall", "Grass_Wispy_Tall"], Vector2(0.9, 1.5), 1.7, "grass", false, 45.0, 0.0],
	["meadow", ["Grass_Common_Short", "Grass_Wispy_Short"], Vector2(0.45, 0.8), 1.6, "meadow", false, 45.0, 0.0],
	["flower", ["Flower_3_Single", "Flower_4_Group", "Clover_1", "Clover_2"], Vector2(0.7, 1.2), 4.2, "flower", false, 60.0, 0.0],
	["pebble", ["Pebble_Round_1", "Pebble_Round_3", "Pebble_Square_2"], Vector2(1.0, 2.2), 5.0, "pebble", false, 60.0, 0.0],
	["rock", ["Rock_Medium_1", "Rock_Medium_2", "Rock_Medium_3"], Vector2(0.5, 1.4), 16.0, "rock", true, 240.0, 0.0],
]
# how often each variant is picked (the rest: equal)
const WEIGHTS := {"bush": [4, 1], "plant": [3, 3, 1, 1, 1, 1], "pine": [3, 2, 2], "flower": [2, 1, 3, 3]}

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

# 0..1: how likely this kind grows here. d: meters from any water, s: from the sea's coast
func _wants(rule: String, x: float, z: float, h: float, d: float, s: float, n: Vector3) -> float:
	var nw := S.is_new_world(z)
	var isl := not nw and S.is_island(x, z)
	var fo := S.forest_at(x, z)
	var sand := s < 14.0
	var lost := isl and Vector2(x - 205.0, z - 960.0).length() < 178.0   # the lost island: a jungle of its own
	match rule:
		"forest":
			if lost: return 0.0 if s < 22.0 or h > 24.0 or n.y < 0.8 else 0.5 + fo * 0.3
			if nw or isl: return 0.0
			return 0.0 if d < 6.0 or n.y < 0.78 or h > 34.0 else 0.15 + fo * 0.85
		"giant":
			if lost: return 0.0 if s < 45.0 or h > 20.0 or n.y < 0.86 else smoothstep(0.5, 0.9, fo) * 0.6
			if nw or isl: return 0.0
			return 0.0 if d < 14.0 or n.y < 0.85 or h > 26.0 else smoothstep(0.55, 0.9, fo) * 0.75
		"palm":
			if nw or d < 3.0 or n.y < 0.85 or h > 18.0: return 0.0
			if isl: return 0.5
			if s < 60.0: return 0.45
			return 0.55 if d < 26.0 else 0.06 * (1.0 - fo)
		"pine":
			if not nw or d < 5.0 or n.y < 0.72 or h > 44.0: return 0.0
			return smoothstep(0.42, 0.75, S.pines_at(x, z, h)) * 0.9
		"plain_tree":
			if not nw or d < 8.0 or n.y < 0.85: return 0.0
			return 0.3 * (1.0 - smoothstep(0.35, 0.6, S.pines_at(x, z, h))) * smoothstep(0.1, 0.6, S.forest.get_noise_2d(x * 1.7, z * 1.7) + 0.4)
		"dead":
			if not nw or h < 16.0 or n.y < 0.8: return 0.0
			return 0.12
		"under":
			if sand or d < 1.5 or n.y < 0.7: return 0.0
			if nw: return 0.06 + 0.12 * smoothstep(0.4, 0.8, S.pines_at(x, z, h))
			if isl: return 0.3
			return 0.25 + fo * 0.55
		"fern":
			if lost and not sand and h < 24.0 and n.y > 0.75: return 0.3
			if nw or isl or sand or d < 1.5 or n.y < 0.7: return 0.0
			return 0.25 + fo * 0.55
		"floor":
			if lost and not sand and h < 22.0 and n.y > 0.78: return 0.28
			if nw or isl or sand or d < 1.0 or n.y < 0.75: return 0.0
			return 0.18 + fo * 0.25
		"grass":
			if nw or sand or d < 0.5 or n.y < 0.8 or (isl and h > 20.0): return 0.0
			if isl: return 0.55
			return (1.0 - fo) * 0.75 + (0.35 if d < 12.0 else 0.0)
		"meadow":
			if not nw or sand or d < 0.5 or n.y < 0.8 or h > 26.0: return 0.0
			return 0.85 * (1.0 - 0.7 * smoothstep(0.45, 0.8, S.pines_at(x, z, h)))
		"flower":
			if not nw or sand or d < 1.0 or n.y < 0.85: return 0.0
			return 0.35 * (1.0 - smoothstep(0.4, 0.7, S.pines_at(x, z, h)))
		"pebble":
			if s < 1.0 or s > 22.0: return 0.0
			return 0.22
		"rock":
			if d < -0.5: return 0.0
			var r := (0.25 if d < 8.0 else 0.0) + smoothstep(0.1, 0.35, 1.0 - n.y) * 0.8 + 0.04
			if nw: r += smoothstep(14.0, 30.0, h) * 0.5
			if isl: r += smoothstep(16.0, 30.0, h) * 0.45
			return r
	return 0.0

func _cleared(x: float, z: float) -> bool:
	for c in keep_clear:
		if Vector2(x - c[0], z - c[1]).length() < c[2]: return true
	return false

func _plants(root: Node3D):
	var p := Node3D.new(); p.name = "Plants"; root.add_child(p)
	rng.seed = 1234
	for k in KINDS:
		# the area each group covers: small for plants seen only up close, since a group is hidden by its middle's distance
		var VC := 64.0 if k[6] > 150.0 else (40.0 if k[0] in ["grass", "meadow"] else 64.0)
		var meshes := []
		for nm in k[1]:
			var mx := _mesh_of(nm)
			if k[0] in ["bush", "fern", "plant_big", "plant", "grass", "meadow", "flower"]: mx[0] = _faded(mx[0], 3.0 if k[0] in ["bush", "plant_big", "plant"] else 1.8)
			meshes.append(mx)
		var buckets := {}
		var cell: float = k[3]
		var cnx := int(WorldShape.SIZE_X / cell); var cnz := int(WorldShape.SIZE_Z / cell)
		for b in cnz:
			for a in cnx:
				var x := X0 + (a + rng.randf()) * cell; var z := Z0 + (b + rng.randf()) * cell
				var i := ci(x); var j := cj(z)
				var kk := idx(i, j)
				if H[kk] < 0.15: continue
				var h := hat(x, z); var n := normal_at(i, j)
				if h < 0.15: continue
				if rng.randf() > _wants(k[4], x, z, h, D[kk], C[kk], n): continue
				if _cleared(x, z): continue
				var vi := rng.randi() % meshes.size()
				if WEIGHTS.has(k[0]):
					var wl: Array = WEIGHTS[k[0]]; var tot := 0
					for wv in wl: tot += wv
					var r := rng.randi() % tot; vi = 0
					while r >= wl[vi]: r -= wl[vi]; vi += 1
				var s := rng.randf_range(k[2].x, k[2].y)
				var key := Vector3i(int((x - X0) / VC), int((z - Z0) / VC), vi)
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
