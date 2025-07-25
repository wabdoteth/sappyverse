import { createBabylonApp } from './WorkingSolution';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('Initializing Babylon.js app...');
  
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  
  try {
    createBabylonApp(canvas);
  } catch (error) {
    console.error('Error creating Babylon app:', error);
  }
}