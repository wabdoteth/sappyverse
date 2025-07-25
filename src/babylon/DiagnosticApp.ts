// Diagnostic app to debug module loading and event issues
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';

// Try different import patterns
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Control } from '@babylonjs/gui/2D/controls/control';

export class DiagnosticApp {
  private engine: Engine;
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private logs: string[] = [];
  
  constructor(canvasId: string) {
    this.log('DiagnosticApp constructor called');
    
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }
    
    this.log(`Canvas found: ${this.canvas.width}x${this.canvas.height}`);
    
    // Check if modules loaded correctly
    this.checkModules();
    
    // Initialize app
    this.initialize();
  }
  
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }
  
  private checkModules(): void {
    this.log('Checking module imports...');
    
    // Check core modules
    this.log(`Engine available: ${typeof Engine !== 'undefined'}`);
    this.log(`Scene available: ${typeof Scene !== 'undefined'}`);
    
    // Check GUI modules
    this.log(`AdvancedDynamicTexture available: ${typeof AdvancedDynamicTexture !== 'undefined'}`);
    this.log(`Button available: ${typeof Button !== 'undefined'}`);
    this.log(`TextBlock available: ${typeof TextBlock !== 'undefined'}`);
    
    // Check methods
    if (typeof AdvancedDynamicTexture !== 'undefined') {
      this.log(`CreateFullscreenUI method: ${typeof AdvancedDynamicTexture.CreateFullscreenUI}`);
    }
    
    if (typeof Button !== 'undefined') {
      this.log(`CreateSimpleButton method: ${typeof Button.CreateSimpleButton}`);
    }
  }
  
  private initialize(): void {
    this.log('Starting initialization...');
    
    try {
      // Engine
      this.engine = new Engine(this.canvas, true);
      this.log('Engine created');
      
      // Scene
      this.scene = new Scene(this.engine);
      this.scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);
      this.log('Scene created');
      
      // Camera
      const camera = new UniversalCamera('camera', new Vector3(0, 0, -10), this.scene);
      camera.setTarget(Vector3.Zero());
      camera.attachControl(this.canvas, true);
      this.log('Camera created and attached');
      
      // Light
      new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
      this.log('Light created');
      
      // Create GUI
      this.createDiagnosticGUI();
      
      // Canvas event listeners for comparison
      this.setupCanvasListeners();
      
      // Start render
      this.engine.runRenderLoop(() => {
        this.scene.render();
      });
      this.log('Render loop started');
      
      // Resize
      window.addEventListener('resize', () => {
        this.engine.resize();
      });
      
    } catch (error) {
      this.log(`Error during initialization: ${error}`);
      console.error(error);
    }
  }
  
  private createDiagnosticGUI(): void {
    this.log('Creating diagnostic GUI...');
    
    try {
      // Create ADT with explicit parameters
      const adt = AdvancedDynamicTexture.CreateFullscreenUI('DiagnosticUI', true, this.scene);
      this.log('AdvancedDynamicTexture created');
      
      // Create container
      const container = new Rectangle('container');
      container.width = '600px';
      container.height = '400px';
      container.thickness = 2;
      container.color = 'white';
      container.background = 'rgba(0,0,0,0.8)';
      adt.addControl(container);
      this.log('Container added');
      
      // Title
      const title = new TextBlock('title', 'DIAGNOSTIC TEST');
      title.color = 'white';
      title.fontSize = 24;
      title.top = '-150px';
      title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      adt.addControl(title);
      this.log('Title added');
      
      // Create multiple buttons with different methods
      this.createTestButton(adt, 'Test Button 1', -50, 'Method: CreateSimpleButton');
      this.createManualButton(adt, 'Test Button 2', 0, 'Method: Manual Creation');
      this.createPlainButton(adt, 'Test Button 3', 50, 'Method: Plain Rectangle');
      
      // Log display
      const logDisplay = new TextBlock('logs', this.logs.slice(-5).join('\n'));
      logDisplay.color = '#00ff00';
      logDisplay.fontSize = 12;
      logDisplay.textWrapping = true;
      logDisplay.height = '100px';
      logDisplay.top = '120px';
      logDisplay.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      adt.addControl(logDisplay);
      
      // Update logs periodically
      setInterval(() => {
        logDisplay.text = this.logs.slice(-5).join('\n');
      }, 100);
      
      this.log('All GUI elements created');
      
    } catch (error) {
      this.log(`Error creating GUI: ${error}`);
      console.error(error);
    }
  }
  
  private createTestButton(adt: AdvancedDynamicTexture, label: string, top: number, method: string): void {
    try {
      const button = Button.CreateSimpleButton(`btn_${label}`, label);
      button.width = '200px';
      button.height = '40px';
      button.color = 'white';
      button.background = 'green';
      button.top = `${top}px`;
      button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      
      // All event types
      button.onPointerUpObservable.add(() => {
        this.log(`${method} - onPointerUp`);
      });
      
      button.onPointerDownObservable.add(() => {
        this.log(`${method} - onPointerDown`);
      });
      
      button.onPointerClickObservable.add(() => {
        this.log(`${method} - onPointerClick`);
      });
      
      button.onPointerEnterObservable.add(() => {
        this.log(`${method} - onPointerEnter`);
      });
      
      adt.addControl(button);
      this.log(`${method} button created`);
      
    } catch (error) {
      this.log(`Error creating ${method}: ${error}`);
    }
  }
  
  private createManualButton(adt: AdvancedDynamicTexture, label: string, top: number, method: string): void {
    try {
      const button = new Button(`btn_${label}`);
      button.width = '200px';
      button.height = '40px';
      button.top = `${top}px`;
      button.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      button.background = 'blue';
      button.color = 'white';
      
      const text = new TextBlock();
      text.text = label;
      text.color = 'white';
      button.addControl(text);
      
      button.onPointerUpObservable.add(() => {
        this.log(`${method} - onPointerUp`);
      });
      
      adt.addControl(button);
      this.log(`${method} button created`);
      
    } catch (error) {
      this.log(`Error creating ${method}: ${error}`);
    }
  }
  
  private createPlainButton(adt: AdvancedDynamicTexture, label: string, top: number, method: string): void {
    try {
      const rect = new Rectangle(`btn_${label}`);
      rect.width = '200px';
      rect.height = '40px';
      rect.top = `${top}px`;
      rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      rect.background = 'red';
      rect.thickness = 2;
      rect.color = 'white';
      
      const text = new TextBlock();
      text.text = label;
      text.color = 'white';
      rect.addControl(text);
      
      rect.onPointerUpObservable.add(() => {
        this.log(`${method} - onPointerUp`);
      });
      
      rect.isPointerBlocker = true;
      
      adt.addControl(rect);
      this.log(`${method} rectangle created`);
      
    } catch (error) {
      this.log(`Error creating ${method}: ${error}`);
    }
  }
  
  private setupCanvasListeners(): void {
    this.log('Setting up canvas event listeners...');
    
    this.canvas.addEventListener('click', (e) => {
      this.log(`Canvas click at: ${e.clientX}, ${e.clientY}`);
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.log(`Canvas mousedown at: ${e.clientX}, ${e.clientY}`);
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      this.log(`Canvas mouseup at: ${e.clientX}, ${e.clientY}`);
    });
  }
}