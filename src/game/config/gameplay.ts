import type { Difficulty } from '../types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const GAME_VERSION = '1.0.0';

export const COLORS = {
    background: 0x000000,
    player1: 0xffffff,
    player2: 0xffffff,
    ball: 0xffffff,
    grid: 0x222222,
    timer: 0xffe600,
    text: 0xffffff,
    muted: 0x888888,
    accent: 0xc8ff00,
    suddenDeath: 0xff4d00
} as const;

export const PADDLE_WIDTH = 14;
export const PADDLE_HEIGHT = 110;
export const PADDLE_MARGIN = 32;
export const PLAYER_SPEED = 440;

export const BALL_RADIUS = 10;
export const BALL_BASE_SPEED = 300;
export const BALL_SPEED_STEP = 24;
export const BALL_MAX_SPEED = 600;
export const SUDDEN_DEATH_MAX_SPEED = 800;
export const BOUNCES_PER_SPEED_LEVEL = 4;
export const MAX_BOUNCE_ANGLE = Math.PI / 3;

export const MATCH_DURATION_MS = 60_000;
export const SERVE_DELAY_MS = 700;
export const COUNTDOWN_DURATION_MS = 3000;

export const RETRO_FONT = '"Press Start 2P", "Courier New", monospace';

export interface AIConfig
{
    label: string;
    color: number;
    reactionMs: number;
    errorPx: number;
    maxSpeed: number;
    speedFactor?: number;
    predicts: boolean;
}

export const DIFFICULTIES: Difficulty[] = [ 'noob', 'medium', 'hard', 'inferno' ];

export const AI_CONFIG: Record<Difficulty, AIConfig> = {
    noob: {
        label: 'NOOB',
        color: 0xffffff,
        reactionMs: 300,
        errorPx: 90,
        maxSpeed: 170,
        predicts: false
    },
    medium: {
        label: 'MEDIUM',
        color: 0xffffff,
        reactionMs: 220,
        errorPx: 70,
        maxSpeed: 230,
        predicts: true
    },
    hard: {
        label: 'HARD',
        color: 0xffffff,
        reactionMs: 140,
        errorPx: 40,
        maxSpeed: 270,
        predicts: true
    },
    inferno: {
        label: 'INFERNO',
        color: 0xff4d00,
        reactionMs: 40,
        errorPx: 10,
        maxSpeed: 310,
        predicts: true
    }
};
