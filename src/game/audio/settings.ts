// --- Ajustes de audio persistidos en localStorage como JSON ---

export interface AudioSettings
{
    musicVolume: number; // 0 - 100
    sfxVolume: number;   // 0 - 100
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
    musicVolume: 70,
    sfxVolume: 80
};

export const VOLUME_STEP = 10;

const STORAGE_KEY = 'pong.audio-settings.v1';

export function clampVolume (value: number): number
{
    return Math.min(100, Math.max(0, Math.round(value)));
}

function sanitize (value: unknown, fallback: number): number
{
    if (typeof value !== 'number' || !Number.isFinite(value))
    {
        return fallback;
    }

    return clampVolume(value);
}

export function loadAudioSettings (): AudioSettings
{
    try
    {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw)
        {
            return { ...DEFAULT_AUDIO_SETTINGS };
        }

        const parsed = JSON.parse(raw) as Partial<AudioSettings>;

        return {
            musicVolume: sanitize(parsed.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume),
            sfxVolume: sanitize(parsed.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume)
        };
    }
    catch
    {
        return { ...DEFAULT_AUDIO_SETTINGS };
    }
}

export function saveAudioSettings (settings: AudioSettings): void
{
    try
    {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    catch
    {
        // localStorage no disponible (modo privado, etc.): se ignora.
    }
}
