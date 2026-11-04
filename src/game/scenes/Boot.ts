import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        // No cargamos assets externos por ahora, para evitar errores de ruta
    }

    create ()
    {
        console.log('[Boot] create -> iniciando Preloader');
        this.scene.start('Preloader');
    }
}
