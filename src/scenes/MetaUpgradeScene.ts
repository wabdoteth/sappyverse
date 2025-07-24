import Phaser from 'phaser';
import { MetaProgression, MetaUpgrade } from '../systems/MetaProgression';
import { GAME_CONFIG } from '../config/GameConfig';

export class MetaUpgradeScene extends Phaser.Scene {
  private metaProgression!: MetaProgression;
  private upgradeContainers: Phaser.GameObjects.Container[] = [];
  private selectedUpgrade?: MetaUpgrade;
  private shardsText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'MetaUpgradeScene' });
  }
  
  create(): void {
    this.metaProgression = MetaProgression.getInstance();
    this.upgradeContainers = [];
    
    // Dark overlay background
    const overlay = this.add.rectangle(
      GAME_CONFIG.BASE_WIDTH / 2,
      GAME_CONFIG.BASE_HEIGHT / 2,
      GAME_CONFIG.BASE_WIDTH,
      GAME_CONFIG.BASE_HEIGHT,
      0x000000,
      0.8
    );
    overlay.setInteractive();
    
    // Main panel
    const panelWidth = 700;
    const panelHeight = 500;
    const panel = this.add.rectangle(
      GAME_CONFIG.BASE_WIDTH / 2,
      GAME_CONFIG.BASE_HEIGHT / 2,
      panelWidth,
      panelHeight,
      0x2a2a3e
    );
    panel.setStrokeStyle(2, 0x4a4a5e);
    
    // Title
    const title = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, 100, 'Permanent Upgrades', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    
    // Shards display
    this.shardsText = this.add.text(GAME_CONFIG.BASE_WIDTH / 2, 140, 
      `Shards: ${this.metaProgression.getTotalShards()}`, {
      fontSize: '20px',
      color: '#ffd700'
    });
    this.shardsText.setOrigin(0.5);
    
    // Create scroll container for upgrades
    const scrollY = 180;
    const scrollHeight = 250;
    this.createUpgradeList(scrollY, scrollHeight);
    
    // Close button
    const closeButton = this.add.text(GAME_CONFIG.BASE_WIDTH - 100, 80, 'X', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 15, y: 5 }
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    
    closeButton.on('pointerover', () => {
      closeButton.setBackgroundColor('#ff3333');
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setBackgroundColor('#ff0000');
    });
    
    closeButton.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('TownScene2D5');
    });
    
    // ESC to close
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      this.scene.stop();
      this.scene.resume('TownScene2D5');
    });
  }
  
  private createUpgradeList(startY: number, height: number): void {
    const upgrades = this.metaProgression.getAvailableUpgrades();
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, startY);
    
    let yOffset = 0;
    upgrades.forEach((upgrade, index) => {
      const upgradeContainer = this.createUpgradeDisplay(upgrade, 0, yOffset);
      container.add(upgradeContainer);
      this.upgradeContainers.push(upgradeContainer);
      yOffset += 80;
    });
    
    // Show completed upgrades too
    const allUpgrades = this.metaProgression.getAllUpgrades();
    const completedUpgrades = allUpgrades.filter(u => u.currentLevel >= u.maxLevel);
    
    if (completedUpgrades.length > 0 && upgrades.length > 0) {
      yOffset += 20; // Extra spacing
    }
    
    completedUpgrades.forEach(upgrade => {
      const upgradeContainer = this.createUpgradeDisplay(upgrade, 0, yOffset, true);
      container.add(upgradeContainer);
      yOffset += 80;
    });
    
    // Add mask for scrolling if needed
    if (yOffset > height) {
      const mask = this.make.graphics();
      mask.fillRect(
        GAME_CONFIG.BASE_WIDTH / 2 - 320,
        startY - height / 2,
        640,
        height
      );
      container.setMask(mask.createGeometryMask());
      
      // Enable scrolling
      let scrollPos = 0;
      this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
        scrollPos += deltaY * 0.5;
        scrollPos = Phaser.Math.Clamp(scrollPos, -(yOffset - height), 0);
        container.setY(startY + scrollPos);
      });
    }
  }
  
  private createUpgradeDisplay(
    upgrade: MetaUpgrade, 
    x: number, 
    y: number,
    isCompleted: boolean = false
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 600;
    const height = 70;
    
    // Background
    const bgColor = isCompleted ? 0x1a1a2e : 0x3a3a4e;
    const bg = this.add.rectangle(0, 0, width, height, bgColor);
    bg.setStrokeStyle(2, isCompleted ? 0x2a2a3e : 0x5a5a6e);
    
    if (!isCompleted) {
      bg.setInteractive({ useHandCursor: true });
      
      bg.on('pointerover', () => {
        bg.setFillStyle(0x4a4a5e);
      });
      
      bg.on('pointerout', () => {
        bg.setFillStyle(bgColor);
      });
      
      bg.on('pointerdown', () => {
        this.selectUpgrade(upgrade, container);
      });
    }
    
    // Name
    const nameText = this.add.text(-280, -20, upgrade.name, {
      fontSize: '18px',
      color: isCompleted ? '#888888' : '#ffffff',
      fontStyle: 'bold'
    });
    
    // Description
    const descText = this.add.text(-280, 0, upgrade.description, {
      fontSize: '14px',
      color: isCompleted ? '#666666' : '#cccccc'
    });
    
    // Level indicator
    const levelText = this.add.text(150, -10, 
      `${upgrade.currentLevel}/${upgrade.maxLevel}`, {
      fontSize: '16px',
      color: isCompleted ? '#00ff00' : '#ffffff'
    });
    levelText.setOrigin(0.5);
    
    // Cost or status
    if (isCompleted) {
      const maxedText = this.add.text(250, 0, 'MAXED', {
        fontSize: '16px',
        color: '#00ff00',
        fontStyle: 'bold'
      });
      maxedText.setOrigin(0.5);
      container.add(maxedText);
    } else {
      const cost = this.metaProgression.getUpgradeCost(upgrade);
      const canAfford = this.metaProgression.canAffordUpgrade(upgrade.id);
      const costText = this.add.text(250, 0, `${cost} Shards`, {
        fontSize: '16px',
        color: canAfford ? '#ffd700' : '#ff0000',
        fontStyle: 'bold'
      });
      costText.setOrigin(0.5);
      container.add(costText);
    }
    
    container.add([bg, nameText, descText, levelText]);
    
    return container;
  }
  
  private selectUpgrade(upgrade: MetaUpgrade, container: Phaser.GameObjects.Container): void {
    this.selectedUpgrade = upgrade;
    
    // Show purchase confirmation
    const cost = this.metaProgression.getUpgradeCost(upgrade);
    const canAfford = this.metaProgression.canAffordUpgrade(upgrade.id);
    
    if (!canAfford) {
      // Flash insufficient funds
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      this.tweens.add({
        targets: bg,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 2
      });
      return;
    }
    
    // Create confirmation dialog
    const confirmContainer = this.add.container(
      GAME_CONFIG.BASE_WIDTH / 2,
      GAME_CONFIG.BASE_HEIGHT / 2
    );
    
    const confirmBg = this.add.rectangle(0, 0, 400, 200, 0x1a1a2e);
    confirmBg.setStrokeStyle(3, 0xffd700);
    
    const confirmText = this.add.text(0, -50, 
      `Purchase ${upgrade.name}?`, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    });
    confirmText.setOrigin(0.5);
    
    const costConfirmText = this.add.text(0, -20,
      `Cost: ${cost} Shards`, {
      fontSize: '18px',
      color: '#ffd700'
    });
    costConfirmText.setOrigin(0.5);
    
    const effectText = this.add.text(0, 10,
      upgrade.description, {
      fontSize: '14px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: 350 }
    });
    effectText.setOrigin(0.5);
    
    // Buttons
    const yesButton = this.add.text(-60, 60, 'Purchase', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 15, y: 8 }
    });
    yesButton.setOrigin(0.5);
    yesButton.setInteractive({ useHandCursor: true });
    
    const noButton = this.add.text(60, 60, 'Cancel', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#aa0000',
      padding: { x: 15, y: 8 }
    });
    noButton.setOrigin(0.5);
    noButton.setInteractive({ useHandCursor: true });
    
    yesButton.on('pointerdown', () => {
      if (this.metaProgression.purchaseUpgrade(upgrade.id)) {
        // Success!
        this.updateShardsDisplay();
        confirmContainer.destroy();
        
        // Refresh the list
        this.upgradeContainers.forEach(c => c.destroy());
        this.upgradeContainers = [];
        this.createUpgradeList(180, 250);
        
        // Success effect
        const successText = this.add.text(
          GAME_CONFIG.BASE_WIDTH / 2,
          GAME_CONFIG.BASE_HEIGHT / 2,
          'Upgrade Purchased!', {
          fontSize: '32px',
          color: '#00ff00',
          fontStyle: 'bold'
        });
        successText.setOrigin(0.5);
        
        this.tweens.add({
          targets: successText,
          alpha: 0,
          y: successText.y - 50,
          duration: 1500,
          onComplete: () => successText.destroy()
        });
      }
    });
    
    noButton.on('pointerdown', () => {
      confirmContainer.destroy();
    });
    
    confirmContainer.add([
      confirmBg, confirmText, costConfirmText, effectText,
      yesButton, noButton
    ]);
    
    // Close on click outside
    confirmBg.setInteractive();
    this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const bounds = confirmBg.getBounds();
      if (!bounds.contains(pointer.x, pointer.y)) {
        confirmContainer.destroy();
      }
    });
  }
  
  private updateShardsDisplay(): void {
    this.shardsText.setText(`Shards: ${this.metaProgression.getTotalShards()}`);
  }
}