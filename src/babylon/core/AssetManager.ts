import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders'; // For loading 3D models

export interface SpriteAsset {
  name: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  framesPerRow: number;
  totalFrames: number;
}

export interface ModelAsset {
  name: string;
  path: string;
  scale?: number;
}

export interface TextureAsset {
  name: string;
  path: string;
  pixelArt?: boolean;
}

export class AssetManager {
  private textures: Map<string, BABYLON.Texture> = new Map();
  private models: Map<string, BABYLON.AbstractMesh[]> = new Map();
  private sprites: Map<string, SpriteAsset> = new Map();
  
  // Asset definitions
  private readonly SPRITE_ASSETS: SpriteAsset[] = [
    {
      name: 'player',
      path: 'assets/sprites/player_sheet.png',
      frameWidth: 32,
      frameHeight: 32,
      framesPerRow: 8,
      totalFrames: 64 // 8 directions x 8 frames
    },
    {
      name: 'enemy_brute',
      path: 'assets/sprites/enemy_brute.png',
      frameWidth: 32,
      frameHeight: 32,
      framesPerRow: 4,
      totalFrames: 16
    },
    {
      name: 'enemy_hunter',
      path: 'assets/sprites/enemy_hunter.png',
      frameWidth: 32,
      frameHeight: 32,
      framesPerRow: 4,
      totalFrames: 16
    },
    {
      name: 'enemy_wisp',
      path: 'assets/sprites/enemy_wisp.png',
      frameWidth: 32,
      frameHeight: 32,
      framesPerRow: 4,
      totalFrames: 16
    }
  ];
  
  private readonly TEXTURE_ASSETS: TextureAsset[] = [
    { name: 'stone_floor', path: 'assets/textures/stone_floor.png', pixelArt: true },
    { name: 'wood_wall', path: 'assets/textures/wood_wall.png', pixelArt: true },
    { name: 'grass', path: 'assets/textures/grass.png', pixelArt: true },
    { name: 'dirt', path: 'assets/textures/dirt.png', pixelArt: true }
  ];
  
  private readonly MODEL_ASSETS: ModelAsset[] = [
    { name: 'house_basic', path: 'assets/models/house_basic.babylon', scale: 1 },
    { name: 'tree_low', path: 'assets/models/tree_low.babylon', scale: 1 },
    { name: 'rock_small', path: 'assets/models/rock_small.babylon', scale: 1 }
  ];
  
  constructor() {
    // Register sprite assets
    this.SPRITE_ASSETS.forEach(sprite => {
      this.sprites.set(sprite.name, sprite);
    });
  }
  
  public async loadCoreAssets(): Promise<void> {
    console.log('Loading core assets...');
    
    try {
      // For now, we'll create placeholder textures
      // In production, these would be loaded from actual files
      await this.createPlaceholderAssets();
      
      console.log('Core assets loaded successfully');
    } catch (error) {
      console.error('Failed to load core assets:', error);
      throw error;
    }
  }
  
  private async createPlaceholderAssets(): Promise<void> {
    // Create placeholder textures for development
    // These will be replaced with actual sprite sheets
    
    // Create a simple checker pattern for floor
    const floorData = new Uint8Array(64 * 64 * 4);
    for (let i = 0; i < 64; i++) {
      for (let j = 0; j < 64; j++) {
        const index = (i * 64 + j) * 4;
        const checker = (Math.floor(i / 8) + Math.floor(j / 8)) % 2;
        const color = checker ? 100 : 150;
        floorData[index] = color;
        floorData[index + 1] = color;
        floorData[index + 2] = color;
        floorData[index + 3] = 255;
      }
    }
    
    // Store placeholder texture
    this.textures.set('placeholder_floor', BABYLON.RawTexture.CreateRGBATexture(
      floorData,
      64,
      64,
      BABYLON.Engine.LastCreatedScene!,
      false,
      false,
      BABYLON.Texture.NEAREST_SAMPLINGMODE
    ));
  }
  
  public loadTexture(scene: BABYLON.Scene, name: string, path: string, pixelArt: boolean = false): BABYLON.Texture {
    // Check if already loaded
    let texture = this.textures.get(name);
    if (texture) {
      return texture;
    }
    
    // Load new texture
    texture = new BABYLON.Texture(path, scene, false, false);
    
    if (pixelArt) {
      texture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
    }
    
    this.textures.set(name, texture);
    return texture;
  }
  
  public async loadModel(scene: BABYLON.Scene, name: string, path: string): Promise<BABYLON.AbstractMesh[]> {
    // Check if already loaded
    const cached = this.models.get(name);
    if (cached) {
      // Clone meshes for new instance
      return cached.map(mesh => mesh.clone(mesh.name + '_clone', null));
    }
    
    // Load new model
    const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', path, scene);
    this.models.set(name, result.meshes);
    
    return result.meshes;
  }
  
  public getSpriteAsset(name: string): SpriteAsset | undefined {
    return this.sprites.get(name);
  }
  
  public getTexture(name: string): BABYLON.Texture | undefined {
    return this.textures.get(name);
  }
  
  public dispose(): void {
    this.textures.forEach(texture => texture.dispose());
    this.models.forEach(meshes => meshes.forEach(mesh => mesh.dispose()));
    
    this.textures.clear();
    this.models.clear();
  }
}