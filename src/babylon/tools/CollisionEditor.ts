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
        
        // Debug: Check if there are other scenes
        console.log('CollisionEditor: Creating new scene. Total scenes:', this.engine.scenes.length);
        
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
        this.gizmoManager.usePointerToAttachGizmos = false; // Manual control only
        
        // Configure position gizmo with snapping and constraints
        this.setupGizmoConstraints();
        
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
            // Ensure scale gizmo is properly set up
            if (this.selectedCollider) {
                this.gizmoManager.attachToMesh(this.selectedCollider);
            }
            setTimeout(() => this.controls.setupScaleConstraints(), 100);
        }
        
        // Update UI
        this.ui.updateToolButtons();
        this.ui.updateToolIndicator();
    }
    
    public placeCollider(position: Vector3): void {
        // Create mesh at origin first to get accurate bounding box
        const mesh = this.sceneSetup.createColliderMesh(this.currentTool, Vector3.Zero());
        if (mesh) {
            // Compute world matrix and get bounding box
            mesh.computeWorldMatrix(true);
            const boundingInfo = mesh.getBoundingInfo();
            const boundingBox = boundingInfo.boundingBox;
            
            // Calculate how much to lift the mesh so its bottom is at Y=0
            const bottomY = boundingBox.minimumWorld.y;
            const liftAmount = -bottomY;
            
            // Adjust position to place bottom on floor
            const adjustedPosition = new Vector3(
                position.x,
                Math.max(position.y + liftAmount, liftAmount),
                position.z
            );
            
            // Move mesh to final position
            mesh.position = adjustedPosition;
            
            const data: ColliderData = {
                type: this.currentTool as ColliderType,
                position: adjustedPosition.clone(),
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
            this.gizmoManager.positionGizmoEnabled = false;
            this.gizmoManager.rotationGizmoEnabled = false;
            this.gizmoManager.scaleGizmoEnabled = true;
            
            // Force update gizmo attachment
            this.gizmoManager.attachToMesh(mesh);
            
            setTimeout(() => this.controls.setupScaleConstraints(), 100);
        } else if (this.currentTool === 'rotate') {
            this.gizmoManager.positionGizmoEnabled = false;
            this.gizmoManager.scaleGizmoEnabled = false;
            this.gizmoManager.rotationGizmoEnabled = true;
        } else {
            this.gizmoManager.rotationGizmoEnabled = false;
            this.gizmoManager.scaleGizmoEnabled = false;
            this.gizmoManager.positionGizmoEnabled = true;
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
    
    private setupGizmoConstraints(): void {
        // Grid snapping value (0.1 units)
        const snapValue = 0.1;
        
        // Configure position gizmo when it becomes available
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.gizmoManager.gizmos.positionGizmo && this.selectedCollider) {
                const gizmo = this.gizmoManager.gizmos.positionGizmo;
                
                // Add drag behavior observer to constrain position
                gizmo.onDragEndObservable.add(() => {
                    if (!this.selectedCollider) return;
                    
                    const mesh = this.selectedCollider;
                    const pos = mesh.position;
                    
                    // Snap to grid
                    pos.x = Math.round(pos.x / snapValue) * snapValue;
                    pos.y = Math.round(pos.y / snapValue) * snapValue;
                    pos.z = Math.round(pos.z / snapValue) * snapValue;
                    
                    // Calculate minimum Y based on bounding box
                    const data = this.colliders.get(mesh);
                    if (data) {
                        // Get the bounding box in world space
                        mesh.computeWorldMatrix(true);
                        const boundingInfo = mesh.getBoundingInfo();
                        const boundingBox = boundingInfo.boundingBox;
                        
                        // Calculate the half-height from the bounding box
                        const halfHeight = (boundingBox.maximumWorld.y - boundingBox.minimumWorld.y) / 2;
                        
                        // Minimum Y position to keep bottom at Y=0
                        const minY = halfHeight;
                        
                        // Prevent bottom from going below floor
                        if (pos.y < minY) {
                            pos.y = minY;
                        }
                    }
                    
                    // Update stored collider data
                    if (data) {
                        data.position = pos.clone();
                    }
                    
                    // Update properties panel
                    this.ui.updatePropertiesPanel();
                });
                
                // Also constrain during dragging for visual feedback
                gizmo.onDragObservable.add(() => {
                    if (!this.selectedCollider) return;
                    
                    const mesh = this.selectedCollider;
                    const pos = mesh.position;
                    const data = this.colliders.get(mesh);
                    
                    if (data) {
                        // Get the bounding box to calculate actual bottom position
                        mesh.computeWorldMatrix(true);
                        const boundingInfo = mesh.getBoundingInfo();
                        const boundingBox = boundingInfo.boundingBox;
                        
                        // Get current bottom of the mesh
                        const currentBottom = boundingBox.minimumWorld.y;
                        
                        // If bottom is below floor, adjust position
                        if (currentBottom < 0) {
                            pos.y += -currentBottom; // Move up by the amount it's below
                        }
                    }
                });
            }
        });
    }
}