// Global registry for tracking loaded models and their collision setups
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface RegisteredModel {
    name: string;
    path: string;
    rootNode: TransformNode;
    collisionSetupPath?: string;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
}

export class ModelRegistry {
    private static instance: ModelRegistry;
    private models: Map<string, RegisteredModel> = new Map();
    
    private constructor() {
        // Also make it available through localStorage for cross-tab communication
        this.setupStorageSync();
    }
    
    public static getInstance(): ModelRegistry {
        if (!ModelRegistry.instance) {
            ModelRegistry.instance = new ModelRegistry();
            // Make it available globally for the editor
            (window as any).__modelRegistry = ModelRegistry.instance;
        }
        return ModelRegistry.instance;
    }
    
    private setupStorageSync(): void {
        // Update localStorage whenever models change
        window.addEventListener('beforeunload', () => {
            this.syncToStorage();
        });
    }
    
    public syncToStorage(): void {
        const modelData = this.getModelsList();
        console.log('Syncing models to localStorage:', modelData);
        localStorage.setItem('sappyverse_model_registry', JSON.stringify(modelData));
    }
    
    public registerModel(
        name: string, 
        path: string, 
        rootNode: TransformNode,
        collisionSetupPath?: string
    ): void {
        this.models.set(name, {
            name,
            path,
            rootNode,
            collisionSetupPath,
            position: rootNode.position.clone(),
            rotation: rootNode.rotation.clone(),
            scale: rootNode.scaling.clone()
        });
        
        console.log(`Registered model: ${name} (${path})`);
        
        // Sync to storage immediately
        this.syncToStorage();
    }
    
    public getModel(name: string): RegisteredModel | undefined {
        return this.models.get(name);
    }
    
    public getAllModels(): RegisteredModel[] {
        return Array.from(this.models.values());
    }
    
    public getModelsList(): Array<{name: string, path: string, hasCollisions: boolean, scale?: any}> {
        return this.getAllModels().map(model => ({
            name: model.name,
            path: model.path,
            hasCollisions: !!model.collisionSetupPath,
            scale: {
                x: model.scale.x,
                y: model.scale.y,
                z: model.scale.z
            }
        }));
    }
    
    public clear(): void {
        this.models.clear();
    }
}