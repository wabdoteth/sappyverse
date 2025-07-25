// HD-2D Town Scene with proper imports
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { SpriteManager } from '@babylonjs/core/Sprites/spriteManager';
import { Sprite } from '@babylonjs/core/Sprites/sprite';

// Required side effects
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';

// Post-processing
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { DepthOfFieldEffectBlurLevel } from '@babylonjs/core/PostProcesses/depthOfFieldEffect';

// Shadows
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';

// GUI
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Control } from '@babylonjs/gui/2D/controls/control';

// Game imports
import { GameStateManager } from '../GameStateManager';
import { HD2DSprite } from '../sprites/HD2DSprite';

export class TownScene extends Scene {
  private player!: HD2DSprite;
  private camera!: UniversalCamera;
  private pipeline!: DefaultRenderingPipeline;
  private gui!: AdvancedDynamicTexture;
  private shadowGenerator!: ShadowGenerator;
  
  constructor(engine: Engine) {
    super(engine);
    
    // Set fog color for atmosphere
    this.clearColor = new Color4(0.7, 0.8, 0.9, 1);
    this.fogMode = Scene.FOGMODE_LINEAR;
    this.fogColor = new Color3(0.7, 0.8, 0.9);
    this.fogStart = 20;
    this.fogEnd = 60;
    
    this.initialize();
  }
  
  private initialize(): void {
    // Setup HD-2D camera
    this.setupCamera();
    
    // Setup lighting
    this.setupLighting();
    
    // Create town environment
    this.createTownEnvironment();
    
    // Create player
    this.createPlayer();
    
    // Setup post-processing
    this.setupPostProcessing();
    
    // Create UI
    this.executeWhenReady(() => {
      this.createUI();
    });
    
    // Setup input handling
    this.setupInput();
  }
  
  private setupCamera(): void {
    // HD-2D camera setup - 25 degree angle looking down
    this.camera = new UniversalCamera('townCamera', new Vector3(0, 15, -20), this);
    this.camera.setTarget(new Vector3(0, 0, 0));
    this.camera.rotation.x = Math.PI / 7; // ~25 degrees
    
    // Attach camera controls
    this.camera.attachControl(this.getEngine().getRenderingCanvas(), true);
    
    // Limit camera movement for HD-2D feel
    this.camera.speed = 0.5;
    this.camera.angularSensibility = 10000; // Reduce rotation sensitivity
  }
  
  private setupLighting(): void {
    // Ambient light - increased for better sprite visibility
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this);
    ambient.intensity = 0.5;
    ambient.diffuse = new Color3(0.9, 0.9, 1);
    ambient.groundColor = new Color3(0.3, 0.3, 0.4);
    
    // Directional light (sun) - simulating sun from lower left casting shadows upper right
    const sun = new DirectionalLight('sun', new Vector3(1, -2, 1).normalize(), this);
    sun.position = new Vector3(-10, 20, -10);
    sun.intensity = 1.2;
    sun.diffuse = new Color3(1, 0.95, 0.8);
    sun.specular = new Color3(1, 1, 1);
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 100;
    
    // Setup shadow generator
    this.shadowGenerator = new ShadowGenerator(2048, sun);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurScale = 2;
    this.shadowGenerator.setDarkness(0.3);
    this.shadowGenerator.bias = 0.01;
    
    // Enable shadows in the scene
    this.shadowsEnabled = true;
  }
  
  private createTownEnvironment(): void {
    // Ground plane
    const ground = MeshBuilder.CreateGround('ground', {
      width: 60,
      height: 60,
      subdivisions: 4
    }, this);
    
    const groundMat = new StandardMaterial('groundMat', this);
    groundMat.diffuseColor = new Color3(0.3, 0.5, 0.3);
    groundMat.specularColor = new Color3(0, 0, 0);
    ground.material = groundMat;
    ground.receiveShadows = true;
    
    // Create simple buildings with HD-2D style
    this.createBuilding('shop', new Vector3(-10, 0, 5), 6, 8, 6);
    this.createBuilding('house1', new Vector3(10, 0, 8), 5, 6, 5);
    this.createBuilding('house2', new Vector3(8, 0, -10), 5, 6, 5);
    this.createBuilding('inn', new Vector3(-8, 0, -8), 8, 10, 7);
    
    // Create town square fountain
    this.createFountain(new Vector3(0, 0, 0));
    
    // Create some trees
    for (let i = 0; i < 10; i++) {
      const x = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      // Avoid center area
      if (Math.abs(x) > 15 || Math.abs(z) > 15) {
        this.createTree(new Vector3(x, 0, z));
      }
    }
  }
  
  private createBuilding(name: string, position: Vector3, width: number, height: number, depth: number): void {
    const building = MeshBuilder.CreateBox(name, {
      width: width,
      height: height,
      depth: depth
    }, this);
    building.position = position;
    building.position.y = height / 2;
    
    const mat = new StandardMaterial(`${name}Mat`, this);
    mat.diffuseColor = new Color3(0.7, 0.6, 0.5);
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    building.material = mat;
    
    // Add roof
    const roof = MeshBuilder.CreateCylinder(`${name}Roof`, {
      diameterTop: 0,
      diameterBottom: Math.max(width, depth) * 1.2,
      height: 3,
      tessellation: 4
    }, this);
    roof.position = position;
    roof.position.y = height + 1.5;
    roof.rotation.y = Math.PI / 4;
    
    const roofMat = new StandardMaterial(`${name}RoofMat`, this);
    roofMat.diffuseColor = new Color3(0.8, 0.3, 0.2);
    roof.material = roofMat;
    
    // Add building and roof to shadow generator
    this.shadowGenerator.addShadowCaster(building);
    this.shadowGenerator.addShadowCaster(roof);
    building.receiveShadows = true;
    roof.receiveShadows = true;
  }
  
  private createFountain(position: Vector3): void {
    // Base
    const base = MeshBuilder.CreateCylinder('fountainBase', {
      diameter: 6,
      height: 1,
      tessellation: 8
    }, this);
    base.position = position;
    base.position.y = 0.5;
    
    const stoneMat = new StandardMaterial('stoneMat', this);
    stoneMat.diffuseColor = new Color3(0.6, 0.6, 0.6);
    base.material = stoneMat;
    
    // Water effect (simple for now)
    const water = MeshBuilder.CreateCylinder('water', {
      diameter: 5,
      height: 0.5,
      tessellation: 8
    }, this);
    water.position = position;
    water.position.y = 1;
    
    const waterMat = new StandardMaterial('waterMat', this);
    waterMat.diffuseColor = new Color3(0.3, 0.5, 0.8);
    waterMat.alpha = 0.7;
    water.material = waterMat;
    
    // Add shadows
    this.shadowGenerator.addShadowCaster(base);
    base.receiveShadows = true;
  }
  
  private createTree(position: Vector3): void {
    // Trunk
    const trunk = MeshBuilder.CreateCylinder('trunk', {
      diameter: 1,
      height: 4,
      tessellation: 6
    }, this);
    trunk.position = position;
    trunk.position.y = 2;
    
    const trunkMat = new StandardMaterial('trunkMat', this);
    trunkMat.diffuseColor = new Color3(0.4, 0.3, 0.2);
    trunk.material = trunkMat;
    
    // Leaves
    const leaves = MeshBuilder.CreateSphere('leaves', {
      diameter: 4,
      segments: 8
    }, this);
    leaves.position = position;
    leaves.position.y = 5;
    
    const leavesMat = new StandardMaterial('leavesMat', this);
    leavesMat.diffuseColor = new Color3(0.2, 0.6, 0.2);
    leaves.material = leavesMat;
    
    // Add shadows for trees
    this.shadowGenerator.addShadowCaster(trunk);
    this.shadowGenerator.addShadowCaster(leaves);
    trunk.receiveShadows = true;
    leaves.receiveShadows = true;
  }
  
  private createPlayer(): void {
    // For now, create a simple character sprite
    this.player = new HD2DSprite('player', this, {
      width: 1,
      height: 2,
      texture: null // We'll add proper textures later
    });
    
    this.player.mesh.position = new Vector3(0, 1, -5);
    
    // Enable shadows for player sprite
    this.player.enableShadows(this.shadowGenerator);
    
    // DEBUG: Add some emissive to see if sprite is visible
    const mat = this.player.mesh.material as StandardMaterial;
    if (mat) {
      mat.emissiveColor = new Color3(0.2, 0.2, 0.2);
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
    }
    
    // Make camera follow player
    this.registerBeforeRender(() => {
      this.camera.position.x = this.player.mesh.position.x;
      this.camera.position.z = this.player.mesh.position.z - 20;
    });
  }
  
  private setupPostProcessing(): void {
    // Create HD-2D style post-processing
    this.pipeline = new DefaultRenderingPipeline(
      'hd2dPipeline',
      true,
      this,
      [this.camera]
    );
    
    // Enable depth of field for tilt-shift effect
    this.pipeline.depthOfFieldEnabled = true;
    this.pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Medium;
    this.pipeline.depthOfField.focalLength = 50;
    this.pipeline.depthOfField.fStop = 1.4;
    this.pipeline.depthOfField.focusDistance = 2000;
    
    // Bloom for magical feel
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 0.8;
    this.pipeline.bloomWeight = 0.3;
    this.pipeline.bloomKernel = 64;
    this.pipeline.bloomScale = 0.5;
    
    // Color grading
    this.pipeline.imageProcessingEnabled = true;
    this.pipeline.imageProcessing.contrast = 1.2;
    this.pipeline.imageProcessing.exposure = 1.1;
  }
  
  private createUI(): void {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('TownUI', true, this);
    
    // Location label
    const locationLabel = new TextBlock('location', 'Town Square');
    locationLabel.color = 'white';
    locationLabel.fontSize = 36;
    locationLabel.fontFamily = 'monospace';
    locationLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    locationLabel.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    locationLabel.left = '20px';
    locationLabel.top = '20px';
    locationLabel.shadowColor = 'black';
    locationLabel.shadowOffsetX = 2;
    locationLabel.shadowOffsetY = 2;
    this.gui.addControl(locationLabel);
    
    // Player stats
    const gameState = GameStateManager.getInstance().getState();
    const statsText = `HP: ${gameState.player.hp}/${gameState.player.maxHp}\nGold: ${gameState.player.gold}`;
    
    const stats = new TextBlock('stats', statsText);
    stats.color = 'white';
    stats.fontSize = 18;
    stats.fontFamily = 'monospace';
    stats.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    stats.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stats.left = '-20px';
    stats.top = '20px';
    stats.shadowColor = 'black';
    stats.shadowOffsetX = 1;
    stats.shadowOffsetY = 1;
    stats.resizeToFit = true;
    this.gui.addControl(stats);
  }
  
  private setupInput(): void {
    const canvas = this.getEngine().getRenderingCanvas();
    if (!canvas) return;
    
    // Simple WASD movement
    const inputMap: { [key: string]: boolean } = {};
    
    canvas.addEventListener('keydown', (e) => {
      inputMap[e.key.toLowerCase()] = true;
    });
    
    canvas.addEventListener('keyup', (e) => {
      inputMap[e.key.toLowerCase()] = false;
    });
    
    // Update player movement
    this.registerBeforeRender(() => {
      const speed = 0.1;
      const player = this.player.mesh;
      
      if (inputMap['w']) player.position.z += speed;
      if (inputMap['s']) player.position.z -= speed;
      if (inputMap['a']) player.position.x -= speed;
      if (inputMap['d']) player.position.x += speed;
      
      // Keep player on ground
      player.position.y = 1;
    });
  }
}