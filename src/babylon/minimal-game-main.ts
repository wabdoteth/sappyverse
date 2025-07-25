import { MinimalGame } from './MinimalGame';

window.addEventListener('DOMContentLoaded', () => {
  console.log('Starting minimal game...');
  
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }
  
  try {
    const game = new MinimalGame(canvas);
    (window as any).game = game;
    console.log('Game started successfully');
  } catch (error) {
    console.error('Failed to start game:', error);
  }
});