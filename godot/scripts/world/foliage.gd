class_name Foliage
extends RefCounted
# Puts the world's plants in the wind: every plant mesh drawn by the Plants' MultiMeshes gets the foliage shader
# (shaders/foliage.gdshader) in place of its own material, with the same texture and color. Each mesh is changed once,
# so all its thousands of copies sway. Trunks bend a little, crowns and grass more.
static var _done := {}

static func apply(plants: Node) -> void:
	if plants == null: return
	var shader: Shader = load("res://shaders/foliage.gdshader")
	var mats := {}   # original material -> its swaying copy
	for c in plants.get_children():
		var mmi := c as MultiMeshInstance3D
		if mmi == null or mmi.multimesh == null or mmi.multimesh.mesh == null: continue
		var mesh := mmi.multimesh.mesh
		if _done.has(mesh): continue
		_done[mesh] = true
		var nm := String(mmi.name).to_lower()
		var small := nm.begins_with("grass") or nm.begins_with("meadow") or nm.begins_with("flower") or nm.begins_with("fern") or nm.begins_with("bush") or nm.begins_with("plant")
		if nm.begins_with("rock") or nm.begins_with("pebble") or nm.begins_with("stone") or nm.begins_with("mushroom") or nm.begins_with("log") or nm.begins_with("stump"): continue
		var h := maxf(0.3, mesh.get_aabb().end.y)
		for s in mesh.get_surface_count():
			var m := mesh.surface_get_material(s)
			if m == null or not (m is BaseMaterial3D): continue
			var key := str(m.get_instance_id()) + ("s" if small else "t")
			if not mats.has(key):
				var bm := m as BaseMaterial3D
				var sm := ShaderMaterial.new(); sm.shader = shader
				sm.set_shader_parameter("albedo", bm.albedo_color)
				sm.set_shader_parameter("use_tex", bm.albedo_texture != null)
				if bm.albedo_texture: sm.set_shader_parameter("albedo_tex", bm.albedo_texture)
				var cut := bm.transparency != BaseMaterial3D.TRANSPARENCY_DISABLED
				sm.set_shader_parameter("cutout", cut)
				sm.set_shader_parameter("alpha_cut", bm.alpha_scissor_threshold if bm.transparency == BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR else 0.4)
				var bark := String(bm.resource_name).to_lower().contains("bark") or String(bm.resource_name).to_lower().contains("trunk") or String(bm.resource_name).to_lower().contains("wood")
				sm.set_shader_parameter("sway", 0.14 if small else (0.018 if bark else 0.05))
				sm.set_shader_parameter("roughness", bm.roughness)
				mats[key] = sm
			var sw: ShaderMaterial = (mats[key] as ShaderMaterial).duplicate()
			sw.set_shader_parameter("height", h)
			mesh.surface_set_material(s, sw)
