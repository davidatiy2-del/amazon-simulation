extends Node3D
# Bakes the crowd's statues ahead (scripts/people/crowd.gd): every shape a person or a beast of the cities can have,
# in every pose, into assets/bakes. Run with a renderer (the meshes are not kept without one):
#   godot --path . --rendering-driver vulkan res://tools/bake_crowd.tscn
func _ready():
	var crowd := Crowd.new(); add_child(crowd)
	DirAccess.make_dir_recursive_absolute("res://assets/bakes")
	# every look of every role in every faction, the chiefs, the horses, the beasts
	for f in Kingdoms.FACTIONS:
		for role in Kingdoms.ROLES:
			for v in 6: Kingdoms.register_look(crowd, f, role, v)
		crowd.register("chief_" + f, {"type": "person", "look": War._chief_look(f)})
		for c in Kingdoms.HORSE_COLORS.size():
			crowd.register("horse_%s_%d" % [f, c], Kingdoms.horse_def(c, Kingdoms.FACTIONS[f].color))
	for k in Kingdoms.BEASTS: crowd.register("beast_" + k, Kingdoms.beast_def(k))
	var done := {}
	var n := 0
	var t0 := Time.get_ticks_msec()
	for key in crowd.looks:
		var lk: Dictionary = crowd.looks[key]
		var sh: String = lk.shape
		if done.has(sh): continue
		done[sh] = true
		var pu: Node3D = crowd._make_raw(lk)
		add_child(pu)
		for i in 2: await get_tree().process_frame
		for p in Crowd.POSES:
			var mesh := Crowd.bake_pose(pu, p)
			if lk.type == "person":
				for s in mesh.get_surface_count(): mesh.surface_set_material(s, null)
			ResourceSaver.save(mesh, "res://assets/bakes/%s_%s.res" % [sh, p], ResourceSaver.FLAG_COMPRESS)
			n += 1
		pu.queue_free()
		await get_tree().process_frame
	print("baked ", done.size(), " shapes, ", n, " meshes in ", (Time.get_ticks_msec() - t0) / 1000, " s")
	get_tree().quit()
