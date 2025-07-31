# Sappyverse Data Export/Import Scripts

These scripts help you export and import all Sappyverse-related localStorage data.

## Export Script

### Usage:
1. Open your Sappyverse game in the browser
2. Open the browser console (F12)
3. Copy and paste the contents of `export-sappyverse-data.js`
4. Press Enter to run

The script will:
- Find all localStorage keys containing 'sappyverse' or 'hd2d'
- Export them to a timestamped JSON file
- Automatically download the file
- Log a summary to the console

### What's Exported:
- Model registry configurations
- Collision data for all models
- Game settings (graphics, gameplay, audio)
- Player progression data
- Any other Sappyverse-related localStorage entries

## Import Script

### Usage:
1. Open your Sappyverse game in the browser
2. Open the browser console (F12)
3. Copy and paste the contents of `import-sappyverse-data.js`
4. Press Enter to run
5. Select the JSON file exported from another instance

The script will:
- Show what will be imported
- Warn about entries that will be overwritten
- Import all data after confirmation
- Suggest reloading the page

### Alternative Manual Import:
If the file picker doesn't work, you can import manually:
```javascript
// After running the import script, use:
window.importSappyverseData('paste JSON string here');
```

## Quick Copy-Paste Commands

### To Export:
```javascript
// Run in browser console
fetch('/scripts/export-sappyverse-data.js').then(r => r.text()).then(eval);
```

### To Import:
```javascript
// Run in browser console
fetch('/scripts/import-sappyverse-data.js').then(r => r.text()).then(eval);
```

## Notes:
- Always backup your existing data before importing
- The game may need to be reloaded after import
- JSON files can be edited manually if needed
- Collision data is critical for proper model behavior