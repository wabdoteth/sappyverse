import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Engine } from '@babylonjs/core/Engines/engine';

export class OutlinePostProcess extends PostProcess {
    constructor(name: string, camera: Camera, options?: any, samplingMode?: number, engine?: Engine, reusable?: boolean) {
        
        Effect.ShadersStore['outlineFragmentShader'] = `
            precision highp float;
            
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform vec2 screenSize;
            uniform vec3 outlineColor;
            uniform float threshold;
            
            void main(void) {
                vec2 texelSize = 1.0 / screenSize;
                vec4 currentColor = texture2D(textureSampler, vUV);
                
                // If current pixel has alpha, just pass through
                if (currentColor.a > threshold) {
                    gl_FragColor = currentColor;
                    return;
                }
                
                // Sample surrounding pixels for edge detection
                float sum = 0.0;
                
                // 8-directional sampling
                sum += texture2D(textureSampler, vUV + vec2(-texelSize.x, -texelSize.y)).a;
                sum += texture2D(textureSampler, vUV + vec2(0.0, -texelSize.y)).a;
                sum += texture2D(textureSampler, vUV + vec2(texelSize.x, -texelSize.y)).a;
                sum += texture2D(textureSampler, vUV + vec2(-texelSize.x, 0.0)).a;
                sum += texture2D(textureSampler, vUV + vec2(texelSize.x, 0.0)).a;
                sum += texture2D(textureSampler, vUV + vec2(-texelSize.x, texelSize.y)).a;
                sum += texture2D(textureSampler, vUV + vec2(0.0, texelSize.y)).a;
                sum += texture2D(textureSampler, vUV + vec2(texelSize.x, texelSize.y)).a;
                
                // If any neighbor has alpha, draw outline
                if (sum > 0.0) {
                    gl_FragColor = vec4(outlineColor, 1.0);
                } else {
                    gl_FragColor = currentColor;
                }
            }
        `;

        super(name, 'outline', ['screenSize', 'outlineColor', 'threshold'], null, options, camera, samplingMode, engine, reusable);
        
        this.onApply = (effect: Effect) => {
            const currentEngine = this.getEngine();
            effect.setFloat2('screenSize', currentEngine.getRenderWidth(), currentEngine.getRenderHeight());
            effect.setColor3('outlineColor', new Color3(0, 0, 0));
            effect.setFloat('threshold', 0.5);
        };
    }
}