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

export class HD2DTownScene {
    private scene: Scene;
    private player: HD2DAnimatedSprite;
    private npcs: HD2DSprite[] = [];
    private collisionBoxes: Array<{min: Vector3, max: Vector3}> = [];
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
            console.log('Loading blacksmith model...');
            
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
            
            console.log(`Loaded ${blacksmithMeshes.rootNodes.length} root nodes for blacksmith`);
            
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
            
            console.log(`Found blacksmith mesh: ${blacksmithMesh.name} with ${blacksmithMesh.getTotalVertices()} vertices`);
            
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
                
                console.log(`Blacksmith positioned at: ${rootNode.position}`);
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
                this.createBlacksmithMeshCollider(blacksmithMesh);
            }
            
            // Add simple collision box
            const size = 8; // Approximate size
            this.collisionBoxes.push({
                min: new Vector3(blacksmithPosition.x - size/2, 0, blacksmithPosition.z - size/2),
                max: new Vector3(blacksmithPosition.x + size/2, 10, blacksmithPosition.z + size/2)
            });
            
            console.log('Blacksmith loaded successfully');
            
        } catch (error) {
            console.error('Failed to load blacksmith:', error);
        }
    }
    
    private createBlacksmithMeshCollider(blacksmithMesh: Mesh): void {
        console.log('Creating mesh collider for blacksmith...');
        
        // Enable collision on the mesh itself
        blacksmithMesh.checkCollisions = true;
        
        // Create a visual representation of the mesh collider
        const colliderMesh = blacksmithMesh.clone(`${blacksmithMesh.name}_collider`);
        
        // Update world matrix to ensure correct positioning
        colliderMesh.computeWorldMatrix(true);
        
        // Create wireframe material for visualization
        const colliderMat = new StandardMaterial(`${blacksmithMesh.name}_colliderMat`, this.scene);
        colliderMat.wireframe = true;
        colliderMat.emissiveColor = new Color3(0, 1, 0); // Green wireframe
        colliderMat.disableLighting = true;
        colliderMat.alpha = 0.5; // Semi-transparent
        
        colliderMesh.material = colliderMat;
        colliderMesh.isPickable = false;
        colliderMesh.renderingGroupId = 2; // Render on top
        
        console.log('Mesh collider created for blacksmith:', {
            meshName: blacksmithMesh.name,
            vertices: blacksmithMesh.getTotalVertices(),
            collisionEnabled: blacksmithMesh.checkCollisions
        });
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
        // Load a barrel next to the fountain
        await this.loadBarrel();
    }
    
    private createBarrelMeshCollider(barrelMesh: Mesh): void {
        console.log('Creating mesh collider for barrel...');
        
        // Enable collision on the mesh itself
        barrelMesh.checkCollisions = true;
        
        // Create a visual representation of the mesh collider
        const colliderMesh = barrelMesh.clone(`${barrelMesh.name}_collider`);
        
        // Update world matrix to ensure correct positioning
        colliderMesh.computeWorldMatrix(true);
        
        // Create wireframe material for visualization
        const colliderMat = new StandardMaterial(`${barrelMesh.name}_colliderMat`, this.scene);
        colliderMat.wireframe = true;
        colliderMat.emissiveColor = new Color3(0, 1, 0); // Green wireframe
        colliderMat.disableLighting = true;
        colliderMat.alpha = 0.5; // Semi-transparent
        
        colliderMesh.material = colliderMat;
        colliderMesh.isPickable = false;
        colliderMesh.renderingGroupId = 2; // Render on top
        
        // The cloned mesh with wireframe acts as visual representation
        // The original mesh has checkCollisions enabled for actual collision detection
        
        console.log('Mesh collider created:', {
            meshName: barrelMesh.name,
            vertices: barrelMesh.getTotalVertices(),
            collisionEnabled: barrelMesh.checkCollisions
        });
    }
    
    private async loadBarrel(): Promise<void> {
        try {
            console.log('Loading barrel model...');
            
            // Create a simple scene loader for the barrel
            const result = await SceneLoader.LoadAssetContainerAsync(
                '/assets/models/',
                'Make_a_wooden_barrel__0725233815_texture.glb',
                this.scene
            );
            
            // Instantiate the loaded meshes
            const barrelMeshes = result.instantiateModelsToScene();
            
            console.log(`Loaded ${barrelMeshes.rootNodes.length} root nodes`);
            
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
            
            console.log(`Found barrel mesh: ${barrelMesh.name} with ${barrelMesh.getTotalVertices()} vertices`);
            
            // Position next to fountain (fountain is at 0,0,0)
            const barrelPosition = new Vector3(2.5, 0, 0);
            
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
                
                console.log(`Barrel positioned at: ${rootNode.position}`);
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
                this.createBarrelMeshCollider(barrelMesh);
            }
            
            console.log('Barrel loaded successfully with mesh collider');
            
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
    
    public getNPCs(): HD2DSprite[] {
        return this.npcs;
    }
    
    public getFountainWaterFlow(): FountainWaterFlow {
        return this.fountainWaterFlow;
    }
}