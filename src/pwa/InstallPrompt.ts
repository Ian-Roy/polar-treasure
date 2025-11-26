/**
 * Handles the browser "Add to Home Screen" prompt (Android/Chrome).
 * Shows a small UI when the `beforeinstallprompt` event fires.
 */
export function setupInstallPrompt() {
  let deferred: BeforeInstallPromptEvent | null = null;
  let container: HTMLDivElement | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    showUI();
  });

  window.addEventListener('appinstalled', () => {
    cleanup();
  });

  function showUI() {
    if (!deferred || container) return;

    container = document.createElement('div');
    container.className = 'install-toast';
    container.innerHTML = `
      <div class="install-toast__card">
        <div class="install-toast__text">
          <div class="install-toast__title">Install this game</div>
          <div class="install-toast__subtitle">Add it to your home screen for offline play.</div>
        </div>
        <div class="install-toast__actions">
          <button class="install-toast__btn" id="install-action">Install</button>
          <button class="install-toast__dismiss" id="install-dismiss">Later</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    container.querySelector<HTMLButtonElement>('#install-action')?.addEventListener('click', async () => {
      if (!deferred) return;
      const promptEvent = deferred;
      deferred = null;
      await promptEvent.prompt();
      await promptEvent.userChoice;
      cleanup();
    });

    container.querySelector<HTMLButtonElement>('#install-dismiss')?.addEventListener('click', () => {
      deferred = null;
      cleanup();
    });
  }

  function cleanup() {
    if (container) {
      container.remove();
      container = null;
    }
  }
}

// Types are still experimental in TS DOM lib
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
