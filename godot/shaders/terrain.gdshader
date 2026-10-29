shader_type spatial;
// The ground: colors painted per vertex by the world builder (grass, forest floor, mud, sand, rock), with a detail
// texture at two scales so it does not look flat up close or tiled from afar.
uniform sampler2D detail : source_color, filter_linear_mipmap, repeat_enable;
uniform float near_scale = 0.22;
uniform float far_scale = 0.031;
varying vec3 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec3 d1 = texture(detail, wpos.xz * near_scale).rgb;
	vec3 d2 = texture(detail, wpos.xz * far_scale).rgb;
	float n = dot(d1, vec3(0.333)) * 0.6 + dot(d2, vec3(0.333)) * 0.8;
	vec3 c = COLOR.rgb * (0.62 + n * 0.75);
	ALBEDO = c;
	ROUGHNESS = 0.95;
	SPECULAR = 0.15;
}
