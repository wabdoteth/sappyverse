import Phaser from 'phaser';
import { GameStateManager } from './GameStateManager';
import { CombatSpriteGenerator } from '../utils/CombatSpriteGenerator';
import { EnemyAI, AIState } from './EnemyAI';

export type CombatAction = 'sword' | 'shield' | 'magic';

export interface ActionStats {
  attack: number;
  shieldGain: number;
}

export interface CombatantData {
  id: string;
  hp: number;
  maxHp: number;
  barrier: number;
  maxBarrier: number;
  baseStats: {
    sword: ActionStats;
    shield: ActionStats;
    magic: ActionStats;
  };
  charges: {
    sword: number;
    shield: number;
    magic: number;
  };
  sprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
}

export interface CombatResult {
  winner: 'player' | 'enemy' | 'draw';
  playerAction: CombatAction;
  enemyAction: CombatAction;
  playerDamage: number;
  enemyDamage: number;
  playerShieldGain: number;
  enemyShieldGain: number;
}

export class TurnBasedCombatSystem extends Phaser.Scene {
  private player!: CombatantData;
  private enemy!: CombatantData;
  private playerSelectedAction?: CombatAction;
  private enemySelectedAction?: CombatAction;
  // Timer removed - players have unlimited time to decide
  // private decisionTimer: number = 3000; // 3 seconds
  // private currentTimer: number = 0;
  private timerBar?: Phaser.GameObjects.Rectangle;
  private timerBarBg?: Phaser.GameObjects.Rectangle;
  
  private playerSprite?: Phaser.GameObjects.Container;
  private enemySprite?: Phaser.GameObjects.Container;
  
  private actionButtons: Map<CombatAction, Phaser.GameObjects.Container> = new Map();
  private isProcessingTurn: boolean = false;
  private turnNumber: number = 0;
  private playerLastAction?: CombatAction;
  private enemyType: 'brute' | 'hunter' | 'wisp' | 'hybrid' = 'brute';
  private depth: number = 1;
  
  constructor() {
    super({ key: 'TurnBasedCombatSystem' });
  }
  
  init(data: { player: CombatantData; enemy: CombatantData; enemyType?: string; depth?: number }): void {
    this.player = this.initializeCombatant(data.player);
    this.enemy = this.initializeCombatant(data.enemy);
    this.playerSelectedAction = undefined;
    this.enemySelectedAction = undefined;
    this.isProcessingTurn = false;
    this.turnNumber = 0;
    this.playerLastAction = undefined;
    this.enemyType = (data.enemyType as any) || 'brute';
    this.depth = data.depth || 1;
  }
  
  private initializeCombatant(data: Partial<CombatantData>): CombatantData {
    return {
      id: data.id || 'unknown',
      hp: data.hp || 10,
      maxHp: data.maxHp || 10,
      barrier: data.barrier || 0,
      maxBarrier: data.maxBarrier || 3,
      baseStats: data.baseStats || {
        sword: { attack: 4, shieldGain: 0 },
        shield: { attack: 0, shieldGain: 4 },
        magic: { attack: 2, shieldGain: 2 }
      },
      charges: data.charges || {
        sword: 3,
        shield: 3,
        magic: 3
      },
      sprite: data.sprite
    };
  }
  
  create(): void {
    // Set dark combat background
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    
    // Create side-view combat arena
    this.createCombatArena();
    
    // Create combatant sprites
    this.createCombatantSprites();
    
    // Create action selection UI
    this.createActionUI();
    
    // Create health/barrier displays
    this.createHealthUI();
    
    // Timer removed - no need for timer bar
    // this.createTimerBar();
    
    // Start first turn
    this.startTurn();
  }
  
  private createCombatArena(): void {
    const centerY = this.scale.height / 2;
    
    // Arena floor
    const floor = this.add.rectangle(
      this.scale.width / 2,
      centerY + 100,
      this.scale.width,
      200,
      0x2a2a3e
    );
    
    // Battle line
    const battleLine = this.add.line(
      this.scale.width / 2,
      centerY,
      -50, 0, 50, 0,
      0x666666,
      0.5
    );
    battleLine.setLineWidth(2);
  }
  
  private createCombatantSprites(): void {
    const centerY = this.scale.height / 2;
    
    // Player on left
    this.playerSprite = this.add.container(150, centerY);
    const playerTexture = CombatSpriteGenerator.generatePlayerCombatSprite(this);
    const playerImage = this.add.image(0, 0, playerTexture);
    this.playerSprite.add(playerImage);
    
    // Add subtle breathing animation
    this.tweens.add({
      targets: playerImage,
      scaleY: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Enemy on right - determine type from init data
    const enemyType = (this.scene.settings.data as any)?.enemyType || 'brute';
    this.enemySprite = this.add.container(this.scale.width - 150, centerY);
    const enemyTexture = CombatSpriteGenerator.generateEnemySprite(this, enemyType);
    const enemyImage = this.add.image(0, 0, enemyTexture);
    this.enemySprite.add(enemyImage);
    
    // Enemy idle animation
    this.tweens.add({
      targets: enemyImage,
      scaleY: 1.02,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  private createActionUI(): void {
    const bottomY = this.scale.height - 100;
    const centerX = this.scale.width / 2;
    const spacing = 140;
    
    const actions: CombatAction[] = ['sword', 'shield', 'magic'];
    const icons = { sword: '⚔️', shield: '🛡️', magic: '✨' };
    const colors = { sword: 0xff6666, shield: 0x6666ff, magic: 0xff66ff };
    const darkColors = { sword: 0x993333, shield: 0x333399, magic: 0x993399 };
    
    actions.forEach((action, index) => {
      const x = centerX + (index - 1) * spacing;
      const button = this.add.container(x, bottomY);
      
      // Outer frame (retro border)
      const outerFrame = this.add.rectangle(0, 0, 110, 90, 0x000000);
      const innerFrame = this.add.rectangle(0, 0, 106, 86, darkColors[action]);
      
      // Button background with gradient effect
      const bgGradient = this.add.rectangle(0, -2, 102, 82, colors[action]);
      const bgMain = this.add.rectangle(0, 0, 102, 82, darkColors[action]);
      bgMain.setInteractive({ useHandCursor: true });
      
      // Pixel border highlight
      const topHighlight = this.add.rectangle(0, -40, 100, 2, 0xffffff);
      topHighlight.setAlpha(0.3);
      const leftHighlight = this.add.rectangle(-50, 0, 2, 80, 0xffffff);
      leftHighlight.setAlpha(0.3);
      
      // Action icon with shadow
      const iconShadow = this.add.text(2, -18, icons[action], {
        fontSize: '24px',
        color: '#000000'
      });
      iconShadow.setOrigin(0.5);
      iconShadow.setAlpha(0.5);
      
      const icon = this.add.text(0, -20, icons[action], {
        fontSize: '24px'
      });
      icon.setOrigin(0.5);
      
      // Stats display with retro font
      const stats = this.player.baseStats[action];
      let statsText = '';
      if (stats.attack > 0) statsText += `ATK: ${stats.attack}`;
      if (stats.shieldGain > 0) {
        if (statsText) statsText += ' | ';
        statsText += `SHD: ${stats.shieldGain}`;
      }
      
      const statsDisplay = this.add.text(0, 0, statsText, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2
      });
      statsDisplay.setOrigin(0.5);
      
      // Charge counter with pixel style
      const chargeContainer = this.add.container(0, 25);
      
      // Charge pips (visual representation)
      for (let i = 0; i < 3; i++) {
        const pipX = (i - 1) * 12;
        const pipBg = this.add.rectangle(pipX, 0, 8, 8, 0x000000);
        const pip = this.add.rectangle(pipX, 0, 6, 6, 0xffff00);
        pip.setData('index', i);
        chargeContainer.add([pipBg, pip]);
      }
      
      const chargeText = this.add.text(0, 12, `${this.player.charges[action]}/3`, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 1
      });
      chargeText.setOrigin(0.5);
      chargeText.setVisible(false); // Hide text, use pips instead
      
      button.add([outerFrame, innerFrame, bgGradient, bgMain, topHighlight, leftHighlight, iconShadow, icon, statsDisplay, chargeContainer, chargeText]);
      button.setData('action', action);
      button.setData('chargeText', chargeText);
      button.setData('chargeContainer', chargeContainer);
      button.setData('statsDisplay', statsDisplay);
      button.setData('bgMain', bgMain);
      button.setData('outerFrame', outerFrame);
      
      // Add upgrade indicator if stats are upgraded
      const baseStats = { 
        sword: { attack: 4, shieldGain: 0 },
        shield: { attack: 0, shieldGain: 4 },
        magic: { attack: 2, shieldGain: 2 }
      };
      
      if (stats.attack > baseStats[action].attack || stats.shieldGain > baseStats[action].shieldGain) {
        const upgradeIcon = this.add.text(40, -30, '⬆', {
          fontSize: '16px',
          color: '#00ff00'
        });
        upgradeIcon.setOrigin(0.5);
        button.add(upgradeIcon);
        
        // Glow effect for upgraded actions
        this.tweens.add({
          targets: upgradeIcon,
          alpha: 0.5,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      }
      
      // Update charge pips
      this.updateChargePips(chargeContainer, this.player.charges[action]);
      
      // Disable if no charges
      if (this.player.charges[action] === 0) {
        bgMain.setAlpha(0.3);
        bgMain.disableInteractive();
        icon.setAlpha(0.5);
        statsDisplay.setAlpha(0.5);
      }
      
      // Click handler
      bgMain.on('pointerdown', () => this.selectAction(action));
      bgMain.on('pointerover', () => {
        if (this.player.charges[action] > 0 && !this.isProcessingTurn) {
          button.setScale(1.05);
          outerFrame.setStrokeStyle(2, 0xffffff, 0.5);
        }
      });
      bgMain.on('pointerout', () => {
        button.setScale(1);
        outerFrame.setStrokeStyle(0);
      });
      
      this.actionButtons.set(action, button);
    });
  }
  
  private updateChargePips(container: Phaser.GameObjects.Container, charges: number): void {
    const pips = container.list.filter(obj => obj.getData && obj.getData('index') !== undefined);
    pips.forEach((pip, index) => {
      if (index < charges) {
        (pip as Phaser.GameObjects.Rectangle).setFillStyle(0xffff00);
      } else {
        (pip as Phaser.GameObjects.Rectangle).setFillStyle(0x333333);
      }
    });
  }
  
  private createHealthUI(): void {
    // Player health/barrier
    this.createHealthBar(50, 30, this.player, 'Player');
    
    // Enemy health/barrier
    this.createHealthBar(this.scale.width - 250, 30, this.enemy, 'Enemy');
  }
  
  private createHealthBar(x: number, y: number, combatant: CombatantData, label: string): void {
    const container = this.add.container(x, y);
    
    // Retro frame
    const frameBg = this.add.rectangle(0, 10, 206, 26, 0x000000);
    frameBg.setOrigin(0, 0.5);
    const frameInner = this.add.rectangle(1, 10, 204, 24, 0x1a1a1a);
    frameInner.setOrigin(0, 0.5);
    
    // Label with retro style
    const labelText = this.add.text(0, -10, label.toUpperCase(), {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // HP Bar with gradient effect
    const hpBarBg = this.add.rectangle(3, 10, 200, 20, 0x440000);
    hpBarBg.setOrigin(0, 0.5);
    
    // HP segments (for retro feel)
    const hpSegments = Math.ceil(combatant.maxHp / 2);
    const segmentWidth = 200 / hpSegments;
    const hpSegmentContainer = this.add.container(3, 10);
    
    for (let i = 0; i < hpSegments; i++) {
      const segment = this.add.rectangle(i * segmentWidth + segmentWidth/2, 0, segmentWidth - 2, 18, 0xff0000);
      segment.setOrigin(0.5, 0.5);
      hpSegmentContainer.add(segment);
    }
    
    // HP highlight
    const hpHighlight = this.add.rectangle(3, 6, 200 * (combatant.hp / combatant.maxHp), 2, 0xffaaaa);
    hpHighlight.setOrigin(0, 0.5);
    hpHighlight.setAlpha(0.8);
    
    // HP text overlay
    const hpText = this.add.text(105, 10, `${combatant.hp}/${combatant.maxHp}`, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    });
    hpText.setOrigin(0.5, 0.5);
    
    // Barrier Bar with crystal effect
    const barrierFrame = this.add.rectangle(0, 35, 206, 14, 0x000000);
    barrierFrame.setOrigin(0, 0.5);
    const barrierInner = this.add.rectangle(1, 35, 204, 12, 0x002233);
    barrierInner.setOrigin(0, 0.5);
    
    const barrierBarBg = this.add.rectangle(3, 35, 200, 8, 0x004466);
    barrierBarBg.setOrigin(0, 0.5);
    
    // Barrier crystals
    const barrierCrystals = this.add.container(3, 35);
    for (let i = 0; i < combatant.maxBarrier; i++) {
      const crystalX = (i + 0.5) * (200 / combatant.maxBarrier);
      const crystal = this.add.polygon(crystalX, 0, [0,-4, 3,0, 0,4, -3,0], 0x00ffff);
      crystal.setStrokeStyle(1, 0x00aaaa);
      barrierCrystals.add(crystal);
    }
    
    // Barrier shine effect
    const barrierShine = this.add.rectangle(3, 33, 200 * (combatant.barrier / combatant.maxBarrier), 2, 0xaaffff);
    barrierShine.setOrigin(0, 0.5);
    barrierShine.setAlpha(0.6);
    
    container.add([frameBg, frameInner, labelText, hpBarBg, hpSegmentContainer, hpHighlight, hpText, 
                   barrierFrame, barrierInner, barrierBarBg, barrierCrystals, barrierShine]);
    
    // Store references for updates
    if (label === 'Player') {
      this.playerSprite?.setData('healthContainer', container);
      this.playerSprite?.setData('hpSegments', hpSegmentContainer);
      this.playerSprite?.setData('hpHighlight', hpHighlight);
      this.playerSprite?.setData('hpText', hpText);
      this.playerSprite?.setData('barrierCrystals', barrierCrystals);
      this.playerSprite?.setData('barrierShine', barrierShine);
    } else {
      this.enemySprite?.setData('healthContainer', container);
      this.enemySprite?.setData('hpSegments', hpSegmentContainer);
      this.enemySprite?.setData('hpHighlight', hpHighlight);
      this.enemySprite?.setData('hpText', hpText);
      this.enemySprite?.setData('barrierCrystals', barrierCrystals);
      this.enemySprite?.setData('barrierShine', barrierShine);
    }
  }
  
  // Timer bar method removed - players have unlimited decision time
  // private createTimerBar(): void { }
  
  private startTurn(): void {
    // No timer - player has unlimited time
    this.playerSelectedAction = undefined;
    this.enemySelectedAction = undefined;
    this.isProcessingTurn = false;
    this.turnNumber++;
    
    // Enable available actions
    this.updateActionButtons();
    
    // AI selects action immediately but hides it
    this.selectEnemyAction();
  }
  
  private selectAction(action: CombatAction): void {
    if (this.isProcessingTurn) return;
    if (this.player.charges[action] === 0) return;
    
    this.playerSelectedAction = action;
    
    // Visual feedback
    this.actionButtons.forEach((button, buttonAction) => {
      const outerFrame = button.getData('outerFrame') as Phaser.GameObjects.Rectangle;
      if (buttonAction === action) {
        outerFrame.setStrokeStyle(3, 0xffffff);
        button.setScale(1.1);
        // Add selection glow
        this.tweens.add({
          targets: button,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 200,
          yoyo: true,
          repeat: 0
        });
      } else {
        outerFrame.setStrokeStyle(0);
        button.setScale(1);
      }
    });
    
    // If both have selected, resolve immediately
    if (this.enemySelectedAction) {
      this.resolveTurn();
    }
  }
  
  private selectEnemyAction(): void {
    // Use AI system to select action
    const aiState: AIState = {
      enemyType: this.enemyType,
      enemyHp: this.enemy.hp,
      enemyMaxHp: this.enemy.maxHp,
      enemyBarrier: this.enemy.barrier,
      enemyCharges: { ...this.enemy.charges },
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      playerBarrier: this.player.barrier,
      playerLastAction: this.playerLastAction,
      turnNumber: this.turnNumber,
      depth: this.depth
    };
    
    this.enemySelectedAction = EnemyAI.getActionForEnemy(aiState);
    
    // Show AI pattern name for debugging/flavor
    const patternName = EnemyAI.getPatternName(this.enemyType, this.depth);
    console.log(`Enemy (${this.enemyType}) using ${patternName} AI pattern`);
  }
  
  private resolveTurn(): void {
    if (!this.playerSelectedAction || !this.enemySelectedAction) return;
    
    this.isProcessingTurn = true;
    
    // Determine winner based on RPS rules
    const result = this.calculateCombatResult(
      this.playerSelectedAction,
      this.enemySelectedAction
    );
    
    // Show action animations
    this.showActionAnimations(result);
    
    // Apply results after animation
    this.time.delayedCall(1000, () => {
      this.applyTurnResults(result);
      
      // Check for combat end
      if (this.player.hp <= 0 || this.enemy.hp <= 0) {
        this.endCombat();
      } else {
        // Regenerate charges
        this.regenerateCharges();
        
        // Start next turn
        this.time.delayedCall(500, () => {
          this.startTurn();
        });
      }
    });
  }
  
  private calculateCombatResult(playerAction: CombatAction, enemyAction: CombatAction): CombatResult {
    const result: CombatResult = {
      winner: 'draw',
      playerAction,
      enemyAction,
      playerDamage: 0,
      enemyDamage: 0,
      playerShieldGain: 0,
      enemyShieldGain: 0
    };
    
    // RPS logic: Sword beats Magic, Magic beats Shield, Shield beats Sword
    const wins: Record<CombatAction, CombatAction> = {
      sword: 'magic',
      shield: 'sword',
      magic: 'shield'
    };
    
    if (wins[playerAction] === enemyAction) {
      // Player wins
      result.winner = 'player';
      result.enemyDamage = this.player.baseStats[playerAction].attack;
      result.playerShieldGain = this.player.baseStats[playerAction].shieldGain;
      // Enemy values cancelled
    } else if (wins[enemyAction] === playerAction) {
      // Enemy wins
      result.winner = 'enemy';
      result.playerDamage = this.enemy.baseStats[enemyAction].attack;
      result.enemyShieldGain = this.enemy.baseStats[enemyAction].shieldGain;
      // Player values cancelled
    } else {
      // Draw - both apply
      result.playerDamage = this.enemy.baseStats[enemyAction].attack;
      result.enemyDamage = this.player.baseStats[playerAction].attack;
      result.playerShieldGain = this.player.baseStats[playerAction].shieldGain;
      result.enemyShieldGain = this.enemy.baseStats[enemyAction].shieldGain;
    }
    
    return result;
  }
  
  private showActionAnimations(result: CombatResult): void {
    // Show selected actions above combatants
    const playerActionText = this.add.text(150, this.scale.height / 2 - 60, 
      result.playerAction.toUpperCase(), {
      fontSize: '24px',
      color: this.getActionColor(result.playerAction)
    });
    playerActionText.setOrigin(0.5);
    
    const enemyActionText = this.add.text(this.scale.width - 150, this.scale.height / 2 - 60,
      result.enemyAction.toUpperCase(), {
      fontSize: '24px',
      color: this.getActionColor(result.enemyAction)
    });
    enemyActionText.setOrigin(0.5);
    
    // Show winner/loser/draw
    const resultText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100,
      result.winner === 'draw' ? 'DRAW!' : `${result.winner.toUpperCase()} WINS!`, {
      fontSize: '36px',
      color: result.winner === 'player' ? '#00ff00' : result.winner === 'enemy' ? '#ff0000' : '#ffff00'
    });
    resultText.setOrigin(0.5);
    
    // Fade out after delay
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: [playerActionText, enemyActionText, resultText],
        alpha: 0,
        duration: 200,
        onComplete: () => {
          playerActionText.destroy();
          enemyActionText.destroy();
          resultText.destroy();
        }
      });
    });
  }
  
  private getActionColor(action: CombatAction): string {
    const colors = {
      sword: '#ff6666',
      shield: '#6666ff',
      magic: '#ff66ff'
    };
    return colors[action];
  }
  
  private applyTurnResults(result: CombatResult): void {
    // Apply damage (barrier first, then HP)
    if (result.playerDamage > 0) {
      const damageAfterBarrier = Math.max(0, result.playerDamage - this.player.barrier);
      this.player.barrier = Math.max(0, this.player.barrier - result.playerDamage);
      this.player.hp = Math.max(0, this.player.hp - damageAfterBarrier);
      
      // Update game state
      GameStateManager.getInstance().updatePlayerHP(this.player.hp);
      GameStateManager.getInstance().updatePlayerBarrier(this.player.barrier);
    }
    
    if (result.enemyDamage > 0) {
      const damageAfterBarrier = Math.max(0, result.enemyDamage - this.enemy.barrier);
      this.enemy.barrier = Math.max(0, this.enemy.barrier - result.enemyDamage);
      this.enemy.hp = Math.max(0, this.enemy.hp - damageAfterBarrier);
    }
    
    // Apply shield gains
    this.player.barrier = Math.min(this.player.maxBarrier, this.player.barrier + result.playerShieldGain);
    this.enemy.barrier = Math.min(this.enemy.maxBarrier, this.enemy.barrier + result.enemyShieldGain);
    
    // Update game state for player barrier
    if (result.playerShieldGain > 0) {
      GameStateManager.getInstance().updatePlayerBarrier(this.player.barrier);
    }
    
    // Consume charges
    this.player.charges[result.playerAction]--;
    this.enemy.charges[result.enemyAction]--;
    
    // Store player action for AI
    this.playerLastAction = result.playerAction;
    
    // Update UI
    this.updateHealthBars();
    this.updateActionButtons();
  }
  
  private regenerateCharges(): void {
    // Regenerate 1 charge for unused actions
    (['sword', 'shield', 'magic'] as CombatAction[]).forEach(action => {
      if (action !== this.playerSelectedAction) {
        this.player.charges[action] = Math.min(3, this.player.charges[action] + 1);
      }
      if (action !== this.enemySelectedAction) {
        this.enemy.charges[action] = Math.min(3, this.enemy.charges[action] + 1);
      }
    });
  }
  
  private updateHealthBars(): void {
    // Update player bars
    this.updateCombatantHealthBar(this.playerSprite, this.player);
    
    // Update enemy bars
    this.updateCombatantHealthBar(this.enemySprite, this.enemy);
  }
  
  private updateCombatantHealthBar(sprite: Phaser.GameObjects.Container | undefined, combatant: CombatantData): void {
    if (!sprite) return;
    
    // Update HP segments
    const hpSegments = sprite.getData('hpSegments') as Phaser.GameObjects.Container;
    if (hpSegments) {
      const segments = hpSegments.list as Phaser.GameObjects.Rectangle[];
      const hpPerSegment = combatant.maxHp / segments.length;
      segments.forEach((segment, index) => {
        const segmentHp = (index + 1) * hpPerSegment;
        if (combatant.hp >= segmentHp) {
          segment.setFillStyle(0xff0000);
          segment.setAlpha(1);
        } else if (combatant.hp > index * hpPerSegment) {
          // Partial segment
          const partial = (combatant.hp - index * hpPerSegment) / hpPerSegment;
          segment.setFillStyle(0xff0000);
          segment.setAlpha(0.3 + partial * 0.7);
        } else {
          segment.setFillStyle(0x440000);
          segment.setAlpha(0.3);
        }
      });
    }
    
    // Update HP highlight
    const hpHighlight = sprite.getData('hpHighlight') as Phaser.GameObjects.Rectangle;
    if (hpHighlight) {
      hpHighlight.width = 200 * (combatant.hp / combatant.maxHp);
    }
    
    // Update HP text
    const hpText = sprite.getData('hpText') as Phaser.GameObjects.Text;
    if (hpText) {
      hpText.setText(`${combatant.hp}/${combatant.maxHp}`);
    }
    
    // Update barrier crystals
    const barrierCrystals = sprite.getData('barrierCrystals') as Phaser.GameObjects.Container;
    if (barrierCrystals) {
      const crystals = barrierCrystals.list as Phaser.GameObjects.Polygon[];
      crystals.forEach((crystal, index) => {
        if (index < combatant.barrier) {
          crystal.setFillStyle(0x00ffff);
          crystal.setAlpha(1);
          // Add glow effect
          this.tweens.add({
            targets: crystal,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 0
          });
        } else {
          crystal.setFillStyle(0x004466);
          crystal.setAlpha(0.5);
        }
      });
    }
    
    // Update barrier shine
    const barrierShine = sprite.getData('barrierShine') as Phaser.GameObjects.Rectangle;
    if (barrierShine) {
      barrierShine.width = 200 * (combatant.barrier / combatant.maxBarrier);
    }
  }
  
  private updateActionButtons(): void {
    this.actionButtons.forEach((button, action) => {
      const bgMain = button.getData('bgMain') as Phaser.GameObjects.Rectangle;
      const chargeText = button.getData('chargeText') as Phaser.GameObjects.Text;
      const chargeContainer = button.getData('chargeContainer') as Phaser.GameObjects.Container;
      const icon = button.list[7] as Phaser.GameObjects.Text; // icon is at index 7
      const statsDisplay = button.getData('statsDisplay') as Phaser.GameObjects.Text;
      
      chargeText.setText(`${this.player.charges[action]}/3`);
      this.updateChargePips(chargeContainer, this.player.charges[action]);
      
      if (this.player.charges[action] === 0) {
        bgMain.setAlpha(0.3);
        bgMain.disableInteractive();
        icon.setAlpha(0.5);
        statsDisplay.setAlpha(0.5);
      } else {
        bgMain.setAlpha(1);
        bgMain.setInteractive();
        icon.setAlpha(1);
        statsDisplay.setAlpha(1);
      }
    });
  }
  
  private endCombat(): void {
    const winner = this.player.hp > 0 ? 'player' : 'enemy';
    
    // Show victory/defeat screen
    const resultText = this.add.text(this.scale.width / 2, this.scale.height / 2,
      winner === 'player' ? 'VICTORY!' : 'DEFEAT!', {
      fontSize: '48px',
      color: winner === 'player' ? '#00ff00' : '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    resultText.setOrigin(0.5);
    
    // Emit combat-end event
    this.time.delayedCall(2000, () => {
      this.events.emit('combat-end', { winner });
    });
  }
  
  update(time: number, delta: number): void {
    // Timer removed - player has unlimited time to make decisions
    // No auto-selection needed
  }
}