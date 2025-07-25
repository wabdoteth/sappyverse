// HD-2D Sprite implementation with billboard rendering
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

interface HD2DSpriteOptions {
  width: number;
  height: number;
  texture: Texture | null;
  billboardMode?: number;
}

export class HD2DSprite {
  public mesh: Mesh;
  private material: StandardMaterial;
  private _texture: Texture | null;
  
  constructor(
    public name: string,
    private scene: Scene,
    options: HD2DSpriteOptions
  ) {
    // Create plane mesh for sprite
    this.mesh = MeshBuilder.CreatePlane(`${name}_sprite`, {
      width: options.width,
      height: options.height,
      sideOrientation: Mesh.DOUBLESIDE
    }, scene);
    
    // Create material
    this.material = new StandardMaterial(`${name}_mat`, scene);
    this.material.specularColor = new Color3(0, 0, 0);
    // Partial emissive to maintain sprite visibility while allowing shadows
    this.material.emissiveColor = new Color3(0.7, 0.7, 0.7);
    
    // Set texture if provided
    this._texture = options.texture;
    if (this._texture) {
      this.material.diffuseTexture = this._texture;
      this.material.diffuseTexture.hasAlpha = true;
      this.material.useAlphaFromDiffuseTexture = true;
      // Ensure texture appears correctly when lit
      this.material.diffuseColor = new Color3(1, 1, 1);
    } else {
      // Placeholder color
      this.material.diffuseColor = new Color3(1, 0.5, 0);
    }
    
    // Enable backface culling for proper shadow casting
    this.material.backFaceCulling = false;
    
    this.mesh.material = this.material;
    
    // Set billboard mode for HD-2D effect
    this.mesh.billboardMode = options.billboardMode || Mesh.BILLBOARDMODE_Y;
    
    // Ensure sprite renders in correct order
    this.mesh.renderingGroupId = 1;
  }
  
  get texture(): Texture | null {
    return this._texture;
  }
  
  set texture(tex: Texture | null) {
    this._texture = tex;
    if (tex) {
      this.material.diffuseTexture = tex;
      this.material.diffuseTexture.hasAlpha = true;
      this.material.useAlphaFromDiffuseTexture = true;
      this.material.diffuseColor = new Color3(1, 1, 1);
      // Ensure emissive is off to allow lighting
      this.material.emissiveColor = new Color3(0, 0, 0);
    }
  }
  
  setSize(width: number, height: number): void {
    this.mesh.scaling = new Vector3(width, height, 1);
  }
  
  enableShadows(shadowGenerator: any): void {
    // Add this mesh to the shadow generator to cast shadows
    shadowGenerator.addShadowCaster(this.mesh);
    // Enable receiving shadows on the sprite
    this.mesh.receiveShadows = true;
  }
  
  dispose(): void {
    this.material.dispose();
    this.mesh.dispose();
  }
}