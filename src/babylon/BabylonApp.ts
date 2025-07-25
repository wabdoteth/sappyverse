import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { GameStateManager } from '../systems/GameStateManager';
import { TownScene } from './scenes/TownScene';

export class BabylonApp {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private currentScene?: BABYLON.Scene;
  
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas not found');
    }
    
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: false
    });
    
    this.init();
  }
  
  private init(): void {
    // Create main menu
    this.createMainMenu();
    
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
  
  private createMainMenu(): void {
    console.log('Creating main menu...');
    
    // Create scene
    const scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
    
    // Create camera
    const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    
    // Create light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    
    // Create GUI
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
    
    // Create stack panel for layout
    const panel = new GUI.StackPanel();
    panel.width = "100%";
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(panel);
    
    // Add title
    const title = new GUI.TextBlock();
    title.text = "SHARDS OF THE WITHERING WILDS";
    title.color = "white";
    title.fontSize = 48;
    title.fontFamily = "monospace";
    title.height = "80px";
    panel.addControl(title);
    
    // Add spacing
    const spacer1 = new GUI.Rectangle();
    spacer1.height = "50px";
    spacer1.thickness = 0;
    panel.addControl(spacer1);
    
    // Create start button
    const startButton = GUI.Button.CreateSimpleButton("startButton", "START GAME");
    startButton.width = "200px";
    startButton.height = "60px";
    startButton.color = "white";
    startButton.fontSize = 24;
    startButton.fontFamily = "monospace";
    startButton.background = "#4a3c28";
    startButton.cornerRadius = 5;
    startButton.thickness = 2;
    
    startButton.onPointerUpObservable.add(() => {
      console.log("Start button clicked!");
      this.startGame();
    });
    
    startButton.onPointerEnterObservable.add(() => {
      startButton.background = "#5a4c38";
    });
    
    startButton.onPointerOutObservable.add(() => {
      startButton.background = "#4a3c28";
    });
    
    panel.addControl(startButton);
    
    // Add spacing
    const spacer2 = new GUI.Rectangle();
    spacer2.height = "50px";
    spacer2.thickness = 0;
    panel.addControl(spacer2);
    
    // Add HD-2D label
    const hdLabel = new GUI.TextBlock();
    hdLabel.text = "HD-2D Edition";
    hdLabel.color = "#ffd700";
    hdLabel.fontSize = 20;
    hdLabel.fontFamily = "monospace";
    hdLabel.height = "30px";
    panel.addControl(hdLabel);
    
    this.currentScene = scene;
    console.log('Main menu created successfully');
  }
  
  private startGame(): void {
    console.log('Starting game...');
    
    // Dispose current scene
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    
    // Create town scene
    this.createTownScene();
  }
  
  private createTownScene(): void {
    console.log('Creating town scene...');
    
    const townScene = new TownScene(this.engine);
    townScene.initialize().then(() => {
      this.currentScene = townScene;
      console.log('Town scene loaded');
    }).catch(error => {
      console.error('Failed to load town scene:', error);
    });
  }
}