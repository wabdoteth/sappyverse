// HD-2D Animated Sprite - For player and complex characters
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HD2DSprite, HD2DSpriteOptions } from './HD2DSprite';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'up_left' | 'up_right' | 'down_left' | 'down_right';
export type AnimationState = 'idle' | 'run' | 'attack1' | 'attack2';

export class HD2DAnimatedSprite extends HD2DSprite {
    private currentDirection: Direction = 'down';
    private currentState: AnimationState = 'idle';
    private directions: Direction[] = ['up', 'down', 'left', 'right'];
    
    constructor(name: string, scene: Scene, options: HD2DSpriteOptions) {
        super(name, scene, options);
        
        // Load animations will be called after construction
    }
    
    public loadCharacterAnimations(basePath: string): void {
        const states: AnimationState[] = ['idle', 'run', 'attack1', 'attack2'];
        
        // For each animation state
        states.forEach(state => {
            // For each direction
            this.directions.forEach(dir => {
                const animName = `${state}_${dir}`;
                const texturePath = `${basePath}/${state.toUpperCase()}/${state}_${dir}.png`;
                
                // Create a texture for this specific animation
                // In a full implementation, we'd use texture atlases
                // For now, we'll use the single direction approach
                
                // Register the animation
                this.addAnimation({
                    name: animName,
                    frames: this.generateFrameIndices(state),
                    frameRate: this.getFrameRate(state),
                    loop: this.shouldLoop(state)
                });
            });
        });
        
        // Note: First texture should be loaded before calling this method
        
        // Set initial animation state
        this.play('idle_down');
    }
    
    private generateFrameIndices(state: AnimationState): number[] {
        // Based on our sprite sheets, all animations have 8 frames
        return [0, 1, 2, 3, 4, 5, 6, 7];
    }
    
    private getFrameRate(state: AnimationState): number {
        switch (state) {
            case 'idle':
                return 8;
            case 'run':
                return 12;
            case 'attack1':
            case 'attack2':
                return 12;
            default:
                return 8;
        }
    }
    
    private shouldLoop(state: AnimationState): boolean {
        return state === 'idle' || state === 'run';
    }
    
    public setMoving(isMoving: boolean, direction?: Direction): void {
        if (direction && this.directions.includes(direction)) {
            this.currentDirection = direction;
        }
        
        if (isMoving) {
            this.setState('run');
        } else {
            this.setState('idle');
        }
    }
    
    public attack(type: 1 | 2 = 1): void {
        const attackState: AnimationState = type === 1 ? 'attack1' : 'attack2';
        this.setState(attackState);
        
        // After attack animation completes, return to idle
        const anim = this.animations.get(`${attackState}_${this.currentDirection}`);
        if (anim) {
            const duration = anim.frames.length / anim.frameRate * 1000;
            setTimeout(() => {
                if (this.currentState === attackState) {
                    this.setState('idle');
                }
            }, duration);
        }
    }
    
    private setState(state: AnimationState): void {
        if (this.currentState === state) return;
        
        this.currentState = state;
        const animName = `${state}_${this.currentDirection}`;
        
        // Load the appropriate texture for this animation
        // In a real implementation, we'd switch texture coordinates in an atlas
        const texturePath = `/assets/sprites/player/${state.toUpperCase()}/${state}_${this.currentDirection}.png`;
        this.loadSpriteSheet(texturePath).then(() => {
            this.play(animName);
        }).catch(err => {
            console.error(`Failed to load animation texture: ${texturePath}`, err);
        });
    }
    
    public faceDirection(target: Vector3): void {
        const dx = target.x - this.mesh.position.x;
        const dz = target.z - this.mesh.position.z;
        
        const angle = Math.atan2(dx, dz);
        const degreeAngle = (angle * 180 / Math.PI + 360) % 360;
        
        // Determine direction based on angle
        if (degreeAngle >= 315 || degreeAngle < 45) {
            this.currentDirection = 'up';
        } else if (degreeAngle >= 45 && degreeAngle < 135) {
            this.currentDirection = 'right';
        } else if (degreeAngle >= 135 && degreeAngle < 225) {
            this.currentDirection = 'down';
        } else {
            this.currentDirection = 'left';
        }
        
        // Update animation if needed
        if (this.currentState && this.isPlaying) {
            this.setState(this.currentState);
        }
    }
    
    public get position(): Vector3 {
        return this.mesh.position;
    }
}