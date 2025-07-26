import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents';
import { CollisionEditor } from './CollisionEditor';

export class CollisionEditorControls {
    private editor: CollisionEditor;
    private keys: { [key: string]: boolean } = {};
    private scaleConstraintsAdded: boolean = false;
    
    constructor(editor: CollisionEditor) {
        this.editor = editor;
    }
    
    public setupInputHandlers(): void {
        // Model file input
        const modelFileInput = document.getElementById('modelFile');
        if (modelFileInput) {
            modelFileInput.addEventListener('change', (e) => this.handleModelFileInput(e));
        }
        
        // Setup file input
        const setupFileInput = document.getElementById('setupFile');
        if (setupFileInput) {
            setupFileInput.addEventListener('change', (e) => this.handleSetupFileInput(e));
        }
        
        // Click handler
        this.editor.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                const pickResult = this.editor.scene.pick(
                    this.editor.scene.pointerX, 
                    this.editor.scene.pointerY
                );
                
                if (this.editor.currentTool === 'select' || this.editor.currentTool === 'move') {
                    if (pickResult.hit && this.editor.colliders.has(pickResult.pickedMesh)) {
                        this.editor.selectCollider(pickResult.pickedMesh);
                    }
                }
            }
        });
        
        // Keyboard controls
        this.editor.scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                this.keys[key] = true;
                
                // Tool shortcuts - only when Ctrl is NOT pressed
                if (!kbInfo.event.ctrlKey && !kbInfo.event.altKey && !kbInfo.event.shiftKey) {
                    switch(key) {
                        case 'q':
                            this.editor.setTool('select');
                            break;
                        case 'e':
                            this.editor.setTool('resize');
                            break;
                        case 'r':
                            this.editor.setTool('rotate');
                            break;
                        case '1':
                            this.editor.currentTool = 'box';
                            this.editor.placeCollider(Vector3.Zero());
                            break;
                        case '2':
                            this.editor.currentTool = 'cylinder';
                            this.editor.placeCollider(Vector3.Zero());
                            break;
                        case '3':
                            this.editor.currentTool = 'floor';
                            this.editor.placeCollider(Vector3.Zero());
                            break;
                        case '4':
                            this.editor.currentTool = 'ramp';
                            this.editor.placeCollider(Vector3.Zero());
                            break;
                        case ' ':
                            // Reset camera view
                            this.editor.sceneSetup.camera.position = new Vector3(0, 10, -20);
                            this.editor.sceneSetup.camera.setTarget(Vector3.Zero());
                            break;
                        case 'delete':
                            this.editor.deleteSelectedCollider();
                            break;
                    }
                }
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
                this.keys[key] = false;
            }
        });
        
        // WASD camera movement
        this.editor.scene.registerBeforeRender(() => {
            this.updateCameraMovement();
            this.editor.ui.updateStatusBar();
        });
    }
    
    private updateCameraMovement(): void {
        const speed = 0.3;
        const camera = this.editor.sceneSetup.camera;
        
        // Get camera direction vectors
        const forward = camera.getDirection(Vector3.Forward());
        const right = camera.getDirection(Vector3.Right());
        const up = Vector3.Up();
        
        // Don't normalize or zero out Y - allow full 3D movement
        
        if (this.keys['w']) {
            camera.position.addInPlace(forward.scale(speed));
        }
        if (this.keys['s']) {
            camera.position.subtractInPlace(forward.scale(speed));
        }
        if (this.keys['a']) {
            camera.position.subtractInPlace(right.scale(speed));
        }
        if (this.keys['d']) {
            camera.position.addInPlace(right.scale(speed));
        }
        if (this.keys['shift']) {
            camera.position.addInPlace(up.scale(speed));
        }
        if (this.keys['control']) {
            camera.position.subtractInPlace(up.scale(speed));
        }
    }
    
    public setupScaleConstraints(): void {
        // Set up scale constraints if not already done
        if (this.editor.gizmoManager.gizmos.scaleGizmo && !this.scaleConstraintsAdded) {
            this.scaleConstraintsAdded = true;
            
            this.editor.gizmoManager.gizmos.scaleGizmo.onDragObservable.add(() => {
                if (this.editor.selectedCollider) {
                    const data = this.editor.colliders.get(this.editor.selectedCollider);
                    if (data) {
                        // Apply constraints based on shape type
                        switch (data.type) {
                            case 'cylinder':
                                // Keep X and Z scale uniform for cylinders
                                const avgScale = (this.editor.selectedCollider.scaling.x + 
                                                this.editor.selectedCollider.scaling.z) / 2;
                                this.editor.selectedCollider.scaling.x = avgScale;
                                this.editor.selectedCollider.scaling.z = avgScale;
                                break;
                            case 'floor':
                            case 'ramp':
                                // Keep Y scale minimal for floor/ramp
                                this.editor.selectedCollider.scaling.y = Math.max(0.1, 
                                    Math.min(0.5, this.editor.selectedCollider.scaling.y));
                                break;
                        }
                    }
                }
            });
        }
    }
    
    private handleModelFileInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            import('@babylonjs/core/Loading/sceneLoader').then(({ SceneLoader }) => {
                SceneLoader.LoadAssetContainer('', url, this.editor.scene, (container) => {
                    // Clear existing
                    if (this.editor.loadedContainer) {
                        this.editor.loadedContainer.removeAllFromScene();
                        this.editor.loadedContainer.dispose();
                    }
                    
                    this.editor.loadedContainer = container;
                    container.addAllToScene();
                    
                    const instances = container.instantiateModelsToScene();
                    this.editor.loadedModel = instances.rootNodes[0];
                    
                    // Center and lock the model
                    if (this.editor.loadedModel) {
                        this.editor.loadedModel.position = new Vector3(0, 0, 0);
                        this.editor.loadedModel.rotation = new Vector3(0, 0, 0);
                        
                        // Make model non-pickable
                        this.editor.loadedModel.getChildMeshes().forEach((mesh: any) => {
                            mesh.isPickable = false;
                        });
                        
                        // Store model info
                        this.editor.currentModelName = 'custom';
                        this.editor.currentModelPath = file.name;
                    }
                    
                    URL.revokeObjectURL(url);
                });
            });
        }
    }
    
    private handleSetupFileInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const setup = JSON.parse(event.target?.result as string);
                    this.editor.fileHandler.loadSetupData(setup);
                } catch (err) {
                    alert('Invalid setup file');
                }
            };
            reader.readAsText(file);
        }
    }
}