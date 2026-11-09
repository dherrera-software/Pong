/**
 * touch-controls.ts — Capa de UX para dispositivos móviles y tablets.
 *
 * Responsabilidades:
 * 1. Detección robusta de dispositivos táctiles (móviles, tablets tipo iPad/Android, o simulación).
 * 2. Bloqueo de orientación GLOBAL: si el dispositivo está en vertical (alto > ancho)
 *    muestra overlay a pantalla completa ("Gira tu dispositivo") y pausa el juego.
 * 3. Zonas táctiles en pantalla para 2 jugadores (mitad izquierda P1 cian, mitad derecha P2 magenta)
 *    con botones de flechas SVG transparentes con reborde neón idénticos a los del arcade.
 * 4. Sección de controles de navegación táctil (overlay con D-pad direccional completo y
 *    botones de acción OK / ESC) para navegar menús (MainMenu, PauseMenu, GameOver) en móviles/tablets.
 * 5. Botón de pausa flotante en la esquina superior derecha (móvil).
 * 6. Manejo limpio de eventos táctiles multitáctiles (touchstart, touchmove, touchend) con preventDefault().
 */

// ─── Tipos ───

export interface TouchControlCallbacks {
    /** Se llama cuando se debe pausar el juego (overlay vertical o botón pausa). */
    onPause: () => void;
    /** Se llama cuando se debe reanudar el juego (giró a horizontal). */
    onResume: () => void;
    /** Se llama cuando cambia el estado de entrada táctil de un jugador. */
    onTouchInput: (player: 1 | 2, up: boolean, down: boolean) => void;
}

export type NavDirection = 'up' | 'down' | 'left' | 'right';

export interface NavigationCallbacks {
    onNavigate: (direction: NavDirection) => void;
    onSelect: () => void;
    onBack: () => void;
}

// ─── Detección de dispositivo táctil (móvil / tablet) ───

let dynamicTouchDetected = false;

if (typeof window !== 'undefined') {
    window.addEventListener(
        'touchstart',
        () => {
            dynamicTouchDetected = true;
        },
        { once: true, passive: true }
    );
}

/**
 * Detecta si el dispositivo actual es táctil (móvil o tablet).
 * Reconoce coarse pointer, maxTouchPoints (iPads, tablets Android), ontouchstart,
 * userAgent de móviles/tablets y el parámetro ?touch para pruebas.
 */
export function isTouchDevice(): boolean {
    if (dynamicTouchDetected) return true;
    if (typeof window === 'undefined') return false;

    // Permitir forzar modo táctil en desarrollo/testing con ?touch o #touch
    if (window.location.search.includes('touch') || window.location.hash.includes('touch')) {
        return true;
    }

    // Heurística 1: pointer coarse (CSS Media Queries nivel 4)
    if (window.matchMedia?.('(pointer: coarse)').matches) return true;

    // Heurística 2: maxTouchPoints > 0 (iPads modernas con iPadOS, tablets Android, smartphones)
    if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) return true;

    // Heurística 3: ontouchstart disponible en window
    if ('ontouchstart' in window) return true;

    // Heurística 4: userAgent con palabras clave de móviles o tablets
    const ua = navigator.userAgent || '';
    const mobileTabletRegex = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini|Mobile|Tablet|Silk|Kindle/i;
    if (mobileTabletRegex.test(ua)) return true;

    return false;
}

/** ¿La pantalla es pequeña o compacta? */
function isSmallScreen(): boolean {
    return Math.min(window.innerWidth, window.innerHeight) <= 900;
}

// ─── Estado interno ───

let gameCallbacks: TouchControlCallbacks | null = null;
let navCallbacks: NavigationCallbacks | null = null;
let isLocked = false;

let orientationInitialized = false;
let inGameTouchInitialized = false;
let pauseInitialized = false;
let navInitialized = false;

// Estado de entrada táctil para paletas P1 y P2
const touchState = {
    p1: { up: false, down: false },
    p2: { up: false, down: false },
};

function el(id: string): HTMLElement | null {
    return document.getElementById(id);
}

// ─── 1. Bloqueo de orientación (GLOBAL) ───

function shouldLockOrientation(): boolean {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (!isPortrait) return false;
    return isTouchDevice() || isSmallScreen();
}

function applyOrientationLock(): void {
    const lockEl = el('orientation-lock');
    const shouldLock = shouldLockOrientation();

    if (shouldLock) {
        if (lockEl) lockEl.classList.remove('hidden');

        if (!isLocked) {
            isLocked = true;
            gameCallbacks?.onPause();
        }
    } else {
        if (lockEl) lockEl.classList.add('hidden');

        if (isLocked) {
            isLocked = false;
            gameCallbacks?.onResume();
        }
    }
}

/**
 * Inicializa el bloqueo de orientación vertical.
 */
export function initOrientationLock(cb?: TouchControlCallbacks): void {
    if (cb) {
        gameCallbacks = cb;
        if (isLocked) cb.onPause();
    }

    if (orientationInitialized) return;
    orientationInitialized = true;

    window.addEventListener('resize', applyOrientationLock);
    window.addEventListener('orientationchange', applyOrientationLock);

    const orientationQuery = window.matchMedia?.('(orientation: portrait)');
    orientationQuery?.addEventListener?.('change', applyOrientationLock);

    applyOrientationLock();
}

export function clearOrientationCallbacks(): void {
    gameCallbacks = null;
}

export function isOrientationLocked(): boolean {
    return isLocked;
}

// ─── 2. Controles de Juego (In-Game: P1 izquierda, P2 derecha) ───

function setupPlayerTouchZone(
    _zone: HTMLElement | null,
    player: 1 | 2,
    upBtnId: string,
    downBtnId: string
): void {
    const upBtn = el(upBtnId);
    const downBtn = el(downBtnId);
    if (!upBtn || !downBtn) return;

    const updateVisuals = (up: boolean, down: boolean) => {
        if (up) upBtn.classList.add('is-active');
        else upBtn.classList.remove('is-active');

        if (down) downBtn.classList.add('is-active');
        else downBtn.classList.remove('is-active');
    };

    const applyState = (up: boolean, down: boolean) => {
        if (player === 1) {
            touchState.p1.up = up;
            touchState.p1.down = down;
        } else {
            touchState.p2.up = up;
            touchState.p2.down = down;
        }
        updateVisuals(up, down);
        gameCallbacks?.onTouchInput(player, up, down);
    };

    // Control táctil EXCLUSIVO en los botones (sin tocar canvas ni zonas vacías)
    const bindButton = (btn: HTMLElement, isUp: boolean) => {
        const start = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            applyState(isUp, !isUp);
        };

        const stop = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            applyState(false, false);
        };

        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', stop, { passive: false });
        btn.addEventListener('touchcancel', stop, { passive: false });

        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', stop);
        btn.addEventListener('mouseleave', stop);
    };

    bindButton(upBtn, true);
    bindButton(downBtn, false);
}

export function initTouchControls(cb: TouchControlCallbacks): void {
    gameCallbacks = cb;

    if (inGameTouchInitialized) return;
    inGameTouchInitialized = true;

    if (!isTouchDevice()) return;

    setupPlayerTouchZone(el('touch-zone-left'), 1, 'game-btn-p1-up', 'game-btn-p1-down');
    setupPlayerTouchZone(el('touch-zone-right'), 2, 'game-btn-p2-up', 'game-btn-p2-down');
}

// ─── 3. Botón de pausa flotante (móvil) ───

export function initPauseButton(cb: TouchControlCallbacks): void {
    gameCallbacks = cb;

    if (pauseInitialized) return;
    pauseInitialized = true;

    const pauseBtn = el('pause-btn-mobile');
    if (!isTouchDevice() || !pauseBtn) return;

    pauseBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        cb.onPause();
    });

    pauseBtn.addEventListener(
        'touchstart',
        (e: TouchEvent) => {
            e.preventDefault();
            cb.onPause();
        },
        { passive: false }
    );
}

// ─── 4. Sección de Navegación Táctil (Menús, Pausa, GameOver) ───

function bindNavButton(
    buttonId: string,
    onTrigger: () => void
): void {
    const btn = el(buttonId);
    if (!btn) return;

    const trigger = (e: Event) => {
        e.preventDefault();
        btn.classList.add('is-active');
        onTrigger();
        window.setTimeout(() => {
            btn.classList.remove('is-active');
        }, 120);
    };

    btn.addEventListener('touchstart', trigger, { passive: false });
    btn.addEventListener('click', trigger);
}

export function initNavigationControls(): void {
    if (navInitialized) return;
    navInitialized = true;

    bindNavButton('nav-btn-up', () => navCallbacks?.onNavigate('up'));
    bindNavButton('nav-btn-down', () => navCallbacks?.onNavigate('down'));
    bindNavButton('nav-btn-left', () => navCallbacks?.onNavigate('left'));
    bindNavButton('nav-btn-right', () => navCallbacks?.onNavigate('right'));
    bindNavButton('nav-btn-ok', () => navCallbacks?.onSelect());
    bindNavButton('nav-btn-back', () => navCallbacks?.onBack());
}

export function setNavigationCallbacks(cb: NavigationCallbacks | null): void {
    navCallbacks = cb;
}

export function showNavigationControls(cb?: NavigationCallbacks): void {
    if (cb) {
        navCallbacks = cb;
    }

    initNavigationControls();

    if (!isTouchDevice()) return;

    const navOverlay = el('touch-nav-overlay');
    if (navOverlay) {
        navOverlay.classList.remove('hidden');
        navOverlay.classList.add('is-visible');
    }
}

export function hideNavigationControls(): void {
    const navOverlay = el('touch-nav-overlay');
    if (navOverlay) {
        navOverlay.classList.remove('is-visible');
    }
}

// ─── 5. Control de visibilidad de zonas en-game ───

export function showTouchControls(): void {
    if (!isTouchDevice()) return;

    el('touch-zone-left')?.classList.add('is-visible');
    el('touch-zone-right')?.classList.add('is-visible');
    el('pause-btn-mobile')?.classList.add('is-visible');
}

export function hideTouchControls(): void {
    el('touch-zone-left')?.classList.remove('is-visible');
    el('touch-zone-right')?.classList.remove('is-visible');
    el('pause-btn-mobile')?.classList.remove('is-visible');

    // Quitar clases activas de los botones
    el('game-btn-p1-up')?.classList.remove('is-active');
    el('game-btn-p1-down')?.classList.remove('is-active');
    el('game-btn-p2-up')?.classList.remove('is-active');
    el('game-btn-p2-down')?.classList.remove('is-active');

    // Resetear inputs táctiles
    touchState.p1.up = false;
    touchState.p1.down = false;
    touchState.p2.up = false;
    touchState.p2.down = false;

    gameCallbacks?.onTouchInput(1, false, false);
    gameCallbacks?.onTouchInput(2, false, false);
}

export function getTouchState() {
    return { ...touchState };
}
