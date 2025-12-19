export interface LevelConfig {
    level: number;
    name: string;
    blockTexture: string;
    floorTexture: string; // New: Dynamic background
    hardBlockTexture: string; // New: Dynamic indestructible wall
    enemyCount: number;
    enemySpeed: number;
    powerupChance: number;
    blockDensity: number;
    // Special Rules
    hasIce?: boolean;
    hasWind?: boolean;
    isDark?: boolean;
}

export const LEVELS: LevelConfig[] = [
    {
        level: 1,
        name: 'Brick Ruins',
        blockTexture: 'hd_block_destructible',
        floorTexture: 'hd_floor',
        hardBlockTexture: 'hd_block_indestructible',
        enemyCount: 3,
        enemySpeed: 100,
        powerupChance: 0.4,
        blockDensity: 0.5
    },
    {
        level: 2,
        name: 'Wooden Village',
        blockTexture: 'wood_block',
        floorTexture: 'hd_wooden_background', // User provided
        hardBlockTexture: 'hd_block_wooden_hard', // Generated
        enemyCount: 4,
        enemySpeed: 110,
        powerupChance: 0.35,
        blockDensity: 0.6
    },
    {
        level: 3,
        name: 'Ice Palace',
        blockTexture: 'ice_block',
        floorTexture: 'hd_floor_ice', // Generated
        hardBlockTexture: 'hd_block_ice_hard', // Generated
        enemyCount: 5,
        enemySpeed: 120,
        powerupChance: 0.3,
        blockDensity: 0.65,
        hasIce: true
    },
    {
        level: 4,
        name: 'Flower Garden',
        blockTexture: 'flower_block',
        floorTexture: 'hd_floor_grass', // Generated
        hardBlockTexture: 'hd_block_garden_hard', // Generated
        enemyCount: 6,
        enemySpeed: 130,
        powerupChance: 0.3,
        blockDensity: 0.7
    },
    {
        level: 5,
        name: 'Circus Arena',
        blockTexture: 'circus_block',
        floorTexture: 'hd_floor',
        hardBlockTexture: 'hd_block_indestructible',
        enemyCount: 7,
        enemySpeed: 140,
        powerupChance: 0.25,
        blockDensity: 0.75,
        hasWind: true
    },
    {
        level: 6,
        name: 'Frozen Wasteland',
        blockTexture: 'frozen_block',
        floorTexture: 'hd_floor_ice',
        hardBlockTexture: 'hd_block_ice_hard',
        enemyCount: 8,
        enemySpeed: 150,
        powerupChance: 0.25,
        blockDensity: 0.8,
        hasIce: true
    },
    {
        level: 7,
        name: 'Mushroom Forest',
        blockTexture: 'shroom_block',
        floorTexture: 'hd_floor_grass',
        hardBlockTexture: 'hd_block_garden_hard',
        enemyCount: 9,
        enemySpeed: 160,
        powerupChance: 0.2,
        blockDensity: 0.85
    },
    {
        level: 8,
        name: 'Molten Core',
        blockTexture: 'molten_block',
        floorTexture: 'hd_floor_molten', // Generated
        hardBlockTexture: 'hd_block_molten_hard', // Generated
        enemyCount: 10,
        enemySpeed: 170,
        powerupChance: 0.15,
        blockDensity: 0.9
    },
    {
        level: 9,
        name: 'Dirt Cavern',
        blockTexture: 'dirt_block',
        floorTexture: 'hd_floor',
        hardBlockTexture: 'hd_block_indestructible',
        enemyCount: 12,
        enemySpeed: 180,
        powerupChance: 0.1,
        blockDensity: 0.95,
        isDark: true
    }
];

export function getLevelConfig(level: number): LevelConfig {
    const index = Math.min(level - 1, LEVELS.length - 1);
    return LEVELS[Math.max(0, index)];
}
