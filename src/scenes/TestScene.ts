import Phaser from 'phaser';

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' });
  }

  create(): void {
    console.log('TestScene: Creating test scene');
    
    // Add a simple text
    const text = this.add.text(160, 90, 'Phaser is working!', {
      fontSize: '16px',
      color: '#ffffff'
    });
    text.setOrigin(0.5, 0.5);
    
    // Add a simple rectangle
    this.add.rectangle(160, 120, 100, 50, 0x00ff00);
    
    console.log('TestScene: Test elements added');
  }
}