// HD-2D Sprite Implementation
import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Animation } from '@babylonjs/core/Animations/animation';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { SpriteOutlineMaterial } from './materials/SpriteOutlineMaterial';
import { SpeechBubbleIndicator } from './ui/SpeechBubbleIndicator';

export interface HD2DSpriteOptions {
    width?: number;
    height?: number;
    frameWidth: number;
    frameHeight: number;
    billboardMode?: number;
    pixelUnit?: number;
}

export interface SpriteAnimation {
    name: string;
    frames: number[];
    frameRate: number;
    loop: boolean;
}

export class HD2DSprite {
    public mesh: Mesh;
    protected material: StandardMaterial | SpriteOutlineMaterial;
    public texture: Texture | null = null; // Made public to access sprite URL
    protected scene: Scene;
    protected options: HD2DSpriteOptions;
    protected outlineEnabled: boolean = false;
    
    // Animation properties
    protected animations: Map<string, SpriteAnimation> = new Map();
    protected currentAnimation: string | null = null;
    protected currentFrame: number = 0;
    protected animationTimer: number = 0;
    protected isPlaying: boolean = false;
    
    // Shadow sprite (separate mesh for blob shadow)
    protected shadowMesh: Mesh | null = null;
    
    // Speech bubble indicator
    protected speechBubble: SpeechBubbleIndicator | null = null;
    
    constructor(name: string, scene: Scene, options: HD2DSpriteOptions) {
        this.scene = scene;
        this.options = {
            width: options.width || 2,
            height: options.height || 2,
            billboardMode: options.billboardMode || Mesh.BILLBOARDMODE_Y,
            pixelUnit: options.pixelUnit || 32,
            ...options
        };
        
        // Create the sprite mesh
        this.mesh = this.createSpriteMesh(name);
        
        // Create shadow mesh
        // Only create blob shadows if transparency shadows aren't available
        this.createShadowBlob();
        
        // Start update loop
        scene.registerBeforeRender(() => this.update());
    }
    
    protected createSpriteMesh(name: string): Mesh {
        // Create plane for sprite
        const mesh = CreatePlane(`${name}_sprite`, {
            width: this.options.width!,
            height: this.options.height!,
            sideOrientation: Mesh.DOUBLESIDE
        }, this.scene);
        
        // Create material
        this.material = new StandardMaterial(`${name}_mat`, this.scene);
        
        // HD-2D specific material settings
        this.material.specularColor = new Color3(0, 0, 0); // No specular
        this.material.emissiveColor = new Color3(0.6, 0.6, 0.6); // Partial emissive for visibility
        this.material.diffuseColor = new Color3(1, 1, 1);
        this.material.ambientColor = new Color3(1, 1, 1);
        this.material.useAlphaFromDiffuseTexture = true;
        this.material.backFaceCulling = false;
        this.material.transparencyMode = Material.MATERIAL_ALPHATEST; // Use alpha test to discard transparent pixels
        this.material.alphaMode = Engine.ALPHA_COMBINE;
        this.material.alphaCutOff = 0.4; // Discard pixels with alpha < 0.4
        
        mesh.material = this.material;
        
        // Set billboard mode
        mesh.billboardMode = this.options.billboardMode!;
        
        // Set rendering layer - use same as world objects for proper depth sorting
        mesh.renderingGroupId = 1; // Same as buildings/props for proper occlusion
        
        // Enable alpha index for proper sorting
        mesh.alphaIndex = 0;
        
        // Ensure mesh updates its bounding box for proper culling
        mesh.refreshBoundingInfo();
        
        return mesh;
    }
    
    protected createShadowBlob(): void {
        // Create a simple circular shadow
        this.shadowMesh = CreatePlane(`${this.mesh.name}_shadow`, {
            width: this.options.width! * 0.5,
            height: this.options.width! * 0.5 // Circular aspect
        }, this.scene);
        
        // Position shadow at ground level
        this.shadowMesh.rotation.x = Math.PI / 2; // Lay flat
        this.shadowMesh.position.y = 0.01; // Slightly above ground
        
        // Create shadow material
        const shadowMat = new StandardMaterial(`${this.mesh.name}_shadowMat`, this.scene);
        shadowMat.diffuseColor = new Color3(0, 0, 0);
        shadowMat.specularColor = new Color3(0, 0, 0);
        shadowMat.emissiveColor = new Color3(0, 0, 0);
        shadowMat.alpha = 0.3;
        
        this.shadowMesh.material = shadowMat;
        this.shadowMesh.renderingGroupId = 0; // Ground layer
        
        // Parent shadow to sprite
        this.shadowMesh.parent = this.mesh;
    }
    
    public loadSpriteSheet(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.texture = new Texture(url, this.scene, false, true, Texture.NEAREST_SAMPLINGMODE,
                () => {
                    // Texture loaded successfully
                    this.texture!.hasAlpha = true;
                    
                    // Disable mipmaps for pixel perfect
                    this.texture!.anisotropicFilteringLevel = 1;
                    
                    // Prevent texture wrapping issues
                    this.texture!.wrapU = Texture.CLAMP_ADDRESSMODE;
                    this.texture!.wrapV = Texture.CLAMP_ADDRESSMODE;
                    
                    this.material.diffuseTexture = this.texture;
                    
                    // Set initial texture coordinates
                    // Only set UV coordinates for animated sprites
                    if (this.animations.size > 0 && this.currentAnimation) {
                        this.updateTextureCoordinates();
                    }
                    // For static sprites (NPCs), use default UV (full texture)
                    
                    resolve();
                },
                () => {
                    // Error loading texture
                    console.error(`Failed to load sprite sheet: ${url}`);
                    reject(new Error(`Failed to load sprite sheet: ${url}`));
                }
            );
        });
    }
    
    public addAnimation(animation: SpriteAnimation): void {
        this.animations.set(animation.name, animation);
    }
    
    public play(animationName: string): void {
        const anim = this.animations.get(animationName);
        if (!anim) {
            console.warn(`Animation '${animationName}' not found`);
            return;
        }
        
        if (this.currentAnimation === animationName && this.isPlaying) {
            return; // Already playing
        }
        
        this.currentAnimation = animationName;
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.isPlaying = true;
        
        this.updateTextureCoordinates();
    }
    
    public stop(): void {
        this.isPlaying = false;
    }
    
    protected update(): void {
        if (!this.isPlaying || !this.currentAnimation || !this.texture) return;
        
        const anim = this.animations.get(this.currentAnimation);
        if (!anim) return;
        
        // Update animation timer
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
        this.animationTimer += deltaTime;
        
        // Check if it's time for next frame
        const frameDuration = 1 / anim.frameRate;
        if (this.animationTimer >= frameDuration) {
            this.animationTimer -= frameDuration;
            this.currentFrame++;
            
            // Handle animation end
            if (this.currentFrame >= anim.frames.length) {
                if (anim.loop) {
                    this.currentFrame = 0;
                } else {
                    this.isPlaying = false;
                    this.currentFrame = anim.frames.length - 1;
                }
            }
            
            this.updateTextureCoordinates();
        }
        
        // Update shadow opacity based on height
        if (this.shadowMesh && this.shadowMesh.material) {
            const heightAboveGround = this.mesh.position.y;
            const maxShadowDistance = 5;
            const shadowAlpha = Math.max(0.1, 0.3 * (1 - heightAboveGround / maxShadowDistance));
            (this.shadowMesh.material as StandardMaterial).alpha = shadowAlpha;
        }
    }
    
    protected updateTextureCoordinates(): void {
        if (!this.texture || !this.currentAnimation) return;
        
        const anim = this.animations.get(this.currentAnimation);
        if (!anim) return;
        
        const frameIndex = anim.frames[this.currentFrame];
        
        // For sprite sheets that are horizontal strips
        const textureSize = this.texture.getSize();
        const totalFrames = Math.floor(textureSize.width / this.options.frameWidth);
        
        // Calculate UV coordinates for current frame
        const frameWidth = 1.0 / totalFrames;
        
        // Set UV scale and offset for horizontal strip
        this.texture.uScale = frameWidth;
        this.texture.vScale = 1.0; // Full height
        this.texture.uOffset = frameIndex * frameWidth;
        this.texture.vOffset = 0;
    }
    
    public setPosition(position: Vector3): void {
        this.mesh.position = position;
        
        // Update depth sorting based on Z position (further back = lower index = drawn first)
        // Add Y component for sprites at same Z depth
        this.mesh.alphaIndex = -position.z * 1000 - position.y * 10;
    }
    
    public setAlphaIndex(index: number): void {
        this.mesh.alphaIndex = index;
    }
    
    public enableOutline(color: Color3 = new Color3(0, 0, 0), width: number = 2): void {
        if (!this.texture || this.outlineEnabled) return;
        
        // Create outline material
        const outlineMat = new SpriteOutlineMaterial(`${this.mesh.name}_outlineMat`, this.scene, this.texture);
        outlineMat.setOutlineColor(color);
        outlineMat.setOutlineWidth(width);
        
        // Replace material
        this.material.dispose();
        this.material = outlineMat;
        this.mesh.material = this.material;
        
        this.outlineEnabled = true;
    }
    
    public enableSpeechBubble(): void {
        if (!this.speechBubble) {
            this.speechBubble = new SpeechBubbleIndicator(this.scene, this.mesh);
        }
    }
    
    public showSpeechBubble(): void {
        if (this.speechBubble) {
            this.speechBubble.show();
        }
    }
    
    public hideSpeechBubble(): void {
        if (this.speechBubble) {
            this.speechBubble.hide();
        }
    }
    
    public dispose(): void {
        if (this.texture) {
            this.texture.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
        if (this.shadowMesh) {
            this.shadowMesh.dispose();
        }
        if (this.speechBubble) {
            this.speechBubble.dispose();
        }
        this.mesh.dispose();
    }
}