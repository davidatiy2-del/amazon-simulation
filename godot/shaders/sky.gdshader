shader_type sky;
render_mode use_debanding;
// A painted sky: a gradient from the horizon up, the sun's disc with a soft glow (and the moon at night), and two
// layers of slow clouds lit by the sun (warm at dawn and dusk). Cheap enough for phones: a few texture reads.
uniform vec3 top_color : source_color = vec3(0.22, 0.45, 0.85);
uniform vec3 horizon_color : source_color = vec3(0.7, 0.8, 0.9);
uniform vec3 ground_color : source_color = vec3(0.3, 0.32, 0.3);
uniform vec3 sun_tint : source_color = vec3(1.0, 0.95, 0.85);
uniform float sun_size = 0.9997;
uniform float cloud_cover = 0.48;
uniform float cloud_light = 1.0;
uniform float night = 0.0;
uniform float wind_t = 0.0;
uniform sampler2D noise : filter_linear_mipmap, repeat_enable;

float clouds(vec2 p) {
	float n = texture(noise, p).r * 0.6 + texture(noise, p * 2.3 + vec2(0.3, 0.7)).r * 0.3 + texture(noise, p * 5.1).r * 0.1;
	return smoothstep(cloud_cover, cloud_cover + 0.22, n);
}

void sky() {
	vec3 d = EYEDIR;
	float up = clamp(d.y, -1.0, 1.0);
	vec3 col = mix(horizon_color, top_color, pow(clamp(up, 0.0, 1.0), 0.55));
	col = mix(col, ground_color, smoothstep(0.0, -0.12, up));
	// the sun (or the moon)
	vec3 sd = LIGHT0_DIRECTION;
	float s = dot(d, sd);
	if (LIGHT0_ENABLED) {
		col += sun_tint * LIGHT0_ENERGY * (smoothstep(sun_size, sun_size + 0.00012, s) * 6.0 + pow(max(s, 0.0), 220.0) * 0.6 + pow(max(s, 0.0), 12.0) * 0.12);
	}
	// clouds: projected on a dome, drifting
	if (up > 0.0) {
		vec2 cp = d.xz / (up + 0.18) * 0.22;
		float c = clouds(cp * 0.6 + vec2(wind_t * 0.004, wind_t * 0.0015));
		float c2 = clouds(cp * 1.4 + vec2(wind_t * 0.007, -wind_t * 0.002) + 0.5) * 0.6;
		float cc = clamp(c + c2 * (1.0 - c), 0.0, 1.0) * smoothstep(0.0, 0.18, up);
		float lit = 0.75 + 0.35 * max(dot(sd, vec3(0.0, 1.0, 0.0)), 0.0) + 0.4 * pow(max(s, 0.0), 6.0);
		vec3 cloud_col = mix(horizon_color * 1.05, vec3(1.0), 0.55) * lit * cloud_light;
		cloud_col = mix(cloud_col, horizon_color * 0.25 + vec3(0.02, 0.02, 0.05), night);
		col = mix(col, cloud_col, cc * 0.85);
	}
	// stars
	if (night > 0.01 && up > 0.0) {
		vec2 sp = d.xz / (up + 0.25) * 60.0;
		float st = smoothstep(0.985, 1.0, texture(noise, sp * 0.05).r) * night * smoothstep(0.0, 0.3, up);
		col += vec3(st);
	}
	COLOR = col;
}
