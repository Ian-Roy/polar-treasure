# polar-treasure


# Polar Treasure (Phaser 3 + TS + Vite + PWA)

Offline-first Phaser 3 starter that deploys to GitHub Pages. Uses vite-plugin-pwa (Workbox GenerateSW) with a user prompt when updates are available.

## Quick start

```bash
# install
yarn

# generate assets, build, and run dev server
yarn dev
```

- Dev server: http://localhost:5173
- First interaction enables audio (mobile policy).

## Build

```bash
# Generates icons, sprites, sfx, then builds
yarn build
```

Outputs to `dist/`.

## Deploy to GitHub Pages

1. Ensure `vite.config.ts` `REPO_BASE` matches your repository name, e.g. `/polar-treasure/`.
2. Enable Pages in GitHub (Settings → Pages → Deploy from branch: `gh-pages`).
3. Push to `main`; CI will build and deploy automatically. Or deploy manually:

```bash
yarn deploy
```

## PWA behavior

- First load online installs the Service Worker and precaches all app assets.
- When a new version is available, a toast appears with “Reload”.
- Everything is self-hosted; no external CDNs.

## File map

- `src/scenes/` – Boot → Preload → Main scene flow.
- `src/shared/` – Input, Settings, Storage, etc.
- `tools/gen-assets.ts` – Procedurally generates icons, a tiny sprite, and a click sfx.
- `assets/manifest.json` – Declarative list of assets to load at startup.

## License

GPL-3.0-only
