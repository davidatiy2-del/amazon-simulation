class_name CityGen
extends RefCounted
# Builds the four cities into the world, once, offline (tools/worldgen.gd calls it): your city by the jungle's harbor
# (blue, 300 people), the northern kingdom's city (red), the tribe's village on the lost island (green, a palisade and
# huts, pens for its dinosaurs) and the pirates' fort (black, stone walls and cannons). For each city it places the
# buildings, walls, gates and towers, paints its streets on the ground, and writes what the game needs into
# places.json: the buildings with their doors and sizes (they block the way), the streets as a graph to walk on,
# the gates, the castle, the plaza, the stables with their horse stalls, the training ground and the spots where
# people work, guard, pray, drink and trade.
const TOWN := "res://assets/kaykit/town/"
const PIRATE := "res://assets/pirate/"
var S: WorldShape
var hat: Callable                 # terrain height at (x, z)
var root: Node3D
var keep_clear: Array = []        # [x, z, r] circles with no plants
var paint: Array = []             # [kind, x, z, hx, hz, yaw]: streets, plazas, fields painted on the ground
var _sizes := {}                  # model path -> its box at scale 1
var rng := RandomNumberGenerator.new()

# the city being built
var C: Dictionary
var cx := 0.0; var cz := 0.0; var sd := 1.0; var hw := 0.0; var hd := 0.0; var gy := 0.0
var holder: Node3D
var reserved: Array = []          # local rects [u0, v0, u1, v1] where no house may stand

func build_all(world_root: Node3D) -> Dictionary:
	root = Node3D.new(); root.name = "Cities"; world_root.add_child(root)
	rng.seed = 777
	var out := {}
	out["home"] = _kk_city("home", "עיר הנמל", "blue", 1.0, -30.0, true)
	out["north"] = _kk_city("north", "ממלכת הצפון", "red", -1.0, 18.0, false)
	out["lost"] = _tribal_city()
	out["pirate"] = _pirate_city()
	return out

# ---------------------------------------------------------------- helpers
func _begin(id: String, name: String, faction: String, sea_dir: float, style: String):
	var c: Array = WorldShape.CITIES[id]
	cx = c[0]; cz = c[1]; hw = c[2]; hd = c[3]; gy = c[4]; sd = sea_dir
	holder = Node3D.new(); holder.name = "City_" + id; root.add_child(holder)
	reserved = []
	C = {"id": id, "name": name, "faction": faction, "style": style, "center": [cx, cz], "hw": hw, "hd": hd, "ground": gy, "sea": sd,
		"buildings": [], "boxes": [], "gates": [], "nodes": [], "edges": [], "spots": {}, "towers": [], "homes": [], "flags": []}
	keep_clear.append([cx, cz, maxf(hw, hd) + 22.0])
	for cu: float in [-1.0, 1.0]:
		for cvv: float in [-1.0, 1.0]: keep_clear.append([cx + cu * hw, cz + cvv * hd, 22.0])

# local (u along x, v toward the sea) to world
func W(u: float, v: float) -> Vector2: return Vector2(cx + u * sd, cz + v * sd)
func WY(yaw: float) -> float: return yaw + (PI if sd < 0.0 else 0.0)
func _ground(x: float, z: float) -> float: return float(hat.call(x, z))

func _size(path: String) -> AABB:
	if _sizes.has(path): return _sizes[path]
	var n: Node3D = (load(path) as PackedScene).instantiate()
	var bb := AABB(); var first := true
	for m in n.find_children("*", "MeshInstance3D", true, false):
		var b: AABB = ModelUtil.rel_xform(m, n) * (m as MeshInstance3D).get_aabb()
		bb = b if first else bb.merge(b); first = false
	n.free()
	_sizes[path] = bb
	return bb

# places a model at local (u, v) facing local yaw; returns its record {t, x, z, yaw, hx, hz, door}
func _put(path: String, u: float, v: float, yaw: float, sc: float, t := "", collide := true, inset := 0.5, ground := -999.0) -> Dictionary:
	var p := W(u, v); var wy := WY(yaw)
	var n: Node3D = (load(path) as PackedScene).instantiate()
	n.scale = Vector3.ONE * sc
	var y := gy if ground < -900.0 else ground
	n.position = Vector3(p.x, y, p.y); n.rotation.y = wy
	holder.add_child(n)
	var bb := _size(path)
	var hx := bb.size.x * sc * 0.5 - inset; var hz := bb.size.z * sc * 0.5 - inset
	# the box's middle, turned with the model
	var mid := Vector3(bb.position.x + bb.size.x * 0.5, 0, bb.position.z + bb.size.z * 0.5) * sc
	var mw := Vector3(mid.x, 0, mid.z).rotated(Vector3.UP, wy)
	var rec := {"t": t, "x": p.x + mw.x, "z": p.y + mw.z, "yaw": wy, "hx": maxf(0.3, hx), "hz": maxf(0.3, hz), "top": bb.size.y * sc}
	var f := Vector2(sin(wy), cos(wy))
	rec["door"] = [rec.x + f.x * (rec.hz + 1.6), rec.z + f.y * (rec.hz + 1.6)]
	if collide: C.boxes.append([rec.x, rec.z, wy, rec.hx, rec.hz])
	return rec

func _building(t: String, path: String, u: float, v: float, yaw: float, sc: float, extra := {}) -> Dictionary:
	var r := _put(path, u, v, yaw, sc, t)
	for k in extra: r[k] = extra[k]
	C.buildings.append(r)
	return r

func _spot(kind: String, u: float, v: float, yaw := 0.0):
	var p := W(u, v)
	if not C.spots.has(kind): C.spots[kind] = []
	C.spots[kind].append([snappedf(p.x, 0.01), snappedf(p.y, 0.01), snappedf(WY(yaw), 0.001)])

func _reserve(u0: float, v0: float, u1: float, v1: float): reserved.append([minf(u0, u1), minf(v0, v1), maxf(u0, u1), maxf(v0, v1)])
func _free(u: float, v: float, r: float) -> bool:
	if absf(u) > hw - 12.0 - r * 0.5 or absf(v) > hd - 12.0 - r * 0.5: return false
	for q in reserved:
		if u + r > q[0] and u - r < q[2] and v + r > q[1] and v - r < q[3]: return false
	return true

func _paint_rect(kind: String, u0: float, v0: float, u1: float, v1: float):
	var a := W((u0 + u1) * 0.5, (v0 + v1) * 0.5)
	paint.append([kind, a.x, a.y, absf(u1 - u0) * 0.5, absf(v1 - v0) * 0.5, 0.0])

# a street from a to b (local): nodes every ~12 m, joined to the graph; painted
func _street(a: Vector2, b: Vector2, width := 7.0):
	var n := maxi(1, int(ceil(a.distance_to(b) / 12.0)))
	var prev := -1
	for i in n + 1:
		var p := a.lerp(b, float(i) / n)
		var k := _node(p)
		if prev >= 0 and prev != k: _edge(prev, k)
		prev = k
	var mid := (a + b) * 0.5; var len := a.distance_to(b)
	var wm := W(mid.x, mid.y)
	var horiz := absf(a.y - b.y) < 0.1
	paint.append(["road", wm.x, wm.y, (len * 0.5 + width * 0.5) if horiz else width * 0.5, width * 0.5 if horiz else (len * 0.5 + width * 0.5), 0.0])

func _node(local: Vector2) -> int:
	var p := W(local.x, local.y)
	for i in C.nodes.size():
		if Vector2(C.nodes[i][0], C.nodes[i][1]).distance_to(p) < 3.5: return i
	C.nodes.append([snappedf(p.x, 0.01), snappedf(p.y, 0.01)])
	return C.nodes.size() - 1

# a node anywhere (world), joined to the nearest street node
func _link_world(p: Vector2) -> int:
	var best := -1; var bd := 1e9
	for i in C.nodes.size():
		var d := Vector2(C.nodes[i][0], C.nodes[i][1]).distance_to(p)
		if d < bd: bd = d; best = i
	C.nodes.append([snappedf(p.x, 0.01), snappedf(p.y, 0.01)])
	var k: int = C.nodes.size() - 1
	if best >= 0: _edge(k, best)
	return k

func _edge(a: int, b: int):
	for e in C.edges:
		if (e[0] == a and e[1] == b) or (e[0] == b and e[1] == a): return
	C.edges.append([a, b])

# a building's door joins the graph
func _door_node(rec: Dictionary) -> int:
	var k := _link_world(Vector2(rec.door[0], rec.door[1]))
	rec["node"] = k
	return k

# ---------------------------------------------------------------- walls
# a straight wall from a to b (local) out of pieces of one model, stretched a little so they fill it exactly;
# gates (positions along it, in meters from a) are left open or filled with a gate piece
func _wall_line(a: Vector2, b: Vector2, piece: String, sc: float, gate_piece: String, gate_sc: float, gates: Array, t: String = "wall"):
	var len := a.distance_to(b); var d := (b - a).normalized()
	var yaw := atan2(-d.y, d.x)          # the piece's +x along the wall, its front (+z) facing out
	var pl := _size(piece).size.x * sc
	var gl := _size(gate_piece).size.x * gate_sc if gate_piece != "" else 0.0
	# the stretches between gates
	var cuts := [0.0]
	for g in gates: cuts.append_array([float(g[0]) - gl * 0.5, float(g[0]) + gl * 0.5])
	cuts.append(len)
	for i in range(0, cuts.size(), 2):
		var s0: float = cuts[i]; var s1: float = cuts[i + 1]
		var n := maxi(1, int(round((s1 - s0) / pl)))
		var stretch := (s1 - s0) / (n * pl)
		for k in n:
			var c := a + d * (s0 + (k + 0.5) * (s1 - s0) / n)
			var rec := _put(piece, c.x, c.y, yaw, sc, t, true, 0.25)
			var node: Node3D = holder.get_child(holder.get_child_count() - 1)
			node.scale.x *= stretch
			C.boxes[C.boxes.size() - 1][3] = rec.hx * stretch
	for g in gates:
		var c := a + d * float(g[0])
		var p := W(c.x, c.y); var wy := WY(yaw)
		var gn: Node3D = (load(gate_piece) as PackedScene).instantiate()
		gn.scale = Vector3.ONE * gate_sc; gn.position = Vector3(p.x, gy, p.y); gn.rotation.y = wy; holder.add_child(gn)
		var f := Vector2(sin(wy), cos(wy)); var r := Vector2(f.y, -f.x)
		var side := gl * 0.5 - float(g[2]) * 0.5
		for s2: float in [-1.0, 1.0]:
			var q: Vector2 = p + r * s2 * (gl * 0.5 - side * 0.5)
			C.boxes.append([q.x, q.y, wy, side * 0.5, 2.4])
		C.gates.append({"id": g[1], "x": p.x, "z": p.y, "yaw": wy, "w": float(g[2]), "out": [p.x + f.x * 10.0, p.y + f.y * 10.0], "in": [p.x - f.x * 10.0, p.y - f.y * 10.0]})

# the four walls of a rectangle with towers at the corners; gates: [[side, position along u or v, id]]
func _rect_walls(piece: String, sc: float, gate_piece: String, gate_sc: float, gate_w: float, tower: String, tower_sc: float, gates: Array):
	var corners := [Vector2(-hw, hd), Vector2(hw, hd), Vector2(hw, -hd), Vector2(-hw, -hd)]   # n side runs from NW to NE, etc.
	var sides := ["n", "e", "s", "w"]
	for i in 4:
		var a2: Vector2 = corners[i]; var b2: Vector2 = corners[(i + 1) % 4]
		var gl := []
		for g: Array in gates:
			if g[0] != sides[i]: continue
			var along: float = (float(g[1]) - a2.x) if (sides[i] == "n") else ((b2.x - float(g[1])) * -1.0 + (b2.x - a2.x) if sides[i] == "s" else 0.0)
			match sides[i]:
				"n": along = float(g[1]) + hw
				"s": along = hw - float(g[1])
				"e": along = hd - float(g[1])
				"w": along = float(g[1]) + hd
			gl.append([along, g[2], gate_w])
		_wall_line(a2, b2, piece, sc, gate_piece, gate_sc, gl)
	for c in corners:
		var tr := _put(tower, c.x, c.y, 0.0, tower_sc, "tower")
		C.towers.append([tr.x, tr.z])
	for g in C.gates:
		var f := Vector2(sin(g.yaw), cos(g.yaw)); var r := Vector2(f.y, -f.x)
		for s2: float in [-1.0, 1.0]: C.towers.append([g.x + r.x * s2 * 7.0, g.z + r.y * s2 * 7.0])

# ---------------------------------------------------------------- your city and the northern kingdom's: KayKit
func _kk_city(id: String, name: String, color: String, sea_dir: float, gate_u: float, big: bool) -> Dictionary:
	_begin(id, name, color, sea_dir, "kk")
	var sc := 8.0
	var land_u := 22.0 if big else -22.0
	var gates := [["n", gate_u, "sea"], ["s", land_u, "land"]]
	if big: gates.append(["w", 0.0, "river"])
	_rect_walls(TOWN + "wall_straight.gltf", 6.0, TOWN + "wall_straight_gate.gltf", 6.0, 5.2, TOWN + "building_tower_B_%s.gltf" % color, 6.5, gates)
	var ring_u := hw - 10.0; var ring_v := hd - 10.0
	var plaza := Vector2(gate_u, 16.0 if big else 10.0)
	var castle_v := -hd + 30.0
	var west_u := -hw * 0.62; var east_u := hw * 0.5
	var north_v := (plaza.y + ring_v) * 0.5 + 2.0
	_street(Vector2(gate_u, hd + 14.0), Vector2(gate_u, castle_v + 17.0))
	_street(Vector2(-ring_u, plaza.y), Vector2(ring_u, plaza.y))
	_street(Vector2(land_u, -hd - 14.0), Vector2(land_u, plaza.y))
	_street(Vector2(gate_u, castle_v + 17.0), Vector2(land_u, castle_v + 17.0))
	_street(Vector2(-ring_u, north_v), Vector2(ring_u, north_v))
	_street(Vector2(west_u, plaza.y), Vector2(west_u, ring_v))
	_street(Vector2(east_u, plaza.y), Vector2(east_u, ring_v))
	for k: Array in [[Vector2(-ring_u, -ring_v), Vector2(ring_u, -ring_v)], [Vector2(-ring_u, ring_v), Vector2(ring_u, ring_v)],
			[Vector2(-ring_u, -ring_v), Vector2(-ring_u, ring_v)], [Vector2(ring_u, -ring_v), Vector2(ring_u, ring_v)]]:
		_street(k[0], k[1], 6.0)
	_street(Vector2(gate_u, ring_v), Vector2(gate_u, hd + 14.0))
	_street(Vector2(land_u, -ring_v), Vector2(land_u, -hd - 14.0))
	if big: _street(Vector2(-hw - 14.0, 0.0), Vector2(-ring_u, 0.0))
	# the plaza: a well and a statue-like flag in the middle, the market with its stalls, the tavern, the temple
	_paint_rect("plaza", plaza.x - 16.0, plaza.y - 12.0, plaza.x + 16.0, plaza.y + 12.0)
	_reserve(plaza.x - 18.0, plaza.y - 14.0, plaza.x + 18.0, plaza.y + 14.0)
	C["plaza"] = [W(plaza.x, plaza.y).x, W(plaza.x, plaza.y).y]
	_building("well", TOWN + "building_well_%s.gltf" % color, plaza.x + 6.0, plaza.y - 4.0, 0.0, 5.5)
	_spot("water", plaza.x + 6.0, plaza.y - 8.5, PI)
	var fpl := W(plaza.x - 5.0, plaza.y + 4.0); C.flags.append([fpl.x, fpl.y])
	for i in 4:   # market stalls around the plaza's edge
		var su := plaza.x - 12.0 + i * 8.0
		_put(PIRATE + "structure.glb", su, plaza.y + 9.0, PI, 0.42, "stall", true, 0.2)
		_put(TOWN + ["crate_A_small", "barrel", "sack", "crate_B_small"][i] + ".gltf", su + 1.2, plaza.y + 9.6, 0.3 * i, 5.0, "prop", false)
		_spot("trade", su, plaza.y + 6.5, PI)
	var market := _building("market", TOWN + "building_market_%s.gltf" % color, plaza.x - 26.0, plaza.y + 2.0, PI * 0.5, sc * 0.9)
	_door_node(market)
	for i in 2: _spot("trade", plaza.x - 17.0, plaza.y - 2.0 + i * 4.0, -PI * 0.5)
	var tavern := _building("tavern", TOWN + "building_tavern_%s.gltf" % color, plaza.x + 26.0, plaza.y + 3.0, -PI * 0.5, sc)
	_door_node(tavern)
	for i in 5: _spot("drink", plaza.x + 16.5 + (i % 2) * 2.0, plaza.y - 4.0 + i * 2.4, PI * 0.5)
	var temple := _building("temple", TOWN + "building_church_%s.gltf" % color, plaza.x + 24.0, plaza.y - 24.0, PI, sc)
	_door_node(temple)
	for i in 4: _spot("pray", plaza.x + 20.0 + i * 2.5, plaza.y - 14.5, PI)
	_reserve(plaza.x + 12.0, plaza.y - 34.0, plaza.x + 36.0, plaza.y - 13.0)
	_reserve(plaza.x - 38.0, plaza.y - 10.0, plaza.x - 14.0, plaza.y + 14.0)
	_reserve(plaza.x + 14.0, plaza.y - 8.0, plaza.x + 38.0, plaza.y + 14.0)
	# the castle, facing the street from the sea gate
	var castle := _building("castle", TOWN + "building_castle_%s.gltf" % color, gate_u, castle_v, 0.0, sc * 1.1)
	_door_node(castle)
	C["castle"] = {"x": castle.x, "z": castle.z, "door": castle.door, "yaw": castle.yaw}
	_spot("throne", gate_u, castle_v + 12.0, 0.0)
	for i in 6: _spot("guard", gate_u - 7.0 + (i % 2) * 14.0, castle_v + 11.0 + int(i / 2) * 5.0, 0.0)
	_reserve(gate_u - 17.0, castle_v - 14.0, gate_u + 17.0, castle_v + 18.0)
	_paint_rect("plaza", gate_u - 12.0, castle_v + 9.0, gate_u + 12.0, castle_v + 21.0)
	for s: float in [-1.0, 1.0]:
		var fl := W(gate_u + s * 10.0, castle_v + 15.0)
		C.flags.append([fl.x, fl.y])
	# the military quarter: barracks, archery range, the smith, a training ground with targets
	var mil := Rect2(land_u + 12.0, -hd + 12.0, (hw - 12.0) - (land_u + 12.0), (plaza.y - 12.0) - (-hd + 12.0))
	if not big: mil = Rect2(gate_u + 20.0, -hd + 12.0, (hw - 12.0) - (gate_u + 20.0), (plaza.y - 12.0) - (-hd + 12.0))
	_reserve(mil.position.x, mil.position.y, mil.end.x, mil.end.y)
	var nb := 3 if big else 2
	for i in nb:
		var bv := mil.position.y + 9.0 + i * 15.0
		if bv > mil.end.y - 6.0: break
		var br := _building("barracks", TOWN + "building_barracks_%s.gltf" % color, mil.end.x - 7.0, bv, -PI * 0.5, sc * 0.9, {"cap": 50})
		_door_node(br)
	var ar := _building("archery", TOWN + "building_archeryrange_%s.gltf" % color, mil.position.x + 8.0, mil.position.y + 8.0, PI * 0.5, sc * 0.85)
	_door_node(ar)
	var smith := _building("smith", TOWN + "building_blacksmith_%s.gltf" % color, mil.position.x + 8.0, mil.end.y - 7.0, 0.0, sc * 0.9)
	_door_node(smith)
	_spot("smith", mil.position.x + 8.0, mil.end.y - 0.5, PI)
	var tg := Vector2(mil.position.x + mil.size.x * 0.46, mil.position.y + mil.size.y * 0.5)
	_paint_rect("yard", tg.x - 12.0, tg.y - 15.0, tg.x + 12.0, tg.y + 15.0)
	for i in 6:
		var tu := tg.x - 9.0 + (i % 3) * 9.0; var tv := tg.y + (8.0 if i < 3 else -8.0)
		_put(TOWN + "target.gltf", tu, tv, PI if i < 3 else 0.0, 6.0, "target", false)
		_spot("train", tu, tv + (-2.6 if i < 3 else 2.6), 0.0 if i < 3 else PI)
	for i in 3: _put(TOWN + "weaponrack.gltf", tg.x - 12.5, tg.y - 6.0 + i * 6.0, PI * 0.5, 6.0, "rack", false)
	for i in 2: _put(TOWN + "tent.gltf", tg.x + 13.0, tg.y - 8.0 + i * 16.0, -PI * 0.5, 4.5, "tent", true)
	for i in 24: _spot("drill", tg.x - 8.0 + (i % 6) * 3.2, tg.y - 5.0 + int(i / 6) * 3.0, 0.0 if (i / 6) % 2 == 0 else PI)
	for i in 4: _spot("archer", mil.position.x + 3.0, mil.position.y + 16.0 + i * 3.0, -PI * 0.5)
	_link_world(W(tg.x, tg.y))
	C["train"] = [W(tg.x, tg.y).x, W(tg.x, tg.y).y]
	# the stables
	var st0 := Vector2(-hw + 14.0, -hd + 14.0)
	var st1 := Vector2(gate_u - 19.0, -6.0 if big else -12.0)
	if st1.x - st0.x < 30.0: st1.x = st0.x + 32.0
	_reserve(st0.x - 2.0, st0.y - 2.0, st1.x + 2.0, st1.y + 2.0)
	C["stable"] = _stables(st0, st1, color)
	# the houses: along every street, facing it
	var homes := 0
	var want_homes := 60 if big else 32
	var lines := [[Vector2(gate_u, plaza.y + 15.0), Vector2(gate_u, ring_v - 6.0)], [Vector2(-ring_u + 8.0, plaza.y), Vector2(ring_u - 8.0, plaza.y)],
		[Vector2(-ring_u + 8.0, north_v), Vector2(ring_u - 8.0, north_v)], [Vector2(-ring_u + 10.0, ring_v), Vector2(ring_u - 10.0, ring_v)],
		[Vector2(west_u, plaza.y + 8.0), Vector2(west_u, ring_v - 6.0)], [Vector2(east_u, plaza.y + 8.0), Vector2(east_u, ring_v - 6.0)],
		[Vector2(land_u, plaza.y - 15.0), Vector2(land_u, -ring_v + 8.0)], [Vector2(-ring_u, plaza.y + 8.0), Vector2(-ring_u, ring_v - 8.0)],
		[Vector2(ring_u, plaza.y + 8.0), Vector2(ring_u, ring_v - 8.0)], [Vector2(gate_u + 18.0, castle_v + 17.0), Vector2(land_u - 6.0, castle_v + 17.0)]]
	for ln: Array in lines:
		var a2: Vector2 = ln[0]; var b2: Vector2 = ln[1]
		var dirv := (b2 - a2).normalized()
		var len := a2.distance_to(b2)
		var t := 5.0
		while t < len - 3.0 and homes < want_homes:
			var p := a2 + dirv * t
			for side: float in [-1.0, 1.0]:
				if homes >= want_homes: break
				var nrm: Vector2 = Vector2(-dirv.y, dirv.x) * side
				var hpos: Vector2 = p + nrm * 9.5
				if not _free(hpos.x, hpos.y, 4.6): continue
				var face: Vector2 = -nrm
				var yaw := atan2(face.x, face.y)
				var kind := "home_A" if rng.randf() < 0.55 else "home_B"
				var h := _building("home", TOWN + "building_%s_%s.gltf" % [kind, color], hpos.x, hpos.y, yaw, sc * (1.0 if kind == "home_A" else 0.92), {"cap": 5})
				_door_node(h)
				C.homes.append(C.buildings.size() - 1)
				_reserve(hpos.x - 5.0, hpos.y - 5.0, hpos.x + 5.0, hpos.y + 5.0)
				homes += 1
				# a barrel, a crate or a cart by the house
				if rng.randf() < 0.45:
					var side2 := rng.randf_range(-1.0, 1.0) * 4.0
					var pp: Vector2 = hpos + face * 5.2 + Vector2(face.y, -face.x) * side2
					_put(TOWN + ["barrel", "crate_A_small", "sack", "wheelbarrow", "bucket_water"][rng.randi() % 5] + ".gltf", pp.x, pp.y, rng.randf() * TAU, 5.0, "prop", false)
			t += 11.0
	# gardens: trees and bushes in what is left inside
	var trees := ["CommonTree_1", "CommonTree_3", "Bush_Common_Flowers", "Bush_Common", "CommonTree_2"]
	for i in 140:
		var u := rng.randf_range(-hw + 14.0, hw - 14.0); var v := rng.randf_range(-hd + 14.0, hd - 14.0)
		if not _free(u, v, 3.0): continue
		var on_street := false
		for n in C.nodes:
			if Vector2(n[0], n[1]).distance_to(W(u, v)) < 7.0: on_street = true; break
		if on_street: continue
		var tk: String = trees[rng.randi() % trees.size()]
		var big_tree := tk.begins_with("CommonTree")
		_put("res://assets/nature/%s.gltf" % tk, u, v, rng.randf() * TAU, rng.randf_range(1.6, 2.2) if big_tree else rng.randf_range(1.4, 2.0), "tree", big_tree, 0.0)
		if big_tree: C.boxes[C.boxes.size() - 1][3] = 0.6; C.boxes[C.boxes.size() - 1][4] = 0.6
		_reserve(u - 3.5, v - 3.5, u + 3.5, v + 3.5)
	# outside: fields and windmills on the land side, the docks on the sea side
	var fv := -hd - 34.0
	for i in 4:
		var fu := -60.0 + i * 40.0
		if absf(fu - land_u) < 16.0: fu += 18.0
		_put(TOWN + "building_grain.gltf", fu, fv, 0.0, 3.4, "field", false)
		_paint_rect("field", fu - 16.0, fv - 17.0, fu + 16.0, fv + 17.0)
		for k in 2: _spot("farm", fu - 6.0 + k * 12.0, fv + rng.randf_range(-8.0, 8.0), rng.randf() * TAU)
	for i in 2:
		var wm := _building("windmill", TOWN + "building_windmill_%s.gltf" % color, -86.0 + i * 172.0, fv + 6.0, 0.0, sc)
		_door_node(wm)
	var fc := W(0.0, -hd - 50.0); keep_clear.append([fc.x, fc.y, 85.0])
	var lm := _building("lumber", TOWN + "building_lumbermill_%s.gltf" % color, land_u + 34.0, -hd - 70.0, 0.0, sc)
	_door_node(lm)
	for i in 3: _spot("chop", land_u + 24.0 + i * 8.0, -hd - 84.0, PI)
	if big:
		var wmill := _building("watermill", TOWN + "building_watermill_%s.gltf" % color, -hw - 30.0, 8.0, -PI * 0.5, sc)
		_door_node(wmill)
	# the docks: crates and barrels on the beach outside the sea gate, the fishers and the dockers
	for i in 14:
		var du := gate_u + rng.randf_range(-44.0, 44.0); var dv := hd + rng.randf_range(14.0, 28.0)
		if absf(du - gate_u) < 6.0: continue
		var gp := W(du, dv)
		if _ground(gp.x, gp.y) < 0.35: continue
		_put(TOWN + ["barrel", "crate_long_A", "crate_A_small", "sack", "barrel"][rng.randi() % 5] + ".gltf", du, dv, rng.randf() * TAU, 5.0, "prop", true, 0.1, _ground(gp.x, gp.y))
	for i in 6: _spot("fish", gate_u - 30.0 + i * 12.0, hd + 30.0, 0.0)
	for i in 6: _spot("dock", gate_u - 15.0 + i * 6.0, hd + 20.0, 0.0)
	for g in C.gates:
		var gp := Vector2(g.x, g.z); var f := Vector2(sin(g.yaw), cos(g.yaw)); var r := Vector2(f.y, -f.x)
		for s: float in [-1.0, 1.0]:
			var q: Vector2 = gp - f * 6.0 + r * s * 4.0
			if not C.spots.has("gate"): C.spots["gate"] = []
			C.spots.gate.append([q.x, q.y, g.yaw])
	C["landing"] = _landing()
	return C

# the stables: fence around a paddock, a barn along its back, hay and troughs; stalls for horses
func _stables(a: Vector2, b: Vector2, color: String) -> Dictionary:
	var u0 := a.x; var v0 := a.y; var u1 := b.x; var v1 := b.y
	_paint_rect("yard", u0, v0, u1, v1)
	var fsc := 1.3   # a fence piece is about 5.8 m * 1.3 / 5 long
	var piece := _size(TOWN + "fence_wood_straight.gltf").size.z * fsc
	# fence: the four sides, a gate in the side toward the city's middle (+u)
	for side in 4:
		var p0: Vector2; var p1: Vector2
		match side:
			0: p0 = Vector2(u0, v0); p1 = Vector2(u1, v0)
			1: p0 = Vector2(u1, v0); p1 = Vector2(u1, v1)
			2: p0 = Vector2(u1, v1); p1 = Vector2(u0, v1)
			3: p0 = Vector2(u0, v1); p1 = Vector2(u0, v0)
		var len := p0.distance_to(p1); var d := (p1 - p0).normalized()
		var n := maxi(1, int(round(len / piece)))
		for i in n:
			var p := p0 + d * (i + 0.5) * len / n
			var yaw := atan2(d.x, d.y)
			var gate := side == 1 and i == n / 2
			var f := _put(TOWN + ("fence_wood_straight_gate.gltf" if gate else "fence_wood_straight.gltf"), p.x, p.y, yaw, fsc, "fence", not gate, 0.0)
	# the barn: a long wooden building with a roof, along the far side
	var barn_v := v1 - 7.0
	var barn_len := minf(u1 - u0 - 6.0, 34.0)
	var bmid := Vector2((u0 + u1) * 0.5 - 2.0, barn_v)
	_barn(bmid, barn_len, 9.0, color)
	var bw := W(bmid.x, bmid.y)
	C.boxes.append([bw.x, bw.y, WY(0.0), barn_len * 0.5, 4.5])
	# hay and troughs
	for i in 3:
		_put(TOWN + "building_grain.gltf", u0 + 6.0 + i * 5.0, v0 + 5.0, 0.0, 0.45, "hay", false)
		_put(TOWN + "bucket_water.gltf", u1 - 6.0 - i * 4.0, v0 + 4.0, 0.0, 5.0, "trough", false)
	# the stalls: horses stand here
	var slots := []
	var cols := maxi(2, int((u1 - u0 - 8.0) / 5.0)); var rows := maxi(2, int((barn_v - 6.0 - v0 - 6.0) / 5.0))
	for r in rows:
		for c in cols:
			var p := W(u0 + 5.0 + c * (u1 - u0 - 10.0) / maxf(1.0, cols - 1), v0 + 7.0 + r * (barn_v - 6.0 - v0 - 8.0) / maxf(1.0, rows - 1))
			slots.append([snappedf(p.x, 0.01), snappedf(p.y, 0.01)])
	var gate_p := W(u1 + 4.0, (v0 + v1) * 0.5)
	var k := _link_world(gate_p)
	for i in 3: _spot("groom", u1 - 4.0, (v0 + v1) * 0.5 - 4.0 + i * 4.0, -PI * 0.5)
	var ctr := W((u0 + u1) * 0.5, (v0 + v1) * 0.5)
	return {"x": ctr.x, "z": ctr.y, "hx": absf(u1 - u0) * 0.5, "hz": absf(v1 - v0) * 0.5, "slots": slots, "gate": [gate_p.x, gate_p.y], "node": k}

# a barn: wooden walls, a roof of two slopes, open doors; drawn from simple boxes so it fits the KayKit style
func _barn(mid: Vector2, length: float, depth: float, color: String):
	var p := W(mid.x, mid.y)
	var n := Node3D.new(); n.position = Vector3(p.x, gy, p.y); n.rotation.y = WY(0.0); holder.add_child(n)
	var wood := StandardMaterial3D.new(); wood.albedo_color = Color(0.55, 0.33, 0.2); wood.roughness = 0.85
	var dark := StandardMaterial3D.new(); dark.albedo_color = Color(0.36, 0.22, 0.14); dark.roughness = 0.9
	var roofc: Color = {"blue": Color(0.22, 0.45, 0.82), "red": Color(0.75, 0.2, 0.17)}.get(color, Color(0.5, 0.3, 0.2))
	var roof := StandardMaterial3D.new(); roof.albedo_color = roofc; roof.roughness = 0.7
	var stone := StandardMaterial3D.new(); stone.albedo_color = Color(0.62, 0.64, 0.68); stone.roughness = 0.9
	var hgt := 4.6
	_box(n, Vector3(0, 0.4, 0), Vector3(length + 0.6, 0.8, depth + 0.6), stone)
	_box(n, Vector3(0, hgt * 0.5 + 0.4, -depth * 0.5 + 0.2), Vector3(length, hgt, 0.4), wood)      # back wall
	for s: float in [-1.0, 1.0]: _box(n, Vector3(s * length * 0.5, hgt * 0.5 + 0.4, 0), Vector3(0.4, hgt, depth), wood)
	# the front: posts between open stalls
	var posts := int(length / 4.0)
	for i in posts + 1:
		_box(n, Vector3(-length * 0.5 + i * length / posts, hgt * 0.5 + 0.4, depth * 0.5 - 0.2), Vector3(0.45, hgt, 0.45), dark)
	_box(n, Vector3(0, hgt + 0.25, depth * 0.5 - 0.2), Vector3(length, 0.5, 0.5), dark)
	# the roof
	for s: float in [-1.0, 1.0]:
		var r := MeshInstance3D.new(); var bm := BoxMesh.new(); bm.size = Vector3(length + 1.6, 0.35, depth * 0.62); r.mesh = bm; r.material_override = roof
		r.position = Vector3(0, hgt + 1.6, s * depth * 0.26); r.rotation.x = s * 0.62
		n.add_child(r)
	_box(n, Vector3(0, hgt + 2.95, 0), Vector3(length + 1.7, 0.35, 0.6), dark)

func _box(parent: Node3D, pos: Vector3, size: Vector3, mat: Material):
	var m := MeshInstance3D.new(); var bm := BoxMesh.new(); bm.size = size; m.mesh = bm; m.material_override = mat
	m.position = pos; parent.add_child(m)

# where invaders come ashore: the beach in front of the sea gate
func _landing() -> Array:
	var g: Dictionary = {}
	for q in C.gates: if q.id == "sea": g = q
	if g.is_empty(): return [cx, cz + hd * sd + 40.0 * sd]
	var f := Vector2(sin(g.yaw), cos(g.yaw))
	var p := Vector2(g.x, g.z)
	for i in 80:
		var q := p + f * (6.0 + i * 1.5)
		if _ground(q.x, q.y) < 0.35: return [snappedf(q.x - f.x * 4.0, 0.01), snappedf(q.y - f.y * 4.0, 0.01)]
	return [p.x + f.x * 30.0, p.y + f.y * 30.0]

# ---------------------------------------------------------------- the tribe on the lost island: a palisade and huts
func _tribal_city() -> Dictionary:
	_begin("lost", "שבט האי האבוד", "green", -1.0, "tribal")
	var R := minf(hw, hd) - 6.0
	var fsc := 1.25
	var piece := _size(TOWN + "fence_wood_straight.gltf").size.z * fsc
	var n := int(TAU * R / piece)
	var gate_i := [0, n / 2]   # toward the sea (local +v... at angle 90 deg) and inland
	for i in n:
		var a := PI * 0.5 + i * TAU / n
		var u := cos(a) * R; var v := sin(a) * R
		var yaw := atan2(-sin(a), cos(a)) + PI * 0.5   # along the circle
		var tangent := Vector2(-sin(a), cos(a))
		yaw = atan2(tangent.x, tangent.y)
		if i in gate_i:
			_put(TOWN + "fence_wood_straight_gate.gltf", u, v, yaw, fsc, "fence", false)
			var p := W(u, v); var out := W(cos(a) * (R + 9.0), sin(a) * (R + 9.0)); var inn := W(cos(a) * (R - 9.0), sin(a) * (R - 9.0))
			C.gates.append({"id": "sea" if i == 0 else "land", "x": p.x, "z": p.y, "yaw": WY(atan2(cos(a), sin(a))), "w": 4.0, "out": [out.x, out.y], "in": [inn.x, inn.y]})
		else:
			_put(TOWN + "fence_wood_straight.gltf", u, v, yaw, fsc, "fence", true, 0.0)
	# paths: from each gate to the fire in the middle, and a ring
	_street(Vector2(0, R + 14.0), Vector2(0, 0), 5.0)
	_street(Vector2(0, 0), Vector2(0, -R - 14.0), 5.0)
	var ring := []
	for i in 12:
		var a := i * TAU / 12.0
		ring.append(Vector2(cos(a), sin(a)) * R * 0.6)
	for i in 12: _street(ring[i], ring[(i + 1) % 12], 4.0)
	_street(Vector2(0, R * 0.6), Vector2(0, R), 4.0)
	# the fire and the chief's longhouse
	C["plaza"] = [W(0, 0).x, W(0, 0).y]
	_paint_rect("plaza", -10.0, -10.0, 10.0, 10.0)
	var fire := _put("res://assets/nf/campfire.glb", 0, 0, 0.0, 3.0, "fire", true, 0.0)
	for i in 8:
		var a := i * TAU / 8.0
		_spot("drink", cos(a) * 6.0, sin(a) * 6.0, a + PI)
	var lh_v := -R * 0.45
	var lh := _building("castle", PIRATE + "structure-roof.glb", 0.0, lh_v, 0.0, 2.6)
	_door_node(lh)
	C["castle"] = {"x": lh.x, "z": lh.z, "door": lh.door, "yaw": lh.yaw}
	_spot("throne", 0.0, lh_v + 2.0, 0.0)
	for i in 4: _spot("guard", -5.0 + (i % 2) * 10.0, lh_v + 8.0 + int(i / 2) * 4.0, 0.0)
	# huts in two rings
	for ring_i in 2:
		var rr := R * (0.84 if ring_i == 0 else 0.45)
		var cnt := 22 if ring_i == 0 else 11
		for i in cnt:
			var a := i * TAU / cnt + (0.12 if ring_i == 0 else 0.4)
			var u := cos(a) * rr; var v := sin(a) * rr
			if absf(u) < 7.5 and (v > R * 0.25 or v < -R * 0.15): continue
			if Vector2(u, v - lh_v).length() < 13.0: continue
			if Vector2(u + R * 0.62, v - R * 0.05).length() < 12.0 or Vector2(u - R * 0.62, v - R * 0.05).length() < 12.0: continue
			var face := -Vector2(u, v).normalized()
			var yaw := atan2(face.x, face.y)
			var kind := (i + ring_i) % 3
			var h: Dictionary
			if kind == 0: h = _building("home", "res://assets/nf/tent.glb", u, v, yaw, 2.6, {"cap": 4})
			elif kind == 1: h = _building("home", TOWN + "tent.gltf", u, v, yaw, 2.4, {"cap": 4})
			else: h = _building("home", PIRATE + "structure-roof.glb", u, v, yaw, 1.2, {"cap": 5})
			_door_node(h)
			C.homes.append(C.buildings.size() - 1)
	# totems and drums: crates stacked, barrels, campfires by the huts
	for i in 10:
		var a := rng.randf() * TAU; var rr := rng.randf_range(R * 0.55, R * 0.72)
		var u := cos(a) * rr; var v := sin(a) * rr
		_put(["res://assets/nf/campfire.glb", TOWN + "barrel.gltf", TOWN + "sack.gltf"][i % 3], u, v, rng.randf() * TAU, [1.6, 5.0, 5.0][i % 3], "prop", false)
	# pens for the war beasts: raptors inside the palisade, the big ones outside by the inland gate
	var pens := []
	for pdef: Array in [[Vector2(-R * 0.62, R * 0.05), 9.0, "raptor"], [Vector2(R * 0.62, R * 0.05), 9.0, "raptor"], [Vector2(0, -R - 26.0), 15.0, "big"]]:
		var pc: Vector2 = pdef[0]; var pr: float = pdef[1]
		var m := int(TAU * pr / (piece * 0.8))
		for i in m:
			var a := i * TAU / m
			var tangent := Vector2(-sin(a), cos(a))
			_put(TOWN + "fence_wood_straight.gltf", pc.x + cos(a) * pr, pc.y + sin(a) * pr, atan2(tangent.x, tangent.y), fsc * 0.8, "fence", false)
		var pw := W(pc.x, pc.y)
		pens.append({"x": pw.x, "z": pw.y, "r": pr - 2.0, "kind": pdef[2]})
	C["pens"] = pens
	for i in 6: _spot("train", -12.0 + i * 5.0, R * 0.3, PI)
	for i in 6: _spot("farm", rng.randf_range(-R * 0.7, R * 0.7), rng.randf_range(-R * 0.5, R * 0.3), rng.randf() * TAU)
	for i in 4: _spot("fish", -16.0 + i * 10.0, R + 22.0, 0.0)
	C["train"] = [W(0, R * 0.3).x, W(0, R * 0.3).y]
	for i in 4:
		var a := i * TAU / 4.0 + PI * 0.25
		var q := W(cos(a) * R * 0.95, sin(a) * R * 0.95)
		C.flags.append([q.x, q.y])
	C["landing"] = _landing()
	keep_clear.append([cx, cz, R + 30.0])
	return C

# ---------------------------------------------------------------- the pirates' fort: stone walls, towers, cannons
func _pirate_city() -> Dictionary:
	_begin("pirate", "מבצר השודדים", "black", -1.0, "pirate")
	_rect_walls(PIRATE + "castle-wall.glb", 2.6, PIRATE + "castle-gate.glb", 2.6, 5.6, PIRATE + "tower-complete-small.glb", 2.8, [["n", 0.0, "sea"]])
	# inside: a yard, huts of wood and the captain's hall
	_street(Vector2(0, hd + 16.0), Vector2(0, -hd + 16.0), 6.0)
	_street(Vector2(-hw + 12.0, 0), Vector2(hw - 12.0, 0), 6.0)
	C["plaza"] = [W(0, 4).x, W(0, 4).y]
	_paint_rect("plaza", -12.0, -8.0, 12.0, 14.0)
	_reserve(-14.0, -10.0, 14.0, 16.0)
	var hall := _building("castle", TOWN + "building_tavern_yellow.gltf", 0.0, -hd + 16.0, 0.0, 7.0)
	_door_node(hall)
	C["castle"] = {"x": hall.x, "z": hall.z, "door": hall.door, "yaw": hall.yaw}
	_spot("throne", 0.0, -hd + 26.0, 0.0)
	for i in 4: _spot("guard", -5.0 + (i % 2) * 10.0, -hd + 27.0 + int(i / 2) * 4.0, 0.0)
	_reserve(-12.0, -hd + 6.0, 12.0, -hd + 30.0)
	var chest := _put(PIRATE + "chest.glb", 3.0, 6.0, 0.4, 2.2, "chest", true, 0.0)
	var huts := 0
	for row: Array in [[-hw + 19.0, 0.0], [hw - 19.0, PI]]:
		for i in 5:
			var v := -hd + 12.0 + i * 13.0
			if v > hd - 10.0: break
			var u: float = row[0]
			if not _free(u, v, 5.0): continue
			var path := PIRATE + ("structure.glb" if i % 2 == 0 else "structure-roof.glb")
			var h := _building("home", path, u, v, PI * 0.5 if row[0] < 0 else -PI * 0.5, 1.9, {"cap": 6})
			_door_node(h)
			C.homes.append(C.buildings.size() - 1)
			huts += 1
	var tav := _building("tavern", TOWN + "building_home_B_yellow.gltf", 20.0, 22.0, -PI * 0.5, 7.0)
	_door_node(tav)
	for i in 4: _spot("drink", 12.0, 18.0 + i * 2.5, PI * 0.5)
	# cannons on the sea wall, aiming out
	var cannons := []
	for i in 4:
		var u := -hw + 10.0 + i * (2.0 * hw - 20.0) / 3.0
		if absf(u) < 10.0: continue
		var cp := _put(PIRATE + "cannon.glb", u, hd - 6.0, 0.0, 1.0, "cannon", true, 0.0)
		cannons.append([cp.x, cp.z, WY(0.0)])
	C["cannons"] = cannons
	# kennels for the war dogs
	var kp := Vector2(-hw + 22.0, hd - 18.0)
	_reserve(kp.x - 8.0, kp.y - 6.0, kp.x + 8.0, kp.y + 6.0)
	for i in 4:
		_put(TOWN + "fence_wood_straight.gltf", kp.x - 6.0 + i * 4.0, kp.y - 5.0, PI * 0.5, 0.8, "fence", false)
	var kw := W(kp.x, kp.y)
	C["pens"] = [{"x": kw.x, "z": kw.y, "r": 5.0, "kind": "dog"}]
	for i in 12:
		var u := rng.randf_range(-hw + 8.0, hw - 8.0); var v := rng.randf_range(-hd + 8.0, hd - 8.0)
		if not _free(u, v, 2.5): continue
		var what: String = ["barrel.glb", "crate.glb", "crate-bottles.glb", "barrel.glb"][rng.randi() % 4]
		_put(PIRATE + what, u, v, rng.randf() * TAU, 1.6, "prop", true, 0.0)
		_reserve(u - 2.0, v - 2.0, u + 2.0, v + 2.0)
	for i in 6: _spot("train", -10.0 + i * 4.0, -6.0, PI)
	for i in 4: _spot("fish", -12.0 + i * 8.0, hd + 24.0, 0.0)
	C["train"] = [W(0, -6).x, W(0, -6).y]
	var fl := W(0, hd + 1.0); C.flags.append([fl.x, fl.y])
	C["landing"] = _landing()
	return C
