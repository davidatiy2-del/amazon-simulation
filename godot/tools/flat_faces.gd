extends SceneTree
# the flat faces of a model (decks, floors) with their heights and areas:
#   godot --headless --path . --script tools/flat_faces.gd -- res://model.glb
func _init():
	for f in OS.get_cmdline_user_args():
		var n: Node = load(f).instantiate()
		print("== ", f)
		for m in n.find_children("*", "MeshInstance3D", true, false):
			var mi := m as MeshInstance3D
			var xf := ModelUtil.rel_xform(mi, n)
			var hist := {}
			for s in mi.mesh.get_surface_count():
				var arr := mi.mesh.surface_get_arrays(s)
				var v: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]; var ix: PackedInt32Array = arr[Mesh.ARRAY_INDEX]
				for t in range(0, ix.size(), 3):
					var a := xf * v[ix[t]]; var b := xf * v[ix[t + 1]]; var c := xf * v[ix[t + 2]]
					var nn := (b - a).cross(c - a)
					var area := nn.length() * 0.5
					if area < 0.0001: continue
					nn = nn.normalized()
					if absf(nn.y) < 0.95: continue
					var y := snappedf((a.y + b.y + c.y) / 3.0, 0.05)
					var key := "%s%.2f" % ["up " if nn.y > 0 else "dn ", y]
					hist[key] = hist.get(key, 0.0) + area
			var keys := hist.keys(); keys.sort_custom(func(p, q): return hist[p] > hist[q])
			var line := "  " + mi.name + ": "
			for k in keys.slice(0, 8): line += "%s(%.1f) " % [k, hist[k]]
			print(line, " aabb ", (xf * mi.get_aabb()))
		n.free()
	quit()
