// 2D Sprite class for HD-2D characters
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

export interface SpriteOptions {
  width?: number;
  height?: number;
  textureUrl?: string;
  billboardMode?: number;
}

export class Sprite2D {
  public mesh: Mesh;
  private material: StandardMaterial;
  private texture: Texture | DynamicTexture | null = null;
  
  constructor(
    public name: string,
    private scene: Scene,
    options: SpriteOptions = {}
  ) {
    const {
      width = 1,
      height = 1,
      textureUrl,
      billboardMode = Mesh.BILLBOARDMODE_Y
    } = options;
    
    // Create plane mesh for sprite
    this.mesh = CreatePlane(`${name}_sprite`, {
      width,
      height,
      sideOrientation: Mesh.DOUBLESIDE
    }, scene);
    
    // Create material
    this.material = new StandardMaterial(`${name}_mat`, scene);
    this.material.specularColor = new Color3(0, 0, 0);
    this.material.emissiveColor = new Color3(1, 1, 1);
    
    // Set texture or create placeholder
    if (textureUrl) {
      this.loadTexture(textureUrl);
    } else {
      this.createPlaceholderSprite();
    }
    
    this.mesh.material = this.material;
    
    // Set billboard mode for HD-2D effect (always face camera on Y axis)
    this.mesh.billboardMode = billboardMode;
    
    // Ensure sprite renders in correct order
    this.mesh.renderingGroupId = 1;
  }
  
  private loadTexture(url: string): void {
    this.texture = new Texture(url, this.scene);
    this.texture.hasAlpha = true;
    this.material.diffuseTexture = this.texture;
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.diffuseColor = new Color3(1, 1, 1);
  }
  
  private createPlaceholderSprite(): void {
    // Create a dynamic texture for placeholder character
    const size = 128;
    this.texture = new DynamicTexture(`${this.name}_texture`, size, this.scene, false);
    const ctx = this.texture.getContext();
    
    // Clear with transparency
    ctx.clearRect(0, 0, size, size);
    
    // Draw a simple character placeholder
    // Body
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(size * 0.3, size * 0.4, size * 0.4, size * 0.4);
    
    // Head
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(size * 0.42, size * 0.28, size * 0.05, size * 0.05);
    ctx.fillRect(size * 0.53, size * 0.28, size * 0.05, size * 0.05);
    
    // Arms
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(size * 0.2, size * 0.45, size * 0.1, size * 0.2);
    ctx.fillRect(size * 0.7, size * 0.45, size * 0.1, size * 0.2);
    
    // Legs
    ctx.fillStyle = '#333333';
    ctx.fillRect(size * 0.35, size * 0.75, size * 0.1, size * 0.2);
    ctx.fillRect(size * 0.55, size * 0.75, size * 0.1, size * 0.2);
    
    this.texture.update();
    
    this.material.diffuseTexture = this.texture;
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.diffuseColor = new Color3(1, 1, 1);
  }
  
  setPosition(position: Vector3): void {
    this.mesh.position = position;
  }
  
  get position(): Vector3 {
    return this.mesh.position;
  }
  
  dispose(): void {
    if (this.texture) {
      this.texture.dispose();
    }
    this.material.dispose();
    this.mesh.dispose();
  }
}