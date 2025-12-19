import { GRID_COLS, GRID_ROWS } from './constants';
import { CellType, type GameState } from './types';

export const createInitialGrid = (): CellType[][] => {
    const grid: CellType[][] = Array.from({ length: GRID_ROWS }, () =>
        Array(GRID_COLS).fill(CellType.Empty)
    );

    // Borders
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1) {
                grid[r][c] = CellType.Wall;
            } else if (r % 2 === 0 && c % 2 === 0) {
                // Fixed internal walls
                grid[r][c] = CellType.Wall;
            } else {
                // Random soft blocks (skip top-left for player start)
                if (!((r === 1 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 1))) {
                    if (Math.random() < 0.4) {
                        grid[r][c] = CellType.Block;
                    }
                }
            }
        }
    }

    // Place Door (hidden under a block)
    // Find all blocks
    const blocks: { r: number, c: number }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (grid[r][c] === CellType.Block) blocks.push({ r, c });
        }
    }
    if (blocks.length > 0) {
        // Logic: The door is "under" the block. 
        // In this simple model, we can't layer. 
        // So we'll store the door location in GameState? 
        // Or just mark it 'Door' but render it as Block until destroyed?
        // Classic way: if you execute destroy block, it reveals item/door.
        // Let's store `doorLocation` in GameState.
    }

    return grid;
};

export const createInitialState = (): GameState => {
    return {
        grid: createInitialGrid(),
        player: {
            id: 'p1',
            type: 'player',
            x: 1.5, // Center of Grid unit (1,1)
            y: 1.5, // Center of Grid unit (1,1)
            direction: null,
            moving: false,
            bombs: 1,
            range: 2,
            speed: 0.1, // Grid units per tick
            isAlive: true,
        },
        enemies: [
            { id: 'e1', type: 'enemy', x: 5.5, y: 5.5, direction: 'RIGHT', moving: true },
            { id: 'e2', type: 'enemy', x: 9.5, y: 3.5, direction: 'DOWN', moving: true },
            { id: 'e3', type: 'enemy', x: 13.5, y: 11.5, direction: 'LEFT', moving: true }
        ],
        bombs: [],
        explosions: [],
        score: 0,
        timeLeft: 200,
        lives: 3,
        level: 1,
        doorPosition: { x: GRID_COLS - 2, y: GRID_ROWS - 2 }, // Default simple
        isGameOver: false,
        isPaused: false,
    };
};
