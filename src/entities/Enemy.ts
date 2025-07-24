import Phaser from 'phaser';
import { CombatEntity } from '../systems/CombatSystem';
import { RPSType, RPSLogic } from '../systems/RPSLogic';

export interface EnemyConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  type: 'brute' | 'hunter' | 'wisp' | 'hybrid';
  depth?: number;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite implements CombatEntity {
  public id: string;
  public hp: number;
  public maxHp: number;
  public damage: number;
  public rpsType: RPSType;
  public enemyType: 'brute' | 'hunter' | 'wisp' | 'hybrid';
  
  private moveSpeed: number;
  private detectionRange: number = 150;
  private attackRange: number = 40;
  private attackCooldown: number = 0;
  private attackCooldownTime: number = 1500;
  private state: 'idle' | 'chasing' | 'attacking' = 'idle';
  private target: Phaser.Physics.Arcade.Sprite | null = null;
  private healthBar: Phaser.GameObjects.Graphics;
  private healthBarBg: Phaser.GameObjects.Graphics;
  private shadow: Phaser.GameObjects.Ellipse;
  private typeIcon: Phaser.GameObjects.Text;
  
  constructor(config: EnemyConfig) {
    // Create simple colored rectangle for now
    const texture = Enemy.createEnemyTexture(config.scene, config.type);
    super(config.scene, config.x, config.y, texture);
    
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);
    
    // Set unique ID
    this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set enemy type
    this.enemyType = config.type;
    
    // Configure based on enemy type
    this.configureEnemy(config.type, config.depth || 1);
    
    // Set physics properties
    this.setSize(24, 32);
    this.setCollideWorldBounds(true);
    
    // Add shadow
    this.createShadow();
    
    // Add type indicator
    this.createTypeIndicator();
    
    // Create health bar
    this.healthBarBg = this.scene.add.graphics();
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }
  
  private static createEnemyTexture(scene: Phaser.Scene, type: string): string {
    const key = `enemy_${type}`;
    
    if (scene.textures.exists(key)) {
      return key;
    }
    
    // Create a simple colored rectangle for the enemy
    const graphics = scene.add.graphics();
    const colors = {
      brute: 0xff4444,
      hunter: 0x44ff44,
      wisp: 0x4444ff,
      hybrid: 0xff44ff
    };
    
    graphics.fillStyle(colors[type as keyof typeof colors] || 0xffffff);
    graphics.fillRect(0, 0, 24, 32);
    graphics.generateTexture(key, 24, 32);
    graphics.destroy();
    
    return key;
  }
  
  private configureEnemy(type: 'brute' | 'hunter' | 'wisp' | 'hybrid', depth: number): void {
    // Base stats that scale with depth
    const depthMultiplier = 1 + (depth - 1) * 0.2;
    
    switch (type) {
      case 'brute':
        this.rpsType = 'melee';
        this.hp = Math.floor(80 * depthMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.floor(15 * depthMultiplier);
        this.moveSpeed = 60;
        this.attackRange = 40;
        break;
        
      case 'hunter':
        this.rpsType = 'ranged';
        this.hp = Math.floor(60 * depthMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.floor(12 * depthMultiplier);
        this.moveSpeed = 80;
        this.attackRange = 100;
        this.detectionRange = 200;
        break;
        
      case 'wisp':
        this.rpsType = 'magic';
        this.hp = Math.floor(50 * depthMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.floor(18 * depthMultiplier);
        this.moveSpeed = 70;
        this.attackRange = 80;
        break;
        
      case 'hybrid':
        // Hybrids start with random type
        this.rpsType = RPSLogic.getRandomType();
        this.hp = Math.floor(100 * depthMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.floor(20 * depthMultiplier);
        this.moveSpeed = 65;
        this.attackRange = 60;
        break;
    }
  }
  
  private createShadow(): void {
    this.shadow = this.scene.add.ellipse(this.x, this.y + 16, 20, 10, 0x000000, 0.3);
    this.shadow.setDepth(this.depth - 1);
    
    // Update shadow position
    const updateShadow = () => {
      if (this.active && this.shadow) {
        this.shadow.x = this.x;
        this.shadow.y = this.y + 16;
        this.shadow.setDepth(this.y - 1);
        this.shadow.setVisible(this.visible);
      }
    };
    
    this.scene.events.on('preupdate', updateShadow);
    
    // Clean up listener on destroy
    this.on('destroy', () => {
      if (this.scene && this.scene.events) {
        this.scene.events.off('preupdate', updateShadow);
      }
      if (this.shadow) {
        this.shadow.destroy();
      }
    });
  }
  
  private createTypeIndicator(): void {
    this.typeIcon = this.scene.add.text(this.x, this.y - 20, RPSLogic.getTypeIcon(this.rpsType), {
      fontSize: '16px',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    this.typeIcon.setOrigin(0.5);
    
    // Update indicator position
    const updateIcon = () => {
      if (this.active && this.typeIcon) {
        this.typeIcon.x = this.x;
        this.typeIcon.y = this.y - 35; // Move up to make room for health bar
        this.typeIcon.setDepth(this.y + 100);
        this.typeIcon.setText(RPSLogic.getTypeIcon(this.rpsType));
        this.typeIcon.setVisible(this.visible);
      }
    };
    
    this.scene.events.on('preupdate', updateIcon);
    
    // Clean up on destroy
    this.on('destroy', () => {
      if (this.scene && this.scene.events) {
        this.scene.events.off('preupdate', updateIcon);
      }
      if (this.typeIcon) {
        this.typeIcon.destroy();
      }
    });
  }
  
  private updateHealthBar(): void {
    const barWidth = 30;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - 22;
    
    // Clear previous graphics
    this.healthBarBg.clear();
    this.healthBar.clear();
    
    if (!this.active || this.hp <= 0) {
      return;
    }
    
    // Background (red)
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    this.healthBarBg.setDepth(this.y + 99);
    
    // Health bar (green to red gradient based on health)
    const healthPercent = this.hp / this.maxHp;
    const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    this.healthBar.setDepth(this.y + 100);
  }
  
  public setTarget(target: Phaser.Physics.Arcade.Sprite): void {
    this.target = target;
  }
  
  private updateAI(): void {
    if (!this.target || !this.target.active) {
      this.state = 'idle';
      this.setVelocity(0, 0);
      return;
    }
    
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.target.x, this.target.y
    );
    
    // State machine
    switch (this.state) {
      case 'idle':
        if (distance <= this.detectionRange) {
          this.state = 'chasing';
        }
        break;
        
      case 'chasing':
        if (distance <= this.attackRange) {
          this.state = 'attacking';
          this.setVelocity(0, 0);
        } else if (distance > this.detectionRange * 1.5) {
          this.state = 'idle';
          this.setVelocity(0, 0);
        } else {
          // Move towards target
          const angle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.target.x, this.target.y
          );
          const velocity = this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle),
            this.moveSpeed
          );
          this.setVelocity(velocity.x, velocity.y);
        }
        break;
        
      case 'attacking':
        this.setVelocity(0, 0);
        if (distance > this.attackRange * 1.2) {
          this.state = 'chasing';
        } else if (this.attackCooldown <= 0) {
          this.performAttack();
        }
        break;
    }
  }
  
  private performAttack(): void {
    if (!this.target) return;
    
    this.attackCooldown = this.attackCooldownTime;
    
    // Visual attack based on type
    switch (this.rpsType) {
      case 'melee':
        this.meleeAttack();
        break;
      case 'ranged':
        this.rangedAttack();
        break;
      case 'magic':
        this.magicAttack();
        break;
    }
  }
  
  private meleeAttack(): void {
    // Lunge toward target
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target!.x, this.target!.y);
    const lungeDistance = 20;
    const targetX = this.x + Math.cos(angle) * lungeDistance;
    const targetY = this.y + Math.sin(angle) * lungeDistance;
    
    // Flash white
    this.setTint(0xffffff);
    
    // Lunge animation
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 100,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.clearTint();
        // Emit attack event
        this.scene.events.emit('enemy-attack', {
          enemy: this,
          target: this.target,
          type: this.rpsType
        });
      }
    });
  }
  
  private rangedAttack(): void {
    // Create projectile
    const projectile = this.scene.add.circle(this.x, this.y, 4, 0x00ff00);
    projectile.setDepth(this.y + 50);
    
    // Calculate trajectory
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target!.x, this.target!.y);
    const speed = 200;
    
    // Move projectile
    this.scene.tweens.add({
      targets: projectile,
      x: this.target!.x,
      y: this.target!.y,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        projectile.destroy();
        // Emit attack event
        this.scene.events.emit('enemy-attack', {
          enemy: this,
          target: this.target,
          type: this.rpsType
        });
      }
    });
    
    // Flash green
    this.setTint(0x00ff00);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });
  }
  
  private magicAttack(): void {
    // Create magic circle at target location
    const circle = this.scene.add.graphics();
    circle.x = this.target!.x;
    circle.y = this.target!.y;
    circle.setDepth(this.target!.y - 1);
    
    // Draw expanding circle
    let radius = 0;
    const maxRadius = 30;
    
    const expandCircle = () => {
      circle.clear();
      circle.lineStyle(2, 0xa06cd5, 1 - (radius / maxRadius));
      circle.strokeCircle(0, 0, radius);
      radius += 2;
      
      if (radius >= maxRadius) {
        circle.destroy();
        // Emit attack event
        this.scene.events.emit('enemy-attack', {
          enemy: this,
          target: this.target,
          type: this.rpsType
        });
      }
    };
    
    // Animate circle
    const timer = this.scene.time.addEvent({
      delay: 20,
      callback: expandCircle,
      repeat: maxRadius / 2
    });
    
    // Flash purple
    this.setTint(0xa06cd5);
    this.scene.time.delayedCall(300, () => {
      this.clearTint();
    });
  }
  
  public takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    
    // Update health bar
    this.updateHealthBar();
    
    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
    
    // Knockback
    if (this.target) {
      const angle = Phaser.Math.Angle.Between(
        this.target.x, this.target.y,
        this.x, this.y
      );
      const knockback = this.scene.physics.velocityFromAngle(
        Phaser.Math.RadToDeg(angle),
        200
      );
      this.setVelocity(knockback.x, knockback.y);
      this.scene.time.delayedCall(200, () => {
        this.setVelocity(0, 0);
      });
    }
    
    if (this.hp <= 0) {
      this.destroy();
    }
  }
  
  // For hybrid enemies - change type
  public switchType(): void {
    if (this.enemyType === 'hybrid') {
      const types: RPSType[] = ['melee', 'ranged', 'magic'];
      const currentIndex = types.indexOf(this.rpsType);
      this.rpsType = types[(currentIndex + 1) % types.length];
      
      // Visual effect for type change
      this.setTint(RPSLogic.getTypeColor(this.rpsType));
      this.scene.time.delayedCall(300, () => {
        this.clearTint();
      });
    }
  }
  
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    
    // Update depth
    this.setDepth(this.y);
    
    // Update health bar position
    this.updateHealthBar();
    
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    
    // Update AI
    this.updateAI();
    
    // Hybrid type switching
    if (this.enemyType === 'hybrid' && Math.random() < 0.001) {
      this.switchType();
    }
    
    // Update position in combat system
    if (this.scene && this.scene.events) {
      this.scene.events.emit('enemy-position-update', {
        id: this.id,
        x: this.x,
        y: this.y
      });
    }
  }
  
  destroy(): void {
    // Clean up visual elements
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    if (this.healthBarBg) {
      this.healthBarBg.destroy();
    }
    if (this.shadow) {
      this.shadow.destroy();
    }
    if (this.typeIcon) {
      this.typeIcon.destroy();
    }
    
    // Only emit event if scene is still active
    if (this.scene && this.scene.events) {
      this.scene.events.emit('enemy-killed', this);
    }
    
    super.destroy();
  }
}