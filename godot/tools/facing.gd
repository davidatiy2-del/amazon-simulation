extends Node3D
# which way each animal kind faces at face = 0 (it should be +z, toward the red ball)
func _ready():
	var out := OS.get_cmdline_user_args()[0]
	var env := WorldEnvironment.new(); var e := Environment.new(); e.background_mode = Environment.BG_COLOR; e.background_color = Color(0.55, 0.7, 0.85)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; e.ambient_light_color = Color(0.8, 0.8, 0.8); e.ambient_light_energy = 0.8; env.environment = e; add_child(env)
	var l := DirectionalLight3D.new(); l.rotation_degrees = Vector3(-50, 35, 0); add_child(l)
	var x := 0.0
	for k in ["deer", "zebra", "horse", "stag", "greywolf", "frog"]:
		var holder := Node3D.new(); add_child(holder); holder.position = Vector3(x, 0, 0)
		var kd: Dictionary = Animals.KINDS[k]
		var m := ModelUtil.make(kd.model, kd.size, kd.get("axis", 1)); holder.add_child(m)
		x += 3.0
	var ball := MeshInstance3D.new(); var sm := SphereMesh.new(); sm.radius = 0.3; sm.height = 0.6; ball.mesh = sm; add_child(ball); ball.position = Vector3(7.5, 0.5, 4)
	var mm := StandardMaterial3D.new(); mm.albedo_color = Color(1, 0, 0); ball.material_override = mm
	var w := Whale.new(); add_child(w); w.position = Vector3(7.5, 0, -14)
	w.model = ModelUtil.make("res://assets/animals/Whale.fbx", 14.0, 2); w.add_child(w.model)
	var d := MeshInstance3D.new(); d.mesh = CreatureMesh.dolphin(); add_child(d); d.position = Vector3(20, 0.5, 0)
	var sh := ModelUtil.make("res://assets/nf/fish.glb", 3.2, 2); add_child(sh); sh.position = Vector3(24, 0, 0)
	var cam := Camera3D.new(); add_child(cam); cam.current = true; cam.position = Vector3(30, 9, -6); cam.look_at(Vector3(11, 0, -2)); print("cam ok ", get_viewport().get_camera_3d())
	for i in 3: await get_tree().process_frame
	get_viewport().get_texture().get_image().save_png(out)
	get_tree().quit()
