# Pong - Retro Arcade Edition

A modern retro take on **Pong**, built with **Phaser 4**, **TypeScript** and **Vite**.

The game keeps the classic arcade feel with a CRT-inspired presentation, keyboard-only
menus, background music, sound effects and persistent audio settings.

## Demo

```text
https://dherrera-software.github.io/Pong/
```

## Features

- **1 Player vs CPU** with four difficulty levels: `NOOB`, `MEDIUM`, `HARD` and `INFERNO`.
- **2 Players local** on the same keyboard.
- **60-second matches** with a `3 → 2 → 1` countdown before the first serve.
- **Sudden death** when the match ends in a tie.
- Ball speed increases as the rally progresses.
- Retro CRT-style background, scanlines, paddles and particle trail.
- **Keyboard-only navigation** across all menus.
- **Pause menu** fully controlled with the keyboard.
- **Settings screen** for music and SFX volume.
- Audio configuration **persisted in `localStorage`** as JSON.
- **Mobile warning**: the game explains that a physical keyboard is required.
- GitHub Pages deployment through GitHub Actions.

## Controls

| Action | Keys |
| --- | --- |
| Navigate menus | `Up` / `Down` or `W` / `S` |
| Adjust audio volume | `Left` / `Right` or `A` / `D` |
| Confirm | `Enter` or `Space` |
| Back | `Esc` |
| Player 1 (1P mode) | `Up` / `Down` or `W` / `S` |
| Player 1 (2P mode) | `W` / `S` |
| Player 2 (2P mode) | `Up` / `Down` |
| Pause / resume | `P` or `Esc` |
| Pause menu navigation | `Up` / `Down` or `W` / `S` |
| Pause menu confirm | `Enter` or `Space` |
| Fullscreen | `F` |

## Menus

### Main menu

- **1 PLAYER**: opens the difficulty selector.
- **2 PLAYERS**: starts a local match.
- **SETTINGS**: opens the audio settings screen.
- **CREDITS**: shows the project credits and version.

### Difficulty selector

Choose between `NOOB`, `MEDIUM`, `HARD` and `INFERNO`, or go back to the main menu.
Each difficulty changes the CPU reaction time, aiming error and maximum speed.

### Settings

- **MUSIC VOLUME**: `0%` to `100%`, adjusted in steps of `10`.
- **SFX VOLUME**: `0%` to `100%`, adjusted in steps of `10`.
- **BACK**: returns to the main menu.

Changes are applied immediately and saved automatically.

### Pause menu

The pause menu can only be used with the keyboard:

- `Up` / `Down` or `W` / `S`: select an option.
- `Enter` or `Space`: confirm.
- `Esc` or `P`: resume the match.

Available options: **CONTINUE**, **RESTART** and **MAIN MENU**.

## Audio

The project uses WAV files kept in their original quality:

```text
public/assets/audio/
  music/
    menu_theme.wav
    gameplay_theme.wav
  sfx/
    button_click.wav
    button_hover.wav
    paddle_hit.wav
    score.wav
    wall_bounce.wav
```

The total audio size is approximately **72.57 MB**, so the first load can take a
while on slow connections.

### Saved settings

Audio settings are stored in `localStorage` under the key:

```text
pong.audio-settings.v1
```

Stored as JSON:

```json
{
  "musicVolume": 70,
  "sfxVolume": 80
}
```

Defaults: music `70%`, SFX `80%`.

## Mobile devices

The game currently requires a physical keyboard with arrow keys or WASD. When the
page is opened on a phone or tablet, a warning screen explains the limitation and
offers a **CONTINUE ANYWAY** button for devices with an external keyboard.

## Tech stack

| Technology | Version |
| --- | --- |
| Phaser | 4.0.0 |
| TypeScript | 5.7.x |
| Vite | 6.x |
| pnpm | 10.31.0 |
| Node.js (CI) | 22 |

## Requirements

- [Node.js](https://nodejs.org) 20 or newer.
- [pnpm](https://pnpm.io) 10.

## Local development

```bash
pnpm install
pnpm dev
```

Open the development server shown in the terminal.

### Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server. |
| `pnpm dev-nolog` | Start the development server without telemetry. |
| `pnpm build` | Create a production build in `dist/`. |
| `pnpm build-nolog` | Create a production build without telemetry. |

## Production build

```bash
pnpm install --frozen-lockfile
pnpm run build-nolog
```

The generated files are placed in `dist/`.

## Deploy to GitHub Pages

The repository is configured as a **GitHub Pages project site**:

```text
https://dherrera-software.github.io/Pong/
```

The Vite configuration uses `base: './'`, so the generated asset URLs work both at
the site root and inside a subdirectory.

### Deployment steps

1. Push the project to the `main` branch.
2. In the repository, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` runs automatically on every push
   to `main` and publishes `dist/`.

The workflow uses:

- `pnpm/action-setup` with pnpm `10.31.0`.
- Node.js `22`.
- `pnpm install --frozen-lockfile`.
- `pnpm run build-nolog`.
- `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`.

If you want the game at the root URL `https://dherrera-software.github.io/`, rename
the repository to `dherrera-software.github.io`. The same build continues to work.

## Project structure

```text
public/
  assets/
    audio/
      music/       Background music (WAV)
      sfx/         Sound effects (WAV)
    bg.png
    logo.png
  favicon.png
  style.css
src/
  game/
    audio/
      settings.ts  Audio settings persistence
      sound.ts     Music and SFX manager
    config/
      gameplay.ts  Game constants, colors and difficulty configuration
    logic/
      court.ts     Court, paddles, ball and collisions
    scenes/
      Boot.ts
      Preloader.ts
      MainMenu.ts
      Game.ts
      GameOver.ts
    ui/
      hud.ts
      neon.ts
      pause-menu.ts
      player-controls.ts
    ai/
      PaddleAI.ts
    main.ts
    particles.ts
    types.ts
  main.ts
  vite-env.d.ts
.github/
  workflows/
    deploy.yml
```

## Credits

- **Design, programming and art:** Diego Herrera
- **Built with:** Phaser 4, TypeScript and Vite
- **Font:** "Press Start 2P" (SIL Open Font License)
- **Version:** 1.0.0

## License

MIT
