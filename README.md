# Pong - Retro Arcade Edition

A modern retro take on Pong, built with **Phaser 4**, **TypeScript** and **Vite**.

## Demo

Once deployed as a GitHub user site: `https://<usuario>.github.io/`

## Controls

| Action | Keys |
| --- | --- |
| Navigate menus | Arrow keys or `W` / `S` |
| Confirm | `Enter` or `Space` |
| Back | `Esc` |
| Player 1 (1P mode) | `W` / `S` or `Up` / `Down` |
| Player 1 (2P mode) | `W` / `S` |
| Player 2 (2P mode) | `Up` / `Down` |
| Pause / resume | `P` or `Esc` |
| Fullscreen | `F` |

The pause menu is keyboard-only: use `Up` / `Down` (or `W` / `S`) to select and
`Enter` / `Space` to confirm.

## Audio settings

Music and SFX volumes can be changed from **SETTINGS** in the main menu using
`Left` / `Right` (or `A` / `D`). The values are stored in `localStorage` as JSON
under the key `pong.audio-settings.v1`:

```json
{ "musicVolume": 70, "sfxVolume": 80 }
```

## Mobile

The game requires a physical keyboard, so mobile devices are not supported yet.
When opened on a phone or tablet, a warning is shown before the game starts.

## Requirements

- [Node.js](https://nodejs.org) 20 or newer
- [pnpm](https://pnpm.io) 10

## Local development

```bash
pnpm install
pnpm dev
```

## Production build

```bash
pnpm install --frozen-lockfile
pnpm run build-nolog
```

The output is generated in `dist/`.

## Deploy to GitHub Pages

This project is configured as a **GitHub user site** (`<usuario>.github.io`).

1. Create the repository `<usuario>/<usuario>.github.io` on GitHub.
2. Push this project to the `main` branch.
3. In the repository, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds the game with pnpm and
   publishes `dist/` on every push to `main`.
5. The site will be available at `https://<usuario>.github.io/`.

The Vite configuration uses `base: './'`, so the generated asset URLs work both
at the site root and inside a subdirectory.

## Project structure

```
public/
  assets/
    audio/
      music/     Background music (WAV)
      sfx/       Sound effects (WAV)
src/
  game/
    audio/       Audio manager and persisted settings
    config/      Gameplay constants and colors
    logic/       Court, collisions and game logic
    scenes/      Boot, Preloader, MainMenu, Game, GameOver
    ui/          HUD, pause menu, buttons and player controls
.github/
  workflows/
    deploy.yml   GitHub Pages deployment
```

## Credits

- **Design, programming and art:** Diego Herrera
- **Built with:** Phaser 4, TypeScript and Vite
- **Font:** "Press Start 2P" (SIL Open Font License)

## License

MIT
