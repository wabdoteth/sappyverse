precision highp float;

// Uniforms
uniform sampler2D diffuseSampler;
uniform vec3 outlineColor;
uniform float outlineThickness;
uniform vec2 texelSize; // 1.0 / textureSize

// Varyings
varying vec2 vUV;

// Sample offsets for edge detection
const int SAMPLE_COUNT = 8;
vec2 offsets[SAMPLE_COUNT];

void main(void) {
    // Initialize sample offsets for 8-directional edge detection
    offsets[0] = vec2(-1.0, -1.0);
    offsets[1] = vec2( 0.0, -1.0);
    offsets[2] = vec2( 1.0, -1.0);
    offsets[3] = vec2(-1.0,  0.0);
    offsets[4] = vec2( 1.0,  0.0);
    offsets[5] = vec2(-1.0,  1.0);
    offsets[6] = vec2( 0.0,  1.0);
    offsets[7] = vec2( 1.0,  1.0);
    
    // Sample the current pixel
    vec4 centerColor = texture2D(diffuseSampler, vUV);
    
    // If the current pixel is opaque, just return it
    if (centerColor.a > 0.5) {
        gl_FragColor = centerColor;
        return;
    }
    
    // Check surrounding pixels for outline
    float maxAlpha = 0.0;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        vec2 sampleUV = vUV + offsets[i] * texelSize * outlineThickness;
        vec4 sampleColor = texture2D(diffuseSampler, sampleUV);
        maxAlpha = max(maxAlpha, sampleColor.a);
    }
    
    // If we found an opaque pixel nearby, draw outline
    if (maxAlpha > 0.5) {
        gl_FragColor = vec4(outlineColor, 1.0);
    } else {
        gl_FragColor = vec4(0.0);
    }
}