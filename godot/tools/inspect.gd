extends SceneTree
# prints, for each model: its size, meshes, and the animations it has
func _init():
	var dirs = ["res://assets/nf", "res://assets/animals"]
	for d in dirs:
		for f in DirAccess.get_files_at(d):
			if not (f.ends_with(".fbx") or f.ends_with(".gltf") or f.ends_with(".glb")): continue
			var ps: PackedScene = load(d + "/" + f)
			if ps == null: print("FAIL ", f); continue
			var n = ps.instantiate()
			var ap: AnimationPlayer = n.find_child("AnimationPlayer", true, false)
			var anims = ap.get_animation_list() if ap else []
			var aabb := AABB(); var first := true; var meshes := 0
			for m in n.find_children("*", "MeshInstance3D", true, false):
				meshes += 1
				var b = m.global_transform * m.get_aabb() if m.is_inside_tree() else m.transform * m.get_aabb()
				if first: aabb = b; first = false
				else: aabb = aabb.merge(b)
			print(f, " meshes=", meshes, " size=", aabb.size.snapped(Vector3(0.01,0.01,0.01)), " anims=", anims)
			n.free()
	quit()
