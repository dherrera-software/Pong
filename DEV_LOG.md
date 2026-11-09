# DEV LOG — Pong Neon Arcade Remodel

## Fecha de inicio: 2026-11-06

## Objetivo
Rediseño de UX para móviles del juego Pong sin tocar la lógica de física, colisiones ni game loop.

## Estado actual
- **TypeScript:** ✅ Compila sin errores (`npx tsc --noEmit`)
- **Build de producción:** ✅ Exitoso (`pnpm build-nolog`)
- **Playwright:** ✅ 4 tests pasando al 100% (PC escritorio sin botones táctiles, móvil vertical, móvil horizontal con navegación + in-game + pausa + rotación dinámica, tablet horizontal)

## Corrección de Bugs Recientes (UX Móvil / Tablets)

### 1. Fix: Flechas in-game desaparecían al pulsar CONTINUE en el menú de pausa
- **Problema reportado:** Al pulsar pausa durante la partida, los controles cambiaban a la sección de navegación (D-Pad + acciones). Sin embargo, al confirmar la opción "CONTINUE", las flechas in-game no volvían a aparecer y el juego quedaba injugable.
- **Causa raíz:** En `src/game/scenes/Game.ts`, `onContinue` llamaba a `this.hidePauseMenu()`, el cual únicamente ejecutaba `this.isPaused = false`, `pauseMenu.hide()` y `physics.world.resume()`, sin invocar `hideNavigationControls()` ni `showTouchControls()`.
- **Solución:**
  - `onContinue` ahora invoca explícitamente `this.resumeGame()`.
  - En `this.resumeGame()`, se llama a `hideNavigationControls()` y `showTouchControls()`, garantizando la reaparición instantánea de las flechas táctiles de juego.
  - `hidePauseMenu()` también se blindó llamando a `hideNavigationControls()` y `showTouchControls()`.
  - `togglePause()` ahora canaliza siempre a través de `pauseGame()` y `resumeGame()`.

### 2. Fix: Pantalla completa y prevención de descuadre hacia abajo al girar de vertical a horizontal
- **Problema reportado:** Al rotar el dispositivo de vertical a horizontal, el contenido de la página se descuadraba hacia abajo debido a la barra de direcciones del navegador móvil y la falta de pantalla completa automática.
- **Causa raíz:**
  - `public/style.css` tenía reglas en la media query horizontal que sobreescribían `#app` con `justify-content: flex-start; align-items: flex-start;` y `#game-container` con `100vh` rígido (que en móviles incluye la barra del navegador).
  - La transición de vertical a horizontal no solicitaba pantalla completa ni reseteaba el scroll del viewport (`window.scrollTo(0, 0)`).
- **Solución:**
  - En `src/game/ui/touch-controls.ts`, se implementó `triggerFullscreen()` con soporte seguro para `requestFullscreen`, `webkitRequestFullscreen`, reseteo de `window.scrollTo(0, 0)` y enlace al siguiente toque del usuario (`armFullscreenOnNextTouch()`) si el navegador requiere activación explícita.
  - En `applyOrientationLock()`, al pasar de `isLocked = true` a `isLocked = false`, se invoca inmediatamente `triggerFullscreen()`, se resetea el scroll a 0 y se despachan eventos de `resize` retardados para sincronizar el Scale Manager de Phaser.
  - En `public/style.css`, se aseguró que `html, body, #app` estén siempre anclados con `position: fixed; inset: 0; width: 100%; height: 100%; height: 100dvh; overflow: hidden; overscroll-behavior: none; touch-action: none;` y centrado flex absoluto (`justify-content: center; align-items: center;`).
  - En `index.html`, se actualizó el meta viewport a `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.

### 3. Fix: Exclusión estricta de controles táctiles en PC (escritorio / laptop)
- **Problema reportado:** En la versión de PC con teclado y ratón aparecían los botones táctiles sobrepuestos (D-Pad, botones de acción y flechas in-game), cuando estos solo deben existir en móviles y tablets.
- **Causa raíz:** PCs con Windows y laptops/monitores con pantalla táctil reportan `navigator.maxTouchPoints > 0` y `'ontouchstart' in window`, lo que provocaba que la heurística anterior los clasificara erróneamente como dispositivos móviles táctiles.
- **Solución:**
  1. En `src/game/ui/touch-controls.ts`, `isTouchDevice()` ahora descarta explícitamente PCs de escritorio / laptops con ratón/trackpad (`pointer: fine` + `hover: hover`), reconociendo únicamente dispositivos móviles y tablets nativos (Android, iOS, iPadOS) o emulación explícita.
  2. Se agregó `syncDeviceBodyClass()` que aplica la clase `is-desktop-device` en PC y `is-mobile-device` en móviles/tablets.
  3. En `public/style.css`, se blindó con doble capa de protección: `body.is-desktop-device` y `@media (hover: hover) and (pointer: fine) and (not (pointer: coarse))` aplican `display: none !important; visibility: hidden !important; pointer-events: none !important;` sobre todos los overlays táctiles.
  4. En `MainMenu.ts`, `GameOver.ts` y `pause-menu.ts`, se habilitó la interacción con puntero/ratón (`setInteractive`) exclusivamente para dispositivos PC (`!isTouchDevice()`), permitiendo usar tanto teclado como ratón sin interferencias táctiles.
  5. Se añadió la suite automatizada `tests/desktop-no-touch-controls.spec.ts` validando la ausencia total de botones táctiles en PC.

### 4. Fix: Centrado simétrico exacto del Canvas y Pantalla Completa móvil garantizada
- **Problema reportado:** El juego se veía descuadrado (desplazado hacia abajo, recortando el borde inferior y textos como "PRESS ENTER TO START"). Además, en móviles la barra de URL del navegador tapaba el contenido y no entraba en pantalla completa.
- **Causa raíz:**
  1. `#app` y `#game-container` tenían `display: flex; justify-content: center; align-items: center;`. Al mismo tiempo, Phaser (`Scale.CENTER_BOTH`) calculaba márgenes en línea (`margin-top` y `margin-left`). En CSS, el contenedor flex ya centraba el canvas, y Phaser le añadía margen encima, desplazando el canvas un 50% extra hacia abajo y a la derecha ("descuadre").
  2. Los navegadores móviles bloquean `requestFullscreen()` fuera de eventos con gesto de usuario directo. Además, en PC no debe forzarse pantalla completa automáticamente.
- **Solución:**
  1. En `public/style.css`, se añadió `#game-container canvas { margin: 0 !important; }`. Con esto, Flexbox centra el canvas con precisión matemática absoluta en ambos ejes (márgenes simétricos comprobados: top 100 / bottom 100 en 800x800, left 160 / right 160 en 1280x720, left 162 / right 162 en 844x390).
  2. En `src/game/ui/touch-controls.ts`, `triggerFullscreen()` se restringió estrictamente a `isTouchDevice()` (NUNCA se activa en PC).
  3. Se añadió `ensureMobileFullscreen()`, que se ejecuta al primer toque táctil de cualquier botón móvil (D-pad, flechas in-game, pausa, canvas), aprovechando el evento táctil de usuario confiable para que el navegador móvil active pantalla completa sin bloqueo.
  4. Se añadió el botón flotante `#fullscreen-btn-mobile` retro en la esquina superior izquierda (solo visible en móviles y tablets) para alternar pantalla completa manualmente en cualquier momento.
  5. Se agregaron meta tags PWA para pantalla completa (`apple-mobile-web-app-capable`, `mobile-web-app-capable`).

## Cambios implementados

### 1. src/game/ui/touch-controls.ts (NUEVO)
Lógica completa de UX móvil:
- Detección robusta de dispositivo táctil (`isTouchDevice()`): pointer: coarse, maxTouchPoints, ontouchstart, userAgent
- Overlay de bloqueo en vertical (portrait + táctil): pausa el juego, se reanuda al girar a horizontal
- Zonas táctiles en pantalla (mitad izquierda P1, mitad derecha P2)
- Botón de pausa flotante en esquina superior derecha
- Manejo de touchstart/touchend/touchcancel con preventDefault() y { passive: false }

### 2. src/game/ui/player-controls.ts (MODIFICADO)
- Agregado tipo `TouchInput` y función `combineInputs()` para combinar teclado + táctil
- Lógica original sin cambios

### 3. src/game/scenes/Game.ts (MODIFICADO)
- Métodos públicos: `pauseGame()`, `resumeGame()`, `setTouchInput(player, up, down)`
- Campo privado `touchInput` para estado de entrada táctil por jugador
- `update()` combina teclado + táctil vía `combineInputs()` antes de mover paletas
- Integración de touch-controls en `create()`
- Mostrar/ocultar controles táctiles en pausa, Game Over, reinicio y menú

### 4. index.html (MODIFICADO)
- Overlay de orientación vertical (SVG teléfono girando, texto "Gira tu dispositivo")
- Zona táctil izquierda (flechas SVG cian #00f2ff)
- Zona táctil derecha (flechas SVG magenta #ff00ff)
- Botón de pausa flotante (SVG dos barras verticales, 56×56px)

### 5. public/style.css (MODIFICADO)
- Estilos overlay bloqueo vertical (z-index 3000)
- Estilos zonas táctiles (z-index 200, touch-action: none, opacidad 0.35→0.6)
- Estilos botón pausa flotante (56×56px, border-radius 50%, glow neón)
- Canvas ocupa 100% en móvil horizontal (max-width/max-height 100%, object-fit: contain)
- canvas tiene touch-action: none

## Reglas respetadas
- CERO cambios a lógica de física (court.ts), colisiones, partículas, Tezuka Zone o game loop
- Los controles táctiles solo se activan en dispositivos con `isTouchDevice() == true`
- Escritorio permanece exactamente igual (sin zonas táctiles, sin overlay vertical)
- Botón de pausa ≥ 44×44px (56×56px implementado)

## Cómo probar manualmente
1. `pnpm dev` o `npx vite --config vite/config.dev.mjs` (puerto 8080)
2. Abrir http://localhost:8080 en navegador desktop → verificar que no hay zonas táctiles
3. Abrir en Chrome DevTools con emulación móvil (iPhone 12, 390×844, pointer: coarse)
4. Modo vertical: verificar overlay "Gira tu dispositivo" y juego pausado
5. Modo horizontal (844×390): verificar overlay oculto, zonas táctiles visibles, botón pausa arriba derecha
6. Tocar flecha superior izquierda → paleta P1 sube; tocar flecha inferior derecha → paleta P2 baja
7. Verificar que no hay scroll horizontal (body.scrollWidth <= viewport.width)

## Archivos modificados/creados
- src/game/ui/touch-controls.ts (NUEVO)
- src/game/ui/player-controls.ts (MODIFICADO)
- src/game/scenes/Game.ts (MODIFICADO)
- index.html (MODIFICADO)
- public/style.css (MODIFICADO)
- tests/e2e-touch.spec.ts (NUEVO - pruebas Playwright)
- DEV_LOG.md (NUEVO - este archivo)

## Resolución conflicto teclado vs móvil (2026-11-07)

### Problemas detectados en capturas móviles

1. **KEYBOARD REQUIRED bloqueaba el juego en móvil**: `src/main.ts` mostraba `#mobile-warning` cuando `isMobileDevice()` era true y esperaba clic en "CONTINUE ANYWAY" antes de iniciar Phaser. Ahora se salta la validación en táctil: `#mobile-warning` se oculta y el juego arranca directamente (los controles propios ya existen).
2. **Canvas con letterboxing en horizontal**: `#game-container` y `#app` usaban flex centrado, dejando márgenes. Ahora en landscape (`max-width: 844px`) `#app` usa `justify-content: flex-start` y `#game-container` + canvas ocupan `100vw`/`100vh` sin márgenes.
3. **Overlays DOM tapados por canvas**: z-indexes bajos (touch-zone 200, pause-btn 200, orientation-lock 3000). Ahora touch-zone y pause-btn = 9998, orientation-lock = 9999. También se quitó la clase `hidden` de `index.html` en `#touch-zone-left`, `#touch-zone-right` y `#pause-btn-mobile` para que el `style.display` inyectado por `touch-controls.ts` funcione sin que `hidden` (`display: none !important`) lo sobreescriba.

### Cambios de hoy
- src/main.ts: salto del aviso KEYBOARD REQUIRED en dispositivos táctiles
- index.html: quitada clase `hidden` de zonas táctiles y botón pausa
- public/style.css: media query landscape a 100vw/100vh; z-index elevados (9998/9999); app align flex-start

### Verificación
- `pnpm build` → ✅ exitoso
- Captura móvil landscape 844×390 generada en `test-screenshots/mobile-landscape-running.png`: juego corriendo, "1 PLAYER" iniciado, paletas visibles, flechas cian/magenta superpuestas, sin KEYBOARD REQUIRED ni overlay de orientación, sin scroll horizontal

## Rediseño Retro Arcade para Móviles y Tablets (2026-11-09)

### Cambios realizados:
1. **Sección de navegación táctil completa (`#touch-nav-overlay`)**:
   - D-Pad direccional en la esquina inferior izquierda con 4 flechas de triángulo SVG transparentes con reborde (arriba, abajo, izquierda, derecha).
   - Botones de acción en la esquina inferior derecha sin palabras/texto: icono `✕` para volver/cancelar e icono `▶` para confirmar/seleccionar.
   - Conectado a `MainMenu`, `GameOver` y `PauseMenu` para una navegación completa sin teclado en móviles y tablets.
2. **Pares de flechas in-game para cada jugador**:
   - Jugador 1 (lado izquierdo): par de flechas de triángulo transparentes con reborde (arriba y abajo).
   - Jugador 2 (lado derecho): par de flechas de triángulo transparentes con reborde (arriba y abajo).
   - Botón de pausa en esquina superior derecha con icono retro de dos barras verticales.
3. **Estética Retro Arcade**:
   - Eliminado el efecto neón futurista/glow borroso en los controles.
   - Paleta de alto contraste en gris/blanco sobre fondo oscuro translúcido (`rgba(30, 30, 36, 0.75)` y bordes sólidos de 3px), dándoles excelente visibilidad tanto en menús como durante la partida rápida.
   - Cero palabras escritas en los botones de acción (sustituidas por símbolos gráficos puros).
4. **Soporte Tablet y Móvil**:
   - Media queries adaptadas tanto para pantallas compactas de móvil como para tablets tipo iPad (1024×768 / iPad Pro).
   - Sin scrollbars horizontales ni pérdida de proporción de aspecto.
5. **Verificación automatizada con Playwright**:
   - Bloqueo vertical 390×844: ✅ overlay "Gira tu dispositivo".
   - Navegación e In-Game 844×390: ✅ D-Pad en menú, pares de flechas in-game con triángulos transparentes y pausa funcional.
   - Tablet 1024×768: ✅ escala óptima sin scrollbars.

## Ajustes de Espaciado, Tamaño de Botones y Centrado de Pausa (2026-11-09)

### Cambios aplicados:
1. **Ancho de flechas adaptado a la zona negra lateral (`--black-zone-w`)**:
   - Las flechas in-game (`.touch-arrow-btn`) ahora usan `width: calc(100% - 16px)` dentro de `.touch-zone--left` y `.touch-zone--right`, ocupando casi todo el ancho de las franjas negras laterales (pillarbox) sin invadir el campo de juego.
   - La altura permanece compacta (`76px`) para que el cambio sea exclusivamente de ancho.
2. **Espaciado amplio entre flechas in-game**:
   - `gap: 48px` entre la flecha superior e inferior de cada lado para evitar toques accidentales y mejorar la ergonomía.
3. **Botones de acción idénticos en tamaño**:
   - Los botones de jugar (`▶`) y cerrar (`✕`) ahora tienen exactamente el mismo tamaño (`58×58px` en móvil, `64×64px` en tablet, `50×50px` en compactos).
4. **Manejo exclusivo por botones (sin táctil en el canvas/zonas vacías)**:
   - Eliminados los listeners táctiles de la zona completa en `touch-controls.ts`; ahora solo los elementos de botón capturan eventos (`pointer-events: none` en la zona, `pointer-events: auto` en los botones).
   - Eliminadas las llamadas `setInteractive()` del canvas en `MainMenu.ts`, `GameOver.ts` y `pause-menu.ts`. El control en pantalla se realiza 100% a través de los botones físicos virtuales y el teclado.
5. **Menú de pausa perfectamente centrado**:
   - `src/game/ui/pause-menu.ts`: panel reubicado exactamente en `(400, 300)` con dimensiones `480×360`. Título, botones (`Y=248, 314, 380`) y texto de ayuda (`Y=445`) centrados simétricamente en el eje vertical y horizontal.

### Verificación:
- TypeScript: ✅ `npx tsc --noEmit` compilación limpia sin errores.
- Build de producción: ✅ `pnpm build-nolog` exitoso.
- Playwright tests: ✅ 3/3 pasados en móvil portrait, móvil landscape y tablet landscape.
