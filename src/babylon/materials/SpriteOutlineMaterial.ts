import { Scene } from '@babylonjs/core/scene';
import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

export class SpriteOutlineMaterial extends ShaderMaterial {
    constructor(name: string, scene: Scene, texture: Texture) {
        Effect.ShadersStore['spriteOutlineVertexShader'] = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec2 uv;
            
            uniform mat4 worldViewProjection;
            
            varying vec2 vUV;
            
            void main(void) {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                vUV = uv;
            }
        `;

        Effect.ShadersStore['spriteOutlineFragmentShader'] = `
            precision highp float;
            
            uniform sampler2D textureSampler;
            uniform vec3 outlineColor;
            uniform float outlineWidth;
            uniform vec2 textureSize;
            uniform vec3 emissiveColor;
            
            varying vec2 vUV;
            
            void main(void) {
                vec2 texelSize = 1.0 / textureSize;
                vec4 currentColor = texture2D(textureSampler, vUV);
                
                // Apply emissive to sprite
                if (currentColor.a > 0.5) {
                    currentColor.rgb += emissiveColor;
                }
                
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
        `;

        super(name, scene, 'spriteOutline', {
            attributes: ['position', 'uv'],
            uniforms: ['worldViewProjection', 'outlineColor', 'outlineWidth', 'textureSize', 'emissiveColor'],
            samplers: ['textureSampler']
        });

        this.setTexture('textureSampler', texture);
        this.setColor3('outlineColor', new Color3(0, 0, 0));
        this.setFloat('outlineWidth', 1);
        this.setVector2('textureSize', new Vector2(texture.getSize().width, texture.getSize().height));
        this.setColor3('emissiveColor', new Color3(0.6, 0.6, 0.6));
        
        this.backFaceCulling = false;
        this.alphaMode = 1; // ALPHA_COMBINE
        this.transparencyMode = 1; // ALPHATEST
    }

    public setOutlineColor(color: Color3): void {
        this.setColor3('outlineColor', color);
    }

    public setOutlineWidth(width: number): void {
        this.setFloat('outlineWidth', width);
    }

    public updateTextureSize(texture: Texture): void {
        const size = texture.getSize();
        this.setVector2('textureSize', new Vector2(size.width, size.height));
    }

    public setEmissiveIntensity(color: Color3): void {
        this.setColor3('emissiveColor', color);
    }
}