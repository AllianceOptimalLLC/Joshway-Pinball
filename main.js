// Joshway Pinball - Full Production Sonic-style Arcade
// Multiple tables, improved physics, power-ups, high scores, Joshway hero theme

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: true });

// === UI Elements ===
const titleScreen = document.getElementById('title-screen');
const levelSelect = document.getElementById('level-select');
const gameContainer = document.getElementById('game-container');
const endScreen = document.getElementById('end-screen');
const highscoresModal = document.getElementById('highscores-modal');
const instructionsModal = document.getElementById('instructions-modal');

const scoreEl = document.getElementById('score');
const ballsEl = document.getElementById('balls');
const levelEl = document.getElementById('level');
const multEl = document.getElementById('multiplier');
const powerupBar = document.getElementById('powerup-bar');
const finalScoreEl = document.getElementById('final-score');
const endTitleEl = document.getElementById('end-title');
const bonusInfo = document.getElementById('level-complete-info');
const bonusScoreEl = document.getElementById('bonus-score');
const hsLevelEl = document.getElementById('hs-level');
const highscoreListEl = document.getElementById('highscore-list');
const modalHighscoreListEl = document.getElementById('modal-highscore-list');

// === GAME STATE ===
let gameState = 'title'; // title, levelselect, playing, paused, ended
let currentLevel = 0;
let score = 0;
let remainingBalls = 3;
let multiplier = 1;
let levelCleared = false;
let isMuted = false;

let activeBalls = [];
let particles = [];
let floatingTexts = [];
let powerOrbs = [];
let powerUps = []; // {type, expires}

let leftFlipperAngle = 0.25;
let rightFlipperAngle = -0.25;
let leftFlipperVel = 0;
let rightFlipperVel = 0;
const FLIPPER_LENGTH = 78;
const FLIPPER_WIDTH = 13;

let plungerY = 755;
let plungerPower = 0;
let plunging = false;

const keys = {};
let musicTimer = null;
let lastPowerSpawn = 0;

// Images (preloaded)
const bgImages = {};
const ballImg = new Image();
const powerImg = new Image();
const titleImg = new Image();

function loadAssets() {
  bgImages[0] = new Image(); bgImages[0].src = '/assets/level1-bg.jpg';
  bgImages[1] = new Image(); bgImages[1].src = '/assets/level2-bg.jpg';
  bgImages[2] = new Image(); bgImages[2].src = '/assets/level3-bg.jpg';
  ballImg.src = '/assets/ball-sprite.png';
  powerImg.src = '/assets/powerups.png';
  titleImg.src = '/assets/title-banner.png';
}
loadAssets();

// === TABLE DEFINITIONS - 3 LEVELS, INCREASING DIFFICULTY ===
const TABLES = [
  // LEVEL 1: Adventure Island - Easy, forgiving
  {
    id: 0,
    name: "ADVENTURE ISLAND",
    bg: 0,
    difficulty: 1,
    walls: [
      { x1: 55, y1: 45, x2: 545, y2: 45 },   // top
      { x1: 545, y1: 45, x2: 572, y2: 92 },
      { x1: 572, y1: 92, x2: 572, y2: 755 },
      { x1: 572, y1: 755, x2: 515, y2: 780 },
      { x1: 55, y1: 45, x2: 28, y2: 92 },
      { x1: 28, y1: 92, x2: 28, y2: 755 },
      { x1: 28, y1: 755, x2: 85, y2: 780 },
      // plunger lane divider
      { x1: 505, y1: 620, x2: 505, y2: 780 },
    ],
    bumpers: [
      { x: 160, y: 185, r: 27, pts: 320 },
      { x: 310, y: 135, r: 26, pts: 320 },
      { x: 455, y: 195, r: 26, pts: 320 },
      { x: 195, y: 335, r: 22, pts: 180 },
      { x: 410, y: 355, r: 22, pts: 180 },
      { x: 285, y: 460, r: 19, pts: 140 },
    ],
    slings: [
      { x: 95, y: 655, w: 88, h: 15 },
      { x: 418, y: 655, w: 88, h: 15 },
    ],
    ramps: [
      { x1: 110, y1: 520, x2: 195, y2: 290, boost: 1.15 }, // left ramp
      { x1: 410, y1: 510, x2: 505, y2: 285, boost: 1.1 }, // right
    ],
    rings: [
      { x: 185, y: 265, collected: false },
      { x: 355, y: 210, collected: false },
      { x: 470, y: 295, collected: false },
      { x: 140, y: 410, collected: false },
      { x: 305, y: 390, collected: false },
    ],
    outlanes: [
      { x1: 35, y1: 680, x2: 85, y2: 770 }, // left out
      { x1: 515, y1: 680, x2: 560, y2: 770 }, // right out
    ],
    plungerX: 540,
    launchX: 540,
    launchY: 635,
    ringBonusMult: 120,
  },
  // LEVEL 2: Courage City - Medium, more elements + ramps
  {
    id: 1,
    name: "COURAGE CITY",
    bg: 1,
    difficulty: 1.6,
    walls: [
      { x1: 55, y1: 42, x2: 545, y2: 42 },
      { x1: 545, y1: 42, x2: 575, y2: 85 },
      { x1: 575, y1: 85, x2: 575, y2: 755 },
      { x1: 575, y1: 755, x2: 512, y2: 782 },
      { x1: 55, y1: 42, x2: 25, y2: 85 },
      { x1: 25, y1: 85, x2: 25, y2: 755 },
      { x1: 25, y1: 755, x2: 88, y2: 782 },
      { x1: 502, y1: 605, x2: 502, y2: 782 },
      // extra wall bump for challenge
      { x1: 140, y1: 118, x2: 220, y2: 148 },
    ],
    bumpers: [
      { x: 145, y: 170, r: 25, pts: 380 },
      { x: 295, y: 115, r: 25, pts: 420 },
      { x: 460, y: 175, r: 24, pts: 380 },
      { x: 175, y: 305, r: 21, pts: 210 },
      { x: 395, y: 320, r: 21, pts: 210 },
      { x: 270, y: 440, r: 18, pts: 165 },
      { x: 440, y: 465, r: 20, pts: 195 },
    ],
    slings: [
      { x: 88, y: 648, w: 92, h: 14 },
      { x: 422, y: 648, w: 92, h: 14 },
    ],
    ramps: [
      { x1: 95, y1: 505, x2: 175, y2: 255, boost: 1.22 },
      { x1: 405, y1: 500, x2: 502, y2: 260, boost: 1.18 },
      { x1: 235, y1: 580, x2: 360, y2: 170, boost: 0.95 }, // middle
    ],
    rings: [
      { x: 170, y: 245, collected: false },
      { x: 340, y: 175, collected: false },
      { x: 480, y: 255, collected: false },
      { x: 125, y: 385, collected: false },
      { x: 310, y: 360, collected: false },
      { x: 445, y: 410, collected: false },
    ],
    outlanes: [
      { x1: 30, y1: 670, x2: 82, y2: 775 },
      { x1: 518, y1: 670, x2: 565, y2: 775 },
    ],
    plungerX: 538,
    launchX: 538,
    launchY: 630,
    ringBonusMult: 145,
  },
  // LEVEL 3: Star Fortress - Hard, tight, fast, more outlanes, speed
  {
    id: 2,
    name: "STAR FORTRESS",
    bg: 2,
    difficulty: 2.3,
    walls: [
      { x1: 52, y1: 40, x2: 548, y2: 40 },
      { x1: 548, y1: 40, x2: 578, y2: 78 },
      { x1: 578, y1: 78, x2: 578, y2: 748 },
      { x1: 578, y1: 748, x2: 508, y2: 782 },
      { x1: 52, y1: 40, x2: 22, y2: 78 },
      { x1: 22, y1: 78, x2: 22, y2: 748 },
      { x1: 22, y1: 748, x2: 92, y2: 782 },
      { x1: 498, y1: 592, x2: 498, y2: 782 },
      { x1: 165, y1: 105, x2: 260, y2: 128 },
      { x1: 340, y1: 105, x2: 435, y2: 128 },
    ],
    bumpers: [
      { x: 130, y: 155, r: 23, pts: 480 },
      { x: 280, y: 98, r: 22, pts: 520 },
      { x: 470, y: 155, r: 23, pts: 480 },
      { x: 155, y: 282, r: 18, pts: 260 },
      { x: 375, y: 292, r: 18, pts: 260 },
      { x: 245, y: 415, r: 17, pts: 210 },
      { x: 400, y: 440, r: 19, pts: 245 },
      { x: 185, y: 530, r: 15, pts: 185 },
    ],
    slings: [
      { x: 78, y: 640, w: 95, h: 13 },
      { x: 428, y: 640, w: 95, h: 13 },
    ],
    ramps: [
      { x1: 78, y1: 498, x2: 145, y2: 215, boost: 1.35 },
      { x1: 425, y1: 490, x2: 498, y2: 215, boost: 1.32 },
      { x1: 205, y1: 560, x2: 395, y2: 135, boost: 1.1 },
    ],
    rings: [
      { x: 155, y: 225, collected: false },
      { x: 320, y: 150, collected: false },
      { x: 485, y: 230, collected: false },
      { x: 105, y: 360, collected: false },
      { x: 295, y: 335, collected: false },
      { x: 470, y: 375, collected: false },
      { x: 220, y: 495, collected: false },
    ],
    outlanes: [
      { x1: 25, y1: 645, x2: 78, y2: 772 },
      { x1: 522, y1: 645, x2: 570, y2: 772 },
      { x1: 498, y1: 555, x2: 498, y2: 592 }, // extra drain zone
    ],
    plungerX: 536,
    launchX: 536,
    launchY: 625,
    ringBonusMult: 165,
  },
  // LEVEL 4: JOSHWAY'S HIDEOUT - Unique cozy living room Joshway theme, furniture obstacles, loops
  {
    id: 3,
    name: "JOSHWAY'S HIDEOUT",
    bg: 0, // reuse adventure for cozy feel, or could enhance draw
    difficulty: 2.7,
    walls: [
      { x1: 50, y1: 38, x2: 550, y2: 38 },
      { x1: 550, y1: 38, x2: 582, y2: 72 },
      { x1: 582, y1: 72, x2: 582, y2: 752 },
      { x1: 582, y1: 752, x2: 510, y2: 785 },
      { x1: 50, y1: 38, x2: 18, y2: 72 },
      { x1: 18, y1: 72, x2: 18, y2: 752 },
      { x1: 18, y1: 752, x2: 90, y2: 785 },
      { x1: 500, y1: 600, x2: 500, y2: 785 },
      // cozy furniture walls: sofa divider, tv stand, shelf
      { x1: 120, y1: 160, x2: 195, y2: 175 },
      { x1: 380, y1: 150, x2: 465, y2: 168 },
      { x1: 250, y1: 480, x2: 355, y2: 495 },
    ],
    bumpers: [
      { x: 125, y: 210, r: 26, pts: 520 }, // sofa cushion
      { x: 295, y: 125, r: 23, pts: 580 }, // lamp
      { x: 465, y: 205, r: 25, pts: 510 },
      { x: 165, y: 345, r: 20, pts: 280 },
      { x: 385, y: 355, r: 20, pts: 290 },
      { x: 280, y: 460, r: 19, pts: 240 },
      { x: 430, y: 490, r: 22, pts: 310 },
      { x: 110, y: 560, r: 16, pts: 210 },
    ],
    slings: [
      { x: 75, y: 635, w: 98, h: 16 },
      { x: 432, y: 635, w: 98, h: 16 },
    ],
    ramps: [
      { x1: 85, y1: 505, x2: 155, y2: 205, boost: 1.38 }, // left bookshelf ramp
      { x1: 420, y1: 500, x2: 495, y2: 195, boost: 1.32 },
      { x1: 220, y1: 555, x2: 375, y2: 145, boost: 1.15 }, // living room loop ramp
    ],
    rings: [
      { x: 145, y: 240, collected: false },
      { x: 310, y: 175, collected: false },
      { x: 470, y: 225, collected: false },
      { x: 115, y: 400, collected: false },
      { x: 290, y: 395, collected: false },
      { x: 460, y: 425, collected: false },
      { x: 205, y: 530, collected: false },
      { x: 355, y: 515, collected: false },
    ],
    outlanes: [
      { x1: 22, y1: 650, x2: 75, y2: 775 },
      { x1: 525, y1: 650, x2: 572, y2: 775 },
      { x1: 500, y1: 565, x2: 500, y2: 600 },
    ],
    plungerX: 538,
    launchX: 538,
    launchY: 630,
    ringBonusMult: 175,
  }
];

let currentTable = TABLES[0];

// === AUDIO - Enhanced Procedural SFX + Music ===
let audioCtx;
function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {}
}

function playSFX(freq, dur, type = 'square', vol = 0.28, ramp = 0.06) {
  if (!audioCtx || isMuted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = type;
  osc.frequency.value = freq;
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  gain.gain.value = vol;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  const t = audioCtx.currentTime;
  gain.gain.linearRampToValueAtTime(0.0001, t + dur);
  osc.stop(t + dur + 0.02);
}

function playHeroChime() {
  if (!audioCtx || isMuted) return;
  [880, 1175, 1568].forEach((f, i) => setTimeout(() => playSFX(f, 0.13, 'sine', 0.45), i * 65));
}

function playPowerSFX(type) {
  if (!audioCtx || isMuted) return;
  if (type === 'multiball') {
    [420, 580, 780, 980].forEach((f, i) => setTimeout(() => playSFX(f, 0.18, 'sawtooth', 0.35), i * 55));
  } else if (type === 'multiplier') {
    [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => playSFX(f, 0.11, 'triangle', 0.38), i * 42));
  } else {
    playSFX(1240, 0.22, 'sine', 0.42);
  }
}

function playBounce(type = 'bumper') {
  if (type === 'bumper') playSFX(620 + Math.random()*60, 0.07, 'square', 0.32);
  else if (type === 'sling') playSFX(920, 0.1, 'sawtooth', 0.26);
  else if (type === 'flipper') playSFX(480, 0.08, 'triangle', 0.29);
  else playSFX(340, 0.12, 'sawtooth', 0.22);
}

function startPinballMusic(level = 0) {
  if (!audioCtx || isMuted) return;
  if (musicTimer) clearTimeout(musicTimer);
  const levelMelodies = [
    [392, 523, 659, 784, 659, 523, 392],       // L1 adventure
    [440, 554, 698, 880, 698, 554, 440, 523], // L2 city upbeat
    [523, 659, 784, 1046, 932, 784, 659, 523] // L3 epic
  ];
  const notes = levelMelodies[level] || levelMelodies[0];
  const tempo = (level === 2) ? 95 : 145;

  function playLoop() {
    if (gameState !== 'playing') return;
    notes.forEach((f, i) => {
      setTimeout(() => {
        if (gameState === 'playing') {
          const t = (i % 3 === 0) ? 'sawtooth' : 'square';
          playSFX(f, 0.17, t, 0.12);
          // bass undertone
          if (i % 2 === 0) playSFX(f * 0.5, 0.28, 'sine', 0.07);
        }
      }, i * tempo);
    });
    musicTimer = setTimeout(playLoop, notes.length * tempo + 180);
  }
  playLoop();
}

function stopMusic() {
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

// === PHYSICS HELPERS - Improved realistic ===
function circleLineCollision(b, x1, y1, x2, y2, restitution = 0.83) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return false;

  let t = ((b.x - x1) * dx + (b.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const distx = b.x - cx;
  const disty = b.y - cy;
  const dist = Math.sqrt(distx * distx + disty * disty);
  if (dist < b.r + 1.5 && dist > 0.1) {
    const nx = distx / dist;
    const ny = disty / dist;
    // reflect
    const dot = b.vx * nx + b.vy * ny;
    b.vx = (b.vx - 2 * dot * nx) * restitution;
    b.vy = (b.vy - 2 * dot * ny) * restitution;
    // push out
    const overlap = b.r - dist + 1.2;
    b.x += nx * overlap;
    b.y += ny * overlap;
    return { nx, ny, hit: true };
  }
  return false;
}

function applyFlipperImpulse(b, baseX, baseY, tipX, tipY, angle, vel, isLeft) {
  const dx = b.x - baseX;
  const dy = b.y - baseY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist > 14 && dist < FLIPPER_LENGTH + 19) {
    const proj = (dx * (tipX-baseX) + dy * (tipY-baseY)) / (FLIPPER_LENGTH * FLIPPER_LENGTH);
    if (proj > 0.05 && proj < 1.05) {
      // normal approx perpendicular to flipper
      const fx = tipX - baseX;
      const fy = tipY - baseY;
      const len = Math.sqrt(fx*fx + fy*fy);
      const nx = -fy / len;
      const ny = fx / len;
      const dot = b.vx * nx + b.vy * ny;
      let restitution = 0.92;
      b.vx = (b.vx - 2 * dot * nx) * restitution;
      b.vy = (b.vy - 2 * dot * ny) * restitution;

      // Add flip impulse (key part of good flipper feel)
      const flipForce = Math.max(5, Math.abs(vel) * 18 + 11);
      const along = isLeft ? 1 : -1;
      b.vx += along * flipForce * 0.6;
      b.vy -= flipForce * 1.15;

      // slightly push out
      b.x += nx * 3.5;
      b.y += ny * 3.5;

      return true;
    }
  }
  return false;
}

// === CORE GAME FUNCTIONS ===
function addScore(pts, x = 300, y = 120) {
  const ptsGained = Math.floor(pts * multiplier);
  score += ptsGained;
  // floating text
  floatingTexts.push({ x, y, text: '+' + ptsGained, life: 26, vy: -1.1 });
  updateHUD();
}

function updateHUD() {
  scoreEl.textContent = String(Math.floor(score)).padStart(6, '0');
  ballsEl.textContent = remainingBalls + (activeBalls.length > 1 ? '+' + (activeBalls.length - 1) : '');
  levelEl.textContent = (currentLevel + 1);
  multEl.textContent = multiplier.toFixed(1);

  // powerup icons display - use emoji for reliability & Joshway flair
  powerupBar.innerHTML = '';
  const now = Date.now();
  powerUps = powerUps.filter(p => p.expires > now);
  powerUps.forEach((p) => {
    const el = document.createElement('span');
    el.style.display = 'inline-block';
    el.style.margin = '0 2px';
    el.style.fontSize = '15px';
    el.style.verticalAlign = 'middle';
    el.title = p.type.toUpperCase();
    let icon = '✨';
    if (p.type === 'multiball') icon = '⚡';
    else if (p.type === 'multiplier') icon = '✨';
    else if (p.type === 'extraball') icon = '🟢';
    else if (p.type === 'capeboost') icon = '🦸';
    else if (p.type === 'shield') icon = '🛡️';
    el.textContent = icon;
    powerupBar.appendChild(el);
  });
  if (activeBalls.length > 1) {
    const mb = document.createElement('span');
    mb.style.marginLeft = '4px';
    mb.style.fontSize = '9px';
    mb.style.color = '#67e8f9';
    mb.textContent = 'MULTI';
    powerupBar.appendChild(mb);
  }
}

function createParticles(x, y, count, color, type = 'spark') {
  for (let i = 0; i < count; i++) {
    const spread = (type === 'star') ? 3.2 : 5.5;
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.5) * spread - (type === 'star' ? 1.6 : 1.2),
      life: 18 + Math.random() * 19,
      color,
      size: (type === 'star') ? 3.5 : 2.5,
      type
    });
  }
}

function addFloatingText(x, y, txt, col = '#facc15') {
  floatingTexts.push({ x, y, text: txt, life: 32, vy: -1.6, col });
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.19;
    p.vx *= 0.985;
    p.life -= 1;
    return p.life > 0;
  });
  floatingTexts = floatingTexts.filter(ft => {
    ft.y += ft.vy;
    ft.life--;
    return ft.life > 0;
  });
}

function spawnPowerOrb(x, y) {
  const rand = Math.random();
  let type = 'multiball';
  if (rand < 0.35) type = 'multiball';
  else if (rand < 0.65) type = 'multiplier';
  else if (rand < 0.82) type = 'extraball';
  else if (rand < 0.93) type = 'capeboost';
  else type = 'shield';
  powerOrbs.push({
    x, y,
    r: 11,
    type,
    life: 480
  });
  createParticles(x, y, 9, '#a5f3fc', 'star');
}

function activatePower(type) {
  const now = Date.now();
  if (type === 'multiball') {
    // spawn 2 additional balls near center
    for (let i = 0; i < 2; i++) {
      const nb = createBall(240 + i * 90, 420, (i-0.5) * 2.6, -7.5 - Math.random()*1.8);
      activeBalls.push(nb);
    }
    playPowerSFX('multiball');
    addFloatingText(300, 210, 'MULTI-BALL!', '#67e8f9');
    powerUps.push({ type, expires: now + 9200 });
  } else if (type === 'multiplier') {
    multiplier = Math.min(5.5, multiplier + 1.5);
    playPowerSFX('multiplier');
    addFloatingText(300, 190, 'x' + multiplier.toFixed(1) + ' COURAGE!', '#fde047');
    powerUps.push({ type, expires: now + 13500 });
    setTimeout(() => {
      if (multiplier > 1) multiplier = Math.max(1, multiplier - 1.4);
      updateHUD();
    }, 13400);
  } else if (type === 'extraball') {
    remainingBalls = Math.min(5, remainingBalls + 1);
    playPowerSFX('multiball');
    addFloatingText(300, 220, '★ EXTRA BALL! ★', '#4ade80');
    createParticles(300, 200, 18, '#4ade80', 'star');
    powerUps.push({ type, expires: now + 6500 });
  } else if (type === 'capeboost') {
    // Joshway cape boost: temp high speed + score
    activeBalls.forEach(b => { b.vx *= 1.6; b.vy *= 1.3 - 0.8; });
    multiplier = Math.min(6, multiplier + 0.8);
    playPowerSFX('multiplier');
    addFloatingText(300, 175, 'CAPE BOOST! JOSHWAY POWER!', '#f97316');
    powerUps.push({ type, expires: now + 8200 });
    setTimeout(() => {
      if (multiplier > 1) multiplier = Math.max(1, multiplier - 0.9);
      updateHUD();
    }, 8000);
  } else if (type === 'shield') {
    powerUps.push({ type, expires: now + 15500 });
    addFloatingText(300, 195, 'SHIELD ACTIVE! NO DRAIN!', '#a5b4fc');
    playSFX(880, 0.4, 'sine', 0.4);
  }
  updateHUD();
}

// Create a new ball object
function createBall(x, y, vx = 0, vy = -7.5) {
  return {
    x, y, vx, vy,
    r: 11.5,
    trail: []
  };
}

function launchNewBall(forcePower = 0) {
  if (remainingBalls <= 0 && activeBalls.length === 0) return false;
  const t = currentTable;
  const newBall = createBall(
    t.launchX || 540,
    t.launchY || 635,
    - (forcePower || plungerPower * 7.4 + 1.6),
    - (forcePower || plungerPower * 2.6 + 4)
  );
  activeBalls.push(newBall);
  plungerPower = 0;
  if (forcePower === 0 && remainingBalls > 0) {
    remainingBalls--;
  }
  playSFX(920, 0.18, 'sine', 0.38);
  updateHUD();
  return true;
}

function drainBall(idx) {
  const b = activeBalls[idx];
  if (!b) return;

  // Shield powerup saves a drain once (Joshway hero protection)
  const shieldIdx = powerUps.findIndex(p => p.type === 'shield');
  if (shieldIdx !== -1) {
    activeBalls.splice(idx, 1);
    createParticles(b.x, b.y, 22, '#a5b4fc', 'star');
    playSFX(620, 0.25, 'sine', 0.45);
    addFloatingText(b.x, b.y - 25, 'SHIELD SAVED!', '#a5b4fc');
    powerUps.splice(shieldIdx, 1);
    if (activeBalls.length === 0 && remainingBalls > 0) {
      setTimeout(() => {
        if (gameState === 'playing' && activeBalls.length === 0 && remainingBalls > 0) {
          launchNewBall(1.2);
        }
      }, 550);
    }
    updateHUD();
    return;
  }

  activeBalls.splice(idx, 1);
  createParticles(b.x, b.y, 14, '#f87171');
  playBounce('drain');

  if (activeBalls.length === 0) {
    if (remainingBalls > 0) {
      // auto launch next after short delay
      setTimeout(() => {
        if (gameState === 'playing' && activeBalls.length === 0 && remainingBalls > 0) {
          launchNewBall(1.5);
        }
      }, 620);
    } else {
      endGame();
    }
  }
  updateHUD();
}

// Main physics update - supports multi-ball + better collisions
function updatePhysics() {
  if (activeBalls.length === 0) return;

  const t = currentTable;
  const now = Date.now();

  activeBalls.forEach((b, idx) => {
    // Gravity + slight air drag, level difficulty scales
    b.vy += 0.235 + (t.difficulty - 1) * 0.035;
    const drag = 0.9925 - (t.difficulty - 1) * 0.003;
    b.vx *= drag;
    b.vy *= drag;

    // Speed clamp (prevents crazy tunneling)
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const maxSpeed = 19 + t.difficulty * 1.5;
    if (speed > maxSpeed) {
      const s = maxSpeed / speed;
      b.vx *= s; b.vy *= s;
    }

    b.x += b.vx;
    b.y += b.vy;

    // Trail for polish
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 5) b.trail.shift();

    // === WALLS ===
    t.walls.forEach(w => {
      circleLineCollision(b, w.x1, w.y1, w.x2, w.y2, 0.81);
    });

    // === RAMPS (special bounce + boost) ===
    t.ramps.forEach(r => {
      const hit = circleLineCollision(b, r.x1, r.y1, r.x2, r.y2, 0.88);
      if (hit && r.boost) {
        b.vx *= r.boost;
        b.vy = Math.min(b.vy * r.boost - 1.4, -6);
        addScore(65, b.x, b.y - 10);
      }
    });

    // === OUTLANES (instant drain) ===
    let drained = false;
    t.outlanes.forEach(o => {
      if (!drained) {
        const hit = circleLineCollision(b, o.x1, o.y1, o.x2, o.y2, 0.6);
        if (hit) {
          drained = true;
          addScore(-30);
          drainBall(idx);
        }
      }
    });
    if (drained) return;

    // Floor drain zone
    if (b.y > 788) {
      drainBall(idx);
      return;
    }

    // Top bounds
    if (b.y < 38) {
      b.vy = Math.abs(b.vy) * 0.8;
      b.y = 42;
    }
    if (b.x < 18) { b.x = 22; b.vx = Math.abs(b.vx) * 0.75; }
    if (b.x > 582) { b.x = 578; b.vx = -Math.abs(b.vx) * 0.75; }

    // === BUMPERS (pop + points) ===
    t.bumpers.forEach(bmp => {
      const dx = b.x - bmp.x;
      const dy = b.y - bmp.y;
      const d = Math.hypot(dx, dy);
      if (d < bmp.r + b.r + 0.8) {
        const nx = dx / (d || 1);
        const ny = dy / (d || 1);
        const push = 13.5 + t.difficulty * 0.7;
        b.vx = nx * push;
        b.vy = ny * push - 1.4;
        addScore(bmp.pts, bmp.x, bmp.y);
        playBounce('bumper');
        createParticles(bmp.x, bmp.y, 9, '#fde047', 'star');

        // chance to spawn power orb
        if (Math.random() < 0.11 && powerOrbs.length < 1 && now - lastPowerSpawn > 2400) {
          spawnPowerOrb(bmp.x + (Math.random()-0.5)*28, bmp.y - 36);
          lastPowerSpawn = now;
        }
      }
    });

    // === SLINGS ===
    t.slings.forEach(s => {
      if (b.x > s.x - 4 && b.x < s.x + s.w + 4 && b.y > s.y - 14 && b.y < s.y + s.h + 11) {
        b.vy = -14.5;
        b.vx = (b.x < s.x + s.w / 2) ? -5.5 : 5.5;
        addScore(115, b.x, b.y);
        playBounce('sling');
        createParticles(b.x, b.y - 4, 6, '#f97316');
      }
    });

    // === FLIPPERS (proper impulse) ===
    // Left
    const lBaseX = 92, lBaseY = 718;
    const lTipX = lBaseX + Math.cos(leftFlipperAngle) * FLIPPER_LENGTH;
    const lTipY = lBaseY + Math.sin(leftFlipperAngle) * FLIPPER_LENGTH;
    const leftDown = keys['KeyZ'] || keys['ShiftLeft'];
    if (applyFlipperImpulse(b, lBaseX, lBaseY, lTipX, lTipY, leftFlipperAngle, leftFlipperVel, true)) {
      addScore(38);
      playBounce('flipper');
    }

    // Right
    const rBaseX = 428, rBaseY = 718;
    const rTipX = rBaseX + Math.cos(rightFlipperAngle) * FLIPPER_LENGTH;
    const rTipY = rBaseY + Math.sin(rightFlipperAngle) * FLIPPER_LENGTH;
    const rightDown = keys['Slash'] || keys['ShiftRight'];
    if (applyFlipperImpulse(b, rBaseX, rBaseY, rTipX, rTipY, rightFlipperAngle, rightFlipperVel, false)) {
      addScore(38);
      playBounce('flipper');
    }

    // === COLLECT RINGS ===
    t.rings.forEach((r, ri) => {
      if (!r.collected) {
        const dx = b.x - r.x, dy = b.y - r.y;
        if (Math.hypot(dx, dy) < 17) {
          r.collected = true;
          addScore(980, r.x, r.y - 6);
          playHeroChime();
          createParticles(r.x, r.y, 16, '#fde047', 'star');
          // check clear
          if (t.rings.every(rr => rr.collected)) {
            levelCleared = true;
            const bonus = Math.floor(score * 0.12) + 4200;
            addScore(bonus, 300, 130);
            addFloatingText(300, 145, '★ ALL RINGS! HERO BONUS!', '#facc15');
          }
        }
      }
    });

    // === POWER ORBS ===
    powerOrbs.forEach((orb, oi) => {
      const dx = b.x - orb.x, dy = b.y - orb.y;
      if (Math.hypot(dx, dy) < orb.r + b.r + 2) {
        activatePower(orb.type);
        powerOrbs.splice(oi, 1);
        createParticles(orb.x, orb.y, 11, '#67e8f9', 'star');
      }
    });
  });

  // clean dead power orbs
  powerOrbs = powerOrbs.filter(o => --o.life > 0);

  // plunger position when no balls moving
  if (activeBalls.length === 0 && remainingBalls > 0) {
    // ready for launch
  }
}

// Flippers with realistic spring motion
function updateFlippers() {
  const leftPressed = keys['KeyZ'] || keys['ShiftLeft'];
  const rightPressed = keys['Slash'] || keys['ShiftRight'];

  // Target angles
  const leftTarget = leftPressed ? -0.68 : 0.32;
  const rightTarget = rightPressed ? 0.68 : -0.32;

  // spring velocities + damping
  leftFlipperVel = (leftFlipperVel * 0.74) + (leftTarget - leftFlipperAngle) * 0.19;
  rightFlipperVel = (rightFlipperVel * 0.74) + (rightTarget - rightFlipperAngle) * 0.19;

  leftFlipperAngle += leftFlipperVel;
  rightFlipperAngle += rightFlipperVel;

  // clamp
  leftFlipperAngle = Math.max(-0.72, Math.min(0.38, leftFlipperAngle));
  rightFlipperAngle = Math.max(-0.38, Math.min(0.72, rightFlipperAngle));
}

function updatePlunger() {
  if (keys['Space'] && gameState === 'playing' && activeBalls.length < 3) {
    plunging = true;
    plungerPower = Math.min(13.5, plungerPower + 0.29);
  } else if (plunging) {
    if (activeBalls.length === 0 && remainingBalls > 0) {
      launchNewBall();
    }
    plunging = false;
    plungerPower = 0;
  }
}

// === DRAW - Polished visuals using assets ===
function draw() {
  const t = currentTable;
  // Background fill + table art
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, 600, 800);

  // Draw level-specific table background
  const bg = bgImages[t.bg];
  if (bg && bg.complete) {
    ctx.drawImage(bg, 18, 35, 564, 748);
  } else {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(22, 42, 556, 728);
  }

  // Table border & frame (heroic)
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 35, 564, 748);
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(26, 43, 548, 732);

  // Plunger lane highlight
  ctx.fillStyle = 'rgba(249,115,22,0.25)';
  ctx.fillRect(505, 590, 68, 195);

  // Draw ramps (warm glowing lines)
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#f97316';
  t.ramps.forEach(r => {
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    ctx.lineTo(r.x2, r.y2);
    ctx.stroke();
    // highlight
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = '#f97316';
  });

  // Bumpers - rich Joshway style
  t.bumpers.forEach((b, i) => {
    const hueShift = i % 2 === 0 ? '#f97316' : '#eab308';
    ctx.fillStyle = hueShift;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.x - 4, b.y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('★', b.x - 6, b.y + 5);
    // rim
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1, 0, Math.PI * 2); ctx.stroke();
  });

  // Slings
  ctx.fillStyle = '#facc15';
  t.slings.forEach(s => {
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(s.x + 3, s.y + 3, s.w - 6, 3);
    ctx.fillStyle = '#facc15';
  });

  // Rings - star coins, animated
  const ringPulse = Math.sin(Date.now() / 180) * 1.5 + 10.5;
  t.rings.forEach(r => {
    if (!r.collected) {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(r.x, r.y, ringPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('★', r.x - 5.5, r.y + 5.5);
      // outer ring
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, ringPulse + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Power orbs
  powerOrbs.forEach(o => {
    ctx.fillStyle = (o.type === 'multiball') ? '#67e8f9' : '#facc15';
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r + Math.sin(Date.now()/110)*1.5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = '10px monospace';
    ctx.fillText(o.type[0].toUpperCase(), o.x - 3.5, o.y + 3.5);
  });

  // Flippers - improved look with hero colors
  ctx.fillStyle = '#1e40af';
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.5;
  // Left
  ctx.save();
  ctx.translate(92, 718);
  ctx.rotate(leftFlipperAngle);
  ctx.fillRect(0, -FLIPPER_WIDTH/2, FLIPPER_LENGTH, FLIPPER_WIDTH);
  ctx.strokeRect(0, -FLIPPER_WIDTH/2, FLIPPER_LENGTH, FLIPPER_WIDTH);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(FLIPPER_LENGTH - 18, -3, 15, 6);
  ctx.restore();

  // Right
  ctx.fillStyle = '#1e40af';
  ctx.save();
  ctx.translate(428, 718);
  ctx.rotate(rightFlipperAngle);
  ctx.fillRect(-FLIPPER_LENGTH, -FLIPPER_WIDTH/2, FLIPPER_LENGTH, FLIPPER_WIDTH);
  ctx.strokeRect(-FLIPPER_LENGTH, -FLIPPER_WIDTH/2, FLIPPER_LENGTH, FLIPPER_WIDTH);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-FLIPPER_LENGTH + 3, -3, 15, 6);
  ctx.restore();

  // Balls (Joshway cape hero ball)
  activeBalls.forEach(b => {
    // trail
    ctx.globalAlpha = 0.3;
    b.trail.forEach((tr, i) => {
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, b.r * (0.55 + i * 0.08), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (ballImg.complete && ballImg.width > 10) {
      ctx.drawImage(ballImg, b.x - b.r - 2, b.y - b.r - 2, b.r * 2.1 + 4, b.r * 2.1 + 4);
    } else {
      // fallback hero ball
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.fillRect(b.x - 5, b.y - 2.5, 10, 5); // cape
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(b.x + 2, b.y - 1, 2.5, 0, Math.PI*2); ctx.fill();
    }
  });

  // Plunger
  ctx.fillStyle = '#c2410f';
  ctx.fillRect(534, plungerY - plungerPower * 1.7, 24, 62);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(537, plungerY + 4 - plungerPower * 1.7, 18, 6);

  // Particles + floating scores
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0.15, p.life / 28);
    ctx.fillStyle = p.color;
    const s = p.size || 2.5;
    if (p.type === 'star') {
      ctx.fillText('★', p.x - 3, p.y + 3);
    } else {
      ctx.fillRect(p.x, p.y, s, s);
    }
  });
  ctx.globalAlpha = 1;

  floatingTexts.forEach(ft => {
    ctx.globalAlpha = ft.life / 30;
    ctx.fillStyle = ft.col || '#fde047';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(ft.text, ft.x, ft.y);
  });
  ctx.globalAlpha = 1;

  // Side art / Joshway branding
  ctx.fillStyle = 'rgba(250, 204, 21, 0.6)';
  ctx.font = '9px monospace';
  ctx.fillText('J', 8, 68);
  ctx.fillText('★', 8, 760);

  // If paused overlay
  if (gameState === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(80, 280, 440, 210);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('PAUSED', 210, 345);
    ctx.font = '13px monospace';
    ctx.fillText('PRESS P TO RESUME', 175, 390);
  }
}

function gameLoop() {
  if (gameState === 'playing') {
    updatePhysics();
    updateParticles();
    updateFlippers();
    updatePlunger();

    // occasional auto ring respawn hint or power spawn
    if (Math.random() < 0.004 && powerOrbs.length === 0) {
      const t = currentTable;
      const uncol = t.rings.filter(r => !r.collected);
      if (uncol.length > 1) {
        const pick = uncol[Math.floor(Math.random() * uncol.length)];
        spawnPowerOrb(pick.x + 25, pick.y - 38);
      }
    }

    // check victory condition mid-game (optional extra ball)
    if (levelCleared && activeBalls.length > 0 && Math.random() < 0.004) {
      // rare extra ball on cleared
    }
  }

  draw();
  updateHUD();

  requestAnimationFrame(gameLoop);
}

// === LEVEL / GAME CONTROL ===
function initLevel(levelIdx) {
  currentLevel = levelIdx;
  currentTable = TABLES[levelIdx];

  // deep copy rings
  currentTable.rings = TABLES[levelIdx].rings.map(r => ({ ...r, collected: false }));

  score = 0;
  remainingBalls = 3;
  multiplier = 1.0;
  levelCleared = false;
  activeBalls = [];
  particles = [];
  floatingTexts = [];
  powerOrbs = [];
  powerUps = [];
  plungerPower = 0;
  plunging = false;
  leftFlipperAngle = 0.26;
  rightFlipperAngle = -0.26;
  lastPowerSpawn = Date.now();

  // reset HUD
  updateHUD();
  powerupBar.innerHTML = '';

  // switch screens
  titleScreen.classList.add('hidden');
  levelSelect.classList.add('hidden');
  endScreen.classList.add('hidden');
  highscoresModal.classList.add('hidden');
  gameContainer.classList.remove('hidden');

  gameState = 'playing';

  stopMusic();
  startPinballMusic(levelIdx);

  // Launch first ball
  setTimeout(() => {
    if (gameState === 'playing' && activeBalls.length === 0) {
      launchNewBall(0.8);
    }
  }, 820);
}

function endGame() {
  gameState = 'ended';
  stopMusic();

  const t = currentTable;
  let bonus = 0;
  if (levelCleared) {
    bonus = Math.floor(score * (t.ringBonusMult / 100)) + 1800;
    score += bonus;
    bonusScoreEl.textContent = String(bonus).padStart(4, '0');
    bonusInfo.style.display = 'block';
  } else {
    bonusInfo.style.display = 'none';
  }

  finalScoreEl.textContent = String(Math.floor(score)).padStart(6, '0');
  endTitleEl.textContent = levelCleared ? 'VICTORY! HERO!' : 'GAME OVER';
  hsLevelEl.textContent = (currentLevel + 1);

  // Save + show high scores
  saveHighScore(currentLevel, Math.floor(score));
  displayHighScoresForLevel(currentLevel, highscoreListEl);

  // show UI (keep container visible for overlay positioning)
  // gameContainer stays visible so end-screen inside is positioned correctly
  endScreen.classList.remove('hidden');

  // Show next if cleared and not last level
  const nextBtn = document.getElementById('next-level-btn');
  if (levelCleared && currentLevel < TABLES.length - 1) {
    nextBtn.style.display = 'inline-block';
    nextBtn.onclick = () => {
      endScreen.classList.add('hidden');
      initLevel(currentLevel + 1);
    };
  } else {
    nextBtn.style.display = 'none';
  }
}

function resetToLevelSelect() {
  gameState = 'levelselect';
  stopMusic();
  gameContainer.classList.add('hidden');
  endScreen.classList.add('hidden');
  highscoresModal.classList.add('hidden');
  instructionsModal.classList.add('hidden');
  levelSelect.classList.remove('hidden');
  activeBalls = [];
}

function saveHighScore(level, finalScore) {
  let hs = JSON.parse(localStorage.getItem('joshwayHighScores') || '[[],[],[],[]]');
  if (!hs[level]) hs[level] = [];
  hs[level].push(finalScore);
  hs[level].sort((a, b) => b - a);
  hs[level] = hs[level].slice(0, 5);
  localStorage.setItem('joshwayHighScores', JSON.stringify(hs));
}

function displayHighScoresForLevel(level, targetEl) {
  const hs = JSON.parse(localStorage.getItem('joshwayHighScores') || '[[],[],[],[]]');
  const list = (hs[level] || []);
  targetEl.innerHTML = '';
  if (list.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No scores yet — be the first hero!';
    targetEl.appendChild(li);
  } else {
    list.forEach((s, i) => {
      const li = document.createElement('li');
      li.innerHTML = `#${i+1} <span class="score">${String(s).padStart(6,'0')}</span>`;
      targetEl.appendChild(li);
    });
  }
}

function showHighScores(level = null) {
  highscoresModal.classList.remove('hidden');
  const selLevel = (level !== null) ? level : currentLevel;
  displayHighScoresForLevel(selLevel, modalHighscoreListEl);
}

function hideHighScores() {
  highscoresModal.classList.add('hidden');
}

// === INPUT HANDLING ===
function setupInput() {
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['Space', 'KeyP', 'KeyR', 'KeyM'].includes(e.code)) e.preventDefault();

    if (gameState === 'playing') {
      if (e.code === 'KeyP') {
        gameState = (gameState === 'playing') ? 'paused' : 'playing';
      }
      if (e.code === 'KeyR' && remainingBalls < 1) {
        initLevel(currentLevel); // quick retry
      }
      if (e.code === 'KeyM') {
        isMuted = !isMuted;
        if (isMuted) stopMusic(); else startPinballMusic(currentLevel);
      }
    } else if (gameState === 'paused' && e.code === 'KeyP') {
      gameState = 'playing';
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'Space' && plunging && gameState === 'playing') {
      if (activeBalls.length === 0) launchNewBall();
      plunging = false;
      plungerPower = 0;
    }
  });

  // Level select buttons
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lvl = parseInt(btn.dataset.level);
      initLevel(lvl);
    });
  });

  // Title buttons
  document.getElementById('play-btn').onclick = () => {
    titleScreen.classList.add('hidden');
    levelSelect.classList.remove('hidden');
  };
  document.getElementById('highscores-btn').onclick = () => showHighScores(0);
  document.getElementById('instructions-btn').onclick = () => {
    instructionsModal.classList.remove('hidden');
  };

  // End screen buttons
  document.getElementById('retry-btn').onclick = () => {
    endScreen.classList.add('hidden');
    initLevel(currentLevel);
  };
  document.getElementById('level-select-btn').onclick = resetToLevelSelect;
  document.getElementById('main-menu-btn').onclick = () => {
    endScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    levelSelect.classList.add('hidden');
    highscoresModal.classList.add('hidden');
    instructionsModal.classList.add('hidden');
    titleScreen.classList.remove('hidden');
    gameState = 'title';
    stopMusic();
  };

  // High scores modal
  document.getElementById('close-highscores').onclick = hideHighScores;
  document.querySelectorAll('#highscores-modal [data-hs-level]').forEach(b => {
    b.onclick = () => displayHighScoresForLevel(parseInt(b.dataset.hsLevel), modalHighscoreListEl);
  });

  // Instructions
  document.getElementById('close-instructions').onclick = () => instructionsModal.classList.add('hidden');

  // Back from level select
  document.getElementById('back-to-title').onclick = () => {
    levelSelect.classList.add('hidden');
    titleScreen.classList.remove('hidden');
  };

  // Click canvas to nudge or launch if idle
  canvas.addEventListener('click', () => {
    if (gameState === 'playing' && activeBalls.length === 0 && remainingBalls > 0) {
      launchNewBall(3);
    } else if (gameState === 'playing') {
      // nudge physics
      activeBalls.forEach(b => { b.vx += (Math.random() - 0.5) * 1.1; });
    }
  });

  // Prevent space scroll
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault();
  }, { passive: false });
}

// === INIT EVERYTHING ===
function initGame() {
  initAudio();
  setupInput();

  // Initial screen
  titleScreen.classList.remove('hidden');
  levelSelect.classList.add('hidden');
  gameContainer.classList.add('hidden');
  endScreen.classList.add('hidden');
  highscoresModal.classList.add('hidden');
  instructionsModal.classList.add('hidden');

  gameState = 'title';

  // Boot music on first interaction hint
  const startMusicOnce = () => {
    if (!audioCtx) initAudio();
    if (gameState === 'title' && !isMuted) {
      // light menu music
      if (!musicTimer) {
        setTimeout(() => {
          if (gameState === 'title' && !musicTimer) {
            // simple menu loop
            const menuNotes = [330, 415, 523];
            menuNotes.forEach((f, i) => setTimeout(() => playSFX(f, 0.25, 'sine', 0.09), i*260));
            setTimeout(() => { if (gameState === 'title' && !isMuted) startMusicOnce(); }, 1900);
          }
        }, 120);
      }
    }
    window.removeEventListener('click', startMusicOnce);
    window.removeEventListener('keydown', startMusicOnce);
  };
  window.addEventListener('click', startMusicOnce, { once: true });
  window.addEventListener('keydown', startMusicOnce, { once: true });

  // Boot game loop
  gameLoop();

  // Easter egg: click title shows high scores
  const titleDiv = document.querySelector('.title');
  if (titleDiv) titleDiv.onclick = () => showHighScores(0);

  // Dev note in console only
  console.log('%c[JOSHWAY PINBALL] Full production build ready. Multiple levels, physics, power-ups loaded.', 'color:#facc15');
}

initGame();