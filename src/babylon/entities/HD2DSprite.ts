import * as BABYLON from '@babylonjs/core';

export interface SpriteAnimation {
  name: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  loop: boolean;
}

export class HD2DSprite {
  protected mesh: BABYLON.Mesh;
  protected material: BABYLON.StandardMaterial;
  protected animations: Map<string, SpriteAnimation> = new Map();
  protected currentAnimation?: SpriteAnimation;
  protected currentFrame: number = 0;
  protected frameTimer: number = 0;
  protected spriteSheet: BABYLON.Texture;
  
  // Sprite configuration
  protected readonly frameWidth: number;
  protected readonly frameHeight: number;
  protected readonly framesPerRow: number;
  protected readonly totalFrames: number;
  
  // 8-directional support
  protected direction: number = 0; // 0-7 for 8 directions
  protected directionalOffset: number = 0;
  
  constructor(
    scene: BABYLON.Scene,
    spriteSheetPath: string,
    frameWidth: number,
    frameHeight: number,
    framesPerRow: number,
    totalFrames: number
  ) {
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.framesPerRow = framesPerRow;
    this.totalFrames = totalFrames;
    
    // Create billboard mesh
    this.mesh = BABYLON.MeshBuilder.CreatePlane('sprite', {
      width: frameWidth / 32, // Convert pixels to world units
      height: frameHeight / 32,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    
    // Create material
    this.material = new BABYLON.StandardMaterial('spriteMat', scene);
    this.spriteSheet = new BABYLON.Texture(spriteSheetPath, scene, false, false);
    this.spriteSheet.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
    this.material.diffuseTexture = this.spriteSheet;
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    this.material.backFaceCulling = false;
    this.material.disableLighting = false; // Enable lighting for HD-2D
    this.material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Slight self-illumination
    
    this.mesh.material = this.material;
    
    // Billboard behavior (Y-axis only for HD-2D)
    this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
    
    // Setup UV animation
    this.updateUVs(0);
  }
  
  public addAnimation(
    name: string,
    startFrame: number,
    endFrame: number,
    frameRate: number = 10,
    loop: boolean = true
  ): void {
    this.animations.set(name, {
      name,
      startFrame,
      endFrame,
      frameRate,
      loop
    });
  }
  
  public playAnimation(name: string): void {
    const animation = this.animations.get(name);
    if (!animation) {
      console.warn(`Animation ${name} not found`);
      return;
    }
    
    this.currentAnimation = animation;
    this.currentFrame = animation.startFrame;
    this.frameTimer = 0;
    this.updateUVs(this.currentFrame + this.directionalOffset);
  }
  
  public update(deltaTime: number): void {
    if (!this.currentAnimation) return;
    
    this.frameTimer += deltaTime;
    const frameDuration = 1 / this.currentAnimation.frameRate;
    
    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.currentFrame++;
      
      if (this.currentFrame > this.currentAnimation.endFrame) {
        if (this.currentAnimation.loop) {
          this.currentFrame = this.currentAnimation.startFrame;
        } else {
          this.currentFrame = this.currentAnimation.endFrame;
        }
      }
      
      this.updateUVs(this.currentFrame + this.directionalOffset);
    }
    
    // Pixel-perfect positioning
    this.snapToPixel();
  }
  
  protected updateUVs(frame: number): void {
    // Calculate UV coordinates for the current frame
    const column = frame % this.framesPerRow;
    const row = Math.floor(frame / this.framesPerRow);
    
    const uvWidth = this.frameWidth / this.spriteSheet.getSize().width;
    const uvHeight = this.frameHeight / this.spriteSheet.getSize().height;
    
    const uvLeft = column * uvWidth;
    const uvTop = 1 - (row + 1) * uvHeight; // Babylon uses bottom-left origin
    
    // Update mesh UVs
    const uvs = this.mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
    if (uvs) {
      // Bottom-left, bottom-right, top-right, top-left
      const newUVs = [
        uvLeft, uvTop,                    // 0: bottom-left
        uvLeft + uvWidth, uvTop,          // 1: bottom-right
        uvLeft + uvWidth, uvTop + uvHeight, // 2: top-right
        uvLeft, uvTop + uvHeight          // 3: top-left
      ];
      
      this.mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, newUVs);
    }
  }
  
  public setDirection(direction: number): void {
    // direction: 0=down, 1=down-right, 2=right, 3=up-right, 4=up, 5=up-left, 6=left, 7=down-left
    this.direction = Math.max(0, Math.min(7, direction));
    
    // Update directional offset based on sprite sheet layout
    // Assuming each direction has its own row in the sprite sheet
    const framesPerAnimation = this.framesPerRow;
    this.directionalOffset = this.direction * framesPerAnimation;
    
    // Update current frame with new direction
    if (this.currentAnimation) {
      this.updateUVs(this.currentFrame + this.directionalOffset);
    }
  }
  
  protected snapToPixel(): void {
    const pixelsPerUnit = 32;
    this.mesh.position.x = Math.round(this.mesh.position.x * pixelsPerUnit) / pixelsPerUnit;
    this.mesh.position.y = Math.round(this.mesh.position.y * pixelsPerUnit) / pixelsPerUnit;
    this.mesh.position.z = Math.round(this.mesh.position.z * pixelsPerUnit) / pixelsPerUnit;
  }
  
  // Getters and setters
  public get position(): BABYLON.Vector3 {
    return this.mesh.position;
  }
  
  public set position(value: BABYLON.Vector3) {
    this.mesh.position = value;
    this.snapToPixel();
  }
  
  public setRenderingGroup(group: number): void {
    this.mesh.renderingGroupId = group;
  }
  
  public enableShadows(shadowGenerator: BABYLON.ShadowGenerator): void {
    shadowGenerator.addShadowCaster(this.mesh);
    this.mesh.receiveShadows = true;
  }
  
  public dispose(): void {
    this.mesh.dispose();
    this.material.dispose();
    this.spriteSheet.dispose();
  }
}