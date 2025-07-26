// Visual Collision Editor for GLB Models
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents';
import { Gizmo } from '@babylonjs/core/Gizmos/gizmo';
import { PositionGizmo } from '@babylonjs/core/Gizmos/positionGizmo';
import { RotationGizmo } from '@babylonjs/core/Gizmos/rotationGizmo';
import { ScaleGizmo } from '@babylonjs/core/Gizmos/scaleGizmo';
import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Slider } from '@babylonjs/gui/2D/controls/slider';
import '@babylonjs/loaders/glTF';

export interface ColliderData {
    type: 'box' | 'cylinder' | 'floor' | 'ramp';
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    isWalkable: boolean;
    height?: number; // For floors and ramps
    name: string;
}

export interface CollisionSetup {
    modelPath: string;
    colliders: ColliderData[];
    modelScale: Vector3;
    modelPosition: Vector3;
    modelRotation: Vector3;
}

export class CollisionEditor {
    private engine: Engine;
    private scene: Scene;
    private camera: UniversalCamera;
    private canvas: HTMLCanvasElement;
    private gui: AdvancedDynamicTexture;
    private gizmoManager: GizmoManager;
    
    // Editor state
    private loadedModel: TransformNode | null = null;
    private colliders: Map<Mesh, ColliderData> = new Map();
    private selectedCollider: Mesh | null = null;
    private currentTool: 'box' | 'cylinder' | 'floor' | 'ramp' | 'select' = 'select';
    private isPlacingCollider: boolean = false;
    
    // Materials
    private materials: {
        wall: StandardMaterial;
        cylinder: StandardMaterial;
        floor: StandardMaterial;
        ramp: StandardMaterial;
        selected: StandardMaterial;
    };
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        
        this.setupScene();
        this.createMaterials();
        this.createUI();
        this.setupInputHandlers();
        
        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
    
    private setupScene(): void {
        // Scene setup
        this.scene.clearColor = new Color4(0.2, 0.2, 0.3, 1);
        
        // Camera
        this.camera = new UniversalCamera('editorCamera', new Vector3(0, 10, -20), this.scene);
        this.camera.setTarget(Vector3.Zero());
        this.camera.attachControl(this.canvas, true);
        this.camera.speed = 0.5;
        
        // Lights
        const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
        ambient.intensity = 0.7;
        
        const sun = new DirectionalLight('sun', new Vector3(-1, -2, 1), this.scene);
        sun.intensity = 0.5;
        
        // Grid ground
        const ground = CreateGround('ground', { width: 50, height: 50 }, this.scene);
        const gridMat = new GridMaterial('gridMat', this.scene);
        gridMat.majorUnitFrequency = 5;
        gridMat.minorUnitVisibility = 0.45;
        gridMat.gridRatio = 1;
        gridMat.backFaceCulling = false;
        gridMat.mainColor = new Color3(0.5, 0.5, 0.5);
        gridMat.lineColor = new Color3(0.3, 0.3, 0.3);
        ground.material = gridMat;
        
        // Gizmo manager
        this.gizmoManager = new GizmoManager(this.scene);
        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.rotationGizmoEnabled = false;
        this.gizmoManager.scaleGizmoEnabled = false;
        this.gizmoManager.boundingBoxGizmoEnabled = false;
    }
    
    private createMaterials(): void {
        // Wall material (red)
        const wallMat = new StandardMaterial('wallMat', this.scene);
        wallMat.diffuseColor = new Color3(0.8, 0.2, 0.2);
        wallMat.alpha = 0.7;
        wallMat.backFaceCulling = false;
        
        // Cylinder material (green)
        const cylinderMat = new StandardMaterial('cylinderMat', this.scene);
        cylinderMat.diffuseColor = new Color3(0.2, 0.8, 0.2);
        cylinderMat.alpha = 0.7;
        cylinderMat.backFaceCulling = false;
        
        // Floor material (blue)
        const floorMat = new StandardMaterial('floorMat', this.scene);
        floorMat.diffuseColor = new Color3(0.2, 0.2, 0.8);
        floorMat.alpha = 0.5;
        floorMat.backFaceCulling = false;
        
        // Ramp material (purple)
        const rampMat = new StandardMaterial('rampMat', this.scene);
        rampMat.diffuseColor = new Color3(0.8, 0.2, 0.8);
        rampMat.alpha = 0.5;
        rampMat.backFaceCulling = false;
        
        // Selected material (yellow)
        const selectedMat = new StandardMaterial('selectedMat', this.scene);
        selectedMat.diffuseColor = new Color3(1, 1, 0);
        selectedMat.alpha = 0.8;
        selectedMat.backFaceCulling = false;
        
        this.materials = {
            wall: wallMat,
            cylinder: cylinderMat,
            floor: floorMat,
            ramp: rampMat,
            selected: selectedMat
        };
    }
    
    private createUI(): void {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('UI');
        
        // Main panel
        const panel = new StackPanel();
        panel.width = "220px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panel.left = "10px";
        panel.top = "10px";
        this.gui.addControl(panel);
        
        // Title
        const title = new TextBlock();
        title.text = "Collision Editor";
        title.height = "30px";
        title.color = "white";
        title.fontSize = 20;
        panel.addControl(title);
        
        // Load Model button
        const loadBtn = Button.CreateSimpleButton("loadBtn", "Load GLB Model");
        loadBtn.width = "200px";
        loadBtn.height = "40px";
        loadBtn.color = "white";
        loadBtn.background = "#4444AA";
        loadBtn.onPointerClickObservable.add(() => this.loadModel());
        panel.addControl(loadBtn);
        
        // Separator
        panel.addControl(this.createSeparator());
        
        // Tool buttons
        const tools = [
            { name: 'Select', tool: 'select', color: '#666666' },
            { name: 'Add Wall Box', tool: 'box', color: '#AA4444' },
            { name: 'Add Cylinder', tool: 'cylinder', color: '#44AA44' },
            { name: 'Add Floor', tool: 'floor', color: '#4444AA' },
            { name: 'Add Ramp', tool: 'ramp', color: '#AA44AA' }
        ];
        
        tools.forEach(({ name, tool, color }) => {
            const btn = Button.CreateSimpleButton(tool, name);
            btn.width = "200px";
            btn.height = "35px";
            btn.color = "white";
            btn.background = this.currentTool === tool ? color : "#444444";
            btn.onPointerClickObservable.add(() => {
                this.currentTool = tool as any;
                this.updateToolButtons();
            });
            panel.addControl(btn);
        });
        
        // Separator
        panel.addControl(this.createSeparator());
        
        // Selected collider info
        const selectedLabel = new TextBlock('selectedLabel');
        selectedLabel.text = "No collider selected";
        selectedLabel.height = "30px";
        selectedLabel.color = "white";
        selectedLabel.fontSize = 14;
        panel.addControl(selectedLabel);
        
        // Delete button
        const deleteBtn = Button.CreateSimpleButton("deleteBtn", "Delete Selected");
        deleteBtn.width = "200px";
        deleteBtn.height = "35px";
        deleteBtn.color = "white";
        deleteBtn.background = "#AA4444";
        deleteBtn.isEnabled = false;
        deleteBtn.onPointerClickObservable.add(() => this.deleteSelected());
        panel.addControl(deleteBtn);
        
        // Separator
        panel.addControl(this.createSeparator());
        
        // Save/Load buttons
        const saveBtn = Button.CreateSimpleButton("saveBtn", "Save Setup");
        saveBtn.width = "200px";
        saveBtn.height = "35px";
        saveBtn.color = "white";
        saveBtn.background = "#44AA44";
        saveBtn.onPointerClickObservable.add(() => this.saveSetup());
        panel.addControl(saveBtn);
        
        const loadSetupBtn = Button.CreateSimpleButton("loadSetupBtn", "Load Setup");
        loadSetupBtn.width = "200px";
        loadSetupBtn.height = "35px";
        loadSetupBtn.color = "white";
        loadSetupBtn.background = "#4444AA";
        loadSetupBtn.onPointerClickObservable.add(() => this.loadSetup());
        panel.addControl(loadSetupBtn);
        
        // Instructions
        const instructions = new TextBlock();
        instructions.text = "Controls:\nWASD - Move\nMouse - Look\nClick - Place/Select\nQ/E - Rotate\nR/F - Scale\nDelete - Remove";
        instructions.height = "120px";
        instructions.color = "white";
        instructions.fontSize = 12;
        instructions.textWrapping = true;
        panel.addControl(instructions);
    }
    
    private createSeparator(): Rectangle {
        const sep = new Rectangle();
        sep.width = "200px";
        sep.height = "2px";
        sep.background = "white";
        sep.alpha = 0.3;
        return sep;
    }
    
    private updateToolButtons(): void {
        // Update button colors based on current tool
        const buttons = this.gui.getDescendants().filter(c => c instanceof Button) as Button[];
        buttons.forEach(btn => {
            if (btn.name === this.currentTool) {
                btn.background = this.getToolColor(this.currentTool);
            } else if (['select', 'box', 'cylinder', 'floor', 'ramp'].includes(btn.name)) {
                btn.background = "#444444";
            }
        });
        
        // Update gizmo based on tool
        if (this.currentTool === 'select') {
            this.gizmoManager.positionGizmoEnabled = true;
        } else {
            this.gizmoManager.positionGizmoEnabled = false;
            this.gizmoManager.attachToMesh(null);
        }
    }
    
    private getToolColor(tool: string): string {
        const colors = {
            select: '#666666',
            box: '#AA4444',
            cylinder: '#44AA44',
            floor: '#4444AA',
            ramp: '#AA44AA'
        };
        return colors[tool] || '#444444';
    }
    
    private setupInputHandlers(): void {
        // Mouse click handler
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
                
                if (pickResult.hit) {
                    if (this.currentTool === 'select') {
                        // Select existing collider
                        if (this.colliders.has(pickResult.pickedMesh as Mesh)) {
                            this.selectCollider(pickResult.pickedMesh as Mesh);
                        } else {
                            this.selectCollider(null);
                        }
                    } else if (this.currentTool !== 'select' && pickResult.pickedPoint) {
                        // Place new collider
                        this.placeCollider(pickResult.pickedPoint);
                    }
                }
            }
        });
        
        // Keyboard handlers
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                switch (kbInfo.event.key) {
                    case 'Delete':
                        this.deleteSelected();
                        break;
                    case 'q':
                    case 'Q':
                        if (this.selectedCollider) {
                            this.selectedCollider.rotation.y -= 0.1;
                            this.updateColliderData(this.selectedCollider);
                        }
                        break;
                    case 'e':
                    case 'E':
                        if (this.selectedCollider) {
                            this.selectedCollider.rotation.y += 0.1;
                            this.updateColliderData(this.selectedCollider);
                        }
                        break;
                    case 'r':
                    case 'R':
                        if (this.selectedCollider) {
                            this.selectedCollider.scaling = this.selectedCollider.scaling.scale(1.1);
                            this.updateColliderData(this.selectedCollider);
                        }
                        break;
                    case 'f':
                    case 'F':
                        if (this.selectedCollider) {
                            this.selectedCollider.scaling = this.selectedCollider.scaling.scale(0.9);
                            this.updateColliderData(this.selectedCollider);
                        }
                        break;
                }
            }
        });
    }
    
    private async loadModel(): Promise<void> {
        // In a real implementation, this would open a file dialog
        // For now, we'll use a prompt
        const modelPath = prompt('Enter GLB model path (e.g., /assets/models/blacksmith.glb)');
        if (!modelPath) return;
        
        try {
            // Remove existing model
            if (this.loadedModel) {
                this.loadedModel.dispose();
            }
            
            // Clear existing colliders
            this.colliders.forEach((data, mesh) => {
                mesh.dispose();
            });
            this.colliders.clear();
            this.selectedCollider = null;
            
            // Load new model
            const result = await SceneLoader.LoadAssetContainerAsync(
                modelPath.substring(0, modelPath.lastIndexOf('/') + 1),
                modelPath.substring(modelPath.lastIndexOf('/') + 1),
                this.scene
            );
            
            result.addAllToScene();
            this.loadedModel = result.instantiateModelsToScene().rootNodes[0];
            
            // Center and scale model
            if (this.loadedModel) {
                const bounds = this.loadedModel.getHierarchyBoundingVectors();
                const center = bounds.max.add(bounds.min).scale(0.5);
                this.loadedModel.position = center.negate();
                
                // Set camera to look at model
                this.camera.setTarget(Vector3.Zero());
            }
            
        } catch (error) {
            alert(`Failed to load model: ${error}`);
        }
    }
    
    private placeCollider(position: Vector3): void {
        let mesh: Mesh;
        let data: ColliderData;
        
        switch (this.currentTool) {
            case 'box':
                mesh = CreateBox(`wall_${Date.now()}`, { size: 2 }, this.scene);
                mesh.material = this.materials.wall;
                data = {
                    type: 'box',
                    position: position.clone(),
                    rotation: Vector3.Zero(),
                    scale: new Vector3(2, 2, 2),
                    isWalkable: false,
                    name: mesh.name
                };
                break;
                
            case 'cylinder':
                mesh = CreateCylinder(`cylinder_${Date.now()}`, { 
                    diameter: 2, 
                    height: 3 
                }, this.scene);
                mesh.material = this.materials.cylinder;
                data = {
                    type: 'cylinder',
                    position: position.clone(),
                    rotation: Vector3.Zero(),
                    scale: Vector3.One(),
                    isWalkable: false,
                    name: mesh.name
                };
                break;
                
            case 'floor':
                mesh = CreateBox(`floor_${Date.now()}`, { 
                    width: 4, 
                    height: 0.2, 
                    depth: 4 
                }, this.scene);
                mesh.material = this.materials.floor;
                data = {
                    type: 'floor',
                    position: position.clone(),
                    rotation: Vector3.Zero(),
                    scale: new Vector3(4, 0.2, 4),
                    isWalkable: true,
                    height: position.y,
                    name: mesh.name
                };
                break;
                
            case 'ramp':
                mesh = CreateBox(`ramp_${Date.now()}`, { 
                    width: 4, 
                    height: 0.2, 
                    depth: 4 
                }, this.scene);
                mesh.material = this.materials.ramp;
                mesh.rotation.x = Math.PI / 6; // 30 degree angle
                data = {
                    type: 'ramp',
                    position: position.clone(),
                    rotation: new Vector3(Math.PI / 6, 0, 0),
                    scale: new Vector3(4, 0.2, 4),
                    isWalkable: true,
                    name: mesh.name
                };
                break;
                
            default:
                return;
        }
        
        mesh.position = position;
        this.colliders.set(mesh, data);
        this.selectCollider(mesh);
    }
    
    private selectCollider(mesh: Mesh | null): void {
        // Reset previous selection
        if (this.selectedCollider && this.colliders.has(this.selectedCollider)) {
            const data = this.colliders.get(this.selectedCollider)!;
            this.selectedCollider.material = this.getMaterialForType(data.type);
        }
        
        this.selectedCollider = mesh;
        
        if (mesh) {
            mesh.material = this.materials.selected;
            this.gizmoManager.attachToMesh(mesh);
            
            // Update UI
            const label = this.gui.getControlByName('selectedLabel') as TextBlock;
            const data = this.colliders.get(mesh)!;
            label.text = `Selected: ${data.name}`;
            
            const deleteBtn = this.gui.getControlByName('deleteBtn') as Button;
            deleteBtn.isEnabled = true;
        } else {
            this.gizmoManager.attachToMesh(null);
            
            // Update UI
            const label = this.gui.getControlByName('selectedLabel') as TextBlock;
            label.text = "No collider selected";
            
            const deleteBtn = this.gui.getControlByName('deleteBtn') as Button;
            deleteBtn.isEnabled = false;
        }
    }
    
    private getMaterialForType(type: string): StandardMaterial {
        switch (type) {
            case 'box': return this.materials.wall;
            case 'cylinder': return this.materials.cylinder;
            case 'floor': return this.materials.floor;
            case 'ramp': return this.materials.ramp;
            default: return this.materials.wall;
        }
    }
    
    private deleteSelected(): void {
        if (this.selectedCollider && this.colliders.has(this.selectedCollider)) {
            this.colliders.delete(this.selectedCollider);
            this.selectedCollider.dispose();
            this.selectedCollider = null;
            this.selectCollider(null);
        }
    }
    
    private updateColliderData(mesh: Mesh): void {
        if (this.colliders.has(mesh)) {
            const data = this.colliders.get(mesh)!;
            data.position = mesh.position.clone();
            data.rotation = mesh.rotation.clone();
            data.scale = mesh.scaling.clone();
        }
    }
    
    private saveSetup(): void {
        if (!this.loadedModel) {
            alert('No model loaded!');
            return;
        }
        
        const setup: CollisionSetup = {
            modelPath: prompt('Enter model path for saving') || 'model.glb',
            modelScale: this.loadedModel.scaling.clone(),
            modelPosition: this.loadedModel.position.clone(),
            modelRotation: this.loadedModel.rotation.clone(),
            colliders: Array.from(this.colliders.values())
        };
        
        // Convert to JSON and download
        const json = JSON.stringify(setup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'collision_setup.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    private async loadSetup(): Promise<void> {
        // In a real implementation, this would open a file dialog
        const setupJson = prompt('Paste collision setup JSON:');
        if (!setupJson) return;
        
        try {
            const setup: CollisionSetup = JSON.parse(setupJson);
            
            // Clear existing
            this.colliders.forEach((data, mesh) => {
                mesh.dispose();
            });
            this.colliders.clear();
            
            // Create colliders from setup
            setup.colliders.forEach(data => {
                let mesh: Mesh;
                
                switch (data.type) {
                    case 'box':
                        mesh = CreateBox(data.name, { 
                            width: data.scale.x,
                            height: data.scale.y,
                            depth: data.scale.z
                        }, this.scene);
                        mesh.material = this.materials.wall;
                        break;
                        
                    case 'cylinder':
                        mesh = CreateCylinder(data.name, {
                            diameter: data.scale.x * 2,
                            height: data.scale.y
                        }, this.scene);
                        mesh.material = this.materials.cylinder;
                        break;
                        
                    case 'floor':
                    case 'ramp':
                        mesh = CreateBox(data.name, {
                            width: data.scale.x,
                            height: data.scale.y,
                            depth: data.scale.z
                        }, this.scene);
                        mesh.material = data.type === 'floor' ? 
                            this.materials.floor : this.materials.ramp;
                        break;
                        
                    default:
                        return;
                }
                
                mesh.position = new Vector3(data.position._x, data.position._y, data.position._z);
                mesh.rotation = new Vector3(data.rotation._x, data.rotation._y, data.rotation._z);
                mesh.scaling = new Vector3(data.scale._x, data.scale._y, data.scale._z);
                
                this.colliders.set(mesh, data);
            });
            
        } catch (error) {
            alert(`Failed to load setup: ${error}`);
        }
    }
    
    public dispose(): void {
        this.scene.dispose();
        this.engine.dispose();
    }
}