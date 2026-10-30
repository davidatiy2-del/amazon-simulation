extends Node3D
# One picture per model, each framed by its real (mesh) size: godot --path . res://tools/gallery.tscn -- "res://a,res://b" out_dir
func _ready():
	var args := OS.get_cmdline_user_args()
	var files: PackedStringArray = args[0].split(",")
	var out := args[1]
	var env := WorldEnvironment.new(); var e := Environment.new(); e.background_mode = Environment.BG_COLOR; e.background_color = Color(0.55, 0.7, 0.85)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; e.ambient_light_color = Color(0.75, 0.78, 0.82); e.ambient_light_energy = 0.7; env.environment = e; add_child(env)
	var l := DirectionalLight3D.new(); l.rotation_degrees = Vector3(-50, 35, 0); add_child(l)
	var cam := Camera3D.new(); add_child(cam); cam.fov = 40.0
	for i in files.size():
		var n: Node3D = load(files[i]).instantiate(); add_child(n)
		var ap: AnimationPlayer = n.find_child("AnimationPlayer", true, false)
		if ap and ap.get_animation_list().size(): ap.play(ap.get_animation_list()[0])
		await get_tree().process_frame
		var bb := AABB(); var first := true
		for m in n.find_children("*", "MeshInstance3D", true, false):
			var b: AABB = m.global_transform * m.get_aabb()
			if first: bb = b; first = false
			else: bb = bb.merge(b)
		if n.find_children("*", "Skeleton3D", true, false).size() > 0:
			var lb := ModelUtil.body_bounds(n); bb = n.global_transform * lb
		var c := bb.get_center(); var r := bb.size.length() * 0.5
		cam.position = c + Vector3(0.9, 0.55, 1.0).normalized() * r * 3.0
		cam.near = r * 0.05; cam.far = r * 20.0
		cam.look_at(c)
		print(files[i].get_file(), " mesh size ", bb.size)
		for k in 3: await get_tree().process_frame
		get_viewport().get_texture().get_image().save_png("%s/g%02d.png" % [out, i])
		n.queue_free()
		await get_tree().process_frame
	get_tree().quit()
