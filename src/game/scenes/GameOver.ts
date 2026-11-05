import { Scene } from 'phaser';
import { playMusic, playSfx } from '../audio/sound';
import { AI_CONFIG, COLORS, DIFFICULTIES, RETRO_FONT } from '../config/gameplay';
import type { Difficulty, GameMode, GameResult, GameSettings } from '../types';
import { bindFullscreenKey, colorToHex, drawNeonGrid } from '../ui/neon';

interface GameOverMenuItem
{
    box: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    arrow: Phaser.GameObjects.Text;
    baseColor: string;
    action: () => void;
}

export class GameOver extends Scene
{
    private mode: GameMode = 'local';
    private difficulty: Difficulty = 'medium';
    private player1Score = 0;
    private player2Score = 0;
    private winner: 1 | 2 = 1;
    private suddenDeath = false;
    private starting = false;
    private selectedIndex = 0;
    private menuItems: GameOverMenuItem[] = [];

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
        this.selectedIndex = 0;
        this.menuItems = [];
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
        this.refreshSelection();
        this.bindKeys();

        this.add.text(400, 572, 'UP/DOWN OR W/S: SELECT   ENTER: CONFIRM   ESC: MENU   F: FULLSCREEN', {
            fontFamily: RETRO_FONT,
            fontSize: 8,
            color: colorToHex(COLORS.muted)
        }).setOrigin(0.5);
    }

    private createActions (): void
    {
        const definitions = [
            { label: 'REMATCH', baseColor: '#ffffff', action: () => this.startRematch() },
            { label: 'MAIN MENU', baseColor: '#ffffff', action: () => this.goToMenu() }
        ];

        const buttonWidth = 360;
        const buttonHeight = 54;
        const positions = [446, 512];

        this.menuItems = definitions.map((definition, index) => {
            const box = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
            box.setStrokeStyle(1, 0xffffff, 0.3);

            const label = this.add.text(0, 0, definition.label, {
                fontFamily: RETRO_FONT,
                fontSize: 14,
                color: definition.baseColor
            }).setOrigin(0.5);

            const arrow = this.add.text(-buttonWidth / 2 - 24, 0, '\u25B6', {
                fontFamily: RETRO_FONT,
                fontSize: 18,
                color: '#c8ff00'
            }).setOrigin(0.5).setVisible(false);

            this.add.container(400, positions[index], [ box, label, arrow ]);

            return {
                box,
                label,
                arrow,
                baseColor: definition.baseColor,
                action: definition.action
            };
        });
    }

    private refreshSelection (): void
    {
        this.menuItems.forEach((item, index) => {
            const selected = index === this.selectedIndex;

            item.box.setStrokeStyle(selected ? 2 : 1, selected ? COLORS.accent : 0xffffff, selected ? 1 : 0.3);
            item.box.setFillStyle(0x000000, selected ? 0.35 : 0);
            item.label.setColor(selected ? '#c8ff00' : item.baseColor);
            item.arrow.setVisible(selected);
        });
    }

    private navigate (direction: number): void
    {
        if (this.starting || this.menuItems.length === 0)
        {
            return;
        }

        playSfx(this, 'button_hover');
        this.selectedIndex = (this.selectedIndex + direction + this.menuItems.length) % this.menuItems.length;
        this.refreshSelection();
    }

    private confirmSelection (): void
    {
        if (this.starting || this.menuItems.length === 0)
        {
            return;
        }

        this.menuItems[this.selectedIndex].action();
    }

    private bindKeys (): void
    {
        bindFullscreenKey(this);

        this.input.keyboard?.on('keydown-UP', () => this.navigate(-1));
        this.input.keyboard?.on('keydown-W', () => this.navigate(-1));
        this.input.keyboard?.on('keydown-DOWN', () => this.navigate(1));
        this.input.keyboard?.on('keydown-S', () => this.navigate(1));

        this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
        this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());

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
