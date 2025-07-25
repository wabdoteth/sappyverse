// Main game class with proper ES module imports
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TownScene } from './scenes/TownScene';
import { GameStateManager } from './GameStateManager';

export class Game {
  private engine: Engine;
  private canvas: HTMLCanvasElement;
  private currentScene: Scene | null = null;
  private scenes: Map<string, Scene> = new Map();
  
  constructor(canvasId: string) {
    console.log('Initializing Shards of the Withering Wilds HD-2D...');
    console.log('Looking for canvas:', canvasId);
    
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }
    
    // Initialize engine
    console.log('Creating engine...');
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });
    console.log('Engine created:', this.engine);
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    // Initialize game state
    GameStateManager.getInstance();
    
    // Create scenes
    this.createScenes();
    
    // Start with main menu
    this.switchToScene('mainMenu');
    
    // Start render loop
    console.log('Starting render loop...');
    this.engine.runRenderLoop(() => {
      if (this.currentScene) {
        this.currentScene.render();
      }
    });
    console.log('Render loop started');
  }
  
  private createScenes(): void {
    console.log('Creating scenes...');
    // Create main menu
    const mainMenu = new MainMenuScene(this.engine);
    mainMenu.onStartGame = () => this.switchToScene('town');
    this.scenes.set('mainMenu', mainMenu);
    console.log('Main menu scene created');
    
    // Create town scene
    const town = new TownScene(this.engine);
    this.scenes.set('town', town);
  }
  
  private switchToScene(sceneName: string): void {
    console.log(`Switching to scene: ${sceneName}`);
    
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      console.error(`Scene not found: ${sceneName}`);
      return;
    }
    
    // Detach current scene
    if (this.currentScene) {
      this.currentScene.detachControl();
    }
    
    // Switch scene
    this.currentScene = newScene;
    
    // Attach new scene
    if (this.currentScene.activeCamera) {
      this.currentScene.activeCamera.attachControl(this.canvas, true);
    }
  }
  
  public dispose(): void {
    this.scenes.forEach(scene => scene.dispose());
    this.engine.dispose();
  }
}