import { Scene } from '@babylonjs/core/scene';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { DepthOfFieldEffectBlurLevel } from '@babylonjs/core/PostProcesses/depthOfFieldEffect';
import { TiltShiftPostProcess } from '../postprocess/TiltShiftPostProcess';
import { RetroPostProcess } from '../postprocess/RetroPostProcess';
import { PassPostProcess } from '@babylonjs/core/PostProcesses/passPostProcess';
import { FxaaPostProcess } from '@babylonjs/core/PostProcesses/fxaaPostProcess';

export class PostProcessingManager {
    private scene: Scene;
    private camera: Camera;
    
    // Post-processing effects
    private pixelPerfectPostProcess: PostProcess;
    private pipeline: DefaultRenderingPipeline;
    private tiltShiftPostProcess: TiltShiftPostProcess;
    private retroPostProcess: RetroPostProcess;
    
    constructor(scene: Scene, camera: Camera) {
        this.scene = scene;
        this.camera = camera;
        this.setupPostProcessing();
    }
    
    private setupPostProcessing(): void {
        // Pixel-perfect rendering pass
        this.pixelPerfectPostProcess = new PassPostProcess('pixelPerfect', 1.0, this.camera);
        this.pixelPerfectPostProcess.samples = 1;
        
        // Default rendering pipeline for advanced effects
        this.pipeline = new DefaultRenderingPipeline(
            'defaultPipeline',
            true,  // HDR
            this.scene,
            [this.camera]
        );
        
        // Configure pipeline
        this.pipeline.samples = 4;
        this.pipeline.fxaaEnabled = true;
        
        // Bloom configuration
        this.pipeline.bloomEnabled = true;
        this.pipeline.bloomThreshold = 0.8;
        this.pipeline.bloomWeight = 0.3;
        this.pipeline.bloomKernel = 32;
        this.pipeline.bloomScale = 0.5;
        
        // Depth of Field (disabled by default)
        this.pipeline.depthOfFieldEnabled = false;
        this.pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Medium;
        this.pipeline.depthOfField.focusDistance = 1000;
        this.pipeline.depthOfField.focalLength = 50;
        this.pipeline.depthOfField.fStop = 1.4;
        
        // Image processing
        this.pipeline.imageProcessingEnabled = true;
        this.pipeline.imageProcessing.contrast = 1.2;
        this.pipeline.imageProcessing.exposure = 1.0;
        this.pipeline.imageProcessing.toneMappingEnabled = true;
        
        // Tilt-shift effect
        this.tiltShiftPostProcess = new TiltShiftPostProcess('tiltShift', this.camera);
        this.tiltShiftPostProcess.setFocusArea(0.35, 0.65); // Focus on center 30% of screen
        
        // Retro effect (disabled by default)
        this.retroPostProcess = new RetroPostProcess('retro', this.camera);
        this.retroPostProcess.enabled = false;
    }
    
    // Getters for direct access
    public get defaultPipeline(): DefaultRenderingPipeline {
        return this.pipeline;
    }
    
    public get retro(): RetroPostProcess {
        return this.retroPostProcess;
    }
    
    public get tiltShift(): TiltShiftPostProcess {
        return this.tiltShiftPostProcess;
    }
    
    // Control methods
    public toggleShadows(enabled: boolean): void {
        this.pipeline.imageProcessingEnabled = enabled;
        console.log(`Shadows: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    public toggleDepthOfField(enabled: boolean): void {
        this.pipeline.depthOfFieldEnabled = enabled;
        console.log(`Depth of Field: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    public toggleBloom(enabled: boolean): void {
        this.pipeline.bloomEnabled = enabled;
        console.log(`Bloom: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    public toggleDithering(enabled: boolean): void {
        if (this.retroPostProcess) {
            this.retroPostProcess.setDitherStrength(enabled ? 0.1 : 0);
            console.log(`Dithering: ${enabled ? 'ON' : 'OFF'}`);
        }
    }
    
    public setBloomIntensity(weight: number): void {
        this.pipeline.bloomWeight = weight;
    }
    
    public setDepthOfFieldFocus(distance: number): void {
        if (this.pipeline.depthOfField) {
            this.pipeline.depthOfField.focusDistance = distance;
        }
    }
    
    public dispose(): void {
        this.pixelPerfectPostProcess?.dispose();
        this.pipeline?.dispose();
        this.tiltShiftPostProcess?.dispose();
        this.retroPostProcess?.dispose();
    }
}