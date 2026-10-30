extends Node3D
# Pictures of the world from chosen spots, in one run:
#   godot --path . res://tools/view.tscn -- "x,y,z|lx,ly,lz|hour|name;..." out_dir
# y < 0.5: stand on the ground (eye height); ly < -50: look at the ground there.
func _ready():
	get_tree().create_timer(900.0).timeout.connect(func(): get_tree().quit())
	var a := OS.get_cmdline_user_args()
	var shots := a[0].split(";"); var out := a[1]
	var w: Node3D = load("res://world/world.scn").instantiate(); add_child(w)
	var dn := DayNight.new(); dn.running = false; add_child(dn)
	var hs := HeightData.new()
	var cam := Camera3D.new(); cam.far = 1600.0; cam.fov = 70.0; add_child(cam)
	for sdef in shots:
		var parts := sdef.split("|")
		var p := parts[0].split_floats(","); var l := parts[1].split_floats(","); dn.time = float(parts[2]); dn.apply()
		var cp := Vector3(p[0], p[1], p[2]); if p[1] < 0.5: cp.y = hs.ground(p[0], p[2]) + 1.7
		cam.position = cp
		var lp := Vector3(l[0], l[1], l[2]); if l[1] < -50.0: lp.y = hs.ground(l[0], l[2]) + 1.2
		cam.look_at(lp)
		for i in 4: await get_tree().process_frame
		get_viewport().get_texture().get_image().save_png(out + "/" + parts[3] + ".png")
		print("shot ", parts[3])
	get_tree().quit()
