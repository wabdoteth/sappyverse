import { MetaProgression } from './MetaProgression';

export interface PlayerState {
  hp: number;
  maxHp: number;
  barrier: number;
  maxBarrier: number;
  blade: {
    attack: number;
    shieldGain: number;
  };
  bulwark: {
    attack: number;
    shieldGain: number;
  };
  focus: {
    attack: number;
    shieldGain: number;
  };
}

export interface RunState {
  depth: number;
  roomsCleared: number;
  shards: number;
  playerState: PlayerState;
  upgradeCards: string[]; // Card IDs collected during run
}

export class GameStateManager {
  private static instance: GameStateManager;
  private currentRun?: RunState;
  
  private constructor() {}
  
  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }
  
  startNewRun(): void {
    // Get meta-progression bonuses
    const meta = MetaProgression.getInstance();
    const bonuses = meta.getStatBonuses();
    
    // Calculate max values with bonuses
    const maxHp = 10 + bonuses.maxHp;
    const maxBarrier = 3 + bonuses.maxBarrier;
    
    this.currentRun = {
      depth: 1,
      roomsCleared: 0,
      shards: 0,
      playerState: {
        hp: maxHp,  // Start with full HP
        maxHp: maxHp,
        barrier: maxBarrier,  // Start with full barrier
        maxBarrier: maxBarrier,
        blade: { attack: 4 + bonuses.bladeAttack, shieldGain: 0 },
        bulwark: { attack: 0, shieldGain: 4 + bonuses.bulwarkShield },
        focus: { attack: 2 + bonuses.focusAttack, shieldGain: 2 }
      },
      upgradeCards: []
    };
  }
  
  getCurrentRun(): RunState | undefined {
    return this.currentRun;
  }
  
  updatePlayerHP(hp: number): void {
    if (this.currentRun) {
      this.currentRun.playerState.hp = Math.max(0, Math.min(hp, this.currentRun.playerState.maxHp));
    }
  }
  
  updatePlayerBarrier(barrier: number): void {
    if (this.currentRun) {
      this.currentRun.playerState.barrier = Math.max(0, Math.min(barrier, this.currentRun.playerState.maxBarrier));
    }
  }
  
  getPlayerState(): PlayerState | undefined {
    return this.currentRun?.playerState;
  }
  
  incrementDepth(): void {
    if (this.currentRun) {
      this.currentRun.depth++;
    }
  }
  
  incrementRoomsCleared(): void {
    if (this.currentRun) {
      this.currentRun.roomsCleared++;
    }
  }
  
  addShards(amount: number): void {
    if (this.currentRun) {
      this.currentRun.shards += amount;
    }
  }
  
  addUpgradeCard(cardId: string): void {
    if (this.currentRun) {
      this.currentRun.upgradeCards.push(cardId);
    }
  }
  
  applyUpgradeCard(action: 'blade' | 'bulwark' | 'focus', attackBonus: number, shieldBonus: number): void {
    if (this.currentRun) {
      this.currentRun.playerState[action].attack += attackBonus;
      this.currentRun.playerState[action].shieldGain += shieldBonus;
    }
  }
  
  endRun(): number {
    const totalShards = this.currentRun?.shards || 0;
    
    // Add shards to meta-progression
    if (totalShards > 0) {
      MetaProgression.getInstance().addShards(totalShards);
    }
    
    // Record run statistics
    if (this.currentRun) {
      MetaProgression.getInstance().recordRunStats(
        this.currentRun.depth,
        0 // TODO: Track enemies defeated
      );
    }
    
    this.currentRun = undefined;
    return totalShards;
  }
  
  isRunActive(): boolean {
    return this.currentRun !== undefined;
  }
}