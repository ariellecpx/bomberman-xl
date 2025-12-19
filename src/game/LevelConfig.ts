export interface LevelConfig {
    level: number;
    name: string;
    blockTexture: string;
    blockColor: number;
    enemyCount: number;
    enemySpeed: number;
    powerupChance: number;
}

export const LEVELS: LevelConfig[] = [
    {
        level: 1,
        name: 'Brick Ruins',
        blockTexture: 'brick_block',
        blockColor: 0x8B4513,
        enemyCount: 3,
        enemySpeed: 80,
        powerupChance: 0.4
    },
    {
        level: 2,
        name: 'Wooden Village',
        blockTexture: 'wood_block',
        blockColor: 0xDEB887,
        enemyCount: 4,
        enemySpeed: 90,
        powerupChance: 0.35
    },
    {
        level: 3,
        name: 'Ice Palace',
        blockTexture: 'ice_block',
        blockColor: 0xADD8E6,
        enemyCount: 5,
        enemySpeed: 100,
        powerupChance: 0.3
    },
    {
        level: 4,
        name: 'Flower Garden',
        blockTexture: 'flower_block',
        blockColor: 0xFF69B4,
        enemyCount: 5,
        enemySpeed: 110,
        powerupChance: 0.3
    },
    {
        level: 5,
        name: 'Circus Arena',
        blockTexture: 'circus_block',
        blockColor: 0xFF6347,
        enemyCount: 6,
        enemySpeed: 120,
        powerupChance: 0.25
    },
    {
        level: 6,
        name: 'Frozen Wasteland',
        blockTexture: 'frozen_block',
        blockColor: 0xB0E0E6,
        enemyCount: 6,
        enemySpeed: 130,
        powerupChance: 0.25
    },
    {
        level: 7,
        name: 'Mushroom Forest',
        blockTexture: 'shroom_block',
        blockColor: 0x8B008B,
        enemyCount: 7,
        enemySpeed: 140,
        powerupChance: 0.2
    },
    {
        level: 8,
        name: 'Molten Core',
        blockTexture: 'molten_block',
        blockColor: 0xFF4500,
        enemyCount: 7,
        enemySpeed: 150,
        powerupChance: 0.2
    },
    {
        level: 9,
        name: 'Dirt Cavern',
        blockTexture: 'dirt_block',
        blockColor: 0x654321,
        enemyCount: 8,
        enemySpeed: 160,
        powerupChance: 0.15
    }
];

export function getLevelConfig(level: number): LevelConfig {
    const index = Math.min(level - 1, LEVELS.length - 1);
    return LEVELS[Math.max(0, index)];
}
