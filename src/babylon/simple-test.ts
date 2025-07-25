// Simple test to verify Babylon.js is working
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';

window.addEventListener('DOMContentLoaded', () => {
  console.log('Simple test starting...');
  
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }
  
  console.log('Canvas found:', canvas.width, 'x', canvas.height);
  
  // Create engine
  const engine = new Engine(canvas, true);
  console.log('Engine created');
  
  // Create scene
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.2, 0.3, 0.4, 1);
  console.log('Scene created');
  
  // Create camera
  const camera = new FreeCamera('camera', new Vector3(0, 5, -10), scene);
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, true);
  console.log('Camera created');
  
  // Create light
  new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  console.log('Light created');
  
  // Create box
  const box = CreateBox('box', { size: 2 }, scene);
  box.position.y = 1;
  
  // Add material to make it visible
  const material = new StandardMaterial('boxMat', scene);
  material.diffuseColor = new Color3(1, 0, 0); // Red color
  box.material = material;
  
  console.log('Box created with material');
  
  // Start render loop
  engine.runRenderLoop(() => {
    box.rotation.y += 0.01;
    box.rotation.x += 0.005;
    scene.render();
  });
  console.log('Render loop started');
  
  // Resize
  window.addEventListener('resize', () => {
    engine.resize();
  });
});