const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const screens = {
  menu: document.getElementById("menuScreen"),
  how: document.getElementById("howScreen"),
  game: document.getElementById("gameScreen"),
  question: document.getElementById("questionScreen"),
  win: document.getElementById("winScreen")
};

const phaseTitle = document.getElementById("phaseTitle");
const keyStatus = document.getElementById("keyStatus");
const faucetStatus = document.getElementById("faucetStatus");
const gameMessage = document.getElementById("gameMessage");
const questionText = document.getElementById("questionText");
const answersBox = document.getElementById("answers");
const answerFeedback = document.getElementById("answerFeedback");

const TILE = 40;
const COLS = 20;
const ROWS = 14;

let currentPhase = 0;
let hasWrench = false;
let boxOpened = false;
let faucetsClosed = 0;
let questionOpen = false;
let gameRunning = false;

const levels = [
  {
    name: "FASE 1 — O DESPERDÍCIO",
    map: [
      "####################",
      "#P....#...........F#",
      "#.##..#.#######.##.#",
      "#....##.....#.....#",
      "####.#####..#.###.#",
      "#....#...#......#.#",
      "#.##.#.B........#.#",
      "#.#..#...#.####.#.#",
      "#.#.########.#.#..#",
      "#...#......#.#.##.#",
      "#.###.####.#.#....#",
      "#F.......F.#...F..#",
      "#................##",
      "####################"
    ],
    faucets: [{x: 18, y: 1}, {x: 1, y: 11}, {x: 9, y: 11}, {x: 15, y: 11}],
    enemies: [
      {x: 8 * TILE + 20, y: 3 * TILE + 20, speed: 2},
      {x: 1 * TILE + 20, y: 12 * TILE + 20, speed: 2}
    ],
    question: {
      text: "Qual atitude ajuda a economizar água?",
      answers: [
        "A) Deixar a torneira aberta",
        "B) Fechar a torneira enquanto escova os dentes",
        "C) Lavar a calçada com mangueira"
      ],
      correct: 1
    }
  },
  {
    name: "FASE 2 — A CIDADE",
    map: [
      "####################",
      "#P....#......#....F#",
      "#.##.##.####.#.##..#",
      "#....#...#....#....#",
      "###.##.#.#.######.##",
      "#...#..#.#....#....#",
      "#.#.#.##.####.#.FH.#",
      "#.#...#B..........F#",
      "#.#####.#####.###..#",
      "#.....#.....#......#",
      "#.###.#####.#.####.#",
      "#F..#.......#..F...#",
      "#...#..............#",
      "####################"
    ],
    faucets: [{x: 18, y: 1}, {x: 18, y: 7}, {x: 1, y: 11}, {x: 15, y: 11}],
    enemies: [
      {x: 5 * TILE + 20, y: 9 * TILE + 20, speed: 2},
      {x: 13 * TILE + 20, y: 5 * TILE + 20, speed: 2.2},
      {x: 2 * TILE + 20, y: 3 * TILE + 20, speed: 2}
    ],
    question: {
      text: "Qual situação pode gastar muita água?",
      answers: [
        "A) Tomar um banho muito demorado",
        "B) Fechar a torneira ao ensaboar as mãos",
        "C) Consertar uma torneira com vazamento"
      ],
      correct: 0
    }
  },
  {
    name: "FASE 3 — A ÚLTIMA GOTA",
    map: [
      "####################",
      "#P...#...........F.#",
      "#.##.#.###########.#",
      "#....#.....#.......#",
      "####.#####.#.#######",
      "#....#...#.#.......#",
      "#.##.#...#.#####.#.#",
      "#.#..B.........#.#F#",
      "#.#.####.#####.#.#.#",
      "#...#....#...#...#.#",
      "###.#.####.#.#####.#",
      "#F..#......#.....F.#",
      "#..................#",
      "####################"
    ],
    faucets: [{x: 16, y: 1}, {x: 18, y: 7}, {x: 1, y: 11}, {x: 17, y: 11}],
    enemies: [
      {x: 10 * TILE + 20, y: 3 * TILE + 20, speed: 2.2},
      {x: 12 * TILE + 20, y: 9 * TILE + 20, speed: 2.5},
      {x: 5 * TILE + 20, y: 12 * TILE + 20, speed: 2},
      {x: 16 * TILE + 20, y: 5 * TILE + 20, speed: 2.5}
    ],
    question: {
      text: "Por que devemos evitar o desperdício de água?",
      answers: [
        "A) Porque a água não tem utilidade",
        "B) Porque a água é um recurso importante e pode ser limitada",
        "C) Porque toda água é sempre infinita"
      ],
      correct: 1
    }
  }
];

let mapGrid = [];
let playerObj;
let particleSys = new ParticleSystem();
let enemiesArr = [];
let box = {x: 0, y: 0};
let faucets = [];

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function startGame() {
  currentPhase = 0;
  loadPhase(currentPhase);
  showScreen("game");
}

function loadPhase(index) {
  currentPhase = index;
  mapGrid = levels[index].map.map(row => row.split(""));
  hasWrench = false;
  boxOpened = false;
  faucetsClosed = 0;
  questionOpen = false;
  gameRunning = true;

  let startPx = 1 * TILE + 20;
  let startPy = 1 * TILE + 20;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (mapGrid[y][x] === "P") {
        startPx = x * TILE + 20;
        startPy = y * TILE + 20;
        mapGrid[y][x] = ".";
      }
      if (mapGrid[y][x] === "B") {
        box = {x, y};
        mapGrid[y][x] = ".";
      }
    }
  }

  playerObj = new Player(startPx, startPy, 14);
  faucets = levels[index].faucets.map(item => ({...item, closed: false}));
  enemiesArr = levels[index].enemies.map(e => new AutonomousEnemy(e.x, e.y, 14, e.speed));

  phaseTitle.textContent = levels[index].name;
  gameMessage.textContent = "Encontre a caixa de vidro!";
  updateHud();
}

function updateHud() {
  keyStatus.textContent = hasWrench ? "🔧 Chave: sim" : "🔒 Chave: não";
  faucetStatus.textContent = `🚰 ${faucetsClosed}/4`;
}

function openQuestion() {
  questionOpen = true;
  showScreen("question");
  const q = levels[currentPhase].question;
  questionText.textContent = q.text;
  answersBox.innerHTML = "";
  answerFeedback.textContent = "";

  q.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.textContent = answer;
    button.addEventListener("click", () => answerQuestion(index));
    answersBox.appendChild(button);
  });
}

function answerQuestion(index) {
  const q = levels[currentPhase].question;

  if (index === q.correct) {
    hasWrench = true;
    boxOpened = true;
    questionOpen = false;
    showScreen("game");
    gameMessage.textContent = "Resposta correta! Você recebeu a chave inglesa. 🔧";
    particleSys.spawn(playerObj.x, playerObj.y, '#f59e0b', 25);
    updateHud();
  } else {
    answerFeedback.textContent = "Resposta incorreta. Tente novamente!";
    answerFeedback.style.color = "#ff9b9b";
  }
}

function nextPhase() {
  if (currentPhase < levels.length - 1) {
    loadPhase(currentPhase + 1);
  } else {
    gameRunning = false;
    showScreen("win");
  }
}

// Loop de Animação e Renderização em Tempo Real (60 FPS)
function gameLoop() {
  if (gameRunning && !questionOpen) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha Labirinto
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x * TILE;
        const py = y * TILE;

        ctx.fillStyle = (x + y) % 2 === 0 ? "#0f172a" : "#1e293b";
        ctx.fillRect(px, py, TILE, TILE);

        if (mapGrid[y][x] === "#") {
          ctx.fillStyle = "#334155";
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
        }
      }
    }

    // 2. Elementos Interativos
    if (!boxOpened) drawBox();
    faucets.forEach(drawFaucet);

    // 3. Atualizar e Desenhar Jogador
    playerObj.update(mapGrid, TILE);
    playerObj.draw(ctx);

    // 4. Atualizar e Desenhar Oponentes Autónomos
    for (const enemy of enemiesArr) {
      enemy.update(mapGrid, TILE);
      enemy.draw(ctx);

      // Colisão contínua com o jogador
      const dist = Math.hypot(enemy.x - playerObj.x, enemy.y - playerObj.y);
      if (dist < enemy.radius + playerObj.radius) {
        gameMessage.textContent = "Cuidado! O monstro de sujeira te pegou! Reiniciando fase...";
        particleSys.spawn(playerObj.x, playerObj.y, '#ef4444', 20);
        playerObj.x = 1 * TILE + 20;
        playerObj.y = 1 * TILE + 20;
      }
    }

    // 5. Interações com Caixa e Torneiras
    checkInteractions();

    // 6. Atualizar Partículas
    particleSys.update();
    particleSys.draw(ctx);
  }

  requestAnimationFrame(gameLoop);
}

function checkInteractions() {
  const pCol = Math.floor(playerObj.x / TILE);
  const pRow = Math.floor(playerObj.y / TILE);

  // Caixa de pergunta
  if (!boxOpened && Math.abs(pCol - box.x) <= 1 && Math.abs(pRow - box.y) <= 1 && !hasWrench) {
    openQuestion();
    return;
  }

  // Torneiras
  faucets.forEach(f => {
    if (!f.closed && Math.abs(pCol - f.x) <= 1 && Math.abs(pRow - f.y) <= 1) {
      if (!hasWrench) {
        gameMessage.textContent = "Você precisa da chave inglesa!";
      } else {
        f.closed = true;
        faucetsClosed++;
        particleSys.spawn(f.x * TILE + 20, f.y * TILE + 20, '#06b6d4', 20);
        gameMessage.textContent = "Torneira fechada! 💧";
        updateHud();

        if (faucetsClosed === 4) {
          gameMessage.textContent = "Todas as torneiras foram fechadas!";
          setTimeout(nextPhase, 800);
        }
      }
    }
  });
}

function drawBox() {
  const px = box.x * TILE;
  const py = box.y * TILE;

  ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
  ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);

  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔒", px + TILE / 2, py + TILE / 2);
}

function drawFaucet(faucet) {
  const px = faucet.x * TILE;
  const py = faucet.y * TILE;

  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(faucet.closed ? "✅" : "🚰", px + TILE / 2, py + TILE / 2);
}

// Event Listeners
document.getElementById("playBtn").addEventListener("click", startGame);
document.getElementById("howBtn").addEventListener("click", () => showScreen("how"));
document.getElementById("backFromHowBtn").addEventListener("click", () => showScreen("menu"));
document.getElementById("pauseBtn").addEventListener("click", () => {
  gameRunning = false;
  showScreen("menu");
});
document.getElementById("againBtn").addEventListener("click", startGame);
document.getElementById("menuFromWinBtn").addEventListener("click", () => showScreen("menu"));

document.getElementById("resetBtn").addEventListener("click", () => {
  currentPhase = 0;
  hasWrench = false;
  boxOpened = false;
  faucetsClosed = 0;
  gameRunning = false;
  showScreen("menu");
  alert("Progresso reiniciado!");
});

// Suporte a botões touch/mobile
document.querySelectorAll("[data-move]").forEach(button => {
  const dir = button.dataset.move;
  button.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (dir === 'up') playerObj.keys.ArrowUp = true;
    if (dir === 'down') playerObj.keys.ArrowDown = true;
    if (dir === 'left') playerObj.keys.ArrowLeft = true;
    if (dir === 'right') playerObj.keys.ArrowRight = true;
  });
  button.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (dir === 'up') playerObj.keys.ArrowUp = false;
    if (dir === 'down') playerObj.keys.ArrowDown = false;
    if (dir === 'left') playerObj.keys.ArrowLeft = false;
    if (dir === 'right') playerObj.keys.ArrowRight = false;
  });
});

showScreen("menu");
requestAnimationFrame(gameLoop);
