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

export class HD2DTownScene {
    private scene: Scene;
    private player: HD2DAnimatedSprite;
    private npcs: HD2DSprite[] = [];
    private collisionBoxes: Array<{min: Vector3, max: Vector3}> = [];
    private collisionCylinders: Array<{center: Vector3, radius: number, height: number}> = [];
    private floorZones: Array<{bounds: {min: Vector3, max: Vector3}, heightMap: number[][], resolution: number}> = [];
    private fountainWaterFlow: FountainWaterFlow;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    public async build(): Promise<void> {
        // Set scene ambiance
        this.scene.clearColor = new Color4(0.5, 0.7, 0.9, 1); // Sky blue
        
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
        this.fountainWaterFlow = new FountainWaterFlow(this.scene, new Vector3(0, 0, 0));
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
            { name: 'shop', pos: new Vector3(10, 0, 10), size: { w: 5, h: 4, d: 4 }, color: new Color3(0.6, 0.5, 0.4) },
            { name: 'inn', pos: new Vector3(0, 0, 15), size: { w: 6, h: 6, d: 5 }, color: new Color3(0.7, 0.6, 0.5) },
            { name: 'house1', pos: new Vector3(-8, 0, -5), size: { w: 3, h: 4, d: 3 }, color: new Color3(0.6, 0.5, 0.4) },
            { name: 'house2', pos: new Vector3(8, 0, -5), size: { w: 3, h: 4, d: 3 }, color: new Color3(0.5, 0.5, 0.4) }
        ];
        
        // Create procedural buildings
        buildings.forEach(buildingData => {
            this.createBuildingWithRoof(buildingData);
        });
        
        // Load blacksmith building
        await this.loadBlacksmith();
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
        
        // Add to collision boxes
        this.collisionBoxes.push({
            min: new Vector3(
                data.pos.x - data.size.w/2,
                0,
                data.pos.z - data.size.d/2
            ),
            max: new Vector3(
                data.pos.x + data.size.w/2,
                data.size.h,
                data.pos.z + data.size.d/2
            )
        });
    }
    
    private async loadBlacksmith(): Promise<void> {
        try {
            
            // Position where the blacksmith was before
            const blacksmithPosition = new Vector3(-10, 0, 10);
            
            // Load the GLB model
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'blacksmith.glb',
                this.scene
            );
            
            // Instantiate the loaded meshes
            const blacksmithMeshes = result.instantiateModelsToScene();
            
            
            // Find the main mesh with geometry
            let blacksmithMesh: Mesh | null = null;
            for (const rootNode of blacksmithMeshes.rootNodes) {
                if (rootNode instanceof Mesh && rootNode.getTotalVertices() > 0) {
                    blacksmithMesh = rootNode;
                    break;
                }
                
                // Check children
                const children = rootNode.getChildMeshes();
                for (const child of children) {
                    if (child instanceof Mesh && child.getTotalVertices() > 0) {
                        blacksmithMesh = child;
                        break;
                    }
                }
                
                if (blacksmithMesh) break;
            }
            
            if (!blacksmithMesh) {
                console.error('No mesh with geometry found in blacksmith model');
                return;
            }
            
            
            // Get the root node to apply transformations
            const rootNode = blacksmithMeshes.rootNodes[0];
            if (rootNode) {
                rootNode.position = blacksmithPosition;
                rootNode.scaling = new Vector3(5, 5, 5); // Scale up by 5x as before
                
                // Compute bounds to position correctly on ground
                blacksmithMesh.computeWorldMatrix(true);
                const bounds = blacksmithMesh.getBoundingInfo().boundingBox;
                const minY = bounds.minimumWorld.y;
                
                // Adjust Y position to sit on ground if needed
                if (minY < 0) {
                    rootNode.position.y = -minY;
                }
                
                // Register model in global registry
                ModelRegistry.getInstance().registerModel(
                    'blacksmith',
                    '/assets/models/blacksmith.glb',
                    rootNode,
                    '/src/babylon/data/blacksmith-collision.json'
                );
            }
            
            // Set rendering properties
            blacksmithMeshes.rootNodes.forEach(node => {
                node.getChildMeshes().forEach(mesh => {
                    if (mesh instanceof Mesh) {
                        mesh.renderingGroupId = 1; // Same as buildings
                        mesh.receiveShadows = true;
                        mesh.isVisible = true;
                    }
                });
            });
            
            // Create mesh collider for the blacksmith
            if (blacksmithMesh) {
                await this.createBlacksmithMeshCollider(blacksmithMesh);
            }
            
            // Store blacksmith mesh for collision detection
            (this as any).blacksmithMesh = blacksmithMesh;
            
            
        } catch (error) {
            console.error('Failed to load blacksmith:', error);
        }
    }
    
    private async createBlacksmithMeshCollider(blacksmithMesh: Mesh): Promise<void> {
        // Don't enable mesh collision - we'll use primitives instead
        blacksmithMesh.checkCollisions = false;
        
        try {
            let setup = null;
            
            // First check localStorage for collision data
            const localData = localStorage.getItem('sappyverse_collision_blacksmith');
            if (localData) {
                setup = JSON.parse(localData);
                console.log('Loaded blacksmith collision from localStorage');
            } else {
                // Fallback to loading collision setup from JSON file
                const response = await fetch('/src/babylon/data/blacksmith-collision.json');
                setup = await response.json();
            }
            
            console.log('Loading blacksmith collision setup...');
            
            // Apply colliders from setup
            setup.colliders.forEach(colliderData => {
                if (colliderData.type === 'box') {
                    // Create box collider
                    this.collisionBoxes.push({
                        min: new Vector3(
                            colliderData.position._x - colliderData.scale._x / 2,
                            colliderData.position._y - colliderData.scale._y / 2,
                            colliderData.position._z - colliderData.scale._z / 2
                        ),
                        max: new Vector3(
                            colliderData.position._x + colliderData.scale._x / 2,
                            colliderData.position._y + colliderData.scale._y / 2,
                            colliderData.position._z + colliderData.scale._z / 2
                        )
                    });
                    
                    // Debug visualization
                    this.createDebugBox(
                        new Vector3(colliderData.position._x, colliderData.position._y, colliderData.position._z),
                        new Vector3(colliderData.scale._x, colliderData.scale._y, colliderData.scale._z),
                        new Color3(1, 0, 0)
                    );
                    
                } else if (colliderData.type === 'cylinder') {
                    // Create cylinder collider
                    this.collisionCylinders.push({
                        center: new Vector3(colliderData.position._x, colliderData.position._y, colliderData.position._z),
                        radius: colliderData.scale._x / 2,
                        height: colliderData.scale._y
                    });
                    
                    // Debug visualization
                    this.createDebugCylinder(
                        new Vector3(colliderData.position._x, colliderData.position._y, colliderData.position._z),
                        colliderData.scale._x / 2,
                        colliderData.scale._y,
                        new Color3(0, 1, 0)
                    );
                    
                } else if (colliderData.type === 'floor' || colliderData.type === 'ramp') {
                    // Create floor zone
                    let heightMap;
                    let resolution = 1;
                    
                    if (colliderData.type === 'ramp') {
                        // For ramps, create a height map that interpolates along the ramp
                        resolution = 10; // Higher resolution for smooth ramp
                        heightMap = [];
                        
                        // Calculate ramp direction based on rotation
                        const rotY = colliderData.rotation ? colliderData.rotation._y : 0;
                        const rotX = colliderData.rotation ? colliderData.rotation._x : 0;
                        const rotZ = colliderData.rotation ? colliderData.rotation._z : 0;
                        
                        // Create height map grid
                        for (let z = 0; z <= resolution; z++) {
                            heightMap[z] = [];
                            for (let x = 0; x <= resolution; x++) {
                                // Calculate position within the ramp (0 to 1)
                                const u = x / resolution;
                                const v = z / resolution;
                                
                                // Calculate height based on rotation
                                // Default ramp goes up along Z axis
                                let height = colliderData.position._y;
                                
                                if (Math.abs(rotX) > 0.01) {
                                    // Ramp tilted on X axis (front/back)
                                    const t = v - 0.5; // -0.5 to 0.5
                                    height += Math.tan(-rotX) * colliderData.scale._z * t; // Inverted rotation
                                }
                                
                                if (Math.abs(rotZ) > 0.01) {
                                    // Ramp tilted on Z axis (left/right)
                                    const t = u - 0.5; // -0.5 to 0.5
                                    height += Math.tan(-rotZ) * colliderData.scale._x * t; // Inverted rotation
                                }
                                
                                heightMap[z][x] = height;
                            }
                        }
                    } else {
                        // For floors, use single height
                        heightMap = [[colliderData.height || colliderData.position._y]];
                    }
                    
                    const floorZone = {
                        bounds: {
                            min: new Vector3(
                                colliderData.position._x - colliderData.scale._x / 2,
                                colliderData.position._y - colliderData.scale._y / 2,
                                colliderData.position._z - colliderData.scale._z / 2
                            ),
                            max: new Vector3(
                                colliderData.position._x + colliderData.scale._x / 2,
                                colliderData.position._y + colliderData.scale._y / 2,
                                colliderData.position._z + colliderData.scale._z / 2
                            )
                        },
                        heightMap: heightMap,
                        resolution: resolution,
                        type: colliderData.type, // Store type for collision handling
                        rotation: colliderData.rotation // Store rotation for collision calculations
                    };
                    
                    this.floorZones.push(floorZone);
                    
                    // Debug visualization
                    this.createDebugFloorZone(
                        floorZone,
                        colliderData.type === 'floor' ? new Color3(0, 0, 1) : new Color3(1, 0, 1),
                        colliderData
                    );
                }
            });
            
            console.log(`Loaded ${setup.colliders.length} colliders for blacksmith`);
            
        } catch (error) {
            console.error('Failed to load collision setup, using fallback:', error);
            
            // Fallback to simple bounding box
            const bounds = blacksmithMesh.getBoundingInfo().boundingBox;
            this.collisionBoxes.push({
                min: bounds.minimumWorld.clone(),
                max: bounds.maximumWorld.clone()
            });
        }
    }
    
    private createDebugBox(position: Vector3, size: Vector3, color: Color3): void {
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
    
    private createDebugCylinder(position: Vector3, radius: number, height: number, color: Color3): void {
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
    
    private createDebugFloorZone(zone: any, color: Color3, colliderData?: any): void {
        // For ramps, create an angled box to show the slope
        if (colliderData && colliderData.type === 'ramp') {
            const rampBox = CreateBox('debugRamp', {
                width: colliderData.scale._x,
                height: colliderData.scale._y,
                depth: colliderData.scale._z
            }, this.scene);
            
            // Use zone center position which already has the offset applied
            rampBox.position = new Vector3(
                (zone.bounds.min.x + zone.bounds.max.x) / 2,
                (zone.bounds.min.y + zone.bounds.max.y) / 2,
                (zone.bounds.min.z + zone.bounds.max.z) / 2
            );
            
            // Apply rotation if specified
            if (colliderData.rotation) {
                rampBox.rotation = new Vector3(
                    colliderData.rotation._x,
                    colliderData.rotation._y,
                    colliderData.rotation._z
                );
            }
            
            const debugMat = new StandardMaterial('debugRampMat', this.scene);
            debugMat.wireframe = true;
            debugMat.emissiveColor = color;
            debugMat.disableLighting = true;
            debugMat.alpha = 0.5;
            
            rampBox.material = debugMat;
            rampBox.isPickable = false;
            rampBox.renderingGroupId = 2;
        } else {
            // For floors, create a flat plane as before
            const width = zone.bounds.max.x - zone.bounds.min.x;
            const depth = zone.bounds.max.z - zone.bounds.min.z;
            
            const debugFloor = CreateGround('debugFloorZone', {
                width: width,
                height: depth,
                subdivisions: zone.resolution
            }, this.scene);
            
            debugFloor.position = new Vector3(
                (zone.bounds.min.x + zone.bounds.max.x) / 2,
                (zone.bounds.min.y + zone.bounds.max.y) / 2,
                (zone.bounds.min.z + zone.bounds.max.z) / 2
            );
            
            const debugMat = new StandardMaterial('debugFloorMat', this.scene);
            debugMat.wireframe = true;
            debugMat.emissiveColor = color;
            debugMat.disableLighting = true;
            debugMat.alpha = 0.5;
            
            debugFloor.material = debugMat;
            debugFloor.isPickable = false;
            debugFloor.renderingGroupId = 2;
        }
    }
    
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
        const fountainPos = new Vector3(0, 0, 0);
        
        // Base
        const base = CreateCylinder('fountainBase', {
            diameter: 4,
            height: 0.5,
            tessellation: 8
        }, this.scene);
        
        base.position = fountainPos.clone();
        base.position.y = 0.25;
        
        const baseMat = new PBRMaterial('fountainBaseMat', this.scene);
        baseMat.albedoColor = new Color3(0.6, 0.6, 0.6);
        baseMat.roughness = 0.7;
        baseMat.metallic = 0;
        
        base.material = baseMat;
        base.receiveShadows = true;
        base.renderingGroupId = 1;
        
        // Water with animated shader
        const water = CreateCylinder('water', {
            diameter: 3.5,
            height: 0.3,
            tessellation: 32  // Higher tessellation for wave animation
        }, this.scene);
        
        water.position = fountainPos.clone();
        water.position.y = 0.5;
        
        // Use animated water material
        const waterMat = new AnimatedWaterMaterial('fountainWater', this.scene);
        waterMat.setWaterColors(
            new Color3(0.4, 0.6, 0.9),  // Shallow color
            new Color3(0.2, 0.3, 0.6)   // Deep color
        );
        waterMat.setTransparency(0.8);
        waterMat.setReflectivity(0.4);
        
        water.material = waterMat;
        water.receiveShadows = true;
        water.renderingGroupId = 1;
        
        // Center pillar
        const pillar = CreateCylinder('fountainPillar', {
            diameter: 0.5,
            height: 1.5,
            tessellation: 6
        }, this.scene);
        
        pillar.position = fountainPos.clone();
        pillar.position.y = 1;
        pillar.material = baseMat;
        pillar.receiveShadows = true;
        pillar.renderingGroupId = 1;
        
        // Add collision
        const fountainRadius = 2;
        const boxSize = fountainRadius * 2 * 0.707;
        this.collisionBoxes.push({
            min: new Vector3(-boxSize/2, 0, -boxSize/2),
            max: new Vector3(boxSize/2, 2, boxSize/2)
        });
        
        // Water flow will be added after sprites are created
    }
    
    private createLampPosts(): void {
        const positions = [
            new Vector3(-5, 0, 0),
            new Vector3(5, 0, 0)
        ];
        
        const lights = this.scene.lights.filter(l => l instanceof DirectionalLight);
        const shadowGen = lights.length > 0 && (lights[0] as any).shadowGenerator ? 
            (lights[0] as any).shadowGenerator : null;
        
        positions.forEach((pos, i) => {
            // Post
            const post = CreateCylinder(`lamp${i}Post`, {
                diameter: 0.2,
                height: 3,
                tessellation: 6
            }, this.scene);
            
            post.position = pos.clone();
            post.position.y = 1.5;
            
            const postMat = new PBRMaterial(`lamp${i}PostMat`, this.scene);
            postMat.albedoColor = new Color3(0.2, 0.2, 0.2);
            postMat.roughness = 0.3;
            postMat.metallic = 0.7;
            
            post.material = postMat;
            post.receiveShadows = true;
            post.renderingGroupId = 1;
            
            if (shadowGen) {
                shadowGen.addShadowCaster(post);
            }
            
            // Lamp
            const lamp = CreateSphere(`lamp${i}Lamp`, {
                diameter: 0.6,
                segments: 8
            }, this.scene);
            
            lamp.position = pos.clone();
            lamp.position.y = 3.2;
            
            const lampMat = new StandardMaterial(`lamp${i}LampMat`, this.scene);
            lampMat.emissiveColor = new Color3(1, 0.6, 0.2);
            lampMat.diffuseColor = new Color3(1, 0.6, 0.2);
            
            lamp.material = lampMat;
            lamp.renderingGroupId = 1;
            
            // Point light
            const lampLight = new PointLight(`lamp${i}Light`, 
                new Vector3(pos.x, 3.2, pos.z), this.scene);
            lampLight.diffuse = new Color3(1, 0.6, 0.2);
            lampLight.specular = new Color3(1, 0.5, 0.1);
            lampLight.intensity = 0.7;
            lampLight.range = 10;
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
            { name: 'blacksmith', sprite: 'OT2_202209_PUB01_DOT009.png', pos: new Vector3(-8, 0, 7) },
            { name: 'merchant', sprite: 'OT2_202209_PUB01_DOT008.png', pos: new Vector3(8, 0, 7) },
            { name: 'innkeeper', sprite: 'OT2_202209_PUB01_DOT010.png', pos: new Vector3(3, 0, 12) },
            { name: 'scholar', sprite: 'OT2_202209_PUB01_DOT011.png', pos: new Vector3(-5, 0, -3) },
            { name: 'guard', sprite: 'OT2_202209_PUB01_DOT012.png', pos: new Vector3(5, 0, -3) }
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
        // Load barrels at different locations
        await this.loadBarrel(new Vector3(2.5, 0, 0));  // Next to fountain
        await this.loadBarrel(new Vector3(-12, 0, 8));   // Next to blacksmith, farther right
    }
    
    private async createBarrelMeshCollider(barrelMesh: Mesh, position: Vector3): Promise<void> {
        
        // Don't enable mesh collision, use cylinder collision instead
        barrelMesh.checkCollisions = false;
        
        try {
            let setup = null;
            
            // Only check localStorage for collision data - no file fallback
            const localData = localStorage.getItem('sappyverse_collision_barrel');
            if (localData) {
                setup = JSON.parse(localData);
                console.log('Loaded barrel collision from localStorage');
            } else {
                console.log('No barrel collision data in localStorage');
            }
            
            if (setup && setup.colliders) {
                // Apply colliders from setup with position offset
                setup.colliders.forEach(colliderData => {
                    // Apply position offset to all collider positions
                    const colliderPos = new Vector3(
                        position.x + colliderData.position._x,
                        position.y + colliderData.position._y,
                        position.z + colliderData.position._z
                    );
                    
                    if (colliderData.type === 'box') {
                        // Create box collider
                        this.collisionBoxes.push({
                            min: new Vector3(
                                colliderPos.x - colliderData.scale._x / 2,
                                colliderPos.y - colliderData.scale._y / 2,
                                colliderPos.z - colliderData.scale._z / 2
                            ),
                            max: new Vector3(
                                colliderPos.x + colliderData.scale._x / 2,
                                colliderPos.y + colliderData.scale._y / 2,
                                colliderPos.z + colliderData.scale._z / 2
                            )
                        });
                        
                        // Debug visualization
                        this.createDebugBox(
                            colliderPos,
                            new Vector3(colliderData.scale._x, colliderData.scale._y, colliderData.scale._z),
                            new Color3(1, 0, 0)
                        );
                        
                    } else if (colliderData.type === 'cylinder') {
                        // Create cylinder collider
                        this.collisionCylinders.push({
                            center: colliderPos,
                            radius: colliderData.scale._x / 2,
                            height: colliderData.scale._y
                        });
                        
                        // Debug visualization
                        this.createDebugCylinder(
                            colliderPos,
                            colliderData.scale._x / 2,
                            colliderData.scale._y,
                            new Color3(0, 1, 0)
                        );
                        
                    } else if (colliderData.type === 'floor' || colliderData.type === 'ramp') {
                        // Create floor zone
                        let heightMap;
                        let resolution = 1;
                        
                        if (colliderData.type === 'ramp') {
                            // For ramps, create a height map that interpolates along the ramp
                            resolution = 10; // Higher resolution for smooth ramp
                            heightMap = [];
                            
                            // Calculate ramp direction based on rotation
                            const rotY = colliderData.rotation ? colliderData.rotation._y : 0;
                            const rotX = colliderData.rotation ? colliderData.rotation._x : 0;
                            const rotZ = colliderData.rotation ? colliderData.rotation._z : 0;
                            
                            // Create height map grid
                            for (let z = 0; z <= resolution; z++) {
                                heightMap[z] = [];
                                for (let x = 0; x <= resolution; x++) {
                                    // Calculate position within the ramp (0 to 1)
                                    const u = x / resolution;
                                    const v = z / resolution;
                                    
                                    // Calculate height based on rotation
                                    // Default ramp goes up along Z axis
                                    let height = colliderPos.y;
                                    
                                    if (Math.abs(rotX) > 0.01) {
                                        // Ramp tilted on X axis (front/back)
                                        const t = v - 0.5; // -0.5 to 0.5
                                        height += Math.tan(-rotX) * colliderData.scale._z * t; // Inverted rotation
                                    }
                                    
                                    if (Math.abs(rotZ) > 0.01) {
                                        // Ramp tilted on Z axis (left/right)
                                        const t = u - 0.5; // -0.5 to 0.5
                                        height += Math.tan(-rotZ) * colliderData.scale._x * t; // Inverted rotation
                                    }
                                    
                                    heightMap[z][x] = height;
                                }
                            }
                        } else {
                            // For floors, use single height
                            heightMap = [[colliderData.height || colliderPos.y]];
                        }
                        
                        const floorZone = {
                            bounds: {
                                min: new Vector3(
                                    colliderPos.x - colliderData.scale._x / 2,
                                    colliderPos.y - colliderData.scale._y / 2,
                                    colliderPos.z - colliderData.scale._z / 2
                                ),
                                max: new Vector3(
                                    colliderPos.x + colliderData.scale._x / 2,
                                    colliderPos.y + colliderData.scale._y / 2,
                                    colliderPos.z + colliderData.scale._z / 2
                                )
                            },
                            heightMap: heightMap,
                            resolution: resolution,
                            type: colliderData.type, // Store type for collision handling
                            rotation: colliderData.rotation // Store rotation for collision calculations
                        };
                        
                        this.floorZones.push(floorZone);
                        
                        // Debug visualization
                        this.createDebugFloorZone(
                            floorZone,
                            colliderData.type === 'floor' ? new Color3(0, 0, 1) : new Color3(1, 0, 1),
                            colliderData
                        );
                    }
                });
                
                console.log(`Loaded ${setup.colliders.length} colliders for barrel at ${position.toString()}`);
                return;
            }
        } catch (error) {
            console.error('Failed to load barrel collision setup:', error);
        }
        
        // No fallback - only use saved collision data
        if (!setup || !setup.colliders) {
            console.log('No collision data found for barrel - model will have no collision');
        }
    }
    
    private async loadBarrel(position: Vector3): Promise<void> {
        try {
            
            // Create a simple scene loader for the barrel
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'Make_a_wooden_barrel__0725233815_texture.glb',
                this.scene
            );
            
            // Instantiate the loaded meshes
            const barrelMeshes = result.instantiateModelsToScene();
            
            
            // Find the main mesh with geometry
            let barrelMesh: Mesh | null = null;
            for (const rootNode of barrelMeshes.rootNodes) {
                if (rootNode instanceof Mesh && rootNode.getTotalVertices() > 0) {
                    barrelMesh = rootNode;
                    break;
                }
                
                // Check children
                const children = rootNode.getChildMeshes();
                for (const child of children) {
                    if (child instanceof Mesh && child.getTotalVertices() > 0) {
                        barrelMesh = child;
                        break;
                    }
                }
                
                if (barrelMesh) break;
            }
            
            if (!barrelMesh) {
                console.error('No mesh with geometry found in barrel model');
                return;
            }
            
            
            // Use the provided position
            const barrelPosition = position;
            
            // Get the root node to apply transformations
            const rootNode = barrelMeshes.rootNodes[0];
            if (rootNode) {
                rootNode.position = barrelPosition;
                rootNode.scaling = new Vector3(1, 1, 1); // Default scale
                
                // Compute bounds to position correctly on ground
                barrelMesh.computeWorldMatrix(true);
                const bounds = barrelMesh.getBoundingInfo().boundingBox;
                const minY = bounds.minimumWorld.y;
                
                // Adjust Y position to sit on ground
                rootNode.position.y = -minY;
                
                // Register model in global registry
                ModelRegistry.getInstance().registerModel(
                    'barrel',
                    '/assets/models/Make_a_wooden_barrel__0725233815_texture.glb',
                    rootNode
                );
            }
            
            // Set rendering properties
            barrelMeshes.rootNodes.forEach(node => {
                node.getChildMeshes().forEach(mesh => {
                    if (mesh instanceof Mesh) {
                        mesh.renderingGroupId = 1; // Same as buildings
                        mesh.receiveShadows = true;
                        mesh.isVisible = true;
                    }
                });
            });
            
            // Create mesh collider for the barrel
            if (barrelMesh) {
                await this.createBarrelMeshCollider(barrelMesh, barrelPosition);
            }
            
            
        } catch (error) {
            console.error('Failed to load barrel:', error);
        }
    }
    
    
    
    private setupCollisions(): void {
        // Collision system will be implemented separately
    }
    
    public getPlayer(): HD2DAnimatedSprite {
        return this.player;
    }
    
    public getCollisionBoxes(): Array<{min: Vector3, max: Vector3}> {
        return this.collisionBoxes;
    }
    
    public getCollisionCylinders(): Array<{center: Vector3, radius: number, height: number}> {
        return this.collisionCylinders;
    }
    
    public getFloorZones(): Array<{bounds: {min: Vector3, max: Vector3}, heightMap: number[][], resolution: number}> {
        return this.floorZones;
    }
    
    public getNPCs(): HD2DSprite[] {
        return this.npcs;
    }
    
    public getFountainWaterFlow(): FountainWaterFlow {
        return this.fountainWaterFlow;
    }
}