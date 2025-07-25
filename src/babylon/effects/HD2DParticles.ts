import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

export class HD2DParticles {
    private scene: Scene;
    private particleSystems: ParticleSystem[] = [];
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    public createAmbientDust(): void {
        // Create simple white particle texture
        const particleSystem = new ParticleSystem('ambientDust', 100, this.scene);
        
        // Use a simple white texture
        particleSystem.particleTexture = this.createSimpleParticleTexture();
        
        // Where particles spawn from
        particleSystem.emitter = Vector3.Zero();
        particleSystem.minEmitBox = new Vector3(-15, 5, -15);
        particleSystem.maxEmitBox = new Vector3(15, 10, 15);
        
        // Particle life
        particleSystem.minLifeTime = 5.0;
        particleSystem.maxLifeTime = 10.0;
        
        // Size
        particleSystem.minSize = 0.05;
        particleSystem.maxSize = 0.1;
        
        // Emission
        particleSystem.emitRate = 10;
        particleSystem.manualEmitCount = -1;
        
        // Speed
        particleSystem.minEmitPower = 0.01;
        particleSystem.maxEmitPower = 0.05;
        particleSystem.updateSpeed = 0.01;
        
        // Direction - floating down gently
        particleSystem.direction1 = new Vector3(-0.1, -1, -0.1);
        particleSystem.direction2 = new Vector3(0.1, -0.5, 0.1);
        
        // Colors
        particleSystem.color1 = new Color4(1, 1, 1, 0.5);
        particleSystem.color2 = new Color4(1, 1, 0.9, 0.3);
        particleSystem.colorDead = new Color4(1, 1, 1, 0);
        
        // Blend mode for soft particles
        particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        
        // Gravity
        particleSystem.gravity = new Vector3(0, -0.05, 0);
        
        // Start the particle system
        particleSystem.start();
        this.particleSystems.push(particleSystem);
    }
    
    public createMagicalSparkles(): void {
        const particleSystem = new ParticleSystem('sparkles', 50, this.scene);
        
        // Use built-in flare texture or create simple one
        particleSystem.particleTexture = this.createSparkleTexture();
        
        // Emission area
        particleSystem.emitter = Vector3.Zero();
        particleSystem.minEmitBox = new Vector3(-10, 1, -10);
        particleSystem.maxEmitBox = new Vector3(10, 5, 10);
        
        // Life
        particleSystem.minLifeTime = 3.0;
        particleSystem.maxLifeTime = 6.0;
        
        // Size - much larger sparkles
        particleSystem.minSize = 0.15;
        particleSystem.maxSize = 0.35;
        
        // Emission rate
        particleSystem.emitRate = 5;
        
        // Speed - slow floating
        particleSystem.minEmitPower = 0.005;
        particleSystem.maxEmitPower = 0.02;
        particleSystem.updateSpeed = 0.008;
        
        // Direction - gentle float
        particleSystem.direction1 = new Vector3(-0.2, -0.5, -0.2);
        particleSystem.direction2 = new Vector3(0.2, 0.5, 0.2);
        
        // Brighter magical golden color
        particleSystem.color1 = new Color4(1, 0.95, 0.7, 0.9);
        particleSystem.color2 = new Color4(1, 1, 0.85, 0.8);
        particleSystem.colorDead = new Color4(1, 1, 1, 0);
        
        // Additive blend for glow
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        
        // Very light gravity
        particleSystem.gravity = new Vector3(0, -0.02, 0);
        
        particleSystem.start();
        this.particleSystems.push(particleSystem);
    }
    
    // Create a simple particle texture if external textures fail
    private createSimpleParticleTexture(): Texture {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        if (context) {
            // Create a simple white circle with soft edges
            const gradient = context.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, size, size);
        }
        
        // Create texture from canvas data URL
        const texture = new Texture(canvas.toDataURL(), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
        return texture;
    }
    
    private createSparkleTexture(): Texture {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        if (context) {
            // Clear canvas
            context.clearRect(0, 0, size, size);
            
            // Create a bright star-like sparkle with multiple layers
            const centerX = size / 2;
            const centerY = size / 2;
            
            // Outer glow
            const outerGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size/2);
            outerGlow.addColorStop(0, 'rgba(255,255,200,1)');
            outerGlow.addColorStop(0.2, 'rgba(255,255,150,0.8)');
            outerGlow.addColorStop(0.4, 'rgba(255,255,100,0.4)');
            outerGlow.addColorStop(0.7, 'rgba(255,200,50,0.1)');
            outerGlow.addColorStop(1, 'rgba(255,200,0,0)');
            
            context.fillStyle = outerGlow;
            context.fillRect(0, 0, size, size);
            
            // Add bright center
            const innerGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size/6);
            innerGlow.addColorStop(0, 'rgba(255,255,255,1)');
            innerGlow.addColorStop(0.5, 'rgba(255,255,220,0.9)');
            innerGlow.addColorStop(1, 'rgba(255,255,200,0)');
            
            context.fillStyle = innerGlow;
            context.fillRect(0, 0, size, size);
        }
        
        const texture = new Texture(canvas.toDataURL(), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
        return texture;
    }
    
    public start(): void {
        this.particleSystems.forEach(ps => {
            ps.start();
        });
    }
    
    public stop(): void {
        this.particleSystems.forEach(ps => {
            ps.stop();
        });
    }
    
    public setEnabled(enabled: boolean): void {
        this.particleSystems.forEach(ps => {
            ps.isEnabled = enabled;
            if (enabled && !ps.isStarted()) {
                ps.start();
            }
        });
    }
    
    public dispose(): void {
        this.particleSystems.forEach(ps => ps.dispose());
        this.particleSystems = [];
    }
}