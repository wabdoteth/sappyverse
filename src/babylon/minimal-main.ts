import { MinimalApp } from './MinimalApp';

// Wait for DOM
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }
  
  console.log('Canvas found:', canvas);
  
  try {
    // Create app
    const app = new MinimalApp(canvas);
    
    // Make it global for debugging
    (window as any).app = app;
    
    console.log('App created successfully');
  } catch (error) {
    console.error('Error creating app:', error);
  }
});