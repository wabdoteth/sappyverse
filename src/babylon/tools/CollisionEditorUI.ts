import * as GUI from '@babylonjs/gui/2D';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { CollisionEditor } from './CollisionEditor';

export class CollisionEditorUI {
    private editor: CollisionEditor;
    private gui: GUI.AdvancedDynamicTexture;
    private modelListStack: GUI.StackPanel | null = null;
    private modelDropdown: GUI.Button | null = null;
    private modelDropdownList: GUI.ScrollViewer | null = null;
    
    constructor(editor: CollisionEditor) {
        this.editor = editor;
    }
    
    public createUI(): void {
        this.gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
        
        // Create main container
        const mainContainer = new GUI.Rectangle();
        mainContainer.thickness = 0;
        this.gui.addControl(mainContainer);
        
        // Create UI sections
        this.createTopToolbar();
        this.createLeftSidebar();
        this.createRightSidebar();
        this.createBottomStatusBar();
        
        // Initialize model dropdown
        setTimeout(() => {
            this.createModelDropdown();
            this.refreshModelList();
        }, 100);
    }
    
    private createTopToolbar(): void {
        // Title panel
        const titlePanel = new GUI.Rectangle();
        titlePanel.width = "200px";
        titlePanel.height = "40px";
        titlePanel.left = "20px";
        titlePanel.top = "20px";
        titlePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        titlePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        titlePanel.background = "#2c2c2c";
        titlePanel.thickness = 1;
        titlePanel.color = "#444";
        titlePanel.cornerRadius = 8;
        titlePanel.shadowOffsetX = 2;
        titlePanel.shadowOffsetY = 2;
        titlePanel.shadowBlur = 10;
        titlePanel.shadowColor = "rgba(0,0,0,0.3)";
        this.gui.addControl(titlePanel);
        
        const title = new GUI.TextBlock();
        title.text = "Collision Editor";
        title.color = "white";
        title.fontSize = 16;
        titlePanel.addControl(title);
        
        // Tool indicator panel
        const toolPanel = new GUI.Rectangle();
        toolPanel.width = "150px";
        toolPanel.height = "35px";
        toolPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        toolPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        toolPanel.top = "20px";
        toolPanel.background = "#2c2c2c";
        toolPanel.thickness = 1;
        toolPanel.color = "#444";
        toolPanel.cornerRadius = 8;
        toolPanel.shadowOffsetX = 2;
        toolPanel.shadowOffsetY = 2;
        toolPanel.shadowBlur = 10;
        toolPanel.shadowColor = "rgba(0,0,0,0.3)";
        this.gui.addControl(toolPanel);
        
        const toolIndicator = new GUI.TextBlock();
        toolIndicator.name = "toolIndicator";
        toolIndicator.text = "Tool: Select";
        toolIndicator.color = "#4a9eff";
        toolIndicator.fontSize = 14;
        toolPanel.addControl(toolIndicator);
    }
    
    private createLeftSidebar(): void {
        // Tools panel - adjusted for 2x2 grid of buttons
        const toolsPanel = this.createFloatingPanel("300px", "140px", "20px", "80px");
        this.gui.addControl(toolsPanel);
        
        const toolsStack = new GUI.StackPanel();
        toolsStack.paddingTop = "10px";
        toolsStack.paddingBottom = "10px";
        toolsStack.paddingLeft = "10px";
        toolsStack.paddingRight = "10px";
        toolsPanel.addControl(toolsStack);
        
        // Tools Section
        this.createSection(toolsStack, "TOOLS");
        
        const toolGrid = new GUI.Grid();
        toolGrid.height = "80px";
        toolGrid.paddingLeft = "5px";
        toolGrid.paddingRight = "5px";
        toolGrid.addColumnDefinition(0.5);
        toolGrid.addColumnDefinition(0.5);
        toolGrid.addRowDefinition(40, false);
        toolGrid.addRowDefinition(40, false);
        toolsStack.addControl(toolGrid);
        
        // Tool buttons
        this.createToolButton(toolGrid, "Select [Q]", 'select', 0, 0);
        this.createToolButton(toolGrid, "Move", 'move', 0, 1);
        this.createToolButton(toolGrid, "Resize [E]", 'resize', 1, 0);
        this.createToolButton(toolGrid, "Rotate [R]", 'rotate', 1, 1);
        
        // Colliders panel - adjusted for 2x2 grid
        const collidersPanel = this.createFloatingPanel("300px", "140px", "20px", "240px");
        this.gui.addControl(collidersPanel);
        
        const collidersStack = new GUI.StackPanel();
        collidersStack.paddingTop = "10px";
        collidersStack.paddingBottom = "10px";
        collidersStack.paddingLeft = "10px";
        collidersStack.paddingRight = "10px";
        collidersPanel.addControl(collidersStack);
        
        // Collider Types Section
        this.createSection(collidersStack, "COLLIDER TYPES");
        
        const colliderGrid = new GUI.Grid();
        colliderGrid.height = "80px";
        colliderGrid.paddingLeft = "5px";
        colliderGrid.paddingRight = "5px";
        colliderGrid.addColumnDefinition(0.5);
        colliderGrid.addColumnDefinition(0.5);
        colliderGrid.addRowDefinition(40, false);
        colliderGrid.addRowDefinition(40, false);
        collidersStack.addControl(colliderGrid);
        
        // Collider type buttons
        this.createColliderButton(colliderGrid, "Box [1]", 'box', 0, 0);
        this.createColliderButton(colliderGrid, "Cylinder [2]", 'cylinder', 0, 1);
        this.createColliderButton(colliderGrid, "Floor [3]", 'floor', 1, 0);
        this.createColliderButton(colliderGrid, "Ramp [4]", 'ramp', 1, 1);
        
        // Model panel - adjusted height
        const modelPanel = this.createFloatingPanel("300px", "160px", "20px", "400px");
        this.gui.addControl(modelPanel);
        
        const modelStack = new GUI.StackPanel();
        modelStack.paddingTop = "10px";
        modelStack.paddingBottom = "10px";
        modelStack.paddingLeft = "10px";
        modelStack.paddingRight = "10px";
        modelPanel.addControl(modelStack);
        
        // Model Section
        this.createSection(modelStack, "MODEL");
        
        // Model dropdown container
        const dropdownContainer = new GUI.Rectangle();
        dropdownContainer.name = "dropdownContainer";
        dropdownContainer.height = "35px";
        dropdownContainer.thickness = 0;
        modelStack.addControl(dropdownContainer);
        
        this.addSpace(modelStack, 5);
        
        // Model info text
        const modelInfo = new GUI.TextBlock();
        modelInfo.name = "modelInfo";
        modelInfo.text = "No model loaded";
        modelInfo.height = "20px";
        modelInfo.color = "#888";
        modelInfo.fontSize = 11;
        modelInfo.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        modelStack.addControl(modelInfo);
        
        this.addSpace(modelStack, 5);
        
        this.createActionButton(modelStack, "Load Custom GLB", () => {
            document.getElementById('modelFile')?.click();
        });
        
        this.createActionButton(modelStack, "Clear Scene", () => {
            if (confirm("Clear all colliders?")) {
                this.editor.clearAllColliders();
            }
        });
    }
    
    private createRightSidebar(): void {
        // Properties panel - adjusted height
        const propsPanel = new GUI.Rectangle();
        propsPanel.width = "280px";
        propsPanel.height = "180px";
        propsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        propsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        propsPanel.left = "-20px";  // 20px from right edge
        propsPanel.top = "80px";
        propsPanel.background = "#2c2c2c";
        propsPanel.thickness = 1;
        propsPanel.color = "#444";
        propsPanel.cornerRadius = 12;
        propsPanel.shadowOffsetX = 4;
        propsPanel.shadowOffsetY = 4;
        propsPanel.shadowBlur = 20;
        propsPanel.shadowColor = "rgba(0,0,0,0.4)";
        this.gui.addControl(propsPanel);
        
        const propsStack = new GUI.StackPanel();
        propsStack.paddingTop = "10px";
        propsStack.paddingBottom = "10px";
        propsStack.paddingLeft = "10px";
        propsStack.paddingRight = "10px";
        propsPanel.addControl(propsStack);
        
        // Properties Section
        this.createSection(propsStack, "PROPERTIES");
        
        const noSelection = new GUI.TextBlock();
        noSelection.name = "noSelectionText";
        noSelection.text = "No collider selected";
        noSelection.height = "30px";
        noSelection.color = "#666";
        noSelection.fontSize = 13;
        noSelection.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        propsStack.addControl(noSelection);
        
        // Selected collider info (hidden by default)
        const propsContainer = new GUI.StackPanel();
        propsContainer.name = "propsContainer";
        propsContainer.isVisible = false;
        propsStack.addControl(propsContainer);
        
        // File Operations panel
        const filePanel = new GUI.Rectangle();
        filePanel.width = "280px";
        filePanel.height = "200px";
        filePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        filePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        filePanel.left = "-20px";  // 20px from right edge
        filePanel.top = "280px";
        filePanel.background = "#2c2c2c";
        filePanel.thickness = 1;
        filePanel.color = "#444";
        filePanel.cornerRadius = 12;
        filePanel.shadowOffsetX = 4;
        filePanel.shadowOffsetY = 4;
        filePanel.shadowBlur = 20;
        filePanel.shadowColor = "rgba(0,0,0,0.4)";
        this.gui.addControl(filePanel);
        
        const fileStack = new GUI.StackPanel();
        fileStack.paddingTop = "10px";
        fileStack.paddingBottom = "10px";
        fileStack.paddingLeft = "10px";
        fileStack.paddingRight = "10px";
        filePanel.addControl(fileStack);
        
        // File Operations Section
        this.createSection(fileStack, "FILE OPERATIONS");
        
        this.createActionButton(fileStack, "Save to Game", () => {
            this.editor.fileHandler.saveToGame();
        });
        
        this.createActionButton(fileStack, "Load from Game", () => {
            this.editor.fileHandler.loadFromGame();
        });
        
        this.addSpace(fileStack, 5);
        
        this.createActionButton(fileStack, "Export JSON", () => {
            this.editor.fileHandler.saveCollisionSetup();
        });
        
        this.createActionButton(fileStack, "Import JSON", () => {
            document.getElementById('setupFile')?.click();
        });
        
        // Shortcuts panel
        const shortcutsPanel = new GUI.Rectangle();
        shortcutsPanel.width = "280px";
        shortcutsPanel.height = "180px";
        shortcutsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        shortcutsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        shortcutsPanel.left = "-20px";  // 20px from right edge
        shortcutsPanel.top = "460px";
        shortcutsPanel.background = "#2c2c2c";
        shortcutsPanel.thickness = 1;
        shortcutsPanel.color = "#444";
        shortcutsPanel.cornerRadius = 12;
        shortcutsPanel.shadowOffsetX = 4;
        shortcutsPanel.shadowOffsetY = 4;
        shortcutsPanel.shadowBlur = 20;
        shortcutsPanel.shadowColor = "rgba(0,0,0,0.4)";
        this.gui.addControl(shortcutsPanel);
        
        const shortcutsStack = new GUI.StackPanel();
        shortcutsStack.paddingTop = "10px";
        shortcutsStack.paddingBottom = "10px";
        shortcutsStack.paddingLeft = "10px";
        shortcutsStack.paddingRight = "10px";
        shortcutsPanel.addControl(shortcutsStack);
        
        // Help Section
        this.createSection(shortcutsStack, "SHORTCUTS");
        
        const shortcuts = [
            "WASD - Move camera",
            "Shift/Ctrl - Up/Down",
            "Mouse - Look around",
            "Q - Select tool",
            "E - Resize tool", 
            "R - Rotate tool",
            "1-4 - Place colliders",
            "Delete - Remove selected",
            "Space - Reset camera"
        ];
        
        shortcuts.forEach(shortcut => {
            const text = new GUI.TextBlock();
            text.text = shortcut;
            text.height = "18px";
            text.color = "#888";
            text.fontSize = 11;
            text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            shortcutsStack.addControl(text);
        });
    }
    
    private createBottomStatusBar(): void {
        // Grid position panel
        const gridPanel = this.createFloatingPanel("150px", "35px", "20px", "-55px");
        gridPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.gui.addControl(gridPanel);
        
        const gridPos = new GUI.TextBlock();
        gridPos.name = "gridPos";
        gridPos.text = "Grid: 0, 0, 0";
        gridPos.color = "#888";
        gridPos.fontSize = 12;
        gridPanel.addControl(gridPos);
        
        // Collider count panel
        const countPanel = this.createFloatingPanel("120px", "35px", "0px", "-55px");
        countPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        countPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.gui.addControl(countPanel);
        
        const colliderCount = new GUI.TextBlock();
        colliderCount.name = "colliderCount";
        colliderCount.text = "Colliders: 0";
        colliderCount.color = "#4a9eff";
        colliderCount.fontSize = 12;
        countPanel.addControl(colliderCount);
        
        // Camera info panel
        const cameraPanel = new GUI.Rectangle();
        cameraPanel.width = "200px";
        cameraPanel.height = "35px";
        cameraPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        cameraPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        cameraPanel.left = "-20px";  // 20px from right edge
        cameraPanel.top = "-55px";
        cameraPanel.background = "#2c2c2c";
        cameraPanel.thickness = 1;
        cameraPanel.color = "#444";
        cameraPanel.cornerRadius = 12;
        cameraPanel.shadowOffsetX = 4;
        cameraPanel.shadowOffsetY = 4;
        cameraPanel.shadowBlur = 20;
        cameraPanel.shadowColor = "rgba(0,0,0,0.4)";
        this.gui.addControl(cameraPanel);
        
        const cameraInfo = new GUI.TextBlock();
        cameraInfo.name = "cameraInfo";
        cameraInfo.text = "Camera: 0, 10, -20";
        cameraInfo.color = "#888";
        cameraInfo.fontSize = 12;
        cameraPanel.addControl(cameraInfo);
    }
    
    // Helper methods
    private createFloatingPanel(width: string, height: string, left: string, top: string): GUI.Rectangle {
        const panel = new GUI.Rectangle();
        panel.width = width;
        panel.height = height;
        panel.left = left;
        panel.top = top;
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        panel.background = "#2c2c2c";
        panel.thickness = 1;
        panel.color = "#444";
        panel.cornerRadius = 12;
        panel.shadowOffsetX = 4;
        panel.shadowOffsetY = 4;
        panel.shadowBlur = 20;
        panel.shadowColor = "rgba(0,0,0,0.4)";
        return panel;
    }
    
    private createSection(parent: GUI.StackPanel, title: string): void {
        const header = new GUI.TextBlock();
        header.text = title;
        header.height = "25px";
        header.color = "white";
        header.fontSize = 13;
        header.fontWeight = "bold";
        header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        parent.addControl(header);
        
        this.addSpace(parent, 5);
    }
    
    private createToolButton(grid: GUI.Grid, text: string, toolId: string, row: number, col: number): void {
        const btn = GUI.Button.CreateSimpleButton(toolId + "Btn", text);
        btn.width = "130px";
        btn.height = "35px";
        btn.color = "white";
        btn.background = this.editor.currentTool === toolId ? "#4a9eff" : "#404040";
        btn.thickness = 1;
        btn.cornerRadius = 4;
        btn.fontSize = 12;
        btn.name = "tool_" + toolId;
        btn.onPointerClickObservable.add(() => {
            this.editor.setTool(toolId);
        });
        
        // Hover effect
        btn.onPointerEnterObservable.add(() => {
            if (this.editor.currentTool !== toolId) {
                btn.background = "#505050";
            }
        });
        btn.onPointerOutObservable.add(() => {
            if (this.editor.currentTool !== toolId) {
                btn.background = "#404040";
            }
        });
        
        grid.addControl(btn, row, col);
    }
    
    private createColliderButton(grid: GUI.Grid, text: string, colliderType: string, row: number, col: number): void {
        const btn = GUI.Button.CreateSimpleButton(colliderType + "Btn", text);
        btn.width = "130px";
        btn.height = "35px";
        btn.color = "white";
        btn.background = "#404040";
        btn.thickness = 1;
        btn.cornerRadius = 4;
        btn.fontSize = 12;
        btn.onPointerClickObservable.add(() => {
            this.editor.currentTool = colliderType;
            this.editor.placeCollider(new Vector3(0, 0, 0));
        });
        
        // Hover effect
        btn.onPointerEnterObservable.add(() => {
            btn.background = "#505050";
        });
        btn.onPointerOutObservable.add(() => {
            btn.background = "#404040";
        });
        
        grid.addControl(btn, row, col);
    }
    
    private createActionButton(parent: GUI.StackPanel, text: string, callback: () => void): GUI.Button {
        const btn = GUI.Button.CreateSimpleButton(text, text);
        btn.width = "100%";
        btn.height = "35px";
        btn.color = "white";
        btn.background = "#404040";
        btn.thickness = 1;
        btn.cornerRadius = 4;
        btn.fontSize = 12;
        btn.paddingTop = "5px";
        btn.paddingBottom = "5px";
        btn.onPointerClickObservable.add(callback);
        parent.addControl(btn);
        
        // Add small space after button
        this.addSpace(parent, 3);
        
        // Add hover effect
        btn.onPointerEnterObservable.add(() => {
            btn.background = "#505050";
        });
        btn.onPointerOutObservable.add(() => {
            btn.background = "#404040";
        });
        
        return btn;
    }
    
    private addSeparator(parent: GUI.StackPanel): void {
        this.addSpace(parent, 10);
        const sep = new GUI.Rectangle();
        sep.width = "100%";
        sep.height = "1px";
        sep.background = "#444";
        sep.thickness = 0;
        parent.addControl(sep);
        this.addSpace(parent, 10);
    }
    
    private addSpace(parent: GUI.StackPanel, height: number): void {
        const space = new GUI.Rectangle();
        space.height = height + "px";
        space.thickness = 0;
        parent.addControl(space);
    }
    
    public updateToolButtons(): void {
        ['select', 'move', 'resize', 'rotate'].forEach(toolId => {
            const btn = this.gui.getControlByName('tool_' + toolId);
            if (btn) {
                (btn as GUI.Button).background = this.editor.currentTool === toolId ? "#4a9eff" : "#404040";
            }
        });
    }
    
    public updateToolIndicator(): void {
        const indicator = this.gui.getControlByName("toolIndicator");
        if (indicator) {
            const toolNames: { [key: string]: string } = {
                'select': 'Select',
                'move': 'Move',
                'resize': 'Resize',
                'rotate': 'Rotate'
            };
            (indicator as GUI.TextBlock).text = `Tool: ${toolNames[this.editor.currentTool] || this.editor.currentTool}`;
        }
    }
    
    public updateColliderCount(): void {
        const counter = this.gui.getControlByName("colliderCount");
        if (counter) {
            (counter as GUI.TextBlock).text = `Colliders: ${this.editor.colliders.size}`;
        }
    }
    
    public updateStatusBar(): void {
        // Update camera position
        const cameraInfo = this.gui.getControlByName("cameraInfo");
        if (cameraInfo && this.editor.sceneSetup.camera) {
            const pos = this.editor.sceneSetup.camera.position;
            (cameraInfo as GUI.TextBlock).text = `Camera: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        }
        
        // Update grid position (mouse position on ground)
        const gridPos = this.gui.getControlByName("gridPos");
        if (gridPos) {
            const pickResult = this.editor.scene.pick(this.editor.scene.pointerX, this.editor.scene.pointerY);
            if (pickResult.hit && pickResult.pickedPoint) {
                const p = pickResult.pickedPoint;
                (gridPos as GUI.TextBlock).text = `Grid: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
            }
        }
    }
    
    public updatePropertiesPanel(): void {
        const noSelectionText = this.gui.getControlByName("noSelectionText");
        const propsContainer = this.gui.getControlByName("propsContainer") as GUI.StackPanel;
        
        if (!this.editor.selectedCollider || !this.editor.colliders.has(this.editor.selectedCollider)) {
            if (noSelectionText) noSelectionText.isVisible = true;
            if (propsContainer) propsContainer.isVisible = false;
            return;
        }
        
        if (noSelectionText) noSelectionText.isVisible = false;
        if (propsContainer) {
            propsContainer.isVisible = true;
            
            // Clear existing properties
            while (propsContainer.children.length > 0) {
                const child = propsContainer.children[0];
                propsContainer.removeControl(child);
                child.dispose();
            }
            
            const data = this.editor.colliders.get(this.editor.selectedCollider);
            if (!data) return;
            
            // Type
            const typeLabel = new GUI.TextBlock();
            typeLabel.text = `Type: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`;
            typeLabel.height = "20px";
            typeLabel.color = "#ccc";
            typeLabel.fontSize = 12;
            typeLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            propsContainer.addControl(typeLabel);
            
            // Position
            const pos = this.editor.selectedCollider.position;
            const posLabel = new GUI.TextBlock();
            posLabel.text = `Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
            posLabel.height = "20px";
            posLabel.color = "#ccc";
            posLabel.fontSize = 12;
            posLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            propsContainer.addControl(posLabel);
            
            // Scale
            const scale = this.editor.selectedCollider.scaling;
            const scaleLabel = new GUI.TextBlock();
            scaleLabel.text = `Scale: ${scale.x.toFixed(1)}, ${scale.y.toFixed(1)}, ${scale.z.toFixed(1)}`;
            scaleLabel.height = "20px";
            scaleLabel.color = "#ccc";
            scaleLabel.fontSize = 12;
            scaleLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            propsContainer.addControl(scaleLabel);
            
            // Walkable status for floor/ramp
            if (data.type === 'floor' || data.type === 'ramp') {
                const walkableLabel = new GUI.TextBlock();
                walkableLabel.text = `Walkable: ${data.isWalkable ? 'Yes' : 'No'}`;
                walkableLabel.height = "20px";
                walkableLabel.color = "#ccc";
                walkableLabel.fontSize = 12;
                walkableLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                propsContainer.addControl(walkableLabel);
            }
        }
    }
    
    private createModelDropdown(): void {
        const dropdownContainer = this.gui.getControlByName("dropdownContainer");
        if (!dropdownContainer) return;
        
        // Create dropdown button
        const dropdown = GUI.Button.CreateSimpleButton("modelDropdown", "Select Model...");
        dropdown.width = "100%";
        dropdown.height = "35px";
        dropdown.color = "white";
        dropdown.background = "#404040";
        dropdown.thickness = 1;
        dropdown.cornerRadius = 4;
        dropdown.fontSize = 12;
        dropdownContainer.addControl(dropdown);
        
        // Add hover effect
        dropdown.onPointerEnterObservable.add(() => {
            dropdown.background = "#505050";
        });
        dropdown.onPointerOutObservable.add(() => {
            dropdown.background = "#404040";
        });
        
        // Create dropdown list container (hidden by default)
        const dropdownList = new GUI.ScrollViewer();
        dropdownList.name = "modelDropdownList";
        dropdownList.width = "250px";
        dropdownList.height = "200px";
        dropdownList.background = "#2c2c2c";
        dropdownList.thickness = 1;
        dropdownList.color = "#666";
        dropdownList.isVisible = false;
        dropdownList.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        dropdownList.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        dropdownList.left = "20px";
        dropdownList.top = "490px";
        dropdownList.barSize = 10;
        dropdownList.barColor = "#505050";
        dropdownList.barBackground = "#353535";
        this.gui.addControl(dropdownList);
        
        const listStack = new GUI.StackPanel();
        listStack.isVertical = true;
        dropdownList.addControl(listStack);
        
        // Store references
        this.modelListStack = listStack;
        this.modelDropdown = dropdown;
        this.modelDropdownList = dropdownList;
        
        // Toggle dropdown
        dropdown.onPointerClickObservable.add((eventData) => {
            eventData.skipOnPointerObservable = true;
            dropdownList.isVisible = !dropdownList.isVisible;
            if (dropdownList.isVisible) {
                this.refreshModelList();
                this.gui.moveToTop(dropdownList);
            }
        });
        
        // Close dropdown when clicking elsewhere
        this.editor.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && dropdownList.isVisible) {
                // Hide if clicked outside
                dropdownList.isVisible = false;
            }
        });
    }
    
    public refreshModelList(): void {
        if (!this.modelListStack) return;
        
        // Clear existing items
        while (this.modelListStack.children.length > 0) {
            const child = this.modelListStack.children[0];
            this.modelListStack.removeControl(child);
            child.dispose();
        }
        
        // Try to get models from localStorage
        let models: any[] = [];
        const storedData = localStorage.getItem('sappyverse_model_registry');
        if (storedData) {
            try {
                models = JSON.parse(storedData);
            } catch (e) {
                console.error('Failed to parse model registry:', e);
            }
        }
        
        // Add header
        const header = new GUI.TextBlock();
        header.text = models.length + " models available";
        header.height = "25px";
        header.color = "#888";
        header.fontSize = 11;
        header.paddingTop = "5px";
        header.paddingBottom = "5px";
        header.paddingLeft = "10px";
        header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.modelListStack.addControl(header);
        
        // Add separator
        const sep = new GUI.Rectangle();
        sep.height = "1px";
        sep.background = "#444";
        sep.thickness = 0;
        this.modelListStack.addControl(sep);
        
        // Add model items
        models.forEach(model => {
            const item = GUI.Button.CreateSimpleButton(model.name, model.name);
            item.height = "35px";
            item.width = "100%";
            item.color = "white";
            item.background = "transparent";
            item.thickness = 0;
            item.fontSize = 12;
            item.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            item.paddingLeft = "15px";
            
            // Hover effect
            item.onPointerEnterObservable.add(() => {
                item.background = "#404040";
            });
            item.onPointerOutObservable.add(() => {
                item.background = "transparent";
            });
            
            // Click to load
            item.onPointerClickObservable.add((eventData) => {
                eventData.skipOnPointerObservable = true;
                this.editor.fileHandler.loadModelFromRegistry(model.name);
                if (this.modelDropdown && this.modelDropdown.textBlock) {
                    this.modelDropdown.textBlock.text = model.name;
                }
                if (this.modelDropdownList) {
                    this.modelDropdownList.isVisible = false;
                }
            });
            
            this.modelListStack.addControl(item);
        });
        
        if (models.length === 0) {
            const noModels = new GUI.TextBlock();
            noModels.text = "No models loaded in game";
            noModels.height = "30px";
            noModels.color = "#666";
            noModels.fontSize = 11;
            noModels.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            this.modelListStack.addControl(noModels);
        }
    }
    
    public updateModelInfo(modelName: string): void {
        const modelInfo = this.gui.getControlByName("modelInfo");
        if (modelInfo) {
            (modelInfo as GUI.TextBlock).text = `Model: ${modelName}`;
            (modelInfo as GUI.TextBlock).color = "#4a9eff";
        }
    }
}