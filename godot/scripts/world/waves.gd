class_name Waves
# The water's waves on the CPU, the same as in shaders/water.gdshader, so boats rise and fall with what is drawn.
static var t := 0.0      # seconds; the game sets it every frame and gives the same value to the water's "wtime"

static func ripple(x: float, z: float) -> float:
	return sin(x * 0.35 + t * 1.3) * 0.5 + sin(z * 0.28 - t * 1.1) * 0.5 + sin((x + z) * 0.9 + t * 2.3) * 0.18

static func swell(x: float, z: float) -> float:
	return sin(x * 0.045 + t * 0.9) * 0.55 + sin(z * 0.06 - t * 0.7 + x * 0.02) * 0.45 + sin((x - z) * 0.11 + t * 1.6) * 0.15

static func swell_amp(depth: float) -> float:
	return 0.42 * smoothstep(3.5, 12.0, depth)

# the water's surface at (x, z), where the water is `depth` meters deep
static func level(x: float, z: float, depth: float) -> float:
	return WorldShape.WATER + ripple(x, z) * 0.04 + swell(x, z) * swell_amp(depth)
