import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import '@babylonjs/core/Particles/particleSystemComponent';

export class FountainWaterFlow {
    private scene: Scene;
    private waterParticles: ParticleSystem;
    private splashParticles: ParticleSystem;
    private waterStreamMesh: any;
    
    constructor(scene: Scene, fountainPosition: Vector3) {
        this.scene = scene;
        
        try {
            // Create main water flow
            this.createWaterFlow(fountainPosition);
            
            // Create splash effects at the bottom
            this.createSplashEffect(fountainPosition);
            
            // Create animated water stream mesh for HD-2D look
            this.createWaterStream(fountainPosition);
        } catch (error) {
            console.error('Error creating fountain water flow:', error);
        }
    }
    
    private createWaterFlow(fountainPos: Vector3): void {
        // Create water flow particles
        this.waterParticles = new ParticleSystem('fountainWater', 500, this.scene);
        
        // Create custom water drop texture
        this.waterParticles.particleTexture = this.createWaterDropTexture();
        
        // Emission from top of fountain
        this.waterParticles.emitter = fountainPos.clone();
        this.waterParticles.emitter.y += 2.5; // Top of fountain pillar
        
        // Emit in a small area for focused stream
        this.waterParticles.minEmitBox = new Vector3(-0.05, 0, -0.05);
        this.waterParticles.maxEmitBox = new Vector3(0.05, 0, 0.05);
        
        // Particle life - shorter for continuous flow
        this.waterParticles.minLifeTime = 0.8;
        this.waterParticles.maxLifeTime = 1.2;
        
        // Size - varied for depth
        this.waterParticles.minSize = 0.1;
        this.waterParticles.maxSize = 0.2;
        
        // High emission rate for continuous stream
        this.waterParticles.emitRate = 100;
        
        // Initial upward velocity (fountain spout)
        this.waterParticles.minEmitPower = 4;
        this.waterParticles.maxEmitPower = 5;
        
        // Direction - slightly upward spray
        this.waterParticles.direction1 = new Vector3(-0.1, 1, -0.1);
        this.waterParticles.direction2 = new Vector3(0.1, 1, 0.1);
        
        // Water colors - HD-2D style with transparency
        this.waterParticles.color1 = new Color4(0.6, 0.8, 1, 0.8);
        this.waterParticles.color2 = new Color4(0.8, 0.9, 1, 0.6);
        this.waterParticles.colorDead = new Color4(1, 1, 1, 0);
        
        // Add size variation over lifetime
        this.waterParticles.addSizeGradient(0, 0.1); // Start small
        this.waterParticles.addSizeGradient(0.3, 0.2); // Grow
        this.waterParticles.addSizeGradient(1, 0.05); // Shrink at end
        
        // Color gradient for more dynamic look
        this.waterParticles.addColorGradient(0, new Color4(0.7, 0.85, 1, 0.9));
        this.waterParticles.addColorGradient(0.5, new Color4(0.8, 0.9, 1, 0.7));
        this.waterParticles.addColorGradient(1, new Color4(1, 1, 1, 0));
        
        // Gravity for realistic arc
        this.waterParticles.gravity = new Vector3(0, -9.8, 0);
        
        // Slight turbulence
        this.waterParticles.noiseStrength = new Vector3(0.1, 0, 0.1);
        
        // Render order
        this.waterParticles.renderingGroupId = 2;
        
        // Blend mode for water transparency
        this.waterParticles.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        
        this.waterParticles.start();
    }
    
    private createSplashEffect(fountainPos: Vector3): void {
        // Create splash particles at water surface
        this.splashParticles = new ParticleSystem('fountainSplash', 200, this.scene);
        
        this.splashParticles.particleTexture = this.createSplashTexture();
        
        // Emit from water surface
        this.splashParticles.emitter = fountainPos.clone();
        this.splashParticles.emitter.y += 0.5; // Water surface level
        
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
        
        // Splash colors - whiter and more transparent
        this.splashParticles.color1 = new Color4(0.9, 0.95, 1, 0.6);
        this.splashParticles.color2 = new Color4(1, 1, 1, 0.4);
        
        // Quick fade
        this.splashParticles.addColorGradient(0, new Color4(1, 1, 1, 0.7));
        this.splashParticles.addColorGradient(1, new Color4(1, 1, 1, 0));
        
        // Light gravity
        this.splashParticles.gravity = new Vector3(0, -5, 0);
        
        this.splashParticles.renderingGroupId = 2;
        this.splashParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
        
        this.splashParticles.start();
    }
    
    private createWaterStream(fountainPos: Vector3): void {
        // Create a cylindrical mesh for the main water stream
        const waterStream = CreateCylinder('waterStream', {
            diameterTop: 0.15,
            diameterBottom: 0.4,
            height: 2,
            tessellation: 16
        }, this.scene);
        
        waterStream.position = fountainPos.clone();
        waterStream.position.y += 1.5; // Position between spout and water surface
        
        // Create animated water material
        const streamMat = new StandardMaterial('streamMat', this.scene);
        streamMat.diffuseColor = new Color3(0.7, 0.85, 1);
        streamMat.specularColor = new Color3(1, 1, 1);
        streamMat.alpha = 0.4;
        streamMat.specularPower = 128;
        
        // Add scrolling texture animation for flow effect
        const streamTexture = this.createStreamTexture();
        streamMat.diffuseTexture = streamTexture;
        streamMat.diffuseTexture.hasAlpha = true;
        streamMat.useAlphaFromDiffuseTexture = true;
        
        waterStream.material = streamMat;
        waterStream.renderingGroupId = 1;
        
        // Animate texture V offset for flowing effect
        this.scene.registerBeforeRender(() => {
            if (streamTexture && streamTexture.vOffset !== undefined) {
                streamTexture.vOffset += 0.01; // Scroll speed
                if (streamTexture.vOffset > 1) {
                    streamTexture.vOffset -= 1; // Reset when it reaches 1
                }
            }
        });
        
        this.waterStreamMesh = waterStream;
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
        } else {
            this.waterParticles?.stop();
            this.splashParticles?.stop();
            if (this.waterStreamMesh) {
                this.waterStreamMesh.setEnabled(false);
            }
        }
    }
    
    public dispose(): void {
        this.waterParticles?.dispose();
        this.splashParticles?.dispose();
        this.waterStreamMesh?.dispose();
    }
}