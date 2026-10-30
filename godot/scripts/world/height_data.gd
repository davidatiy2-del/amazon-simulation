class_name HeightData
extends RefCounted
# The ground height anywhere, read from world/height.bin (made by tools/worldgen.gd), the trunks to walk around,
# the piers to walk on, and the places the game needs (harbors, the start) from world/places.json.
const NX := WorldShape.NX
const NZ := WorldShape.NZ
const CELL := WorldShape.CELL
const X0 := WorldShape.X0
const Z0 := WorldShape.Z0
const XMIN := -500.0           # how far anyone may go
const XMAX := 500.0
const ZMIN := -500.0
const ZMAX := 2548.0
static var H: PackedFloat32Array
static var trunks: PackedFloat32Array
static var grid := {}   # 16 m cells -> list of trunk indexes
static var places := {}
static var decks: Array = []   # walkable boxes: {x, z, yaw, hx, hz, top}

func _init():
	if H.is_empty():
		H = FileAccess.get_file_as_bytes("res://world/height.bin").to_float32_array()
		trunks = FileAccess.get_file_as_bytes("res://world/trunks.bin").to_float32_array()
		for k in trunks.size() / 3:
			var key := Vector2i(int(floor(trunks[k * 3] / 16.0)), int(floor(trunks[k * 3 + 1] / 16.0)))
			if not grid.has(key): grid[key] = PackedInt32Array()
			grid[key].append(k)
		var p = JSON.parse_string(FileAccess.get_file_as_string("res://world/places.json"))
		places = p if p is Dictionary else {}
		for hb in places.get("harbors", []):
			var z0: float = hb.z0; var z1: float = hb.z1
			decks.append({"x": float(hb.x), "z": (z0 + z1) * 0.5, "yaw": 0.0, "hx": 2.5, "hz": absf(z1 - z0) * 0.5, "top": float(hb.top)})

func _at(i: int, j: int) -> float: return H[clampi(j, 0, NZ - 1) * NX + clampi(i, 0, NX - 1)]
# the ground (terrain only)
func height(x: float, z: float) -> float:
	var fx := (x - X0) / CELL; var fz := (z - Z0) / CELL
	if fx < 0.0 or fz < 0.0 or fx > NX - 1 or fz > NZ - 1: return -30.0   # beyond the map: the open sea
	var i := int(floor(fx)); var j := int(floor(fz)); var tx := fx - i; var tz := fz - j
	return lerpf(lerpf(_at(i, j), _at(i + 1, j), tx), lerpf(_at(i, j + 1), _at(i + 1, j + 1), tx), tz)
# a pier's planks under (x, z), or -INF
func deck(x: float, z: float) -> float:
	for d in decks:
		if absf(x - d.x) <= d.hx and absf(z - d.z) <= d.hz: return d.top
	return -INF
# what one stands on: the ground or a pier
func ground(x: float, z: float) -> float:
	return maxf(height(x, z), deck(x, z))
func normal(x: float, z: float) -> Vector3:
	return Vector3(height(x - 1, z) - height(x + 1, z), 2.0, height(x, z - 1) - height(x, z + 1)).normalized()
func water_depth(x: float, z: float) -> float: return maxf(0.0, WorldShape.WATER - height(x, z))
func on_deck(x: float, z: float) -> bool: return deck(x, z) > -INF
func in_bounds(x: float, z: float) -> bool: return x > XMIN and x < XMAX and z > ZMIN and z < ZMAX
func clamp_pos(p: Vector3) -> Vector3:
	p.x = clampf(p.x, XMIN, XMAX); p.z = clampf(p.z, ZMIN, ZMAX)
	return p
func is_new_world(z: float) -> bool: return z > WorldShape.NEW_WORLD_Z
func harbor(id: String) -> Dictionary:
	for hb in places.get("harbors", []):
		if hb.id == id: return hb
	return {}
# pushes a point out of any trunk it is inside of (r: the body's radius)
func push_out(p: Vector3, r: float) -> Vector3:
	var c := Vector2i(int(floor(p.x / 16.0)), int(floor(p.z / 16.0)))
	for dz in range(-1, 2):
		for dx in range(-1, 2):
			var key := c + Vector2i(dx, dz)
			if not grid.has(key): continue
			for k in grid[key]:
				var tx := trunks[k * 3]; var tz := trunks[k * 3 + 1]; var tr := trunks[k * 3 + 2] + r
				var ddx := p.x - tx; var ddz := p.z - tz; var d2 := ddx * ddx + ddz * ddz
				if d2 < tr * tr and d2 > 0.0001:
					var d := sqrt(d2); p.x = tx + ddx / d * tr; p.z = tz + ddz / d * tr
	return p
# the nearest dry land (or pier) to (x, z) within r meters, or Vector3.INF
func land_near(x: float, z: float, r: float) -> Vector3:
	var best := Vector3.INF; var bd := 1e9
	var step := 2.0
	var a := -r
	while a <= r:
		var b := -r
		while b <= r:
			var px := x + a; var pz := z + b
			var dd := a * a + b * b
			if dd < r * r and dd < bd:
				var g := ground(px, pz)
				if g > WorldShape.WATER + 0.1: bd = dd; best = Vector3(px, g, pz)
			b += step
		a += step
	return best
