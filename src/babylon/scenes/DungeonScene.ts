import * as BABYLON from '@babylonjs/core';
import { HD2DScene } from '../core/HD2DScene';
import { PlayerController } from '../entities/PlayerController';
import { ProceduralGeneration, RoomTemplate } from '../../systems/ProceduralGeneration';

export class DungeonScene extends HD2DScene {
  private player!: PlayerController;
  private currentRoom?: RoomTemplate;
  private roomMeshes: BABYLON.Mesh[] = [];
  private depth: number = 1;
  
  constructor(engine: BABYLON.Engine) {
    super(engine);
  }
  
  async initialize(data?: any): Promise<void> {
    console.log('Initializing HD-2D Dungeon Scene');
    
    this.depth = data?.depth || 1;
    
    // Generate room
    this.generateRoom();
    
    // Create player
    this.createPlayer();
    
    // Create enemies
    this.createEnemies();
  }
  
  private generateRoom(): void {
    // Use existing procedural generation system
    const biome = ProceduralGeneration.getBiomeForDepth(this.depth);
    this.currentRoom = ProceduralGeneration.generateRoomLayout(this.depth, biome);
    
    // Create 3D room from template
    this.createRoomGeometry();
  }
  
  private createRoomGeometry(): void {
    if (!this.currentRoom) return;
    
    const tileSize = 2; // World units per tile
    const wallHeight = 3;
    
    // Materials
    const floorMat = new BABYLON.StandardMaterial('floorMat', this);
    floorMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    
    const wallMat = new BABYLON.StandardMaterial('wallMat', this);
    wallMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    
    // Create room based on layout
    for (let y = 0; y < this.currentRoom.layout.length; y++) {
      for (let x = 0; x < this.currentRoom.layout[y].length; x++) {
        const tile = this.currentRoom.layout[y][x];
        const worldX = (x - this.currentRoom.layout[y].length / 2) * tileSize;
        const worldZ = (y - this.currentRoom.layout.length / 2) * tileSize;
        
        if (tile === 0) {
          // Floor tile
          const floor = BABYLON.MeshBuilder.CreateBox(`floor_${x}_${y}`, {
            width: tileSize,
            height: 0.1,
            depth: tileSize
          }, this);
          floor.position = new BABYLON.Vector3(worldX, -0.05, worldZ);
          floor.material = floorMat;
          floor.receiveShadows = true;
          this.roomMeshes.push(floor);
          
        } else if (tile === 1) {
          // Wall
          const wall = BABYLON.MeshBuilder.CreateBox(`wall_${x}_${y}`, {
            width: tileSize,
            height: wallHeight,
            depth: tileSize
          }, this);
          wall.position = new BABYLON.Vector3(worldX, wallHeight / 2, worldZ);
          wall.material = wallMat;
          wall.receiveShadows = true;
          
          if (this.lights[0] instanceof BABYLON.DirectionalLight) {
            const shadowGen = this.lights[0].getShadowGenerator();
            if (shadowGen) {
              shadowGen.addShadowCaster(wall);
            }
          }
          
          this.roomMeshes.push(wall);
        }
      }
    }
  }
  
  private createPlayer(): void {
    this.player = new PlayerController(this, 'player');
    this.player.position = new BABYLON.Vector3(0, 0, 5);
    
    // Camera follows player
    this.mainCamera.parent = this.player.mesh;
    this.mainCamera.position = new BABYLON.Vector3(0, this.CAMERA_HEIGHT, -this.CAMERA_DISTANCE);
  }
  
  private createEnemies(): void {
    if (!this.currentRoom) return;
    
    // TODO: Create enemies based on room template
    // Using spawn points from currentRoom.enemySpawnPoints
  }
  
  update(deltaTime: number): void {
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
    }
  }
  
  dispose(): void {
    // Clean up room meshes
    this.roomMeshes.forEach(mesh => mesh.dispose());
    this.roomMeshes = [];
    
    super.dispose();
  }
}