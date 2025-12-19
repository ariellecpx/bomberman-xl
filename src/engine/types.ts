export const CellType = {
    Empty: 0,
    Wall: 1, // Indestructible
    Block: 2, // Destructible
    Door: 3, // Level exit
} as const;

export type CellType = typeof CellType[keyof typeof CellType];

export type Position = {
    x: number; // Grid x (col)
    y: number; // Grid y (row)
};

export type Entity = {
    id: string;
    type: 'player' | 'enemy';
    x: number; // Pixel x
    y: number; // Pixel y
    direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
    moving: boolean;
};

export type Player = Entity & {
    bombs: number;
    range: number;
    speed: number;
    isAlive: boolean;
};

export type Bomb = {
    id: string;
    x: number; // Grid x
    y: number; // Grid y
    timer: number;
    range: number;
    ownerId: string;
};

export type Explosion = {
    id: string;
    x: number;
    y: number;
    timer: number;
};

export type GameState = {
    grid: CellType[][];
    player: Player;
    enemies: Entity[];
    bombs: Bomb[];
    explosions: Explosion[];
    score: number;
    timeLeft: number;
    lives: number;
    level: number;
    doorPosition: Position;
    isGameOver: boolean;
    isPaused: boolean;
};
