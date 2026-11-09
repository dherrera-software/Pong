# DEV LOG — Pong Neon Arcade Remodel

## Fecha de inicio: 2026-11-06

## Objetivo
Rediseño de UX para móviles del juego Pong sin tocar la lógica de física, colisiones ni game loop.

## Estado actual
- **TypeScript:** ✅ Compila sin errores (`npx tsc --noEmit`)
- **Build de producción:** ✅ Exitoso (`npx vite build --config vite/config.prod.mjs`)
- **Playwright:** ⚠️ No se pudo ejecutar automáticamente (limitación de PowerShell para mantener servidor web en segundo plano)

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
