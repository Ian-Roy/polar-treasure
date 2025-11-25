import Phaser from 'phaser';

export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export class InputManager {
  public state: InputState = { left: false, right: false, up: false, down: false };
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Keyboard
    const k = scene.input.keyboard!;
    const cursors = k.createCursorKeys();
    const wasd = k.addKeys('W,A,S,D') as unknown as Record<string, Phaser.Input.Keyboard.Key>;

    scene.events.on('update', () => {
      this.state.left = !!(cursors.left?.isDown || wasd.A?.isDown);
      this.state.right = !!(cursors.right?.isDown || wasd.D?.isDown);
      this.state.up = !!(cursors.up?.isDown || wasd.W?.isDown);
      this.state.down = !!(cursors.down?.isDown || wasd.S?.isDown);
    });

    // Touch (simple virtual joystick: swipe directions)
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const dx = p.position.x - p.downX;
      const dy = p.position.y - p.downY;
      const dead = 24;
      this.state.left = dx < -dead;
      this.state.right = dx > dead;
      this.state.up = dy < -dead;
      this.state.down = dy > dead;
    });

    scene.input.on('pointerup', () => {
      this.state = { left: false, right: false, up: false, down: false };
    });

    // Optional: basic gamepad (never required)
    scene.input.gamepad?.on('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
      scene.events.on('update', () => {
        const h = pad.axes.length ? pad.axes[0].getValue() : 0;
        const v = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
        this.state.left = this.state.left || h < -0.3;
        this.state.right = this.state.right || h > 0.3;
        this.state.up = this.state.up || v < -0.3;
        this.state.down = this.state.down || v > 0.3;
      });
    });
  }
}
