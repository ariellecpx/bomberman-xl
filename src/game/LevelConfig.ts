export interface LevelConfig {
    level: number;
    name: string;
    blockTexture: string;
    wallTint: number; // For the indestructible walls
    enemyCount: number;
    enemySpeed: number;
    powerupChance: number;
    blockDensity: number;
}

export const LEVELS: LevelConfig[] = [
    {
        level: 1,
        name: 'Brick Ruins',
        blockTexture: 'brick_block',
        wallTint: 0x666666,
        enemyCount: 3,
        enemySpeed: 100,
        powerupChance: 0.4,
        blockDensity: 0.5
    },
    {
        level: 2,
        name: 'Wooden Village',
        blockTexture: 'wood_block',
        wallTint: 0x8B4513,
        enemyCount: 4,
        enemySpeed: 110,
        powerupChance: 0.35,
        blockDensity: 0.6
    },
    {
        level: 3,
        name: 'Ice Palace',
        blockTexture: 'ice_block',
        wallTint: 0x4B9CD3,
        enemyCount: 5,
        enemySpeed: 120,
        powerupChance: 0.3,
        blockDensity: 0.65
    },
    {
        level: 4,
        name: 'Flower Garden',
        blockTexture: 'flower_block',
        wallTint: 0x8B008B,
        enemyCount: 6,
        enemySpeed: 130,
        powerupChance: 0.3,
        blockDensity: 0.7
    },
    {
        level: 5,
        name: 'Circus Arena',
        blockTexture: 'circus_block',
        wallTint: 0xAA0000,
        enemyCount: 7,
        enemySpeed: 140,
        powerupChance: 0.25,
        blockDensity: 0.75
    },
    {
        level: 6,
        name: 'Frozen Wasteland',
        blockTexture: 'frozen_block',
        wallTint: 0x2F4F4F,
        enemyCount: 8,
        enemySpeed: 150,
        powerupChance: 0.25,
        blockDensity: 0.8
    },
    {
        level: 7,
        name: 'Mushroom Forest',
        blockTexture: 'shroom_block',
        wallTint: 0x556B2F,
        enemyCount: 9,
        enemySpeed: 160,
        powerupChance: 0.2,
        blockDensity: 0.85
    },
    {
        level: 8,
        name: 'Molten Core',
        blockTexture: 'molten_block',
        wallTint: 0x442200,
        enemyCount: 10,
        enemySpeed: 170,
        powerupChance: 0.15,
        blockDensity: 0.9
    },
    {
        level: 9,
        name: 'Dirt Cavern',
        blockTexture: 'dirt_block',
        wallTint: 0x333333,
        enemyCount: 12,
        enemySpeed: 180,
        powerupChance: 0.1,
        blockDensity: 0.95
    }
];

export function getLevelConfig(level: number): LevelConfig {
    const index = Math.min(level - 1, LEVELS.length - 1);
    return LEVELS[Math.max(0, index)];
}
