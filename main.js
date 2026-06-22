// Joshway Pinball - Sonic style with Joshway theme
// Full production polished pinball table

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let score = 0;
let balls = 3;
let gameOver = false;

const ball = {
  x: 550,
  y: 700,
  vx: 0,
  vy: 0,
  r: 12,
  active: false
};

let leftFlipperAngle = 0;
let rightFlipperAngle = 0;
const flipperLength = 70;
const flipperWidth = 12;

let plungerY = 750;
let plungerPower = 0;
let plunging = false;

const keys = {};

const bumpers = [
  { x: 150, y: 200, r: 25 },
  { x: 300, y: 150, r: 25 },
  { x: 450, y: 220, r: 25 },
  { x: 200, y: 350, r: 20 },
  { x: 400, y: 380, r: 20 }
];

const walls = [
  // Table outline
  { x1: 50, y1: 50, x2: 550, y2: 50 },
  { x1: 550, y1: 50, x2: 580, y2: 100 },
  { x1: 580, y1: 100, x2: 580, y2: 750 },
  { x1: 580, y1: 750, x2: 520, y2: 780 },
  { x1: 50, y1: 50, x2: 20, y2: 100 },
  { x1: 20, y1: 100, x2: 20, y2: 750 },
  { x1: 20, y1: 750, x2: 80, y2: 780 }
];

const slings = [
  { x: 100, y: 650, w: 80, h: 20, angle: -0.3 },
  { x: 420, y: 650, w: 80, h: 20, angle: 0.3 }
];

let rings = [
  { x: 200, y: 300, collected: false },
  { x: 350, y: 250, collected: false },
  { x: 480, y: 320, collected: false },
  { x: 150, y: 450, collected: false }
];

let particles = [];

// Audio
let audioCtx;
function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSFX(freq, dur, type = 'square', vol = 0.3) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => {
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.stop(audioCtx.currentTime + 0.1);
  }, dur * 1000);
}

let musicTimer = null;
function startPinballMusic() {
  if (!audioCtx) return;
  if (musicTimer) clearTimeout(musicTimer);
  function playLoop() {
    if (gameOver) return;
    const notes = [440, 523, 659, 784, 659, 523];
    notes.forEach((f, i) => {
      setTimeout(() => playSFX(f, 0.15, 'sawtooth', 0.15), i * 180);
    });
    musicTimer = setTimeout(playLoop, 1200);
  }
  playLoop();
}

function launchBall() {
  if (!ball.active && balls > 0) {
    ball.x = 550;
    ball.y = plungerY - 30;
    ball.vx = -plungerPower * 8;
    ball.vy = -plungerPower * 3;
    ball.active = true;
    plungerPower = 0;
    balls--;
    document.getElementById('balls').textContent = balls;
    playSFX(880, 0.2, 'sine', 0.4);
  }
}

function updatePhysics() {
  if (!ball.active) return;

  // Gravity
  ball.vy += 0.25;

  // Friction
  ball.vx *= 0.995;
  ball.vy *= 0.995;

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions
  walls.forEach(w => {
    // Simple line collision
    if (ball.x < 50 || ball.x > 550) ball.vx = -ball.vx * 0.8;
    if (ball.y < 50) ball.vy = -ball.vy * 0.8;
  });

  // Floor drain
  if (ball.y > 780) {
    ball.active = false;
    if (balls <= 0) {
      gameOver = true;
    }
    playSFX(200, 0.5, 'sawtooth', 0.3);
  }

  // Bumpers
  bumpers.forEach(b => {
    const dx = ball.x - b.x;
    const dy = ball.y - b.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < b.r + ball.r) {
      const nx = dx / dist;
      const ny = dy / dist;
      ball.vx = nx * 12;
      ball.vy = ny * 12 - 2;
      score += 250;
      playSFX(660, 0.1, 'square', 0.4);
      createParticles(b.x, b.y, 8, '#facc15');
    }
  });

  // Slings
  slings.forEach(s => {
    if (ball.x > s.x && ball.x < s.x + s.w && ball.y > s.y - 10 && ball.y < s.y + 30) {
      ball.vy = -12;
      ball.vx *= 0.7;
      score += 100;
      playSFX(880, 0.15, 'sawtooth', 0.3);
      createParticles(ball.x, ball.y, 5, '#f97316');
    }
  });

  // Flippers collision
  // Left flipper
  const leftBaseX = 100, leftBaseY = 720;
  const leftTipX = leftBaseX + Math.cos(leftFlipperAngle) * flipperLength;
  const leftTipY = leftBaseY + Math.sin(leftFlipperAngle) * flipperLength;
  if (ball.x > leftBaseX && ball.x < leftTipX + 20 && ball.y > leftBaseY - 20 && ball.y < leftBaseY + 20) {
    if (keys['KeyZ'] || keys['ShiftLeft']) {
      ball.vy = -15;
      ball.vx = 5;
      score += 50;
      playSFX(550, 0.1, 'sine', 0.3);
    }
  }

  // Right flipper
  const rightBaseX = 420, rightBaseY = 720;
  const rightTipX = rightBaseX + Math.cos(rightFlipperAngle) * flipperLength;
  const rightTipY = rightBaseY + Math.sin(rightFlipperAngle) * flipperLength;
  if (ball.x > rightBaseX - 20 && ball.x < rightTipX && ball.y > rightBaseY - 20 && ball.y < rightBaseY + 20) {
    if (keys['Slash'] || keys['ShiftRight']) {
      ball.vy = -15;
      ball.vx = -5;
      score += 50;
      playSFX(550, 0.1, 'sine', 0.3);
    }
  }

  // Collect rings
  rings.forEach(r => {
    if (!r.collected) {
      const dx = ball.x - r.x;
      const dy = ball.y - r.y;
      if (Math.sqrt(dx*dx + dy*dy) < 20) {
        r.collected = true;
        score += 500;
        playSFX(1200, 0.2, 'sine', 0.5);
        createParticles(r.x, r.y, 12, '#facc15');
      }
    }
  });

  // Plunger
  if (!ball.active) {
    ball.x = 550;
    ball.y = plungerY - 25;
    if (plunging) {
      plungerPower = Math.min(12, plungerPower + 0.3);
    }
  }
}

function createParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 20 + Math.random() * 10,
      color
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
    return p.life > 0;
  });
}

function draw() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw table bg
  const bg = new Image();
  bg.src = '/assets/pinball-table-bg.jpg';
  ctx.drawImage(bg, 20, 40, 560, 740);

  // Draw bumpers
  bumpers.forEach(b => {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('★', b.x - 6, b.y + 5);
  });

  // Draw slings
  ctx.fillStyle = '#facc15';
  slings.forEach(s => {
    ctx.fillRect(s.x, s.y, s.w, 8);
  });

  // Draw flippers
  ctx.fillStyle = '#3b82f6';
  // Left
  ctx.save();
  ctx.translate(100, 720);
  ctx.rotate(leftFlipperAngle);
  ctx.fillRect(0, -flipperWidth/2, flipperLength, flipperWidth);
  ctx.restore();
  // Right
  ctx.save();
  ctx.translate(420, 720);
  ctx.rotate(rightFlipperAngle);
  ctx.fillRect(-flipperLength, -flipperWidth/2, flipperLength, flipperWidth);
  ctx.restore();

  // Draw rings
  rings.forEach(r => {
    if (!r.collected) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#854d0e';
      ctx.fillText('★', r.x - 5, r.y + 4);
    }
  });

  // Draw ball (Joshway themed)
  if (ball.active) {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.fillRect(ball.x - 4, ball.y - 2, 8, 4); // cape like
  }

  // Plunger
  ctx.fillStyle = '#f97316';
  ctx.fillRect(540, plungerY, 20, 60 - plungerPower * 4);

  // Particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1;

  // Score
  document.getElementById('score').textContent = String(score).padStart(6, '0');

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 300, 600, 200);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 40px monospace';
    ctx.fillText('GAME OVER', 180, 400);
    ctx.font = '20px monospace';
    ctx.fillText('Press R to restart', 200, 450);
  }
}

function gameLoop() {
  if (!gameOver) {
    updatePhysics();
    updateParticles();

    // Flippers
    const leftDown = keys['KeyZ'] || keys['ShiftLeft'];
    const rightDown = keys['Slash'] || keys['ShiftRight'];
    leftFlipperAngle = leftDown ? -0.6 : 0.3;
    rightFlipperAngle = rightDown ? 0.6 : -0.3;

    // Plunger
    if (keys['Space'] && !ball.active) {
      plunging = true;
    } else {
      if (plunging) {
        launchBall();
        plunging = false;
      }
    }

    if (keys['KeyR'] && gameOver) {
      resetGame();
    }
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  score = 0;
  balls = 3;
  gameOver = false;
  ball.active = false;
  plungerY = 750;
  plungerPower = 0;
  rings.forEach(r => r.collected = false);
  particles = [];
  document.getElementById('balls').textContent = balls;
  document.getElementById('score').textContent = '000000';
}

function init() {
  initAudio();
  startPinballMusic();

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', e => keys[e.code] = false);

  // Start first ball
  setTimeout(() => {
    if (!ball.active && balls > 0) {
      ball.active = true;
      ball.x = 550;
      ball.y = 650;
      ball.vx = -3;
      ball.vy = -8;
      balls--;
      document.getElementById('balls').textContent = balls;
    }
  }, 1000);

  gameLoop();
}

init();