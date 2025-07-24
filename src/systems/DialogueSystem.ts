import Phaser from 'phaser';

export interface DialogueChoice {
  text: string;
  action?: string;
  nextDialogue?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  portrait?: string; // Optional portrait texture key
}

export class DialogueSystem {
  private scene: Phaser.Scene;
  private dialogueContainer?: Phaser.GameObjects.Container;
  private currentDialogue?: DialogueNode;
  private isActive: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInputHandlers();
  }
  
  private setupInputHandlers(): void {
    // Number keys for choices
    for (let i = 1; i <= 4; i++) {
      const key = this.scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes[`ONE` as keyof typeof Phaser.Input.Keyboard.KeyCodes] + i - 1
      );
      key.on('down', () => {
        if (this.isActive && this.currentDialogue?.choices) {
          this.selectChoice(i - 1);
        }
      });
    }
    
    // ESC to close dialogue
    const escKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      if (this.isActive) {
        this.closeDialogue();
      }
    });
  }
  
  public showDialogue(dialogue: DialogueNode): void {
    if (this.isActive) {
      this.closeDialogue();
    }
    
    this.isActive = true;
    this.currentDialogue = dialogue;
    
    // Create dialogue container
    const centerX = this.scene.cameras.main.width / 2;
    const bottomY = this.scene.cameras.main.height - 140;
    
    this.dialogueContainer = this.scene.add.container(centerX, bottomY);
    this.dialogueContainer.setScrollFactor(0);
    this.dialogueContainer.setDepth(2000);
    
    // Background panel
    const panelWidth = 800;
    const panelHeight = 240;
    const portraitSize = 120;
    const portraitMargin = 20;
    
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x2a2a2a, 0.95);
    panel.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
    panel.lineStyle(2, 0x4a4a4a);
    panel.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
    
    this.dialogueContainer.add(panel);
    
    // Portrait frame
    const portraitX = -panelWidth/2 + portraitMargin + portraitSize/2;
    const portraitY = -20; // Offset portrait up a bit
    const portraitFrame = this.scene.add.graphics();
    portraitFrame.fillStyle(0x3a3a3a, 1);
    portraitFrame.fillRoundedRect(
      portraitX - portraitSize/2 - 4,
      portraitY - portraitSize/2 - 4,
      portraitSize + 8,
      portraitSize + 8,
      8
    );
    portraitFrame.lineStyle(2, 0x5a5a5a);
    portraitFrame.strokeRoundedRect(
      portraitX - portraitSize/2 - 4,
      portraitY - portraitSize/2 - 4,
      portraitSize + 8,
      portraitSize + 8,
      8
    );
    this.dialogueContainer.add(portraitFrame);
    
    // Add portrait if provided
    if (dialogue.portrait && this.scene.textures.exists(dialogue.portrait)) {
      const portrait = this.scene.add.image(portraitX, portraitY, dialogue.portrait);
      portrait.setDisplaySize(portraitSize, portraitSize);
      this.dialogueContainer.add(portrait);
    } else {
      // Placeholder portrait
      const placeholder = this.scene.add.rectangle(portraitX, portraitY, portraitSize - 8, portraitSize - 8, 0x4a4a4a);
      this.dialogueContainer.add(placeholder);
    }
    
    // Speaker name (positioned next to portrait)
    const textStartX = portraitX + portraitSize/2 + portraitMargin;
    const speakerBg = this.scene.add.rectangle(
      textStartX + 60, 
      -panelHeight/2 - 12,
      120, 26,
      0x4a4a4a
    );
    speakerBg.setStrokeStyle(1, 0x6a6a6a);
    this.dialogueContainer.add(speakerBg);
    
    const speakerText = this.scene.add.text(
      textStartX + 60,
      -panelHeight/2 - 12,
      dialogue.speaker,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    speakerText.setOrigin(0.5, 0.5);
    this.dialogueContainer.add(speakerText);
    
    // Dialogue text (shifted right to account for portrait)
    const textAreaWidth = panelWidth - portraitSize - portraitMargin * 3;
    const textCenterX = textStartX + textAreaWidth / 2 - portraitMargin;
    const dialogueText = this.scene.add.text(
      textCenterX,
      -40,
      dialogue.text,
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: textAreaWidth - 40 }
      }
    );
    dialogueText.setOrigin(0.5, 0.5);
    this.dialogueContainer.add(dialogueText);
    
    // Choices
    if (dialogue.choices && dialogue.choices.length > 0) {
      dialogue.choices.forEach((choice, index) => {
        const choiceY = 20 + index * 35;
        
        // Choice background (positioned in text area)
        const choiceBgWidth = textAreaWidth - 20;
        const choiceBg = this.scene.add.rectangle(
          textCenterX, choiceY,
          choiceBgWidth, 30,
          0x3a3a3a
        );
        choiceBg.setInteractive();
        choiceBg.on('pointerover', () => choiceBg.setFillStyle(0x4a4a4a));
        choiceBg.on('pointerout', () => choiceBg.setFillStyle(0x3a3a3a));
        choiceBg.on('pointerdown', () => this.selectChoice(index));
        
        this.dialogueContainer.add(choiceBg);
        
        // Choice text with wrapping
        const choiceText = this.scene.add.text(
          textStartX,
          choiceY,
          `${index + 1}. ${choice.text}`,
          {
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: choiceBgWidth - 20 }
          }
        );
        choiceText.setOrigin(0, 0.5);
        this.dialogueContainer.add(choiceText);
      });
    } else {
      // Show "Press ESC to close" if no choices
      const closeText = this.scene.add.text(
        textCenterX, 80,
        'Press ESC to close',
        {
          fontSize: '14px',
          color: '#888888'
        }
      );
      closeText.setOrigin(0.5, 0.5);
      this.dialogueContainer.add(closeText);
    }
    
    // Pause player movement
    const player = (this.scene as any).player;
    if (player) {
      player.setVelocity(0, 0);
    }
  }
  
  private selectChoice(index: number): void {
    if (!this.currentDialogue?.choices || index >= this.currentDialogue.choices.length) {
      return;
    }
    
    const choice = this.currentDialogue.choices[index];
    
    // Handle action
    if (choice.action) {
      this.handleAction(choice.action);
    }
    
    // Show next dialogue or close
    if (choice.nextDialogue) {
      // In a real implementation, you'd load the next dialogue from a dialogue tree
      this.closeDialogue();
    } else {
      this.closeDialogue();
    }
  }
  
  private handleAction(action: string): void {
    // Handle different dialogue actions
    switch (action) {
      case 'close':
        // Just close the dialogue
        break;
      case 'open_shop':
        console.log('Opening shop...');
        break;
      case 'open_repair':
        console.log('Opening repair menu...');
        break;
      case 'open_upgrade':
        console.log('Opening upgrade menu...');
        break;
      case 'open_skills':
        console.log('Opening skills menu...');
        break;
      case 'open_meta_upgrades':
        console.log('Opening meta upgrades menu...');
        this.scene.scene.launch('MetaUpgradeScene');
        this.closeDialogue();
        break;
      case 'enter_dungeon':
        console.log('Entering dungeon...');
        this.scene.scene.start('CombatFlowScene', { depth: 1 });
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }
  
  public closeDialogue(): void {
    if (this.dialogueContainer) {
      this.dialogueContainer.destroy();
      this.dialogueContainer = undefined;
    }
    this.isActive = false;
    this.currentDialogue = undefined;
  }
  
  public isDialogueActive(): boolean {
    return this.isActive;
  }
}