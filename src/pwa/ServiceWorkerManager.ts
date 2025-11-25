/**
 * Hooks into vite-plugin-pwa's `autoUpdate` lifecycle.
 * When a new Service Worker is waiting, we call `onUpdateFound` so UI can prompt reload.
 */
import { registerSW } from 'virtual:pwa-register';

export function setupPWAUpdatePrompt(onUpdateFound: () => void) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      onUpdateFound?.();
    },
    onOfflineReady() {
      // Optional: could show "Ready to work offline" toast.
      // Intentionally silent to avoid noise.
    }
  });
}
