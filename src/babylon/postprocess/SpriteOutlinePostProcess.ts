import { Scene } from '@babylonjs/core/scene';
import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { HD2DSprite } from '../HD2DSprite';

export class SpriteOutlinePostProcess {
    private scene: Scene;
    private outlinePostProcess: PostProcess;
    private depthRenderer: any;
    private spriteMaskTexture: RenderTargetTexture;
    
    constructor(scene: Scene, camera: Camera) {
        this.scene = scene;
        
        // Create render target for sprite mask
        this.spriteMaskTexture = new RenderTargetTexture('spriteMask', 
            { width: scene.getEngine().getRenderWidth(), height: scene.getEngine().getRenderHeight() }, 
            scene, false);
        
        // Register shader
        Effect.ShadersStore['spriteOutlinePostProcessFragmentShader'] = `
            precision highp float;
            
            uniform sampler2D textureSampler;
            uniform sampler2D spriteMaskSampler;
            uniform vec2 screenSize;
            uniform vec3 outlineColor;
            uniform float outlineWidth;
            
            varying vec2 vUV;
            
            void main(void) {
                vec4 baseColor = texture2D(textureSampler, vUV);
                vec4 maskColor = texture2D(spriteMaskSampler, vUV);
                
                // If we're on a sprite pixel, just return the base color
                if (maskColor.a > 0.5) {
                    gl_FragColor = baseColor;
                    return;
                }
                
                // Check for outline
                vec2 texelSize = 1.0 / screenSize;
                float sum = 0.0;
                
                for (float x = -outlineWidth; x <= outlineWidth; x += 1.0) {
                    for (float y = -outlineWidth; y <= outlineWidth; y += 1.0) {
                        if (x == 0.0 && y == 0.0) continue;
                        
                        vec2 offset = vec2(x, y) * texelSize;
                        vec4 sample = texture2D(spriteMaskSampler, vUV + offset);
                        sum += sample.a;
                    }
                }
                
                // If near a sprite, blend in outline color
                if (sum > 0.0) {
                    float outlineStrength = min(sum / 4.0, 1.0);
                    gl_FragColor = mix(baseColor, vec4(outlineColor, 1.0), outlineStrength);
                } else {
                    gl_FragColor = baseColor;
                }
            }
        `;
        
        // Create post process
        this.outlinePostProcess = new PostProcess(
            'spriteOutline',
            'spriteOutlinePostProcess',
            ['screenSize', 'outlineColor', 'outlineWidth'],
            ['spriteMaskSampler'],
            1.0,
            camera,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false
        );
        
        // Set uniforms
        this.outlinePostProcess.onApply = (effect) => {
            effect.setVector2('screenSize', new Vector2(
                scene.getEngine().getRenderWidth(),
                scene.getEngine().getRenderHeight()
            ));
            effect.setColor3('outlineColor', new Color3(0, 0, 0));
            effect.setFloat('outlineWidth', 2);
            effect.setTexture('spriteMaskSampler', this.spriteMaskTexture);
        };
        
        // Update sprite mask before each frame
        scene.registerBeforeRender(() => {
            this.updateSpriteMask();
        });
    }
    
    private updateSpriteMask(): void {
        // Clear and render only sprites to mask texture
        this.spriteMaskTexture.renderList = [];
        
        // Find all sprite meshes
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.includes('_sprite') && mesh.isVisible) {
                this.spriteMaskTexture.renderList!.push(mesh);
            }
        });
        
        // Render sprites to mask
        this.spriteMaskTexture.render();
    }
    
    public setOutlineColor(color: Color3): void {
        this.outlinePostProcess.onApply = (effect) => {
            effect.setVector2('screenSize', new Vector2(
                this.scene.getEngine().getRenderWidth(),
                this.scene.getEngine().getRenderHeight()
            ));
            effect.setColor3('outlineColor', color);
            effect.setFloat('outlineWidth', 2);
            effect.setTexture('spriteMaskSampler', this.spriteMaskTexture);
        };
    }
    
    public setEnabled(enabled: boolean): void {
        if (enabled) {
            this.outlinePostProcess._enable();
        } else {
            this.outlinePostProcess._disable();
        }
    }
    
    public dispose(): void {
        this.outlinePostProcess.dispose();
        this.spriteMaskTexture.dispose();
    }
}