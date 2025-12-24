import Phaser from 'phaser';

type PolarCell = {
  angle: number;
  radius: number;
  radiusRatio: number;
  x: number;
  y: number;
};

type ExcavationRecord = {
  id: number;
  angle: number;
  radius: number;
  radiusRatio: number;
  marker: Phaser.GameObjects.Ellipse;
};

type InfoPanelLayout = {
  x: number;
  width: number;
  height: number;
  padding: number;
  margin: number;
};

export class MainScene extends Phaser.Scene {
  private origin = new Phaser.Math.Vector2();
  private maxRadius = 0;
  private radialStep = 84;
  private ringCount = 5;

  private bgGradient!: Phaser.GameObjects.Graphics;
  private grid!: Phaser.GameObjects.Graphics;
  private gridLabels: Phaser.GameObjects.Text[] = [];
  private targetMarker!: Phaser.GameObjects.Graphics;
  private excavations: ExcavationRecord[] = [];
  private excavationId = 0;
  private infoPanel!: Phaser.GameObjects.Graphics;
  private infoText!: Phaser.GameObjects.Text;
  private panelLayout: InfoPanelLayout = { x: 0, width: 0, height: 0, padding: 0, margin: 0 };
  private digSfx?: Phaser.Sound.BaseSound;

  constructor() {
    super('main');
  }

  create() {
    this.bgGradient = this.add.graphics().setDepth(0);
    this.grid = this.add.graphics().setDepth(2);
    this.targetMarker = this.add.graphics().setDepth(3);

    this.infoPanel = this.add.graphics().setDepth(6);
    this.infoText = this.add
      .text(0, 0, '', {
        color: '#0e1a26',
        fontSize: '16px',
        fontFamily: 'Trebuchet MS',
        align: 'left'
      })
      .setDepth(7);

    this.digSfx = this.sound.add('click', { volume: 0.45 });

    this.input.on('pointerdown', this.handlePointer, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.scale.on('resize', this.handleResize, this);

    this.handleResize(this.scale.gameSize);
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;
    const margin = Math.max(28, Math.min(width, height) * 0.04);
    const panelWidth = Math.round(width * 0.25);
    const panelX = width - panelWidth;
    const gridGap = Math.max(12, width * 0.02);

    const maxRadiusByWidth = Math.max(0, (panelX - gridGap - margin) / 2);
    const maxRadiusByHeight = Math.max(0, height * 0.5 - margin);
    this.maxRadius = Math.min(maxRadiusByWidth, maxRadiusByHeight);
    this.radialStep = this.maxRadius / this.ringCount;
    this.origin.set(margin + this.maxRadius, height * 0.5);

    this.bgGradient.clear();
    this.bgGradient.fillStyle(0xffffff, 1);
    this.bgGradient.fillRect(0, 0, width, height);

    this.renderInfoPanel(panelX, panelWidth, height, margin);
    this.drawGrid();
    this.updateExcavationMarkers();
  }

  private drawGrid() {
    this.grid.clear();
    this.clearGridLabels();

    if (this.maxRadius <= 0) {
      return;
    }

    const ringColors = [0x4a6b8a, 0x5d88a8, 0x74a1c2, 0x8db7d6, 0xa5cce6];
    for (let ring = 1; ring <= this.ringCount; ring += 1) {
      const radius = ring * this.radialStep;
      const color = ringColors[(ring - 1) % ringColors.length];
      this.grid.lineStyle(2, color, 0.8);
      this.grid.beginPath();
      this.grid.arc(this.origin.x, this.origin.y, radius, 0, Math.PI * 2, false);
      this.grid.strokePath();

      const labelOffset = Math.max(8, this.radialStep * 0.12);
      const fontSize = Math.max(12, Math.min(20, Math.round(this.radialStep * 0.28)));
      const label = this.add
        .text(this.origin.x + radius + labelOffset, this.origin.y, `${ring}`, {
          color: '#1f2b33',
          fontSize: `${fontSize}px`,
          fontFamily: 'Trebuchet MS'
        })
        .setOrigin(0, 0.5)
        .setDepth(3);
      this.gridLabels.push(label);
    }

    const axisColor = 0x1f2b33;
    this.grid.lineStyle(2, axisColor, 0.6);
    this.grid.beginPath();
    this.grid.moveTo(this.origin.x - this.maxRadius, this.origin.y);
    this.grid.lineTo(this.origin.x + this.maxRadius, this.origin.y);
    this.grid.strokePath();

    this.grid.beginPath();
    this.grid.moveTo(this.origin.x, this.origin.y - this.maxRadius);
    this.grid.lineTo(this.origin.x, this.origin.y + this.maxRadius);
    this.grid.strokePath();

    const majorAngles = [
      0,
      Math.PI / 4,
      Math.PI / 2,
      (3 * Math.PI) / 4,
      Math.PI,
      (5 * Math.PI) / 4,
      (3 * Math.PI) / 2,
      (7 * Math.PI) / 4
    ];
    this.grid.lineStyle(1, axisColor, 0.35);
    for (const angle of majorAngles) {
      const endX = this.origin.x + this.maxRadius * Math.cos(angle);
      const endY = this.origin.y - this.maxRadius * Math.sin(angle);
      this.grid.beginPath();
      this.grid.moveTo(this.origin.x, this.origin.y);
      this.grid.lineTo(endX, endY);
      this.grid.strokePath();
    }

    this.grid.fillStyle(axisColor, 0.7);
    this.grid.fillCircle(this.origin.x, this.origin.y, Math.max(2, this.radialStep * 0.05));
  }

  private clearGridLabels() {
    this.gridLabels.forEach((label) => label.destroy());
    this.gridLabels = [];
  }

  private renderInfoPanel(panelX: number, panelWidth: number, height: number, margin: number) {
    const panelPadding = Math.max(14, panelWidth * 0.12);
    this.panelLayout = { x: panelX, width: panelWidth, height, padding: panelPadding, margin };

    this.infoPanel.clear();
    this.infoPanel.fillStyle(0xf2f7fb, 0.94);
    this.infoPanel.fillRect(panelX, 0, panelWidth, height);
    this.infoPanel.lineStyle(2, 0x0b1114, 0.7);
    this.infoPanel.strokeRect(panelX + 1, 1, panelWidth - 2, height - 2);

    this.updateInfoText();
  }

  private handlePointer(pointer: Phaser.Input.Pointer) {
    const cell = this.pickCell(pointer);
    if (!cell) {
      return;
    }

    this.renderTarget(cell);
    this.excavateAt(cell);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    const cell = this.pickCell(pointer);
    if (!cell) {
      this.targetMarker.clear();
      return;
    }

    this.renderTarget(cell);
  }

  private pickCell(pointer: Phaser.Input.Pointer): PolarCell | null {
    if (this.maxRadius <= 0) {
      return null;
    }

    const dx = pointer.worldX - this.origin.x;
    const dy = this.origin.y - pointer.worldY;

    const radius = Math.hypot(dx, dy);
    if (radius > this.maxRadius) {
      return null;
    }

    let angle = Math.atan2(dy, dx);
    if (angle < 0) {
      angle += Math.PI * 2;
    }
    const radiusRatio = Phaser.Math.Clamp(radius / this.maxRadius, 0, 1);
    return { angle, radius, radiusRatio, x: pointer.worldX, y: pointer.worldY };
  }

  private renderTarget(cell: PolarCell) {
    const radius = Math.max(10, this.radialStep * 0.18);
    this.targetMarker.clear();
    this.targetMarker.lineStyle(2, 0xd7f0ff, 0.9);
    this.targetMarker.strokeCircle(cell.x, cell.y, radius);
    this.targetMarker.lineStyle(1, 0xffffff, 0.6);
    this.targetMarker.strokeCircle(cell.x, cell.y, radius * 0.45);
  }

  private excavateAt(cell: PolarCell) {
    this.digSfx?.play();
    this.animateCraneArm(cell);
  }

  private animateCraneArm(cell: PolarCell) {
    if (this.maxRadius <= 0) {
      return;
    }

    const arm = this.add.sprite(this.origin.x, this.origin.y, 'steel_arm');
    arm.setOrigin(0, 0.5);
    arm.setDepth(8);

    const baseWidth = arm.width;
    const baseHeight = arm.height;
    const thickness = Phaser.Math.Clamp(this.radialStep * 0.08, 4, 12);
    const scaleY = thickness / baseHeight;

    const startRatio = 1 / this.ringCount;
    const startLength = startRatio * this.maxRadius;
    const targetLength = cell.radiusRatio * this.maxRadius;

    const startScaleX = startLength / baseWidth;
    const targetScaleX = targetLength / baseWidth;

    arm.setRotation(0);
    arm.setScale(startScaleX, scaleY);

    const expandDuration = 180 + 280 * Math.min(1, Math.abs(targetScaleX - startScaleX));
    this.tweens.add({
      targets: arm,
      scaleX: targetScaleX,
      duration: expandDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        const rotationDuration = 220 + 700 * (cell.angle / (Math.PI * 2));
        this.tweens.add({
          targets: arm,
          rotation: -cell.angle,
          duration: rotationDuration,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            this.addExcavationMark(cell);
            this.tweens.add({
              targets: arm,
              alpha: 0,
              duration: 180,
              ease: 'Quad.easeOut',
              onComplete: () => arm.destroy()
            });
          }
        });
      }
    });
  }

  private addExcavationMark(cell: PolarCell) {
    const width = Phaser.Math.Clamp(this.radialStep * 0.32, 8, 24);
    const height = Phaser.Math.Clamp(this.radialStep * 0.22, 6, 18);
    const mark = this.add.ellipse(cell.x, cell.y, width, height, 0x93a9b8, 0.6);
    mark.setStrokeStyle(2, 0x5d6d79, 0.7);
    mark.setDepth(2.6);
    this.excavationId += 1;
    const radius = cell.radiusRatio * this.ringCount;
    this.excavations.push({
      id: this.excavationId,
      angle: cell.angle,
      radius,
      radiusRatio: cell.radiusRatio,
      marker: mark
    });
    this.updateInfoText();
  }

  private updateExcavationMarkers() {
    if (this.maxRadius <= 0) {
      return;
    }

    for (const excavation of this.excavations) {
      const { x, y } = this.polarToWorld(excavation.angle, excavation.radiusRatio);
      excavation.marker.setPosition(x, y);
    }
  }

  private polarToWorld(angle: number, radiusRatio: number) {
    const radius = radiusRatio * this.maxRadius;
    return {
      x: this.origin.x + radius * Math.cos(angle),
      y: this.origin.y - radius * Math.sin(angle)
    };
  }

  private updateInfoText() {
    const lines: string[] = ['Excavations (r in rings, theta in rad)'];

    if (this.excavations.length === 0) {
      lines.push('No digs yet.');
      lines.push('Click inside the grid to record r/theta.');
    } else {
      lines.push('');
      this.excavations.forEach((excavation, index) => {
        const theta = excavation.angle;
        const label = String(index + 1).padStart(2, '0');
        lines.push(
          `${label} r=${this.formatNumber(excavation.radius, 2)}, theta=${this.formatNumber(theta, 3)}rad`
        );
      });
    }

    this.infoText.setText(lines.join('\\n'));
    this.infoText.setPosition(this.panelLayout.x + this.panelLayout.padding, this.panelLayout.margin * 0.6);
    this.infoText.setWordWrapWidth(this.panelLayout.width - this.panelLayout.padding * 2);
  }

  private formatNumber(value: number, digits: number) {
    return value.toFixed(digits);
  }
}
