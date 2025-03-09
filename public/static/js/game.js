// The Game of Zev - A twisted Tetris game

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece-canvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');

// Game constants
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = canvas.width / GRID_WIDTH;
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF', // Z
    '#FF00FF'  // Special
];

// Twisted game elements
const TWISTED_EFFECTS = [
    "gravity_flip",
    "drunk_controls",
    "piece_transform",
    "board_shake",
    "mystery_block",
    "ghost_piece",
    "speed_change",
    "block_vanish",
    "piece_explosion",
    "mirror_world",
    "dance_party",
    "size_change",
    "rainbow_mode",      // New: Pieces change colors
    "multiplier",        // New: Temporary score multiplier
    "crazy_rotation",    // New: Pieces rotate randomly
    "bouncy_blocks",      // New: Pieces bounce off walls
    "time_dilation",      // Time warps and slows/speeds randomly
    "fractal_trails",     // Pieces leave fractal patterns
    "dimension_shift",    // Pieces appear to rotate in 3D
    "kaleidoscope",       // Mirror effects multiply pieces
    "color_synesthesia",  // Colors respond to piece movement
    "reality_glitch",     // Visual glitches and artifacts
    "quantum_pieces",     // Pieces exist in multiple states
    "void_portals"        // Black holes that transport pieces
];

// Funny messages for events
const FUNNY_MESSAGES = [
    "Oops! Gravity took a vacation!",
    "Had one too many, eh?",
    "Surprise makeover!",
    "Earthquake mode activated!",
    "What's in the mystery box?",
    "Now you see me...",
    "Slow down...or speed up?",
    "Magic trick: disappearing blocks!",
    "BOOM! Pieces everywhere!",
    "Through the looking glass...",
    "Dance party time!",
    "Honey, I shrunk the pieces!",
    "RAINBOW POWER!",
    "DOUBLE POINTS TIME!",
    "You spin me right round...",
    "Boing! Boing! Boing!",
    "Time is melting...",
    "Fractals everywhere!",
    "Welcome to the 4th dimension!",
    "Through the kaleidoscope...",
    "Colors are alive!",
    "Reality is breaking!",
    "Quantum superposition activated!",
    "Portal to the void opened!"
];

// Sound effects
const SOUNDS = {
    move: new Audio('/static/sounds/move.mp3'),
    rotate: new Audio('/static/sounds/rotate.mp3'),
    drop: new Audio('/static/sounds/drop.mp3'),
    clear: new Audio('/static/sounds/clear.mp3'),
    gameOver: new Audio('/static/sounds/gameOver.mp3'),
    twist: new Audio('/static/sounds/twist.mp3'),
    levelUp: new Audio('/static/sounds/levelUp.mp3')
};

// Web Audio API setup
let audioContext;
let bgMusicNode = null;
let nextNoteTime = 0;
let musicSchedulerTimer = null;
let currentMusicNote = 0;

// Tetris theme notes and timing
const TETRIS_MELODY = [
    {note: 'E5', duration: 0.25}, {note: 'B4', duration: 0.125}, {note: 'C5', duration: 0.125}, 
    {note: 'D5', duration: 0.25}, {note: 'C5', duration: 0.125}, {note: 'B4', duration: 0.125},
    {note: 'A4', duration: 0.25}, {note: 'A4', duration: 0.125}, {note: 'C5', duration: 0.125}, 
    {note: 'E5', duration: 0.25}, {note: 'D5', duration: 0.125}, {note: 'C5', duration: 0.125},
    {note: 'B4', duration: 0.375}, {note: 'C5', duration: 0.125}, {note: 'D5', duration: 0.25}, 
    {note: 'E5', duration: 0.25},
    {note: 'C5', duration: 0.25}, {note: 'A4', duration: 0.25}, {note: 'A4', duration: 0.25},
    {note: 'rest', duration: 0.25},
    {note: 'D5', duration: 0.25}, {note: 'F5', duration: 0.125}, {note: 'A5', duration: 0.25}, 
    {note: 'G5', duration: 0.125}, {note: 'F5', duration: 0.125},
    {note: 'E5', duration: 0.375}, {note: 'C5', duration: 0.125}, {note: 'E5', duration: 0.25}, 
    {note: 'D5', duration: 0.125}, {note: 'C5', duration: 0.125},
    {note: 'B4', duration: 0.25}, {note: 'B4', duration: 0.125}, {note: 'C5', duration: 0.125}, 
    {note: 'D5', duration: 0.25}, {note: 'E5', duration: 0.25},
    {note: 'C5', duration: 0.25}, {note: 'A4', duration: 0.25}, {note: 'A4', duration: 0.25},
    {note: 'rest', duration: 0.25}
];

// Note frequencies
const NOTES = {
    'A4': 440.0, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33,
    'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

// Initialize Web Audio
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        nextNoteTime = audioContext.currentTime;
    } catch (e) {
        console.error('Web Audio API is not supported in this browser');
    }
}

// Create a techno synth sound
function createSynth() {
    if (!audioContext) return null;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // Set up oscillator
    oscillator.type = 'square';
    
    // Set up filter
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 8;
    
    // Set up gain
    gainNode.gain.value = 0;
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return { oscillator, gainNode, filter };
}

// Schedule the next note
function scheduleNote(noteIndex, time) {
    const { note, duration } = TETRIS_MELODY[noteIndex];
    if (note === 'rest') return duration;
    
    const synth = createSynth();
    if (!synth) return duration;
    
    const { oscillator, gainNode, filter } = synth;
    const tempo = 100; // Slower tempo (was 140)
    const beatDuration = 60 / tempo;
    const noteDuration = duration * beatDuration;
    
    // Set frequency
    oscillator.frequency.setValueAtTime(NOTES[note], time);
    
    // Add techno effects
    const attackTime = 0.1;  // Longer attack
    const releaseTime = 0.15; // Longer release
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.2, time + attackTime); // Lower volume
    gainNode.gain.setValueAtTime(0.2, time + noteDuration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, time + noteDuration);
    
    // Filter sweep
    filter.frequency.setValueAtTime(500, time);
    filter.frequency.linearRampToValueAtTime(3000, time + attackTime);
    filter.frequency.setValueAtTime(3000, time + noteDuration - releaseTime);
    filter.frequency.linearRampToValueAtTime(500, time + noteDuration);
    
    // Start and stop the oscillator
    oscillator.start(time);
    oscillator.stop(time + noteDuration);
    
    return noteDuration;
}

// Schedule ahead time (in seconds)
const SCHEDULE_AHEAD_TIME = 0.2;

// Function to schedule multiple notes ahead
function scheduler() {
    if (!audioContext || !isMusicEnabled) return;
    
    const currentTime = audioContext.currentTime;
    
    // Schedule notes until we're ahead by SCHEDULE_AHEAD_TIME seconds
    while (nextNoteTime < currentTime + SCHEDULE_AHEAD_TIME) {
        const noteDuration = scheduleNote(currentMusicNote, nextNoteTime);
        
        nextNoteTime += noteDuration;
        currentMusicNote = (currentMusicNote + 1) % TETRIS_MELODY.length;
    }
    
    // Call the scheduler again
    musicSchedulerTimer = setTimeout(scheduler, 50);
}

// Play the Tetris theme
function playTetrisTheme() {
    if (!audioContext) initAudio();
    if (!audioContext) return;
    
    // Reset timing and note position
    nextNoteTime = audioContext.currentTime;
    currentMusicNote = 0;
    
    // Start the scheduler
    scheduler();
}

function stopMusic() {
    if (musicSchedulerTimer) {
        clearTimeout(musicSchedulerTimer);
        musicSchedulerTimer = null;
    }
    
    if (audioContext) {
        audioContext.close().then(() => {
            audioContext = null;
            bgMusicNode = null;
            nextNoteTime = 0;
            currentMusicNote = 0;
        });
    }
}

let isSoundEnabled = true;
let isMusicEnabled = true;

function playSound(soundName) {
    if (!isSoundEnabled) return;
    
    if (soundName === 'bgMusic') {
        if (isMusicEnabled && !bgMusicNode) {
            playTetrisTheme();
        }
    } else if (SOUNDS[soundName]) {
        try {
            const sound = SOUNDS[soundName];
            sound.currentTime = 0;
            sound.play().catch(error => console.error('Error playing sound:', error));
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
}

// Add sound and music toggle buttons
const soundToggleBtn = document.createElement('button');
soundToggleBtn.textContent = '🔊';
soundToggleBtn.style.cssText = 'position: absolute; top: 10px; right: 60px; font-size: 24px; background: none; border: none; cursor: pointer; color: white;';
document.body.appendChild(soundToggleBtn);

const musicToggleBtn = document.createElement('button');
musicToggleBtn.textContent = '🎵';
musicToggleBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; font-size: 24px; background: none; border: none; cursor: pointer; color: white;';
document.body.appendChild(musicToggleBtn);

soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundToggleBtn.textContent = isSoundEnabled ? '🔊' : '🔈';
    if (!isSoundEnabled) {
        stopMusic();
    }
});

musicToggleBtn.addEventListener('click', () => {
    isMusicEnabled = !isMusicEnabled;
    musicToggleBtn.textContent = isMusicEnabled ? '🎵' : '🎵';
    if (isMusicEnabled) {
        playSound('bgMusic');
    } else {
        stopMusic();
    }
});

// Game state
let board = createEmptyBoard();
let currentPiece = null;
let nextPiece = null;
let gameInterval = null;
let isPaused = false;
let gameOver = false;
let score = 0;
let level = 1;
let linesCleared = 0;
let dropSpeed = 1000; // milliseconds
let isGravityFlipped = false;
let isDrunkControls = false;
let activeTwist = null;
let activeTwistTimer = null;
let twistProbability = 0.4; // 40% chance of twist on new piece
let ghostBlocks = [];
let pieceRotation = 0;
let rainbowHue = 0;
let trailParticles = [];
let dimensionAngle = 0;
let realityStability = 1;
let timeWarpFactor = 1;
let fractals = [];
let voidPortals = [];
let colorSynesthesia = 0;

// Tetris pieces (tetrominos)
const PIECES = [
    null,
    // I
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
    ],
    // J
    [
        [0, 2, 0],
        [0, 2, 0],
        [2, 2, 0]
    ],
    // L
    [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// Create an empty game board
function createEmptyBoard() {
    return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
}

// Create a new piece
function createPiece(type) {
    return {
        type: type,
        matrix: PIECES[type],
        position: {
            x: Math.floor(GRID_WIDTH / 2) - Math.floor(PIECES[type][0].length / 2),
            y: 0
        },
        rotation: 0
    };
}

// Get a random piece
function getRandomPiece() {
    const pieceType = Math.floor(Math.random() * 7) + 1;
    return createPiece(pieceType);
}

// Rotate a piece
function rotate(piece, direction) {
    const matrix = piece.matrix;
    const n = matrix.length;
    const result = Array.from({ length: n }, () => Array(n).fill(0));
    
    if (direction > 0) { // clockwise
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                result[x][n - 1 - y] = matrix[y][x];
            }
        }
    } else { // counter-clockwise
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                result[n - 1 - x][y] = matrix[y][x];
            }
        }
    }
    
    return result;
}

// Check for collision
function checkCollision(piece, offsetX, offsetY, newMatrix = null) {
    const matrix = newMatrix || piece.matrix;
    
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0) {
                const newX = piece.position.x + x + offsetX;
                const newY = piece.position.y + y + offsetY;
                
                if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX] !== 0) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Merge the current piece into the board
function mergePiece() {
    for (let y = 0; y < currentPiece.matrix.length; y++) {
        for (let x = 0; x < currentPiece.matrix[y].length; x++) {
            if (currentPiece.matrix[y][x] !== 0) {
                const boardY = currentPiece.position.y + y;
                const boardX = currentPiece.position.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.matrix[y][x];
                }
            }
        }
    }
    
    clearLines();
    createNewPiece();
    
    if (checkCollision(currentPiece, 0, 0)) {
        gameOver = true;
        clearInterval(gameInterval);
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = score;
        playSound('gameOver');
    }
}

// Clear completed lines
function clearLines() {
    let linesCompleted = 0;
    
    outer: for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        // This line is complete, remove it
        const removedRow = board.splice(y, 1)[0];
        
        // Add vanishing effect to removed blocks
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (removedRow[x] !== 0) {
                ghostBlocks.push({
                    x: x,
                    y: y,
                    color: COLORS[removedRow[x]],
                    alpha: 1,
                    speed: Math.random() * 3 + 1
                });
            }
        }
        
        // Add empty line at top
        board.unshift(Array(GRID_WIDTH).fill(0));
        
        // Move y position back one to check the new row
        y++;
        
        linesCompleted++;
    }
    
    // Update score based on lines completed
    if (linesCompleted > 0) {
        // Tetris scoring system: 100, 300, 500, 800 for 1, 2, 3, 4 lines
        const lineScores = [0, 100, 300, 500, 800];
        score += lineScores[linesCompleted] * level;
        
        // Update level every 10 lines
        linesCleared += linesCompleted;
        const oldLevel = level;
        level = Math.floor(linesCleared / 10) + 1;
        
        // Update UI
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        
        // Adjust drop speed based on level
        dropSpeed = Math.max(100, 1000 - (level - 1) * 100);
        resetGameInterval();
        
        // Play line clear sound
        playSound('clear');
        
        // Check for level up
        if (level > oldLevel) {
            playSound('levelUp');
        }
    }
}

// Create new piece and maybe trigger a twist
function createNewPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    
    // Reset position to top center, higher up
    currentPiece.position = {
        x: Math.floor(GRID_WIDTH / 2) - Math.floor(currentPiece.matrix[0].length / 2),
        y: -4  // Start higher up to prevent immediate collision
    };
    
    // Draw next piece
    drawNextPiece();
    
    // Only check for game over if the piece is fully in the visible board
    if (currentPiece.position.y >= 0) {
        let collision = false;
        // Check each cell of the piece
        for (let y = 0; y < currentPiece.matrix.length; y++) {
            for (let x = 0; x < currentPiece.matrix[y].length; x++) {
                if (currentPiece.matrix[y][x] !== 0) {
                    const boardY = currentPiece.position.y + y;
                    if (boardY >= 0 && board[boardY][currentPiece.position.x + x] !== 0) {
                        collision = true;
                        break;
                    }
                }
            }
            if (collision) break;
        }
        
        if (collision) {
            gameOver = true;
            clearInterval(gameInterval);
            document.getElementById('game-over-screen').classList.remove('hidden');
            document.getElementById('final-score').textContent = score;
            playSound('gameOver');
            return;
        }
    }
    
    // Increase chance of twists
    if (Math.random() < twistProbability) {
        triggerRandomTwist();
    }
}

// Draw the next piece
function drawNextPiece() {
    // Clear next piece canvas
    nextPieceCtx.fillStyle = '#16213e';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (!nextPiece) return;
    
    // Center the piece in the next piece canvas
    const cellSize = nextPieceCanvas.width / 6;
    const offsetX = (nextPieceCanvas.width - nextPiece.matrix[0].length * cellSize) / 2;
    const offsetY = (nextPieceCanvas.height - nextPiece.matrix.length * cellSize) / 2;
    
    // Draw the next piece
    nextPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextPieceCtx.fillStyle = COLORS[value];
                nextPieceCtx.fillRect(
                    offsetX + x * cellSize,
                    offsetY + y * cellSize, 
                    cellSize - 1, 
                    cellSize - 1
                );
                
                // Add glow effect
                nextPieceCtx.shadowColor = COLORS[value];
                nextPieceCtx.shadowBlur = 5;
                nextPieceCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                nextPieceCtx.strokeRect(
                    offsetX + x * cellSize,
                    offsetY + y * cellSize, 
                    cellSize - 1, 
                    cellSize - 1
                );
                nextPieceCtx.shadowBlur = 0;
            }
        });
    });
}

// Trigger a random twist
function triggerRandomTwist() {
    clearActiveTwist();
    
    const twistIndex = Math.floor(Math.random() * TWISTED_EFFECTS.length);
    activeTwist = TWISTED_EFFECTS[twistIndex];
    
    displayTwistMessage(FUNNY_MESSAGES[twistIndex]);
    playSound('twist');
    
    applyTwist(activeTwist);
    
    // Update the effects list in UI
    const effectsList = document.getElementById('effects-list');
    const effectItem = document.createElement('li');
    effectItem.textContent = FUNNY_MESSAGES[twistIndex];
    effectItem.dataset.effect = activeTwist;
    effectsList.appendChild(effectItem);
    
    activeTwistTimer = setTimeout(() => {
        clearActiveTwist();
    }, 10000);
}

// Display a twist message
function displayTwistMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'twist-message';
    messageElement.textContent = message;
    messageElement.style.position = 'fixed';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.backgroundColor = 'rgba(240, 165, 0, 0.9)';
    messageElement.style.color = '#16213e';
    messageElement.style.padding = '15px 30px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.fontSize = '1.2rem';
    messageElement.style.zIndex = '100';
    messageElement.style.transition = 'opacity 0.5s ease-in-out';
    
    document.body.appendChild(messageElement);
    
    // Remove the message after 3 seconds
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 500);
    }, 3000);
}

// Apply a specific twist
function applyTwist(twist) {
    switch(twist) {
        case "gravity_flip":
            isGravityFlipped = true;
            break;
        case "drunk_controls":
            isDrunkControls = true;
            break;
        case "piece_transform":
            // Transform the current piece into a random piece
            const newType = Math.floor(Math.random() * 7) + 1;
            currentPiece.type = newType;
            currentPiece.matrix = PIECES[newType];
            break;
        case "board_shake":
            // Add a shake animation to the canvas
            canvas.classList.add('shake');
            setTimeout(() => {
                canvas.classList.remove('shake');
            }, 5000);
            break;
        case "mystery_block":
            // Add a mystery block somewhere on the board
            const mysteryX = Math.floor(Math.random() * GRID_WIDTH);
            const mysteryY = Math.floor(Math.random() * (GRID_HEIGHT / 2)) + GRID_HEIGHT / 2;
            if (board[mysteryY][mysteryX] === 0) {
                board[mysteryY][mysteryX] = 8; // Special color for mystery block
            }
            break;
        case "ghost_piece":
            // Create ghost pieces that fall randomly
            for (let i = 0; i < 5; i++) {
                const ghostX = Math.floor(Math.random() * GRID_WIDTH);
                const ghostType = Math.floor(Math.random() * 7) + 1;
                ghostBlocks.push({
                    x: ghostX,
                    y: -2,
                    color: COLORS[ghostType],
                    alpha: 0.5,
                    speed: Math.random() * 2 + 0.5
                });
            }
            break;
        case "speed_change":
            // Randomly speed up or slow down
            const speedFactor = Math.random() < 0.5 ? 0.5 : 2;
            dropSpeed = dropSpeed * speedFactor;
            resetGameInterval();
            break;
        case "block_vanish":
            // Make some random blocks on the board disappear
            for (let i = 0; i < 10; i++) {
                const y = Math.floor(Math.random() * GRID_HEIGHT);
                const x = Math.floor(Math.random() * GRID_WIDTH);
                if (board[y][x] !== 0) {
                    board[y][x] = 0;
                }
            }
            break;
        case "piece_explosion":
            // Create mini pieces that scatter
            const centerX = currentPiece.position.x + Math.floor(currentPiece.matrix[0].length / 2);
            const centerY = currentPiece.position.y + Math.floor(currentPiece.matrix.length / 2);
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                ghostBlocks.push({
                    x: centerX,
                    y: centerY,
                    color: COLORS[currentPiece.type],
                    alpha: 1,
                    speed: 2,
                    dx: Math.cos(angle) * 2,
                    dy: Math.sin(angle) * 2
                });
            }
            break;
        case "mirror_world":
            // Mirror the entire board
            for (let y = 0; y < GRID_HEIGHT; y++) {
                board[y].reverse();
            }
            // Mirror current piece position
            currentPiece.position.x = GRID_WIDTH - currentPiece.position.x - currentPiece.matrix[0].length;
            break;
        case "dance_party":
            // Make pieces dance by adding a wiggle animation
            canvas.style.animation = "dance 0.5s infinite";
            const danceStyle = document.createElement('style');
            danceStyle.innerHTML = `
                @keyframes dance {
                    0% { transform: rotate(0deg) translateY(0px); }
                    25% { transform: rotate(5deg) translateY(-5px); }
                    75% { transform: rotate(-5deg) translateY(5px); }
                    100% { transform: rotate(0deg) translateY(0px); }
                }
            `;
            document.head.appendChild(danceStyle);
            setTimeout(() => {
                canvas.style.animation = "";
                document.head.removeChild(danceStyle);
            }, 5000);
            break;
        case "size_change":
            // Randomly change the size of pieces
            const scale = Math.random() < 0.5 ? 0.5 : 1.5;
            ctx.save();
            ctx.scale(scale, scale);
            setTimeout(() => ctx.restore(), 5000);
            break;
        case "time_dilation":
            dropSpeed *= Math.random() < 0.5 ? 0.5 : 2;
            resetGameInterval();
            break;
        case "fractal_trails":
            // Fractal trails are handled in movePiece and draw
            break;
        case "dimension_shift":
            canvas.style.transform = "perspective(1000px)";
            break;
        case "kaleidoscope":
            // Kaleidoscope effect is handled in draw
            break;
        case "color_synesthesia":
            colorSynesthesia = 0;
            break;
        case "reality_glitch":
            realityStability = 1;
            break;
        case "quantum_pieces":
            // Quantum effects are handled in movePiece
            break;
        case "void_portals":
            for (let i = 0; i < 3; i++) {
                voidPortals.push({
                    x: Math.floor(Math.random() * GRID_WIDTH),
                    y: Math.floor(Math.random() * GRID_HEIGHT)
                });
            }
            break;
    }
}

// Clear the active twist
function clearActiveTwist() {
    if (activeTwistTimer) {
        clearTimeout(activeTwistTimer);
        activeTwistTimer = null;
    }
    
    isGravityFlipped = false;
    isDrunkControls = false;
    
    // Reset speed if it was changed
    if (activeTwist === "speed_change") {
        dropSpeed = Math.max(100, 1000 - (level - 1) * 100);
        resetGameInterval();
    }
    
    // Clear the effects list in UI
    const effectsList = document.getElementById('effects-list');
    while (effectsList.firstChild) {
        effectsList.removeChild(effectsList.firstChild);
    }
    
    activeTwist = null;
}

// Reset the game interval with the current drop speed
function resetGameInterval() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    if (!isPaused && !gameOver) {
        gameInterval = setInterval(update, dropSpeed);
    }
}

// Update function - called every frame of the game
function update() {
    if (isPaused || gameOver) return;
    
    // Random events during gameplay (1% chance per frame)
    if (Math.random() < 0.01) {
        const randomEvent = Math.random();
        if (randomEvent < 0.3) {
            // Random piece rotation
            const rotated = rotate(currentPiece, Math.random() < 0.5 ? 1 : -1);
            if (!checkCollision(currentPiece, 0, 0, rotated)) {
                currentPiece.matrix = rotated;
                displayTwistMessage("Wheee! Spinning time!");
            }
        } else if (randomEvent < 0.6) {
            // Random horizontal movement
            const move = Math.random() < 0.5 ? -1 : 1;
            if (!checkCollision(currentPiece, move, 0)) {
                currentPiece.position.x += move;
                displayTwistMessage("Piece got the zoomies!");
            }
        }
    }
    
    // Move the piece down (or up if gravity is flipped)
    const direction = isGravityFlipped ? -1 : 1;
    
    if (!checkCollision(currentPiece, 0, direction)) {
        currentPiece.position.y += direction;
    } else {
        // If gravity is flipped and we've reached the top, bring it back down
        if (isGravityFlipped && currentPiece.position.y <= 0) {
            isGravityFlipped = false;
            currentPiece.position.y = 0;
        } else {
            // If we hit something, place the piece and create a new one
            mergePiece();
        }
    }
    
    // Update ghost blocks
    updateGhostBlocks();
    
    // Redraw the board
    draw();
}

// Update ghost blocks
function updateGhostBlocks() {
    for (let i = ghostBlocks.length - 1; i >= 0; i--) {
        const ghost = ghostBlocks[i];
        
        // Handle regular ghost blocks
        if (!ghost.dx && !ghost.dy) {
            if (ghost.y < GRID_HEIGHT) {
                ghost.y += ghost.speed;
            }
        } else {
            // Handle exploding pieces
            ghost.x += ghost.dx;
            ghost.y += ghost.dy;
            ghost.dx *= 0.95; // Add friction
            ghost.dy *= 0.95;
        }
        
        ghost.alpha -= 0.01;
        
        if (ghost.alpha <= 0 || 
            ghost.y >= GRID_HEIGHT || 
            ghost.x < 0 || 
            ghost.x >= GRID_WIDTH) {
            ghostBlocks.splice(i, 1);
        }
    }
}

// Draw function - renders the game state to the canvas
function draw() {
    // Reset canvas context state
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    // Clear canvas with dynamic background
    const time = Date.now() / 1000;
    ctx.fillStyle = `hsl(${time * 20 % 360}, 70%, 10%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply reality distortion
    if (activeTwist === "reality_glitch") {
        ctx.globalCompositeOperation = "difference";
        realityStability = 0.7 + Math.sin(time * 2) * 0.3;
    }
    
    // Apply time dilation
    if (activeTwist === "time_dilation") {
        timeWarpFactor = 1 + Math.sin(time) * 0.5;
        ctx.filter = `blur(${Math.abs(Math.sin(time * 2)) * 2}px)`;
    }
    
    // Draw void portals
    if (activeTwist === "void_portals") {
        drawVoidPortals();
    }
    
    // Draw the board with effects
    drawBoard();
    
    // Draw fractal trails
    if (activeTwist === "fractal_trails") {
        drawFractals();
    }
    
    // Apply dimension shift
    if (activeTwist === "dimension_shift") {
        applyDimensionShift();
    }
    
    // Draw ghost blocks
    drawGhostBlocks();
    
    // Draw the current piece with effects
    drawPiece(currentPiece);
    
    // Apply kaleidoscope effect
    if (activeTwist === "kaleidoscope") {
        applyKaleidoscope();
    }
    
    // Reset any remaining context changes
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
}

// Draw the board
function drawBoard() {
    ctx.save();
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const xPos = x * CELL_SIZE;
                const yPos = y * CELL_SIZE;
                
                // Reset shadow effects before each block
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                
                if (value === 8) {
                    // Special rainbow effect for mystery blocks
                    const hue = (Date.now() / 20) % 360;
                    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                } else {
                    ctx.fillStyle = COLORS[value];
                }
                
                // Draw the main block
                ctx.fillRect(xPos, yPos, CELL_SIZE - 1, CELL_SIZE - 1);
                
                // Add glow effect
                ctx.shadowColor = value === 8 ? 
                    `hsl(${Date.now() / 20 % 360}, 100%, 50%)` : 
                    COLORS[value];
                ctx.shadowBlur = 10;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.strokeRect(xPos, yPos, CELL_SIZE - 1, CELL_SIZE - 1);
            }
        });
    });
    ctx.restore();
}

// Draw ghost blocks
function drawGhostBlocks() {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    ghostBlocks.forEach(ghost => {
        ctx.fillStyle = `rgba(${hexToRgb(ghost.color)}, ${ghost.alpha})`;
        ctx.fillRect(ghost.x * CELL_SIZE, ghost.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    });
    ctx.restore();
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    // Remove the leading # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Draw a piece
function drawPiece(piece) {
    if (!piece) return;
    
    ctx.save();
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const xPos = (piece.position.x + x) * CELL_SIZE;
                const yPos = (piece.position.y + y) * CELL_SIZE;
                
                // Reset shadow effects before each block
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                
                // Draw the piece with basic color first
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(xPos, yPos, CELL_SIZE - 1, CELL_SIZE - 1);
                
                // Add glow effect
                ctx.shadowColor = COLORS[value];
                ctx.shadowBlur = 10;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.strokeRect(xPos, yPos, CELL_SIZE - 1, CELL_SIZE - 1);
                
                // Add trail particles
                if (Math.random() < 0.1) {
                    trailParticles.push({
                        x: xPos + CELL_SIZE / 2,
                        y: yPos + CELL_SIZE / 2,
                        color: COLORS[value],
                        size: Math.random() * 3 + 2,
                        speedX: (Math.random() - 0.5) * 2,
                        speedY: Math.random() * 2 + 1,
                        life: 1
                    });
                }
            }
        });
    });
    ctx.restore();
    
    // Update animation values
    pieceRotation = (pieceRotation + 1) % 360;
    rainbowHue = (rainbowHue + 2) % 360;
    
    // Update and draw trail particles
    updateTrailParticles();
}

// Update trail particles
function updateTrailParticles() {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const particle = trailParticles[i];
        
        // Update particle position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life -= 0.02;
        
        // Draw mushroom
        ctx.fillStyle = `rgba(${hexToRgb(particle.color)}, ${particle.life})`;
        
        // Draw mushroom cap (semi-circle)
        const capRadius = particle.size * 1.5;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, capRadius, Math.PI, 0);
        ctx.fill();
        
        // Draw mushroom stem (rectangle)
        const stemWidth = particle.size * 0.8;
        const stemHeight = particle.size * 1.2;
        ctx.fillRect(
            particle.x - stemWidth / 2,
            particle.y,
            stemWidth,
            stemHeight
        );
        
        // Add small dots on the mushroom cap for decoration
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.life * 0.7})`;
        const dotSize = particle.size * 0.3;
        for (let j = 0; j < 3; j++) {
            const dotX = particle.x + (j - 1) * dotSize * 1.2;
            const dotY = particle.y - capRadius/2;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Remove dead particles
        if (particle.life <= 0) {
            trailParticles.splice(i, 1);
        }
    }
    ctx.restore();
}

// Player controls
document.addEventListener('keydown', (event) => {
    if (gameOver) return;
    
    // Define movement based on controls state
    let moveLeft = isDrunkControls ? 1 : -1;
    let moveRight = isDrunkControls ? -1 : 1;
    
    switch(event.keyCode) {
        case 37: // Left arrow
            if (!checkCollision(currentPiece, moveLeft, 0)) {
                currentPiece.position.x += moveLeft;
                playSound('move');
            }
            break;
        case 39: // Right arrow
            if (!checkCollision(currentPiece, moveRight, 0)) {
                currentPiece.position.x += moveRight;
                playSound('move');
            }
            break;
        case 40: // Down arrow
            const moveDown = isGravityFlipped ? -1 : 1;
            if (!checkCollision(currentPiece, 0, moveDown)) {
                currentPiece.position.y += moveDown;
                score += 1;
                document.getElementById('score').textContent = score;
                playSound('move');
            }
            break;
        case 38: // Up arrow - rotate
            const rotated = rotate(currentPiece, 1);
            if (!checkCollision(currentPiece, 0, 0, rotated)) {
                currentPiece.matrix = rotated;
                playSound('rotate');
            }
            break;
        case 32: // Space - hard drop
            hardDrop();
            playSound('drop');
            break;
        case 80: // 'P' - pause
            togglePause();
            break;
    }
    
    draw();
});

// Hard drop function
function hardDrop() {
    const direction = isGravityFlipped ? -1 : 1;
    let dropDistance = 0;
    
    while (!checkCollision(currentPiece, 0, direction)) {
        currentPiece.position.y += direction;
        dropDistance++;
    }
    
    // Add score for hard drop - 2 points per cell dropped
    score += dropDistance * 2;
    document.getElementById('score').textContent = score;
    
    mergePiece();
    draw();
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        clearInterval(gameInterval);
        document.getElementById('pause-button').textContent = 'Resume';
        if (isMusicEnabled) {
            stopMusic();
        }
    } else {
        gameInterval = setInterval(update, dropSpeed);
        document.getElementById('pause-button').textContent = 'Pause';
        if (isMusicEnabled) {
            playSound('bgMusic');
        }
    }
}

// Button controls
document.getElementById('start-button').addEventListener('click', () => {
    startGame();
    document.getElementById('restart-button').classList.remove('hidden');
});

document.getElementById('pause-button').addEventListener('click', togglePause);

document.getElementById('restart-button').addEventListener('click', () => {
    if (confirm('Are you sure you want to start over? Your current progress will be lost.')) {
        startGame();
    }
});

document.getElementById('restart-button-gameover').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    startGame();
});

// Start the game
function startGame() {
    // Reset game state
    board = createEmptyBoard();
    score = 0;
    level = 1;
    linesCleared = 0;
    isPaused = false;
    gameOver = false;
    dropSpeed = 1000;
    isGravityFlipped = false;
    isDrunkControls = false;
    ghostBlocks = [];
    pieceRotation = 0;
    rainbowHue = 0;
    trailParticles = [];
    dimensionAngle = 0;
    realityStability = 1;
    timeWarpFactor = 1;
    fractals = [];
    voidPortals = [];
    colorSynesthesia = 0;
    
    // Clear any active twists
    clearActiveTwist();
    
    // Hide game over screen
    document.getElementById('game-over-screen').classList.add('hidden');
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('pause-button').textContent = 'Pause';
    document.getElementById('combo').textContent = '0';
    
    // Initialize pieces
    nextPiece = getRandomPiece();
    currentPiece = getRandomPiece();
    currentPiece.position.y = -4; // Start higher up
    
    // Reset interval
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(update, dropSpeed);
    
    // Start background music
    playSound('bgMusic');
    
    // Initial draw
    draw();
}

// Add a CSS class for the shake effect
const style = document.createElement('style');
style.innerHTML = `
    @keyframes shake {
        0% { transform: translate(1px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-3px, 0px) rotate(1deg); }
        30% { transform: translate(3px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-3px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .shake {
        animation: shake 0.5s infinite;
    }
`;
document.head.appendChild(style);

// Initialize the game on window load
window.onload = () => {
    // Hide game over screen initially and ensure it stays hidden
    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.style.display = 'none';  // Force hide with inline style
    
    // Add music toggle functionality
    const musicToggleBtn = document.getElementById('music-toggle');
    musicToggleBtn.addEventListener('click', () => {
        isMusicEnabled = !isMusicEnabled;
        musicToggleBtn.textContent = `Music: ${isMusicEnabled ? 'On' : 'Off'}`;
        
        if (!isMusicEnabled) {
            // Stop music
            if (bgMusicNode) {
                bgMusicNode.stop();
                bgMusicNode = null;
            }
            if (musicSchedulerTimer) {
                clearTimeout(musicSchedulerTimer);
                musicSchedulerTimer = null;
            }
        } else if (!gameOver) {
            // Restart music if game is active
            playSound('bgMusic');
        }
    });

    // Create instructions element
    const instructions = document.createElement('div');
    instructions.className = 'game-instructions';
    instructions.innerHTML = `
        <h3>Controls:</h3>
        <ul>
            <li>← → : Move piece left/right</li>
            <li>↓ : Move piece down</li>
            <li>↑ : Rotate piece</li>
            <li>Space : Hard drop</li>
            <li>P : Pause game</li>
        </ul>
    `;
    document.getElementById('game-info').insertBefore(
        instructions,
        document.querySelector('.active-effects')
    );

    // Start a new game automatically
    startGame();
    
    // Start animation loop
    requestAnimationFrame(draw);
};

// New function to draw void portals
function drawVoidPortals() {
    voidPortals.forEach(portal => {
        const gradient = ctx.createRadialGradient(
            portal.x * CELL_SIZE, portal.y * CELL_SIZE, 0,
            portal.x * CELL_SIZE, portal.y * CELL_SIZE, CELL_SIZE * 2
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(128, 0, 128, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(portal.x * CELL_SIZE, portal.y * CELL_SIZE, CELL_SIZE * 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// New function to draw fractal patterns
function drawFractals() {
    fractals.forEach((fractal, i) => {
        const size = fractal.size * Math.sin(Date.now() / 1000 + i);
        ctx.save();
        ctx.translate(fractal.x, fractal.y);
        ctx.rotate(fractal.rotation);
        
        // Draw sierpinski triangle
        drawSierpinski(size, fractal.depth, fractal.color);
        
        ctx.restore();
        fractal.rotation += 0.02;
        fractal.life -= 0.01;
        
        if (fractal.life <= 0) {
            fractals.splice(i, 1);
        }
    });
}

// Helper function to draw sierpinski triangle
function drawSierpinski(size, depth, color) {
    if (depth === 0) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * Math.cos(Math.PI/6), size * Math.sin(Math.PI/6));
        ctx.lineTo(-size * Math.cos(Math.PI/6), size * Math.sin(Math.PI/6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        return;
    }
    
    const newSize = size / 2;
    drawSierpinski(newSize, depth - 1, color);
    ctx.translate(0, newSize);
    drawSierpinski(newSize, depth - 1, color);
    ctx.translate(-newSize, -newSize);
    drawSierpinski(newSize, depth - 1, color);
    ctx.translate(newSize, 0);
}

// New function to apply 3D rotation effect
function applyDimensionShift() {
    dimensionAngle += 0.02;
    const perspective = 1000;
    const rotation = dimensionAngle;
    
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.transform(
        Math.cos(rotation), Math.sin(rotation) * Math.sin(rotation/3),
        Math.sin(rotation), Math.cos(rotation) * Math.cos(rotation/3),
        0, 0
    );
    ctx.translate(-canvas.width/2, -canvas.height/2);
}

// New function to apply kaleidoscope effect
function applyKaleidoscope() {
    const segments = 8;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let i = 0; i < segments; i++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((Math.PI * 2 * i) / segments);
        ctx.scale(0.5, 0.5);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
    }
}

// Enhance piece movement with quantum effects
function movePiece(dx, dy) {
    if (activeTwist === "quantum_pieces") {
        // Create quantum superposition
        const ghostPiece = {...currentPiece};
        ghostPiece.position = {...currentPiece.position};
        ghostPiece.position.x += dx * 2;
        
        if (!checkCollision(ghostPiece, 0, 0)) {
            ghostBlocks.push({
                x: ghostPiece.position.x,
                y: ghostPiece.position.y,
                color: COLORS[ghostPiece.type],
                alpha: 0.3,
                speed: 0
            });
        }
    }
    
    if (!checkCollision(currentPiece, dx, dy)) {
        currentPiece.position.x += dx;
        currentPiece.position.y += dy;
        
        // Add color synesthesia effect
        if (activeTwist === "color_synesthesia") {
            colorSynesthesia = (colorSynesthesia + 30) % 360;
            ctx.filter = `hue-rotate(${colorSynesthesia}deg)`;
        }
        
        // Add fractal trails
        if (activeTwist === "fractal_trails") {
            fractals.push({
                x: (currentPiece.position.x + currentPiece.matrix[0].length/2) * CELL_SIZE,
                y: (currentPiece.position.y + currentPiece.matrix.length/2) * CELL_SIZE,
                size: CELL_SIZE * 2,
                depth: 3,
                color: COLORS[currentPiece.type],
                rotation: Math.random() * Math.PI * 2,
                life: 1
            });
        }
    }
} 