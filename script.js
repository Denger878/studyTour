/* ==================== CANVAS SETUP ==================== */
const canvas = document.getElementById('landscapesCanvas');
const ctx = canvas.getContext('2d');

canvas.width = Math.min(window.innerWidth, 1920);
canvas.height = Math.min(window.innerHeight, 1080);

const landscapes = [
  'landscapes/lofoten_islands.jpg',
  'landscapes/benagil_cave.jpg',
  'landscapes/yellowstone.jpg',
  'landscapes/great_wall_of_china.jpg',
  'landscapes/ben_gioc.jpg'
];

const randomLandscape = landscapes[Math.floor(Math.random() * landscapes.length)];

const landscapeImage = new Image();
landscapeImage.src = randomLandscape;

landscapeImage.onload = function() {
  console.log('Loaded:', randomLandscape);
  ctx.drawImage(landscapeImage, 0, 0, canvas.width, canvas.height);
  imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  drawPixelated(200); // One pixel = whole screen width
  console.log('Pixelated version drawn!');
};

landscapeImage.onerror = function() {
  console.error('Failed to load:', randomLandscape);
};

/* ==================== CONSTANTS ==================== */
const timeButton = document.getElementById('timeButton');
const pauseButton = document.getElementById('pauseButton');
const inputBox = document.querySelector('.input');
const titleStudyTime = document.getElementById('titleStudyTime');
const plus30 = document.getElementById('plus30');
const startButton = document.getElementById('startButton');
const inputScreen = document.querySelector('.inputScreen');
const clockScreen = document.querySelector('.clock');
const clockStudyTime = document.getElementById('studyTime');
let isHovering = false;
let inputValue = 0;
let remainingSeconds = 0;
let countdownInterval = null;
let inFinalMinute = false
let lastStage = -1;
const pixelStages = 32;
const startBlockSize = 128;
const endBlockSize = 4;

/* ==================== TIMER LOGIC ==================== */

/* --------------------TITLE SCREEN-------------------- */

/* Update on Enter key press */
inputBox.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        updateStudyTime();
        inputBox.blur();
    }
});

/* Update when input user clicks elsewhere */
inputBox.addEventListener('blur', function() {
    updateStudyTime();
});

/* Update +30 */
plus30.addEventListener('click', function() {
    inputValue += 30;
    titleStudyTime.textContent = secondsToTime(inputValue * 60);
});

/* Start button - switch screens */
startButton.addEventListener('click', function() {
    if (inputValue > 0) {
        inputScreen.style.display = 'none';
        clockScreen.style.display = 'flex';
        document.body.style.backgroundImage = 'none';
        canvas.style.display = 'block';
        remainingSeconds = inputValue * 60;
        clockStudyTime.textContent = secondsToTime(remainingSeconds);
        drawPixelated(calculateBlockSize());
    }
});

/* Update study time display */
function updateStudyTime() {
    inputValue = parseInt(inputBox.value.trim()) || 0;
    titleStudyTime.textContent = secondsToTime(inputValue * 60);
}

/* --------------------CLOCK SCREEN-------------------- */

/* Hide function for real time clock */
timeButton.addEventListener('mouseenter', function (){
    isHovering = true;
    timeButton.textContent = "Hide";
});

timeButton.addEventListener('mouseleave', function (){
    isHovering = false;
    updateClock();
});

timeButton.addEventListener('click', function(){
    timeButton.style.display = 'none';
})

/* Pause/Start button */
pauseButton.addEventListener('click', function() {
    if (pauseButton.textContent === "Start") {
        pauseButton.style.opacity = '0';
        startCountdown();
        pauseButton.textContent = "Pause";
    } else if (pauseButton.textContent === "Pause") {
        clearInterval(countdownInterval);
        pauseButton.textContent = "Resume";
    } else {
        startCountdown();
        pauseButton.textContent = "Pause";
    }
});

pauseButton.addEventListener('mouseenter', function() {
    if (pauseButton.textContent === "Pause") {
        pauseButton.style.opacity = '1';
    }
});

/* Hide pause button when mouse leaves */
pauseButton.addEventListener('mouseleave', function() {
    if (pauseButton.textContent === "Pause") {
        pauseButton.style.opacity = '0';
    }
});

/* Real time clock update */
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours());
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (!isHovering) {
        document.getElementById('timeButton').textContent = `${hours} : ${minutes} : ${seconds}`;
    }
}

/* --------------------CLOCK LOGIC-------------------- */

/* Convert seconds to time format */
function secondsToTime(seconds) {
    const total = parseInt(seconds) || 0;
    const secs = total % 60;
    const mins = Math.floor(total / 60) % 60;
    const hours = Math.floor(total / 3600);
    if (hours === 0) {
        return `0:${String(mins).padStart(2, '0')}`;
    }
    return `${hours}:${String(mins).padStart(2, '0')}`;
}

/* Countdown timer function */
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    let lastUpdateTime = Date.now();
    countdownInterval = setInterval(function() {
        const now = Date.now();
        const deltaTime = now - lastUpdateTime;
        lastUpdateTime = now;
        
        // Only decrement if close to 1 second has passed
        if (deltaTime >= 900) { // 900ms threshold accounts for small delays
            remainingSeconds--;
        }
        
        // Update clock display every tick
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            clockStudyTime.textContent = '';
            timeButton.style.display = 'none';
            pauseButton.style.display = 'none';
            // Final reveal here (Section 4)
        } else if (remainingSeconds <= 60) {
            clockStudyTime.textContent = remainingSeconds;
        } else {
            clockStudyTime.textContent = secondsToTime(remainingSeconds);
        }
        
        // Update pixels only when stage changes (not every second!)
        const newStage = calculateStage();
        if (newStage !== lastStage) {
            lastStage = newStage;
            const blockSize = calculateBlockSize();
            drawPixelated(blockSize);
            console.log(`Stage ${newStage}: ${blockSize}px blocks`);
        }
        
    }, 1000);
}

updateClock();
setInterval(updateClock, 1000);

/* ==================== PIXEL REVEAL ==================== */

let imageData = null;

// Draw the image in pixelated blocks
function drawPixelated(blockSize) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw blocks
  for (let y = 0; y < canvas.height; y += blockSize) {
    for (let x = 0; x < canvas.width; x += blockSize) {
      const color = getAverageColor(x, y, blockSize, blockSize);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, blockSize, blockSize);
    }
  }
}

/* Get average color of an image */
function getAverageColor(startX, startY, blockWidth, blockHeight) {
  let r = 0, g = 0, b = 0, count = 0;
  
  for (let y = startY; y < startY + blockHeight && y < canvas.height; y++) {
    for (let x = startX; x < startX + blockWidth && x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      r += imageData.data[index];     // Red
      g += imageData.data[index + 1]; // Green
      b += imageData.data[index + 2]; // Blue
      count++;
    }
  }
 return `rgb(${Math.floor(r/count)}, ${Math.floor(g/count)}, ${Math.floor(b/count)})`;
}

// Calculate what block size should be based on current stage
function calculateBlockSize() {
  const stage = calculateStage();
  const numberOfStages = 16; // Must match the number in calculateStage()
  
  const maxBlockSize = 256;
  const minBlockSize = 8;
  
  // Create exponential curve for satisfying "splitting" feel
  const stageProgress = stage / (numberOfStages - 1); // 0 to 1
  const easedProgress = Math.pow(stageProgress, 1.4); // Slight ease
  
  const blockSize = maxBlockSize * Math.pow(minBlockSize / maxBlockSize, easedProgress);
  
  return Math.round(blockSize);
}

// Calculate which discrete stage we're in (0 to numberOfStages-1)
function calculateStage() {
  const totalSeconds = inputValue * 60;
  if (totalSeconds === 0) return 0;
  
  const progress = (totalSeconds - remainingSeconds) / totalSeconds; // 0 to 1
  const numberOfStages = 16; // Image will change 12 times total
  
  const stage = Math.floor(progress * numberOfStages);
  return Math.min(stage, numberOfStages - 1);
}

/* ==================== INITIALIZATION ==================== */