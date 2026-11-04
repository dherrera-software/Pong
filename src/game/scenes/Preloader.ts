import { Scene } from 'phaser';
import { COLORS, RETRO_FONT } from '../config/gameplay';
import { colorToHex } from '../ui/neon';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init (): void
    {
        console.log('[Preloader] init');
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const barWidth = 360;
        const barHeight = 12;

        this.cameras.main.setBackgroundColor(COLORS.background);

        this.add.text(centerX, centerY - 70, 'PONG', {
            fontFamily: RETRO_FONT,
            fontSize: 48,
            color: '#ffffff',
        }).setOrigin(0.5);

        this.add.rectangle(centerX, centerY, barWidth + 4, barHeight + 4)
            .setStrokeStyle(1, 0xffffff, 0.8);

        const bar = this.add.rectangle(
            centerX - (barWidth / 2),
            centerY,
            4,
            barHeight,
            0xffffff
        ).setOrigin(0, 0.5);

        this.add.text(centerX, centerY + 42, 'LOADING', {
            fontFamily: RETRO_FONT,
            fontSize: 10,
            color: colorToHex(COLORS.muted)
        }).setOrigin(0.5);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + ((barWidth - 4) * progress);
        });

        this.load.on('complete', () => {
            console.log('[Preloader] carga completa');
        });

        this.load.on('error', (file: any) => {
            console.error('[Preloader] error cargando:', file.src);
        });
    }

    preload (): void
    {
        console.log('[Preloader] preload');
        this.load.setPath('assets');
        try
        {
            this.load.image('logo', 'logo.png');

            // --- Música de fondo ---
            this.load.audio('menu_theme', 'audio/music/menu_theme.wav');
            this.load.audio('gameplay_theme', 'audio/music/Neon Block Rush.mp3');

            // --- Efectos de sonido ---
            this.load.audio('button_click', 'audio/sfx/button_click.wav');
            this.load.audio('button_hover', 'audio/sfx/button_hover.wav');
            this.load.audio('paddle_hit', 'audio/sfx/paddle_hit.wav');
            this.load.audio('score', 'audio/sfx/score.wav');
            this.load.audio('wall_bounce', 'audio/sfx/wall_bounce.wav');

            console.log('[Preloader] assets y audio cargados');
        }
        catch (e)
        {
            console.error('[Preloader] error cargando assets:', e);
        }
    }

    create (): void
    {
        console.log('[Preloader] create -> iniciando MainMenu');
        this.scene.start('MainMenu');
    }
}
