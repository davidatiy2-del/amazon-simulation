shader_type spatial;
render_mode blend_mix, cull_disabled, depth_draw_opaque, specular_schlick_ggx;
// The water: rivers and lakes brown-green and murky with small ripples; the sea turquoise by the beaches, deep blue
// far out, with a slow swell and foam where it meets the sand. The ground under each point comes from a height map
// (red: the ground's height; green: 1 where the water is the sea), so the shore fades without a depth buffer.
// The same waves are computed on the CPU (scripts/world/waves.gd) for the boats; keep the two in step.
uniform sampler2D heights : filter_linear, repeat_disable;
uniform vec2 world_origin = vec2(-513.0, -513.0);
uniform vec2 world_size = vec2(1026.0, 3074.0);
uniform float wtime = 0.0;
uniform vec3 river_deep : source_color = vec3(0.04, 0.15, 0.14);
uniform vec3 river_shallow : source_color = vec3(0.22, 0.30, 0.18);
uniform vec3 sea_deep : source_color = vec3(0.02, 0.10, 0.21);
uniform vec3 sea_mid : source_color = vec3(0.03, 0.24, 0.34);
uniform vec3 sea_shallow : source_color = vec3(0.14, 0.50, 0.48);
varying vec3 wpos;

vec2 ground(vec2 p) {
	vec2 uv = (p - world_origin) / world_size;
	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec2(-30.0, 1.0);
	return textureLod(heights, uv, 0.0).rg;
}
float ripple(vec2 p, float t) {
	return sin(p.x * 0.35 + t * 1.3) * 0.5 + sin(p.y * 0.28 - t * 1.1) * 0.5 + sin((p.x + p.y) * 0.9 + t * 2.3) * 0.18;
}
float swell(vec2 p, float t) {
	return sin(p.x * 0.045 + t * 0.9) * 0.55 + sin(p.y * 0.06 - t * 0.7 + p.x * 0.02) * 0.45 + sin((p.x - p.y) * 0.11 + t * 1.6) * 0.15;
}
// the swell only out where the water is deeper than any river
float swell_amp(float depth) { return 0.42 * smoothstep(3.5, 12.0, depth); }

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float depth = max(0.0, -ground(wpos.xz).x);
	VERTEX.y += ripple(wpos.xz, wtime) * 0.04 + swell(wpos.xz, wtime) * swell_amp(depth);
}

void fragment() {
	vec2 g = ground(wpos.xz);
	float depth = clamp(-g.x, 0.0, 40.0);
	float sea = g.y;
	float amp = swell_amp(depth);
	float e = 0.6;
	vec2 ex = vec2(e, 0.0), ez = vec2(0.0, e);
	float hx = (ripple(wpos.xz + ex, wtime) - ripple(wpos.xz - ex, wtime)) * 0.12 + (swell(wpos.xz + ex, wtime) - swell(wpos.xz - ex, wtime)) * amp * 1.2;
	float hz = (ripple(wpos.xz + ez, wtime) - ripple(wpos.xz - ez, wtime)) * 0.12 + (swell(wpos.xz + ez, wtime) - swell(wpos.xz - ez, wtime)) * amp * 1.2;
	vec3 nw = normalize(vec3(-hx, 1.0, -hz));
	NORMAL = (VIEW_MATRIX * vec4(nw, 0.0)).xyz;
	float fres = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 4.0);
	vec3 river = mix(river_shallow, river_deep, smoothstep(0.0, 2.2, depth));
	vec3 seac = mix(sea_shallow, sea_mid, smoothstep(0.5, 6.0, depth));
	seac = mix(seac, sea_deep, smoothstep(6.0, 22.0, depth));
	vec3 col = mix(river, seac, sea);
	// foam where the sea runs onto the sand
	float foam = sea * (1.0 - smoothstep(0.05, 0.6, depth)) * (0.55 + 0.45 * sin(wtime * 1.4 + (wpos.x + wpos.z) * 0.35));
	foam = clamp(foam, 0.0, 0.75);
	ALBEDO = mix(col, vec3(0.92, 0.95, 0.95), foam);
	ROUGHNESS = mix(0.14, 0.1, sea);
	METALLIC = 0.0;
	SPECULAR = mix(0.35, 0.5, sea);
	float a = clamp(smoothstep(0.0, 0.9, depth) * 0.85 + fres * 0.4 + foam * 0.6, 0.0, 0.94);
	// the open sea shows only what swims close under its surface
	ALPHA = mix(a, 0.93, sea * smoothstep(2.0, 9.0, depth));
}
