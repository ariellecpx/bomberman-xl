import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { BootScene } from './scenes/BootScene';
import { StartScene } from './scenes/StartScene';

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,  // Widescreen HD
        height: 1080, // Widescreen HD
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
        },
    },
    scene: [BootScene, StartScene, MainScene],
    backgroundColor: '#0a0a2a', // Modern dark sci-fi background
};

export const createGame = () => new Phaser.Game(config);
