import { Game } from './Game';

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Starting Shards of the Withering Wilds HD-2D...');
  
  try {
    // Create the game
    const game = new Game('renderCanvas');
    
    // Make it available globally for debugging
    (window as any).game = game;
    
    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});