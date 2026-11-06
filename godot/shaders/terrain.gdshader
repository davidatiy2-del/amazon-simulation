shader_type spatial;
// The ground: the colors the world builder painted per vertex (grass, forest floor, mud, sand, rock, the cities'
// roads and yards), given texture: real grass and earth detail (ambientCG, CC0) with their relief, sampled at two scales
// and blended with distance so no tiling shows; slow patches of warmer and cooler green; rock on steep slopes; darker,
// shinier sand at the water's edge; and a soft light wrap, for a painted rather than plastic look.
uniform sampler2D detail : source_color, filter_linear_mipmap_anisotropic, repeat_enable;          // large soft noise
uniform sampler2D grass_tex : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D ground_tex : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D ground_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform bool has_tex = false;
uniform float tex_scale = 0.42;     // repeats per meter, near
uniform float far_scale = 0.031;
uniform float water_y = 0.0;
varying vec3 wpos;
varying vec3 wnorm;
varying float vdist;
void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnorm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
	vdist = length((MODELVIEW_MATRIX * vec4(VERTEX, 1.0)).xyz);
}
void fragment() {
	vec3 base = COLOR.rgb;
	float green = clamp((base.g - max(base.r, base.b)) * 6.0, 0.0, 1.0);
	float macro = texture(detail, wpos.xz * 0.0045 + vec2(0.37, 0.11)).r;
	float soft = dot(texture(detail, wpos.xz * far_scale).rgb, vec3(0.333));
	// green things: patches of warmer and cooler green
	vec3 warm = base * vec3(1.12, 1.05, 0.78);
	vec3 cool = base * vec3(0.82, 1.02, 0.95);
	base = mix(base, mix(cool, warm, smoothstep(0.35, 0.65, macro)), green * 0.85);
	float steep = smoothstep(0.82, 0.62, wnorm.y);
	float d = 1.0;
	if (has_tex) {
		vec2 uv1 = wpos.xz * tex_scale;
		vec2 uv2 = wpos.xz * tex_scale * 0.23 + vec2(0.5, 0.25);
		float far_k = smoothstep(14.0, 60.0, vdist);
		float gn = mix(texture(grass_tex, uv1).r, texture(grass_tex, uv2).r, far_k);
		float gd = mix(texture(ground_tex, uv1).r, texture(ground_tex, uv2).r, far_k);
		float w = green * (1.0 - steep);
		d = 0.42 + mix(gd, gn, w) * 1.16;
		vec3 n1 = mix(texture(ground_nrm, uv1).xyz, texture(grass_nrm, uv1).xyz, w);
		NORMAL_MAP = n1;
		NORMAL_MAP_DEPTH = mix(1.1, 0.3, far_k);
	}
	base = mix(base, vec3(0.42, 0.39, 0.35), steep);
	float wet = smoothstep(water_y + 0.9, water_y + 0.1, wpos.y);
	base *= 1.0 - wet * 0.32;
	ALBEDO = base * d * (0.74 + soft * 0.32);
	ROUGHNESS = mix(0.95, 0.5, wet);
	SPECULAR = mix(0.12, 0.35, wet);
}
void light() {
	float ndl = dot(NORMAL, LIGHT);
	float wrap = clamp((ndl + 0.35) / 1.35, 0.0, 1.0);
	DIFFUSE_LIGHT += wrap * ATTENUATION * LIGHT_COLOR / PI;
	vec3 h = normalize(LIGHT + VIEW);
	float shine = pow(max(dot(NORMAL, h), 0.0), mix(64.0, 8.0, ROUGHNESS)) * SPECULAR_AMOUNT * (1.0 - ROUGHNESS);
	SPECULAR_LIGHT += shine * ATTENUATION * LIGHT_COLOR;
}
