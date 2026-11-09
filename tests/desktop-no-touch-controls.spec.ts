import { test, expect } from '@playwright/test';

test.describe('PC ESCRITORIO — Cero botones sobrepuestos', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    hasTouch: false,
    isMobile: false
  });

  test('PC: en el menú principal no debe haber botones táctiles sobrepuestos', async ({ page }) => {
    await page.goto('http://127.0.0.1:8081');

    const canvas = page.locator('#game-container canvas');
    await canvas.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000);

    // En PC, body tiene la clase is-desktop-device
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain('is-desktop-device');

    // El canvas debe estar centrado exactamente sin descuadre
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    const viewport = page.viewportSize()!;
    const leftMargin = bounds!.x;
    const rightMargin = viewport.width - (bounds!.x + bounds!.width);
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(2);
    const topMargin = bounds!.y;
    const bottomMargin = viewport.height - (bounds!.y + bounds!.height);
    expect(Math.abs(topMargin - bottomMargin)).toBeLessThanOrEqual(2);

    // Ningún control táctil debe ser visible en PC
    await expect(page.locator('#touch-nav-overlay')).not.toBeVisible();
    await expect(page.locator('#touch-zone-left')).not.toBeVisible();
    await expect(page.locator('#touch-zone-right')).not.toBeVisible();
    await expect(page.locator('#pause-btn-mobile')).not.toBeVisible();
    await expect(page.locator('#orientation-lock')).not.toBeVisible();

    // Navegación en PC funciona con teclado: presionar DOWN y luego ENTER para 2 Players o submenú
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);

    // Confirmar dificultad con ENTER
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);

    // In-Game en PC: NINGÚN control táctil sobrepuesto debe aparecer
    await expect(page.locator('#touch-nav-overlay')).not.toBeVisible();
    await expect(page.locator('#touch-zone-left')).not.toBeVisible();
    await expect(page.locator('#touch-zone-right')).not.toBeVisible();
    await expect(page.locator('#pause-btn-mobile')).not.toBeVisible();

    // Pausar con tecla 'P' en PC: menú de pausa visible en canvas, cero overlay táctil
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(500);

    await expect(page.locator('#touch-nav-overlay')).not.toBeVisible();
    await expect(page.locator('#touch-zone-left')).not.toBeVisible();

    // Reanudar con tecla 'ESC' o 'P'
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(page.locator('#touch-nav-overlay')).not.toBeVisible();
    await expect(page.locator('#touch-zone-left')).not.toBeVisible();

    await page.screenshot({ path: 'test-screenshots/pc-desktop-clean.png', fullPage: true });
    console.log('OK: PC escritorio completamente limpio, sin botones táctiles sobrepuestos');
  });
});

