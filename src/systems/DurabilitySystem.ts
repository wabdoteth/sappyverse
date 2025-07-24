export interface DurableItem {
  id: string;
  name: string;
  durability: number;
  maxDurability: number;
  type: 'weapon' | 'armor' | 'accessory';
  broken: boolean;
}

export interface DurabilityEvent {
  item: DurableItem;
  previousDurability: number;
  damage: number;
  reason: 'combat' | 'environmental' | 'special';
}

export class DurabilitySystem {
  private items: Map<string, DurableItem> = new Map();
  private events: Map<string, Array<(...args: any[]) => void>> = new Map();
  
  constructor() {
  }
  
  // Event emitter methods
  private emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
  
  public on(event: string, listener: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }
  
  public off(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  registerItem(item: DurableItem): void {
    this.items.set(item.id, item);
  }
  
  unregisterItem(itemId: string): void {
    this.items.delete(itemId);
  }
  
  getItem(itemId: string): DurableItem | undefined {
    return this.items.get(itemId);
  }
  
  damageItem(itemId: string, damage: number, reason: 'combat' | 'environmental' | 'special' = 'combat'): boolean {
    const item = this.items.get(itemId);
    if (!item || item.broken) return false;
    
    const previousDurability = item.durability;
    item.durability = Math.max(0, item.durability - damage);
    
    // Emit durability change event
    const event: DurabilityEvent = {
      item,
      previousDurability,
      damage,
      reason
    };
    this.emit('durability-changed', event);
    
    // Check if item broke
    if (item.durability <= 0) {
      item.broken = true;
      this.emit('item-broken', item);
    } else if (item.durability <= item.maxDurability * 0.2) {
      // Warn when durability is low (20% or less)
      this.emit('durability-low', item);
    }
    
    return true;
  }
  
  repairItem(itemId: string, amount?: number): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    
    const previousDurability = item.durability;
    
    if (amount === undefined) {
      // Full repair
      item.durability = item.maxDurability;
    } else {
      // Partial repair
      item.durability = Math.min(item.maxDurability, item.durability + amount);
    }
    
    if (item.broken && item.durability > 0) {
      item.broken = false;
      this.emit('item-repaired', item);
    }
    
    if (previousDurability !== item.durability) {
      this.emit('durability-changed', {
        item,
        previousDurability,
        damage: previousDurability - item.durability,
        reason: 'special'
      });
    }
    
    return true;
  }
  
  // Damage item based on usage type
  onWeaponUse(itemId: string, hitTarget: boolean): void {
    // Weapons take more damage when hitting, less when missing
    const damage = hitTarget ? 1 : 0.5;
    this.damageItem(itemId, damage, 'combat');
  }
  
  onArmorHit(itemId: string, incomingDamage: number): void {
    // Armor durability loss based on incoming damage
    const durabilityDamage = Math.max(1, Math.floor(incomingDamage / 10));
    this.damageItem(itemId, durabilityDamage, 'combat');
  }
  
  // Get durability percentage for UI display
  getDurabilityPercentage(itemId: string): number {
    const item = this.items.get(itemId);
    if (!item) return 0;
    return (item.durability / item.maxDurability) * 100;
  }
  
  // Get durability state for UI styling
  getDurabilityState(itemId: string): 'good' | 'warning' | 'critical' | 'broken' {
    const item = this.items.get(itemId);
    if (!item) return 'broken';
    if (item.broken) return 'broken';
    
    const percentage = this.getDurabilityPercentage(itemId);
    if (percentage > 50) return 'good';
    if (percentage > 20) return 'warning';
    return 'critical';
  }
  
  // Bulk operations for saving/loading
  getAllItems(): DurableItem[] {
    return Array.from(this.items.values());
  }
  
  loadItems(items: DurableItem[]): void {
    this.items.clear();
    items.forEach(item => this.registerItem(item));
  }
  
  clear(): void {
    this.items.clear();
    this.events.clear();
  }
}