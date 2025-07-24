import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

interface Building {
  x: number;
  y: number;
  name: string;
  type: string;
}

export class TownScene extends Phaser.Scene {
  private groundLayer!: Phaser.GameObjects.Group;
  private buildingLayer!: Phaser.GameObjects.Group;
  private decorLayer!: Phaser.GameObjects.Group;
  
  constructor() {
    super({ key: 'TownScene' });
  }

  create(): void {
    console.log('TownScene: Creating scene...');
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x2d2d2d);
    
    // Set world bounds larger than camera
    this.physics.world.setBounds(0, 0, GAME_CONFIG.TOWN_WIDTH, GAME_CONFIG.TOWN_HEIGHT);
    
    // Create layers for proper depth sorting
    this.groundLayer = this.add.group();
    this.buildingLayer = this.add.group();
    this.decorLayer = this.add.group();
    
    // Generate town layout
    this.createTownGround();
    this.createPaths();
    this.createTownBuildings();
    this.createProps();
    this.createLampPosts();
    this.addAtmosphericEffects();
    
    // Set up camera
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.TOWN_WIDTH, GAME_CONFIG.TOWN_HEIGHT);
    this.cameras.main.setZoom(1);
    
    // Center camera on town square
    this.cameras.main.centerOn(GAME_CONFIG.TOWN_WIDTH / 2, GAME_CONFIG.TOWN_HEIGHT / 2);
    
    console.log('TownScene: Scene created successfully');
  }

  private createTownGround(): void {
    // Create a pattern of ground and grass tiles
    for (let x = 0; x < GAME_CONFIG.TOWN_WIDTH; x += 16) {
      for (let y = 0; y < GAME_CONFIG.TOWN_HEIGHT; y += 16) {
        // Create some variation in ground tiles
        const useGrass = Math.random() > 0.7;
        const tile = this.add.image(x, y, useGrass ? 'grass_tile' : 'ground_tile');
        tile.setOrigin(0, 0);
        
        // Apply subtle tint variation
        if (!useGrass) {
          const tintVariation = 0.9 + Math.random() * 0.1;
          tile.setTint(Phaser.Display.Color.GetColor(
            Math.floor(74 * tintVariation),
            Math.floor(60 * tintVariation),
            Math.floor(40 * tintVariation)
          ));
        }
        
        this.groundLayer.add(tile);
      }
    }
  }

  private createPaths(): void {
    // Create stone paths connecting buildings
    const centerX = GAME_CONFIG.TOWN_WIDTH / 2;
    const centerY = GAME_CONFIG.TOWN_HEIGHT / 2;
    
    // Main paths from center
    this.createPath(centerX - 48, centerY, centerX - 160, centerY - 60); // To blacksmith
    this.createPath(centerX + 48, centerY, centerX + 120, centerY - 40); // To apothecary
    this.createPath(centerX, centerY + 48, centerX - 80, centerY + 120); // To archivist
    this.createPath(centerX, centerY - 48, centerX, centerY - 120); // North path
    
    // Town square
    for (let x = centerX - 32; x < centerX + 32; x += 16) {
      for (let y = centerY - 32; y < centerY + 32; y += 16) {
        const stone = this.add.image(x, y, 'stone_tile');
        stone.setOrigin(0, 0);
        this.groundLayer.add(stone);
      }
    }
  }

  private createPath(x1: number, y1: number, x2: number, y2: number): void {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.floor((x1 + (x2 - x1) * t) / 16) * 16;
      const y = Math.floor((y1 + (y2 - y1) * t) / 16) * 16;
      
      const stone = this.add.image(x, y, 'stone_tile');
      stone.setOrigin(0, 0);
      this.groundLayer.add(stone);
    }
  }

  private createTownBuildings(): void {
    // Define building positions for key NPCs
    const buildings: Building[] = [
      { x: 160, y: 180, name: 'Blacksmith', type: 'blacksmith' },
      { x: 440, y: 200, name: 'Apothecary', type: 'apothecary' },
      { x: 240, y: 360, name: 'Archivist', type: 'building' },
      { x: 320, y: 60, name: 'Gatekeeper', type: 'building' }
    ];
    
    buildings.forEach(({ x, y, name, type }) => {
      // Add shadow
      const shadow = this.add.ellipse(x, y + 4, 56, 20, GAME_CONFIG.COLORS.SHADOW, 0.4);
      shadow.setOrigin(0.5, 0.5);
      this.buildingLayer.add(shadow);
      
      // Create building
      const buildingTexture = type === 'blacksmith' ? 'building_blacksmith' : 
                              type === 'apothecary' ? 'building_apothecary' : 'building';
      const building = this.add.image(x, y, buildingTexture);
      building.setOrigin(0.5, 1);
      
      // Add depth sorting
      building.setDepth(y);
      
      // Add simple sign
      const sign = this.add.text(x, y - 52, name, {
        fontSize: '8px',
        color: '#d4d4d4',
        backgroundColor: '#2a2a2a',
        padding: { x: 2, y: 1 }
      });
      sign.setOrigin(0.5, 0.5);
      sign.setDepth(y);
      
      this.buildingLayer.add(building);
      this.buildingLayer.add(sign);
    });
  }

  private createProps(): void {
    // Add barrels and crates around buildings
    const props = [
      { x: 140, y: 190, type: 'barrel' },
      { x: 180, y: 185, type: 'crate' },
      { x: 420, y: 210, type: 'crate' },
      { x: 435, y: 215, type: 'barrel' },
      { x: 260, y: 365, type: 'barrel' },
      { x: 310, y: 70, type: 'crate' },
      { x: 330, y: 75, type: 'crate' }
    ];
    
    props.forEach(({ x, y, type }) => {
      const prop = this.add.image(x, y, type);
      prop.setOrigin(0.5, 1);
      prop.setDepth(y);
      this.decorLayer.add(prop);
    });
  }

  private createLampPosts(): void {
    // Place lamp posts around town
    const lampPositions = [
      { x: 320, y: 180 }, // Town square
      { x: 320, y: 260 },
      { x: 260, y: 220 },
      { x: 380, y: 220 },
      { x: 200, y: 160 },
      { x: 400, y: 180 },
      { x: 160, y: 320 },
      { x: 480, y: 140 }
    ];
    
    lampPositions.forEach(({ x, y }) => {
      const lamp = this.add.image(x, y, 'lamp');
      lamp.setOrigin(0.5, 1);
      lamp.setDepth(y);
      
      // Add glow effect
      const glow = this.add.circle(x, y - 24, 24, GAME_CONFIG.COLORS.LAMPLIGHT, 0.15);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(y - 1);
      
      // Add flickering animation
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.2 },
        scale: { from: 0.9, to: 1.1 },
        duration: 2000 + Math.random() * 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1000
      });
      
      this.decorLayer.add(lamp);
      this.decorLayer.add(glow);
    });
  }

  private addAtmosphericEffects(): void {
    // Add ambient darkness overlay
    const darkness = this.add.rectangle(
      GAME_CONFIG.BASE_WIDTH / 2,
      GAME_CONFIG.BASE_HEIGHT / 2,
      GAME_CONFIG.BASE_WIDTH,
      GAME_CONFIG.BASE_HEIGHT,
      0x000000,
      0.3
    );
    darkness.setScrollFactor(0);
    darkness.setDepth(1000);
    darkness.setBlendMode(Phaser.BlendModes.MULTIPLY);
    
    // Add vignette effect
    const vignette = this.add.graphics();
    const radius = Math.max(GAME_CONFIG.BASE_WIDTH, GAME_CONFIG.BASE_HEIGHT);
    
    // Create radial gradient for vignette
    for (let i = 0; i < 20; i++) {
      const alpha = i / 20 * 0.5;
      const currentRadius = radius * (1 - i / 20);
      
      vignette.lineStyle(8, 0x000000, alpha);
      vignette.strokeCircle(
        GAME_CONFIG.BASE_WIDTH / 2,
        GAME_CONFIG.BASE_HEIGHT / 2,
        currentRadius
      );
    }
    
    vignette.setScrollFactor(0);
    vignette.setDepth(999);
  }

  update(): void {
    // Sort sprites by Y position for depth
    this.buildingLayer.getChildren().forEach((child) => {
      if (child instanceof Phaser.GameObjects.Image || child instanceof Phaser.GameObjects.Text) {
        child.setDepth(child.y);
      }
    });
    
    this.decorLayer.getChildren().forEach((child) => {
      if (child instanceof Phaser.GameObjects.Image) {
        child.setDepth(child.y);
      }
    });
  }
}