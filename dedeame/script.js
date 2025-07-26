const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelDisplay = document.getElementById('levelDisplay');
const messageDisplay = document.getElementById('messageDisplay');
const backgroundMusic = document.getElementById('backgroundMusic');

// Referencias a los nuevos botones
const startButton = document.getElementById('startButton');
const nextLevelButton = document.getElementById('nextLevelButton');

// Jugador (hincha de Boca)
let player = {
    x: 50,
    y: 500,
    width: 50,
    height: 50,
    speed: 5
};
let score = 0;
let currentLevel = 1;
let chats = [];
let timeLeft = 30; // Duración de cada nivel
let gameActive = false; // El juego empieza inactivo hasta que se presione "Empezar"
let keys = {};
let playerHitByChat = false; // Nueva variable para rastrear si el jugador ha sido golpeado en el nivel actual
let currentRetryLevel = 1; // Para guardar el nivel al que el botón de reintentar debe llevar

let backgrounds = [
    'img/bombonera_entrada.jpg',
    'img/bombonera_interior.jpg',
    'img/bombonera_palco.jpg'
];

// Imágenes con verificación de carga
const playerImg = new Image();
const chatImg = new Image();
let imagesLoaded = 0;
const totalImages = 2;

function loadImage(img, src) {
    return new Promise((resolve) => {
        img.onload = () => {
            imagesLoaded++;
            resolve();
        };
        img.onerror = () => {
            console.error(`Error cargando ${src}. Asegúrate de que la ruta sea correcta.`);
            imagesLoaded++;
            resolve();
        };
        img.src = src;
    });
}

// Cargar todas las imágenes antes de iniciar el juego
Promise.all([
    loadImage(playerImg, 'img/hincha.png'),
    loadImage(chatImg, 'img/whatsapp.png')
]).then(() => {
    if (imagesLoaded === totalImages) {
        setupInitialState();
        gameLoop();
    }
});

const levelConfig = {
    1: { chatSpeed: 3, chatSpawnRate: 0.02, targetScore: 30 },
    2: { chatSpeed: 4, chatSpawnRate: 0.03, targetScore: 60 },
    3: { chatSpeed: 5, chatSpawnRate: 0.04, targetScore: 100 }
};

function setBackground(level) {
    canvas.style.backgroundImage = `url('${backgrounds[level - 1]}')`;
    levelDisplay.textContent = `Nivel: ${level}`;
}

function playBackgroundMusic() {
    backgroundMusic.volume = 0.1; // Ajusta el volumen aquí (0.0 a 1.0)
    const playPromise = backgroundMusic.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // La reproducción comenzó correctamente
        })
        .catch(error => {
            console.warn("La música de fondo no pudo reproducirse automáticamente:", error);
        });
    }
}

function pauseBackgroundMusic() {
    backgroundMusic.pause();
    // backgroundMusic.currentTime = 0; // Opcional: reinicia la canción al pausar
}

function showMessage(message, duration = 2000, callback = null) {
    gameActive = false;
    pauseBackgroundMusic(); // Pausa la música mientras se muestra el mensaje

    messageDisplay.textContent = message;
    messageDisplay.style.display = 'block';
    setTimeout(() => {
        messageDisplay.style.display = 'none';
        if (callback) callback();
    }, duration);
}

function setupInitialState() {
    setBackground(currentLevel);
    levelDisplay.textContent = `Nivel: ${currentLevel}`;
    score = 0;
    chats = [];
    playerHitByChat = false;
    gameActive = false;

    // Control de visibilidad y estado de los botones usando clases CSS
    startButton.classList.add('visible');
    startButton.classList.remove('hidden');
    startButton.textContent = "Empezar a Jugar";
    startButton.disabled = false;

    nextLevelButton.classList.add('hidden');
    nextLevelButton.classList.remove('visible');
    nextLevelButton.disabled = true;

    messageDisplay.style.display = 'none';

    player.x = 50;
    player.y = 500;

    pauseBackgroundMusic(); // Asegura que la música esté pausada al inicio
}

function startGame() {
    startButton.classList.add('hidden');
    startButton.classList.remove('visible');
    startButton.disabled = true;

    nextLevelButton.classList.add('hidden');
    nextLevelButton.classList.remove('visible');
    nextLevelButton.disabled = true;

    playBackgroundMusic(); // Reproduce la música al iniciar el juego
    startLevel(currentLevel);
}

function startLevel(level) {
    gameActive = false;
    score = (level === 1) ? 0 : score;
    timeLeft = 30;
    chats = [];
    player.x = 50;
    player.y = 500;
    playerHitByChat = false;
    setBackground(level);

    showMessage(`¡Nivel ${level}: ${level === 1 ? 'Entrada' : level === 2 ? 'Oficina' : 'Palco'}!`, 2000, () => {
        gameActive = true;
        startButton.classList.add('hidden');
        startButton.classList.remove('visible');
        startButton.disabled = true;

        nextLevelButton.classList.add('hidden');
        nextLevelButton.classList.remove('visible');
        nextLevelButton.disabled = true;
        
        playBackgroundMusic(); // Reanuda la música una vez que el mensaje de nivel desaparece
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (playerImg.complete && playerImg.naturalWidth > 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    if (gameActive) {
        const config = levelConfig[currentLevel]; 

        updatePlayerPosition();

        if (Math.random() < config.chatSpawnRate) {
            chats.push({ x: canvas.width, y: Math.random() * (canvas.height - 40), width: 40, height: 40 });
        }

        chats.forEach((chat, index) => {
            chat.x -= config.chatSpeed;
            if (chatImg.complete && chatImg.naturalWidth > 0) {
                ctx.drawImage(chatImg, chat.x, chat.y, chat.width, chat.height);
            } else {
                ctx.fillStyle = 'green';
                ctx.fillRect(chat.x, chat.y, chat.width, chat.height);
            }

            if (
                player.x < chat.x + chat.width &&
                player.x + player.width > chat.x &&
                player.y < chat.y + chat.height &&
                player.y + player.height > chat.y
            ) {
                gameActive = false; 
                pauseBackgroundMusic(); 
                currentRetryLevel = currentLevel; 
                showMessage('¡Dedeado por Chanchi!', 1000, () => {
                    startButton.textContent = `Reintentar Nivel ${currentRetryLevel}`;
                    startButton.classList.add('visible');
                    startButton.classList.remove('hidden');
                    startButton.disabled = false; 

                    nextLevelButton.classList.add('hidden');
                    nextLevelButton.classList.remove('visible');
                    nextLevelButton.disabled = true; 
                });
                score -= 10; 
                chats.splice(index, 1); 
                return; 
            }

            if (chat.x + chat.width < 0) {
                chats.splice(index, 1);
            }
        });

        if (gameActive) { 
            timeLeft -= 1 / 60;
            if (timeLeft <= 0) {
                gameActive = false; 
                pauseBackgroundMusic();

                const config = levelConfig[currentLevel]; 
                
                if (!(score >= config.targetScore || !playerHitByChat)) {
                    showMessage('¡Tiempo agotado! Perdiste.', 2000, () => {
                        currentRetryLevel = currentLevel; 
                        startButton.textContent = `Reintentar Nivel ${currentRetryLevel}`; 
                        startButton.classList.add('visible');
                        startButton.classList.remove('hidden');
                        startButton.disabled = false; 

                        nextLevelButton.classList.add('hidden');
                        nextLevelButton.classList.remove('visible');
                        nextLevelButton.disabled = true; 
                    });
                } else {
                    if (currentLevel < 3) { 
                        showMessage(`¡Nivel ${currentLevel} completado!`, 2000, () => {
                            nextLevelButton.classList.add('visible');
                            nextLevelButton.classList.remove('hidden');
                            nextLevelButton.disabled = false; 

                            startButton.classList.add('hidden');
                            startButton.classList.remove('visible');
                            startButton.disabled = true; 
                        });
                    } else { 
                        showMessage('¡Ganaste, bostero! ¡Aguante Boca!', 2000, resetGame);
                    }
                }
            }
        }

        if (gameActive) { 
            const config = levelConfig[currentLevel];
            if (score >= config.targetScore && currentLevel < 3 && timeLeft > 0) {
                gameActive = false; 
                pauseBackgroundMusic(); 
                showMessage(`¡Nivel ${currentLevel} completado!`, 2000, () => {
                    nextLevelButton.classList.add('visible');
                    nextLevelButton.classList.remove('hidden');
                    nextLevelButton.disabled = false; 

                    startButton.classList.add('hidden');
                    startButton.classList.remove('visible');
                    startButton.disabled = true; 
                });
            } else if (score >= config.targetScore && currentLevel === 3 && timeLeft > 0) {
                gameActive = false;
                pauseBackgroundMusic(); 
                showMessage('¡Ganaste, bostero! ¡Aguante Boca!', 2000, resetGame);
            }
        }
    }

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Pasión: ' + score, 10, 30);
    ctx.fillText('Tiempo: ' + Math.ceil(timeLeft), 10, 60);

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function updatePlayerPosition() {
    let dx = 0, dy = 0;
    if (keys['ArrowUp']) dy -= player.speed;
    if (keys['ArrowDown']) dy += player.speed;
    if (keys['ArrowLeft']) dx -= player.speed;
    if (keys['ArrowRight']) dx += player.speed;

    const speedMagnitude = Math.sqrt(dx * dx + dy * dy);
    if (speedMagnitude > 0) {
        player.x += (dx / speedMagnitude) * player.speed;
        player.y += (dy / speedMagnitude) * player.speed;
    }

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function resetGame() {
    currentLevel = 1; 
    score = 0;
    player.x = 50;
    player.y = 500;
    chats = []; 
    timeLeft = 30; 
    playerHitByChat = false;
    currentRetryLevel = 1; 
    startButton.textContent = "Empezar a Jugar"; 
    startButton.disabled = false; 

    // Aquí también usamos las clases para asegurar que esté visible
    startButton.classList.add('visible');
    startButton.classList.remove('hidden');

    nextLevelButton.classList.add('hidden'); 
    nextLevelButton.classList.remove('visible');
    nextLevelButton.disabled = true; 
    
    setupInitialState(); 
    pauseBackgroundMusic(); 
}

// --- Event Listeners para los botones ---
startButton.addEventListener('click', () => {
    currentLevel = currentRetryLevel; 
    currentRetryLevel = 1; 
    startGame(); 
});

nextLevelButton.addEventListener('click', () => {
    nextLevelButton.disabled = true; 

    if (currentLevel === 1) { 
        currentLevel = 2;
        startLevel(currentLevel);
    } else if (currentLevel === 2) { 
        currentLevel = 3;
        startLevel(currentLevel);
    }
});