class_name ModelUtil
# Helpers for imported models: their real size (also for skinned models, where the mesh box is not reliable),
# scaling to a height in meters, and finding the animation player.

# the transform of `n` relative to `root`, without the tree
static func rel_xform(n: Node, root: Node) -> Transform3D:
	var t := Transform3D.IDENTITY
	var c := n
	while c != null and c != root:
		if c is Node3D: t = (c as Node3D).transform * t
		c = c.get_parent()
	return t

# the box around a model in the space of its root: bones for skinned meshes, mesh boxes for the rest
static func bounds(root: Node) -> AABB:
	var pts: PackedVector3Array = []
	for sk in root.find_children("*", "Skeleton3D", true, false):
		var sx := rel_xform(sk, root)
		for i in sk.get_bone_count():
			pts.append(sx * sk.get_bone_global_rest(i).origin)
	for m in root.find_children("*", "MeshInstance3D", true, false):
		if m.skin != null or (m.get_parent() is Skeleton3D and m.skeleton != NodePath()): continue
		var mx := rel_xform(m, root); var bb: AABB = m.get_aabb()
		for k in 8: pts.append(mx * bb.get_endpoint(k))
	if pts.is_empty(): return AABB()
	var bb := AABB(pts[0], Vector3.ZERO)
	for p in pts: bb = bb.expand(p)
	return bb

static func find_player(root: Node) -> AnimationPlayer:
	return root.find_child("AnimationPlayer", true, false) as AnimationPlayer

# the box of a model from its body bones only (helper bones for IK stick out of the body)
static func body_bounds(root: Node) -> AABB:
	var pts: PackedVector3Array = []
	for sk in root.find_children("*", "Skeleton3D", true, false):
		var sx := rel_xform(sk, root)
		for i in sk.get_bone_count():
			var nm: String = sk.get_bone_name(i)
			if nm.begins_with("Pole") or nm.begins_with("IK") or nm.begins_with("FF") or nm.begins_with("PT") or nm == "Root": continue
			pts.append(sx * sk.get_bone_global_rest(i).origin)
	if pts.is_empty(): return bounds(root)
	var bb := AABB(pts[0], Vector3.ZERO)
	for p in pts: bb = bb.expand(p)
	return bb

# a model, scaled so its body is `size` meters along `axis` (1: height, 2: length), standing on y = 0, inside a holder
static func make(path: String, size: float, axis := 1) -> Node3D:
	var holder := Node3D.new()
	var n: Node3D = load(path).instantiate()
	holder.add_child(n)
	var bb := body_bounds(n)
	var k := size / maxf(0.001, bb.size[axis])
	n.scale = Vector3.ONE * k
	n.position = Vector3(-(bb.position.x + bb.size.x * 0.5) * k, -bb.position.y * k, -(bb.position.z + bb.size.z * 0.5) * k)
	return holder

# the animation whose name is `short` or ends with "|short"
static func anim(ap: AnimationPlayer, short: String) -> String:
	if ap == null: return ""
	for a in ap.get_animation_list():
		if a == short or a.ends_with("|" + short): return a
	return ""

static func set_loops(ap: AnimationPlayer, shorts: Array) -> void:
	for s in shorts:
		var a := anim(ap, s)
		if a != "": ap.get_animation(a).loop_mode = Animation.LOOP_LINEAR

# gives every surface named in `colors` (material name -> color) a flat colored copy
static func recolor(root: Node, colors: Dictionary) -> void:
	for m in root.find_children("*", "MeshInstance3D", true, false):
		var mi := m as MeshInstance3D
		for s in mi.mesh.get_surface_count():
			var mat := mi.mesh.surface_get_material(s)
			if mat == null or not colors.has(mat.resource_name): continue
			var c: StandardMaterial3D = (mat as StandardMaterial3D).duplicate() if mat is StandardMaterial3D else StandardMaterial3D.new()
			c.albedo_color = colors[mat.resource_name]; c.albedo_texture = null
			mi.set_surface_override_material(s, c)
