import { Math as PhaserMath, Scene } from 'phaser';
import { PaddleAI } from '../ai/PaddleAI';
import { TezukaZoneManager } from '../logic/tezuka-zone';
import { playMusic, playSfx } from '../audio/sound';
import {
    AI_CONFIG,
    BALL_BASE_SPEED,
    BALL_MAX_SPEED,
    BALL_RADIUS,
    BALL_SPEED_STEP,
    BOUNCES_PER_SPEED_LEVEL,
    COLORS,
    COUNTDOWN_DURATION_MS,
    DIFFICULTIES,
    GAME_HEIGHT,
    GAME_WIDTH,
    MATCH_DURATION_MS,
    MAX_BOUNCE_ANGLE,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    RETRO_FONT,
    SERVE_DELAY_MS,
    SUDDEN_DEATH_MAX_SPEED
} from '../config/gameplay';
import type { Difficulty, GameMode, GameResult, GameSettings } from '../types';
import { bindFullscreenKey, createGameTextures, drawNeonGrid } from '../ui/neon';
import { createHud, type HudElements } from '../ui/hud';
import { createPauseMenu, type PauseMenu } from '../ui/pause-menu';
import { createPlayerControls, updatePlayerPaddle } from '../ui/player-controls';
import { bindCollisions, createCourtObjects, type CourtObjects, resetPaddles } from '../logic/court';
import { initParticlesSafely, emitSparks } from '../particles';

export class Game extends Scene
{
    private mode: GameMode = 'local';
    private difficulty: Difficulty = 'medium';

    private court!: CourtObjects;
    private leftPaddle!: Phaser.Physics.Arcade.Image;
    private rightPaddle!: Phaser.Physics.Arcade.Image;
    private ball!: Phaser.Physics.Arcade.Image;
    private cpuAI?: PaddleAI;
    private keys!: ReturnType<typeof createPlayerControls>;
    private tezukaZone!: TezukaZoneManager;
        private zoneAura!: Phaser.GameObjects.Arc;

    private hud!: HudElements;

    private player1Score = 0;
    private player2Score = 0;
    private elapsedMs = 0;
    private bounceCount = 0;
    private speedLevel = 0;
    private currentBallSpeed = BALL_BASE_SPEED;
    private lastTimerLabel = '';

    private isGameOver = false;
    private isSuddenDeath = false;
    private isServing = false;
    private isPaused = false;
    private isCountdown = false;
    private countdownStart = 0;
    private nextServeDirection: 1 | -1 = 1;
    private currentSettings!: GameSettings;
    private pauseMenu!: PauseMenu;

    // --- Partículas (opcionales, degradación elegante) ---
    private trailEmitter: any;
    private sparkEmitter: any;

    // --- Countdown en el centro ---
    private countdownText?: Phaser.GameObjects.Text;
    private countdownBg?: Phaser.GameObjects.Rectangle;

    constructor ()
    {
        super('Game');
    }

    init (data: Partial<GameSettings> = {}): void
    {
        this.mode = data.mode === 'cpu' ? 'cpu' : 'local';
        this.difficulty = data.difficulty && DIFFICULTIES.includes(data.difficulty)
            ? data.difficulty
            : 'medium';

        this.currentSettings = {
            mode: this.mode,
            difficulty: this.mode === 'cpu' ? this.difficulty : undefined
        };

        this.player1Score = 0;
        this.player2Score = 0;
        this.elapsedMs = 0;
        this.bounceCount = 0;
        this.speedLevel = 0;
        this.currentBallSpeed = BALL_BASE_SPEED;
        this.lastTimerLabel = '';
        this.isGameOver = false;
        this.isSuddenDeath = false;
        this.isServing = false;
        this.isPaused = false;
        this.isCountdown = false;
        this.cpuAI = undefined;
    }

    create (): void
    {
        console.log('[Game] create inicio');
        this.cameras.main.setBackgroundColor(COLORS.background);
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        drawNeonGrid(this);
        createGameTextures(this);

        // --- Partículas (envuelto en try/catch para no romper el juego) ---
        try
        {
            const particles = initParticlesSafely(this);
            this.trailEmitter = particles.trail;
            this.sparkEmitter = particles.spark;
            if (this.trailEmitter || this.sparkEmitter)
            {
                console.log('[Game] partículas inicializadas');
            }
        }
        catch (e)
        {
            console.warn('[Game] error inicializando partículas:', e);
            this.trailEmitter = undefined;
            this.sparkEmitter = undefined;
        }

        this.court = createCourtObjects(this);
        this.leftPaddle = this.court.leftPaddle;
        this.rightPaddle = this.court.rightPaddle;
        this.ball = this.court.ball;

        this.zoneAura = this.add.circle(this.leftPaddle.x + 50, this.leftPaddle.y, 120, 0x0000ff, 0.15);
        this.zoneAura.setStrokeStyle(4, 0x00ffff, 0.8);
        this.zoneAura.setVisible(false);
        this.zoneAura.setDepth(-1); // Detrás de la paleta

        // Animación para que el aura pulse
        this.tweens.add({
            targets: this.zoneAura,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.hud = createHud(this, this.mode, this.difficulty);
        this.keys = createPlayerControls(this);
        this.tezukaZone = new TezukaZoneManager();
        playMusic(this, 'gameplay_theme');

        this.pauseMenu = createPauseMenu(this, {
            onContinue: () => {
                this.hidePauseMenu();
            },
            onRestart: () => {
                this.restartGame();
            },
            onMenu: () => {
                this.goToMenu();
            }
        });

        bindCollisions(this, this.ball, this.leftPaddle, this.rightPaddle,
            () => this.handlePaddleHit(this.leftPaddle, 1),
            () => this.handlePaddleHit(this.rightPaddle, -1)
        );

        if (this.mode === 'cpu')
        {
            this.cpuAI = new PaddleAI(this.rightPaddle, AI_CONFIG[this.difficulty]);
        }

        bindFullscreenKey(this);

        this.input.keyboard!.addKey('P').on('down', () => this.togglePause());
        this.input.keyboard!.addKey('ESC').on('down', () => this.togglePause());

        this.input.keyboard!.addKey('T').on('down', () => this.toggleTezukaAbility());

        // Navegación del menú de pausa (solo teclado)
        this.input.keyboard!.on('keydown-UP', (event: KeyboardEvent) => this.movePauseSelection(-1, event));
        this.input.keyboard!.on('keydown-W', (event: KeyboardEvent) => this.movePauseSelection(-1, event));
        this.input.keyboard!.on('keydown-DOWN', (event: KeyboardEvent) => this.movePauseSelection(1, event));
        this.input.keyboard!.on('keydown-S', (event: KeyboardEvent) => this.movePauseSelection(1, event));
        this.input.keyboard!.on('keydown-ENTER', (event: KeyboardEvent) => this.confirmPauseSelection(event));
        this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent) => this.confirmPauseSelection(event));

        this.resetPaddles();
        this.startCountdown(PhaserMath.Between(0, 1) === 0 ? -1 : 1);

        console.log('[Game] create terminado');
    }

    update (_time: number, delta: number): void
    {
        if (this.isGameOver || this.isPaused)
        {
            if (this.trailEmitter)
            {
                this.trailEmitter.stop();
            }
            return;
        }

        if (this.isCountdown)
        {
            this.updateCountdown(_time);
            if (this.trailEmitter)
            {
                this.trailEmitter.stop();
            }
            return;
        }

        this.updateClock(delta);

        if (this.isGameOver)
        {
            if (this.trailEmitter)
            {
                this.trailEmitter.stop();
            }
            return;
        }

        if (this.mode === 'cpu')
        {
            const up = this.keys.UP.isDown || this.keys.W.isDown;
            const down = this.keys.DOWN.isDown || this.keys.S.isDown;
            updatePlayerPaddle(this.leftPaddle, up, down);
            this.cpuAI?.update(delta, this.ball, this.currentBallSpeed);
        }
        else
        {
            updatePlayerPaddle(this.leftPaddle, this.keys.W.isDown, this.keys.S.isDown);
            updatePlayerPaddle(this.rightPaddle, this.keys.UP.isDown, this.keys.DOWN.isDown);
        }

        // Update paddle visuals for Tezuka Zone feedback
        this.updatePaddleVisuals();

        // Apply Tezuka effects if active
        if (!this.isGameOver)
        {
            this.updateTezukaEffects();
        }

        this.updateWalls();
        this.checkForGoal();

        // --- Rastro de la bola (solo cuando está en juego y moviéndose) ---
        if (this.trailEmitter && this.ball.visible && !this.isServing)
        {
            this.trailEmitter.x = this.ball.x;
            this.trailEmitter.y = this.ball.y;
            this.trailEmitter.resume();
        }
        else if (this.trailEmitter)
        {
            this.trailEmitter.stop();
        }
    }

    private togglePause (): void
    {
        if (this.isGameOver || this.isCountdown)
        {
            return;
        }

        this.isPaused = !this.isPaused;

        if (this.isPaused)
        {
            this.pauseMenu.show();
            this.physics.world.pause();
            this.trailEmitter?.stop();
        }
        else
        {
            this.pauseMenu.hide();
            this.physics.world.resume();
        }
    }

    private toggleTezukaAbility (): void
    {
        if (this.isGameOver || this.isCountdown || this.isPaused) return;

        // Ahora se llama toggleAbility
        this.tezukaZone.toggleAbility(1);
        this.updatePaddleVisuals();
    }

            private updatePaddleVisuals (): void
    {
        this.tezukaZone.updatePaddleVisual(this.leftPaddle, 1);
        this.tezukaZone.updatePaddleVisual(this.rightPaddle, 2);

        const isZoneActive = this.tezukaZone.isTezukaZoneActive(1);
        const isPhantomActive = this.tezukaZone.isTezukaPhantomActive(1);
        const isEnabled = this.tezukaZone.isEnabled(1); // Asegúrate de tener esta función

        // Aura Visual
        if (isZoneActive) {
            this.zoneAura.setVisible(true);
            this.zoneAura.y = this.leftPaddle.y;
            this.zoneAura.setFillStyle(0x0000ff, 0.15);
            this.zoneAura.setStrokeStyle(4, 0x00ffff, 0.8);
        } 
        else if (isPhantomActive) {
            this.zoneAura.setVisible(true);
            this.zoneAura.y = this.leftPaddle.y;
            this.zoneAura.setFillStyle(0xff0000, 0.15);
            this.zoneAura.setStrokeStyle(4, 0xff0000, 0.8);
        } 
        else if (isEnabled) {
            // Si está encendida pero esperando el golpe, mostramos un aura amarilla sutil
            this.zoneAura.setVisible(true);
            this.zoneAura.y = this.leftPaddle.y;
            this.zoneAura.setFillStyle(0xffff00, 0.05);
            this.zoneAura.setStrokeStyle(2, 0xffff00, 0.3);
        } 
        else {
            this.zoneAura.setVisible(false);
        }
    }

        private updateTezukaEffects (): void
    {
        const body = this.ball.body as Phaser.Physics.Arcade.Body;

        // Si la pelota viaja hacia la derecha (hacia la CPU)
        if (body.velocity.x > 0) {
            // Si hicimos un golpe con rebote, la Phantom empuja la pelota hacia las esquinas
            if (this.tezukaZone.isTezukaPhantomActive(1)) {
                this.tezukaZone.applyPhantomEffect(this.ball, this.currentBallSpeed);
            }
        }
        // Si la pelota viaja hacia la izquierda (hacia nosotros)
        else if (body.velocity.x < 0) {
            // Si hicimos un golpe limpio, la Zone atrae la pelota hacia el centro
            if (this.tezukaZone.isTezukaZoneActive(1)) {
                this.tezukaZone.applyZoneEffect(this.ball, this.currentBallSpeed);
            }
        }
    }

    private movePauseSelection (direction: number, event: KeyboardEvent): void
    {
        if (event.repeat)
        {
            return;
        }

        this.pauseMenu.moveSelection(direction);
    }

    private confirmPauseSelection (event: KeyboardEvent): void
    {
        if (event.repeat)
        {
            return;
        }

        this.pauseMenu.confirm();
    }

    private hidePauseMenu (): void
    {
        this.isPaused = false;
        this.pauseMenu.hide();
        this.physics.world.resume();
    }

    private restartGame (): void
    {
        this.hidePauseMenu();
        this.scene.start('Game', this.currentSettings);
    }

    private goToMenu (): void
    {
        this.hidePauseMenu();
        this.scene.start('MainMenu');
    }

            private startCountdown (direction: 1 | -1 = 1): void
    {
        this.isCountdown = true;
        this.isServing = true;
        this.nextServeDirection = direction;
        this.stopBall();
        this.resetPaddles();
        
        this.tezukaZone.resetRound(); // <--- CAMBIAR A resetRound
        this.updatePaddleVisuals(); 

        this.ball.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.ball.setVisible(true);
        // Se fija en el primer update con el tiempo real del reloj (evita desfases en create)
        this.countdownStart = -1;

        // Limpiar elementos previos si existieran
        this.countdownText?.destroy();
        this.countdownBg?.destroy();

        // Fondo oscuro para que el número resalte en el centro
        this.countdownBg = this.add.rectangle(400, 300, 160, 140, 0x000000, 0.85);
        this.countdownBg.setStrokeStyle(2, 0xffffff, 0.4);
        this.countdownBg.setDepth(50);

        // Texto del countdown en el centro de la pantalla
        this.countdownText = this.add.text(400, 300, '3', {
            fontFamily: RETRO_FONT,
            fontSize: 72,
            color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(51);

        this.hud.status.setText('');
    }

    private updateCountdown (time: number): void
    {
        if (this.countdownStart < 0)
        {
            this.countdownStart = time;
        }

        const elapsed = time - this.countdownStart;
        const remaining = COUNTDOWN_DURATION_MS - elapsed;

        if (remaining <= 0)
        {
            this.isCountdown = false;
            this.isServing = false;
            this.countdownText?.destroy();
            this.countdownText = undefined;
            this.countdownBg?.destroy();
            this.countdownBg = undefined;
            this.hud.status.setText('');
            this.serveBall(this.nextServeDirection);
            return;
        }

        const secondsLeft = Math.ceil(remaining / 1000);

        if (secondsLeft > 0 && this.countdownText)
        {
            this.countdownText.setText(String(secondsLeft));
        }
    }

    private resetPaddles (): void
    {
        resetPaddles(this.leftPaddle, this.rightPaddle);
    }

    private updateClock (delta: number): void
    {
        if (this.isSuddenDeath)
        {
            return;
        }

        this.elapsedMs = Math.min(this.elapsedMs + delta, MATCH_DURATION_MS);

        const remainingMs = MATCH_DURATION_MS - this.elapsedMs;
        const totalSeconds = Math.ceil(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (label !== this.lastTimerLabel)
        {
            this.lastTimerLabel = label;
            this.hud.timer.setText(label);
        }

        if (remainingMs > 0)
        {
            return;
        }

        if (this.player1Score === this.player2Score)
        {
            this.enterSuddenDeath();
        }
        else
        {
            this.finishGame();
        }
    }

            private updateWalls (): void
    {
        const body = this.ball.body as Phaser.Physics.Arcade.Body;
        const velocityY = body.velocity.y;
        
        // Calculamos el lado basado en la posición X
        const currentSide: 1 | 2 = this.ball.x < GAME_WIDTH / 2 ? 1 : 2;

        if (this.ball.y - BALL_RADIUS <= 0 && velocityY < 0)
        {
            this.ball.setY(BALL_RADIUS);
            body.setVelocityY(Math.abs(velocityY));
            this.registerBounce();
            this.tezukaZone.registerWallHit(currentSide); // <-- Enviar lado
            // ... resto
        }

        if (this.ball.y + BALL_RADIUS >= GAME_HEIGHT && velocityY > 0)
        {
            this.ball.setY(GAME_HEIGHT - BALL_RADIUS);
            body.setVelocityY(-Math.abs(velocityY));
            this.registerBounce();
            this.tezukaZone.registerWallHit(currentSide); // <-- Enviar lado
            // ... resto
        }
    }

    private checkForGoal (): void
    {
        if (this.isServing)
        {
            return;
        }

        if (this.ball.x < -BALL_RADIUS)
        {
            this.scorePoint(2);
        }
        else if (this.ball.x > GAME_WIDTH + BALL_RADIUS)
        {
            this.scorePoint(1);
        }
    }

        private handlePaddleHit (paddle: Phaser.Physics.Arcade.Image, direction: 1 | -1): void
    {
        if (this.isGameOver) return;

        const currentTime = this.time.now;
        const player = direction === 1 ? 1 : 2;
        
        const isCornerHit = this.tezukaZone.isCornerHit(paddle, this.ball.x, this.ball.y);
        
        // El manager ahora decide si es Zone o Phantom internamente
         this.tezukaZone.handlePaddleHit(player, isCornerHit, currentTime); 

        // ... (tu código de rebote, ángulos y partículas se mantiene exactamente igual)

        // 2. Física normal del rebote de Pong
        const body = this.ball.body as Phaser.Physics.Arcade.Body;
        
        const relativeImpact = PhaserMath.Clamp(
            (this.ball.y - paddle.y) / (PADDLE_HEIGHT / 2),
            -1,
            1
        );
        const angle = relativeImpact * MAX_BOUNCE_ANGLE;
        const speed = this.currentBallSpeed;

        body.setVelocity(Math.cos(angle) * speed * direction, Math.sin(angle) * speed);

        const edgeOffset = (PADDLE_WIDTH / 2) + BALL_RADIUS + 1;
        this.ball.setX(direction === 1 ? paddle.x + edgeOffset : paddle.x - edgeOffset);

        this.registerBounce();
        playSfx(this, 'paddle_hit');

        // 3. Efectos visuales del rebote
        const sparkColor = direction === 1 ? COLORS.player1 : COLORS.player2;
        emitSparks(this.sparkEmitter, this.ball.x, this.ball.y, sparkColor, 10);

        const shakeIntensity = Math.abs(relativeImpact) > 0.7 ? 70 : 45;
        this.cameras.main.shake(shakeIntensity, 0.0015);

        // 4. Le avisamos a Tezuka Zone que este jugador acaba de devolver la pelota
        // (Esto quita el color azul/rojo de la paleta del rival y resetea las paredes)
        this.tezukaZone.onOpponentHit(player);
    }

    private registerBounce (): void
    {
        this.bounceCount += 1;

        const nextLevel = Math.floor(this.bounceCount / BOUNCES_PER_SPEED_LEVEL);

        if (nextLevel <= this.speedLevel)
        {
            return;
        }

        this.speedLevel = nextLevel;

        const maxSpeed = this.isSuddenDeath ? SUDDEN_DEATH_MAX_SPEED : BALL_MAX_SPEED;
        const nextSpeed = Math.min(
            BALL_BASE_SPEED + (this.speedLevel * BALL_SPEED_STEP),
            maxSpeed
        );

        if (nextSpeed === this.currentBallSpeed)
        {
            return;
        }

        this.currentBallSpeed = nextSpeed;
        this.applyCurrentBallSpeed();
    }

    private applyCurrentBallSpeed (): void
    {
        const body = this.ball.body as Phaser.Physics.Arcade.Body;
        const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);

        if (currentSpeed === 0)
        {
            return;
        }

        const maxSpeed = this.isSuddenDeath ? SUDDEN_DEATH_MAX_SPEED : BALL_MAX_SPEED;
        const targetSpeed = Math.min(this.currentBallSpeed, maxSpeed);
        const factor = targetSpeed / currentSpeed;
        body.setVelocity(body.velocity.x * factor, body.velocity.y * factor);
    }

    private scorePoint (scorer: 1 | 2): void
    {
        if (this.isGameOver)
        {
            return;
        }

        if (scorer === 1)
        {
            this.player1Score += 1;
        }
        else
        {
            this.player2Score += 1;
        }

        this.hud.scoreP1.setText(String(this.player1Score));
        this.hud.scoreP2.setText(String(this.player2Score));
        playSfx(this, 'score');
        this.isServing = true;
        this.stopBall();
        this.cameras.main.shake(100, 0.0025);

        // Chispas de gol en el centro
        emitSparks(this.sparkEmitter, GAME_WIDTH / 2, GAME_HEIGHT / 2, COLORS.timer, 15);

        if (this.isSuddenDeath)
        {
            this.finishGame();
            return;
        }

        this.ball.setVisible(false);

        this.time.delayedCall(SERVE_DELAY_MS, () => {
            if (!this.isGameOver)
            {
                this.startCountdown(scorer === 1 ? 1 : -1);
            }
        });
    }

    private serveBall (direction: 1 | -1): void
    {
        const body = this.ball.body as Phaser.Physics.Arcade.Body;
        const angle = PhaserMath.FloatBetween(-0.42, 0.42);

        this.resetPaddles();
        this.ball.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.ball.setVisible(true);
        body.setVelocity(
            Math.cos(angle) * this.currentBallSpeed * direction,
            Math.sin(angle) * this.currentBallSpeed
        );

        this.isServing = false;
    }

    private stopBall (): void
    {
        const body = this.ball.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
    }

    private enterSuddenDeath (): void
    {
        this.isSuddenDeath = true;
        const body = this.ball.body as Phaser.Physics.Arcade.Body;
        body.setMaxVelocity(SUDDEN_DEATH_MAX_SPEED * 1.2, SUDDEN_DEATH_MAX_SPEED * 1.2);

        this.hud.timer.setText('SUDDEN DEATH');
        this.hud.timer.setFontSize(14);
        this.hud.timer.setFontFamily(RETRO_FONT);
        this.hud.timer.setColor('#ff4d00');
        this.hud.status.setText('NEXT POINT WINS');
        this.hud.status.setColor('#ff4d00');
        this.cameras.main.flash(180, 255, 77, 0);
    }

    private finishGame (): void
    {
        if (this.isGameOver)
        {
            return;
        }

        this.isGameOver = true;
        this.isServing = true;
        this.stopBall();
        this.trailEmitter?.stop();
        this.cpuAI?.stop();
        updatePlayerPaddle(this.leftPaddle, false, false);
        updatePlayerPaddle(this.rightPaddle, false, false);

        const winner: 1 | 2 = this.player1Score >= this.player2Score ? 1 : 2;
        const result: GameResult = {
            mode: this.mode,
            difficulty: this.mode === 'cpu' ? this.difficulty : undefined,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            winner,
            suddenDeath: this.isSuddenDeath
        };

        this.hud.status.setText('GAME OVER');
        this.hud.status.setFontFamily(RETRO_FONT);
        this.cameras.main.fadeOut(450, 0, 0, 0);

        this.time.delayedCall(480, () => {
            this.scene.start('GameOver', result);
        });
    }
}
