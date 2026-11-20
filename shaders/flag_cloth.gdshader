shader_type canvas_item;
render_mode unshaded;

uniform float offset = 0.0;

void fragment() {
    vec2 uv = UV;
    float wave = uv.x * 19.0 - TIME * 2.4 + offset;
    float envelope = smoothstep(0.0, 0.8, uv.x);
    uv.y += sin(wave) * 0.018 * envelope;
    float shade = 0.82 + 0.18 * cos(wave) + 0.12 * sin(wave * 0.5);
    vec4 cloth = texture(TEXTURE, uv);
    COLOR = vec4(cloth.rgb * shade, cloth.a * step(0.0, uv.y) * step(uv.y, 1.0));
}
