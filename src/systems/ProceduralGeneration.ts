import { GAME_CONFIG } from '../config/GameConfig';

export type RoomType = 'combat' | 'treasure' | 'elite' | 'rest' | 'shop';
export type BiomeType = 'rotwood' | 'shiver_marsh' | 'ember_caverns';

export interface RoomTemplate {
  id: string;
  type: RoomType;
  biome: BiomeType;
  layout: number[][]; // 0 = empty, 1 = wall, 2 = obstacle, 3 = hazard
  enemySpawnPoints: Array<{x: number, y: number}>;
  minDepth: number;
  maxDepth?: number;
  enemyCount: { min: number, max: number };
  enemyTypes?: string[]; // Specific enemy types for this room
}

export interface RoomNode {
  template: RoomTemplate;
  depth: number;
  cleared: boolean;
  position: { x: number, y: number }; // Position in the map
  connections: RoomNode[];
  reward?: RoomReward;
}

export interface RoomReward {
  type: 'weapon' | 'armor' | 'consumable' | 'shards' | 'health';
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity?: number;
}

export class ProceduralGeneration {
  private static roomTemplates: Map<string, RoomTemplate> = new Map();
  
  static {
    // Initialize default room templates
    this.initializeTemplates();
  }
  
  private static initializeTemplates(): void {
    // Basic combat room - Rotwood
    this.roomTemplates.set('rotwood_basic_1', {
      id: 'rotwood_basic_1',
      type: 'combat',
      biome: 'rotwood',
      layout: [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,2,0,0,0,0,2,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,2,0,0,0,0,2,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      enemySpawnPoints: [
        {x: 150, y: 150},
        {x: 650, y: 150},
        {x: 150, y: 450},
        {x: 650, y: 450}
      ],
      minDepth: 1,
      enemyCount: { min: 2, max: 4 }
    });
    
    // Cramped combat room - Rotwood
    this.roomTemplates.set('rotwood_cramped_1', {
      id: 'rotwood_cramped_1',
      type: 'combat',
      biome: 'rotwood',
      layout: [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,1,0,0,1,0,0,1],
        [1,0,0,1,0,0,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,0,0,0,0,0,0,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,1],
        [1,0,0,1,0,0,1,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      enemySpawnPoints: [
        {x: 100, y: 200},
        {x: 400, y: 100},
        {x: 400, y: 500},
        {x: 700, y: 200}
      ],
      minDepth: 3,
      enemyCount: { min: 3, max: 5 }
    });
    
    // Elite room
    this.roomTemplates.set('rotwood_elite_1', {
      id: 'rotwood_elite_1',
      type: 'elite',
      biome: 'rotwood',
      layout: [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,2,0,0,2,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,2,0,0,2,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      enemySpawnPoints: [
        {x: 400, y: 300} // Single elite spawn
      ],
      minDepth: 5,
      enemyCount: { min: 1, max: 1 },
      enemyTypes: ['hybrid'] // Elite enemy type
    });
    
    // Treasure room
    this.roomTemplates.set('treasure_basic_1', {
      id: 'treasure_basic_1',
      type: 'treasure',
      biome: 'rotwood',
      layout: [
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,2,2,0,0,0,1],
        [1,0,0,0,2,2,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      enemySpawnPoints: [],
      minDepth: 1,
      enemyCount: { min: 0, max: 0 }
    });
  }
  
  static generateRoomLayout(depth: number, biome: BiomeType = 'rotwood'): RoomTemplate {
    // Filter templates by depth and biome
    const validTemplates = Array.from(this.roomTemplates.values()).filter(template => {
      return template.biome === biome && 
             template.minDepth <= depth && 
             (!template.maxDepth || template.maxDepth >= depth);
    });
    
    if (validTemplates.length === 0) {
      // Fallback to basic room
      return this.roomTemplates.get('rotwood_basic_1')!;
    }
    
    // Weighted selection based on depth
    const weights = validTemplates.map(template => {
      if (template.type === 'elite' && depth >= 5) return 2;
      if (template.type === 'treasure' && depth % 3 === 0) return 3;
      return 5; // Combat rooms are most common
    });
    
    return this.weightedRandom(validTemplates, weights);
  }
  
  static generateDungeonMap(depth: number, roomCount: number = 3): RoomNode[] {
    const rooms: RoomNode[] = [];
    const biome: BiomeType = this.getBiomeForDepth(depth);
    
    // Generate rooms
    for (let i = 0; i < roomCount; i++) {
      const isLastRoom = i === roomCount - 1;
      const roomDepth = depth + i;
      
      // Force elite room occasionally
      let template: RoomTemplate;
      if (isLastRoom && roomDepth >= 5 && Math.random() < 0.3) {
        template = this.roomTemplates.get('rotwood_elite_1')!;
      } else if (Math.random() < 0.2) {
        template = this.roomTemplates.get('treasure_basic_1')!;
      } else {
        template = this.generateRoomLayout(roomDepth, biome);
      }
      
      const room: RoomNode = {
        template,
        depth: roomDepth,
        cleared: false,
        position: { x: i * 200, y: 0 },
        connections: [],
        reward: this.generateReward(template.type, roomDepth)
      };
      
      rooms.push(room);
    }
    
    // Connect rooms linearly for now
    for (let i = 0; i < rooms.length - 1; i++) {
      rooms[i].connections.push(rooms[i + 1]);
    }
    
    return rooms;
  }
  
  static getBiomeForDepth(depth: number): BiomeType {
    if (depth <= 10) return 'rotwood';
    if (depth <= 20) return 'shiver_marsh';
    return 'ember_caverns';
  }
  
  static generateReward(roomType: RoomType, depth: number): RoomReward | undefined {
    if (roomType === 'treasure') {
      const tier = this.getRewardTier(depth);
      return {
        type: Math.random() < 0.5 ? 'weapon' : 'armor',
        tier
      };
    }
    
    if (roomType === 'elite') {
      return {
        type: 'shards',
        tier: 'rare',
        quantity: 50 + depth * 10
      };
    }
    
    // Regular combat rooms
    if (Math.random() < 0.3) {
      return {
        type: 'consumable',
        tier: 'common',
        quantity: 1
      };
    }
    
    return {
      type: 'shards',
      tier: 'common',
      quantity: 10 + depth * 2
    };
  }
  
  private static getRewardTier(depth: number): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    const roll = Math.random() + (depth * 0.02); // Higher depth = better chances
    
    if (roll > 1.5) return 'legendary';
    if (roll > 1.2) return 'epic';
    if (roll > 0.8) return 'rare';
    if (roll > 0.4) return 'uncommon';
    return 'common';
  }
  
  private static weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
  
  // Generate room obstacles and hazards
  static generateRoomFeatures(template: RoomTemplate): Array<{type: string, x: number, y: number}> {
    const features: Array<{type: string, x: number, y: number}> = [];
    const tileSize = 80; // Size of each tile
    
    for (let y = 0; y < template.layout.length; y++) {
      for (let x = 0; x < template.layout[y].length; x++) {
        const tile = template.layout[y][x];
        const worldX = x * tileSize + tileSize / 2;
        const worldY = y * tileSize + tileSize / 2;
        
        switch (tile) {
          case 2: // Obstacle
            features.push({
              type: template.biome === 'rotwood' ? 'tree_stump' : 'rock',
              x: worldX,
              y: worldY
            });
            break;
          case 3: // Hazard
            features.push({
              type: template.biome === 'rotwood' ? 'poison_pool' : 'spike_trap',
              x: worldX,
              y: worldY
            });
            break;
        }
      }
    }
    
    return features;
  }
}