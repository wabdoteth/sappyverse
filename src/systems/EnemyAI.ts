import { CombatAction } from './TurnBasedCombatSystem';

export interface AIPattern {
  name: string;
  description: string;
  getAction: (state: AIState) => CombatAction;
}

export interface AIState {
  enemyType: 'brute' | 'hunter' | 'wisp' | 'hybrid';
  enemyHp: number;
  enemyMaxHp: number;
  enemyBarrier: number;
  enemyCharges: { sword: number; shield: number; magic: number };
  playerHp: number;
  playerMaxHp: number;
  playerBarrier: number;
  playerLastAction?: CombatAction;
  turnNumber: number;
  depth: number;
}

export class EnemyAI {
  private static patterns: Map<string, AIPattern> = new Map();
  
  static {
    this.initializePatterns();
  }
  
  private static initializePatterns(): void {
    // Aggressive pattern - favors offense
    this.patterns.set('aggressive', {
      name: 'Aggressive',
      description: 'Prefers attacking, rarely defends',
      getAction: (state) => {
        const availableActions = this.getAvailableActions(state.enemyCharges);
        
        // Prefer sword if available
        if (availableActions.includes('sword')) {
          return 'sword';
        }
        
        // Use magic as second choice
        if (availableActions.includes('magic')) {
          return 'magic';
        }
        
        // Shield only if forced
        return availableActions[0];
      }
    });
    
    // Defensive pattern - favors protection
    this.patterns.set('defensive', {
      name: 'Defensive',
      description: 'Prioritizes building barrier',
      getAction: (state) => {
        const availableActions = this.getAvailableActions(state.enemyCharges);
        
        // Shield if low on barrier
        if (state.enemyBarrier < 10 && availableActions.includes('shield')) {
          return 'shield';
        }
        
        // Magic for balanced approach
        if (availableActions.includes('magic')) {
          return 'magic';
        }
        
        return availableActions[0];
      }
    });
    
    // Reactive pattern - counters player
    this.patterns.set('reactive', {
      name: 'Reactive',
      description: 'Tries to counter player actions',
      getAction: (state) => {
        const availableActions = this.getAvailableActions(state.enemyCharges);
        
        // Try to counter last player action
        if (state.playerLastAction) {
          const counter = this.getCounterAction(state.playerLastAction);
          if (availableActions.includes(counter)) {
            return counter;
          }
        }
        
        // Random if no counter available
        return availableActions[Math.floor(Math.random() * availableActions.length)];
      }
    });
    
    // Balanced pattern - mixed strategy
    this.patterns.set('balanced', {
      name: 'Balanced',
      description: 'Balanced offensive and defensive play',
      getAction: (state) => {
        const availableActions = this.getAvailableActions(state.enemyCharges);
        const hpPercent = state.enemyHp / state.enemyMaxHp;
        
        // Shield if very low HP
        if (hpPercent < 0.3 && availableActions.includes('shield')) {
          return 'shield';
        }
        
        // Sword if enemy is winning
        if (state.playerHp < state.enemyHp && availableActions.includes('sword')) {
          return 'sword';
        }
        
        // Magic for general use
        if (availableActions.includes('magic')) {
          return 'magic';
        }
        
        return availableActions[0];
      }
    });
    
    // Predictive pattern - tries to predict player
    this.patterns.set('predictive', {
      name: 'Predictive',
      description: 'Attempts to predict and counter player patterns',
      getAction: (state) => {
        const availableActions = this.getAvailableActions(state.enemyCharges);
        
        // Early game: assume player will attack
        if (state.turnNumber <= 2) {
          if (availableActions.includes('shield')) {
            return 'shield'; // Counter expected sword
          }
        }
        
        // If player is low HP, expect defensive play
        if (state.playerHp < state.playerMaxHp * 0.3) {
          if (availableActions.includes('magic')) {
            return 'magic'; // Counter expected shield
          }
        }
        
        // Default to reactive behavior
        if (state.playerLastAction) {
          const prediction = this.predictNextAction(state.playerLastAction, state.turnNumber);
          const counter = this.getCounterAction(prediction);
          if (availableActions.includes(counter)) {
            return counter;
          }
        }
        
        return availableActions[Math.floor(Math.random() * availableActions.length)];
      }
    });
  }
  
  private static getAvailableActions(charges: { sword: number; shield: number; magic: number }): CombatAction[] {
    const actions: CombatAction[] = [];
    if (charges.sword > 0) actions.push('sword');
    if (charges.shield > 0) actions.push('shield');
    if (charges.magic > 0) actions.push('magic');
    
    // If no charges, return all actions (will recharge)
    if (actions.length === 0) {
      return ['sword', 'shield', 'magic'];
    }
    
    return actions;
  }
  
  private static getCounterAction(action: CombatAction): CombatAction {
    // Returns the action that beats the given action
    switch (action) {
      case 'sword': return 'shield';  // Shield beats Sword
      case 'shield': return 'magic';  // Magic beats Shield
      case 'magic': return 'sword';  // Sword beats Magic
    }
  }
  
  private static predictNextAction(lastAction: CombatAction, turnNumber: number): CombatAction {
    // Simple prediction: players often rotate actions
    const rotation: Record<CombatAction, CombatAction> = {
      'sword': 'shield',
      'shield': 'magic',
      'magic': 'sword'
    };
    
    // Early game: expect rotation
    if (turnNumber < 5) {
      return rotation[lastAction];
    }
    
    // Later: expect repetition (players get predictable)
    return lastAction;
  }
  
  static getActionForEnemy(state: AIState): CombatAction {
    // Select pattern based on enemy type and depth
    let pattern: AIPattern;
    
    switch (state.enemyType) {
      case 'brute':
        pattern = this.patterns.get('aggressive')!;
        break;
      case 'hunter':
        pattern = this.patterns.get('reactive')!;
        break;
      case 'wisp':
        pattern = this.patterns.get('balanced')!;
        break;
      case 'hybrid':
        // Hybrid uses predictive AI at higher depths
        pattern = state.depth >= 5 
          ? this.patterns.get('predictive')! 
          : this.patterns.get('balanced')!;
        break;
      default:
        pattern = this.patterns.get('balanced')!;
    }
    
    // Add some randomness at lower depths
    if (state.depth < 3 && Math.random() < 0.3) {
      const availableActions = this.getAvailableActions(state.enemyCharges);
      return availableActions[Math.floor(Math.random() * availableActions.length)];
    }
    
    return pattern.getAction(state);
  }
  
  static getPatternName(enemyType: string, depth: number): string {
    switch (enemyType) {
      case 'brute': return 'Aggressive';
      case 'hunter': return 'Reactive';
      case 'wisp': return 'Balanced';
      case 'hybrid': return depth >= 5 ? 'Predictive' : 'Balanced';
      default: return 'Unknown';
    }
  }
}