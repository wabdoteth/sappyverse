import * as BABYLON from '@babylonjs/core';
import { HD2DScene } from './HD2DScene';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import { GameStateManager } from '../../systems/GameStateManager';

export class Game {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private sceneManager: SceneManager;
  private assetManager: AssetManager;
  
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: false, // Pixel art style
    });
    
    this.assetManager = new AssetManager();
    this.sceneManager = new SceneManager(this.engine, this.assetManager);
    
    // Store scene manager reference on engine for scene access
    (this.engine as any).sceneManager = this.sceneManager;
    
    this.setupEngine();
    this.initialize();
  }
  
  private setupEngine(): void {
    // Resize handling
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    // Development helpers
    window.addEventListener('keydown', (e) => {
      // F1 for inspector
      if (e.key === 'F1') {
        if (this.sceneManager.activeScene.debugLayer.isVisible()) {
          this.sceneManager.activeScene.debugLayer.hide();
        } else {
          this.sceneManager.activeScene.debugLayer.show();
        }
      }
    });
  }
  
  private async initialize(): Promise<void> {
    try {
      // Load core assets
      await this.assetManager.loadCoreAssets();
      
      // Initialize game state (preserve existing system)
      const gameState = GameStateManager.getInstance();
      
      // Create a working main menu
      this.createWorkingMainMenu();
      
      // Start render loop
      this.startRenderLoop();
      
    } catch (error) {
      console.error('Game initialization failed:', error);
    }
  }
  
  private startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      // Render all scenes
      this.engine.scenes.forEach(scene => {
        if (scene.activeCamera) {
          scene.render();
        }
      });
    });
  }
  
  private createWorkingMainMenu(): void {
    const scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
    
    // Camera
    const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -1), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    
    // Light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    
    // Import GUI dynamically to ensure it's loaded
    import('@babylonjs/gui').then((GUI) => {
      const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
      
      // Title
      const title = new GUI.TextBlock();
      title.text = 'SHARDS OF THE WITHERING WILDS';
      title.color = 'white';
      title.fontSize = 48;
      title.fontFamily = 'monospace';
      title.paddingTop = '100px';
      title.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      advancedTexture.addControl(title);
      
      // Button
      const button = GUI.Button.CreateSimpleButton('start', 'START GAME');
      button.width = '200px';
      button.height = '60px';
      button.color = 'white';
      button.cornerRadius = 5;
      button.background = '#4a3c28';
      button.paddingTop = '200px';
      button.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      button.fontSize = 24;
      button.fontFamily = 'monospace';
      
      button.onPointerUpObservable.add(() => {
        console.log('Start button clicked!');
        this.loadTownScene();
      });
      
      button.onPointerEnterObservable.add(() => {
        button.background = '#5a4c38';
      });
      
      button.onPointerOutObservable.add(() => {
        button.background = '#4a3c28';
      });
      
      advancedTexture.addControl(button);
      
      // HD-2D label
      const hdLabel = new GUI.TextBlock();
      hdLabel.text = 'HD-2D Edition';
      hdLabel.color = '#ffd700';
      hdLabel.fontSize = 20;
      hdLabel.fontFamily = 'monospace';
      hdLabel.paddingTop = '300px';
      hdLabel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      advancedTexture.addControl(hdLabel);
      
      console.log('Main menu created successfully');
    });
  }
  
  private async loadTownScene(): Promise<void> {
    console.log('Loading town scene...');
    await this.sceneManager.loadScene('town');
  }
  
  public dispose(): void {
    this.engine.dispose();
    window.removeEventListener('resize', () => this.engine.resize());
  }
}