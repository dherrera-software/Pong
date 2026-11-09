import { playSfx } from '../audio/sound';
import { COLORS, RETRO_FONT } from '../config/gameplay';
import { isTouchDevice } from './touch-controls';

export interface PauseMenuCallbacks
{
    onContinue: () => void;
    onRestart: () => void;
    onMenu: () => void;
}

export interface PauseMenu
{
    container: Phaser.GameObjects.Container;
    show: () => void;
    hide: () => void;
    isOpen: () => boolean;
    moveSelection: (direction: number) => void;
    confirm: () => void;
}

interface PauseMenuItem
{
    container: Phaser.GameObjects.Container;
    box: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    arrow: Phaser.GameObjects.Text;
    baseColor: string;
    action: () => void;
}

const BUTTON_WIDTH = 360;
const BUTTON_HEIGHT = 50;
const BUTTON_SPACING = 66;
const FIRST_BUTTON_Y = 248;

export function createPauseMenu (
    scene: Phaser.Scene,
    callbacks: PauseMenuCallbacks
): PauseMenu
{
    const overlay = scene.add.rectangle(0, 0, 800, 600, 0x000000, 0.75);
    overlay.setOrigin(0);

    // Panel perfectamente centrado en pantalla (400, 300)
    const panel = scene.add.rectangle(400, 300, 480, 360, 0x000000, 0.9);
    panel.setStrokeStyle(1, 0xffffff, 0.2);

    const title = scene.add.text(400, 175, 'PAUSED', {
        fontFamily: RETRO_FONT,
        fontSize: 32,
        color: '#ffffff'
    }).setOrigin(0.5);

    const definitions = [
        { label: 'CONTINUE', baseColor: '#ffffff', action: callbacks.onContinue },
        { label: 'RESTART', baseColor: '#ffffff', action: callbacks.onRestart },
        { label: 'MAIN MENU', baseColor: '#888888', action: callbacks.onMenu }
    ];

    const items: PauseMenuItem[] = definitions.map((definition, index) => {
        const box = scene.add.rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 0x000000, 0);
        box.setStrokeStyle(1, 0xffffff, 0.3);

        if (!isTouchDevice()) {
            box.setInteractive({ useHandCursor: true });
            box.on('pointerover', () => {
                if (selectedIndex !== index) {
                    playSfx(scene, 'button_hover');
                    selectedIndex = index;
                    refresh();
                }
            });
            box.on('pointerdown', () => {
                selectedIndex = index;
                confirm();
            });
        }

        const label = scene.add.text(0, 0, definition.label, {
            fontFamily: RETRO_FONT,
            fontSize: 14,
            color: definition.baseColor
        }).setOrigin(0.5);

        const arrow = scene.add.text(-BUTTON_WIDTH / 2 - 24, 0, '\u25B6', {
            fontFamily: RETRO_FONT,
            fontSize: 18,
            color: '#c8ff00'
        }).setOrigin(0.5).setVisible(false);

        const container = scene.add.container(400, FIRST_BUTTON_Y + index * BUTTON_SPACING, [ box, label, arrow ]);

        return {
            container,
            box,
            label,
            arrow,
            baseColor: definition.baseColor,
            action: definition.action
        };
    });

    const hint = scene.add.text(400, 445, 'UP/DOWN OR W/S: SELECT   ENTER: CONFIRM   ESC: RESUME', {
        fontFamily: RETRO_FONT,
        fontSize: 8,
        color: '#888888'
    }).setOrigin(0.5);

    const container = scene.add.container(0, 0, [
        overlay,
        panel,
        title,
        ...items.map((item) => item.container),
        hint
    ]);
    container.setVisible(false);
    container.setDepth(100);

    let selectedIndex = 0;
    let opened = false;

    function refresh (): void
    {
        items.forEach((item, index) => {
            const selected = index === selectedIndex;

            item.box.setStrokeStyle(selected ? 2 : 1, selected ? COLORS.accent : 0xffffff, selected ? 1 : 0.3);
            item.box.setFillStyle(0x000000, selected ? 0.35 : 0);
            item.label.setColor(selected ? '#c8ff00' : item.baseColor);
            item.arrow.setVisible(selected);
        });
    }

    function show (): void
    {
        opened = true;
        selectedIndex = 0;
        refresh();
        container.setVisible(true);
    }

    function hide (): void
    {
        opened = false;
        container.setVisible(false);
    }

    function moveSelection (direction: number): void
    {
        if (!opened)
        {
            return;
        }

        playSfx(scene, 'button_hover');
        selectedIndex = (selectedIndex + direction + items.length) % items.length;
        refresh();
    }

    function confirm (): void
    {
        if (!opened)
        {
            return;
        }

        playSfx(scene, 'button_click');
        items[selectedIndex].action();
    }

    return {
        container,
        show,
        hide,
        isOpen: () => opened,
        moveSelection,
        confirm
    };
}
