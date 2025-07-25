import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Particles/particleSystemComponent';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

export class AmbientParticles {
    private scene: Scene;
    private particleSystems: ParticleSystem[] = [];
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    public createDustMotes(): void {
        // Create a simple particle texture
        const particleTexture = this.createParticleTexture();
        
        // Create particle system
        const particleSystem = new ParticleSystem('dustMotes', 150, this.scene);
        particleSystem.particleTexture = particleTexture;
        
        // Emission - spawn from above screen
        particleSystem.emitter = Vector3.Zero();
        particleSystem.minEmitBox = new Vector3(-25, 8, -25);
        particleSystem.maxEmitBox = new Vector3(25, 12, 25);
        
        // Life time - longer for graceful fade
        particleSystem.minLifeTime = 8;
        particleSystem.maxLifeTime = 15;
        
        // Size - start small, grow slightly, then shrink
        particleSystem.minSize = 0.05;
        particleSystem.maxSize = 0.15;
        
        // Emission rate - steady spawn
        particleSystem.emitRate = 8;
        
        // Speed - very slow, drifting
        particleSystem.minEmitPower = 0.02;
        particleSystem.maxEmitPower = 0.08;
        particleSystem.updateSpeed = 0.003;
        
        // Direction - mostly downward with slight drift
        particleSystem.direction1 = new Vector3(-0.2, -1, -0.2);
        particleSystem.direction2 = new Vector3(0.2, -0.8, 0.2);
        
        // Color with fade in/out
        particleSystem.color1 = new Color4(1, 1, 0.9, 0);
        particleSystem.color2 = new Color4(1, 0.95, 0.8, 0);
        particleSystem.colorDead = new Color4(1, 1, 1, 0);
        
        // Fade in and out
        particleSystem.addColorGradient(0, new Color4(1, 1, 0.9, 0)); // Start invisible
        particleSystem.addColorGradient(0.2, new Color4(1, 1, 0.9, 0.6)); // Fade in
        particleSystem.addColorGradient(0.8, new Color4(1, 0.95, 0.8, 0.4)); // Start fade out
        particleSystem.addColorGradient(1, new Color4(1, 1, 1, 0)); // End invisible
        
        // Size animation
        particleSystem.addSizeGradient(0, 0.05); // Start small
        particleSystem.addSizeGradient(0.3, 0.15); // Grow
        particleSystem.addSizeGradient(1, 0.02); // Shrink to nothing
        
        // Blend mode
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        
        // Gravity - gentle downward pull
        particleSystem.gravity = new Vector3(0, -0.5, 0);
        
        // Add some turbulence for natural movement
        particleSystem.noiseStrength = new Vector3(0.2, 0.1, 0.2);
        
        // Render order
        particleSystem.renderingGroupId = 3;
        
        particleSystem.start();
        this.particleSystems.push(particleSystem);
    }
    
    public createFireflies(): void {
        const particleTexture = this.createGlowTexture();
        
        const particleSystem = new ParticleSystem('fireflies', 30, this.scene);
        particleSystem.particleTexture = particleTexture;
        
        // Emission - spawn from mid-air
        particleSystem.emitter = Vector3.Zero();
        particleSystem.minEmitBox = new Vector3(-20, 2, -20);
        particleSystem.maxEmitBox = new Vector3(20, 6, 20);
        
        // Life time - long for wandering effect
        particleSystem.minLifeTime = 10;
        particleSystem.maxLifeTime = 20;
        
        // Size
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        
        // Emission rate - sparse
        particleSystem.emitRate = 3;
        
        // Speed - very slow for floating effect
        particleSystem.minEmitPower = 0.01;
        particleSystem.maxEmitPower = 0.05;
        particleSystem.updateSpeed = 0.002;
        
        // Direction - gentle drift with slight downward bias
        particleSystem.direction1 = new Vector3(-0.5, -0.2, -0.5);
        particleSystem.direction2 = new Vector3(0.5, -0.1, 0.5);
        
        // Color - magical glow that pulses
        particleSystem.color1 = new Color4(0.8, 1, 0.4, 0);
        particleSystem.color2 = new Color4(1, 1, 0.6, 0);
        
        // Pulsing glow effect
        particleSystem.addColorGradient(0, new Color4(0.8, 1, 0.4, 0)); // Start invisible
        particleSystem.addColorGradient(0.1, new Color4(0.8, 1, 0.4, 0.3)); // Fade in
        particleSystem.addColorGradient(0.3, new Color4(1, 1, 0.6, 0.8)); // Bright
        particleSystem.addColorGradient(0.5, new Color4(0.9, 1, 0.5, 0.6)); // Mid pulse
        particleSystem.addColorGradient(0.7, new Color4(1, 1, 0.7, 0.9)); // Bright again
        particleSystem.addColorGradient(0.9, new Color4(0.8, 1, 0.4, 0.3)); // Fade out
        particleSystem.addColorGradient(1, new Color4(0.8, 1, 0.4, 0)); // End invisible
        
        // Size pulsing
        particleSystem.addSizeGradient(0, 0.1);
        particleSystem.addSizeGradient(0.3, 0.25);
        particleSystem.addSizeGradient(0.5, 0.15);
        particleSystem.addSizeGradient(0.7, 0.3);
        particleSystem.addSizeGradient(1, 0.05);
        
        // Blend mode
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        
        // Very slight gravity
        particleSystem.gravity = new Vector3(0, -0.1, 0);
        
        // Add wandering movement
        particleSystem.noiseStrength = new Vector3(1, 0.5, 1);
        
        particleSystem.renderingGroupId = 3;
        
        particleSystem.start();
        this.particleSystems.push(particleSystem);
    }
    
    public createLeaves(): void {
        const leafTexture = this.createLeafTexture();
        
        const particleSystem = new ParticleSystem('fallingLeaves', 30, this.scene);
        particleSystem.particleTexture = leafTexture;
        
        // Emission from above
        particleSystem.emitter = Vector3.Zero();
        particleSystem.minEmitBox = new Vector3(-20, 10, -20);
        particleSystem.maxEmitBox = new Vector3(20, 15, 20);
        
        // Life time
        particleSystem.minLifeTime = 10;
        particleSystem.maxLifeTime = 15;
        
        // Size
        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 0.6;
        
        // Emission rate
        particleSystem.emitRate = 1;
        
        // Speed
        particleSystem.minEmitPower = 0.1;
        particleSystem.maxEmitPower = 0.2;
        particleSystem.updateSpeed = 0.01;
        
        // Direction - falling with drift
        particleSystem.direction1 = new Vector3(-0.5, -1, -0.5);
        particleSystem.direction2 = new Vector3(0.5, -1, 0.5);
        
        // Color - autumn leaves
        particleSystem.color1 = new Color4(1, 0.6, 0.2, 0.8);
        particleSystem.color2 = new Color4(0.8, 0.4, 0.1, 0.6);
        
        // Gravity
        particleSystem.gravity = new Vector3(0, -0.5, 0);
        
        // Rotation
        particleSystem.minAngularSpeed = -Math.PI;
        particleSystem.maxAngularSpeed = Math.PI;
        
        particleSystem.renderingGroupId = 2;
        
        particleSystem.start();
        this.particleSystems.push(particleSystem);
    }
    
    private createParticleTexture(): Texture {
        const size = 32;
        
        // Create a simple circular particle
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Create texture from canvas
        const texture = new Texture(canvas.toDataURL(), this.scene, false, false, Texture.NEAREST_SAMPLINGMODE);
        
        return texture;
    }
    
    private createGlowTexture(): Texture {
        const size = 64;
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // Create glowing orb
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        const texture = new Texture(canvas.toDataURL(), this.scene, false, false, Texture.BILINEAR_SAMPLINGMODE);
        
        return texture;
    }
    
    private createLeafTexture(): Texture {
        const size = 32;
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // Simple leaf shape
        ctx.fillStyle = 'rgba(180, 100, 50, 1)';
        ctx.beginPath();
        ctx.ellipse(size/2, size/2, size/3, size/2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new Texture(canvas.toDataURL(), this.scene, false, false, Texture.NEAREST_SAMPLINGMODE);
        
        return texture;
    }
    
    private createNoiseTexture(): Texture {
        // Create a simple noise texture for particle movement
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // Generate random noise
        const imageData = ctx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const value = Math.random() * 255;
            imageData.data[i] = value;     // R
            imageData.data[i + 1] = value; // G
            imageData.data[i + 2] = value; // B
            imageData.data[i + 3] = 255;   // A
        }
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new Texture(canvas.toDataURL(), this.scene, false, false, Texture.BILINEAR_SAMPLINGMODE);
        return texture;
    }
    
    public setEnabled(enabled: boolean): void {
        this.particleSystems.forEach(ps => {
            if (enabled) {
                ps.start();
            } else {
                ps.stop();
            }
        });
    }
    
    public dispose(): void {
        this.particleSystems.forEach(ps => ps.dispose());
        this.particleSystems = [];
    }
}