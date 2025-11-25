export type AssetManifest = {
  images?: { key: string; url: string }[];
  audio?: { key: string; urls: string[] }[];
  spritesheets?: { key: string; url: string; frameWidth: number; frameHeight: number }[];
};

export const Assets = {
  MANIFEST_KEY: 'asset_manifest'
};
