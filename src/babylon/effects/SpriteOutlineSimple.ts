import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class SpriteOutlineSimple {
    private outlineMeshes: Map<Mesh, Mesh> = new Map();
    private scene: Scene;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    public addOutline(mesh: Mesh, color: Color3 = new Color3(0, 0, 0), width: number = 1): void {
        // Remove existing outline if any
        this.removeOutline(mesh);
        
        // Clone the mesh for outline
        const outlineMesh = mesh.clone(mesh.name + '_outline');
        
        // Scale it slightly larger
        const scaleFactor = 1 + (width * 0.05); // 5% larger per width unit
        outlineMesh.scaling = mesh.scaling.clone().scaleInPlace(scaleFactor);
        
        // Create black material
        const outlineMat = new StandardMaterial(mesh.name + '_outlineMat', this.scene);
        outlineMat.diffuseColor = color;
        outlineMat.emissiveColor = color;
        outlineMat.specularColor = new Color3(0, 0, 0);
        outlineMat.disableLighting = true;
        
        // Copy alpha settings from original
        const originalMat = mesh.material as StandardMaterial;
        if (originalMat && originalMat.diffuseTexture) {
            outlineMat.diffuseTexture = originalMat.diffuseTexture;
            outlineMat.useAlphaFromDiffuseTexture = true;
            outlineMat.transparencyMode = originalMat.transparencyMode;
        }
        
        outlineMesh.material = outlineMat;
        
        // Parent to original mesh
        outlineMesh.parent = mesh.parent;
        
        // Position slightly behind original (move back on Z axis)
        outlineMesh.position = mesh.position.clone();
        outlineMesh.position.z -= 0.01; // Move slightly back
        
        // Ensure outline renders behind the original sprite
        outlineMesh.renderingGroupId = mesh.renderingGroupId;
        
        // Force render order - outline behind original
        mesh.alphaIndex = 1000; // Original sprite in front
        outlineMesh.alphaIndex = 999; // Outline behind
        
        // Copy billboard mode
        outlineMesh.billboardMode = mesh.billboardMode;
        
        // Store reference
        this.outlineMeshes.set(mesh, outlineMesh);
        
        // Update when original mesh changes
        mesh.onAfterWorldMatrixUpdateObservable.add(() => {
            if (outlineMesh && !outlineMesh.isDisposed()) {
                outlineMesh.position = mesh.position.clone();
                outlineMesh.rotation = mesh.rotation.clone();
            }
        });
    }
    
    public removeOutline(mesh: Mesh): void {
        const outlineMesh = this.outlineMeshes.get(mesh);
        if (outlineMesh) {
            outlineMesh.dispose();
            this.outlineMeshes.delete(mesh);
        }
    }
    
    public setEnabled(enabled: boolean): void {
        this.outlineMeshes.forEach(outlineMesh => {
            outlineMesh.setEnabled(enabled);
        });
    }
    
    public dispose(): void {
        this.outlineMeshes.forEach(outlineMesh => {
            outlineMesh.dispose();
        });
        this.outlineMeshes.clear();
    }
}