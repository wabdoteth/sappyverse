// HD-2D Game Engine - Refactored Version
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';

// Core imports
import '@babylonjs/core/Cameras/universalCamera';
import '@babylonjs/core/Lights/Shadows/shadowsOptimization';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMaterial';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/core/Meshes/instancedMesh';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Collisions/collisionCoordinator';
import '@babylonjs/core/Actions/actionManager';
import '@babylonjs/core/Actions/directActions';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';

// Managers
import { PostProcessingManager } from './managers/PostProcessingManager';
import { NPCInteractionManager } from './managers/NPCInteractionManager';
import { PlayerControlManager } from './managers/PlayerControlManager';
import { GameSettingsManager } from './managers/GameSettingsManager';

// Systems
import { HD2DUISystem } from './ui/HD2DUISystem';
import { TimeOfDaySystem } from './systems/TimeOfDaySystem';
import { HD2DOutlineSystem } from './materials/HD2DOutlineMaterial';

// Scenes and entities
import { HD2DTownScene } from './scenes/HD2DTownScene';
import { HD2DAnimatedSprite } from './HD2DAnimatedSprite';
import { HD2DSprite } from './HD2DSprite';
import { AmbientParticles } from './effects/AmbientParticles';
import { createAllNPCPortraits } from './utils/createNPCPortraits';

export class HD2DGame {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    
    // Cameras
    private mainCamera: UniversalCamera;
    private uiCamera: UniversalCamera;
    
    // Managers
    private postProcessingManager: PostProcessingManager;
    private npcInteractionManager: NPCInteractionManager;
    private playerControlManager: PlayerControlManager;
    private settingsManager: GameSettingsManager;
    
    // Systems
    private uiSystem: HD2DUISystem;
    public timeOfDaySystem: TimeOfDaySystem;
    private hd2dOutlineSystem: HD2DOutlineSystem;
    
    // Scene and entities
    private townScene: HD2DTownScene;
    private player: HD2DAnimatedSprite;
    private ambientParticles: AmbientParticles;
    
    // Debug
    private collisionDebugMeshes: any[] = [];
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        console.log('HD2DGame: Initializing HD-2D engine...');
        
        this.initializeEngine();
        this.initializeScene();
        this.initializeManagers();
        this.setupScene();
        this.startRenderLoop();
    }
    
    private initializeEngine(): void {
        this.engine = new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
    
    private initializeScene(): void {
        this.scene = new Scene(this.engine);
        this.scene.collisionsEnabled = true;
        this.scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);
        
        // Setup cameras
        this.setupCameras();
        
        // Setup lighting
        this.setupLighting();
    }
    
    private setupCameras(): void {
        // Main game camera
        this.mainCamera = new UniversalCamera('mainCamera', new Vector3(0, 20, -20), this.scene);
        this.mainCamera.setTarget(Vector3.Zero());
        this.mainCamera.fov = 0.6;
        
        // UI Camera - orthographic overlay
        this.uiCamera = new UniversalCamera('uiCamera', new Vector3(0, 0, -10), this.scene);
        this.uiCamera.mode = UniversalCamera.ORTHOGRAPHIC_CAMERA;
        this.uiCamera.orthoTop = 10;
        this.uiCamera.orthoBottom = -10;
        this.uiCamera.orthoLeft = -16;
        this.uiCamera.orthoRight = 16;
        this.uiCamera.layerMask = 0x20000000;
        
        // Set main camera as active
        this.scene.activeCamera = this.mainCamera;
    }
    
    private setupLighting(): void {
        // Ambient light
        const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
        ambient.intensity = 0.4;
        ambient.groundColor = new Color3(0.2, 0.2, 0.3);
        
        // Main directional light (sun)
        const sunLight = new DirectionalLight('sun', new Vector3(-0.5, -1, 0.5), this.scene);
        sunLight.position = new Vector3(20, 40, -20);
        sunLight.intensity = 0.8;
        
        // Shadow generator
        const shadowGen = new ShadowGenerator(2048, sunLight);
        shadowGen.useBlurExponentialShadowMap = true;
        shadowGen.blurScale = 2;
        shadowGen.setDarkness(0.3);
        (sunLight as any).shadowGenerator = shadowGen;
    }
    
    private initializeManagers(): void {
        // Settings manager (loads saved settings)
        this.settingsManager = new GameSettingsManager();
        
        // UI System
        this.uiSystem = new HD2DUISystem(this.scene);
        
        // Post-processing
        this.postProcessingManager = new PostProcessingManager(this.scene, this.mainCamera);
        
        // NPC Interaction
        this.npcInteractionManager = new NPCInteractionManager(this.scene, this.uiSystem);
        
        // Player Controls
        this.playerControlManager = new PlayerControlManager(this.scene, this.uiSystem, this.npcInteractionManager);
        
        // Initialize settings manager with dependencies
        this.settingsManager.initialize(this.postProcessingManager, this.uiSystem);
        
        // Time of Day
        this.timeOfDaySystem = new TimeOfDaySystem(this.scene);
        const lights = this.scene.lights.filter(l => l instanceof DirectionalLight);
        if (lights.length > 0) {
            this.timeOfDaySystem.setSunLight(lights[0] as DirectionalLight);
        }
        
        // HD-2D Outline System
        this.hd2dOutlineSystem = new HD2DOutlineSystem(this.scene);
        
        // Setup settings callbacks
        this.setupSettingsCallbacks();
    }
    
    private setupSettingsCallbacks(): void {
        // Fog
        this.settingsManager.onSettingChange('graphics.fogEnabled', (enabled) => {
            this.toggleFog(enabled);
        });
        
        // Particles
        this.settingsManager.onSettingChange('graphics.particlesEnabled', (enabled) => {
            this.toggleParticles(enabled);
        });
        
        // Outlines
        this.settingsManager.onSettingChange('graphics.outlinesEnabled', (enabled) => {
            this.hd2dOutlineSystem.setEnabled(enabled);
            console.log(`HD-2D Outlines: ${enabled ? 'ON' : 'OFF'}`);
        });
        
        // Collisions
        this.settingsManager.onSettingChange('gameplay.collisionsEnabled', (enabled) => {
            this.playerControlManager.setCollisionsEnabled(enabled);
        });
        
        // Debug visuals
        this.settingsManager.onSettingChange('gameplay.debugVisualsEnabled', (enabled) => {
            this.toggleDebugVisualsInternal(enabled);
        });
    }
    
    private async setupScene(): Promise<void> {
        // Create HD-2D town scene
        this.townScene = new HD2DTownScene(this.scene);
        await this.townScene.build();
        
        // Get references
        this.player = this.townScene.getPlayer();
        
        // Setup managers with scene data
        this.npcInteractionManager.setPlayer(this.player);
        this.npcInteractionManager.setNPCs(this.townScene.getNPCs());
        this.npcInteractionManager.setNPCPortraits(createAllNPCPortraits());
        
        this.playerControlManager.setPlayer(this.player);
        this.playerControlManager.setCollisionBoxes(this.townScene.getCollisionBoxes());
        
        // Setup ambient particles
        this.ambientParticles = new AmbientParticles(this.scene);
        this.ambientParticles.setWindDirection(new Vector3(0.5, 0, 0.3));
        
        // Create collision debug visualization
        this.createCollisionDebugMeshes();
        
        // Show welcome message
        this.uiSystem.createStatusDisplay();
        setTimeout(() => {
            this.uiSystem.showDialogue(
                "Welcome to the HD-2D Town! Press M to open the menu, E to interact with NPCs.",
                "Town Guide"
            );
        }, 1000);
    }
    
    private createCollisionDebugMeshes(): void {
        const collisionBoxes = this.townScene.getCollisionBoxes();
        const { CreateBox } = require('@babylonjs/core/Meshes/Builders/boxBuilder');
        const { StandardMaterial } = require('@babylonjs/core/Materials/standardMaterial');
        
        collisionBoxes.forEach((box, index) => {
            const size = box.max.subtract(box.min);
            const center = box.min.add(size.scale(0.5));
            
            const debugMesh = CreateBox(`collision_debug_${index}`, {
                width: size.x,
                height: size.y,
                depth: size.z
            }, this.scene);
            
            debugMesh.position = center;
            
            const mat = new StandardMaterial(`collision_mat_${index}`, this.scene);
            mat.diffuseColor = new Color3(1, 0, 0);
            mat.alpha = 0.3;
            mat.wireframe = true;
            
            debugMesh.material = mat;
            debugMesh.isPickable = false;
            
            this.collisionDebugMeshes.push(debugMesh);
        });
    }
    
    private startRenderLoop(): void {
        // Update function
        this.scene.registerBeforeRender(() => {
            // Update player controls
            this.playerControlManager.update();
            
            // Update NPC interactions
            this.npcInteractionManager.update();
            
            // Update camera to follow player
            if (this.player) {
                const playerPos = this.player.position;
                this.mainCamera.position.x = playerPos.x;
                this.mainCamera.position.z = playerPos.z - 20;
                this.mainCamera.setTarget(new Vector3(playerPos.x, 5, playerPos.z));
            }
        });
        
        // Render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
    
    // Public API methods for external access
    public getEngine(): Engine {
        return this.engine;
    }
    
    public getScene(): Scene {
        return this.scene;
    }
    
    public getTimeString(): string {
        return this.timeOfDaySystem?.getTimeString() || "12:00 PM";
    }
    
    // Settings API - delegates to settings manager
    public toggleShadows(enabled: boolean): void {
        this.settingsManager.toggleShadows(enabled);
    }
    
    public toggleDepthOfField(enabled: boolean): void {
        this.settingsManager.toggleDepthOfField(enabled);
    }
    
    public toggleBloom(enabled: boolean): void {
        this.settingsManager.toggleBloom(enabled);
    }
    
    public toggleDithering(enabled: boolean): void {
        this.settingsManager.toggleDithering(enabled);
    }
    
    public toggleOutlines(enabled: boolean): void {
        this.settingsManager.toggleOutlines(enabled);
    }
    
    public toggleFog(enabled: boolean): void {
        if (this.scene.fogMode === Scene.FOGMODE_NONE) {
            this.scene.fogMode = Scene.FOGMODE_EXP2;
            this.scene.fogDensity = 0.01;
            this.scene.fogColor = new Color3(0.5, 0.5, 0.6);
        } else {
            this.scene.fogMode = Scene.FOGMODE_NONE;
        }
        console.log(`Fog: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    public toggleParticles(enabled: boolean): void {
        if (this.ambientParticles) {
            this.ambientParticles.setEnabled(enabled);
        }
        const fountainWater = this.townScene?.getFountainWaterFlow();
        if (fountainWater) {
            fountainWater.setEnabled(enabled);
        }
        console.log(`Particles: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    public toggleDebugVisuals(enabled: boolean): void {
        this.settingsManager.toggleDebugVisuals(enabled);
    }
    
    private toggleDebugVisualsInternal(enabled: boolean): void {
        this.collisionDebugMeshes.forEach(mesh => {
            mesh.isVisible = enabled;
        });
        console.log(`Debug Visuals: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    // Time controls
    public setTimeOfDay(hour: number): void {
        this.timeOfDaySystem?.setTime(hour);
    }
    
    public pauseTime(): void {
        this.timeOfDaySystem?.pause();
    }
    
    public resumeTime(): void {
        this.timeOfDaySystem?.resume();
    }
    
    public setTimeSpeed(speed: number): void {
        this.timeOfDaySystem?.setTimeSpeed(speed);
    }
    
    // Settings menu access
    public showSettingsMenu(): void {
        this.settingsManager.showSettingsMenu(() => {
            this.showInteractionMenu();
        });
    }
    
    private showInteractionMenu(): void {
        this.uiSystem.showMenu("Actions", [
            "Talk to NPC",
            "Check Status", 
            "Settings",
            "Cancel"
        ], (index) => {
            switch (index) {
                case 0:
                    this.npcInteractionManager.handleInteraction();
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
    
    public dispose(): void {
        this.postProcessingManager?.dispose();
        this.uiSystem?.dispose();
        this.hd2dOutlineSystem?.dispose();
        this.scene?.dispose();
        this.engine?.dispose();
    }
}