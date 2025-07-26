import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Quaternion } from '@babylonjs/core/Maths/math.quaternion';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import '@babylonjs/loaders/STL';

// Import FBX loader - Note: FBX support requires the full Babylon.js loaders package
import '@babylonjs/loaders';

export interface ModelLoadOptions {
    position?: Vector3;
    rotation?: Vector3;
    scaling?: Vector3;
    receiveShadows?: boolean;
    castShadows?: boolean;
    textureUrl?: string;
    materialType?: 'PBR' | 'Standard';
}

export class ModelLoader {
    private scene: Scene;
    private loadedModels: Map<string, AssetContainer> = new Map();
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Load a 3D model from various formats (FBX, glTF, OBJ, etc.)
     */
    public async loadModel(
        name: string,
        url: string,
        options: ModelLoadOptions = {}
    ): Promise<Mesh[]> {
        try {
            // Check cache first
            if (this.loadedModels.has(url)) {
                return this.instantiateModel(name, url, options);
            }
            
            // Extract directory and filename
            const lastSlash = url.lastIndexOf('/');
            const rootUrl = lastSlash !== -1 ? url.substring(0, lastSlash + 1) : "";
            const fileName = lastSlash !== -1 ? url.substring(lastSlash + 1) : url;
            
            const result = await SceneLoader.LoadAssetContainerAsync(
                rootUrl,
                fileName,
                this.scene
            );
            
            // Store in cache
            this.loadedModels.set(url, result);
            
            // Process and instantiate
            return this.instantiateModel(name, url, options);
            
        } catch (error) {
            console.error(`Failed to load model ${url}:`, error);
            throw error;
        }
    }
    
    /**
     * Instantiate a loaded model with options
     */
    private instantiateModel(
        name: string,
        url: string,
        options: ModelLoadOptions
    ): Mesh[] {
        const container = this.loadedModels.get(url);
        if (!container) {
            throw new Error(`Model ${url} not loaded`);
        }
        
        // Instantiate all meshes from the container
        const entries = container.instantiateModelsToScene(
            (sourceName) => `${name}_${sourceName}`,
            true,
            { doNotInstantiate: false }
        );
        
        const meshes: Mesh[] = [];
        
        // Process instantiated meshes
        entries.rootNodes.forEach((node, idx) => {
            if (node instanceof Mesh) {
                meshes.push(node);
                this.configureMesh(node, options);
            }
            
            // Process children
            const children = node.getChildMeshes();
            children.forEach(child => {
                if (child instanceof Mesh) {
                    meshes.push(child);
                    this.configureMesh(child, options);
                }
            });
        });
        
        // Apply transformations to all meshes, not just the root
        meshes.forEach((mesh, index) => {
            if (index === 0 || !mesh.parent) {
                // Only apply to root mesh or parentless meshes
                if (options.position) {
                    mesh.position = options.position.clone();
                }
                
                if (options.rotation) {
                    mesh.rotation = options.rotation.clone();
                }
                
                if (options.scaling) {
                    mesh.scaling = options.scaling.clone();
                }
            }
        });
        
        return meshes;
    }
    
    /**
     * Configure individual mesh properties
     */
    private configureMesh(mesh: Mesh, options: ModelLoadOptions): void {
        // Shadow configuration
        if (options.receiveShadows !== undefined) {
            mesh.receiveShadows = options.receiveShadows;
        }
        
        // Find shadow generator in scene
        const lights = this.scene.lights;
        for (const light of lights) {
            if ((light as any).shadowGenerator && options.castShadows) {
                (light as any).shadowGenerator.addShadowCaster(mesh);
            }
        }
        
        // Apply texture if provided
        if (options.textureUrl && mesh.material) {
            this.applyTexture(mesh, options.textureUrl, options.materialType || 'PBR');
        }
    }
    
    /**
     * Apply texture to mesh material
     */
    private applyTexture(
        mesh: Mesh,
        textureUrl: string,
        materialType: 'PBR' | 'Standard'
    ): void {
        const texture = new Texture(textureUrl, this.scene);
        
        if (materialType === 'PBR') {
            let pbrMat: PBRMaterial;
            
            if (mesh.material instanceof PBRMaterial) {
                pbrMat = mesh.material;
            } else {
                pbrMat = new PBRMaterial(`${mesh.name}_mat`, this.scene);
                mesh.material = pbrMat;
            }
            
            pbrMat.albedoTexture = texture;
            pbrMat.roughness = 0.8;
            pbrMat.metallic = 0.1;
            
        } else {
            let stdMat: StandardMaterial;
            
            if (mesh.material instanceof StandardMaterial) {
                stdMat = mesh.material;
            } else {
                stdMat = new StandardMaterial(`${mesh.name}_mat`, this.scene);
                mesh.material = stdMat;
            }
            
            stdMat.diffuseTexture = texture;
        }
    }
    
    /**
     * Load multiple models at once
     */
    public async loadModels(
        models: Array<{
            name: string;
            url: string;
            options?: ModelLoadOptions;
        }>
    ): Promise<Map<string, Mesh[]>> {
        const results = new Map<string, Mesh[]>();
        
        // Load all models in parallel
        const promises = models.map(async (model) => {
            const meshes = await this.loadModel(model.name, model.url, model.options);
            results.set(model.name, meshes);
        });
        
        await Promise.all(promises);
        return results;
    }
    
    /**
     * Dispose of a specific model
     */
    public disposeModel(url: string): void {
        const container = this.loadedModels.get(url);
        if (container) {
            container.dispose();
            this.loadedModels.delete(url);
        }
    }
    
    /**
     * Dispose of all loaded models
     */
    public dispose(): void {
        this.loadedModels.forEach(container => container.dispose());
        this.loadedModels.clear();
    }
}

// Helper class for common 3D props
export class Props3D {
    static async createBarrel(
        scene: Scene,
        position: Vector3,
        scale: number = 1
    ): Promise<Mesh[]> {
        const loader = new ModelLoader(scene);
        
        // First, load the model at origin to calculate proper bounds
        // Don't pass position option - we'll set it manually after calculating bounds
        const meshes = await loader.loadModel('barrel', '/assets/models/Make_a_wooden_barrel__0725233815_texture.glb', {
            scaling: new Vector3(scale, scale, scale),
            receiveShadows: true,
            castShadows: true
        });
        
        // Find the mesh with actual geometry (not __root__)
        let mainMesh: Mesh | null = null;
        for (const mesh of meshes) {
            if (mesh.getTotalVertices() > 0 && !mesh.name.includes('__root__')) {
                mainMesh = mesh;
                break;
            }
        }
        
        if (!mainMesh) {
            mainMesh = meshes[0]; // Fallback to first mesh
        }
        
        // Calculate bounds at origin
        mainMesh.computeWorldMatrix(true);
        const bounds = mainMesh.getBoundingInfo();
        const boundingBox = bounds.boundingBox;
        
        // Calculate how much to lift the model so its bottom sits at Y=0
        const liftAmount = -boundingBox.minimumWorld.y;
        
        // Now position all meshes at the desired location with correct Y offset
        meshes.forEach(mesh => {
            if (!mesh.parent || mesh === meshes[0]) {
                // Apply to root meshes only
                mesh.position.x = position.x;
                mesh.position.y = position.y + liftAmount;
                mesh.position.z = position.z;
            }
            mesh.isVisible = true;
        });
        
        return meshes;
    }
    
    /**
     * Create a procedural barrel mesh as fallback
     */
    static createProceduralBarrel(
        scene: Scene,
        position: Vector3,
        scale: number = 1
    ): Mesh[] {
        // Main barrel body
        const barrel = CreateCylinder('barrel_body', {
            height: 1.5 * scale,
            diameterTop: 0.8 * scale,
            diameterBottom: 0.8 * scale,
            diameterMiddle: 1.0 * scale, // Bulge in the middle
            tessellation: 24
        }, scene);
        
        barrel.position = position.clone();
        barrel.position.y = position.y + (0.75 * scale);
        
        // Create material
        const barrelMat = new PBRMaterial('barrel_mat', scene);
        
        // Try to load texture
        try {
            const woodTexture = new Texture('/assets/models/barrel/Make_a_wooden_barrel__0725233214_texture.png', scene);
            barrelMat.albedoTexture = woodTexture;
        } catch {
            // Fallback to procedural wood color
            barrelMat.albedoColor = new Color3(0.4, 0.25, 0.1);
        }
        
        barrelMat.roughness = 0.8;
        barrelMat.metallic = 0.1;
        barrel.material = barrelMat;
        barrel.receiveShadows = true;
        
        // Add shadow casting
        const lights = scene.lights;
        for (const light of lights) {
            if ((light as any).shadowGenerator) {
                (light as any).shadowGenerator.addShadowCaster(barrel);
            }
        }
        
        // Metal bands
        const meshes: Mesh[] = [barrel];
        const bandPositions = [-0.5, 0, 0.5];
        
        bandPositions.forEach((yOffset, index) => {
            const band = CreateTorus(`barrel_band_${index}`, {
                diameter: (1.0 + yOffset * 0.1) * scale,
                thickness: 0.05 * scale,
                tessellation: 24
            }, scene);
            
            band.position = position.clone();
            band.position.y = position.y + (0.75 * scale) + (yOffset * scale);
            
            // Metal material for bands
            const bandMat = new PBRMaterial(`band_mat_${index}`, scene);
            bandMat.albedoColor = new Color3(0.2, 0.2, 0.2);
            bandMat.metallic = 0.8;
            bandMat.roughness = 0.3;
            band.material = bandMat;
            band.receiveShadows = true;
            
            meshes.push(band);
        });
        
        // Make all parts visible
        meshes.forEach(mesh => {
            mesh.isVisible = true;
            mesh.renderingGroupId = 1;
        });
        
        return meshes;
    }
    
    static async createCrate(
        scene: Scene,
        position: Vector3,
        scale: number = 1
    ): Promise<Mesh[]> {
        const loader = new ModelLoader(scene);
        
        // Placeholder for crate model
        return await loader.loadModel('crate', '/assets/models/crate.fbx', {
            position: position,
            scaling: new Vector3(scale, scale, scale),
            receiveShadows: true,
            castShadows: true
        });
    }
}