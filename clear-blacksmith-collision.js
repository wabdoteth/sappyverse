// Clear blacksmith collision data from localStorage
const modelName = 'blacksmith';

// Remove from localStorage
const collisionKey = `sappyverse_collision_${modelName}`;
localStorage.removeItem(collisionKey);

// Remove from global collision registry
const allCollisions = JSON.parse(localStorage.getItem('sappyverse_all_collisions') || '{}');
delete allCollisions[modelName];
localStorage.setItem('sappyverse_all_collisions', JSON.stringify(allCollisions));

// Update model registry to remove collision marker
const storedData = localStorage.getItem('sappyverse_model_registry');
if (storedData) {
    try {
        const models = JSON.parse(storedData);
        const modelIndex = models.findIndex(m => m.name === modelName);
        if (modelIndex !== -1) {
            models[modelIndex].hasCollisions = false;
            delete models[modelIndex].collisionSetupPath;
            localStorage.setItem('sappyverse_model_registry', JSON.stringify(models));
        }
    } catch (e) {
        console.error('Failed to update model registry:', e);
    }
}

console.log(`Cleared collision data for ${modelName}`);