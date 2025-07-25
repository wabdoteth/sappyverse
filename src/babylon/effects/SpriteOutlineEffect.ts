import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class SpriteOutlineEffect {
    private outlineMeshes: Map<Mesh, Mesh[]> = new Map();
    private scene: Scene;
    private outlineColor: Color3 = new Color3(0, 0, 0);
    private outlineWidth: number = 1.5;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    public addOutlineToSprite(spriteMesh: Mesh, color: Color3 = new Color3(0, 0, 0), width: number = 1.5): void {
        // Remove existing outline if any
        this.removeOutlineFromSprite(spriteMesh);
        
        this.outlineColor = color;
        this.outlineWidth = width;
        
        const outlineMeshes: Mesh[] = [];
        
        // Create 8 duplicates for outline (8 directions)
        const offsets = [
            new Vector3(-1, 0, 0),  // Left
            new Vector3(1, 0, 0),   // Right
            new Vector3(0, 1, 0),   // Up
            new Vector3(0, -1, 0),  // Down
            new Vector3(-1, 1, 0),  // Top-left
            new Vector3(1, 1, 0),   // Top-right
            new Vector3(-1, -1, 0), // Bottom-left
            new Vector3(1, -1, 0),  // Bottom-right
        ];
        
        offsets.forEach((offset, index) => {
            const outlineMesh = spriteMesh.clone(`${spriteMesh.name}_outline${index}`);
            
            // Create outline material
            const outlineMat = new StandardMaterial(`${spriteMesh.name}_outlineMat${index}`, this.scene);
            outlineMat.diffuseColor = color;
            outlineMat.emissiveColor = color;
            outlineMat.specularColor = new Color3(0, 0, 0);
            outlineMat.useAlphaFromDiffuseTexture = true;
            outlineMat.disableLighting = true;
            
            // Copy texture from original sprite
            const originalMat = spriteMesh.material as StandardMaterial;
            if (originalMat && originalMat.diffuseTexture) {
                outlineMat.diffuseTexture = originalMat.diffuseTexture.clone();
            }
            
            outlineMesh.material = outlineMat;
            
            // Position behind original sprite
            outlineMesh.parent = spriteMesh;
            outlineMesh.position = offset.scale(0.02 * width); // Small offset in world units
            outlineMesh.position.z = 0.01; // Slightly behind
            
            // Ensure it renders behind the sprite
            outlineMesh.renderingGroupId = spriteMesh.renderingGroupId;
            outlineMesh.alphaIndex = spriteMesh.alphaIndex - 1;
            
            outlineMeshes.push(outlineMesh);
        });
        
        this.outlineMeshes.set(spriteMesh, outlineMeshes);
    }
    
    public removeOutlineFromSprite(spriteMesh: Mesh): void {
        const outlines = this.outlineMeshes.get(spriteMesh);
        if (outlines) {
            outlines.forEach(outline => {
                if (outline.material) {
                    outline.material.dispose();
                }
                outline.dispose();
            });
            this.outlineMeshes.delete(spriteMesh);
        }
    }
    
    public updateOutlineColor(spriteMesh: Mesh, color: Color3): void {
        const outlines = this.outlineMeshes.get(spriteMesh);
        if (outlines) {
            outlines.forEach(outline => {
                const mat = outline.material as StandardMaterial;
                if (mat) {
                    mat.diffuseColor = color;
                    mat.emissiveColor = color;
                }
            });
        }
    }
    
    public setEnabled(enabled: boolean): void {
        this.outlineMeshes.forEach((outlines) => {
            outlines.forEach(outline => {
                outline.setEnabled(enabled);
            });
        });
    }
    
    public dispose(): void {
        this.outlineMeshes.forEach((outlines, sprite) => {
            this.removeOutlineFromSprite(sprite);
        });
        this.outlineMeshes.clear();
    }
}