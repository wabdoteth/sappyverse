import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

/**
 * Utility class for consistent model and collider positioning
 */
export class ModelPositioning {
    /**
     * Calculate the Y offset needed to place a model's bottom at ground level
     * @param mesh The mesh to calculate bounds for
     * @returns The Y offset to apply (positive moves model up)
     */
    static calculateGroundOffset(mesh: Mesh): number {
        mesh.computeWorldMatrix(true);
        const bounds = mesh.getBoundingInfo().boundingBox;
        const minY = bounds.minimumWorld.y;
        
        // Return the offset needed to place bottom at Y=0
        return -minY;
    }
    
    /**
     * Position a model so its bottom sits at the specified Y level
     * @param rootNode The root node of the model
     * @param mainMesh The mesh with geometry to calculate bounds
     * @param targetPosition The desired position
     * @returns The actual Y offset applied
     */
    static positionModelOnGround(
        rootNode: TransformNode,
        mainMesh: Mesh,
        targetPosition: Vector3
    ): number {
        // Apply initial position
        rootNode.position = targetPosition.clone();
        
        // Calculate offset
        const yOffset = this.calculateGroundOffset(mainMesh);
        
        // Apply offset to place bottom at target Y
        rootNode.position.y = targetPosition.y + yOffset;
        
        return yOffset;
    }
    
    /**
     * Adjust collider position to match model ground positioning
     * @param colliderLocalPosition The collider's position relative to model origin
     * @param modelWorldPosition The model's world position (after ground adjustment)
     * @param modelYOffset The Y offset that was applied to the model
     * @param modelScale The model's scale
     * @returns The adjusted world position for the collider
     */
    static adjustColliderPosition(
        colliderLocalPosition: Vector3,
        modelWorldPosition: Vector3,
        modelYOffset: number,
        modelScale: Vector3
    ): Vector3 {
        // The collider positions in the editor are relative to a model at origin with bottom at Y=0
        // In the game, the model has been lifted up by yOffset to place its bottom at the target Y
        // So we need to subtract the yOffset from the collider's Y position to maintain the relative positioning
        return new Vector3(
            modelWorldPosition.x + colliderLocalPosition.x * modelScale.x,
            modelWorldPosition.y + colliderLocalPosition.y * modelScale.y - modelYOffset,
            modelWorldPosition.z + colliderLocalPosition.z * modelScale.z
        );
    }
    
    /**
     * Find the main mesh with geometry from a loaded model
     * @param rootNodes The root nodes from the loaded model
     * @returns The mesh with geometry, or null if not found
     */
    static findMainMesh(rootNodes: TransformNode[]): Mesh | null {
        for (const rootNode of rootNodes) {
            if (rootNode instanceof Mesh && rootNode.getTotalVertices() > 0) {
                return rootNode;
            }
            
            // Check children
            const children = rootNode.getChildMeshes();
            for (const child of children) {
                if (child instanceof Mesh && child.getTotalVertices() > 0) {
                    return child;
                }
            }
        }
        
        return null;
    }
}