import { Storage } from './Storage';

export type SettingsSchema = {
  audio: { muted: boolean; volume: number };
  graphics: { pixelArt: boolean };
};

export const Settings = {
  defaults(): SettingsSchema {
    return {
      audio: { muted: true, volume: 1.0 },
      graphics: { pixelArt: true }
    };
  },
  async load(): Promise<SettingsSchema> {
    return (await Storage.get<SettingsSchema>('settings')) ?? Settings.defaults();
  },
  async save(s: SettingsSchema): Promise<void> {
    await Storage.set('settings', s);
  }
};
