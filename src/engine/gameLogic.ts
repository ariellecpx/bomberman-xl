import { CellType, type GameState, type Player, type Position, type Bomb, type Explosion } from './types';
import { GRID_ROWS, GRID_COLS, BOMB_TIMER, EXPLOSION_DURATION } from './constants';
import { createInitialGrid } from './utils';

const PLAYER_SIZE = 0.8; // Player is 80% of tile size

export const getTileAt = (grid: CellType[][], x: number, y: number): CellType => {
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return CellType.Wall;
    return grid[Math.floor(y)][Math.floor(x)];
};

export const isWalkable = (cell: CellType, _hasBombPass: boolean = false): boolean => {
    return cell === CellType.Empty;
};

export const checkCollision = (grid: CellType[][], x: number, y: number): boolean => {
    const halfSize = PLAYER_SIZE / 2;
    const corners: Position[] = [
        { x: x - halfSize, y: y - halfSize },
        { x: x + halfSize, y: y - halfSize },
        { x: x - halfSize, y: y + halfSize },
        { x: x + halfSize, y: y + halfSize },
    ];

    for (const corner of corners) {
        const tile = getTileAt(grid, corner.x, corner.y);
        if (!isWalkable(tile)) {
            return true;
        }
    }
    return false;
};

export const moveEntity = (
    entity: Player,
    grid: CellType[][],
    dx: number,
    dy: number,
): Player => {
    const dist = entity.speed;

    let nextX = entity.x + dx * dist;
    let nextY = entity.y + dy * dist;

    // X Collision
    if (dx !== 0) {
        if (checkCollision(grid, nextX, entity.y)) {
            nextX = entity.x;
        }
    }

    // Y Collision
    if (dy !== 0) {
        if (checkCollision(grid, nextX, nextY)) {
            nextY = entity.y;
        }
    }

    return {
        ...entity,
        x: nextX,
        y: nextY,
        moving: dx !== 0 || dy !== 0,
        direction: dx > 0 ? 'RIGHT' : dx < 0 ? 'LEFT' : dy > 0 ? 'DOWN' : dy < 0 ? 'UP' : entity.direction,
    };
};

export const updateEnemies = (enemies: any[], grid: CellType[][], player: Player): { nextEnemies: any[], playerDead: boolean } => {
    let playerHit = false;
    const nextEnemies = enemies.map(enemy => {
        // Simple AI: Move in current direction. If hit wall, pick random new direction.
        let dx = 0;
        let dy = 0;
        if (enemy.direction === 'UP') dy = -1;
        else if (enemy.direction === 'DOWN') dy = 1;
        else if (enemy.direction === 'LEFT') dx = -1;
        else if (enemy.direction === 'RIGHT') dx = 1;

        let nextX = enemy.x + dx * 0.05; // Slower speed
        let nextY = enemy.y + dy * 0.05;

        let collided = false;
        if (dx !== 0 && checkCollision(grid, nextX, enemy.y)) collided = true;
        if (dy !== 0 && checkCollision(grid, nextX, nextY)) collided = true;

        if (collided) {
            // Pick new random direction
            const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
            const newDir = dirs[Math.floor(Math.random() * dirs.length)];
            return { ...enemy, direction: newDir, x: Math.round(enemy.x * 2) / 2, y: Math.round(enemy.y * 2) / 2 }; // Snap to grid slightly to avoid sticking
        } else {
            // Check collision with player
            const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
            if (dist < 0.6) {
                playerHit = true;
            }
            return { ...enemy, x: nextX, y: nextY };
        }
    });
    return { nextEnemies, playerDead: playerHit };
};

export const updateGame = (gameState: GameState, activeKeys: Set<string>): GameState => {
    let { player, grid, bombs, enemies } = gameState;

    // 1. Movement
    let dx = 0;
    let dy = 0;

    if (activeKeys.has('ArrowUp')) dy -= 1;
    else if (activeKeys.has('ArrowDown')) dy += 1;
    else if (activeKeys.has('ArrowLeft')) dx -= 1;
    else if (activeKeys.has('ArrowRight')) dx += 1;

    player = moveEntity(player, grid, dx, dy);

    // 2. Bomb Placement
    // We need a way to debounce spacebar so it doesn't spam bombs.
    // For now, let's just check if space is pressed and we don't have a bomb at current location.
    // Ideally, useKeyboard should handle "just pressed".
    // Or we store "lastSpacePressed" in gameState?
    // Let's rely on simple check: limit bombs by count.
    // A better way is to track if space was pressed in previous frame, but activeKeys is current state.
    // We'll accept spam if invalid, but if valid?
    // User will tap space.

    if (activeKeys.has(' ')) {
        const bombX = Math.floor(player.x);
        const bombY = Math.floor(player.y);

        // Check if bomb already exists there
        const existingBomb = bombs.find(b => b.x === bombX && b.y === bombY);
        // Check active bombs limit
        const activeBombsCount = bombs.filter(b => b.ownerId === player.id).length;

        if (!existingBomb && activeBombsCount < player.bombs) {
            bombs = [...bombs, {
                id: Math.random().toString(36).substr(2, 9),
                ownerId: player.id,
                x: bombX,
                y: bombY,
                timer: BOMB_TIMER,
                range: player.range
            }];
        }
    }

    // 3. Update Bombs and Handle Explosions
    const nextBombs: Bomb[] = [];
    let nextExplosions: Explosion[] = [...gameState.explosions];

    // Decrease explosion timers
    nextExplosions = nextExplosions.filter(exp => {
        exp.timer -= 16;
        return exp.timer > 0;
    });

    const newExplosions: Explosion[] = [];

    bombs.forEach(bomb => {
        bomb.timer -= 16;
        if (bomb.timer <= 0) {
            // Explode center
            newExplosions.push({
                id: Math.random().toString(),
                x: bomb.x,
                y: bomb.y,
                timer: EXPLOSION_DURATION
            });

            // Expand in 4 directions
            const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
            dirs.forEach(d => {
                for (let i = 1; i <= bomb.range; i++) {
                    const tx = bomb.x + d.x * i;
                    const ty = bomb.y + d.y * i;
                    const tile = getTileAt(grid, tx, ty);

                    if (tile === CellType.Wall) break; // Stop at hard wall

                    newExplosions.push({
                        id: Math.random().toString(),
                        x: tx,
                        y: ty,
                        timer: EXPLOSION_DURATION
                    });

                    if (tile === CellType.Block) {
                        // Destroy block and stop
                        break;
                    }
                }
            });

        } else {
            nextBombs.push(bomb);
        }
    });

    // Apply block destruction from new explosions
    let nextGrid = grid;
    if (newExplosions.length > 0) {
        nextGrid = grid.map(row => [...row]);
        newExplosions.forEach(exp => {
            if (nextGrid[exp.y] && nextGrid[exp.y][exp.x] === CellType.Block) {
                // Check if door
                if (Math.floor(gameState.doorPosition.x) === exp.x && Math.floor(gameState.doorPosition.y) === exp.y) {
                    nextGrid[exp.y][exp.x] = CellType.Door;
                } else {
                    nextGrid[exp.y][exp.x] = CellType.Empty;
                }
            }
        });
    }

    nextExplosions = [...nextExplosions, ...newExplosions];

    // 4. Update Enemies
    const { nextEnemies, playerDead } = updateEnemies(enemies, grid, player);

    // Check if player hit by explosion
    let isDead = playerDead;
    if (!isDead) {
        // simple check
        nextExplosions.forEach(exp => {
            if (Math.abs(exp.x - player.x) < 0.6 && Math.abs(exp.y - player.y) < 0.6) {
                isDead = true;
            }
        });
    }

    // Check Win Condition (Player on Door + No Enemies)
    let nextLevel = gameState.level;
    let nextScore = gameState.score;

    const pCx = Math.floor(player.x);
    const pCy = Math.floor(player.y);
    if (grid[pCy][pCx] === CellType.Door) {
        if (nextEnemies.length === 0) {
            console.log("LEVEL_COMPLETE");
            nextLevel += 1;
            nextGrid = createInitialGrid();

            // Spawn new enemies
            // Ideally use level config. For now random.
            // Reset player (keep lives/score/range)
            player = { ...player, x: 1.5, y: 1.5, direction: null, moving: false };
            nextBombs.length = 0; // Clear bombs
            nextExplosions.length = 0; // Clear explosions

            // Add simple enemy scaling
            const enemyCount = Math.min(3 + nextLevel, 10);
            nextEnemies.length = 0;
            for (let i = 0; i < enemyCount; i++) {
                // Random pos away from player
                let ex = Math.floor(Math.random() * (GRID_COLS - 4)) + 3;
                let ey = Math.floor(Math.random() * (GRID_ROWS - 2)) + 1;
                while (nextGrid[ey][ex] === CellType.Wall) {
                    ex = Math.floor(Math.random() * (GRID_COLS - 4)) + 3;
                    ey = Math.floor(Math.random() * (GRID_ROWS - 2)) + 1;
                }
                nextEnemies.push({
                    id: `e-${nextLevel}-${i}`,
                    type: 'enemy',
                    x: ex + 0.5,
                    y: ey + 0.5,
                    direction: i % 2 === 0 ? 'LEFT' : 'DOWN',
                    moving: true
                });
            }
        }
    }

    return {
        ...gameState,
        player,
        enemies: nextEnemies,
        bombs: nextBombs,
        explosions: nextExplosions,
        grid: nextGrid,
        level: nextLevel,
        score: nextScore,
        isGameOver: gameState.isGameOver || isDead,
    };
};
