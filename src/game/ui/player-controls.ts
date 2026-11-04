import { PLAYER_SPEED } from '../config/gameplay';

export type GameKeys = Record<'W' | 'S' | 'UP' | 'DOWN', Phaser.Input.Keyboard.Key>;

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
