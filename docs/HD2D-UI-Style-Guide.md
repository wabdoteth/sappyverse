# HD-2D UI Style Guide

## Overview
The HD-2D UI aesthetic combines classic JRPG interface design with modern rendering techniques. It emphasizes readability, nostalgia, and ornate decorative elements while maintaining pixel-perfect clarity.

## Core Design Principles

### 1. **Pixel-Perfect Rendering**
- Use integer scaling (1x, 2x, 3x) for all UI elements
- Avoid anti-aliasing on text and borders
- Maintain consistent pixel grid alignment
- Design at base resolution (e.g., 1920x1080) and scale down

### 2. **Retro-Modern Hybrid**
- Classic JRPG layouts with modern polish
- Ornate decorative elements without overwhelming functionality
- Clear hierarchy through size, color, and positioning
- Subtle animations that don't distract from gameplay

## Color Palette

### Primary Colors
```
Dark Brown (Background):    #2a1f1a     RGB(42, 31, 26)
Cream (Text/Borders):       #f4e4c1     RGB(244, 228, 193)
Gold (Accents/Highlights):  #d4af37     RGB(212, 175, 55)
```

### Secondary Colors
```
Deep Shadow:                #0a0805     RGB(10, 8, 5)
Light Parchment:            #faf6ed     RGB(250, 246, 237)
Copper (Alt Accent):        #b87333     RGB(184, 115, 51)
Jade (Status/Success):      #4a7c4e     RGB(74, 124, 78)
Ruby (Alert/Damage):        #c41e3a     RGB(196, 30, 58)
Sapphire (Magic/MP):        #4169e1     RGB(65, 105, 225)
```

### Usage Guidelines
- **Backgrounds**: Always use Dark Brown with 80-95% opacity for readability
- **Text**: Cream for primary text, Gold for headers/important info
- **Borders**: 3px Cream borders with Gold corner accents
- **Shadows**: Deep Shadow at 80% opacity, offset by 2-4px

## Typography

### Font Families
```css
/* Primary - For all UI text */
font-family: "Courier New", "Consolas", monospace;

/* Alternative - For special headers */
font-family: "Press Start 2P", "Courier New", monospace;
```

### Font Sizes
- **Large Headers**: 24px (dialogue speakers, menu titles)
- **Standard Text**: 16-18px (dialogue, menu items)
- **Small Text**: 12-14px (status values, descriptions)
- **Tiny Text**: 10px (copyright, version info)

### Text Effects
```css
/* Standard text shadow for readability */
text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);

/* Glowing text for magical/important elements */
text-shadow: 
    0 0 4px rgba(212, 175, 55, 0.8),
    2px 2px 0px rgba(0, 0, 0, 0.8);
```

## UI Components

### 1. **Dialogue Box**
```
Structure:
┌─────────────────────────────────────┐
│ ┌─┐                             ┌─┐ │
│ └─┘  [Speaker Name]             └─┘ │
│                                     │
│  [Portrait]  Dialogue text goes     │
│   (optional)  here with proper      │
│              word wrapping...    ▼  │
└─────────────────────────────────────┘

Specifications:
- Width: 800px (41.67% of 1920px screen)
- Height: 200px minimum, auto-expand for content
- Position: Bottom center, 40px from bottom
- Border: 3px cream (#f4e4c1)
- Background: Dark brown (#2a1f1a) at 90% opacity
- Corner decorations: 20x20px gold squares
- Padding: 20px all sides
- Portrait frame: 120x120px with 2px gold border
```

### 2. **Menu Box**
```
Structure:
┌─────────────────┐
│ ┌─┐         ┌─┐ │
│ └─┘ [Title] └─┘ │
│ ───────────────│
│ > Option 1     │
│   Option 2     │
│   Option 3     │
│   Cancel       │
└─────────────────┘

Specifications:
- Width: 300px minimum, auto-expand for content
- Border: 3px cream with gold corners
- Item height: 40px
- Hover state: Background changes to gold, text to dark brown
- Active indicator: ">" symbol in gold
- Separator: 2px gold line under title
```

### 3. **Status Display**
```
Structure:
┌─────────────────┐
│ HP ████████░░ 75│
│ MP ████░░░░░░ 50│
│ LV 5  EXP 1,234│
└─────────────────┘

Specifications:
- Bar width: 120px
- Bar height: 16px
- Bar background: Black (#000000)
- HP bar color: Ruby (#c41e3a)
- MP bar color: Sapphire (#4169e1)
- Text: 14px cream color
```

### 4. **Decorative Elements**

#### Corner Decorations
```
┌─┐     ┌─┐
└─┘     └─┘
Size: 20x20px
Color: Gold (#d4af37)
Border: 2px
Position: Overlap main border by 1px
```

#### Ornamental Dividers
```
═══════◆═══════
────◇────
❖ ❖ ❖
```

## Animation Guidelines

### Timing
- **Fade In**: 200-300ms ease-out
- **Fade Out**: 150-200ms ease-in
- **Slide In**: 250ms ease-out
- **Hover Transitions**: 150ms ease

### Effects
```javascript
// Dialogue box entrance
fadeIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: 250ms
}

// Continue indicator bounce
bounce: {
    animation: "0-3px vertical movement",
    duration: 1000ms,
    loop: infinite,
    easing: "sinusoidal"
}

// Menu item hover
hover: {
    background: "transition to gold",
    duration: 150ms,
    scale: 1.02
}
```

## Implementation Examples

### CSS Example
```css
.hd2d-dialogue-box {
    width: 800px;
    min-height: 200px;
    background: rgba(42, 31, 26, 0.9);
    border: 3px solid #f4e4c1;
    padding: 20px;
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    font-family: "Courier New", monospace;
    font-size: 18px;
    color: #f4e4c1;
    text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
}

.hd2d-menu-item:hover {
    background: #d4af37;
    color: #2a1f1a;
    transform: scale(1.02);
    transition: all 150ms ease-out;
}
```

### Color Usage Example
```javascript
const HD2D_THEME = {
    dialogue: {
        background: "rgba(42, 31, 26, 0.9)",
        border: "#f4e4c1",
        text: "#f4e4c1",
        speaker: "#d4af37"
    },
    menu: {
        background: "#2a1f1a",
        hoverBg: "#d4af37",
        hoverText: "#2a1f1a"
    },
    status: {
        hp: "#c41e3a",
        mp: "#4169e1",
        exp: "#d4af37"
    }
};
```

## Best Practices

### Do's
- ✓ Maintain consistent 3px borders throughout
- ✓ Use gold accents sparingly for emphasis
- ✓ Keep text shadows for all text elements
- ✓ Animate UI entrance/exit for polish
- ✓ Test readability at different resolutions
- ✓ Use semi-transparent backgrounds for overlay elements

### Don'ts
- ✗ Don't use pure black (#000000) for backgrounds
- ✗ Don't use thin (1px) borders - they get lost
- ✗ Don't over-animate - keep it subtle
- ✗ Don't use more than 3 colors in a single component
- ✗ Don't forget corner decorations on major UI panels
- ✗ Don't use anti-aliased/smooth fonts

## Accessibility Considerations

1. **Contrast Ratios**
   - Cream on Dark Brown: 9.2:1 (AAA compliant)
   - Gold on Dark Brown: 6.1:1 (AA compliant)
   - Always test with color blindness simulators

2. **Font Sizes**
   - Never go below 12px for important information
   - Provide UI scaling options (75%, 100%, 125%, 150%)

3. **Animation**
   - Provide option to disable UI animations
   - Ensure all animations respect prefers-reduced-motion

## References
- Octopath Traveler UI design
- Final Fantasy VI menu systems
- Chrono Trigger dialogue boxes
- Live A Live status displays