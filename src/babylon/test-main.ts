// Test main to switch between different implementations
import { ProperBabylonApp } from './ProperBabylonApp';
import { AlternativeApp } from './AlternativeApp';
import { DiagnosticApp } from './DiagnosticApp';
import { createBabylonApp } from './WorkingSolution';

// Get test mode from URL params
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'working';

window.addEventListener('DOMContentLoaded', () => {
  console.log(`Testing mode: ${mode}`);
  console.log('Available modes: ?mode=working, ?mode=proper, ?mode=alternative, ?mode=diagnostic');
  
  try {
    let app: any;
    
    switch (mode) {
      case 'working':
        console.log('Loading WorkingSolution based on standalone HTML pattern...');
        const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
        createBabylonApp(canvas);
        app = 'Function-based app';
        break;
        
      case 'proper':
        console.log('Loading ProperBabylonApp with correct ES module imports...');
        app = new ProperBabylonApp('renderCanvas');
        break;
        
      case 'alternative':
        console.log('Loading AlternativeApp with namespace imports...');
        app = new AlternativeApp('renderCanvas');
        break;
        
      case 'diagnostic':
        console.log('Loading DiagnosticApp for debugging...');
        app = new DiagnosticApp('renderCanvas');
        break;
        
      default:
        console.error('Unknown mode:', mode);
        return;
    }
    
    // Make available globally
    (window as any).babylonApp = app;
    
    console.log('App loaded successfully');
    
  } catch (error) {
    console.error('Failed to load app:', error);
  }
});