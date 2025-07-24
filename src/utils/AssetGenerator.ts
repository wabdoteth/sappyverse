import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class AssetGenerator {
  static generateAllAssets(scene: Phaser.Scene): void {
    this.generateGroundTiles(scene);
    this.generateBuildings(scene);
    this.generateCharacters(scene);
    this.generateProps(scene);
  }

  private static generateGroundTiles(scene: Phaser.Scene): void {
    // Ground tile with texture
    const groundSize = 16;
    const ground = scene.add.graphics();
    ground.fillStyle(GAME_CONFIG.COLORS.GROUND_BROWN);
    ground.fillRect(0, 0, groundSize, groundSize);
    
    // Add some texture dots
    ground.fillStyle(0x3a2c18);
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(Math.random() * groundSize);
      const y = Math.floor(Math.random() * groundSize);
      ground.fillRect(x, y, 1, 1);
    }
    ground.generateTexture('ground_tile', groundSize, groundSize);
    ground.destroy();

    // Grass tile with variation
    const grass = scene.add.graphics();
    grass.fillStyle(GAME_CONFIG.COLORS.GRASS_GREEN);
    grass.fillRect(0, 0, groundSize, groundSize);
    
    // Add grass texture
    grass.fillStyle(0x2e3a2e);
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(Math.random() * groundSize);
      const y = Math.floor(Math.random() * groundSize);
      grass.fillRect(x, y, 1, 2);
    }
    grass.generateTexture('grass_tile', groundSize, groundSize);
    grass.destroy();

    // Stone path tile
    const stone = scene.add.graphics();
    stone.fillStyle(GAME_CONFIG.COLORS.STONE_GRAY);
    stone.fillRect(0, 0, groundSize, groundSize);
    stone.fillStyle(0x3a3a3a);
    stone.fillRect(1, 1, 14, 14);
    stone.generateTexture('stone_tile', groundSize, groundSize);
    stone.destroy();
  }

  private static generateBuildings(scene: Phaser.Scene): void {
    // Blacksmith building
    const blacksmith = scene.add.graphics();
    blacksmith.fillStyle(GAME_CONFIG.COLORS.STONE_GRAY);
    blacksmith.fillRect(0, 20, 48, 28); // Base
    blacksmith.fillStyle(GAME_CONFIG.COLORS.WOOD_BROWN);
    blacksmith.fillRect(2, 0, 44, 22); // Roof
    blacksmith.fillStyle(0x8b0000); // Dark red roof
    blacksmith.fillRect(4, 2, 40, 18);
    // Door
    blacksmith.fillStyle(0x2a1810);
    blacksmith.fillRect(19, 28, 10, 20);
    // Window
    blacksmith.fillStyle(GAME_CONFIG.COLORS.LAMPLIGHT);
    blacksmith.fillRect(8, 26, 8, 8);
    blacksmith.fillRect(32, 26, 8, 8);
    blacksmith.generateTexture('building_blacksmith', 48, 48);
    blacksmith.destroy();

    // Apothecary building
    const apothecary = scene.add.graphics();
    apothecary.fillStyle(GAME_CONFIG.COLORS.WOOD_BROWN);
    apothecary.fillRect(0, 16, 48, 32); // Base
    apothecary.fillStyle(0x4a5a4a); // Green roof
    apothecary.fillTriangle(24, 0, 0, 18, 48, 18);
    // Door
    apothecary.fillStyle(0x2a1810);
    apothecary.fillRect(19, 28, 10, 20);
    // Round window
    apothecary.fillStyle(GAME_CONFIG.COLORS.LAMPLIGHT);
    apothecary.fillCircle(24, 24, 6);
    apothecary.generateTexture('building_apothecary', 48, 48);
    apothecary.destroy();

    // Generic buildings
    const genericBuilding = scene.add.graphics();
    genericBuilding.fillStyle(GAME_CONFIG.COLORS.WOOD_BROWN);
    genericBuilding.fillRect(0, 0, 48, 48);
    genericBuilding.fillStyle(GAME_CONFIG.COLORS.STONE_GRAY);
    genericBuilding.fillRect(0, 32, 48, 16);
    genericBuilding.generateTexture('building', 48, 48);
    genericBuilding.destroy();
  }

  private static generateCharacters(scene: Phaser.Scene): void {
    // Player character
    const player = scene.add.graphics();
    // Body
    player.fillStyle(0x8b6939); // Brown cloak
    player.fillRect(4, 8, 8, 10);
    // Head
    player.fillStyle(0xfdbcb4); // Skin tone
    player.fillCircle(8, 6, 3);
    // Hood
    player.fillStyle(0x6b4929);
    player.fillRect(3, 2, 10, 6);
    player.generateTexture('player', 16, 20);
    player.destroy();

    // NPC base
    const npc = scene.add.graphics();
    npc.fillStyle(0x4a4a4a);
    npc.fillRect(4, 8, 8, 10);
    npc.fillStyle(0xfdbcb4);
    npc.fillCircle(8, 6, 3);
    npc.generateTexture('npc_base', 16, 20);
    npc.destroy();
  }

  private static generateProps(scene: Phaser.Scene): void {
    // Improved lamp post
    const lamp = scene.add.graphics();
    // Post
    lamp.fillStyle(GAME_CONFIG.COLORS.STONE_GRAY);
    lamp.fillRect(6, 8, 4, 24);
    // Lamp housing
    lamp.fillStyle(0x2a2a2a);
    lamp.fillRect(4, 4, 8, 8);
    // Light
    lamp.fillStyle(GAME_CONFIG.COLORS.LAMPLIGHT);
    lamp.fillCircle(8, 8, 4);
    lamp.generateTexture('lamp', 16, 32);
    lamp.destroy();

    // Crate
    const crate = scene.add.graphics();
    crate.fillStyle(GAME_CONFIG.COLORS.WOOD_BROWN);
    crate.fillRect(0, 0, 16, 16);
    crate.fillStyle(0x3a2a1a);
    crate.fillRect(1, 1, 14, 14);
    crate.fillStyle(GAME_CONFIG.COLORS.WOOD_BROWN);
    crate.fillRect(2, 2, 12, 12);
    crate.generateTexture('crate', 16, 16);
    crate.destroy();

    // Barrel
    const barrel = scene.add.graphics();
    barrel.fillStyle(GAME_CONFIG.COLORS.WOOD_BROWN);
    barrel.fillRect(2, 0, 12, 16);
    barrel.fillStyle(0x3a2a1a);
    barrel.fillRect(1, 4, 14, 2);
    barrel.fillRect(1, 10, 14, 2);
    barrel.generateTexture('barrel', 16, 16);
    barrel.destroy();
  }
}