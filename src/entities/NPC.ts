import Phaser from 'phaser';

export interface NPCConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  name: string;
  role: 'blacksmith' | 'apothecary' | 'archivist' | 'gatekeeper';
  texture?: string;
}

export class NPC extends Phaser.GameObjects.Container {
  public name: string;
  public role: string;
  private sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private interactionRadius: number = 40;
  private isPlayerNearby: boolean = false;
  private interactionPrompt?: Phaser.GameObjects.Container;
  
  constructor(config: NPCConfig) {
    super(config.scene, config.x, config.y);
    
    this.name = config.name;
    this.role = config.role;
    
    // Create NPC sprite - use generated texture or provided one
    const textureKey = config.texture || `npc_${config.role}`;
    
    // Check if texture exists
    if (config.scene.textures.exists(textureKey)) {
      this.sprite = config.scene.add.sprite(0, -16, textureKey);
      this.sprite.setScale(2); // Scale up pixel art
    } else {
      // Fallback placeholder
      const colors = {
        blacksmith: 0x8B4513,
        apothecary: 0x2F4F4F,
        archivist: 0x4B0082,
        gatekeeper: 0x696969
      };
      this.sprite = config.scene.add.rectangle(0, -10, 20, 30, colors[config.role]);
    }
    
    // Add shadow
    const shadow = config.scene.add.ellipse(0, 8, 32, 16, 0x000000, 0.3);
    this.add(shadow);
    
    // Add sprite
    this.add(this.sprite);
    
    // Add name label
    this.nameText = config.scene.add.text(0, -50, config.name, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);
    
    // Set depth
    this.setDepth(config.y);
    
    // Add to scene
    config.scene.add.existing(this);
    
    // Create interaction detection
    this.setupInteraction();
    
    // Add idle animation (breathing effect)
    if (config.scene.textures.exists(textureKey)) {
      this.setupIdleAnimation();
    }
  }
  
  private setupInteraction(): void {
    // Create an invisible circle for interaction detection
    const interactionZone = this.scene.add.circle(
      this.x, 
      this.y, 
      this.interactionRadius,
      0x00ff00,
      0
    );
    
    // Make it interactive but invisible
    interactionZone.setInteractive();
    
    // Update interaction state
    this.scene.events.on('update', () => {
      const player = (this.scene as any).player;
      if (!player) return;
      
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        player.x, player.y
      );
      
      const wasNearby = this.isPlayerNearby;
      this.isPlayerNearby = distance < this.interactionRadius;
      
      // Show/hide interaction prompt
      if (this.isPlayerNearby && !wasNearby) {
        this.showInteractionPrompt();
      } else if (!this.isPlayerNearby && wasNearby) {
        this.hideInteractionPrompt();
      }
    });
  }
  
  private showInteractionPrompt(): void {
    if (this.interactionPrompt) return;
    
    this.interactionPrompt = this.scene.add.container(this.x, this.y - 70);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, 80, 28, 0x000000, 0.8);
    bg.setStrokeStyle(1, 0xffffff);
    this.interactionPrompt.add(bg);
    
    // Text
    const text = this.scene.add.text(0, 0, 'Press E', {
      fontSize: '14px',
      color: '#ffffff'
    });
    text.setOrigin(0.5, 0.5);
    this.interactionPrompt.add(text);
    
    // Floating animation
    this.scene.tweens.add({
      targets: this.interactionPrompt,
      y: this.y - 75,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  private hideInteractionPrompt(): void {
    if (this.interactionPrompt) {
      this.interactionPrompt.destroy();
      this.interactionPrompt = undefined;
    }
  }
  
  public interact(): void {
    // This will be called when player presses E near the NPC
    console.log(`Interacting with ${this.name} the ${this.role}`);
    
    // For now, just show a simple message
    // Later this will trigger the dialogue system
    const dialogueBubble = this.scene.add.container(this.x, this.y - 80);
    
    // Speech bubble background
    const bubble = this.scene.add.graphics();
    bubble.fillStyle(0xffffff, 0.95);
    bubble.fillRoundedRect(-80, -30, 160, 60, 10);
    bubble.lineStyle(2, 0x000000);
    bubble.strokeRoundedRect(-80, -30, 160, 60, 10);
    
    // Speech bubble tail
    bubble.fillStyle(0xffffff, 0.95);
    bubble.fillTriangle(0, 30, -10, 20, 10, 20);
    bubble.lineStyle(2, 0x000000);
    bubble.strokeTriangle(0, 30, -10, 20, 10, 20);
    
    dialogueBubble.add(bubble);
    
    // Dialogue text
    const messages = {
      blacksmith: "Need your gear repaired?",
      apothecary: "Potions and elixirs for sale!",
      archivist: "Knowledge is power, adventurer.",
      gatekeeper: "Ready to enter the Wilds?"
    };
    
    const text = this.scene.add.text(0, 0, messages[this.role as keyof typeof messages], {
      fontSize: '16px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: 140 }
    });
    text.setOrigin(0.5, 0.5);
    dialogueBubble.add(text);
    
    // Auto-remove after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      dialogueBubble.destroy();
    });
  }
  
  public canInteract(): boolean {
    return this.isPlayerNearby;
  }
  
  private setupIdleAnimation(): void {
    // Simple breathing animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 2.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Slight sway
    this.scene.tweens.add({
      targets: this.sprite,
      x: 2,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}