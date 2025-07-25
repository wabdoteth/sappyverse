// Main menu scene with proper ES module imports
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

// Required side effects
import '@babylonjs/core/Meshes/meshBuilder';

// GUI imports
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Control } from '@babylonjs/gui/2D/controls/control';

export class MainMenuScene extends Scene {
  public onStartGame?: () => void;
  
  constructor(engine: Engine) {
    super(engine);
    console.log('MainMenuScene constructor');
    
    // Set background color
    this.clearColor = new Color4(0.1, 0.1, 0.2, 1);
    
    // Create camera
    const camera = new FreeCamera('menuCamera', new Vector3(0, 0, -10), this);
    camera.setTarget(Vector3.Zero());
    
    // Create light
    new HemisphericLight('menuLight', new Vector3(0, 1, 0), this);
    
    // Create background
    this.createBackground();
    
    // Create GUI when scene is ready
    this.executeWhenReady(() => {
      this.createGUI();
    });
  }
  
  private createBackground(): void {
    // Create animated background boxes
    for (let i = 0; i < 5; i++) {
      const box = MeshBuilder.CreateBox(`bgBox${i}`, { size: 2 }, this);
      box.position.x = (Math.random() - 0.5) * 20;
      box.position.y = (Math.random() - 0.5) * 10;
      box.position.z = 5 + Math.random() * 10;
      
      const mat = new StandardMaterial(`bgMat${i}`, this);
      mat.emissiveColor = new Color3(0.2, 0.1, 0.3);
      mat.disableLighting = true;
      box.material = mat;
      
      // Animate
      this.registerBeforeRender(() => {
        box.rotation.y += 0.001 * (i + 1);
        box.rotation.x += 0.0005 * (i + 1);
      });
    }
  }
  
  private createGUI(): void {
    // Create fullscreen UI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('MainMenuUI', true, this);
    
    // Title
    const title = new TextBlock('title', 'SHARDS OF THE WITHERING WILDS');
    title.color = 'white';
    title.fontSize = 48;
    title.fontFamily = 'monospace';
    title.top = '-150px';
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(title);
    
    // Subtitle
    const subtitle = new TextBlock('subtitle', 'HD-2D Edition');
    subtitle.color = '#ffd700';
    subtitle.fontSize = 24;
    subtitle.fontFamily = 'monospace';
    subtitle.top = '-80px';
    subtitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(subtitle);
    
    // Start button
    const startButton = Button.CreateSimpleButton('startButton', 'START GAME');
    startButton.width = '200px';
    startButton.height = '60px';
    startButton.color = 'white';
    startButton.fontSize = 24;
    startButton.fontFamily = 'monospace';
    startButton.background = '#4a3c28';
    startButton.thickness = 2;
    startButton.cornerRadius = 5;
    startButton.top = '50px';
    startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    
    // Button click handler
    startButton.onPointerClickObservable.add(() => {
      console.log('Start button clicked!');
      if (this.onStartGame) {
        this.onStartGame();
      }
    });
    
    // Hover effects
    startButton.onPointerEnterObservable.add(() => {
      startButton.background = '#5a4c38';
    });
    
    startButton.onPointerOutObservable.add(() => {
      startButton.background = '#4a3c28';
    });
    
    advancedTexture.addControl(startButton);
    
    // Version info
    const version = new TextBlock('version', 'v0.1.0 - Early Development');
    version.color = '#888888';
    version.fontSize = 14;
    version.fontFamily = 'monospace';
    version.top = '150px';
    version.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(version);
  }
}