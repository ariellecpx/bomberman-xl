import { useEffect, useRef, useState } from 'react';
import type { GameState } from './types';
import { createInitialState } from './utils';

import { updateGame } from './gameLogic';

export const useGameLoop = (activeKeys: Set<string>) => {
    const [gameState, setGameState] = useState<GameState>(createInitialState());
    const requestRef = useRef<number | undefined>(undefined);
    const previousTimeRef = useRef<number | undefined>(undefined);

    const update = (_deltaTime: number) => {
        setGameState((prevState) => {
            if (prevState.isPaused || prevState.isGameOver) return prevState;

            return updateGame(prevState, activeKeys);
        });
    };

    const loop = (time: number) => {
        if (previousTimeRef.current !== undefined) {
            // const deltaTime = time - previousTimeRef.current;
            update(0); // Pass dummy or remove arg
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current!);
    }, []);

    return { gameState, setGameState };
};
