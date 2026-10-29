extends Node3D
# a row of models, each scaled to a target height, playing its first animation: to see how they look
var list = []
func _ready():
	var args = OS.get_cmdline_user_args()
	var files: Array = args[0].split(",") if args.size() > 0 else []
	var out = args[1] if args.size() > 1 else "/tmp/lineup.png"
	var env := WorldEnvironment.new(); var e := Environment.new(); e.background_mode = Environment.BG_COLOR; e.background_color = Color(0.55, 0.7, 0.85)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; e.ambient_light_color = Color(0.7, 0.75, 0.8); e.ambient_light_energy = 0.6; env.environment = e; add_child(env)
	var l := DirectionalLight3D.new(); l.rotation_degrees = Vector3(-45, 35, 0); l.shadow_enabled = true; add_child(l)
	var g := MeshInstance3D.new(); var pm := PlaneMesh.new(); pm.size = Vector2(60, 20); g.mesh = pm; var gm := StandardMaterial3D.new(); gm.albedo_color = Color(0.35, 0.5, 0.25); g.material_override = gm; add_child(g)
	var x := -float(files.size() - 1) * 1.1
	for f in files:
		var ps: PackedScene = load(f)
		var n: Node3D = ps.instantiate(); add_child(n)
		var ap: AnimationPlayer = n.find_child("AnimationPlayer", true, false)
		if ap and ap.get_animation_list().size():
			var pick = ap.get_animation_list()[0]
			for a in ap.get_animation_list(): if a.ends_with("Idle"): pick = a
			ap.play(pick)
		list.append([n, x]); x += 2.2
	await get_tree().process_frame; await get_tree().process_frame
	for it in list:
		var n: Node3D = it[0]
		var bb := ModelUtil.bounds(n)
		var k = 1.8 / max(0.001, max(bb.size.y, max(bb.size.x, bb.size.z) * 0.6))
		n.scale = Vector3.ONE * k; n.position = Vector3(it[1], -bb.position.y * k, 0)
		print(n.name, " bounds ", bb.size)
	var cam := Camera3D.new(); add_child(cam); cam.position = Vector3(0, 2.2, max(6.0, files.size() * 1.25)); cam.look_at(Vector3(0, 0.9, 0))
	for i in 20: await get_tree().process_frame
	get_viewport().get_texture().get_image().save_png(out)
	get_tree().quit()
