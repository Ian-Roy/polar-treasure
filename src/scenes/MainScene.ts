import Phaser from 'phaser';
import { InputManager } from '../shared/Input';
import { Settings } from '../shared/Settings';
import { Storage } from '../shared/Storage';

export class MainScene extends Phaser.Scene {
  private inputMgr!: InputManager;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private speed = 160;

  constructor() {
    super('main');
  }

  async create() {
    // Settings & save data
    const settings = await Settings.load();
    const muted = settings?.audio.muted ?? true;
    this.sound.setMute(muted);

    // Input
    this.inputMgr = new InputManager(this);

    // Simple world
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.text(16, 12, 'PWA Game Starter\nWASD/Arrows to move\nPress M to mute/unmute', {
      color: '#ffffff',
      fontSize: '16px'
    });

    // Player (uses generated sprite "player_dot")
    this.player = this.physics.add.sprite(cx, cy, 'player_dot');

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Toggle mute
    this.input.keyboard?.on('keydown-M', async () => {
      const newMuted = !this.sound.mute;
      this.sound.setMute(newMuted);
      const s = (await Settings.load()) || Settings.defaults();
      s.audio.muted = newMuted;
      await Settings.save(s);
    });

    // Simple save on Esc: position
    this.input.keyboard?.on('keydown-ESC', async () => {
      await Storage.set('player.pos', { x: this.player.x, y: this.player.y });
      this.addToast('Saved');
    });

    // Load saved position
    const saved = await Storage.get<{ x: number; y: number }>('player.pos');
    if (saved) {
      this.player.setPosition(saved.x, saved.y);
      this.addToast('Loaded');
    }
  }

  update() {
    const { left, right, up, down } = this.inputMgr.state;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const len = Math.hypot(vx, vy) || 1;
    this.player.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);
  }

  private addToast(text: string) {
    const t = this.add.text(this.cameras.main.centerX, 60, text, {
      color: '#2bd4ff',
      fontSize: '14px'
    });
    t.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: t,
      y: 20,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy()
    });
  }
}
