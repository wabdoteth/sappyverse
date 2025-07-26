import { Scene } from '@babylonjs/core/scene';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { WaterMaterial } from '@babylonjs/materials/water/waterMaterial';
import { SkyMaterial } from '@babylonjs/materials/sky/skyMaterial';

export class EnvironmentTools {
    private scene: Scene;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Create a skybox with built-in Babylon.js sky material
     */
    public createProceduralSky(): Mesh {
        const skybox = CreateSphere('skyBox', { 
            diameter: 1000,
            sideOrientation: Mesh.BACKSIDE 
        }, this.scene);
        
        const skyMaterial = new SkyMaterial('skyMaterial', this.scene);
        skyMaterial.backFaceCulling = false;
        
        // Sky configuration
        skyMaterial.turbidity = 10; // Haziness
        skyMaterial.luminance = 1; // Sky brightness
        skyMaterial.rayleigh = 2; // Sky color intensity
        skyMaterial.mieCoefficient = 0.005;
        skyMaterial.mieDirectionalG = 0.8;
        
        // Sun position
        skyMaterial.azimuth = 0.25; // Sun position around the horizon
        skyMaterial.inclination = 0.5; // Sun height
        
        skybox.material = skyMaterial;
        return skybox;
    }
    
    /**
     * Create a skybox from textures
     */
    public createSkyboxFromTextures(rootUrl: string): Mesh {
        const skybox = CreateSphere('skyBox', {
            diameter: 1000,
            sideOrientation: Mesh.BACKSIDE
        }, this.scene);
        
        const skyboxMaterial = new StandardMaterial('skyBox', this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture(rootUrl, this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        
        skybox.material = skyboxMaterial;
        return skybox;
    }
    
    /**
     * Create water with realistic water material
     */
    public createWater(name: string, size: number): Mesh {
        const water = CreateGround(name, {
            width: size,
            height: size,
            subdivisions: 32
        }, this.scene);
        
        // Create water material
        const waterMaterial = new WaterMaterial(name + 'Material', this.scene, new Vector3(512, 512, 512));
        waterMaterial.backFaceCulling = true;
        waterMaterial.bumpTexture = new Texture('/assets/textures/waterbump.png', this.scene);
        waterMaterial.windForce = -10;
        waterMaterial.waveHeight = 0.5;
        waterMaterial.bumpHeight = 0.1;
        waterMaterial.waveLength = 0.1;
        waterMaterial.waveSpeed = 50.0;
        waterMaterial.colorBlendFactor = 0;
        waterMaterial.windDirection = new Vector3(1, 0, 1);
        waterMaterial.waterColor = new Color3(0.1, 0.3, 0.6);
        waterMaterial.waterColor2 = new Color3(0.1, 0.2, 0.3);
        
        water.material = waterMaterial;
        
        // Add meshes to render list for reflections/refractions
        this.scene.meshes.forEach(mesh => {
            if (mesh !== water) {
                waterMaterial.addToRenderList(mesh);
            }
        });
        
        return water;
    }
    
    /**
     * Create volumetric fog
     */
    public createVolumetricFog(density: number = 0.01): void {
        this.scene.fogMode = Scene.FOGMODE_EXP2;
        this.scene.fogDensity = density;
        this.scene.fogColor = new Color3(0.8, 0.9, 1.0);
    }
    
    /**
     * Create terrain layers with different textures based on height
     */
    public createLayeredTerrain(
        name: string,
        size: number,
        maxHeight: number,
        textures: {
            grass?: string,
            rock?: string,
            snow?: string,
            sand?: string
        }
    ): Mesh {
        const ground = CreateGround(name, {
            width: size,
            height: size,
            subdivisions: 100,
            updatable: true
        }, this.scene);
        
        // Create multi-material based on height
        const material = new PBRMaterial(name + 'Mat', this.scene);
        
        // You would implement a shader here to blend textures based on vertex height
        // For now, using a simple texture
        if (textures.grass) {
            material.albedoTexture = new Texture(textures.grass, this.scene);
        }
        
        ground.material = material;
        return ground;
    }
    
    /**
     * Create environment preset
     */
    public createEnvironmentPreset(preset: 'forest' | 'desert' | 'snow' | 'ocean'): void {
        switch (preset) {
            case 'forest':
                this.scene.fogMode = Scene.FOGMODE_EXP2;
                this.scene.fogDensity = 0.005;
                this.scene.fogColor = new Color3(0.5, 0.6, 0.4);
                this.scene.clearColor = new Color3(0.4, 0.5, 0.3).toColor4();
                break;
                
            case 'desert':
                this.scene.fogMode = Scene.FOGMODE_EXP;
                this.scene.fogDensity = 0.002;
                this.scene.fogColor = new Color3(0.9, 0.8, 0.6);
                this.scene.clearColor = new Color3(0.9, 0.7, 0.5).toColor4();
                break;
                
            case 'snow':
                this.scene.fogMode = Scene.FOGMODE_LINEAR;
                this.scene.fogStart = 20;
                this.scene.fogEnd = 100;
                this.scene.fogColor = new Color3(0.9, 0.9, 0.95);
                this.scene.clearColor = new Color3(0.8, 0.8, 0.85).toColor4();
                break;
                
            case 'ocean':
                this.scene.fogMode = Scene.FOGMODE_EXP2;
                this.scene.fogDensity = 0.008;
                this.scene.fogColor = new Color3(0.3, 0.5, 0.7);
                this.scene.clearColor = new Color3(0.2, 0.4, 0.6).toColor4();
                break;
        }
    }
}

/**
 * Built-in Babylon.js terrain and environment features:
 * 
 * 1. Height Maps: CreateGroundFromHeightMap()
 * 2. Dynamic Terrain: DynamicTerrain extension
 * 3. Water Material: From babylon.materials
 * 4. Sky Material: Procedural sky generation
 * 5. Fog Systems: Linear, Exponential, Exp2
 * 6. Environment Textures: IBL and skyboxes
 * 7. Terrain LOD: Built-in level of detail
 * 8. Vertex Data Manipulation: Direct mesh editing
 * 9. Displacement Maps: For detailed terrain
 * 10. Node Material Editor: Visual shader creation
 */