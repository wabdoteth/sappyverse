import { DurableItem } from './DurabilitySystem';
import { RPSType } from './RPSLogic';

export interface ItemStats {
  damage?: number;
  defense?: number;
  speed?: number;
  critRate?: number;
  elementalDamage?: { type: string; amount: number };
}

export interface Item extends Partial<DurableItem> {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'accessory' | 'material';
  subType?: 'helm' | 'chest' | 'boots' | 'ring' | 'charm';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stackable: boolean;
  maxStack: number;
  quantity: number;
  equipped: boolean;
  slot?: string;
  stats?: ItemStats;
  rpsType?: RPSType; // For weapons
  icon?: string;
  value: number; // Base sell/buy value
  modifiers?: string[]; // Special properties
}

export interface InventorySlot {
  item: Item | null;
  quantity: number;
  locked: boolean;
}

export class InventorySystem {
  private events: Map<string, Array<(...args: any[]) => void>> = new Map();
  private inventory: InventorySlot[] = [];
  private equipped: Map<string, Item> = new Map();
  private maxSlots: number;
  
  // Equipment slots
  private readonly EQUIPMENT_SLOTS = [
    'weapon',
    'helm',
    'chest',
    'boots',
    'ring1',
    'ring2',
    'charm'
  ];
  
  constructor(maxSlots: number = 30) {
    this.maxSlots = maxSlots;
    this.initializeInventory();
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
  
  private initializeInventory(): void {
    for (let i = 0; i < this.maxSlots; i++) {
      this.inventory.push({
        item: null,
        quantity: 0,
        locked: false
      });
    }
  }
  
  // Add item to inventory
  addItem(item: Item, quantity: number = 1): boolean {
    // If stackable, try to add to existing stack
    if (item.stackable) {
      const existingSlot = this.inventory.find(slot => 
        slot.item?.id === item.id && 
        slot.quantity < item.maxStack
      );
      
      if (existingSlot && existingSlot.item) {
        const spaceInStack = existingSlot.item.maxStack - existingSlot.quantity;
        const toAdd = Math.min(quantity, spaceInStack);
        existingSlot.quantity += toAdd;
        
        this.emit('item-added', { item: existingSlot.item, quantity: toAdd });
        
        // If we couldn't add all, try to add remainder to new slot
        if (toAdd < quantity) {
          return this.addItem(item, quantity - toAdd);
        }
        return true;
      }
    }
    
    // Find empty slot
    const emptySlot = this.inventory.find(slot => slot.item === null);
    if (!emptySlot) {
      this.emit('inventory-full', { item, quantity });
      return false;
    }
    
    // Add to empty slot
    emptySlot.item = { ...item }; // Clone the item
    emptySlot.quantity = Math.min(quantity, item.maxStack);
    
    this.emit('item-added', { item: emptySlot.item, quantity: emptySlot.quantity });
    
    // If we couldn't add all (stack limit), try remainder
    if (item.stackable && quantity > item.maxStack) {
      return this.addItem(item, quantity - item.maxStack);
    }
    
    return true;
  }
  
  // Remove item from inventory
  removeItem(itemId: string, quantity: number = 1): boolean {
    const slot = this.inventory.find(s => s.item?.id === itemId);
    if (!slot || !slot.item) return false;
    
    const removed = Math.min(quantity, slot.quantity);
    slot.quantity -= removed;
    
    if (slot.quantity <= 0) {
      slot.item = null;
      slot.quantity = 0;
    }
    
    this.emit('item-removed', { itemId, quantity: removed });
    return true;
  }
  
  // Equip item
  equipItem(itemId: string): boolean {
    const slot = this.inventory.find(s => s.item?.id === itemId);
    if (!slot || !slot.item) return false;
    
    const item = slot.item;
    
    // Check if item is equippable
    if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'accessory') {
      return false;
    }
    
    // Determine equipment slot
    let equipSlot: string;
    if (item.type === 'weapon') {
      equipSlot = 'weapon';
    } else if (item.type === 'armor' && item.subType) {
      equipSlot = item.subType;
    } else if (item.type === 'accessory') {
      // Handle multiple ring slots
      if (item.subType === 'ring') {
        equipSlot = this.equipped.has('ring1') ? 'ring2' : 'ring1';
      } else {
        equipSlot = item.subType || 'charm';
      }
    } else {
      return false;
    }
    
    // Unequip current item in slot if any
    const currentEquipped = this.equipped.get(equipSlot);
    if (currentEquipped) {
      this.unequipItem(currentEquipped.id);
    }
    
    // Equip the item
    item.equipped = true;
    item.slot = equipSlot;
    this.equipped.set(equipSlot, item);
    
    this.emit('item-equipped', { item, slot: equipSlot });
    return true;
  }
  
  // Unequip item
  unequipItem(itemId: string): boolean {
    let unequipped = false;
    
    this.equipped.forEach((item, slot) => {
      if (item.id === itemId) {
        item.equipped = false;
        item.slot = undefined;
        this.equipped.delete(slot);
        this.emit('item-unequipped', { item, slot });
        unequipped = true;
      }
    });
    
    return unequipped;
  }
  
  // Get equipped items
  getEquipped(): Map<string, Item> {
    return new Map(this.equipped);
  }
  
  // Get item by ID
  getItem(itemId: string): Item | null {
    const slot = this.inventory.find(s => s.item?.id === itemId);
    return slot?.item || null;
  }
  
  // Get all items
  getAllItems(): Item[] {
    return this.inventory
      .filter(slot => slot.item !== null)
      .map(slot => slot.item!);
  }
  
  // Check if has item
  hasItem(itemId: string, quantity: number = 1): boolean {
    const totalQuantity = this.inventory
      .filter(slot => slot.item?.id === itemId)
      .reduce((sum, slot) => sum + slot.quantity, 0);
    
    return totalQuantity >= quantity;
  }
  
  // Use consumable
  useConsumable(itemId: string): boolean {
    const item = this.getItem(itemId);
    if (!item || item.type !== 'consumable') return false;
    
    this.emit('consumable-used', item);
    return this.removeItem(itemId, 1);
  }
  
  // Sort inventory
  sortInventory(sortBy: 'name' | 'type' | 'rarity' | 'value' = 'type'): void {
    const items = this.getAllItems();
    
    // Clear inventory
    this.inventory.forEach(slot => {
      slot.item = null;
      slot.quantity = 0;
    });
    
    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        case 'value':
          return b.value - a.value;
        default:
          return 0;
      }
    });
    
    // Re-add items
    items.forEach(item => {
      this.addItem(item, item.quantity);
    });
    
    this.emit('inventory-sorted', sortBy);
  }
  
  // Get inventory state for saving
  getState(): {
    inventory: InventorySlot[];
    equipped: Array<[string, Item]>;
  } {
    return {
      inventory: this.inventory.map(slot => ({
        item: slot.item ? { ...slot.item } : null,
        quantity: slot.quantity,
        locked: slot.locked
      })),
      equipped: Array.from(this.equipped.entries())
    };
  }
  
  // Load inventory state
  loadState(state: {
    inventory: InventorySlot[];
    equipped: Array<[string, Item]>;
  }): void {
    this.inventory = state.inventory;
    this.equipped = new Map(state.equipped);
    this.emit('inventory-loaded');
  }
  
  // Get empty slot count
  getEmptySlots(): number {
    return this.inventory.filter(slot => slot.item === null).length;
  }
  
  // Expand inventory
  expandInventory(additionalSlots: number): void {
    for (let i = 0; i < additionalSlots; i++) {
      this.inventory.push({
        item: null,
        quantity: 0,
        locked: false
      });
    }
    this.maxSlots += additionalSlots;
    this.emit('inventory-expanded', additionalSlots);
  }
  
  clear(): void {
    this.inventory.forEach(slot => {
      slot.item = null;
      slot.quantity = 0;
    });
    this.equipped.clear();
    this.events.clear();
  }
}