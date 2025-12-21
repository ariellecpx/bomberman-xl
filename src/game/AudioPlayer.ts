// Simple audio player for MP3 files
export class AudioPlayer {
    private audio: HTMLAudioElement | null = null;
    private _volume: number = 0.5;
    private _isMuted: boolean = false;

    load(path: string, loop: boolean = true, volume: number = 0.5) {
        this.audio = new Audio(path);
        this.audio.loop = loop;
        this._volume = volume;
        this.audio.volume = this._isMuted ? 0 : volume;

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
        this._volume = Math.max(0, Math.min(1, volume));
        if (this.audio && !this._isMuted) {
            this.audio.volume = this._volume;
        }
    }

    setMute(muted: boolean) {
        this._isMuted = muted;
        if (this.audio) {
            this.audio.volume = muted ? 0 : this._volume;
        }
    }

    get isMuted(): boolean {
        return this._isMuted;
    }
}

import { soundManager } from './SoundManager';

// Global audio players
export const startScreenMusic = new AudioPlayer();
export const gameMusic = new AudioPlayer();

let globalMute = false;

export const toggleGlobalAudio = () => {
    globalMute = !globalMute;
    startScreenMusic.setMute(globalMute);
    gameMusic.setMute(globalMute);
    soundManager.setMute(globalMute);
    return globalMute;
};

export const isAudioMuted = () => globalMute;

// Initialize on load
startScreenMusic.load('assets/sounds/start_screen.mp3', true, 0.4);
gameMusic.load('assets/sounds/background_music.mp3', true, 0.5);
