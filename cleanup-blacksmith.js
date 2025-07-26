// Script to remove blacksmith from localStorage and model registry
// Run this in the browser console to clean up blacksmith references

function cleanupBlacksmith() {
    console.log('Starting blacksmith cleanup...');
    
    // Remove blacksmith collision data from localStorage
    const blacksmithCollisionKey = 'sappyverse_collision_blacksmith';
    if (localStorage.getItem(blacksmithCollisionKey)) {
        localStorage.removeItem(blacksmithCollisionKey);
        console.log('Removed blacksmith collision data from localStorage');
    }
    
    // Remove blacksmith from model registry
    const registryKey = 'sappyverse_model_registry';
    const registryData = localStorage.getItem(registryKey);
    
    if (registryData) {
        try {
            let models = JSON.parse(registryData);
            const originalCount = models.length;
            
            // Filter out blacksmith
            models = models.filter(model => model.name !== 'blacksmith');
            
            if (models.length < originalCount) {
                localStorage.setItem(registryKey, JSON.stringify(models));
                console.log('Removed blacksmith from model registry');
            } else {
                console.log('Blacksmith not found in model registry');
            }
        } catch (e) {
            console.error('Failed to parse model registry:', e);
        }
    }
    
    // Remove blacksmith from all collisions registry
    const allCollisionsKey = 'sappyverse_all_collisions';
    const allCollisions = localStorage.getItem(allCollisionsKey);
    
    if (allCollisions) {
        try {
            let collisions = JSON.parse(allCollisions);
            if (collisions.blacksmith) {
                delete collisions.blacksmith;
                localStorage.setItem(allCollisionsKey, JSON.stringify(collisions));
                console.log('Removed blacksmith from all collisions registry');
            }
        } catch (e) {
            console.error('Failed to parse all collisions:', e);
        }
    }
    
    console.log('Blacksmith cleanup complete!');
    console.log('Please refresh the page to see the changes.');
}

// Run the cleanup
cleanupBlacksmith();