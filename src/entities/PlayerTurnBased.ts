import Phaser from 'phaser';
import { GameStateManager } from '../systems/GameStateManager';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  texture: string;
  frameWidth: number;
  frameHeight: number;
}

export class PlayerTurnBased extends Phaser.Physics.Arcade.Sprite {
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private currentState: 'idle' | 'run' = 'idle';
  private moveSpeed: number = 120;
  
  // Combat properties from GameStateManager
  public id: string = 'player';
  public hp: number = 10;
  public maxHp: number = 10;
  public barrier: number = 0;
  public maxBarrier: number = 3;
  
  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, config.texture);
    
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);
    
    // Set up physics body
    this.setSize(22, 34);
    this.setOffset((config.frameWidth - 22) / 2, (config.frameHeight - 34) / 2);
    
    // Load state from GameStateManager
    this.loadStateFromGameManager();
    
    // Create animations
    this.createAnimations();
    
    // Play initial idle animation
    this.play('player_idle_down');
  }
  
  private loadStateFromGameManager(): void {
    const gameState = GameStateManager.getInstance();
    const playerState = gameState.getPlayerState();
    
    if (playerState) {
      this.hp = playerState.hp;
      this.maxHp = playerState.maxHp;
      this.barrier = playerState.barrier;
      this.maxBarrier = playerState.maxBarrier;
    }
  }
  
  private createAnimations(): void {
    const scene = this.scene;
    
    // Idle animations
    ['up', 'down', 'left', 'right'].forEach(dir => {
      scene.anims.create({
        key: `player_idle_${dir}`,
        frames: [{ key: `player_idle_${dir}`, frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    });
    
    // Run animations (assuming these exist)
    ['up', 'down', 'left', 'right'].forEach(dir => {
      if (scene.textures.exists(`player_run_${dir}`)) {
        scene.anims.create({
          key: `player_run_${dir}`,
          frames: scene.anims.generateFrameNumbers(`player_run_${dir}`, { start: 0, end: 3 }),
          frameRate: 8,
          repeat: -1
        });
      }
    });
  }
  
  public move8Dir(horizontal: number, vertical: number): void {
    // Stop if no input
    if (horizontal === 0 && vertical === 0) {
      this.stop();
      return;
    }
    
    // Normalize diagonal movement
    let velocityX = horizontal * this.moveSpeed;
    let velocityY = vertical * this.moveSpeed;
    
    if (horizontal !== 0 && vertical !== 0) {
      // Diagonal movement - normalize to maintain consistent speed
      const factor = 0.707; // 1/sqrt(2)
      velocityX *= factor;
      velocityY *= factor;
    }
    
    this.setVelocity(velocityX, velocityY);
    
    // Update direction based on input
    if (Math.abs(horizontal) > Math.abs(vertical)) {
      this.currentDirection = horizontal > 0 ? 'right' : 'left';
    } else {
      this.currentDirection = vertical > 0 ? 'down' : 'up';
    }
    
    // Update animation state
    if (this.currentState !== 'run') {
      this.currentState = 'run';
      this.facingDirection = this.currentDirection;
      this.updateAnimation();
    } else if (this.facingDirection !== this.currentDirection) {
      this.facingDirection = this.currentDirection;
      this.updateAnimation();
    }
  }
  
  public stop(): void {
    this.setVelocity(0, 0);
    
    if (this.currentState !== 'idle') {
      this.currentState = 'idle';
      this.updateAnimation();
    }
  }
  
  private updateAnimation(): void {
    const animKey = `player_${this.currentState}_${this.facingDirection}`;
    
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey, true);
    } else {
      // Fallback to idle if animation doesn't exist
      const fallbackKey = `player_idle_${this.facingDirection}`;
      if (this.scene.anims.exists(fallbackKey)) {
        this.play(fallbackKey, true);
      }
    }
  }
  
  public takeDamage(amount: number): void {
    // In turn-based combat, damage is handled by GameStateManager
    // This is just for visual feedback if needed
    this.scene.cameras.main.shake(200, 0.01);
  }
  
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    
    // Update depth based on Y position for proper sprite layering
    this.setDepth(this.y);
  }
}