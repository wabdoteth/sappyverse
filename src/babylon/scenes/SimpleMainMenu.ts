import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class SimpleMainMenu extends BABYLON.Scene {
  private camera!: BABYLON.FreeCamera;
  private gui!: GUI.AdvancedDynamicTexture;
  
  constructor(engine: BABYLON.Engine) {
    super(engine);
    this.initialize();
  }
  
  private initialize(): void {
    console.log('Initializing Simple Main Menu');
    
    // Set background color
    this.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
    
    // Create camera
    this.camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -1), this);
    this.camera.setTarget(BABYLON.Vector3.Zero());
    
    // Create light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this);
    
    // Create GUI
    this.createGUI();
    
    // Make this the active camera
    this.activeCamera = this.camera;
  }
  
  private createGUI(): void {
    console.log('Creating GUI');
    
    // Create fullscreen UI
    this.gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, this);
    
    // Title
    const title = new GUI.TextBlock();
    title.text = 'SHARDS OF THE WITHERING WILDS';
    title.color = 'white';
    title.fontSize = 48;
    title.fontFamily = 'monospace';
    title.top = -200;
    title.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(title);
    
    // Create a rectangle background for the button
    const buttonBg = new GUI.Rectangle();
    buttonBg.width = '200px';
    buttonBg.height = '60px';
    buttonBg.color = 'white';
    buttonBg.thickness = 2;
    buttonBg.background = '#4a3c28';
    buttonBg.cornerRadius = 5;
    buttonBg.top = 50;
    buttonBg.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    
    // Create button text
    const buttonText = new GUI.TextBlock();
    buttonText.text = 'START GAME';
    buttonText.color = 'white';
    buttonText.fontSize = 24;
    buttonText.fontFamily = 'monospace';
    
    // Add text to rectangle
    buttonBg.addControl(buttonText);
    
    // Make it interactive
    buttonBg.isPointerBlocker = true;
    buttonBg.onPointerUpObservable.add(() => {
      console.log('Start button clicked!');
      this.startGame();
    });
    
    buttonBg.onPointerEnterObservable.add(() => {
      buttonBg.background = '#5a4c38';
    });
    
    buttonBg.onPointerOutObservable.add(() => {
      buttonBg.background = '#4a3c28';
    });
    
    this.gui.addControl(buttonBg);
    
    // HD-2D label
    const hdLabel = new GUI.TextBlock();
    hdLabel.text = 'HD-2D Edition';
    hdLabel.color = '#ffd700';
    hdLabel.fontSize = 20;
    hdLabel.fontFamily = 'monospace';
    hdLabel.top = 150;
    hdLabel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.gui.addControl(hdLabel);
    
    console.log('GUI created successfully');
  }
  
  private startGame(): void {
    console.log('Starting game - transitioning to town scene');
    // Get the game instance
    const game = (window as any).game;
    if (game && game.sceneManager) {
      game.sceneManager.loadScene('town');
    } else {
      console.error('Game instance not found!');
    }
  }
}