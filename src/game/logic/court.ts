import {
    BALL_MAX_SPEED,
    BALL_RADIUS,
    GAME_HEIGHT,
    GAME_WIDTH,
    PADDLE_HEIGHT,
    PADDLE_MARGIN,
    PADDLE_WIDTH
} from '../config/gameplay';

export interface CourtObjects
{
    leftPaddle: Phaser.Physics.Arcade.Image;
    rightPaddle: Phaser.Physics.Arcade.Image;
    ball: Phaser.Physics.Arcade.Image;
}

export function createCourtObjects (scene: Phaser.Scene): CourtObjects
{
    const leftPaddle = scene.physics.add.image(PADDLE_MARGIN, GAME_HEIGHT / 2, 'neon-paddle-p1');
    const rightPaddle = scene.physics.add.image(GAME_WIDTH - PADDLE_MARGIN, GAME_HEIGHT / 2, 'neon-paddle-p2');

    configurePaddle(leftPaddle);
    configurePaddle(rightPaddle);

    const ball = scene.physics.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'neon-ball');
    ball.setDepth(6);

    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setCircle(BALL_RADIUS, 10, 10);
    ballBody.setBounce(1, 1);
    ballBody.setAllowGravity(false);
    ballBody.setMaxVelocity(BALL_MAX_SPEED * 1.2, BALL_MAX_SPEED * 1.2);

    return { leftPaddle, rightPaddle, ball };
}

export function configurePaddle (paddle: Phaser.Physics.Arcade.Image): void
{
    paddle.setDepth(4);

    const body = paddle.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(PADDLE_WIDTH, PADDLE_HEIGHT, true);
    body.setCollideWorldBounds(true);
}

export function resetPaddles (
    leftPaddle: Phaser.Physics.Arcade.Image,
    rightPaddle: Phaser.Physics.Arcade.Image
): void
{
    leftPaddle.setY(GAME_HEIGHT / 2);
    rightPaddle.setY(GAME_HEIGHT / 2);

    const leftBody = leftPaddle.body as Phaser.Physics.Arcade.Body;
    const rightBody = rightPaddle.body as Phaser.Physics.Arcade.Body;
    leftBody.setVelocityY(0);
    rightBody.setVelocityY(0);
}

export function bindCollisions (
    scene: Phaser.Scene,
    ball: Phaser.Physics.Arcade.Image,
    leftPaddle: Phaser.Physics.Arcade.Image,
    rightPaddle: Phaser.Physics.Arcade.Image,
    onLeftHit: () => void,
    onRightHit: () => void
): void
{
    scene.physics.add.collider(ball, leftPaddle, () => onLeftHit());
    scene.physics.add.collider(ball, rightPaddle, () => onRightHit());
}
