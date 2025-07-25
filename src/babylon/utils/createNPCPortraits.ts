// Utility to create placeholder NPC portraits
export function createNPCPortrait(name: string, color: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    ctx.fillStyle = '#2a1f1a';
    ctx.fillRect(0, 0, 180, 180);
    
    // Character background circle
    ctx.beginPath();
    ctx.arc(90, 90, 80, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Simple pixel art face
    ctx.fillStyle = '#f4e4c1';
    // Head
    ctx.fillRect(60, 40, 60, 80);
    
    // Eyes
    ctx.fillStyle = '#2a1f1a';
    ctx.fillRect(70, 60, 10, 10);
    ctx.fillRect(100, 60, 10, 10);
    
    // Mouth
    ctx.fillRect(80, 90, 20, 5);
    
    // Hair/hat based on character
    ctx.fillStyle = color;
    if (name === 'blacksmith') {
        // Bandana
        ctx.fillRect(50, 30, 80, 20);
    } else if (name === 'merchant') {
        // Hat
        ctx.fillRect(40, 20, 100, 30);
        ctx.fillRect(50, 50, 80, 10);
    } else if (name === 'guard') {
        // Helmet
        ctx.fillRect(50, 30, 80, 40);
        ctx.fillStyle = '#888';
        ctx.fillRect(50, 50, 80, 5);
    } else if (name === 'scholar') {
        // Glasses
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.strokeRect(65, 58, 20, 14);
        ctx.strokeRect(95, 58, 20, 14);
        ctx.beginPath();
        ctx.moveTo(85, 65);
        ctx.lineTo(95, 65);
        ctx.stroke();
    }
    
    // Name label
    ctx.fillStyle = '#f4e4c1';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), 90, 160);
    
    return canvas.toDataURL();
}

// Create all NPC portraits
export function createAllNPCPortraits(): { [key: string]: string } {
    return {
        blacksmith: createNPCPortrait('blacksmith', '#8B4513'),
        merchant: createNPCPortrait('merchant', '#4B0082'),
        innkeeper: createNPCPortrait('innkeeper', '#228B22'),
        scholar: createNPCPortrait('scholar', '#4169E1'),
        guard: createNPCPortrait('guard', '#DC143C')
    };
}