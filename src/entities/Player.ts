import Phaser from 'phaser';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  texture: string;
  frameWidth: number;
  frameHeight: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private facingDirection: 'up' | 'down' | 'left' | 'right' = 'down'; // For animations
  private currentState: 'idle' | 'run' | 'attack1' | 'attack2' = 'idle';
  private moveSpeed: number = 120;
  
  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, config.texture);
    
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);
    
    // Set up physics body to match actual character size (22x34) within the frame
    this.setSize(22, 34);
    // Center the physics body since character is centered in the 96x80 frame
    this.setOffset((config.frameWidth - 22) / 2, (config.frameHeight - 34) / 2);
    
    // Debug: show frame bounds
    if (config.scene.game.config.physics.arcade?.debug) {
      this.setDebug(true, true, 0x00ff00);
    }
    
    // Create animations
    this.createAnimations();
    
    // Start with idle animation
    this.play(`idle_${this.facingDirection}`);
    
    // Add shadow
    this.createShadow();
  }
  
  private createShadow(): void {
    const shadow = this.scene.add.ellipse(this.x, this.y + 10, 24, 12, 0x000000, 0.3);
    shadow.setDepth(this.depth - 1);
    
    // Update shadow position in preUpdate
    this.scene.events.on('preupdate', () => {
      shadow.x = this.x;
      shadow.y = this.y + 10;
      shadow.setDepth(this.y - 1);
    });
  }
  
  private createAnimations(): void {
    const directions = ['up', 'down', 'left', 'right'];
    const animations = [
      { key: 'idle', frames: 8, frameRate: 8 },
      { key: 'run', frames: 8, frameRate: 12 },
      { key: 'attack1', frames: 8, frameRate: 12 },  // Normal speed attack
      { key: 'attack2', frames: 8, frameRate: 12 }   // Normal speed attack
    ];
    
    // Create animations for each direction and action
    directions.forEach(dir => {
      animations.forEach(anim => {
        const animKey = `${anim.key}_${dir}`;
        const frameKey = `player_${anim.key}_${dir}`;
        
        // Check if the animation already exists
        if (this.scene.anims.exists(animKey)) {
          return;
        }
        
        try {
          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(frameKey, { 
              start: 0, 
              end: anim.frames - 1 
            }),
            frameRate: anim.frameRate,
            repeat: anim.key === 'idle' || anim.key === 'run' ? -1 : 0
          });
        } catch (error) {
          // Silently handle missing animations
        }
      });
    });
  }
  
  public move(direction: 'up' | 'down' | 'left' | 'right'): void {
    // Don't move if attacking
    if (this.currentState === 'attack1' || this.currentState === 'attack2') {
      return;
    }
    
    this.currentDirection = direction;
    this.currentState = 'run';
    
    // Set velocity based on direction
    switch (direction) {
      case 'up':
        this.setVelocity(0, -this.moveSpeed);
        break;
      case 'down':
        this.setVelocity(0, this.moveSpeed);
        break;
      case 'left':
        this.setVelocity(-this.moveSpeed, 0);
        break;
      case 'right':
        this.setVelocity(this.moveSpeed, 0);
        break;
    }
    
    this.facingDirection = direction;
    this.play(`run_${this.facingDirection}`, true);
  }
  
  public move8Dir(horizontal: number, vertical: number): void {
    if (horizontal === 0 && vertical === 0) {
      this.stop();
      return;
    }
    
    // Calculate speed - half speed when attacking
    const attackSpeedMultiplier = (this.currentState === 'attack1' || this.currentState === 'attack2') ? 0.5 : 1;
    
    // Calculate diagonal speed (normalize to maintain consistent speed)
    const diagonalSpeed = this.moveSpeed / Math.sqrt(2);
    const isDiagonal = horizontal !== 0 && vertical !== 0;
    const speed = (isDiagonal ? diagonalSpeed : this.moveSpeed) * attackSpeedMultiplier;
    
    // Set velocity
    this.setVelocity(horizontal * speed, vertical * speed);
    
    // Determine facing direction for animation
    // Prioritize horizontal direction for diagonals
    if (horizontal !== 0) {
      this.facingDirection = horizontal > 0 ? 'right' : 'left';
    } else if (vertical !== 0) {
      this.facingDirection = vertical > 0 ? 'down' : 'up';
    }
    
    // For pure diagonals, we can also consider vertical direction
    if (isDiagonal && Math.abs(vertical) > Math.abs(horizontal)) {
      this.facingDirection = vertical > 0 ? 'down' : 'up';
    }
    
    // Don't change state or animation if attacking
    if (this.currentState !== 'attack1' && this.currentState !== 'attack2') {
      this.currentState = 'run';
      this.play(`run_${this.facingDirection}`, true);
    }
  }
  
  public moveTowards(x: number, y: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
    const velocity = this.scene.physics.velocityFromAngle(
      Phaser.Math.RadToDeg(angle), 
      this.moveSpeed
    );
    
    this.setVelocity(velocity.x, velocity.y);
    
    // Determine direction based on angle
    if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
      this.currentDirection = velocity.x > 0 ? 'right' : 'left';
    } else {
      this.currentDirection = velocity.y > 0 ? 'down' : 'up';
    }
    
    this.currentState = 'run';
    this.play(`run_${this.currentDirection}`, true);
  }
  
  public stop(): void {
    // Don't stop if we're attacking
    if (this.currentState === 'attack1' || this.currentState === 'attack2') {
      return;
    }
    
    this.setVelocity(0, 0);
    this.currentState = 'idle';
    this.play(`idle_${this.facingDirection}`, true);
  }
  
  public attack(type: 1 | 2 = 1): void {
    if (this.currentState === 'attack1' || this.currentState === 'attack2') {
      return; // Already attacking
    }
    
    // Don't stop movement anymore - allow moving while attacking
    this.currentState = type === 1 ? 'attack1' : 'attack2';
    
    const animKey = `${this.currentState}_${this.facingDirection}`;
    
    // Check if animation exists
    if (!this.scene.anims.exists(animKey)) {
      this.currentState = 'idle';
      return;
    }
    
    this.play(animKey);
    
    // Return to idle after attack animation completes
    this.once('animationcomplete', () => {
      this.currentState = 'idle';
      // Only play idle if we're not moving
      if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
        this.play(`idle_${this.facingDirection}`, true);
      } else {
        this.play(`run_${this.facingDirection}`, true);
        this.currentState = 'run';
      }
    });
  }
  
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    
    // Update depth based on Y position for 2.5D sorting
    this.setDepth(this.y);
    
  }
}