class_name PoseBake
# Bakes a posed model into one still mesh on the CPU: its skinned meshes as the skeleton holds them at a moment of an
# animation, and the things that hang on bones (helmets, swords, shields). Far crowds are drawn with these, many at
# once, in MultiMeshes. One surface per material (a KayKit model has one), no material set (each look gives its own).

# root: where the result's origin is (usually the avatar or the model holder); anim: full name; t: seconds into it
static func bake(root: Node3D, ap: AnimationPlayer, anim: String, t: float) -> ArrayMesh:
	var sk: Skeleton3D = null
	var sks := root.find_children("*", "Skeleton3D", true, false)
	if sks.size() > 0: sk = sks[0]
	if ap and anim != "":
		ap.play(anim, 0.0, 1.0); ap.seek(t, true); ap.advance(0.0)
		if sk and sk.has_method("force_update_all_bone_transforms"): sk.force_update_all_bone_transforms()
	var groups := {}   # material -> [verts, normals, uvs, indices]
	for m in root.find_children("*", "MeshInstance3D", true, false):
		var mi := m as MeshInstance3D
		if mi.mesh == null or mi.is_queued_for_deletion() or not mi.visible or _dying(mi, root): continue
		var skinned := mi.skin != null and sk != null
		var to_root: Transform3D
		var binds: Array = []
		if skinned:
			to_root = ModelUtil.rel_xform(sk, root)
			for i in mi.skin.get_bind_count():
				var bi := mi.skin.get_bind_bone(i)
				if bi < 0: bi = sk.find_bone(mi.skin.get_bind_name(i))
				binds.append(sk.get_bone_global_pose(maxi(bi, 0)) * mi.skin.get_bind_pose(i))
		else:
			to_root = _attached_xform(mi, root, sk)
		for s in mi.mesh.get_surface_count():
			var arr := mi.mesh.surface_get_arrays(s)
			var v: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
			var nrm: PackedVector3Array = arr[Mesh.ARRAY_NORMAL] if arr[Mesh.ARRAY_NORMAL] != null else PackedVector3Array()
			var uv: PackedVector2Array = arr[Mesh.ARRAY_TEX_UV] if arr[Mesh.ARRAY_TEX_UV] != null else PackedVector2Array()
			var ix: PackedInt32Array = arr[Mesh.ARRAY_INDEX] if arr[Mesh.ARRAY_INDEX] != null else PackedInt32Array()
			var mat: Material = mi.material_override if mi.material_override else mi.mesh.surface_get_material(s)
			var key = mat
			if not groups.has(key): groups[key] = [PackedVector3Array(), PackedVector3Array(), PackedVector2Array(), PackedInt32Array()]
			var g: Array = groups[key]
			var base_i: int = g[0].size()
			var n := v.size()
			if skinned and arr[Mesh.ARRAY_BONES] != null:
				var bones = arr[Mesh.ARRAY_BONES]; var w: PackedFloat32Array = arr[Mesh.ARRAY_WEIGHTS]
				var per: int = bones.size() / maxi(1, n)
				for i in n:
					var p := Vector3.ZERO; var q := Vector3.ZERO
					for k in per:
						var wk := w[i * per + k]
						if wk <= 0.0: continue
						var bx: Transform3D = binds[clampi(int(bones[i * per + k]), 0, binds.size() - 1)]
						p += (bx * v[i]) * wk
						if nrm.size() > i: q += (bx.basis * nrm[i]) * wk
					g[0].append(to_root * p)
					g[1].append((to_root.basis * q).normalized() if nrm.size() > i else Vector3.UP)
			else:
				for i in n:
					g[0].append(to_root * v[i])
					g[1].append((to_root.basis * nrm[i]).normalized() if nrm.size() > i else Vector3.UP)
			if uv.size() == n: g[2].append_array(uv)
			else:
				for i in n: g[2].append(Vector2.ZERO)
			if ix.size() > 0:
				for i in ix: g[3].append(base_i + i)
			else:
				for i in n: g[3].append(base_i + i)
	var am := ArrayMesh.new()
	for key in groups:
		var g: Array = groups[key]
		var a := []; a.resize(Mesh.ARRAY_MAX)
		a[Mesh.ARRAY_VERTEX] = g[0]; a[Mesh.ARRAY_NORMAL] = g[1]; a[Mesh.ARRAY_TEX_UV] = g[2]; a[Mesh.ARRAY_INDEX] = g[3]
		am.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, a, [], {}, Mesh.ARRAY_FLAG_COMPRESS_ATTRIBUTES)
		if key is Material: am.surface_set_material(am.get_surface_count() - 1, key)
	return am

static func _dying(n: Node, root: Node) -> bool:
	var c := n
	while c != null and c != root:
		if c.is_queued_for_deletion(): return true
		c = c.get_parent()
	return false

# a mesh that hangs on a bone: the bone's pose now, not the node's (which updates only later)
static func _attached_xform(mi: Node3D, root: Node3D, sk: Skeleton3D) -> Transform3D:
	var c: Node = mi
	var below := Transform3D.IDENTITY
	while c != null and c != root:
		if c is BoneAttachment3D and sk != null:
			var bi := sk.find_bone((c as BoneAttachment3D).bone_name)
			if bi >= 0: return ModelUtil.rel_xform(sk, root) * sk.get_bone_global_pose(bi) * below
		if c is Node3D: below = (c as Node3D).transform * below
		c = c.get_parent()
	return ModelUtil.rel_xform(mi, root)
