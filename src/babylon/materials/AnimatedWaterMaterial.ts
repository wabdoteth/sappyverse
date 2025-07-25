import { Scene } from '@babylonjs/core/scene';
import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Material } from '@babylonjs/core/Materials/material';

export class AnimatedWaterMaterial extends ShaderMaterial {
    private time: number = 0;
    
    constructor(name: string, scene: Scene) {
        Effect.ShadersStore['animatedWaterVertexShader'] = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;
            
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            uniform float time;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec2 vUV;
            varying float vWaveHeight;
            
            void main(void) {
                // Animated waves
                float waveHeight = sin(position.x * 4.0 + time) * 0.05 + 
                                  sin(position.z * 3.0 + time * 1.3) * 0.03;
                
                vec3 newPosition = position;
                newPosition.y += waveHeight;
                
                gl_Position = worldViewProjection * vec4(newPosition, 1.0);
                
                vPositionW = vec3(world * vec4(position, 1.0));
                vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
                vUV = uv;
                vWaveHeight = waveHeight;
            }
        `;

        Effect.ShadersStore['animatedWaterFragmentShader'] = `
            precision highp float;
            
            uniform vec3 waterColorShallow;
            uniform vec3 waterColorDeep;
            uniform float time;
            uniform vec3 cameraPosition;
            uniform float transparency;
            uniform float reflectivity;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec2 vUV;
            varying float vWaveHeight;
            
            void main(void) {
                // Animated UV for water caustics effect
                vec2 animUV = vUV + vec2(time * 0.02, time * 0.01);
                
                // Simple caustics pattern
                float caustics = sin(animUV.x * 20.0) * sin(animUV.y * 20.0) * 0.1 + 0.9;
                
                // Mix water colors based on wave height
                vec3 waterColor = mix(waterColorDeep, waterColorShallow, vWaveHeight + 0.5);
                waterColor *= caustics;
                
                // Simple fresnel for rim lighting
                vec3 viewDirection = normalize(cameraPosition - vPositionW);
                float fresnel = pow(1.0 - dot(viewDirection, vNormalW), 2.0);
                
                // Add rim highlight
                waterColor += vec3(0.5, 0.7, 1.0) * fresnel * reflectivity;
                
                // HD-2D style: slightly desaturated, painterly look
                float gray = dot(waterColor, vec3(0.299, 0.587, 0.114));
                waterColor = mix(vec3(gray), waterColor, 0.8);
                
                gl_FragColor = vec4(waterColor, transparency);
            }
        `;

        super(name, scene, 'animatedWater', {
            attributes: ['position', 'normal', 'uv'],
            uniforms: ['worldViewProjection', 'world', 'time', 'waterColorShallow', 'waterColorDeep', 
                      'cameraPosition', 'transparency', 'reflectivity'],
            samplers: []
        });

        // Set default values
        this.setColor3('waterColorShallow', new Color3(0.3, 0.5, 0.8));
        this.setColor3('waterColorDeep', new Color3(0.1, 0.2, 0.4));
        this.setFloat('transparency', 0.7);
        this.setFloat('reflectivity', 0.3);
        
        this.backFaceCulling = false;
        this.alphaMode = Engine.ALPHA_COMBINE;
        this.transparencyMode = Material.MATERIAL_ALPHABLEND;
        
        // Animation loop
        scene.registerBeforeRender(() => {
            this.time += scene.getEngine().getDeltaTime() * 0.001;
            this.setFloat('time', this.time);
            
            if (scene.activeCamera) {
                this.setVector3('cameraPosition', scene.activeCamera.position);
            }
        });
    }
    
    public setWaterColors(shallow: Color3, deep: Color3): void {
        this.setColor3('waterColorShallow', shallow);
        this.setColor3('waterColorDeep', deep);
    }
    
    public setTransparency(value: number): void {
        this.setFloat('transparency', value);
    }
    
    public setReflectivity(value: number): void {
        this.setFloat('reflectivity', value);
    }
}