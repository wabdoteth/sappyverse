import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';

/**
 * Simple collision visualizer that shows the actual collision meshes
 * with transparent colored materials
 */
export class SimpleCollisionVisualizer {
    private scene: Scene;
    private collisionMeshes: Mesh[] = [];
    private originalMaterials: Map<Mesh, any> = new Map();
    private enabled: boolean = false;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Set the collision meshes to visualize
     */
    public setCollisionMeshes(meshes: Mesh[]): void {
        this.collisionMeshes = meshes;
        
        console.log(`SimpleCollisionVisualizer: Setting up visualization for ${meshes.length} collision meshes`);
        
        // Store original materials and log mesh info
        meshes.forEach(mesh => {
            this.originalMaterials.set(mesh, mesh.material);
            console.log(`- ${mesh.name}: visible=${mesh.isVisible}, checkCollisions=${mesh.checkCollisions}`);
        });
    }
    
    /**
     * Enable or disable visualization
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.updateVisualization();
    }
    
    /**
     * Toggle visualization
     */
    public toggle(): void {
        this.setEnabled(!this.enabled);
    }
    
    /**
     * Update the visualization of all collision meshes
     */
    private updateVisualization(): void {
        this.collisionMeshes.forEach(mesh => {
            if (!mesh || mesh.isDisposed()) return;
            
            if (this.enabled) {
                // Show collision mesh with appropriate color
                mesh.isVisible = true;
                
                // Create visualization material if not exists
                if (!mesh.material || !mesh.material.name.includes('_viz')) {
                    const vizMat = new StandardMaterial(`${mesh.name}_viz`, this.scene);
                    vizMat.wireframe = true;
                    vizMat.disableLighting = true;
                    vizMat.alpha = 0.8;
                    
                    // Color based on type
                    if (mesh.name.includes('ramp')) {
                        vizMat.emissiveColor = new Color3(1, 0, 1); // Magenta for ramps
                    } else if (mesh.name.includes('floor')) {
                        vizMat.emissiveColor = new Color3(0, 0, 1); // Blue for floors
                    } else if (mesh.name.includes('cylinder')) {
                        vizMat.emissiveColor = new Color3(0, 1, 0); // Green for cylinders
                    } else {
                        vizMat.emissiveColor = new Color3(1, 0, 0); // Red for boxes/default
                    }
                    
                    mesh.material = vizMat;
                }
                
                // Ensure it renders on top
                mesh.renderingGroupId = 3;
            } else {
                // Hide collision mesh
                mesh.isVisible = false;
                
                // Restore original material if it had one
                const originalMat = this.originalMaterials.get(mesh);
                if (originalMat) {
                    mesh.material = originalMat;
                }
            }
        });
    }
    
    /**
     * Get debug info
     */
    public getDebugInfo(): string {
        const counts = {
            total: this.collisionMeshes.length,
            boxes: 0,
            cylinders: 0,
            floors: 0,
            ramps: 0
        };
        
        this.collisionMeshes.forEach(mesh => {
            if (mesh.name.includes('ramp')) counts.ramps++;
            else if (mesh.name.includes('floor')) counts.floors++;
            else if (mesh.name.includes('cylinder')) counts.cylinders++;
            else counts.boxes++;
        });
        
        return `
=== Collision Visualizer ===
Enabled: ${this.enabled}
Total Meshes: ${counts.total}
- Boxes (Red): ${counts.boxes}
- Cylinders (Green): ${counts.cylinders}
- Floors (Blue): ${counts.floors}
- Ramps (Magenta): ${counts.ramps}
        `;
    }
    
    /**
     * Refresh the collision mesh list (useful if meshes are added/removed)
     */
    public refresh(): void {
        // Re-scan for collision meshes in the scene
        const collisionMeshes = this.scene.meshes.filter(mesh => 
            mesh.checkCollisions && 
            (mesh.name.includes('collision') || 
             mesh.name.includes('lamppost_collision'))
        );
        
        this.setCollisionMeshes(collisionMeshes);
        
        if (this.enabled) {
            this.updateVisualization();
        }
    }
    
    /**
     * Dispose of the visualizer
     */
    public dispose(): void {
        // Restore original materials
        this.originalMaterials.forEach((material, mesh) => {
            if (mesh && !mesh.isDisposed()) {
                mesh.material = material;
                mesh.isVisible = false;
            }
        });
        
        this.originalMaterials.clear();
        this.collisionMeshes = [];
    }
}