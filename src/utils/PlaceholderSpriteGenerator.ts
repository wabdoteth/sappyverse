import Phaser from 'phaser';

export class PlaceholderSpriteGenerator {
  static generatePlayerSprites(scene: Phaser.Scene): void {
    const frameWidth = 32;
    const frameHeight = 32;
    const frames = 8;
    
    const directions = ['up', 'down', 'left', 'right'];
    const animations = ['idle', 'run', 'attack1', 'attack2'];
    
    directions.forEach(dir => {
      animations.forEach(anim => {
        const key = `player_${anim}_${dir}`;
        
        // Create a canvas for the sprite sheet
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth * frames;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d')!;
        
        // Generate frames
        for (let i = 0; i < frames; i++) {
          const x = i * frameWidth;
          
          // Clear frame area
          ctx.fillStyle = 'transparent';
          ctx.fillRect(x, 0, frameWidth, frameHeight);
          
          // Draw shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(x + frameWidth/2, frameHeight - 4, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw body
          const bodyColor = anim.includes('attack') ? '#ff6b6b' : '#8B4513';
          ctx.fillStyle = bodyColor;
          ctx.fillRect(x + 10, 12, 12, 14);
          
          // Draw head
          ctx.fillStyle = '#FFE4C4';
          ctx.beginPath();
          ctx.arc(x + frameWidth/2, 10, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw direction indicator
          ctx.fillStyle = '#333';
          switch(dir) {
            case 'up':
              ctx.fillRect(x + 14, 6, 4, 2);
              break;
            case 'down':
              ctx.fillRect(x + 14, 12, 4, 2);
              break;
            case 'left':
              ctx.fillRect(x + 10, 9, 2, 4);
              break;
            case 'right':
              ctx.fillRect(x + 20, 9, 2, 4);
              break;
          }
          
          // Add animation variation
          if (anim === 'run') {
            const bounce = Math.sin(i * Math.PI / 4) * 2;
            ctx.fillStyle = bodyColor;
            ctx.fillRect(x + 10, 12 - bounce, 12, 14);
          }
          
          // Add attack effect
          if (anim.includes('attack') && i >= 3 && i <= 5) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + frameWidth/2, frameHeight/2, 12, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        
        // Convert canvas to texture
        scene.textures.addCanvas(key, canvas);
      });
    });
  }
}