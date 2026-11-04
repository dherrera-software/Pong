import { RETRO_FONT } from '../config/gameplay';

export interface HudElements
{
    scoreP1: Phaser.GameObjects.Text;
    scoreP2: Phaser.GameObjects.Text;
    timer: Phaser.GameObjects.Text;
    status: Phaser.GameObjects.Text;
}

export function createHud (
    scene: Phaser.Scene,
    mode: 'local' | 'cpu',
    difficulty: string
): HudElements
{
    const scoreP1Text = scene.add.text(170, 55, '0', {
        fontFamily: RETRO_FONT,
        fontSize: 48,
        color: '#ffffff'
    }).setOrigin(0.5);

    const scoreP2Text = scene.add.text(630, 55, '0', {
        fontFamily: RETRO_FONT,
        fontSize: 48,
        color: '#ffffff'
    }).setOrigin(0.5);

    scene.add.text(170, 96, 'P1', {
        fontFamily: RETRO_FONT,
        fontSize: 10,
        color: '#888888'
    }).setOrigin(0.5);

    scene.add.text(630, 96, mode === 'cpu' ? 'CPU' : 'P2', {
        fontFamily: RETRO_FONT,
        fontSize: 10,
        color: '#888888'
    }).setOrigin(0.5);

    const timerText = scene.add.text(400, 42, '1:00', {
        fontFamily: RETRO_FONT,
        fontSize: 20,
        color: '#ffffff'
    }).setOrigin(0.5);

    const statusText = scene.add.text(400, 122, mode === 'cpu'
        ? `VS CPU  ${difficulty.toUpperCase()}`
        : 'VS LOCAL', {
        fontFamily: RETRO_FONT,
        fontSize: 10,
        color: '#888888'
    }).setOrigin(0.5);

    scene.add.text(400, 584, 'F: FULLSCREEN   P: PAUSE', {
        fontFamily: RETRO_FONT,
        fontSize: 8,
        color: '#555555'
    }).setOrigin(0.5).setAlpha(0.6);

    return { scoreP1: scoreP1Text, scoreP2: scoreP2Text, timer: timerText, status: statusText };
}
