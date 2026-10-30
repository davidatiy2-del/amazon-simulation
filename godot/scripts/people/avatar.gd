class_name Avatar
extends Node3D
# A person you can see: one model (KayKit or a classic one) dressed in a look (scripts/people/skins.gd), scaled to
# its height, playing moves by plain names (idle, walk, run, attack, hit, die, cheer, work, ride...) that each model
# family maps to its own animations. On a horse a small skeleton modifier spreads the legs over the saddle.
const KK_MOVES := {"idle": "Idle", "idle2h": "2H_Melee_Idle", "walk": "Walking_A", "walk_b": "Walking_B", "walk_carry": "Walking_C",
	"run": "Running_A", "run_b": "Running_B", "attack": "1H_Melee_Attack_Chop", "attack_b": "1H_Melee_Attack_Slice_Horizontal",
	"attack_c": "1H_Melee_Attack_Slice_Diagonal", "stab": "1H_Melee_Attack_Stab", "attack2h": "2H_Melee_Attack_Chop",
	"attack2h_b": "2H_Melee_Attack_Slice", "spin": "2H_Melee_Attack_Spin", "shoot": "1H_Ranged_Shoot", "aim": "1H_Ranged_Aiming",
	"reload": "1H_Ranged_Reload", "block": "Blocking", "block_hit": "Block_Hit", "hit": "Hit_A", "hit_b": "Hit_B", "die": "Death_A",
	"die_b": "Death_B", "dead": "Death_A_Pose", "cheer": "Cheer", "interact": "Interact", "pickup": "PickUp", "use": "Use_Item",
	"throw": "Throw", "cast": "Spellcasting", "cast_shoot": "Spellcast_Shoot", "sit": "Sit_Chair_Idle", "sit_floor": "Sit_Floor_Idle",
	"ride": "Sit_Chair_Idle", "roll": "Dodge_Forward", "jump": "Jump_Full_Short", "punch": "Unarmed_Melee_Attack_Punch_A",
	"kick": "Unarmed_Melee_Attack_Kick", "lie": "Lie_Idle", "wave": "Cheer", "work": "Use_Item", "chop": "1H_Melee_Attack_Chop",
	"idle_unarmed": "Unarmed_Idle"}
const Q_MOVES := {"idle": "Idle", "idle2h": "Idle_Sword", "walk": "Walk", "walk_b": "Walk", "walk_carry": "Walk", "run": "Run", "run_b": "Run",
	"attack": "Sword_Slash", "attack_b": "Sword_Slash", "attack_c": "Sword_Slash", "stab": "Sword_Slash", "attack2h": "Sword_Slash",
	"attack2h_b": "Sword_Slash", "spin": "Sword_Slash", "shoot": "Sword_Slash", "aim": "Idle_Sword", "reload": "Interact", "block": "Idle_Sword",
	"block_hit": "HitRecieve", "hit": "HitRecieve", "hit_b": "HitRecieve_2", "die": "Death", "die_b": "Death", "dead": "Death", "cheer": "Wave",
	"interact": "Interact", "pickup": "Interact", "use": "Interact", "throw": "Sword_Slash", "cast": "Interact", "cast_shoot": "Interact",
	"sit": "Idle", "sit_floor": "Idle", "ride": "Idle", "roll": "Roll", "jump": "Roll", "punch": "Punch_Right", "kick": "Kick_Right",
	"lie": "Death", "wave": "Wave", "work": "Interact", "chop": "Sword_Slash", "idle_unarmed": "Idle_Neutral"}
const LOOPS := ["idle", "idle2h", "walk", "walk_b", "walk_carry", "run", "run_b", "aim", "block", "cast", "sit", "sit_floor", "ride", "lie", "idle_unarmed"]
const ONCE_HOLD := ["die", "die_b", "dead"]

var look: Dictionary = {}
var base: Dictionary = {}
var fam := "kk"
var model: Node3D
var ap: AnimationPlayer
var skel: Skeleton3D
var height := 1.8
var move_now := ""
var anim_now := ""
var riding := false
var ride_mod: RidePose
var spear: MeshInstance3D
var hand_bone := -1
var native_h := 2.3
var _scale := 1.0
static var _looped := {}      # animation libraries already set to loop

func setup(lk: Dictionary, h := 1.8) -> Avatar:
	look = lk; height = h
	base = Skins.BASES.get(lk.get("base", "knight"), Skins.BASES.knight)
	fam = base.fam
	model = (load(base.file) as PackedScene).instantiate()
	add_child(model)
	skel = model.find_children("*", "Skeleton3D", true, false)[0] if model.find_children("*", "Skeleton3D", true, false).size() > 0 else null
	ap = model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if fam == "kk": _dress_kk()
	else: Skins.smooth_model(model)
	_fit()
	_set_loops()
	if fam == "q" and lk.get("weapon", "") == "spear": _make_spear()
	for m in model.find_children("*", "MeshInstance3D", true, false):
		(m as MeshInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	play("idle", 0.0)
	return self

# the KayKit outfit: hide what is not worn, add held things it lacks, and paint its palette
func _dress_kk():
	var keep := {}
	var acc: Dictionary = base.acc; var own: Dictionary = base.own
	if look.get("helmet", false) and acc.has("helmet"): keep[acc.helmet] = true
	if look.get("cape", false) and acc.has("cape"): keep[acc.cape] = true
	var extra := []   # [gear key, slot bone]
	for slot in ["weapon", "shield"]:
		var g: String = look.get(slot, "")
		if g == "" or g == "spear": continue
		if own.has(g): keep[own[g]] = true
		elif Skins.GEAR.has(g): extra.append([g, "handslot.l" if slot == "shield" else "handslot.r"])
	if look.get("offhand", "") != "" and own.has(look.offhand): keep[own[look.offhand]] = true
	for m in model.find_children("*", "MeshInstance3D", true, false):
		var mi := m as MeshInstance3D
		if mi.skin != null: continue
		if not keep.has(String(mi.name)):
			var p := mi.get_parent()
			if p is BoneAttachment3D: p.queue_free()
			else: mi.queue_free()
	var mat := Skins.material_for(base.tex, look.get("cloth", Color(0, 0, 0, 0)), look.get("metal", ""), int(look.get("skin", 0)))
	for e in extra:
		if skel == null or skel.find_bone(e[1]) < 0: continue
		var ba := BoneAttachment3D.new(); ba.bone_name = e[1]; skel.add_child(ba)
		var gn: Node3D = (load(Skins.GEAR_DIR + Skins.GEAR[e[0]] + ".gltf") as PackedScene).instantiate()
		ba.add_child(gn)
		if e[1] == "handslot.l": gn.rotation = Vector3(0, 0, 0)
	for m in model.find_children("*", "MeshInstance3D", true, false):
		(m as MeshInstance3D).material_override = mat

# scale to the wanted height, feet on the ground
func _fit():
	var top := 0.0; var bottom := 1e9; var found := false
	for m in model.find_children("*", "MeshInstance3D", true, false):
		var mi := m as MeshInstance3D
		if mi.skin == null and fam == "kk": continue
		var bb := ModelUtil.rel_xform(mi, model) * mi.get_aabb()
		top = maxf(top, bb.end.y); bottom = minf(bottom, bb.position.y); found = true
	if fam == "q" or not found:
		var bb2 := ModelUtil.body_bounds(model)
		top = bb2.end.y; bottom = bb2.position.y
		native_h = maxf(0.01, bb2.size.y)
		_scale = height / native_h
	else:
		native_h = maxf(0.01, top - minf(bottom, 0.0))
		_scale = height / native_h
	model.scale = Vector3.ONE * _scale
	model.position.y = -minf(bottom, 0.0) * _scale if fam == "kk" else -bottom * _scale

func _set_loops():
	if ap == null: return
	var key: String = base.file
	if _looped.has(key): return
	_looped[key] = true
	var moves := KK_MOVES if fam == "kk" else Q_MOVES
	for mv in LOOPS:
		var a := ModelUtil.anim(ap, moves.get(mv, ""))
		if a != "": ap.get_animation(a).loop_mode = Animation.LOOP_LINEAR
	for mv in ONCE_HOLD + ["attack", "attack_b", "attack_c", "stab", "attack2h", "attack2h_b", "spin", "shoot", "hit", "hit_b", "cheer", "interact", "pickup", "use", "throw", "roll", "jump", "punch", "kick", "cast_shoot", "reload", "block_hit"]:
		var a := ModelUtil.anim(ap, moves.get(mv, ""))
		if a != "" and moves.get(mv, "") != moves.get("idle", ""): ap.get_animation(a).loop_mode = Animation.LOOP_NONE

func anim_name(mv: String) -> String:
	var moves := KK_MOVES if fam == "kk" else Q_MOVES
	return ModelUtil.anim(ap, moves.get(mv, moves.idle))

# plays a move; the same move again does nothing unless `restart`
func play(mv: String, blend := 0.15, spd := 1.0, restart := false) -> void:
	if ap == null: return
	if riding and (mv == "idle" or mv == "walk" or mv == "run"): mv = "ride"
	var a := anim_name(mv)
	if a == "": return
	if a == anim_now and not restart and (ap.is_playing() or mv in ONCE_HOLD): ap.speed_scale = spd; return
	move_now = mv; anim_now = a
	ap.play(a, blend, 1.0)
	ap.speed_scale = spd
	if restart: ap.seek(0.0, true)

func move_length(mv: String) -> float:
	var a := anim_name(mv)
	return ap.get_animation(a).length if a != "" else 1.0

func is_two_handed() -> bool: return look.get("weapon", "") in Skins.TWO_HANDED

# the attack that suits what is held
func attack_move(i := 0) -> String:
	var w: String = look.get("weapon", "")
	if w in ["crossbow", "crossbow2"]: return "shoot"
	if w in ["staff", "wand"]: return "cast_shoot"
	if w in ["sword2", "axe2"]: return ["attack2h", "attack2h_b", "spin"][i % 3]
	if w == "": return ["punch", "kick"][i % 2]
	return ["attack", "attack_b", "attack_c", "stab"][i % 4]

# ---------------------------------------------------------------- on a horse
func set_riding(on: bool) -> void:
	if on == riding: return
	riding = on
	if skel == null: return
	if on:
		if ride_mod == null:
			ride_mod = RidePose.new(); ride_mod.fam = fam; skel.add_child(ride_mod)
		ride_mod.active = true
		play("ride", 0.1)
	else:
		if ride_mod: ride_mod.active = false
		play("idle", 0.1)

# ---------------------------------------------------------------- the classic hunter's spear
func _make_spear():
	if skel == null: return
	hand_bone = skel.find_bone("Wrist.R")
	if hand_bone < 0: return
	var shaft := CylinderMesh.new(); shaft.top_radius = 0.022; shaft.bottom_radius = 0.026; shaft.height = 1.9; shaft.radial_segments = 6; shaft.rings = 1
	var wood := StandardMaterial3D.new(); wood.albedo_color = Color(0.45, 0.31, 0.18); wood.roughness = 0.9
	shaft.material = wood
	spear = MeshInstance3D.new(); spear.mesh = shaft; add_child(spear)
	var tip := MeshInstance3D.new(); var cone := CylinderMesh.new(); cone.top_radius = 0.0; cone.bottom_radius = 0.045; cone.height = 0.22; cone.radial_segments = 6; cone.rings = 1
	var stone := StandardMaterial3D.new(); stone.albedo_color = Color(0.32, 0.32, 0.34); stone.roughness = 0.6; cone.material = stone
	tip.mesh = cone; tip.position.y = 1.06; spear.add_child(tip)

func _process(_dt: float):
	if spear == null or hand_bone < 0 or not visible: return
	var bt := skel.global_transform * skel.get_bone_global_pose(hand_bone)
	var b := bt.basis.orthonormalized()
	var y: Vector3 = b[1]
	var z := (b[2] - y * b[2].dot(y)).normalized()
	spear.global_transform = Transform3D(Basis(y.cross(z), y, z), bt.origin + y * 0.35)
