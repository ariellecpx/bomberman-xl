import Phaser from 'phaser';
import { soundManager } from '../SoundManager';
import { getLevelConfig } from '../LevelConfig';
import type { LevelConfig } from '../LevelConfig';
import WhiteReplacePipeline from '../pipelines/WhiteReplacePipeline';

const TILE_SIZE = 80;  // Increased from 64 (25% bigger)
const GRID_COLS = 24;  // Increased from 19 (widescreen)
const GRID_ROWS = 13;  // Slightly reduced from 15 (fits 1920x1080 better)

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    // P1 Properties
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private blocks!: Phaser.Physics.Arcade.StaticGroup;
    private bombs!: Phaser.Physics.Arcade.Group;
    private explosions!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private powerups!: Phaser.Physics.Arcade.Group;
    private door!: Phaser.GameObjects.Sprite;
    private floorLayer!: Phaser.GameObjects.TileSprite;

    private playerRange = 2;
    private playerBombsCount = 1;
    private activeBombs = 0;
    private playerSpeed = 150;
    private p1Skates = 0;
    private level = 1;

    // P2 Properties
    private player2!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
        space: Phaser.Input.Keyboard.Key;
    };
    private p2Range = 2;
    private p2BombsCount = 1;
    private p2ActiveBombs = 0;
    private p2Speed = 150;
    private p2Skates = 0;
    private isTwoPlayer = false;

    // P1 Extra State
    private hasGlove = false;
    private hasRemote = false;
    private hasPowerBomb = false;
    private p1RemoteBombs: Phaser.Physics.Arcade.Sprite[] = [];

    // P2 Extra State
    private p2HasGlove = false;
    private p2HasRemote = false;
    private p2HasPowerBomb = false;
    private p2RemoteBombs: Phaser.Physics.Arcade.Sprite[] = [];

    // Advanced Level Mechanics
    private teleporters: Phaser.GameObjects.Sprite[] = [];
    private lavaPools: Phaser.Physics.Arcade.Group | null = null;
    private sporeClouds: Phaser.Physics.Arcade.Group | null = null;
    private lightRadius = 150; // Base light radius in dark levels
    private p2LightRadius = 150;

    // Level Mechanics
    private darknessOverlay?: Phaser.GameObjects.Graphics;
    private windEvent?: Phaser.Time.TimerEvent;
    private isWindBlowing = false;
    private windDirection = 1; // 1 = right, -1 = left

    private p2Keys!: {
        detonate: Phaser.Input.Keyboard.Key;
        portal: Phaser.Input.Keyboard.Key;
    };
    private p1Keys!: {
        detonate: Phaser.Input.Keyboard.Key;
        throw: Phaser.Input.Keyboard.Key;
        portal: Phaser.Input.Keyboard.Key;
    };

    // Glove/Carry State
    private p1CarriedBomb: Phaser.Physics.Arcade.Sprite | null = null;
    private p2CarriedBomb: Phaser.Physics.Arcade.Sprite | null = null;
    private p1LastSpacePress = 0;
    private p2LastSpacePress = 0;
    private DOUBLE_TAP_WINDOW = 300; // ms

    // Walking animation
    private p1WalkFrame = 0;
    private p1LastWalkTime = 0;
    private p2WalkFrame = 0;
    private p2LastWalkTime = 0;
    private WALK_ANIM_SPEED = 150; // ms per frame
    private currentConfig!: LevelConfig;

    private hasPortal = false;
    private p1Portals: Phaser.Physics.Arcade.Sprite[] = [];
    private p2HasPortal = false;
    private p2Portals: Phaser.Physics.Arcade.Sprite[] = [];
    private lastTeleportP1 = 0;
    private lastTeleportP2 = 0;

    private p1LastDir: { x: number, y: number } = { x: 1, y: 0 };
    private p2LastDir: { x: number, y: number } = { x: -1, y: 0 };

    // Curse State
    // Types: 'diarrhea' | 'turtle' | 'dud' | 'tiny'
    private p1Curse: string | null = null;
    private p2Curse: string | null = null;

    init(data: { mode: string; level?: number }) {
        // Fallback if data is missing
        this.isTwoPlayer = (data && data.mode === '2P') || false;
        if (data && data.level !== undefined) {
            this.level = data.level;
        }
    }

    preload() {
        this.load.image('burnt_shreds', 'assets/burnt_shreds.png');
    }

    create() {
        // Register individual pipelines for each player to allow independent coloring
        if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
            this.renderer.pipelines.add('P1WhiteReplace', new WhiteReplacePipeline(this.game));
            this.renderer.pipelines.add('P2WhiteReplace', new WhiteReplacePipeline(this.game));
        }

        this.currentConfig = getLevelConfig(this.level);
        console.log(`Starting Level ${this.level}: ${this.currentConfig.name}`);

        // Reset Powerups
        this.p1Skates = 0;
        this.p2Skates = 0;
        this.hasGlove = false;
        this.hasRemote = false;
        this.hasPowerBomb = false;
        this.p1RemoteBombs = [];
        this.hasPortal = false;
        this.p1Portals.forEach(p => p.destroy());
        this.p1Portals = [];
        this.p2HasGlove = false;
        this.p2HasRemote = false;
        this.p2HasPowerBomb = false;
        this.p2RemoteBombs = [];
        this.p2HasPortal = false;
        this.p2Portals.forEach(p => p.destroy());
        this.p2Portals.forEach(p => p.destroy());
        this.p2Portals = [];
        this.p1Curse = null;
        this.p2Curse = null;
        this.teleporters.forEach(t => t.destroy());
        this.teleporters = [];
        if (this.lavaPools) { this.lavaPools.clear(true, true); this.lavaPools = null; }
        if (this.sporeClouds) { this.sporeClouds.clear(true, true); this.sporeClouds = null; }

        this.activeBombs = 0;
        this.playerRange = 2;
        this.playerBombsCount = 1;
        this.playerSpeed = 150;

        if (this.isTwoPlayer) {
            this.p2ActiveBombs = 0;
            this.p2Range = 2;
            this.p2BombsCount = 1;
            this.p2Speed = 150;
        } else {
        }

        if (this.windEvent) {
            this.windEvent.remove(false);
            this.windEvent = undefined;
        }

        // 0. Background / Floor
        this.floorLayer = this.add.tileSprite(0, 0, this.sys.game.config.width as number, this.sys.game.config.height as number, this.currentConfig.floorTexture);
        this.floorLayer.setOrigin(0, 0);
        this.floorLayer.setAlpha(0.5);

        // --- SPECIAL RULE: DARKNESS ---
        if (this.currentConfig.isDark) {
            this.darknessOverlay = this.add.graphics();
            this.darknessOverlay.setDepth(1000); // Top layer
            this.darknessOverlay.setScrollFactor(0);
            this.lightRadius = 150;
            this.p2LightRadius = 150;
        }


        // --- SPECIAL RULE: WIND ---
        if (this.currentConfig.hasWind) {
            this.windEvent = this.time.addEvent({
                delay: 4000, // Wind starts every 4 seconds
                loop: true,
                callback: () => {
                    this.isWindBlowing = true;
                    this.windDirection = Math.random() < 0.5 ? 1 : -1;

                    // Show wind visual
                    const text = this.add.text(this.scale.width / 2, 100, `💨 WIND ${this.windDirection > 0 ? '>>>' : '<<<'}`, { fontSize: '32px', color: '#00ffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(2000);
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        duration: 2000,
                        onComplete: () => text.destroy()
                    });

                    this.time.delayedCall(2000, () => {
                        this.isWindBlowing = false;
                    });
                }
            });
        }

        // 1. Setup Groups
        this.walls = this.physics.add.staticGroup();
        this.blocks = this.physics.add.staticGroup();
        this.bombs = this.physics.add.group();
        this.explosions = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.powerups = this.physics.add.group();

        // 2. Generate Grid
        this.generateLevel();

        // 3. Player 1
        this.player = this.physics.add.sprite(TILE_SIZE * 1.5, TILE_SIZE * 1.5, 'hd_player_ready');
        this.expressionTimer = this.time.now + 2000;
        this.player.setDisplaySize(120, 120); // Perfect size for prominence
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10); // Ensure player renders above floor/blocks
        this.player.body.setSize(60, 48); // Wider hitbox (hard stop)
        this.player.body.setOffset((this.player.width - 60) / 2, this.player.height - 48); // Align to bottom

        // 4. Player 2
        if (this.isTwoPlayer) {
            const startX = (GRID_COLS - 2) * TILE_SIZE + TILE_SIZE / 2;
            const startY = (GRID_ROWS - 2) * TILE_SIZE + TILE_SIZE / 2;
            this.player2 = this.physics.add.sprite(startX, startY, 'hd_player_ready');

            // Apply premium red coloring to white areas only
            if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
                (this.player2 as any).setPipeline('P2WhiteReplace');
                const pipe = this.renderer.pipelines.get('P2WhiteReplace') as WhiteReplacePipeline;
                pipe.setTargetColor(0x333333); // Premium Dark Grey
            }

            this.player2.setDisplaySize(120, 120);
            this.player2.setCollideWorldBounds(true);
            this.player2.setDepth(10);
            this.player2.body.setSize(60, 48);
            this.player2.body.setOffset((this.player2.width - 60) / 2, this.player2.height - 48);

            this.physics.add.collider(this.player2, this.walls);
            this.physics.add.collider(this.player2, this.blocks);
            this.physics.add.collider(this.player2, this.bombs, undefined, (p2, bomb: any) => {
                // Better Bomberman logic: Allow passage if overlapping, then block once stepped off
                const isOwner = bomb.getData('owner') === 2;
                if (!isOwner) return true;

                // If we are already overlapping, let us keep moving
                const body = (p2 as any).body;
                const bbody = bomb.body;
                return !Phaser.Geom.Intersects.RectangleToRectangle(body.getBounds(new Phaser.Geom.Rectangle()), bbody.getBounds(new Phaser.Geom.Rectangle()));
            }, this);

            // Collisions with bad things
            this.physics.add.overlap(this.player2, this.enemies, () => this.handlePlayerDeath(2), undefined, this);
            this.physics.add.overlap(this.explosions, this.player2, () => this.handlePlayerDeath(2), undefined, this);
            this.physics.add.overlap(this.player2, this.powerups, (p2, item) => this.handlePowerupCollect(p2, item, 2), undefined, this);

            // Curse Passing Logic
            this.physics.add.overlap(this.player, this.player2, () => {
                if (this.p1Curse && !this.p2Curse) {
                    this.p2Curse = this.p1Curse;
                    this.p1Curse = null;
                    soundManager.playPowerupCollect(); // Feedback sound
                    this.cameras.main.shake(200, 0.01);
                } else if (!this.p1Curse && this.p2Curse) {
                    this.p1Curse = this.p2Curse;
                    this.p2Curse = null;
                    soundManager.playPowerupCollect();
                    this.cameras.main.shake(200, 0.01);
                }
            });
        }

        // --- SPECIAL RULE: VOLCANIC ---
        if (this.currentConfig.isVolcanic) {
            this.lavaPools = this.physics.add.group();
            // Lava Geyser Event
            this.time.addEvent({
                delay: 8000,
                loop: true,
                callback: () => {
                    // Pick random floor tile
                    const rx = Math.floor(Math.random() * GRID_COLS) * TILE_SIZE + TILE_SIZE / 2;
                    const ry = Math.floor(Math.random() * GRID_ROWS) * TILE_SIZE + TILE_SIZE / 2;

                    if (this.isGridBlocked(rx, ry)) return; // Don't erupt on walls

                    // Warning Warning
                    const warning = this.add.circle(rx, ry, 30, 0xff0000, 0.5);
                    this.tweens.add({ targets: warning, alpha: 1, duration: 200, yoyo: true, repeat: 5 });

                    this.time.delayedCall(1500, () => {
                        warning.destroy();
                        this.createExplosionSprite(rx, ry);
                        // Using explosion sprite automatically kills players/enemies via existing overlap checks if added to group,
                        // but createExplosionSprite adds to this.explosions which is checked. Perfect.
                    });
                }
            });
        }

        // --- SPECIAL RULE: SPORES ---
        if (this.currentConfig.hasSpores) {
            this.sporeClouds = this.physics.add.group();
        }

        // --- SPECIAL RULE: TELEPORTERS ---
        if (this.currentConfig.hasTeleporters) {
            // Create pairs of teleporters
            const colors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00]; // Red, Blue, Green, Yellow pairs
            const usedPos: string[] = [];

            colors.forEach((color, i) => {
                // Find 2 open spots
                for (let k = 0; k < 2; k++) {
                    let tx, ty, key;
                    let attempts = 0;
                    do {
                        tx = Math.floor(Math.random() * (GRID_COLS - 2) + 1) * TILE_SIZE + TILE_SIZE / 2;
                        ty = Math.floor(Math.random() * (GRID_ROWS - 2) + 1) * TILE_SIZE + TILE_SIZE / 2;
                        key = `${tx},${ty}`;
                        attempts++;
                    } while ((this.isGridBlocked(tx, ty) || usedPos.includes(key)) && attempts < 100);

                    if (attempts < 100) {
                        usedPos.push(key);
                        const hatch = this.add.circle(tx, ty, 20, color).setDepth(1);
                        hatch.setStrokeStyle(2, 0xffffff);
                        hatch.setData('pairId', i); // Link by index
                        hatch.setData('id', k); // Unique in pair
                        this.physics.add.existing(hatch, true); // Static body
                        this.teleporters.push(hatch as any);
                    }
                }
            });

            // Add collision overlap for teleporters
            this.physics.add.overlap(this.player, this.teleporters as any, (p, t) => this.handleTeleport(p, t), undefined, this);
            if (this.player2) this.physics.add.overlap(this.player2, this.teleporters as any, (p, t) => this.handleTeleport(p, t), undefined, this);
        }


        // 5. Input
        // Initialize keys to avoid undefined errors in update
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
                space: Phaser.Input.Keyboard.KeyCodes.E
            }) as any;

            this.p1Keys = this.input.keyboard.addKeys({
                detonate: Phaser.Input.Keyboard.KeyCodes.B,
                throw: Phaser.Input.Keyboard.KeyCodes.SPACE,
                portal: Phaser.Input.Keyboard.KeyCodes.V
            }) as any;

            this.p2Keys = this.input.keyboard.addKeys({
                detonate: Phaser.Input.Keyboard.KeyCodes.Q,
                portal: Phaser.Input.Keyboard.KeyCodes.R
            }) as any;
        }

        if (this.input.keyboard) {
            this.p1Keys = {
                ...this.p1Keys,
                detonate: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
                throw: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G), // Example, check if needed
                portal: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V)
            };
        }

        // 6. Collisions (P1)
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.blocks);
        this.physics.add.collider(this.player, this.bombs, undefined, (p1, bomb: any) => {
            // Better Bomberman logic: Allow passage if overlapping, then block once stepped off
            const isOwner = bomb.getData('owner') === 1;
            if (!isOwner) return true;

            const body = (p1 as any).body;
            const bbody = bomb.body;
            return !Phaser.Geom.Intersects.RectangleToRectangle(body.getBounds(new Phaser.Geom.Rectangle()), bbody.getBounds(new Phaser.Geom.Rectangle()));
        }, this);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.blocks);
        this.physics.add.collider(this.enemies, this.bombs);
        // this.physics.add.collider(this.enemies, this.enemies); // Disabled: Enemies should NOT bump into each other

        // Ensure enemies kill player on contact (Collider + Overlap for safety)
        // Ensure enemies kill player on contact (Collider + Overlap for safety)
        // this.physics.add.collider(this.player, this.enemies, () => this.handlePlayerDeath(1), undefined, this); // Removed physics push
        this.physics.add.overlap(this.player, this.enemies, (p: any, e: any) => {
            // console.log('Player-Enemy Overlap:', p.active, e.active);
            if (p.active && e.active) this.handlePlayerDeath(1);
        }, undefined, this);
        this.physics.add.overlap(this.explosions, this.player, () => this.handlePlayerDeath(1), undefined, this);
        this.physics.add.overlap(this.explosions, this.enemies, (exp, enemy) => this.handleEnemyDeath(exp, enemy), undefined, this);
        this.physics.add.overlap(this.explosions, this.blocks, this.handleBlockDestroy, undefined, this);
        this.physics.add.overlap(this.explosions, this.bombs, this.handleBombChain, undefined, this);
        this.physics.add.overlap(this.explosions, this.powerups, this.handlePowerupDestroy, undefined, this);
        this.physics.add.overlap(this.player, this.powerups, (p1, item) => this.handlePowerupCollect(p1, item, 1), undefined, this);

        // Music Start - Moved to end to ensure no error blocks it
        this.input.once('pointerdown', () => {
            soundManager.playBackgroundMusic();
        });

        // 7. Level Info UI
        const infoText = this.add.text(this.scale.width / 2, 25, `Level ${this.level}: ${this.currentConfig.name}`, {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        infoText.setOrigin(0.5);
        infoText.setDepth(2000);

        // 8. Create Animations
        this.anims.create({
            key: 'dance',
            frames: [
                { key: 'hd_player_dance1' },
                { key: 'hd_player_dance2' },
                { key: 'hd_player_dance3' },
                { key: 'hd_player_dance4' },
                { key: 'hd_player_dance5' },
                { key: 'hd_player_dance6' },
                { key: 'hd_player_dance7' },
                { key: 'hd_player_dance8' }
            ],
            frameRate: 8,
            repeat: -1
        });
    }

    update(time: number, _delta: number): void {
        // No need to redefine time, it's a parameter

        // --- SPECIAL RULE: DARKNESS UPDATE ---
        if (this.currentConfig.isDark && this.darknessOverlay) {
            this.darknessOverlay.clear();
            this.darknessOverlay.fillStyle(0x000000, 0.95);
            this.darknessOverlay.fillRect(0, 0, this.scale.width, this.scale.height);

            const mask = this.make.graphics({});
            mask.fillStyle(0xffffff);

            // Spotlight on Player 1
            if (this.player.active) mask.fillCircle(this.player.x, this.player.y, this.lightRadius);

            // Spotlight on Player 2
            if (this.isTwoPlayer && this.player2?.active) mask.fillCircle(this.player2.x, this.player2.y, this.p2LightRadius);

            // Spotlights on Bombs/Fire
            this.bombs.getChildren().forEach((b: any) => mask.fillCircle(b.x, b.y, 80));
            this.explosions.getChildren().forEach((e: any) => mask.fillCircle(e.x, e.y, 100));

            // Create the cutout effect
            const maskObj = mask.createGeometryMask();
            maskObj.setInvertAlpha(true);
            this.darknessOverlay.setMask(maskObj);
        }

        this.checkTeleport(2);

        // --- SKULL / CURSE VISUALS & LOGIC ---
        // P1 Curse
        if (this.p1Curse) {
            // Flash Effect
            if (Math.floor(time / 200) % 2 === 0) {
                this.player.setAlpha(0.6);
                this.player.setTint(0x444444);
            } else {
                this.player.setAlpha(1);
                this.player.clearTint();
            }

            // Diarrhea Logic
            if (this.p1Curse === 'diarrhea') {
                if (this.player.body.velocity.length() > 10 && time % 500 < 20) {
                    this.placeBomb(1);
                }
            }
        } else {
            this.player.setAlpha(1);
            this.player.clearTint();
        }

        // P2 Curse
        if (this.isTwoPlayer && this.player2 && this.p2Curse) {
            // Flash Effect
            if (Math.floor(time / 200) % 2 === 0) {
                this.player2.setAlpha(0.6);
                this.player2.setTint(0x444444);
            } else {
                this.player2.setAlpha(1);
                this.player2.clearTint(); // Note: This might conflict with P2 pipeline color if not carefully handled, but tint clears pipeline color usually? 
                // Actually setTint does multiply, P2 uses pipeline. 
                // If pipeline is active, setTint might affect uniform. 
                // For now, assume it works or just leave alpha flash.
            }
            if (this.player.body.velocity.length() > 0) {
                // Spore Inversion Check
                if (this.currentConfig.hasSpores && this.sporeClouds) {
                    const inCloud = this.sporeClouds.getChildren().some((c: any) => Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) < 50);
                    if (inCloud) {
                        this.player.body.velocity.negate(); // Simple inversion
                    }
                }
            }

            if (this.p2Curse === 'diarrhea') {
                if (this.player2.body.velocity.length() > 10 && time % 500 < 20) {
                    this.placeBomb(2);
                }
            }
        }

        // --- SPECIAL RULE: ICE / WIND ---
        this.handlePlayerMovementWithRules(time);
        this.checkGloveLogic();
        // P1 Logic
        if (this.player.active && this.cursors) {
            if (this.expressionTimer > 0 && time > this.expressionTimer) {
                this.setPlayerExpression('hd_player');
                this.expressionTimer = 0;
            }

            const body = this.player.body;
            // Removed: body.setVelocity(0); -> We handle resetting via else-if blocks (standard) or Drag (Ice)

            let isMoving = false;

            if (this.cursors.left.isDown) {
                body.setVelocityX(-this.playerSpeed);
                this.player.setFlipX(true);
                this.p1LastDir = { x: -1, y: 0 };
                isMoving = true;
                // Auto-align to Y center (lane guiding)
                const centerY = Math.floor(this.player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player.y;
                if (Math.abs(offset) < 25) body.setVelocityY(offset * 8);
            } else if (!this.cursors.right.isDown && !this.currentConfig.hasIce) {
                // Manually stop if no keys pressed AND not ice
                body.setVelocityX(0);
            }

            if (this.cursors.right.isDown) {
                body.setVelocityX(this.playerSpeed);
                this.player.setFlipX(false);
                this.p1LastDir = { x: 1, y: 0 };
                isMoving = true;
                // Auto-align to Y center
                const centerY = Math.floor(this.player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player.y;
                if (Math.abs(offset) < 25) body.setVelocityY(offset * 8);
            }

            if (this.cursors.up.isDown) {
                body.setVelocityY(-this.playerSpeed);
                this.p1LastDir = { x: 0, y: -1 };
                isMoving = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player.x;
                if (Math.abs(offset) < 25) body.setVelocityX(offset * 8);
            } else if (!this.cursors.down.isDown && !this.currentConfig.hasIce) {
                body.setVelocityY(0);
            }

            if (this.cursors.down.isDown) {
                body.setVelocityY(this.playerSpeed);
                this.p1LastDir = { x: 0, y: 1 };
                isMoving = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player.x;
                if (Math.abs(offset) < 25) body.setVelocityX(offset * 8);
            } else if (!this.cursors.up.isDown && !this.currentConfig.hasIce) {
                // If down isn't pressed either (handled above/implicitly), this ensures Y stops
                if (!this.cursors.down.isDown) body.setVelocityY(0);
            }


            // Walking animation
            if (isMoving && this.expressionTimer === 0) {
                if (time - this.p1LastWalkTime > this.WALK_ANIM_SPEED) {
                    this.p1WalkFrame = (this.p1WalkFrame + 1) % 2;
                    const walkTexture = this.p1WalkFrame === 0 ? 'hd_player_left_step' : 'hd_player_right_step';
                    this.player.setTexture(walkTexture);
                    this.player.setDisplaySize(120, 120);
                    this.p1LastWalkTime = time;
                }
            } else if (!isMoving) {
                // Return to idle when stopped
                this.player.setTexture('hd_player');
                this.player.setDisplaySize(120, 120);
            }

            // Apply final normalization to maintain consistent speed
            if (body.velocity.x !== 0 || body.velocity.y !== 0) {
                if (!this.currentConfig.hasIce) {
                    let spd = this.playerSpeed;
                    if (this.p1Curse === 'turtle') spd = 60; // Very slow
                    if (this.p1Curse === 'tiny') spd = this.playerSpeed * 1.5; // Fast

                    body.velocity.normalize().scale(spd);
                } else {
                    // Ice Physics: Cap speed instead of setting it directly
                    if (body.velocity.length() > this.playerSpeed) {
                        body.velocity.normalize().scale(this.playerSpeed);
                    }
                }
            }

            if (this.currentConfig.hasSpores && this.sporeClouds) {
                const inCloud = this.sporeClouds.getChildren().some((c: any) => Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) < 50);
                if (inCloud) body.velocity.negate();
            }

            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                const timeSinceLastPress = time - this.p1LastSpacePress;

                // Double-tap detection
                if (this.hasGlove && timeSinceLastPress < this.DOUBLE_TAP_WINDOW) {
                    // Double tap - pick up or throw
                    if (this.p1CarriedBomb) {
                        this.throwBomb(1);
                    } else {
                        this.tryPickupBomb(1);
                    }
                    this.p1LastSpacePress = 0; // Reset
                } else {
                    // Single tap - place bomb (if not carrying)
                    if (!this.p1CarriedBomb) {
                        this.placeBomb(1);
                    }
                    this.p1LastSpacePress = time;
                }
            }

            // Remote Detonate Check
            if (this.hasRemote && this.p1Keys && this.p1Keys.detonate && this.p1Keys.detonate.isDown) {
                this.detonateRemoteBombs(1);
            }

            // Portal Placement Check
            if (this.hasPortal && this.p1Keys && this.p1Keys.portal && Phaser.Input.Keyboard.JustDown(this.p1Keys.portal)) {
                this.placePortal(1);
            }

            this.checkTeleport(1);

            // Enforce Tiny Curse Size (overrides animation reset)
            if (this.p1Curse === 'tiny') this.player.setDisplaySize(80, 80);
        }

        // P2 Logic
        if (this.isTwoPlayer && this.player2 && this.player2.active && this.wasd) {
            const body2 = this.player2.body;
            body2.setVelocity(0);

            let isMoving2 = false;

            if (this.wasd.left.isDown) {
                body2.setVelocityX(-this.p2Speed);
                this.player2.setFlipX(true);
                this.p2LastDir = { x: -1, y: 0 };
                isMoving2 = true;
                // Auto-align to Y center
                const centerY = Math.floor(this.player2.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player2.y;
                if (Math.abs(offset) < 25) body2.setVelocityY(offset * 8);
            } else if (this.wasd.right.isDown) {
                body2.setVelocityX(this.p2Speed);
                this.player2.setFlipX(false);
                this.p2LastDir = { x: 1, y: 0 };
                isMoving2 = true;
                // Auto-align to Y center
                const centerY = Math.floor(this.player2.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player2.y;
                if (Math.abs(offset) < 25) body2.setVelocityY(offset * 8);
            }

            if (this.wasd.up.isDown) {
                body2.setVelocityY(-this.p2Speed);
                this.p2LastDir = { x: 0, y: -1 };
                isMoving2 = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player2.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player2.x;
                if (Math.abs(offset) < 25) body2.setVelocityX(offset * 8);
            } else if (this.wasd.down.isDown) {
                body2.setVelocityY(this.p2Speed);
                this.p2LastDir = { x: 0, y: 1 };
                isMoving2 = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player2.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player2.x;
                if (Math.abs(offset) < 25) body2.setVelocityX(offset * 8);
            }

            // Walking animation for P2
            if (isMoving2) {
                if (time - this.p2LastWalkTime > this.WALK_ANIM_SPEED) {
                    this.p2WalkFrame = (this.p2WalkFrame + 1) % 2;
                    const walkTexture = this.p2WalkFrame === 0 ? 'hd_player_left_step' : 'hd_player_right_step';
                    this.player2.setTexture(walkTexture);
                    this.player2.setDisplaySize(120, 120);
                    this.p2LastWalkTime = time;
                }
            } else if (this.player2) {
                // Return to idle when stopped
                this.player2.setTexture('hd_player');
                this.player2.setDisplaySize(120, 120);
            }

            if (body2.velocity.x !== 0 || body2.velocity.y !== 0) {
                let spd = this.p2Speed;
                if (this.p2Curse === 'turtle') spd = 60;
                if (this.p2Curse === 'tiny') spd = this.p2Speed * 1.5;
                body2.velocity.normalize().scale(spd);
            }

            if (Phaser.Input.Keyboard.JustDown(this.wasd.space)) {
                const timeSinceLastPress = time - this.p2LastSpacePress;

                // Double-tap detection
                if (this.p2HasGlove && timeSinceLastPress < this.DOUBLE_TAP_WINDOW) {
                    // Double tap - pick up or throw
                    if (this.p2CarriedBomb) {
                        this.throwBomb(2);
                    } else {
                        this.tryPickupBomb(2);
                    }
                    this.p2LastSpacePress = 0; // Reset
                } else {
                    // Single tap - place bomb (if not carrying)
                    if (!this.p2CarriedBomb) {
                        this.placeBomb(2);
                    }
                    this.p2LastSpacePress = time;
                }
            }

            if (this.p2HasRemote && this.p2Keys && this.p2Keys.detonate && this.p2Keys.detonate.isDown) {
                this.detonateRemoteBombs(2);
            }

            // Portal Check
            if (this.p2HasPortal && this.p2Keys && this.p2Keys.portal && Phaser.Input.Keyboard.JustDown(this.p2Keys.portal)) {
                this.placePortal(2);
            }

            this.checkTeleport(2);

            // Enforce Tiny Curse Size
            if (this.p2Curse === 'tiny') this.player2.setDisplaySize(80, 80);
        }

        // Enemy AI (Precision Grid-Bound)
        this.enemies.getChildren().forEach((e: any) => {
            const enemy = e as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            if (!enemy.active || enemy.getData('isControlled')) return;

            const gx = Math.floor(enemy.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const gy = Math.floor(enemy.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, gx, gy);

            // Rail Enforcement: Keep them perfectly on the center line of their current direction
            const vx = enemy.body.velocity.x;
            const vy = enemy.body.velocity.y;

            if (vx !== 0) enemy.y = gy;
            if (vy !== 0) enemy.x = gx;

            const now = time;
            const lastDecision = enemy.getData('lastDecision') || 0;
            // Use a threshold for stuck detection (physics engine noise)
            const isStuck = Math.abs(vx) < 10 && Math.abs(vy) < 10;

            // Decision cooldown (reduced to 150ms for snappier recovery)
            if ((dist < 10 || isStuck) && (now - lastDecision > 150)) {
                const type = enemy.getData('type');
                const speed = (type === 3) ? 140 : 100;

                let mustTurn = isStuck;
                if (!mustTurn) {
                    if (vx > 0 && this.isGridBlocked(gx + TILE_SIZE, gy)) mustTurn = true;
                    else if (vx < 0 && this.isGridBlocked(gx - TILE_SIZE, gy)) mustTurn = true;
                    else if (vy > 0 && this.isGridBlocked(gx, gy + TILE_SIZE)) mustTurn = true;
                    else if (vy < 0 && this.isGridBlocked(gx, gy - TILE_SIZE)) mustTurn = true;
                }

                if (mustTurn) {
                    enemy.setData('lastDecision', now);
                    // Snap precisely to grid center when turning or stuck to prevent drift
                    enemy.setPosition(gx, gy);

                    const dirs = [
                        { x: speed, y: 0, tx: gx + TILE_SIZE, ty: gy },
                        { x: -speed, y: 0, tx: gx - TILE_SIZE, ty: gy },
                        { x: 0, y: speed, tx: gx, ty: gy + TILE_SIZE },
                        { x: 0, y: -speed, tx: gx, ty: gy - TILE_SIZE }
                    ];

                    // Priority 1: Forward or Left/Right (No U-Turn)
                    let choices = dirs.filter(d => {
                        if (vx > 0 && d.x < 0) return false;
                        if (vx < 0 && d.x > 0) return false;
                        if (vy > 0 && d.y < 0) return false;
                        if (vy < 0 && d.y > 0) return false;
                        return !this.isGridBlocked(d.tx, d.ty);
                    });

                    // Aggressive Logic: If Type > 1, try to move fast towards player
                    if (enemy.getData('type') > 1) {
                        const target = this.player; // Target P1 by default
                        if (target && target.active) {
                            const distToP = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
                            if (distToP < 400) { // Aggro range
                                // Sort choices by distance to player
                                choices.sort((a, b) => {
                                    const da = Phaser.Math.Distance.Between(a.tx, a.ty, target.x, target.y);
                                    const db = Phaser.Math.Distance.Between(b.tx, b.ty, target.x, target.y);
                                    return da - db;
                                });
                            }
                        }
                    }

                    if (choices.length > 0) {
                        // Pick the best one (index 0) if aggressive, or random if basic
                        if (enemy.getData('type') > 1) {
                            // 80% chance to pick best path for smart enemies
                            if (Math.random() < 0.8) enemy.setVelocity(choices[0].x, choices[0].y);
                            else enemy.setVelocity(Phaser.Utils.Array.GetRandom(choices).x, Phaser.Utils.Array.GetRandom(choices).y);
                        } else {
                            const move = Phaser.Utils.Array.GetRandom(choices);
                            enemy.setVelocity(move.x, move.y);
                        }
                    } else {
                        // Priority 2: U-Turn fallback
                        const fallback = dirs.filter(d => !this.isGridBlocked(d.tx, d.ty));
                        if (fallback.length > 0) {
                            const move = Phaser.Utils.Array.GetRandom(fallback);
                            enemy.setVelocity(move.x, move.y);
                        } else {
                            enemy.setVelocity(0, 0); // Trapped
                        }
                    }
                }
            }
        });
    }

    private isGridBlocked(x: number, y: number): boolean {
        // Precise center-to-center check with tolerance
        const range = 40; // Generous collision check

        // Check Walls
        const walls = this.walls.getChildren();
        for (let i = 0; i < walls.length; i++) {
            const w = walls[i] as any;
            if (w.active && Math.abs(w.x - x) < range && Math.abs(w.y - y) < range) return true;
        }

        // Check Blocks
        const blocks = this.blocks.getChildren();
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i] as any;
            if (b.active && Math.abs(b.x - x) < range && Math.abs(b.y - y) < range) return true;
        }

        // Check Bombs
        const bombs = this.bombs.getChildren();
        for (let i = 0; i < bombs.length; i++) {
            const b = bombs[i] as any;
            if (b.active && Math.abs(b.x - x) < range && Math.abs(b.y - y) < range) return true;
        }

        if (x < 0 || x > (GRID_COLS * TILE_SIZE) || y < 0 || y > (GRID_ROWS * TILE_SIZE)) return true;

        return false;
    }

    private expressionTimer = 0;
    private setPlayerExpression(texture: string, duration?: number, playerIdx: number = 1) {
        const p = playerIdx === 1 ? this.player : this.player2;
        if (!p || !p.active) return;

        p.setTexture(texture);
        p.setDisplaySize(120, 120);

        if (playerIdx === 1) {
            if (duration) this.expressionTimer = this.time.now + duration;
            else this.expressionTimer = 0;
        }
    }

    private tryPickupBomb(playerIdx: number) {
        const p = playerIdx === 1 ? this.player : this.player2;
        if (!p || !p.active) return;

        // Find nearby bomb
        const nearbyBombs = this.bombs.getChildren().filter((b: any) => {
            const bomb = b as Phaser.Physics.Arcade.Sprite;
            const dist = Phaser.Math.Distance.Between(p.x, p.y, bomb.x, bomb.y);
            return dist < TILE_SIZE && bomb.getData('owner') === playerIdx;
        });

        if (nearbyBombs.length > 0) {
            const bomb = nearbyBombs[0] as Phaser.Physics.Arcade.Sprite;

            // Cancel any pending explosion timer
            const timerId = bomb.getData('timerId');
            if (timerId) {
                timerId.remove();
            }

            // Cancel stage animation timers
            const stage2Timer = bomb.getData('stage2Timer');
            const stage3Timer = bomb.getData('stage3Timer');
            const stage4Timer = bomb.getData('stage4Timer');
            if (stage2Timer) stage2Timer.remove();
            if (stage3Timer) stage3Timer.remove();
            if (stage4Timer) stage4Timer.remove();

            // Reset to stage 1
            bomb.setTexture('hd_bomb_stage_1');
            bomb.setDisplaySize(70, 70);

            // Attach to player
            if (playerIdx === 1) {
                this.p1CarriedBomb = bomb;
            } else {
                this.p2CarriedBomb = bomb;
            }

            bomb.setData('isCarried', true);
            if (bomb.body) bomb.body.enable = false; // Disable physics while carried
        }
    }

    private placePortal(playerIdx: number) {
        const p = playerIdx === 1 ? this.player : this.player2;
        if (!p || !p.active) return;

        const portals = playerIdx === 1 ? this.p1Portals : this.p2Portals;
        const bx = Math.floor(p.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const by = Math.floor(p.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

        // Remove oldest if we already have 2
        if (portals.length >= 2) {
            const oldest = portals.shift();
            oldest?.destroy();
        }

        const portal = this.physics.add.sprite(bx, by, 'icon_portal');
        portal.setDisplaySize(70, 70);
        portal.setDepth(50);
        portal.setAlpha(0.8);
        portal.setTint(playerIdx === 1 ? 0x00ffff : 0xff00ff);

        // Pulse animation
        // Pulse animation (Subtle)
        this.tweens.add({
            targets: portal,
            scale: 0.95,
            alpha: 0.9,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        portals.push(portal);
        soundManager.playBombPlace(); // Reuse sound for now
    }

    private checkTeleport(playerIdx: number) {
        const p = playerIdx === 1 ? this.player : this.player2;
        if (!p || !p.active) return;

        const portals = playerIdx === 1 ? this.p1Portals : this.p2Portals;
        if (portals.length < 2) return;

        const now = this.time.now;
        const lastTeleport = playerIdx === 1 ? this.lastTeleportP1 : this.lastTeleportP2;

        if (now - lastTeleport < 1000) return; // 1s cooldown

        for (let i = 0; i < portals.length; i++) {
            const portal = portals[i];
            const distance = Phaser.Math.Distance.Between(p.x, p.y, portal.x, portal.y);
            if (distance < 30) {
                const otherPortal = portals[i === 0 ? 1 : 0];

                // Teleport!
                p.setPosition(otherPortal.x, otherPortal.y);

                if (playerIdx === 1) this.lastTeleportP1 = now;
                else this.lastTeleportP2 = now;

                // Visual effect
                this.cameras.main.flash(100, 0, 255, 255, true);
                soundManager.playPowerupCollect(); // Warp sound

                // Break out of loop to prevent immediate return trip
                break;
            }
        }
    }

    private handleTeleport(player: any, hatch: any) {
        if (!player.active) return;
        const now = this.time.now;
        const lastPort = player === this.player ? this.lastTeleportP1 : this.lastTeleportP2;

        if (now - lastPort < 1000) return; // Cooldown

        const pairId = hatch.getData('pairId');
        const myId = hatch.getData('id');

        // Find partner
        const partner = this.teleporters.find((t: any) => t.getData('pairId') === pairId && t.getData('id') !== myId);

        if (partner) {
            player.setPosition(partner.x, partner.y);
            if (player === this.player) this.lastTeleportP1 = now;
            else this.lastTeleportP2 = now;
            soundManager.playPowerupCollect();
        }
    }

    private throwBomb(playerIdx: number) {
        const p = playerIdx === 1 ? this.player : this.player2;
        const bomb = playerIdx === 1 ? this.p1CarriedBomb : this.p2CarriedBomb;

        if (!p || !bomb) return;

        // Determine throw direction based on player facing
        const throwDistance = TILE_SIZE * 3;
        const dir = playerIdx === 1 ? this.p1LastDir : this.p2LastDir;

        let targetX = bomb.x + dir.x * throwDistance;
        let targetY = bomb.y + dir.y * throwDistance;

        // Re-enable physics
        if (bomb.body) bomb.body.enable = true;
        bomb.setData('isCarried', false);

        // Arc throw with gravity
        this.tweens.add({
            targets: bomb,
            x: targetX,
            duration: 400,
            ease: 'Linear'
        });

        // Parabolic arc (up then down)
        this.tweens.add({
            targets: bomb,
            y: targetY - 60, // Arc up
            duration: 200,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Fall down
                this.tweens.add({
                    targets: bomb,
                    y: targetY,
                    duration: 200,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        // Snap to grid
                        bomb.x = Math.floor(bomb.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                        bomb.y = Math.floor(bomb.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                        bomb.setDisplaySize(70, 70); // Force size reset

                        // IMPORTANT: Stop any previous scale/alpha tweens that might be lingering
                        this.tweens.killTweensOf(bomb);

                        // Re-apply Power Bomb pulse if needed
                        if (bomb.getData('isMaxPower')) {
                            this.tweens.add({
                                targets: bomb,
                                scale: 1.05,
                                alpha: 0.95,
                                duration: 800,
                                yoyo: true,
                                repeat: -1
                            });
                        }

                        // Resume explosion timer and stage animations
                        const isRemote = (playerIdx === 1 && this.hasRemote) || (playerIdx === 2 && this.p2HasRemote);
                        if (!isRemote) {
                            const timerId = this.time.delayedCall(3000, () => {
                                if (bomb.active) this.explode(bomb);
                            });
                            bomb.setData('timerId', timerId);

                            // Restart stage animations
                            const stage2Timer = this.time.delayedCall(750, () => {
                                if (bomb.active && !bomb.getData('isCarried')) {
                                    bomb.setTexture('hd_bomb_stage_2');
                                    bomb.setDisplaySize(70, 70);
                                }
                            });
                            const stage3Timer = this.time.delayedCall(1500, () => {
                                if (bomb.active && !bomb.getData('isCarried')) {
                                    bomb.setTexture('hd_bomb_stage_3');
                                    bomb.setDisplaySize(70, 70);
                                }
                            });
                            const stage4Timer = this.time.delayedCall(2250, () => {
                                if (bomb.active && !bomb.getData('isCarried')) {
                                    bomb.setTexture('hd_bomb_stage_4');
                                    bomb.setDisplaySize(70, 70);
                                }
                            });
                            bomb.setData('stage2Timer', stage2Timer);
                            bomb.setData('stage3Timer', stage3Timer);
                            bomb.setData('stage4Timer', stage4Timer);
                        }
                    }
                });
            }
        });

        // Clear carried reference
        if (playerIdx === 1) {
            this.p1CarriedBomb = null;
        } else {
            this.p2CarriedBomb = null;
        }
    }

    private placeBomb(playerIdx: number) {
        const p = playerIdx === 1 ? this.player : this.player2;
        if (!p || !p.active) return;

        const maxBombs = playerIdx === 1 ? this.playerBombsCount : this.p2BombsCount;
        const active = playerIdx === 1 ? this.activeBombs : this.p2ActiveBombs;

        if (active >= maxBombs) return;

        // Use Math.floor on the center point to get the grid coordinate
        const bx = Math.floor(p.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const by = Math.floor(p.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

        // Strict Check: Cannot place bomb on another bomb OR a block/wall
        if (this.isGridBlocked(bx, by)) return;

        // Self-Correction: Snap player slightly towards the bomb center for a "solid" feel
        p.x = Phaser.Math.Linear(p.x, bx, 0.2);
        p.y = Phaser.Math.Linear(p.y, by, 0.2);

        // @ts-ignore
        const existing = this.bombs.getChildren().find((b: Phaser.Physics.Arcade.Sprite) => b.x === bx && b.y === by);
        if (existing) return;

        const bomb = this.bombs.create(bx, by, 'hd_bomb_stage_1');
        bomb.setDisplaySize(70, 70); // Scaled for 80px tiles
        bomb.setImmovable(true);
        bomb.setPushable(false);
        bomb.body.setCircle(27);
        bomb.body.setOffset((bomb.width - 54) / 2, (bomb.height - 54) / 2);
        bomb.setData('owner', playerIdx);

        // CIRCUS: Bouncing Bombs
        if (this.currentConfig.level === 5) {
            bomb.setBounce(1);
        }

        // Temporarily disable collision with the player who placed it
        // This prevents getting stuck when placing a bomb
        bomb.setData('justPlaced', true);

        // Re-enable collision after player has moved away (300ms)
        this.time.delayedCall(300, () => {
            if (bomb.active) {
                bomb.setData('justPlaced', false);
            }
        });

        // Bomb fuse animation (4 stages over 4 seconds now)
        const stage2Timer = this.time.delayedCall(1000, () => {
            if (bomb.active && !bomb.getData('isCarried') && !bomb.getData('isMaxPower')) {
                bomb.setTexture('hd_bomb_stage_2');
                bomb.setDisplaySize(70, 70);
            }
        });

        const stage3Timer = this.time.delayedCall(2000, () => {
            if (bomb.active && !bomb.getData('isCarried') && !bomb.getData('isMaxPower')) {
                bomb.setTexture('hd_bomb_stage_3');
                bomb.setDisplaySize(70, 70);
            }
        });

        const stage4Timer = this.time.delayedCall(3000, () => {
            if (bomb.active && !bomb.getData('isCarried') && !bomb.getData('isMaxPower')) {
                bomb.setTexture('hd_bomb_stage_4');
                bomb.setDisplaySize(70, 70);
                // Shake in final stage
                this.tweens.add({
                    targets: bomb,
                    angle: { from: -3, to: 3 },
                    duration: 75,
                    yoyo: true,
                    repeat: 12, // Increased shaking duration
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Store timer references
        bomb.setData('stage2Timer', stage2Timer);
        bomb.setData('stage3Timer', stage3Timer);
        bomb.setData('stage4Timer', stage4Timer);

        // Max Power Logic: Only the "First" bomb gets max power
        let isMaxPower = false;
        if (playerIdx === 1) {
            if (this.hasPowerBomb && this.activeBombs === 0) isMaxPower = true;
        } else {
            if (this.p2HasPowerBomb && this.p2ActiveBombs === 0) isMaxPower = true;
        }
        bomb.setData('isMaxPower', isMaxPower);

        // DUD CURSE - 20s Fuse
        let fuseTime = 4000;
        if ((playerIdx === 1 && this.p1Curse === 'dud') || (playerIdx === 2 && this.p2Curse === 'dud')) {
            fuseTime = 20000; // 20 Seconds
            bomb.setTint(0x555555); // Look like a dud
        }

        if (playerIdx === 1) {
            this.activeBombs++;
            this.setPlayerExpression('hd_player_angry', 800);
            if (this.hasRemote) {
                bomb.setTint(0x00ff00); // Green tint for remote bombs
                this.p1RemoteBombs.push(bomb);
            }
        } else {
            this.p2ActiveBombs++;
            if (this.p2HasRemote) {
                bomb.setTint(0x00ff00);
                this.p2RemoteBombs.push(bomb);
            }
        }

        soundManager.playBombPlace();

        // Only auto-explode if NOT remote
        const isRemote = (playerIdx === 1 && this.hasRemote) || (playerIdx === 2 && this.p2HasRemote);

        if (!isRemote) {
            // Increased from 3000 to 4000 (slower fuse), or 20000 if Dud
            const timerId = this.time.delayedCall(fuseTime, () => {
                if (bomb.active) this.explode(bomb);
            });
            bomb.setData('timerId', timerId);
        } else {
            // Remote bombs: cancel stage timers, stay at stage 1
            const stage2Timer = bomb.getData('stage2Timer');
            const stage3Timer = bomb.getData('stage3Timer');
            const stage4Timer = bomb.getData('stage4Timer');
            if (stage2Timer) stage2Timer.remove();
            if (stage3Timer) stage3Timer.remove();
            if (stage4Timer) stage4Timer.remove();
            bomb.setData('isRemote', true);
        }

        // Apply Power Bomb Texture Override
        if (isMaxPower) {
            bomb.setTexture('icon_powerbomb');
            bomb.setDisplaySize(70, 70);
            // Cancel standard animations for power bomb so it stays as the icon
            const s2 = bomb.getData('stage2Timer');
            const s3 = bomb.getData('stage3Timer');
            const s4 = bomb.getData('stage4Timer');
            if (s2) s2.remove();
            if (s3) s3.remove();
            if (s4) s4.remove();

            // Add a simple pulse effect for Power Bomb instead of stages
            // Add a subtle pulse effect for Power Bomb (Reduced intensity)
            this.tweens.add({
                targets: bomb,
                scale: 1.05, // Very slight pulse
                alpha: 0.95,
                duration: 800, // Slower
                yoyo: true,
                repeat: -1
            });
        }
    }

    private detonateRemoteBombs(playerIdx: number) {
        const bombs = playerIdx === 1 ? this.p1RemoteBombs : this.p2RemoteBombs;
        // Detonate oldest first
        if (bombs.length > 0) {
            const b = bombs.shift();
            if (b && b.active) {
                // Fast stage animation before explosion (600ms total)
                b.setTexture('hd_bomb_stage_2');
                b.setDisplaySize(70, 70);

                this.time.delayedCall(150, () => {
                    if (b.active) {
                        b.setTexture('hd_bomb_stage_3');
                        b.setDisplaySize(70, 70);
                    }
                });

                this.time.delayedCall(300, () => {
                    if (b.active) {
                        b.setTexture('hd_bomb_stage_4');
                        b.setDisplaySize(70, 70);
                        // Fast shake
                        this.tweens.add({
                            targets: b,
                            angle: { from: -5, to: 5 },
                            duration: 50,
                            yoyo: true,
                            repeat: 5,
                            ease: 'Sine.easeInOut'
                        });
                    }
                });

                // Explode after fast animation
                this.time.delayedCall(600, () => {
                    if (b.active) this.explode(b);
                });
            }
        }
    }

    private handlePlayerMovementWithRules(_time: number) {
        if (!this.player.active) return;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        // --- WIND MECHANIC ---
        if (this.currentConfig.hasWind && this.isWindBlowing) {
            const windForce = 20 * this.windDirection;
            body.velocity.x += windForce;

            if (this.isTwoPlayer && this.player2?.active) {
                const b2 = this.player2.body as Phaser.Physics.Arcade.Body;
                if (b2) b2.velocity.x += windForce;
            }

            this.enemies.getChildren().forEach((e: any) => {
                if (e.active) e.body.velocity.x += windForce * 0.5;
            });
        }

        // --- ICE MECHANIC SETUP ---
        if (this.currentConfig.hasIce) {
            // Low drag allows sliding when velocity isn't manually set to 0
            body.setDrag(100);
        } else {
            // High drag for instant stop (normal movement)
            body.setDrag(2000);
        }
    }

    private explode(bomb: Phaser.Physics.Arcade.Sprite) {
        if (!bomb.active) return;

        const owner = bomb.getData('owner');
        if (owner === 1) {
            this.activeBombs--;
            // Remove from remote list if there
            this.p1RemoteBombs = this.p1RemoteBombs.filter(b => b !== bomb);
        }
        else {
            this.p2ActiveBombs--;
            this.p2RemoteBombs = this.p2RemoteBombs.filter(b => b !== bomb);
        }

        bomb.destroy();

        const ex = bomb.x;
        const ey = bomb.y;

        let range = owner === 1 ? this.playerRange : this.p2Range;
        // Check for MAX POWER on this specific bomb
        if (bomb.getData('isMaxPower')) {
            range = Math.max(GRID_COLS, GRID_ROWS); // Infinite Range
        }

        // TINY CURSE - Minimum Range
        if ((owner === 1 && this.p1Curse === 'tiny') || (owner === 2 && this.p2Curse === 'tiny')) {
            range = 1;
        }

        this.createExplosionSprite(ex, ey);

        const params = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

        params.forEach(dir => {
            for (let i = 1; i <= range; i++) {
                const tx = ex + dir.dx * i * TILE_SIZE;
                const ty = ey + dir.dy * i * TILE_SIZE;

                const walls = this.physics.overlapRect(tx - 1, ty - 1, 2, 2, true, true);
                const hitWall = walls.some(b => this.walls.contains(b.gameObject));
                if (hitWall) break;

                this.createExplosionSprite(tx, ty);
                const hitBlock = walls.find(b => this.blocks.contains(b.gameObject));
                if (hitBlock) break;
            }
        });
    }

    // Keep existing helpers...
    private showVictory(winnerIdx: number) {
        const { width, height } = this.scale;

        // Darken overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setDepth(2000);

        // Confetti!
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * width;
            const y = -100 - (Math.random() * 500);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const conf = this.add.rectangle(x, y, 10, 10, color).setDepth(2001);
            this.tweens.add({
                targets: conf,
                y: height + 100,
                x: x + (Math.random() - 0.5) * 400,
                angle: 360 * 2,
                duration: 3000 + Math.random() * 2000,
                ease: 'Quad.easeIn',
                onComplete: () => conf.destroy()
            });
        }

        const victoryTitle = this.add.text(width / 2, height / 2 - 120, `PLAYER ${winnerIdx} YOU WON!`, {
            fontFamily: '"Orbitron", -apple-system, sans-serif',
            fontSize: '84px',
            color: '#ffffff',
            stroke: winnerIdx === 1 ? '#00ffff' : '#ff4444',
            strokeThickness: 12,
            shadow: { offsetX: 0, offsetY: 0, color: winnerIdx === 1 ? '#00ffff' : '#ff4444', blur: 50, stroke: true, fill: true },
            align: 'center'
        }).setOrigin(0.5).setDepth(2002);

        this.tweens.add({
            targets: victoryTitle,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Modern Frosted Buttons
        const createVictoryBtn = (y: number, text: string, type: 'play' | 'quit') => {
            const container = this.add.container(width / 2, y);
            const bg = this.add.graphics();
            bg.fillStyle(0xffffff, 0.08).fillRoundedRect(-160, -35, 320, 70, 35);
            bg.lineStyle(2, 0xffffff, 0.15).strokeRoundedRect(-160, -35, 320, 70, 35);

            const btnText = this.add.text(0, 0, text, {
                fontFamily: '"Orbitron", sans-serif',
                fontSize: '26px',
                color: '#ffffff'
            }).setOrigin(0.5);

            container.add([bg, btnText]);
            container.setDepth(2002).setInteractive(new Phaser.Geom.Rectangle(-160, -35, 320, 70), Phaser.Geom.Rectangle.Contains);

            container.on('pointerover', () => {
                const color = type === 'play' ? 0x00cc44 : 0xcc3333;
                bg.clear().fillGradientStyle(color, color, color, color, 0.3, 0.3, 0.4, 0.4).fillRoundedRect(-160, -35, 320, 70, 35);
                this.tweens.add({ targets: container, scale: 1.05, duration: 200 });
            });
            container.on('pointerout', () => {
                bg.clear().fillStyle(0xffffff, 0.08).fillRoundedRect(-160, -35, 320, 70, 35).lineStyle(2, 0xffffff, 0.15).strokeRoundedRect(-160, -35, 320, 70, 35);
                this.tweens.add({ targets: container, scale: 1.0, duration: 200 });
            });
            container.on('pointerdown', () => {
                if (type === 'play') this.scene.restart({ mode: '2P' });
                else this.scene.start('StartScene');
            });
        };

        createVictoryBtn(height / 2 + 60, 'PLAY AGAIN', 'play');
        createVictoryBtn(height / 2 + 160, 'MAIN MENU', 'quit');
    }

    private generateLevel() {
        // Walls
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = c * TILE_SIZE + TILE_SIZE / 2;
                const y = r * TILE_SIZE + TILE_SIZE / 2;

                if (r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1 || (r % 2 === 0 && c % 2 === 0)) {
                    // HD Indestructible Wall (Dynamic)
                    const w = this.walls.create(x, y, this.currentConfig.hardBlockTexture);
                    w.setDisplaySize(TILE_SIZE, TILE_SIZE);
                    w.body.updateFromGameObject();
                } else {
                    // Safe zone logic for P1 (Top Left) AND P2 (Bottom Right)
                    const isP1Safe = (r < 3 && c < 3);
                    const isP2Safe = (r > GRID_ROWS - 4 && c > GRID_COLS - 4);

                    if (!isP1Safe && !isP2Safe) {
                        const blockTex = this.currentConfig.blockTexture;
                        let shouldPlace = false;

                        // Varied Layouts derived from Level ID
                        const layoutType = (this.level - 1) % 4;

                        if (r === GRID_ROWS - 2 && c === GRID_COLS - 2 && !this.isTwoPlayer) {
                            // Valid Door position always
                            this.door = this.physics.add.sprite(x, y, blockTex);
                            this.door.setVisible(false);
                            this.door.setDisplaySize(TILE_SIZE, TILE_SIZE);
                            shouldPlace = true;
                        } else {
                            // Layout Algorithms
                            if (layoutType === 0) {
                                // 1. Classic Random (Level 1, 5, 9)
                                shouldPlace = Math.random() < this.currentConfig.blockDensity;
                            } else if (layoutType === 1) {
                                // 2. Wide Corridors (Level 2, 6) - Clear every 2nd row partially
                                if (r % 2 !== 0 && Math.random() < 0.3) shouldPlace = true; // Clearer rows
                                else shouldPlace = Math.random() < this.currentConfig.blockDensity;
                            } else if (layoutType === 2) {
                                // 3. The Arena (Level 3, 7) - Empty Center
                                const isCenter = r > 4 && r < GRID_ROWS - 5 && c > 6 && c < GRID_COLS - 7;
                                if (isCenter && Math.random() < 0.2) shouldPlace = true; // Mostly empty center
                                else shouldPlace = Math.random() < this.currentConfig.blockDensity;
                            } else {
                                // 4. The Bunker (Level 4, 8) - High density clusters
                                const isCluster = (r % 3 === 0) || (c % 3 === 0);
                                if (isCluster) shouldPlace = Math.random() < 0.9;
                                else shouldPlace = Math.random() < 0.4;
                            }
                        }

                        if (shouldPlace) {
                            const b = this.blocks.create(x, y, blockTex);
                            b.setDisplaySize(TILE_SIZE, TILE_SIZE);
                            b.body.updateFromGameObject();
                        }
                    }
                }
            }
        }
        this.walls.refresh();
        this.blocks.refresh();

        // Enemies
        if (!this.isTwoPlayer) {
            const count = this.currentConfig.enemyCount;
            for (let i = 0; i < count; i++) {
                let ex = 0, ey = 0;
                let safe = false;
                let attempts = 0;

                while (!safe && attempts < 100) {
                    ex = Math.floor(Math.random() * (GRID_COLS - 2)) + 1;
                    ey = Math.floor(Math.random() * (GRID_ROWS - 2)) + 1;

                    const x = ex * TILE_SIZE + TILE_SIZE / 2;
                    const y = ey * TILE_SIZE + TILE_SIZE / 2;

                    // Check if position is safe (not in P1 zone, not on a wall, not on a block)
                    const notInP1Zone = !(ex < 3 && ey < 3);
                    const notOnWall = (ex % 2 !== 0 || ey % 2 !== 0); // Walls are at even positions

                    // Check if there's a block at this position
                    const blockAtPosition = this.blocks.getChildren().some((block: any) => {
                        return Math.abs(block.x - x) < 5 && Math.abs(block.y - y) < 5;
                    });

                    // Ensure enemy is not trapped in a 1x1 hole
                    let openNeighbors = 0;
                    if (!this.isGridBlocked(x + TILE_SIZE, y)) openNeighbors++;
                    if (!this.isGridBlocked(x - TILE_SIZE, y)) openNeighbors++;
                    if (!this.isGridBlocked(x, y + TILE_SIZE)) openNeighbors++;
                    if (!this.isGridBlocked(x, y - TILE_SIZE)) openNeighbors++;

                    safe = notInP1Zone && notOnWall && !blockAtPosition && (openNeighbors >= 2);
                    attempts++;
                }

                if (safe) {
                    const typeId = (i % 4) + 1;
                    const textureKey = `enemy_${typeId}`;
                    const enemy = this.enemies.create(ex * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2, textureKey);
                    enemy.setData('type', typeId);
                    enemy.setDisplaySize(90, 90);
                    enemy.setBounce(0);
                    enemy.setCollideWorldBounds(true);
                    // Random initial direction for enemies
                    if (Math.random() < 0.5) {
                        enemy.setVelocityX(this.currentConfig.enemySpeed);
                    } else {
                        enemy.setVelocityY(this.currentConfig.enemySpeed);
                    }
                    enemy.body.setSize(70, 70); // Larger hitbox for fairer death detection
                    enemy.body.setOffset(10, 10);
                    enemy.setMaxVelocity(this.currentConfig.enemySpeed * 1.5, this.currentConfig.enemySpeed * 1.5); // Limit max speed
                    enemy.setPushable(true); // Allow physics separation from walls/bombs
                    enemy.body.setImmovable(false);
                }
            }
        }
    }

    private createExplosionSprite(x: number, y: number) {
        soundManager.playExplosion();
        const exp = this.explosions.create(x, y, 'explosion');
        exp.body.setAllowGravity(false);
        this.time.delayedCall(500, () => {
            exp.destroy();
        });
    }

    private handleBombChain(_explosion: any, bomb: any) {
        if (bomb.active) {
            // Get bomb data before destroying
            const owner = bomb.getData('owner');
            const isMaxPower = bomb.getData('isMaxPower');
            const bx = bomb.x;
            const by = bomb.y;

            // Remove from remote bombs list if it was remote
            if (owner === 1) {
                const idx = this.p1RemoteBombs.indexOf(bomb);
                if (idx > -1) this.p1RemoteBombs.splice(idx, 1);
            } else if (owner === 2) {
                const idx = this.p2RemoteBombs.indexOf(bomb);
                if (idx > -1) this.p2RemoteBombs.splice(idx, 1);
            }

            // Destroy the bomb immediately
            bomb.destroy();

            // Decrement active bomb count
            if (owner === 1) this.activeBombs--;
            else if (owner === 2) this.p2ActiveBombs--;

            // Delay chain explosion slightly to prevent infinite loop
            this.time.delayedCall(50, () => {
                // Create the chain explosion
                let range = owner === 1 ? this.playerRange : this.p2Range;
                if (isMaxPower) range = Math.max(GRID_COLS, GRID_ROWS);

                this.createExplosionSprite(bx, by);

                const params = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
                params.forEach(dir => {
                    for (let i = 1; i <= range; i++) {
                        const tx = bx + dir.dx * i * TILE_SIZE;
                        const ty = by + dir.dy * i * TILE_SIZE;

                        const walls = this.physics.overlapRect(tx - 1, ty - 1, 2, 2, true, true);
                        const hitWall = walls.some(b => this.walls.contains(b.gameObject));
                        if (hitWall) break;

                        this.createExplosionSprite(tx, ty);
                        const hitBlock = walls.find(b => this.blocks.contains(b.gameObject));
                        if (hitBlock) break;
                    }
                });
            });
        }
    }

    private checkGloveLogic() {
        // Position carried bombs above player
        if (this.p1CarriedBomb && this.player.active) {
            this.p1CarriedBomb.x = this.player.x;
            this.p1CarriedBomb.y = this.player.y - 20; // Slightly above
        }
        if (this.p2CarriedBomb && this.player2 && this.player2.active) {
            this.p2CarriedBomb.x = this.player2.x;
            this.p2CarriedBomb.y = this.player2.y - 20;
        }
    }


    private handlePlayerDeath(playerIdx: number) {
        if (playerIdx === 1) {
            if (!this.player.active) return;
            console.log("P1 Died");


            // Death animation sequence
            this.player.setVelocity(0);
            this.player.body.enable = false;
            this.player.setActive(false); // Prevent multiple triggers

            // Show scared expression
            // Show scared expression
            this.setPlayerExpression('hd_player_scared', 2000, 1);
            soundManager.playPlayerDeath();

            // Spin and shrink animation
            this.tweens.add({
                targets: this.player,
                angle: 720, // Two full rotations
                scale: 0,
                alpha: 0,
                y: this.player.y - 50, // Float up
                duration: 1500,
                ease: 'Cubic.easeIn'
            });

            // Restart or Show Victory
            if (this.isTwoPlayer) {
                this.showVictory(2);
            } else {
                this.time.delayedCall(1800, () => {
                    this.scene.restart({ mode: this.isTwoPlayer ? '2P' : '1P' });
                });
            }

        } else if (this.player2) {
            if (!this.player2.active) return;
            console.log("P2 Died");

            // Show scared expression
            // Show scared expression
            this.setPlayerExpression('hd_player_scared', 2000, 2);
            soundManager.playPlayerDeath();

            // Death animation for P2
            this.player2.setVelocity(0);
            this.player2.body.enable = false;

            // Death animation for P2
            this.tweens.add({
                targets: this.player2,
                angle: 720,
                scale: 0,
                alpha: 0,
                y: this.player2.y - 50,
                duration: 1500,
                ease: 'Cubic.easeIn'
            });

            // Show Victory for P1
            this.showVictory(1);
        }

        // --- SCATTER ITEMS (Loot Drop) ---
        const pSkates = playerIdx === 1 ? this.p1Skates : this.p2Skates;
        const pRange = (playerIdx === 1 ? this.playerRange : this.p2Range) - 2; // -2 base
        const pBombs = (playerIdx === 1 ? this.playerBombsCount : this.p2BombsCount) - 1; // -1 base
        const pHasPB = playerIdx === 1 ? this.hasPowerBomb : this.p2HasPowerBomb;
        const pHasRem = playerIdx === 1 ? this.hasRemote : this.p2HasRemote;
        const pHasGlove = playerIdx === 1 ? this.hasGlove : this.p2HasGlove;

        // Cap scatter to avoid excessive clutter, but be generous
        const itemsToDrop: string[] = [];
        if (pHasPB) itemsToDrop.push('powerbomb');
        if (pHasRem) itemsToDrop.push('remote');
        if (pHasGlove) itemsToDrop.push('glove');
        for (let i = 0; i < Math.min(5, pSkates); i++) itemsToDrop.push('skates');
        for (let i = 0; i < Math.min(5, pRange); i++) itemsToDrop.push('flame');
        for (let i = 0; i < Math.min(5, pBombs); i++) itemsToDrop.push('bombup');

        const originP = playerIdx === 1 ? this.player : this.player2;
        // If player object is mostly destroyed/inactive, use last known pos? (it should still have x/y)
        const ox = originP?.x || 0;
        const oy = originP?.y || 0;

        itemsToDrop.forEach((kind, i) => {
            // Delay slightly per item for a "popcorn" effect
            this.time.delayedCall(i * 50, () => {
                let placed = false;
                let attempts = 0;
                while (!placed && attempts < 10) {
                    attempts++;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = (Math.random() * 180) + 40; // Scatter radius
                    const tx = ox + Math.cos(angle) * dist;
                    const ty = oy + Math.sin(angle) * dist;

                    // Snap
                    const gx = Math.floor(tx / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                    const gy = Math.floor(ty / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

                    // Ensure inside bounds and not blocked
                    if (!this.isGridBlocked(gx, gy)) {
                        const p = this.spawnPowerup(gx, gy, kind);
                        // Add a little bounce
                        p.setScale(0);
                        this.tweens.add({ targets: p, scale: 1, duration: 400, ease: 'Back.out' });
                        p.setData('pickupDelay', this.time.now + 1000); // Prevent instant pickup by killer
                        placed = true;
                    }
                }
            });
        });
    }

    private handleEnemyDeath(_explosion: any, enemy: any) {
        if (!enemy.active) return;
        console.log('Enemy HIT by explosion!', enemy.x, enemy.y);
        enemy.setVelocity(0);
        enemy.body.checkCollision.none = true; // Disable collisions

        // Spin and shrink death
        this.tweens.add({
            targets: enemy,
            scaleX: 0,
            scaleY: 0,
            angle: 360,
            duration: 500,
            onComplete: () => {
                enemy.destroy();

                // Check for win condition in single player
                if (!this.isTwoPlayer) {
                    this.time.delayedCall(100, () => {
                        const remainingEnemies = this.enemies.getChildren().filter((e: any) => e.active).length;
                        if (remainingEnemies === 0) {
                            this.showLevelComplete();
                        }
                    });
                }
            }
        });
    }

    private showLevelComplete() {
        const { width, height } = this.scale;

        // Stop Player & Physics
        this.player.setVelocity(0);
        this.player.body.enable = false;
        if (this.input.keyboard) this.input.keyboard.enabled = false; // Disable input temporarily

        // Zoom Camera to Player
        this.cameras.main.zoomTo(2.0, 1000, 'Cubic.easeInOut');
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Play Dance Animation (Timer-based texture swap for reliability)
        const danceTextures = [
            'hd_player_dance1', 'hd_player_dance2', 'hd_player_dance3', 'hd_player_dance4',
            'hd_player_dance5', 'hd_player_dance6', 'hd_player_dance7', 'hd_player_dance8'
        ];
        let danceIndex = 0;
        const danceTimer = this.time.addEvent({
            delay: 120, // 120ms per frame for snappy dancing
            callback: () => {
                // Randomize order for a fun, chaotic dance
                danceIndex = Math.floor(Math.random() * danceTextures.length);
                this.player.setTexture(danceTextures[danceIndex]);
                this.player.setDisplaySize(120, 120); // Maintain size
            },
            loop: true
        });
        // Store reference to stop it later if needed
        this.player.setData('danceTimer', danceTimer);

        // Confetti Burst from Player
        const particles = this.add.particles(0, 0, 'hd_block_destructible', { // Placeholder particle
            x: this.player.x,
            y: this.player.y,
            speed: { min: 200, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.1, end: 0 },
            lifespan: 1000,
            gravityY: 500,
            quantity: 50,
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00],
            blendMode: 'ADD'
        });
        this.time.delayedCall(1000, () => particles.destroy());

        // Wait for dance, then show UI
        this.time.delayedCall(2000, () => {
            // Zoom back out slightly or freeze frame? Let's keep zoomed but show overlay

            // Re-enable input (for buttons)
            if (this.input.keyboard) this.input.keyboard.enabled = true;

            // Overlay darken (World space to cover zoomed view properly is tricky, use scrollFactor)
            this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
                .setOrigin(0)
                .setDepth(1000)
                .setScrollFactor(0); // Fix to screen

            // Center UI on Screen (using regular coordinates since scrollFactor is 0)
            const cx = width / 2;
            const cy = height / 2;

            const victoryText = this.add.text(cx, cy - 120, 'LEVEL CLEAR!', {
                fontFamily: '"Orbitron", -apple-system, sans-serif',
                fontSize: '96px',
                color: '#ffffff',
                stroke: '#00ff88',
                strokeThickness: 10,
                shadow: { offsetX: 0, offsetY: 0, color: '#00ff88', blur: 40, stroke: true, fill: true }
            }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

            this.tweens.add({
                targets: victoryText,
                scale: 1.05,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Helper to create fixed UI buttons
            const createButton = (yOffset: number, text: string, callback: () => void) => {
                const btnContainer = this.add.container(cx, cy + yOffset);
                btnContainer.setScrollFactor(0);

                const btnBg = this.add.graphics();
                btnBg.fillStyle(0xffffff, 0.08).fillRoundedRect(-150, -35, 300, 70, 35);
                btnBg.lineStyle(2, 0xffffff, 0.15).strokeRoundedRect(-150, -35, 300, 70, 35);

                const btnText = this.add.text(0, 0, text, {
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '28px',
                    color: '#ffffff'
                }).setOrigin(0.5);

                btnContainer.add([btnBg, btnText]);
                btnContainer.setDepth(1001).setInteractive(new Phaser.Geom.Rectangle(-150, -35, 300, 70), Phaser.Geom.Rectangle.Contains);

                btnContainer.on('pointerover', () => {
                    btnBg.clear().fillGradientStyle(0x44ff88, 0x44ff88, 0x22cc66, 0x22cc66, 0.3, 0.3, 0.4, 0.4).fillRoundedRect(-150, -35, 300, 70, 35);
                    this.tweens.add({ targets: btnContainer, scale: 1.05, duration: 200, ease: 'Cubic.easeOut' });
                });
                btnContainer.on('pointerout', () => {
                    btnBg.clear().fillStyle(0xffffff, 0.08).fillRoundedRect(-150, -35, 300, 70, 35).lineStyle(2, 0xffffff, 0.15).strokeRoundedRect(-150, -35, 300, 70, 35);
                    this.tweens.add({ targets: btnContainer, scale: 1.0, duration: 200, ease: 'Cubic.easeOut' });
                });
                btnContainer.on('pointerdown', callback);
            };

            createButton(50, 'NEXT LEVEL', () => {
                this.level++;
                this.cameras.main.fadeOut(500);
                this.time.delayedCall(500, () => {
                    this.scene.restart({ mode: '1P', level: this.level });
                });
            });

            createButton(150, 'MAIN MENU', () => {
                this.cameras.main.fadeOut(500);
                this.time.delayedCall(500, () => {
                    this.scene.start('StartScene');
                });
            });
        });
    }

    // Helper for handleBlockDestroy
    private handleBlockDestroy(_explosion: any, block: any) {
        if (block.active) {
            console.log('Block destroyed at', block.x, block.y);

            // Delay powerup spawn so explosion clears first (Explosion lasts 500ms)
            this.time.delayedCall(600, () => {
                if (Math.random() < this.currentConfig.powerupChance) { // Use level-specific spawn rate
                    const rand = Math.random();
                    console.log('Spawning powerup, rand:', rand);

                    let kind = 'flame';
                    if (rand < 0.20) kind = 'flame';           // 20%
                    else if (rand < 0.40) kind = 'bombup';     // 20%
                    else if (rand < 0.60) kind = 'skates';     // 20% (significantly increased)
                    else if (rand < 0.70) kind = 'powerbomb';  // 10%
                    else if (rand < 0.80) kind = 'remote';     // 10%
                    else if (rand < 0.85) kind = 'glove';      // 5%
                    else if (rand < 0.90) kind = 'portal';     // 5%
                    else if (rand < 0.95) kind = 'skull';      // 5%
                    else kind = 'puppet';                      // 5%

                    if (kind === 'powerbomb') {
                        // Limit 1 Power Bomb per game (on map OR held)
                        const existsOnMap = this.powerups.getChildren().some((p: any) => p.getData('kind') === 'powerbomb');
                        const alreadyHeld = this.hasPowerBomb || this.p2HasPowerBomb;
                        if (existsOnMap || alreadyHeld) {
                            kind = 'bombup'; // Fallback
                        }
                    }

                    this.spawnPowerup(block.x, block.y, kind);
                    console.log(`Spawned ${kind} at`, block.x, block.y);
                }
            });

            if (this.door && Math.abs(block.x - this.door.x) < 5 && Math.abs(block.y - this.door.y) < 5) {
                this.door.setVisible(true);
                this.physics.add.overlap(this.player, this.door, this.handleDoorEnter, undefined, this);
            }
            block.destroy();

            // VOLCANIC: Melting Blocks (Leave Lava Pool)
            if (this.currentConfig.isVolcanic && this.lavaPools) {
                // Determine if this block leaves lava (50% chance)
                if (Math.random() < 0.5) {
                    const lava = this.add.circle(block.x, block.y, 30, 0xff4400, 0.8);
                    this.physics.add.existing(lava);
                    this.lavaPools.add(lava);

                    // Dangerous!
                    this.time.delayedCall(500, () => {
                        if (lava.active) {
                            this.physics.add.overlap(this.player, lava, () => this.handlePlayerDeath(1), undefined, this);
                            if (this.player2) this.physics.add.overlap(this.player2, lava, () => this.handlePlayerDeath(2), undefined, this);
                        }
                    });

                    // Dry up after 3s
                    this.time.delayedCall(3000, () => {
                        lava.destroy();
                    });
                }
            }

            // SPORES: Spore Cloud
            if (this.currentConfig.hasSpores && this.sporeClouds && Math.random() < 0.4) {
                const cloud = this.add.circle(block.x, block.y, 40, 0xaa00aa, 0.6);
                this.physics.add.existing(cloud);
                this.sporeClouds.add(cloud);

                this.tweens.add({ targets: cloud, scale: 1.5, alpha: 0, duration: 5000, onComplete: () => cloud.destroy() });
            }

            // MUSHROOM: Regrowth
            if (this.currentConfig.hasSpores && Math.random() < 0.2) {
                this.time.delayedCall(10000, () => {
                    // Check if empty
                    if (!this.isGridBlocked(block.x, block.y)) {
                        const regrown = this.blocks.create(block.x, block.y, this.currentConfig.blockTexture);
                        regrown.setDisplaySize(TILE_SIZE, TILE_SIZE);
                        regrown.setImmovable(true);
                        // Visual pop
                        this.tweens.add({ targets: regrown, scale: { from: 0, to: 1 }, duration: 500, ease: 'Bounce' });
                    }
                });
            }
        }
    }

    private handlePowerupDestroy(_explosion: any, powerup: any) {
        if (powerup.active) {
            // Visuals: Burn it!
            const x = powerup.x;
            const y = powerup.y;

            // Stop physics
            powerup.body.enable = false;

            // Burn animation (Tween)
            this.tweens.add({
                targets: powerup,
                scale: 0,
                angle: 180,
                tint: 0x000000,
                duration: 500,
                onComplete: () => {
                    powerup.destroy();
                }
            });

            // Create Ash Residue
            const ash = this.add.sprite(x, y, 'burnt_shreds');
            ash.setDisplaySize(60, 60);
            ash.setDepth(1); // Below players
            ash.setAlpha(0.8);

            // Fade ash out slowly
            this.tweens.add({
                targets: ash,
                alpha: 0,
                duration: 5000, // Lingers for 5s
                onComplete: () => ash.destroy()
            });
        }
    }

    private spawnPowerup(x: number, y: number, kind: string): Phaser.Physics.Arcade.Sprite {
        let texture = 'icon_flame';
        if (kind === 'bombup') texture = 'hd_bomb';
        else if (kind === 'skates') texture = 'icon_skates';
        else if (kind === 'powerbomb') texture = 'icon_powerbomb';
        else if (kind === 'remote') texture = 'icon_remote';
        else if (kind === 'glove') texture = 'icon_hand';
        else if (kind === 'portal') texture = 'icon_portal';
        else if (kind === 'skull') texture = 'icon_skull';
        else if (kind === 'puppet') texture = 'icon_puppet';

        const p = this.powerups.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
        p.setData('kind', kind);
        p.setDisplaySize(70, 70);
        p.setDepth(100);
        return p;
    }

    private handlePowerupCollect(_player: any, powerup: any, playerIdx: number) {
        if (powerup.getData('pickupDelay') > this.time.now) return;

        soundManager.playPowerupCollect();

        const kind = powerup.getData('kind');
        // Fallback for types not set 

        if (playerIdx === 1) {
            // Kick out Curse if collecting a good item
            if (this.p1Curse && kind !== 'skull') {
                this.p1Curse = null;

                // Eject skull offset
                const offsetX = (Math.random() < 0.5 ? 1 : -1) * TILE_SIZE;
                const offsetY = (Math.random() < 0.5 ? 1 : -1) * TILE_SIZE;
                let sx = this.player.x + offsetX;
                let sy = this.player.y + offsetY;
                if (this.isGridBlocked(sx, sy)) { sx = this.player.x; sy = this.player.y; }

                const skull = this.spawnPowerup(sx, sy, 'skull');
                skull.setData('pickupDelay', this.time.now + 2000); // 2s delay

                // Bounce
                this.tweens.add({ targets: skull, y: skull.y - 50, duration: 300, yoyo: true, ease: 'Sine.easeOut' });

                this.setPlayerExpression('hd_player_happy', 1000, 1);
            }

            this.setPlayerExpression('hd_player_happy', 1000, 1);

            if (kind === 'flame') {
                this.playerRange++;
                if (this.currentConfig.isDark) this.lightRadius += 50;
            }
            else if (kind === 'bombup') this.playerBombsCount++;
            else if (kind === 'skates') {
                this.p1Skates++;
                this.playerSpeed = Math.min(300, 160 + (this.p1Skates * 20));
            }
            else if (kind === 'powerbomb') {
                // Unique Check
                if (!this.hasPowerBomb && !this.p2HasPowerBomb) {
                    this.hasPowerBomb = true;
                } else {
                    // Fallback to bomb up
                    this.playerBombsCount++;
                }
            }
            else if (kind === 'remote') this.hasRemote = true;
            else if (kind === 'glove') this.hasGlove = true;
            else if (kind === 'skull') {
                const curses = ['diarrhea', 'turtle', 'dud', 'tiny'];
                this.p1Curse = curses[Math.floor(Math.random() * curses.length)];
                this.setPlayerExpression('hd_player_scared', 2000, 1);

                // Tiny Effect Immediate
                if (this.p1Curse === 'tiny') {
                    this.player.setScale(0.7); // Visual shrink
                }
            }
            else if (kind === 'portal') {
                this.hasPortal = true;
                this.setPlayerExpression('hd_player', 0, 1);
                if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
                    (this.player as any).setPipeline('P1WhiteReplace');
                    const pipe = this.renderer.pipelines.get('P1WhiteReplace') as WhiteReplacePipeline;
                    pipe.setTargetColor(0x00ffff); // Cyan
                }
                this.player.setDisplaySize(120, 120);
                this.time.delayedCall(3000, () => {
                    if (this.player && this.player.active) {
                        (this.player as any).resetPipeline();
                    }
                });
            }
            else if (kind === 'puppet') {
                this.setPlayerExpression('hd_player', 0, 1);
                if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
                    (this.player as any).setPipeline('P1WhiteReplace');
                    const pipe = this.renderer.pipelines.get('P1WhiteReplace') as WhiteReplacePipeline;
                    pipe.setTargetColor(0xff66ff); // Magenta
                }
                this.player.setDisplaySize(120, 120);
                this.enemies.getChildren().forEach((e: any) => {
                    e.setTint(0xff66ff);
                    e.setData('isControlled', true);
                    e.body.enable = false;
                });

                this.time.delayedCall(10000, () => {
                    if (this.player && this.player.active) {
                        (this.player as any).resetPipeline();
                    }
                    this.enemies.getChildren().forEach((e: any) => {
                        e.clearTint();
                        e.setData('isControlled', false);
                        e.body.enable = true;
                    });
                });
            }
            // Legacy check
            else if (!kind && powerup.frame.name == '0') this.playerRange++;
            else if (!kind && powerup.frame.name == '1') this.playerBombsCount++;
            else if (!kind && powerup.frame.name == '2') this.playerSpeed += 20;

        } else {
            // Player 2
            // Kick out Curse if collecting a good item
            if (this.p2Curse && kind !== 'skull') {
                this.p2Curse = null;

                // Eject skull offset
                const offsetX = (Math.random() < 0.5 ? 1 : -1) * TILE_SIZE;
                const offsetY = (Math.random() < 0.5 ? 1 : -1) * TILE_SIZE;
                let sx = (this.player2?.x || 0) + offsetX;
                let sy = (this.player2?.y || 0) + offsetY;
                if (this.isGridBlocked(sx, sy)) { sx = (this.player2?.x || 0); sy = (this.player2?.y || 0); }

                const skull = this.spawnPowerup(sx, sy, 'skull');
                skull.setData('pickupDelay', this.time.now + 2000); // 2s delay

                // Bounce
                this.tweens.add({ targets: skull, y: skull.y - 50, duration: 300, yoyo: true, ease: 'Sine.easeOut' });

                this.setPlayerExpression('hd_player_happy', 1000, 2);
            }

            if (kind === 'flame') {
                this.p2Range++;
                if (this.currentConfig.isDark) this.p2LightRadius += 50;
            }
            else if (kind === 'bombup') this.p2BombsCount++;
            else if (kind === 'skates') {
                this.p2Skates++;
                this.p2Speed = Math.min(300, 160 + (this.p2Skates * 20));
            }
            else if (kind === 'powerbomb') {
                if (!this.hasPowerBomb && !this.p2HasPowerBomb) {
                    this.p2HasPowerBomb = true;
                } else {
                    this.p2BombsCount++;
                }
            }
            else if (kind === 'skull') {
                const curses = ['diarrhea', 'turtle', 'dud', 'tiny'];
                this.p2Curse = curses[Math.floor(Math.random() * curses.length)];
                this.setPlayerExpression('hd_player_scared', 2000, 2);

                // Tiny Effect Immediate
                if (this.p2Curse === 'tiny' && this.player2) {
                    this.player2.setScale(0.7); // Visual shrink
                }
            }
            else if (kind === 'portal') {
                this.p2HasPortal = true;
                if (this.player2 && this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
                    (this.player2 as any).setPipeline('P2WhiteReplace');
                    const pipe = this.renderer.pipelines.get('P2WhiteReplace') as WhiteReplacePipeline;
                    pipe.setTargetColor(0xff00ff); // Magenta-ish for P2 portal
                    this.player2.setDisplaySize(120, 120);
                    this.time.delayedCall(3000, () => {
                        if (this.player2 && this.player2.active && this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
                            const p = this.renderer.pipelines.get('P2WhiteReplace') as WhiteReplacePipeline;
                            p.setTargetColor(0x333333); // Revert to Grey
                        }
                    });
                }
            }
            else if (kind === 'puppet') {
                if (this.player2 && this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
                    (this.player2 as any).setPipeline('P2WhiteReplace');
                    const pipe = this.renderer.pipelines.get('P2WhiteReplace') as WhiteReplacePipeline;
                    pipe.setTargetColor(0xff66ff);
                    this.player2.setDisplaySize(120, 120);
                }
                this.enemies.getChildren().forEach((e: any) => {
                    e.setTint(0xff66ff);
                    e.setData('isControlled', true);
                    e.body.enable = false;
                });
                this.time.delayedCall(10000, () => {
                    if (this.player2 && this.player2.active && this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
                        const p = this.renderer.pipelines.get('P2WhiteReplace') as WhiteReplacePipeline;
                        p.setTargetColor(0x333333); // Revert to Grey
                    }
                    this.enemies.getChildren().forEach((e: any) => {
                        e.clearTint();
                        e.setData('isControlled', false);
                        e.body.enable = true;
                    });
                });
            }
            else if (kind === 'powerbomb') this.p2HasPowerBomb = true;
            else if (kind === 'remote') this.p2HasRemote = true;
            else if (kind === 'glove') this.p2HasGlove = true;
            else if (kind === 'portal') {
                // Portal: Enable dual-portal placement (R key)
                this.p2HasPortal = true;
                if (this.player2) {
                    this.player2.setTint(0x00ffff);
                    this.time.delayedCall(3000, () => {
                        if (this.player2 && this.player2.active) this.player2.clearTint();
                    });
                }
            }
            else if (kind === 'puppet') {
                // Puppet: Mind Control - Enemies stop and become harmless
                if (this.player2) {
                    this.player2.setTint(0xff66ff); // Pink/Purple tint
                    this.enemies.getChildren().forEach((e: any) => {
                        e.setTint(0xff66ff);
                        e.setData('isControlled', true);
                        e.body.enable = false;
                    });

                    // Release after 10 seconds
                    this.time.delayedCall(10000, () => {
                        if (this.player2 && this.player2.active) {
                            this.player2.clearTint();
                        }
                        this.enemies.getChildren().forEach((e: any) => {
                            e.clearTint();
                            e.setData('isControlled', false);
                            e.body.enable = true;
                        });
                    });
                }
            }
            // Legacy check
            else if (!kind && powerup.frame.name == '0') this.p2Range++;
            else if (!kind && powerup.frame.name == '1') this.p2BombsCount++;
            else if (!kind && powerup.frame.name == '2') this.p2Speed += 20;
        }

        powerup.destroy();
    }

    private handleDoorEnter(_player: any, _door: any) {
        if (this.door.visible && this.enemies.countActive() === 0) {
            console.log("Next Level");
            this.level++;
            this.scene.restart({ mode: '1P' }); // Only 1P progression for now
        }
    }
}
