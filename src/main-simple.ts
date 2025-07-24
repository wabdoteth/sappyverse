import Phaser from 'phaser';

class SimpleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SimpleScene' });
  }

  preload() {
    console.log('SimpleScene: preload');
  }

  create() {
    console.log('SimpleScene: create');
    
    // Set background
    this.cameras.main.setBackgroundColor(0x2d2d2d);
    
    // Add text
    this.add.text(160, 90, 'Game is Running!', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add a green square
    this.add.rectangle(160, 120, 50, 50, 0x00ff00);
    
    // Add a circle
    this.add.circle(100, 100, 20, 0xff0000);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 320,
  height: 180,
  parent: 'game-container',
  backgroundColor: 0x000000,
  scene: SimpleScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 4
  }
};

console.log('Creating Phaser game...');
const game = new Phaser.Game(config);
console.log('Game created:', game);