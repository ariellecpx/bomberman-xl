export class SoundManager {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private backgroundMusic: HTMLAudioElement | null = null;
    private musicVolume: number = 0.5;

    constructor() {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.ctx.destination);
    }

    // Load background music from MP3
    loadBackgroundMusic(path: string = 'assets/sounds/background_music.mp3') {
        this.backgroundMusic = new Audio(path);
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.addEventListener('error', () => {
            console.warn('Could not load background music, using fallback');
            this.backgroundMusic = null;
        });
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    setMusicVolume(volume: number) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume;
        }
    }

    playExplosion() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.value = 800;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.type = 'sawtooth';
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playBombPlace() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.type = 'square';
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // New: Powerup collection sound
    playPowerupCollect() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.type = 'sine';
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // New: Block break sound
    playBlockBreak() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.value = 300;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.type = 'sawtooth';
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    // New: Player death sound
    playPlayerDeath() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.type = 'square';
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    // New: Menu click sound
    playMenuClick() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.type = 'sine';
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // Polyphonic music (existing)
    playBackgroundMusic() {
        const notes = [
            { freq: 261.63, time: 0.0 },
            { freq: 329.63, time: 0.25 },
            { freq: 392.00, time: 0.5 },
            { freq: 523.25, time: 0.75 },
            { freq: 392.00, time: 1.0 },
            { freq: 329.63, time: 1.25 },
            { freq: 261.63, time: 1.5 }
        ];

        const playNote = (freq: number, startTime: number) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.05, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.type = 'square';
            osc.start(startTime);
            osc.stop(startTime + 0.2);
        };

        const startTime = this.ctx.currentTime;
        notes.forEach(note => {
            playNote(note.freq, startTime + note.time);
        });
    }
}

export const soundManager = new SoundManager();
// Load background music on initialization
soundManager.loadBackgroundMusic();
