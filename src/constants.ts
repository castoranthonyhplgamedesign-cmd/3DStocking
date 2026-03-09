export const BLOCK_HEIGHT = 0.5;
export const INITIAL_BLOCK_SIZE = 3.0;
export const SWING_RANGE = 6.0;
export const SWING_SPEED = 4.0;
export const SPEED_INCREMENT = 0.12;
export const MAX_SPEED = 12.0;
export const CAMERA_OFFSET_Y = 6.0;
export const CAMERA_LERP_SPEED = 0.05;
export const FALL_GRAVITY = 15.0;
export const PERFECT_THRESHOLD = 0.1;

// Combo
export const COMBO_MULTIPLIER_BASE = 1;    // score multiplier at combo 0
export const COMBO_MULTIPLIER_STEP = 0.5;  // +0.5x per consecutive perfect
export const COMBO_PERFECT_MIN = 2;        // combo kicks in at 2+ consecutive perfects

// Power-ups
export const POWERUP_SPAWN_CHANCE = 0.2;       // 20% chance per block drop
export const POWERUP_MAGNET_THRESHOLD = 0.8;   // magnet auto-snaps if within this distance
export const POWERUP_EXPAND_AMOUNT = 0.6;      // how much wider the block grows
export const POWERUP_EXPAND_MAX = 3.0;         // can't exceed original size
export const POWERUP_SLOWMO_MULTIPLIER = 0.4;  // speed multiplied by this
export const POWERUP_SLOWMO_DURATION = 3;      // lasts 3 blocks
export const POWERUP_FREEZE_DURATION = 2.0;    // freeze time in seconds
