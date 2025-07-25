// Simplified GameStateManager for Babylon.js version
export interface GameState {
  player: {
    hp: number;
    maxHp: number;
    gold: number;
    level: number;
  };
  dungeon: {
    depth: number;
    roomsCleared: number;
  };
  inventory: {
    potions: number;
    keys: number;
  };
}

export class GameStateManager {
  private static instance: GameStateManager;
  private state: GameState;
  
  private constructor() {
    this.state = this.getDefaultState();
  }
  
  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }
  
  private getDefaultState(): GameState {
    return {
      player: {
        hp: 100,
        maxHp: 100,
        gold: 50,
        level: 1
      },
      dungeon: {
        depth: 0,
        roomsCleared: 0
      },
      inventory: {
        potions: 3,
        keys: 1
      }
    };
  }
  
  getState(): GameState {
    return this.state;
  }
  
  updatePlayerHealth(hp: number): void {
    this.state.player.hp = Math.max(0, Math.min(hp, this.state.player.maxHp));
  }
  
  addGold(amount: number): void {
    this.state.player.gold += amount;
  }
  
  spendGold(amount: number): boolean {
    if (this.state.player.gold >= amount) {
      this.state.player.gold -= amount;
      return true;
    }
    return false;
  }
  
  startDungeonRun(): void {
    this.state.dungeon.depth = 1;
    this.state.dungeon.roomsCleared = 0;
  }
  
  incrementDungeonProgress(): void {
    this.state.dungeon.roomsCleared++;
    if (this.state.dungeon.roomsCleared % 5 === 0) {
      this.state.dungeon.depth++;
    }
  }
  
  resetGame(): void {
    this.state = this.getDefaultState();
  }
}