class_name CreatureMesh
# Simple sea animals built from code: a smooth body lofted along its length (rings of points), and flat fins.
# Colors are painted per vertex: dark on the back, light on the belly.

# rings: [t, radius, height factor] from the tail (t = 0) to the nose (t = 1); length in meters
static func body(st: SurfaceTool, rings: Array, length: float, top: Color, belly: Color, segs := 10) -> void:
	var pts := []   # per ring: list of [pos, normal]
	for r in rings:
		var z: float = (float(r[0]) - 0.5) * length
		var ring := []
		for s in segs:
			var a := s * TAU / segs
			var n := Vector3(sin(a), cos(a) * float(r[2]), 0).normalized()
			var p := Vector3(sin(a) * float(r[1]), cos(a) * float(r[1]) * float(r[2]), z)
			ring.append([p, n])
		pts.append(ring)
	for i in pts.size() - 1:
		for s in segs:
			var s2 := (s + 1) % segs
			var a: Array = pts[i][s]; var b: Array = pts[i][s2]; var c: Array = pts[i + 1][s2]; var d: Array = pts[i + 1][s]
			for v in [a, d, c, a, c, b]:
				var n: Vector3 = v[1]
				st.set_color(belly.lerp(top, smoothstep(-0.35, 0.35, n.y)))
				st.set_normal(n)
				st.add_vertex(v[0])

static func fin(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, col: Color) -> void:
	var n := (b - a).cross(c - a).normalized()
	for v in [a, b, c]:
		st.set_color(col); st.set_normal(n); st.add_vertex(v)
	for v in [a, c, b]:
		st.set_color(col); st.set_normal(-n); st.add_vertex(v)

static func material() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.vertex_color_use_as_albedo = true; m.roughness = 0.45; m.cull_mode = BaseMaterial3D.CULL_DISABLED; m.specular_mode = BaseMaterial3D.SPECULAR_SCHLICK_GGX
	return m

# a bottlenose dolphin, 2.4 m, facing +z
static func dolphin() -> ArrayMesh:
	var st := SurfaceTool.new(); st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var top := Color(0.36, 0.41, 0.47); var belly := Color(0.86, 0.88, 0.9)
	var L := 2.4
	body(st, [[0.0, 0.04, 0.6], [0.08, 0.07, 0.9], [0.25, 0.15, 1.05], [0.45, 0.25, 1.1], [0.62, 0.28, 1.1], [0.78, 0.24, 1.05],
		[0.88, 0.16, 0.95], [0.93, 0.08, 0.8], [1.0, 0.03, 0.7]], L, top, belly)
	var fc := top.darkened(0.1)
	# the dorsal fin, curved back
	fin(st, Vector3(0, 0.26, 0.05), Vector3(0, 0.27, -0.35), Vector3(0, 0.58, -0.32), fc)
	# the flukes, flat
	fin(st, Vector3(0, 0, -1.12), Vector3(0.38, 0.0, -1.38), Vector3(0.05, 0.0, -1.22), fc)
	fin(st, Vector3(0, 0, -1.12), Vector3(-0.05, 0.0, -1.22), Vector3(-0.38, 0.0, -1.38), fc)
	# the flippers
	fin(st, Vector3(0.2, -0.12, 0.35), Vector3(0.48, -0.22, 0.12), Vector3(0.22, -0.14, 0.18), fc)
	fin(st, Vector3(-0.2, -0.12, 0.35), Vector3(-0.22, -0.14, 0.18), Vector3(-0.48, -0.22, 0.12), fc)
	var m := st.commit(); m.surface_set_material(0, material())
	return m
