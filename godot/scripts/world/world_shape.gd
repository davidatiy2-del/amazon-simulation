class_name WorldShape
# The shape of the jungle: hills, the river that winds through it, a lake joined to the river by a stream, and
# mountains around the edge. Used once, offline, by tools/worldgen.gd: the game loads the result (world/height.bin).
const SIZE := 1024.0          # meters, the world is [-512, 512] in x and z
const CELL := 2.0             # meters between height samples
const N := 513                # samples per side (SIZE / CELL + 1)
const WATER := 0.0            # the water level

var hills := FastNoiseLite.new()
var detail := FastNoiseLite.new()
var wander := FastNoiseLite.new()
var forest := FastNoiseLite.new()
var river: PackedVector2Array = []     # the river's middle line, every 6 m from north to south
var rwidth: PackedFloat32Array = []    # its width there
var stream: PackedVector2Array = []    # the stream from the lake to the river
var lake := Vector3(175, 70, 52)       # x, z, radius

func _init():
	hills.seed = 7; hills.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; hills.frequency = 0.0042
	hills.fractal_type = FastNoiseLite.FRACTAL_FBM; hills.fractal_octaves = 4
	detail.seed = 11; detail.noise_type = FastNoiseLite.TYPE_SIMPLEX; detail.frequency = 0.035; detail.fractal_octaves = 2
	wander.seed = 3; wander.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; wander.frequency = 0.004
	forest.seed = 21; forest.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; forest.frequency = 0.012; forest.fractal_octaves = 3
	var z := -600.0
	while z <= 600.0:
		var x := 115.0 * sin(z * 0.0058 + 0.7) + 55.0 * sin(z * 0.017 + 2.1) + 28.0 * wander.get_noise_1d(z) - 70.0
		river.append(Vector2(x, z)); rwidth.append(17.0 + 6.0 * sin(z * 0.011) + 3.0 * wander.get_noise_1d(z + 900.0))
		z += 6.0
	# the stream: from the lake's western shore to the nearest point of the river, bending a little
	var a := Vector2(lake.x - lake.z * 0.9, lake.y + 10)
	var best := river[0]
	for p in river: if p.distance_to(a) < best.distance_to(a): best = p
	for i in 13:
		var t := i / 12.0
		var p := a.lerp(best, t)
		p += Vector2(0, 18.0 * sin(t * PI))
		stream.append(p)

static func _seg_dist(p: Vector2, a: Vector2, b: Vector2) -> Array:
	var ab := b - a; var t := clampf((p - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
	return [p.distance_to(a + ab * t), t]

# distance to the river's middle line, and the river's width there
func river_at(x: float, z: float) -> Vector2:
	var p := Vector2(x, z)
	var i := clampi(int((z + 600.0) / 6.0), 0, river.size() - 2)
	var best := 1e9; var w := 18.0
	for k in range(maxi(0, i - 30), mini(river.size() - 1, i + 30)):
		var r: Array = _seg_dist(p, river[k], river[k + 1])
		if r[0] < best: best = r[0]; w = lerpf(rwidth[k], rwidth[k + 1], r[1])
	return Vector2(best, w)

func stream_at(x: float, z: float) -> float:
	var p := Vector2(x, z); var best := 1e9
	for k in stream.size() - 1: best = minf(best, _seg_dist(p, stream[k], stream[k + 1])[0])
	return best

# how deep under water a point is if it is in a channel: <0 means under the water line
func channel(x: float, z: float) -> float:
	var r := river_at(x, z)
	var dr := r.x - r.y * 0.5                                  # meters outside the river's edge (negative: inside)
	var ds := stream_at(x, z) - 4.0
	var dl := Vector2(x, z).distance_to(Vector2(lake.x, lake.y)) - (lake.z + 7.0 * detail.get_noise_2d(x * 0.6, z * 0.6))
	return minf(dr, minf(ds, dl))

func height(x: float, z: float) -> float:
	return height_d(x, z, channel(x, z))

# the height, when the distance to the water (channel) is already known
func height_d(x: float, z: float, d: float) -> float:
	var base := 7.0 + hills.get_noise_2d(x, z) * 19.0 + detail.get_noise_2d(x, z) * 1.3
	base = maxf(base, 1.2 + detail.get_noise_2d(x, z) * 0.6)
	var edge := maxf(absf(x), absf(z)) / 512.0
	base += smoothstep(0.72, 1.0, edge) * 46.0
	if d < 0.0:
		var depth := clampf(-d / 7.0, 0.0, 1.0)
		return WATER - 0.35 - 2.9 * (1.0 - (1.0 - depth) * (1.0 - depth))
	var plain := 0.55 + 0.35 * detail.get_noise_2d(x * 0.5, z * 0.5)
	return lerpf(plain, base, smoothstep(0.0, 1.0, clampf(d / 46.0, 0.0, 1.0)))

# 0..1: how thick the forest is (clearings where it is low)
func forest_at(x: float, z: float) -> float:
	return clampf(0.62 + forest.get_noise_2d(x, z) * 0.9, 0.0, 1.0)
