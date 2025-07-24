import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class SimpleTownScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SimpleTownScene' });
  }

  create(): void {
    console.log('SimpleTownScene: Starting...');
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x2d2d2d);
    
    // Add a simple ground
    for (let x = 0; x < GAME_CONFIG.BASE_WIDTH; x += 32) {
      for (let y = 0; y < GAME_CONFIG.BASE_HEIGHT; y += 32) {
        this.add.rectangle(x + 16, y + 16, 30, 30, 0x4a3c28);
      }
    }
    
    // Add some buildings
    this.add.rectangle(80, 60, 60, 40, 0x5c4033); // Building 1
    this.add.text(80, 60, 'Blacksmith', { fontSize: '10px', color: '#fff' }).setOrigin(0.5);
    
    this.add.rectangle(240, 60, 60, 40, 0x5c4033); // Building 2
    this.add.text(240, 60, 'Apothecary', { fontSize: '10px', color: '#fff' }).setOrigin(0.5);
    
    this.add.rectangle(80, 120, 60, 40, 0x5c4033); // Building 3
    this.add.text(80, 120, 'Archivist', { fontSize: '10px', color: '#fff' }).setOrigin(0.5);
    
    this.add.rectangle(240, 120, 60, 40, 0x5c4033); // Building 4
    this.add.text(240, 120, 'Gatekeeper', { fontSize: '10px', color: '#fff' }).setOrigin(0.5);
    
    // Add town square
    this.add.rectangle(160, 90, 40, 40, 0x4a4a4a);
    this.add.text(160, 90, 'Square', { fontSize: '10px', color: '#fff' }).setOrigin(0.5);
    
    // Add some lamps
    const lampPositions = [
      { x: 50, y: 50 },
      { x: 270, y: 50 },
      { x: 50, y: 130 },
      { x: 270, y: 130 }
    ];
    
    lampPositions.forEach(pos => {
      this.add.circle(pos.x, pos.y, 3, 0x4a4a4a); // Post
      const glow = this.add.circle(pos.x, pos.y - 5, 8, 0xffa500, 0.3);
      
      // Flicker
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.2, to: 0.4 },
        duration: 1000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1
      });
    });
    
    console.log('SimpleTownScene: Created successfully');
  }
}