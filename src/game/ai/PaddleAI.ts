import { Math as PhaserMath } from 'phaser';
import {
    BALL_BASE_SPEED,
    BALL_RADIUS,
    GAME_HEIGHT,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    type AIConfig
} from '../config/gameplay';

export class PaddleAI
{
    private targetY = GAME_HEIGHT / 2;
    private reactionTimer = 0;

    constructor (
        private readonly paddle: Phaser.Physics.Arcade.Image,
        private readonly config: AIConfig
    ) {}

    update (delta: number, ball: Phaser.Physics.Arcade.Image, ballSpeed: number): void
    {
        const ballBody = ball.body as Phaser.Physics.Arcade.Body;

        this.reactionTimer += delta;

        if (this.reactionTimer >= this.config.reactionMs)
        {
            this.reactionTimer = 0;
            this.updateTarget(ball, ballBody);
        }

        this.moveTowards(this.targetY, this.getMaxSpeed(ballSpeed));
    }

    stop (): void
    {
        const body = this.paddle.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(0);
    }

    private updateTarget (ball: Phaser.Physics.Arcade.Image, body: Phaser.Physics.Arcade.Body): void
    {
        if (!this.config.predicts)
        {
            this.targetY = ball.y + this.randomError();
            return;
        }

        this.targetY = body.velocity.x > 0
            ? this.predictImpactY(ball, body) + this.randomError()
            : GAME_HEIGHT / 2;
    }

    private predictImpactY (ball: Phaser.Physics.Arcade.Image, body: Phaser.Physics.Arcade.Body): number
    {
        const targetX = this.paddle.x - (PADDLE_WIDTH / 2) - BALL_RADIUS;
        const timeToImpact = (targetX - ball.x) / body.velocity.x;

        if (timeToImpact <= 0)
        {
            return GAME_HEIGHT / 2;
        }

        // Fold the projected Y between both walls to simulate every bounce.
        const top = BALL_RADIUS;
        const bottom = GAME_HEIGHT - BALL_RADIUS;
        const span = bottom - top;
        const period = span * 2;

        let mirroredY = ball.y + (body.velocity.y * timeToImpact) - top;
        mirroredY = ((mirroredY % period) + period) % period;

        if (mirroredY > span)
        {
            mirroredY = period - mirroredY;
        }

        return PhaserMath.Clamp(top + mirroredY, top, bottom);
    }

    private getMaxSpeed (ballSpeed: number): number
    {
        if (!this.config.speedFactor)
        {
            return this.config.maxSpeed;
        }

        return Math.max(ballSpeed, BALL_BASE_SPEED) * this.config.speedFactor;
    }

    private moveTowards (targetY: number, maxSpeed: number): void
    {
        const body = this.paddle.body as Phaser.Physics.Arcade.Body;
        const halfHeight = PADDLE_HEIGHT / 2;
        const clampedTarget = PhaserMath.Clamp(targetY, halfHeight, GAME_HEIGHT - halfHeight);
        const distance = clampedTarget - this.paddle.y;

        if (Math.abs(distance) <= 3)
        {
            body.setVelocityY(0);
            return;
        }

        const speed = Math.min(maxSpeed, Math.abs(distance) * 8);
        body.setVelocityY(Math.sign(distance) * speed);
    }

    private randomError (): number
    {
        return PhaserMath.Between(-this.config.errorPx, this.config.errorPx);
    }
}
