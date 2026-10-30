class_name AnimalPuppet
extends Node3D
# An animal's body for the crowd and the armies: a model scaled to its size, recolored, with the same plain move
# names as people (idle, walk, run, attack, die) mapped to its own animations. Horses can wear a saddle.
var def: Dictionary
var model: Node3D
var ap: AnimationPlayer
var skel: Skeleton3D
var anim_now := ""
var move_now := ""
var saddle: Node3D
var body_y0 := 0.0

func setup(d: Dictionary) -> AnimalPuppet:
	def = d
	model = ModelUtil.make(d.model, float(d.get("size", 1.5)), int(d.get("axis", 1)))
	add_child(model)
	if d.has("colors"): ModelUtil.recolor(model, d.colors)
	ap = ModelUtil.find_player(model)
	var sks := model.find_children("*", "Skeleton3D", true, false)
	if sks.size() > 0: skel = sks[0]
	if ap:
		var an: Dictionary = d.get("anims", {})
		for mv in ["idle", "walk", "run"]:
			var a := ModelUtil.anim(ap, an.get(mv, ""))
			if a != "": ap.get_animation(a).loop_mode = Animation.LOOP_LINEAR
		for mv in ["attack", "die"]:
			var a := ModelUtil.anim(ap, an.get(mv, ""))
			if a != "": ap.get_animation(a).loop_mode = Animation.LOOP_NONE
	if d.get("saddle", false):
		_make_saddle()
		if skel and skel.find_bone("Body") >= 0:
			body_y0 = (ModelUtil.rel_xform(skel, self) * skel.get_bone_global_rest(skel.find_bone("Body"))).origin.y
	for m in model.find_children("*", "MeshInstance3D", true, false):
		(m as MeshInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	play("idle", 0.0)
	return self

func anim_name(mv: String) -> String:
	var an: Dictionary = def.get("anims", {})
	var want: String = an.get(mv, "")
	if want == "":
		match mv:
			"dead", "die_b": want = an.get("die", "")
			"ride", "sit": want = an.get("idle", "")
			"act", "attack_b", "work": want = an.get("attack", an.get("idle", ""))
			_: want = an.get("idle", "")
	return ModelUtil.anim(ap, want)

func play(mv: String, blend := 0.18, spd := 1.0, restart := false) -> void:
	if ap == null: return
	var a := anim_name(mv)
	if a == "": return
	if a == anim_now and not restart:
		ap.speed_scale = spd; return
	anim_now = a; move_now = mv
	ap.play(a, blend, 1.0); ap.speed_scale = spd
	if restart: ap.seek(0.0, true)

# a saddle and a blanket of the owner's color, on the horse's back
func _make_saddle():
	saddle = Node3D.new(); add_child(saddle)
	var leather := StandardMaterial3D.new(); leather.albedo_color = Color(0.36, 0.2, 0.11); leather.roughness = 0.8
	var cloth := StandardMaterial3D.new(); cloth.albedo_color = def.get("blanket", Color(0.2, 0.4, 0.85)); cloth.roughness = 0.9
	var s := float(def.get("size", 1.9)) / 2.0
	var b := MeshInstance3D.new(); var bm := BoxMesh.new(); bm.size = Vector3(0.62, 0.05, 0.72) * s; b.mesh = bm; b.material_override = cloth
	saddle.add_child(b); b.position = Vector3(0, 1.3 * s, 0.05 * s)
	var c := MeshInstance3D.new(); var cm := BoxMesh.new(); cm.size = Vector3(0.36, 0.1, 0.45) * s; c.mesh = cm; c.material_override = leather
	saddle.add_child(c); c.position = Vector3(0, 1.36 * s, 0.05 * s)

func _process(_dt: float):
	if saddle == null or skel == null or not visible: return
	var bi := skel.find_bone("Body")
	if bi < 0: return
	var bt := skel.global_transform * skel.get_bone_global_pose(bi)
	saddle.position.y = (bt.origin.y - global_position.y) - body_y0
