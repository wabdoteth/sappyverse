import Phaser from 'phaser';
import { RPSType, RPSLogic } from './RPSLogic';

export interface CombatEntity {
  id: string;
  hp: number;
  maxHp: number;
  damage: number;
  rpsType: RPSType;
  x: number;
  y: number;
  sprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
}

export interface DamageEvent {
  attacker: CombatEntity;
  target: CombatEntity;
  damage: number;
  multiplier: number;
  rpsAdvantage: 'advantage' | 'disadvantage' | 'neutral';
}

export class CombatSystem {
  private scene: Phaser.Scene;
  private entities: Map<string, CombatEntity> = new Map();
  private damageNumbers: Phaser.GameObjects.Group;
  private hitEffects: Phaser.GameObjects.Group;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.damageNumbers = scene.add.group({
      classType: Phaser.GameObjects.Text,
      maxSize: 20,
      runChildUpdate: true
    });
    
    this.hitEffects = scene.add.group({
      classType: Phaser.GameObjects.Graphics,
      maxSize: 30
    });
  }
  
  registerEntity(entity: CombatEntity): void {
    this.entities.set(entity.id, entity);
  }
  
  unregisterEntity(id: string): void {
    this.entities.delete(id);
  }
  
  attack(attackerId: string, targetId: string, attackType?: RPSType): DamageEvent | null {
    const attacker = this.entities.get(attackerId);
    const target = this.entities.get(targetId);
    
    if (!attacker || !target) {
      console.warn(`Combat: Invalid attacker (${attackerId}) or target (${targetId})`);
      return null;
    }
    
    // Use provided attack type or attacker's default type
    const actualAttackType = attackType || attacker.rpsType;
    
    // Calculate RPS multiplier
    const multiplier = RPSLogic.getMultiplier(actualAttackType, target.rpsType);
    const rpsAdvantage = RPSLogic.getAdvantage(actualAttackType, target.rpsType);
    
    // Calculate damage with variance
    const baseDamage = attacker.damage;
    const variance = 0.1; // 10% variance
    const randomMultiplier = 1 + (Math.random() * 2 - 1) * variance;
    const finalDamage = Math.floor(baseDamage * multiplier * randomMultiplier);
    
    // Apply damage
    target.hp = Math.max(0, target.hp - finalDamage);
    
    // Create visual feedback
    this.showDamageNumber(target, finalDamage, rpsAdvantage);
    this.showHitEffect(target, rpsAdvantage);
    
    // Emit damage event
    const damageEvent: DamageEvent = {
      attacker,
      target,
      damage: finalDamage,
      multiplier,
      rpsAdvantage
    };
    
    this.scene.events.emit('damage-dealt', damageEvent);
    
    // Check if target died
    if (target.hp <= 0) {
      this.scene.events.emit('entity-killed', target);
    }
    
    return damageEvent;
  }
  
  private showDamageNumber(target: CombatEntity, damage: number, advantage: 'advantage' | 'disadvantage' | 'neutral'): void {
    // Color based on advantage
    const colors = {
      advantage: '#00ff00',     // Green for advantage
      disadvantage: '#ff0000',  // Red for disadvantage
      neutral: '#ffffff'        // White for neutral
    };
    
    const text = this.damageNumbers.get() as Phaser.GameObjects.Text;
    if (!text) return;
    
    text.setText(damage.toString());
    text.setPosition(target.x, target.y - 30);
    text.setStyle({
      fontSize: '24px',
      fontFamily: 'Arial',
      color: colors[advantage],
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(1000);
    text.setActive(true);
    text.setVisible(true);
    
    // Animate the damage number
    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.damageNumbers.killAndHide(text);
      }
    });
  }
  
  private showHitEffect(target: CombatEntity, advantage: 'advantage' | 'disadvantage' | 'neutral'): void {
    const graphics = this.hitEffects.get() as Phaser.GameObjects.Graphics;
    if (!graphics) return;
    
    graphics.clear();
    graphics.setPosition(target.x, target.y);
    graphics.setActive(true);
    graphics.setVisible(true);
    
    // Different effects based on advantage
    if (advantage === 'advantage') {
      // Critical hit effect - star burst
      graphics.lineStyle(3, 0x00ff00, 1);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        graphics.beginPath();
        graphics.moveTo(0, 0);
        graphics.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
        graphics.strokePath();
      }
    } else if (advantage === 'disadvantage') {
      // Weak hit - small circle
      graphics.lineStyle(2, 0xff0000, 0.5);
      graphics.strokeCircle(0, 0, 15);
    } else {
      // Normal hit - impact burst
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.strokeCircle(0, 0, 20);
    }
    
    // Fade out effect
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.hitEffects.killAndHide(graphics);
        graphics.setScale(1);
      }
    });
  }
  
  // Check if an attack would hit based on position and range
  checkHit(attackerX: number, attackerY: number, targetX: number, targetY: number, range: number): boolean {
    const distance = Phaser.Math.Distance.Between(attackerX, attackerY, targetX, targetY);
    return distance <= range;
  }
  
  // Get all entities within range
  getEntitiesInRange(x: number, y: number, range: number, excludeId?: string): CombatEntity[] {
    const result: CombatEntity[] = [];
    
    this.entities.forEach((entity, id) => {
      if (id !== excludeId) {
        // Update entity position from sprite if available
        if (entity.sprite) {
          entity.x = entity.sprite.x;
          entity.y = entity.sprite.y;
        }
        
        const distance = Phaser.Math.Distance.Between(x, y, entity.x, entity.y);
        if (distance <= range) {
          result.push(entity);
        }
      }
    });
    
    console.log(`Found ${result.length} entities in range ${range} of (${x}, ${y})`);
    return result;
  }
  
  // Apply area damage
  areaAttack(attackerId: string, centerX: number, centerY: number, radius: number, attackType?: RPSType): DamageEvent[] {
    const attacker = this.entities.get(attackerId);
    if (!attacker) return [];
    
    const targets = this.getEntitiesInRange(centerX, centerY, radius, attackerId);
    const events: DamageEvent[] = [];
    
    targets.forEach(target => {
      const event = this.attack(attackerId, target.id, attackType);
      if (event) {
        events.push(event);
      }
    });
    
    return events;
  }
  
  destroy(): void {
    this.damageNumbers.destroy();
    this.hitEffects.destroy();
    this.entities.clear();
  }
}