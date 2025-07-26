import { PostProcessingManager } from './PostProcessingManager';
import { HD2DUISystem } from '../ui/HD2DUISystem';

export interface GameSettings {
    graphics: {
        shadowsEnabled: boolean;
        bloomEnabled: boolean;
        depthOfFieldEnabled: boolean;
        fogEnabled: boolean;
        particlesEnabled: boolean;
        outlinesEnabled: boolean;
        ditheringEnabled: boolean;
        retroEffectEnabled: boolean;
    };
    gameplay: {
        collisionsEnabled: boolean;
        debugVisualsEnabled: boolean;
        interactionDistance: number;
    };
    audio: {
        masterVolume: number;
        sfxVolume: number;
        musicVolume: number;
    };
}

export class GameSettingsManager {
    private settings: GameSettings = {
        graphics: {
            shadowsEnabled: true,
            bloomEnabled: true,
            depthOfFieldEnabled: false,
            fogEnabled: true,
            particlesEnabled: true,
            outlinesEnabled: false,
            ditheringEnabled: true,
            retroEffectEnabled: false
        },
        gameplay: {
            collisionsEnabled: true,
            debugVisualsEnabled: true,
            interactionDistance: 3
        },
        audio: {
            masterVolume: 1.0,
            sfxVolume: 1.0,
            musicVolume: 0.7
        }
    };
    
    private postProcessingManager: PostProcessingManager;
    private uiSystem: HD2DUISystem;
    private callbacks: { [key: string]: ((value: any) => void)[] } = {};
    
    constructor() {
        this.loadSettings();
    }
    
    public initialize(postProcessingManager: PostProcessingManager, uiSystem: HD2DUISystem): void {
        this.postProcessingManager = postProcessingManager;
        this.uiSystem = uiSystem;
        this.applyAllSettings();
    }
    
    private loadSettings(): void {
        const savedSettings = localStorage.getItem('hd2d-game-settings');
        if (savedSettings) {
            try {
                this.settings = JSON.parse(savedSettings);
            } catch (e) {
                console.warn('Failed to load saved settings:', e);
            }
        }
    }
    
    private saveSettings(): void {
        localStorage.setItem('hd2d-game-settings', JSON.stringify(this.settings));
    }
    
    private applyAllSettings(): void {
        // Apply graphics settings
        if (this.postProcessingManager) {
            this.postProcessingManager.toggleShadows(this.settings.graphics.shadowsEnabled);
            this.postProcessingManager.toggleBloom(this.settings.graphics.bloomEnabled);
            this.postProcessingManager.toggleDepthOfField(this.settings.graphics.depthOfFieldEnabled);
            this.postProcessingManager.toggleDithering(this.settings.graphics.ditheringEnabled);
            this.postProcessingManager.retro.enabled = this.settings.graphics.retroEffectEnabled;
        }
        
        // Notify callbacks
        this.notifyCallbacks('graphics.fogEnabled', this.settings.graphics.fogEnabled);
        this.notifyCallbacks('graphics.particlesEnabled', this.settings.graphics.particlesEnabled);
        this.notifyCallbacks('graphics.outlinesEnabled', this.settings.graphics.outlinesEnabled);
        this.notifyCallbacks('gameplay.collisionsEnabled', this.settings.gameplay.collisionsEnabled);
        this.notifyCallbacks('gameplay.debugVisualsEnabled', this.settings.gameplay.debugVisualsEnabled);
    }
    
    // Graphics settings
    public toggleShadows(enabled: boolean): void {
        this.settings.graphics.shadowsEnabled = enabled;
        this.postProcessingManager?.toggleShadows(enabled);
        this.saveSettings();
    }
    
    public toggleBloom(enabled: boolean): void {
        this.settings.graphics.bloomEnabled = enabled;
        this.postProcessingManager?.toggleBloom(enabled);
        this.saveSettings();
    }
    
    public toggleDepthOfField(enabled: boolean): void {
        this.settings.graphics.depthOfFieldEnabled = enabled;
        this.postProcessingManager?.toggleDepthOfField(enabled);
        this.saveSettings();
    }
    
    public toggleDithering(enabled: boolean): void {
        this.settings.graphics.ditheringEnabled = enabled;
        this.postProcessingManager?.toggleDithering(enabled);
        this.saveSettings();
    }
    
    public toggleRetroEffect(enabled: boolean): void {
        this.settings.graphics.retroEffectEnabled = enabled;
        if (this.postProcessingManager) {
            this.postProcessingManager.retro.enabled = enabled;
        }
        this.saveSettings();
    }
    
    public toggleFog(enabled: boolean): void {
        this.settings.graphics.fogEnabled = enabled;
        this.notifyCallbacks('graphics.fogEnabled', enabled);
        this.saveSettings();
    }
    
    public toggleParticles(enabled: boolean): void {
        this.settings.graphics.particlesEnabled = enabled;
        this.notifyCallbacks('graphics.particlesEnabled', enabled);
        this.saveSettings();
    }
    
    public toggleOutlines(enabled: boolean): void {
        this.settings.graphics.outlinesEnabled = enabled;
        this.notifyCallbacks('graphics.outlinesEnabled', enabled);
        this.saveSettings();
    }
    
    // Gameplay settings
    public toggleCollisions(enabled: boolean): void {
        this.settings.gameplay.collisionsEnabled = enabled;
        this.notifyCallbacks('gameplay.collisionsEnabled', enabled);
        this.saveSettings();
    }
    
    public toggleDebugVisuals(enabled: boolean): void {
        this.settings.gameplay.debugVisualsEnabled = enabled;
        this.notifyCallbacks('gameplay.debugVisualsEnabled', enabled);
        this.saveSettings();
    }
    
    // Settings menu
    public showSettingsMenu(onBack: () => void): void {
        const currentDitherState = this.settings.graphics.ditheringEnabled ? "ON" : "OFF";
        const retroState = this.settings.graphics.retroEffectEnabled ? "ON" : "OFF";
        
        this.uiSystem.showMenu("Settings", [
            `Dithering: ${currentDitherState}`,
            `Retro Effect: ${retroState}`,
            "Graphics Settings",
            "Gameplay Settings",
            "Back"
        ], (index) => {
            switch (index) {
                case 0:
                    this.toggleDithering(!this.settings.graphics.ditheringEnabled);
                    this.showSettingsMenu(onBack);
                    break;
                case 1:
                    this.toggleRetroEffect(!this.settings.graphics.retroEffectEnabled);
                    this.showSettingsMenu(onBack);
                    break;
                case 2:
                    this.showGraphicsMenu(() => this.showSettingsMenu(onBack));
                    break;
                case 3:
                    this.showGameplayMenu(() => this.showSettingsMenu(onBack));
                    break;
                case 4:
                    onBack();
                    break;
            }
        });
    }
    
    private showGraphicsMenu(onBack: () => void): void {
        this.uiSystem.showMenu("Graphics Settings", [
            `Shadows: ${this.settings.graphics.shadowsEnabled ? "ON" : "OFF"}`,
            `Bloom: ${this.settings.graphics.bloomEnabled ? "ON" : "OFF"}`,
            `Depth of Field: ${this.settings.graphics.depthOfFieldEnabled ? "ON" : "OFF"}`,
            `Fog: ${this.settings.graphics.fogEnabled ? "ON" : "OFF"}`,
            `Particles: ${this.settings.graphics.particlesEnabled ? "ON" : "OFF"}`,
            `HD-2D Outlines: ${this.settings.graphics.outlinesEnabled ? "ON" : "OFF"}`,
            "Back"
        ], (index) => {
            switch (index) {
                case 0:
                    this.toggleShadows(!this.settings.graphics.shadowsEnabled);
                    this.showGraphicsMenu(onBack);
                    break;
                case 1:
                    this.toggleBloom(!this.settings.graphics.bloomEnabled);
                    this.showGraphicsMenu(onBack);
                    break;
                case 2:
                    this.toggleDepthOfField(!this.settings.graphics.depthOfFieldEnabled);
                    this.showGraphicsMenu(onBack);
                    break;
                case 3:
                    this.toggleFog(!this.settings.graphics.fogEnabled);
                    this.showGraphicsMenu(onBack);
                    break;
                case 4:
                    this.toggleParticles(!this.settings.graphics.particlesEnabled);
                    this.showGraphicsMenu(onBack);
                    break;
                case 5:
                    this.toggleOutlines(!this.settings.graphics.outlinesEnabled);
                    this.showGraphicsMenu(onBack);
                    break;
                case 6:
                    onBack();
                    break;
            }
        });
    }
    
    private showGameplayMenu(onBack: () => void): void {
        this.uiSystem.showMenu("Gameplay Settings", [
            `Collisions: ${this.settings.gameplay.collisionsEnabled ? "ON" : "OFF"}`,
            `Debug Visuals: ${this.settings.gameplay.debugVisualsEnabled ? "ON" : "OFF"}`,
            "Back"
        ], (index) => {
            switch (index) {
                case 0:
                    this.toggleCollisions(!this.settings.gameplay.collisionsEnabled);
                    this.showGameplayMenu(onBack);
                    break;
                case 1:
                    this.toggleDebugVisuals(!this.settings.gameplay.debugVisualsEnabled);
                    this.showGameplayMenu(onBack);
                    break;
                case 2:
                    onBack();
                    break;
            }
        });
    }
    
    // Callback system for settings changes
    public onSettingChange(setting: string, callback: (value: any) => void): void {
        if (!this.callbacks[setting]) {
            this.callbacks[setting] = [];
        }
        this.callbacks[setting].push(callback);
    }
    
    private notifyCallbacks(setting: string, value: any): void {
        if (this.callbacks[setting]) {
            this.callbacks[setting].forEach(cb => cb(value));
        }
    }
    
    public getSettings(): GameSettings {
        return JSON.parse(JSON.stringify(this.settings));
    }
}