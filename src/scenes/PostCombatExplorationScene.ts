import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { PlayerTurnBased } from '../entities/PlayerTurnBased';

interface GoldDrop {
  sprite: Phaser.GameObjects.Container;
  value: number;
  collected: boolean;
}

export class PostCombatExplorationScene extends Phaser.Scene {
  private player!: PlayerTurnBased;
  private goldDrops: GoldDrop[] = [];
  private upgradePortal!: Phaser.GameObjects.Container;
  private goldCollected: number = 0;
  private depth: number = 1;
  private isTransitioning: boolean = false;
  
  constructor() {
    super({ key: 'PostCombatExplorationScene' });
  }
  
  init(data: { depth: number, goldDrops?: number[] }): void {
    this.depth = data.depth || 1;
    this.goldDrops = [];
    this.goldCollected = 0;
    this.isTransitioning = false;
    
    // Default gold drops if not specified
    if (!data.goldDrops || data.goldDrops.length === 0) {
      data.goldDrops = [5 + this.depth * 2]; // Base gold increases with depth
    }
  }
  
  create(): void {
    console.log('PostCombatExplorationScene: Creating exploration phase');
    
    // Set background
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Create simple room layout
    this.createRoom();
    
    // Create player
    this.createPlayer();
    
    // Create gold drops
    this.createGoldDrops();
    
    // Create upgrade portal
    this.createUpgradePortal();
    
    // Set up controls
    this.setupControls();
    
    // Create UI
    this.createUI();
  }
  
  private createRoom(): void {
    const graphics = this.add.graphics();
    
    // Draw floor
    graphics.fillStyle(0x2d3d2d);
    graphics.fillRect(0, 0, GAME_CONFIG.BASE_WIDTH, GAME_CONFIG.BASE_HEIGHT);
    
    // Draw walls
    graphics.fillStyle(0x4a5a4a);
    const wallThickness = 40;
    // Top wall
    graphics.fillRect(0, 0, GAME_CONFIG.BASE_WIDTH, wallThickness);
    // Bottom wall
    graphics.fillRect(0, GAME_CONFIG.BASE_HEIGHT - wallThickness, GAME_CONFIG.BASE_WIDTH, wallThickness);
    // Left wall
    graphics.fillRect(0, 0, wallThickness, GAME_CONFIG.BASE_HEIGHT);
    // Right wall
    graphics.fillRect(GAME_CONFIG.BASE_WIDTH - wallThickness, 0, wallThickness, GAME_CONFIG.BASE_HEIGHT);
    
    // Add some floor details
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, GAME_CONFIG.BASE_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_CONFIG.BASE_HEIGHT - 50);
      graphics.fillStyle(0x1a2a1a, 0.3);
      graphics.fillCircle(x, y, Phaser.Math.Between(2, 5));
    }
  }
  
  private createPlayer(): void {
    const centerX = GAME_CONFIG.BASE_WIDTH / 2;
    const centerY = GAME_CONFIG.BASE_HEIGHT / 2;
    
    this.player = new PlayerTurnBased({
      scene: this,
      x: centerX,
      y: centerY + 100,
      texture: 'player_idle_down',
      frameWidth: 96,
      frameHeight: 80
    });
    
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.8); // Slightly smaller for exploration
  }
  
  private createGoldDrops(): void {
    const dropPositions = [
      { x: GAME_CONFIG.BASE_WIDTH / 2 - 100, y: GAME_CONFIG.BASE_HEIGHT / 2 },
      { x: GAME_CONFIG.BASE_WIDTH / 2, y: GAME_CONFIG.BASE_HEIGHT / 2 },
      { x: GAME_CONFIG.BASE_WIDTH / 2 + 100, y: GAME_CONFIG.BASE_HEIGHT / 2 }
    ];
    
    // Create gold drops at enemy defeat positions
    const goldValues = this.scene.settings.data.goldDrops || [5 + this.depth * 2];
    
    goldValues.forEach((value, index) => {
      if (index < dropPositions.length) {
        const pos = dropPositions[index];
        const goldDrop = this.createGoldDrop(pos.x, pos.y, value);
        this.goldDrops.push(goldDrop);
      }
    });
  }
  
  private createGoldDrop(x: number, y: number, value: number): GoldDrop {
    const container = this.add.container(x, y);
    
    // Gold pile base
    const shadow = this.add.ellipse(0, 5, 30, 15, 0x000000, 0.3);
    
    // Gold coins
    const coin1 = this.add.circle(-5, 0, 8, 0xffd700);
    const coin2 = this.add.circle(5, 0, 8, 0xffed4e);
    const coin3 = this.add.circle(0, -5, 8, 0xffc125);
    
    // Value text
    const valueText = this.add.text(0, -20, `${value}g`, {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    valueText.setOrigin(0.5);
    
    container.add([shadow, coin1, coin2, coin3, valueText]);
    
    // Floating animation
    this.tweens.add({
      targets: container,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Sparkle effect
    this.time.addEvent({
      delay: 500,
      callback: () => {
        if (container.active) {
          const sparkle = this.add.star(
            container.x + Phaser.Math.Between(-10, 10),
            container.y + Phaser.Math.Between(-10, 10),
            4, 2, 4, 0xffffff
          );
          sparkle.setScale(0.5);
          
          this.tweens.add({
            targets: sparkle,
            scale: 0,
            alpha: 0,
            duration: 500,
            onComplete: () => sparkle.destroy()
          });
        }
      },
      loop: true
    });
    
    return { sprite: container, value, collected: false };
  }
  
  private createUpgradePortal(): void {
    const x = GAME_CONFIG.BASE_WIDTH / 2;
    const y = 100;
    
    this.upgradePortal = this.add.container(x, y);
    
    // Portal base
    const portalBg = this.add.rectangle(0, 0, 80, 80, 0x4444aa);
    portalBg.setStrokeStyle(3, 0x6666ff);
    
    // Portal glow
    const glow = this.add.circle(0, 0, 45, 0x6666ff, 0.3);
    
    // Portal icon
    const icon = this.add.text(0, 0, '⬆️', {
      fontSize: '32px'
    });
    icon.setOrigin(0.5);
    
    // "Upgrade" text
    const text = this.add.text(0, 50, 'UPGRADE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    });
    text.setOrigin(0.5);
    
    this.upgradePortal.add([glow, portalBg, icon, text]);
    
    // Make portal interactive
    portalBg.setInteractive({ useHandCursor: true });
    
    // Pulsing effect
    this.tweens.add({
      targets: glow,
      scale: 1.2,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Disable initially (until gold is collected)
    this.upgradePortal.setAlpha(0.3);
  }
  
  private setupControls(): void {
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
    
    const handleMovement = () => {
      if (this.isTransitioning) return;
      
      let horizontal = 0;
      let vertical = 0;
      
      if (cursors.left.isDown || wasd.A.isDown) {
        horizontal = -1;
      } else if (cursors.right.isDown || wasd.D.isDown) {
        horizontal = 1;
      }
      
      if (cursors.up.isDown || wasd.W.isDown) {
        vertical = -1;
      } else if (cursors.down.isDown || wasd.S.isDown) {
        vertical = 1;
      }
      
      this.player.move8Dir(horizontal, vertical);
      
      // Check collisions
      this.checkCollisions();
    };
    
    this.events.on('update', handleMovement);
  }
  
  private checkCollisions(): void {
    const playerBounds = this.player.getBounds();
    
    // Check gold pickups
    this.goldDrops.forEach(gold => {
      if (!gold.collected && gold.sprite.active) {
        const goldBounds = gold.sprite.getBounds();
        
        if (Phaser.Geom.Rectangle.Overlaps(playerBounds, goldBounds)) {
          this.collectGold(gold);
        }
      }
    });
    
    // Check portal interaction
    const portalBounds = this.upgradePortal.getBounds();
    if (Phaser.Geom.Rectangle.Overlaps(playerBounds, portalBounds)) {
      // Enable portal when player is near
      if (this.upgradePortal.alpha < 1) {
        this.upgradePortal.setAlpha(1);
      }
      
      // Check for interaction
      if (this.input.activePointer.isDown && !this.isTransitioning) {
        const pointerX = this.input.activePointer.x;
        const pointerY = this.input.activePointer.y;
        
        if (portalBounds.contains(pointerX, pointerY)) {
          this.enterUpgradePortal();
        }
      }
    } else {
      // Dim portal when player is far
      if (this.goldCollected > 0 && this.upgradePortal.alpha > 0.7) {
        this.upgradePortal.setAlpha(0.7);
      }
    }
  }
  
  private collectGold(gold: GoldDrop): void {
    gold.collected = true;
    this.goldCollected += gold.value;
    
    // Collection effect
    const collectText = this.add.text(gold.sprite.x, gold.sprite.y, `+${gold.value}g`, {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    collectText.setOrigin(0.5);
    
    this.tweens.add({
      targets: collectText,
      y: collectText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => collectText.destroy()
    });
    
    // Destroy gold drop
    this.tweens.add({
      targets: gold.sprite,
      scale: 0,
      duration: 200,
      onComplete: () => gold.sprite.destroy()
    });
    
    // Play collection sound if available
    if (this.sound.get('coin')) {
      this.sound.play('coin', { volume: 0.5 });
    }
    
    // Enable portal after collecting any gold
    if (this.goldCollected > 0) {
      this.upgradePortal.setAlpha(0.7);
    }
  }
  
  private enterUpgradePortal(): void {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // Portal activation effect
    const flash = this.add.rectangle(
      this.upgradePortal.x,
      this.upgradePortal.y,
      100,
      100,
      0xffffff,
      0
    );
    
    this.tweens.add({
      targets: flash,
      alpha: 1,
      scale: 3,
      duration: 300,
      onComplete: () => {
        // Clean up and launch upgrade scene
        this.cleanup();
        this.scene.stop();
        this.scene.launch('UpgradeCardSelectionScene', { depth: this.depth });
        
        // Listen for upgrade completion
        this.scene.get('UpgradeCardSelectionScene').events.once('shutdown', () => {
          // Return to combat flow
          this.events.emit('exploration-complete');
        });
      }
    });
  }
  
  private createUI(): void {
    // Gold counter
    const goldBg = this.add.rectangle(10, 10, 150, 30, 0x000000, 0.7);
    goldBg.setOrigin(0);
    goldBg.setScrollFactor(0);
    
    const goldIcon = this.add.text(20, 25, '💰', {
      fontSize: '20px'
    });
    goldIcon.setOrigin(0, 0.5);
    goldIcon.setScrollFactor(0);
    
    const goldText = this.add.text(50, 25, `${this.goldCollected}g`, {
      fontSize: '18px',
      color: '#ffd700',
      fontFamily: 'monospace'
    });
    goldText.setOrigin(0, 0.5);
    goldText.setScrollFactor(0);
    
    // Update gold display
    this.events.on('postupdate', () => {
      goldText.setText(`${this.goldCollected}g`);
    });
    
    // Instructions
    const instructions = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT - 20,
      'WASD/Arrows: Move | Collect gold and enter the upgrade portal', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    instructions.setOrigin(0.5);
    instructions.setScrollFactor(0);
  }
  
  private cleanup(): void {
    this.events.off('update');
    this.goldDrops = [];
  }
  
  shutdown(): void {
    this.cleanup();
  }
}