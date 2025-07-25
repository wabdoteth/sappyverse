precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform float outlineWidth;
uniform vec3 cameraPosition;

// Varyings
varying vec2 vUV;
varying float vAlpha;

void main(void) {
    // Calculate view space position for consistent outline width
    vec4 worldPos = world * vec4(position, 1.0);
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    
    // Expand vertices along normals in screen space
    // This ensures consistent outline thickness
    vec4 clipPos = worldViewProjection * vec4(position, 1.0);
    vec2 aspectRatio = vec2(1.0, 1.0); // Adjust based on screen aspect
    
    // Convert outline width to normalized device coordinates
    float pixelWidth = outlineWidth / 400.0; // 400 is approximate viewport height
    
    // Expand in clip space
    vec4 expandedPos = clipPos;
    expandedPos.xy += normalize(clipPos.xy) * pixelWidth * clipPos.w;
    
    gl_Position = expandedPos;
    vUV = uv;
    vAlpha = 1.0;
}