export type GameMode = 'local' | 'cpu';

export type Difficulty = 'noob' | 'medium' | 'hard' | 'inferno';

export interface GameSettings
{
    mode: GameMode;
    difficulty?: Difficulty;
}

export interface GameResult extends GameSettings
{
    player1Score: number;
    player2Score: number;
    winner: 1 | 2;
    suddenDeath: boolean;
}
