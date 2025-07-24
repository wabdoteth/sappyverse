import Phaser from 'phaser';

export class SpriteTestScene extends Phaser.Scene {
  private currentFrame: number = 0;
  private currentSprite!: Phaser.GameObjects.Sprite;
  private frameText!: Phaser.GameObjects.Text;
  private testSizes: number[] = [16, 24, 32, 48, 64, 96, 128];
  private currentSizeIndex: number = 0;
  
  constructor() {
    super({ key: 'SpriteTestScene' });
  }
  
  preload(): void {
    // Load one sprite sheet as a test
    this.load.image('test_sheet', 'assets/sprites/player/IDLE/idle_down.png');
  }
  
  create(): void {
    this.add.text(10, 10, 'Sprite Sheet Analyzer', { fontSize: '20px', color: '#ffffff' });
    
    // Display the full sprite sheet
    const fullSheet = this.add.image(320, 100, 'test_sheet');
    fullSheet.setScale(0.5);
    
    // Get texture dimensions
    const texture = this.textures.get('test_sheet');
    const width = texture.getSourceImage().width;
    const height = texture.getSourceImage().height;
    
    this.add.text(10, 40, `Sheet dimensions: ${width}x${height}`, { fontSize: '16px', color: '#ffffff' });
    this.add.text(10, 60, `Likely frame size (8 frames): ${width/8}x${height}`, { fontSize: '16px', color: '#ffffff' });
    
    // Test different frame sizes
    this.frameText = this.add.text(10, 200, '', { fontSize: '16px', color: '#ffffff' });
    
    // Create sprite with test frame size
    this.testFrameSize();
    
    // Instructions
    this.add.text(10, 320, 'Controls:', { fontSize: '16px', color: '#ffffff' });
    this.add.text(10, 340, 'LEFT/RIGHT: Change frame', { fontSize: '14px', color: '#ffffff' });
    this.add.text(10, 360, 'UP/DOWN: Change frame size', { fontSize: '14px', color: '#ffffff' });
    this.add.text(10, 380, 'SPACE: Return to game', { fontSize: '14px', color: '#ffffff' });
    
    // Controls
    const cursors = this.input.keyboard!.createCursorKeys();
    const space = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    cursors.left.on('down', () => this.previousFrame());
    cursors.right.on('down', () => this.nextFrame());
    cursors.up.on('down', () => this.changeFrameSize(1));
    cursors.down.on('down', () => this.changeFrameSize(-1));
    space.on('down', () => this.scene.start('TownScene2D5'));
  }
  
  private testFrameSize(): void {
    const frameSize = this.testSizes[this.currentSizeIndex];
    
    // Remove old sprite
    if (this.currentSprite) {
      this.currentSprite.destroy();
    }
    
    // Create new spritesheet with test size
    const key = `test_${frameSize}`;
    if (!this.textures.exists(key)) {
      this.textures.remove(key);
      this.load.spritesheet(key, 'assets/sprites/player/IDLE/idle_down.png', {
        frameWidth: frameSize,
        frameHeight: frameSize
      });
      this.load.once('complete', () => {
        this.createTestSprite(key, frameSize);
      });
      this.load.start();
    } else {
      this.createTestSprite(key, frameSize);
    }
  }
  
  private createTestSprite(key: string, frameSize: number): void {
    this.currentSprite = this.add.sprite(320, 250, key, this.currentFrame);
    this.currentSprite.setScale(2);
    
    // Draw frame border
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xff0000);
    graphics.strokeRect(
      this.currentSprite.x - frameSize,
      this.currentSprite.y - frameSize,
      frameSize * 2,
      frameSize * 2
    );
    
    this.updateFrameText(frameSize);
  }
  
  private updateFrameText(frameSize: number): void {
    this.frameText.setText([
      `Current frame size: ${frameSize}x${frameSize}`,
      `Current frame: ${this.currentFrame}`,
      `Total frames: ${this.currentSprite.texture.frameTotal}`
    ]);
  }
  
  private nextFrame(): void {
    this.currentFrame = (this.currentFrame + 1) % this.currentSprite.texture.frameTotal;
    this.currentSprite.setFrame(this.currentFrame);
    this.updateFrameText(this.testSizes[this.currentSizeIndex]);
  }
  
  private previousFrame(): void {
    this.currentFrame = (this.currentFrame - 1 + this.currentSprite.texture.frameTotal) % this.currentSprite.texture.frameTotal;
    this.currentSprite.setFrame(this.currentFrame);
    this.updateFrameText(this.testSizes[this.currentSizeIndex]);
  }
  
  private changeFrameSize(direction: number): void {
    this.currentSizeIndex = Phaser.Math.Clamp(
      this.currentSizeIndex + direction,
      0,
      this.testSizes.length - 1
    );
    this.currentFrame = 0;
    this.testFrameSize();
  }
}