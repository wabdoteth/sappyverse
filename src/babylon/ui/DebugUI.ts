import { HD2DGame } from '../HD2DGame';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';

export interface DebugUIConfig {
    shadowsEnabled: boolean;
    dofEnabled: boolean;
    bloomEnabled: boolean;
    collisionsVisible: boolean;
    outlinesEnabled: boolean;
    particlesEnabled: boolean;
    fogEnabled: boolean;
    ditheringEnabled: boolean;
}

export class DebugUI {
    private game: HD2DGame;
    private debugDiv: HTMLDivElement;
    private config: DebugUIConfig = {
        shadowsEnabled: true,
        dofEnabled: false,
        bloomEnabled: true,
        collisionsVisible: true,
        outlinesEnabled: false,
        particlesEnabled: true,
        fogEnabled: true,
        ditheringEnabled: true
    };

    constructor(game: HD2DGame) {
        this.game = game;
        this.createDebugPanel();
        this.startStatsUpdate();
    }

    private createDebugPanel(): void {
        this.debugDiv = document.createElement('div');
        this.debugDiv.style.position = 'absolute';
        this.debugDiv.style.top = '10px';
        this.debugDiv.style.right = '10px';
        this.debugDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        this.debugDiv.style.color = 'white';
        this.debugDiv.style.padding = '10px';
        this.debugDiv.style.fontFamily = 'monospace';
        this.debugDiv.style.fontSize = '12px';
        this.debugDiv.style.borderRadius = '5px';
        
        this.debugDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">HD-2D Debug Controls</h3>
            <button id="toggleShadows" style="display: block; margin: 5px 0; width: 100%;">Disable Shadows</button>
            <button id="toggleDOF" style="display: block; margin: 5px 0; width: 100%;">Enable Depth of Field</button>
            <button id="toggleBloom" style="display: block; margin: 5px 0; width: 100%;">Disable Bloom</button>
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
        
        document.body.appendChild(this.debugDiv);
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // Shadows toggle
        this.setupToggleButton('toggleShadows', 
            () => this.config.shadowsEnabled, 
            (enabled) => {
                this.config.shadowsEnabled = enabled;
                this.game.toggleShadows(enabled);
            },
            'Disable Shadows', 'Enable Shadows'
        );

        // DOF toggle
        this.setupToggleButton('toggleDOF', 
            () => this.config.dofEnabled, 
            (enabled) => {
                this.config.dofEnabled = enabled;
                this.game.toggleDepthOfField(enabled);
            },
            'Disable Depth of Field', 'Enable Depth of Field'
        );

        // Bloom toggle
        this.setupToggleButton('toggleBloom', 
            () => this.config.bloomEnabled, 
            (enabled) => {
                this.config.bloomEnabled = enabled;
                this.game.toggleBloom(enabled);
            },
            'Disable Bloom', 'Enable Bloom'
        );

        // Collision debug toggle
        this.setupToggleButton('toggleCollisions', 
            () => this.config.collisionsVisible, 
            (enabled) => {
                this.config.collisionsVisible = enabled;
                this.game.toggleDebugVisuals(enabled);
            },
            'Hide Collision Debug', 'Show Collision Debug'
        );

        // Outlines toggle
        this.setupToggleButton('toggleOutlines', 
            () => this.config.outlinesEnabled, 
            (enabled) => {
                this.config.outlinesEnabled = enabled;
                this.game.toggleOutlines(enabled);
            },
            'Disable HD-2D Outlines', 'Enable HD-2D Outlines'
        );

        // Particles toggle
        this.setupToggleButton('toggleParticles', 
            () => this.config.particlesEnabled, 
            (enabled) => {
                this.config.particlesEnabled = enabled;
                this.game.toggleParticles(enabled);
            },
            'Disable Particles', 'Enable Particles'
        );

        // Fog toggle
        this.setupToggleButton('toggleFog', 
            () => this.config.fogEnabled, 
            (enabled) => {
                this.config.fogEnabled = enabled;
                this.game.toggleFog(enabled);
            },
            'Disable Fog', 'Enable Fog'
        );

        // Dithering toggle
        this.setupToggleButton('toggleDithering', 
            () => this.config.ditheringEnabled, 
            (enabled) => {
                this.config.ditheringEnabled = enabled;
                this.game.toggleDithering(enabled);
            },
            'Disable Dithering', 'Enable Dithering'
        );

        // Time controls
        this.setupTimeControls();
        
        // Inspector button
        document.getElementById('toggleInspector')?.addEventListener('click', () => {
            const scene = this.game.getScene();
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
    }

    private setupToggleButton(
        buttonId: string, 
        getState: () => boolean,
        toggle: (enabled: boolean) => void,
        enabledText: string,
        disabledText: string
    ): void {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (button) {
            button.addEventListener('click', () => {
                const newState = !getState();
                toggle(newState);
                button.textContent = newState ? enabledText : disabledText;
            });
        }
    }

    private setupTimeControls(): void {
        const timeSlider = document.getElementById('timeSlider') as HTMLInputElement;
        const timeDisplay = document.getElementById('timeDisplay');
        
        timeSlider?.addEventListener('input', (e) => {
            const hour = parseFloat((e.target as HTMLInputElement).value);
            this.game.setTimeOfDay(hour);
            if (timeDisplay) {
                timeDisplay.textContent = this.game.getTimeString();
            }
        });
        
        document.getElementById('pauseTime')?.addEventListener('click', () => {
            this.game.pauseTime();
        });
        
        document.getElementById('playTime')?.addEventListener('click', () => {
            this.game.resumeTime();
            this.game.setTimeSpeed(60); // 1 hour per second
        });
        
        document.getElementById('fastTime')?.addEventListener('click', () => {
            this.game.resumeTime();
            this.game.setTimeSpeed(300); // 5 hours per second
        });
    }

    private startStatsUpdate(): void {
        const fpsSpan = document.getElementById('fps');
        const drawCallsSpan = document.getElementById('drawCalls');
        const timeDisplay = document.getElementById('timeDisplay');
        const timeSlider = document.getElementById('timeSlider') as HTMLInputElement;
        
        setInterval(() => {
            if (fpsSpan) {
                fpsSpan.textContent = this.game.getEngine().getFps().toFixed(0);
            }
            if (drawCallsSpan) {
                drawCallsSpan.textContent = this.game.getScene()._drawCalls.toString();
            }
            // Update time display
            if (timeDisplay && this.game.timeOfDaySystem) {
                timeDisplay.textContent = this.game.getTimeString();
                // Update slider position
                if (timeSlider) {
                    timeSlider.value = this.game.timeOfDaySystem.getCurrentHour().toString();
                }
            }
        }, 100);
    }

    public dispose(): void {
        if (this.debugDiv && this.debugDiv.parentNode) {
            this.debugDiv.parentNode.removeChild(this.debugDiv);
        }
    }
}