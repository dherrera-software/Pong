import { PLAYER_SPEED } from '../config/gameplay';

export type GameKeys = Record<'W' | 'S' | 'UP' | 'DOWN', Phaser.Input.Keyboard.Key>;

export type TouchInput = {
    up: boolean;
    down: boolean;
};

export function createPlayerControls (scene: Phaser.Scene): GameKeys
{
    return scene.input.keyboard!.addKeys('W,S,UP,DOWN') as GameKeys;
}

export function updatePlayerPaddle (
    paddle: Phaser.Physics.Arcade.Image,
    up: boolean,
    down: boolean
): void
{
    const body = paddle.body as Phaser.Physics.Arcade.Body;
    const direction = Number(down) - Number(up);

    body.setVelocityY(direction * PLAYER_SPEED);
}

/**
 * Combina la entrada de teclado con la entrada táctil.
 * Devuelve { up, down } considerando ambas fuentes (OR lógico).
 */
export function combineInputs (
    keyboardUp: boolean,
    keyboardDown: boolean,
    touch: TouchInput
): { up: boolean; down: boolean }
{
    return {
        up: keyboardUp || touch.up,
        down: keyboardDown || touch.down,
    };
}
