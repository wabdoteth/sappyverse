export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  type: 'stat' | 'unlock' | 'facility';
  effect: (level: number) => void;
  requirement?: string; // ID of required upgrade
}

export interface MetaProgressionData {
  totalShards: number;
  spentShards: number;
  upgrades: Map<string, number>; // upgrade id -> level
  unlockedFeatures: Set<string>;
  statistics: {
    totalRuns: number;
    deepestDepth: number;
    totalEnemiesDefeated: number;
    totalShardsEarned: number;
  };
}

export class MetaProgression {
  private static instance: MetaProgression;
  private data: MetaProgressionData;
  private upgrades: Map<string, MetaUpgrade>;
  private readonly SAVE_KEY = 'sappyverse_meta_progression';
  
  private constructor() {
    this.upgrades = new Map();
    this.data = this.loadData();
    this.initializeUpgrades();
  }
  
  static getInstance(): MetaProgression {
    if (!MetaProgression.instance) {
      MetaProgression.instance = new MetaProgression();
    }
    return MetaProgression.instance;
  }
  
  private loadData(): MetaProgressionData {
    const saved = localStorage.getItem(this.SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        upgrades: new Map(parsed.upgrades),
        unlockedFeatures: new Set(parsed.unlockedFeatures)
      };
    }
    
    return {
      totalShards: 0,
      spentShards: 0,
      upgrades: new Map(),
      unlockedFeatures: new Set(),
      statistics: {
        totalRuns: 0,
        deepestDepth: 0,
        totalEnemiesDefeated: 0,
        totalShardsEarned: 0
      }
    };
  }
  
  private saveData(): void {
    const toSave = {
      ...this.data,
      upgrades: Array.from(this.data.upgrades.entries()),
      unlockedFeatures: Array.from(this.data.unlockedFeatures)
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(toSave));
  }
  
  private initializeUpgrades(): void {
    // Starting HP upgrades
    this.addUpgrade({
      id: 'hp_upgrade_1',
      name: 'Vitality I',
      description: '+1 Max HP per level',
      cost: 50,
      maxLevel: 5,
      currentLevel: this.data.upgrades.get('hp_upgrade_1') || 0,
      type: 'stat',
      effect: (level) => {
        // Applied when starting a new run
        console.log(`Max HP increased by ${level}`);
      }
    });
    
    // Starting Barrier upgrades
    this.addUpgrade({
      id: 'barrier_upgrade_1',
      name: 'Fortification I',
      description: '+1 Max Barrier per level',
      cost: 75,
      maxLevel: 3,
      currentLevel: this.data.upgrades.get('barrier_upgrade_1') || 0,
      type: 'stat',
      effect: (level) => {
        console.log(`Max Barrier increased by ${level}`);
      }
    });
    
    // Base damage upgrades
    this.addUpgrade({
      id: 'blade_upgrade_1',
      name: 'Sharpened Blades',
      description: '+1 Base Blade Attack per level',
      cost: 100,
      maxLevel: 3,
      currentLevel: this.data.upgrades.get('blade_upgrade_1') || 0,
      type: 'stat',
      effect: (level) => {
        console.log(`Blade attack increased by ${level}`);
      }
    });
    
    this.addUpgrade({
      id: 'bulwark_upgrade_1',
      name: 'Reinforced Shields',
      description: '+1 Base Bulwark Shield per level',
      cost: 100,
      maxLevel: 3,
      currentLevel: this.data.upgrades.get('bulwark_upgrade_1') || 0,
      type: 'stat',
      effect: (level) => {
        console.log(`Bulwark shield increased by ${level}`);
      }
    });
    
    this.addUpgrade({
      id: 'focus_upgrade_1',
      name: 'Enhanced Focus',
      description: '+1 Base Focus Attack per level',
      cost: 150,
      maxLevel: 2,
      currentLevel: this.data.upgrades.get('focus_upgrade_1') || 0,
      type: 'stat',
      effect: (level) => {
        console.log(`Focus attack increased by ${level}`);
      }
    });
    
    // Feature unlocks
    this.addUpgrade({
      id: 'unlock_smith',
      name: 'Unlock Blacksmith',
      description: 'Unlocks the Blacksmith in town for gear improvements',
      cost: 200,
      maxLevel: 1,
      currentLevel: this.data.upgrades.get('unlock_smith') || 0,
      type: 'unlock',
      effect: (level) => {
        if (level > 0) {
          this.data.unlockedFeatures.add('blacksmith');
        }
      }
    });
    
    this.addUpgrade({
      id: 'unlock_alchemist',
      name: 'Unlock Alchemist',
      description: 'Unlocks the Alchemist in town for consumables',
      cost: 150,
      maxLevel: 1,
      currentLevel: this.data.upgrades.get('unlock_alchemist') || 0,
      type: 'unlock',
      effect: (level) => {
        if (level > 0) {
          this.data.unlockedFeatures.add('alchemist');
        }
      }
    });
    
    // Town facilities
    this.addUpgrade({
      id: 'town_fountain',
      name: 'Town Fountain',
      description: 'Start each run with 10% HP regenerated',
      cost: 300,
      maxLevel: 1,
      currentLevel: this.data.upgrades.get('town_fountain') || 0,
      type: 'facility',
      effect: (level) => {
        console.log('Town fountain provides starting HP regen');
      }
    });
    
    // Advanced upgrades
    this.addUpgrade({
      id: 'hp_upgrade_2',
      name: 'Vitality II',
      description: '+2 Max HP per level',
      cost: 200,
      maxLevel: 3,
      currentLevel: this.data.upgrades.get('hp_upgrade_2') || 0,
      type: 'stat',
      effect: (level) => {
        console.log(`Max HP increased by ${level * 2}`);
      },
      requirement: 'hp_upgrade_1'
    });
  }
  
  private addUpgrade(upgrade: MetaUpgrade): void {
    this.upgrades.set(upgrade.id, upgrade);
  }
  
  getUpgrade(id: string): MetaUpgrade | undefined {
    return this.upgrades.get(id);
  }
  
  getAllUpgrades(): MetaUpgrade[] {
    return Array.from(this.upgrades.values());
  }
  
  getAvailableUpgrades(): MetaUpgrade[] {
    return this.getAllUpgrades().filter(upgrade => {
      // Check if requirements are met
      if (upgrade.requirement) {
        const reqLevel = this.data.upgrades.get(upgrade.requirement) || 0;
        const reqUpgrade = this.upgrades.get(upgrade.requirement);
        if (!reqUpgrade || reqLevel < reqUpgrade.maxLevel) {
          return false;
        }
      }
      // Check if not maxed
      return upgrade.currentLevel < upgrade.maxLevel;
    });
  }
  
  canAffordUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return false;
    
    const cost = this.getUpgradeCost(upgrade);
    return this.data.totalShards >= cost;
  }
  
  getUpgradeCost(upgrade: MetaUpgrade): number {
    // Cost increases with level
    return Math.floor(upgrade.cost * Math.pow(1.5, upgrade.currentLevel));
  }
  
  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) return false;
    
    const cost = this.getUpgradeCost(upgrade);
    if (!this.canAffordUpgrade(upgradeId)) return false;
    
    // Deduct cost
    this.data.totalShards -= cost;
    this.data.spentShards += cost;
    
    // Increase level
    upgrade.currentLevel++;
    this.data.upgrades.set(upgradeId, upgrade.currentLevel);
    
    // Apply effect
    upgrade.effect(upgrade.currentLevel);
    
    // Save
    this.saveData();
    
    return true;
  }
  
  addShards(amount: number): void {
    this.data.totalShards += amount;
    this.data.totalShardsEarned += amount;
    this.saveData();
  }
  
  recordRunStats(depth: number, enemiesDefeated: number): void {
    this.data.statistics.totalRuns++;
    this.data.statistics.deepestDepth = Math.max(this.data.statistics.deepestDepth, depth);
    this.data.statistics.totalEnemiesDefeated += enemiesDefeated;
    this.saveData();
  }
  
  getTotalShards(): number {
    return this.data.totalShards;
  }
  
  getStatistics(): typeof this.data.statistics {
    return { ...this.data.statistics };
  }
  
  isFeatureUnlocked(feature: string): boolean {
    return this.data.unlockedFeatures.has(feature);
  }
  
  // Get total stat bonuses for new run
  getStatBonuses(): {
    maxHp: number;
    maxBarrier: number;
    bladeAttack: number;
    bulwarkShield: number;
    focusAttack: number;
  } {
    const hp1 = this.data.upgrades.get('hp_upgrade_1') || 0;
    const hp2 = this.data.upgrades.get('hp_upgrade_2') || 0;
    const barrier = this.data.upgrades.get('barrier_upgrade_1') || 0;
    const blade = this.data.upgrades.get('blade_upgrade_1') || 0;
    const bulwark = this.data.upgrades.get('bulwark_upgrade_1') || 0;
    const focus = this.data.upgrades.get('focus_upgrade_1') || 0;
    
    return {
      maxHp: hp1 + (hp2 * 2),
      maxBarrier: barrier,
      bladeAttack: blade,
      bulwarkShield: bulwark,
      focusAttack: focus
    };
  }
}