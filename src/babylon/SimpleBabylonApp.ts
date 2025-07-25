// Using namespace imports which might work better with some module systems
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class SimpleBabylonApp {
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  
  constructor(canvasId: string) {
    console.log('SimpleBabylonApp: Starting...');
    
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas not found: ' + canvasId);
    }
    
    // Create engine and scene
    this.engine = new BABYLON.Engine(canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);
    
    // Setup scene
    this.setupScene();
    
    // Create GUI
    this.createMainMenu();
    
    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    console.log('SimpleBabylonApp: Initialized successfully');
  }
  
  private setupScene(): void {
    // Camera
    const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -10), this.scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    
    // Light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
    
    // A simple rotating box to show 3D is working
    const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, this.scene);
    box.position.y = -3;
    
    // Rotate the box
    this.scene.registerBeforeRender(() => {
      box.rotation.y += 0.01;
      box.rotation.x += 0.005;
    });
  }
  
  private createMainMenu(): void {
    console.log('Creating main menu GUI...');
    
    // Create fullscreen UI
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, this.scene);
    
    // Title
    const title = new GUI.TextBlock('title');
    title.text = 'SHARDS OF THE WITHERING WILDS';
    title.color = 'white';
    title.fontSize = 48;
    title.fontFamily = 'monospace';
    title.top = -100;
    title.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(title);
    
    // Start button
    const startButton = GUI.Button.CreateSimpleButton('startButton', 'START GAME');
    startButton.width = '200px';
    startButton.height = '60px';
    startButton.color = 'white';
    startButton.fontSize = 24;
    startButton.fontFamily = 'monospace';
    startButton.background = '#4a3c28';
    startButton.top = 50;
    startButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    startButton.thickness = 2;
    startButton.cornerRadius = 5;
    
    // Button events
    startButton.onPointerUpObservable.add(() => {
      console.log('Start button clicked!');
      this.startGame();
    });
    
    startButton.onPointerEnterObservable.add(() => {
      startButton.background = '#5a4c38';
    });
    
    startButton.onPointerOutObservable.add(() => {
      startButton.background = '#4a3c28';
    });
    
    advancedTexture.addControl(startButton);
    
    // HD-2D label
    const hdLabel = new GUI.TextBlock('hdLabel');
    hdLabel.text = 'HD-2D Edition';
    hdLabel.color = '#ffd700';
    hdLabel.fontSize = 20;
    hdLabel.fontFamily = 'monospace';
    hdLabel.top = 150;
    hdLabel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(hdLabel);
    
    // Debug info
    const debugInfo = new GUI.TextBlock('debug');
    debugInfo.text = 'Click the button to start';
    debugInfo.color = '#888888';
    debugInfo.fontSize = 14;
    debugInfo.top = 200;
    debugInfo.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(debugInfo);
    
    console.log('Main menu created');
  }
  
  private startGame(): void {
    console.log('Starting game...');
    
    // For now, just change the debug text
    const debugText = this.scene.getNodeByName('debug') as GUI.TextBlock;
    if (debugText) {
      debugText.text = 'Game started! (Town scene would load here)';
      debugText.color = '#00ff00';
    }
    
    // TODO: Load town scene
  }
}