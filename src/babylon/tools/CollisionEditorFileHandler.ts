import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import { CollisionEditor } from './CollisionEditor';
import { CollisionSetup, ModelData, ColliderData } from './types';
import { ModelPositioning } from '../utils/ModelPositioning';

export class CollisionEditorFileHandler {
    private editor: CollisionEditor;
    private COLLISION_DATA_PATH = '/src/babylon/data/';
    
    constructor(editor: CollisionEditor) {
        this.editor = editor;
    }
    
    public saveCollisionSetup(): void {
        if (!this.editor.loadedModel) {
            alert('Please load a model first');
            return;
        }
        
        const setup: CollisionSetup = {
            modelPath: this.editor.currentModelPath || 'model.glb',
            colliders: []
        };
        
        this.editor.colliders.forEach((data, mesh) => {
            // Get actual world dimensions instead of just scale factors
            mesh.computeWorldMatrix(true);
            const boundingInfo = mesh.getBoundingInfo();
            const boundingBox = boundingInfo.boundingBox;
            
            // Calculate actual dimensions in world space
            const dimensions = {
                _x: boundingBox.maximumWorld.x - boundingBox.minimumWorld.x,
                _y: boundingBox.maximumWorld.y - boundingBox.minimumWorld.y,
                _z: boundingBox.maximumWorld.z - boundingBox.minimumWorld.z
            };
            
            const colliderData: any = {
                type: data.type,
                position: mesh.position.clone(),
                rotation: mesh.rotation.clone(),
                scale: dimensions, // Store actual dimensions, not scale factors
                isWalkable: data.isWalkable || false
            };
            
            // Only add height for floors and ramps
            if (data.type === 'floor' || data.type === 'ramp') {
                colliderData.height = data.height || mesh.position.y;
            }
            
            setup.colliders.push(colliderData);
        });
        
        const json = JSON.stringify(setup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.editor.currentModelName || 'model') + '-collision.json';
        a.click();
        URL.revokeObjectURL(url);
        
        alert(`Exported collision setup as JSON file.\n\nTo make this permanent in the game files, save it to:\n${this.COLLISION_DATA_PATH}${a.download}`);
    }
    
    public exportBackup(): void {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            modelName: this.editor.currentModelName,
            modelPath: this.editor.currentModelPath,
            colliders: [] as any[]
        };
        
        this.editor.colliders.forEach((data, mesh) => {
            backup.colliders.push({
                type: data.type,
                position: mesh.position,
                rotation: mesh.rotation,
                scale: mesh.scaling,
                isWalkable: data.isWalkable || false,
                name: mesh.name
            });
        });
        
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `collision-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    public loadSetupData(setup: CollisionSetup): void {
        // Clear existing colliders
        this.editor.clearAllColliders();
        
        // Create colliders from setup
        setup.colliders.forEach(data => {
            // Create the collider mesh directly without automatic lifting
            const mesh = this.editor.sceneSetup.createColliderMesh(data.type, Vector3.Zero());
            if (!mesh) return;
            
            // Apply the saved position directly (it already has the correct Y position)
            const position = new Vector3(data.position._x, data.position._y, data.position._z);
            mesh.position = position;
            
            // Apply saved rotation
            mesh.rotation = new Vector3(data.rotation._x, data.rotation._y, data.rotation._z);
            
            // Calculate what scale factors would produce the saved dimensions
            // First get the base dimensions of the mesh at scale 1
            mesh.scaling = Vector3.One();
            mesh.computeWorldMatrix(true);
            const boundingInfo = mesh.getBoundingInfo();
            const baseBounds = boundingInfo.boundingBox;
            const baseWidth = baseBounds.maximumWorld.x - baseBounds.minimumWorld.x;
            const baseHeight = baseBounds.maximumWorld.y - baseBounds.minimumWorld.y;
            const baseDepth = baseBounds.maximumWorld.z - baseBounds.minimumWorld.z;
            
            // Calculate scale factors to achieve target dimensions
            const scaleX = baseWidth > 0 ? data.scale._x / baseWidth : 1;
            const scaleY = baseHeight > 0 ? data.scale._y / baseHeight : 1;
            const scaleZ = baseDepth > 0 ? data.scale._z / baseDepth : 1;
            
            mesh.scaling = new Vector3(scaleX, scaleY, scaleZ);
            
            // Create and store the collider data
            const colliderData: ColliderData = {
                type: data.type,
                position: position.clone(),
                rotation: mesh.rotation.clone(),
                scale: mesh.scaling.clone(),
                isWalkable: data.isWalkable || false
            };
            
            // Store in the colliders map
            this.editor.colliders.set(mesh, colliderData);
            
            // Make the mesh selectable
            mesh.isPickable = true;
            
            // Add gizmo attachment observer
            if (this.editor.gizmoManager) {
                this.editor.gizmoManager.attachableMeshes = Array.from(this.editor.colliders.keys());
            }
        });
        
        this.editor.currentTool = 'select';
    }
    
    public async loadModelFromRegistry(modelName: string): Promise<void> {
        // Try different sources for the model registry
        const registry = (window as any).opener?.__modelRegistry || 
                        (window as any).parent?.__modelRegistry || 
                        (window as any).__modelRegistry;
        
        let modelData: ModelData | null = null;
        
        if (registry) {
            modelData = registry.getModel(modelName);
        } else {
            // Try to get from localStorage
            const storedData = localStorage.getItem('sappyverse_model_registry');
            if (storedData) {
                try {
                    const models = JSON.parse(storedData);
                    const model = models.find((m: any) => m.name === modelName);
                    if (model) {
                        // Create a simplified model object
                        modelData = {
                            name: model.name,
                            path: model.path,
                            collisionSetupPath: model.hasCollisions ? 
                                `/src/babylon/data/${model.name}-collision.json` : undefined,
                            scale: model.scale ? 
                                new Vector3(model.scale.x, model.scale.y, model.scale.z) : 
                                new Vector3(1, 1, 1)
                        };
                    }
                } catch (e) {
                    console.error('Failed to parse model registry from localStorage:', e);
                }
            }
        }
        
        if (!modelData) {
            alert('Model not found');
            return;
        }
        
        // Clear existing
        if (this.editor.loadedContainer) {
            // Remove all from scene and dispose
            this.editor.loadedContainer.removeAllFromScene();
            this.editor.loadedContainer.dispose();
            this.editor.loadedContainer = null;
        }
        
        if (this.editor.loadedModel) {
            this.editor.loadedModel = null;
        }
        
        this.editor.clearAllColliders();
        
        // Load the model
        try {
            const result = await SceneLoader.LoadAssetContainerAsync(
                modelData.path.substring(0, modelData.path.lastIndexOf('/') + 1),
                modelData.path.substring(modelData.path.lastIndexOf('/') + 1),
                this.editor.scene
            );
            
            // Store the container reference
            this.editor.loadedContainer = result;
            
            // Don't call addAllToScene - we'll use instantiateModelsToScene instead
            // Get the instantiated model
            const instances = result.instantiateModelsToScene();
            
            // Store reference to the root node
            this.editor.loadedModel = instances.rootNodes[0];
            
            // Center the model and lock it
            if (this.editor.loadedModel) {
                this.editor.loadedModel.position = new Vector3(0, 0, 0);
                this.editor.loadedModel.rotation = new Vector3(0, 0, 0);
                this.editor.loadedModel.scaling = modelData.scale ? 
                    modelData.scale.clone() : new Vector3(1, 1, 1);
                
                // Find the main mesh and position model on ground using shared utility
                const mainMesh = ModelPositioning.findMainMesh([this.editor.loadedModel]);
                
                if (mainMesh && this.editor.loadedModel) {
                    const yOffset = ModelPositioning.positionModelOnGround(
                        this.editor.loadedModel,
                        mainMesh,
                        Vector3.Zero() // Target position is origin
                    );
                    console.log(`Model '${modelData.name}' positioned with Y offset: ${yOffset}`);
                }
                
                // Make model non-pickable so it can't be selected/moved
                this.editor.loadedModel.getChildMeshes().forEach((mesh: any) => {
                    mesh.isPickable = false;
                });
                
                // Store model info for saving
                this.editor.currentModelName = modelData.name;
                this.editor.currentModelPath = modelData.path;
                
                // Update UI
                this.editor.ui.updateModelInfo(modelData.name);
            }
            
            // First check localStorage for collision data
            const collisionKey = `sappyverse_collision_${modelData.name}`;
            const localData = localStorage.getItem(collisionKey);
            
            if (localData) {
                try {
                    const setup = JSON.parse(localData);
                    this.loadSetupData(setup);
                    console.log(`Loaded collision setup from localStorage for: ${modelData.name}`);
                } catch (e) {
                    console.error('Failed to parse localStorage collision data:', e);
                }
            } else if (modelData.collisionSetupPath) {
                // Fallback to loading from file path
                try {
                    const response = await fetch(modelData.collisionSetupPath);
                    const setup = await response.json();
                    this.loadSetupData(setup);
                    console.log(`Loaded collision setup from: ${modelData.collisionSetupPath}`);
                } catch (err) {
                    console.log('No collision setup found, starting fresh');
                }
            } else {
                // Try to load from standard game data location
                const collisionPath = `${this.COLLISION_DATA_PATH}${modelData.name}-collision.json`;
                try {
                    const response = await fetch(collisionPath);
                    if (response.ok) {
                        const setup = await response.json();
                        this.loadSetupData(setup);
                        console.log(`Loaded collision setup from: ${collisionPath}`);
                    }
                } catch (err) {
                    console.log('No collision data found in game directory');
                }
            }
            
            // Center camera on model
            this.editor.sceneSetup.camera.setTarget(Vector3.Zero());
            
        } catch (error) {
            alert(`Failed to load model: ${error}`);
        }
    }
    
    public async saveToGame(): Promise<void> {
        if (!this.editor.currentModelName) {
            alert('Please load a model first');
            return;
        }
        
        const setup: CollisionSetup = {
            modelPath: this.editor.currentModelPath || 'model.glb',
            colliders: []
        };
        
        this.editor.colliders.forEach((data, mesh) => {
            // Get actual world dimensions instead of just scale factors
            mesh.computeWorldMatrix(true);
            const boundingInfo = mesh.getBoundingInfo();
            const boundingBox = boundingInfo.boundingBox;
            
            // Calculate actual dimensions in world space
            const dimensions = {
                _x: boundingBox.maximumWorld.x - boundingBox.minimumWorld.x,
                _y: boundingBox.maximumWorld.y - boundingBox.minimumWorld.y,
                _z: boundingBox.maximumWorld.z - boundingBox.minimumWorld.z
            };
            
            const colliderData: any = {
                type: data.type,
                position: mesh.position.clone(),
                rotation: mesh.rotation.clone(),
                scale: dimensions, // Store actual dimensions, not scale factors
                isWalkable: data.isWalkable || false
            };
            
            // Only add height for floors and ramps
            if (data.type === 'floor' || data.type === 'ramp') {
                colliderData.height = data.height || mesh.position.y;
            }
            
            setup.colliders.push(colliderData);
        });
        
        // Store in localStorage for immediate availability
        const collisionKey = `sappyverse_collision_${this.editor.currentModelName}`;
        localStorage.setItem(collisionKey, JSON.stringify(setup));
        
        // Update the model registry to mark this model as having collisions
        const registry = (window as any).__modelRegistry;
        if (registry) {
            const model = registry.getModel(this.editor.currentModelName);
            if (model) {
                model.collisionSetupPath = `${this.COLLISION_DATA_PATH}${this.editor.currentModelName}-collision.json`;
                registry.syncToStorage();
            }
        }
        
        // Also store in a global collision registry
        const allCollisions = JSON.parse(localStorage.getItem('sappyverse_all_collisions') || '{}');
        allCollisions[this.editor.currentModelName] = setup;
        localStorage.setItem('sappyverse_all_collisions', JSON.stringify(allCollisions));
        
        // Show success message
        alert(`Collision data saved to game!\n\nModel: ${this.editor.currentModelName}\nColliders: ${setup.colliders.length}\n\nThe collision data is now available in the game.`);
        
        console.log(`Saved collision data for ${this.editor.currentModelName}:`, setup);
    }
    
    public async loadFromGame(): Promise<void> {
        if (!this.editor.currentModelName) {
            alert('Please load a model first');
            return;
        }
        
        // First check localStorage
        const collisionKey = `sappyverse_collision_${this.editor.currentModelName}`;
        const localData = localStorage.getItem(collisionKey);
        
        if (localData) {
            try {
                const setup = JSON.parse(localData);
                this.loadSetupData(setup);
                console.log(`Loaded collision setup from localStorage for: ${this.editor.currentModelName}`);
                return;
            } catch (e) {
                console.error('Failed to parse localStorage collision data:', e);
            }
        }
        
        // Check the global collision registry
        const allCollisions = JSON.parse(localStorage.getItem('sappyverse_all_collisions') || '{}');
        if (allCollisions[this.editor.currentModelName]) {
            this.loadSetupData(allCollisions[this.editor.currentModelName]);
            console.log(`Loaded collision setup from global registry for: ${this.editor.currentModelName}`);
            return;
        }
        
        // Fallback to fetching from file
        const collisionPath = `${this.COLLISION_DATA_PATH}${this.editor.currentModelName}-collision.json`;
        
        try {
            const response = await fetch(collisionPath);
            if (!response.ok) {
                throw new Error(`No collision data found for ${this.editor.currentModelName}`);
            }
            
            const setup = await response.json();
            this.loadSetupData(setup);
            
            console.log(`Loaded collision setup from file: ${collisionPath}`);
        } catch (error) {
            alert(`No collision data found for model: ${this.editor.currentModelName}`);
        }
    }
    
    public wipeModelSetup(): void {
        if (!this.editor.currentModelName) {
            alert('Please load a model first');
            return;
        }
        
        const modelName = this.editor.currentModelName;
        
        // Confirm action
        if (!confirm(`This will permanently delete all collision data for "${modelName}".\n\nAre you sure you want to continue?`)) {
            return;
        }
        
        // Clear from editor
        this.editor.clearAllColliders();
        
        // Remove from localStorage
        const collisionKey = `sappyverse_collision_${modelName}`;
        localStorage.removeItem(collisionKey);
        
        // Remove from global collision registry
        const allCollisions = JSON.parse(localStorage.getItem('sappyverse_all_collisions') || '{}');
        delete allCollisions[modelName];
        localStorage.setItem('sappyverse_all_collisions', JSON.stringify(allCollisions));
        
        // Update model registry to remove collision marker
        const registry = (window as any).__modelRegistry;
        if (registry) {
            const model = registry.getModel(modelName);
            if (model) {
                delete model.collisionSetupPath;
                registry.syncToStorage();
            }
        }
        
        // Also update localStorage model registry
        const storedData = localStorage.getItem('sappyverse_model_registry');
        if (storedData) {
            try {
                const models = JSON.parse(storedData);
                const modelIndex = models.findIndex((m: any) => m.name === modelName);
                if (modelIndex !== -1) {
                    models[modelIndex].hasCollisions = false;
                    delete models[modelIndex].collisionSetupPath;
                    localStorage.setItem('sappyverse_model_registry', JSON.stringify(models));
                }
            } catch (e) {
                console.error('Failed to update model registry:', e);
            }
        }
        
        alert(`All collision data for "${modelName}" has been wiped.`);
        console.log(`Wiped collision data for ${modelName}`);
    }
}