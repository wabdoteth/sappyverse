import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load any essential assets needed before the preloader
  }

  create(): void {
    console.log('BootScene: Starting...');
    
    // Move to preload scene
    this.scene.start('PreloadScene');
  }
}