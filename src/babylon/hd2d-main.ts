// HD-2D Game Entry Point
import { HD2DGame } from './HD2DGame';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Create HD-2D game instance
    const game = new HD2DGame(canvas);
    
    // Add debug controls (temporary)
    const addDebugControls = () => {
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'absolute';
        debugDiv.style.top = '10px';
        debugDiv.style.right = '10px';
        debugDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        debugDiv.style.color = 'white';
        debugDiv.style.padding = '10px';
        debugDiv.style.fontFamily = 'monospace';
        debugDiv.style.fontSize = '12px';
        debugDiv.style.borderRadius = '5px';
        debugDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">HD-2D Debug Controls</h3>
            <button id="toggleShadows" style="display: block; margin: 5px 0; width: 100%;">Enable Shadows</button>
            <button id="toggleDOF" style="display: block; margin: 5px 0; width: 100%;">Enable Depth of Field</button>
            <button id="toggleBloom" style="display: block; margin: 5px 0; width: 100%;">Enable Bloom</button>
            <button id="toggleCollisions" style="display: block; margin: 5px 0; width: 100%;">Hide Collision Debug</button>
            <button id="toggleOutlines" style="display: block; margin: 5px 0; width: 100%;">Enable HD-2D Outlines</button>
            <button id="toggleParticles" style="display: block; margin: 5px 0; width: 100%;">Disable Particles</button>
            <button id="toggleFog" style="display: block; margin: 5px 0; width: 100%;">Disable Fog</button>
            <button id="toggleDithering" style="display: block; margin: 5px 0; width: 100%;">Disable Dithering</button>
            <hr style="margin: 10px 0;">
            <button id="toggleInspector" style="display: block; margin: 5px 0; width: 100%; background: #4CAF50; color: white;">Open Babylon Inspector</button>
            <hr style="margin: 10px 0;">
            <div style="margin: 10px 0;">
                <strong>Time of Day</strong>
                <div>Time: <span id="timeDisplay">9:00 AM</span></div>
                <input type="range" id="timeSlider" min="0" max="24" step="0.1" value="9" style="width: 100%; margin: 5px 0;">
                <div style="display: flex; gap: 5px;">
                    <button id="pauseTime" style="flex: 1;">Pause</button>
                    <button id="playTime" style="flex: 1;">Play</button>
                    <button id="fastTime" style="flex: 1;">Fast</button>
                </div>
            </div>
            <hr style="margin: 10px 0;">
            <div>FPS: <span id="fps">0</span></div>
            <div>Draw Calls: <span id="drawCalls">0</span></div>
        `;
        document.body.appendChild(debugDiv);
        
        // Button handlers with toggle functionality
        // These start in their actual states as set in HD2DGame
        let shadowsEnabled = true; // Shadows are enabled by default in createTownScene
        document.getElementById('toggleShadows')?.addEventListener('click', (e) => {
            shadowsEnabled = !shadowsEnabled;
            game.toggleShadows(shadowsEnabled);
            (e.target as HTMLButtonElement).textContent = shadowsEnabled ? 'Disable Shadows' : 'Enable Shadows';
        });
        // Update initial button text
        const shadowBtn = document.getElementById('toggleShadows') as HTMLButtonElement;
        if (shadowBtn) shadowBtn.textContent = 'Disable Shadows';
        
        let dofEnabled = false; // DOF is disabled by default
        document.getElementById('toggleDOF')?.addEventListener('click', (e) => {
            dofEnabled = !dofEnabled;
            game.toggleDepthOfField(dofEnabled);
            (e.target as HTMLButtonElement).textContent = dofEnabled ? 'Disable Depth of Field' : 'Enable Depth of Field';
        });
        
        let bloomEnabled = true; // Bloom is enabled by default in createTownScene
        document.getElementById('toggleBloom')?.addEventListener('click', (e) => {
            bloomEnabled = !bloomEnabled;
            game.toggleBloom(bloomEnabled);
            (e.target as HTMLButtonElement).textContent = bloomEnabled ? 'Disable Bloom' : 'Enable Bloom';
        });
        // Update initial button text
        const bloomBtn = document.getElementById('toggleBloom') as HTMLButtonElement;
        if (bloomBtn) bloomBtn.textContent = 'Disable Bloom';
        
        // Collision debug toggle
        let collisionsVisible = true;
        document.getElementById('toggleCollisions')?.addEventListener('click', (e) => {
            collisionsVisible = !collisionsVisible;
            game.toggleDebugVisuals(collisionsVisible);
            game.toggleCollisionDebug(collisionsVisible); // Also toggle the green wireframe colliders
            (e.target as HTMLButtonElement).textContent = collisionsVisible ? 'Hide Collision Debug' : 'Show Collision Debug';
        });
        
        // HD-2D Outlines toggle
        let outlinesEnabled = false; // Off by default as per HD2DGame
        document.getElementById('toggleOutlines')?.addEventListener('click', (e) => {
            outlinesEnabled = !outlinesEnabled;
            game.toggleOutlines(outlinesEnabled);
            (e.target as HTMLButtonElement).textContent = outlinesEnabled ? 'Disable HD-2D Outlines' : 'Enable HD-2D Outlines';
        });
        
        // Particles toggle
        let particlesEnabled = true;
        document.getElementById('toggleParticles')?.addEventListener('click', (e) => {
            particlesEnabled = !particlesEnabled;
            game.toggleParticles(particlesEnabled);
            (e.target as HTMLButtonElement).textContent = particlesEnabled ? 'Disable Particles' : 'Enable Particles';
        });
        
        // Fog toggle
        let fogEnabled = true;
        document.getElementById('toggleFog')?.addEventListener('click', (e) => {
            fogEnabled = !fogEnabled;
            game.toggleFog(fogEnabled);
            (e.target as HTMLButtonElement).textContent = fogEnabled ? 'Disable Fog' : 'Enable Fog';
        });
        
        // Dithering toggle
        let ditheringEnabled = true; // Dithering is enabled by default (0.1 strength)
        document.getElementById('toggleDithering')?.addEventListener('click', (e) => {
            ditheringEnabled = !ditheringEnabled;
            game.toggleDithering(ditheringEnabled);
            (e.target as HTMLButtonElement).textContent = ditheringEnabled ? 'Disable Dithering' : 'Enable Dithering';
        });
        
        // Inspector toggle
        document.getElementById('toggleInspector')?.addEventListener('click', () => {
            const scene = game.getScene();
            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.hide();
            } else {
                scene.debugLayer.show({
                    handleResize: true,
                    overlay: false,
                    embedMode: true
                });
            }
        });
        
        // Time controls
        const timeSlider = document.getElementById('timeSlider') as HTMLInputElement;
        const timeDisplay = document.getElementById('timeDisplay');
        
        timeSlider?.addEventListener('input', (e) => {
            const hour = parseFloat((e.target as HTMLInputElement).value);
            game.setTimeOfDay(hour);
            if (timeDisplay) {
                timeDisplay.textContent = game.getTimeString();
            }
        });
        
        document.getElementById('pauseTime')?.addEventListener('click', () => {
            game.pauseTime();
        });
        
        document.getElementById('playTime')?.addEventListener('click', () => {
            game.resumeTime();
            game.setTimeSpeed(60); // 1 hour per second
        });
        
        document.getElementById('fastTime')?.addEventListener('click', () => {
            game.resumeTime();
            game.setTimeSpeed(300); // 5 hours per second
        });
        
        // FPS counter
        const fpsSpan = document.getElementById('fps');
        const drawCallsSpan = document.getElementById('drawCalls');
        
        setInterval(() => {
            if (fpsSpan) {
                fpsSpan.textContent = game.getEngine().getFps().toFixed(0);
            }
            if (drawCallsSpan && game.getScene()._drawCalls !== undefined) {
                drawCallsSpan.textContent = game.getScene()._drawCalls.toString();
            }
            // Update time display
            if (timeDisplay && game.timeOfDaySystem) {
                timeDisplay.textContent = game.getTimeString();
                // Update slider position
                if (timeSlider) {
                    timeSlider.value = game.timeOfDaySystem.getCurrentHour().toString();
                }
            }
        }, 100);
    };
    
    // Add debug controls after a short delay
    setTimeout(addDebugControls, 100);
    
    console.log('HD-2D Game initialized!');
});