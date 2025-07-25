// NPC 2D Sprite class for HD-2D NPCs using static sprites
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface NPCSpriteOptions {
  width?: number;
  height?: number;
  billboardMode?: number;
}

// NPC codenames and their sprite mappings
export const NPC_SPRITES = {
  'merchant': 'OT2_202209_PUB01_DOT008.png',
  'blacksmith': 'OT2_202209_PUB01_DOT009.png',
  'innkeeper': 'OT2_202209_PUB01_DOT010.png',
  'scholar': 'OT2_202209_PUB01_DOT011.png',
  'guard': 'OT2_202209_PUB01_DOT012.png'
} as const;

export type NPCType = keyof typeof NPC_SPRITES;

export class NPCSprite2D {
  public mesh: Mesh;
  private material: StandardMaterial;
  private texture: Texture;
  private shadowProxy: Mesh | null = null;
  
  constructor(
    public name: string,
    public npcType: NPCType,
    private scene: Scene,
    private options: NPCSpriteOptions = {}
  ) {
    const {
      width = 1.5,
      height = 2,
      billboardMode = Mesh.BILLBOARDMODE_Y
    } = options;
    
    // Create plane mesh for sprite
    this.mesh = CreatePlane(`${name}_sprite`, {
      width,
      height,
      sideOrientation: Mesh.DOUBLESIDE
    }, scene);
    
    // Since NPCs are fully cropped with feet at bottom, position at ground level
    // No pivot adjustment needed
    
    // Create material
    this.material = new StandardMaterial(`${name}_mat`, scene);
    this.material.specularColor = new Color3(0, 0, 0);
    // Partial emissive to maintain sprite visibility while allowing some lighting
    this.material.emissiveColor = new Color3(0.7, 0.7, 0.7);
    this.material.diffuseColor = new Color3(1, 1, 1);
    this.material.useAlphaFromDiffuseTexture = true;
    this.material.backFaceCulling = false;
    
    // Load NPC texture
    const spritePath = `/assets/sprites/npc/${NPC_SPRITES[npcType]}`;
    this.texture = new Texture(spritePath, scene);
    this.texture.hasAlpha = true;
    
    this.material.diffuseTexture = this.texture;
    this.mesh.material = this.material;
    
    // Set billboard mode for HD-2D effect
    this.mesh.billboardMode = billboardMode;
  }
  
  setPosition(position: Vector3): void {
    // Position the sprite so its bottom is at the Y position
    this.mesh.position = position.clone();
    this.mesh.position.y = position.y + (this.options.height || 2) / 2;
  }
  
  faceRight(): void {
    // Flip the sprite horizontally by scaling X by -1
    this.mesh.scaling.x = -1;
  }
  
  faceLeft(): void {
    // Reset to normal (sprites are left-facing by default)
    this.mesh.scaling.x = 1;
  }
  
  get position(): Vector3 {
    const pos = this.mesh.position.clone();
    pos.y -= (this.options.height || 2) / 2;
    return pos;
  }
  
  setAlphaIndex(index: number): void {
    this.mesh.alphaIndex = index;
  }
  
  enableShadows(shadowGenerator: any): void {
    // Create a shadow proxy - an invisible box that casts the shadow
    if (!this.shadowProxy) {
      this.shadowProxy = CreateBox(`${this.name}_shadowProxy`, {
        width: 0.6,
        height: 1.8,
        depth: 0.3
      }, this.scene);
      
      // Make the proxy invisible but still cast shadows
      this.shadowProxy.isVisible = false;
      this.shadowProxy.position = this.mesh.position.clone();
      this.shadowProxy.position.y -= 0.1; // Slightly adjust for NPC height
      
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
    this.texture.dispose();
    this.material.dispose();
    this.mesh.dispose();
    if (this.shadowProxy) {
      this.shadowProxy.dispose();
    }
  }
}