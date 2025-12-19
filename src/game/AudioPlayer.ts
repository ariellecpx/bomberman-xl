// Simple audio player for MP3 files
export class AudioPlayer {
    private audio: HTMLAudioElement | null = null;

    load(path: string, loop: boolean = true, volume: number = 0.5) {
        this.audio = new Audio(path);
        this.audio.loop = loop;
        this.audio.volume = volume;

        this.audio.addEventListener('error', () => {
            console.warn(`Could not load audio: ${path}`);
            this.audio = null;
        });
    }

    play() {
        if (this.audio) {
            this.audio.play().catch(err => {
                console.warn('Could not play audio:', err);
            });
        }
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }

    setVolume(volume: number) {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }
}

// Global audio players
export const startScreenMusic = new AudioPlayer();
export const gameMusic = new AudioPlayer();

// Initialize on load
startScreenMusic.load('assets/sounds/start_screen.mp3', true, 0.4);
gameMusic.load('assets/sounds/background_music.mp3', true, 0.5);
