import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { GameStateManager } from '../systems/GameStateManager';
import { ProceduralGeneration, RoomTemplate } from '../systems/ProceduralGeneration';
import { CombatEncounterData } from './CombatEncounterScene';

interface EnemyData {
  id: string;
  type: 'brute' | 'hunter' | 'wisp' | 'hybrid';
  hp: number;
  maxHp: number;
  damage: number;
  rpsType: 'melee' | 'ranged' | 'magic';
}

export class CombatFlowScene extends Phaser.Scene {
  private currentDepth: number = 1;
  private roomsCleared: number = 0;
  private currentRoom?: RoomTemplate;
  private enemyQueue: EnemyData[] = [];
  private isProcessing: boolean = false;
  
  constructor() {
    super({ key: 'CombatFlowScene' });
  }
  
  init(data: { depth?: number }): void {
    const gameState = GameStateManager.getInstance();
    
    // Start new run if needed
    if (!gameState.isRunActive()) {
      gameState.startNewRun();
    }
    
    this.currentDepth = data.depth || gameState.getCurrentRun()?.depth || 1;
    // Check if this is a continued run or fresh start
    const currentRun = gameState.getCurrentRun();
    this.roomsCleared = 0; // Always reset rooms cleared when entering a new depth
    this.isProcessing = false;
    this.enemyQueue = [];
    
    console.log(`CombatFlowScene: Initialized with depth ${this.currentDepth}, roomsCleared: ${this.roomsCleared}`);
  }
  
  create(): void {
    console.log(`CombatFlowScene: Creating scene at depth ${this.currentDepth}, roomsCleared: ${this.roomsCleared}`);
    
    // Verify game state
    const gameState = GameStateManager.getInstance();
    const currentRun = gameState.getCurrentRun();
    console.log(`CombatFlowScene: Game state - depth: ${currentRun?.depth}, roomsCleared: ${currentRun?.roomsCleared}`);
    
    // Set background
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Add a visible background rectangle to ensure scene is rendering
    const bg = this.add.rectangle(
      GAME_CONFIG.BASE_WIDTH / 2,
      GAME_CONFIG.BASE_HEIGHT / 2,
      GAME_CONFIG.BASE_WIDTH,
      GAME_CONFIG.BASE_HEIGHT,
      0x2a2a3e
    );
    bg.setDepth(-1);
    
    // Show depth indicator
    this.showDepthIndicator();
    
    // Generate room and enemies
    this.generateRoom();
    
    console.log(`CombatFlowScene: Room type: ${this.currentRoom?.type}, Enemy count: ${this.enemyQueue.length}`);
    
    // Listen for combat results
    this.scene.get('CombatEncounterScene').events.on('combat-resolved', this.onCombatResolved, this);
    
    // For combat rooms, start combat after a brief delay
    // For special rooms, they handle themselves
    if (this.currentRoom && (this.currentRoom.type === 'combat' || this.currentRoom.type === 'elite')) {
      // Only auto-start if we have enemies
      if (this.enemyQueue.length > 0) {
        console.log('CombatFlowScene: Will start combat in 1.5 seconds');
        this.time.delayedCall(1500, () => {
          console.log('CombatFlowScene: Auto-start timer triggered');
          if (this.scene.isActive()) {
            this.processNextCombat();
          } else {
            console.log('CombatFlowScene: Scene no longer active, skipping auto-start');
          }
        });
      } else {
        console.log('CombatFlowScene: No enemies in queue!');
      }
    }
  }
  
  private showDepthIndicator(): void {
    const biome = ProceduralGeneration.getBiomeForDepth(this.currentDepth);
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, 50,
      `DEPTH ${this.currentDepth} - ${biome.replace('_', ' ').toUpperCase()}`, {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    text.setOrigin(0.5);
    
    // Fade in effect
    text.setAlpha(0);
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 500
    });
  }
  
  private generateRoom(): void {
    const biome = ProceduralGeneration.getBiomeForDepth(this.currentDepth);
    
    // Force first room to always be a combat room
    if (this.currentDepth === 1 && this.roomsCleared === 0) {
      console.log('CombatFlowScene: Generating first room - forcing combat');
      this.currentRoom = ProceduralGeneration.generateCombatRoom(this.currentDepth, biome);
    } else {
      this.currentRoom = ProceduralGeneration.generateRoomLayout(this.currentDepth, biome);
    }
    
    console.log(`CombatFlowScene: Generated ${this.currentRoom.type} room`);
    
    // Generate enemies based on room type
    if (this.currentRoom.type === 'treasure' || 
        this.currentRoom.type === 'rest' || 
        this.currentRoom.type === 'shop') {
      // Special rooms - no combat
      this.handleSpecialRoom();
    } else {
      // Combat rooms - generate enemies
      this.generateEnemies();
    }
  }
  
  private generateEnemies(): void {
    if (!this.currentRoom) {
      console.log('CombatFlowScene: No room to generate enemies for!');
      return;
    }
    
    const enemyCount = Phaser.Math.Between(
      this.currentRoom.enemyCount.min,
      this.currentRoom.enemyCount.max
    );
    
    console.log(`CombatFlowScene: Generating ${enemyCount} enemies for ${this.currentRoom.type} room`);
    
    let enemyTypes: Array<'brute' | 'hunter' | 'wisp' | 'hybrid'>;
    if (this.currentRoom.enemyTypes && this.currentRoom.enemyTypes.length > 0) {
      enemyTypes = this.currentRoom.enemyTypes as Array<'brute' | 'hunter' | 'wisp' | 'hybrid'>;
    } else {
      enemyTypes = ['brute', 'hunter', 'wisp'];
      if (this.currentDepth >= 5) {
        enemyTypes.push('hybrid');
      }
    }
    
    // Create enemy queue
    this.enemyQueue = [];
    for (let i = 0; i < enemyCount; i++) {
      const enemyType = Phaser.Math.RND.pick(enemyTypes);
      const depthMultiplier = 1 + (this.currentDepth - 1) * 0.2;
      
      const enemy: EnemyData = {
        id: `enemy_${Date.now()}_${i}`,
        type: enemyType,
        hp: Math.floor(this.getEnemyBaseHp(enemyType) * depthMultiplier),
        maxHp: Math.floor(this.getEnemyBaseHp(enemyType) * depthMultiplier),
        damage: Math.floor(this.getEnemyBaseDamage(enemyType) * depthMultiplier),
        rpsType: this.getEnemyRpsType(enemyType)
      };
      
      this.enemyQueue.push(enemy);
    }
    
    console.log(`CombatFlowScene: Created ${this.enemyQueue.length} enemies`);
    
    // Show enemy preview
    this.showEnemyPreview();
  }
  
  private showEnemyPreview(): void {
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2);
    
    const title = this.add.text(0, -50, `${this.enemyQueue.length} ENEMIES APPROACHING`, {
      fontSize: '24px',
      color: '#ff6666',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    title.setOrigin(0.5);
    
    // Show enemy types
    const enemyTypeCount = new Map<string, number>();
    this.enemyQueue.forEach(enemy => {
      enemyTypeCount.set(enemy.type, (enemyTypeCount.get(enemy.type) || 0) + 1);
    });
    
    let y = 0;
    enemyTypeCount.forEach((count, type) => {
      const text = this.add.text(0, y, `${count}x ${type.toUpperCase()}`, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace'
      });
      text.setOrigin(0.5);
      container.add(text);
      y += 25;
    });
    
    container.add(title);
    
    // Fade out and start combat
    this.time.delayedCall(2000, () => {
      console.log('CombatFlowScene: Enemy preview fade timer triggered');
      if (this.scene.isActive()) {
        this.tweens.add({
          targets: container,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            container.destroy();
            console.log('CombatFlowScene: Starting combat after enemy preview');
            // Start the first combat after preview
            this.processNextCombat();
          }
        });
      } else {
        console.log('CombatFlowScene: Scene no longer active during enemy preview');
      }
    });
  }
  
  private processNextCombat(): void {
    console.log('CombatFlowScene: processNextCombat called');
    if (this.isProcessing) {
      console.log('CombatFlowScene: Already processing, returning');
      return;
    }
    
    if (this.enemyQueue.length === 0) {
      console.log('CombatFlowScene: No more enemies, clearing room');
      // All enemies defeated - show upgrade selection
      this.onRoomCleared();
      return;
    }
    
    this.isProcessing = true;
    
    // Get next enemy
    const enemy = this.enemyQueue.shift()!;
    console.log('CombatFlowScene: Starting battle with enemy:', enemy);
    
    // Show "BATTLE X of Y" indicator
    const totalEnemies = this.roomsCleared + this.enemyQueue.length + 1;
    const battleNum = this.roomsCleared + 1;
    
    const battleText = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      `BATTLE ${battleNum} of ${totalEnemies}`, {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3
    });
    battleText.setOrigin(0.5);
    battleText.setDepth(100);
    
    // Start combat after delay
    this.time.delayedCall(1000, () => {
      battleText.destroy();
      this.startCombat(enemy);
    });
  }
  
  private startCombat(enemy: EnemyData): void {
    console.log('CombatFlowScene: startCombat called');
    
    // Get current player state
    const gameState = GameStateManager.getInstance();
    const playerState = gameState.getPlayerState()!;
    
    console.log('CombatFlowScene: Player state:', playerState);
    
    // Prepare combat data
    const encounterData: CombatEncounterData = {
      playerData: {
        hp: playerState.hp,
        maxHp: playerState.maxHp,
        damage: 10,
        rpsType: 'melee'
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
    
    console.log('CombatFlowScene: Launching CombatEncounterScene with data:', encounterData);
    
    // Start combat encounter
    this.scene.launch('CombatEncounterScene', encounterData);
    this.scene.bringToTop('TurnBasedCombatSystem');
  }
  
  private onCombatResolved(data: { winner: 'player' | 'enemy', enemyId: string }): void {
    console.log('CombatFlowScene: Combat resolved:', data);
    this.isProcessing = false;
    
    // Make sure this scene is visible
    this.scene.bringToTop();
    
    if (data.winner === 'player') {
      this.roomsCleared++;
      GameStateManager.getInstance().incrementRoomsCleared();
      
      // Calculate gold drop based on enemy type and depth
      const goldValue = this.calculateGoldDrop();
      
      // Add a slight delay to ensure scene transition is smooth
      this.time.delayedCall(300, () => {
        // Show victory message then exploration phase
        this.showSingleBattleVictory(() => {
          console.log('CombatFlowScene: Launching PostCombatExplorationScene');
          
          // Hide this scene and launch exploration
          this.scene.setVisible(false);
          this.scene.launch('PostCombatExplorationScene', { 
            depth: this.currentDepth,
            goldDrops: [goldValue]
          });
          
          // Listen for exploration complete
          this.scene.get('PostCombatExplorationScene').events.once('exploration-complete', () => {
            console.log('CombatFlowScene: Exploration complete, upgrade selected');
            
            // Make this scene visible again
            this.scene.setVisible(true);
            this.scene.stop('PostCombatExplorationScene');
            
            // Check if more enemies remain
            if (this.enemyQueue.length > 0) {
              // Show remaining enemies count
              this.showRemainingEnemies();
              
              // Continue to next combat
              this.time.delayedCall(1000, () => {
                this.processNextCombat();
              });
            } else {
              // All enemies defeated - show room cleared
              this.onRoomCleared();
            }
          });
        });
      });
    } else {
      // Player defeated
      this.onPlayerDeath();
    }
  }
  
  private onRoomCleared(): void {
    console.log('CombatFlowScene: Room cleared at depth', this.currentDepth);
    
    // Update game state
    GameStateManager.getInstance().incrementRoomsCleared();
    
    const roomType = this.currentRoom?.type || 'combat';
    
    // Since players now get upgrades after each battle, just show completion and exit options
    this.showVictoryScreen(() => {
      this.showExitOptions();
    });
  }
  
  private showVictoryScreen(callback: () => void): void {
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      'ROOM CLEARED!', {
      fontSize: '48px',
      color: '#00ff00',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    text.setScale(0);
    
    this.tweens.add({
      targets: text,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              text.destroy();
              callback();
            }
          });
        });
      }
    });
  }
  
  private showSingleBattleVictory(callback: () => void): void {
    // Make sure this scene is visible
    this.scene.bringToTop();
    
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      'VICTORY!', {
      fontSize: '42px',
      color: '#00ff00',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    text.setScale(0);
    text.setDepth(1000);
    
    this.tweens.add({
      targets: text,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              text.destroy();
              callback();
            }
          });
        });
      }
    });
  }
  
  private showRemainingEnemies(): void {
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      `${this.enemyQueue.length} ENEMIES REMAINING`, {
      fontSize: '28px',
      color: '#ff9999',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    text.setOrigin(0.5);
    text.setAlpha(0);
    
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 500,
            onComplete: () => text.destroy()
          });
        });
      }
    });
  }
  
  private showExitOptions(): void {
    console.log('CombatFlowScene: Showing exit options');
    
    const options = [
      { text: 'CONTINUE DEEPER', action: () => this.goDeeper() },
      { text: 'RETURN TO TOWN', action: () => this.returnToTown() }
    ];
    
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2);
    
    const title = this.add.text(0, -60, 'CHOOSE YOUR PATH', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    title.setOrigin(0.5);
    container.add(title);
    
    const buttons: Phaser.GameObjects.Text[] = [];
    
    options.forEach((option, index) => {
      const button = this.add.text(0, index * 50, option.text, {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
        fontFamily: 'monospace'
      });
      button.setOrigin(0.5);
      button.setInteractive({ useHandCursor: true });
      
      button.on('pointerover', () => {
        button.setBackgroundColor('#555555');
        button.setScale(1.1);
      });
      
      button.on('pointerout', () => {
        button.setBackgroundColor('#333333');
        button.setScale(1);
      });
      
      button.on('pointerdown', () => {
        console.log(`CombatFlowScene: Button clicked - ${option.text}`);
        
        // Disable all buttons to prevent multiple clicks
        buttons.forEach(btn => {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        });
        
        // Execute the action
        option.action();
      });
      
      buttons.push(button);
      container.add(button);
    });
  }
  
  private goDeeper(): void {
    const nextDepth = this.currentDepth + 1;
    console.log(`CombatFlowScene: Going deeper from depth ${this.currentDepth} to ${nextDepth}`);
    
    // Update game state depth
    GameStateManager.getInstance().incrementDepth();
    
    // Stop all active scenes to ensure clean transition
    this.scene.stop('CombatEncounterScene');
    this.scene.stop('TurnBasedCombatSystem');
    this.scene.stop('UpgradeCardSelectionScene');
    this.scene.stop('PostCombatExplorationScene');
    
    // Cleanup and restart with new depth
    this.cleanup();
    
    // Small delay to ensure scene cleanup
    this.time.delayedCall(100, () => {
      console.log(`CombatFlowScene: Starting new scene at depth ${nextDepth}`);
      this.scene.start('CombatFlowScene', { depth: nextDepth });
    });
  }
  
  private returnToTown(): void {
    console.log('CombatFlowScene: Returning to town...');
    
    const gameState = GameStateManager.getInstance();
    const totalShards = gameState.endRun();
    
    console.log(`Returning to town with ${totalShards} shards`);
    
    // Stop all related scenes
    this.scene.stop('CombatEncounterScene');
    this.scene.stop('TurnBasedCombatSystem');
    this.scene.stop('UpgradeCardSelectionScene');
    this.scene.stop('PostCombatExplorationScene');
    
    // Cleanup this scene
    this.cleanup();
    
    // Small delay to ensure all scenes are properly stopped
    this.time.delayedCall(100, () => {
      console.log('CombatFlowScene: Starting TownScene2D5');
      this.scene.start('TownScene2D5', { runComplete: true, shardsEarned: totalShards });
    });
  }
  
  private onPlayerDeath(): void {
    console.log('Player death triggered');
    
    const text = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2,
      'YOU DIED!\nReloading...', {
      fontSize: '48px',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    text.setDepth(3001);
    
    setTimeout(() => {
      console.log('Reloading page...');
      window.location.reload();
    }, 1500);
  }
  
  private handleSpecialRoom(): void {
    // Handle treasure, rest, and shop rooms
    const roomType = this.currentRoom?.type || 'treasure';
    
    // Mark room as cleared immediately for special rooms
    this.roomsCleared++;
    GameStateManager.getInstance().incrementRoomsCleared();
    
    switch (roomType) {
      case 'treasure':
        this.showTreasureRoom();
        break;
      case 'rest':
        this.showRestRoom();
        break;
      case 'shop':
        this.showShopRoom();
        break;
    }
  }
  
  private showTreasureRoom(): void {
    const reward = ProceduralGeneration.generateReward('treasure', this.currentDepth);
    
    if (reward && reward.type === 'shards' && reward.quantity) {
      GameStateManager.getInstance().addShards(reward.quantity);
    }
    
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2);
    
    const title = this.add.text(0, -120, 'TREASURE ROOM', {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3
    });
    title.setOrigin(0.5);
    
    const chest = this.add.rectangle(0, -20, 80, 60, 0x8b6914);
    const lid = this.add.rectangle(0, -50, 80, 30, 0xa0791a);
    
    const rewardText = this.add.text(0, 40,
      `+${reward?.quantity || 0} SHARDS`, {
      fontSize: '24px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    rewardText.setOrigin(0.5);
    
    container.add([title, chest, lid, rewardText]);
    
    // Animate chest opening
    this.tweens.add({
      targets: lid,
      y: -70,
      angle: -45,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        // Show exit options immediately after chest opens
        this.showExitOptions();
      }
    });
  }
  
  private showRestRoom(): void {
    const gameState = GameStateManager.getInstance();
    const playerState = gameState.getPlayerState()!;
    const healAmount = 3;
    
    // Heal player
    gameState.updatePlayerHP(Math.min(playerState.hp + healAmount, playerState.maxHp));
    
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2 - 50);
    
    const title = this.add.text(0, -80, 'REST ROOM', {
      fontSize: '32px',
      color: '#87ceeb',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3
    });
    title.setOrigin(0.5);
    
    const fountain = this.add.circle(0, 0, 40, 0x4682b4);
    const water = this.add.circle(0, 0, 30, 0x87ceeb);
    
    const healText = this.add.text(0, 60,
      `+${healAmount} HP`, {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    healText.setOrigin(0.5);
    
    container.add([title, fountain, water, healText]);
    
    // Water animation
    this.tweens.add({
      targets: water,
      scale: 1.2,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Don't destroy container, keep it visible
      }
    });
    
    // Show exit options immediately
    this.showExitOptions();
  }
  
  private showShopRoom(): void {
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2 - 50);
    
    const title = this.add.text(0, -40, 'SHOP', {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3
    });
    title.setOrigin(0.5);
    
    const subtitle = this.add.text(0, 0, '(Coming Soon)', {
      fontSize: '24px',
      color: '#cccccc',
      fontFamily: 'monospace'
    });
    subtitle.setOrigin(0.5);
    
    const shopkeep = this.add.text(0, 40, '🛒', {
      fontSize: '48px'
    });
    shopkeep.setOrigin(0.5);
    
    container.add([title, subtitle, shopkeep]);
    
    // Show exit options immediately
    this.showExitOptions();
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
  
  private cleanup(): void {
    console.log('CombatFlowScene: Cleaning up...');
    
    // Remove specific listener only
    this.scene.get('CombatEncounterScene').events.off('combat-resolved', this.onCombatResolved, this);
    
    // Clear any active tweens and timers
    this.tweens.killAll();
    this.time.removeAllEvents();
    
    // Clear enemy queue
    this.enemyQueue = [];
    
    // Reset processing flag
    this.isProcessing = false;
  }
  
  private calculateGoldDrop(): number {
    // Base gold increases with depth
    const baseGold = 5;
    const depthBonus = this.currentDepth * 2;
    const variance = Phaser.Math.Between(-2, 2);
    return Math.max(1, baseGold + depthBonus + variance);
  }
  
  shutdown(): void {
    console.log('CombatFlowScene: Shutting down...');
    this.cleanup();
  }
}