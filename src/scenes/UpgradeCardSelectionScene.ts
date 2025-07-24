import Phaser from 'phaser';
import { UpgradeCard, UpgradeCardSystem } from '../systems/UpgradeCardSystem';
import { GameStateManager } from '../systems/GameStateManager';

export class UpgradeCardSelectionScene extends Phaser.Scene {
  private cards: UpgradeCard[] = [];
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private selectedCard?: UpgradeCard;
  private depth: number = 1;
  
  constructor() {
    super({ key: 'UpgradeCardSelectionScene' });
  }
  
  init(data: { depth: number }): void {
    this.depth = data.depth || 1;
    this.selectedCard = undefined;
    this.cardContainers = [];
  }
  
  create(): void {
    console.log('UpgradeCardSelectionScene: Creating upgrade selection');
    
    // Make sure this scene is visible
    this.scene.bringToTop();
    
    // Dark background with full rectangle to ensure visibility
    this.cameras.main.setBackgroundColor(0x1a1a2e);
    const bg = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x1a1a2e
    );
    bg.setDepth(-1);
    
    // Title
    const title = this.add.text(this.scale.width / 2, 50, 'Choose an Upgrade', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setDepth(100);
    
    // Instructions
    const instructions = this.add.text(this.scale.width / 2, 90, 'Click a card to select', {
      fontSize: '18px',
      color: '#cccccc'
    });
    instructions.setOrigin(0.5);
    instructions.setDepth(100);
    
    // Generate 3 random cards
    try {
      this.cards = UpgradeCardSystem.generateRandomCards(3, this.depth);
      console.log('UpgradeCardSelectionScene: Generated cards:', this.cards);
    } catch (error) {
      console.error('Failed to generate cards:', error);
      // Fallback: create basic cards manually
      this.cards = [
        {
          id: 'fallback_1',
          name: 'Basic Blade',
          description: '+1 Attack to Sword',
          rarity: 'common' as 'common',
          action: 'blade' as 'blade',
          attackBonus: 1,
          shieldBonus: 0,
          iconEmoji: '⚔️'
        },
        {
          id: 'fallback_2',
          name: 'Basic Shield',
          description: '+1 Shield to Shield',
          rarity: 'common' as 'common',
          action: 'bulwark' as 'bulwark',
          attackBonus: 0,
          shieldBonus: 1,
          iconEmoji: '🛡️'
        },
        {
          id: 'fallback_3',
          name: 'Basic Focus',
          description: '+1 Attack to Magic',
          rarity: 'common' as 'common',
          action: 'focus' as 'focus',
          attackBonus: 1,
          shieldBonus: 0,
          iconEmoji: '✨'
        }
      ];
    }
    
    // Display cards
    const cardWidth = 200;
    const cardHeight = 280;
    const spacing = 250;
    const startX = this.scale.width / 2 - spacing;
    
    this.cards.forEach((card, index) => {
      const x = startX + index * spacing;
      const y = this.scale.height / 2;
      
      const container = this.createCardDisplay(card, x, y, cardWidth, cardHeight);
      container.setDepth(10 + index);
      this.cardContainers.push(container);
    });
    
    // Skip button (appears after delay)
    this.time.delayedCall(1000, () => {
      const skipButton = this.add.text(this.scale.width / 2, this.scale.height - 50, 
        'Skip (No Upgrade)', {
        fontSize: '20px',
        color: '#999999',
        backgroundColor: '#333333',
        padding: { x: 15, y: 8 }
      });
      skipButton.setOrigin(0.5);
      skipButton.setInteractive({ useHandCursor: true });
      
      skipButton.on('pointerover', () => {
        skipButton.setBackgroundColor('#444444');
      });
      
      skipButton.on('pointerout', () => {
        skipButton.setBackgroundColor('#333333');
      });
      
      skipButton.on('pointerdown', () => {
        this.confirmSelection(null);
      });
    });
  }
  
  private createCardDisplay(
    card: UpgradeCard, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Card background
    const bgColor = UpgradeCardSystem.getCardColor(card.rarity);
    const borderColor = UpgradeCardSystem.getCardBorderColor(card.rarity);
    
    const cardBg = this.add.rectangle(0, 0, width, height, bgColor);
    cardBg.setStrokeStyle(3, borderColor);
    cardBg.setInteractive({ useHandCursor: true });
    
    // Rarity indicator
    const rarityBg = this.add.rectangle(0, -height/2 + 20, width - 20, 30, borderColor);
    const rarityText = this.add.text(0, -height/2 + 20, card.rarity.toUpperCase(), {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    rarityText.setOrigin(0.5);
    
    // Card icon
    const icon = this.add.text(0, -60, card.iconEmoji || '?', {
      fontSize: '48px'
    });
    icon.setOrigin(0.5);
    
    // Card name
    const nameText = this.add.text(0, -20, card.name, {
      fontSize: '20px',
      color: '#000000',
      fontStyle: 'bold',
      wordWrap: { width: width - 20 }
    });
    nameText.setOrigin(0.5);
    
    // Description
    const descText = this.add.text(0, 20, card.description, {
      fontSize: '16px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: width - 30 }
    });
    descText.setOrigin(0.5);
    
    // Stats display
    const statsY = 80;
    if (card.attackBonus > 0) {
      const attackText = this.add.text(-40, statsY, `ATK +${card.attackBonus}`, {
        fontSize: '18px',
        color: '#ff0000',
        fontStyle: 'bold'
      });
      attackText.setOrigin(0.5);
      container.add(attackText);
    }
    
    if (card.shieldBonus > 0) {
      const shieldText = this.add.text(40, statsY, `SHD +${card.shieldBonus}`, {
        fontSize: '18px',
        color: '#0099ff',
        fontStyle: 'bold'
      });
      shieldText.setOrigin(0.5);
      container.add(shieldText);
    }
    
    // Add all elements to container
    container.add([cardBg, rarityBg, rarityText, icon, nameText, descText]);
    
    // Hover effects
    cardBg.on('pointerover', () => {
      container.setScale(1.05);
      cardBg.setStrokeStyle(5, 0xffffff);
    });
    
    cardBg.on('pointerout', () => {
      if (this.selectedCard !== card) {
        container.setScale(1);
        cardBg.setStrokeStyle(3, borderColor);
      }
    });
    
    cardBg.on('pointerdown', () => {
      // Visual feedback
      container.setScale(1.2);
      cardBg.setStrokeStyle(5, 0xffff00);
      
      // Flash effect
      this.tweens.add({
        targets: container,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.8,
        duration: 200,
        onComplete: () => {
          // Apply upgrade after animation
          this.confirmSelection(card);
        }
      });
    });
    
    return container;
  }
  
  // Removed selectCard and showConfirmButton methods - now using one-click selection
  
  private confirmSelection(card: UpgradeCard | null): void {
    if (card) {
      // Apply the upgrade
      const gameState = GameStateManager.getInstance();
      gameState.applyUpgradeCard(card.action, card.attackBonus, card.shieldBonus);
      gameState.addUpgradeCard(card.id);
      
      console.log(`Applied upgrade: ${card.name}`);
    } else {
      console.log('Skipped upgrade selection');
    }
    
    // Stop this scene - the CombatFlowScene is listening for the shutdown event
    this.scene.stop();
  }
}