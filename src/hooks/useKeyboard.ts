import { useEffect, useState } from 'react';

export const useKeyboard = () => {
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent scrolling for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            setActiveKeys((prev) => {
                const newKeys = new Set(prev);
                newKeys.add(e.key);
                return newKeys;
            });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            setActiveKeys((prev) => {
                const newKeys = new Set(prev);
                newKeys.delete(e.key);
                return newKeys;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return activeKeys;
};
