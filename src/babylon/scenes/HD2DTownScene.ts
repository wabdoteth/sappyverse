// HD-2D Town Scene Implementation
import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF'; // Import GLB loader
import { HD2DAnimatedSprite } from '../HD2DAnimatedSprite';
import { HD2DSprite } from '../HD2DSprite';
import { AnimatedWaterMaterial } from '../materials/AnimatedWaterMaterial';
import { FountainWaterFlow } from '../effects/FountainWaterFlow';
import { ModelLoader, Props3D } from '../loaders/ModelLoader';
import { MeshColliderDecomposer } from '../utils/MeshColliderDecomposer';
import { ModelRegistry } from '../systems/ModelRegistry';
import { ModelPositioning } from '../utils/ModelPositioning';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { SimpleCollisionVisualizer } from '../systems/SimpleCollisionVisualizer';

export class HD2DTownScene {
    private scene: Scene;
    private player: HD2DAnimatedSprite;
    private npcs: HD2DSprite[] = [];
    private collisionMeshes: Mesh[] = [];
    private fountainWaterFlow: FountainWaterFlow;
    private createDebugVisualizations: boolean = true; // Debug visualizations on by default
    private collisionVisualizer: SimpleCollisionVisualizer;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.collisionVisualizer = new SimpleCollisionVisualizer(scene);
    }
    
    public async build(): Promise<void> {
        // Create skybox first
        this.createSkybox();
        
        // Register models first
        await this.registerModels();
        
        // Create environment
        this.createGround();
        this.createTownSquare();
        await this.createBuildings();
        this.createTrees();
        this.createFountain();
        this.createLampPosts();
        
        // Create characters
        await this.createPlayer();
        await this.createNPCs();
        
        // Create 3D props
        await this.create3DProps();
        
        // Set up collision boxes
        this.setupCollisions();
        
        // Create fountain water flow after sprites
        // Position between upper bowl and peak for better arc
        this.fountainWaterFlow = new FountainWaterFlow(this.scene, new Vector3(0, 1.9, 0));
    }
    
    private createSkybox(): void {
        // Create skybox sphere for proper spherical mapping
        const skybox = CreateSphere('skyBox', { 
            diameter: 1000,
            segments: 32
        }, this.scene);
        
        // Create skybox material
        const skyboxMaterial = new StandardMaterial('skyBoxMat', this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        
        // Load the skybox texture
        const skyTexture = new Texture('/assets/skyboxes/sky_31_2k.png', this.scene);
        skyTexture.coordinatesMode = Texture.SPHERICAL_MODE;
        skyTexture.vScale = -1; // Flip texture vertically to correct orientation
        
        // Apply texture as emissive for self-illumination
        skyboxMaterial.emissiveTexture = skyTexture;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        
        // Apply to skybox
        skybox.material = skyboxMaterial;
        skybox.position.y = -200; // Lower the skybox to bring details into view
        skybox.infiniteDistance = true;
        skybox.renderingGroupId = 0; // Render before everything else
        skybox.isPickable = false;
    }
    
    private createGround(): void {
        const ground = CreateGround('ground', {
            width: 40,
            height: 40,
            subdivisions: 4
        }, this.scene);
        
        // Create pixel art grass texture
        const grassTexture = this.createPixelGrassTexture();
        
        const groundMat = new PBRMaterial('groundMat', this.scene);
        groundMat.albedoTexture = grassTexture;
        groundMat.roughness = 1.0;
        groundMat.metallic = 0;
        groundMat.specularIntensity = 0;
        
        ground.material = groundMat;
        ground.receiveShadows = true;
        ground.renderingGroupId = 0; // Ground layer
    }
    
    private createTownSquare(): void {
        const townSquare = CreateGround('townSquare', {
            width: 15,
            height: 15,
            subdivisions: 2
        }, this.scene);
        
        townSquare.position.y = 0.01;
        
        const squareMat = new PBRMaterial('squareMat', this.scene);
        
        // Load 1b texture
        const texture1b = new Texture('/assets/textures/1b.png', this.scene);
        texture1b.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
        
        // Configure texture repeating for smooth tiling
        texture1b.wrapU = Texture.WRAP_ADDRESSMODE;
        texture1b.wrapV = Texture.WRAP_ADDRESSMODE;
        texture1b.uScale = 14; // Middle ground for texture size
        texture1b.vScale = 14; // Middle ground for texture size
        
        squareMat.albedoTexture = texture1b;
        squareMat.roughness = 0.8;
        squareMat.metallic = 0;
        
        townSquare.material = squareMat;
        townSquare.receiveShadows = true;
        townSquare.renderingGroupId = 0;
    }
    
    private async createBuildings(): Promise<void> {
        // Building positions and sizes from original
        const buildings = [
            { name: 'inn', pos: new Vector3(0, 0, 15), size: { w: 6, h: 6, d: 5 }, color: new Color3(0.7, 0.6, 0.5) },
            { name: 'house1', pos: new Vector3(-8, 0, -5), size: { w: 3, h: 4, d: 3 }, color: new Color3(0.6, 0.5, 0.4) }
        ];
        
        // Create procedural buildings
        buildings.forEach(buildingData => {
            this.createBuildingWithRoof(buildingData);
        });
    }
    
    private createBuildingWithRoof(data: any): void {
        // Building base
        const building = CreateBox(data.name, {
            width: data.size.w,
            height: data.size.h,
            depth: data.size.d
        }, this.scene);
        
        building.position = data.pos.clone();
        building.position.y = data.size.h / 2;
        
        const mat = new PBRMaterial(`${data.name}Mat`, this.scene);
        mat.albedoColor = data.color;
        mat.roughness = 0.9;
        mat.metallic = 0;
        
        // HD-2D rim lighting effect
        mat.emissiveColor = data.color.scale(0.1);
        mat.emissiveFresnelParameters = {
            bias: 0.6,
            power: 4,
            leftColor: Color3.Black(),
            rightColor: data.color.scale(0.3)
        };
        mat.opacityFresnelParameters = {
            bias: 0.5,
            power: 4,
            leftColor: Color3.White(),
            rightColor: Color3.Black()
        };
        
        building.material = mat;
        building.receiveShadows = true;
        building.renderingGroupId = 1; // Environment layer
        
        // Roof
        const roof = CreateCylinder(`${data.name}Roof`, {
            diameterTop: 0,
            diameterBottom: Math.max(data.size.w, data.size.d) * 1.4,
            height: 2.5,
            tessellation: 4
        }, this.scene);
        
        roof.position = data.pos.clone();
        roof.position.y = data.size.h + 1.25;
        roof.rotation.y = Math.PI / 4;
        
        const roofMat = new PBRMaterial(`${data.name}RoofMat`, this.scene);
        roofMat.albedoColor = new Color3(0.8, 0.3, 0.2);
        roofMat.roughness = 0.95;
        roofMat.metallic = 0;
        
        roof.material = roofMat;
        roof.receiveShadows = true;
        roof.renderingGroupId = 1;
        
        // Add collision mesh for building
        const buildingCollision = CreateBox(`${data.name}_collision`, {
            width: data.size.w,
            height: data.size.h,
            depth: data.size.d
        }, this.scene);
        
        buildingCollision.position = data.pos.clone();
        buildingCollision.position.y = data.size.h / 2;
        buildingCollision.isVisible = false; // Always invisible, visualization system handles display
        buildingCollision.checkCollisions = true;
        buildingCollision.isPickable = false;
        
        this.collisionMeshes.push(buildingCollision);
    }
    
    // Deprecated: Use ColliderVisualizationSystem instead
    /*
    private createDebugBox(position: Vector3, size: Vector3, color: Color3): void {
        console.log('Creating debug box:', {
            position: `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`,
            size: `(${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`,
            color: color.toString()
        });
        
        const debugBox = CreateBox('debugColliderBox', {
            width: size.x,
            height: size.y,
            depth: size.z
        }, this.scene);
        
        debugBox.position = position;
        
        const debugMat = new StandardMaterial('debugBoxMat', this.scene);
        debugMat.wireframe = true;
        debugMat.emissiveColor = color;
        debugMat.disableLighting = true;
        debugMat.alpha = 0.5;
        
        debugBox.material = debugMat;
        debugBox.isPickable = false;
        debugBox.renderingGroupId = 2;
    }
    */
    
    // Deprecated: Use ColliderVisualizationSystem instead
    /*
    private createDebugCylinder(position: Vector3, radius: number, height: number, color: Color3): void {
        console.log('Creating debug cylinder:', {
            position: `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`,
            radius: radius.toFixed(2),
            height: height.toFixed(2),
            color: color.toString()
        });
        
        const debugCylinder = CreateCylinder('debugColliderCylinder', {
            diameter: radius * 2,
            height: height,
            tessellation: 16
        }, this.scene);
        
        debugCylinder.position = position;
        
        const debugMat = new StandardMaterial('debugCylinderMat', this.scene);
        debugMat.wireframe = true;
        debugMat.emissiveColor = color;
        debugMat.disableLighting = true;
        debugMat.alpha = 0.5;
        
        debugCylinder.material = debugMat;
        debugCylinder.isPickable = false;
        debugCylinder.renderingGroupId = 2;
    }
    */
    
    // Deprecated: Use ColliderVisualizationSystem instead
    /*
    private createDebugRamp(position: Vector3, size: Vector3, rotation: Vector3, color: Color3): void {
        console.log('Creating debug ramp:', {
            position: `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`,
            size: `(${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`,
            rotation: `(${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}, ${rotation.z.toFixed(2)})`,
            color: color.toString()
        });
        
        const debugRamp = CreateBox('debugColliderRamp', {
            width: size.x,
            height: size.y,
            depth: size.z
        }, this.scene);
        
        debugRamp.position = position;
        debugRamp.rotation = rotation;
        
        const debugMat = new StandardMaterial('debugRampMat', this.scene);
        debugMat.wireframe = true;
        debugMat.emissiveColor = color;
        debugMat.disableLighting = true;
        debugMat.alpha = 0.5;
        
        debugRamp.material = debugMat;
        debugRamp.isPickable = false;
        debugRamp.renderingGroupId = 2;
    }
    
    private createDebugFloor(position: Vector3, size: Vector3, height: number, color: Color3): void {
        console.log('Creating debug floor:', {
            position: `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`,
            size: `(${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`,
            height: height.toFixed(2),
            color: color.toString()
        });
        
        const debugFloor = CreateBox('debugColliderFloor', {
            width: size.x,
            height: size.y,
            depth: size.z
        }, this.scene);
        
        // Position the debug floor at the actual floor height
        debugFloor.position = position.clone();
        debugFloor.position.y = height;
        
        const debugMat = new StandardMaterial('debugFloorMat', this.scene);
        debugMat.wireframe = true;
        debugMat.emissiveColor = color;
        debugMat.disableLighting = true;
        debugMat.alpha = 0.5;
        
        debugFloor.material = debugMat;
        debugFloor.isPickable = false;
        debugFloor.renderingGroupId = 2;
    }
    */
    
    
    
    private createTrees(): void {
        const treePositions = [
            new Vector3(-15, 0, 10), new Vector3(15, 0, 10),
            new Vector3(-15, 0, -10), new Vector3(15, 0, -10),
            new Vector3(-10, 0, 15), new Vector3(10, 0, 15),
            new Vector3(-18, 0, 0), new Vector3(18, 0, 0)
        ];
        
        treePositions.forEach((pos, i) => {
            // Trunk
            const trunk = CreateCylinder(`tree${i}Trunk`, {
                diameter: 0.8,
                height: 3,
                tessellation: 6
            }, this.scene);
            
            trunk.position = pos.clone();
            trunk.position.y = 1.5;
            
            const trunkMat = new PBRMaterial(`tree${i}TrunkMat`, this.scene);
            trunkMat.albedoColor = new Color3(0.4, 0.3, 0.2);
            trunkMat.roughness = 1.0;
            trunkMat.metallic = 0;
            
            // Subtle rim light
            trunkMat.emissiveFresnelParameters = {
                bias: 0.8,
                power: 3,
                leftColor: Color3.Black(),
                rightColor: new Color3(0.2, 0.15, 0.1)
            };
            
            trunk.material = trunkMat;
            trunk.receiveShadows = true;
            trunk.renderingGroupId = 1;
            
            // Leaves
            const leaves = CreateSphere(`tree${i}Leaves`, {
                diameter: 3,
                segments: 8
            }, this.scene);
            
            leaves.position = pos.clone();
            leaves.position.y = 3.5;
            
            const leavesMat = new PBRMaterial(`tree${i}LeavesMat`, this.scene);
            leavesMat.albedoColor = new Color3(0.2, 0.6, 0.2);
            leavesMat.roughness = 1.0;
            leavesMat.metallic = 0;
            
            leaves.material = leavesMat;
            leaves.receiveShadows = true;
            leaves.renderingGroupId = 1;
        });
    }
    
    private createFountain(): void {
        // Fountain will be loaded as a 3D model in create3DProps
        const fountainPos = new Vector3(0, 0, 0);
        
        // Create water for the fountain bowl
        const water = CreateCylinder('fountainWater', {
            diameter: 3,     // Final diameter adjustment
            height: 0.1,    // Thinner water surface
            tessellation: 32  // Higher tessellation for wave animation
        }, this.scene);
        
        water.position = fountainPos.clone();
        water.position.y = 0.8;  // Higher up to be in the bowl
        
        // Use animated water material (includes caustics in shader)
        const waterMat = new AnimatedWaterMaterial('fountainWaterMat', this.scene);
        waterMat.setWaterColors(
            new Color3(0.4, 0.7, 0.95),  // Lighter shallow color
            new Color3(0.1, 0.3, 0.6)    // Deeper blue color
        );
        waterMat.setTransparency(0.7);
        waterMat.setReflectivity(0.6);
        
        water.material = waterMat;
        water.receiveShadows = true;
        water.renderingGroupId = 1;
        
        // Create second water surface for upper bowl
        const upperWater = CreateCylinder('fountainUpperWater', {
            diameter: 1.1,   // Smaller diameter for upper bowl
            height: 0.1,     // Same thin water surface
            tessellation: 32
        }, this.scene);
        
        upperWater.position = fountainPos.clone();
        upperWater.position.y = 1.75;  // Slightly lower to compensate for wave height
        
        // Use the same water material (waves are consistent)
        upperWater.material = waterMat;
        upperWater.receiveShadows = true;
        upperWater.renderingGroupId = 1;
        
        // Water flow will be added after sprites are created
    }
    
    private createLampPosts(): void {
        const positions = [
            new Vector3(-5, 0, 0),
            new Vector3(5, 0, 0)
        ];
        
        positions.forEach((pos, i) => {
            // Create lamppost sprite
            const lamppost = new HD2DSprite(`lamppost${i}`, this.scene, {
                width: 1,     // Width of 1
                height: 4,    // Taller for lamppost
                frameWidth: 64,
                frameHeight: 128
            });
            
            // Load lamppost sprite
            lamppost.loadSpriteSheet('/assets/sprites/environment/lamppost.png');
            
            // Position lamppost (height adjusted so bottom touches ground)
            lamppost.setPosition(new Vector3(pos.x, 2, pos.z));
            
            // Point light at top for lamp glow
            const lampGlow = new PointLight(`lamp${i}Glow`, 
                new Vector3(pos.x, 3.5, pos.z), this.scene);
            lampGlow.diffuse = new Color3(1, 0.9, 0.7);
            lampGlow.specular = new Color3(1, 0.8, 0.5);
            lampGlow.intensity = 0.8;
            lampGlow.range = 10;
            
            // Add small collision cylinder for the lamppost base
            const lampCollision = CreateCylinder(`lamppost_collision_${i}`, {
                diameter: 0.4,
                height: 1
            }, this.scene);
            
            lampCollision.position = new Vector3(pos.x, 0.5, pos.z);
            lampCollision.isVisible = false; // Always invisible, visualization system handles display
            lampCollision.checkCollisions = true;
            lampCollision.isPickable = false;
            
            this.collisionMeshes.push(lampCollision);
        });
    }
    
    private async createPlayer(): Promise<void> {
        this.player = new HD2DAnimatedSprite('player', this.scene, {
            width: 3,  // Proper scale
            height: 3, // Proper scale
            frameWidth: 96,
            frameHeight: 80
        });
        
        // Load player animations with default idle sprite
        await this.player.loadSpriteSheet('/assets/sprites/player/IDLE/idle_down.png');
        this.player.loadCharacterAnimations('/assets/sprites/player');
        
        // Start with idle animation
        this.player.setMoving(false, 'down');
        
        // Set initial position
        // Character is small within the frame, adjust Y to align with ground
        // Since character occupies bottom ~40% of frame, position accordingly
        this.player.setPosition(new Vector3(0, 0.6, -5)); // Lower to align feet with ground
        
        // Enable outline - disabled due to shader issues
        // this.player.enableOutline(new Color3(0, 0, 0), 2);
    }
    
    private async createNPCs(): Promise<void> {
        const npcData = [
            { name: 'merchant', sprite: 'OT2_202209_PUB01_DOT008.png', pos: new Vector3(8.5, 0, 5) },
            { name: 'innkeeper', sprite: 'OT2_202209_PUB01_DOT010.png', pos: new Vector3(3, 0, 12) },
            { name: 'scholar', sprite: 'OT2_202209_PUB01_DOT011.png', pos: new Vector3(-5, 0, -3) },
            { name: 'guard', sprite: 'OT2_202209_PUB01_DOT012.png', pos: new Vector3(5, 0, -3) },
            { name: 'blacksmith', sprite: 'OT2_202209_PUB01_DOT009.png', pos: new Vector3(-9.5, 0, 8) }
        ];
        
        for (const data of npcData) {
            const npc = new HD2DSprite(data.name, this.scene, {
                width: 1.2,   // Original NPC size
                height: 1.8,  // Original NPC size
                frameWidth: 64,
                frameHeight: 64
            });
            
            await npc.loadSpriteSheet(`/assets/sprites/npc/${data.sprite}`);
            npc.setPosition(new Vector3(data.pos.x, 0.9, data.pos.z)); // Half of 1.8 height
            
            // Face center
            if (data.pos.x < 0) {
                npc.mesh.scaling.x = -1; // Flip to face right
            }
            
            // Enable outline - disabled due to shader issues
            // npc.enableOutline(new Color3(0, 0, 0), 1);
            
            // Enable speech bubble for interaction
            npc.enableSpeechBubble();
            
            this.npcs.push(npc);
        }
    }
    
    private async registerModels(): Promise<void> {
        // Register all models that will be used in the scene
        // This should be done once at startup, not every time we load an instance
        
        // Register barrel model
        try {
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'barrel.glb',
                this.scene
            );
            
            const rootNode = result.instantiateModelsToScene().rootNodes[0];
            if (rootNode) {
                // Reset to origin for registry
                rootNode.position = Vector3.Zero();
                rootNode.scaling = Vector3.One();
                
                ModelRegistry.getInstance().registerModel(
                    'barrel',
                    '/assets/models/barrel.glb',
                    rootNode,
                    null
                );
                
                // Dispose of this instance since we only needed it for registration
                rootNode.dispose();
            }
            
            result.dispose();
        } catch (error) {
            console.error('Failed to register barrel model:', error);
        }
        
        // Register blacksmith model
        try {
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'blacksmith_building.glb',
                this.scene
            );
            
            const rootNode = result.instantiateModelsToScene().rootNodes[0];
            if (rootNode) {
                // Reset to origin for registry
                rootNode.position = Vector3.Zero();
                rootNode.scaling = Vector3.One();
                
                ModelRegistry.getInstance().registerModel(
                    'blacksmith',
                    '/assets/models/blacksmith_building.glb',
                    rootNode,
                    null
                );
                
                // Dispose of this instance since we only needed it for registration
                rootNode.dispose();
            }
            
            result.dispose();
        } catch (error) {
            console.error('Failed to register blacksmith model:', error);
        }
        
        // Register alchemist building 1 model
        try {
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'alchemist_building_1.glb',
                this.scene
            );
            
            const rootNode = result.instantiateModelsToScene().rootNodes[0];
            if (rootNode) {
                // Reset to origin for registry
                rootNode.position = Vector3.Zero();
                rootNode.scaling = Vector3.One();
                
                ModelRegistry.getInstance().registerModel(
                    'alchemist1',
                    '/assets/models/alchemist_building_1.glb',
                    rootNode,
                    null
                );
                
                // Dispose of this instance since we only needed it for registration
                rootNode.dispose();
            }
            
            result.dispose();
        } catch (error) {
            console.error('Failed to register alchemist building 1 model:', error);
        }
        
        // Register alchemist building 2 model
        try {
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'alchemist_building_2.glb',
                this.scene
            );
            
            const rootNode = result.instantiateModelsToScene().rootNodes[0];
            if (rootNode) {
                // Reset to origin for registry
                rootNode.position = Vector3.Zero();
                rootNode.scaling = Vector3.One();
                
                ModelRegistry.getInstance().registerModel(
                    'alchemist2',
                    '/assets/models/alchemist_building_2.glb',
                    rootNode,
                    null
                );
                
                // Dispose of this instance since we only needed it for registration
                rootNode.dispose();
            }
            
            result.dispose();
        } catch (error) {
            console.error('Failed to register alchemist building 2 model:', error);
        }
        
        // Register marketplace model
        try {
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'marketplace.glb',
                this.scene
            );
            
            const rootNode = result.instantiateModelsToScene().rootNodes[0];
            if (rootNode) {
                // Reset to origin for registry
                rootNode.position = Vector3.Zero();
                rootNode.scaling = Vector3.One();
                
                ModelRegistry.getInstance().registerModel(
                    'marketplace',
                    '/assets/models/marketplace.glb',
                    rootNode,
                    null
                );
                
                // Dispose of this instance since we only needed it for registration
                rootNode.dispose();
            }
            
            result.dispose();
        } catch (error) {
            console.error('Failed to register marketplace model:', error);
        }
        
        // Register fountain model
        try {
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'fountain.glb',
                this.scene
            );
            
            const rootNode = result.instantiateModelsToScene().rootNodes[0];
            if (rootNode) {
                // Reset to origin for registry
                rootNode.position = Vector3.Zero();
                rootNode.scaling = Vector3.One();
                
                ModelRegistry.getInstance().registerModel(
                    'fountain',
                    '/assets/models/fountain.glb',
                    rootNode,
                    null
                );
                
                // Dispose of this instance since we only needed it for registration
                rootNode.dispose();
            }
            
            result.dispose();
        } catch (error) {
            console.error('Failed to register fountain model:', error);
        }
        
        // Add other models here as needed
    }
    
    private createPixelGrassTexture(): Texture {
        const size = 128;
        const texture = new DynamicTexture('grassTexture', size, this.scene, false);
        const ctx = texture.getContext();
        
        // Base grass color
        ctx.fillStyle = '#4a7c4e';
        ctx.fillRect(0, 0, size, size);
        
        // Add pixel details
        const grassColors = ['#5a8c5e', '#3a6c3e', '#6a9c6e', '#2a5c2e'];
        const pixelSize = 4;
        
        for (let i = 0; i < 200; i++) {
            const x = Math.floor(Math.random() * (size / pixelSize)) * pixelSize;
            const y = Math.floor(Math.random() * (size / pixelSize)) * pixelSize;
            ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
            ctx.fillRect(x, y, pixelSize, pixelSize);
        }
        
        texture.update();
        
        // Set pixel perfect settings
        texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        texture.uScale = 10;
        texture.vScale = 10;
        
        return texture;
    }
    
    private async create3DProps(): Promise<void> {
        // Add fountain model at center
        await this.loadModelWithCollisions('fountain', new Vector3(0, 0, 0), new Vector3(2, 2, 2));
        
        // Add barrel near the fountain (fountain is at 0,0,0)
        await this.loadModelWithCollisions('barrel', new Vector3(2.5, 0, -2.5), new Vector3(1, 1, 1));
        
        // Add larger barrel at bottom left (negative X, negative Z)
        await this.loadModelWithCollisions('barrel', new Vector3(-15, 0, -15), new Vector3(2, 2, 2));
        
        // Add blacksmith at specified position with 5x scale, horizontally flipped and rotated 45 degrees anticlockwise
        await this.loadModelWithCollisions('blacksmith', new Vector3(-10, 0, 10), new Vector3(-5, 5, 5), -Math.PI / 4);
        
        // Add alchemist buildings to replace the houses on the right
        // First alchemist building at the original house2 position (8, 0, -5), rotated 45 degrees clockwise and horizontally flipped
        await this.loadModelWithCollisions('alchemist1', new Vector3(8, 0, -5), new Vector3(-3, 3, 3), Math.PI / 4);
        
        // Second alchemist building placed to the right of the first one, rotated 45 degrees clockwise and horizontally flipped
        await this.loadModelWithCollisions('alchemist2', new Vector3(15, 0, -5), new Vector3(-3, 3, 3), Math.PI / 4);
        
        // Add marketplace building horizontally flipped, moved back slightly, and rotated 45 degrees clockwise
        await this.loadModelWithCollisions('marketplace', new Vector3(8.5, 0, 8), new Vector3(-5, 5, 5), Math.PI / 4);
    }
    
    private async loadModelCollisions(modelName: string, modelMesh: Mesh, position: Vector3, yOffset: number = 0, modelScale: Vector3 = new Vector3(1, 1, 1), rotationY: number = 0): Promise<void> {
        // Disable mesh-based collision, use primitive colliders instead
        modelMesh.checkCollisions = false;
        
        try {
            let setup = null;
            
            // Check localStorage for collision data
            const localData = localStorage.getItem(`sappyverse_collision_${modelName}`);
            if (localData) {
                setup = JSON.parse(localData);
                console.log(`Loaded ${modelName} collision from localStorage`);
            } else {
                console.log(`No collision data in localStorage for ${modelName} - model will have no collision`);
                return; // Exit early - no collision for this model
            }
            
            if (setup && setup.colliders) {
                // Apply colliders from setup with position offset
                setup.colliders.forEach((colliderData, index) => {
                    console.log(`Processing collider ${index} for ${modelName}:`, {
                        type: colliderData.type,
                        isWalkable: colliderData.isWalkable,
                        hasHeight: colliderData.height !== undefined,
                        height: colliderData.height
                    });
                    
                    // Use shared utility to adjust collider position
                    const colliderLocalPos = new Vector3(
                        colliderData.position._x,
                        colliderData.position._y,
                        colliderData.position._z
                    );
                    
                    // Apply rotation to the local position if needed
                    let rotatedLocalPos = colliderLocalPos;
                    if (rotationY !== 0) {
                        const cos = Math.cos(rotationY);
                        const sin = Math.sin(rotationY);
                        rotatedLocalPos = new Vector3(
                            colliderLocalPos.x * cos - colliderLocalPos.z * sin,
                            colliderLocalPos.y,
                            colliderLocalPos.x * sin + colliderLocalPos.z * cos
                        );
                    }
                    
                    
                    const colliderPos = ModelPositioning.adjustColliderPosition(
                        rotatedLocalPos,
                        position,
                        yOffset,
                        modelScale
                    );
                    
                    
                    if (colliderData.type === 'box') {
                        // Create box collider with scaled dimensions
                        // Use absolute values to handle negative scaling (mirroring)
                        const scaledWidth = colliderData.scale._x * Math.abs(modelScale.x);
                        const scaledHeight = colliderData.scale._y * Math.abs(modelScale.y);
                        const scaledDepth = colliderData.scale._z * Math.abs(modelScale.z);
                        
                        // Create actual collision mesh
                        const collisionBox = CreateBox(`collision_box_${modelName}_${index}`, {
                            width: scaledWidth,
                            height: scaledHeight,
                            depth: scaledDepth
                        }, this.scene);
                        
                        collisionBox.position = colliderPos.clone();
                        collisionBox.rotation.y = rotationY;
                        collisionBox.isVisible = false; // Always invisible, visualization system handles display
                        collisionBox.checkCollisions = true;
                        collisionBox.isPickable = false;
                        
                        this.collisionMeshes.push(collisionBox);
                        
                    } else if (colliderData.type === 'cylinder') {
                        // Check for erroneous walkable cylinders
                        if (colliderData.isWalkable || colliderData.height !== undefined) {
                            console.error('WARNING: Cylinder has walkable or height property!', {
                                modelName,
                                index,
                                isWalkable: colliderData.isWalkable,
                                height: colliderData.height,
                                colliderData
                            });
                        }
                        
                        // Create cylinder collider with scaled dimensions
                        // Use absolute value for radius to handle negative scaling (mirroring)
                        const scaledRadius = (colliderData.scale._x * Math.abs(modelScale.x)) / 2;
                        const scaledHeight = colliderData.scale._y * Math.abs(modelScale.y);
                        
                        // Create actual collision mesh
                        const collisionCylinder = CreateCylinder(`collision_cylinder_${modelName}_${index}`, {
                            diameter: scaledRadius * 2,
                            height: scaledHeight
                        }, this.scene);
                        
                        collisionCylinder.position = colliderPos.clone();
                        collisionCylinder.rotation.y = rotationY;
                        collisionCylinder.isVisible = false; // Always invisible, visualization system handles display
                        collisionCylinder.checkCollisions = true;
                        collisionCylinder.isPickable = false;
                        
                        this.collisionMeshes.push(collisionCylinder);
                        
                    } else if (colliderData.type === 'ramp') {
                        // Create ramp collider with scaled dimensions
                        // Use absolute values to handle negative scaling (mirroring)
                        const scaledWidth = colliderData.scale._x * Math.abs(modelScale.x);
                        const scaledHeight = colliderData.scale._y * Math.abs(modelScale.y);
                        const scaledDepth = colliderData.scale._z * Math.abs(modelScale.z);
                        
                        // Add model rotation to ramp rotation
                        const rotation = new Vector3(
                            colliderData.rotation._x,
                            colliderData.rotation._y + rotationY,
                            colliderData.rotation._z
                        );
                        
                        // Calculate min and max heights for the ramp
                        // Simply use the bottom and top of the ramp box
                        const rampMinHeight = colliderPos.y - scaledHeight / 2;
                        const rampMaxHeight = colliderPos.y + scaledHeight / 2;
                        
                        // Create actual collision mesh for ramp
                        const collisionRamp = CreateBox(`collision_ramp_${modelName}_${index}`, {
                            width: scaledWidth,
                            height: scaledHeight,
                            depth: scaledDepth
                        }, this.scene);
                        
                        collisionRamp.position = colliderPos.clone();
                        collisionRamp.rotation = rotation.clone();
                        collisionRamp.isVisible = false; // Always invisible, visualization system handles display
                        collisionRamp.checkCollisions = false; // Ramps should not block movement
                        collisionRamp.isPickable = false;
                        
                        // Store ramp data for height calculations
                        collisionRamp.metadata = {
                            type: 'ramp',
                            minHeight: rampMinHeight,
                            maxHeight: rampMaxHeight
                        };
                        
                        this.collisionMeshes.push(collisionRamp);
                        
                    } else if (colliderData.type === 'floor') {
                        // Create floor collider with scaled dimensions
                        // Use absolute values to handle negative scaling (mirroring)
                        const scaledWidth = colliderData.scale._x * Math.abs(modelScale.x);
                        const scaledDepth = colliderData.scale._z * Math.abs(modelScale.z);
                        
                        // Get the floor height from collider data, scaled by model scale
                        // The height should be the absolute Y position of the floor surface
                        const floorHeight = colliderPos.y + (colliderData.height || 0) * Math.abs(modelScale.y);
                        
                        // Create actual collision mesh for floor
                        const collisionFloor = CreateBox(`collision_floor_${modelName}_${index}`, {
                            width: scaledWidth,
                            height: 0.1,
                            depth: scaledDepth
                        }, this.scene);
                        
                        collisionFloor.position = colliderPos.clone();
                        collisionFloor.position.y = floorHeight;
                        collisionFloor.rotation.y = rotationY;
                        collisionFloor.isVisible = false; // Always invisible, visualization system handles display
                        collisionFloor.checkCollisions = false; // Floors should not block horizontal movement
                        collisionFloor.isPickable = false;
                        
                        // Store floor data for height calculations
                        collisionFloor.metadata = {
                            type: 'floor',
                            height: colliderData.height || 0  // Store just the height offset, not absolute position
                        };
                        
                        this.collisionMeshes.push(collisionFloor);
                    }
                });
                
                console.log(`Loaded ${setup.colliders.length} colliders for ${modelName} at ${position.toString()}`);
                
                // Debug: Log what types of colliders were created
                const colliderTypes = setup.colliders.reduce((acc: any, collider: any) => {
                    acc[collider.type] = (acc[collider.type] || 0) + 1;
                    return acc;
                }, {});
                console.log(`Collider breakdown for ${modelName}:`, colliderTypes);
                
                return;
            }
        } catch (error) {
            console.error(`Failed to load ${modelName} collision setup:`, error);
        }
        
        // No fallback - only use saved collision data
        if (!setup || !setup.colliders) {
            console.log(`No collision data found for ${modelName} - model will have no collision`);
        }
    }
    
    private async loadModelWithCollisions(modelName: string, position: Vector3, scale: Vector3 = new Vector3(1, 1, 1), rotationY: number = 0): Promise<void> {
        try {
            // Get model data from registry
            const modelData = ModelRegistry.getInstance().getModel(modelName);
            if (!modelData) {
                console.error(`Model '${modelName}' not found in registry`);
                return;
            }
            
            // Load the model
            const pathParts = modelData.path.split('/');
            const filename = pathParts.pop() || '';
            const directory = pathParts.join('/') + '/';
            
            const result = await SceneLoader.LoadAssetContainerAsync(
                directory,
                filename,
                this.scene
            );
            
            // Instantiate the loaded meshes
            const modelInstance = result.instantiateModelsToScene();
            
            
            // Find the main mesh with geometry using shared utility
            const mainMesh = ModelPositioning.findMainMesh(modelInstance.rootNodes);
            
            if (!mainMesh) {
                console.error(`No mesh with geometry found in ${modelName} model`);
                return;
            }
            
            // Get the root node to apply transformations
            const rootNode = modelInstance.rootNodes[0];
            let yOffset = 0; // Track the Y offset for collisions
            
            if (rootNode) {
                // Create a parent transform node for rotation if needed
                let parentNode = rootNode;
                if (rotationY !== 0) {
                    parentNode = new TransformNode(`${modelName}_rotationParent`, this.scene);
                    parentNode.position = position;
                    parentNode.rotation.y = rotationY;
                    
                    console.log(`Applying rotation to ${modelName}: ${rotationY} radians (${rotationY * 180 / Math.PI} degrees)`);
                    
                    // Parent the model to our rotation node
                    rootNode.parent = parentNode;
                    rootNode.position = Vector3.Zero(); // Reset local position
                }
                
                // Apply scale
                rootNode.scaling = scale;
                
                // Position model on ground using shared utility
                if (rotationY === 0) {
                    yOffset = ModelPositioning.positionModelOnGround(
                        rootNode,
                        mainMesh,
                        position
                    );
                } else {
                    // For rotated models, position at origin then use parent's position
                    yOffset = ModelPositioning.positionModelOnGround(
                        rootNode,
                        mainMesh,
                        Vector3.Zero()
                    );
                }
            }
            
            // Set rendering properties
            modelInstance.rootNodes.forEach(node => {
                node.getChildMeshes().forEach(mesh => {
                    if (mesh instanceof Mesh) {
                        mesh.renderingGroupId = 1; // Same as buildings
                        mesh.receiveShadows = true;
                        mesh.isVisible = true;
                    }
                });
            });
            
            // Load collision data for the model
            if (mainMesh && rootNode) {
                // Pass the Y offset so collisions can be adjusted the same way
                // Use the parent node position if we created one for rotation
                const collisionPosition = rootNode.parent instanceof TransformNode ? 
                    rootNode.parent.position : rootNode.position;
                await this.loadModelCollisions(modelName, mainMesh, collisionPosition, yOffset, scale, rotationY);
            }
            
            
        } catch (error) {
            console.error(`Failed to load ${modelName}:`, error);
        }
    }
    
    
    
    private setupCollisions(): void {
        // Set up the collision visualizer with all collision meshes
        this.collisionVisualizer.setCollisionMeshes(this.collisionMeshes);
        
        // Enable visualization by default
        this.collisionVisualizer.setEnabled(this.createDebugVisualizations);
        
        // Log collision mesh count
        console.log(`Set up collision visualizer with ${this.collisionMeshes.length} collision meshes`);
    }
    
    public getPlayer(): HD2DAnimatedSprite {
        return this.player;
    }
    
    public getCollisionMeshes(): Mesh[] {
        return this.collisionMeshes;
    }
    
    public getNPCs(): HD2DSprite[] {
        return this.npcs;
    }
    
    public getFountainWaterFlow(): FountainWaterFlow {
        return this.fountainWaterFlow;
    }
    
    public setDebugVisualizationsEnabled(enabled: boolean): void {
        this.createDebugVisualizations = enabled;
        this.collisionVisualizer.setEnabled(enabled);
    }
    
    public getCollisionVisualizer(): SimpleCollisionVisualizer {
        return this.collisionVisualizer;
    }
}