import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents';
import { HD2DAnimatedSprite } from '../HD2DAnimatedSprite';
import { NPCInteractionManager } from './NPCInteractionManager';
import { HD2DUISystem } from '../ui/HD2DUISystem';

export interface PlayerControlConfig {
    moveSpeed: number;
    runSpeed: number;
    enableCollisions: boolean;
}

export class PlayerControlManager {
    private scene: Scene;
    private player: HD2DAnimatedSprite;
    private uiSystem: HD2DUISystem;
    private npcManager: NPCInteractionManager;
    
    // Movement state
    private moveVector: Vector3 = Vector3.Zero();
    private isRunning: boolean = false;
    private currentDirection: string = 'down';
    
    // Control configuration
    private config: PlayerControlConfig = {
        moveSpeed: 0.1,
        runSpeed: 0.2,
        enableCollisions: true
    };
    
    // Collision boxes
    private collisionBoxes: Array<{min: Vector3, max: Vector3}> = [];
    
    // Key states
    private keys: { [key: string]: boolean } = {};
    
    constructor(scene: Scene, uiSystem: HD2DUISystem, npcManager: NPCInteractionManager) {
        this.scene = scene;
        this.uiSystem = uiSystem;
        this.npcManager = npcManager;
        this.setupControls();
    }
    
    public setPlayer(player: HD2DAnimatedSprite): void {
        this.player = player;
    }
    
    public setCollisionBoxes(boxes: Array<{min: Vector3, max: Vector3}>): void {
        this.collisionBoxes = boxes;
    }
    
    private setupControls(): void {
        this.scene.actionManager.registerAction({
            trigger: KeyboardEventTypes.KEYDOWN,
            action: (evt) => {
                if (!evt.sourceEvent) return;
                
                const key = evt.sourceEvent.key.toLowerCase();
                this.keys[key] = true;
                
                // Handle special keys
                switch (key) {
                    case 'shift':
                        this.isRunning = true;
                        break;
                    case 'm':
                        this.showInteractionMenu();
                        break;
                    case 'e':
                        this.npcManager.handleInteraction();
                        break;
                    case 'enter':
                    case ' ':
                        this.uiSystem.hideDialogue();
                        break;
                }
            }
        });
        
        this.scene.actionManager.registerAction({
            trigger: KeyboardEventTypes.KEYUP,
            action: (evt) => {
                if (!evt.sourceEvent) return;
                
                const key = evt.sourceEvent.key.toLowerCase();
                this.keys[key] = false;
                
                if (key === 'shift') {
                    this.isRunning = false;
                }
            }
        });
    }
    
    public update(): void {
        if (!this.player) return;
        
        // Calculate movement vector
        this.moveVector = Vector3.Zero();
        
        if (this.keys['w'] || this.keys['arrowup']) {
            this.moveVector.z = 1;
            this.currentDirection = 'up';
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.moveVector.z = -1;
            this.currentDirection = 'down';
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.moveVector.x = -1;
            this.currentDirection = 'left';
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.moveVector.x = 1;
            this.currentDirection = 'right';
        }
        
        // Apply movement
        if (this.moveVector.length() > 0) {
            this.moveVector.normalize();
            const speed = this.isRunning ? this.config.runSpeed : this.config.moveSpeed;
            
            const newPosition = this.player.position.add(this.moveVector.scale(speed));
            
            // Check collisions
            if (!this.config.enableCollisions || !this.checkCollision(newPosition)) {
                this.player.setPosition(newPosition);
            }
            
            // Update animation
            this.player.setMoving(true, this.currentDirection);
        } else {
            this.player.setMoving(false, this.currentDirection);
        }
    }
    
    private checkCollision(position: Vector3): boolean {
        const playerBounds = {
            min: new Vector3(position.x - 0.3, 0, position.z - 0.3),
            max: new Vector3(position.x + 0.3, 2, position.z + 0.3)
        };
        
        for (const box of this.collisionBoxes) {
            if (this.boxesIntersect(playerBounds, box)) {
                return true;
            }
        }
        
        return false;
    }
    
    private boxesIntersect(a: {min: Vector3, max: Vector3}, b: {min: Vector3, max: Vector3}): boolean {
        return !(a.max.x < b.min.x || a.min.x > b.max.x ||
                a.max.y < b.min.y || a.min.y > b.max.y ||
                a.max.z < b.min.z || a.min.z > b.max.z);
    }
    
    private showInteractionMenu(): void {
        this.uiSystem.showMenu("Actions", [
            "Talk to NPC",
            "Check Status", 
            "Settings",
            "Cancel"
        ], (index) => {
            switch (index) {
                case 0:
                    this.npcManager.handleInteraction();
                    break;
                case 1:
                    this.uiSystem.showDialogue("HP: 75/100 | MP: 50/100 | Level: 5", "Status");
                    break;
                case 2:
                    this.showSettingsMenu();
                    break;
            }
        });
    }
    
    private showSettingsMenu(): void {
        // This should be handled by a settings manager
        // For now, just show a placeholder
        this.uiSystem.showDialogue("Settings menu - Press M to return", "System");
    }
    
    public setMoveSpeed(speed: number): void {
        this.config.moveSpeed = speed;
    }
    
    public setRunSpeed(speed: number): void {
        this.config.runSpeed = speed;
    }
    
    public setCollisionsEnabled(enabled: boolean): void {
        this.config.enableCollisions = enabled;
    }
    
    public getConfig(): PlayerControlConfig {
        return { ...this.config };
    }
}