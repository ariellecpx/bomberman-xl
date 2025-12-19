import Phaser from 'phaser';
import { startScreenMusic, gameMusic } from '../AudioPlayer';
import { LEVELS } from '../LevelConfig';

export class StartScene extends Phaser.Scene {
    private selectedLevel = 1;

    constructor() {
        super('StartScene');
    }

    create() {
        const { width, height } = this.scale;

        // Start background music on first user interaction
        this.input.once('pointerdown', () => {
            startScreenMusic.play();
        });

        // Animated gradient background
        const bg = this.add.tileSprite(0, 0, width, height, 'hd_floor');
        bg.setOrigin(0, 0);
        bg.setAlpha(0.15);

        // Slow animated scroll
        this.tweens.add({
            targets: bg,
            tilePositionX: 300,
            tilePositionY: 300,
            duration: 30000,
            repeat: -1,
            ease: 'Linear'
        });

        // Soft gradient overlay
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a2e, 0x1a1a2e, 0.85, 0.85, 0.95, 0.95);
        gradient.fillRect(0, 0, width, height);

        // Scattered powerups on floor (background layer) - MORE and BIGGER
        const powerupIcons = ['icon_flame', 'icon_skates', 'icon_powerbomb', 'icon_remote', 'icon_hand', 'icon_portal'];
        for (let i = 0; i < 20; i++) {
            const icon = this.add.image(
                Phaser.Math.Between(100, width - 100),
                Phaser.Math.Between(height - 500, height - 80),
                Phaser.Utils.Array.GetRandom(powerupIcons)
            );
            icon.setDisplaySize(40, 40);
            icon.setAlpha(0.18);
            icon.setDepth(1);

            // Gentle floating animation
            this.tweens.add({
                targets: icon,
                y: icon.y + Phaser.Math.Between(-10, 10),
                alpha: 0.28,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }


        // Enemies in corners - well spaced
        const enemyTypes = ['enemy_1', 'enemy_2', 'enemy_3', 'enemy_4'];

        // Top-left corner
        const enemy1 = this.add.image(120, 280, Phaser.Utils.Array.GetRandom(enemyTypes));
        enemy1.setDisplaySize(70, 70);
        enemy1.setAlpha(0.35);
        enemy1.setDepth(2);
        this.tweens.add({
            targets: enemy1,
            y: enemy1.y + 15,
            scaleX: 1.05,
            scaleY: 0.95,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Bottom-left corner
        const enemy2 = this.add.image(120, height - 280, Phaser.Utils.Array.GetRandom(enemyTypes));
        enemy2.setDisplaySize(70, 70);
        enemy2.setAlpha(0.35);
        enemy2.setDepth(2);
        this.tweens.add({
            targets: enemy2,
            y: enemy2.y + 15,
            scaleX: 1.05,
            scaleY: 0.95,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 200
        });

        // Top-right corner
        const enemy3 = this.add.image(width - 120, 280, Phaser.Utils.Array.GetRandom(enemyTypes));
        enemy3.setDisplaySize(70, 70);
        enemy3.setAlpha(0.35);
        enemy3.setDepth(2);
        enemy3.setFlipX(true);
        this.tweens.add({
            targets: enemy3,
            y: enemy3.y + 15,
            scaleX: 1.05,
            scaleY: 0.95,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 400
        });

        // Bottom-right corner
        const enemy4 = this.add.image(width - 120, height - 280, Phaser.Utils.Array.GetRandom(enemyTypes));
        enemy4.setDisplaySize(70, 70);
        enemy4.setAlpha(0.35);
        enemy4.setDepth(2);
        enemy4.setFlipX(true);
        this.tweens.add({
            targets: enemy4,
            y: enemy4.y + 15,
            scaleX: 1.05,
            scaleY: 0.95,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 600
        });

        // Bomberman hero in center - HUGE for widescreen
        const hero = this.add.image(width / 2, height / 2 - 40, 'hd_player_ready');
        hero.setDisplaySize(420, 420); // Slightly smaller to prevent title clash
        hero.setAlpha(0.7);
        hero.setDepth(3);

        // Hero idle animation
        this.tweens.add({
            targets: hero,
            y: hero.y - 15,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Smooth expression change with fade transition
        let currentExpressionIndex = 0;
        const expressions = [
            'hd_player_ready',
            'hd_player_happy',
            'hd_player_angry',
            'hd_player_annoyed',
            'hd_player_bored',
            'hd_player_cheeky',
            'hd_player_lovestruck'
        ];

        this.time.addEvent({
            delay: 3000,
            callback: () => {
                // Fade out
                this.tweens.add({
                    targets: hero,
                    alpha: 0.4,
                    duration: 200,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        // Change expression
                        currentExpressionIndex = (currentExpressionIndex + 1) % expressions.length;
                        hero.setTexture(expressions[currentExpressionIndex]);
                        hero.setDisplaySize(420, 420); // Ensure size stays consistent

                        // Fade in
                        this.tweens.add({
                            targets: hero,
                            alpha: 0.7,
                            duration: 200,
                            ease: 'Cubic.easeOut'
                        });
                    }
                });
            },
            loop: true
        });

        // Floating bombs in background
        for (let i = 0; i < 3; i++) {
            const bomb = this.add.image(
                Phaser.Math.Between(200, width - 200),
                Phaser.Math.Between(200, height - 300),
                'hd_bomb'
            );
            bomb.setDisplaySize(40, 40);
            bomb.setAlpha(0.2);
            bomb.setDepth(1);

            // Slow rotation and float
            this.tweens.add({
                targets: bomb,
                angle: 360,
                y: bomb.y + 20,
                duration: 4000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 1000
            });
        }

        // Title with modern styling - Split into BOMBERMAN and XL - BIGGER
        const titleContainer = this.add.container(width / 2, 200);
        titleContainer.setDepth(10);

        // BOMBERMAN part with gradient
        const bombermanText = this.add.text(0, 0, 'BOMBERMAN ', {
            fontFamily: '"Orbitron", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '120px', // Increased from 88px
            color: '#ffffff',
            stroke: '#00ffff',
            strokeThickness: 8,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#00ffff',
                blur: 60,
                stroke: true,
                fill: true
            }
        }).setOrigin(0, 0.5);

        // XL part with different color and shake
        const xlText = this.add.text(bombermanText.width, 0, 'XL', {
            fontFamily: '"Orbitron", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '120px', // Increased from 88px
            color: '#ffaa00',
            stroke: '#ff6600',
            strokeThickness: 8,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#ff6600',
                blur: 60,
                stroke: true,
                fill: true
            }
        }).setOrigin(0, 0.5);

        // Add both to container
        titleContainer.add(bombermanText);
        titleContainer.add(xlText);

        // Center the title by offsetting both text elements
        const totalWidth = bombermanText.width + xlText.width;
        bombermanText.x = -totalWidth / 2;
        xlText.x = bombermanText.x + bombermanText.width;

        // Gentle breathing animation for whole title
        this.tweens.add({
            targets: titleContainer,
            scale: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // XL shake animation
        this.tweens.add({
            targets: xlText,
            angle: { from: -2, to: 2 },
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Pulsing glow on XL
        this.tweens.add({
            targets: xlText,
            alpha: { from: 0.9, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Dark overlay for settings panel (click to close)
        const settingsOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
        settingsOverlay.setOrigin(0, 0);
        settingsOverlay.setVisible(false);
        settingsOverlay.setDepth(99);
        settingsOverlay.setInteractive();

        settingsOverlay.on('pointerdown', () => {
            this.tweens.add({
                targets: [settingsPanel, settingsOverlay],
                alpha: 0,
                scale: 0.95,
                duration: 250,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    settingsPanel.setVisible(false);
                    settingsOverlay.setVisible(false);
                    settingsPanel.setAlpha(1);
                    settingsOverlay.setAlpha(1);
                    settingsPanel.setScale(1);
                }
            });
        });

        // Settings Panel (frosted glass)
        const settingsPanel = this.add.container(width / 2, height / 2);
        settingsPanel.setVisible(false);
        settingsPanel.setDepth(100);

        // Frosted glass background
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0xffffff, 0.12); // Increased opacity for better readability
        panelBg.fillRoundedRect(-450, -300, 900, 600, 24);
        panelBg.lineStyle(1, 0xffffff, 0.2);
        panelBg.strokeRoundedRect(-450, -300, 900, 600, 24);
        settingsPanel.add(panelBg);

        // Settings Title
        const settingsTitle = this.add.text(0, -260, 'Controls & Power-ups', {
            fontFamily: '"Orbitron", -apple-system, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: '300'
        }).setOrigin(0.5);
        settingsPanel.add(settingsTitle);

        // Player 1 Controls
        const p1Title = this.add.text(-300, -200, 'Player 1', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '20px',
            color: '#88ff88',
            fontStyle: '500'
        }).setOrigin(0.5);
        settingsPanel.add(p1Title);

        const p1Controls = [
            '↑ ↓ ← → Move',
            'SPACE Bomb',
            'B Detonate',
            '2× SPACE Glove'
        ];

        p1Controls.forEach((text, i) => {
            const line = this.add.text(-300, -165 + (i * 28), text, {
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '15px',
                color: 'rgba(255,255,255,0.8)',
                fontStyle: '300'
            }).setOrigin(0.5);
            settingsPanel.add(line);
        });

        // Player 2 Controls
        const p2Title = this.add.text(300, -200, 'Player 2', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '20px',
            color: '#ff8888',
            fontStyle: '500'
        }).setOrigin(0.5);
        settingsPanel.add(p2Title);

        const p2Controls = [
            'W A S D Move',
            'E Bomb',
            'Q Detonate',
            '2× E Glove'
        ];

        p2Controls.forEach((text, i) => {
            const line = this.add.text(300, -165 + (i * 28), text, {
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '15px',
                color: 'rgba(255,255,255,0.8)',
                fontStyle: '300'
            }).setOrigin(0.5);
            settingsPanel.add(line);
        });

        // Power-ups section
        const powerupsTitle = this.add.text(0, -30, 'Power-ups', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: '300'
        }).setOrigin(0.5);
        settingsPanel.add(powerupsTitle);

        const powerups = [
            { icon: 'icon_flame', name: 'Flame', desc: 'Range +' },
            { icon: 'icon_skates', name: 'Skates', desc: 'Speed +' },
            { icon: 'icon_powerbomb', name: 'Power', desc: 'Max Range' },
            { icon: 'icon_remote', name: 'Remote', desc: 'Detonate' },
            { icon: 'icon_hand', name: 'Glove', desc: 'Throw' },
            { icon: 'icon_portal', name: 'Portal', desc: 'Teleport' },
            { icon: 'icon_puppet', name: 'Puppet', desc: 'Control' }
        ];

        const iconSize = 36;
        const startX = -360;
        const startY = 30;
        const spacing = 115;

        powerups.forEach((powerup, i) => {
            const x = startX + (i % 4) * spacing;
            const y = startY + Math.floor(i / 4) * 90;

            const icon = this.add.image(x, y, powerup.icon);
            icon.setDisplaySize(iconSize, iconSize);
            icon.setAlpha(0.9);
            settingsPanel.add(icon);

            const name = this.add.text(x, y + 26, powerup.name, {
                fontFamily: '-apple-system, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                fontStyle: '500'
            }).setOrigin(0.5);
            settingsPanel.add(name);

            const desc = this.add.text(x, y + 42, powerup.desc, {
                fontFamily: '-apple-system, sans-serif',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                fontStyle: '300'
            }).setOrigin(0.5);
            settingsPanel.add(desc);
        });

        // Modern close button
        const closeBg = this.add.graphics();
        closeBg.fillStyle(0xffffff, 0.1);
        closeBg.fillRoundedRect(-60, 235, 120, 40, 20);
        settingsPanel.add(closeBg);

        const closeBtn = this.add.text(0, 255, 'Close', {
            fontFamily: '-apple-system, sans-serif',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: '400'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => {
            closeBg.clear();
            closeBg.fillStyle(0xffffff, 0.15);
            closeBg.fillRoundedRect(-60, 235, 120, 40, 20);
            this.tweens.add({ targets: closeBtn, scale: 1.05, duration: 200, ease: 'Cubic.easeOut' });
        });

        closeBtn.on('pointerout', () => {
            closeBg.clear();
            closeBg.fillStyle(0xffffff, 0.1);
            closeBg.fillRoundedRect(-60, 235, 120, 40, 20);
            this.tweens.add({ targets: closeBtn, scale: 1.0, duration: 200, ease: 'Cubic.easeOut' });
        });

        closeBtn.on('pointerdown', () => {
            this.tweens.add({
                targets: [settingsPanel, settingsOverlay],
                alpha: 0,
                scale: 0.95,
                duration: 250,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    settingsPanel.setVisible(false);
                    settingsOverlay.setVisible(false);
                    settingsPanel.setAlpha(1);
                    settingsOverlay.setAlpha(1);
                    settingsPanel.setScale(1);
                }
            });
        });
        settingsPanel.add(closeBtn);

        // Modern button creator
        const createButton = (y: number, text: string, mode: string, gradient: [number, number]) => {
            const container = this.add.container(width / 2, y);

            // Frosted glass button background
            const btnBg = this.add.graphics();
            btnBg.fillStyle(0xffffff, 0.08);
            btnBg.fillRoundedRect(-140, -28, 280, 56, 28);
            btnBg.lineStyle(1, 0xffffff, 0.15);
            btnBg.strokeRoundedRect(-140, -28, 280, 56, 28);
            container.add(btnBg);

            const btnText = this.add.text(0, 0, text, {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Orbitron", sans-serif',
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: '500'
            }).setOrigin(0.5);
            container.add(btnText);

            container.setInteractive(
                new Phaser.Geom.Rectangle(-140, -28, 280, 56),
                Phaser.Geom.Rectangle.Contains
            );
            container.setData('useHandCursor', true);

            container.on('pointerover', () => {
                btnBg.clear();
                btnBg.fillGradientStyle(gradient[0], gradient[0], gradient[1], gradient[1], 0.25, 0.25, 0.35, 0.35);
                btnBg.fillRoundedRect(-140, -28, 280, 56, 28);
                btnBg.lineStyle(1.5, 0xffffff, 0.3);
                btnBg.strokeRoundedRect(-140, -28, 280, 56, 28);

                this.tweens.add({
                    targets: container,
                    scale: 1.03,
                    duration: 300,
                    ease: 'Cubic.easeOut'
                });
            });

            container.on('pointerout', () => {
                btnBg.clear();
                btnBg.fillStyle(0xffffff, 0.08);
                btnBg.fillRoundedRect(-140, -28, 280, 56, 28);
                btnBg.lineStyle(1, 0xffffff, 0.15);
                btnBg.strokeRoundedRect(-140, -28, 280, 56, 28);

                this.tweens.add({
                    targets: container,
                    scale: 1.0,
                    duration: 300,
                    ease: 'Cubic.easeOut'
                });
            });

            container.on('pointerdown', () => {
                // Create bomb beside button
                const bombX = container.x - 180;
                const bombY = container.y;
                const bomb = this.add.image(bombX, bombY, 'hd_bomb_stage_1');
                bomb.setDisplaySize(50, 50);
                bomb.setDepth(15);

                // Animate through bomb stages (fuse burning)
                this.time.delayedCall(250, () => {
                    bomb.setTexture('hd_bomb_stage_2');
                    bomb.setDisplaySize(50, 50);
                });

                this.time.delayedCall(500, () => {
                    bomb.setTexture('hd_bomb_stage_3');
                    bomb.setDisplaySize(50, 50);
                    // Start shaking at stage 3
                    this.tweens.add({
                        targets: bomb,
                        angle: { from: -5, to: 5 },
                        duration: 50,
                        yoyo: true,
                        repeat: 9,
                        ease: 'Sine.easeInOut'
                    });
                });

                this.time.delayedCall(750, () => {
                    bomb.setTexture('hd_bomb_stage_4');
                    bomb.setDisplaySize(50, 50);
                });

                // Button press animation
                this.tweens.add({
                    targets: container,
                    scale: 0.97,
                    duration: 100,
                    yoyo: true,
                    ease: 'Cubic.easeOut'
                });

                // Character gets worried and shakes
                this.time.delayedCall(200, () => {
                    hero.setTexture('hd_player_scared');
                    hero.setDisplaySize(360, 360);

                    this.tweens.add({
                        targets: hero,
                        x: hero.x + 5,
                        duration: 50,
                        yoyo: true,
                        repeat: 19, // Shake for 1 second
                        ease: 'Sine.easeInOut'
                    });
                });

                // Bomb explodes after 1 second
                this.time.delayedCall(1000, () => {
                    // Explosion flash
                    const explosion = this.add.circle(bombX, bombY, 60, 0xffaa00, 1);
                    explosion.setDepth(20);

                    this.tweens.add({
                        targets: explosion,
                        scale: 2,
                        alpha: 0,
                        duration: 300,
                        ease: 'Cubic.easeOut',
                        onComplete: () => explosion.destroy()
                    });

                    bomb.destroy();

                    // Camera shake
                    this.cameras.main.shake(200, 0.01);
                });

                // Start game after explosion
                this.time.delayedCall(2000, () => {
                    startScreenMusic.stop();
                    gameMusic.play();
                    this.scene.start('MainScene', {
                        mode,
                        level: mode === '1P' ? this.selectedLevel : 1
                    });
                });
            });

            return container;
        };

        const buttonsY = height - 220; // Moved down 
        createButton(buttonsY, '1 Player', '1P', [0x44ff88, 0x22cc66]);
        createButton(buttonsY + 75, '2 Players', '2P', [0x44ccff, 0x2288cc]);

        // Level Selector (Only for 1P)
        const levelSelectorY = buttonsY - 100;
        const levelContainer = this.add.container(width / 2, levelSelectorY);

        const levelBg = this.add.graphics();
        levelBg.fillStyle(0xffffff, 0.08);
        levelBg.fillRoundedRect(-200, -30, 400, 60, 30);
        levelBg.lineStyle(1, 0xffffff, 0.15);
        levelBg.strokeRoundedRect(-200, -30, 400, 60, 30);
        levelContainer.add(levelBg);

        const levelText = this.add.text(0, 0, `Level ${this.selectedLevel}: ${LEVELS[this.selectedLevel - 1].name}`, {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: '500'
        }).setOrigin(0.5);
        levelContainer.add(levelText);

        const updateLevelUI = () => {
            const config = LEVELS[this.selectedLevel - 1];
            levelText.setText(`Level ${this.selectedLevel}: ${config.name}`);
            levelText.setColor('#ffffff');
            // Give it a subtle glow based on theme
            levelText.setShadow(0, 0, '#ffffff', 10, true, true);
        };

        // Left Arrow
        const leftArrow = this.add.text(-220, 0, '◀', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        leftArrow.on('pointerdown', () => {
            this.selectedLevel = this.selectedLevel > 1 ? this.selectedLevel - 1 : 9;
            updateLevelUI();
            this.tweens.add({ targets: leftArrow, scale: 1.2, duration: 100, yoyo: true });
        });

        // Right Arrow
        const rightArrow = this.add.text(220, 0, '▶', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        rightArrow.on('pointerdown', () => {
            this.selectedLevel = this.selectedLevel < 9 ? this.selectedLevel + 1 : 1;
            updateLevelUI();
            this.tweens.add({ targets: rightArrow, scale: 1.2, duration: 100, yoyo: true });
        });

        levelContainer.add(leftArrow);
        levelContainer.add(rightArrow);

        // Hover effects for arrows
        [leftArrow, rightArrow].forEach(arrow => {
            arrow.on('pointerover', () => arrow.setAlpha(0.7));
            arrow.on('pointerout', () => arrow.setAlpha(1));
        });

        // Settings button
        const settingsContainer = this.add.container(width / 2, buttonsY + 150);

        const settingsBg = this.add.graphics();
        settingsBg.fillStyle(0xffffff, 0.06);
        settingsBg.fillRoundedRect(-100, -22, 200, 44, 22);
        settingsBg.lineStyle(1, 0xffffff, 0.12);
        settingsBg.strokeRoundedRect(-100, -22, 200, 44, 22);
        settingsContainer.add(settingsBg);

        const settingsText = this.add.text(0, 0, 'Controls', {
            fontFamily: '-apple-system, sans-serif',
            fontSize: '18px',
            color: 'rgba(255,255,255,0.7)',
            fontStyle: '400'
        }).setOrigin(0.5);
        settingsContainer.add(settingsText);

        settingsContainer.setInteractive(
            new Phaser.Geom.Rectangle(-100, -22, 200, 44),
            Phaser.Geom.Rectangle.Contains
        );

        settingsContainer.on('pointerover', () => {
            settingsBg.clear();
            settingsBg.fillStyle(0xffffff, 0.1);
            settingsBg.fillRoundedRect(-100, -22, 200, 44, 22);
            settingsBg.lineStyle(1, 0xffffff, 0.2);
            settingsBg.strokeRoundedRect(-100, -22, 200, 44, 22);
            this.tweens.add({ targets: settingsContainer, scale: 1.05, duration: 250, ease: 'Cubic.easeOut' });
        });

        settingsContainer.on('pointerout', () => {
            settingsBg.clear();
            settingsBg.fillStyle(0xffffff, 0.06);
            settingsBg.fillRoundedRect(-100, -22, 200, 44, 22);
            settingsBg.lineStyle(1, 0xffffff, 0.12);
            settingsBg.strokeRoundedRect(-100, -22, 200, 44, 22);
            this.tweens.add({ targets: settingsContainer, scale: 1.0, duration: 250, ease: 'Cubic.easeOut' });
        });

        settingsContainer.on('pointerdown', () => {
            settingsPanel.setVisible(true);
            settingsOverlay.setVisible(true);
            this.tweens.add({
                targets: [settingsPanel, settingsOverlay],
                alpha: { from: 0, to: 1 },
                scale: { from: 0.95, to: 1 },
                duration: 300,
                ease: 'Cubic.easeOut'
            });
        });
    }
}
