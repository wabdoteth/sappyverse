import * as BABYLON from '@babylonjs/core';
import { HD2DSprite } from './HD2DSprite';

export class PlayerController extends HD2DSprite {
  private moveSpeed: number = 5; // Units per second
  private velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
  private inputVector: BABYLON.Vector3 = BABYLON.Vector3.Zero();
  private keys: { [key: string]: boolean } = {};
  
  constructor(scene: BABYLON.Scene, spriteName: string) {
    // Create placeholder sprite data for now
    super(scene, 'data:placeholder', 32, 32, 8, 64);
    
    // Setup animations
    this.setupAnimations();
    
    // Setup input
    this.setupInput(scene);
    
    // Start with idle animation
    this.playAnimation('idle_down');
  }
  
  private setupAnimations(): void {
    // 8-directional animations
    const directions = ['down', 'down_right', 'right', 'up_right', 'up', 'up_left', 'left', 'down_left'];
    
    directions.forEach((dir, index) => {
      // Idle animations
      this.addAnimation(`idle_${dir}`, index * 8, index * 8, 1, true);
      
      // Walk animations
      this.addAnimation(`walk_${dir}`, index * 8 + 1, index * 8 + 7, 10, true);
    });
  }
  
  private setupInput(scene: BABYLON.Scene): void {
    // Keyboard input
    scene.actionManager = new BABYLON.ActionManager(scene);
    
    // Key down
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (evt) => {
          this.keys[evt.sourceEvent.key.toLowerCase()] = true;
        }
      )
    );
    
    // Key up
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        (evt) => {
          this.keys[evt.sourceEvent.key.toLowerCase()] = false;
        }
      )
    );
  }
  
  public update(deltaTime: number): void {
    // Get input
    this.handleInput();
    
    // Apply movement
    if (this.inputVector.length() > 0) {
      // Normalize input
      this.inputVector.normalize();
      
      // Apply speed
      this.velocity = this.inputVector.scale(this.moveSpeed);
      
      // Update position
      this.position.addInPlace(this.velocity.scale(deltaTime));
      
      // Update direction and animation
      this.updateDirectionAndAnimation();
    } else {
      // Stop moving
      this.velocity = BABYLON.Vector3.Zero();
      
      // Play idle animation
      const currentDir = this.getDirectionName(this.direction);
      this.playAnimation(`idle_${currentDir}`);
    }
    
    // Update sprite (includes pixel snapping)
    super.update(deltaTime);
  }
  
  private handleInput(): void {
    this.inputVector = BABYLON.Vector3.Zero();
    
    // WASD and Arrow keys
    if (this.keys['w'] || this.keys['arrowup']) {
      this.inputVector.z = 1;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.inputVector.z = -1;
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.inputVector.x = -1;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.inputVector.x = 1;
    }
  }
  
  private updateDirectionAndAnimation(): void {
    // Calculate direction from velocity
    const angle = Math.atan2(this.velocity.x, this.velocity.z);
    const octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
    
    this.setDirection(octant);
    
    // Play walk animation for current direction
    const dirName = this.getDirectionName(octant);
    this.playAnimation(`walk_${dirName}`);
  }
  
  private getDirectionName(direction: number): string {
    const directions = ['down', 'down_right', 'right', 'up_right', 'up', 'up_left', 'left', 'down_left'];
    return directions[direction] || 'down';
  }
  
  public get mesh(): BABYLON.Mesh {
    return super.mesh;
  }
}