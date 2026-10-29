extends Node3D
# Look at the jungle from one spot: godot --path . res://tools/view.tscn -- x,y,z lx,ly,lz hour out.png
func _ready():
	get_tree().create_timer(400.0).timeout.connect(func(): get_tree().quit())
	var a := OS.get_cmdline_user_args()
	var p := a[0].split_floats(","); var l := a[1].split_floats(","); var hour := float(a[2]); var out := a[3]
	var w: Node3D = load("res://world/world.scn").instantiate(); add_child(w)
	var dn := DayNight.new(); dn.time = hour; dn.running = false; add_child(dn)
	var hs := HeightData.new()
	var cam := Camera3D.new(); cam.far = 1200.0; cam.fov = 70.0; add_child(cam)
	var cp := Vector3(p[0], p[1], p[2]); if p[1] < 0.5: cp.y = hs.height(p[0], p[2]) + 1.7
	cam.position = cp
	var lp := Vector3(l[0], l[1], l[2]); if l[1] < -50.0: lp.y = hs.height(l[0], l[2]) + 1.2
	cam.look_at(lp)
	for i in 6:
		var t0 := Time.get_ticks_msec(); await get_tree().process_frame; print("frame ", Time.get_ticks_msec() - t0)
	get_viewport().get_texture().get_image().save_png(out)
	get_tree().quit()
