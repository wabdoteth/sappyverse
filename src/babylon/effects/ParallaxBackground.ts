import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Camera } from '@babylonjs/core/Cameras/camera';

export interface ParallaxLayer {
    mesh: any;
    speed: number;
    offset: Vector3;
}

export class ParallaxBackground {
    private scene: Scene;
    private camera: Camera;
    private layers: ParallaxLayer[] = [];
    
    constructor(scene: Scene, camera: Camera) {
        this.scene = scene;
        this.camera = camera;
    }
    
    public createSkyLayer(): void {
        const skyPlane = CreatePlane('skyLayer', {
            width: 80,
            height: 40
        }, this.scene);
        
        skyPlane.position = new Vector3(0, 15, 40);
        skyPlane.billboardMode = 0; // No billboard
        
        // Create gradient sky texture
        const skyTexture = this.createSkyGradient();
        
        const skyMat = new StandardMaterial('skyMat', this.scene);
        skyMat.diffuseTexture = skyTexture;
        skyMat.emissiveTexture = skyTexture;
        skyMat.disableLighting = true;
        skyMat.backFaceCulling = false;
        
        skyPlane.material = skyMat;
        skyPlane.renderingGroupId = 0; // Background layer
        skyPlane.isPickable = false;
        
        this.layers.push({
            mesh: skyPlane,
            speed: 0.05, // Very slow
            offset: skyPlane.position.clone()
        });
    }
    
    public createCloudLayer(): void {
        const cloudPlane = CreatePlane('cloudLayer', {
            width: 100,
            height: 20
        }, this.scene);
        
        cloudPlane.position = new Vector3(0, 12, 35);
        
        // Create cloud texture
        const cloudTexture = this.createCloudTexture();
        
        const cloudMat = new StandardMaterial('cloudMat', this.scene);
        cloudMat.diffuseTexture = cloudTexture;
        cloudMat.useAlphaFromDiffuseTexture = true;
        cloudMat.disableLighting = true;
        cloudMat.backFaceCulling = false;
        cloudMat.alpha = 0.7;
        
        cloudPlane.material = cloudMat;
        cloudPlane.renderingGroupId = 0;
        cloudPlane.isPickable = false;
        
        this.layers.push({
            mesh: cloudPlane,
            speed: 0.1,
            offset: cloudPlane.position.clone()
        });
    }
    
    public createMountainLayer(): void {
        const mountainPlane = CreatePlane('mountainLayer', {
            width: 120,
            height: 25
        }, this.scene);
        
        mountainPlane.position = new Vector3(0, 5, 30);
        
        // Create mountain silhouette texture
        const mountainTexture = this.createMountainTexture();
        
        const mountainMat = new StandardMaterial('mountainMat', this.scene);
        mountainMat.diffuseTexture = mountainTexture;
        mountainMat.useAlphaFromDiffuseTexture = true;
        mountainMat.disableLighting = true;
        mountainMat.backFaceCulling = false;
        
        mountainPlane.material = mountainMat;
        mountainPlane.renderingGroupId = 0;
        mountainPlane.isPickable = false;
        
        this.layers.push({
            mesh: mountainPlane,
            speed: 0.2,
            offset: mountainPlane.position.clone()
        });
    }
    
    private createSkyGradient(): Texture {
        const texture = new DynamicTexture('skyGradient', {
            width: 256,
            height: 512
        }, this.scene, false);
        
        const ctx = texture.getContext();
        
        // Create gradient from light blue to darker blue
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(0.5, '#98D8E8');
        gradient.addColorStop(1, '#B0E0E6'); // Powder blue
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 512);
        
        texture.update();
        return texture;
    }
    
    private createCloudTexture(): Texture {
        const texture = new DynamicTexture('cloudTexture', {
            width: 512,
            height: 256
        }, this.scene, false);
        
        const ctx = texture.getContext();
        
        // Clear with transparency
        ctx.clearRect(0, 0, 512, 256);
        
        // Draw simple cloud shapes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Cloud 1
        this.drawCloud(ctx, 100, 80, 60);
        
        // Cloud 2
        this.drawCloud(ctx, 300, 120, 80);
        
        // Cloud 3
        this.drawCloud(ctx, 450, 60, 50);
        
        texture.hasAlpha = true;
        texture.update();
        return texture;
    }
    
    private drawCloud(ctx: any, x: number, y: number, size: number): void {
        // Simple cloud made of circles
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x - size * 0.4, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x, y - size * 0.3, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    
    private createMountainTexture(): Texture {
        const texture = new DynamicTexture('mountainTexture', {
            width: 1024,
            height: 256
        }, this.scene, false);
        
        const ctx = texture.getContext();
        
        // Clear
        ctx.clearRect(0, 0, 1024, 256);
        
        // Draw mountain silhouettes
        ctx.fillStyle = 'rgba(100, 100, 150, 0.8)';
        
        // Mountain range
        ctx.beginPath();
        ctx.moveTo(0, 256);
        
        // Create jagged mountain tops
        const points = [
            [0, 180], [100, 100], [200, 140], [300, 80], [400, 120],
            [500, 60], [600, 110], [700, 90], [800, 130], [900, 100], [1024, 150]
        ];
        
        points.forEach(([x, y]) => ctx.lineTo(x, y));
        
        ctx.lineTo(1024, 256);
        ctx.closePath();
        ctx.fill();
        
        // Second layer of mountains (darker)
        ctx.fillStyle = 'rgba(70, 70, 120, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, 256);
        
        const points2 = [
            [0, 200], [150, 150], [300, 180], [450, 140], [600, 170],
            [750, 150], [900, 180], [1024, 200]
        ];
        
        points2.forEach(([x, y]) => ctx.lineTo(x, y));
        
        ctx.lineTo(1024, 256);
        ctx.closePath();
        ctx.fill();
        
        texture.hasAlpha = true;
        texture.update();
        return texture;
    }
    
    public update(): void {
        // Update parallax layers based on camera movement
        const cameraX = this.camera.position.x;
        
        this.layers.forEach(layer => {
            // Move layer based on camera position and parallax speed
            layer.mesh.position.x = layer.offset.x - (cameraX * layer.speed);
            
            // Optional: wrap around for infinite scrolling
            const halfWidth = layer.mesh.scaling.x * 40; // Approximate half width
            if (layer.mesh.position.x < -halfWidth) {
                layer.mesh.position.x += halfWidth * 2;
            } else if (layer.mesh.position.x > halfWidth) {
                layer.mesh.position.x -= halfWidth * 2;
            }
        });
    }
    
    public setEnabled(enabled: boolean): void {
        this.layers.forEach(layer => {
            layer.mesh.setEnabled(enabled);
        });
    }
}