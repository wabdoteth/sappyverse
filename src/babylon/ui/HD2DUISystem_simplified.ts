import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Button } from '@babylonjs/gui/2D/controls/button';

export function showNPCDialogueSimple(
    scene: Scene, 
    text: string, 
    speaker: string
): void {
    // Get or create the GUI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    
    // Create main dialogue box
    const dialogueBox = new Rectangle("dialogueBox");
    dialogueBox.width = "100%";
    dialogueBox.height = "250px";
    dialogueBox.thickness = 3;
    dialogueBox.color = "#f4e4c1";
    dialogueBox.background = "#2a1f1a";
    dialogueBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    
    // Add speaker name directly
    const speakerText = new TextBlock();
    speakerText.text = speaker;
    speakerText.color = "#d4af37";
    speakerText.fontSize = 24;
    speakerText.fontFamily = "Courier New";
    speakerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    speakerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    speakerText.left = "40px";
    speakerText.top = "20px";
    dialogueBox.addControl(speakerText);
    
    // Add dialogue text directly
    const dialogueText = new TextBlock();
    dialogueText.text = text;
    dialogueText.color = "#f4e4c1";
    dialogueText.fontSize = 18;
    dialogueText.fontFamily = "Courier New";
    dialogueText.textWrapping = true;
    dialogueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    dialogueText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    dialogueText.left = "40px";
    dialogueText.top = "60px";
    dialogueText.width = "90%";
    dialogueBox.addControl(dialogueText);
    
    advancedTexture.addControl(dialogueBox);
}