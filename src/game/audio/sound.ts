// --- Gestión centralizada de audio (música de fondo y efectos) ---

import {
    clampVolume,
    loadAudioSettings,
    saveAudioSettings,
    type AudioSettings
} from './settings';

// Volumen real máximo de cada canal (los porcentajes de usuario se escalan sobre esto)
const MUSIC_MAX_VOLUME = 0.5;
const SFX_MAX_VOLUME = 0.8;

let audioSettings: AudioSettings = loadAudioSettings();
let currentMusic: Phaser.Sound.BaseSound | null = null;

function musicPlaybackVolume (): number
{
    return (audioSettings.musicVolume / 100) * MUSIC_MAX_VOLUME;
}

function sfxPlaybackVolume (): number
{
    return (audioSettings.sfxVolume / 100) * SFX_MAX_VOLUME;
}

/** Devuelve una copia de la configuración de audio actual. */
export function getAudioSettings (): AudioSettings
{
    return { ...audioSettings };
}

/** Cambia el volumen de la música (0-100) y lo guarda. */
export function setMusicVolume (value: number): void
{
    audioSettings = { ...audioSettings, musicVolume: clampVolume(value) };
    saveAudioSettings(audioSettings);
    applyMusicVolume();
}

/** Cambia el volumen de los efectos (0-100) y lo guarda. */
export function setSfxVolume (value: number): void
{
    audioSettings = { ...audioSettings, sfxVolume: clampVolume(value) };
    saveAudioSettings(audioSettings);
}

function applyMusicVolume (): void
{
    if (!currentMusic)
    {
        return;
    }

    const sound = currentMusic as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;

    if (typeof sound.setVolume === 'function')
    {
        sound.setVolume(musicPlaybackVolume());
    }
}

/**
 * Reproduce una música en bucle. Si ya está sonando la misma, no la reinicia.
 * Detiene cualquier otra música que estuviera activa.
 */
export function playMusic (scene: Phaser.Scene, key: string): void
{
    if (!scene.cache.audio.exists(key))
    {
        return;
    }

    if (currentMusic && currentMusic.key === key && currentMusic.isPlaying)
    {
        return;
    }

    stopMusic();

    currentMusic = scene.sound.add(key, { loop: true, volume: musicPlaybackVolume() });
    currentMusic.play();
}

/**
 * Detiene y libera la música de fondo actual.
 */
export function stopMusic (): void
{
    if (!currentMusic)
    {
        return;
    }

    currentMusic.stop();
    currentMusic.destroy();
    currentMusic = null;
}

/**
 * Reproduce un efecto de sonido puntual.
 */
export function playSfx (scene: Phaser.Scene, key: string): void
{
    if (!scene.cache.audio.exists(key))
    {
        return;
    }

    scene.sound.play(key, { volume: sfxPlaybackVolume() });
}
