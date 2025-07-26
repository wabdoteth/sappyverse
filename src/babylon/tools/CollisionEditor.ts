import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import { CollisionEditorUI } from './CollisionEditorUI';
import { CollisionEditorControls } from './CollisionEditorControls';
import { CollisionEditorScene } from './CollisionEditorScene';
import { CollisionEditorFileHandler } from './CollisionEditorFileHandler';
import { ColliderType, ColliderData } from './types';

export class CollisionEditor {
    public engine: Engine;
    public scene: Scene;
    public canvas: HTMLCanvasElement;
    public gizmoManager: GizmoManager;
    
    // Components
    private ui: CollisionEditorUI;
    private controls: CollisionEditorControls;
    private sceneSetup: CollisionEditorScene;
    private fileHandler: CollisionEditorFileHandler;
    
    // State
    public colliders: Map<any, ColliderData> = new Map();
    public currentTool: string = 'select';
    public selectedCollider: any = null;
    public loadedModel: any = null;
    public loadedContainer: any = null;
    public currentModelName: string = '';
    public currentModelPath: string = '';
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        
        // Initialize components
        this.sceneSetup = new CollisionEditorScene(this);
        this.ui = new CollisionEditorUI(this);
        this.controls = new CollisionEditorControls(this);
        this.fileHandler = new CollisionEditorFileHandler(this);
        
        // Setup
        this.init();
        
        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
    
    private init(): void {
        // Setup scene
        this.sceneSetup.setupScene();
        this.sceneSetup.createMaterials();
        
        // Setup gizmo manager
        this.gizmoManager = new GizmoManager(this.scene);
        this.gizmoManager.positionGizmoEnabled = true;
        
        // Initialize UI
        this.ui.createUI();
        
        // Setup controls
        this.controls.setupInputHandlers();
    }
    
    public setTool(toolId: string): void {
        this.currentTool = toolId;
        
        // Update gizmos based on tool
        this.gizmoManager.positionGizmoEnabled = toolId === 'move';
        this.gizmoManager.scaleGizmoEnabled = toolId === 'resize';
        this.gizmoManager.rotationGizmoEnabled = toolId === 'rotate';
        
        if (toolId === 'resize') {
            setTimeout(() => this.controls.setupScaleConstraints(), 100);
        }
        
        // Update UI
        this.ui.updateToolButtons();
        this.ui.updateToolIndicator();
    }
    
    public placeCollider(position: Vector3): void {
        const mesh = this.sceneSetup.createColliderMesh(this.currentTool, position);
        if (mesh) {
            const data: ColliderData = {
                type: this.currentTool as ColliderType,
                position: position.clone(),
                rotation: Vector3.Zero(),
                scale: Vector3.One(),
                isWalkable: this.currentTool === 'floor' || this.currentTool === 'ramp'
            };
            
            this.colliders.set(mesh, data);
            this.ui.updateColliderCount();
            
            // Visual feedback
            this.sceneSetup.flashOriginMarker();
            
            // Auto-switch back to select tool
            this.currentTool = 'select';
            this.gizmoManager.positionGizmoEnabled = true;
            this.gizmoManager.scaleGizmoEnabled = false;
            this.selectCollider(mesh);
            this.ui.updateToolIndicator();
        }
    }
    
    public selectCollider(mesh: any): void {
        // Deselect previous
        if (this.selectedCollider) {
            const data = this.colliders.get(this.selectedCollider);
            if (data) {
                this.selectedCollider.material = this.sceneSetup.materials[data.type];
            }
        }
        
        // Select new
        this.selectedCollider = mesh;
        mesh.material = this.sceneSetup.materials.selected;
        this.gizmoManager.attachToMesh(mesh);
        
        // Enable appropriate gizmo
        if (this.currentTool === 'resize') {
            this.gizmoManager.scaleGizmoEnabled = true;
            this.gizmoManager.positionGizmoEnabled = false;
            setTimeout(() => this.controls.setupScaleConstraints(), 100);
        } else {
            this.gizmoManager.positionGizmoEnabled = true;
            this.gizmoManager.scaleGizmoEnabled = false;
        }
        
        // Update properties panel
        this.ui.updatePropertiesPanel();
    }
    
    public clearAllColliders(): void {
        this.colliders.forEach((data, mesh) => {
            mesh.dispose();
        });
        this.colliders.clear();
        this.selectedCollider = null;
        this.ui.updateColliderCount();
    }
    
    public deleteSelectedCollider(): void {
        if (this.selectedCollider) {
            this.colliders.delete(this.selectedCollider);
            this.selectedCollider.dispose();
            this.selectedCollider = null;
            this.ui.updateColliderCount();
        }
    }
}