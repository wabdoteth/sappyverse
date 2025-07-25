import { Scene } from '@babylonjs/core/scene';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';

interface TimeOfDayConfig {
    hour: number;
    sunDirection: Vector3;
    sunIntensity: number;
    sunColor: Color3;
    ambientIntensity: number;
    ambientColor: Color3;
    ambientGroundColor: Color3;
    fogDensity: number;
    fogColor: Color3;
    skyColor: Color3;
}

export class TimeOfDaySystem {
    private scene: Scene;
    private sunLight: DirectionalLight;
    private ambientLight: HemisphericLight;
    private pipeline: DefaultRenderingPipeline;
    
    private currentHour: number = 12;
    private timeSpeed: number = 1; // Hours per real second
    private isPaused: boolean = false;
    
    // Time configurations
    private timeConfigs: TimeOfDayConfig[] = [
        // Dawn (6 AM)
        {
            hour: 6,
            sunDirection: new Vector3(-1, -0.2, 0.5).normalize(),
            sunIntensity: 0.4,
            sunColor: new Color3(1, 0.7, 0.5),
            ambientIntensity: 0.3,
            ambientColor: new Color3(0.6, 0.5, 0.7),
            ambientGroundColor: new Color3(0.3, 0.3, 0.4),
            fogDensity: 0.008,
            fogColor: new Color3(0.7, 0.6, 0.8),
            skyColor: new Color3(0.7, 0.5, 0.6)
        },
        // Morning (9 AM)
        {
            hour: 9,
            sunDirection: new Vector3(-0.7, -0.5, 0.5).normalize(),
            sunIntensity: 0.8,
            sunColor: new Color3(1, 0.9, 0.7),
            ambientIntensity: 0.6,
            ambientColor: new Color3(0.8, 0.8, 0.9),
            ambientGroundColor: new Color3(0.5, 0.5, 0.6),
            fogDensity: 0.004,
            fogColor: new Color3(0.8, 0.8, 0.9),
            skyColor: new Color3(0.6, 0.7, 0.9)
        },
        // Noon (12 PM)
        {
            hour: 12,
            sunDirection: new Vector3(-0.2, -1, 0.3).normalize(),
            sunIntensity: 1.2,
            sunColor: new Color3(1, 0.95, 0.85),
            ambientIntensity: 0.8,
            ambientColor: new Color3(0.9, 0.9, 1),
            ambientGroundColor: new Color3(0.5, 0.5, 0.6),
            fogDensity: 0.002,
            fogColor: new Color3(0.9, 0.9, 1),
            skyColor: new Color3(0.5, 0.7, 0.9)
        },
        // Afternoon (3 PM)
        {
            hour: 15,
            sunDirection: new Vector3(0.5, -0.7, 0.5).normalize(),
            sunIntensity: 1.0,
            sunColor: new Color3(1, 0.9, 0.8),
            ambientIntensity: 0.7,
            ambientColor: new Color3(0.9, 0.85, 0.8),
            ambientGroundColor: new Color3(0.6, 0.5, 0.5),
            fogDensity: 0.003,
            fogColor: new Color3(0.9, 0.85, 0.8),
            skyColor: new Color3(0.6, 0.7, 0.8)
        },
        // Sunset (6 PM)
        {
            hour: 18,
            sunDirection: new Vector3(1, -0.3, 0.5).normalize(),
            sunIntensity: 0.6,
            sunColor: new Color3(1, 0.6, 0.3),
            ambientIntensity: 0.4,
            ambientColor: new Color3(0.8, 0.5, 0.4),
            ambientGroundColor: new Color3(0.4, 0.3, 0.3),
            fogDensity: 0.006,
            fogColor: new Color3(0.8, 0.5, 0.4),
            skyColor: new Color3(0.8, 0.4, 0.3)
        },
        // Night (9 PM)
        {
            hour: 21,
            sunDirection: new Vector3(0, -1, 0).normalize(),
            sunIntensity: 0.1,
            sunColor: new Color3(0.3, 0.3, 0.5),
            ambientIntensity: 0.2,
            ambientColor: new Color3(0.2, 0.2, 0.4),
            ambientGroundColor: new Color3(0.1, 0.1, 0.2),
            fogDensity: 0.005,
            fogColor: new Color3(0.1, 0.1, 0.2),
            skyColor: new Color3(0.1, 0.1, 0.2)
        },
        // Midnight (12 AM)
        {
            hour: 0,
            sunDirection: new Vector3(0, -1, 0).normalize(),
            sunIntensity: 0.05,
            sunColor: new Color3(0.2, 0.2, 0.4),
            ambientIntensity: 0.15,
            ambientColor: new Color3(0.1, 0.1, 0.3),
            ambientGroundColor: new Color3(0.05, 0.05, 0.15),
            fogDensity: 0.008,
            fogColor: new Color3(0.05, 0.05, 0.15),
            skyColor: new Color3(0.05, 0.05, 0.15)
        }
    ];
    
    constructor(scene: Scene, sunLight: DirectionalLight, ambientLight: HemisphericLight, pipeline?: DefaultRenderingPipeline) {
        this.scene = scene;
        this.sunLight = sunLight;
        this.ambientLight = ambientLight;
        this.pipeline = pipeline!;
        
        // Start update loop
        scene.registerBeforeRender(() => {
            if (!this.isPaused) {
                this.update(scene.getEngine().getDeltaTime() / 1000);
            }
        });
    }
    
    public setHour(hour: number): void {
        this.currentHour = hour % 24;
        this.applyTimeOfDay(this.currentHour);
    }
    
    public setTimeSpeed(speed: number): void {
        this.timeSpeed = speed;
    }
    
    public pause(): void {
        this.isPaused = true;
    }
    
    public resume(): void {
        this.isPaused = false;
    }
    
    private update(deltaTime: number): void {
        // Advance time
        this.currentHour += this.timeSpeed * deltaTime / 3600; // Convert to hours
        if (this.currentHour >= 24) {
            this.currentHour -= 24;
        }
        
        this.applyTimeOfDay(this.currentHour);
    }
    
    private applyTimeOfDay(hour: number): void {
        // Find surrounding time configs for interpolation
        let beforeConfig: TimeOfDayConfig | null = null;
        let afterConfig: TimeOfDayConfig | null = null;
        
        for (let i = 0; i < this.timeConfigs.length; i++) {
            const config = this.timeConfigs[i];
            if (config.hour <= hour) {
                beforeConfig = config;
            }
            if (config.hour > hour && !afterConfig) {
                afterConfig = config;
                break;
            }
        }
        
        // Handle wraparound
        if (!afterConfig) {
            afterConfig = this.timeConfigs[0];
        }
        if (!beforeConfig) {
            beforeConfig = this.timeConfigs[this.timeConfigs.length - 1];
        }
        
        // Calculate interpolation factor
        let timeDiff = afterConfig.hour - beforeConfig.hour;
        if (timeDiff < 0) timeDiff += 24;
        
        let currentDiff = hour - beforeConfig.hour;
        if (currentDiff < 0) currentDiff += 24;
        
        const t = timeDiff > 0 ? currentDiff / timeDiff : 0;
        
        // Interpolate all values
        this.sunLight.direction = Vector3.Lerp(beforeConfig.sunDirection, afterConfig.sunDirection, t);
        this.sunLight.intensity = this.lerp(beforeConfig.sunIntensity, afterConfig.sunIntensity, t);
        this.sunLight.diffuse = Color3.Lerp(beforeConfig.sunColor, afterConfig.sunColor, t);
        
        this.ambientLight.intensity = this.lerp(beforeConfig.ambientIntensity, afterConfig.ambientIntensity, t);
        this.ambientLight.diffuse = Color3.Lerp(beforeConfig.ambientColor, afterConfig.ambientColor, t);
        this.ambientLight.groundColor = Color3.Lerp(beforeConfig.ambientGroundColor, afterConfig.ambientGroundColor, t);
        
        // Update scene fog only if fog is enabled
        if (this.scene.fogEnabled !== false) { // Check if fog hasn't been explicitly disabled
            this.scene.fogMode = 1; // FOGMODE_EXP
            this.scene.fogDensity = this.lerp(beforeConfig.fogDensity, afterConfig.fogDensity, t);
            this.scene.fogColor = Color3.Lerp(beforeConfig.fogColor, afterConfig.fogColor, t);
        }
        
        // Update sky color
        const skyColor = Color3.Lerp(beforeConfig.skyColor, afterConfig.skyColor, t);
        this.scene.clearColor = skyColor.toColor4(1);
        
        // Update shadow darkness based on sun intensity
        if (this.scene.shadowGenerators && this.scene.shadowGenerators.length > 0) {
            const shadowDarkness = 0.3 + (0.3 * this.sunLight.intensity);
            this.scene.shadowGenerators[0].darkness = shadowDarkness;
        }
        
        // Update post-processing based on time
        if (this.pipeline) {
            // Adjust exposure for day/night
            this.pipeline.imageProcessing.exposure = 0.8 + (0.5 * this.sunLight.intensity);
            
            // Warmer colors during sunrise/sunset
            const warmth = hour >= 5 && hour <= 7 || hour >= 17 && hour <= 19 ? 0.2 : 0;
            this.pipeline.imageProcessing.colorCurves.globalSaturation = 1 + warmth;
        }
    }
    
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    
    public getCurrentHour(): number {
        return this.currentHour;
    }
    
    public getTimeString(): string {
        const hours = Math.floor(this.currentHour);
        const minutes = Math.floor((this.currentHour - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
}