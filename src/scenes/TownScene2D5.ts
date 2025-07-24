import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { Player } from '../entities/Player';

export class TownScene2D5 extends Phaser.Scene {
  private groundLayer!: Phaser.GameObjects.Container;
  private objectLayer!: Phaser.GameObjects.Container;
  private depthSortGroup!: Phaser.GameObjects.Group;
  private player!: Player;
  
  constructor() {
    super({ key: 'TownScene2D5' });
  }

  create(): void {
    console.log('TownScene2D5: Creating 2.5D scene...');
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x87CEEB); // Sky blue
    
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
    
    // Set up camera
    this.cameras.main.setZoom(1);
  }

  private createPerspectiveGround(): void {
    const graphics = this.add.graphics();
    const centerX = GAME_CONFIG.BASE_WIDTH / 2;
    const horizonY = 100;
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
    const vanishingY = horizonY - 20;
    
    for (let x = -8; x <= 8; x++) {
      if (x === 0) continue; // Skip center line
      
      const startX = centerX + (x * 40);
      const startY = GAME_CONFIG.BASE_HEIGHT;
      
      graphics.beginPath();
      graphics.moveTo(startX, startY);
      graphics.lineTo(vanishingX + (x * 5), vanishingY);
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

  private createPerspectiveBuildings(): void {
    const buildings = [
      { x: -100, z: 30, name: 'Blacksmith', color: 0x8B4513 },
      { x: 100, z: 35, name: 'Apothecary', color: 0x2F4F4F },
      { x: -70, z: 100, name: 'Archivist', color: 0x4B0082 },
      { x: 70, z: 110, name: 'Gatekeeper', color: 0x696969 }
    ];
    
    buildings.forEach(({ x, z, name, color }) => {
      const building = this.createIsometricBuilding(x, z, name, color);
      this.depthSortGroup.add(building);
    });
  }

  private createIsometricBuilding(worldX: number, worldZ: number, name: string, color: number): Phaser.GameObjects.Container {
    // Convert world coordinates to screen coordinates
    const { x: screenX, y: screenY } = this.worldToScreen(worldX, worldZ);
    
    const container = this.add.container(screenX, screenY);
    
    // Building base (front face)
    const width = 50;
    const height = 40;
    const depth = 25;
    
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
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
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
      { x: -120, z: 15 },
      { x: 120, z: 20 },
      { x: -50, z: 65 },
      { x: 40, z: 140 },
      { x: -90, z: 120 },
      { x: 90, z: 80 }
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
    const trunk = this.add.rectangle(0, -10, 8, 20, 0x4B3410);
    container.add(trunk);
    
    // Tree foliage (multiple circles for depth)
    const foliage1 = this.add.circle(0, -25, 15, 0x228B22);
    const foliage2 = this.add.circle(-5, -20, 12, 0x2E7D32);
    const foliage3 = this.add.circle(5, -22, 13, 0x1B5E20);
    
    container.add([foliage1, foliage2, foliage3]);
    container.setDepth(screenY);
    
    return container;
  }

  private createIsometricLamp(worldX: number, worldZ: number): Phaser.GameObjects.Container {
    const { x: screenX, y: screenY } = this.worldToScreen(worldX, worldZ);
    const container = this.add.container(screenX, screenY);
    
    // Lamp post
    const post = this.add.rectangle(0, -12, 6, 24, 0x4a4a4a);
    container.add(post);
    
    // Lamp light
    const light = this.add.circle(0, -24, 8, 0xFFD700);
    container.add(light);
    
    // Glow effect
    const glow = this.add.circle(0, -24, 18, 0xFFD700, 0.3);
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
  
  private worldToScreen(worldX: number, worldZ: number): { x: number, y: number } {
    // Convert 3D world coordinates to 2.5D screen coordinates
    const centerX = GAME_CONFIG.BASE_WIDTH / 2;
    const baseY = 240; // Base ground level
    
    // Perspective scaling based on Z depth
    const perspectiveScale = 1 - (worldZ / 200);
    
    // Calculate screen position
    const screenX = centerX + (worldX * perspectiveScale);
    const screenY = baseY - (worldZ * 0.5); // Move up as we go back in Z
    
    return { x: screenX, y: screenY };
  }

  update(): void {
    // Depth sorting is now handled by setting depth once when objects are created
    // No need to update every frame
  }
}