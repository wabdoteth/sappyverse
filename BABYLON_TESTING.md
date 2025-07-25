# Babylon.js GUI Testing Guide

## Current Issue
GUI buttons are not responding to clicks in the ES module version, while the standalone CDN version works fine.

## Testing Different Implementations

The app now supports multiple implementations that can be tested by adding URL parameters:

### 1. Working Solution (Default)
```
http://localhost:3000/
http://localhost:3000/?mode=working
```
- Based on the exact pattern from the working standalone HTML
- Uses function-based initialization
- Simplest implementation

### 2. Proper Implementation
```
http://localhost:3000/?mode=proper
```
- Uses correct ES module import paths from submodules
- Imports from `@babylonjs/core/Engines/engine` etc.
- GUI imports from `@babylonjs/gui/2D/`
- Uses `onPointerClickObservable` for button events

### 3. Alternative Implementation
```
http://localhost:3000/?mode=alternative
```
- Uses namespace imports (`import * as GUI`)
- Async initialization pattern
- Scene pointer observable for debugging

### 4. Diagnostic Implementation
```
http://localhost:3000/?mode=diagnostic
```
- Extensive logging and debugging
- Tests multiple button creation methods
- Shows real-time event logs
- Checks module loading

## Key Findings from Research

1. **Import Paths Matter**: Must use specific submodule paths like `@babylonjs/core/Engines/engine` not just `@babylonjs/core`

2. **GUI Module Path**: Import from `@babylonjs/gui/2D/` not just `@babylonjs/gui`

3. **Side Effects**: Some features require explicit side-effect imports

4. **Initialization Order**: Engine → Scene → Scene components → GUI → Render loop

5. **Canvas Focus**: Known issues with `canvas.focus()` immediately after scene creation

## Console Commands for Debugging

```javascript
// Check if button is receiving events
babylonApp.scene.getTextureByName('UI').getControlByName('startButton')

// Check canvas focus
document.activeElement

// Manually trigger click
babylonApp.scene.getTextureByName('UI').getControlByName('startButton').onPointerUpObservable.notifyObservers()
```

## Next Steps

1. Test each implementation to see which works
2. Compare console output between working and non-working versions
3. Check browser developer tools for any blocked events
4. Verify Vite is properly bundling the GUI modules