import StartGame from './game/main';

function isMobileDevice (): boolean
{
    const userAgent = navigator.userAgent;
    const mobileUserAgent = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini|Mobile/i.test(userAgent);

    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const noHover = window.matchMedia?.('(hover: none)').matches ?? false;

    // iPadOS 13+ se identifica como Mac: el puntero grueso + sin hover lo detecta.
    return mobileUserAgent || (coarsePointer && noHover);
}

document.addEventListener('DOMContentLoaded', () => {

    const warning = document.getElementById('mobile-warning');
    const continueButton = document.getElementById('mobile-warning-continue');

    if (warning && continueButton && isMobileDevice())
    {
        warning.hidden = false;

        continueButton.addEventListener('click', () => {
            warning.hidden = true;
            StartGame('game-container');
        }, { once: true });

        return;
    }

    StartGame('game-container');

});
