export type RPSType = 'melee' | 'ranged' | 'magic';

export interface RPSMatchup {
  attacker: RPSType;
  defender: RPSType;
  multiplier: number;
}

export class RPSLogic {
  private static readonly ADVANTAGE_MULTIPLIER = 1.25;
  private static readonly DISADVANTAGE_MULTIPLIER = 0.8;
  private static readonly NEUTRAL_MULTIPLIER = 1.0;
  
  // Define the RPS triangle: Melee > Ranged > Magic > Melee
  private static readonly matchups: Map<string, number> = new Map([
    ['melee-ranged', 1.25],    // Melee beats Ranged
    ['ranged-magic', 1.25],    // Ranged beats Magic
    ['magic-melee', 1.25],     // Magic beats Melee
    ['ranged-melee', 0.8],     // Ranged loses to Melee
    ['magic-ranged', 0.8],     // Magic loses to Ranged
    ['melee-magic', 0.8],      // Melee loses to Magic
  ]);
  
  static getMultiplier(attacker: RPSType, defender: RPSType): number {
    if (attacker === defender) {
      return this.NEUTRAL_MULTIPLIER;
    }
    
    const key = `${attacker}-${defender}`;
    return this.matchups.get(key) || this.NEUTRAL_MULTIPLIER;
  }
  
  static getAdvantage(attacker: RPSType, defender: RPSType): 'advantage' | 'disadvantage' | 'neutral' {
    const multiplier = this.getMultiplier(attacker, defender);
    
    if (multiplier > 1) return 'advantage';
    if (multiplier < 1) return 'disadvantage';
    return 'neutral';
  }
  
  static getCounterType(type: RPSType): RPSType {
    // Returns the type that counters the given type
    switch (type) {
      case 'melee': return 'magic';
      case 'ranged': return 'melee';
      case 'magic': return 'ranged';
    }
  }
  
  static getWeakAgainst(type: RPSType): RPSType {
    // Returns the type this type is weak against
    switch (type) {
      case 'melee': return 'magic';
      case 'ranged': return 'melee';
      case 'magic': return 'ranged';
    }
  }
  
  static getStrongAgainst(type: RPSType): RPSType {
    // Returns the type this type is strong against
    switch (type) {
      case 'melee': return 'ranged';
      case 'ranged': return 'magic';
      case 'magic': return 'melee';
    }
  }
  
  // Get icon/color for UI representation
  static getTypeColor(type: RPSType): number {
    switch (type) {
      case 'melee': return 0xff6b6b;  // Red
      case 'ranged': return 0x4ecdc4; // Teal
      case 'magic': return 0xa06cd5;  // Purple
    }
  }
  
  static getTypeIcon(type: RPSType): string {
    switch (type) {
      case 'melee': return '⚔️';
      case 'ranged': return '🏹';
      case 'magic': return '✨';
    }
  }
  
  // For hybrid enemies that can switch types
  static getRandomType(): RPSType {
    const types: RPSType[] = ['melee', 'ranged', 'magic'];
    return types[Math.floor(Math.random() * types.length)];
  }
}