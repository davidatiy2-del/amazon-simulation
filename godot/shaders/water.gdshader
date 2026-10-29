shader_type spatial;
render_mode blend_mix, cull_disabled, depth_draw_opaque, specular_schlick_ggx;
// Jungle water: brown-green and murky, small waves, bright at a glancing angle, see-through at the shore.
// The ground height under each point comes from the height map, so the shore fades without a depth buffer.
uniform sampler2D heights : filter_linear;   // the world's heights, red channel, meters
uniform float world_size = 1024.0;
uniform vec3 deep : source_color = vec3(0.04, 0.15, 0.14);
uniform vec3 shallow : source_color = vec3(0.22, 0.30, 0.18);
varying vec3 wpos;
float wave(vec2 p, float t) {
	return sin(p.x * 0.35 + t * 1.3) * 0.5 + sin(p.y * 0.28 - t * 1.1) * 0.5 + sin((p.x + p.y) * 0.9 + t * 2.3) * 0.18;
}
void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	VERTEX.y += wave(wpos.xz, TIME) * 0.04;
}
void fragment() {
	vec2 uvh = wpos.xz / world_size + 0.5;
	float ground = texture(heights, uvh).r;
	float depth = clamp(-ground, 0.0, 6.0);
	float e = 0.6;
	float hx = wave(wpos.xz + vec2(e, 0.0), TIME) - wave(wpos.xz - vec2(e, 0.0), TIME);
	float hz = wave(wpos.xz + vec2(0.0, e), TIME) - wave(wpos.xz - vec2(0.0, e), TIME);
	vec3 nw = normalize(vec3(-hx * 0.12, 1.0, -hz * 0.12));
	NORMAL = (VIEW_MATRIX * vec4(nw, 0.0)).xyz;
	float fres = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 4.0);
	ALBEDO = mix(shallow, deep, smoothstep(0.0, 2.2, depth));
	ROUGHNESS = 0.14;
	METALLIC = 0.0;
	SPECULAR = 0.35;
	ALPHA = clamp(smoothstep(0.0, 0.9, depth) * 0.85 + fres * 0.4, 0.0, 0.94);
}
