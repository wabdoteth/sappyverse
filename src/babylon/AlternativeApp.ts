// Alternative approach using different event handling
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';

// Import entire GUI module then destructure
import * as GUI from '@babylonjs/gui/2D';

export class AlternativeApp {
  private engine: Engine;
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  
  constructor(canvasId: string) {
    console.log('AlternativeApp: Starting initialization...');
    
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }
    
    this.init();
  }
  
  private async init(): Promise<void> {
    // Create engine
    this.engine = new Engine(this.canvas, true);
    
    // Create scene
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.2, 0.2, 0.3, 1);
    
    // Camera
    const camera = new FreeCamera('camera', new Vector3(0, 5, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(this.canvas, true);
    
    // Light
    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    
    // Simple mesh
    const box = CreateBox('box', { size: 2 }, this.scene);
    this.scene.registerBeforeRender(() => {
      box.rotation.y += 0.01;
    });
    
    // Wait a frame before creating GUI
    await this.scene.whenReadyAsync();
    
    // Create GUI with alternative approach
    this.createGUIAlternative();
    
    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    
    // Resize handling
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    console.log('AlternativeApp: Initialization complete');
  }
  
  private createGUIAlternative(): void {
    console.log('Creating GUI with alternative approach...');
    
    // Create fullscreen UI
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Create a panel to hold our controls
    const panel = new GUI.StackPanel();
    panel.width = '400px';
    panel.height = '400px';
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(panel);
    
    // Title
    const title = new GUI.TextBlock();
    title.text = 'ALTERNATIVE BABYLON APP';
    title.height = '60px';
    title.color = 'white';
    title.fontSize = 32;
    panel.addControl(title);
    
    // Spacer
    const spacer = new GUI.Rectangle();
    spacer.height = '40px';
    spacer.thickness = 0;
    panel.addControl(spacer);
    
    // Button with manual event handling
    const button = GUI.Button.CreateSimpleButton('btn', 'CLICK ME');
    button.width = '200px';
    button.height = '50px';
    button.color = 'white';
    button.background = 'green';
    button.cornerRadius = 10;
    panel.addControl(button);
    
    // Use all available event types
    button.onPointerUpObservable.add(() => {
      console.log('onPointerUp fired!');
      this.handleButtonClick();
    });
    
    button.onPointerClickObservable.add(() => {
      console.log('onPointerClick fired!');
    });
    
    button.onPointerDownObservable.add(() => {
      console.log('onPointerDown fired!');
    });
    
    // Alternative: Use scene pointer observable
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          console.log('Scene pointer down at:', pointerInfo.event.clientX, pointerInfo.event.clientY);
          break;
        case PointerEventTypes.POINTERUP:
          console.log('Scene pointer up');
          break;
        case PointerEventTypes.POINTERMOVE:
          // Too noisy, comment out if needed
          // console.log('Scene pointer move');
          break;
      }
    });
    
    // Add debug text
    const debugText = new GUI.TextBlock();
    debugText.text = 'Waiting for button click...';
    debugText.height = '30px';
    debugText.color = 'yellow';
    debugText.fontSize = 16;
    debugText.paddingTop = '20px';
    panel.addControl(debugText);
    
    // Store reference for later
    (this as any).debugText = debugText;
    
    console.log('GUI creation complete');
  }
  
  private handleButtonClick(): void {
    console.log('Button was clicked!');
    
    const debugText = (this as any).debugText as GUI.TextBlock;
    if (debugText) {
      debugText.text = 'Button clicked at ' + new Date().toLocaleTimeString();
      debugText.color = '#00ff00';
    }
  }
}