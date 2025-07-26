import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type ColliderType = 'box' | 'cylinder' | 'floor' | 'ramp';

export interface ColliderData {
    type: ColliderType;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    isWalkable?: boolean;
    height?: number;
}

export interface CollisionSetup {
    modelPath: string;
    colliders: ColliderData[];
}

export interface ModelData {
    name: string;
    path: string;
    collisionSetupPath?: string;
    scale?: Vector3;
}