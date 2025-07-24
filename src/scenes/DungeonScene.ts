import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from '../systems/CombatSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { DurabilitySystem } from '../systems/DurabilitySystem';
import { ProceduralGeneration, RoomTemplate } from '../systems/ProceduralGeneration';

export class DungeonScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Phaser.GameObjects.Group;
  private combatSystem!: CombatSystem;
  private inventorySystem!: InventorySystem;
  private durabilitySystem!: DurabilitySystem;
  
  private currentDepth: number = 1;
  private roomsCleared: number = 0;
  private isTransitioning: boolean = false;
  private currentRoom?: RoomTemplate;
  
  constructor() {
    super({ key: 'DungeonScene' });
  }
  
  init(data: { depth?: number }): void {
    this.currentDepth = data.depth || 1;
    this.roomsCleared = 0;
    this.isTransitioning = false; // Reset transitioning flag
  }
  
  create(): void {
    console.log(`DungeonScene: Creating dungeon at depth ${this.currentDepth}`);
    
    // Set darker background for dungeon
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Initialize groups
    this.enemies = this.add.group();
    
    // Initialize systems
    this.combatSystem = new CombatSystem(this);
    this.inventorySystem = new InventorySystem();
    this.durabilitySystem = new DurabilitySystem();
    
    // Create the dungeon room
    this.createDungeonRoom();
    
    // Create player
    this.createPlayer();
    
    // Spawn enemies based on depth
    this.spawnEnemies();
    
    // Auto-clear treasure rooms
    if (this.currentRoom?.type === 'treasure') {
      this.time.delayedCall(500, () => {
        this.onRoomCleared();
      });
    }
    
    // Set up controls
    this.setupControls();
    
    // Set up combat events
    this.setupCombatEvents();
    
    // Create UI overlay
    this.createUI();
  }
  
  private createDungeonRoom(): void {
    // Generate room using procedural generation
    const biome = ProceduralGeneration.getBiomeForDepth(this.currentDepth);
    this.currentRoom = ProceduralGeneration.generateRoomLayout(this.currentDepth, biome);
    
    const graphics = this.add.graphics();
    const tileSize = 80;
    
    // Set biome-specific colors
    const biomeColors = {
      rotwood: { floor: 0x2d3d2d, wall: 0x4a5a4a, detail: 0x1a2a1a },
      shiver_marsh: { floor: 0x2d3d4d, wall: 0x4a5a6a, detail: 0x1a2a3a },
      ember_caverns: { floor: 0x4d2d2d, wall: 0x6a4a4a, detail: 0x3a1a1a }
    };
    const colors = biomeColors[biome];
    
    // Draw room based on template
    for (let y = 0; y < this.currentRoom.layout.length; y++) {
      for (let x = 0; x < this.currentRoom.layout[y].length; x++) {
        const tile = this.currentRoom.layout[y][x];
        const worldX = x * tileSize;
        const worldY = y * tileSize;
        
        if (tile === 1) {
          // Wall
          graphics.fillStyle(colors.wall);
          graphics.fillRect(worldX, worldY, tileSize, tileSize);
        } else {
          // Floor
          graphics.fillStyle(colors.floor);
          graphics.fillRect(worldX, worldY, tileSize, tileSize);
          
          // Random floor details
          if (Math.random() < 0.1) {
            graphics.fillStyle(colors.detail, 0.5);
            graphics.fillCircle(
              worldX + tileSize/2 + Phaser.Math.Between(-20, 20), 
              worldY + tileSize/2 + Phaser.Math.Between(-20, 20), 
              Phaser.Math.Between(2, 5)
            );
          }
        }
      }
    }
    
    // Add room features (obstacles, hazards)
    const features = ProceduralGeneration.generateRoomFeatures(this.currentRoom);
    features.forEach(feature => {
      if (feature.type === 'tree_stump' || feature.type === 'rock') {
        graphics.fillStyle(0x444444);
        graphics.fillCircle(feature.x, feature.y, 20);
      } else if (feature.type === 'poison_pool') {
        graphics.fillStyle(0x00ff00, 0.5);
        graphics.fillCircle(feature.x, feature.y, 25);
      }
    });
    
    // Add room type indicator
    const roomTypeText = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, 30, 
      `Depth: ${this.currentDepth} | ${this.currentRoom.type.toUpperCase()} Room | ${biome.replace('_', ' ').toUpperCase()}`, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    roomTypeText.setOrigin(0.5);
  }
  
  private createPlayer(): void {
    const centerX = GAME_CONFIG.BASE_WIDTH / 2;
    const centerY = GAME_CONFIG.BASE_HEIGHT / 2;
    
    this.player = new Player({
      scene: this,
      x: centerX,
      y: centerY + 100,
      texture: 'player_idle_down',
      frameWidth: 96,
      frameHeight: 80
    });
    
    // Register player with combat system with sprite link
    const playerEntity = {
      id: this.player.id,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      damage: this.player.damage,
      rpsType: this.player.rpsType,
      x: this.player.x,
      y: this.player.y,
      sprite: this.player
    };
    this.combatSystem.registerEntity(playerEntity);
    
    // Set up collision with world bounds
    this.player.setCollideWorldBounds(true);
  }
  
  private spawnEnemies(): void {
    if (!this.currentRoom) return;
    
    // Skip spawning for non-combat rooms
    if (this.currentRoom.type === 'treasure' || this.currentRoom.type === 'rest') {
      return;
    }
    
    // Calculate enemy count from room template
    const enemyCount = Phaser.Math.Between(
      this.currentRoom.enemyCount.min,
      this.currentRoom.enemyCount.max
    );
    
    // Use specific enemy types if defined, otherwise default
    let enemyTypes: Array<'brute' | 'hunter' | 'wisp' | 'hybrid'>;
    if (this.currentRoom.enemyTypes && this.currentRoom.enemyTypes.length > 0) {
      enemyTypes = this.currentRoom.enemyTypes as Array<'brute' | 'hunter' | 'wisp' | 'hybrid'>;
    } else {
      enemyTypes = ['brute', 'hunter', 'wisp'];
      if (this.currentDepth >= 5) {
        enemyTypes.push('hybrid');
      }
    }
    
    // Use spawn points from template or random positions
    const spawnPoints = this.currentRoom.enemySpawnPoints.length > 0 
      ? [...this.currentRoom.enemySpawnPoints]
      : this.generateRandomSpawnPoints(enemyCount);
    
    for (let i = 0; i < enemyCount && i < spawnPoints.length; i++) {
      const spawn = spawnPoints[i];
      const enemyType = Phaser.Math.RND.pick(enemyTypes);
      
      const enemy = new Enemy({
        scene: this,
        x: spawn.x,
        y: spawn.y,
        type: enemyType,
        depth: this.currentDepth
      });
      
      enemy.setTarget(this.player);
      this.enemies.add(enemy);
      
      // Register entity with combat system and link the sprite
      const combatEntity = {
        id: enemy.id,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        damage: enemy.damage,
        rpsType: enemy.rpsType,
        x: enemy.x,
        y: enemy.y,
        sprite: enemy
      };
      this.combatSystem.registerEntity(combatEntity);
    }
  }
  
  private generateRandomSpawnPoints(count: number): Array<{x: number, y: number}> {
    const points: Array<{x: number, y: number}> = [];
    const minDistance = 100;
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let validPoint = false;
      
      while (!validPoint && attempts < 50) {
        const x = Phaser.Math.Between(150, GAME_CONFIG.BASE_WIDTH - 150);
        const y = Phaser.Math.Between(150, GAME_CONFIG.BASE_HEIGHT - 150);
        
        // Check distance from player
        const distanceToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        
        // Check distance from other spawn points
        const tooClose = points.some(point => 
          Phaser.Math.Distance.Between(x, y, point.x, point.y) < minDistance
        );
        
        if (distanceToPlayer >= minDistance && !tooClose) {
          points.push({ x, y });
          validPoint = true;
        }
        
        attempts++;
      }
    }
    
    return points;
  }
  
  private setupControls(): void {
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
    const spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    
    // Movement handler function
    const handleMovement = () => {
      // Only process input if not transitioning
      if (this.isTransitioning) {
        return;
      }
      
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
    };
    
    // Movement - use named function so we can remove it later
    this.events.on('update', handleMovement);
    
    // Attacks
    spaceBar.on('down', () => {
      this.player.attack(1);
    });
    
    shiftKey.on('down', () => {
      this.player.attack(2);
    });
    
    // Escape to return to town
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      this.returnToTown();
    });
  }
  
  private setupCombatEvents(): void {
    // Handle player attacks
    this.events.on('player-attack', (data: any) => {
      const targets = this.combatSystem.getEntitiesInRange(data.x, data.y, data.range, data.attackerId);
      
      targets.forEach(target => {
        console.log('Attacking target:', target.id, 'has sprite:', !!target.sprite);
        const event = this.combatSystem.attack(data.attackerId, target.id, data.type);
        
        if (event) {
          console.log('Attack event:', event.damage, 'damage to', event.target.id);
          if (event.target.sprite) {
            // Damage the enemy
            (event.target.sprite as Enemy).takeDamage(event.damage);
          } else {
            console.warn('No sprite found on target!');
          }
        }
      });
    });
    
    // Handle enemy attacks
    this.events.on('enemy-attack', (data: any) => {
      if (data.target === this.player) {
        const event = this.combatSystem.attack(data.enemy.id, this.player.id);
        
        if (event) {
          this.player.takeDamage(event.damage);
        }
      }
    });
    
    // Handle enemy death
    this.events.on('enemy-killed', (enemy: Enemy) => {
      this.combatSystem.unregisterEntity(enemy.id);
      this.enemies.remove(enemy);
      
      // Check if room cleared
      if (this.enemies.getLength() === 0) {
        this.onRoomCleared();
      }
    });
    
    // Handle player death
    this.events.on('player-death', () => {
      this.onPlayerDeath();
    });
  }
  
  private createUI(): void {
    // Health bar
    const healthBarBg = this.add.rectangle(10, 10, 200, 20, 0x000000);
    healthBarBg.setOrigin(0);
    healthBarBg.setScrollFactor(0);
    
    const healthBar = this.add.rectangle(10, 10, 200 * (this.player.hp / this.player.maxHp), 20, 0xff0000);
    healthBar.setOrigin(0);
    healthBar.setScrollFactor(0);
    
    // Update health bar
    this.events.on('preupdate', () => {
      healthBar.width = 200 * (this.player.hp / this.player.maxHp);
    });
    
    // RPS type indicator
    const typeText = this.add.text(10, 35, `Type: ${this.player.currentWeaponType}`, {
      fontSize: '16px',
      color: '#ffffff'
    });
    typeText.setScrollFactor(0);
    
    // Instructions
    const instructions = this.add.text(GAME_CONFIG.BASE_WIDTH - 10, 10, 
      'WASD/Arrows: Move\nSpace: Attack\nShift: Magic Attack\nESC: Return to Town', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'right'
    });
    instructions.setOrigin(1, 0);
    instructions.setScrollFactor(0);
  }
  
  private onRoomCleared(): void {
    this.roomsCleared++;
    
    // Mark as transitioning to prevent movement
    this.isTransitioning = true;
    
    // Stop player movement
    if (this.player) {
      this.player.setVelocity(0, 0);
      this.player.stop();
    }
    
    // Handle different room types
    if (this.currentRoom?.type === 'treasure') {
      this.showTreasureReward();
    } else if (this.currentRoom?.type === 'elite') {
      this.showEliteReward();
    } else {
      // Show room cleared message
      const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2, 
        'Room Cleared!', {
        fontSize: '48px',
        color: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      });
      text.setOrigin(0.5);
      
      // Create exit options
      this.time.delayedCall(1000, () => {
        text.destroy();
        this.showExitOptions();
      });
    }
  }
  
  private showTreasureReward(): void {
    const reward = ProceduralGeneration.generateReward('treasure', this.currentDepth);
    
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2);
    
    // Treasure chest visual
    const chest = this.add.rectangle(0, -30, 60, 40, 0x8b6914);
    const lid = this.add.rectangle(0, -50, 60, 20, 0xa0791a);
    container.add([chest, lid]);
    
    // Animate chest opening
    this.tweens.add({
      targets: lid,
      y: -70,
      angle: -45,
      duration: 500,
      ease: 'Power2'
    });
    
    // Show reward text
    const rewardText = this.add.text(0, 20, 
      `Found ${reward?.tier.toUpperCase()} ${reward?.type.toUpperCase()}!`, {
      fontSize: '24px',
      color: this.getRewardColor(reward?.tier || 'common'),
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    rewardText.setOrigin(0.5);
    container.add(rewardText);
    
    this.time.delayedCall(2000, () => {
      container.destroy();
      this.showExitOptions();
    });
  }
  
  private showEliteReward(): void {
    const reward = ProceduralGeneration.generateReward('elite', this.currentDepth);
    
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      `Elite Defeated!\n+${reward?.quantity || 0} Shards`, {
      fontSize: '36px',
      color: '#ffd700',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    });
    text.setOrigin(0.5);
    
    this.time.delayedCall(2000, () => {
      text.destroy();
      this.showExitOptions();
    });
  }
  
  private getRewardColor(tier: string): string {
    const colors: Record<string, string> = {
      common: '#ffffff',
      uncommon: '#00ff00',
      rare: '#0099ff',
      epic: '#9933ff',
      legendary: '#ff9900'
    };
    return colors[tier] || '#ffffff';
  }
  
  private showExitOptions(): void {
    const options = [
      { text: 'Next Room (Deeper)', action: () => this.goDeeper() },
      { text: 'Return to Town', action: () => this.returnToTown() }
    ];
    
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2);
    
    options.forEach((option, index) => {
      const button = this.add.text(0, index * 40, option.text, {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 }
      });
      button.setOrigin(0.5);
      button.setInteractive({ useHandCursor: true });
      
      button.on('pointerover', () => {
        button.setBackgroundColor('#555555');
      });
      
      button.on('pointerout', () => {
        button.setBackgroundColor('#333333');
      });
      
      button.on('pointerdown', option.action);
      
      container.add(button);
    });
  }
  
  private goDeeper(): void {
    // Stop player movement before transitioning
    if (this.player) {
      this.player.setVelocity(0, 0);
      this.player.stop();
    }
    
    // Disable input
    this.input.enabled = false;
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false;
    }
    
    // Remove update listeners to prevent stuck movement
    this.events.off('update');
    
    // Restart scene with new depth
    this.scene.restart({ depth: this.currentDepth + 1 });
  }
  
  private returnToTown(): void {
    // Calculate rewards
    const shards = this.roomsCleared * 10 * this.currentDepth;
    
    // Show rewards
    console.log(`Returning to town with ${shards} shards`);
    
    // Clean up before returning
    this.cleanup();
    
    // Return to town scene
    this.scene.start('TownScene2D5');
  }
  
  private onPlayerDeath(): void {
    // Prevent multiple death triggers
    if (this.isTransitioning) {
      return;
    }
    
    this.isTransitioning = true;
    console.log('Player death triggered');
    
    // Show death message
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2, 
      'You Died!\nReloading...', {
      fontSize: '48px',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    });
    text.setOrigin(0.5);
    text.setDepth(3001);
    
    // IMPORTANT: Using setTimeout with window.location.reload() works because:
    // 1. setTimeout runs outside of Phaser's update loop
    // 2. window.location.reload() completely restarts the page, bypassing any Phaser scene issues
    // 3. Scene transitions fail because of complex state management issues when cleaning up physics/sprites
    console.log('Setting timeout for reload - this works because it bypasses Phaser scene management');
    
    setTimeout(() => {
      console.log('Reloading page...');
      window.location.reload();
    }, 1500);
    
    // NOTE: Phaser scene transitions fail here because:
    // - Complex cleanup of physics bodies, sprites, and event listeners
    // - Scene manager gets confused with active/inactive states
    // - Sprite generation fails on scene restart due to texture management issues
  }
  
  private cleanup(): void {
    // Clean up systems
    this.combatSystem.destroy();
    this.inventorySystem.clear();
    this.durabilitySystem.clear();
    
    // Remove all event listeners
    this.events.removeAllListeners();
    
    // Clear enemy group
    this.enemies.clear(true, true);
  }
  
  update(): void {
    // Update is handled by event listeners
  }
  
  shutdown(): void {
    console.log('DungeonScene: Shutting down...');
    
    // Remove update listener
    this.events.off('update');
    
    // Clean up keyboard
    this.input.keyboard?.removeAllKeys();
    
    // Clean up systems if they exist
    if (this.combatSystem) {
      this.combatSystem.destroy();
    }
    if (this.inventorySystem) {
      this.inventorySystem.clear();
    }
    if (this.durabilitySystem) {
      this.durabilitySystem.clear();
    }
    
    // Clear groups
    if (this.enemies) {
      this.enemies.clear(true, true);
    }
    
    console.log('DungeonScene: Shutdown complete');
  }
}