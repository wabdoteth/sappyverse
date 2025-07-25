precision highp float;

// Uniforms
uniform sampler2D textureSampler;
uniform vec3 outlineColor;
uniform float outlineWidth;
uniform vec2 textureSize;

// Varyings
varying vec2 vUV;

void main(void) {
    vec2 texelSize = 1.0 / textureSize;
    vec4 currentColor = texture2D(textureSampler, vUV);
    
    // If current pixel is transparent, check for outline
    if (currentColor.a < 0.5) {
        float sum = 0.0;
        
        // Sample surrounding pixels
        for (float x = -outlineWidth; x <= outlineWidth; x += 1.0) {
            for (float y = -outlineWidth; y <= outlineWidth; y += 1.0) {
                if (x == 0.0 && y == 0.0) continue;
                
                vec2 offset = vec2(x, y) * texelSize;
                vec4 sample = texture2D(textureSampler, vUV + offset);
                sum += sample.a;
            }
        }
        
        // If any surrounding pixel is opaque, draw outline
        if (sum > 0.0) {
            gl_FragColor = vec4(outlineColor, 1.0);
        } else {
            gl_FragColor = currentColor;
        }
    } else {
        // Original sprite pixel
        gl_FragColor = currentColor;
    }
}