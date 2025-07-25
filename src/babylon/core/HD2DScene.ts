import * as BABYLON from '@babylonjs/core';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { DepthOfFieldEffect } from '@babylonjs/core/PostProcesses/depthOfFieldEffect';

export abstract class HD2DScene extends BABYLON.Scene {
  protected mainCamera!: BABYLON.UniversalCamera;
  protected uiCamera!: BABYLON.UniversalCamera;
  protected pipeline!: DefaultRenderingPipeline;
  protected lights: BABYLON.Light[] = [];
  
  // HD-2D specific settings
  protected readonly CAMERA_ANGLE = 25; // degrees from vertical
  protected readonly CAMERA_HEIGHT = 15;
  protected readonly CAMERA_DISTANCE = 20;
  protected readonly PIXELS_PER_UNIT = 32; // For pixel-perfect positioning
  
  constructor(engine: BABYLON.Engine) {
    super(engine);
    this.setupHD2D();
  }
  
  protected setupHD2D(): void {
    // Clear color
    this.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
    
    // Setup cameras
    this.setupCameras();
    
    // Setup lighting
    this.setupLighting();
    
    // Setup post-processing
    this.setupPostProcessing();
    
    // Setup render groups for layering
    this.setupRenderGroups();
    
    // Optimization for pixel art
    this.getEngine().setHardwareScalingLevel(1);
  }
  
  protected setupCameras(): void {
    // Main game camera with HD-2D angle
    this.mainCamera = new BABYLON.UniversalCamera(
      'mainCamera',
      new BABYLON.Vector3(0, this.CAMERA_HEIGHT, -this.CAMERA_DISTANCE),
      this
    );
    
    // Look at world center
    this.mainCamera.setTarget(BABYLON.Vector3.Zero());
    
    // Set up camera for HD-2D perspective
    this.mainCamera.fov = 0.8; // ~45 degrees
    this.mainCamera.minZ = 0.1;
    this.mainCamera.maxZ = 100;
    
    // UI Camera (orthographic)
    this.uiCamera = new BABYLON.UniversalCamera(
      'uiCamera',
      new BABYLON.Vector3(0, 0, -10),
      this
    );
    this.uiCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    const aspect = this.getEngine().getAspectRatio(this.uiCamera);
    this.uiCamera.orthoLeft = -10 * aspect;
    this.uiCamera.orthoRight = 10 * aspect;
    this.uiCamera.orthoTop = 10;
    this.uiCamera.orthoBottom = -10;
    
    // Set main camera as active
    this.activeCamera = this.mainCamera;
  }
  
  protected setupLighting(): void {
    // Main directional light (sun)
    const sunLight = new BABYLON.DirectionalLight(
      'sunLight',
      new BABYLON.Vector3(-0.5, -1, -0.5),
      this
    );
    sunLight.intensity = 1.2;
    sunLight.shadowEnabled = true;
    
    // Setup shadow generator
    const shadowGenerator = new BABYLON.ShadowGenerator(2048, sunLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 2;
    shadowGenerator.setDarkness(0.2);
    
    // Ambient light for visibility
    const ambientLight = new BABYLON.HemisphericLight(
      'ambientLight',
      new BABYLON.Vector3(0, 1, 0),
      this
    );
    ambientLight.intensity = 0.4;
    ambientLight.diffuse = new BABYLON.Color3(0.8, 0.85, 1);
    ambientLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    
    this.lights.push(sunLight, ambientLight);
  }
  
  protected setupPostProcessing(): void {
    // Create default pipeline
    this.pipeline = new DefaultRenderingPipeline(
      'hd2dPipeline',
      true, // HDR
      this,
      [this.mainCamera]
    );
    
    // Depth of Field - CRITICAL for HD-2D look
    this.pipeline.depthOfFieldEnabled = true;
    this.pipeline.depthOfField.focusDistance = 20000; // Focus on play area
    this.pipeline.depthOfField.focalLength = 150;
    this.pipeline.depthOfField.fStop = 1.4;
    this.pipeline.depthOfField.lensSize = 50;
    
    // Bloom for magical effects
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 0.8;
    this.pipeline.bloomWeight = 0.3;
    this.pipeline.bloomKernel = 64;
    this.pipeline.bloomScale = 0.5;
    
    // Color grading for enhanced visuals
    this.pipeline.imageProcessingEnabled = true;
    this.pipeline.imageProcessing.contrast = 1.3;
    this.pipeline.imageProcessing.exposure = 1.1;
    this.pipeline.imageProcessing.toneMappingEnabled = true;
    this.pipeline.imageProcessing.vignetteEnabled = true;
    this.pipeline.imageProcessing.vignetteWeight = 0.3;
    
    // Chromatic aberration for subtle effect
    this.pipeline.chromaticAberrationEnabled = true;
    this.pipeline.chromaticAberration.aberrationAmount = 3;
    
    // FXAA for smooth edges without blur
    this.pipeline.fxaaEnabled = true;
  }
  
  protected setupRenderGroups(): void {
    // Render groups for proper layering
    // 0: Background elements
    // 1: Environment (3D)
    // 2: Characters/Sprites
    // 3: Effects
    // 4: UI
    
    this.setRenderingAutoClearDepthStencil(1, false);
    this.setRenderingAutoClearDepthStencil(2, false);
    this.setRenderingAutoClearDepthStencil(3, false);
  }
  
  // Helper method to convert world position to pixel-perfect position
  public snapToPixel(position: BABYLON.Vector3): BABYLON.Vector3 {
    return new BABYLON.Vector3(
      Math.round(position.x * this.PIXELS_PER_UNIT) / this.PIXELS_PER_UNIT,
      Math.round(position.y * this.PIXELS_PER_UNIT) / this.PIXELS_PER_UNIT,
      Math.round(position.z * this.PIXELS_PER_UNIT) / this.PIXELS_PER_UNIT
    );
  }
  
  // Abstract methods for derived scenes
  abstract initialize(data?: any): Promise<void>;
  abstract update(deltaTime: number): void;
  
  // Lifecycle
  public setupUpdateLoop(): void {
    let lastTime = Date.now();
    
    // Use the Scene's registerBeforeRender (from parent class)
    super.registerBeforeRender(() => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      this.update(deltaTime);
    });
  }
}