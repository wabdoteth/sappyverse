import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import '@babylonjs/core/Layers/layerSceneComponent';

export class SpriteOutline {
    private highlightLayer: HighlightLayer;
    
    constructor(scene: Scene) {
        // Create highlight layer for outlines
        this.highlightLayer = new HighlightLayer('spriteOutlines', scene);
        
        // Configure for pixel-perfect outlines
        this.highlightLayer.innerGlow = false;
        this.highlightLayer.outerGlow = 1.0;
        this.highlightLayer.blurHorizontalSize = 1.0;
        this.highlightLayer.blurVerticalSize = 1.0;
        
        // Ensure outlines render on top of sprites
        this.highlightLayer.renderingGroupId = 2;
    }
    
    public addOutline(mesh: Mesh, color: Color3 = new Color3(0, 0, 0), width: number = 1): void {
        // Add mesh to highlight layer
        this.highlightLayer.addMesh(mesh, color, true);
        
        // Adjust blur based on width
        const blurSize = width * 0.5;
        this.highlightLayer.blurHorizontalSize = blurSize;
        this.highlightLayer.blurVerticalSize = blurSize;
    }
    
    public removeOutline(mesh: Mesh): void {
        this.highlightLayer.removeMesh(mesh);
    }
    
    public setOutlineColor(mesh: Mesh, color: Color3): void {
        this.highlightLayer.removeMesh(mesh);
        this.highlightLayer.addMesh(mesh, color, true);
    }
    
    public setEnabled(enabled: boolean): void {
        this.highlightLayer.isEnabled = enabled;
    }
    
    public dispose(): void {
        this.highlightLayer.dispose();
    }
}