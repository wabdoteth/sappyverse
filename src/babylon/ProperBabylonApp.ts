// Proper Babylon.js ES module imports with correct paths
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';

// GUI imports from correct submodule
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Control } from '@babylonjs/gui/2D/controls/control';

// Required side-effect imports
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Meshes/meshBuilder';

export class ProperBabylonApp {
  private engine: Engine;
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  
  constructor(canvasId: string) {
    console.log('ProperBabylonApp: Initializing...');
    
    // Get canvas
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }
    
    // Initialize in proper order
    this.initializeEngine();
    this.createScene();
    this.setupSceneContent();
    this.createGUI();
    this.startRenderLoop();
    
    console.log('ProperBabylonApp: Initialization complete');
  }
  
  private initializeEngine(): void {
    console.log('Creating engine...');
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }
  
  private createScene(): void {
    console.log('Creating scene...');
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);
  }
  
  private setupSceneContent(): void {
    console.log('Setting up scene content...');
    
    // Camera
    const camera = new FreeCamera('camera', new Vector3(0, 0, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(this.canvas, true);
    
    // Light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    
    // Create a simple rotating box
    const box = CreateBox('box', { size: 2 }, this.scene);
    box.position.y = -3;
    
    // Animate the box
    this.scene.registerBeforeRender(() => {
      box.rotation.y += 0.01;
      box.rotation.x += 0.005;
    });
  }
  
  private createGUI(): void {
    console.log('Creating GUI...');
    
    // Wait for scene to be ready before creating GUI
    this.scene.executeWhenReady(() => {
      // Create fullscreen UI with proper initialization
      const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, this.scene);
      
      // Title
      const title = new TextBlock('title', 'SHARDS OF THE WITHERING WILDS');
      title.color = 'white';
      title.fontSize = 48;
      title.fontFamily = 'monospace';
      title.top = '-100px';
      title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      advancedTexture.addControl(title);
      
      // Start button
      const startButton = Button.CreateSimpleButton('startButton', 'START GAME');
      startButton.width = '200px';
      startButton.height = '60px';
      startButton.color = 'white';
      startButton.fontSize = 24;
      startButton.fontFamily = 'monospace';
      startButton.background = '#4a3c28';
      startButton.thickness = 2;
      startButton.cornerRadius = 5;
      startButton.top = '50px';
      startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      
      // Button click handler - use onPointerClickObservable instead of onPointerUpObservable
      startButton.onPointerClickObservable.add(() => {
        console.log('Button clicked!');
        this.onStartGame();
      });
      
      // Hover effects
      startButton.onPointerEnterObservable.add(() => {
        console.log('Button hover enter');
        startButton.background = '#5a4c38';
        this.canvas.style.cursor = 'pointer';
      });
      
      startButton.onPointerOutObservable.add(() => {
        console.log('Button hover exit');
        startButton.background = '#4a3c28';
        this.canvas.style.cursor = 'default';
      });
      
      // Also try onPointerDownObservable for debugging
      startButton.onPointerDownObservable.add(() => {
        console.log('Button pointer down');
      });
      
      advancedTexture.addControl(startButton);
      
      // Debug info
      const debugInfo = new TextBlock('debugInfo', 'GUI Loaded - Click the button');
      debugInfo.color = '#ffd700';
      debugInfo.fontSize = 16;
      debugInfo.fontFamily = 'monospace';
      debugInfo.top = '150px';
      debugInfo.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      advancedTexture.addControl(debugInfo);
      
      console.log('GUI created successfully');
      
      // Set focus to canvas after a delay
      setTimeout(() => {
        this.canvas.focus();
        console.log('Canvas focused');
      }, 100);
    });
  }
  
  private startRenderLoop(): void {
    console.log('Starting render loop...');
    
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
  
  private onStartGame(): void {
    console.log('Starting game...');
    
    // Find debug text and update it
    const advancedTexture = this.scene.getTextureByName('UI') as AdvancedDynamicTexture;
    if (advancedTexture) {
      const debugText = advancedTexture.getControlByName('debugInfo') as TextBlock;
      if (debugText) {
        debugText.text = 'Game Started! (Town scene would load here)';
        debugText.color = '#00ff00';
      }
    }
    
    // TODO: Implement scene transition to town
  }
  
  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}