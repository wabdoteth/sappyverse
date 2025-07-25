// Solution based on the working standalone HTML pattern
// Import everything we need with proper paths
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

// GUI - import from 2D submodule
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Control } from '@babylonjs/gui/2D/controls/control';

// Side effects
import '@babylonjs/core/Meshes/meshBuilder';

export function createBabylonApp(canvas: HTMLCanvasElement): void {
  console.log('Creating Babylon.js app...');
  
  // Create engine
  const engine = new Engine(canvas, true);
  
  // Create scene
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.2, 0.2, 0.3, 1);
  
  // Create camera
  const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, true);
  
  // Create light
  new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
  
  // Create a box
  const box = MeshBuilder.CreateBox('box1', { size: 2 }, scene);
  box.position.y = 1;
  
  // GUI must be created after scene is initialized
  scene.executeWhenReady(() => {
    console.log('Scene ready, creating GUI...');
    
    // Create fullscreen UI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    
    // Create button exactly like the working standalone version
    const button = Button.CreateSimpleButton('but1', 'Click Me');
    button.width = '150px';
    button.height = '40px';
    button.color = 'white';
    button.cornerRadius = 20;
    button.background = 'green';
    button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
    // Add click handler
    button.onPointerUpObservable.add(function() {
      alert('Button clicked!');
      console.log('Button has been clicked!');
    });
    
    // Add to texture
    advancedTexture.addControl(button);
    
    console.log('GUI created successfully');
  });
  
  // Animation
  scene.registerBeforeRender(() => {
    box.rotation.y += 0.01;
  });
  
  // Run render loop
  engine.runRenderLoop(() => {
    scene.render();
  });
  
  // Watch for browser/canvas resize
  window.addEventListener('resize', () => {
    engine.resize();
  });
  
  console.log('App initialized');
}