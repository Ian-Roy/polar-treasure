import Phaser from 'phaser';
import { Assets } from '../shared/Assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    const { width, height } = this.scale;
    const barWidth = Math.floor(width * 0.6);
    const barHeight = 12;
    const x = (width - barWidth) / 2;
    const y = height * 0.66;

    const bg = this.add.rectangle(x, y, barWidth, barHeight, 0x1c223c).setOrigin(0, 0.5);
    const fg = this.add.rectangle(x, y, 1, barHeight, 0x2bd4ff).setOrigin(0, 0.5);

    this.load.on('progress', (p: number) => {
      fg.width = Math.max(1, Math.floor(barWidth * p));
    });

    // Load the asset manifest JSON first (generated in tools/gen-assets.ts)
    this.load.json(Assets.MANIFEST_KEY, 'assets/manifest.json');
  }

  create() {
    this.scene.start('preload');
  }
}
