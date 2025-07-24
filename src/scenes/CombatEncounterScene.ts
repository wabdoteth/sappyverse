import Phaser from 'phaser';
import { TurnBasedCombatSystem, CombatantData } from '../systems/TurnBasedCombatSystem';
import { RPSType } from '../systems/RPSLogic';
import { GameStateManager } from '../systems/GameStateManager';

export interface CombatEncounterData {
  playerData: {
    hp: number;
    maxHp: number;
    damage: number;
    rpsType: RPSType;
  };
  enemyData: {
    id: string;
    hp: number;
    maxHp: number;
    damage: number;
    rpsType: RPSType;
    type: string;
  };
  depth: number;
  roomIndex: number;
}

export class CombatEncounterScene extends Phaser.Scene {
  private combatSystem!: TurnBasedCombatSystem;
  private encounterData!: CombatEncounterData;
  
  constructor() {
    super({ key: 'CombatEncounterScene' });
  }
  
  init(data: CombatEncounterData): void {
    this.encounterData = data;
  }
  
  create(): void {
    // Get player state from GameStateManager
    const gameState = GameStateManager.getInstance();
    const playerState = gameState.getPlayerState()!;
    
    // Create combat system data
    const playerCombatData: CombatantData = {
      id: 'player',
      hp: playerState.hp,
      maxHp: playerState.maxHp,
      barrier: playerState.barrier,
      maxBarrier: playerState.maxBarrier,
      baseStats: {
        sword: playerState.blade,
        shield: playerState.bulwark,
        magic: playerState.focus
      },
      charges: {
        sword: 3,
        shield: 3,
        magic: 3
      }
    };
    
    const enemyCombatData: CombatantData = {
      id: this.encounterData.enemyData.id,
      hp: this.encounterData.enemyData.hp,
      maxHp: this.encounterData.enemyData.maxHp,
      barrier: 0,
      maxBarrier: 1,  // Reduced from 2
      baseStats: this.getEnemyStats(this.encounterData.enemyData.type),
      charges: {
        sword: 3,
        shield: 3,
        magic: 3
      }
    };
    
    // Launch combat system as parallel scene
    this.scene.launch('TurnBasedCombatSystem', {
      player: playerCombatData,
      enemy: enemyCombatData,
      depth: this.encounterData.depth,
      enemyType: this.encounterData.enemyData.type
    });
    
    // Listen for combat end
    const combatScene = this.scene.get('TurnBasedCombatSystem');
    combatScene.events.once('combat-end', (result: { winner: 'player' | 'enemy' }) => {
      this.onCombatEnd(result);
    });
  }
  
  private getEnemyStats(enemyType: string): CombatantData['baseStats'] {
    // Different enemy types have different stat distributions
    switch (enemyType) {
      case 'brute':
        return {
          sword: { attack: 3, shieldGain: 0 },   // Was 5
          shield: { attack: 0, shieldGain: 2 },  // Was 3
          magic: { attack: 1, shieldGain: 1 }    // Was 2
        };
      case 'hunter':
        return {
          sword: { attack: 2, shieldGain: 0 },   // Was 3
          shield: { attack: 0, shieldGain: 2 },  // Was 3
          magic: { attack: 2, shieldGain: 0 }    // Was 4
        };
      case 'wisp':
        return {
          sword: { attack: 1, shieldGain: 1 },   // Was 2
          shield: { attack: 0, shieldGain: 1 },  // Was 2
          magic: { attack: 3, shieldGain: 1 }    // Was 4
        };
      case 'hybrid':
        return {
          sword: { attack: 3, shieldGain: 0 },   // Was 4
          shield: { attack: 0, shieldGain: 3 },  // Was 4
          magic: { attack: 2, shieldGain: 1 }    // Was 3
        };
      default:
        return {
          sword: { attack: 2, shieldGain: 0 },   // Was 4
          shield: { attack: 0, shieldGain: 2 },  // Was 4
          magic: { attack: 1, shieldGain: 1 }    // Was 2
        };
    }
  }
  
  private onCombatEnd(result: { winner: 'player' | 'enemy' }): void {
    // Emit result first before stopping scenes
    this.events.emit('combat-resolved', {
      winner: result.winner,
      enemyId: this.encounterData.enemyData.id
    });
    
    // Small delay before stopping to ensure event is handled
    this.time.delayedCall(100, () => {
      // Stop combat scene
      this.scene.stop('TurnBasedCombatSystem');
      // Stop this scene
      this.scene.stop();
    });
  }
}