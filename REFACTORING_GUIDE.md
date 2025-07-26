# HD-2D Game Refactoring Guide

## Overview
The HD-2D game codebase has been refactored to be more modular and maintainable. The monolithic `HD2DGame.ts` file has been split into several specialized managers and systems.

## New Architecture

### Managers
1. **PostProcessingManager** (`src/babylon/managers/PostProcessingManager.ts`)
   - Handles all post-processing effects (bloom, DOF, dithering, etc.)
   - Centralizes shader and effect management
   - Provides clean API for toggling effects

2. **NPCInteractionManager** (`src/babylon/managers/NPCInteractionManager.ts`)
   - Manages all NPC interactions and dialogue
   - Handles proximity detection
   - Contains dialogue database
   - Manages speech bubbles

3. **PlayerControlManager** (`src/babylon/managers/PlayerControlManager.ts`)
   - Handles all player input and movement
   - Manages collision detection
   - Controls player animations
   - Provides configurable movement speeds

4. **GameSettingsManager** (`src/babylon/managers/GameSettingsManager.ts`)
   - Centralized settings management
   - Persistent settings (localStorage)
   - Settings menu UI
   - Callback system for setting changes

### UI Components
1. **DebugUI** (`src/babylon/ui/DebugUI.ts`)
   - Standalone debug panel
   - All debug controls in one place
   - Easy to disable in production
   - Cleaner separation from game logic

## Migration Steps

### 1. Update imports in your HTML file
```html
<!-- Old -->
<script type="module" src="/src/babylon/hd2d-main.ts"></script>

<!-- New -->
<script type="module" src="/src/babylon/hd2d-main-refactored.ts"></script>
```

### 2. Update any direct HD2DGame references
The public API remains mostly the same, but some methods have moved:

```typescript
// Old
game.retroPostProcess.setDitherStrength(0.1);

// New (through settings manager)
game.toggleDithering(true);
```

### 3. Adding new features
With the modular structure, adding features is now easier:

#### Adding a new post-processing effect:
1. Add the effect to `PostProcessingManager`
2. Add toggle method
3. Add setting to `GameSettingsManager`
4. Add UI control to `DebugUI`

#### Adding new NPC dialogue:
1. Update dialogue database in `NPCInteractionManager`
2. No need to touch other files!

#### Adding new player abilities:
1. Update `PlayerControlManager`
2. Add keybindings
3. Update animation states if needed

### 4. Customizing settings
Settings are now persistent and organized:

```typescript
// Access settings
const settings = game.settingsManager.getSettings();

// Listen for setting changes
game.settingsManager.onSettingChange('graphics.fogEnabled', (enabled) => {
    // React to fog toggle
});
```

## Benefits of the Refactored Architecture

1. **Maintainability**: Each manager handles one specific aspect
2. **Testability**: Managers can be tested in isolation
3. **Extensibility**: Easy to add new features without touching core game logic
4. **Performance**: Better organization allows for targeted optimizations
5. **Collaboration**: Multiple developers can work on different managers

## File Structure
```
src/babylon/
├── managers/
│   ├── PostProcessingManager.ts
│   ├── NPCInteractionManager.ts
│   ├── PlayerControlManager.ts
│   └── GameSettingsManager.ts
├── ui/
│   ├── HD2DUISystem.ts
│   └── DebugUI.ts
├── HD2DGame_Refactored.ts
└── hd2d-main-refactored.ts
```

## Backwards Compatibility
The original files are preserved:
- `HD2DGame.ts` (original monolithic version)
- `hd2d-main.ts` (original entry point)

You can switch between versions by changing the import in your HTML file.

## Next Steps
1. Test all functionality with the refactored code
2. Remove old code once testing is complete
3. Add unit tests for individual managers
4. Document any custom modifications

## Common Issues and Solutions

### Issue: Debug UI not appearing
- Make sure `DebugUI` is imported and instantiated
- Check that NODE_ENV is not set to 'production'

### Issue: Settings not persisting
- Check browser localStorage permissions
- Clear localStorage if corrupt: `localStorage.removeItem('hd2d-game-settings')`

### Issue: Post-processing effects not working
- Ensure WebGL 2.0 support
- Check that effects are enabled in settings

### Issue: NPC interactions not working
- Verify NPCs are properly registered with NPCInteractionManager
- Check interaction distance settings