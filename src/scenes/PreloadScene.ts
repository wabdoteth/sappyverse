import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { AssetGenerator } from '../utils/AssetGenerator';
import { PlaceholderSpriteGenerator } from '../utils/PlaceholderSpriteGenerator';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading bar
    const loadingBar = this.add.graphics();
    const loadingBox = this.add.graphics();
    
    loadingBox.fillStyle(GAME_CONFIG.COLORS.UI_BACKGROUND, 0.8);
    loadingBox.fillRect(
      GAME_CONFIG.BASE_WIDTH / 2 - 100,
      GAME_CONFIG.BASE_HEIGHT / 2 - 10,
      200,
      20
    );

    this.load.on('progress', (value: number) => {
      loadingBar.clear();
      loadingBar.fillStyle(GAME_CONFIG.COLORS.LAMPLIGHT, 1);
      loadingBar.fillRect(
        GAME_CONFIG.BASE_WIDTH / 2 - 98,
        GAME_CONFIG.BASE_HEIGHT / 2 - 8,
        196 * value,
        16
      );
    });

    this.load.on('complete', () => {
      loadingBar.destroy();
      loadingBox.destroy();
    });

    // Load player sprite sheets
    this.loadPlayerSprites();
  }
  
  private loadPlayerSprites(): void {
    const directions = ['up', 'down', 'left', 'right'];
    const animations = [
      { name: 'idle', folder: 'IDLE' },
      { name: 'run', folder: 'RUN' },
      { name: 'attack1', folder: 'ATTACK1' },
      { name: 'attack2', folder: 'ATTACK2' }
    ];
    
    // Load sprite sheets from folder structure
    directions.forEach(dir => {
      animations.forEach(anim => {
        const key = `player_${anim.name}_${dir}`;
        const path = `assets/sprites/player/${anim.folder}/${anim.name}_${dir}.png`;
        
        // Try to load the sprite sheet
        
        // Load with correct sprite dimensions
        this.load.spritesheet(key, path, {
          frameWidth: 96,  // Each frame is 96 pixels wide
          frameHeight: 80  // Each frame is 80 pixels tall
        });
        
      });
    });
    
    // Set up error handling for missing sprites
    this.load.on('loaderror', (file: any) => {
      console.warn(`Failed to load sprite: ${file.key} from ${file.url}. Using placeholder.`);
    });
  }

  create(): void {
    // Start the 2.5D town scene
    this.scene.start('TownScene2D5');
  }
}