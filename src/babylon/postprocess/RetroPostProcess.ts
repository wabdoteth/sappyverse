import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Effect } from '@babylonjs/core/Materials/effect';

export class RetroPostProcess extends PostProcess {
    private currentDitherStrength: number = 0.1;
    
    constructor(name: string, camera: Camera, options?: any, samplingMode?: number, engine?: Engine, reusable?: boolean) {
        
        Effect.ShadersStore['retroFragmentShader'] = `
            precision highp float;
            
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float colorLevels;
            uniform float ditherStrength;
            uniform vec2 screenSize;
            
            // Bayer dithering matrix
            float dither2x2(vec2 position, float brightness) {
                int x = int(mod(position.x, 2.0));
                int y = int(mod(position.y, 2.0));
                int index = x + y * 2;
                float limit = 0.0;
                
                if (index == 0) limit = 0.25;
                else if (index == 1) limit = 0.75;
                else if (index == 2) limit = 0.75;
                else if (index == 3) limit = 0.25;
                
                return brightness < limit ? 0.0 : 1.0;
            }
            
            // 4x4 Bayer matrix for better quality
            float dither4x4(vec2 position, float brightness) {
                const mat4 ditherMatrix = mat4(
                    0.0625, 0.5625, 0.1875, 0.6875,
                    0.8125, 0.3125, 0.9375, 0.4375,
                    0.25,   0.75,   0.125,  0.625,
                    1.0,    0.5,    0.875,  0.375
                );
                
                int x = int(mod(position.x, 4.0));
                int y = int(mod(position.y, 4.0));
                
                float limit = ditherMatrix[y][x];
                return brightness < limit ? 0.0 : 1.0;
            }
            
            vec3 quantizeColor(vec3 color, float levels) {
                return floor(color * levels + 0.5) / levels;
            }
            
            void main(void) {
                vec4 color = texture2D(textureSampler, vUV);
                
                // Reduce color depth
                vec3 quantized = quantizeColor(color.rgb, colorLevels);
                
                // Apply dithering
                vec2 pixelPos = vUV * screenSize;
                vec3 dithered = vec3(0.0);
                
                for (int i = 0; i < 3; i++) {
                    float channelValue = quantized[i];
                    float ditheredValue = dither4x4(pixelPos, channelValue + (ditherStrength * 0.1));
                    dithered[i] = mix(channelValue, ditheredValue, ditherStrength);
                }
                
                gl_FragColor = vec4(dithered, color.a);
            }
        `;

        super(name, 'retro', ['colorLevels', 'ditherStrength', 'screenSize'], null, options, camera, samplingMode, engine, reusable);
        
        this.onApply = (effect: Effect) => {
            effect.setFloat('colorLevels', 16.0); // 16 color levels per channel
            effect.setFloat('ditherStrength', this.currentDitherStrength); // Use configurable dithering
            const currentEngine = this.getEngine();
            effect.setFloat2('screenSize', currentEngine.getRenderWidth(), currentEngine.getRenderHeight());
        };
    }
    
    public setColorLevels(levels: number): void {
        this.onApply = (effect: Effect) => {
            effect.setFloat('colorLevels', levels);
            effect.setFloat('ditherStrength', this.currentDitherStrength);
            effect.setFloat2('screenSize', this.getEngine().getRenderWidth(), this.getEngine().getRenderHeight());
        };
    }
    
    public setDitherStrength(strength: number): void {
        this.currentDitherStrength = strength;
        if (this.onApply) {
            this.onApply = (effect: Effect) => {
                effect.setFloat('colorLevels', 16.0);
                effect.setFloat('ditherStrength', this.currentDitherStrength);
                effect.setFloat2('screenSize', this.getEngine().getRenderWidth(), this.getEngine().getRenderHeight());
            };
        }
    }
    
    public getDitherStrength(): number {
        return this.currentDitherStrength;
    }
}