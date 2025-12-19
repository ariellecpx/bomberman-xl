# Bomberman XL - Enhancement Implementation Plan

## Phase 1: Particle Effects ✅
- Created `ParticleManager.ts` with:
  - Explosion particles (fire + smoke)
  - Powerup collection sparkles
  - Player death effects
  - Block debris
  - Camera shake

## Phase 2: Enhanced Sound Effects ✅
- Updated `SoundManager.ts` with:
  - playPowerupCollect() - collection sound
  - playBlockBreak() - block destruction
  - playPlayerDeath() - death sound
  - playMenuClick() - UI feedback
  - Improved playExplosion() - less distorted

## Phase 3: Multi-Level System ✅
- Created `LevelConfig.ts` with 9 levels:
  1. Brick Ruins (brick_block)
  2. Wooden Village (wood_block)
  3. Ice Palace (ice_block)
  4. Flower Garden (flower_block)
  5. Circus Arena (circus_block)
  6. Frozen Wasteland (frozen_block)
  7. Mushroom Forest (shroom_block)
  8. Molten Core (molten_block)
  9. Dirt Cavern (dirt_block)

Each level has:
- Different block texture
- Increasing enemy count
- Increasing enemy speed
- Decreasing powerup chance

## Next Steps:
1. Fix MainScene method calls (playMusic → playBackgroundMusic, playPowerup → playPowerupCollect)
2. Initialize ParticleManager in MainScene
3. Add particle effects to:
   - Explosions
   - Block destruction
   - Powerup collection
   - Player death
4. Integrate level system
5. Add level transition screen
6. Add level indicator UI

## Files Created:
- `/src/game/ParticleManager.ts`
- `/src/game/LevelConfig.ts`

## Files Modified:
- `/src/game/SoundManager.ts` - Added new sounds + export
- `/src/game/scenes/MainScene.ts` - Added imports (needs integration)
