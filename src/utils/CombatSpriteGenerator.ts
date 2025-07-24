export class CombatSpriteGenerator {
  
  static generateEnemySprite(
    scene: Phaser.Scene, 
    type: 'brute' | 'hunter' | 'wisp' | 'hybrid',
    width: number = 60,
    height: number = 80
  ): string {
    const key = `enemy_combat_${type}`;
    
    if (scene.textures.exists(key)) {
      return key;
    }
    
    const graphics = scene.add.graphics();
    
    switch (type) {
      case 'brute':
        this.drawBruteEnemy(graphics, width, height);
        break;
      case 'hunter':
        this.drawHunterEnemy(graphics, width, height);
        break;
      case 'wisp':
        this.drawWispEnemy(graphics, width, height);
        break;
      case 'hybrid':
        this.drawHybridEnemy(graphics, width, height);
        break;
    }
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    return key;
  }
  
  private static drawBruteEnemy(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Body - bulky rectangle
    graphics.fillStyle(0x8b0000); // Dark red
    graphics.fillRect(width * 0.2, height * 0.3, width * 0.6, height * 0.5);
    
    // Arms - thick rectangles
    graphics.fillStyle(0x8b0000);
    graphics.fillRect(width * 0.05, height * 0.35, width * 0.15, height * 0.35);
    graphics.fillRect(width * 0.8, height * 0.35, width * 0.15, height * 0.35);
    
    // Head - square
    graphics.fillStyle(0xaa0000);
    graphics.fillRect(width * 0.3, height * 0.1, width * 0.4, height * 0.25);
    
    // Eyes - angry
    graphics.fillStyle(0xffff00);
    graphics.fillRect(width * 0.35, height * 0.15, width * 0.08, height * 0.05);
    graphics.fillRect(width * 0.57, height * 0.15, width * 0.08, height * 0.05);
    
    // Sword icon on chest
    graphics.lineStyle(3, 0xffffff);
    graphics.beginPath();
    graphics.moveTo(width * 0.5, height * 0.4);
    graphics.lineTo(width * 0.5, height * 0.6);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(width * 0.4, height * 0.45);
    graphics.lineTo(width * 0.6, height * 0.45);
    graphics.strokePath();
  }
  
  private static drawHunterEnemy(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Body - slender
    graphics.fillStyle(0x228b22); // Forest green
    graphics.fillRect(width * 0.35, height * 0.3, width * 0.3, height * 0.45);
    
    // Arms
    graphics.fillStyle(0x228b22);
    graphics.fillRect(width * 0.2, height * 0.35, width * 0.15, height * 0.25);
    graphics.fillRect(width * 0.65, height * 0.35, width * 0.15, height * 0.25);
    
    // Head - hooded
    graphics.fillStyle(0x006400); // Dark green
    graphics.fillRect(width * 0.25, height * 0.05, width * 0.5, height * 0.3);
    
    // Eyes - sharp
    graphics.fillStyle(0x00ff00);
    graphics.fillCircle(width * 0.4, height * 0.18, width * 0.04);
    graphics.fillCircle(width * 0.6, height * 0.18, width * 0.04);
    
    // Bow on back
    graphics.lineStyle(2, 0x8b4513);
    graphics.arc(width * 0.8, height * 0.5, width * 0.15, 1.57, 4.71, false);
    graphics.strokePath();
    graphics.lineStyle(1, 0xffffff);
    graphics.beginPath();
    graphics.moveTo(width * 0.8, height * 0.35);
    graphics.lineTo(width * 0.8, height * 0.65);
    graphics.strokePath();
  }
  
  private static drawWispEnemy(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Ethereal body - gradient circles
    graphics.fillStyle(0x4169e1, 0.6); // Royal blue
    graphics.fillCircle(width * 0.5, height * 0.5, width * 0.35);
    
    graphics.fillStyle(0x6495ed, 0.8); // Cornflower blue
    graphics.fillCircle(width * 0.5, height * 0.5, width * 0.25);
    
    graphics.fillStyle(0x87ceeb, 1); // Sky blue
    graphics.fillCircle(width * 0.5, height * 0.5, width * 0.15);
    
    // Eyes - glowing
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(width * 0.4, height * 0.45, width * 0.06);
    graphics.fillCircle(width * 0.6, height * 0.45, width * 0.06);
    
    graphics.fillStyle(0x0000ff);
    graphics.fillCircle(width * 0.4, height * 0.45, width * 0.03);
    graphics.fillCircle(width * 0.6, height * 0.45, width * 0.03);
    
    // Magic particles
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x = width * 0.5 + Math.cos(angle) * width * 0.3;
      const y = height * 0.5 + Math.sin(angle) * height * 0.3;
      graphics.fillStyle(0xadd8e6, 0.8);
      graphics.fillCircle(x, y, width * 0.04);
    }
  }
  
  private static drawHybridEnemy(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Body - angular, shifting form
    graphics.fillStyle(0x8b008b); // Dark magenta
    graphics.fillRect(width * 0.25, height * 0.35, width * 0.5, height * 0.4);
    
    // Multiple arms suggestion
    graphics.fillStyle(0x8b008b, 0.6);
    graphics.fillRect(width * 0.1, height * 0.4, width * 0.15, height * 0.2);
    graphics.fillRect(width * 0.75, height * 0.4, width * 0.15, height * 0.2);
    graphics.fillRect(width * 0.15, height * 0.45, width * 0.15, height * 0.2);
    graphics.fillRect(width * 0.7, height * 0.45, width * 0.15, height * 0.2);
    
    // Head - crystalline
    graphics.fillStyle(0x9370db); // Medium purple
    graphics.beginPath();
    graphics.moveTo(width * 0.5, height * 0.1);
    graphics.lineTo(width * 0.3, height * 0.3);
    graphics.lineTo(width * 0.7, height * 0.3);
    graphics.closePath();
    graphics.fillPath();
    
    // Three eyes - one for each form
    graphics.fillStyle(0xff0000); // Red for melee
    graphics.fillCircle(width * 0.35, height * 0.22, width * 0.04);
    
    graphics.fillStyle(0x00ff00); // Green for ranged
    graphics.fillCircle(width * 0.5, height * 0.18, width * 0.04);
    
    graphics.fillStyle(0x0000ff); // Blue for magic
    graphics.fillCircle(width * 0.65, height * 0.22, width * 0.04);
    
    // RPS symbol in center
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeCircle(width * 0.5, height * 0.55, width * 0.1);
    
    // Draw small RPS icons
    graphics.fillStyle(0xffffff);
    graphics.fillTriangle(
      width * 0.5, height * 0.5,
      width * 0.45, height * 0.58,
      width * 0.55, height * 0.58
    );
  }
  
  static generatePlayerCombatSprite(scene: Phaser.Scene, width: number = 60, height: number = 80): string {
    const key = 'player_combat_sprite';
    
    if (scene.textures.exists(key)) {
      return key;
    }
    
    const graphics = scene.add.graphics();
    
    // Body
    graphics.fillStyle(0x4169e1); // Royal blue
    graphics.fillRect(width * 0.25, height * 0.35, width * 0.5, height * 0.4);
    
    // Arms
    graphics.fillStyle(0x4169e1);
    graphics.fillRect(width * 0.15, height * 0.4, width * 0.15, height * 0.25);
    graphics.fillRect(width * 0.7, height * 0.4, width * 0.15, height * 0.25);
    
    // Head
    graphics.fillStyle(0xffdbac); // Skin tone
    graphics.fillCircle(width * 0.5, height * 0.2, width * 0.2);
    
    // Eyes
    graphics.fillStyle(0x000000);
    graphics.fillCircle(width * 0.42, height * 0.18, width * 0.03);
    graphics.fillCircle(width * 0.58, height * 0.18, width * 0.03);
    
    // Helmet/Hair
    graphics.fillStyle(0x696969); // Dim gray
    graphics.fillRect(width * 0.3, height * 0.05, width * 0.4, height * 0.12);
    graphics.fillRect(width * 0.25, height * 0.1, width * 0.5, height * 0.08);
    
    // Sword on hip
    graphics.lineStyle(2, 0xc0c0c0);
    graphics.beginPath();
    graphics.moveTo(width * 0.15, height * 0.5);
    graphics.lineTo(width * 0.25, height * 0.7);
    graphics.strokePath();
    
    // Shield on back
    graphics.fillStyle(0x808080);
    graphics.fillCircle(width * 0.75, height * 0.5, width * 0.12);
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    return key;
  }
}