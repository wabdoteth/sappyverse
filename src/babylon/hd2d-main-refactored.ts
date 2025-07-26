// HD-2D Game Entry Point - Refactored Version
import { HD2DGame } from './HD2DGame_Refactored';
import { DebugUI } from './ui/DebugUI';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Create HD-2D game instance
    const game = new HD2DGame(canvas);
    
    // Create debug UI (if in development mode)
    if (process.env.NODE_ENV !== 'production') {
        setTimeout(() => {
            const debugUI = new DebugUI(game);
        }, 100);
    }
    
    console.log('HD-2D Game initialized with modular architecture!');
});