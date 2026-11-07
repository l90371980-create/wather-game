class AutonomousEnemy {
  constructor(x, y, radius, speed = 1.8) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];
    this.currentDir = this.directions[Math.floor(Math.random() * this.directions.length)];
    this.pulseAngle = 0;
  }

  update(mapGrid, tileSize) {
    this.pulseAngle += 0.08;

    const nextX = this.x + this.currentDir.x * this.speed;
    const nextY = this.y + this.currentDir.y * this.speed;

    if (this.checkCollision(nextX, nextY, mapGrid, tileSize)) {
      this.changeDirection(mapGrid, tileSize);
    } else {
      this.x = nextX;
      this.y = nextY;

      if (Math.random() < 0.015) {
        this.changeDirection(mapGrid, tileSize);
      }
    }
  }

  changeDirection(mapGrid, tileSize) {
    const validDirs = [];

    for (const dir of this.directions) {
      const testX = this.x + dir.x * (tileSize / 2);
      const testY = this.y + dir.y * (tileSize / 2);
      if (!this.checkCollision(testX, testY, mapGrid, tileSize)) {
        validDirs.push(dir);
      }
    }

    if (validDirs.length > 0) {
      this.currentDir = validDirs[Math.floor(Math.random() * validDirs.length)];
    }
  }

  checkCollision(x, y, mapGrid, tileSize) {
    const points = [
      { x: x - this.radius, y: y - this.radius },
      { x: x + this.radius, y: y - this.radius },
      { x: x - this.radius, y: y + this.radius },
      { x: x + this.radius, y: y + this.radius }
    ];

    for (const pt of points) {
      const col = Math.floor(pt.x / tileSize);
      const row = Math.floor(pt.y / tileSize);
      if (mapGrid[row] && mapGrid[row][col] === "#") {
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    const currentRadius = this.radius + Math.sin(this.pulseAngle) * 1.5;

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👾", this.x, this.y);
    ctx.restore();
  }
}
