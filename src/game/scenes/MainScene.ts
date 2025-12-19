import Phaser from 'phaser';
import { soundManager } from '../SoundManager';
import { getLevelConfig } from '../LevelConfig';
import type { LevelConfig } from '../LevelConfig';

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

    init(data: { mode: string; level?: number }) {
        // Fallback if data is missing
        this.isTwoPlayer = (data && data.mode === '2P') || false;
        if (data && data.level !== undefined) {
            this.level = data.level;
        }
    }

    create() {
        this.currentConfig = getLevelConfig(this.level);
        console.log(`Starting Level ${this.level}: ${this.currentConfig.name}`);

        // Reset Powerups
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
        this.p2Portals = [];

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
            this.player2 = null;
        }

        // 0. Background / Floor
        this.floorLayer = this.add.tileSprite(0, 0, this.sys.game.config.width as number, this.sys.game.config.height as number, 'hd_floor');
        this.floorLayer.setOrigin(0, 0);
        this.floorLayer.setAlpha(0.5);

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
        this.player.body.setCircle(20); // Circle hitbox slides better around corners
        this.player.body.setOffset((this.player.width / 2) - 20, (this.player.height / 2) - 0); // Bottom-aligned circle

        // 4. Player 2
        if (this.isTwoPlayer) {
            const startX = (GRID_COLS - 2) * TILE_SIZE + TILE_SIZE / 2;
            const startY = (GRID_ROWS - 2) * TILE_SIZE + TILE_SIZE / 2;
            this.player2 = this.physics.add.sprite(startX, startY, 'hd_player_ready');
            this.player2.setTint(0xff0000); // Red tint for P2
            this.player2.setDisplaySize(120, 120); // Perfect size for prominence
            this.player2.setCollideWorldBounds(true);
            this.player2.body.setCircle(20);
            this.player2.body.setOffset((this.player2.width / 2) - 20, (this.player2.height / 2) - 0);

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
        this.physics.add.collider(this.enemies, this.enemies); // Enemies should bump into each other

        this.physics.add.overlap(this.player, this.enemies, () => this.handlePlayerDeath(1), undefined, this);
        this.physics.add.overlap(this.explosions, this.player, () => this.handlePlayerDeath(1), undefined, this);
        this.physics.add.overlap(this.explosions, this.enemies, this.handleEnemyDeath, undefined, this);
        this.physics.add.overlap(this.explosions, this.blocks, this.handleBlockDestroy, undefined, this);
        this.physics.add.overlap(this.explosions, this.bombs, this.handleBombChain, undefined, this);
        // Don't destroy powerups with explosions - they should persist
        // this.physics.add.overlap(this.explosions, this.powerups, this.handlePowerupDestroy, undefined, this);
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
    }

    update(time: number, _delta: number): void {
        this.checkGloveLogic();
        // P1 Logic
        if (this.player.active && this.cursors) {
            if (this.expressionTimer > 0 && time > this.expressionTimer) {
                this.setPlayerExpression('hd_player');
                this.expressionTimer = 0;
            }

            const body = this.player.body;
            body.setVelocity(0);

            let isMoving = false;

            if (this.cursors.left.isDown) {
                body.setVelocityX(-this.playerSpeed);
                this.player.setFlipX(true);
                isMoving = true;
                // Auto-align to Y center (lane guiding)
                const centerY = Math.floor(this.player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player.y;
                if (Math.abs(offset) < 25) body.setVelocityY(offset * 8);
            } else if (this.cursors.right.isDown) {
                body.setVelocityX(this.playerSpeed);
                this.player.setFlipX(false);
                isMoving = true;
                // Auto-align to Y center
                const centerY = Math.floor(this.player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player.y;
                if (Math.abs(offset) < 25) body.setVelocityY(offset * 8);
            }

            if (this.cursors.up.isDown) {
                body.setVelocityY(-this.playerSpeed);
                isMoving = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player.x;
                if (Math.abs(offset) < 25) body.setVelocityX(offset * 8);
            } else if (this.cursors.down.isDown) {
                body.setVelocityY(this.playerSpeed);
                isMoving = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player.x;
                if (Math.abs(offset) < 25) body.setVelocityX(offset * 8);
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
            } else if (!isMoving && this.expressionTimer === 0) {
                // Return to idle when stopped
                this.player.setTexture('hd_player');
                this.player.setDisplaySize(120, 120);
            }

            // Apply final normalization to maintain consistent speed
            if (body.velocity.x !== 0 || body.velocity.y !== 0) {
                body.velocity.normalize().scale(this.playerSpeed);
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
        }

        // P2 Logic
        if (this.isTwoPlayer && this.player2 && this.player2.active && this.wasd) {
            const body2 = this.player2.body;
            body2.setVelocity(0);

            let isMoving = false;

            if (this.wasd.left.isDown) {
                body2.setVelocityX(-this.p2Speed);
                this.player2.setFlipX(true);
                isMoving = true;
                // Auto-align to Y center
                const centerY = Math.floor(this.player2.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player2.y;
                if (Math.abs(offset) < 25) body2.setVelocityY(offset * 8);
            } else if (this.wasd.right.isDown) {
                body2.setVelocityX(this.p2Speed);
                this.player2.setFlipX(false);
                isMoving = true;
                // Auto-align to Y center
                const centerY = Math.floor(this.player2.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerY - this.player2.y;
                if (Math.abs(offset) < 25) body2.setVelocityY(offset * 8);
            }

            if (this.wasd.up.isDown) {
                body2.setVelocityY(-this.p2Speed);
                isMoving = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player2.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player2.x;
                if (Math.abs(offset) < 25) body2.setVelocityX(offset * 8);
            } else if (this.wasd.down.isDown) {
                body2.setVelocityY(this.p2Speed);
                isMoving = true;
                // Auto-align to X center
                const centerX = Math.floor(this.player2.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                const offset = centerX - this.player2.x;
                if (Math.abs(offset) < 25) body2.setVelocityX(offset * 8);
            }

            // Walking animation for P2
            if (isMoving) {
                if (time - this.p2LastWalkTime > this.WALK_ANIM_SPEED) {
                    this.p2WalkFrame = (this.p2WalkFrame + 1) % 2;
                    const walkTexture = this.p2WalkFrame === 0 ? 'hd_player_left_step' : 'hd_player_right_step';
                    this.player2.setTexture(walkTexture);
                    this.player2.setDisplaySize(70, 70);
                    this.p2LastWalkTime = time;
                }
            } else {
                // Return to idle when stopped
                this.player2.setTexture('hd_player');
                this.player2.setDisplaySize(70, 70);
                this.player2.setTint(0xff0000); // Maintain red tint
            }

            if (body2.velocity.x !== 0 || body2.velocity.y !== 0) {
                body2.velocity.normalize().scale(this.p2Speed);
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
        }

        // Enemy AI (Same as before)
        this.enemies.getChildren().forEach((e: any) => {
            const enemy = e as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            if (!enemy.active) return;

            // Check if they hit something (including bombs and blocks)
            const isBlocked = enemy.body.blocked.left || enemy.body.blocked.right || enemy.body.blocked.up || enemy.body.blocked.down ||
                enemy.body.touching.left || enemy.body.touching.right || enemy.body.touching.up || enemy.body.touching.down ||
                enemy.body.velocity.length() < 10;

            if (isBlocked) {
                const type = enemy.getData('type');
                const speed = (type === 3) ? 140 : 100;
                // Pick a new random direction
                const dirs = [{ x: speed, y: 0 }, { x: -speed, y: 0 }, { x: 0, y: speed }, { x: 0, y: -speed }];
                let chosenDir = dirs[Math.floor(Math.random() * dirs.length)];
                enemy.setVelocity(chosenDir.x, chosenDir.y);
            }
        });
    }

    private expressionTimer = 0;
    private setPlayerExpression(texture: string, duration?: number) {
        if (!this.player.active) return;
        if (this.player.texture.key === 'hd_player_scared' && texture !== 'hd_player_scared') return;
        this.player.setTexture(texture);
        this.player.setDisplaySize(120, 120);
        if (duration) this.expressionTimer = this.time.now + duration;
        else this.expressionTimer = 0;
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
        this.tweens.add({
            targets: portal,
            scale: 0.9,
            alpha: 0.6,
            duration: 500,
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

        portals.forEach((portal, index) => {
            const distance = Phaser.Math.Distance.Between(p.x, p.y, portal.x, portal.y);
            if (distance < 30) {
                const otherPortal = portals[index === 0 ? 1 : 0];

                // Teleport!
                p.x = otherPortal.x;
                p.y = otherPortal.y;

                if (playerIdx === 1) this.lastTeleportP1 = now;
                else this.lastTeleportP2 = now;

                // Visual effect
                this.cameras.main.flash(100, 0, 255, 255, true);
                soundManager.playPowerupCollect(); // Warp sound
            }
        });
    }

    private throwBomb(playerIdx: number) {
        const p = playerIdx === 1 ? this.player : this.player2;
        const bomb = playerIdx === 1 ? this.p1CarriedBomb : this.p2CarriedBomb;

        if (!p || !bomb) return;

        // Determine throw direction based on player facing
        const throwDistance = TILE_SIZE * 3;
        let targetX = bomb.x;
        let targetY = bomb.y;

        if (p.flipX) {
            targetX = bomb.x - throwDistance; // Facing left
        } else {
            targetX = bomb.x + throwDistance; // Facing right
        }

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

        // Self-Correction: Snap player slightly towards the bomb center for a "solid" feel
        p.x = Phaser.Math.Linear(p.x, bx, 0.2);
        p.y = Phaser.Math.Linear(p.y, by, 0.2);

        // @ts-ignore
        const existing = this.bombs.getChildren().find((b: Phaser.Physics.Arcade.Sprite) => b.x === bx && b.y === by);
        if (existing) return;

        const bomb = this.bombs.create(bx, by, 'hd_bomb_stage_1');
        bomb.setDisplaySize(70, 70); // Scaled for 80px tiles
        bomb.setImmovable(true);
        bomb.body.setCircle(27);
        bomb.body.setOffset((bomb.width - 54) / 2, (bomb.height - 54) / 2);
        bomb.setData('owner', playerIdx);

        // Temporarily disable collision with the player who placed it
        // This prevents getting stuck when placing a bomb
        bomb.setData('justPlaced', true);

        // Re-enable collision after player has moved away (300ms)
        this.time.delayedCall(300, () => {
            if (bomb.active) {
                bomb.setData('justPlaced', false);
            }
        });

        // Bomb fuse animation (4 stages over 3 seconds) - store timers for cancellation
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
                // Shake in final stage
                this.tweens.add({
                    targets: bomb,
                    angle: { from: -3, to: 3 },
                    duration: 75,
                    yoyo: true,
                    repeat: 9,
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
            const timerId = this.time.delayedCall(3000, () => {
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
            range = 10; // Max
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
    private generateLevel() {
        // Walls
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = c * TILE_SIZE + TILE_SIZE / 2;
                const y = r * TILE_SIZE + TILE_SIZE / 2;

                if (r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1 || (r % 2 === 0 && c % 2 === 0)) {
                    // Start Indestructible Wall - Darker version of current level's block
                    const w = this.walls.create(x, y, this.currentConfig.blockTexture);
                    w.setDisplaySize(TILE_SIZE, TILE_SIZE);
                    w.setTint(this.currentConfig.wallTint); // Theme-specific darker tint
                    w.body.updateFromGameObject();
                } else {
                    // Safe zone logic for P1 (Top Left) AND P2 (Bottom Right)
                    const isP1Safe = (r < 3 && c < 3);
                    const isP2Safe = (r > GRID_ROWS - 4 && c > GRID_COLS - 4);

                    if (!isP1Safe && !isP2Safe) {
                        if (r === GRID_ROWS - 2 && c === GRID_COLS - 2 && !this.isTwoPlayer) {
                            // Door only needed for single player usually
                            this.door = this.physics.add.sprite(x, y, this.currentConfig.blockTexture);
                            this.door.setVisible(false);
                            this.door.setDisplaySize(TILE_SIZE, TILE_SIZE);
                            const b = this.blocks.create(x, y, this.currentConfig.blockTexture);
                            b.setDisplaySize(TILE_SIZE, TILE_SIZE);
                            b.body.updateFromGameObject();
                        } else if (Math.random() < 0.6) { // More blocks for denser levels
                            const b = this.blocks.create(x, y, this.currentConfig.blockTexture);
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

                    safe = notInP1Zone && notOnWall && !blockAtPosition;
                    attempts++;
                }

                if (safe) {
                    const typeId = (i % 4) + 1;
                    const textureKey = `enemy_${typeId}`;
                    const enemy = this.enemies.create(ex * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2, textureKey);
                    enemy.setData('type', typeId);
                    enemy.setDisplaySize(90, 90); // Scaled for 80px tiles
                    enemy.setBounce(0); // Bouncing causes phasing through gaps
                    enemy.setCollideWorldBounds(true);
                    enemy.setVelocityX(this.currentConfig.enemySpeed);
                    enemy.body.setCircle(30); // Larger hitbox
                    enemy.setMaxVelocity(this.currentConfig.enemySpeed * 1.5, this.currentConfig.enemySpeed * 1.5); // Limit max speed
                    enemy.body.setImmovable(false); // Ensure they can be pushed by collisions
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
                if (isMaxPower) range = 10;

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

            // Show scared expression
            this.setPlayerExpression('hd_player_scared', 2000);

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

            // Restart after animation
            this.time.delayedCall(1800, () => {
                this.scene.restart({ mode: this.isTwoPlayer ? '2P' : '1P' });
            });

        } else if (this.player2) {
            if (!this.player2.active) return;
            console.log("P2 Died");

            // Death animation for P2
            this.player2.setVelocity(0);
            this.player2.body.enable = false;

            // Spin and shrink animation
            this.tweens.add({
                targets: this.player2,
                angle: 720,
                scale: 0,
                alpha: 0,
                y: this.player2.y - 50,
                duration: 1500,
                ease: 'Cubic.easeIn'
            });

            this.time.delayedCall(1800, () => {
                this.scene.restart({ mode: this.isTwoPlayer ? '2P' : '1P' });
            });
        }
    }

    private handleEnemyDeath(_explosion: any, enemy: any) {
        if (!enemy.active) return;
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
                            this.handleLevelWin();
                        }
                    });
                }
            }
        });
    }

    private handleLevelWin() {
        // Stop player movement
        if (this.player && this.player.active) {
            this.player.setVelocity(0);
            this.player.body.enable = false;
        }

        // Victory message
        const { width, height } = this.scale;

        // Dark overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0, 0);
        overlay.setDepth(1000);

        // Victory text
        const victoryText = this.add.text(width / 2, height / 2 - 80, 'LEVEL COMPLETE!', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '72px',
            color: '#00ff00',
            stroke: '#ffffff',
            strokeThickness: 6
        });
        victoryText.setOrigin(0.5);
        victoryText.setDepth(1001);

        // Pulse animation
        this.tweens.add({
            targets: victoryText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Next level button
        const nextButton = this.add.text(width / 2, height / 2 + 40, 'NEXT LEVEL', {
            fontFamily: 'sans-serif',
            fontSize: '36px',
            color: '#ffffff',
            backgroundColor: '#00aa00',
            padding: { x: 30, y: 15 }
        });
        nextButton.setOrigin(0.5);
        nextButton.setDepth(1001);
        nextButton.setInteractive({ useHandCursor: true });

        nextButton.on('pointerover', () => {
            nextButton.setScale(1.1);
        });

        nextButton.on('pointerout', () => {
            nextButton.setScale(1);
        });

        nextButton.on('pointerdown', () => {
            this.level++;
            this.scene.restart({ mode: '1P', level: this.level });
        });

        // Menu button
        const menuButton = this.add.text(width / 2, height / 2 + 120, 'MAIN MENU', {
            fontFamily: 'sans-serif',
            fontSize: '36px',
            color: '#ffffff',
            backgroundColor: '#666666',
            padding: { x: 30, y: 15 }
        });
        menuButton.setOrigin(0.5);
        menuButton.setDepth(1001);
        menuButton.setInteractive({ useHandCursor: true });

        menuButton.on('pointerover', () => {
            menuButton.setScale(1.1);
        });

        menuButton.on('pointerout', () => {
            menuButton.setScale(1);
        });

        menuButton.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }

    // Helper for handleBlockDestroy
    private handleBlockDestroy(_explosion: any, block: any) {
        if (block.active) {
            console.log('Block destroyed at', block.x, block.y);

            // Delay powerup spawn slightly so explosion clears first
            this.time.delayedCall(100, () => {
                if (Math.random() < this.currentConfig.powerupChance) { // Use level-specific spawn rate
                    const rand = Math.random();
                    console.log('Spawning powerup, rand:', rand);

                    let p: Phaser.Physics.Arcade.Sprite;

                    if (rand < 0.25) {
                        p = this.powerups.create(block.x, block.y, 'icon_flame') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'flame');
                        console.log('Spawned flame icon at', block.x, block.y);
                    } else if (rand < 0.50) {
                        p = this.powerups.create(block.x, block.y, 'hd_bomb') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'bombup');
                        console.log('Spawned bombup at', block.x, block.y);
                    } else if (rand < 0.65) {
                        p = this.powerups.create(block.x, block.y, 'icon_skates') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'skates');
                        console.log('Spawned skates at', block.x, block.y);
                    } else if (rand < 0.75) {
                        p = this.powerups.create(block.x, block.y, 'icon_powerbomb') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'powerbomb');
                        console.log('Spawned powerbomb at', block.x, block.y);
                    } else if (rand < 0.85) {
                        p = this.powerups.create(block.x, block.y, 'icon_remote') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'remote');
                        console.log('Spawned remote at', block.x, block.y);
                    } else if (rand < 0.90) {
                        p = this.powerups.create(block.x, block.y, 'icon_hand') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'glove');
                        console.log('Spawned glove at', block.x, block.y);
                    } else if (rand < 0.96) {
                        p = this.powerups.create(block.x, block.y, 'icon_portal') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'portal');
                        console.log('Spawned portal at', block.x, block.y);
                    } else {
                        p = this.powerups.create(block.x, block.y, 'icon_puppet') as Phaser.Physics.Arcade.Sprite;
                        p.setData('kind', 'puppet');
                        console.log('Spawned puppet at', block.x, block.y);
                    }

                    // Ensure visibility
                    p.setDisplaySize(70, 70); // Match bomb size
                    p.setDepth(100); // Very high depth
                    p.setAlpha(1); // Full opacity
                    p.setVisible(true);
                    if (p.body && 'immovable' in p.body) {
                        (p.body as Phaser.Physics.Arcade.Body).immovable = true;
                    }

                    console.log('Powerup created:', p.texture.key, 'visible:', p.visible, 'alpha:', p.alpha, 'depth:', p.depth);
                }
            });

            if (this.door && Math.abs(block.x - this.door.x) < 5 && Math.abs(block.y - this.door.y) < 5) {
                this.door.setVisible(true);
                this.physics.add.overlap(this.player, this.door, this.handleDoorEnter, undefined, this);
            }
            block.destroy();
        }
    }

    private handlePowerupCollect(_player: any, powerup: any, playerIdx: number) {
        soundManager.playPowerupCollect();

        const kind = powerup.getData('kind');
        // Fallback for types not set 

        if (playerIdx === 1) {
            this.setPlayerExpression('hd_player_happy', 1000);

            if (kind === 'flame') this.playerRange++;
            else if (kind === 'bombup') this.playerBombsCount++;
            else if (kind === 'skates') this.playerSpeed += 20;
            else if (kind === 'powerbomb') this.hasPowerBomb = true;
            else if (kind === 'remote') this.hasRemote = true;
            else if (kind === 'glove') this.hasGlove = true;
            else if (kind === 'portal') {
                // Portal: Enable dual-portal placement (V key)
                this.hasPortal = true;
                this.player.setTint(0x00ffff);
                this.time.delayedCall(3000, () => {
                    if (this.player && this.player.active) this.player.clearTint();
                });
            }
            else if (kind === 'puppet') {
                // Puppet: Mind Control - Enemies stop and become harmless
                this.player.setTint(0xff66ff); // Pink/Purple tint
                this.enemies.getChildren().forEach((e: any) => {
                    e.setTint(0xff66ff);
                    e.setData('isControlled', true);
                    e.body.enable = false; // Disable their physics/collision damage
                });

                // Release after 10 seconds
                this.time.delayedCall(10000, () => {
                    if (this.player && this.player.active) {
                        this.player.clearTint();
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
            // P2 Stats
            if (kind === 'flame') this.p2Range++;
            else if (kind === 'bombup') this.p2BombsCount++;
            else if (kind === 'skates') this.p2Speed += 20;
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
