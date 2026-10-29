class_name DayNight
extends Node3D
# The sky, the sun and the moon, the fog and the light, moving through a day. time: 0..24 hours.
@export var time := 9.0
@export var day_minutes := 16.0   # one full day in real minutes
@export var running := true
var env: Environment; var sky_mat: ProceduralSkyMaterial; var sun: DirectionalLight3D; var moon: DirectionalLight3D
var day := 1

# key times: [hour, sky top, horizon, ground light, sun color, sun energy, fog color, ambient energy]
const KEYS := [
	[0.0,  Color(0.02, 0.03, 0.08), Color(0.05, 0.07, 0.13), Color(0.12, 0.15, 0.25), Color(0.5, 0.6, 0.9), 0.0, Color(0.04, 0.06, 0.1), 0.13],
	[5.0,  Color(0.03, 0.04, 0.1),  Color(0.08, 0.09, 0.16), Color(0.15, 0.17, 0.27), Color(0.5, 0.6, 0.9), 0.0, Color(0.06, 0.08, 0.12), 0.15],
	[6.3,  Color(0.22, 0.32, 0.55), Color(0.95, 0.55, 0.32), Color(0.6, 0.45, 0.4),   Color(1.0, 0.55, 0.3), 0.6, Color(0.7, 0.55, 0.45), 0.5],
	[8.0,  Color(0.25, 0.48, 0.82), Color(0.72, 0.8, 0.85),  Color(0.75, 0.75, 0.7),  Color(1.0, 0.88, 0.72), 1.1, Color(0.66, 0.74, 0.76), 0.75],
	[13.0, Color(0.2, 0.45, 0.85),  Color(0.68, 0.8, 0.9),   Color(0.8, 0.82, 0.78),  Color(1.0, 0.97, 0.9), 1.35, Color(0.68, 0.77, 0.82), 0.85],
	[17.0, Color(0.24, 0.44, 0.78), Color(0.8, 0.75, 0.65),  Color(0.75, 0.7, 0.62),  Color(1.0, 0.82, 0.6), 1.1, Color(0.72, 0.7, 0.62), 0.75],
	[18.6, Color(0.2, 0.25, 0.48),  Color(1.0, 0.48, 0.25),  Color(0.6, 0.4, 0.35),   Color(1.0, 0.45, 0.22), 0.55, Color(0.62, 0.42, 0.34), 0.5],
	[20.0, Color(0.04, 0.05, 0.12), Color(0.12, 0.1, 0.18),  Color(0.15, 0.15, 0.25), Color(0.5, 0.6, 0.9), 0.0, Color(0.07, 0.08, 0.13), 0.17],
	[24.0, Color(0.02, 0.03, 0.08), Color(0.05, 0.07, 0.13), Color(0.12, 0.15, 0.25), Color(0.5, 0.6, 0.9), 0.0, Color(0.04, 0.06, 0.1), 0.13],
]

func _ready():
	env = Environment.new()
	sky_mat = ProceduralSkyMaterial.new()
	sky_mat.sun_angle_max = 8.0; sky_mat.sun_curve = 0.08
	var sky := Sky.new(); sky.sky_material = sky_mat; sky.radiance_size = Sky.RADIANCE_SIZE_64
	env.background_mode = Environment.BG_SKY; env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY; env.ambient_light_sky_contribution = 0.75
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC; env.tonemap_exposure = 1.0; env.tonemap_white = 6.0
	env.fog_enabled = true; env.fog_density = 0.0028; env.fog_aerial_perspective = 0.35; env.fog_sky_affect = 0.25
	env.fog_height = 6.0; env.fog_height_density = 0.04
	env.glow_enabled = true; env.glow_intensity = 0.35; env.glow_bloom = 0.04; env.glow_hdr_threshold = 1.1
	env.adjustment_enabled = true; env.adjustment_saturation = 1.12; env.adjustment_contrast = 1.05
	var we := WorldEnvironment.new(); we.environment = env; add_child(we)
	sun = DirectionalLight3D.new(); sun.name = "Sun"; sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 70.0; sun.shadow_blur = 1.5; sun.shadow_bias = 0.05
	add_child(sun)
	moon = DirectionalLight3D.new(); moon.name = "Moon"; moon.light_color = Color(0.55, 0.65, 1.0); moon.light_energy = 0.0
	moon.sky_mode = DirectionalLight3D.SKY_MODE_LIGHT_ONLY
	add_child(moon)
	apply()

func _process(dt):
	if not running: return
	time += dt * 24.0 / (day_minutes * 60.0)
	if time >= 24.0: time -= 24.0; day += 1
	apply()

func is_night() -> bool: return time < 5.8 or time > 19.4

func apply():
	var a = KEYS[0]; var b = KEYS[1]
	for i in KEYS.size() - 1:
		if time >= KEYS[i][0] and time <= KEYS[i + 1][0]: a = KEYS[i]; b = KEYS[i + 1]; break
	var t: float = 0.0 if b[0] == a[0] else (time - a[0]) / (b[0] - a[0])
	t = smoothstep(0.0, 1.0, t)
	sky_mat.sky_top_color = a[1].lerp(b[1], t); sky_mat.sky_horizon_color = a[2].lerp(b[2], t)
	sky_mat.ground_horizon_color = sky_mat.sky_horizon_color; sky_mat.ground_bottom_color = a[3].lerp(b[3], t) * 0.4
	sun.light_color = a[4].lerp(b[4], t); sun.light_energy = lerpf(a[5], b[5], t)
	env.fog_light_color = a[6].lerp(b[6], t)
	env.ambient_light_energy = lerpf(a[7], b[7], t)
	# the sun goes from the east (06) over the top (12) to the west (18); the moon on the other side
	var ang := (time - 6.0) / 12.0 * PI
	sun.rotation = Vector3(-sin(ang) * deg_to_rad(70.0) - deg_to_rad(4.0), deg_to_rad(-90.0) + ang * 0.0 + deg_to_rad(25.0) - (ang - PI * 0.5) * 0.9, 0.0)
	sun.visible = sun.light_energy > 0.01
	var night := 1.0 - clampf(sun.light_energy / 0.4, 0.0, 1.0)
	moon.light_energy = 0.3 * night; moon.visible = night > 0.01
	moon.rotation = Vector3(deg_to_rad(-55.0), deg_to_rad(40.0), 0.0)
	moon.shadow_enabled = false
