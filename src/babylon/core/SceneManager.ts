import * as BABYLON from '@babylonjs/core';
import { HD2DScene } from './HD2DScene';
import { AssetManager } from './AssetManager';
import { TownScene } from '../scenes/TownScene';
import { CombatScene } from '../scenes/CombatScene';
import { DungeonScene } from '../scenes/DungeonScene';
import { MainMenuScene } from '../scenes/MainMenuScene';

export type SceneType = 'mainMenu' | 'town' | 'dungeon' | 'combat';

export class SceneManager {
  private engine: BABYLON.Engine;
  private scenes: Map<SceneType, HD2DScene> = new Map();
  private _activeScene?: HD2DScene;
  private assetManager: AssetManager;
  private transitionInProgress: boolean = false;
  
  constructor(engine: BABYLON.Engine, assetManager: AssetManager) {
    this.engine = engine;
    this.assetManager = assetManager;
  }
  
  public get activeScene(): HD2DScene {
    if (!this._activeScene) {
      throw new Error('No active scene');
    }
    return this._activeScene;
  }
  
  public async loadScene(sceneType: SceneType, data?: any): Promise<void> {
    if (this.transitionInProgress) {
      console.warn('Scene transition already in progress');
      return;
    }
    
    this.transitionInProgress = true;
    
    try {
      console.log(`Loading scene: ${sceneType}`);
      
      // Show loading screen
      this.showLoadingScreen();
      
      // Check if scene already exists
      let scene = this.scenes.get(sceneType);
      
      if (!scene) {
        // Create new scene
        console.log(`Creating new scene: ${sceneType}`);
        scene = await this.createScene(sceneType);
        this.scenes.set(sceneType, scene);
        
        // Initialize scene with data
        await scene.initialize(data);
      }
      
      // Transition to new scene
      await this.transitionToScene(scene);
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      console.log(`Scene loaded successfully: ${sceneType}`);
      
    } catch (error) {
      console.error('Failed to load scene:', error);
      this.hideLoadingScreen();
      throw error;
    } finally {
      this.transitionInProgress = false;
    }
  }
  
  private async createScene(sceneType: SceneType): Promise<HD2DScene> {
    switch (sceneType) {
      case 'mainMenu':
        return new MainMenuScene(this.engine);
      case 'town':
        return new TownScene(this.engine);
      case 'dungeon':
        return new DungeonScene(this.engine);
      case 'combat':
        return new CombatScene(this.engine);
      default:
        throw new Error(`Unknown scene type: ${sceneType}`);
    }
  }
  
  private async transitionToScene(newScene: HD2DScene): Promise<void> {
    console.log('Transitioning to new scene...');
    
    // Fade out current scene
    if (this._activeScene) {
      await this.fadeOut(this._activeScene);
      
      // Deactivate current scene
      this._activeScene.detachControl();
    }
    
    // Set new active scene
    this._activeScene = newScene;
    
    // Activate new scene
    this._activeScene.attachControl();
    this._activeScene.setupUpdateLoop();
    
    // Make it the active scene for rendering
    this.engine.scenes.forEach(scene => {
      if (scene === newScene) {
        scene.setActiveCameraByName('mainCamera');
      } else {
        scene.setActiveCameraByName('null');
      }
    });
    
    // Fade in new scene
    await this.fadeIn(this._activeScene);
  }
  
  private async fadeOut(scene: HD2DScene): Promise<void> {
    return new Promise((resolve) => {
      // For now, just resolve immediately
      // TODO: Implement proper fade effect
      resolve();
    });
  }
  
  private async fadeIn(scene: HD2DScene): Promise<void> {
    return new Promise((resolve) => {
      // For now, just resolve immediately
      // TODO: Implement proper fade effect
      resolve();
    });
  }
  
  private showLoadingScreen(): void {
    this.engine.displayLoadingUI();
  }
  
  private hideLoadingScreen(): void {
    this.engine.hideLoadingUI();
  }
  
  public dispose(): void {
    this.scenes.forEach(scene => scene.dispose());
    this.scenes.clear();
  }
}