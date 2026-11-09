import StartGame from './game/main';
import { initOrientationLock, isTouchDevice } from './game/ui/touch-controls';

function isMobileOrTabletDevice (): boolean
{
    if (isTouchDevice()) return true;

    const userAgent = navigator.userAgent;
    const mobileUserAgent = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);

    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const noHover = window.matchMedia?.('(hover: none)').matches ?? false;

    // iPadOS 13+ se identifica como Mac: el puntero grueso + sin hover o maxTouchPoints lo detecta.
    return mobileUserAgent || (coarsePointer && noHover) || (navigator.maxTouchPoints > 0);
}

document.addEventListener('DOMContentLoaded', () => {

    const warning = document.getElementById('mobile-warning');
    const continueButton = document.getElementById('mobile-warning-continue');

    // Bloqueo de orientación GLOBAL: se aplica tanto en el menú principal como
    // durante la partida. Si el móvil/pantalla pequeña está en vertical, se
    // muestra el overlay "Gira tu dispositivo" y no se puede jugar.
    initOrientationLock();

    // En dispositivos móviles y tablets SALTAMOS el aviso "KEYBOARD REQUIRED".
    // El juego ya trae sus propios controles táctiles (navegación D-pad + flechas de juego + pausa),
    // así que no hay que bloquear el inicio pidiendo un teclado físico.
    if (warning && continueButton && isMobileOrTabletDevice())
    {
        warning.hidden = true;
        StartGame('game-container');
        return;
    }

    StartGame('game-container');

});
