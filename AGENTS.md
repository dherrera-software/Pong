# Contexto del Proyecto: Juego de Pong

## 🛠️ Stack Tecnológico
- **Core:** HTML5 Canvas / WebGL (o el motor que estés usando).
- **Lógica:** JavaScript / TypeScript.
- **Estilos:** CSS Modular / Design Tokens.
- **Entorno:** Node.js con pnpm (si aplica).

## 🧠 Reglas de Comportamiento del Agente (CRÍTICO)
1. **Cero invenciones:** Si te falta un dato o no estás seguro de cómo funciona la física o el renderizado actual, **pregunta en vez de inventar**. No rompas el Game Loop.
2. **Memoria a tu cargo:** Apunta todo lo que te convenga recordar en un archivo `DEV_LOG.md` (ej. cambios de física, refactorizaciones de UI, bugs pendientes).
3. **Código Limpio:** Mantén la lógica del juego (física, colisiones, puntaje) separada de la interfaz de usuario (menús, HUD, pantallas de victoria).
4. **Cero Estilos Inline:** Usa clases de CSS y variables para la UI.

## 🎨 Dirección de Arte (Arcade Premium)
- **Estilo:** "Neon Arcade" o "Retro-Futurista". Queremos que se sienta como un juego indie moderno de Steam, no como una página web aburrida.
- **Tema:** Dark mode obligatorio (fondo casi negro para que el canvas resalte).
- **Acento:** Neón (puede ser cian, magenta o lima eléctrica) con efecto *glow* (sombras difuminadas).
- **Tipografía:** Fuentes tipo monoespaciadas o display (ej. *Orbitron*, *Press Start 2P* o *Inter* con tracking agresivo).
- **UI:** Minimalista. El HUD (puntaje, tiempo) debe ser legible pero no invasivo. Las pantallas de "Start" y "Game Over" deben verse como un panel de cristal (glassmorphism) sobre el juego.

## 🧰 Habilidades Globales (Skills)
Tienes acceso a habilidades instaladas globalmente en `~/.agents/skills/`. Úsalas proactivamente:
- Usa `design-taste-frontend` para asegurar que los menús y el HUD tengan un diseño premium.
- Usa `awesome-design-md` si necesitas extraer paletas de colores de juegos o interfaces de vanguardia.
- Usa `web-design-guidelines` para auditar que los menús sean accesibles y navegables con teclado (muy importante en juegos).
- Usa `playwright` para levantar el servidor local, simular teclas (arriba/abajo) y tomar capturas del gameplay.