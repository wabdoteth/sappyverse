import { Scene } from '@babylonjs/core/scene';
import { GroundMesh } from '@babylonjs/core/Meshes/groundMesh';
import { CreateGroundFromHeightMap } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { Ray } from '@babylonjs/core/Culling/ray';

export class TerrainEditor {
    private scene: Scene;
    private ground: GroundMesh;
    private heightMap: DynamicTexture;
    private isEditing: boolean = false;
    private brushSize: number = 2;
    private brushStrength: number = 0.1;
    private editMode: 'raise' | 'lower' | 'smooth' | 'flatten' = 'raise';
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Create a terrain from a height map
     */
    public createTerrainFromHeightMap(
        name: string,
        url: string,
        width: number = 100,
        height: number = 100,
        subdivisions: number = 100,
        minHeight: number = 0,
        maxHeight: number = 10
    ): GroundMesh {
        this.ground = CreateGroundFromHeightMap(name, url, {
            width: width,
            height: height,
            subdivisions: subdivisions,
            minHeight: minHeight,
            maxHeight: maxHeight
        }, this.scene);
        
        return this.ground;
    }
    
    /**
     * Create a procedurally generated terrain
     */
    public createProceduralTerrain(
        name: string,
        size: number = 100,
        subdivisions: number = 100
    ): GroundMesh {
        // Create height map texture
        this.heightMap = new DynamicTexture('heightMap', subdivisions, this.scene, false);
        const ctx = this.heightMap.getContext();
        
        // Generate noise-based terrain
        const imageData = ctx.createImageData(subdivisions, subdivisions);
        for (let i = 0; i < subdivisions; i++) {
            for (let j = 0; j < subdivisions; j++) {
                const height = this.generateHeight(i / subdivisions, j / subdivisions);
                const pixelIndex = (i + j * subdivisions) * 4;
                const color = Math.floor(height * 255);
                imageData.data[pixelIndex] = color;
                imageData.data[pixelIndex + 1] = color;
                imageData.data[pixelIndex + 2] = color;
                imageData.data[pixelIndex + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        this.heightMap.update();
        
        // Create ground from height map
        this.ground = CreateGroundFromHeightMap(name, this.heightMap.url, {
            width: size,
            height: size,
            subdivisions: subdivisions,
            minHeight: 0,
            maxHeight: 10
        }, this.scene);
        
        // Apply terrain material
        this.applyTerrainMaterial();
        
        return this.ground;
    }
    
    /**
     * Enable real-time terrain editing
     */
    public enableTerrainEditing(): void {
        this.isEditing = true;
        
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (!this.isEditing || !this.ground) return;
            
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button === 0) { // Left click
                        this.editTerrain(pointerInfo);
                    }
                    break;
                case PointerEventTypes.POINTERMOVE:
                    if (pointerInfo.event.buttons === 1) { // Left button held
                        this.editTerrain(pointerInfo);
                    }
                    break;
            }
        });
    }
    
    /**
     * Edit terrain at pointer position
     */
    private editTerrain(pointerInfo: any): void {
        const pickInfo = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (mesh) => mesh === this.ground
        );
        
        if (pickInfo.hit && pickInfo.pickedPoint) {
            const point = pickInfo.pickedPoint;
            this.modifyTerrainHeight(point);
        }
    }
    
    /**
     * Modify terrain height at a specific point
     */
    private modifyTerrainHeight(point: Vector3): void {
        const positions = this.ground.getVerticesData('position');
        if (!positions) return;
        
        const normals = this.ground.getVerticesData('normal');
        const indices = this.ground.getIndices();
        
        // Find vertices within brush radius
        for (let i = 0; i < positions.length; i += 3) {
            const vertexPos = new Vector3(
                positions[i],
                positions[i + 1],
                positions[i + 2]
            );
            
            const distance = Vector3.Distance(
                new Vector3(vertexPos.x, 0, vertexPos.z),
                new Vector3(point.x, 0, point.z)
            );
            
            if (distance <= this.brushSize) {
                const falloff = 1 - (distance / this.brushSize);
                const strength = this.brushStrength * falloff;
                
                switch (this.editMode) {
                    case 'raise':
                        positions[i + 1] += strength;
                        break;
                    case 'lower':
                        positions[i + 1] -= strength;
                        break;
                    case 'flatten':
                        positions[i + 1] = point.y;
                        break;
                    case 'smooth':
                        // Average with neighboring vertices
                        positions[i + 1] = (positions[i + 1] + point.y) / 2;
                        break;
                }
            }
        }
        
        // Update mesh
        this.ground.updateVerticesData('position', positions);
        this.ground.refreshBoundingInfo();
        
        // Recalculate normals
        if (normals && indices) {
            this.ground.createNormals(true);
        }
    }
    
    /**
     * Generate height using Perlin noise
     */
    private generateHeight(x: number, y: number): number {
        // Simple noise function (you can replace with Perlin noise)
        const scale = 10;
        const height = Math.sin(x * scale) * Math.cos(y * scale) * 0.5 + 0.5;
        return height;
    }
    
    /**
     * Apply a multi-texture material based on height
     */
    private applyTerrainMaterial(): void {
        const material = new StandardMaterial('terrainMat', this.scene);
        
        // Create blend texture based on height
        const blendTexture = new DynamicTexture('blend', 512, this.scene);
        const ctx = blendTexture.getContext();
        
        // You would typically blend multiple textures here
        // For now, just use a simple gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#228B22'); // Forest green at low heights
        gradient.addColorStop(0.5, '#8B7355'); // Brown at mid heights
        gradient.addColorStop(1, '#FFFFFF'); // White at peaks
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        blendTexture.update();
        
        material.diffuseTexture = blendTexture;
        this.ground.material = material;
    }
    
    // Brush controls
    public setBrushSize(size: number): void {
        this.brushSize = Math.max(0.5, Math.min(10, size));
    }
    
    public setBrushStrength(strength: number): void {
        this.brushStrength = Math.max(0.01, Math.min(1, strength));
    }
    
    public setEditMode(mode: 'raise' | 'lower' | 'smooth' | 'flatten'): void {
        this.editMode = mode;
    }
    
    public disableEditing(): void {
        this.isEditing = false;
    }
}

/**
 * Example usage:
 * 
 * const terrainEditor = new TerrainEditor(scene);
 * 
 * // Create procedural terrain
 * const terrain = terrainEditor.createProceduralTerrain('myTerrain', 100, 100);
 * 
 * // Or from height map
 * const terrain2 = terrainEditor.createTerrainFromHeightMap(
 *     'myTerrain2',
 *     '/assets/heightmaps/terrain.png',
 *     100, 100, 100, 0, 20
 * );
 * 
 * // Enable editing
 * terrainEditor.enableTerrainEditing();
 * terrainEditor.setEditMode('raise');
 * terrainEditor.setBrushSize(5);
 * terrainEditor.setBrushStrength(0.2);
 */