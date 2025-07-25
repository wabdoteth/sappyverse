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

// Post-processing
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { DepthOfFieldEffectBlurLevel } from '@babylonjs/core/PostProcesses/depthOfFieldEffect';

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
    // Ambient light
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this);
    ambient.intensity = 0.6;
    ambient.diffuse = new Color3(0.9, 0.9, 1);
    ambient.groundColor = new Color3(0.3, 0.3, 0.4);
    
    // Directional light (sun)
    const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1), this);
    sun.intensity = 0.8;
    sun.diffuse = new Color3(1, 0.95, 0.8);
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
  }
  
  private createPlayer(): void {
    // For now, create a simple character sprite
    this.player = new HD2DSprite('player', this, {
      width: 1,
      height: 2,
      texture: null // We'll add proper textures later
    });
    
    this.player.mesh.position = new Vector3(0, 1, -5);
    
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