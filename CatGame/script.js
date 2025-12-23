const game = document.getElementById("game");
const cat = document.getElementById("cat");
const scoreText = document.getElementById("score");

/* ========= KONFIG ========= */
const GROUND_HEIGHT = 40;
const GRAVITY = 1.4;
const JUMP_POWER = -26;
const SPEED = 10;

/* ========= STATE ========= */
let x = 100;
let y = 0;
let velocityY = 0;
let isJumping = false;
let direction = -1;

let worldOffset = 0;
let lastPlatformX = 0;
let lastFishX = 0;
let score = 0;

/* ========= INPUT ========= */
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (["ArrowUp","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
});
document.addEventListener("keyup", e => keys[e.key] = false);

/* ========= HJÄLP ========= */
function groundTop() {
  return game.offsetHeight - GROUND_HEIGHT;
}

/* ========= INIT ========= */
function init() {
  y = groundTop() - cat.offsetHeight;
  spawnPlatform();
  requestAnimationFrame(loop);
}

cat.complete ? init() : cat.onload = init;

/* ========= LOOP ========= */
function loop() {
  move();
  gravity();
  platformCollision();
  render();
  updatePlatforms();
  updateFish();
  checkFish();
  requestAnimationFrame(loop);
}

/* ========= MOVE ========= */
function move() {
  if (keys["ArrowLeft"]) {
    if (x > 100) x -= SPEED;
    else if (worldOffset > 0) worldOffset -= SPEED;
    direction = 1;
  }

  if (keys["ArrowRight"]) {
    if (x < game.offsetWidth * 0.45) x += SPEED;
    else worldOffset += SPEED;
    direction = -1;
  }

  if (keys["ArrowUp"] && !isJumping) {
    velocityY = JUMP_POWER;
    isJumping = true;
  }
}

/* ========= GRAVITY ========= */
function gravity() {
  velocityY += GRAVITY;
  y += velocityY;

  if (y + cat.offsetHeight >= groundTop()) {
    y = groundTop() - cat.offsetHeight;
    velocityY = 0;
    isJumping = false;
  }
}

/* ========= PLATFORM COLLISION ========= */
function platformCollision() {
  if (velocityY <= 0) return;

  const catBottom = y + cat.offsetHeight;
  const prevBottom = catBottom - velocityY;

  document.querySelectorAll(".platform").forEach(p => {
    const px = p.dataset.x - worldOffset;
    const py = parseFloat(p.dataset.y);
    const pw = p.offsetWidth;

    if (
      prevBottom <= py &&
      catBottom >= py &&
      x + cat.offsetWidth > px &&
      x < px + pw
    ) {
      y = py - cat.offsetHeight;
      velocityY = 0;
      isJumping = false;
    }
  });
}

/* ========= RENDER ========= */
function render() {
  cat.style.left = x + "px";
  cat.style.top = y + "px";
  cat.style.transform = `scaleX(${direction})`;
  const isMobile = window.innerWidth < 768;

cat.style.top = (isMobile ? y - 10 : y) + "px";
}

/* ========= PLATTFORM ========= */
function updatePlatforms() {
  document.querySelectorAll(".platform").forEach(p => {
    p.style.left = (p.dataset.x - worldOffset) + "px";
    p.style.top = p.dataset.y + "px";
  });

  if (worldOffset - lastPlatformX > 700) {
    spawnPlatform();
    lastPlatformX = worldOffset;
  }
}

function spawnPlatform() {
  const p = document.createElement("div");
  p.className = "platform";

  const worldX = worldOffset + game.offsetWidth + 200;
  const y =
    Math.random() * 140 +
    (groundTop() - 240);

  p.dataset.x = worldX;
  p.dataset.y = y;

  // 👇 SÄTT POSITION INNAN append
  p.style.left = (worldX - worldOffset) + "px";
  p.style.top = y + "px";

  game.appendChild(p);
}

/* ========= FISK ========= */
function updateFish() {
  document.querySelectorAll(".fish").forEach(f => {
    f.style.left = (f.dataset.x - worldOffset) + "px";
  });

  if (worldOffset - lastFishX > 600) {
    spawnFish();
    lastFishX = worldOffset;
  }
}

function spawnFish() {
  const f = document.createElement("div");
  f.className = "fish";
  f.textContent = "🐟";

  const worldX = worldOffset + game.offsetWidth + 300;
  const y =
    Math.random() * 120 +
    (groundTop() - 300);

  f.dataset.x = worldX;

  // 👇 SÄTT POSITION DIREKT
  f.style.left = (worldX - worldOffset) + "px";
  f.style.top = y + "px";

  game.appendChild(f);
}

/* ========= FISK-KOLLISION ========= */
function checkFish() {
  document.querySelectorAll(".fish").forEach(f => {
    if (f.dataset.hit) return;

    const fx = f.offsetLeft + 20;
    const fy = f.offsetTop + 20;
    const cx = x + cat.offsetWidth / 2;
    const cy = y + cat.offsetHeight / 2;

    if (Math.hypot(cx - fx, cy - fy) < 60) {
      f.dataset.hit = "1";
      f.style.opacity = "0";
      score++;
      scoreText.textContent = `Fiskar: ${score} 🐟`;
    }
  });
}

function bindTouch(id, key) {
  const btn = document.getElementById(id);

  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  });

  btn.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  });

  btn.addEventListener("touchcancel", () => {
    keys[key] = false;
  });
}

bindTouch("btn-left", "ArrowLeft");
bindTouch("btn-right", "ArrowRight");
bindTouch("btn-jump", "ArrowUp");