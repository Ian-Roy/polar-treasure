import Phaser from 'phaser';

type OrientationListeners = Array<() => void>;

export const setupLandscapeLock = () => {
  let game: Phaser.Game | null = null;
  let sleeping = false;
  const listeners: OrientationListeners = [];
  const coarsePointer = window.matchMedia('(pointer: coarse)');

  const overlay = document.createElement('div');
  overlay.className = 'landscape-lock';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="landscape-lock__card">
      <div class="landscape-lock__title">Landscape required</div>
      <div class="landscape-lock__subtitle">
        Rotate your device to landscape for the best view.
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const isMobile = () => coarsePointer.matches || /Mobi|Android/i.test(navigator.userAgent);

  const shouldLock = () => {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    return isMobile() && aspect < 1.1;
  };

  const apply = () => {
    const lock = shouldLock();
    overlay.classList.toggle('landscape-lock--active', lock);
    overlay.setAttribute('aria-hidden', lock ? 'false' : 'true');
    if (!game) return;
    if (lock && !sleeping) {
      game.loop.sleep();
      sleeping = true;
    } else if (!lock && sleeping) {
      game.loop.wake();
      sleeping = false;
    }
  };

  const addListener = (cb: () => void) => {
    listeners.push(cb);
    window.addEventListener('resize', cb);
    window.addEventListener('orientationchange', cb);
    if (typeof coarsePointer.addEventListener === 'function') {
      coarsePointer.addEventListener('change', cb);
    } else {
      coarsePointer.addListener(cb);
    }
  };

  addListener(apply);
  apply();

  return {
    bindGame(g: Phaser.Game) {
      game = g;
      apply();
    },
    destroy() {
      listeners.forEach((cb) => {
        window.removeEventListener('resize', cb);
        window.removeEventListener('orientationchange', cb);
        if (typeof coarsePointer.removeEventListener === 'function') {
          coarsePointer.removeEventListener('change', cb);
        } else {
          coarsePointer.removeListener(cb);
        }
      });
      overlay.remove();
    }
  };
};

export const tryLockScreenOrientation = async () => {
  const orientation = window.screen.orientation;
  if (!orientation?.lock) return;
  try {
    await orientation.lock('landscape');
  } catch {
    // Ignore; browsers often reject outside user gestures or when not installed.
  }
};
