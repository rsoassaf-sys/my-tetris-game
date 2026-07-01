const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
context.scale(20, 20);

const player = { 
    pos: {x: 0, y: 0}, 
    matrix: null, 
    score: 0 // أضف هذه الخاصية للتعريف الأصلي فقط
};


const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

function createPiece(type) {
    if (type === 'I') return [[0, 2, 0, 0], [0, 2, 0, 0], [0, 2, 0, 0], [0, 2, 0, 0]];
    if (type === 'L') return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
    if (type === 'J') return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
    if (type === 'O') return [[5, 5], [5, 5]];
    if (type === 'Z') return [[6, 6, 0], [0, 6, 6], [0, 0, 0]];
    if (type === 'S') return [[0, 7, 7], [7, 7, 0], [0, 0, 0]];
    if (type === 'T') return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    // 1. مسح الشاشة
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. رسم الساحة (arena)
    drawMatrix(arena, {x: 0, y: 0});
    
    // 3. رسم اللاعب فقط إذا كانت المصفوفة موجودة (وهذا يمنع الخطأ)
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function collide(arena, player) {
    // إضافة حماية: إذا كانت مصفوفة اللاعب null، لا يوجد تصادم
    if (!player.matrix) return false;
    
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && 
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

let lastPiece = '';
function playerReset() {
    const pieces = 'ILJOTSZ';
    let nextPiece;
    do { nextPiece = pieces[pieces.length * Math.random() | 0]; } while (nextPiece === lastPiece);
    lastPiece = nextPiece;
    
    player.matrix = createPiece(nextPiece);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0); // توسيط القطعة
    
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
    }

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        document.getElementById('score').innerText = 0;
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
    dir > 0 ? matrix.forEach(row => row.reverse()) : matrix.reverse();
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
    }
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        
        // استدعاء دالة تنظيف الصفوف هنا:
        arenaSweep(); 
    }
    dropCounter = 0;
}

document.addEventListener('keydown', event => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }
    if (event.keyCode === 37) playerMove(-1);
    else if (event.keyCode === 39) playerMove(1);
    else if (event.keyCode === 40) playerDrop();
    else if (event.keyCode === 38) playerRotate(1);
});

const arena = createMatrix(12, 20);
//const player = { pos: {x: 0, y: 0}, matrix: null };
let dropCounter = 0, lastTime = 0, isPaused = true, animationId = null;
let currentDropInterval = 1000; // القيمة الابتدائية للسرعة
let currentSpeed = 1;

function update(time = 0) {
    if (isPaused) return;

    // ... (كود الوقت) ...

    // مراقبة السرعة وتحديثها بناءً على السكور
    let newSpeed = Math.floor(player.score / 50) + 1;
    if (newSpeed !== currentSpeed) {
        currentSpeed = newSpeed;
        document.getElementById('speed').innerText = currentSpeed;
        
        // تحديث سرعة سقوط القطعة (كلما زادت السرعة، قل زمن السقوط)
        currentDropInterval = Math.max(100, 1000 - (currentSpeed * 100));
    }


    if (isPaused) return; // لا تُحدث إذا كانت اللعبة متوقفة
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > currentDropInterval) {
        playerDrop();
    }
    
    // --- هنا التعديل المهم ---
    // تأكد من أن هذه الأسطر موجودة داخل دالة update
    document.getElementById('score').innerText = player.score;
    
    // حساب السرعة بناءً على السكور
    let speedLevel = Math.floor(player.score / 50) + 1; // جعلناها كل 50 نقطة تزيد السرعة
    document.getElementById('speed').innerText = speedLevel;
    
    // تحديث السرعة الفعلية للعبة (تقليل زمن السقوط)
    currentDropInterval = Math.max(100, 1000 - (speedLevel * 100));
    // -------------------------

   // updateUI(); 
    
    draw();
    animationId = requestAnimationFrame(update);
}

function toggleGame() {
    isPaused = !isPaused;
    startBtn.innerText = isPaused ? "CONTINUE" : "STOP";
    
    if (!isPaused) {
        // تأكد من هذا الشرط:
        if (!player.matrix) {
            playerReset();
        }
        update();
        canvas.focus();
    } else {
        cancelAnimationFrame(animationId);
    }
}

startBtn.addEventListener('click', toggleGame);

function arenaSweep() {
    
    let linesCleared = 0;

    // البحث عن الصفوف المكتملة ومسحها
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        
        // مسح الصف
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        
        linesCleared++;
    }

    // حساب النقاط فقط إذا تم مسح صفوف
    if (linesCleared > 0) {
        // تحديث النقاط فقط
        player.score += 10 * Math.pow(2, linesCleared - 1);
        
        // تحديث السكور في الواجهة
        document.getElementById('score').innerText = player.score;
    }
}

