export type CardRarity = 'common' | 'uncommon' | 'rare';
export type ActionType = 'blade' | 'bulwark' | 'focus';

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  action: ActionType;
  attackBonus: number;
  shieldBonus: number;
  iconEmoji?: string;
}

export class UpgradeCardSystem {
  private static allCards: Map<string, UpgradeCard> = new Map();
  
  static {
    this.initializeCards();
  }
  
  private static initializeCards(): void {
    // Common Blade cards
    this.addCard({
      id: 'blade_sharp_1',
      name: 'Sharpened Edge',
      description: '+1 Attack to Blade',
      rarity: 'common',
      action: 'blade',
      attackBonus: 1,
      shieldBonus: 0,
      iconEmoji: '⚔️'
    });
    
    this.addCard({
      id: 'blade_heavy_1',
      name: 'Heavy Strike',
      description: '+2 Attack to Blade',
      rarity: 'uncommon',
      action: 'blade',
      attackBonus: 2,
      shieldBonus: 0,
      iconEmoji: '⚔️'
    });
    
    // Common Bulwark cards
    this.addCard({
      id: 'bulwark_reinforce_1',
      name: 'Reinforced Shield',
      description: '+1 Shield to Bulwark',
      rarity: 'common',
      action: 'bulwark',
      attackBonus: 0,
      shieldBonus: 1,
      iconEmoji: '🛡️'
    });
    
    this.addCard({
      id: 'bulwark_fortress_1',
      name: 'Fortress Stance',
      description: '+2 Shield to Bulwark',
      rarity: 'uncommon',
      action: 'bulwark',
      attackBonus: 0,
      shieldBonus: 2,
      iconEmoji: '🛡️'
    });
    
    // Common Focus cards
    this.addCard({
      id: 'focus_balanced_1',
      name: 'Balanced Energy',
      description: '+1 Attack, +1 Shield to Focus',
      rarity: 'common',
      action: 'focus',
      attackBonus: 1,
      shieldBonus: 1,
      iconEmoji: '✨'
    });
    
    this.addCard({
      id: 'focus_power_1',
      name: 'Power Surge',
      description: '+2 Attack to Focus',
      rarity: 'uncommon',
      action: 'focus',
      attackBonus: 2,
      shieldBonus: 0,
      iconEmoji: '✨'
    });
    
    // Rare cards
    this.addCard({
      id: 'blade_master_1',
      name: 'Blade Mastery',
      description: '+3 Attack to Blade',
      rarity: 'rare',
      action: 'blade',
      attackBonus: 3,
      shieldBonus: 0,
      iconEmoji: '⚔️'
    });
    
    this.addCard({
      id: 'bulwark_aegis_1',
      name: 'Aegis Protocol',
      description: '+3 Shield to Bulwark',
      rarity: 'rare',
      action: 'bulwark',
      attackBonus: 0,
      shieldBonus: 3,
      iconEmoji: '🛡️'
    });
    
    this.addCard({
      id: 'focus_harmony_1',
      name: 'Perfect Harmony',
      description: '+2 Attack, +2 Shield to Focus',
      rarity: 'rare',
      action: 'focus',
      attackBonus: 2,
      shieldBonus: 2,
      iconEmoji: '✨'
    });
    
    // Mixed cards
    this.addCard({
      id: 'blade_guard_1',
      name: 'Defensive Strikes',
      description: '+1 Attack, +1 Shield to Blade',
      rarity: 'uncommon',
      action: 'blade',
      attackBonus: 1,
      shieldBonus: 1,
      iconEmoji: '⚔️'
    });
    
    this.addCard({
      id: 'bulwark_spike_1',
      name: 'Spiked Shield',
      description: '+1 Attack, +1 Shield to Bulwark',
      rarity: 'uncommon',
      action: 'bulwark',
      attackBonus: 1,
      shieldBonus: 1,
      iconEmoji: '🛡️'
    });
  }
  
  private static addCard(card: UpgradeCard): void {
    this.allCards.set(card.id, card);
  }
  
  static getCard(id: string): UpgradeCard | undefined {
    return this.allCards.get(id);
  }
  
  static generateRandomCards(count: number, depth: number): UpgradeCard[] {
    const cards: UpgradeCard[] = [];
    const availableCards = Array.from(this.allCards.values());
    
    // Calculate rarity weights based on depth
    const rarityWeights = this.calculateRarityWeights(depth);
    
    for (let i = 0; i < count; i++) {
      const rarity = this.selectRarity(rarityWeights);
      const rarityCards = availableCards.filter(card => card.rarity === rarity);
      
      if (rarityCards.length > 0) {
        const selectedCard = rarityCards[Math.floor(Math.random() * rarityCards.length)];
        // Avoid duplicates in the same selection
        if (!cards.find(c => c.id === selectedCard.id)) {
          cards.push(selectedCard);
        } else {
          // Try again
          i--;
        }
      }
    }
    
    return cards;
  }
  
  private static calculateRarityWeights(depth: number): Map<CardRarity, number> {
    const weights = new Map<CardRarity, number>();
    
    // Base weights
    weights.set('common', 60);
    weights.set('uncommon', 30);
    weights.set('rare', 10);
    
    // Adjust based on depth (higher depth = better cards)
    const depthBonus = depth * 2;
    weights.set('common', Math.max(20, 60 - depthBonus));
    weights.set('uncommon', 30 + depthBonus * 0.5);
    weights.set('rare', 10 + depthBonus * 0.5);
    
    return weights;
  }
  
  private static selectRarity(weights: Map<CardRarity, number>): CardRarity {
    const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (const [rarity, weight] of weights) {
      random -= weight;
      if (random <= 0) {
        return rarity;
      }
    }
    
    return 'common'; // Fallback
  }
  
  static getCardColor(rarity: CardRarity): number {
    switch (rarity) {
      case 'common': return 0xffffff;
      case 'uncommon': return 0x00ff00;
      case 'rare': return 0x0099ff;
      default: return 0xffffff;
    }
  }
  
  static getCardBorderColor(rarity: CardRarity): number {
    switch (rarity) {
      case 'common': return 0x666666;
      case 'uncommon': return 0x00aa00;
      case 'rare': return 0x0066cc;
      default: return 0x666666;
    }
  }
}