import Phaser from 'phaser';

export class SpriteGenerator {
  /**
   * Generate a simple pixel art NPC sprite
   */
  static generateNPCSprite(
    scene: Phaser.Scene,
    key: string,
    role: 'blacksmith' | 'apothecary' | 'archivist' | 'gatekeeper'
  ): void {
    const width = 32;
    const height = 48;
    
    // Check if texture already exists
    if (scene.textures.exists(key)) {
      return;
    }
    
    // Create canvas texture
    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) {
      console.error(`Failed to create texture for ${key}`);
      return;
    }
    
    const canvas = texture.getSourceImage() as HTMLCanvasElement;
    if (!canvas) {
      console.error(`Failed to get canvas for ${key}`);
      return;
    }
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error(`Failed to get context for ${key}`);
      return;
    }
    
    // Define colors for each role
    const roleColors = {
      blacksmith: {
        skin: '#FFB380',
        hair: '#4A2C17',
        shirt: '#8B4513',
        pants: '#2F2F2F',
        apron: '#5C4033'
      },
      apothecary: {
        skin: '#F5DEB3',
        hair: '#696969',
        shirt: '#2F4F4F',
        pants: '#1C1C1C',
        robe: '#3C5C5C'
      },
      archivist: {
        skin: '#FFE4C4',
        hair: '#F5F5DC',
        shirt: '#4B0082',
        pants: '#2F2F4F',
        glasses: '#4A4A4A'
      },
      gatekeeper: {
        skin: '#DEB887',
        hair: '#1C1C1C',
        shirt: '#696969',
        pants: '#3C3C3C',
        armor: '#4A4A4A'
      }
    };
    
    const colors = roleColors[role];
    
    // Clear canvas
    context.clearRect(0, 0, width, height);
    
    // Enable pixel art style
    context.imageSmoothingEnabled = false;
    
    // Draw shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(10, 44, 12, 4);
    
    // Draw legs
    context.fillStyle = colors.pants;
    context.fillRect(12, 36, 4, 8); // left leg
    context.fillRect(16, 36, 4, 8); // right leg
    
    // Draw body/shirt
    context.fillStyle = colors.shirt;
    context.fillRect(10, 24, 12, 14);
    
    // Role-specific clothing
    if (role === 'blacksmith' && colors.apron) {
      // Draw apron
      context.fillStyle = colors.apron;
      context.fillRect(11, 28, 10, 8);
    } else if (role === 'apothecary' && colors.robe) {
      // Draw robe overlay
      context.fillStyle = colors.robe;
      context.fillRect(9, 26, 14, 12);
      context.fillRect(11, 24, 10, 2);
    } else if (role === 'gatekeeper' && colors.armor) {
      // Draw armor plates
      context.fillStyle = colors.armor;
      context.fillRect(10, 24, 12, 8);
      context.fillRect(11, 32, 10, 4);
    }
    
    // Draw arms
    context.fillStyle = colors.skin;
    context.fillRect(8, 26, 3, 8); // left arm
    context.fillRect(21, 26, 3, 8); // right arm
    
    // Draw head
    context.fillStyle = colors.skin;
    context.fillRect(12, 12, 8, 10);
    
    // Draw hair
    context.fillStyle = colors.hair;
    context.fillRect(12, 12, 8, 4);
    context.fillRect(11, 13, 10, 2);
    
    // Role-specific features
    if (role === 'archivist' && colors.glasses) {
      // Draw glasses
      context.fillStyle = colors.glasses;
      context.fillRect(13, 17, 3, 2);
      context.fillRect(16, 17, 3, 2);
      context.fillRect(13, 17, 6, 1);
    }
    
    // Draw face features
    context.fillStyle = '#000000';
    context.fillRect(14, 17, 1, 1); // left eye
    context.fillRect(17, 17, 1, 1); // right eye
    context.fillRect(15, 20, 2, 1); // mouth
    
    // Update texture
    texture!.refresh();
  }
  
  /**
   * Generate sprites for all NPCs
   */
  static generateAllNPCSprites(scene: Phaser.Scene): void {
    this.generateNPCSprite(scene, 'npc_blacksmith', 'blacksmith');
    this.generateNPCSprite(scene, 'npc_apothecary', 'apothecary');
    this.generateNPCSprite(scene, 'npc_archivist', 'archivist');
    this.generateNPCSprite(scene, 'npc_gatekeeper', 'gatekeeper');
    
    // Also generate portraits
    this.generateAllNPCPortraits(scene);
  }
  
  /**
   * Generate a portrait for an NPC
   */
  static generateNPCPortrait(
    scene: Phaser.Scene,
    key: string,
    role: 'blacksmith' | 'apothecary' | 'archivist' | 'gatekeeper'
  ): void {
    const width = 120;
    const height = 120;
    
    // Create canvas texture
    const texture = scene.textures.createCanvas(key, width, height);
    const canvas = texture!.getSourceImage() as HTMLCanvasElement;
    const context = canvas.getContext('2d')!;
    
    // Define colors for each role
    const roleColors = {
      blacksmith: {
        skin: '#FFB380',
        hair: '#4A2C17',
        shirt: '#8B4513',
        eyes: '#5C4033',
        apron: '#5C4033',
        beard: '#3A2317'
      },
      apothecary: {
        skin: '#F5DEB3',
        hair: '#696969',
        shirt: '#2F4F4F',
        eyes: '#4A7C59',
        robe: '#3C5C5C'
      },
      archivist: {
        skin: '#FFE4C4',
        hair: '#F5F5DC',
        shirt: '#4B0082',
        eyes: '#4169E1',
        glasses: '#4A4A4A'
      },
      gatekeeper: {
        skin: '#DEB887',
        hair: '#1C1C1C',
        shirt: '#696969',
        eyes: '#8B4513',
        armor: '#4A4A4A',
        scar: '#CD5C5C'
      }
    };
    
    const colors = roleColors[role];
    
    // Clear canvas
    context.clearRect(0, 0, width, height);
    
    // Enable pixel art style
    context.imageSmoothingEnabled = false;
    
    // Background gradient
    const gradient = context.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
    gradient.addColorStop(0, '#3a3a3a');
    gradient.addColorStop(1, '#2a2a2a');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    
    // Neck
    context.fillStyle = colors.skin;
    context.fillRect(45, 75, 30, 20);
    
    // Shirt/armor collar
    context.fillStyle = colors.shirt;
    context.fillRect(40, 85, 40, 35);
    
    // Head shape (larger for portrait)
    context.fillStyle = colors.skin;
    context.fillRect(30, 25, 60, 60);
    
    // Hair
    context.fillStyle = colors.hair;
    context.fillRect(30, 25, 60, 20);
    context.fillRect(28, 30, 64, 10);
    
    // Role-specific features
    if (role === 'blacksmith') {
      // Beard
      context.fillStyle = colors.beard!;
      context.fillRect(35, 65, 50, 15);
      context.fillRect(40, 60, 40, 5);
      
      // Soot marks
      context.fillStyle = 'rgba(0, 0, 0, 0.3)';
      context.fillRect(70, 45, 10, 5);
      context.fillRect(35, 50, 5, 5);
    } else if (role === 'apothecary') {
      // Hood
      context.fillStyle = colors.robe!;
      context.fillRect(25, 20, 70, 15);
      context.fillRect(20, 25, 80, 10);
    } else if (role === 'archivist' && colors.glasses) {
      // Glasses
      context.fillStyle = colors.glasses;
      context.fillRect(35, 50, 20, 15);
      context.fillRect(55, 50, 20, 15);
      context.fillRect(35, 55, 40, 2);
      
      // Lens shine
      context.fillStyle = 'rgba(255, 255, 255, 0.3)';
      context.fillRect(38, 52, 5, 5);
      context.fillRect(58, 52, 5, 5);
    } else if (role === 'gatekeeper') {
      // Scar
      context.fillStyle = colors.scar!;
      context.fillRect(70, 55, 15, 2);
      context.fillRect(72, 57, 11, 1);
      
      // Armor details
      context.fillStyle = colors.armor!;
      context.fillRect(35, 90, 50, 10);
      context.fillRect(40, 95, 40, 5);
    }
    
    // Eyes
    context.fillStyle = '#FFFFFF';
    context.fillRect(40, 52, 12, 10);
    context.fillRect(58, 52, 12, 10);
    
    // Pupils
    context.fillStyle = colors.eyes;
    context.fillRect(44, 54, 6, 6);
    context.fillRect(62, 54, 6, 6);
    
    // Eye details
    context.fillStyle = '#000000';
    context.fillRect(46, 56, 2, 2);
    context.fillRect(64, 56, 2, 2);
    
    // Nose
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.fillRect(52, 60, 6, 8);
    
    // Mouth
    context.fillStyle = '#000000';
    context.fillRect(48, 72, 14, 2);
    
    // Update texture
    texture!.refresh();
  }
  
  /**
   * Generate portraits for all NPCs
   */
  static generateAllNPCPortraits(scene: Phaser.Scene): void {
    this.generateNPCPortrait(scene, 'portrait_blacksmith', 'blacksmith');
    this.generateNPCPortrait(scene, 'portrait_apothecary', 'apothecary');
    this.generateNPCPortrait(scene, 'portrait_archivist', 'archivist');
    this.generateNPCPortrait(scene, 'portrait_gatekeeper', 'gatekeeper');
  }
}