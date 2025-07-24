import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { DialogueSystem } from '../systems/DialogueSystem';
import { SpriteGenerator } from '../utils/SpriteGenerator';

export class TownScene2D5 extends Phaser.Scene {
  private groundLayer!: Phaser.GameObjects.Container;
  private objectLayer!: Phaser.GameObjects.Container;
  private depthSortGroup!: Phaser.GameObjects.Group;
  private player!: Player;
  private npcs: NPC[] = [];
  private dialogueSystem!: DialogueSystem;
  
  constructor() {
    super({ key: 'TownScene2D5' });
  }
  
  init(data: { runComplete?: boolean; shardsEarned?: number }): void {
    // Show run complete message if returning from dungeon
    if (data && data.runComplete && data.shardsEarned) {
      this.time.delayedCall(500, () => {
        this.showRunCompleteMessage(data.shardsEarned);
      });
    }
  }

  create(): void {
    console.log('TownScene2D5: Creating 2.5D scene...');
    
    // Reset camera in case it was faded out
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x87CEEB); // Sky blue
    console.log('TownScene2D5: Background color set');
    
    // Generate NPC sprites
    SpriteGenerator.generateAllNPCSprites(this);
    
    // Create containers for layering
    this.groundLayer = this.add.container(0, 0);
    this.objectLayer = this.add.container(0, 0);
    
    // Create group for depth sorting
    this.depthSortGroup = this.add.group();
    
    // Create the ground with perspective
    this.createPerspectiveGround();
    
    // Create buildings with 2.5D perspective
    this.createPerspectiveBuildings();
    
    // Create trees and props
    this.createPerspectiveProps();
    
    // Add player
    this.createPlayer();
    
    // Add NPCs
    this.createNPCs();
    
    // Set up dialogue system
    this.dialogueSystem = new DialogueSystem(this);
    
    // Set up camera
    this.cameras.main.setZoom(1);
  }

  private createPerspectiveGround(): void {
    const graphics = this.add.graphics();
    const centerX = GAME_CONFIG.BASE_WIDTH / 2;
    const horizonY = 150;
    const groundHeight = GAME_CONFIG.BASE_HEIGHT - horizonY;
    
    // Create gradient ground
    const colors = [
      { pos: 0, color: 0x5a4a3a },    // Darker at horizon
      { pos: 0.5, color: 0x4a3c28 },  // Mid brown
      { pos: 1, color: 0x3e4a3e }     // Greenish at bottom
    ];
    
    // Draw ground as horizontal strips
    const strips = 20;
    for (let i = 0; i < strips; i++) {
      const y = horizonY + (groundHeight * i / strips);
      const nextY = horizonY + (groundHeight * (i + 1) / strips);
      const stripHeight = nextY - y;
      
      // Interpolate color
      const t = i / strips;
      const color = this.interpolateColor(colors, t);
      
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y, GAME_CONFIG.BASE_WIDTH, stripHeight);
    }
    
    // Add grid overlay for depth perception
    graphics.lineStyle(1, 0x3a2c18, 0.3);
    
    // Vertical lines (converging to horizon)
    const vanishingX = centerX;
    const vanishingY = horizonY - 30;
    
    for (let x = -10; x <= 10; x++) {
      if (x === 0) continue; // Skip center line
      
      const startX = centerX + (x * 80);
      const startY = GAME_CONFIG.BASE_HEIGHT;
      
      graphics.beginPath();
      graphics.moveTo(startX, startY);
      graphics.lineTo(vanishingX + (x * 8), vanishingY);
      graphics.strokePath();
    }
    
    // Horizontal lines (getting closer together toward horizon)
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const y = horizonY + (groundHeight * Math.pow(t, 1.5));
      
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(GAME_CONFIG.BASE_WIDTH, y);
      graphics.strokePath();
    }
    
    this.groundLayer.add(graphics);
  }
  
  private interpolateColor(colors: Array<{pos: number, color: number}>, t: number): number {
    // Find the two colors to interpolate between
    let c1 = colors[0];
    let c2 = colors[colors.length - 1];
    
    for (let i = 0; i < colors.length - 1; i++) {
      if (t >= colors[i].pos && t <= colors[i + 1].pos) {
        c1 = colors[i];
        c2 = colors[i + 1];
        break;
      }
    }
    
    // Interpolate between the two colors
    const localT = (t - c1.pos) / (c2.pos - c1.pos);
    
    const color1 = Phaser.Display.Color.ValueToColor(c1.color);
    const color2 = Phaser.Display.Color.ValueToColor(c2.color);
    
    const r = Math.floor(color1.red + (color2.red - color1.red) * localT);
    const g = Math.floor(color1.green + (color2.green - color1.green) * localT);
    const b = Math.floor(color1.blue + (color2.blue - color1.blue) * localT);
    
    return Phaser.Display.Color.GetColor(r, g, b);
  }

  private buildingPositions: Array<{x: number, z: number, name: string, role: string}> = [];
  
  private createPerspectiveBuildings(): void {
    const buildings = [
      { x: -400, z: 60, name: 'Blacksmith', color: 0x8B4513, role: 'blacksmith' },
      { x: 400, z: 65, name: 'Apothecary', color: 0x2F4F4F, role: 'apothecary' },
      { x: -350, z: 180, name: 'Archivist', color: 0x4B0082, role: 'archivist' },
      { x: 350, z: 190, name: 'Gatekeeper', color: 0x696969, role: 'gatekeeper' }
    ];
    
    buildings.forEach(({ x, z, name, color, role }) => {
      const building = this.createIsometricBuilding(x, z, name, color);
      this.depthSortGroup.add(building);
      
      // Store position for NPC placement - to the side of building
      const npcOffset = role === 'blacksmith' || role === 'archivist' ? 50 : -50;
      this.buildingPositions.push({ x: x + npcOffset, z: z + 10, name, role });
    });
  }

  private createIsometricBuilding(worldX: number, worldZ: number, name: string, color: number): Phaser.GameObjects.Container {
    // Convert world coordinates to screen coordinates
    const { x: screenX, y: screenY } = this.worldToScreen(worldX, worldZ);
    
    const container = this.add.container(screenX, screenY);
    
    // Building base (front face)
    const width = 80;
    const height = 60;
    const depth = 40;
    
    // Create building faces for 2.5D effect
    const graphics = this.add.graphics();
    
    // Front face (darker)
    graphics.fillStyle(color, 1);
    graphics.fillRect(-width/2, -height, width, height);
    
    // Side face (lighter)
    graphics.fillStyle(Phaser.Display.Color.ValueToColor(color).lighten(20).color, 1);
    graphics.beginPath();
    graphics.moveTo(width/2, -height);
    graphics.lineTo(width/2 + depth * 0.5, -height - depth * 0.3);
    graphics.lineTo(width/2 + depth * 0.5, -depth * 0.3);
    graphics.lineTo(width/2, 0);
    graphics.closePath();
    graphics.fill();
    
    // Roof (darkest)
    graphics.fillStyle(Phaser.Display.Color.ValueToColor(color).darken(30).color, 1);
    graphics.beginPath();
    graphics.moveTo(-width/2, -height);
    graphics.lineTo(width/2, -height);
    graphics.lineTo(width/2 + depth * 0.5, -height - depth * 0.3);
    graphics.lineTo(-width/2 + depth * 0.5, -height - depth * 0.3);
    graphics.closePath();
    graphics.fill();
    
    container.add(graphics);
    
    // Add label
    const text = this.add.text(0, -height/2, name, {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 }
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);
    
    // Set depth based on screen Y position for proper layering
    container.setDepth(screenY);
    
    return container;
  }

  private createPerspectiveProps(): void {
    // Add trees with 2.5D perspective
    const trees = [
      { x: -500, z: 30 },
      { x: 500, z: 35 },
      { x: -250, z: 100 },
      { x: 250, z: 110 },
      { x: -450, z: 150 },
      { x: 450, z: 160 },
      { x: -150, z: 200 },
      { x: 150, z: 210 }
    ];
    
    trees.forEach(({ x, z }) => {
      const tree = this.createIsometricTree(x, z);
      this.depthSortGroup.add(tree);
    });
    
    // Add lamp posts
    const lamps = [
      { x: 0, z: 70 }      // Center lamp only
    ];
    
    lamps.forEach(({ x, z }) => {
      const lamp = this.createIsometricLamp(x, z);
      this.depthSortGroup.add(lamp);
    });
  }

  private createIsometricTree(worldX: number, worldZ: number): Phaser.GameObjects.Container {
    const { x: screenX, y: screenY } = this.worldToScreen(worldX, worldZ);
    const container = this.add.container(screenX, screenY);
    
    // Tree trunk
    const trunk = this.add.rectangle(0, -15, 12, 30, 0x4B3410);
    container.add(trunk);
    
    // Tree foliage (multiple circles for depth)
    const foliage1 = this.add.circle(0, -35, 22, 0x228B22);
    const foliage2 = this.add.circle(-8, -28, 18, 0x2E7D32);
    const foliage3 = this.add.circle(8, -32, 20, 0x1B5E20);
    
    container.add([foliage1, foliage2, foliage3]);
    container.setDepth(screenY);
    
    return container;
  }

  private createIsometricLamp(worldX: number, worldZ: number): Phaser.GameObjects.Container {
    const { x: screenX, y: screenY } = this.worldToScreen(worldX, worldZ);
    const container = this.add.container(screenX, screenY);
    
    // Lamp post
    const post = this.add.rectangle(0, -20, 10, 40, 0x4a4a4a);
    container.add(post);
    
    // Lamp light
    const light = this.add.circle(0, -40, 12, 0xFFD700);
    container.add(light);
    
    // Glow effect
    const glow = this.add.circle(0, -40, 28, 0xFFD700, 0.3);
    container.add(glow);
    
    // Animate glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.2, to: 0.4 },
      scale: { from: 0.9, to: 1.1 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    container.setDepth(screenY);
    return container;
  }

  private createPlayer(): void {
    const playerX = 0;
    const playerZ = 90;
    const { x: screenX, y: screenY } = this.worldToScreen(playerX, playerZ);
    
    // Create the player using the Player class
    this.player = new Player({
      scene: this,
      x: screenX,
      y: screenY,
      texture: 'player_idle_down',
      frameWidth: 96,  // Frame width (character is centered in this)
      frameHeight: 80  // Frame height
    });
    
    // Reset player health and state when entering town
    this.player.reset();
    
    // Add player to depth sort group
    this.depthSortGroup.add(this.player);
    
    // Set up basic controls
    this.setupPlayerControls();
  }
  
  private setupPlayerControls(): void {
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
    const spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    
    // Handle movement in update
    this.events.on('update', () => {
      // Get input for 8-directional movement
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
      
      // Use 8-directional movement
      this.player.move8Dir(horizontal, vertical);
    });
    
    // Attack controls
    spaceBar.on('down', () => {
      this.player.attack(1);
    });
    
    shiftKey.on('down', () => {
      this.player.attack(2);
    });
  }

  private createSimplePlayer(): void {
    const playerX = 0;
    const playerZ = 90;
    const { x: screenX, y: screenY } = this.worldToScreen(playerX, playerZ);
    
    const playerContainer = this.add.container(screenX, screenY);
    
    // Shadow
    const shadow = this.add.ellipse(0, 10, 24, 12, 0x000000, 0.3);
    playerContainer.add(shadow);
    
    // Body
    const body = this.add.rectangle(0, 0, 20, 30, 0x8B4513);
    playerContainer.add(body);
    
    // Head
    const head = this.add.circle(0, -15, 8, 0xFFDBBB);
    playerContainer.add(head);
    
    playerContainer.setDepth(screenY);
    this.depthSortGroup.add(playerContainer);
  }
  
  private createNPCs(): void {
    this.buildingPositions.forEach(({ x, z, name, role }) => {
      const { x: screenX, y: screenY } = this.worldToScreen(x, z);
      
      const npc = new NPC({
        scene: this,
        x: screenX,
        y: screenY,
        name: name,
        role: role as 'blacksmith' | 'apothecary' | 'archivist' | 'gatekeeper'
      });
      
      this.npcs.push(npc);
      this.depthSortGroup.add(npc);
    });
    
    // Set up E key for interaction
    const eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on('down', () => {
      // Don't interact if dialogue is already active
      if (this.dialogueSystem.isDialogueActive()) return;
      
      // Find the nearest NPC that can be interacted with
      for (const npc of this.npcs) {
        if (npc.canInteract()) {
          this.interactWithNPC(npc);
          break;
        }
      }
    });
  }
  
  private interactWithNPC(npc: NPC): void {
    // Show dialogue based on NPC
    const dialogues = {
      blacksmith: {
        id: 'blacksmith_greeting',
        speaker: 'Blacksmith',
        text: 'Welcome to my forge! Your gear looks like it could use some work.',
        portrait: 'portrait_blacksmith',
        choices: [
          { text: 'Repair my equipment', action: 'open_repair' },
          { text: 'Upgrade my weapons', action: 'open_upgrade' },
          { text: 'Just browsing', action: 'close' }
        ]
      },
      apothecary: {
        id: 'apothecary_greeting',
        speaker: 'Apothecary',
        text: 'Ah, an adventurer! I have potions and elixirs that might help you survive the Wilds.',
        portrait: 'portrait_apothecary',
        choices: [
          { text: 'Show me your potions', action: 'open_shop' },
          { text: 'Tell me about the Wilds', nextDialogue: 'apothecary_wilds' },
          { text: 'Maybe later', action: 'close' }
        ]
      },
      archivist: {
        id: 'archivist_greeting',
        speaker: 'Archivist',
        text: 'The shards you collect hold ancient power. Would you like to invest them?',
        portrait: 'portrait_archivist',
        choices: [
          { text: 'View permanent upgrades', action: 'open_meta_upgrades' },
          { text: 'Tell me about the curse', nextDialogue: 'archivist_curse' },
          { text: 'Nothing right now', action: 'close' }
        ]
      },
      gatekeeper: {
        id: 'gatekeeper_greeting',
        speaker: 'Gatekeeper',
        text: 'The Withering Wilds await beyond this gate. Are you prepared to face the endless depths?',
        portrait: 'portrait_gatekeeper',
        choices: [
          { text: 'Enter the Wilds', action: 'enter_dungeon' },
          { text: 'What should I expect?', nextDialogue: 'gatekeeper_info' },
          { text: 'Not yet', action: 'close' }
        ]
      }
    };
    
    const dialogue = dialogues[npc.role as keyof typeof dialogues];
    if (dialogue) {
      this.dialogueSystem.showDialogue(dialogue);
    } else {
      // Fallback for NPCs without specific dialogue
      npc.interact();
    }
  }
  
  private worldToScreen(worldX: number, worldZ: number): { x: number, y: number } {
    // Convert 3D world coordinates to 2.5D screen coordinates
    const centerX = GAME_CONFIG.BASE_WIDTH / 2;
    const baseY = 400; // Base ground level
    
    // Perspective scaling based on Z depth
    const perspectiveScale = 1 - (worldZ / 400);
    
    // Calculate screen position
    const screenX = centerX + (worldX * perspectiveScale);
    const screenY = baseY - (worldZ * 0.7); // Move up as we go back in Z
    
    return { x: screenX, y: screenY };
  }

  update(): void {
    // Depth sorting is now handled by setting depth once when objects are created
    // No need to update every frame
  }
  
  private showRunCompleteMessage(shardsEarned: number): void {
    // Create message container
    const container = this.add.container(GAME_CONFIG.BASE_WIDTH / 2, GAME_CONFIG.BASE_HEIGHT / 2);
    
    // Background panel
    const bg = this.add.rectangle(0, 0, 400, 200, 0x2a2a3e);
    bg.setStrokeStyle(3, 0xffd700);
    
    // Title
    const title = this.add.text(0, -50, 'Run Complete!', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    
    // Shards earned
    const shardsText = this.add.text(0, 0, `Shards Earned: ${shardsEarned}`, {
      fontSize: '24px',
      color: '#ffd700'
    });
    shardsText.setOrigin(0.5);
    
    // Hint text
    const hintText = this.add.text(0, 40, 'Visit the Archivist to spend shards', {
      fontSize: '16px',
      color: '#cccccc'
    });
    hintText.setOrigin(0.5);
    
    container.add([bg, title, shardsText, hintText]);
    
    // Fade in
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 500
    });
    
    // Auto-dismiss after delay
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 500,
        onComplete: () => container.destroy()
      });
    });
    
    // Click to dismiss
    bg.setInteractive();
    bg.on('pointerdown', () => {
      container.destroy();
    });
  }
}