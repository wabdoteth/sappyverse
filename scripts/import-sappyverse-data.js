// Import Sappyverse localStorage Data
// This script imports Sappyverse-related data from a JSON file to localStorage

(function() {
  // Create file input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async function(event) {
    const file = event.target.files[0];
    if (!file) {
      console.error('No file selected');
      return;
    }

    try {
      // Read file content
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate data structure
      if (!importData.data || typeof importData.data !== 'object') {
        throw new Error('Invalid data format: missing or invalid "data" field');
      }

      // Optional: Check version compatibility
      if (importData.version) {
        console.log(`Importing data version: ${importData.version}`);
      }
      if (importData.timestamp) {
        console.log(`Data exported on: ${importData.timestamp}`);
      }

      // Confirm before import
      const entries = Object.entries(importData.data);
      const existingKeys = entries.filter(([key]) => localStorage.getItem(key) !== null);
      
      let message = `This will import ${entries.length} localStorage entries.`;
      if (existingKeys.length > 0) {
        message += `\n\n⚠️ WARNING: ${existingKeys.length} entries already exist and will be overwritten:\n`;
        message += existingKeys.map(([key]) => `- ${key}`).join('\n');
      }
      message += '\n\nContinue with import?';
      
      if (!confirm(message)) {
        console.log('Import cancelled by user');
        return;
      }

      // Import data
      let importedCount = 0;
      let errors = [];
      
      entries.forEach(([key, value]) => {
        try {
          // Convert objects back to strings for localStorage
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          localStorage.setItem(key, stringValue);
          importedCount++;
        } catch (error) {
          errors.push({ key, error: error.message });
        }
      });

      // Report results
      console.log(`✅ Successfully imported ${importedCount} entries`);
      
      if (errors.length > 0) {
        console.error(`❌ Failed to import ${errors.length} entries:`, errors);
      }
      
      // Show imported keys
      console.log('\nImported keys:');
      entries.forEach(([key]) => console.log(`- ${key}`));
      
      // Suggest page reload
      console.log('\n💡 You may need to reload the page for changes to take effect.');
      
      if (confirm('Import complete! Reload the page now?')) {
        location.reload();
      }

    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.message}`);
    }
  };
  
  // Trigger file selection
  input.click();
  
  // Also provide manual import option
  window.importSappyverseData = function(jsonString) {
    try {
      const importData = JSON.parse(jsonString);
      
      // Trigger the import process
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], 'manual-import.json', { type: 'application/json' });
      
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: { files: [file] },
        writable: false
      });
      
      input.onchange(event);
    } catch (error) {
      console.error('Manual import failed:', error);
    }
  };
  
  console.log('📁 Select a JSON file to import Sappyverse data...');
  console.log('Or use window.importSappyverseData(jsonString) for manual import');
})();