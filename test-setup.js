const fs = require('fs');
const path = require('path');

console.log('=== Testing Project Setup ===\n');

// Check if node_modules exists
const nodeModulesExists = fs.existsSync('./node_modules');
console.log(`✓ node_modules exists: ${nodeModulesExists}`);

// Check if Phaser is installed
const phaserPath = './node_modules/phaser';
const phaserExists = fs.existsSync(phaserPath);
console.log(`✓ Phaser installed: ${phaserExists}`);

if (phaserExists) {
    const phaserPackage = JSON.parse(fs.readFileSync('./node_modules/phaser/package.json', 'utf8'));
    console.log(`  - Phaser version: ${phaserPackage.version}`);
}

// Check TypeScript files
const srcFiles = [
    './src/main.ts',
    './src/scenes/BootScene.ts',
    './src/scenes/PreloadScene.ts',
    './src/scenes/TownScene.ts'
];

console.log('\n✓ Source files:');
srcFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  - ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Check if TypeScript compiles
console.log('\n✓ Running TypeScript check...');
const { execSync } = require('child_process');
try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('  - TypeScript compilation: SUCCESS');
} catch (error) {
    console.log('  - TypeScript compilation: FAILED');
    console.log(error.stdout?.toString());
}

console.log('\n=== Setup test complete ===');