import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Effect } from '@babylonjs/core/Materials/effect';

export class TiltShiftPostProcess extends PostProcess {
    constructor(name: string, camera: Camera, options?: any, samplingMode?: number, engine?: Engine, reusable?: boolean) {
        
        Effect.ShadersStore['tiltShiftFragmentShader'] = `
            precision highp float;
            
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float focusStart;
            uniform float focusEnd;
            uniform float blurAmount;
            uniform vec2 screenSize;
            
            vec4 blur(sampler2D tex, vec2 uv, float blurSize) {
                vec4 sum = vec4(0.0);
                vec2 texelSize = 1.0 / screenSize;
                
                // 9-tap Gaussian blur
                sum += texture2D(tex, uv + vec2(-1.0, -1.0) * texelSize * blurSize) * 0.045;
                sum += texture2D(tex, uv + vec2( 0.0, -1.0) * texelSize * blurSize) * 0.122;
                sum += texture2D(tex, uv + vec2( 1.0, -1.0) * texelSize * blurSize) * 0.045;
                sum += texture2D(tex, uv + vec2(-1.0,  0.0) * texelSize * blurSize) * 0.122;
                sum += texture2D(tex, uv)                                              * 0.332;
                sum += texture2D(tex, uv + vec2( 1.0,  0.0) * texelSize * blurSize) * 0.122;
                sum += texture2D(tex, uv + vec2(-1.0,  1.0) * texelSize * blurSize) * 0.045;
                sum += texture2D(tex, uv + vec2( 0.0,  1.0) * texelSize * blurSize) * 0.122;
                sum += texture2D(tex, uv + vec2( 1.0,  1.0) * texelSize * blurSize) * 0.045;
                
                return sum;
            }
            
            void main(void) {
                float y = vUV.y;
                vec4 original = texture2D(textureSampler, vUV);
                
                // Calculate blur strength based on vertical position
                float blurStrength = 0.0;
                
                if (y < focusStart) {
                    // Top blur
                    blurStrength = (focusStart - y) / focusStart * blurAmount;
                } else if (y > focusEnd) {
                    // Bottom blur
                    blurStrength = (y - focusEnd) / (1.0 - focusEnd) * blurAmount;
                }
                
                if (blurStrength > 0.0) {
                    vec4 blurred = blur(textureSampler, vUV, blurStrength);
                    gl_FragColor = blurred;
                } else {
                    gl_FragColor = original;
                }
            }
        `;

        super(name, 'tiltShift', ['focusStart', 'focusEnd', 'blurAmount', 'screenSize'], null, options, camera, samplingMode, engine, reusable);
        
        this.onApply = (effect: Effect) => {
            effect.setFloat('focusStart', 0.3);
            effect.setFloat('focusEnd', 0.7);
            effect.setFloat('blurAmount', 3.0);
            const currentEngine = this.getEngine();
            effect.setFloat2('screenSize', currentEngine.getRenderWidth(), currentEngine.getRenderHeight());
        };
    }
    
    public setFocusArea(start: number, end: number): void {
        this.onApply = (effect: Effect) => {
            effect.setFloat('focusStart', start);
            effect.setFloat('focusEnd', end);
            effect.setFloat('blurAmount', 3.0);
            effect.setFloat2('screenSize', this.getEngine().getRenderWidth(), this.getEngine().getRenderHeight());
        };
    }
}