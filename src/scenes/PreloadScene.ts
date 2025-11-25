import Phaser from 'phaser';
import { Assets, type AssetManifest } from '../shared/Assets';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  preload() {
    const manifest = this.cache.json.get(Assets.MANIFEST_KEY) as AssetManifest | undefined;

    if (!manifest) {
      console.warn('Asset manifest missing; skipping preload');
      return;
    }

    manifest.images?.forEach(({ key, url }) => {
      this.load.image(key, url);
    });

    manifest.audio?.forEach(({ key, urls }) => {
      this.load.audio(key, urls);
    });

    manifest.spritesheets?.forEach(({ key, url, frameWidth, frameHeight }) => {
      this.load.spritesheet(key, url, { frameWidth, frameHeight });
    });
  }

  create() {
    this.scene.start('main');
  }
}
