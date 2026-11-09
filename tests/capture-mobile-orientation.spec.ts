import { test, expect, devices } from '@playwright/test';

test.use({ screenshot: 'only-on-failure' });

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

test.describe('MÓVIL VERTICAL — bloqueo de orientación', () => {
  test.use({
    userAgent: IPHONE_UA,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 }
  });

  test('390x844: overlay "Gira tu dispositivo" visible e infranqueable', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(1500);

    const lock = page.locator('#orientation-lock');
    await expect(lock).toBeVisible();
    await expect(page.locator('#orientation-title')).toContainText('Gira tu dispositivo');

    const topEl = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return el ? (el.closest('#orientation-lock') ? 'overlay' : el.tagName + '#' + el.id) : 'null';
    });
    expect(topEl).toBe('overlay');

    await page.screenshot({ path: 'test-screenshots/mobile-portrait-lock.png', fullPage: true });
    console.log('OK: overlay vertical visible e infranqueable en móvil portrait');
  });
});

test.describe('MÓVIL HORIZONTAL — controles de navegación e In-Game', () => {
  test.use({
    userAgent: IPHONE_UA,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 844, height: 390 }
  });

  test('844x390: sección de navegación en menú con todas las flechas transparentes', async ({ page }) => {
    await page.goto('http://localhost:8081');

    const canvas = page.locator('#game-container canvas');
    await canvas.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 1. Esperar a que termine la carga de assets e inicie el menú principal
    const navOverlay = page.locator('#touch-nav-overlay');
    await expect(navOverlay).toBeVisible({ timeout: 25000 });

    // D-Pad con todas las flechas (arriba, abajo, izquierda, derecha)
    const btnUp = page.locator('#nav-btn-up');
    const btnDown = page.locator('#nav-btn-down');
    const btnLeft = page.locator('#nav-btn-left');
    const btnRight = page.locator('#nav-btn-right');
    const btnOk = page.locator('#nav-btn-ok');
    const btnBack = page.locator('#nav-btn-back');

    await expect(btnUp).toBeVisible();
    await expect(btnDown).toBeVisible();
    await expect(btnLeft).toBeVisible();
    await expect(btnRight).toBeVisible();
    await expect(btnOk).toBeVisible();
    await expect(btnBack).toBeVisible();

    // Verificar que los SVGs de las flechas son transparentes por dentro (fill="none") y con stroke
    const navPolygons = navOverlay.locator('polygon');
    const navPolyCount = await navPolygons.count();
    expect(navPolyCount).toBeGreaterThanOrEqual(4); // 4 flechas de dirección + 1 del botón OK = 5
    for (let i = 0; i < navPolyCount; i++) {
      expect(await navPolygons.nth(i).getAttribute('fill')).toBe('none');
      expect(await navPolygons.nth(i).getAttribute('stroke')).toBe('currentColor');
    }

    // Verificar que los botones de acción NO tienen texto (solo iconos SVG) y son del MISMO TAMAÑO
    await expect(btnBack.locator('svg')).toBeVisible();
    await expect(btnOk.locator('svg')).toBeVisible();
    expect(await btnBack.locator('.touch-nav-btn__label').count()).toBe(0);
    expect(await btnOk.locator('.touch-nav-btn__label').count()).toBe(0);

    const okBox = await btnOk.boundingBox();
    const backBox = await btnBack.boundingBox();
    expect(okBox).not.toBeNull();
    expect(backBox).not.toBeNull();
    expect(okBox!.width).toBe(backBox!.width);
    expect(okBox!.height).toBe(backBox!.height);

    // En el menú, las zonas de juego están ocultas
    await expect(page.locator('#touch-zone-left')).not.toBeVisible();
    await expect(page.locator('#touch-zone-right')).not.toBeVisible();

    await page.screenshot({ path: 'test-screenshots/mobile-menu-navigation.png', fullPage: true });
    console.log('OK: sección de navegación con flechas transparentes en menú principal');

    // 2. Probar interacción táctil con el D-Pad: bajar en el menú
    await btnDown.click();
    await page.waitForTimeout(400);

    // 3. Iniciar juego pulsando OK o tocando el canvas
    await btnUp.click();
    await page.waitForTimeout(400);
    await btnOk.click();
    await page.waitForTimeout(800);
    // En submenú de dificultad, confirmar dificultad seleccionada
    await btnOk.click();
    await page.waitForTimeout(2500);

    // 4. In-Game: la sección de navegación se oculta y aparecen los pares de flechas para cada jugador
    const touchLeft = page.locator('#touch-zone-left');
    const touchRight = page.locator('#touch-zone-right');
    const pauseBtn = page.locator('#pause-btn-mobile');

    await expect(touchLeft).toBeVisible();
    await expect(touchRight).toBeVisible();
    await expect(pauseBtn).toBeVisible();
    await expect(navOverlay).not.toBeVisible();

    // Verificar par de flechas a cada lado (2 botones por lado, 4 en total)
    const p1Up = page.locator('#game-btn-p1-up');
    const p1Down = page.locator('#game-btn-p1-down');
    const p2Up = page.locator('#game-btn-p2-up');
    const p2Down = page.locator('#game-btn-p2-down');

    await expect(p1Up).toBeVisible();
    await expect(p1Down).toBeVisible();
    await expect(p2Up).toBeVisible();
    await expect(p2Down).toBeVisible();

    // Verificar que las flechas in-game son transparentes y visibles (estilo retro)
    const inGamePolygons = page.locator('.touch-zone svg polygon');
    const inGamePolyCount = await inGamePolygons.count();
    expect(inGamePolyCount).toBe(4); // 2 por P1 + 2 por P2
    for (let i = 0; i < inGamePolyCount; i++) {
      expect(await inGamePolygons.nth(i).getAttribute('fill')).toBe('none');
      expect(await inGamePolygons.nth(i).getAttribute('stroke')).toBe('currentColor');
    }

    // Verificar que los botones in-game ocupan casi toda la zona negra de ancho y tienen espaciado entre sí
    const p1UpBox = await p1Up.boundingBox();
    const p1DownBox = await p1Down.boundingBox();
    expect(p1UpBox).not.toBeNull();
    expect(p1DownBox).not.toBeNull();
    expect(p1UpBox!.width).toBeGreaterThanOrEqual(100); // Casi toda la zona negra de ancho
    expect(p1DownBox!.y - (p1UpBox!.y + p1UpBox!.height)).toBeGreaterThanOrEqual(24); // Espaciado amplio entre flechas

    // Captura in-game con flechas transparentes y botón de pausa
    await page.screenshot({ path: 'test-screenshots/mobile-ingame-controls.png', fullPage: true });
    console.log('OK: pares de flechas transparentes in-game para P1 y P2');

    // 5. Pulsar pausa y verificar que el overlay de navegación vuelve a mostrarse para navegar la pausa
    await pauseBtn.click();
    await page.waitForTimeout(500);

    await expect(navOverlay).toBeVisible();
    await expect(touchLeft).not.toBeVisible();

    await page.screenshot({ path: 'test-screenshots/mobile-pause-navigation.png', fullPage: true });
    console.log('OK: pausa activa navegación y oculta controles de paleta');

    // 6. Volver al juego con ESC (botón Back)
    await btnBack.click();
    await page.waitForTimeout(500);
    await expect(touchLeft).toBeVisible();
    await expect(touchRight).toBeVisible();
    await expect(navOverlay).not.toBeVisible();

    // 7. Pausar nuevamente y reanudar seleccionando "CONTINUE" con el botón OK
    await pauseBtn.click();
    await page.waitForTimeout(500);
    await expect(navOverlay).toBeVisible();
    await expect(touchLeft).not.toBeVisible();

    // En el menú de pausa la primera opción seleccionada es CONTINUE. Pulsar OK.
    await btnOk.click();
    await page.waitForTimeout(500);

    // ¡CRÍTICO! Al dar a CONTINUE, las flechas in-game DEBEN reaparecer y la navegación ocultarse
    await expect(touchLeft).toBeVisible();
    await expect(touchRight).toBeVisible();
    await expect(p1Up).toBeVisible();
    await expect(p1Down).toBeVisible();
    await expect(p2Up).toBeVisible();
    await expect(p2Down).toBeVisible();
    await expect(navOverlay).not.toBeVisible();

    await page.screenshot({ path: 'test-screenshots/mobile-resume-continue-ok.png', fullPage: true });
    console.log('OK: las flechas in-game reaparecen correctamente al pulsar CONTINUE en el menú de pausa');

    // 8. Probar rotación dinámica: de horizontal a vertical y vuelta a horizontal
    await page.evaluate(() => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    });
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const lockOverlay = page.locator('#orientation-lock');
    await expect(lockOverlay).toBeVisible();

    // Volver a horizontal (844x390): debe quitar el overlay, resetear scroll y mantener el juego centrado
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    await expect(lockOverlay).not.toBeVisible();

    const scrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop || 0);
    expect(scrollY).toBe(0);

    await page.screenshot({ path: 'test-screenshots/mobile-rotated-to-landscape.png', fullPage: true });
    console.log('OK: rotación a horizontal sin descuadre hacia abajo y pantalla restablecida');
  });
});

test.describe('TABLET HORIZONTAL (iPad 1024x768) — controles adaptados y sin scroll', () => {
  test.use({
    userAgent: IPAD_UA,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 1024, height: 768 }
  });

  test('1024x768: controles adaptados para tablet en horizontal sin scrollbars', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(2000);

    // Verificar que no hay scroll horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);

    // Sección de navegación visible en tablet (esperar a que MainMenu cargue)
    const navOverlay = page.locator('#touch-nav-overlay');
    await expect(navOverlay).toBeVisible({ timeout: 25000 });

    await page.screenshot({ path: 'test-screenshots/tablet-landscape-menu.png', fullPage: true });
    console.log('OK: tablet horizontal muestra navegación perfectamente proporcionada sin scroll');
  });
});
