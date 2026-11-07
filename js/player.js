class Player {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3.2;
    this.friction = 0.82;
    this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false, W: false, A: false, S: false, D: false };

    this.initControls();
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = true;
        if (e.key.startsWith('Arrow')) e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = false;
      }
    });
  }

  update(mapGrid, tileSize) {
    let ax = 0;
    let ay = 0;

    if (this.keys.ArrowLeft || this.keys.a || this.keys.A) ax -= 1;
    if (this.keys.ArrowRight || this.keys.d || this.keys.D) ax += 1;
    if (this.keys.ArrowUp || this.keys.w || this.keys.W) ay -= 1;
    if (this.keys.ArrowDown || this.keys.s || this.keys.S) ay += 1;

    if (ax !== 0 && ay !== 0) {
      ax *= 0.7071;
      ay *= 0.7071;
    }

    this.vx = (this.vx + ax * this.speed * 0.35) * this.friction;
    this.vy = (this.vy + ay * this.speed * 0.35) * this.friction;

    this.moveAxis(this.vx, 0, mapGrid, tileSize);
    this.moveAxis(0, this.vy, mapGrid, tileSize);
  }

  moveAxis(dx, dy, mapGrid, tileSize) {
    const nextX = this.x + dx;
    const nextY = this.y + dy;

    if (!this.checkWallCollision(nextX, nextY, mapGrid, tileSize)) {
      this.x = nextX;
      this.y = nextY;
    }
  }

  checkWallCollision(x, y, mapGrid, tileSize) {
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
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💧", this.x, this.y);
    ctx.restore();
  }
}
