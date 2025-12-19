# 🎮 Bomberman XL

A modern, HD remake of the classic Bomberman game built with Phaser 3, React, and TypeScript.

![Bomberman XL](https://img.shields.io/badge/Version-1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Phaser](https://img.shields.io/badge/Phaser-3.87-orange)
![React](https://img.shields.io/badge/React-18.3-61DAFB)

## ✨ Features

### 🎨 Modern UI/UX
- **Frosted glass design** with smooth animations
- **Apple-inspired aesthetics** with rounded corners and subtle shadows
- **Animated start screen** with dynamic game elements
- **Interactive controls panel** with dark overlay
- **Smooth transitions** and micro-animations throughout

### 🎮 Gameplay
- **2-Player Mode** - Local multiplayer with WASD and Arrow key controls
- **Multiple Power-ups**:
  - 🔥 **Flame** - Increase bomb range
  - ⛸️ **Skates** - Move faster
  - 💣 **Power Bomb** - Maximum range on first bomb
  - 📡 **Remote** - Manual bomb detonation
  - 🧤 **Glove** - Pick up and throw bombs
  - 🌀 **Portal** - Teleportation (coming soon)
  - 🎭 **Puppet** - Mind control (coming soon)

### 🎭 Character Expressions
- **7 Different Expressions**: Ready, Happy, Angry, Annoyed, Bored, Cheeky, Lovestruck
- **Smooth fade transitions** between expressions
- **Walking animations** with left/right step sprites
- **Death animations** with emotional sequences

### 👾 Enemy AI
- **4 Different Enemy Types** with unique behaviors
- **Collision detection** with blocks and bombs
- **Death animations** with spin and shrink effects
- **Strategic positioning** in corners on start screen

### 🎵 Audio
- **Polyphonic background music**
- **Synthesized sound effects**:
  - Bomb placement
  - Explosions
  - Powerup collection
  - Block destruction
  - Player death
  - Menu clicks

### 🗺️ Level System (Ready for Integration)
- **9 Progressive Levels** with different block types:
  1. Brick Ruins
  2. Wooden Village
  3. Ice Palace
  4. Flower Garden
  5. Circus Arena
  6. Frozen Wasteland
  7. Mushroom Forest
  8. Molten Core
  9. Dirt Cavern
- Increasing difficulty (enemy count, speed)
- Decreasing powerup drop rates

### 💥 Particle System (Ready for Integration)
- Explosion effects (fire + smoke)
- Powerup collection sparkles
- Player death particles
- Block debris with physics
- Camera shake on explosions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bomberman-xl.git

# Navigate to project directory
cd bomberman-xl

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎮 Controls

### Player 1
- **Arrow Keys** - Move
- **Space** - Place bomb
- **B** - Remote detonate (with Remote powerup)
- **Double Space** - Pick up/throw bomb (with Glove powerup)

### Player 2
- **W/A/S/D** - Move
- **E** - Place bomb
- **Q** - Remote detonate (with Remote powerup)
- **Double E** - Pick up/throw bomb (with Glove powerup)

## 🏗️ Project Structure

```
bomberman-xl/
├── public/
│   └── assets/          # Game sprites and images
├── src/
│   ├── game/
│   │   ├── scenes/      # Phaser scenes
│   │   │   ├── BootScene.ts
│   │   │   ├── StartScene.ts
│   │   │   └── MainScene.ts
│   │   ├── ParticleManager.ts
│   │   ├── SoundManager.ts
│   │   └── LevelConfig.ts
│   ├── App.tsx          # React wrapper
│   └── main.tsx         # Entry point
├── index.html
└── package.json
```

## 🎨 Assets

### Player Sprites
- Base: `hd_player.png`
- Expressions: angry, happy, ready, scared, annoyed, bored, cheeky, lovestruck
- Walking: left_step, right_step

### Block Types
- brick_block, wood_block, ice_block, flower_block
- circus_block, frozen_block, shroom_block
- molten_block, dirt_block

### Power-up Icons
- icon_flame, icon_skates, icon_powerbomb
- icon_remote, icon_hand, icon_portal, icon_puppet

### Enemies
- enemy_1, enemy_2, enemy_3, enemy_4

## 🛠️ Technology Stack

- **Game Engine**: Phaser 3.87
- **Frontend**: React 18.3 + TypeScript 5.6
- **Build Tool**: Vite 6.0
- **Styling**: Vanilla CSS
- **Audio**: Web Audio API

## 📝 Development Roadmap

### ✅ Completed
- [x] Modern UI with frosted glass design
- [x] 2-player local multiplayer
- [x] Multiple power-ups (Flame, Skates, Power, Remote, Glove)
- [x] Player expressions and animations
- [x] Enemy AI with different behaviors
- [x] Sound effects and music
- [x] Walking animations
- [x] Death animations
- [x] Particle system (ready for integration)
- [x] Multi-level system (ready for integration)

### 🚧 In Progress
- [ ] Integrate particle effects
- [ ] Integrate level progression
- [ ] Portal power-up implementation
- [ ] Puppet (mind control) power-up

### 📋 Planned
- [ ] Achievements system
- [ ] Leaderboards
- [ ] Additional game modes (Survival, Time Attack)
- [ ] Boss fights
- [ ] More visual effects
- [ ] Better sound library integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Original Bomberman concept by Hudson Soft
- Built with Phaser 3
- Modern UI inspired by Apple design language

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with ❤️ and lots of ☕**
