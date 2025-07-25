import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export class SpeechBubbleIndicator {
    private scene: Scene;
    private bubbleMesh: Mesh;
    private texture: DynamicTexture;
    private animationFrame: number = 0;
    private targetMesh: Mesh;
    
    constructor(scene: Scene, targetMesh: Mesh) {
        this.scene = scene;
        this.targetMesh = targetMesh;
        
        // Create the speech bubble mesh
        this.bubbleMesh = CreatePlane('speechBubble', {
            width: 1.5,
            height: 1.5
        }, scene);
        
        // Position above the target mesh
        this.bubbleMesh.parent = targetMesh;
        this.bubbleMesh.position = new Vector3(0.5, 2.5, 0); // Offset to top-right
        
        // Make it always face the camera (billboard mode)
        this.bubbleMesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
        
        // Create dynamic texture for pixel art
        this.texture = new DynamicTexture('speechBubbleTexture', {
            width: 64,
            height: 64
        }, scene, false);
        
        // Set texture to use nearest neighbor for pixel-perfect rendering
        this.texture.updateSamplingMode(1); // NEAREST_SAMPLINGMODE
        
        // Create material
        const material = new StandardMaterial('speechBubbleMat', scene);
        material.diffuseTexture = this.texture;
        material.emissiveTexture = this.texture;
        material.specularColor = new Color3(0, 0, 0);
        material.useAlphaFromDiffuseTexture = true;
        material.backFaceCulling = false;
        
        this.bubbleMesh.material = material;
        
        // Render on top of sprites
        this.bubbleMesh.renderingGroupId = 3;
        
        // Start hidden
        this.hide();
        
        // Start animation
        this.startAnimation();
    }
    
    private drawSpeechBubble(dotStates: boolean[]): void {
        const ctx = this.texture.getContext();
        const width = 64;
        const height = 64;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw speech bubble background (pixel art style)
        ctx.fillStyle = '#f4e4c1'; // Cream color
        ctx.strokeStyle = '#2a1f1a'; // Dark brown border
        ctx.lineWidth = 2;
        
        // Main bubble body (rounded rectangle in pixel art style)
        const bubbleWidth = 48;
        const bubbleHeight = 32;
        const x = (width - bubbleWidth) / 2;
        const y = 8;
        
        // Draw pixel-perfect rounded rectangle
        ctx.beginPath();
        // Top edge
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + bubbleWidth - 4, y);
        // Top-right corner
        ctx.lineTo(x + bubbleWidth, y + 4);
        // Right edge
        ctx.lineTo(x + bubbleWidth, y + bubbleHeight - 4);
        // Bottom-right corner
        ctx.lineTo(x + bubbleWidth - 4, y + bubbleHeight);
        // Bottom edge
        ctx.lineTo(x + 4, y + bubbleHeight);
        // Bottom-left corner
        ctx.lineTo(x, y + bubbleHeight - 4);
        // Left edge
        ctx.lineTo(x, y + 4);
        // Top-left corner
        ctx.lineTo(x + 4, y);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        // Draw speech bubble tail (pointing down-left)
        ctx.beginPath();
        ctx.moveTo(x + 8, y + bubbleHeight);
        ctx.lineTo(x + 4, y + bubbleHeight + 8);
        ctx.lineTo(x + 12, y + bubbleHeight);
        ctx.closePath();
        ctx.fill();
        
        // Draw outline for tail
        ctx.beginPath();
        ctx.moveTo(x + 8, y + bubbleHeight);
        ctx.lineTo(x + 4, y + bubbleHeight + 8);
        ctx.lineTo(x + 12, y + bubbleHeight);
        ctx.stroke();
        
        // Draw three dots (ellipses) with animation
        const dotSize = 6;
        const dotSpacing = 12;
        const startX = x + (bubbleWidth - (3 * dotSpacing - dotSpacing + dotSize)) / 2;
        const dotY = y + (bubbleHeight - dotSize) / 2;
        
        ctx.fillStyle = '#2a1f1a'; // Dark brown for dots
        
        for (let i = 0; i < 3; i++) {
            if (dotStates[i]) {
                const dotX = startX + (i * dotSpacing);
                // Draw pixel-perfect circle (actually a small square for pixel art)
                ctx.fillRect(dotX, dotY, dotSize, dotSize);
            }
        }
        
        this.texture.update();
    }
    
    private startAnimation(): void {
        // Animation patterns for the three dots
        const animationPatterns = [
            [true, false, false],
            [true, true, false],
            [true, true, true],
            [false, true, true],
            [false, false, true],
            [false, false, false]
        ];
        
        this.scene.registerBeforeRender(() => {
            if (!this.bubbleMesh.isEnabled()) return;
            
            this.animationFrame++;
            
            // Update every 10 frames (roughly 6 times per second at 60fps)
            if (this.animationFrame % 10 === 0) {
                const patternIndex = Math.floor(this.animationFrame / 10) % animationPatterns.length;
                this.drawSpeechBubble(animationPatterns[patternIndex]);
            }
            
            // Gentle floating animation
            const floatOffset = Math.sin(this.animationFrame * 0.05) * 0.1;
            this.bubbleMesh.position.y = 2.5 + floatOffset;
        });
    }
    
    public show(): void {
        this.bubbleMesh.setEnabled(true);
        this.animationFrame = 0; // Reset animation
    }
    
    public hide(): void {
        this.bubbleMesh.setEnabled(false);
    }
    
    public dispose(): void {
        this.texture.dispose();
        this.bubbleMesh.dispose();
    }
}