import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const v = Date.now();
        this.load.image('hd_player', `assets/hd_player.png?v=${v}`);
        this.load.image('hd_player_angry', `assets/hd_player_angry.png?v=${v}`);
        this.load.image('hd_player_happy', `assets/hd_player_happy.png?v=${v}`);
        this.load.image('hd_player_ready', `assets/hd_player_ready.png?v=${v}`);
        this.load.image('hd_player_scared', `assets/hd_player_scared.png?v=${v}`);
        this.load.image('hd_player_annoyed', `assets/hd_player_annoyed.png?v=${v}`);
        this.load.image('hd_player_bored', `assets/hd_player_bored.png?v=${v}`);
        this.load.image('hd_player_cheeky', `assets/hd_player_cheeky.png?v=${v}`);
        this.load.image('hd_player_lovestruck', `assets/hd_player_lovestruck.png?v=${v}`);
        this.load.image('hd_player_left_step', `assets/hd_player_left_step.png?v=${v}`);
        this.load.image('hd_player_right_step', `assets/hd_player_right_step.png?v=${v}`);

        // Dance Move Assets
        for (let i = 1; i <= 8; i++) {
            this.load.image(`hd_player_dance${i}`, `assets/hd_player_dance${i}.png?v=${v}`);
        }

        this.load.image('enemy_1', `assets/enemy_1.png?v=${v}`);
        this.load.image('enemy_2', `assets/enemy_2.png?v=${v}`);
        this.load.image('enemy_3', `assets/enemy_3.png?v=${v}`);
        this.load.image('enemy_4', `assets/enemy_4.png?v=${v}`);

        this.load.image('icon_skates', `assets/icon_skates.png?v=${v}`);
        this.load.image('icon_hand', `assets/icon_hand.png?v=${v}`);
        this.load.image('icon_remote', `assets/icon_remote.png?v=${v}`);
        this.load.image('icon_portal', `assets/icon_portal.png?v=${v}`);
        this.load.image('icon_flame', `assets/icon_flame.png?v=${v}`);
        this.load.image('icon_powerbomb', `assets/icon_powerbomb.png?v=${v}`);
        this.load.image('icon_puppet', `assets/icon_puppet.png?v=${v}`);
        this.load.image('icon_skull', `assets/hd_icon_skull.png?v=${v}`);

        // Block types for different levels
        this.load.image('wood_block', `assets/wood_block_1.png?v=${v}`);
        this.load.image('ice_block', `assets/ice_block_2.png?v=${v}`);
        this.load.image('flower_block', `assets/flower_block_3.png?v=${v}`);
        this.load.image('circus_block', `assets/circus_block_4.png?v=${v}`);
        this.load.image('frozen_block', `assets/frozen_block_5.png?v=${v}`);
        this.load.image('shroom_block', `assets/shroom_block_6.png?v=${v}`);
        this.load.image('molten_block', `assets/molten_block_7.png?v=${v}`);
        this.load.image('brick_block', `assets/brick_block_8.png?v=${v}`);
        this.load.image('dirt_block', `assets/dirt_block_9.png?v=${v}`);

        // New HD Blocks
        this.load.image('hd_block_destructible', `assets/hd_block_destructible.png?v=${v}`);
        this.load.image('hd_block_indestructible', `assets/hd_block_indestructible.png?v=${v}`);
        this.load.image('hd_block_wooden_hard', `assets/hd_block_wooden_hard.png?v=${v}`);
        this.load.image('hd_block_ice_hard', `assets/hd_block_ice_hard.png?v=${v}`);
        this.load.image('hd_block_molten_hard', `assets/hd_block_molten_hard.png?v=${v}`);
        this.load.image('hd_block_garden_hard', `assets/hd_block_garden_hard.png?v=${v}`);

        this.load.image('hd_block', `assets/hd_block.png?v=${v}`);
        this.load.image('hd_floor', `assets/hd_floor.png?v=${v}`);
        this.load.image('hd_floor_ice', `assets/hd_floor_ice.png?v=${v}`);
        this.load.image('hd_floor_molten', `assets/hd_floor_molten.png?v=${v}`);
        this.load.image('hd_floor_grass', `assets/hd_floor_grass.png?v=${v}`);
        this.load.image('hd_wooden_background', `assets/hd_wooden_background.png?v=${v}`);
        // Bomb animation stages
        this.load.image('hd_bomb', `assets/hd_bomb.png?v=${v}`);
        this.load.image('hd_bomb_stage_1', `assets/hd_bomb_stage_1.png?v=${v}`);
        this.load.image('hd_bomb_stage_2', `assets/hd_bomb_stage_2.png?v=${v}`);
        this.load.image('hd_bomb_stage_3', `assets/hd_bomb_stage_3.png?v=${v}`);
        this.load.image('hd_bomb_stage_4', `assets/hd_bomb_stage_4.png?v=${v}`);


        // Keep old for fallbacks (enemies, items)
        this.load.spritesheet('items', 'assets/items_md.png', { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('enemies', 'assets/enemies_md.png', { frameWidth: 48, frameHeight: 48 });

        // Generate simple textures for things not in sheets yet or as fallbacks
        const graphics = this.make.graphics({ x: 0, y: 0 });

        // Bomb (Black) - Placeholder if needed, but we'll try to use items sheet or generate one
        graphics.clear();
        graphics.fillStyle(0x000000);
        graphics.fillCircle(24, 24, 20);
        graphics.generateTexture('bomb', 48, 48);

        // Explosion (Orange)
        graphics.clear();
        graphics.fillStyle(0xffa500);
        graphics.fillRect(0, 0, 48, 48);
        graphics.generateTexture('explosion', 48, 48);
    }

    create() {
        // Animations are now handled via individual image swapping in MainScene
        // No spritesheet animations needed
        this.scene.start('StartScene');
    }
}
