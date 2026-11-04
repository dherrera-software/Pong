import { BlendModes } from 'phaser';
import { COLORS } from './config/gameplay';

/**
 * Crea las texturas de partículas usadas por el rastro de la bola y las chispas de colisión.
 */
export function createParticleTextures (scene: Phaser.Scene): void
{
    // Partícula de rastro (punto suave, blanco/cian)
    if (!scene.textures.exists('particle-trail'))
    {
        const trail = scene.make.graphics({}, false);

        trail.fillStyle(COLORS.ball, 1);
        trail.fillCircle(4, 4, 4);
        trail.fillStyle(COLORS.player1, 0.6);
        trail.fillCircle(4, 4, 2);
        trail.generateTexture('particle-trail', 8, 8);
        trail.destroy();
    }

    // Partícula de chispa (punto brillante, blanco)
    if (!scene.textures.exists('particle-spark'))
    {
        const spark = scene.make.graphics({}, false);
        spark.fillStyle(0xffffff, 1);
        spark.fillCircle(3, 3, 3);
        spark.fillStyle(0xffffff, 0.4);
        spark.fillCircle(3, 3, 1.5);
        spark.generateTexture('particle-spark', 6, 6);
        spark.destroy();
    }
}

/**
 * Crea el emisor de rastro de la bola.
 */
export function createTrailEmitter (scene: Phaser.Scene): any
{
    console.log('[Particles] creando trail emitter...');
    const emitter = (scene.add as any).particles('particle-trail').createEmitter({
        speed: { min: 5, max: 25 },
        scale: { start: 0.5, end: 0 },
        blendMode: BlendModes.ADD,
        lifespan: 220,
        frequency: 24,
        alpha: { start: 0.9, end: 0 },
        tint: COLORS.ball,
        emitting: false
    });
    console.log('[Particles] trail emitter creado:', !!emitter);
    return emitter;
}

/**
 * Crea el emisor de chispas de colisión.
 */
export function createSparkEmitter (scene: Phaser.Scene): any
{
    console.log('[Particles] creando spark emitter...');
    const emitter = (scene.add as any).particles('particle-spark').createEmitter({
        speed: { min: 60, max: 180 },
        scale: { start: 0.5, end: 0 },
        blendMode: BlendModes.ADD,
        lifespan: 280,
        frequency: -1,
        emitting: false,
        alpha: { start: 1, end: 0 },
        tint: 0xffffff
    });
    console.log('[Particles] spark emitter creado:', !!emitter);
    return emitter;
}

/**
 * Dispara una ráfaga de chispas en una posición con un color dado.
 */
export function emitSparks (
    emitter: any,
    x: number,
    y: number,
    color: number,
    count: number = 6
): void
{
    if (!emitter)
    {
        return;
    }

    emitter.x = x;
    emitter.y = y;
    emitter.tint = color;
    emitter.explode(count);
}

/**
 * Intenta crear todo el sistema de partículas. Si algo falla, devuelve undefined
 * para que el juego continúe sin efectos de partículas (degradación elegante).
 */
export function initParticlesSafely (
    scene: Phaser.Scene
): { trail?: any; spark?: any }
{
    try
    {
        console.log('[Particles] initParticlesSafely iniciado');
        createParticleTextures(scene);
        const trail = createTrailEmitter(scene);
        const spark = createSparkEmitter(scene);
        console.log('[Particles] partículas inicializadas correctamente');
        return { trail, spark };
    }
    catch (e)
    {
        console.warn('[Particles] No se pudieron inicializar las partículas:', e);
        return {};
    }
}
