import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class TestScene extends BABYLON.Scene {
  private camera!: BABYLON.UniversalCamera;
  
  constructor(engine: BABYLON.Engine) {
    super(engine);
    this.setup();
  }
  
  private setup(): void {
    // Simple camera
    this.camera = new BABYLON.UniversalCamera(
      'camera',
      new BABYLON.Vector3(0, 5, -10),
      this
    );
    this.camera.setTarget(BABYLON.Vector3.Zero());
    this.camera.attachControl(this.getEngine().getRenderingCanvas(), true);
    
    // Light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this);
    
    // Simple box
    const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, this);
    box.position.y = 1;
    
    // GUI
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    const button = GUI.Button.CreateSimpleButton('but', 'Click Me!');
    button.width = '150px';
    button.height = '40px';
    button.color = 'white';
    button.background = 'green';
    button.onPointerUpObservable.add(() => {
      alert('Button clicked!');
      console.log('Button was clicked!');
    });
    
    advancedTexture.addControl(button);
    
    console.log('Test scene setup complete');
  }
}