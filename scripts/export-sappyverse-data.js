// Export Sappyverse localStorage Data
// This script exports all Sappyverse-related data from localStorage to a JSON file

(function exportSappyverseData() {
  const sappyData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: {}
  };

  // Collect all relevant localStorage keys
  const relevantKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('sappyverse') || key.includes('hd2d'))) {
      relevantKeys.push(key);
    }
  }

  // Sort keys for consistent output
  relevantKeys.sort();

  // Extract data
  relevantKeys.forEach(key => {
    const value = localStorage.getItem(key);
    try {
      // Try to parse JSON values for better formatting
      sappyData.data[key] = JSON.parse(value);
    } catch {
      // If not JSON, store as string
      sappyData.data[key] = value;
    }
  });

  // Create formatted JSON
  const jsonString = JSON.stringify(sappyData, null, 2);

  // Create download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sappyverse-data-${new Date().toISOString().split('T')[0]}.json`;
  
  // Auto-download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Log summary
  console.log(`✅ Exported ${relevantKeys.length} localStorage entries`);
  console.log('Exported keys:', relevantKeys);
  console.log('\nTo use this data:');
  console.log('1. Send the downloaded JSON file to your friend');
  console.log('2. Have them run the import script with this file');
  
  // Also log to console for manual copy if needed
  console.log('\nExported data (for manual copy):');
  console.log(jsonString);
})();