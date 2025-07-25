import { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

export class HD2DOutlineSystem {
    private scene: Scene;
    private outlineMeshes: Map<Mesh, Mesh> = new Map();
    private outlineColor: Color3 = new Color3(0.1, 0.05, 0.15); // Dark purple tint as per HD-2D spec
    private outlineScale: number = 1.03; // 3% larger for ~1 pixel outline at typical resolution
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.registerShaders();
    }
    
    private registerShaders(): void {
        // Vertex shader that expands the mesh
        Effect.ShadersStore['hd2dOutlineVertexShader'] = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec2 uv;
            attribute vec3 normal;
            
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            uniform mat4 view;
            uniform float outlineScale;
            uniform float zOffset;
            
            varying vec2 vUV;
            
            void main(void) {
                // Expand position from center for uniform outline
                vec3 expandedPos = position * outlineScale;
                
                // Transform to clip space
                vec4 clipPos = worldViewProjection * vec4(expandedPos, 1.0);
                
                // Apply z-offset to push outline behind
                clipPos.z = clipPos.z + (zOffset * clipPos.w);
                
                gl_Position = clipPos;
                vUV = uv;
            }
        `;
        
        // Fragment shader that renders solid color with alpha test
        Effect.ShadersStore['hd2dOutlineFragmentShader'] = `
            precision highp float;
            
            uniform sampler2D diffuseSampler;
            uniform vec3 outlineColor;
            uniform float alphaThreshold;
            
            varying vec2 vUV;
            
            void main(void) {
                vec4 texColor = texture2D(diffuseSampler, vUV);
                
                // Alpha test - only draw where sprite has pixels
                if (texColor.a < alphaThreshold) {
                    discard;
                }
                
                // Output solid outline color with full opacity
                gl_FragColor = vec4(outlineColor, 1.0);
            }
        `;
    }
    
    public addOutlineToSprite(sprite: Mesh): void {
        if (this.outlineMeshes.has(sprite)) {
            // Remove existing outline before creating new one
            this.removeOutlineFromSprite(sprite);
        }
        
        // Clone the sprite mesh for outline
        const outlineMesh = sprite.clone(`${sprite.name}_outline`);
        outlineMesh.parent = sprite.parent;
        
        // Create outline material
        const outlineMat = new ShaderMaterial(
            `${sprite.name}_outlineMat`,
            this.scene,
            {
                vertex: 'hd2dOutline',
                fragment: 'hd2dOutline'
            },
            {
                attributes: ['position', 'uv', 'normal'],
                uniforms: ['worldViewProjection', 'world', 'view', 'outlineScale', 'outlineColor', 'alphaThreshold', 'zOffset'],
                samplers: ['diffuseSampler']
            }
        );
        
        // Get diffuse texture from original sprite
        const originalMat = sprite.material as StandardMaterial;
        if (originalMat && originalMat.diffuseTexture) {
            outlineMat.setTexture('diffuseSampler', originalMat.diffuseTexture);
        }
        
        // Set outline parameters
        outlineMat.setFloat('outlineScale', this.outlineScale);
        outlineMat.setColor3('outlineColor', this.outlineColor);
        outlineMat.setFloat('alphaThreshold', 0.5);
        outlineMat.setFloat('zOffset', 0.001); // Small positive offset to push behind
        
        // Configure material properties
        outlineMat.backFaceCulling = false;
        outlineMat.forceDepthWrite = false; // Don't write to depth buffer for outline
        outlineMat.needAlphaBlending = () => false; // Disable alpha blending for solid outline
        outlineMat.disableColorWrite = false;
        
        outlineMesh.material = outlineMat;
        
        // Ensure outline renders behind sprite
        // Use a much lower render order
        outlineMesh.renderingGroupId = sprite.renderingGroupId;
        outlineMesh.alphaIndex = -9999; // Extremely low value to ensure it renders first
        
        // Set initial position - no offset needed
        outlineMesh.position = sprite.position.clone();
        
        // Store reference
        this.outlineMeshes.set(sprite, outlineMesh);
        
        // Ensure the original sprite has proper transparency mode and renders on top
        const spriteMat = sprite.material as StandardMaterial;
        if (spriteMat) {
            spriteMat.transparencyMode = 1; // ALPHATEST
            spriteMat.alphaMode = 1; // ALPHA_COMBINE
        }
        
        // Force sprite to have a higher alphaIndex than outline
        if (sprite.alphaIndex <= 0) {
            sprite.alphaIndex = 1;
        }
        
        // Sync billboard mode immediately
        outlineMesh.billboardMode = sprite.billboardMode;
        
        // Update outline when sprite updates
        const updateOutline = () => {
            // Directly sync transform
            outlineMesh.position.copyFrom(sprite.position);
            outlineMesh.rotation.copyFrom(sprite.rotation);
            outlineMesh.scaling.copyFrom(sprite.scaling);
            // Sync visibility
            outlineMesh.isVisible = sprite.isVisible;
        };
        
        const updateObserver = sprite.onAfterWorldMatrixUpdateObservable.add(updateOutline);
        
        // Store observer for cleanup
        (outlineMesh as any)._updateObserver = updateObserver;
    }
    
    public removeOutlineFromSprite(sprite: Mesh): void {
        const outlineMesh = this.outlineMeshes.get(sprite);
        if (outlineMesh) {
            // Remove specific observer
            const updateObserver = (outlineMesh as any)._updateObserver;
            
            if (updateObserver) {
                sprite.onAfterWorldMatrixUpdateObservable.remove(updateObserver);
            }
            
            outlineMesh.material?.dispose();
            outlineMesh.dispose();
            this.outlineMeshes.delete(sprite);
        }
    }
    
    public setOutlineColor(color: Color3): void {
        this.outlineColor = color;
        
        // Update all existing outlines
        this.outlineMeshes.forEach((outlineMesh) => {
            const mat = outlineMesh.material as ShaderMaterial;
            if (mat) {
                mat.setColor3('outlineColor', color);
            }
        });
    }
    
    public setOutlineThickness(scale: number): void {
        this.outlineScale = scale;
        
        // Update all existing outlines
        this.outlineMeshes.forEach((outlineMesh) => {
            const mat = outlineMesh.material as ShaderMaterial;
            if (mat) {
                mat.setFloat('outlineScale', scale);
            }
        });
    }
    
    public setEnabled(enabled: boolean): void {
        this.outlineMeshes.forEach((outlineMesh) => {
            outlineMesh.setEnabled(enabled);
        });
    }
    
    public dispose(): void {
        this.outlineMeshes.forEach((_, sprite) => {
            this.removeOutlineFromSprite(sprite);
        });
        this.outlineMeshes.clear();
    }
}