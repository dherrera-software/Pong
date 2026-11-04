import { Geom } from 'phaser';
import { playSfx } from '../audio/sound';
import {
    BALL_RADIUS,
    COLORS,
    GAME_HEIGHT,
    GAME_WIDTH,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    RETRO_FONT
} from '../config/gameplay';

export interface NeonButtonOptions
{
    x: number;
    y: number;
    label: string;
    accent: number;
    onClick: () => void;
    width?: number;
    height?: number;
    fontSize?: number;
    fillAlpha?: number;
}

export function colorToHex (color: number): string
{
    return `#${color.toString(16).padStart(6, '0')}`;
}

/** Draws a retro-style black background with a dashed center line */
export function drawNeonGrid (scene: Phaser.Scene, width = GAME_WIDTH, height = GAME_HEIGHT): Phaser.GameObjects.Graphics
{
    const grid = scene.add.graphics();

    // Solid black background
    grid.fillStyle(COLORS.background, 1);
    grid.fillRect(0, 0, width, height);

    // Dashed center line (retro style)
    grid.lineStyle(2, 0xffffff, 0.3);
    for (let y = 0; y < height; y += 24)
    {
        grid.lineBetween(width / 2, y, width / 2, Math.min(y + 12, height));
    }

    // Thin border
    grid.lineStyle(1, 0xffffff, 0.15);
    grid.strokeRect(1, 1, width - 2, height - 2);

    return grid;
}

export function createGameTextures (scene: Phaser.Scene): void
{
    if (!scene.textures.exists('neon-ball'))
    {
        const ballGraphics = scene.make.graphics({}, false);

        // Simple white ball (retro style)
        ballGraphics.fillStyle(0xffffff, 1);
        ballGraphics.fillCircle(20, 20, BALL_RADIUS);
        ballGraphics.generateTexture('neon-ball', 40, 40);
        ballGraphics.destroy();
    }

    createPaddleTexture(scene, 'neon-paddle-p1', COLORS.player1);
    createPaddleTexture(scene, 'neon-paddle-p2', COLORS.player2);
}

function createPaddleTexture (scene: Phaser.Scene, key: string, color: number): void
{
    if (scene.textures.exists(key))
    {
        return;
    }

    const width = PADDLE_WIDTH;
    const height = PADDLE_HEIGHT;
    const graphics = scene.make.graphics({}, false);

    // Simple solid white rectangle (retro style)
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
}

export function bindFullscreenKey (scene: Phaser.Scene): void
{
    scene.input.keyboard?.on('keydown-F', (event: KeyboardEvent) => {
        if (event.repeat)
        {
            return;
        }

        if (scene.scale.isFullscreen)
        {
            scene.scale.stopFullscreen();
        }
        else
        {
            scene.scale.startFullscreen();
        }
    });
}

export function createNeonButton (scene: Phaser.Scene, options: NeonButtonOptions): Phaser.GameObjects.Container
{
    const width = options.width ?? 360;
    const height = options.height ?? 54;

    const background = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
        .setStrokeStyle(1, 0xffffff, 0.3);
    const label = scene.add.text(0, 0, options.label, {
        fontFamily: RETRO_FONT,
        fontSize: options.fontSize ?? 16,
        color: '#ffffff'
    }).setOrigin(0.5);

    const button = scene.add.container(options.x, options.y, [ background, label ]);
    button.setSize(width, height);

    const hitPadding = 14;
    button.setInteractive(
        new Geom.Rectangle(
            -width / 2 - hitPadding,
            -height / 2 - hitPadding,
            width + hitPadding * 2,
            height + hitPadding * 2
        ),
        Geom.Rectangle.Contains
    );

    button.on('pointerover', () => {
        playSfx(scene, 'button_hover');
        scene.tweens.killTweensOf(button);
        scene.tweens.add({ targets: button, scaleX: 1.02, scaleY: 1.02, duration: 80, ease: 'Quad.Out' });
        label.setColor('#c8ff00');
    });

    button.on('pointerout', () => {
        scene.tweens.killTweensOf(button);
        scene.tweens.add({ targets: button, scaleX: 1, scaleY: 1, duration: 80, ease: 'Quad.Out' });
        label.setColor('#ffffff');
    });

    button.on('pointerdown', options.onClick);

    return button;
}
