import React from 'react';
import { useGameLoop } from '../engine/useGameLoop';
import { useKeyboard } from '../hooks/useKeyboard';
import { TILE_SIZE } from '../engine/constants';
import './Game.css';

const Game: React.FC = () => {
    const activeKeys = useKeyboard();
    const { gameState } = useGameLoop(activeKeys);

    const { grid, player, isGameOver } = gameState;

    return (
        <div className="game-wrapper">
            {isGameOver && <div className="game-over">GAME OVER</div>}

            <div
                className="board"
                style={{
                    width: grid[0].length * TILE_SIZE,
                    height: grid.length * TILE_SIZE,
                }}
            >
                {/* Render Grid */}
                {grid.map((row, y) => (
                    row.map((cell, x) => (
                        <div
                            key={`${x}-${y}`}
                            className={`cell cell-${cell}`}
                            style={{
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                left: x * TILE_SIZE,
                                top: y * TILE_SIZE,
                            }}
                        />
                    ))
                ))}

                {/* Render Bombs */}
                {gameState.bombs.map(bomb => (
                    <div
                        key={bomb.id}
                        className="entity bomb"
                        style={{
                            width: TILE_SIZE * 0.8,
                            height: TILE_SIZE * 0.8,
                            left: bomb.x * TILE_SIZE + (TILE_SIZE * 0.1),
                            top: bomb.y * TILE_SIZE + (TILE_SIZE * 0.1),
                        }}
                    />
                ))}

                {/* Render Explosions */}
                {gameState.explosions.map(exp => (
                    <div
                        key={exp.id}
                        className="entity explosion"
                        style={{
                            width: TILE_SIZE,
                            height: TILE_SIZE,
                            left: exp.x * TILE_SIZE,
                            top: exp.y * TILE_SIZE,
                            opacity: exp.timer / 1000,
                        }}
                    />
                ))}

                {/* Render Enemies */}
                {gameState.enemies.map(enemy => (
                    <div
                        key={enemy.id}
                        className="entity enemy"
                        style={{
                            width: TILE_SIZE * 0.8,
                            height: TILE_SIZE * 0.8,
                            left: enemy.x * TILE_SIZE - (TILE_SIZE * 0.4) + (TILE_SIZE / 2),
                            top: enemy.y * TILE_SIZE - (TILE_SIZE * 0.4) + (TILE_SIZE / 2),
                        }}
                    />
                ))}

                {/* Render Player */}
                <div
                    className="entity player"
                    style={{
                        width: TILE_SIZE * 0.8,
                        height: TILE_SIZE * 0.8,
                        top: (player.y * TILE_SIZE) - (TILE_SIZE * 0.8 / 2),
                        left: (player.x * TILE_SIZE) - (TILE_SIZE * 0.8 / 2),
                    }}
                />
            </div>

            <div className="hud">
                <p>Score: {gameState.score}</p>
                <p>Time: {gameState.timeLeft}</p>
                <p>Lives: {gameState.lives}</p>
            </div>
        </div>
    );
};

export default Game;
