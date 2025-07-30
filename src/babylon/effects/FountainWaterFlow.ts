import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateRibbon } from '@babylonjs/core/Meshes/Builders/ribbonBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import '@babylonjs/core/Particles/particleSystemComponent';

export class FountainWaterFlow {
    private scene: Scene;
    private waterParticles: ParticleSystem;
    private splashParticles: ParticleSystem;
    private waterStreamMesh: any;
    private waterfallMesh: any;
    
    constructor(scene: Scene, fountainPosition: Vector3) {
        this.scene = scene;
        
        try {
            // Create main water flow
            this.createWaterFlow(fountainPosition);
            
            // Create splash effects at the bottom
            this.createSplashEffect(fountainPosition);
            
            // Create animated water stream mesh for HD-2D look
            this.createWaterStream(fountainPosition);
            
            // Create waterfall effect
            this.createWaterfall(fountainPosition);
        } catch (error) {
            console.error('Error creating fountain water flow:', error);
        }
    }
    
    private createWaterFlow(fountainPos: Vector3): void {
        // Disable water flow particles - keeping only splash effects
        return;
    }
    
    private createSplashEffect(fountainPos: Vector3): void {
        // Create splash particles at water surface
        this.splashParticles = new ParticleSystem('fountainSplash', 200, this.scene);
        
        this.splashParticles.particleTexture = this.createSplashTexture();
        
        // Emit from lower bowl water surface
        this.splashParticles.emitter = fountainPos.clone();
        this.splashParticles.emitter.y = 0.8; // Lower bowl water level
        
        // Wider emission area for splashes
        this.splashParticles.minEmitBox = new Vector3(-0.8, 0, -0.8);
        this.splashParticles.maxEmitBox = new Vector3(0.8, 0, 0.8);
        
        // Shorter life for quick splashes
        this.splashParticles.minLifeTime = 0.3;
        this.splashParticles.maxLifeTime = 0.6;
        
        // Smaller splash droplets
        this.splashParticles.minSize = 0.05;
        this.splashParticles.maxSize = 0.15;
        
        // Lower emission rate
        this.splashParticles.emitRate = 50;
        
        // Splash upward and outward
        this.splashParticles.minEmitPower = 1;
        this.splashParticles.maxEmitPower = 2;
        
        // Random splash directions
        this.splashParticles.direction1 = new Vector3(-1, 0.5, -1);
        this.splashParticles.direction2 = new Vector3(1, 2, 1);
        
        // Splash colors - very light blue/white and more transparent
        this.splashParticles.color1 = new Color4(0.95, 0.98, 1, 0.5);
        this.splashParticles.color2 = new Color4(1, 1, 1, 0.3);
        
        // Quick fade to fully transparent white
        this.splashParticles.addColorGradient(0, new Color4(0.98, 0.99, 1, 0.6));
        this.splashParticles.addColorGradient(1, new Color4(1, 1, 1, 0));
        
        // Light gravity
        this.splashParticles.gravity = new Vector3(0, -5, 0);
        
        this.splashParticles.renderingGroupId = 1; // Same as fountain model
        this.splashParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
        
        this.splashParticles.start();
    }
    
    private createWaterStream(fountainPos: Vector3): void {
        // Disable water stream mesh as well
        return;
    }
    
    private createWaterfall(fountainPos: Vector3): void {
        // Create shader for water streams
        this.createWaterStreamShader();
        
        // Create multiple arc streams
        const numStreams = 4;
        this.waterfallMesh = [];
        
        for (let stream = 0; stream < numStreams; stream++) {
            const angle = (stream / numStreams) * Math.PI * 2;
            
            // Create path for water arc
            const path = [];
            const segments = 50; // More segments for longer, smoother stream
            
            // Parameters for the arc - adjusted for higher fountain peak
            const startHeight = 1.2; // Start from the actual peak (higher)
            const maxHeight = 0.15; // Additional height for arc
            const horizontalDistance = 0.3; // Even tighter radius to fit in bowl
            const endHeight = 0.3; // End much lower to go deeper into the bowl
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                
                // Parabolic arc for realistic water flow
                // Make arc wider at the top and midpoint
                const topWidth = (1 - t) * 0.5; // 50% wider at start
                const midWidth = Math.sin(t * Math.PI) * 0.4; // 40% wider at midpoint
                const widthModifier = 1 + topWidth + midWidth;
                const x = t * horizontalDistance * widthModifier;
                
                // Interpolate from start height to end height with arc
                const baseY = startHeight + (endHeight - startHeight) * t;
                const arcY = maxHeight * Math.sin(t * Math.PI);
                const y = baseY + arcY - (t * t) * 0.5; // Stronger gravity effect
                
                // Position in world space
                const worldX = fountainPos.x + Math.cos(angle) * x;
                const worldY = fountainPos.y + y;
                const worldZ = fountainPos.z + Math.sin(angle) * x;
                
                path.push(new Vector3(worldX, worldY, worldZ));
            }
            
            // Create ribbon for water stream (better for shader effects)
            const ribbonPath = [];
            const width = 0.08; // Narrower water stream
            
            // Create two parallel paths for ribbon
            const leftPath = [];
            const rightPath = [];
            
            for (let i = 0; i < path.length; i++) {
                const point = path[i];
                const tangent = i < path.length - 1 ? 
                    path[i + 1].subtract(point).normalize() : 
                    point.subtract(path[i - 1]).normalize();
                
                // Calculate perpendicular vector
                const perp = new Vector3(-tangent.z, 0, tangent.x).normalize();
                
                leftPath.push(point.add(perp.scale(width / 2)));
                rightPath.push(point.subtract(perp.scale(width / 2)));
            }
            
            ribbonPath.push(leftPath);
            ribbonPath.push(rightPath);
            
            // Create ribbon mesh
            const waterStream = CreateRibbon(`waterStream${stream}`, {
                pathArray: ribbonPath,
                sideOrientation: 2, // Double sided
                updatable: false,
                closeArray: false,
                closePath: false
            }, this.scene);
            
            // Apply water shader material
            const waterMat = new ShaderMaterial(`waterStreamMat${stream}`, this.scene, {
                vertex: 'waterStreamShader',
                fragment: 'waterStreamShader'
            }, {
                attributes: ['position', 'normal', 'uv'],
                uniforms: ['worldViewProjection', 'world', 'time', 'flowSpeed', 'waterColor', 'transparency', 'cameraPosition']
            });
            
            waterMat.setFloat('flowSpeed', 2.0);
            waterMat.setColor3('waterColor', new Color3(0.7, 0.85, 1));
            waterMat.setFloat('transparency', 0.8);
            waterMat.backFaceCulling = false;
            waterMat.alphaMode = 2; // ALPHA_COMBINE
            waterMat.needAlphaBlending = () => true;
            waterMat.separateCullingPass = true;
            
            waterStream.material = waterMat;
            waterStream.renderingGroupId = 1; // Same as fountain model
            waterStream.alphaIndex = 10; // Render after solid objects
            
            this.waterfallMesh.push(waterStream);
        }
        
        // Animate shader time uniform
        let time = 0;
        this.scene.registerBeforeRender(() => {
            time += this.scene.getEngine().getDeltaTime() * 0.001;
            this.waterfallMesh.forEach((mesh, index) => {
                const mat = mesh.material as ShaderMaterial;
                mat.setFloat('time', time);
                if (this.scene.activeCamera) {
                    mat.setVector3('cameraPosition', this.scene.activeCamera.position);
                }
            });
        });
    }
    
    private createWaterStreamShader(): void {
        // Vertex shader
        Effect.ShadersStore['waterStreamShaderVertexShader'] = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;
            
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            uniform float time;
            
            varying vec2 vUV;
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying float vFlow;
            
            void main() {
                // Add subtle wave motion
                vec3 pos = position;
                float wave = sin(uv.x * 10.0 + time * 2.0) * 0.01;
                pos.y += wave;
                
                gl_Position = worldViewProjection * vec4(pos, 1.0);
                
                vPositionW = vec3(world * vec4(position, 1.0));
                
                // Calculate normal (for ribbon, normal might need adjustment)
                vec3 n = normal;
                if (length(normal) < 0.1) {
                    n = vec3(0.0, 1.0, 0.0); // Default up normal if missing
                }
                vNormalW = normalize(vec3(world * vec4(n, 0.0)));
                
                vUV = uv;
                vFlow = uv.x + time;
            }
        `;
        
        // Fragment shader
        Effect.ShadersStore['waterStreamShaderFragmentShader'] = `
            precision highp float;
            
            uniform vec3 waterColor;
            uniform float transparency;
            uniform float time;
            uniform float flowSpeed;
            uniform vec3 cameraPosition;
            
            varying vec2 vUV;
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying float vFlow;
            
            void main() {
                // Flowing water effect along the stream
                float flowPattern = fract(vUV.x * 5.0 - time * flowSpeed);
                
                // Create water bands/streams
                float band1 = smoothstep(0.3, 0.4, flowPattern) * smoothstep(0.6, 0.5, flowPattern);
                float band2 = smoothstep(0.0, 0.1, flowPattern) * smoothstep(0.3, 0.2, flowPattern);
                float band3 = smoothstep(0.6, 0.7, flowPattern) * smoothstep(0.9, 0.8, flowPattern);
                float bands = band1 + band2 + band3;
                
                // Add some noise/turbulence
                float noise = sin(vUV.x * 40.0 + time * 3.0) * sin(vUV.y * 30.0 - time * 2.0) * 0.1;
                
                // Edge fade for smooth water stream edges
                float edgeFade = smoothstep(0.0, 0.15, vUV.y) * smoothstep(1.0, 0.85, vUV.y);
                
                // Create transparency variation
                float waterAlpha = 0.3 + bands * 0.4 + noise;
                waterAlpha *= edgeFade;
                
                // Water color with variations
                vec3 lightWater = vec3(0.9, 0.95, 1.0);
                vec3 deepWater = vec3(0.7, 0.85, 0.95);
                vec3 finalColor = mix(deepWater, lightWater, bands + noise);
                
                // Add shimmer
                float shimmer = sin(vFlow * 20.0) * 0.1 + 0.9;
                finalColor *= shimmer;
                
                // Final alpha
                float alpha = waterAlpha * transparency;
                
                // Make sure we have some minimum visibility
                alpha = max(alpha, 0.2 * edgeFade);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    private createFlowingWaterTexture(): Texture {
        const width = 256;
        const height = 64;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Create flowing water pattern
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(200, 230, 255, 0)');
        gradient.addColorStop(0.1, 'rgba(200, 230, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(230, 245, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(230, 245, 255, 1)');
        gradient.addColorStop(0.9, 'rgba(200, 230, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(200, 230, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add some streak details
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 50, 0);
            ctx.lineTo(i * 50 + 20, height);
            ctx.stroke();
        }
        
        const texture = new Texture(canvas.toDataURL(), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        
        return texture;
    }
    
    private createWaterfallShader(): void {
        // Vertex shader
        Effect.ShadersStore['waterfallShaderVertexShader'] = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;
            
            uniform mat4 worldViewProjection;
            uniform float time;
            
            varying vec2 vUV;
            varying float vFlow;
            
            void main() {
                vUV = uv;
                vFlow = position.y + time;
                gl_Position = worldViewProjection * vec4(position, 1.0);
            }
        `;
        
        // Fragment shader
        Effect.ShadersStore['waterfallShaderFragmentShader'] = `
            precision highp float;
            
            uniform vec3 waterColor;
            uniform float opacity;
            uniform float time;
            uniform float flowSpeed;
            
            varying vec2 vUV;
            varying float vFlow;
            
            void main() {
                // Animated flow pattern
                float flow = fract(vFlow * flowSpeed);
                
                // Create water streaks
                float streak1 = sin(vUV.x * 10.0 + time * 3.0) * 0.5 + 0.5;
                float streak2 = sin(vUV.x * 15.0 - time * 2.0) * 0.5 + 0.5;
                float streaks = (streak1 + streak2) * 0.5;
                
                // Fade edges
                float edgeFade = smoothstep(0.0, 0.1, vUV.x) * smoothstep(1.0, 0.9, vUV.x);
                
                // Combine effects
                float alpha = opacity * edgeFade * (0.7 + streaks * 0.3);
                alpha *= (0.8 + flow * 0.2);
                
                // Slight color variation
                vec3 finalColor = waterColor * (0.9 + streaks * 0.1);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    private createWaterDropTexture(): Texture {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // Create water drop with HD-2D style
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(200, 220, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(150, 200, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        return new Texture(canvas.toDataURL(), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
    }
    
    private createSplashTexture(): Texture {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // Create splash droplet
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(230, 240, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        return new Texture(canvas.toDataURL(), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
    }
    
    private createStreamTexture(): Texture {
        const width = 64;
        const height = 256;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Create flowing water pattern
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, width, height);
        
        // Add water flow lines
        for (let i = 0; i < 8; i++) {
            const x = (i / 8) * width;
            const gradient = ctx.createLinearGradient(x, 0, x, height);
            gradient.addColorStop(0, 'rgba(200, 220, 255, 0)');
            gradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.6)');
            gradient.addColorStop(0.5, 'rgba(220, 240, 255, 0.8)');
            gradient.addColorStop(0.8, 'rgba(200, 220, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = width / 16;
            ctx.beginPath();
            ctx.moveTo(x + Math.sin(i) * 5, 0);
            ctx.lineTo(x + Math.sin(i + 1) * 5, height);
            ctx.stroke();
        }
        
        const texture = new Texture(canvas.toDataURL(), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        
        return texture;
    }
    
    public setEnabled(enabled: boolean): void {
        if (enabled) {
            this.waterParticles?.start();
            this.splashParticles?.start();
            if (this.waterStreamMesh) {
                this.waterStreamMesh.setEnabled(true);
            }
            if (this.waterfallMesh) {
                if (Array.isArray(this.waterfallMesh)) {
                    this.waterfallMesh.forEach(mesh => mesh.setEnabled(true));
                } else {
                    this.waterfallMesh.setEnabled(true);
                }
            }
        } else {
            this.waterParticles?.stop();
            this.splashParticles?.stop();
            if (this.waterStreamMesh) {
                this.waterStreamMesh.setEnabled(false);
            }
            if (this.waterfallMesh) {
                if (Array.isArray(this.waterfallMesh)) {
                    this.waterfallMesh.forEach(mesh => mesh.setEnabled(false));
                } else {
                    this.waterfallMesh.setEnabled(false);
                }
            }
        }
    }
    
    public dispose(): void {
        this.waterParticles?.dispose();
        this.splashParticles?.dispose();
        this.waterStreamMesh?.dispose();
        if (this.waterfallMesh) {
            if (Array.isArray(this.waterfallMesh)) {
                this.waterfallMesh.forEach(mesh => mesh.dispose());
            } else {
                this.waterfallMesh.dispose();
            }
        }
    }
}