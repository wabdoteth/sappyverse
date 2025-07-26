import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HD2DAnimatedSprite } from '../HD2DAnimatedSprite';
import { HD2DSprite } from '../HD2DSprite';
import { HD2DUISystem } from '../ui/HD2DUISystem';

export interface NPCDialogue {
    text: string;
    speaker: string;
    portrait?: string;
    options?: string[];
    responses?: string[];
}

export class NPCInteractionManager {
    private scene: Scene;
    private uiSystem: HD2DUISystem;
    private player: HD2DAnimatedSprite;
    private npcs: HD2DSprite[] = [];
    private nearestNPC: HD2DSprite | null = null;
    private interactionDistance: number = 3;
    private npcPortraits: { [key: string]: string } = {};
    
    // NPC dialogue database
    private dialogues: { [key: string]: string[] } = {
        'blacksmith': [
            "Welcome to my forge! I craft the finest weapons in town.",
            "The secret is in the HD-2D rendering - it makes everything look better!"
        ],
        'merchant': [
            "Looking to buy something? I've got the best wares in the kingdom!",
            "Did you notice how the lighting changes throughout the day?"
        ],
        'innkeeper': [
            "Welcome to the Dancing Dragon Inn! Care for a room?",
            "The fountain outside has been flowing for centuries, they say."
        ],
        'scholar': [
            "Ah, a fellow seeker of knowledge! Have you studied the HD-2D arts?",
            "This rendering technique combines 2D sprites with 3D environments beautifully."
        ],
        'guard': [
            "Halt! Who goes... oh, it's you. Carry on, citizen.",
            "Stay safe out there. The fog can get quite thick at night."
        ]
    };
    
    // Quest dialogues with choices
    private questDialogues: { [key: string]: NPCDialogue } = {
        'blacksmith': {
            text: "I need some rare ore from the mountains to forge a legendary sword. Will you help me?",
            speaker: "Blacksmith",
            options: ["I'll help you find it", "Maybe later", "Tell me more"],
            responses: [
                "Excellent! The ore glows with a blue light. You'll find it in the Crystal Caves.",
                "I understand. Come back when you're ready for adventure.",
                "It's called Starsteel, and it only appears during a full moon. Very rare indeed!"
            ]
        },
        'merchant': {
            text: "My caravan was attacked by bandits! They took my precious spices. Can you retrieve them?",
            speaker: "Merchant", 
            options: ["I'll get them back", "What's in it for me?", "Where did they go?"],
            responses: [
                "Thank you, brave adventurer! They headed north toward the Dark Forest.",
                "I'll reward you handsomely - 500 gold pieces and a rare enchanted ring!",
                "They have a hideout in the ruins near the old watchtower. Be careful!"
            ]
        }
    };
    
    constructor(scene: Scene, uiSystem: HD2DUISystem) {
        this.scene = scene;
        this.uiSystem = uiSystem;
    }
    
    public setPlayer(player: HD2DAnimatedSprite): void {
        this.player = player;
    }
    
    public setNPCs(npcs: HD2DSprite[]): void {
        this.npcs = npcs;
    }
    
    public setNPCPortraits(portraits: { [key: string]: string }): void {
        this.npcPortraits = portraits;
    }
    
    public update(): void {
        this.updateNearestNPC();
        this.updateSpeechBubbles();
    }
    
    private updateNearestNPC(): void {
        if (!this.player) return;
        
        let nearestNPC: HD2DSprite | null = null;
        let nearestDistance = this.interactionDistance;
        
        const playerPos = this.player.position;
        
        for (const npc of this.npcs) {
            const distance = Vector3.Distance(playerPos, npc.mesh.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestNPC = npc;
            }
        }
        
        this.nearestNPC = nearestNPC;
    }
    
    private updateSpeechBubbles(): void {
        // Update speech bubble visibility
        for (const npc of this.npcs) {
            const distance = Vector3.Distance(this.player.position, npc.mesh.position);
            npc.setSpeechBubbleVisible(distance < this.interactionDistance);
        }
    }
    
    public handleInteraction(): void {
        if (!this.nearestNPC) {
            this.talkToRandomNPC();
        } else {
            this.interactWithNPC(this.nearestNPC);
        }
    }
    
    private talkToRandomNPC(): void {
        const randomNPC = this.npcs[Math.floor(Math.random() * this.npcs.length)];
        if (randomNPC) {
            const dialogue = this.getRandomDialogue(randomNPC.name);
            const speakerName = this.formatNPCName(randomNPC.name);
            this.uiSystem.showDialogue(dialogue, speakerName);
        }
    }
    
    private interactWithNPC(npc: HD2DSprite): void {
        // Hide any existing dialogue first
        this.uiSystem.hideDialogue();
        
        // Get NPC dialogue based on name
        const npcMeshName = npc.mesh.name;
        const npcName = npcMeshName.replace('_sprite', '');
        const dialogue = this.getQuestDialogue(npcName);
        
        // Get sprite URL from mesh if it has a texture
        let spriteUrl: string | undefined;
        const material = npc.mesh.material;
        if (material && 'diffuseTexture' in material && material.diffuseTexture) {
            spriteUrl = material.diffuseTexture.url;
        }
        
        // Check if NPC is facing left (negative scale.x means facing left)
        const shouldFlipPortrait = npc.mesh.scaling.x < 0;
        
        // Show dialogue with options
        this.uiSystem.showDialogue(
            dialogue.text,
            dialogue.speaker,
            spriteUrl || dialogue.portrait,
            dialogue.options,
            (optionIndex) => {
                // Show response dialogue
                this.uiSystem.showDialogue(
                    dialogue.responses![optionIndex],
                    dialogue.speaker,
                    spriteUrl || dialogue.portrait,
                    [],
                    undefined,
                    shouldFlipPortrait
                );
            },
            shouldFlipPortrait
        );
    }
    
    private getRandomDialogue(npcName: string): string {
        const npcDialogue = this.dialogues[npcName] || ["Hello there!"];
        return npcDialogue[Math.floor(Math.random() * npcDialogue.length)];
    }
    
    private getQuestDialogue(npcName: string): NPCDialogue {
        return this.questDialogues[npcName] || {
            text: this.getRandomDialogue(npcName),
            speaker: this.formatNPCName(npcName),
            portrait: this.npcPortraits[npcName]
        };
    }
    
    private formatNPCName(name: string): string {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    public getNearestNPC(): HD2DSprite | null {
        return this.nearestNPC;
    }
    
    public isNearNPC(): boolean {
        return this.nearestNPC !== null;
    }
}