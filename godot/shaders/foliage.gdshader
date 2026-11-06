shader_type spatial;
render_mode cull_disabled;
// Leaves, grass and bushes in the wind: each plant sways a little, more toward its top, with its own rhythm (from
// where it stands), in gusts. Otherwise like the plant's own material: its texture and color, cut out by alpha.
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform vec4 albedo : source_color = vec4(1.0);
uniform bool use_tex = false;
uniform bool cutout = false;
uniform float alpha_cut = 0.5;
uniform float sway = 0.06;          // how much it bends (a ratio of its height)
uniform float height = 4.0;         // about how tall the plant is, in its own units
uniform float roughness = 0.9;

void vertex() {
	vec3 origin = MODEL_MATRIX[3].xyz;
	float h = max(VERTEX.y, 0.0) / height;
	float ph = origin.x * 0.137 + origin.z * 0.113;
	float gust = 0.65 + 0.35 * sin(TIME * 0.33 + origin.x * 0.01);
	float bend = (sin(TIME * 1.35 + ph) * 0.65 + sin(TIME * 2.6 + ph * 1.9) * 0.35) * gust;
	float k = sway * height * h * h;
	VERTEX.x += bend * k;
	VERTEX.z += cos(TIME * 1.1 + ph * 1.3) * k * 0.45 * gust;
}

void fragment() {
	vec4 c = albedo;
	if (use_tex) c *= texture(albedo_tex, UV);
	if (cutout && c.a < alpha_cut) discard;
	ALBEDO = c.rgb;
	ROUGHNESS = roughness;
	SPECULAR = 0.25;
	BACKLIGHT = vec3(0.18, 0.22, 0.08);   // light through the leaves
}
