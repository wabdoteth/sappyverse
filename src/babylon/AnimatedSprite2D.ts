// Animated 2D Sprite class for HD-2D characters using sprite sheets
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';

export interface AnimationConfig {
  key: string;
  frames: number;
  frameRate: number;
  loop?: boolean;
}

export interface AnimatedSpriteOptions {
  width?: number;
  height?: number;
  frameWidth: number;
  frameHeight: number;
  billboardMode?: number;
}

export class AnimatedSprite2D {
  public mesh: Mesh;
  private material: StandardMaterial;
  private shadowProxy: Mesh | null = null;
  private animations: Map<string, AnimationConfig> = new Map();
  private currentAnimation: string | null = null;
  private currentFrame: number = 0;
  private animationTimer: number = 0;
  private isPlaying: boolean = false;
  private textures: Map<string, Texture> = new Map();
  
  // Player specific properties
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private currentState: 'idle' | 'run' | 'attack1' | 'attack2' = 'idle';
  
  constructor(
    public name: string,
    private scene: Scene,
    private options: AnimatedSpriteOptions
  ) {
    const {
      width = 2,
      height = 2.5,
      billboardMode = Mesh.BILLBOARDMODE_Y
    } = options;
    
    // Create plane mesh for sprite
    this.mesh = CreatePlane(`${name}_sprite`, {
      width,
      height,
      sideOrientation: Mesh.DOUBLESIDE
    }, scene);
    
    // Don't adjust pivot for now - let's debug the issue first
    
    // Create material
    this.material = new StandardMaterial(`${name}_mat`, scene);
    this.material.specularColor = new Color3(0, 0, 0);
    // Partial emissive to maintain sprite visibility while allowing some lighting
    this.material.emissiveColor = new Color3(0.7, 0.7, 0.7);
    this.material.diffuseColor = new Color3(1, 1, 1);
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.backFaceCulling = false;
    
    this.mesh.material = this.material;
    
    // Set billboard mode for HD-2D effect
    this.mesh.billboardMode = billboardMode;
    
    // Ensure sprite renders in correct order
    // this.mesh.renderingGroupId = 1; // Let the game handle depth sorting
    
    // Load animations
    this.loadPlayerAnimations();
    
    // Start update loop
    scene.registerBeforeRender(() => this.update());
  }
  
  private loadPlayerAnimations(): void {
    const directions = ['up', 'down', 'left', 'right'];
    const animations = [
      { name: 'idle', frames: 8, frameRate: 8, loop: true },
      { name: 'run', frames: 8, frameRate: 12, loop: true },
      { name: 'attack1', frames: 8, frameRate: 12, loop: false },
      { name: 'attack2', frames: 8, frameRate: 12, loop: false }
    ];
    
    // Load all sprite sheets
    directions.forEach(dir => {
      animations.forEach(anim => {
        const key = `${anim.name}_${dir}`;
        const path = `/assets/sprites/player/${anim.name.toUpperCase()}/${anim.name}_${dir}.png`;
        
        // Create texture
        const texture = new Texture(path, this.scene);
        texture.hasAlpha = true;
        
        // Store texture
        this.textures.set(key, texture);
        
        // Register animation
        this.animations.set(key, {
          key,
          frames: anim.frames,
          frameRate: anim.frameRate,
          loop: anim.loop
        });
      });
    });
    
    // Start with idle down
    this.play('idle_down');
  }
  
  play(animationKey: string): void {
    if (this.currentAnimation === animationKey && this.isPlaying) {
      return; // Already playing this animation
    }
    
    const anim = this.animations.get(animationKey);
    if (!anim) {
      console.warn(`Animation not found: ${animationKey}`);
      return;
    }
    
    this.currentAnimation = animationKey;
    this.currentFrame = 0;
    this.animationTimer = 0;
    this.isPlaying = true;
    
    // Update texture
    this.updateTexture();
  }
  
  private updateTexture(): void {
    if (!this.currentAnimation) return;
    
    const texture = this.textures.get(this.currentAnimation);
    if (!texture) return;
    
    // Calculate UV coordinates for the current frame
    const anim = this.animations.get(this.currentAnimation);
    if (!anim) return;
    
    const frameWidth = this.options.frameWidth;
    const frameHeight = this.options.frameHeight;
    
    // Create a new texture for the current frame
    if (!this.material.diffuseTexture) {
      this.material.diffuseTexture = texture;
    }
    
    // Update UV scale and offset to show only the current frame
    const framesPerRow = Math.floor(texture.getSize().width / frameWidth);
    const col = this.currentFrame % framesPerRow;
    const row = Math.floor(this.currentFrame / framesPerRow);
    
    texture.uScale = frameWidth / texture.getSize().width;
    texture.vScale = frameHeight / texture.getSize().height;
    texture.uOffset = col * texture.uScale;
    texture.vOffset = row * texture.vScale;
    
    this.material.diffuseTexture = texture;
  }
  
  private update(): void {
    if (!this.isPlaying || !this.currentAnimation) return;
    
    const anim = this.animations.get(this.currentAnimation);
    if (!anim) return;
    
    // Update animation timer
    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
    this.animationTimer += deltaTime;
    
    // Check if it's time for the next frame
    const frameDuration = 1 / anim.frameRate;
    if (this.animationTimer >= frameDuration) {
      this.animationTimer -= frameDuration;
      this.currentFrame++;
      
      // Handle animation end
      if (this.currentFrame >= anim.frames) {
        if (anim.loop) {
          this.currentFrame = 0;
        } else {
          this.isPlaying = false;
          this.currentFrame = anim.frames - 1;
          
          // Return to idle after attack
          if (this.currentAnimation.includes('attack')) {
            this.playIdleAnimation();
          }
        }
      }
      
      this.updateTexture();
    }
  }
  
  // Player control methods
  setMoving(isMoving: boolean, direction?: 'up' | 'down' | 'left' | 'right'): void {
    if (direction) {
      this.currentDirection = direction;
    }
    
    if (isMoving) {
      this.currentState = 'run';
      this.play(`run_${this.currentDirection}`);
    } else {
      this.currentState = 'idle';
      this.playIdleAnimation();
    }
  }
  
  attack(attackType: 1 | 2 = 1): void {
    this.currentState = attackType === 1 ? 'attack1' : 'attack2';
    this.play(`${this.currentState}_${this.currentDirection}`);
  }
  
  private playIdleAnimation(): void {
    this.currentState = 'idle';
    this.play(`idle_${this.currentDirection}`);
  }
  
  setPosition(position: Vector3): void {
    this.mesh.position = position;
  }
  
  get position(): Vector3 {
    return this.mesh.position;
  }
  
  enableShadows(shadowGenerator: any): void {
    // Create a shadow proxy - an invisible box that casts the shadow
    if (!this.shadowProxy) {
      this.shadowProxy = CreateBox(`${this.name}_shadowProxy`, {
        width: 0.8,
        height: 2.0,
        depth: 0.3
      }, this.scene);
      
      // Make the proxy invisible but still cast shadows
      this.shadowProxy.isVisible = false;
      this.shadowProxy.position = this.mesh.position.clone();
      this.shadowProxy.position.y += 1.0; // Center the box on the sprite
      
      // Parent the shadow proxy to the sprite so it follows
      this.shadowProxy.parent = this.mesh;
    }
    
    // Add the shadow proxy to the shadow generator
    shadowGenerator.addShadowCaster(this.shadowProxy);
    
    // The sprite itself should not cast shadows (it's a billboard)
    // But it can receive shadows
    this.mesh.receiveShadows = true;
  }
  
  dispose(): void {
    this.textures.forEach(texture => texture.dispose());
    this.material.dispose();
    this.mesh.dispose();
    if (this.shadowProxy) {
      this.shadowProxy.dispose();
    }
  }
}