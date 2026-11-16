shader_type canvas_item;
render_mode unshaded;

uniform vec4 glow_color : source_color = vec4(0.8, 0.12, 0.2, 0.25);
uniform float intensity = 1.0;

void fragment() {
    vec2 centered = (UV - vec2(0.5)) * vec2(1.08, 1.8);
    float halo = pow(max(0.0, 1.0 - length(centered) * 2.0), 2.0);
    COLOR = vec4(glow_color.rgb, glow_color.a * intensity * halo);
}
