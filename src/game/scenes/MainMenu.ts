import { Scene } from 'phaser';
import { VOLUME_STEP } from '../audio/settings';
import { getAudioSettings, playMusic, playSfx, setMusicVolume, setSfxVolume } from '../audio/sound';
import { AI_CONFIG, DIFFICULTIES, GAME_HEIGHT, GAME_VERSION, GAME_WIDTH, RETRO_FONT } from '../config/gameplay';
import type { Difficulty, GameSettings } from '../types';
import { bindFullscreenKey } from '../ui/neon';

type MenuState = 'main' | 'difficulty' | 'settings' | 'credits';

const SETTINGS_MUSIC = 0;
const SETTINGS_SFX = 1;
const SETTINGS_BACK = 2;

export class MainMenu extends Scene {
    private menuState: MenuState = 'main';
    private menuItems: Phaser.GameObjects.Text[] = [];
    private selectedIndex = 0;
    private starting = false;
    private cursorArrow!: Phaser.GameObjects.Text;
    private titleText!: Phaser.GameObjects.Text;
    private subtitleText!: Phaser.GameObjects.Text;

    // Submenús y contenedores
    private mainContainer!: Phaser.GameObjects.Container;
    private difficultyContainer!: Phaser.GameObjects.Container;
    private settingsContainer!: Phaser.GameObjects.Container;
    private creditsContainer!: Phaser.GameObjects.Container;

    private difficultyItems: Phaser.GameObjects.Text[] = [];
    private settingsItems: Phaser.GameObjects.Text[] = [];

    // Decorative ball animation
    private decoBall!: Phaser.GameObjects.Arc;
    private decoBallTrail: Phaser.GameObjects.Arc[] = [];
    private decoBallVx = 2.5;
    private decoBallVy = 1.8;

    // Blinking text
    private blinkText!: Phaser.GameObjects.Text;
    private blinkTimer = 0;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        this.starting = false;
        this.menuState = 'main';
        this.selectedIndex = 0;
        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.fadeIn(220, 0, 0, 0);
        playMusic(this, 'menu_theme');

        // --- CRT rounded vignette background ---
        this.drawCrtBackground();

        // --- Title "PONG" in big pixel letters ---
        this.titleText = this.add.text(GAME_WIDTH / 2, 100, 'PONG', {
            fontFamily: RETRO_FONT,
            fontSize: 96,
            color: '#ffffff',
        }).setOrigin(0.5);

        // --- Subtitle "RETRO ARCADE EDITION" in accent color ---
        this.subtitleText = this.add.text(GAME_WIDTH / 2, 160, 'RETRO ARCADE EDITION', {
            fontFamily: RETRO_FONT,
            fontSize: 14,
            color: '#c8ff00',
            letterSpacing: 4
        }).setOrigin(0.5);

        // --- Contenedores de menú ---
        this.mainContainer = this.add.container(0, 0).setDepth(10);
        this.difficultyContainer = this.add.container(0, 0).setVisible(false).setDepth(10);
        this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(10);
        this.creditsContainer = this.add.container(0, 0).setVisible(false).setDepth(10);

        // --- Cursor arrow ---
        this.cursorArrow = this.add.text(0, 0, '\u25B6', {
            fontFamily: RETRO_FONT,
            fontSize: 18,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(11);

        this.buildMainMenu();
        this.buildDifficultyMenu();
        this.buildSettingsMenu();
        this.buildCreditsMenu();

        this.updateCursor();

        // --- Decorative paddles ---
        this.add.rectangle(50, GAME_HEIGHT / 2, 14, 110, 0xffffff);
        this.add.rectangle(GAME_WIDTH - 50, GAME_HEIGHT / 2, 14, 110, 0xffffff);

        // --- Decorative ball with trail ---
        this.decoBallTrail = [];
        for (let i = 0; i < 5; i++) {
            const trail = this.add.circle(620, 200, 6 - i, 0xffffff, 0.15 + i * 0.05);
            this.decoBallTrail.push(trail);
        }

        this.decoBall = this.add.circle(650, 200, 8, 0xffffff);
        this.decoBallVx = 2.5;
        this.decoBallVy = 1.8;

        // --- Bottom text: "PRESS ENTER TO START" with blink ---
        this.blinkText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'PRESS ENTER TO START', {
            fontFamily: RETRO_FONT,
            fontSize: 10,
            color: '#888888',
            letterSpacing: 2
        }).setOrigin(0.5);

        // --- Copyright ---
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 45, '\u00A9 2026 PHASER PONG', {
            fontFamily: RETRO_FONT,
            fontSize: 9,
            color: '#666666',
            letterSpacing: 2
        }).setOrigin(0.5);

        // --- CRT scanline overlay ---
        this.drawCrtScanlines();

        // --- Keyboard controls (navegación solo por teclado) ---
        bindFullscreenKey(this);
        this.bindKeyboard();
    }

    private bindKeyboard(): void {
        this.input.keyboard?.on('keydown-UP', () => this.navigateMenu(-1));
        this.input.keyboard?.on('keydown-W', () => this.navigateMenu(-1));
        this.input.keyboard?.on('keydown-DOWN', () => this.navigateMenu(1));
        this.input.keyboard?.on('keydown-S', () => this.navigateMenu(1));

        this.input.keyboard?.on('keydown-LEFT', () => this.adjustSetting(-1));
        this.input.keyboard?.on('keydown-A', () => this.adjustSetting(-1));
        this.input.keyboard?.on('keydown-RIGHT', () => this.adjustSetting(1));
        this.input.keyboard?.on('keydown-D', () => this.adjustSetting(1));

        this.input.keyboard?.on('keydown-ENTER', () => this.handleSelect());
        this.input.keyboard?.on('keydown-SPACE', () => this.handleSelect());

        this.input.keyboard?.on('keydown-ESC', () => {
            if (this.menuState !== 'main') {
                this.switchToMainMenu();
            }
        });
    }

    private buildMainMenu(): void {
        const menuLabels = ['1 PLAYER', '2 PLAYERS', 'SETTINGS', 'CREDITS'];
        const startY = 250;
        const spacingY = 46;

        this.menuItems = [];

        menuLabels.forEach((label, index) => {
            const text = this.add.text(GAME_WIDTH / 2, startY + index * spacingY, label, {
                fontFamily: RETRO_FONT,
                fontSize: 20,
                color: '#ffffff'
            }).setOrigin(0.5);

            this.menuItems.push(text);
            this.mainContainer.add(text);
        });
    }

    private buildDifficultyMenu(): void {
        const title = this.add.text(GAME_WIDTH / 2, 230, 'SELECT DIFFICULTY', {
            fontFamily: RETRO_FONT,
            fontSize: 13,
            color: '#c8ff00',
            letterSpacing: 3
        }).setOrigin(0.5);

        this.difficultyContainer.add(title);

        const diffOptions = [...DIFFICULTIES, 'BACK'];
        const startY = 275;
        const spacingY = 42;

        this.difficultyItems = [];

        diffOptions.forEach((opt) => {
            const isBack = opt === 'BACK';
            const label = isBack ? 'BACK' : AI_CONFIG[opt as Difficulty].label;
            const text = this.add.text(GAME_WIDTH / 2, startY + this.difficultyItems.length * spacingY, label, {
                fontFamily: RETRO_FONT,
                fontSize: 18,
                color: isBack ? '#888888' : '#ffffff'
            }).setOrigin(0.5);

            this.difficultyItems.push(text);
            this.difficultyContainer.add(text);
        });
    }

    private buildSettingsMenu(): void {
        const title = this.add.text(GAME_WIDTH / 2, 230, 'SETTINGS', {
            fontFamily: RETRO_FONT,
            fontSize: 13,
            color: '#c8ff00',
            letterSpacing: 3
        }).setOrigin(0.5);

        this.settingsContainer.add(title);

        const startY = 285;
        const spacingY = 44;

        this.settingsItems = [];

        for (let i = 0; i < 3; i++) {
            const text = this.add.text(GAME_WIDTH / 2, startY + i * spacingY, '', {
                fontFamily: RETRO_FONT,
                fontSize: 16,
                color: i === SETTINGS_BACK ? '#888888' : '#ffffff'
            }).setOrigin(0.5);

            this.settingsItems.push(text);
            this.settingsContainer.add(text);
        }

        const hint = this.add.text(GAME_WIDTH / 2, 450, 'LEFT / RIGHT: ADJUST   ESC: BACK', {
            fontFamily: RETRO_FONT,
            fontSize: 8,
            color: '#666666',
            letterSpacing: 1
        }).setOrigin(0.5);

        this.settingsContainer.add(hint);

        this.refreshSettingsLabels();
    }

    private buildCreditsMenu(): void {
        const centerX = GAME_WIDTH / 2;

        const lines: Array<{ text: string; y: number; size: number; color: string }> = [
            { text: 'CREDITS', y: 92, size: 14, color: '#c8ff00' },
            { text: 'PONG', y: 142, size: 30, color: '#ffffff' },
            { text: 'RETRO ARCADE EDITION', y: 178, size: 9, color: '#c8ff00' },
            { text: 'DESIGN, PROGRAMMING & ART', y: 228, size: 9, color: '#c8ff00' },
            { text: 'Diego Herrera', y: 250, size: 9, color: '#ffffff' },
            { text: 'BUILT WITH', y: 292, size: 9, color: '#c8ff00' },
            { text: 'Phaser 4 - TypeScript - Vite', y: 314, size: 8, color: '#ffffff' },
            { text: 'FONT', y: 356, size: 9, color: '#c8ff00' },
            { text: '"Press Start 2P"', y: 378, size: 8, color: '#ffffff' },
            { text: 'SIL Open Font License', y: 396, size: 8, color: '#ffffff' },
            { text: 'PONG \u00A9 2026', y: 444, size: 9, color: '#888888' },
            { text: `Version ${GAME_VERSION}`, y: 466, size: 9, color: '#888888' },
            { text: 'PRESS ESC / ENTER TO RETURN', y: 532, size: 8, color: '#666666' }
        ];

        lines.forEach((line) => {
            const text = this.add.text(centerX, line.y, line.text, {
                fontFamily: RETRO_FONT,
                fontSize: line.size,
                color: line.color,
                letterSpacing: 1
            }).setOrigin(0.5);

            this.creditsContainer.add(text);
        });
    }

    private refreshSettingsLabels(): void {
        const settings = getAudioSettings();

        this.settingsItems[SETTINGS_MUSIC]?.setText(`MUSIC VOLUME  ${settings.musicVolume}%`);
        this.settingsItems[SETTINGS_SFX]?.setText(`SFX VOLUME  ${settings.sfxVolume}%`);
        this.settingsItems[SETTINGS_BACK]?.setText('BACK');
    }

    private getCurrentList(): Phaser.GameObjects.Text[] {
        switch (this.menuState) {
            case 'difficulty':
                return this.difficultyItems;
            case 'settings':
                return this.settingsItems;
            case 'credits':
                return [];
            default:
                return this.menuItems;
        }
    }

    private navigateMenu(direction: number): void {
        if (this.starting || this.menuState === 'credits') return;

        const currentList = this.getCurrentList();

        if (currentList.length === 0) return;

        playSfx(this, 'button_hover');

        this.selectedIndex = (this.selectedIndex + direction + currentList.length) % currentList.length;
        this.updateCursor();
    }

    private adjustSetting(direction: number): void {
        if (this.starting || this.menuState !== 'settings') return;

        const settings = getAudioSettings();

        if (this.selectedIndex === SETTINGS_MUSIC) {
            setMusicVolume(settings.musicVolume + direction * VOLUME_STEP);
            playSfx(this, 'button_hover');
            this.refreshSettingsLabels();
            this.updateCursor();
        }
        else if (this.selectedIndex === SETTINGS_SFX) {
            setSfxVolume(settings.sfxVolume + direction * VOLUME_STEP);
            playSfx(this, 'button_hover');
            this.refreshSettingsLabels();
            this.updateCursor();
        }
    }

    private handleSelect(): void {
        if (this.starting) return;

        switch (this.menuState) {
            case 'main':
                this.selectMenuItem(this.selectedIndex);
                break;
            case 'difficulty':
                this.selectDifficultyItem(this.selectedIndex);
                break;
            case 'settings':
                this.selectSettingsItem(this.selectedIndex);
                break;
            case 'credits':
                playSfx(this, 'button_click');
                this.switchToMainMenu();
                break;
        }
    }

    private updateCursor(): void {
        if (this.menuState === 'credits') {
            this.cursorArrow.setVisible(false);
            return;
        }

        const currentItem = this.getCurrentList()[this.selectedIndex];

        if (currentItem) {
            // Posicionar la flecha centrada a la izquierda del texto centrado
            const textHalfWidth = currentItem.width / 2;
            this.cursorArrow.setPosition(currentItem.x - textHalfWidth - 24, currentItem.y);
            this.cursorArrow.setVisible(true);
        }
        else {
            this.cursorArrow.setVisible(false);
        }
    }

    private showMenu(state: MenuState): void {
        this.menuState = state;
        this.mainContainer.setVisible(state === 'main');
        this.difficultyContainer.setVisible(state === 'difficulty');
        this.settingsContainer.setVisible(state === 'settings');
        this.creditsContainer.setVisible(state === 'credits');

        // El título grande y el texto parpadeante solo tienen sentido en el menú principal
        this.titleText.setVisible(state !== 'credits');
        this.subtitleText.setVisible(state !== 'credits');
        this.blinkText.setVisible(state === 'main');

        this.updateCursor();
    }

    private switchToDifficultyMenu(): void {
        this.selectedIndex = 1; // Selecciona 'MEDIUM' por defecto
        this.showMenu('difficulty');
    }

    private switchToSettingsMenu(): void {
        this.selectedIndex = 0;
        this.refreshSettingsLabels();
        this.showMenu('settings');
    }

    private switchToCreditsMenu(): void {
        this.showMenu('credits');
    }

    private switchToMainMenu(): void {
        this.selectedIndex = 0;
        this.showMenu('main');
    }

    private selectMenuItem(index: number): void {
        if (this.starting) return;

        playSfx(this, 'button_click');

        switch (index) {
            case 0: // 1 PLAYER
                this.switchToDifficultyMenu();
                break;
            case 1: // 2 PLAYERS
                this.startGame({ mode: 'local' });
                break;
            case 2: // SETTINGS
                this.switchToSettingsMenu();
                break;
            case 3: // CREDITS
                this.switchToCreditsMenu();
                break;
        }
    }

    private selectDifficultyItem(index: number): void {
        if (this.starting) return;

        playSfx(this, 'button_click');

        if (index === DIFFICULTIES.length) // 'BACK'
        {
            this.switchToMainMenu();
            return;
        }

        const chosenDifficulty = DIFFICULTIES[index];
        this.startGame({ mode: 'cpu', difficulty: chosenDifficulty });
    }

    private selectSettingsItem(index: number): void {
        if (this.starting) return;

        if (index === SETTINGS_BACK) {
            playSfx(this, 'button_click');
            this.switchToMainMenu();
        }
    }

    update(_time: number, delta: number): void {
        this.animateDecoBall();

        if (this.menuState !== 'main') {
            return;
        }

        this.blinkTimer += delta;
        if (this.blinkTimer > 600) {
            this.blinkTimer = 0;
            this.blinkText.setVisible(!this.blinkText.visible);
        }
    }

    private drawCrtBackground(): void {
        const g = this.add.graphics();

        g.fillStyle(0x0a0a0a, 1);
        g.fillRoundedRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20, 30);

        g.lineStyle(2, 0x333333, 0.5);
        g.strokeRoundedRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20, 30);

        g.fillStyle(0x000000, 1);
        g.fillRect(0, 0, GAME_WIDTH, 10);
        g.fillRect(0, GAME_HEIGHT - 10, GAME_WIDTH, 10);
        g.fillRect(0, 0, 10, GAME_HEIGHT);
        g.fillRect(GAME_WIDTH - 10, 0, 10, GAME_HEIGHT);
    }

    private drawCrtScanlines(): void {
        const overlay = this.add.graphics();
        overlay.setDepth(100);
        overlay.setAlpha(0.06);

        for (let y = 0; y < GAME_HEIGHT; y += 3) {
            overlay.fillStyle(0x000000, 1);
            overlay.fillRect(0, y, GAME_WIDTH, 1);
        }
    }

    private animateDecoBall(): void {
        this.decoBall.x += this.decoBallVx;
        this.decoBall.y += this.decoBallVy;

        const minX = 560;
        const maxX = GAME_WIDTH - 60;
        const minY = 120;
        const maxY = GAME_HEIGHT - 120;

        if (this.decoBall.x <= minX || this.decoBall.x >= maxX) this.decoBallVx *= -1;
        if (this.decoBall.y <= minY || this.decoBall.y >= maxY) this.decoBallVy *= -1;

        for (let i = this.decoBallTrail.length - 1; i > 0; i--) {
            this.decoBallTrail[i].x = this.decoBallTrail[i - 1].x;
            this.decoBallTrail[i].y = this.decoBallTrail[i - 1].y;
        }
        if (this.decoBallTrail.length > 0) {
            this.decoBallTrail[0].x = this.decoBall.x - this.decoBallVx * 3;
            this.decoBallTrail[0].y = this.decoBall.y - this.decoBallVy * 3;
        }
    }

    private startGame(settings: GameSettings): void {
        if (this.starting) {
            return;
        }

        this.starting = true;
        this.cameras.main.fadeOut(180, 0, 0, 0);

        this.time.delayedCall(190, () => {
            this.scene.start('Game', settings);
        });
    }
}
