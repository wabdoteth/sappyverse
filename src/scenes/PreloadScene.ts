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
    console.log('PreloadScene: Assets loaded, creating placeholder sprites...');
    
    // Generate placeholder sprites for any missing assets
    this.generatePlaceholderSprites();
    
    console.log('PreloadScene: Starting TownScene2D5...');
    // Start the 2.5D town scene
    this.scene.start('TownScene2D5');
  }
  
  private generatePlaceholderSprites(): void {
    const directions = ['up', 'down', 'left', 'right'];
    const animations = [
      { name: 'idle', frames: 8 },
      { name: 'run', frames: 8 },
      { name: 'attack1', frames: 8 },
      { name: 'attack2', frames: 8 }
    ];
    
    directions.forEach(dir => {
      animations.forEach(anim => {
        const key = `player_${anim.name}_${dir}`;
        
        // Check if texture exists, if not create placeholder
        if (!this.textures.exists(key)) {
          console.log(`Creating placeholder for missing sprite: ${key}`);
          
          // Create a canvas for the sprite sheet
          const canvas = document.createElement('canvas');
          canvas.width = 96 * anim.frames;
          canvas.height = 80;
          const ctx = canvas.getContext('2d')!;
          
          // Draw placeholder frames
          for (let i = 0; i < anim.frames; i++) {
            const x = i * 96;
            
            // Draw character placeholder
            ctx.fillStyle = '#4a90e2';
            ctx.fillRect(x + 37, 23, 22, 34); // Body
            ctx.fillStyle = '#f5a623';
            ctx.fillRect(x + 43, 13, 10, 10); // Head
            
            // Add direction indicator
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(dir[0].toUpperCase(), x + 45, 40);
          }
          
          // Add the texture
          this.textures.addCanvas(key, canvas);
        }
      });
    });
  }
}