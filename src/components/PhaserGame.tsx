import React, { useEffect, useRef } from 'react';
import { createGame } from '../game/config';

export const PhaserGame: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = createGame();
        }

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return <div id="phaser-game" style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }} />;
};
