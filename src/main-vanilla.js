import Phaser from 'phaser';

console.log('main-vanilla.js loaded');
console.log('Phaser:', Phaser);

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    create() {
        console.log('BootScene started');
        this.scene.start('MainScene');
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }
    
    create() {
        console.log('MainScene started');
        
        // Set background
        this.cameras.main.setBackgroundColor('#2a2a2a');
        
        // Add test elements
        this.add.rectangle(160, 90, 100, 50, 0x00ff00);
        this.add.text(160, 90, 'Game Running!', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add some animated elements
        const circle = this.add.circle(50, 50, 20, 0xff0000);
        this.tweens.add({
            targets: circle,
            x: 270,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 180,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    scene: [BootScene, MainScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        zoom: 3
    }
};

console.log('Creating game with config:', config);

try {
    const game = new Phaser.Game(config);
    console.log('Game created successfully:', game);
} catch (error) {
    console.error('Error creating game:', error);
}