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
    faucets: [
      {x: 18, y: 1}, {x: 1, y: 11}, {x: 9, y: 11}, {x: 15, y: 11}
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
      "#.#.#.##.####.#.##.#",
      "#.#...#B..........F#",
      "#.#####.#####.###..#",
      "#.....#.....#......#",
      "#.###.#####.#.####.#",
      "#F..#.......#..F...#",
      "#...#..............#",
      "####################"
    ],
    faucets: [
      {x: 18, y: 1}, {x: 18, y: 7}, {x: 1, y: 11}, {x: 15, y: 11}
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
    faucets: [
      {x: 16, y: 1}, {x: 18, y: 7}, {x: 1, y: 11}, {x: 17, y: 11}
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

let map = [];
let player = {x: 1, y: 1};
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
  map = levels[index].map.map(row => row.split(""));
  hasWrench = false;
  faucetsClosed = 0;
  questionOpen = false;
  gameRunning = true;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === "P") {
        player = {x, y};
        map[y][x] = ".";
      }
      if (map[y][x] === "B") {
        box = {x, y};
        map[y][x] = ".";
      }
    }
  }

  faucets = levels[index].faucets.map(item => ({...item, closed: false}));
  phaseTitle.textContent = levels[index].name;
  gameMessage.textContent = "Encontre a caixa de vidro!";
  updateHud();
  draw();
}

function updateHud() {
  keyStatus.textContent = hasWrench ? "🔧 Chave: sim" : "🔒 Chave: não";
  faucetStatus.textContent = `🚰 ${faucetsClosed}/4`;
}

function isWall(x, y) {
  return x < 0 || y < 0 || x >= COLS || y >= ROWS || map[y][x] === "#";
}

function isNear(a, b, distance = 1) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= distance;
}

function movePlayer(dx, dy) {
  if (!gameRunning || questionOpen) return;

  const nextX = player.x + dx;
  const nextY = player.y + dy;

  if (isWall(nextX, nextY)) {
    gameMessage.textContent = "Você encontrou uma parede!";
    return;
  }

  player.x = nextX;
  player.y = nextY;

  // Interação ao encostar na caixa de vidro
  if (isNear(player, box, 1) && !hasWrench) {
    openQuestion();
    return;
  }

  // Interação ao encostar nas torneiras
  const faucet = faucets.find(f => !f.closed && isNear(player, f, 1));
  if (faucet) {
    if (!hasWrench) {
      gameMessage.textContent = "Você precisa da chave inglesa!";
    } else {
      faucet.closed = true;
      faucetsClosed++;
      gameMessage.textContent = "Torneira fechada! 💧";
      updateHud();

      if (faucetsClosed === 4) {
        gameMessage.textContent = "Todas as torneiras foram fechadas!";
        setTimeout(nextPhase, 700);
      }
    }
  }

  draw();
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
    questionOpen = false;
    showScreen("game");
    gameMessage.textContent = "Resposta correta! Você recebeu a chave inglesa. 🔧";
    updateHud();
    draw();
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * TILE;
      const py = y * TILE;

      ctx.fillStyle = (x + y) % 2 === 0 ? "#173d58" : "#14364e";
      ctx.fillRect(px, py, TILE, TILE);

      if (map[y][x] === "#") {
        ctx.fillStyle = "#8ba5b7";
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = "#506b80";
        ctx.fillRect(px + 6, py + 6, TILE - 12, 5);
        ctx.strokeStyle = "#c5d9e5";
        ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
      }
    }
  }

  drawBox();
  faucets.forEach(drawFaucet);
  drawPlayer();
}

function drawBox() {
  const px = box.x * TILE;
  const py = box.y * TILE;

  ctx.fillStyle = "rgba(63, 204, 255, 0.35)";
  ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);
  ctx.strokeStyle = "#a9f3ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);

  ctx.font = "23px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(hasWrench ? "🔧" : "🔒", px + TILE / 2, py + TILE / 2);
}

function drawFaucet(faucet) {
  const px = faucet.x * TILE;
  const py = faucet.y * TILE;

  ctx.font = "25px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(faucet.closed ? "✅" : "🚰", px + TILE / 2, py + TILE / 2);
}

function drawPlayer() {
  const px = player.x * TILE;
  const py = player.y * TILE;

  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🧍", px + TILE / 2, py + TILE / 2);
}

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
  faucetsClosed = 0;
  gameRunning = false;
  showScreen("menu");
  alert("Progresso reiniciado!");
});

document.addEventListener("keydown", event => {
  const keys = {
    ArrowUp: [0, -1],
    w: [0, -1],
    W: [0, -1],
    ArrowDown: [0, 1],
    s: [0, 1],
    S: [0, 1],
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    A: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0],
    D: [1, 0]
  };

  if (keys[event.key]) {
    event.preventDefault();
    movePlayer(...keys[event.key]);
  }
});

document.querySelectorAll("[data-move]").forEach(button => {
  button.addEventListener("click", () => {
    const moves = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0]
    };
    movePlayer(...moves[button.dataset.move]);
  });
});

showScreen("menu");
