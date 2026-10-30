class_name WorldShape
# The shape of the world, south of the jungle included:
#   the jungle (z < ~430): hills, the river that winds through it to the sea, a lake joined to the river by a stream,
#                          mountains on the west, the east and the north;
#   the sea (~430 .. ~1560): a shelf along each coast, deep water in the middle, two islands;
#   the new world (z > ~1560): grassy plains along its coast, hills with pine forests, a lake, mountains at its far edges.
# Used once, offline, by tools/worldgen.gd: the game loads the result (world/height.bin).
const X0 := -512.0            # the world is x in [X0, X0 + SIZE_X], z in [Z0, Z0 + SIZE_Z]
const Z0 := -512.0
const SIZE_X := 1024.0
const SIZE_Z := 3072.0
const CELL := 2.0             # meters between height samples
const NX := 513               # samples along x (SIZE_X / CELL + 1)
const NZ := 1537              # samples along z
const WATER := 0.0            # the water level
const NEW_WORLD_Z := 1400.0   # north of this: the new world's kinds of plants and animals

var hills := FastNoiseLite.new()
var hills2 := FastNoiseLite.new()
var detail := FastNoiseLite.new()
var wander := FastNoiseLite.new()
var forest := FastNoiseLite.new()
var pines := FastNoiseLite.new()
var coast := FastNoiseLite.new()
var river: PackedVector2Array = []     # the river's middle line, every 6 m from north to south, out into the sea
var rwidth: PackedFloat32Array = []    # its width there
var stream: PackedVector2Array = []    # the stream from the lake to the river
var lake := Vector3(175, 70, 52)       # x, z, radius (the jungle's lake)
var lake2 := Vector3(-130, 2080, 46)   # the new world's lake
var islands := [Vector3(190, 930, 48), Vector3(-250, 1180, 32)]   # x, z, radius

func _init():
	hills.seed = 7; hills.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; hills.frequency = 0.0042
	hills.fractal_type = FastNoiseLite.FRACTAL_FBM; hills.fractal_octaves = 4
	hills2.seed = 31; hills2.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; hills2.frequency = 0.0036
	hills2.fractal_type = FastNoiseLite.FRACTAL_FBM; hills2.fractal_octaves = 4
	detail.seed = 11; detail.noise_type = FastNoiseLite.TYPE_SIMPLEX; detail.frequency = 0.035; detail.fractal_octaves = 2
	wander.seed = 3; wander.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; wander.frequency = 0.004
	forest.seed = 21; forest.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; forest.frequency = 0.012; forest.fractal_octaves = 3
	pines.seed = 41; pines.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; pines.frequency = 0.009; pines.fractal_octaves = 3
	coast.seed = 51; coast.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH; coast.frequency = 0.012; coast.fractal_octaves = 2
	var z := -600.0
	while z <= 520.0:
		var x := 115.0 * sin(z * 0.0058 + 0.7) + 55.0 * sin(z * 0.017 + 2.1) + 28.0 * wander.get_noise_1d(z) - 70.0
		river.append(Vector2(x, z)); rwidth.append(17.0 + 6.0 * sin(z * 0.011) + 3.0 * wander.get_noise_1d(z + 900.0) + maxf(0.0, z - 330.0) * 0.12)
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

# ---------- the coasts ----------
# where the jungle ends at the sea (its z at a given x), and where the new world begins
func coast_jungle(x: float) -> float:
	return 425.0 + 22.0 * sin(x * 0.009 + 1.3) + 14.0 * sin(x * 0.023) + 12.0 * coast.get_noise_1d(x)
func coast_new(x: float) -> float:
	return 1565.0 + 30.0 * sin(x * 0.008 + 0.4) + 18.0 * sin(x * 0.02 + 1.0) + 14.0 * coast.get_noise_1d(x + 3000.0)

# meters inland from the nearest coast (negative: out at sea)
func land_s(x: float, z: float) -> float:
	var s := maxf(coast_jungle(x) - z, z - coast_new(x))
	for isl in islands:
		var d := Vector2(x, z).distance_to(Vector2(isl.x, isl.y))
		s = maxf(s, isl.z + 9.0 * coast.get_noise_2d(x * 2.0, z * 2.0) - d)
	return s

func is_island(x: float, z: float) -> bool:
	return z > coast_jungle(x) + 40.0 and z < coast_new(x) - 40.0

func is_new_world(z: float) -> bool: return z > NEW_WORLD_Z

# ---------- rivers and lakes ----------
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

# how far a point is outside the rivers and lakes (<0: inside, under the water line)
func channel(x: float, z: float) -> float:
	if z > 700.0:
		if z < 1700.0: return 1e9
		return Vector2(x, z).distance_to(Vector2(lake2.x, lake2.y)) - (lake2.z + 7.0 * detail.get_noise_2d(x * 0.6, z * 0.6))
	var r := river_at(x, z)
	var dr := r.x - r.y * 0.5                                  # meters outside the river's edge (negative: inside)
	var ds := stream_at(x, z) - 4.0
	var dl := Vector2(x, z).distance_to(Vector2(lake.x, lake.y)) - (lake.z + 7.0 * detail.get_noise_2d(x * 0.6, z * 0.6))
	return minf(dr, minf(ds, dl))

# meters to the nearest water of any kind (negative: in it)
func water_dist(x: float, z: float) -> float:
	return minf(channel(x, z), land_s(x, z))

# ---------- the height ----------
func height(x: float, z: float) -> float:
	return height_d(x, z, channel(x, z), land_s(x, z))

# the height, when the distance to rivers and lakes (d) and to the sea (s) are already known
func height_d(x: float, z: float, d: float, s: float) -> float:
	var bed := 1e9
	if d < 0.0:
		var depth := clampf(-d / 7.0, 0.0, 1.0)
		bed = WATER - 0.35 - 2.9 * (1.0 - (1.0 - depth) * (1.0 - depth))
	if s <= 0.0:
		var t := -s
		var sea := WATER - 0.3 - 4.5 * smoothstep(0.0, 45.0, t) - 24.0 * smoothstep(30.0, 240.0, t) + 1.4 * detail.get_noise_2d(x * 0.3, z * 0.3)
		return minf(sea, bed)
	var land: float
	if is_new_world(z): land = _new_world_land(x, z)
	elif is_island(x, z): land = _island_land(x, z, s)
	else: land = _jungle_land(x, z)
	# the beach: low near the water, rising inland
	var beach := 0.3 + s * 0.035 + 0.25 * detail.get_noise_2d(x * 0.5, z * 0.5)
	var h := lerpf(beach, land, smoothstep(0.0, 70.0, s))
	if d >= 0.0 and d < 46.0:   # the flat, low banks of rivers and lakes
		var plain := 0.55 + 0.35 * detail.get_noise_2d(x * 0.5, z * 0.5)
		h = lerpf(minf(plain, h), h, smoothstep(0.0, 1.0, d / 46.0))
	return minf(h, bed)

func _jungle_land(x: float, z: float) -> float:
	var base := 7.0 + hills.get_noise_2d(x, z) * 19.0 + detail.get_noise_2d(x, z) * 1.3
	base = maxf(base, 1.2 + detail.get_noise_2d(x, z) * 0.6)
	var edge := maxf(absf(x), maxf(0.0, -z)) / 512.0         # mountains west, east and north; the sea is south
	return base + smoothstep(0.72, 1.0, edge) * 46.0

func _island_land(x: float, z: float, s: float) -> float:
	return 1.2 + minf(s, 40.0) * 0.12 + 1.6 * hills.get_noise_2d(x * 3.0, z * 3.0)

func _new_world_land(x: float, z: float) -> float:
	var inland := z - coast_new(x)
	var base := 4.0 + hills2.get_noise_2d(x, z) * 15.0 + detail.get_noise_2d(x, z) * 1.1
	base = lerpf(2.2 + detail.get_noise_2d(x * 0.4, z * 0.4) * 0.8, base, smoothstep(40.0, 220.0, inland))   # plains by the coast
	base = maxf(base, 1.0 + detail.get_noise_2d(x, z) * 0.5)
	var edge := maxf(absf(x) / 512.0, (z - 1560.0) / 1000.0)  # mountains at the far edges
	return base + smoothstep(0.74, 1.0, edge) * 52.0

# ---------- what grows ----------
# 0..1: how thick the jungle is (clearings where it is low)
func forest_at(x: float, z: float) -> float:
	return clampf(0.62 + forest.get_noise_2d(x, z) * 0.9, 0.0, 1.0)

# 0..1: the new world's pine woods, on the hills
func pines_at(x: float, z: float, h: float) -> float:
	return clampf(0.35 + pines.get_noise_2d(x, z) * 1.1 + (h - 8.0) * 0.03, 0.0, 1.0)
