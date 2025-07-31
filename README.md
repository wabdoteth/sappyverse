# sappyverse

## Sharing Your Scene with Others

When sharing this project with others, they'll need both the code and your localStorage data (model configurations, collision data, etc.). Here's how to export and import this data:

### Exporting Your Scene Data (For Sender)

1. **Open the game in your browser** (run the project locally first)

2. **Open browser console** (F12 → Console tab)

3. **Run the export script**:
   ```javascript
   // Copy and paste this entire command:
   fetch('/scripts/export-sappyverse-data.js').then(r => r.text()).then(eval);
   ```

4. **A JSON file will download** with a name like `sappyverse-data-2025-07-31.json`

5. **Share this JSON file** along with the repository

### Importing Scene Data (For Recipient)

1. **Clone/download the repository** and install dependencies:
   ```bash
   npm install
   npm run dev
   ```

2. **Open the game in browser** (it may look broken without the data)

3. **Open browser console** (F12 → Console tab)

4. **Run the import script**:
   ```javascript
   // Copy and paste this entire command:
   fetch('/scripts/import-sappyverse-data.js').then(r => r.text()).then(eval);
   ```

5. **Select the JSON file** you received

6. **Confirm the import** when prompted

7. **Reload the page** when asked (or refresh manually)

### What Gets Exported/Imported

- **Model Registry**: Paths and configurations for all 3D models
- **Collision Data**: Collision boxes for every model in the scene
- **Game Settings**: Graphics, gameplay, and audio preferences
- **Meta Progression**: Player progress and unlocked features
- **All other Sappyverse-related data**

### Alternative Manual Method

If the fetch commands don't work, you can manually copy the scripts:

1. Navigate to `/scripts/` folder
2. Open `export-sappyverse-data.js` or `import-sappyverse-data.js`
3. Copy the entire file contents
4. Paste into browser console and press Enter

### Troubleshooting

- **"File not found" error**: Make sure you're running the game locally (`npm run dev`) before running scripts
- **Import doesn't work**: Check browser console for errors, ensure JSON file isn't corrupted
- **Scene still broken**: Verify all asset files in `/public/assets/` are present
- **Models missing**: The paths in the model registry must match your file structure