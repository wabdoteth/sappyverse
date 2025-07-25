# HD-2D Implementation Guide for WebGL (Babylon.js/Three.js)

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding HD-2D](#understanding-hd-2d)
3. [Core Technical Components](#core-technical-components)
4. [Implementation Strategy](#implementation-strategy)
5. [Babylon.js Implementation](#babylonjs-implementation)
6. [Three.js Implementation](#threejs-implementation)
7. [Asset Pipeline](#asset-pipeline)
8. [Performance Optimization](#performance-optimization)
9. [Common Pitfalls](#common-pitfalls)
10. [Resources and References](#resources-and-references)

## Introduction

HD-2D is a visual style pioneered by Square Enix, combining retro 2D pixel art sprites with 3D environments and modern effects. This guide provides a comprehensive approach to implementing this aesthetic in WebGL using Babylon.js or Three.js.

## Understanding HD-2D

### Core Definition
HD-2D (High Definition 2D) is characterized by:
- **2D pixel art sprites** for characters and important objects
- **3D low-poly environments** with pixel art textures
- **Modern post-processing effects** (especially depth of field)
- **Dynamic lighting** that affects both 2D and 3D elements
- **Orthographic or slightly perspective camera** view

### Visual Characteristics
1. **Diorama Effect**: Heavy tilt-shift blur creates a miniature world feeling
2. **Layered Depth**: Multiple Z-layers with different rendering treatments
3. **Selective Focus**: Sharp focus on play area, blur on periphery
4. **Vibrant Colors**: Enhanced saturation and contrast
5. **Mixed Resolution**: High-res effects with low-res pixel art

## Core Technical Components

### 1. Camera Setup
```javascript
// Babylon.js Camera Configuration
const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 10, -10), scene);
camera.setTarget(BABYLON.Vector3.Zero());
camera.fov = 0.8; // ~45 degrees
camera.minZ = 0.1;
camera.maxZ = 1000;

// Three.js Camera Configuration
const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
camera.position.set(0, 10, -10);
camera.lookAt(0, 0, 0);
// Apply slight lens shift for pseudo-orthographic feel
camera.filmOffset = 0.5;
```

**Key Settings:**
- Camera angle: 15-30 degrees from vertical
- FOV: 35-45 degrees for perspective
- Position: Elevated and pulled back
- Target: Center of play area

### 2. Rendering Layers

**Layer Structure:**
1. **Background Layer** (Z: -100 to -50)
   - Sky, distant mountains, parallax elements
2. **Environment Layer** (Z: -50 to 0)
   - 3D terrain, buildings, props
3. **Character Layer** (Z: 0 to 50)
   - 2D sprites, NPCs, player
4. **Foreground Layer** (Z: 50 to 100)
   - Overhead elements, fog, particles
5. **UI Layer** (Separate orthographic camera)

### 3. Sprite Implementation

#### Billboard Sprites
```javascript
// Babylon.js Billboard Sprite
class HD2DSprite {
    constructor(scene, texture) {
        this.sprite = new BABYLON.Mesh("sprite", scene);
        const material = new BABYLON.StandardMaterial("spriteMat", scene);
        material.diffuseTexture = texture;
        material.diffuseTexture.hasAlpha = true;
        material.useAlphaFromDiffuseTexture = true;
        material.backFaceCulling = false;
        
        // Point filtering for pixel art
        material.diffuseTexture.samplingMode = BABYLON.Texture.NEAREST_SAMPLINGMODE;
        
        this.sprite.material = material;
        this.sprite.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
    }
}

// Three.js Billboard Sprite
class HD2DSprite {
    constructor(texture) {
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        // Point filtering for pixel art
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        this.sprite = new THREE.Sprite(material);
    }
}
```

### 4. Post-Processing Pipeline

#### Tilt-Shift Depth of Field (Most Important Effect)
```javascript
// Babylon.js Post-Process
const depthOfField = new BABYLON.DepthOfFieldEffect(scene, null, {
    focusDistance: 0.3,
    focalLength: 150,
    fStop: 1.4,
    maxBlur: 2.0
});

// Three.js Post-Process
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

const composer = new EffectComposer(renderer);
const bokehPass = new BokehPass(scene, camera, {
    focus: 0.3,
    aperture: 0.025,
    maxblur: 0.02
});
composer.addPass(bokehPass);
```

#### Custom Tilt-Shift Shader
```glsl
// Fragment Shader
uniform sampler2D tDiffuse;
uniform float v;
uniform float r;
varying vec2 vUv;

void main() {
    vec4 sum = vec4(0.0);
    float vv = v * abs(r - vUv.y);
    
    // 9-tap blur
    sum += texture2D(tDiffuse, vec2(vUv.x - 4.0 * vv, vUv.y)) * 0.051;
    sum += texture2D(tDiffuse, vec2(vUv.x - 3.0 * vv, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x - 2.0 * vv, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x - 1.0 * vv, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
    sum += texture2D(tDiffuse, vec2(vUv.x + 1.0 * vv, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x + 2.0 * vv, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x + 3.0 * vv, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x + 4.0 * vv, vUv.y)) * 0.051;
    
    gl_FragColor = sum;
}
```

### 5. Lighting Setup

```javascript
// Babylon.js Lighting
const light = new BABYLON.DirectionalLight("dirLight", 
    new BABYLON.Vector3(-1, -2, -1), scene);
light.intensity = 1.2;
light.shadowGenerator = new BABYLON.ShadowGenerator(2048, light);

// Ambient for visibility
const ambient = new BABYLON.HemisphericLight("ambient", 
    new BABYLON.Vector3(0, 1, 0), scene);
ambient.intensity = 0.4;

// Three.js Lighting
const directional = new THREE.DirectionalLight(0xffffff, 1.2);
directional.position.set(-5, 10, -5);
directional.castShadow = true;
directional.shadow.mapSize.width = 2048;
directional.shadow.mapSize.height = 2048;

const ambient = new THREE.AmbientLight(0x404040, 0.4);
scene.add(directional, ambient);
```

## Implementation Strategy

### Phase 1: Basic Setup
1. Set up perspective camera with slight tilt
2. Create layered rendering system
3. Implement basic billboard sprites
4. Add point filtering for textures

### Phase 2: Environment
1. Create low-poly 3D environment meshes
2. Apply pixel art textures with proper filtering
3. Set up basic lighting
4. Implement shadow system

### Phase 3: Characters and Sprites
1. Create sprite animation system
2. Implement 8-directional sprites
3. Add billboard behavior
4. Integrate with physics/collision

### Phase 4: Post-Processing
1. Implement tilt-shift depth of field
2. Add color grading
3. Apply bloom to light sources
4. Fine-tune blur parameters

### Phase 5: Polish
1. Particle effects integration
2. Weather systems
3. Day/night cycle
4. Performance optimization

## Babylon.js Implementation

```javascript
class HD2DGame {
    constructor(canvas) {
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        
        this.setupCamera();
        this.setupLighting();
        this.setupPostProcessing();
        this.loadAssets();
    }
    
    setupCamera() {
        this.camera = new BABYLON.UniversalCamera("camera", 
            new BABYLON.Vector3(0, 15, -20), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachControl(this.engine.getRenderingCanvas(), true);
    }
    
    setupPostProcessing() {
        // Create rendering pipeline
        const pipeline = new BABYLON.DefaultRenderingPipeline(
            "defaultPipeline",
            true,
            this.scene,
            [this.camera]
        );
        
        // Enable depth of field
        pipeline.depthOfFieldEnabled = true;
        pipeline.depthOfField.focusDistance = 0.3;
        pipeline.depthOfField.focalLength = 150;
        pipeline.depthOfField.fStop = 1.4;
        
        // Color grading
        pipeline.imageProcessing.toneMappingEnabled = true;
        pipeline.imageProcessing.exposure = 1.2;
        pipeline.imageProcessing.contrast = 1.3;
        pipeline.imageProcessing.colorGradingEnabled = true;
    }
}
```

## Three.js Implementation

```javascript
class HD2DGame {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.setupCamera();
        this.setupLighting();
        this.setupPostProcessing();
        this.loadAssets();
    }
    
    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 15, -20);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Tilt-shift pass
        const tiltShift = new ShaderPass(TiltShiftShader);
        tiltShift.uniforms['r'].value = 0.5;
        tiltShift.uniforms['v'].value = 1.0 / 512.0;
        this.composer.addPass(tiltShift);
        
        // Bloom for lights
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5, 0.4, 0.85
        );
        this.composer.addPass(bloomPass);
    }
}
```

## Asset Pipeline

### Sprite Requirements
1. **Resolution**: Create at intended display size (no downscaling)
2. **Format**: PNG with transparency
3. **Dimensions**: Power of 2 (64x64, 128x128, etc.)
4. **Animation**: Sprite sheets with consistent frame sizes
5. **Directions**: 8 directional sprites for full 3D movement

### Texture Guidelines
```javascript
// Proper texture setup
function loadPixelTexture(url) {
    const texture = new THREE.TextureLoader().load(url);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}
```

### Environment Assets
1. **Geometry**: Low-poly models (< 1000 triangles per object)
2. **Textures**: 256x256 or 512x512 pixel art textures
3. **UV Mapping**: Pixel-perfect alignment
4. **Materials**: Unlit or simple lit shaders

## Performance Optimization

### Batching Strategies
1. **Sprite Batching**: Combine multiple sprites into single draw call
2. **Instance Rendering**: Use for repeated environment objects
3. **Texture Atlasing**: Reduce texture switches
4. **LOD System**: Lower detail for distant objects

### WebGL Optimization
```javascript
// Efficient sprite rendering
class SpriteBatcher {
    constructor(maxSprites = 1000) {
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(maxSprites * 3 * 4);
        this.uvs = new Float32Array(maxSprites * 2 * 4);
        this.indices = new Uint16Array(maxSprites * 6);
        
        // Set up geometry attributes
        this.geometry.setAttribute('position', 
            new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('uv', 
            new THREE.BufferAttribute(this.uvs, 2));
        this.geometry.setIndex(
            new THREE.BufferAttribute(this.indices, 1));
    }
}
```

### Mobile Considerations
1. Reduce post-processing passes
2. Lower shadow resolution
3. Decrease blur sample count
4. Use simpler shaders

## Common Pitfalls

### 1. Pixel Perfect Rendering
- **Problem**: Sprites appear blurry or have artifacts
- **Solution**: Ensure integer positioning and proper filtering

```javascript
// Snap sprite positions to pixels
sprite.position.x = Math.round(sprite.position.x * pixelsPerUnit) / pixelsPerUnit;
sprite.position.y = Math.round(sprite.position.y * pixelsPerUnit) / pixelsPerUnit;
```

### 2. Depth Fighting
- **Problem**: Z-fighting between sprites at same depth
- **Solution**: Use small Z offsets based on Y position

```javascript
sprite.position.z = baseZ + (sprite.position.y * 0.001);
```

### 3. Performance Issues
- **Problem**: Frame rate drops with many sprites
- **Solution**: Implement proper batching and culling

### 4. Inconsistent Art Style
- **Problem**: Mixed pixel densities look wrong
- **Solution**: Maintain consistent pixels-per-unit across all assets

## Resources and References

### Official Sources
- [Square Enix HD-2D Trademark](https://trademarks.justia.com/883/62/hd-88362105.html)
- [Unreal Fest Europe 2019 - Octopath Traveler Presentation](https://www.unrealengine.com/en-US/events/unreal-fest-europe-2019)

### Technical Articles
- [GDC Vault - 2D Techniques in Modern Games](https://www.gdcvault.com/)
- [Gamasutra - Mixing 2D and 3D](https://www.gamasutra.com/)

### Open Source References
- [Three.js Examples](https://threejs.org/examples/)
- [Babylon.js Playground](https://playground.babylonjs.com/)
- [PMNDRS Post-processing](https://github.com/pmndrs/postprocessing)

### Community Projects
- [HD-2D-Game-Kit (GitHub)](https://github.com/)
- [Three.js 2.5D Demos](https://github.com/mrdoob/three.js/tree/dev/examples)

### Shader Resources
- [Shadertoy - Tilt Shift Effects](https://www.shadertoy.com/)
- [GLSL Sandbox](http://glslsandbox.com/)
- [The Book of Shaders](https://thebookofshaders.com/)

## Conclusion

Implementing HD-2D in WebGL requires careful balance between retro aesthetics and modern rendering techniques. The key is maintaining pixel-perfect 2D sprites while leveraging 3D for environments and effects. Focus on the tilt-shift depth of field as it's the most characteristic element of the style.

Start simple with basic sprite rendering and gradually add complexity. Performance optimization should be considered from the beginning, especially for mobile targets. With proper implementation, WebGL can effectively recreate the HD-2D aesthetic for web-based games.