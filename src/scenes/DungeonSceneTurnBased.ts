import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { PlayerTurnBased } from '../entities/PlayerTurnBased';
import { ProceduralGeneration, RoomTemplate } from '../systems/ProceduralGeneration';
import { CombatEncounterData } from './CombatEncounterScene';
import { GameStateManager } from '../systems/GameStateManager';

interface EnemyData {
  id: string;
  x: number;
  y: number;
  type: 'brute' | 'hunter' | 'wisp' | 'hybrid';
  hp: number;
  maxHp: number;
  damage: number;
  rpsType: 'melee' | 'ranged' | 'magic';
  sprite: Phaser.GameObjects.Container;
}

export class DungeonSceneTurnBased extends Phaser.Scene {
  private player!: PlayerTurnBased;
  private enemies: Map<string, EnemyData> = new Map();
  private currentDepth: number = 1;
  private roomsCleared: number = 0;
  private isTransitioning: boolean = false;
  private currentRoom?: RoomTemplate;
  private inCombat: boolean = false;
  
  constructor() {
    super({ key: 'DungeonSceneTurnBased' });
  }
  
  init(data: { depth?: number }): void {
    const gameState = GameStateManager.getInstance();
    
    // Start new run if needed
    if (!gameState.isRunActive()) {
      gameState.startNewRun();
    }
    
    this.currentDepth = data.depth || gameState.getCurrentRun()?.depth || 1;
    this.roomsCleared = 0;
    this.isTransitioning = false;
    this.inCombat = false;
    this.enemies.clear();
  }
  
  create(): void {
    console.log(`DungeonSceneTurnBased: Creating dungeon at depth ${this.currentDepth}`);
    
    // Set darker background for dungeon
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Create the dungeon room
    this.createDungeonRoom();
    
    // Create player
    this.createPlayer();
    
    // Spawn enemies based on depth
    this.spawnEnemies();
    
    // Auto-clear non-combat rooms
    if (this.currentRoom?.type === 'treasure' || 
        this.currentRoom?.type === 'rest' || 
        this.currentRoom?.type === 'shop') {
      this.time.delayedCall(500, () => {
        this.onRoomCleared();
      });
    }
    
    // Set up controls
    this.setupControls();
    
    // Create UI overlay
    this.createUI();
    
    // Listen for combat results
    this.scene.get('CombatEncounterScene').events.on('combat-resolved', this.onCombatResolved, this);
  }
  
  private createDungeonRoom(): void {
    // Same as original DungeonScene
    const biome = ProceduralGeneration.getBiomeForDepth(this.currentDepth);
    this.currentRoom = ProceduralGeneration.generateRoomLayout(this.currentDepth, biome);
    
    const graphics = this.add.graphics();
    const tileSize = 80;
    
    const biomeColors = {
      rotwood: { floor: 0x2d3d2d, wall: 0x4a5a4a, detail: 0x1a2a1a },
      shiver_marsh: { floor: 0x2d3d4d, wall: 0x4a5a6a, detail: 0x1a2a3a },
      ember_caverns: { floor: 0x4d2d2d, wall: 0x6a4a4a, detail: 0x3a1a1a }
    };
    const colors = biomeColors[biome];
    
    // Draw room
    for (let y = 0; y < this.currentRoom.layout.length; y++) {
      for (let x = 0; x < this.currentRoom.layout[y].length; x++) {
        const tile = this.currentRoom.layout[y][x];
        const worldX = x * tileSize;
        const worldY = y * tileSize;
        
        if (tile === 1) {
          graphics.fillStyle(colors.wall);
          graphics.fillRect(worldX, worldY, tileSize, tileSize);
        } else {
          graphics.fillStyle(colors.floor);
          graphics.fillRect(worldX, worldY, tileSize, tileSize);
          
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
    
    // Add room features
    const features = ProceduralGeneration.generateRoomFeatures(this.currentRoom);
    features.forEach(feature => {
      if (feature.type === 'tree_stump' || feature.type === 'rock') {
        graphics.fillStyle(0x444444);
        graphics.fillCircle(feature.x, feature.y, 20);
      } else if (feature.type === 'poison_pool') {
        graphics.fillStyle(0x00ff00, 0.5);
        graphics.fillCircle(feature.x, feature.y, 25);
      } else if (feature.type === 'healing_fountain') {
        // Draw fountain base
        graphics.fillStyle(0x4682b4);
        graphics.fillCircle(feature.x, feature.y, 30);
        graphics.fillStyle(0x87ceeb);
        graphics.fillCircle(feature.x, feature.y, 20);
        
        // Create sparkle particles if texture exists
        if (this.textures.exists('particle')) {
          const sparkle = this.add.particles(feature.x, feature.y, 'particle', {
            speed: { min: 20, max: 40 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 1000,
            frequency: 200,
            tint: 0x87ceeb
          });
        } else {
          // Fallback: animated circles
          const sparkle = this.add.circle(feature.x, feature.y - 10, 3, 0x87ceeb);
          this.tweens.add({
            targets: sparkle,
            y: feature.y - 30,
            alpha: 0,
            duration: 1000,
            repeat: -1
          });
        }
        
        // Make fountain interactive
        const fountainZone = this.add.zone(feature.x, feature.y, 60, 60);
        fountainZone.setInteractive();
        fountainZone.setData('type', 'healing_fountain');
        fountainZone.setData('used', false);
      }
    });
    
    // Room type indicator
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
    
    this.player = new PlayerTurnBased({
      scene: this,
      x: centerX,
      y: centerY + 100,
      texture: 'player_idle_down',
      frameWidth: 96,
      frameHeight: 80
    });
    
    this.player.setCollideWorldBounds(true);
  }
  
  private spawnEnemies(): void {
    if (!this.currentRoom) return;
    
    // Skip spawning for non-combat rooms
    if (this.currentRoom.type === 'treasure' || 
        this.currentRoom.type === 'rest' || 
        this.currentRoom.type === 'shop') {
      return;
    }
    
    const enemyCount = Phaser.Math.Between(
      this.currentRoom.enemyCount.min,
      this.currentRoom.enemyCount.max
    );
    
    let enemyTypes: Array<'brute' | 'hunter' | 'wisp' | 'hybrid'>;
    if (this.currentRoom.enemyTypes && this.currentRoom.enemyTypes.length > 0) {
      enemyTypes = this.currentRoom.enemyTypes as Array<'brute' | 'hunter' | 'wisp' | 'hybrid'>;
    } else {
      enemyTypes = ['brute', 'hunter', 'wisp'];
      if (this.currentDepth >= 5) {
        enemyTypes.push('hybrid');
      }
    }
    
    const spawnPoints = this.currentRoom.enemySpawnPoints.length > 0 
      ? [...this.currentRoom.enemySpawnPoints]
      : this.generateRandomSpawnPoints(enemyCount);
    
    for (let i = 0; i < enemyCount && i < spawnPoints.length; i++) {
      const spawn = spawnPoints[i];
      const enemyType = Phaser.Math.RND.pick(enemyTypes);
      
      // Create enemy sprite
      const enemySprite = this.createEnemySprite(spawn.x, spawn.y, enemyType);
      
      // Create enemy data
      const depthMultiplier = 1 + (this.currentDepth - 1) * 0.2;
      const enemyData: EnemyData = {
        id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: spawn.x,
        y: spawn.y,
        type: enemyType,
        hp: Math.floor(this.getEnemyBaseHp(enemyType) * depthMultiplier),
        maxHp: Math.floor(this.getEnemyBaseHp(enemyType) * depthMultiplier),
        damage: Math.floor(this.getEnemyBaseDamage(enemyType) * depthMultiplier),
        rpsType: this.getEnemyRpsType(enemyType),
        sprite: enemySprite
      };
      
      this.enemies.set(enemyData.id, enemyData);
    }
  }
  
  private createEnemySprite(x: number, y: number, type: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const colors = {
      brute: 0xff4444,
      hunter: 0x44ff44,
      wisp: 0x4444ff,
      hybrid: 0xff44ff
    };
    
    // Enemy body
    const body = this.add.rectangle(0, 0, 24, 32, colors[type as keyof typeof colors] || 0xffffff);
    
    // Type indicator
    const typeIcons = { brute: '⚔️', hunter: '🏹', wisp: '✨', hybrid: '🔄' };
    const typeIcon = this.add.text(0, -20, typeIcons[type as keyof typeof typeIcons] || '?', {
      fontSize: '16px'
    });
    typeIcon.setOrigin(0.5);
    
    container.add([body, typeIcon]);
    container.setSize(24, 32);
    container.setInteractive();
    
    return container;
  }
  
  private getEnemyBaseHp(type: string): number {
    switch (type) {
      case 'brute': return 8;   // Was 12
      case 'hunter': return 6;  // Was 10
      case 'wisp': return 5;    // Was 8
      case 'hybrid': return 10; // Was 15
      default: return 6;
    }
  }
  
  private getEnemyBaseDamage(type: string): number {
    switch (type) {
      case 'brute': return 3;   // Was 5
      case 'hunter': return 2;  // Was 4
      case 'wisp': return 3;    // Was 6
      case 'hybrid': return 4;  // Was 6
      default: return 2;
    }
  }
  
  private getEnemyRpsType(type: string): 'melee' | 'ranged' | 'magic' {
    switch (type) {
      case 'brute': return 'melee';
      case 'hunter': return 'ranged';
      case 'wisp': return 'magic';
      case 'hybrid': return Phaser.Math.RND.pick(['melee', 'ranged', 'magic']);
      default: return 'melee';
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
        
        const distanceToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        
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
    
    const handleMovement = () => {
      if (this.isTransitioning || this.inCombat) {
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
      
      // Check for enemy collisions
      this.checkEnemyCollisions();
    };
    
    this.events.on('update', handleMovement);
    
    // Escape to return to town
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      if (!this.inCombat) {
        this.returnToTown();
      }
    });
  }
  
  private checkEnemyCollisions(): void {
    const playerBounds = this.player.getBounds();
    
    // Check enemy collisions
    this.enemies.forEach((enemy, id) => {
      if (!enemy.sprite.active) return;
      
      const enemyBounds = enemy.sprite.getBounds();
      
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, enemyBounds)) {
        this.startCombatEncounter(enemy);
      }
    });
    
    // Check interactive objects (fountains, shops)
    this.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Zone) {
        const zone = child as Phaser.GameObjects.Zone;
        if (zone.getData('type') === 'healing_fountain' && !zone.getData('used')) {
          const zoneBounds = zone.getBounds();
          if (Phaser.Geom.Rectangle.Overlaps(playerBounds, zoneBounds)) {
            this.useHealingFountain(zone);
          }
        }
      }
    });
  }
  
  private startCombatEncounter(enemy: EnemyData): void {
    if (this.inCombat) return;
    
    this.inCombat = true;
    this.player.setVelocity(0, 0);
    
    // Get current player state
    const gameState = GameStateManager.getInstance();
    const playerState = gameState.getPlayerState()!;
    
    // Prepare combat data
    const encounterData: CombatEncounterData = {
      playerData: {
        hp: playerState.hp,
        maxHp: playerState.maxHp,
        damage: 10, // Base damage, will be modified by blade/bulwark/focus stats
        rpsType: 'melee' // Default, not used in new system
      },
      enemyData: {
        id: enemy.id,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        damage: enemy.damage,
        rpsType: enemy.rpsType,
        type: enemy.type
      },
      depth: this.currentDepth,
      roomIndex: this.roomsCleared
    };
    
    // Visual feedback
    this.cameras.main.fade(500, 0, 0, 0);
    
    this.time.delayedCall(500, () => {
      // Start combat encounter
      this.scene.launch('CombatEncounterScene', encounterData);
      this.scene.pause();
    });
  }
  
  private onCombatResolved(data: { winner: 'player' | 'enemy', enemyId: string }): void {
    this.scene.resume();
    this.cameras.main.fadeIn(500);
    this.inCombat = false;
    
    if (data.winner === 'player') {
      // Remove defeated enemy
      const enemy = this.enemies.get(data.enemyId);
      if (enemy) {
        enemy.sprite.destroy();
        this.enemies.delete(data.enemyId);
        
        // Check if room cleared
        if (this.enemies.size === 0) {
          // Show upgrade card selection for combat rooms
          if (this.currentRoom?.type === 'combat' || this.currentRoom?.type === 'elite') {
            this.time.delayedCall(500, () => {
              this.scene.pause();
              this.scene.launch('UpgradeCardSelectionScene', { depth: this.currentDepth });
              
              // Listen for selection complete
              this.scene.get('UpgradeCardSelectionScene').events.once('shutdown', () => {
                this.scene.resume();
                this.onRoomCleared();
              });
            });
          } else {
            this.onRoomCleared();
          }
        }
      }
    } else {
      // Player defeated
      this.onPlayerDeath();
    }
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
    
    // Instructions
    const instructions = this.add.text(GAME_CONFIG.BASE_WIDTH - 10, 10, 
      'WASD/Arrows: Move\\nWalk into enemies to battle\\nESC: Return to Town', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'right'
    });
    instructions.setOrigin(1, 0);
    instructions.setScrollFactor(0);
  }
  
  private onRoomCleared(): void {
    this.roomsCleared++;
    this.isTransitioning = true;
    
    // Update game state
    GameStateManager.getInstance().incrementRoomsCleared();
    
    if (this.player) {
      this.player.setVelocity(0, 0);
      this.player.stop();
    }
    
    // Handle different room types
    if (this.currentRoom?.type === 'treasure') {
      this.showTreasureReward();
    } else if (this.currentRoom?.type === 'elite') {
      this.showEliteReward();
    } else if (this.currentRoom?.type === 'rest') {
      this.showRestRoom();
    } else if (this.currentRoom?.type === 'shop') {
      this.showShopRoom();
    } else {
      const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2, 
        'Room Cleared!', {
        fontSize: '48px',
        color: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      });
      text.setOrigin(0.5);
      
      this.time.delayedCall(1000, () => {
        text.destroy();
        this.showExitOptions();
      });
    }
  }
  
  private showTreasureReward(): void {
    const reward = ProceduralGeneration.generateReward('treasure', this.currentDepth);
    
    // Add shards if reward includes them
    if (reward && reward.type === 'shards' && reward.quantity) {
      GameStateManager.getInstance().addShards(reward.quantity);
    }
    
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2);
    
    const chest = this.add.rectangle(0, -30, 60, 40, 0x8b6914);
    const lid = this.add.rectangle(0, -50, 60, 20, 0xa0791a);
    container.add([chest, lid]);
    
    this.tweens.add({
      targets: lid,
      y: -70,
      angle: -45,
      duration: 500,
      ease: 'Power2'
    });
    
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
    
    // Elite rewards always give shards
    if (reward && reward.quantity) {
      GameStateManager.getInstance().addShards(reward.quantity);
    }
    
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      `Elite Defeated!\\n+${reward?.quantity || 0} Shards`, {
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
    if (this.player) {
      this.player.setVelocity(0, 0);
      this.player.stop();
    }
    
    this.input.enabled = false;
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false;
    }
    
    this.events.off('update');
    
    // Update game state depth
    GameStateManager.getInstance().incrementDepth();
    
    this.scene.restart({ depth: this.currentDepth + 1 });
  }
  
  private returnToTown(): void {
    const gameState = GameStateManager.getInstance();
    const shards = this.roomsCleared * 10 * this.currentDepth;
    
    // Add shards to game state
    gameState.addShards(shards);
    
    console.log(`Returning to town with ${shards} shards`);
    
    // End the run
    const totalShards = gameState.endRun();
    
    this.cleanup();
    this.scene.start('TownScene2D5', { runComplete: true, shardsEarned: totalShards });
  }
  
  private onPlayerDeath(): void {
    if (this.isTransitioning) {
      return;
    }
    
    this.isTransitioning = true;
    console.log('Player death triggered');
    
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2, 
      'You Died!\\nReloading...', {
      fontSize: '48px',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    });
    text.setOrigin(0.5);
    text.setDepth(3001);
    
    setTimeout(() => {
      console.log('Reloading page...');
      window.location.reload();
    }, 1500);
  }
  
  private cleanup(): void {
    this.events.removeAllListeners();
    this.enemies.clear();
  }
  
  shutdown(): void {
    console.log('DungeonSceneTurnBased: Shutting down...');
    
    this.events.off('update');
    this.input.keyboard?.removeAllKeys();
    
    this.scene.get('CombatEncounterScene').events.off('combat-resolved', this.onCombatResolved, this);
    
    this.enemies.clear();
    
    console.log('DungeonSceneTurnBased: Shutdown complete');
  }
  
  private useHealingFountain(fountain: Phaser.GameObjects.Zone): void {
    if (fountain.getData('used')) return;
    
    const gameState = GameStateManager.getInstance();
    const playerState = gameState.getPlayerState();
    
    if (playerState && playerState.hp < playerState.maxHp) {
      // Heal 3 HP (about 30% of base max HP)
      const healAmount = 3;
      const newHp = Math.min(playerState.hp + healAmount, playerState.maxHp);
      gameState.updatePlayerHP(newHp);
      
      // Visual feedback
      const healText = this.add.text(fountain.x, fountain.y - 50, `+${healAmount} HP`, {
        fontSize: '24px',
        color: '#00ff00',
        fontStyle: 'bold'
      });
      healText.setOrigin(0.5);
      
      this.tweens.add({
        targets: healText,
        y: healText.y - 30,
        alpha: 0,
        duration: 1500,
        onComplete: () => healText.destroy()
      });
      
      // Mark fountain as used
      fountain.setData('used', true);
      
      // Update player HP display
      this.player.hp = newHp;
      
      // Disable fountain visually
      const particles = this.children.list.find(child => 
        child instanceof Phaser.GameObjects.Particles.ParticleEmitter && 
        Math.abs((child as any).x - fountain.x) < 10 && 
        Math.abs((child as any).y - fountain.y) < 10
      );
      if (particles) {
        (particles as any).stop();
      }
    }
  }
  
  private showRestRoom(): void {
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2 - 50,
      'Rest Room\nApproach the fountain to heal', {
      fontSize: '28px',
      color: '#87ceeb',
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
  
  private showShopRoom(): void {
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      'Shop (Coming Soon)', {
      fontSize: '32px',
      color: '#ffd700',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    text.setOrigin(0.5);
    
    this.time.delayedCall(2000, () => {
      text.destroy();
      this.showExitOptions();
    });
  }
}