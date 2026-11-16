shader_type canvas_item;
render_mode unshaded;

uniform float blue_power : hint_range(0.0, 1.5) = 1.0;
uniform float red_power : hint_range(0.0, 1.5) = 1.0;

float beam(vec2 uv, vec2 lamp, float lean) {
    float distance_down = max(uv.y - lamp.y, 0.0);
    float center_x = lamp.x + distance_down * lean;
    float width = 0.02 + distance_down * 0.18;
    float across = abs(uv.x - center_x) / width;
    float core = 1.0 - smoothstep(0.15, 1.0, across);
    float halo = 1.0 - smoothstep(0.65, 1.75, across);
    float start_fade = smoothstep(0.015, 0.11, distance_down);
    float end_fade = 1.0 - smoothstep(0.54, 1.1, distance_down);
    return (core * 0.8 + halo * 0.2) * start_fade * end_fade;
}

float lamp_mask(vec2 uv, vec2 lamp) {
    vec2 offset = (uv - lamp) / vec2(0.105, 0.09);
    return exp(-pow(length(offset), 4.0) * 1.6);
}

void fragment() {
    vec4 art = texture(TEXTURE, UV);
    vec2 blue_lamp = vec2(0.24, 0.025);
    vec2 red_lamp = vec2(0.75, 0.025);
    float blue_mask = lamp_mask(UV, blue_lamp);
    float red_mask = lamp_mask(UV, red_lamp);

    // The lamp bulbs are painted into the source image, so dim that area during a blink.
    art.rgb *= 1.0 - blue_mask * (1.0 - blue_power) * 0.57;
    art.rgb *= 1.0 - red_mask * (1.0 - red_power) * 0.57;

    float blue_beam = beam(UV, blue_lamp, 0.16);
    float red_beam = beam(UV, red_lamp, -0.16);
    art.rgb += vec3(0.22, 0.42, 1.0) * blue_power * (blue_beam * 0.28 + blue_mask * 0.12);
    art.rgb += vec3(1.0, 0.17, 0.32) * red_power * (red_beam * 0.27 + red_mask * 0.11);
    COLOR = vec4(clamp(art.rgb, vec3(0.0), vec3(1.0)), art.a);
}
