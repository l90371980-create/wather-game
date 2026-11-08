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
let collectedKeys = []; // Array com as chaves que o jogador já apanhou (ex: [1, 3])
let openedBoxes = [];   // IDs das caixas já abertas
let faucetsClosed = 0;
let questionOpen = false;
let gameRunning = false;
let activeQuestionBoxId = null; // Guarda qual caixa está a fazer a pergunta atual

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
    // 4 torneiras, cada uma com um ID único (1 a 4)
    faucets: [
      {x: 18, y: 1, id: 1, closed: false}, 
      {x: 1, y: 11, id: 2, closed: false}, 
      {x: 9, y: 11, id: 3, closed: false}, 
      {x: 15, y: 11, id: 4, closed: false}
    ],
    // 4 caixas espalhadas, cada uma dá uma chave com o ID correspondente
    boxes: [
      {x: 9, y: 6, id: 1},
      {x: 3, y: 3, id: 2},
      {x: 16, y: 9, id: 3},
      {x: 5, y: 8, id: 4}
    ],
    enemies: [
      {x: 8 * TILE + 20, y: 3 * TILE + 20, speed: 2},
      {x: 1 * TILE + 20, y: 12 * TILE + 20, speed: 2}
    ],
    questions: {
      1: {
        text: "Qual atitude ajuda a economizar água?",
        answers: ["A) Deixar a torneira aberta", "B) Fechar a torneira enquanto escova os dentes", "C) Lavar a calçada com mangueira"],
        correct: 1
      },
      2: {
        text: "O que devemos fazer ao ver um vazamento em casa?",
        answers: ["A) Ignorar", "B) Avisar um adulto ou consertar rapidamente", "C) Deixar pingando"],
        correct: 1
      },
      3: {
        text: "Qual destas opções gasta mais água no banho?",
        answers: ["A) Banho rápido de 5 minutos", "B) Banho muito demorado", "C) Fechar o chuveiro ao se ensaboar"],
        correct: 1
      },
      4: {
        text: "A água potável própria para consumo é um recurso...",
        answers: ["A) Infinito e inesgotável", "B) Limitado e que precisa de cuidados", "C) Desnecessário"],
        correct: 1
      }
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
      {x: 18, y: 1, id: 1, closed: false}, 
      {x: 18, y: 7, id: 2, closed: false}, 
      {x: 1, y: 11, id: 3, closed: false}, 
      {x: 15, y: 11, id: 4, closed: false}
    ],
    boxes: [
      {x: 7, y: 7, id: 1},
      {x: 4, y: 3, id: 2},
      {x: 12, y: 9, id: 3},
      {x: 16, y: 3, id: 4}
    ],
    enemies: [
      {x: 5 * TILE + 20, y: 9 * TILE + 20, speed: 2},
      {x: 13 * TILE + 20, y: 5 * TILE + 20, speed: 2.2},
      {x: 2 * TILE + 20, y: 3 * TILE + 20, speed: 2}
    ],
    questions: {
      1: {
        text: "Qual situação pode gastar muita água?",
        answers: ["A) Tomar um banho muito demorado", "B) Fechar a torneira ao ensaboar as mãos", "C) Consertar uma torneira com vazamento"],
        correct: 0
      },
      2: {
        text: "Como reutilizar a água da máquina de lavar?",
        answers: ["A) Jogar no lixo", "B) Lavar quintal ou calçada", "C) Beber diretamente"],
        correct: 1
      },
      3: {
        text: "O desperdício de água afeta:",
        answers: ["A) Apenas os animais marinhos", "B) Todo o planeta e a nossa sobrevivência", "C) Somente quem mora na praia"],
        correct: 1
      },
      4: {
        text: "Na limpeza de carros, o ideal é usar:",
        answers: ["A) Mangueira ligada o tempo todo", "B) Balde e pano", "C) Água da chuva sem tratamento se possível"],
        correct: 1
      }
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
      {x: 16, y: 1, id: 1, closed: false}, 
      {x: 18, y: 7, id: 2, closed: false}, 
      {x: 1, y: 11, id: 3, closed: false}, 
      {x: 17, y: 11, id: 4, closed: false}
    ],
    boxes: [
      {x: 6, y: 7, id: 1},
      {x: 3, y: 3, id: 2},
      {x: 13, y: 5, id: 3},
      {x: 10, y: 9, id: 4}
    ],
    enemies: [
      {x: 10 * TILE + 20, y: 3 * TILE + 20, speed: 2.2},
      {x: 12 * TILE + 20, y: 9 * TILE + 20, speed: 2.5},
      {x: 5 * TILE + 20, y: 12 * TILE + 20, speed: 2},
      {x: 16 * TILE + 20, y: 5 * TILE + 20, speed: 2.5}
    ],
    questions: {
      1: {
        text: "Por que devemos evitar o desperdício de água?",
        answers: ["A) Porque a água não tem utilidade", "B) Porque a água é um recurso importante e pode ser limitada", "C) Porque toda água é sempre infinita"],
        correct: 1
      },
      2: {
        text: "O que é captação de água da chuva?",
        answers: ["A) Armazenar água da chuva para usos secundários", "B) Beber água da chuva da rua", "C) Deixar panelas no quintal"],
        correct: 0
      },
      3: {
        text: "Qual atitude demonstra respeito ambiental?",
        answers: ["A) Poluir rios", "B) Fechar torneiras pingando e relatar vazamentos", "C) Deixar luzes e torneiras ligadas"],
        correct: 1
      },
      4: {
        text: "Qual percentual aproximado da superfície da Terra é coberto por água?",
        answers: ["A) Cerca de 71%", "B) Apenas 10%", "C) 100%"],
        correct: 0
      }
    }
  }
];

let mapGrid = [];
let playerObj;
let particleSys = new ParticleSystem();
let enemiesArr = [];
let faucets = [];
let boxes = [];

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
  collectedKeys = [];
  openedBoxes = [];
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
      // Remove o 'B' estático do mapa se houver, pois usamos o array de boxes
      if (mapGrid[y][x] === "B") {
        mapGrid[y][x] = ".";
      }
    }
  }

  playerObj = new Player(startPx, startPy, 14);
  faucets = levels[index].faucets.map(item => ({...item}));
  boxes = levels[index].boxes.map(item => ({...item}));
  enemiesArr = levels[index].enemies.map(e => new AutonomousEnemy(e.x, e.y, 14, e.speed));

  phaseTitle.textContent = levels[index].name;
  gameMessage.textContent = "Explore o labirinto e ache as caixas de vidro!";
  updateHud();
}

function updateHud() {
  keyStatus.textContent = `🔧 Chaves: ${collectedKeys.length}/4`;
  faucetStatus.textContent = `🚰 ${faucetsClosed}/4`;
}

function openQuestion(boxId) {
  activeQuestionBoxId = boxId;
  questionOpen = true;
  showScreen("question");
  const q = levels[currentPhase].questions[boxId];
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
  const q = levels[currentPhase].questions[activeQuestionBoxId];

  if (index === q.correct) {
    if (!collectedKeys.includes(activeQuestionBoxId)) {
      collectedKeys.push(activeQuestionBoxId);
    }
    if (!openedBoxes.includes(activeQuestionBoxId)) {
      openedBoxes.push(activeQuestionBoxId);
    }
    questionOpen = false;
    showScreen("game");
    gameMessage.textContent = `Resposta correta! Encontraste uma chave secreta 🔧 (${collectedKeys.length}/4)`;
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

function gameLoop() {
  if (gameRunning && !questionOpen) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenhar Labirinto
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

    // 2. Elementos Interativos (Caixas e Torneiras)
    boxes.forEach(b => {
      if (!openedBoxes.includes(b.id)) drawBox(b);
    });
    faucets.forEach(drawFaucet);

    // 3. Atualizar e Desenhar Jogador
    playerObj.update(mapGrid, TILE);
    playerObj.draw(ctx);

    // 4. Oponentes Autónomos
    for (const enemy of enemiesArr) {
      enemy.update(mapGrid, TILE);
      enemy.draw(ctx);

      const dist = Math.hypot(enemy.x - playerObj.x, enemy.y - playerObj.y);
      if (dist < enemy.radius + playerObj.radius) {
        gameMessage.textContent = "Cuidado! O monstro de sujeira te pegou! Reiniciando fase...";
        particleSys.spawn(playerObj.x, playerObj.y, '#ef4444', 20);
        playerObj.x = 1 * TILE + 20;
        playerObj.y = 1 * TILE + 20;
      }
    }

    // 5. Interações (Caixas e Torneiras com Chaves Ocultas)
    checkInteractions();

    // 6. Partículas
    particleSys.update();
    particleSys.draw(ctx);
  }

  requestAnimationFrame(gameLoop);
}

function checkInteractions() {
  const pCol = Math.floor(playerObj.x / TILE);
  const pRow = Math.floor(playerObj.y / TILE);

  // Verificar colisão com caixas de vidro
  boxes.forEach(b => {
    if (!openedBoxes.includes(b.id) && Math.abs(pCol - b.x) <= 1 && Math.abs(pRow - b.y) <= 1) {
      openQuestion(b.id);
      return;
    }
  });

  // Verificar colisão com torneiras
  faucets.forEach(f => {
    if (!f.closed && Math.abs(pCol - f.x) <= 1 && Math.abs(pRow - f.y) <= 1) {
      // O jogador tenta usar uma chave correspondente ao ID da torneira
      if (collectedKeys.includes(f.id)) {
        f.closed = true;
        faucetsClosed++;
        particleSys.spawn(f.x * TILE + 20, f.y * TILE + 20, '#06b6d4', 20);
        gameMessage.textContent = "Correto! Esta chave abriu a torneira! 💧";
        updateHud();

        if (faucetsClosed === 4) {
          gameMessage.textContent = "Todas as torneiras foram fechadas!";
          setTimeout(nextPhase, 800);
        }
      } else {
        // Mensagem sem dar indicação direta de qual chave abre qual, mantendo o mistério
        gameMessage.textContent = "Nenhuma das tuas chaves atuais abre esta torneira! Procura outra caixa.";
      }
    }
  });
}

function drawBox(b) {
  const px = b.x * TILE;
  const py = b.y * TILE;

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
  collectedKeys = [];
  openedBoxes = [];
  faucetsClosed = 0;
  gameRunning = false;
  showScreen("menu");
  alert("Progresso reiniciado!");
});

// Controles Táteis / Mobile
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
