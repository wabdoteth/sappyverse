// Script to clear barrel collision data from localStorage and registry
// Run this in the browser console to start fresh with barrel collisions

function clearBarrelCollision() {
    console.log('Clearing barrel collision data and registry...');
    
    // Remove barrel collision data
    const barrelCollisionKey = 'sappyverse_collision_barrel';
    if (localStorage.getItem(barrelCollisionKey)) {
        localStorage.removeItem(barrelCollisionKey);
        console.log('Removed barrel collision data from localStorage');
    }
    
    // Remove barrel from model registry
    const registryKey = 'sappyverse_model_registry';
    const registryData = localStorage.getItem(registryKey);
    
    if (registryData) {
        try {
            let models = JSON.parse(registryData);
            const originalCount = models.length;
            
            // Filter out barrel
            models = models.filter(model => model.name !== 'barrel');
            
            if (models.length < originalCount) {
                localStorage.setItem(registryKey, JSON.stringify(models));
                console.log('Removed barrel from model registry');
            } else {
                console.log('Barrel not found in model registry');
            }
        } catch (e) {
            console.error('Failed to parse model registry:', e);
        }
    }
    
    // Remove barrel from all collisions registry
    const allCollisionsKey = 'sappyverse_all_collisions';
    const allCollisions = localStorage.getItem(allCollisionsKey);
    
    if (allCollisions) {
        try {
            let collisions = JSON.parse(allCollisions);
            if (collisions.barrel) {
                delete collisions.barrel;
                localStorage.setItem(allCollisionsKey, JSON.stringify(collisions));
                console.log('Removed barrel from all collisions registry');
            }
        } catch (e) {
            console.error('Failed to parse all collisions:', e);
        }
    }
    
    // Also check if window.__modelRegistry exists and remove barrel from there
    if (window.__modelRegistry) {
        const models = window.__modelRegistry.getAllModels();
        const barrel = models.find(m => m.name === 'barrel');
        if (barrel) {
            // Can't directly remove from registry, but we can clear its collision path
            barrel.collisionSetupPath = null;
            console.log('Cleared barrel collision path from active registry');
        }
    }
    
    console.log('Barrel collision data and registry entries cleared!');
    console.log('Please refresh the page to ensure the barrel is re-registered properly.');
}

// Run the cleanup
clearBarrelCollision();