# 3D Stack

A 3D tower stacking game built with Babylon.js. Blocks slide back and forth — tap at the right moment to stack them. Any overhanging part gets sliced off and tumbles away. The platform shrinks with each miss, so precision matters. Stack as high as you can!

## How to Play

1. **Tap / Click / Spacebar** to drop the moving block
2. Line it up with the block below — the closer to center, the better
3. Overhanging parts get cut off, making the next block smaller
4. **Perfect placement** snaps the block exactly and builds a combo multiplier
5. Miss completely and it's game over

## Power-ups

Power-ups spawn randomly on blocks (20% chance). They activate when you drop a block onto them.

| Power-up | Effect |
|----------|--------|
| **Magnet** (red) | Auto-snaps the next block if it's close enough |
| **Expand** (green) | Grows the next block wider |
| **Slow-Mo** (blue) | Slows block speed for 3 turns |
| **Freeze** (purple) | Stops the block for 2 seconds — drop it whenever you're ready |

Each power-up has unique particle effects: ambient aura while floating, burst on collection, and activation particles.

## Combo System

Land consecutive perfect placements to build a combo:

- **2+ perfects** in a row activates the combo
- Score multiplier increases by 0.5x per streak (1.5x, 2.0x, 2.5x...)
- Sparkle particles get bigger and shift from white to gold to rainbow at high combos
- Miss a perfect and the combo resets

## High Scores

- Top 10 scores saved locally in your browser
- Enter your name when you set a new high score
- Leaderboard shown on the start screen and game over screen

## Setup

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. Works on desktop and mobile browsers.

## Tech Stack

- **Babylon.js** — 3D engine, GUI, particle systems
- **TypeScript**
- **Vite** — dev server and bundler
