class_name RidePose
extends SkeletonModifier3D
# Sitting astride a horse: after the animation, the thighs turn out to the sides (and for the classic models, which
# have no sitting animation, they also lift forward and the knees bend). Works in the skeleton's space, where every
# model faces +z and its left side is +x.
var fam := "kk"
var _bones := {}

func _bone(n: String) -> int:
	if not _bones.has(n): _bones[n] = get_skeleton().find_bone(n)
	return _bones[n]

func _process_modification() -> void:
	var sk := get_skeleton()
	if sk == null: return
	var kk := fam == "kk"
	for side in ["l", "r"]:
		var s := 1.0 if side == "l" else -1.0
		var up := _bone("upperleg." + side if kk else ("UpperLeg." + side.to_upper()))
		var low := _bone("lowerleg." + side if kk else ("LowerLeg." + side.to_upper()))
		if up < 0: continue
		var lift := 0.0 if kk else 1.35
		var bend := 0.0 if kk else 1.45
		var spread := 0.42 if kk else 0.38
		_turn(sk, up, Basis(Vector3.UP, spread * s) * Basis(Vector3.RIGHT, -lift))
		if low >= 0 and bend != 0.0: _turn(sk, low, Basis(Vector3.RIGHT, bend))

# turns a bone by `rot` (in skeleton space) about its own origin
func _turn(sk: Skeleton3D, b: int, rot: Basis) -> void:
	var g := sk.get_bone_global_pose(b)
	var ng := Transform3D(rot * g.basis, g.origin)
	var par := sk.get_bone_parent(b)
	var pg := sk.get_bone_global_pose(par) if par >= 0 else Transform3D.IDENTITY
	var local := pg.affine_inverse() * ng
	sk.set_bone_pose_rotation(b, local.basis.get_rotation_quaternion())
