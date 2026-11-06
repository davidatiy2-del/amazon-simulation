class_name WorldCollision
extends Node
# The solid world for the physics engine (Jolt): the ground, the cities' buildings, walls and gates, the piers and the
# tree trunks. It is made from the same data the world itself was built from (world/height.bin, trunks.bin and
# places.json), so what blocks the way is what is seen. Everything is created straight in the physics server (no nodes),
# so even thousands of trunks cost little.
#
# Collision layers:
const L_GROUND := 1      # the terrain and the piers' planks
const L_BUILD := 2       # buildings, walls, towers, gates
const L_PROPS := 4       # tree trunks
const L_PLAYER := 8
const L_HORSE := 16
const SOLID := L_GROUND | L_BUILD | L_PROPS
const TILE := 64         # terrain tiles: 64 x 64 cells (Jolt keeps square height fields compact)
const TRUNK_CELL := 64.0

static var inst: WorldCollision
var space: RID
var _bodies: Array[RID] = []
var _keep: Array[Shape3D] = []       # the shapes' resources stay alive while their bodies use them
var _gate_body: RID
var _gates := {}                     # gate key -> shape index in _gate_body
var box_tops: Array = []             # per box of HeightData.city_boxes: how high it stands

func build(world: World3D, hd: HeightData, world_root: Node3D) -> void:
	inst = self
	space = world.space
	var t0 := Time.get_ticks_msec()
	_terrain()
	_decks(hd)
	_city(hd, world_root)
	_trunks(hd)
	_gate_body = _body(L_BUILD)
	HeightData.gate_listener = _on_gate
	for key in HeightData.gate_boxes: _on_gate(key)
	print("collision: %d bodies in %d ms" % [_bodies.size(), Time.get_ticks_msec() - t0])

func _exit_tree():
	for b in _bodies: PhysicsServer3D.free_rid(b)
	_bodies.clear()
	if inst == self: inst = null
	HeightData.gate_listener = Callable()

func _body(layer: int) -> RID:
	var b := PhysicsServer3D.body_create()
	PhysicsServer3D.body_set_mode(b, PhysicsServer3D.BODY_MODE_STATIC)
	PhysicsServer3D.body_set_collision_layer(b, layer)
	PhysicsServer3D.body_set_collision_mask(b, 0)
	PhysicsServer3D.body_set_space(b, space)
	_bodies.append(b)
	return b

func _add(b: RID, s: Shape3D, t: Transform3D) -> int:
	_keep.append(s)
	PhysicsServer3D.body_add_shape(b, s.get_rid(), t)
	return PhysicsServer3D.body_get_shape_count(b) - 1

# ---------------------------------------------------------------- the ground, in square tiles
func _terrain():
	var c := WorldShape.CELL
	var tx_n := (HeightData.NX - 1) / TILE
	var tz_n := (HeightData.NZ - 1) / TILE
	for tz in tz_n:
		for tx in tx_n:
			var hm := HeightMapShape3D.new()
			hm.map_width = TILE + 1; hm.map_depth = TILE + 1
			var data := PackedFloat32Array(); data.resize((TILE + 1) * (TILE + 1))
			for j in TILE + 1:
				var row := (tz * TILE + j) * HeightData.NX + tx * TILE
				for i in TILE + 1:
					data[j * (TILE + 1) + i] = HeightData.H[row + i]
			hm.map_data = data
			var b := _body(L_GROUND)
			var center := Vector3(HeightData.X0 + (tx * TILE + TILE * 0.5) * c, 0, HeightData.Z0 + (tz * TILE + TILE * 0.5) * c)
			_add(b, hm, Transform3D(Basis.from_scale(Vector3(c, 1, c)), center))

# ---------------------------------------------------------------- the piers' planks
func _decks(hd: HeightData):
	var b := _body(L_GROUND)
	for d in hd.decks:
		var bs := BoxShape3D.new(); bs.size = Vector3(float(d.hx) * 2.0, 0.5, float(d.hz) * 2.0)
		_add(b, bs, Transform3D(Basis(Vector3.UP, float(d.get("yaw", 0.0))), Vector3(d.x, float(d.top) - 0.25, d.z)))

# ---------------------------------------------------------------- the cities: each box as high as what stands on it
func _city(hd: HeightData, world_root: Node3D):
	# the tops of the cities' meshes, in a grid of 8 m cells
	var tops := {}
	var cities := world_root.get_node_or_null("Cities") if world_root else null
	if cities:
		for m in cities.find_children("*", "MeshInstance3D", true, false):
			var mi := m as MeshInstance3D
			if mi.mesh == null: continue
			var ab := mi.global_transform * mi.mesh.get_aabb()
			var k := Vector2i(int(floor(ab.get_center().x / 8.0)), int(floor(ab.get_center().z / 8.0)))
			if not tops.has(k): tops[k] = []
			tops[k].append(ab)
	var b := _body(L_BUILD)
	box_tops.clear()
	for bx in HeightData.city_boxes:
		var x := float(bx[0]); var z := float(bx[1]); var yaw := float(bx[2]); var hx := float(bx[3]); var hz := float(bx[4])
		var g := hd.height(x, z)
		var top := g + 4.0
		var found := false
		var ext := maxf(hx, hz) + 1.0
		var cy := cos(yaw); var sy := sin(yaw)
		for gx in range(int(floor((x - ext) / 8.0)), int(floor((x + ext) / 8.0)) + 1):
			for gz in range(int(floor((z - ext) / 8.0)), int(floor((z + ext) / 8.0)) + 1):
				for ab in tops.get(Vector2i(gx, gz), []):
					var c: Vector3 = (ab as AABB).get_center()
					var dx := c.x - x; var dz := c.z - z
					if absf(dx * cy - dz * sy) <= hx + 0.8 and absf(dx * sy + dz * cy) <= hz + 0.8:
						top = maxf(top if found else -INF, (ab as AABB).end.y); found = true
		var h := clampf(top - g, 1.4, 40.0)
		box_tops.append(g + h)
		var bs := BoxShape3D.new(); bs.size = Vector3(hx * 2.0, h + 2.0, hz * 2.0)
		_add(b, bs, Transform3D(Basis(Vector3.UP, yaw), Vector3(x, g - 2.0 + (h + 2.0) * 0.5, z)))

# a gate shut (a box across its opening) or opened
func _on_gate(key: String):
	var i: int = HeightData.gate_boxes.get(key, -1)
	if i < 0: return
	var bx: Array = HeightData.boxes[i]
	var on := float(bx[3]) > 0.0
	if not _gates.has(key):
		if not on: return
		var g := HeightData.new().height(float(bx[0]), float(bx[1]))
		var bs := BoxShape3D.new(); bs.size = Vector3(float(bx[3]) * 2.0, 9.0, float(bx[4]) * 2.0)
		_gates[key] = _add(_gate_body, bs, Transform3D(Basis(Vector3.UP, float(bx[2])), Vector3(float(bx[0]), g + 3.5, float(bx[1]))))
	PhysicsServer3D.body_set_shape_disabled(_gate_body, _gates[key], not on)

# ---------------------------------------------------------------- the trees' trunks, grouped by 64 m cells
func _trunks(hd: HeightData):
	var cells := {}
	var tr := HeightData.trunks
	var shapes := {}   # radius (in 5 cm steps) -> a shared cylinder
	for k in tr.size() / 3:
		var x := tr[k * 3]; var z := tr[k * 3 + 1]; var r := tr[k * 3 + 2]
		var key := Vector2i(int(floor(x / TRUNK_CELL)), int(floor(z / TRUNK_CELL)))
		if not cells.has(key): cells[key] = _body(L_PROPS)
		var rk := int(round(r * 20.0))
		if not shapes.has(rk):
			var cs := CylinderShape3D.new(); cs.radius = maxf(0.08, rk / 20.0); cs.height = 7.0
			shapes[rk] = cs; _keep.append(cs)
		var s: CylinderShape3D = shapes[rk]
		PhysicsServer3D.body_add_shape(cells[key], s.get_rid(), Transform3D(Basis.IDENTITY, Vector3(x, hd.height(x, z) + 3.0, z)))

# ---------------------------------------------------------------- queries
# is a body of radius r and height h, standing at p, inside something solid
static func overlaps(p: Vector3, r: float, h: float, mask := L_BUILD | L_PROPS, exclude: Array[RID] = []) -> bool:
	if inst == null: return false
	var st := PhysicsServer3D.space_get_direct_state(inst.space)
	var q := PhysicsShapeQueryParameters3D.new()
	var cap := CapsuleShape3D.new(); cap.radius = r; cap.height = maxf(h, r * 2.0 + 0.01)
	q.shape = cap
	q.transform = Transform3D(Basis.IDENTITY, p + Vector3.UP * (cap.height * 0.5 + 0.05))
	q.collision_mask = mask
	q.exclude = exclude
	return not st.intersect_shape(q, 1).is_empty()

# a ray against the solid world: {position, normal} or {}
static func ray(from: Vector3, to: Vector3, mask := SOLID) -> Dictionary:
	if inst == null: return {}
	var st := PhysicsServer3D.space_get_direct_state(inst.space)
	var q := PhysicsRayQueryParameters3D.create(from, to, mask)
	return st.intersect_ray(q)

# how far a sphere of radius r can move from `from` toward `to` before it touches something (0..1)
static func sweep(from: Vector3, to: Vector3, r: float, mask := L_GROUND | L_BUILD) -> float:
	if inst == null: return 1.0
	var st := PhysicsServer3D.space_get_direct_state(inst.space)
	var q := PhysicsShapeQueryParameters3D.new()
	var sp := SphereShape3D.new(); sp.radius = r
	q.shape = sp
	q.transform = Transform3D(Basis.IDENTITY, from)
	q.motion = to - from
	q.collision_mask = mask
	var res := st.cast_motion(q)
	return res[0] if res.size() > 0 else 1.0
