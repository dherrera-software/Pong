import {
    BALL_RADIUS,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    GAME_HEIGHT
} from '../config/gameplay';

export interface TezukaState
{
    enabled: boolean;
    zoneActive: boolean;
    phantomActive: boolean;
    lastHitTime: number;
}

export interface TezukaConfig
{
    cornerThreshold: number;
    zoneCurvature: number;
    phantomCurvature: number;
}

export class TezukaZoneManager
{
    private p1State: TezukaState;
    private p2State: TezukaState;
    private config: TezukaConfig;
    private lastHitter: 1 | 2 | null = null; // Quién golpeó por última vez

    constructor ()
    {
        this.config = {
            cornerThreshold: 0.15,
            zoneCurvature: 0.5,
            phantomCurvature: 0.5
        };
        this.resetStates();
    }

    public resetStates (): void
    {
        this.p1State = { enabled: false, zoneActive: false, phantomActive: false, lastHitTime: 0 };
        this.p2State = { enabled: false, zoneActive: false, phantomActive: false, lastHitTime: 0 };
        this.lastHitter = null;
    }

    public resetRound (): void
    {
        this.p1State.zoneActive = false;
        this.p1State.phantomActive = false;
        this.p2State.zoneActive = false;
        this.p2State.phantomActive = false;
        this.lastHitter = null;
    }

    public toggleAbility (player: 1 | 2): void
    {
        const state = player === 1 ? this.p1State : this.p2State;
        state.enabled = !state.enabled;

        if (!state.enabled) {
            state.zoneActive = false;
            state.phantomActive = false;
        }
    }

    public isEnabled (player: 1 | 2): boolean
    {
        return player === 1 ? this.p1State.enabled : this.p2State.enabled;
    }

        public registerWallHit (side: 1 | 2): void {
        // Si el último que golpeó fue el P1, y la bola toca el lado del P1...
        if (this.lastHitter === 1 && side === 1 && this.p1State.zoneActive) {
            this.p1State.phantomActive = true;
            this.p1State.zoneActive = false; // La Zone muta a Phantom
        }
        // Si el último que golpeó fue el P2, y la bola toca el lado del P2...
        else if (this.lastHitter === 2 && side === 2 && this.p2State.zoneActive) {
            this.p2State.phantomActive = true;
            this.p2State.zoneActive = false; // La Zone muta a Phantom
        }
    }

    public handlePaddleHit (
        player: 1 | 2,
        isCornerHit: boolean,
        currentTime: number
    ): void
    {
        const state = player === 1 ? this.p1State : this.p2State;
        const oppState = player === 1 ? this.p2State : this.p1State;

        // ¡EL ARREGLO ESTÁ AQUÍ!
        // Cuando alguien golpea, solo apagamos la Phantom del rival.
        // NO apagamos la Zone del rival, porque ahora es cuando debe empezar a atraer la pelota.
        oppState.phantomActive = false;

        // Evaluamos el golpe del jugador actual
        if (state.enabled)
        {
            // Primero reseteamos los efectos anteriores de este jugador
            state.zoneActive = false; 
            state.phantomActive = false;

            if (isCornerHit)
            {
                // Golpe en esquina: se pierde el efecto de este golpe
            }
            else
            {
                // Por defecto, asumimos que es un golpe limpio (Zone)
                // Si toca su pared antes de cruzar, registerWallHit lo cambiará a Phantom
                state.zoneActive = true;
                this.lastHitter = player; 
            }
            
            state.lastHitTime = currentTime;
        }
    }

    public onOpponentHit (_returningPlayer: 1 | 2): void
    {
        // Ya no necesitamos hacer nada aquí, la lógica se maneja en handlePaddleHit
    }
    
    public isTezukaZoneActive (player: 1 | 2): boolean
    {
        return player === 1 ? this.p1State.zoneActive : this.p2State.zoneActive;
    }

    public isTezukaPhantomActive (player: 1 | 2): boolean
    {
        return player === 1 ? this.p1State.phantomActive : this.p2State.phantomActive;
    }

    public updatePaddleVisual (
        paddle: Phaser.Physics.Arcade.Image,
        player: 1 | 2
    ): void
    {
        const state = player === 1 ? this.p1State : this.p2State;

        paddle.clearTint();

        if (state.zoneActive) {
            paddle.setTint(0x0000ff); // Azul
        }
        else if (state.phantomActive) {
            paddle.setTint(0xff0000); // Rojo
        }
        else if (state.enabled) {
            paddle.setTint(0xffff00); // Amarillo (Habilidad Lista)
        }
    }

    public isCornerHit (
        paddle: Phaser.Physics.Arcade.Image,
        ballX: number,
        ballY: number
    ): boolean
    {
        const paddleTop = paddle.y - (PADDLE_HEIGHT / 2);
        const paddleBottom = paddle.y + (PADDLE_HEIGHT / 2);
        const paddleLeft = paddle.x - (PADDLE_WIDTH / 2);
        const paddleRight = paddle.x + (PADDLE_WIDTH / 2);
        const cornerHeight = PADDLE_HEIGHT * this.config.cornerThreshold;

        const topLeft = ballX >= paddleLeft && ballX <= paddleLeft + BALL_RADIUS && ballY >= paddleTop && ballY <= paddleTop + cornerHeight;
        const topRight = ballX >= paddleRight - BALL_RADIUS && ballX <= paddleRight && ballY >= paddleTop && ballY <= paddleTop + cornerHeight;
        const bottomLeft = ballX >= paddleLeft && ballX <= paddleLeft + BALL_RADIUS && ballY >= paddleBottom - cornerHeight && ballY <= paddleBottom;
        const bottomRight = ballX >= paddleRight - BALL_RADIUS && ballX <= paddleRight && ballY >= paddleBottom - cornerHeight && ballY <= paddleBottom;

        return topLeft || topRight || bottomLeft || bottomRight;
    }

    public applyZoneEffect (ball: Phaser.Physics.Arcade.Image, currentSpeed: number): void
    {
        const body = ball.body as Phaser.Physics.Arcade.Body;
        const targetY = GAME_HEIGHT / 2; 
        const distanceToCenter = targetY - ball.y;
        const pullStrength = 0.035;

        body.velocity.y += distanceToCenter * pullStrength; 
        
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        if (speed > currentSpeed) {
            body.velocity.x *= (currentSpeed / speed);
            body.velocity.y *= (currentSpeed / speed);
        }
    }

    public applyPhantomEffect (ball: Phaser.Physics.Arcade.Image, currentSpeed: number): void
    {
        const body = ball.body as Phaser.Physics.Arcade.Body;
        const direction = ball.y < 300 ? -1 : 1; 
        body.velocity.y += direction * 15; 

        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        if (speed > currentSpeed) {
            body.velocity.x *= (currentSpeed / speed);
            body.velocity.y *= (currentSpeed / speed);
        }
    }
}