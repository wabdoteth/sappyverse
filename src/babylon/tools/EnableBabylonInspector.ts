import { Scene } from '@babylonjs/core/scene';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';

export class BabylonInspectorTools {
    /**
     * Enable the Babylon.js Inspector
     * This provides a full GUI for manipulating the scene, including:
     * - Mesh properties (position, rotation, scale)
     * - Material editing
     * - Texture management
     * - Light controls
     * - Camera settings
     * - Performance profiling
     * - And much more!
     */
    public static enableInspector(scene: Scene): void {
        // Show the inspector
        scene.debugLayer.show({
            handleResize: true,
            overlay: false,
            globalRoot: document.getElementById('root') || undefined,
            embedMode: true
        });
    }
    
    /**
     * Toggle inspector visibility
     */
    public static toggleInspector(scene: Scene): void {
        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        } else {
            scene.debugLayer.show();
        }
    }
    
    /**
     * Add keyboard shortcut for inspector
     */
    public static addInspectorShortcut(scene: Scene): void {
        window.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift + I to toggle inspector
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
                this.toggleInspector(scene);
            }
        });
    }
}