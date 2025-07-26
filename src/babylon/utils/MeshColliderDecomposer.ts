// Intelligent Mesh Collider Decomposition System
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Scene } from '@babylonjs/core/scene';

export interface ColliderPrimitive {
    type: 'box' | 'cylinder' | 'floor';
    position: Vector3;
    size?: Vector3; // For boxes
    radius?: number; // For cylinders
    height?: number; // For cylinders and floor height
    rotation?: Vector3;
    isWalkable?: boolean;
}

export interface FloorZone {
    bounds: { min: Vector3, max: Vector3 };
    heightMap: number[][]; // 2D grid of heights
    resolution: number; // Grid resolution
}

export class MeshColliderDecomposer {
    private scene: Scene;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Decomposes a mesh into primitive colliders
     */
    public decomposeMesh(mesh: Mesh): {
        colliders: ColliderPrimitive[],
        floorZones: FloorZone[]
    } {
        const colliders: ColliderPrimitive[] = [];
        const floorZones: FloorZone[] = [];
        
        // Get mesh vertex data
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        
        if (!positions || !normals) {
            console.warn('Mesh has no position or normal data');
            return { colliders, floorZones };
        }
        
        // Get world transform
        const worldMatrix = mesh.getWorldMatrix();
        const bounds = mesh.getBoundingInfo().boundingBox;
        
        // Analyze mesh at different height levels
        const layers = this.analyzeMeshLayers(positions, normals, worldMatrix, bounds);
        
        // Detect floor areas (horizontal surfaces)
        const floors = this.detectFloorAreas(layers);
        floors.forEach(floor => {
            floorZones.push(this.createFloorZone(floor, positions, worldMatrix));
        });
        
        // Detect walls (vertical surfaces)
        const walls = this.detectWalls(layers);
        walls.forEach(wall => {
            colliders.push({
                type: 'box',
                position: wall.center,
                size: wall.size,
                rotation: wall.rotation
            });
        });
        
        // Detect pillars/columns (cylindrical structures)
        const pillars = this.detectPillars(layers);
        pillars.forEach(pillar => {
            colliders.push({
                type: 'cylinder',
                position: pillar.center,
                radius: pillar.radius,
                height: pillar.height
            });
        });
        
        return { colliders, floorZones };
    }
    
    /**
     * Analyzes mesh at different Y levels to understand structure
     */
    private analyzeMeshLayers(
        positions: Float32Array,
        normals: Float32Array,
        worldMatrix: any,
        bounds: any
    ): any[] {
        const layers = [];
        const numLayers = 10; // Sample at 10 different heights
        const minY = bounds.minimumWorld.y;
        const maxY = bounds.maximumWorld.y;
        const layerHeight = (maxY - minY) / numLayers;
        
        for (let i = 0; i < numLayers; i++) {
            const y = minY + (i + 0.5) * layerHeight;
            const layer = this.analyzeLayer(positions, normals, worldMatrix, y, layerHeight);
            layers.push(layer);
        }
        
        return layers;
    }
    
    /**
     * Analyzes a single horizontal layer of the mesh
     */
    private analyzeLayer(
        positions: Float32Array,
        normals: Float32Array,
        worldMatrix: any,
        layerY: number,
        thickness: number
    ): any {
        const horizontalFaces = [];
        const verticalFaces = [];
        
        // Check each triangle
        for (let i = 0; i < positions.length; i += 9) {
            // Get triangle vertices
            const v1 = Vector3.TransformCoordinates(
                new Vector3(positions[i], positions[i + 1], positions[i + 2]),
                worldMatrix
            );
            const v2 = Vector3.TransformCoordinates(
                new Vector3(positions[i + 3], positions[i + 4], positions[i + 5]),
                worldMatrix
            );
            const v3 = Vector3.TransformCoordinates(
                new Vector3(positions[i + 6], positions[i + 7], positions[i + 8]),
                worldMatrix
            );
            
            // Check if triangle intersects this layer
            const minY = Math.min(v1.y, v2.y, v3.y);
            const maxY = Math.max(v1.y, v2.y, v3.y);
            
            if (minY <= layerY + thickness / 2 && maxY >= layerY - thickness / 2) {
                // Get face normal (average of vertex normals)
                const n1 = new Vector3(normals[i], normals[i + 1], normals[i + 2]);
                const n2 = new Vector3(normals[i + 3], normals[i + 4], normals[i + 5]);
                const n3 = new Vector3(normals[i + 6], normals[i + 7], normals[i + 8]);
                const faceNormal = n1.add(n2).add(n3).normalize();
                
                // Classify as horizontal or vertical based on normal
                const dotY = Math.abs(faceNormal.y);
                if (dotY > 0.7) {
                    // Horizontal face (floor or ceiling)
                    horizontalFaces.push({ v1, v2, v3, normal: faceNormal });
                } else if (dotY < 0.3) {
                    // Vertical face (wall)
                    verticalFaces.push({ v1, v2, v3, normal: faceNormal });
                }
            }
        }
        
        return {
            y: layerY,
            horizontalFaces,
            verticalFaces
        };
    }
    
    /**
     * Detects floor areas from layer analysis
     */
    private detectFloorAreas(layers: any[]): any[] {
        const floorAreas = [];
        
        // Find layers with significant horizontal surfaces
        layers.forEach(layer => {
            if (layer.horizontalFaces.length > 0) {
                // Group connected horizontal faces
                const groups = this.groupConnectedFaces(layer.horizontalFaces);
                
                groups.forEach(group => {
                    // Calculate bounds of this floor area
                    let minX = Infinity, minZ = Infinity;
                    let maxX = -Infinity, maxZ = -Infinity;
                    let avgY = 0;
                    let count = 0;
                    
                    group.forEach(face => {
                        [face.v1, face.v2, face.v3].forEach(v => {
                            minX = Math.min(minX, v.x);
                            maxX = Math.max(maxX, v.x);
                            minZ = Math.min(minZ, v.z);
                            maxZ = Math.max(maxZ, v.z);
                            avgY += v.y;
                            count++;
                        });
                    });
                    
                    avgY /= count;
                    
                    // Only create floor areas that are reasonably sized
                    const width = maxX - minX;
                    const depth = maxZ - minZ;
                    if (width > 0.5 && depth > 0.5) {
                        floorAreas.push({
                            bounds: {
                                min: new Vector3(minX, avgY - 0.1, minZ),
                                max: new Vector3(maxX, avgY + 0.1, maxZ)
                            },
                            faces: group,
                            height: avgY
                        });
                    }
                });
            }
        });
        
        return floorAreas;
    }
    
    /**
     * Detects walls from layer analysis
     */
    private detectWalls(layers: any[]): any[] {
        const walls = [];
        const wallSegments = new Map<string, any[]>();
        
        // Collect vertical faces across all layers
        layers.forEach(layer => {
            layer.verticalFaces.forEach(face => {
                // Calculate wall direction
                const edge = face.v2.subtract(face.v1);
                const wallDir = new Vector3(edge.x, 0, edge.z).normalize();
                
                // Group by similar direction and position
                const key = `${Math.round(wallDir.x * 10)}_${Math.round(wallDir.z * 10)}`;
                if (!wallSegments.has(key)) {
                    wallSegments.set(key, []);
                }
                wallSegments.get(key).push(face);
            });
        });
        
        // Create box colliders for wall segments
        wallSegments.forEach(segments => {
            if (segments.length < 3) return; // Skip small segments
            
            // Calculate bounds of wall segment
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            
            segments.forEach(face => {
                [face.v1, face.v2, face.v3].forEach(v => {
                    minX = Math.min(minX, v.x);
                    maxX = Math.max(maxX, v.x);
                    minY = Math.min(minY, v.y);
                    maxY = Math.max(maxY, v.y);
                    minZ = Math.min(minZ, v.z);
                    maxZ = Math.max(maxZ, v.z);
                });
            });
            
            const center = new Vector3(
                (minX + maxX) / 2,
                (minY + maxY) / 2,
                (minZ + maxZ) / 2
            );
            
            const size = new Vector3(
                maxX - minX,
                maxY - minY,
                maxZ - minZ
            );
            
            // Only create wall if it's reasonably sized
            if (size.y > 0.5 && (size.x > 0.3 || size.z > 0.3)) {
                walls.push({
                    center,
                    size,
                    rotation: new Vector3(0, 0, 0) // TODO: Calculate actual rotation
                });
            }
        });
        
        return walls;
    }
    
    /**
     * Detects cylindrical pillars/columns
     */
    private detectPillars(layers: any[]): any[] {
        // This is a simplified implementation
        // A full implementation would analyze circular patterns in the mesh
        const pillars = [];
        
        // For now, return empty array
        // TODO: Implement pillar detection algorithm
        
        return pillars;
    }
    
    /**
     * Creates a floor zone with height information
     */
    private createFloorZone(
        floorArea: any,
        positions: Float32Array,
        worldMatrix: any
    ): FloorZone {
        const bounds = floorArea.bounds;
        const resolution = 10; // 10x10 grid
        
        // Create height map grid
        const heightMap: number[][] = [];
        const cellWidth = (bounds.max.x - bounds.min.x) / resolution;
        const cellDepth = (bounds.max.z - bounds.min.z) / resolution;
        
        for (let i = 0; i < resolution; i++) {
            heightMap[i] = [];
            for (let j = 0; j < resolution; j++) {
                const x = bounds.min.x + (i + 0.5) * cellWidth;
                const z = bounds.min.z + (j + 0.5) * cellDepth;
                
                // Find height at this position
                const height = this.getHeightAtPosition(x, z, floorArea.faces);
                heightMap[i][j] = height || floorArea.height;
            }
        }
        
        return {
            bounds,
            heightMap,
            resolution
        };
    }
    
    /**
     * Gets the height at a specific X,Z position
     */
    private getHeightAtPosition(x: number, z: number, faces: any[]): number | null {
        // Find face containing this position
        for (const face of faces) {
            if (this.pointInTriangle(x, z, face.v1, face.v2, face.v3)) {
                // Interpolate height
                return this.interpolateHeight(x, z, face.v1, face.v2, face.v3);
            }
        }
        return null;
    }
    
    /**
     * Checks if a point is inside a triangle (2D)
     */
    private pointInTriangle(
        x: number, z: number,
        v1: Vector3, v2: Vector3, v3: Vector3
    ): boolean {
        // Barycentric coordinate method
        const denominator = ((v2.z - v3.z) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.z - v3.z));
        const a = ((v2.z - v3.z) * (x - v3.x) + (v3.x - v2.x) * (z - v3.z)) / denominator;
        const b = ((v3.z - v1.z) * (x - v3.x) + (v1.x - v3.x) * (z - v3.z)) / denominator;
        const c = 1 - a - b;
        
        return a >= 0 && b >= 0 && c >= 0;
    }
    
    /**
     * Interpolates height within a triangle
     */
    private interpolateHeight(
        x: number, z: number,
        v1: Vector3, v2: Vector3, v3: Vector3
    ): number {
        // Barycentric interpolation
        const denominator = ((v2.z - v3.z) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.z - v3.z));
        const a = ((v2.z - v3.z) * (x - v3.x) + (v3.x - v2.x) * (z - v3.z)) / denominator;
        const b = ((v3.z - v1.z) * (x - v3.x) + (v1.x - v3.x) * (z - v3.z)) / denominator;
        const c = 1 - a - b;
        
        return a * v1.y + b * v2.y + c * v3.y;
    }
    
    /**
     * Groups connected faces
     */
    private groupConnectedFaces(faces: any[]): any[][] {
        // Simple grouping - in practice would use more sophisticated algorithm
        return [faces]; // For now, treat all faces as one group
    }
}