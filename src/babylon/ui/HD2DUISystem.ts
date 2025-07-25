import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Container } from '@babylonjs/gui/2D/controls/container';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Image } from '@babylonjs/gui/2D/controls/image';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Grid } from '@babylonjs/gui/2D/controls/grid';

// HD-2D UI Style Configuration
const HD2D_UI_STYLE = {
    // Colors
    primaryColor: "#2a1f1a",      // Dark brown
    secondaryColor: "#f4e4c1",    // Cream/parchment
    accentColor: "#d4af37",       // Gold
    textColor: "#f4e4c1",         // Light text
    shadowColor: "rgba(0,0,0,0.8)",
    
    // Fonts
    primaryFont: "Courier New, monospace",  // Pixel-perfect font
    fontSize: "16px",
    
    // Borders and spacing
    borderWidth: 3,
    cornerRadius: 0,  // Sharp corners for pixel art
    padding: "12px",
    
    // Effects
    textShadowOffset: 2,
    boxShadowOffset: 4
};

export class HD2DUISystem {
    private scene: Scene;
    private advancedTexture: AdvancedDynamicTexture;
    private activeDialogue: Rectangle | null = null;
    private activeMenu: Rectangle | null = null;
    
    constructor(scene: Scene) {
        this.scene = scene;
        
        // Create fullscreen UI with pixel-perfect rendering
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HD2DUI", true, scene);
        this.advancedTexture.renderAtIdealSize = false; // Disable automatic scaling
        this.advancedTexture.idealWidth = 1920;
        this.advancedTexture.idealHeight = 1080;
        this.advancedTexture.useSmallestIdeal = false;
    }
    
    // Create a dialogue box with HD-2D styling
    public showDialogue(
        text: string, 
        speaker?: string, 
        portrait?: string,
        options?: string[],
        onOptionSelected?: (index: number) => void,
        shouldFlipPortrait?: boolean
    ): void {
        this.hideDialogue();
        
        // Main dialogue container
        const dialogueBox = new Rectangle("dialogueBox");
        dialogueBox.width = "800px";
        dialogueBox.height = options && options.length > 0 ? "280px" : "200px";
        dialogueBox.thickness = HD2D_UI_STYLE.borderWidth;
        dialogueBox.color = HD2D_UI_STYLE.secondaryColor;
        dialogueBox.background = HD2D_UI_STYLE.primaryColor;
        dialogueBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        dialogueBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        dialogueBox.paddingBottom = "40px";
        
        // Add decorative corners
        this.addDecorativeCorners(dialogueBox);
        
        // Inner container for content
        const innerContainer = new Container();
        innerContainer.width = "100%";
        innerContainer.height = "100%";
        dialogueBox.addControl(innerContainer);
        
        // Portrait frame if provided
        if (portrait) {
            const portraitFrame = this.createPortraitFrame(portrait, shouldFlipPortrait);
            portraitFrame.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            portraitFrame.left = "20px";
            innerContainer.addControl(portraitFrame);
        }
        
        // Text container
        const textContainer = new Container();
        textContainer.width = portrait ? "580px" : "760px";
        textContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        textContainer.paddingRight = "20px";
        innerContainer.addControl(textContainer);
        
        // Speaker name if provided
        if (speaker) {
            const speakerLabel = new TextBlock();
            speakerLabel.text = speaker;
            speakerLabel.color = HD2D_UI_STYLE.accentColor;
            speakerLabel.fontSize = 20;
            speakerLabel.fontFamily = HD2D_UI_STYLE.primaryFont;
            speakerLabel.fontWeight = "bold";
            speakerLabel.height = "30px";
            speakerLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            speakerLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            speakerLabel.top = "15px";
            speakerLabel.shadowOffsetX = HD2D_UI_STYLE.textShadowOffset;
            speakerLabel.shadowOffsetY = HD2D_UI_STYLE.textShadowOffset;
            speakerLabel.shadowColor = HD2D_UI_STYLE.shadowColor;
            textContainer.addControl(speakerLabel);
        }
        
        // Main dialogue text
        const dialogueText = new TextBlock();
        dialogueText.text = text;
        dialogueText.color = HD2D_UI_STYLE.textColor;
        dialogueText.fontSize = 16;
        dialogueText.fontFamily = HD2D_UI_STYLE.primaryFont;
        dialogueText.textWrapping = true;
        dialogueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dialogueText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        dialogueText.paddingLeft = portrait ? "10px" : "20px";
        dialogueText.paddingRight = "20px";
        dialogueText.paddingTop = speaker ? "45px" : "20px";
        dialogueText.lineSpacing = "4px";
        dialogueText.shadowOffsetX = HD2D_UI_STYLE.textShadowOffset;
        dialogueText.shadowOffsetY = HD2D_UI_STYLE.textShadowOffset;
        dialogueText.shadowColor = HD2D_UI_STYLE.shadowColor;
        textContainer.addControl(dialogueText);
        
        // Options or continue indicator
        if (options && options.length > 0) {
            // Create options container in a vertical stack
            const optionsContainer = new StackPanel();
            optionsContainer.width = portrait ? "560px" : "760px";
            optionsContainer.height = "90px";
            optionsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            optionsContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            optionsContainer.paddingBottom = "15px";
            optionsContainer.paddingRight = "20px";
            optionsContainer.isVertical = true;
            optionsContainer.spacing = 8; // Vertical spacing between buttons
            textContainer.addControl(optionsContainer);
            
            options.forEach((option, index) => {
                const optionButton = Button.CreateSimpleButton(`option${index}`, `  ${option}`); // Add indent
                optionButton.width = "100%"; // Full width of container
                optionButton.height = "26px";
                optionButton.color = HD2D_UI_STYLE.textColor;
                optionButton.background = "transparent";
                optionButton.thickness = 0;
                optionButton.fontSize = 15;
                optionButton.fontFamily = HD2D_UI_STYLE.primaryFont;
                optionButton.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                
                // Add hover effect with arrow indicator
                let arrow = new TextBlock();
                arrow.text = "▶ ";
                arrow.color = HD2D_UI_STYLE.accentColor;
                arrow.fontSize = 14;
                arrow.isVisible = false;
                
                optionButton.onPointerEnterObservable.add(() => {
                    optionButton.text = `▶ ${option}`;
                    optionButton.color = HD2D_UI_STYLE.accentColor;
                });
                optionButton.onPointerOutObservable.add(() => {
                    optionButton.text = `  ${option}`;
                    optionButton.color = HD2D_UI_STYLE.textColor;
                });
                
                optionButton.onPointerClickObservable.add(() => {
                    if (onOptionSelected) {
                        onOptionSelected(index);
                    }
                    this.hideDialogue();
                });
                
                optionsContainer.addControl(optionButton);
            });
        } else {
            // Continue indicator for non-choice dialogues
            const continueIndicator = this.createContinueIndicator();
            continueIndicator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            continueIndicator.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            continueIndicator.right = "20px";
            continueIndicator.top = "-20px";
            dialogueBox.addControl(continueIndicator);
        }
        
        this.advancedTexture.addControl(dialogueBox);
        this.activeDialogue = dialogueBox;
        
        // Animate in
        this.animateIn(dialogueBox);
    }
    
    public hideDialogue(): void {
        if (this.activeDialogue) {
            this.advancedTexture.removeControl(this.activeDialogue);
            this.activeDialogue = null;
        }
    }
    
    // Create a menu with HD-2D styling
    public showMenu(title: string, options: string[], onSelect: (index: number) => void): void {
        this.hideMenu();
        
        const menuBox = new Rectangle("menuBox");
        menuBox.width = "300px";
        menuBox.adaptHeightToChildren = true;
        menuBox.thickness = HD2D_UI_STYLE.borderWidth;
        menuBox.color = HD2D_UI_STYLE.secondaryColor;
        menuBox.background = HD2D_UI_STYLE.primaryColor;
        menuBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        menuBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        menuBox.paddingRight = "40px";
        
        // Add decorative corners
        this.addDecorativeCorners(menuBox);
        
        // Menu content panel
        const menuPanel = new StackPanel();
        menuPanel.width = "100%";
        menuPanel.spacing = 5;
        menuPanel.paddingTop = "20px";
        menuPanel.paddingBottom = "20px";
        menuBox.addControl(menuPanel);
        
        // Title
        if (title) {
            const titleText = new TextBlock();
            titleText.text = title;
            titleText.color = HD2D_UI_STYLE.accentColor;
            titleText.fontSize = 20;
            titleText.fontFamily = HD2D_UI_STYLE.primaryFont;
            titleText.fontWeight = "bold";
            titleText.height = "40px";
            titleText.shadowOffsetX = HD2D_UI_STYLE.textShadowOffset;
            titleText.shadowOffsetY = HD2D_UI_STYLE.textShadowOffset;
            titleText.shadowColor = HD2D_UI_STYLE.shadowColor;
            menuPanel.addControl(titleText);
            
            // Separator
            const separator = new Rectangle();
            separator.width = "80%";
            separator.height = "2px";
            separator.color = HD2D_UI_STYLE.accentColor;
            separator.background = HD2D_UI_STYLE.accentColor;
            menuPanel.addControl(separator);
        }
        
        // Menu options
        options.forEach((option, index) => {
            const button = this.createMenuButton(option, () => {
                onSelect(index);
                this.hideMenu();
            });
            menuPanel.addControl(button);
        });
        
        this.advancedTexture.addControl(menuBox);
        this.activeMenu = menuBox;
        
        // Animate in
        this.animateIn(menuBox);
    }
    
    public hideMenu(): void {
        if (this.activeMenu) {
            this.advancedTexture.removeControl(this.activeMenu);
            this.activeMenu = null;
        }
    }
    
    // Create a status display (HP/MP/etc)
    public createStatusDisplay(): Rectangle {
        const statusBox = new Rectangle("statusBox");
        statusBox.width = "200px";
        statusBox.height = "100px";
        statusBox.thickness = HD2D_UI_STYLE.borderWidth;
        statusBox.color = HD2D_UI_STYLE.secondaryColor;
        statusBox.background = HD2D_UI_STYLE.primaryColor + "dd"; // Semi-transparent
        statusBox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        statusBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        statusBox.left = "20px";
        statusBox.top = "20px";
        
        const statusPanel = new StackPanel();
        statusPanel.paddingLeft = "10px";
        statusPanel.paddingRight = "10px";
        statusPanel.paddingTop = "10px";
        statusBox.addControl(statusPanel);
        
        // HP Bar
        const hpBar = this.createStatBar("HP", 75, 100, "#c41e3a");
        statusPanel.addControl(hpBar);
        
        // MP Bar
        const mpBar = this.createStatBar("MP", 50, 100, "#4169e1");
        statusPanel.addControl(mpBar);
        
        this.advancedTexture.addControl(statusBox);
        return statusBox;
    }
    
    private createStatBar(label: string, current: number, max: number, color: string): Container {
        const container = new Container();
        container.height = "25px";
        container.width = "100%";
        
        // Label
        const labelText = new TextBlock();
        labelText.text = label;
        labelText.color = HD2D_UI_STYLE.textColor;
        labelText.fontSize = 14;
        labelText.fontFamily = HD2D_UI_STYLE.primaryFont;
        labelText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        labelText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        labelText.width = "30px";
        container.addControl(labelText);
        
        // Bar background
        const barBg = new Rectangle();
        barBg.width = "120px";
        barBg.height = "16px";
        barBg.color = HD2D_UI_STYLE.secondaryColor;
        barBg.background = "#000000";
        barBg.thickness = 2;
        barBg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        container.addControl(barBg);
        
        // Bar fill
        const barFill = new Rectangle();
        barFill.width = `${(current / max) * 116}px`;
        barFill.height = "12px";
        barFill.color = color;
        barFill.background = color;
        barFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        barFill.left = "2px";
        barBg.addControl(barFill);
        
        // Value text
        const valueText = new TextBlock();
        valueText.text = `${current}/${max}`;
        valueText.color = HD2D_UI_STYLE.textColor;
        valueText.fontSize = 12;
        valueText.fontFamily = HD2D_UI_STYLE.primaryFont;
        barBg.addControl(valueText);
        
        return container;
    }
    
    private createPortraitFrame(portraitUrl: string, shouldFlip?: boolean): Rectangle {
        const frame = new Rectangle("portraitFrame");
        frame.width = "140px";
        frame.height = "140px";
        frame.thickness = 3;
        frame.color = HD2D_UI_STYLE.accentColor;
        frame.background = HD2D_UI_STYLE.primaryColor;
        
        // Inner frame for border effect
        const innerFrame = new Rectangle();
        innerFrame.width = "134px";
        innerFrame.height = "134px";
        innerFrame.thickness = 2;
        innerFrame.color = HD2D_UI_STYLE.secondaryColor;
        innerFrame.background = "#000000";
        innerFrame.clipChildren = true; // Enable clipping for cropping
        frame.addControl(innerFrame);
        
        // Create a container for cropping
        const portraitContainer = new Container();
        portraitContainer.width = "130px";
        portraitContainer.height = "130px";
        innerFrame.addControl(portraitContainer);
        
        const portrait = new Image("portrait", portraitUrl);
        
        // Check if this is a sprite sheet URL (contains /npc/)
        if (portraitUrl.includes('/npc/')) {
            // For NPC sprites, scale up and position to show head area
            // The sprites have the character in the lower portion, so we shift down
            portrait.width = "260px";  // 4x scale for better detail
            portrait.height = "260px";
            portrait.stretch = Image.STRETCH_UNIFORM;
            portrait.top = "65px"; // Shift DOWN to show the upper part of the character (head)
            
            // Always face right - flip if NPC is facing left
            if (shouldFlip) {
                portraitContainer.scaleX = -1;
            }
        } else {
            // For custom portraits, show full image
            portrait.width = "130px";
            portrait.height = "130px";
            portrait.stretch = Image.STRETCH_FILL;
        }
        
        portraitContainer.addControl(portrait);
        
        return frame;
    }
    
    private createMenuButton(text: string, onClick: () => void): Button {
        const button = Button.CreateSimpleButton("", text);
        button.width = "260px";
        button.height = "40px";
        button.color = HD2D_UI_STYLE.secondaryColor;
        button.background = HD2D_UI_STYLE.primaryColor;
        button.thickness = 0;
        button.fontSize = 16;
        button.fontFamily = HD2D_UI_STYLE.primaryFont;
        
        // Hover effect
        button.onPointerEnterObservable.add(() => {
            button.background = HD2D_UI_STYLE.accentColor;
            button.color = HD2D_UI_STYLE.primaryColor;
        });
        
        button.onPointerOutObservable.add(() => {
            button.background = HD2D_UI_STYLE.primaryColor;
            button.color = HD2D_UI_STYLE.secondaryColor;
        });
        
        button.onPointerClickObservable.add(onClick);
        
        return button;
    }
    
    private createContinueIndicator(): Container {
        const container = new Container();
        container.width = "30px";
        container.height = "20px";
        
        const arrow = new TextBlock();
        arrow.text = "▼";
        arrow.color = HD2D_UI_STYLE.accentColor;
        arrow.fontSize = 16;
        arrow.fontFamily = HD2D_UI_STYLE.primaryFont;
        container.addControl(arrow);
        
        // Animate the arrow
        let frame = 0;
        this.scene.registerBeforeRender(() => {
            frame++;
            arrow.top = `${Math.sin(frame * 0.1) * 3}px`;
        });
        
        return container;
    }
    
    private addDecorativeCorners(box: Rectangle): void {
        // Top-left corner
        const tlCorner = new Rectangle();
        tlCorner.width = "20px";
        tlCorner.height = "20px";
        tlCorner.thickness = 2;
        tlCorner.color = HD2D_UI_STYLE.accentColor;
        tlCorner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        tlCorner.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        tlCorner.left = "-1px";
        tlCorner.top = "-1px";
        box.addControl(tlCorner);
        
        // Top-right corner
        const trCorner = new Rectangle();
        trCorner.width = "20px";
        trCorner.height = "20px";
        trCorner.thickness = 2;
        trCorner.color = HD2D_UI_STYLE.accentColor;
        trCorner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        trCorner.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        trCorner.left = "1px";
        trCorner.top = "-1px";
        box.addControl(trCorner);
        
        // Bottom-left corner
        const blCorner = new Rectangle();
        blCorner.width = "20px";
        blCorner.height = "20px";
        blCorner.thickness = 2;
        blCorner.color = HD2D_UI_STYLE.accentColor;
        blCorner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        blCorner.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        blCorner.left = "-1px";
        blCorner.top = "1px";
        box.addControl(blCorner);
        
        // Bottom-right corner
        const brCorner = new Rectangle();
        brCorner.width = "20px";
        brCorner.height = "20px";
        brCorner.thickness = 2;
        brCorner.color = HD2D_UI_STYLE.accentColor;
        brCorner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        brCorner.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        brCorner.left = "1px";
        brCorner.top = "1px";
        box.addControl(brCorner);
    }
    
    private animateIn(control: Control): void {
        control.scaleX = 0.9;
        control.scaleY = 0.9;
        control.alpha = 0;
        
        let frame = 0;
        const animate = () => {
            frame++;
            if (frame <= 10) {
                control.scaleX = 0.9 + (0.1 * frame / 10);
                control.scaleY = 0.9 + (0.1 * frame / 10);
                control.alpha = frame / 10;
            } else {
                this.scene.unregisterBeforeRender(animate);
            }
        };
        
        this.scene.registerBeforeRender(animate);
    }
    
    public dispose(): void {
        this.advancedTexture.dispose();
    }
}