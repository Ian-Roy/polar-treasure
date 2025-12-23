import Phaser from 'phaser';

type PolarCell = {
  angle: number;
  radius: number;
  x: number;
  y: number;
};

export class MainScene extends Phaser.Scene {
  private origin = new Phaser.Math.Vector2();
  private maxRadius = 0;
  private radialStep = 84;
  private angleStep = Phaser.Math.DegToRad(15);

  private bgGradient!: Phaser.GameObjects.Graphics;
  private snowBaseMap?: Phaser.Tilemaps.Tilemap;
  private snowBaseLayer?: Phaser.Tilemaps.TilemapLayer;
  private snowDecorMap?: Phaser.Tilemaps.Tilemap;
  private snowDecorLayer?: Phaser.Tilemaps.TilemapLayer;
  private snowSeed = 0;
  private snowBaseIndices = [1, 12, 13, 15, 16, 21, 23, 24];
  private snowForestIndices = [54, 55, 63, 64];
  private grid!: Phaser.GameObjects.Graphics;
  private targetMarker!: Phaser.GameObjects.Graphics;
  private excavations: Phaser.GameObjects.Ellipse[] = [];
  private infoPanel!: Phaser.GameObjects.Graphics;
  private infoText!: Phaser.GameObjects.Text;
  private digSfx?: Phaser.Sound.BaseSound;

  constructor() {
    super('main');
  }

  create() {
    this.bgGradient = this.add.graphics().setDepth(0);
    this.snowSeed = Math.floor(Math.random() * 1000000);

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
    this.radialStep = this.maxRadius / 5;
    this.origin.set(margin + this.maxRadius, height * 0.5);

    this.bgGradient.clear();
    this.bgGradient.fillGradientStyle(0xd9f1ff, 0xc6e5f7, 0xf4fbff, 0xd4edf9, 1);
    this.bgGradient.fillRect(0, 0, width, height);
    const gridBoxSize = this.maxRadius * 2;
    const gridLeft = this.origin.x - this.maxRadius;
    const gridTop = this.origin.y - this.maxRadius;
    this.buildSnowfield(gridLeft, gridTop, gridBoxSize, gridBoxSize);

    this.renderInfoPanel(panelX, panelWidth, height, margin);
    this.drawGrid();
  }

  private drawGrid() {
    this.grid.clear();

    if (this.maxRadius <= 0) {
      return;
    }

    this.grid.lineStyle(2, 0x5a6a73, 0.55);
    this.grid.beginPath();
    this.grid.moveTo(this.origin.x - this.maxRadius, this.origin.y);
    this.grid.lineTo(this.origin.x + this.maxRadius, this.origin.y);
    this.grid.strokePath();

    this.grid.beginPath();
    this.grid.moveTo(this.origin.x, this.origin.y - this.maxRadius);
    this.grid.lineTo(this.origin.x, this.origin.y + this.maxRadius);
    this.grid.strokePath();

    this.grid.lineStyle(1, 0x5a6a73, 0.28);
    for (let r = this.radialStep; r <= this.maxRadius; r += this.radialStep) {
      this.grid.beginPath();
      this.grid.arc(this.origin.x, this.origin.y, r, 0, Math.PI * 2, false);
      this.grid.strokePath();
    }

    for (let a = 0; a < Math.PI * 2 - 0.0001; a += this.angleStep) {
      const endX = this.origin.x + this.maxRadius * Math.cos(a);
      const endY = this.origin.y - this.maxRadius * Math.sin(a);
      this.grid.beginPath();
      this.grid.moveTo(this.origin.x, this.origin.y);
      this.grid.lineTo(endX, endY);
      this.grid.strokePath();
    }
  }

  private buildSnowfield(left: number, top: number, width: number, height: number) {
    this.snowBaseLayer?.destroy();
    this.snowBaseMap?.destroy();
    this.snowDecorLayer?.destroy();
    this.snowDecorMap?.destroy();

    const tileSize = 32;
    const cols = Math.max(1, Math.ceil(width / tileSize));
    const rows = Math.max(1, Math.ceil(height / tileSize));
    const rng = new Phaser.Math.RandomDataGenerator([`${this.snowSeed}`]);
    const forestChance = 0.06;

    const baseData: number[][] = [];
    const decorData: number[][] = [];
    for (let y = 0; y < rows; y += 1) {
      const baseRow: number[] = [];
      const decorRow: number[] = [];
      for (let x = 0; x < cols; x += 1) {
        baseRow.push(rng.pick(this.snowBaseIndices));
        if (rng.frac() < forestChance) {
          decorRow.push(rng.pick(this.snowForestIndices));
        } else {
          decorRow.push(-1);
        }
      }
      baseData.push(baseRow);
      decorData.push(decorRow);
    }

    const baseMap = this.make.tilemap({ data: baseData, tileWidth: tileSize, tileHeight: tileSize });
    const baseTileset = baseMap.addTilesetImage('snow_tiles', 'snow_tiles', tileSize, tileSize, 0, 0);
    if (!baseTileset) {
      return;
    }
    const baseLayer = baseMap.createLayer(0, baseTileset, left, top);
    baseLayer.setDepth(1);
    baseLayer.setAlpha(0.9);

    const decorMap = this.make.tilemap({ data: decorData, tileWidth: tileSize, tileHeight: tileSize });
    const decorTileset = decorMap.addTilesetImage('snow_tiles', 'snow_tiles', tileSize, tileSize, 0, 0);
    if (decorTileset) {
      const decorLayer = decorMap.createLayer(0, decorTileset, left, top);
      decorLayer.setDepth(1.4);
      decorLayer.setAlpha(0.95);
      this.snowDecorLayer = decorLayer;
      this.snowDecorMap = decorMap;
    }

    this.snowBaseMap = baseMap;
    this.snowBaseLayer = baseLayer;
  }

  private renderInfoPanel(panelX: number, panelWidth: number, height: number, margin: number) {
    const panelPadding = Math.max(14, panelWidth * 0.12);
    const text = [
      'ICE OPS',
      'Score: 1240',
      'Shots: 03',
      'Targets: 12',
      'Wind: 4 kt',
      'Temp: -26 C',
      'Range: 360 m'
    ].join('\\n');

    this.infoPanel.clear();
    this.infoPanel.fillStyle(0xf2f7fb, 0.94);
    this.infoPanel.fillRect(panelX, 0, panelWidth, height);
    this.infoPanel.lineStyle(2, 0x0b1114, 0.7);
    this.infoPanel.strokeRect(panelX + 1, 1, panelWidth - 2, height - 2);

    this.infoText.setText(text);
    this.infoText.setPosition(panelX + panelPadding, margin * 0.6);
    this.infoText.setWordWrapWidth(panelWidth - panelPadding * 2);
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
    return { angle, radius, x: pointer.worldX, y: pointer.worldY };
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
    const craneScale = Phaser.Math.Clamp(this.radialStep / 140, 0.35, 0.65);
    const crane = this.add.sprite(cell.x, 0, 'crane_arm');
    crane.setScale(craneScale);
    crane.setOrigin(0.91, 0.62);
    crane.setDepth(8);

    const startY = -crane.displayHeight;
    crane.setPosition(cell.x, startY);

    this.digSfx?.play();

    this.tweens.add({
      targets: crane,
      y: cell.y,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.addExcavationMark(cell.x, cell.y, crane.displayWidth * 0.18, crane.displayHeight * 0.14);
        this.tweens.add({
          targets: crane,
          y: startY,
          duration: 260,
          ease: 'Cubic.easeIn',
          delay: 140,
          onComplete: () => crane.destroy()
        });
      }
    });
  }

  private addExcavationMark(x: number, y: number, width: number, height: number) {
    const mark = this.add.ellipse(x, y, width, height, 0x93a9b8, 0.6);
    mark.setStrokeStyle(2, 0x5d6d79, 0.7);
    mark.setDepth(2.6);
    this.excavations.push(mark);
  }
}
