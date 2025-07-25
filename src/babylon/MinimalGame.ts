// Minimal game starting from working foundation
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

// Post-processing
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { DepthOfFieldEffectBlurLevel } from '@babylonjs/core/PostProcesses/depthOfFieldEffect';
import { DepthRenderer } from '@babylonjs/core/Rendering/depthRenderer';

// GUI
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Image } from '@babylonjs/gui/2D/controls/image';

// Game imports
import { AnimatedSprite2D } from './AnimatedSprite2D';
import { NPCSprite2D, NPCType } from './NPCSprite2D';

export class MinimalGame {
  private engine: Engine;
  private currentScene: Scene | null = null;
  private canvas: HTMLCanvasElement;
  private collisionBoxes: Array<{min: Vector3, max: Vector3}> = [];
  private playerStats = {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    gold: 250,
    level: 1,
    exp: 0,
    nextLevelExp: 100
  };
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    console.log('MinimalGame: Initializing...');
    
    // Create engine
    this.engine = new Engine(canvas, true);
    
    // Start with main menu
    this.showMainMenu();
    
    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.currentScene) {
        this.currentScene.render();
      }
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }
  
  private showMainMenu(): void {
    console.log('Creating main menu scene...');
    
    // Dispose current scene if exists
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    
    // Create new scene
    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);
    
    // Camera
    const camera = new FreeCamera('menuCamera', new Vector3(0, 0, -10), scene);
    camera.setTarget(Vector3.Zero());
    
    // Light
    new HemisphericLight('menuLight', new Vector3(0, 1, 0), scene);
    
    // Background decoration - rotating boxes
    for (let i = 0; i < 3; i++) {
      const box = CreateBox(`bgBox${i}`, { size: 1.5 }, scene);
      box.position.x = (i - 1) * 4;
      box.position.z = 5;
      
      const mat = new StandardMaterial(`bgMat${i}`, scene);
      mat.diffuseColor = new Color3(0.2, 0.2, 0.3);
      box.material = mat;
      
      scene.registerBeforeRender(() => {
        box.rotation.y += 0.005 * (i + 1);
      });
    }
    
    // Create GUI
    scene.executeWhenReady(() => {
      console.log('Scene ready, creating GUI...');
      
      const gui = AdvancedDynamicTexture.CreateFullscreenUI('MenuUI');
      
      // Title
      const title = new TextBlock('title', 'SHARDS OF THE WITHERING WILDS');
      title.color = 'white';
      title.fontSize = 48;
      title.fontFamily = 'monospace';
      title.top = '-150px';
      title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      gui.addControl(title);
      
      // Subtitle
      const subtitle = new TextBlock('subtitle', 'HD-2D Edition');
      subtitle.color = '#ffd700';
      subtitle.fontSize = 24;
      subtitle.fontFamily = 'monospace';
      subtitle.top = '-80px';
      subtitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      gui.addControl(subtitle);
      
      // Start button
      const startBtn = Button.CreateSimpleButton('startBtn', 'START GAME');
      startBtn.width = '200px';
      startBtn.height = '60px';
      startBtn.color = 'white';
      startBtn.fontSize = 24;
      startBtn.fontFamily = 'monospace';
      startBtn.background = 'green';
      startBtn.top = '50px';
      startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      startBtn.thickness = 2;
      startBtn.cornerRadius = 5;
      
      // Button events
      startBtn.onPointerClickObservable.add(() => {
        console.log('Start button clicked!');
        this.showGameScene();
      });
      
      startBtn.onPointerEnterObservable.add(() => {
        startBtn.background = 'lightgreen';
      });
      
      startBtn.onPointerOutObservable.add(() => {
        startBtn.background = 'green';
      });
      
      gui.addControl(startBtn);
      
      console.log('Main menu GUI created');
    });
    
    this.currentScene = scene;
  }
  
  private showGameScene(): void {
    console.log('Transitioning to game scene...');
    
    // Dispose current scene
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    
    // Clear collision boxes for new scene
    this.collisionBoxes = [];
    
    // Create game scene
    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.5, 0.7, 0.9, 1); // Sky blue
    
    // Add fog for atmospheric depth
    scene.fogMode = Scene.FOGMODE_LINEAR;
    scene.fogColor = new Color3(0.5, 0.7, 0.9);
    scene.fogStart = 20;
    scene.fogEnd = 50;
    
    // Camera - HD-2D style
    const camera = new FreeCamera('gameCamera', new Vector3(0, 10, -15), scene);
    camera.setTarget(new Vector3(0, 0, 0));
    camera.rotation.x = Math.PI / 7; // Look down at ~25 degrees
    camera.attachControl(this.canvas, true);
    
    // HD-2D Post-processing pipeline
    const pipeline = new DefaultRenderingPipeline(
      'hd2dPipeline',
      true, // HDR
      scene,
      [camera]
    );
    
    // Depth of field temporarily disabled due to module issues
    // TODO: Re-enable when depth renderer import is fixed
    pipeline.depthOfFieldEnabled = false;
    
    // Bloom for magical/dreamy feel
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.8;
    pipeline.bloomWeight = 0.3;
    pipeline.bloomKernel = 64;
    pipeline.bloomScale = 0.5;
    
    // Color grading for enhanced visuals
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.contrast = 1.2;
    pipeline.imageProcessing.exposure = 1.1;
    pipeline.imageProcessing.toneMappingEnabled = true;
    
    // Slight vignette for focus
    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = 2;
    pipeline.imageProcessing.vignetteFOV = 0.5;
    
    // Light
    const light = new HemisphericLight('gameLight', new Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    
    // Ground with subdivisions for better lighting
    const ground = CreateGround('ground', { width: 40, height: 40, subdivisions: 4 }, scene);
    const groundMat = new StandardMaterial('groundMat', scene);
    
    // Create pixel art grass texture
    const grassTexture = this.createPixelGrassTexture(scene);
    groundMat.diffuseTexture = grassTexture;
    groundMat.specularColor = new Color3(0, 0, 0);
    ground.material = groundMat;
    
    // Town square cobblestone center
    const townSquare = CreateGround('townSquare', { width: 15, height: 15, subdivisions: 2 }, scene);
    townSquare.position.y = 0.01;
    const squareMat = new StandardMaterial('squareMat', scene);
    squareMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
    townSquare.material = squareMat;
    
    // Player animated sprite
    // Scale up for better visibility
    const spriteWidth = 4;
    const spriteHeight = 3.33; // Maintain aspect ratio (96:80 = 1.2:1)
    const playerSprite = new AnimatedSprite2D('player', scene, {
      width: spriteWidth,
      height: spriteHeight,
      frameWidth: 96,
      frameHeight: 80
    });
    
    // The character is 22 pixels wide in a 96 pixel frame
    // So the collision width should be (22/96) * spriteWidth
    const playerCollisionWidth = (22 / 96) * spriteWidth; // ~0.917 units
    const characterBottomOffset = 0.8; // Adjusted for larger sprite size
    playerSprite.setPosition(new Vector3(0, characterBottomOffset, -5));
    const player = playerSprite.mesh; // Reference for movement
    
    console.log('Player sprite created:', {
      width: 2,
      height: 2.5,
      position: player.position,
      boundingBox: player.getBoundingInfo().boundingBox
    });
    
    // Visual debug: show player collision as a line at ground level
    const playerDebug = CreateBox('playerDebug', {
      width: playerCollisionWidth,
      height: 0.1,
      depth: 0.1
    }, scene);
    playerDebug.position = new Vector3(0, 0.05, -5); // Position at ground level
    
    const playerDebugMat = new StandardMaterial('playerDebugMat', scene);
    playerDebugMat.diffuseColor = new Color3(0, 0, 1);
    playerDebugMat.alpha = 0.5;
    playerDebug.material = playerDebugMat;
    
    // Also create a debug box showing the sprite bounds
    const spriteBounds = CreateBox('spriteBounds', {
      width: spriteWidth,
      height: spriteHeight,
      depth: 0.1
    }, scene);
    spriteBounds.position = new Vector3(0, characterBottomOffset + spriteHeight/2, -5); // Center of sprite
    
    const spriteBoundsMat = new StandardMaterial('spriteBoundsMat', scene);
    spriteBoundsMat.diffuseColor = new Color3(1, 1, 0);
    spriteBoundsMat.alpha = 0.2;
    spriteBoundsMat.wireframe = true;
    spriteBounds.material = spriteBoundsMat;
    
    // Make debug objects follow player
    scene.registerBeforeRender(() => {
      playerDebug.position.x = player.position.x;
      playerDebug.position.z = player.position.z;
      
      spriteBounds.position.x = player.position.x;
      spriteBounds.position.y = player.position.y;
      spriteBounds.position.z = player.position.z;
    });
    
    // Remove automatic rendering group for player
    player.renderingGroupId = 0; // Same group as everything else for proper depth sorting
    
    // Town buildings with more detail - positioned further back
    this.createBuildingWithRoof(scene, 'smithy', new Vector3(-10, 0, 10), 4, 5, 4, new Color3(0.5, 0.4, 0.3));
    this.createBuildingWithRoof(scene, 'shop', new Vector3(10, 0, 10), 5, 4, 4, new Color3(0.6, 0.5, 0.4));
    this.createBuildingWithRoof(scene, 'inn', new Vector3(0, 0, 15), 6, 6, 5, new Color3(0.7, 0.6, 0.5));
    this.createBuildingWithRoof(scene, 'house1', new Vector3(-8, 0, -5), 3, 4, 3, new Color3(0.6, 0.5, 0.4));
    this.createBuildingWithRoof(scene, 'house2', new Vector3(8, 0, -5), 3, 4, 3, new Color3(0.5, 0.5, 0.4));
    
    // Add fountain in town center
    this.createFountain(scene, new Vector3(0, 0, 0));
    
    // Add trees around the town
    const treePositions = [
      new Vector3(-15, 0, 10), new Vector3(15, 0, 10),
      new Vector3(-15, 0, -10), new Vector3(15, 0, -10),
      new Vector3(-10, 0, 15), new Vector3(10, 0, 15),
      new Vector3(-18, 0, 0), new Vector3(18, 0, 0)
    ];
    treePositions.forEach((pos, i) => this.createTree(scene, `tree${i}`, pos));
    
    // Add lamp posts
    this.createLampPost(scene, 'lamp1', new Vector3(-5, 0, 0));
    this.createLampPost(scene, 'lamp2', new Vector3(5, 0, 0));
    
    // Add NPCs near buildings
    this.createNPCs(scene);
    
    // GUI overlay
    scene.executeWhenReady(() => {
      const gui = AdvancedDynamicTexture.CreateFullscreenUI('GameUI');
      
      // Location label
      const location = new TextBlock('location', 'Town Square');
      location.color = 'white';
      location.fontSize = 36;
      location.fontFamily = 'monospace';
      location.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      location.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      location.left = '20px';
      location.top = '20px';
      location.shadowColor = 'black';
      location.shadowOffsetX = 2;
      location.shadowOffsetY = 2;
      gui.addControl(location);
      
      // Back button
      const backBtn = Button.CreateSimpleButton('backBtn', 'BACK TO MENU');
      backBtn.width = '150px';
      backBtn.height = '40px';
      backBtn.color = 'white';
      backBtn.fontSize = 16;
      backBtn.fontFamily = 'monospace';
      backBtn.background = 'darkred';
      backBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      backBtn.left = '-20px';
      backBtn.top = '20px';
      
      backBtn.onPointerClickObservable.add(() => {
        console.log('Back button clicked');
        this.showMainMenu();
      });
      
      gui.addControl(backBtn);
      
      // Player Stats Panel
      this.createStatsPanel(gui);
      
      // Action buttons
      this.createActionButtons(gui);
    });
    
    // Simple keyboard movement
    const inputMap: { [key: string]: boolean } = {};
    
    // Use canvas keyboard events instead
    this.canvas.addEventListener('keydown', (e) => {
      inputMap[e.key.toLowerCase()] = true;
      
      // Attack keys
      if (e.key === ' ') { // Spacebar for attack1
        playerSprite.attack(1);
      } else if (e.key === 'e') { // E for attack2
        playerSprite.attack(2);
      }
    });
    
    this.canvas.addEventListener('keyup', (e) => {
      inputMap[e.key.toLowerCase()] = false;
    });
    
    // Pass collision boxes to movement logic
    const collisionBoxes = this.collisionBoxes;
    
    // Movement logic
    scene.registerBeforeRender(() => {
      const speed = 0.05; // Slower movement speed
      let isMoving = false;
      let direction: 'up' | 'down' | 'left' | 'right' | undefined;
      
      // Calculate intended movement
      let moveX = 0;
      let moveZ = 0;
      
      if (inputMap['w']) {
        moveZ = speed;  // W moves forward (+Z in Babylon)
        isMoving = true;
        direction = 'up';
      }
      if (inputMap['s']) {
        moveZ = -speed; // S moves backward (-Z in Babylon)
        isMoving = true;
        direction = 'down';
      }
      if (inputMap['a']) {
        moveX = -speed;
        isMoving = true;
        direction = 'left';
      }
      if (inputMap['d']) {
        moveX = speed;
        isMoving = true;
        direction = 'right';
      }
      
      // Test new position before moving
      const newX = player.position.x + moveX;
      const newZ = player.position.z + moveZ;
      
      // Check collisions - test X and Z movement separately
      // Use actual character width for collision
      const halfWidth = playerCollisionWidth / 2;
      let canMoveX = true;
      let canMoveZ = true;
      
      // Check X movement
      if (moveX !== 0) {
        const testX = player.position.x + moveX;
        for (let i = 0; i < collisionBoxes.length; i++) {
          const box = collisionBoxes[i];
          // No padding on X checks - collision should happen exactly when blue line touches
          if (testX + halfWidth > box.min.x && 
              testX - halfWidth < box.max.x &&
              player.position.z > box.min.z && 
              player.position.z < box.max.z) {
            canMoveX = false;
            const boxName = i < 5 ? `Building${i}` : 'Fountain';
            console.log(`X collision with ${boxName}`);
            break;
          }
        }
      }
      
      // Check Z movement
      if (moveZ !== 0) {
        const testZ = player.position.z + moveZ;
        for (let i = 0; i < collisionBoxes.length; i++) {
          const box = collisionBoxes[i];
          // No padding needed since Z works fine
          if (player.position.x + halfWidth > box.min.x && 
              player.position.x - halfWidth < box.max.x &&
              testZ > box.min.z && 
              testZ < box.max.z) {
            canMoveZ = false;
            const boxName = i < 5 ? `Building${i}` : 'Fountain';
            console.log(`Z collision with ${boxName}`);
            console.log(`Player Z: ${player.position.z.toFixed(2)}, TestZ: ${testZ.toFixed(2)}, Box Z: ${box.min.z.toFixed(2)} to ${box.max.z.toFixed(2)}`);
            break;
          }
        }
      }
      
      // Apply movement only if no collision
      if (canMoveX) {
        player.position.x = newX;
      }
      if (canMoveZ) {
        player.position.z = newZ;
      }
      
      // Update player animation state
      playerSprite.setMoving(isMoving, direction);
      
      // Keep player at correct height
      player.position.y = characterBottomOffset;
      
      // Update sprite depth based on Z position (objects further back render first)
      // In Babylon.js, we'll use alphaIndex for proper sprite sorting
      playerSprite.mesh.alphaIndex = -player.position.z * 100;
      
      // Camera follows player
      camera.position.x = player.position.x;
      camera.position.z = player.position.z - 15;
    });
    
    this.currentScene = scene;
    console.log('Game scene created');
  }
  
  private createBuildingWithRoof(scene: Scene, name: string, position: Vector3, width: number, height: number, depth: number, color: Color3): void {
    // Building base
    const building = CreateBox(name, { width, height, depth }, scene);
    building.position = position;
    building.position.y = height / 2;
    
    const mat = new StandardMaterial(`${name}Mat`, scene);
    mat.diffuseColor = color;
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    building.material = mat;
    
    // Set alpha index for depth sorting based on Z position
    building.alphaIndex = -position.z * 100;
    
    // Roof
    const roof = CreateCylinder(`${name}Roof`, {
      diameterTop: 0,
      diameterBottom: Math.max(width, depth) * 1.4,
      height: 2.5,
      tessellation: 4
    }, scene);
    roof.position = position.clone();
    roof.position.y = height + 1.25;
    roof.rotation.y = Math.PI / 4;
    
    const roofMat = new StandardMaterial(`${name}RoofMat`, scene);
    roofMat.diffuseColor = new Color3(0.8, 0.3, 0.2);
    roof.material = roofMat;
    
    // Set roof alpha index
    roof.alphaIndex = -position.z * 100 + 1; // Slightly in front of building
    
    // Add collision box for this building (no extra padding needed now)
    this.collisionBoxes.push({
      min: new Vector3(
        position.x - width/2,
        0,
        position.z - depth/2
      ),
      max: new Vector3(
        position.x + width/2,
        height,
        position.z + depth/2
      )
    });
    
    console.log(`Building ${name} collision box: (${position.x - width/2}, ${position.z - depth/2}) to (${position.x + width/2}, ${position.z + depth/2})`);
    
    // Visual debug: show collision box
    const debugBox = CreateBox(`${name}Debug`, {
      width: width,
      height: 0.1,
      depth: depth
    }, scene);
    debugBox.position = position.clone();
    debugBox.position.y = 0.05;
    
    const debugMat = new StandardMaterial(`${name}DebugMat`, scene);
    debugMat.diffuseColor = new Color3(1, 0, 0);
    debugMat.alpha = 0.3;
    debugBox.material = debugMat;
  }
  
  private createFountain(scene: Scene, position: Vector3): void {
    // Fountain base
    const base = CreateCylinder('fountainBase', {
      diameter: 4,
      height: 0.5,
      tessellation: 8
    }, scene);
    base.position = position;
    base.position.y = 0.25;
    
    const baseMat = new StandardMaterial('fountainBaseMat', scene);
    baseMat.diffuseColor = new Color3(0.6, 0.6, 0.6);
    base.material = baseMat;
    
    // Water
    const water = CreateCylinder('water', {
      diameter: 3.5,
      height: 0.3,
      tessellation: 8
    }, scene);
    water.position = position;
    water.position.y = 0.5;
    
    const waterMat = new StandardMaterial('waterMat', scene);
    waterMat.diffuseColor = new Color3(0.3, 0.5, 0.8);
    waterMat.alpha = 0.7;
    waterMat.specularColor = new Color3(1, 1, 1);
    water.material = waterMat;
    
    // Center pillar
    const pillar = CreateCylinder('fountainPillar', {
      diameter: 0.5,
      height: 1.5,
      tessellation: 6
    }, scene);
    pillar.position = position;
    pillar.position.y = 1;
    pillar.material = baseMat;
    
    // Add collision box for fountain
    // For a circular fountain with diameter 4, use a box inscribed in the circle
    const fountainRadius = 2; // diameter is 4
    const boxSize = fountainRadius * 2 * 0.707; // Box inscribed in circle: side = diameter * sin(45°)
    this.collisionBoxes.push({
      min: new Vector3(
        position.x - boxSize/2,
        0,
        position.z - boxSize/2
      ),
      max: new Vector3(
        position.x + boxSize/2,
        2,
        position.z + boxSize/2
      )
    });
    
    // Visual debug: show collision box
    const debugBox = CreateBox('fountainDebug', {
      width: boxSize,
      height: 0.1,
      depth: boxSize
    }, scene);
    debugBox.position = position.clone();
    debugBox.position.y = 0.05;
    
    const debugMat = new StandardMaterial('fountainDebugMat', scene);
    debugMat.diffuseColor = new Color3(0, 1, 0);
    debugMat.alpha = 0.3;
    debugBox.material = debugMat;
  }
  
  private createTree(scene: Scene, name: string, position: Vector3): void {
    // Trunk
    const trunk = CreateCylinder(`${name}Trunk`, {
      diameter: 0.8,
      height: 3,
      tessellation: 6
    }, scene);
    trunk.position = position;
    trunk.position.y = 1.5;
    
    const trunkMat = new StandardMaterial(`${name}TrunkMat`, scene);
    trunkMat.diffuseColor = new Color3(0.4, 0.3, 0.2);
    trunk.material = trunkMat;
    trunk.alphaIndex = -position.z * 100;
    
    // Leaves
    const leaves = CreateSphere(`${name}Leaves`, {
      diameter: 3,
      segments: 8
    }, scene);
    leaves.position = position;
    leaves.position.y = 3.5;
    
    const leavesMat = new StandardMaterial(`${name}LeavesMat`, scene);
    leavesMat.diffuseColor = new Color3(0.2, 0.6, 0.2);
    leaves.material = leavesMat;
    leaves.alphaIndex = -position.z * 100 + 1;
  }
  
  private createNPCs(scene: Scene): void {
    // NPC positions and types
    const npcs: Array<{position: Vector3, type: NPCType, name: string}> = [
      { position: new Vector3(-8, 0, 7), type: 'blacksmith', name: 'blacksmith_npc' },   // Near smithy
      { position: new Vector3(8, 0, 7), type: 'merchant', name: 'merchant_npc' },        // Near shop
      { position: new Vector3(3, 0, 12), type: 'innkeeper', name: 'innkeeper_npc' },     // Near inn
      { position: new Vector3(-5, 0, -3), type: 'scholar', name: 'scholar_npc' },        // Near house1
      { position: new Vector3(5, 0, -3), type: 'guard', name: 'guard_npc' }              // Near house2
    ];
    
    npcs.forEach(({ position, type, name }) => {
      const npc = new NPCSprite2D(name, type, scene, {
        width: 1.2,   // Slightly smaller than player
        height: 1.8   // Proper human proportions
      });
      
      // Position NPC at ground level
      npc.setPosition(position);
      
      // Make NPCs face toward the center (x=0)
      // NPCs on the left (negative X) face right, NPCs on the right face left
      if (position.x < 0) {
        npc.faceRight();
      } else {
        npc.faceLeft(); // This is the default, but being explicit
      }
      
      // Set depth sorting
      npc.setAlphaIndex(-position.z * 100);
      
      // Add idle animation or bobbing effect
      const startY = position.y + 0.9; // Center of sprite
      scene.registerBeforeRender(() => {
        const time = Date.now() * 0.001;
        npc.mesh.position.y = startY + Math.sin(time * 2) * 0.02; // Gentle bobbing
      });
    });
  }
  
  private createLampPost(scene: Scene, name: string, position: Vector3): void {
    // Post
    const post = CreateCylinder(`${name}Post`, {
      diameter: 0.2,
      height: 3,
      tessellation: 6
    }, scene);
    post.position = position;
    post.position.y = 1.5;
    
    const postMat = new StandardMaterial(`${name}PostMat`, scene);
    postMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    postMat.metallic = 0.8;
    post.material = postMat;
    
    // Lamp
    const lamp = CreateSphere(`${name}Lamp`, {
      diameter: 0.6,
      segments: 8
    }, scene);
    lamp.position = position;
    lamp.position.y = 3;
    
    const lampMat = new StandardMaterial(`${name}LampMat`, scene);
    lampMat.emissiveColor = new Color3(1, 0.9, 0.6);
    lampMat.diffuseColor = new Color3(1, 0.9, 0.6);
    lamp.material = lampMat;
  }
  
  private createStatsPanel(gui: AdvancedDynamicTexture): void {
    // Character portrait frame
    const portraitFrame = new Rectangle('portraitFrame');
    portraitFrame.width = '80px';
    portraitFrame.height = '80px';
    portraitFrame.thickness = 3;
    portraitFrame.color = '#gold';
    portraitFrame.background = 'rgba(0, 0, 0, 0.8)';
    portraitFrame.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    portraitFrame.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    portraitFrame.left = '20px';
    portraitFrame.top = '70px';
    portraitFrame.cornerRadius = 40;
    gui.addControl(portraitFrame);
    
    // Character icon (placeholder)
    const charIcon = new TextBlock('charIcon', '🧙');
    charIcon.fontSize = 40;
    portraitFrame.addControl(charIcon);
    
    // Stats container next to portrait
    const statsPanel = new Rectangle('statsPanel');
    statsPanel.width = '200px';
    statsPanel.height = '120px';
    statsPanel.thickness = 2;
    statsPanel.color = '#gold';
    statsPanel.background = 'rgba(0, 0, 0, 0.7)';
    statsPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    statsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    statsPanel.left = '110px';
    statsPanel.top = '70px';
    statsPanel.cornerRadius = 5;
    gui.addControl(statsPanel);
    
    // Stats stack panel
    const statsStack = new StackPanel();
    statsStack.width = '180px';
    statsStack.spacing = 5;
    statsPanel.addControl(statsStack);
    
    // HP Bar
    const hpContainer = new Rectangle();
    hpContainer.height = '25px';
    hpContainer.thickness = 0;
    statsStack.addControl(hpContainer);
    
    const hpBar = new Rectangle('hpBar');
    hpBar.width = `${(this.playerStats.hp / this.playerStats.maxHp) * 100}%`;
    hpBar.height = '20px';
    hpBar.background = '#ff4444';
    hpBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    hpContainer.addControl(hpBar);
    
    const hpText = new TextBlock('hpText', `HP: ${this.playerStats.hp}/${this.playerStats.maxHp}`);
    hpText.color = 'white';
    hpText.fontSize = 14;
    hpText.fontFamily = 'monospace';
    hpContainer.addControl(hpText);
    
    // MP Bar
    const mpContainer = new Rectangle();
    mpContainer.height = '25px';
    mpContainer.thickness = 0;
    statsStack.addControl(mpContainer);
    
    const mpBar = new Rectangle('mpBar');
    mpBar.width = `${(this.playerStats.mp / this.playerStats.maxMp) * 100}%`;
    mpBar.height = '20px';
    mpBar.background = '#4444ff';
    mpBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    mpContainer.addControl(mpBar);
    
    const mpText = new TextBlock('mpText', `MP: ${this.playerStats.mp}/${this.playerStats.maxMp}`);
    mpText.color = 'white';
    mpText.fontSize = 14;
    mpText.fontFamily = 'monospace';
    mpContainer.addControl(mpText);
    
    // Gold
    const goldText = new TextBlock('goldText', `Gold: ${this.playerStats.gold}`);
    goldText.color = '#ffd700';
    goldText.fontSize = 16;
    goldText.fontFamily = 'monospace';
    goldText.height = '25px';
    statsStack.addControl(goldText);
    
    // Level & EXP
    const levelText = new TextBlock('levelText', `Level: ${this.playerStats.level}`);
    levelText.color = 'white';
    levelText.fontSize = 14;
    levelText.fontFamily = 'monospace';
    levelText.height = '20px';
    statsStack.addControl(levelText);
    
    const expText = new TextBlock('expText', `EXP: ${this.playerStats.exp}/${this.playerStats.nextLevelExp}`);
    expText.color = '#88ff88';
    expText.fontSize = 12;
    expText.fontFamily = 'monospace';
    expText.height = '20px';
    statsStack.addControl(expText);
  }
  
  private createActionButtons(gui: AdvancedDynamicTexture): void {
    // Bottom action bar
    const actionBar = new Rectangle('actionBar');
    actionBar.width = '400px';
    actionBar.height = '80px';
    actionBar.thickness = 2;
    actionBar.color = 'white';
    actionBar.background = 'rgba(0, 0, 0, 0.8)';
    actionBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    actionBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    actionBar.top = '-20px';
    actionBar.cornerRadius = 10;
    gui.addControl(actionBar);
    
    // Button container with horizontal layout
    const buttonContainer = new StackPanel();
    buttonContainer.isVertical = false;
    buttonContainer.spacing = 20;
    actionBar.addControl(buttonContainer);
    
    // Inventory button with icon
    const inventoryBtn = this.createIconButton(
      'inventoryBtn',
      '🎒', // Backpack emoji as icon
      'Inventory',
      '#4a3c28',
      () => {
        console.log('Inventory clicked');
        this.showMessage(gui, 'Inventory not yet implemented!');
      }
    );
    buttonContainer.addControl(inventoryBtn);
    
    // Skills button with icon
    const skillsBtn = this.createIconButton(
      'skillsBtn',
      '⚔️', // Sword emoji as icon
      'Skills',
      '#3c4a28',
      () => {
        console.log('Skills clicked');
        this.showMessage(gui, 'Skills not yet implemented!');
      }
    );
    buttonContainer.addControl(skillsBtn);
    
    // Map button
    const mapBtn = this.createIconButton(
      'mapBtn',
      '🗺️', // Map emoji as icon
      'Map',
      '#28384a',
      () => {
        console.log('Map clicked');
        this.showMessage(gui, 'Map not yet implemented!');
      }
    );
    buttonContainer.addControl(mapBtn);
    
    // Dungeon button with icon
    const dungeonBtn = this.createIconButton(
      'dungeonBtn',
      '🏰', // Castle emoji as icon
      'Dungeon',
      '#8b0000',
      () => {
        console.log('Dungeon clicked');
        this.showMessage(gui, 'Prepare for dungeon exploration!');
      }
    );
    buttonContainer.addControl(dungeonBtn);
    
    // Quick slot bar (for potions, etc)
    this.createQuickSlotBar(gui);
  }
  
  private createIconButton(name: string, icon: string, label: string, color: string, onClick: () => void): Rectangle {
    const container = new Rectangle(name);
    container.width = '60px';
    container.height = '60px';
    container.thickness = 2;
    container.color = 'white';
    container.background = color;
    container.cornerRadius = 10;
    
    // Icon
    const iconText = new TextBlock(`${name}Icon`, icon);
    iconText.fontSize = 24;
    iconText.top = '-5px';
    container.addControl(iconText);
    
    // Label
    const labelText = new TextBlock(`${name}Label`, label);
    labelText.fontSize = 10;
    labelText.fontFamily = 'monospace';
    labelText.color = 'white';
    labelText.top = '20px';
    container.addControl(labelText);
    
    // Hover effect
    container.onPointerEnterObservable.add(() => {
      container.background = this.lightenColor(color);
      container.scaleX = 1.1;
      container.scaleY = 1.1;
    });
    
    container.onPointerOutObservable.add(() => {
      container.background = color;
      container.scaleX = 1;
      container.scaleY = 1;
    });
    
    container.onPointerClickObservable.add(onClick);
    
    return container;
  }
  
  private createQuickSlotBar(gui: AdvancedDynamicTexture): void {
    // Quick slot container
    const quickSlotBar = new Rectangle('quickSlotBar');
    quickSlotBar.width = '240px';
    quickSlotBar.height = '60px';
    quickSlotBar.thickness = 2;
    quickSlotBar.color = 'white';
    quickSlotBar.background = 'rgba(0, 0, 0, 0.7)';
    quickSlotBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    quickSlotBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    quickSlotBar.top = '-110px';
    quickSlotBar.cornerRadius = 5;
    gui.addControl(quickSlotBar);
    
    const slotContainer = new StackPanel();
    slotContainer.isVertical = false;
    slotContainer.spacing = 10;
    quickSlotBar.addControl(slotContainer);
    
    // Create 4 quick slots
    for (let i = 0; i < 4; i++) {
      const slot = new Rectangle(`slot${i}`);
      slot.width = '40px';
      slot.height = '40px';
      slot.thickness = 1;
      slot.color = '#666';
      slot.background = 'rgba(0, 0, 0, 0.5)';
      slot.cornerRadius = 5;
      
      // Slot number
      const slotNum = new TextBlock(`slotNum${i}`, `${i + 1}`);
      slotNum.fontSize = 10;
      slotNum.color = '#888';
      slotNum.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      slotNum.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      slotNum.left = '-2px';
      slotNum.top = '-2px';
      slot.addControl(slotNum);
      
      // Demo: Add potion to first slot
      if (i === 0) {
        const potion = new TextBlock('potion', '🧪');
        potion.fontSize = 20;
        slot.addControl(potion);
      }
      
      slotContainer.addControl(slot);
    }
  }
  
  private lightenColor(color: string): string {
    // Simple color lightening for hover effect
    const colors: { [key: string]: string } = {
      '#4a3c28': '#5a4c38',
      '#3c4a28': '#4c5a38',
      '#28384a': '#38485a',
      '#8b0000': '#ab2020'
    };
    return colors[color] || color;
  }
  
  private showMessage(gui: AdvancedDynamicTexture, message: string): void {
    // Create message popup
    const messageBox = new Rectangle('messageBox');
    messageBox.width = '300px';
    messageBox.height = '80px';
    messageBox.thickness = 2;
    messageBox.color = 'white';
    messageBox.background = 'rgba(0, 0, 0, 0.9)';
    messageBox.cornerRadius = 10;
    gui.addControl(messageBox);
    
    const messageText = new TextBlock('messageText', message);
    messageText.color = 'white';
    messageText.fontSize = 18;
    messageText.fontFamily = 'monospace';
    messageBox.addControl(messageText);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
      gui.removeControl(messageBox);
    }, 2000);
  }
  
  private createPixelGrassTexture(scene: Scene): DynamicTexture {
    const size = 128; // Texture size
    const texture = new DynamicTexture('grassTexture', size, scene, false);
    const ctx = texture.getContext();
    
    // Base grass color
    ctx.fillStyle = '#4a7c4e';
    ctx.fillRect(0, 0, size, size);
    
    // Add pixel art grass details
    const grassColors = ['#5a8c5e', '#3a6c3e', '#6a9c6e', '#2a5c2e'];
    const pixelSize = 4;
    
    // Random grass pixels
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(Math.random() * (size / pixelSize)) * pixelSize;
      const y = Math.floor(Math.random() * (size / pixelSize)) * pixelSize;
      ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    // Add some darker grass blades
    ctx.strokeStyle = '#2a4c2e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2 + Math.random() * 4, y - 4 - Math.random() * 4);
      ctx.stroke();
    }
    
    // Add some highlights
    ctx.strokeStyle = '#6aac6e';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1 + Math.random() * 2, y - 3 - Math.random() * 3);
      ctx.stroke();
    }
    
    // Add tiny flowers/details
    const flowerColors = ['#ffeb3b', '#ff5722', '#e91e63', '#9c27b0'];
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(Math.random() * (size / pixelSize)) * pixelSize;
      const y = Math.floor(Math.random() * (size / pixelSize)) * pixelSize;
      ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    texture.update();
    
    // Set texture properties for pixel art look
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = 10; // Tile the texture
    texture.vScale = 10;
    
    return texture;
  }
}