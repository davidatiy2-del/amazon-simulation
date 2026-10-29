class_name HeightData
extends RefCounted
# The ground height anywhere, read from world/height.bin (made by tools/worldgen.gd), and the trunks to walk around.
const N := 513
const CELL := 2.0
const HALF := 512.0
static var H: PackedFloat32Array
static var trunks: PackedFloat32Array
static var grid := {}   # 16 m cells -> list of trunk indexes

func _init():
	if H.is_empty():
		H = FileAccess.get_file_as_bytes("res://world/height.bin").to_float32_array()
		trunks = FileAccess.get_file_as_bytes("res://world/trunks.bin").to_float32_array()
		for k in trunks.size() / 3:
			var key := Vector2i(int(floor(trunks[k * 3] / 16.0)), int(floor(trunks[k * 3 + 1] / 16.0)))
			if not grid.has(key): grid[key] = PackedInt32Array()
			grid[key].append(k)

func _at(i: int, j: int) -> float: return H[clampi(j, 0, N - 1) * N + clampi(i, 0, N - 1)]
func height(x: float, z: float) -> float:
	var fx := (x + HALF) / CELL; var fz := (z + HALF) / CELL
	var i := int(floor(fx)); var j := int(floor(fz)); var tx := fx - i; var tz := fz - j
	return lerpf(lerpf(_at(i, j), _at(i + 1, j), tx), lerpf(_at(i, j + 1), _at(i + 1, j + 1), tx), tz)
func normal(x: float, z: float) -> Vector3:
	return Vector3(height(x - 1, z) - height(x + 1, z), 2.0, height(x, z - 1) - height(x, z + 1)).normalized()
func water_depth(x: float, z: float) -> float: return maxf(0.0, WorldShape.WATER - height(x, z))
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
