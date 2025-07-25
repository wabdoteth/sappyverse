import { ProperBabylonApp } from './ProperBabylonApp';

// Wait for DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  
  try {
    // Create the app
    const app = new ProperBabylonApp('renderCanvas');
    
    // Make it available globally for debugging
    (window as any).babylonApp = app;
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});