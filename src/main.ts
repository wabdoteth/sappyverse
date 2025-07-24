import Phaser from 'phaser';
import { GAME_CONFIG } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TownScene } from './scenes/TownScene';
import { SimpleTownScene } from './scenes/SimpleTownScene';
import { TownScene2D5 } from './scenes/TownScene2D5';
import { DungeonScene } from './scenes/DungeonScene';
import { DungeonSceneTurnBased } from './scenes/DungeonSceneTurnBased';
import { TurnBasedCombatSystem } from './systems/TurnBasedCombatSystem';
import { CombatEncounterScene } from './scenes/CombatEncounterScene';
import { UpgradeCardSelectionScene } from './scenes/UpgradeCardSelectionScene';
import { MetaUpgradeScene } from './scenes/MetaUpgradeScene';
import { CombatFlowScene } from './scenes/CombatFlowScene';
import { PostCombatExplorationScene } from './scenes/PostCombatExplorationScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
  width: GAME_CONFIG.BASE_WIDTH,
  height: GAME_CONFIG.BASE_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.BASE_WIDTH,
    height: GAME_CONFIG.BASE_HEIGHT,
    zoom: GAME_CONFIG.SCALE_FACTOR
  },
  pixelArt: GAME_CONFIG.PIXEL_ART,
  antialias: GAME_CONFIG.ANTIALIASING,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  scene: [BootScene, PreloadScene, TownScene, SimpleTownScene, TownScene2D5, DungeonScene, DungeonSceneTurnBased, TurnBasedCombatSystem, CombatEncounterScene, UpgradeCardSelectionScene, MetaUpgradeScene, CombatFlowScene, PostCombatExplorationScene]
};

try {
  console.log('Starting Phaser game with config:', config);
  const game = new Phaser.Game(config);
  console.log('Game instance created:', game);
} catch (error) {
  console.error('Error creating Phaser game:', error);
}