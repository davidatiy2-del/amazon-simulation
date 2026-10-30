shader_type spatial;
render_mode cull_back, specular_schlick_ggx;
// The KayKit characters' look: their palette texture (soft vertical gradients, one color per swatch), with the
// clothes turned to another hue, the metal and the skin painted in other colors, all in the shader (so a new look
// costs nothing to make). `kinds` says what each swatch is (red: 0 keep, 1/3 cloth, 2/3 metal, 1 skin) and its middle
// brightness (green), which keeps each gradient's shading when it is recolored.
uniform sampler2D tex : filter_linear_mipmap, repeat_enable;
uniform sampler2D kinds : filter_nearest, repeat_enable;
uniform vec3 cloth = vec3(0.0, 1.0, 1.0);   // hue shift, saturation scale, brightness scale
uniform bool cloth_on = false;
uniform vec4 metal = vec4(0.0);             // the metal's color (a: on)
uniform vec4 skin = vec4(0.0);              // the skin's color (a: on)

vec3 rgb2hsv(vec3 c) {
	vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
vec3 to_linear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }

void fragment() {
	vec3 col = texture(tex, UV).rgb;          // sRGB values, as the palette was painted
	vec4 k = texture(kinds, UV);
	float kind = floor(k.r * 3.0 + 0.5);
	float g = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)) / max(k.g, 0.05), 0.0, 1.8);
	if (kind == 1.0 && cloth_on) {
		vec3 h = rgb2hsv(col);
		col = hsv2rgb(vec3(fract(h.x + cloth.x), clamp(h.y * cloth.y, 0.0, 1.0), clamp(h.z * cloth.z, 0.0, 1.0)));
	} else if (kind == 2.0 && metal.a > 0.5) {
		col = min(metal.rgb * g, vec3(1.0));
	} else if (kind == 3.0 && skin.a > 0.5) {
		col = min(skin.rgb * g, vec3(1.0));
	}
	ALBEDO = to_linear(col);
	ROUGHNESS = 0.62;
	SPECULAR = 0.35;
	RIM = 0.18;
	RIM_TINT = 0.6;
}
