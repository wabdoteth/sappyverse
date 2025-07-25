// Minimal Babylon.js app with working GUI
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, Color4 } from '@babylonjs/core';
import { AdvancedDynamicTexture, Button, TextBlock, Control } from '@babylonjs/gui';

export class MinimalApp {
  private engine: Engine;
  private scene: Scene;
  
  constructor(canvas: HTMLCanvasElement) {
    console.log('Creating Babylon.js engine...');
    
    // Create engine
    this.engine = new Engine(canvas, true);
    
    // Create scene
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);
    
    // Create camera
    const camera = new FreeCamera('camera', new Vector3(0, 0, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    
    // Create light
    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    
    // Create a simple box to show 3D is working
    const box = MeshBuilder.CreateBox('box', { size: 2 }, this.scene);
    box.position.y = -2;
    
    // Create GUI
    this.createGUI();
    
    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    console.log('Babylon.js app initialized');
  }
  
  private createGUI(): void {
    console.log('Creating GUI...');
    
    // Create fullscreen UI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Create title
    const title = new TextBlock();
    title.text = 'SHARDS OF THE WITHERING WILDS';
    title.color = 'white';
    title.fontSize = 48;
    title.fontFamily = 'monospace';
    title.top = '-100px';
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(title);
    
    // Create button
    const button = Button.CreateSimpleButton('startButton', 'START GAME');
    button.width = '200px';
    button.height = '60px';
    button.top = '50px';
    button.color = 'white';
    button.fontSize = 24;
    button.fontFamily = 'monospace';
    button.background = 'green';
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
    // Add click handler
    button.onPointerUpObservable.add(() => {
      console.log('Button clicked!');
      alert('Button clicked! Check console.');
      button.textBlock!.text = 'CLICKED!';
    });
    
    // Add hover effects
    button.onPointerEnterObservable.add(() => {
      console.log('Button hover');
      button.background = 'lightgreen';
    });
    
    button.onPointerOutObservable.add(() => {
      console.log('Button hover out');
      button.background = 'green';
    });
    
    // Add button to UI
    advancedTexture.addControl(button);
    
    // Create a debug label
    const debugLabel = new TextBlock();
    debugLabel.text = 'GUI is loaded. Try clicking the button.';
    debugLabel.color = '#ffd700';
    debugLabel.fontSize = 16;
    debugLabel.top = '150px';
    debugLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(debugLabel);
    
    console.log('GUI created successfully');
  }
  
  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}