extends SceneTree
# prints a model's meshes, surfaces, materials and skeleton scale: godot --headless --path . --script tools/probe.gd -- res://file
func _init():
	for f in OS.get_cmdline_user_args():
		var n: Node = load(f).instantiate()
		print("== ", f)
		for m in n.find_children("*", "MeshInstance3D", true, false):
			var mi := m as MeshInstance3D
			var line := "  mesh %s skin=%s aabb=%s xform=%s" % [mi.name, mi.skin != null, mi.mesh.get_aabb().size, ModelUtil.rel_xform(mi, n).basis.get_scale()]
			print(line)
			for s in mi.mesh.get_surface_count():
				var mat := mi.mesh.surface_get_material(s)
				var arr := mi.mesh.surface_get_arrays(s)
				print("    surf ", s, " mat=", mat.resource_name if mat else "-", " col=", (mat as StandardMaterial3D).albedo_color if mat is StandardMaterial3D else "", " tex=", (mat as StandardMaterial3D).albedo_texture != null if mat is StandardMaterial3D else "", " verts=", arr[0].size(), " vcol=", arr[Mesh.ARRAY_COLOR] != null)
		for sk in n.find_children("*", "Skeleton3D", true, false):
			print("  skeleton ", n.get_path_to(sk), " scale ", ModelUtil.rel_xform(sk, n).basis.get_scale(), " bones ", sk.get_bone_count())
		var ap: AnimationPlayer = n.find_child("AnimationPlayer", true, false)
		if ap: print("  anims ", ap.get_animation_list())
		n.free()
	quit()
