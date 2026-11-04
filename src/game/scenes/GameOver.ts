import { Scene } from 'phaser';
import { playMusic, playSfx } from '../audio/sound';
import { AI_CONFIG, COLORS, DIFFICULTIES, RETRO_FONT } from '../config/gameplay';
import type { Difficulty, GameMode, GameResult, GameSettings } from '../types';
import { bindFullscreenKey, colorToHex, createNeonButton, drawNeonGrid } from '../ui/neon';

export class GameOver extends Scene
{
    private mode: GameMode = 'local';
    private difficulty: Difficulty = 'medium';
    private player1Score = 0;
    private player2Score = 0;
    private winner: 1 | 2 = 1;
    private suddenDeath = false;
    private starting = false;

    constructor ()
    {
        super('GameOver');
    }

    init (data: Partial<GameResult> = {}): void
    {
        this.mode = data.mode === 'cpu' ? 'cpu' : 'local';
        this.difficulty = data.difficulty && DIFFICULTIES.includes(data.difficulty)
            ? data.difficulty
            : 'medium';
        this.player1Score = data.player1Score ?? 0;
        this.player2Score = data.player2Score ?? 0;
        this.winner = data.winner === 2 ? 2 : 1;
        this.suddenDeath = data.suddenDeath ?? false;
        this.starting = false;
    }

    create (): void
    {
        this.cameras.main.setBackgroundColor(COLORS.background);
        this.cameras.main.fadeIn(220, 0, 0, 0);
        playMusic(this, 'menu_theme');

        drawNeonGrid(this);

        this.add.text(400, 84, 'MATCH COMPLETE', {
            fontFamily: RETRO_FONT,
            fontSize: 12,
            color: colorToHex(COLORS.muted)
        }).setOrigin(0.5);

        const winnerLabel = this.winner === 1
            ? 'PLAYER 1 WINS'
            : (this.mode === 'cpu' ? 'CPU WINS' : 'PLAYER 2 WINS');

        this.add.text(400, 158, winnerLabel, {
            fontFamily: RETRO_FONT,
            fontSize: 32,
            color: '#ffffff',
        }).setOrigin(0.5);

        if (this.suddenDeath)
        {
            this.add.text(400, 210, 'SUDDEN DEATH', {
                fontFamily: RETRO_FONT,
                fontSize: 12,
                color: colorToHex(COLORS.suddenDeath)
            }).setOrigin(0.5);
        }

        this.add.text(330, 284, String(this.player1Score), {
            fontFamily: RETRO_FONT,
            fontSize: 64,
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 278, ':', {
            fontFamily: RETRO_FONT,
            fontSize: 48,
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(470, 284, String(this.player2Score), {
            fontFamily: RETRO_FONT,
            fontSize: 64,
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(330, 336, 'P1', {
            fontFamily: RETRO_FONT,
            fontSize: 10,
            color: colorToHex(COLORS.muted)
        }).setOrigin(0.5);

        this.add.text(470, 336, this.mode === 'cpu' ? 'CPU' : 'P2', {
            fontFamily: RETRO_FONT,
            fontSize: 10,
            color: colorToHex(COLORS.muted)
        }).setOrigin(0.5);

        this.add.text(400, 376, this.mode === 'cpu'
            ? `VS CPU  ${AI_CONFIG[this.difficulty].label}`
            : 'VS LOCAL', {
            fontFamily: RETRO_FONT,
            fontSize: 10,
            color: colorToHex(COLORS.muted)
        }).setOrigin(0.5);

        this.createActions();
        this.bindKeys();

        this.add.text(400, 572, 'ENTER: REMATCH   ESC: MENU   F: FULLSCREEN', {
            fontFamily: RETRO_FONT,
            fontSize: 8,
            color: colorToHex(COLORS.muted)
        }).setOrigin(0.5);
    }

    private createActions (): void
    {
        createNeonButton(this, {
            x: 400,
            y: 446,
            label: 'REMATCH',
            accent: COLORS.player1,
            fontSize: 14,
            onClick: () => this.startRematch()
        });

        createNeonButton(this, {
            x: 400,
            y: 512,
            label: 'MAIN MENU',
            accent: COLORS.player2,
            fontSize: 14,
            onClick: () => this.goToMenu()
        });
    }

    private bindKeys (): void
    {
        bindFullscreenKey(this);
        this.input.keyboard?.on('keydown-ENTER', () => this.startRematch());
        this.input.keyboard?.on('keydown-R', () => this.startRematch());
        this.input.keyboard?.on('keydown-ESC', () => this.goToMenu());
    }

    private startRematch (): void
    {
        if (this.starting)
        {
            return;
        }

        playSfx(this, 'button_click');

        const settings: GameSettings = {
            mode: this.mode,
            difficulty: this.mode === 'cpu' ? this.difficulty : undefined
        };

        this.transition(() => this.scene.start('Game', settings));
    }

    private goToMenu (): void
    {
        if (this.starting)
        {
            return;
        }

        playSfx(this, 'button_click');

        this.transition(() => this.scene.start('MainMenu'));
    }

    private transition (action: () => void): void
    {
        if (this.starting)
        {
            return;
        }

        this.starting = true;
        this.cameras.main.fadeOut(180, 0, 0, 0);

        this.time.delayedCall(190, action);
    }
}
