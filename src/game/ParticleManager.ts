import Phaser from 'phaser';

export class ParticleManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // Explosion particles
    createExplosion(x: number, y: number) {
        // Fire particles
        const fireParticles = this.scene.add.particles(x, y, 'explosion', {
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            quantity: 20,
            tint: [0xff6600, 0xff9900, 0xffcc00, 0xff3300]
        });

        // Smoke particles
        const smokeParticles = this.scene.add.particles(x, y, 'explosion', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 1000,
            quantity: 10,
            tint: [0x666666, 0x888888, 0x444444]
        });

        // Auto-destroy after animation
        this.scene.time.delayedCall(1000, () => {
            fireParticles.destroy();
            smokeParticles.destroy();
        });
    }

    // Powerup collection sparkles
    createPowerupSparkle(x: number, y: number, color: number = 0xffff00) {
        const sparkles = this.scene.add.particles(x, y, 'explosion', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            quantity: 15,
            tint: color
        });

        this.scene.time.delayedCall(500, () => {
            sparkles.destroy();
        });
    }

    // Player death particles
    createDeathEffect(x: number, y: number) {
        const deathParticles = this.scene.add.particles(x, y, 'explosion', {
            speed: { min: 100, max: 250 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            blendMode: 'ADD',
            quantity: 25,
            tint: [0xff0000, 0xff6600, 0xffaa00]
        });

        this.scene.time.delayedCall(800, () => {
            deathParticles.destroy();
        });
    }

    // Block destruction debris
    createBlockDebris(x: number, y: number, blockColor: number = 0x8B4513) {
        const debris = this.scene.add.particles(x, y, 'explosion', {
            speed: { min: 80, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0.1 },
            alpha: { start: 1, end: 0 },
            lifespan: 700,
            gravityY: 300,
            quantity: 12,
            tint: blockColor
        });

        this.scene.time.delayedCall(700, () => {
            debris.destroy();
        });
    }

    // Screen shake effect
    shakeCamera(intensity: number = 10, duration: number = 200) {
        this.scene.cameras.main.shake(duration, intensity / 1000);
    }
}
