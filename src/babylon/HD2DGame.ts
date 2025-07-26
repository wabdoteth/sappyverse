// HD-2D Game Implementation - Complete from scratch
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess';
import { PassPostProcess } from '@babylonjs/core/PostProcesses/passPostProcess';
import { FxaaPostProcess } from '@babylonjs/core/PostProcesses/fxaaPostProcess';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';

// Game scenes
import { HD2DTownScene } from './scenes/HD2DTownScene';
import { HD2DAnimatedSprite } from './HD2DAnimatedSprite';
import { HD2DParticles } from './effects/HD2DParticles';
import { ParallaxBackground } from './effects/ParallaxBackground';
import { SpriteOutlineSimple } from './effects/SpriteOutlineSimple';
import { HD2DOutlineSystem } from './materials/HD2DOutlineMaterial';
import { TimeOfDaySystem } from './systems/TimeOfDaySystem';
import { HD2DUISystem } from './ui/HD2DUISystem';
import { createAllNPCPortraits } from './utils/createNPCPortraits';

// Post-processing
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { DepthOfFieldEffectBlurLevel } from '@babylonjs/core/PostProcesses/depthOfFieldEffect';
import { MotionBlurPostProcess } from '@babylonjs/core/PostProcesses/motionBlurPostProcess';
import { ChromaticAberrationPostProcess } from '@babylonjs/core/PostProcesses/chromaticAberrationPostProcess';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';
import { TiltShiftPostProcess } from './postprocess/TiltShiftPostProcess';
import { RetroPostProcess } from './postprocess/RetroPostProcess';
import { ModelRegistry } from './systems/ModelRegistry';

// Physics
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import HavokPhysics from '@babylonjs/havok';

// GUI
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';

// Constants for HD-2D
const HD2D_CONFIG = {
    // Rendering
    INTERNAL_RESOLUTION: { width: 400, height: 225 }, // 16:9 low res
    PIXEL_SCALE: 3, // Scale up 3x for display
    
    // Camera
    CAMERA_ANGLE: 25, // Degrees from vertical
    CAMERA_FOV: 40, // Field of view in degrees
    CAMERA_DISTANCE: 20,
    CAMERA_HEIGHT: 15,
    
    // Layers (renderingGroupId)
    LAYER_GROUND: 0,
    LAYER_ENVIRONMENT: 1,
    LAYER_SPRITES: 2,
    LAYER_VFX: 3,
    LAYER_UI: 4,
    
    // Sprite settings
    SPRITE_PIXEL_UNIT: 32, // Pixels per world unit
    SPRITE_BILLBOARD_MODE: Mesh.BILLBOARDMODE_Y,
    
    // Shadow settings
    SHADOW_MAP_SIZE: 2048,
    SHADOW_DARKNESS: 0.4,
    
    // Post-processing - very subtle DOF
    DOF_FOCUS_DISTANCE: 15,
    DOF_FOCAL_LENGTH: 300,
    DOF_F_STOP: 16.0,
    DOF_MAX_BLUR: 0.1,
    
    BLOOM_THRESHOLD: 0.8,
    BLOOM_WEIGHT: 0.3,
    BLOOM_KERNEL: 64,
    BLOOM_SCALE: 0.5
};

export class HD2DGame {
    private engine: Engine;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    
    // Cameras
    private mainCamera: ArcRotateCamera;
    private uiCamera: UniversalCamera;
    
    // Rendering
    private renderTarget: RenderTargetTexture;
    private screenQuad: Mesh;
    private pixelPerfectPostProcess: PostProcess;
    private pipeline: DefaultRenderingPipeline;
    private tiltShiftPostProcess: TiltShiftPostProcess;
    private retroPostProcess: RetroPostProcess;
    
    // Lighting
    private sunLight: DirectionalLight;
    private ambientLight: HemisphericLight;
    private shadowGenerator: ShadowGenerator;
    
    // Physics
    private havokPlugin: HavokPlugin | null = null;
    private physicsEnabled: boolean = false;
    
    // Game objects
    private townScene: HD2DTownScene;
    private player: HD2DAnimatedSprite;
    private collisionBoxes: Array<{min: Vector3, max: Vector3}> = [];
    private collisionCylinders: Array<{center: Vector3, radius: number, height: number}> = [];
    private floorZones: Array<{bounds: {min: Vector3, max: Vector3}, heightMap: number[][], resolution: number}> = [];
    private playerCollisionMesh: Mesh | null = null; // Persistent collision mesh for player
    
    // Input
    private keys: { [key: string]: boolean } = {};
    private moveSpeed: number = 5.0; // Units per second
    private isRotatingCamera: boolean = false; // Flag to disable target updates during rotation
    
    // Debug
    private debugMeshes: Mesh[] = [];
    private playerDebugLine: Mesh | null = null;
    private outlineEnabled: boolean = false;
    
    // Public method to add outline to a sprite
    public addOutlineToSprite(sprite: Mesh): void {
        if (this.hd2dOutlineSystem && this.outlineEnabled) {
            this.hd2dOutlineSystem.addOutlineToSprite(sprite);
        }
    }
    
    // Effects
    private hd2dParticles: HD2DParticles;
    private parallaxBackground: ParallaxBackground;
    private spriteOutline: SpriteOutlineSimple;
    private hd2dOutlineSystem: HD2DOutlineSystem;
    
    // Systems
    public timeOfDaySystem: TimeOfDaySystem; // Made public for debug access
    private uiSystem: HD2DUISystem;
    private npcPortraits: { [key: string]: string } = {};
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        console.log('HD2DGame: Initializing HD-2D engine...');
        
        // Create engine with no anti-aliasing for pixel perfect
        this.engine = new Engine(canvas, false, {
            antialias: false,
            preserveDrawingBuffer: true,
            stencil: true
        });
        
        // Create scene
        this.scene = new Scene(this.engine);
        
        // Initialize model registry early so it's available globally
        ModelRegistry.getInstance();
        
        // Initialize HD-2D pipeline
        this.initializeHD2D().then(() => {
            console.log('HD-2D initialization complete');
        }).catch(err => {
            console.error('Failed to initialize HD-2D:', err);
        });
        
        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
    
    private async initializeHD2D(): Promise<void> {
        console.log('Setting up HD-2D rendering pipeline...');
        
        // Step 1: Set up cameras
        this.setupCameras();
        
        // Step 2: Set up pixel-perfect rendering
        this.setupPixelPerfectRendering();
        
        // Step 3: Set up lighting (no shadows yet)
        this.setupBasicLighting();
        
        // Step 4: Set up post-processing
        this.setupPostProcessing();
        
        // Step 5: Create town scene
        await this.createTownScene();
        
        // Step 6: Set up input
        this.setupInput();
    }
    
    private setupCameras(): void {
        // Main game camera - ArcRotate for HD-2D perspective
        this.mainCamera = new ArcRotateCamera(
            'mainCamera',
            -Math.PI / 2, // Alpha - rotation around Y
            Math.PI / 2 - (HD2D_CONFIG.CAMERA_ANGLE * Math.PI / 180), // Beta - rotation from vertical
            HD2D_CONFIG.CAMERA_DISTANCE,
            Vector3.Zero(),
            this.scene
        );
        
        // Lock camera rotation
        this.mainCamera.lowerBetaLimit = this.mainCamera.beta;
        this.mainCamera.upperBetaLimit = this.mainCamera.beta;
        this.mainCamera.lowerAlphaLimit = this.mainCamera.alpha;
        this.mainCamera.upperAlphaLimit = this.mainCamera.alpha;
        
        // Set field of view
        this.mainCamera.fov = HD2D_CONFIG.CAMERA_FOV * Math.PI / 180;
        
        // Don't attach controls - camera is fixed
        // this.mainCamera.attachControl(this.canvas, true);
        
        // UI Camera - orthographic overlay
        this.uiCamera = new UniversalCamera('uiCamera', new Vector3(0, 0, -10), this.scene);
        this.uiCamera.mode = UniversalCamera.ORTHOGRAPHIC_CAMERA;
        
        // Set as active camera
        this.scene.activeCamera = this.mainCamera;
    }
    
    private setupPixelPerfectRendering(): void {
        // Set scene background
        this.scene.clearColor = new Color4(0.5, 0.7, 0.9, 1); // Bright sky blue background
        
        // Configure engine for pixel art
        // this.engine.setHardwareScalingLevel(1 / HD2D_CONFIG.PIXEL_SCALE);
        
        // Disable antialiasing on scene
        this.scene.forcePointsCloud = false;
        
        // Disable FXAA completely for pixel-perfect rendering
        // We'll rely on the default rendering pipeline for post-processing
        
        // Add tilt-shift effect
        this.tiltShiftPostProcess = new TiltShiftPostProcess('tiltShift', this.mainCamera);
        this.tiltShiftPostProcess.setFocusArea(0.35, 0.65); // Focus on center 30% of screen
        
        // Add retro effect (disabled by default)
        this.retroPostProcess = new RetroPostProcess('retro', this.mainCamera);
        this.retroPostProcess.enabled = false;
    }
    
    private setupBasicLighting(): void {
        // Clear any existing lights
        this.scene.lights.forEach(light => light.dispose());
        
        // HD-2D Ambient light setup
        this.ambientLight = new HemisphericLight(
            'ambient',
            new Vector3(0, 1, 0),
            this.scene
        );
        this.ambientLight.intensity = 0.8;
        this.ambientLight.diffuse = new Color3(0.9, 0.9, 1); // Cool ambient light
        this.ambientLight.groundColor = new Color3(0.5, 0.5, 0.6); // Brighter ground reflection
        
        // Main directional sun light
        this.sunLight = new DirectionalLight(
            'sun',
            new Vector3(-0.5, -1, 0.5).normalize(),
            this.scene
        );
        this.sunLight.intensity = 1.2;
        this.sunLight.diffuse = new Color3(1, 0.95, 0.85); // Warm sunlight
        this.sunLight.specular = new Color3(1, 0.9, 0.7);
        
        // Position light for shadow casting
        this.sunLight.position = new Vector3(20, 40, -20);
        
        // Rim light for HD-2D effect
        const rimLight = new DirectionalLight(
            'rimLight',
            new Vector3(0.5, -0.5, -1).normalize(),
            this.scene
        );
        rimLight.intensity = 0.3;
        rimLight.diffuse = new Color3(0.7, 0.8, 1); // Cool rim light
        rimLight.specular = new Color3(0, 0, 0); // No specular for rim
        
        // Configure scene ambient
        this.scene.ambientColor = new Color3(0.2, 0.2, 0.3);
        
        // Enable shadows by default
        this.scene.shadowsEnabled = true;
    }
    
    private async createTownScene(): Promise<void> {
        console.log('Loading HD-2D Town Scene...');
        
        // Create parallax background first
        this.parallaxBackground = new ParallaxBackground(this.scene, this.mainCamera);
        this.parallaxBackground.createSkyLayer();
        this.parallaxBackground.createCloudLayer();
        this.parallaxBackground.createMountainLayer();
        
        // Create town scene
        this.townScene = new HD2DTownScene(this.scene);
        await this.townScene.build();
        
        // Force sync model registry to localStorage after scene is built
        const registry = ModelRegistry.getInstance();
        registry.syncToStorage();
        
        // Get player reference
        this.player = this.townScene.getPlayer();
        
        // Get collision boxes, cylinders, and floor zones
        this.collisionBoxes = this.townScene.getCollisionBoxes();
        this.collisionCylinders = this.townScene.getCollisionCylinders();
        this.floorZones = this.townScene.getFloorZones();
        
        // Create player collision mesh (invisible cylinder for player bounds)
        if (this.player) {
            const spriteWidth = 3;
            const playerCollisionWidth = (22 / 96) * spriteWidth;
            
            this.playerCollisionMesh = CreateCylinder('playerCollisionMesh', {
                diameter: playerCollisionWidth,
                height: 1.8,
                tessellation: 8
            }, this.scene);
            
            this.playerCollisionMesh.position = this.player.position.clone();
            this.playerCollisionMesh.isVisible = false; // Invisible
            this.playerCollisionMesh.isPickable = false;
            
            // Focus camera on player
            this.mainCamera.target = this.player.position;
        }
        
        // Debug camera info
        console.log('Camera setup complete:', {
            type: this.mainCamera.constructor.name,
            position: this.mainCamera.position,
            target: this.mainCamera.target,
            alpha: this.mainCamera.alpha,
            beta: this.mainCamera.beta,
            radius: this.mainCamera.radius
        });
        
        // Create ambient particles
        this.hd2dParticles = new HD2DParticles(this.scene);
        this.hd2dParticles.createAmbientDust();
        this.hd2dParticles.createMagicalSparkles();
        this.hd2dParticles.start();
        
        // Create HD-2D outline system
        this.hd2dOutlineSystem = new HD2DOutlineSystem(this.scene);
        
        // Apply outlines to sprites after a longer delay to ensure NPCs are fully loaded
        setTimeout(() => {
            // Add outline to player
            if (this.player && this.player.mesh) {
                console.log('Adding outline to player');
                this.hd2dOutlineSystem.addOutlineToSprite(this.player.mesh);
            }
            
            // Add outlines to NPCs
            const npcs = this.townScene.getNPCs();
            console.log(`Found ${npcs.length} NPCs`);
            npcs.forEach(npc => {
                if (npc.mesh) {
                    console.log(`Adding outline to NPC: ${npc.name}, mesh name: ${npc.mesh.name}`);
                    this.hd2dOutlineSystem.addOutlineToSprite(npc.mesh);
                } else {
                    console.warn(`NPC ${npc.name} has no mesh`);
                }
            });
            
            // Set initial state
            this.hd2dOutlineSystem.setEnabled(this.outlineEnabled);
            console.log(`Outlines enabled: ${this.outlineEnabled}`);
        }, 1000);
        
        // Create debug visualization
        this.createDebugVisuals();
        
        // Enable shadows and bloom by default
        this.enableShadows();
        this.enableBloom();
        
        // Initialize time of day system
        this.timeOfDaySystem = new TimeOfDaySystem(
            this.scene,
            this.sunLight,
            this.ambientLight,
            this.pipeline
        );
        
        // Start at morning
        this.timeOfDaySystem.setHour(9);
        this.timeOfDaySystem.setTimeSpeed(60); // 1 game hour per real second
        
        // Initialize UI system
        this.uiSystem = new HD2DUISystem(this.scene);
        
        // Generate NPC portraits
        this.npcPortraits = createAllNPCPortraits();
        
        // Show status display
        this.uiSystem.createStatusDisplay();
        
        // Demo: Show welcome dialogue after a short delay
        setTimeout(() => {
            this.uiSystem.showDialogue(
                "Welcome to the HD-2D Town! The fountain flows with magical water, and the time of day changes dynamically.",
                "Town Guide"
            );
        }, 1000);
        
        // Start update loop
        this.scene.registerBeforeRender(() => {
            this.update();
            this.updateDebugVisuals();
            if (this.parallaxBackground) {
                this.parallaxBackground.update();
            }
        });
    }
    
    private setupInput(): void {
        // Keyboard input
        this.scene.actionManager = new ActionManager(this.scene);
        
        // Camera rotation variables (moved to higher scope)
        let originalAlpha = this.mainCamera.alpha;
        let originalBeta = this.mainCamera.beta;
        let originalTarget = this.mainCamera.target.clone();
        let tempAlpha = originalAlpha;
        let tempBeta = originalBeta;
        
        // Key down
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnKeyDownTrigger,
                (evt) => {
                    this.keys[evt.sourceEvent.key.toLowerCase()] = true;
                    
                    // Camera rotation debug mode (Space key)
                    if (evt.sourceEvent.key === ' ' && !this.isRotatingCamera) {
                        console.log('Space key pressed - Enabling rotation mode');
                        this.isRotatingCamera = true;
                        // Store current camera state
                        originalAlpha = this.mainCamera.alpha;
                        originalBeta = this.mainCamera.beta;
                        originalTarget = this.mainCamera.target.clone();
                        tempAlpha = originalAlpha;
                        tempBeta = originalBeta;
                        console.log('Camera state stored - Alpha:', originalAlpha, 'Beta:', originalBeta);
                        console.log('Camera target stored:', originalTarget);
                        console.log('Camera limits before removal:', {
                            alphaLower: this.mainCamera.lowerAlphaLimit,
                            alphaUpper: this.mainCamera.upperAlphaLimit,
                            betaLower: this.mainCamera.lowerBetaLimit,
                            betaUpper: this.mainCamera.upperBetaLimit
                        });
                        // Temporarily remove rotation limits
                        this.mainCamera.lowerAlphaLimit = null;
                        this.mainCamera.upperAlphaLimit = null;
                        this.mainCamera.lowerBetaLimit = null;
                        this.mainCamera.upperBetaLimit = null;
                        console.log('Camera rotation mode ENABLED - limits removed');
                        
                        // Ensure camera is focused on player during rotation
                        if (this.player) {
                            this.mainCamera.target = this.player.position;
                            console.log('Camera anchored to player at:', this.player.position);
                        }
                    }
                }
            )
        );
        
        // Key up
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnKeyUpTrigger,
                (evt) => {
                    this.keys[evt.sourceEvent.key.toLowerCase()] = false;
                    
                    // UI interactions
                    if (evt.sourceEvent.key === 'Enter') {
                        // Close dialogue on Enter
                        this.uiSystem.hideDialogue();
                    }
                    
                    // Camera rotation debug mode (Space key)
                    if (evt.sourceEvent.key === ' ') {
                        console.log('Space key released - Disabling rotation mode');
                        this.isRotatingCamera = false;
                        // Restore original camera state
                        this.mainCamera.alpha = originalAlpha;
                        this.mainCamera.beta = originalBeta;
                        this.mainCamera.target = originalTarget.clone();
                        console.log('Camera state restored - Alpha:', this.mainCamera.alpha, 'Beta:', this.mainCamera.beta);
                        console.log('Camera target restored:', this.mainCamera.target);
                        // Restore rotation limits
                        this.mainCamera.lowerBetaLimit = this.mainCamera.beta;
                        this.mainCamera.upperBetaLimit = this.mainCamera.beta;
                        this.mainCamera.lowerAlphaLimit = this.mainCamera.alpha;
                        this.mainCamera.upperAlphaLimit = this.mainCamera.alpha;
                        console.log('Camera limits restored');
                    }
                    
                    // NPC interaction
                    if (evt.sourceEvent.key === 'e' || evt.sourceEvent.key === 'E') {
                        this.handleNPCInteraction();
                    }
                }
            )
        );
        
        // Mouse movement for camera rotation (when space is held)
        let lastMouseX = 0;
        let lastMouseY = 0;
        let mouseInitialized = false;
        
        this.canvas.addEventListener('mousemove', (evt) => {
            if (!mouseInitialized) {
                lastMouseX = evt.clientX;
                lastMouseY = evt.clientY;
                mouseInitialized = true;
            }
            
            if (this.isRotatingCamera) {
                const deltaX = evt.clientX - lastMouseX;
                const deltaY = evt.clientY - lastMouseY;
                
                // Update temporary rotation values
                tempAlpha -= deltaX * 0.01;
                tempBeta -= deltaY * 0.01;
                
                // Clamp beta to prevent flipping
                tempBeta = Math.max(0.1, Math.min(Math.PI - 0.1, tempBeta));
                
                console.log('Rotating camera - Delta:', deltaX, deltaY);
                console.log('New rotation - Alpha:', tempAlpha.toFixed(3), 'Beta:', tempBeta.toFixed(3));
                
                // Apply rotation
                this.mainCamera.alpha = tempAlpha;
                this.mainCamera.beta = tempBeta;
                
                // Ensure camera stays focused on player during rotation
                if (this.player) {
                    this.mainCamera.target = this.player.position;
                }
                
                // Check if rotation was actually applied
                console.log('Camera actual - Alpha:', this.mainCamera.alpha.toFixed(3), 'Beta:', this.mainCamera.beta.toFixed(3));
                console.log('Camera target:', this.mainCamera.target);
            }
            
            lastMouseX = evt.clientX;
            lastMouseY = evt.clientY;
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (evt) => {
            evt.preventDefault();
        });
    }
    
    private update(): void {
        if (!this.player) return;
        
        const deltaTime = this.engine.getDeltaTime() / 1000;
        
        // Check NPC proximity for speech bubbles
        this.updateNPCInteractions();
        
        // Calculate movement direction
        let moveX = 0;
        let moveZ = 0;
        
        if (this.keys['w'] || this.keys['arrowup']) moveZ += 1;
        if (this.keys['s'] || this.keys['arrowdown']) moveZ -= 1;
        if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
        if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveZ !== 0) {
            const factor = 0.707; // 1/sqrt(2)
            moveX *= factor;
            moveZ *= factor;
        }
        
        // Apply movement with separate X and Z collision checks
        if (moveX !== 0 || moveZ !== 0) {
            const movement = new Vector3(
                moveX * this.moveSpeed * deltaTime,
                0,
                moveZ * this.moveSpeed * deltaTime
            );
            
            let canMoveX = true;
            let canMoveZ = true;
            
            // Check X movement separately
            if (moveX !== 0) {
                const testPos = this.player.position.add(new Vector3(movement.x, 0, 0));
                if (this.checkCollision(testPos)) {
                    canMoveX = false;
                }
            }
            
            // Check Z movement separately
            if (moveZ !== 0) {
                const testPos = this.player.position.add(new Vector3(0, 0, movement.z));
                if (this.checkCollision(testPos)) {
                    canMoveZ = false;
                }
            }
            
            // Apply movement only for allowed directions
            const finalMovement = new Vector3(
                canMoveX ? movement.x : 0,
                0,
                canMoveZ ? movement.z : 0
            );
            
            if (finalMovement.x !== 0 || finalMovement.z !== 0) {
                const newPosition = this.player.position.add(finalMovement);
                
                // Check if player height should be adjusted based on ground/objects
                const adjustedPosition = this.checkGroundHeight(newPosition);
                
                this.player.setPosition(adjustedPosition);
                
                // Update camera target only if not in rotation mode
                if (!this.isRotatingCamera) {
                    // Update camera to follow player's position including Y changes
                    this.mainCamera.target = this.player.position.clone();
                    // Optionally adjust camera height to follow player
                    const cameraHeight = 15 + (this.player.position.y - 0.6) * 0.5; // Partial follow
                    this.mainCamera.position.y = cameraHeight;
                }
                
                // Update sprite direction based on actual movement
                this.updateSpriteDirection(
                    canMoveX ? moveX : 0,
                    canMoveZ ? moveZ : 0
                );
                this.player.setMoving(true);
            } else {
                this.player.setMoving(false);
            }
        } else {
            this.player.setMoving(false);
            
            // Even when not moving, check if player should maintain height
            const currentPos = this.player.position;
            const adjustedPosition = this.checkGroundHeight(currentPos);
            if (Math.abs(adjustedPosition.y - currentPos.y) > 0.01) {
                this.player.setPosition(adjustedPosition);
            }
        }
    }
    
    private updateSpriteDirection(moveX: number, moveZ: number): void {
        if (moveX === 0 && moveZ === 0) return; // No movement, don't change direction
        
        let direction: 'up' | 'down' | 'left' | 'right';
        
        if (Math.abs(moveZ) > Math.abs(moveX)) {
            if (moveZ > 0) {
                direction = 'up';
            } else {
                direction = 'down';
            }
        } else {
            if (moveX > 0) {
                direction = 'right';
            } else {
                direction = 'left';
            }
        }
        
        this.player.setMoving(true, direction);
    }
    
    private checkCollision(position: Vector3): boolean {
        // Player collision based on actual character width (22/96 of sprite width)
        const spriteWidth = 3; // Updated player sprite width
        const playerCollisionWidth = (22 / 96) * spriteWidth; // ~0.6875 units
        const halfWidth = playerCollisionWidth / 2;
        
        // Check bounding box collisions
        for (const box of this.collisionBoxes) {
            // Check collision with no padding - exact collision when character touches
            if (position.x + halfWidth > box.min.x && 
                position.x - halfWidth < box.max.x &&
                position.z > box.min.z && 
                position.z < box.max.z) {
                return true; // Collision detected
            }
        }
        
        // Check cylinder collisions (for round objects like barrels)
        // REMOVED SIDE COLLISION FOR NOW - only using height adjustment
        /*
        for (const cylinder of this.collisionCylinders) {
            // 2D distance check (ignoring Y for now)
            const dx = position.x - cylinder.center.x;
            const dz = position.z - cylinder.center.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Check if player circle overlaps with cylinder
            if (distance < (halfWidth + cylinder.radius)) {
                // Check if player is above the cylinder (trying to walk on top)
                // Barrel height is stored in cylinder.height
                if (position.y > cylinder.height * 0.8) {
                    // Player is high enough to be on top, allow movement
                    continue;
                }
                return true; // Collision detected (side collision)
            }
        }
        */
        
        // Check mesh collisions using precise mesh intersection
        if (this.playerCollisionMesh) {
            // Update player collision mesh position to test position
            this.playerCollisionMesh.position.copyFrom(position);
            // Use a fixed offset from the player's actual Y position for consistency
            this.playerCollisionMesh.position.y = position.y; // Keep collision at same Y as player
            this.playerCollisionMesh.computeWorldMatrix(true);
            
            // Check against all meshes with collision enabled
            for (const mesh of this.scene.meshes) {
                if (mesh.checkCollisions && mesh.isEnabled() && mesh.isVisible) {
                    // Skip player's own mesh, shadows, debug meshes, and the collision mesh itself
                    if (mesh === this.player.mesh || mesh.name.includes('_shadow') || 
                        mesh.name.includes('Debug') || mesh.name.includes('_collider') ||
                        mesh === this.playerCollisionMesh) {
                        continue;
                    }
                    
                    // First do a quick bounding box check for performance
                    mesh.computeWorldMatrix(true);
                    const meshBounds = mesh.getBoundingInfo().boundingBox;
                    const playerBounds = this.playerCollisionMesh.getBoundingInfo().boundingBox;
                    
                    // Quick AABB check - if bounding boxes don't overlap, skip precise check
                    if (playerBounds.maximumWorld.x < meshBounds.minimumWorld.x || 
                        playerBounds.minimumWorld.x > meshBounds.maximumWorld.x ||
                        playerBounds.maximumWorld.z < meshBounds.minimumWorld.z || 
                        playerBounds.minimumWorld.z > meshBounds.maximumWorld.z) {
                        continue; // Bounding boxes don't overlap
                    }
                    
                    // Now do precise mesh intersection
                    // The 'true' parameter enables precise intersection testing
                    if (this.playerCollisionMesh.intersectsMesh(mesh, true)) {
                        
                        return true; // Collision detected
                    }
                }
            }
        }
        
        return false;
    }
    
    private checkGroundHeight(position: Vector3): Vector3 {
        // Player collision width
        const spriteWidth = 3;
        const playerCollisionWidth = (22 / 96) * spriteWidth;
        const halfWidth = playerCollisionWidth / 2;
        const defaultHeight = 0.6; // Default player Y when on ground
        
        let targetHeight = defaultHeight;
        let foundElevation = false;
        
        // First check floor zones (walkable elevated/sloped areas)
        for (const zone of this.floorZones) {
            // Check if player is within this floor zone
            if (position.x >= zone.bounds.min.x && position.x <= zone.bounds.max.x &&
                position.z >= zone.bounds.min.z && position.z <= zone.bounds.max.z) {
                
                // Get height from height map
                const cellWidth = (zone.bounds.max.x - zone.bounds.min.x) / zone.resolution;
                const cellDepth = (zone.bounds.max.z - zone.bounds.min.z) / zone.resolution;
                
                const gridX = Math.floor((position.x - zone.bounds.min.x) / cellWidth);
                const gridZ = Math.floor((position.z - zone.bounds.min.z) / cellDepth);
                
                if (gridX >= 0 && gridX <= zone.resolution && gridZ >= 0 && gridZ <= zone.resolution) {
                    // Clamp to array bounds
                    const clampedX = Math.min(gridX, zone.resolution);
                    const clampedZ = Math.min(gridZ, zone.resolution);
                    const floorHeight = zone.heightMap[clampedZ][clampedX]; // Fixed: [z][x] not [x][z]
                    targetHeight = floorHeight + defaultHeight; // Add player offset
                    foundElevation = true;
                    break;
                }
            }
        }
        
        // Cylinders are now only used for collision, not for walking on
        // Removed cylinder walking logic - cylinders should block movement, not be walkable
        
        // Smoothly adjust to target height
        const newPosition = position.clone();
        const heightDiff = targetHeight - position.y;
        
        if (Math.abs(heightDiff) > 0.01) {
            // Smooth transition
            if (heightDiff > 0) {
                // Going up - faster
                newPosition.y = position.y + Math.min(heightDiff, 0.3);
            } else {
                // Going down - slower
                newPosition.y = position.y + Math.max(heightDiff, -0.2);
            }
        } else {
            newPosition.y = targetHeight;
        }
        
        return newPosition;
    }
    
    private setupPostProcessing(): void {
        // Create default rendering pipeline
        this.pipeline = new DefaultRenderingPipeline(
            'hd2dPipeline',
            true, // HDR
            this.scene,
            [this.mainCamera]
        );
        
        // Configure for HD-2D aesthetic
        // Disable AA - we want crisp pixels
        this.pipeline.fxaaEnabled = false;
        
        // Pre-configure bloom for HD-2D glow effects
        this.pipeline.bloomEnabled = false;
        this.pipeline.bloomThreshold = HD2D_CONFIG.BLOOM_THRESHOLD;
        this.pipeline.bloomWeight = HD2D_CONFIG.BLOOM_WEIGHT;
        this.pipeline.bloomKernel = HD2D_CONFIG.BLOOM_KERNEL;
        this.pipeline.bloomScale = HD2D_CONFIG.BLOOM_SCALE;
        
        // Pre-configure depth of field for very subtle tilt-shift effect
        this.pipeline.depthOfFieldEnabled = false;
        this.pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Low;
        this.pipeline.depthOfField.focalLength = HD2D_CONFIG.DOF_FOCAL_LENGTH;
        this.pipeline.depthOfField.fStop = HD2D_CONFIG.DOF_F_STOP;
        this.pipeline.depthOfField.focusDistance = HD2D_CONFIG.DOF_FOCUS_DISTANCE;
        this.pipeline.depthOfField.lensSize = 100; // Larger lens = more in focus
        
        // Color grading for HD-2D aesthetic - brightened
        this.pipeline.imageProcessing.contrast = 1.1;
        this.pipeline.imageProcessing.exposure = 1.3;
        this.pipeline.imageProcessing.toneMappingEnabled = true;
        this.pipeline.imageProcessing.toneMappingType = 1; // Reinhard
        this.pipeline.imageProcessing.vignetteEnabled = true;
        this.pipeline.imageProcessing.vignetteWeight = 1.5;
        this.pipeline.imageProcessing.vignetteStretch = 0.5;
        this.pipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0, 0);
        
        // Disable chromatic aberration for clearer visuals
        this.pipeline.chromaticAberrationEnabled = false;
        this.pipeline.chromaticAberration.aberrationAmount = 5.0;
        this.pipeline.chromaticAberration.radialIntensity = 0.5;
        this.pipeline.chromaticAberration.direction = new Vector2(0.5, 0.5);
        
        // Disable grain for clearer visuals
        this.pipeline.grainEnabled = false;
        this.pipeline.grain.intensity = 5;
        this.pipeline.grain.animated = true;
        
        // Disable sharpening for now
        this.pipeline.sharpenEnabled = false;
        this.pipeline.sharpen.edgeAmount = 0.15;
        this.pipeline.sharpen.colorAmount = 0.25;
        
        console.log('HD-2D post-processing configured. Ready for enhancement.');
    }
    
    // Public methods for external control
    public enableShadows(): void {
        this.scene.shadowsEnabled = true;
        
        // Create shadow generator
        this.shadowGenerator = new ShadowGenerator(
            HD2D_CONFIG.SHADOW_MAP_SIZE,
            this.sunLight
        );
        
        // Configure shadow quality for HD-2D aesthetic
        this.shadowGenerator.usePercentageCloserFiltering = true;
        this.shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        this.shadowGenerator.darkness = HD2D_CONFIG.SHADOW_DARKNESS;
        
        // HD-2D specific shadow settings
        this.shadowGenerator.bias = 0.01;
        this.shadowGenerator.normalBias = 0.02;
        this.shadowGenerator.setDarkness(0.3); // Softer shadows for HD-2D
        
        // Enable transparency shadows for sprites
        this.shadowGenerator.transparencyShadow = true;
        
        // Add all meshes as shadow casters
        this.scene.meshes.forEach(mesh => {
            // Skip only ground and shadow blobs
            if (mesh.material && mesh.name !== 'ground' && !mesh.name.includes('_shadow') &&
                !mesh.name.includes('Debug')) {
                this.shadowGenerator.addShadowCaster(mesh);
                
                // For sprites, ensure proper alpha testing for shadows
                if (mesh.billboardMode > 0) {
                    const mat = mesh.material as StandardMaterial;
                    if (mat.diffuseTexture) {
                        mat.diffuseTexture.hasAlpha = true;
                        mat.useAlphaFromDiffuseTexture = true;
                        mat.transparencyMode = 1; // ALPHATEST mode
                        mat.alphaMode = 1; // ALPHA_COMBINE
                    }
                }
            }
            
            // Enable shadow receiving on appropriate meshes
            if (mesh.name === 'ground' || mesh.name.includes('Square')) {
                mesh.receiveShadows = true;
            }
        });
        
        // Adjust sun light for better HD-2D shadows
        this.sunLight.direction = new Vector3(-0.3, -1, 0.3).normalize();
        this.sunLight.intensity = 1.2;
        
    }
    
    public toggleShadows(enabled: boolean): void {
        if (enabled && !this.shadowGenerator) {
            this.enableShadows();
            // Also enable shadow receiving on ground
            this.scene.meshes.forEach(mesh => {
                if (mesh.name === 'ground' || mesh.name.includes('Square')) {
                    mesh.receiveShadows = true;
                }
            });
        } else if (!enabled) {
            this.scene.shadowsEnabled = false;
            if (this.shadowGenerator) {
                this.shadowGenerator.dispose();
                this.shadowGenerator = null as any;
            }
            // Disable shadow receiving
            this.scene.meshes.forEach(mesh => {
                mesh.receiveShadows = false;
            });
        }
        
        // Toggle sprite shadow blobs
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.includes('_shadow')) {
                mesh.setEnabled(enabled);
            }
        });
    }
    
    public toggleDepthOfField(enabled: boolean): void {
        this.pipeline.depthOfFieldEnabled = enabled;
        if (enabled) {
            this.pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Low;
            this.pipeline.depthOfField.focalLength = HD2D_CONFIG.DOF_FOCAL_LENGTH;
            this.pipeline.depthOfField.fStop = HD2D_CONFIG.DOF_F_STOP;
            this.pipeline.depthOfField.focusDistance = HD2D_CONFIG.DOF_FOCUS_DISTANCE;
            this.pipeline.depthOfField.lensSize = 100;
        }
    }
    
    public toggleBloom(enabled: boolean): void {
        this.pipeline.bloomEnabled = enabled;
        if (enabled) {
            this.pipeline.bloomThreshold = HD2D_CONFIG.BLOOM_THRESHOLD;
            this.pipeline.bloomWeight = HD2D_CONFIG.BLOOM_WEIGHT;
            this.pipeline.bloomKernel = HD2D_CONFIG.BLOOM_KERNEL;
            this.pipeline.bloomScale = HD2D_CONFIG.BLOOM_SCALE;
        }
    }
    
    // Keep the old methods for backward compatibility
    public enableDepthOfField(): void {
        this.toggleDepthOfField(true);
    }
    
    public enableBloom(): void {
        this.toggleBloom(true);
    }
    
    public getScene(): Scene {
        return this.scene;
    }
    
    public getEngine(): Engine {
        return this.engine;
    }
    
    public toggleDebugVisuals(visible: boolean): void {
        // Toggle visibility of all debug meshes
        this.debugMeshes.forEach(mesh => {
            mesh.setEnabled(visible);
        });
        
        if (this.playerDebugLine) {
            this.playerDebugLine.setEnabled(visible);
        }
        
        // Log all colliders when enabling debug mode
        if (visible) {
            this.logAllColliders();
        }
    }
    
    private logAllColliders(): void {
        console.group('=== ALL COLLIDERS AND DEBUG OBJECTS ===');
        
        // Log collision boxes
        console.group('📦 Collision Boxes:', this.collisionBoxes.length);
        this.collisionBoxes.forEach((box, index) => {
            console.log(`Box ${index}:`, {
                min: `(${box.min.x.toFixed(2)}, ${box.min.y.toFixed(2)}, ${box.min.z.toFixed(2)})`,
                max: `(${box.max.x.toFixed(2)}, ${box.max.y.toFixed(2)}, ${box.max.z.toFixed(2)})`,
                width: (box.max.x - box.min.x).toFixed(2),
                height: (box.max.y - box.min.y).toFixed(2),
                depth: (box.max.z - box.min.z).toFixed(2)
            });
        });
        console.groupEnd();
        
        // Log collision cylinders
        console.group('🛢️ Collision Cylinders:', this.collisionCylinders.length);
        this.collisionCylinders.forEach((cylinder, index) => {
            console.log(`Cylinder ${index}:`, {
                center: `(${cylinder.center.x.toFixed(2)}, ${cylinder.center.y.toFixed(2)}, ${cylinder.center.z.toFixed(2)})`,
                radius: cylinder.radius.toFixed(2),
                height: cylinder.height.toFixed(2)
            });
        });
        console.groupEnd();
        
        // Log floor zones
        console.group('🟦 Floor Zones:', this.floorZones.length);
        this.floorZones.forEach((zone, index) => {
            console.log(`Floor Zone ${index}:`, {
                type: zone.type || 'floor',
                bounds: {
                    min: `(${zone.bounds.min.x.toFixed(2)}, ${zone.bounds.min.y.toFixed(2)}, ${zone.bounds.min.z.toFixed(2)})`,
                    max: `(${zone.bounds.max.x.toFixed(2)}, ${zone.bounds.max.y.toFixed(2)}, ${zone.bounds.max.z.toFixed(2)})`
                },
                heightMapSize: `${zone.heightMap.length}x${zone.heightMap[0]?.length || 0}`,
                resolution: zone.resolution
            });
        });
        console.groupEnd();
        
        // Log debug meshes
        console.group('🟨 Debug Meshes:', this.debugMeshes.length);
        this.debugMeshes.forEach((mesh, index) => {
            const material = mesh.material as StandardMaterial;
            console.log(`Debug Mesh ${index} - ${mesh.name}:`, {
                position: `(${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`,
                enabled: mesh.isEnabled(),
                color: material ? material.diffuseColor || material.emissiveColor : 'N/A',
                type: mesh.name.includes('Box') ? 'Box' : 
                      mesh.name.includes('Cylinder') ? 'Cylinder' : 
                      mesh.name.includes('Floor') ? 'Floor' : 'Unknown'
            });
        });
        console.groupEnd();
        
        // Log all meshes with "debug" in their name
        console.group('🔍 Scene Debug Meshes:');
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.toLowerCase().includes('debug')) {
                const material = mesh.material as StandardMaterial;
                console.log(`${mesh.name}:`, {
                    position: `(${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`,
                    enabled: mesh.isEnabled(),
                    visible: mesh.isVisible,
                    wireframe: material?.wireframe || false,
                    color: material ? (material.emissiveColor || material.diffuseColor) : 'N/A'
                });
            }
        });
        console.groupEnd();
        
        console.groupEnd();
    }
    
    public toggleCollisionDebug(visible: boolean): void {
        // Toggle visibility of all collision debug meshes (green wireframes)
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.includes('debugCollider') || mesh.name.includes('debugFloor')) {
                mesh.setEnabled(visible);
            }
        });
        console.log(`Collision debug meshes: ${visible ? 'shown' : 'hidden'}`);
    }
    
    public toggleParticles(enabled: boolean): void {
        if (this.hd2dParticles) {
            this.hd2dParticles.setEnabled(enabled);
        }
    }
    
    public toggleOutlines(enabled: boolean): void {
        if (this.spriteOutline) {
            this.spriteOutline.setEnabled(enabled);
        }
    }
    
    public setTimeOfDay(hour: number): void {
        if (this.timeOfDaySystem) {
            this.timeOfDaySystem.setHour(hour);
        }
    }
    
    public setTimeSpeed(speed: number): void {
        if (this.timeOfDaySystem) {
            this.timeOfDaySystem.setTimeSpeed(speed);
        }
    }
    
    public pauseTime(): void {
        if (this.timeOfDaySystem) {
            this.timeOfDaySystem.pause();
        }
    }
    
    public resumeTime(): void {
        if (this.timeOfDaySystem) {
            this.timeOfDaySystem.resume();
        }
    }
    
    public getTimeString(): string {
        return this.timeOfDaySystem ? this.timeOfDaySystem.getTimeString() : '12:00 PM';
    }
    
    public toggleFog(enabled: boolean): void {
        this.scene.fogEnabled = enabled;
    }
    
    public toggleFountainWater(enabled: boolean): void {
        const fountainWater = this.townScene?.getFountainWaterFlow();
        if (fountainWater) {
            fountainWater.setEnabled(enabled);
        }
    }
    
    public toggleHD2DOutlines(enabled: boolean): void {
        this.outlineEnabled = enabled;
        if (this.hd2dOutlineSystem) {
            this.hd2dOutlineSystem.setEnabled(enabled);
            console.log(`HD-2D Outlines: ${enabled ? 'ON' : 'OFF'}`);
        }
    }
    
    public toggleDithering(enabled: boolean): void {
        if (this.retroPostProcess) {
            this.retroPostProcess.setDitherStrength(enabled ? 0.1 : 0);
            console.log(`Dithering: ${enabled ? 'ON' : 'OFF'}`);
        }
    }
    
    private showInteractionMenu(): void {
        this.uiSystem.showMenu("Actions", [
            "Talk to NPC",
            "Check Status", 
            "Settings",
            "Cancel"
        ], (index) => {
            switch(index) {
                case 0:
                    // Use the new NPC interaction system
                    this.handleNPCInteraction();
                    break;
                case 1:
                    this.uiSystem.showDialogue("HP: 75/100 | MP: 50/100 | Level: 5", "Status");
                    break;
                case 2:
                    this.showSettingsMenu();
                    break;
            }
        });
    }
    
    private showSettingsMenu(): void {
        const currentDitherState = this.retroPostProcess.getDitherStrength() > 0 ? "ON" : "OFF";
        const retroState = this.retroPostProcess.enabled ? "ON" : "OFF";
        
        this.uiSystem.showMenu("Settings", [
            `Dithering: ${currentDitherState}`,
            `Retro Effect: ${retroState}`,
            "Back"
        ], (index) => {
            switch (index) {
                case 0:
                    // Toggle dithering
                    const currentStrength = this.retroPostProcess.getDitherStrength();
                    this.retroPostProcess.setDitherStrength(currentStrength > 0 ? 0 : 0.1);
                    this.showSettingsMenu(); // Refresh menu to show updated state
                    break;
                case 1:
                    // Toggle retro effect on/off
                    this.retroPostProcess.enabled = !this.retroPostProcess.enabled;
                    this.showSettingsMenu(); // Refresh menu
                    break;
                case 2:
                    // Go back to main menu
                    this.showInteractionMenu();
                    break;
            }
        });
    }
    
    private findNearbyNPC(): HD2DSprite | null {
        if (!this.player || !this.townScene) return null;
        
        const playerPos = this.player.position;
        const npcs = this.townScene.getNPCs();
        
        for (const npc of npcs) {
            const distance = Vector3.Distance(playerPos, npc.mesh.position);
            if (distance < 3) { // Within 3 units
                return npc;
            }
        }
        
        return null;
    }
    
    private talkToNPC(npc: HD2DSprite): void {
        const dialogues: { [key: string]: string[] } = {
            'blacksmith': [
                "Welcome to my forge! I craft the finest weapons in town.",
                "The secret is in the HD-2D rendering - it makes everything look better!"
            ],
            'merchant': [
                "Looking to buy something? I've got the best wares in the kingdom!",
                "Did you notice how the lighting changes throughout the day?"
            ],
            'innkeeper': [
                "Welcome to the Dancing Dragon Inn! Care for a room?",
                "The fountain outside has been flowing for centuries, they say."
            ],
            'scholar': [
                "Ah, a fellow seeker of knowledge! Have you studied the HD-2D arts?",
                "This rendering technique combines 2D sprites with 3D environments beautifully."
            ],
            'guard': [
                "Halt! Who goes... oh, it's you. Carry on, citizen.",
                "Stay safe out there. The fog can get quite thick at night."
            ]
        };
        
        const npcDialogue = dialogues[npc.name] || ["Hello there!"];
        const randomDialogue = npcDialogue[Math.floor(Math.random() * npcDialogue.length)];
        
        // Capitalize first letter of NPC name for display
        const speakerName = npc.name.charAt(0).toUpperCase() + npc.name.slice(1);
        
        this.uiSystem.showDialogue(randomDialogue, speakerName);
    }
    
    private updateNPCInteractions(): void {
        if (!this.player || !this.townScene) return;
        
        const playerPos = this.player.position;
        const npcs = this.townScene.getNPCs();
        const interactionDistance = 3; // Units
        
        // Track if any NPC is nearby
        let nearbyNPCFound = false;
        let closestNPC = null;
        let closestDistance = Infinity;
        
        for (const npc of npcs) {
            const distance = Vector3.Distance(playerPos, npc.mesh.position);
            
            if (distance < interactionDistance) {
                // Show speech bubble if close enough
                npc.showSpeechBubble();
                nearbyNPCFound = true;
                
                // Track closest NPC
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestNPC = npc;
                }
                
                // Show interaction hint (only once)
                if (!this.interactionHintShown) {
                    this.showInteractionHint();
                    this.interactionHintShown = true;
                }
            } else {
                // Hide speech bubble if too far
                npc.hideSpeechBubble();
            }
        }
        
        // Update nearest NPC
        this.nearestNPC = closestNPC;
        
        // Reset hint flag when no NPCs are nearby
        if (!nearbyNPCFound) {
            this.interactionHintShown = false;
            this.nearestNPC = null;
        }
    }
    
    private interactionHintShown: boolean = false;
    private nearestNPC: any = null;
    
    private showInteractionHint(): void {
        // Create a small hint text at bottom of screen
        const hint = document.createElement('div');
        hint.id = 'interactionHint';
        hint.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(42, 31, 26, 0.9);
            color: #f4e4c1;
            padding: 10px 20px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            border: 2px solid #f4e4c1;
            border-radius: 4px;
            text-shadow: 2px 2px 0px rgba(0,0,0,0.8);
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        hint.textContent = 'Press E to interact';
        
        // Add fade in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(hint);
        
        // Remove hint after 3 seconds
        setTimeout(() => {
            hint.style.animation = 'fadeOut 0.3s ease-out';
            hint.style.opacity = '0';
            setTimeout(() => {
                hint.remove();
                style.remove();
            }, 300);
        }, 3000);
    }
    
    private handleNPCInteraction(): void {
        if (!this.nearestNPC) return;
        
        // Hide the town guide dialogue first
        this.uiSystem.hideDialogue();
        
        // Get NPC dialogue based on name (remove '_sprite' suffix)
        const npcMeshName = this.nearestNPC.mesh.name;
        const npcName = npcMeshName.replace('_sprite', '');
        const dialogue = this.getNPCDialogue(npcName);
        
        // Get the sprite texture URL from the NPC
        let spriteUrl = null;
        if (this.nearestNPC.texture && this.nearestNPC.texture.url) {
            spriteUrl = this.nearestNPC.texture.url;
        }
        
        // Check if NPC is facing left (negative X scale)
        const isFacingLeft = this.nearestNPC.mesh.scaling.x < 0;
        
        // Show single dialogue UI with options
        this.uiSystem.showDialogue(
            dialogue.text,
            dialogue.speaker,
            spriteUrl || dialogue.portrait, // Use sprite URL if available, otherwise fallback
            dialogue.options,
            (optionIndex) => {
                // Show response dialogue
                this.uiSystem.showDialogue(
                    dialogue.responses[optionIndex],
                    dialogue.speaker,
                    spriteUrl || dialogue.portrait,
                    [],
                    undefined,
                    isFacingLeft
                );
            },
            isFacingLeft // Pass facing direction
        );
    }
    
    private getNPCDialogue(npcName: string): any {
        const dialogues: { [key: string]: any } = {
            'blacksmith': {
                text: "Welcome to my forge! I craft the finest weapons and armor in all the land. What can I do for you today?",
                speaker: "Blacksmith",
                portrait: this.npcPortraits.blacksmith,
                options: ["Show me your wares", "Tell me about your craft", "Goodbye"],
                responses: [
                    "My finest swords are on display. Each one forged with care and precision.",
                    "I learned this trade from my father, who learned from his father before him. Three generations of smithing excellence!",
                    "Farewell, traveler. May your blade stay sharp!"
                ]
            },
            'merchant': {
                text: "Ah, a customer! I have exotic goods from distant lands - potions, trinkets, and mysterious artifacts! Perhaps something catches your eye?",
                speaker: "Merchant",
                portrait: this.npcPortraits.merchant,
                options: ["What's your rarest item?", "Do you buy as well as sell?", "Just browsing"],
                responses: [
                    "This crystal from the Northern Wastes... They say it glows under the full moon and reveals hidden truths!",
                    "Of course! I'll pay fair prices for anything of value. Especially magical items or rare materials.",
                    "Take your time! A wise shopper is a happy shopper, as my grandmother used to say."
                ]
            },
            'innkeeper': {
                text: "Welcome to the Prancing Pony Inn! You look weary from your travels. We have warm beds and hot meals. What'll it be?",
                speaker: "Innkeeper",
                portrait: this.npcPortraits.innkeeper,
                options: ["I need a room", "What's the local gossip?", "Thanks, just passing through"],
                responses: [
                    "Excellent choice! That'll be 10 gold pieces for the night. Breakfast is included.",
                    "Well, folks have been talking about strange lights in the old ruins to the north. Some say it's treasure hunters, others think it's something... darker.",
                    "Safe travels then! The road can be dangerous at night."
                ]
            },
            'scholar': {
                text: "Fascinating! Another visitor to our humble town. I'm researching the ancient history of this region. Did you know this town was built on the ruins of an ancient civilization?",
                speaker: "Scholar",
                portrait: this.npcPortraits.scholar,
                options: ["Tell me more about the ruins", "What are you researching?", "I should go"],
                responses: [
                    "The ruins beneath us date back over a thousand years! I've found inscriptions suggesting this was once a center of magical learning.",
                    "I'm translating ancient texts that speak of a powerful artifact hidden somewhere in this region. The 'Heart of Aether' they called it.",
                    "Knowledge awaits those who seek it! Do come back if you discover anything interesting."
                ]
            },
            'guard': {
                text: "Halt! State your business in... Oh, you're already inside. Carry on then. Keep out of trouble and we'll have no problems.",
                speaker: "Town Guard",
                portrait: this.npcPortraits.guard,
                options: ["Any trouble in town?", "Where can I find supplies?", "Yes sir"],
                responses: [
                    "Nothing we can't handle. Though there have been reports of goblins on the eastern road. Best to travel in daylight.",
                    "The merchant by the fountain has general goods. For weapons and armor, see the blacksmith. The inn's that large building to the north.",
                    "Good. Move along then, citizen."
                ]
            }
        };
        
        return dialogues[npcName] || {
            text: "...",
            speaker: "Villager",
            portrait: null,
            options: [],
            responses: []
        };
    }
    
    
    private createDebugVisuals(): void {
        console.log('Creating debug visuals for HD2DGame...');
        console.log('Total collision boxes:', this.collisionBoxes.length);
        console.log('Total collision cylinders:', this.collisionCylinders.length);
        console.log('Total floor zones:', this.floorZones.length);
        
        // Skip creating debug boxes - HD2DTownScene already creates them as debugColliderBox
        // This avoids duplicate red boxes appearing
        
        // Skip creating debug cylinders - HD2DTownScene already creates them as debugColliderCylinder
        // This avoids duplicate yellow cylinders appearing
        
        // Create player collision line
        const spriteWidth = 3;
        const playerCollisionWidth = (22 / 96) * spriteWidth;
        
        this.playerDebugLine = CreateBox('playerDebugLine', {
            width: playerCollisionWidth,
            height: 0.1,
            depth: 0.1
        }, this.scene);
        
        const playerDebugMat = new StandardMaterial('playerDebugMat', this.scene);
        playerDebugMat.diffuseColor = new Color3(0, 0, 1);
        playerDebugMat.alpha = 0.8;
        playerDebugMat.emissiveColor = new Color3(0, 0, 1);
        this.playerDebugLine.material = playerDebugMat;
        this.playerDebugLine.renderingGroupId = 3; // Above everything else
    }
    
    private updateDebugVisuals(): void {
        if (this.playerDebugLine && this.player) {
            this.playerDebugLine.position.x = this.player.position.x;
            this.playerDebugLine.position.z = this.player.position.z;
            
            // Determine the ground height at player's position
            let groundHeight = 0;
            
            // Cylinders no longer affect ground height - removed cylinder ground check
            
            // Position debug line at the ground level beneath the player
            this.playerDebugLine.position.y = groundHeight + 0.05;
        }
        
        // Also update the player collision mesh position to stay in sync
        if (this.playerCollisionMesh && this.player) {
            this.playerCollisionMesh.position.copyFrom(this.player.position);
        }
    }
}