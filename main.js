// Get canvas element and its 2d context
const canvas = document.getElementById('canvas1');
const context = canvas.getContext('2d');

// Set canvas width and height
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 464;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Load images for various elements
const cloudImage = new Image();
cloudImage.src = './assets/images/cloud.png';

const mountainImage = new Image();
mountainImage.src = './assets/images/forest_mountain.png';

const backForestImage = new Image();
backForestImage.src = './assets/images/forest_back.png';

const midForestImage = new Image();
midForestImage.src = './assets/images/forest_mid.png';

const frontForestImage = new Image();
frontForestImage.src = './assets/images/forest_long.png';

const playerImage = new Image();
playerImage.src = './assets/images/plane.png';

const laserImage = new Image();
laserImage.src = './assets/images/laser.png';

const explosionImage = new Image();
explosionImage.src = './assets/images/explosion.png';

// Load sounds
const gameOverSound = new Audio('./assets/sounds/gameOver.mp3');
const missileSound = new Audio('./assets/sounds/laserRelease.mp3');
const explosionSound = new Audio('./assets/sounds/explosion.mp3');

// Load enemy images
const enemyImages = [
    new Image(),
    new Image(),
    new Image(),
    new Image(),
];
enemyImages[0].src = './assets/images/enemy1.png';
enemyImages[1].src = './assets/images/enemy2.png';
enemyImages[2].src = './assets/images/enemy3.png';
enemyImages[3].src = './assets/images/enemy4.png';

// Define the details for each enemy type
const enemyDetails = [
    { spriteWidth: 1412 / 4, spriteHeight: 168, spriteCount: 4 },
    { spriteWidth: 1448 / 4, spriteHeight: 214, spriteCount: 4 },
    { spriteWidth: 904 / 4, spriteHeight: 103, spriteCount: 4 },
    { spriteWidth: 2540 / 4, spriteHeight: 218, spriteCount: 4 },
];

// Initial game settings
let gameSpeed = 5;
let spawnInterval = 1500;
let level = 1;
let enemiesDefeated = 0;

// Define the movement keys
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    r: false,
};

// Define Layer class to handle background layers
class Layer {
    constructor(image, speedModifier, originalWidth, originalHeight, y) {
        this.image = image;
        this.x = 0;
        this.y = y;
        this.width = CANVAS_WIDTH;
        this.height = (originalHeight / originalWidth) * CANVAS_WIDTH;
        this.x2 = this.width;
        this.speedModifier = speedModifier;
        this.speed = gameSpeed * this.speedModifier;
    }

    // Update the layer position to create scrolling effect
    update() {
        if (this.x <= -this.width) {
            this.x = this.width + this.x2 - this.speed;
        }
        if (this.x2 <= -this.width) {
            this.x2 = this.width + this.x - this.speed;
        }
        this.x = Math.floor(this.x - this.speed);
        this.x2 = Math.floor(this.x2 - this.speed);
    }

    // Draw the layer on the canvas
    draw() {
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        context.drawImage(this.image, this.x2, this.y, this.width, this.height);
    }
}

// Create layers for background images
const layer1 = new Layer(cloudImage, 0.05, 1900, 1000, -550);
const layer2 = new Layer(mountainImage, 0.1, 3800, 2400, -250);
const layer3 = new Layer(backForestImage, 0.2, 3800, 2400, -230);
const layer4 = new Layer(midForestImage, 0.3, 3800, 2400, -240);
const layer5 = new Layer(frontForestImage, 0.4, 3800, 1200, 85);
const layersObjects = [layer1, layer2, layer3, layer4, layer5];

// Define Sprite class for any moving object (player, enemy, etc.)
class Sprite {
    constructor(x, y, width, height, image, spriteWidth, spriteHeight, spriteCount, speed = 0, frameSpeed = 10) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.spriteCount = spriteCount;
        this.frameSpeed = frameSpeed;
        this.speed = speed;
        this.spriteIndex = 0;
        this.frameCount = 0;
    }

    // Update the sprite's animation frame
    update() {
        this.frameCount++;
        if (this.frameCount % this.frameSpeed === 0) {
            this.spriteIndex = (this.spriteIndex + 1) % this.spriteCount;
        }
    }

    // Draw the sprite on the canvas
    draw(context) {
        context.drawImage(
            this.image,
            this.spriteIndex * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height
        );
    }
}

// Define Player class, inherits from Sprite
class Player extends Sprite {
    constructor(x, y, width, height, image, spriteWidth, spriteHeight, spriteCount, speed) {
        super(x, y, width, height, image, spriteWidth, spriteHeight, spriteCount, speed);
        this.health = 5;
    }

    // Move the player with boundary checks
    move(dx, dy) {
        if (this.x + dx >= 0 && this.x + dx + this.width <= CANVAS_WIDTH) {
            this.x += dx;
        }
        if (this.y + dy >= 0 && this.y + dy + this.height <= CANVAS_HEIGHT) {
            this.y += dy;
        }
    }
}

// Define Laser class, inherits from Sprite
class Laser extends Sprite {
    constructor(x, y, width, height, image, speed) {
        super(x, y, width, height, image, 422 / 2, 92, 2, speed);
    }

    // Update laser position (moving it to the right)
    update() {
        this.x += this.speed;
    }
}

// Define Explosion class, inherits from Sprite
class Explosion extends Sprite {
    constructor(x, y, image, width, height, spriteCount, frameSpeed) {
        const spriteWidth = width / spriteCount;
        super(x, y, spriteWidth, height, image, spriteWidth, height, spriteCount, 0, frameSpeed);
    }

    // Update explosion animation
    update() {
        super.update();
    }
}

// Define Enemy class, inherits from Sprite
class Enemy extends Sprite {
    constructor(x, y, image, enemyType, speed) {
        const { spriteWidth, spriteHeight, spriteCount } = enemyDetails[enemyType];
        const scaledWidth = spriteWidth * 0.5;
        const scaledHeight = spriteHeight * 0.5;
        super(x, y, scaledWidth, scaledHeight, image, spriteWidth, spriteHeight, spriteCount, speed, 10);
    }

    // Update enemy's position
    update() {
        this.x -= this.speed;
        super.update();
    }

    // Reset enemy when it moves off-screen
    reset() {
        if (this.x < -this.width) {
            this.x = CANVAS_WIDTH + Math.random() * 200;
            this.y = Math.random() * (CANVAS_HEIGHT - 100);
        }
    }
}

// Create the player object
let player = new Player(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT - 100, 100, 50, playerImage, 2450 / 7, 150, 7, 5);

// Arrays for lasers, explosions, and enemies
let lasers = [];
let explosions = [];
let enemies = [];

// Speed multipliers for different enemy types
const speedMultipliers = [3, 2, 1.5, 1];

// Cooldown for laser shooting
let laserCooldown = 300;
let lastShotTime = 0;

// Shoot a laser
function shootLaser() {
    const now = Date.now();
    if (now - lastShotTime > laserCooldown) {
        lasers.push(new Laser(player.x + player.width, player.y + player.height / 4, 40, 20, laserImage, 10)); 
        missileSound.play();
        lastShotTime = now;
    }
}

// Spawn new enemies at regular intervals
function spawnEnemies() {
    setInterval(() => {
        let enemyType = Math.floor(Math.random() * 4);
        let speed = gameSpeed / speedMultipliers[enemyType];
        let enemy = new Enemy(CANVAS_WIDTH + 200, Math.random() * (CANVAS_HEIGHT - 100), enemyImages[enemyType], enemyType, speed);
        enemies.push(enemy);
    }, spawnInterval);
}

// Check for collision between two objects
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Handle game over
let gameOverFlag = false;
let startTime = Date.now();
let survivedTime = 0;

function gameOver() {
    if (!gameOverFlag) {
        gameOverFlag = true;
        cancelAnimationFrame(animate);
        gameOverSound.play();
        context.fillStyle = "black";
        context.font = "50px Arial";
        context.fillText("GAME OVER", CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2);
        context.font = "30px Arial";
        context.fillText(`Survived: ${survivedTime} seconds`, CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 + 50);
    }
}

// Update time survived by the player
function updateSurvivedTime() {
    if (!gameOverFlag) {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        survivedTime = elapsedTime; 
    }
}

// Increase game difficulty over time
let lastSpeedIncreaseTime = Date.now();
let timeBetweenSpeedIncreases = 30000;

function checkAndIncreaseDifficulty() {
    const currentTime = Date.now();
    if (currentTime - lastSpeedIncreaseTime > timeBetweenSpeedIncreases) {
        lastSpeedIncreaseTime = currentTime;
        gameSpeed += 1;
        spawnInterval = Math.max(1000, spawnInterval - 200);
    }
}

// Reset the game
function resetGame() {
    // Stop the previous enemy spawn interval if it exists
    if (enemySpawnInterval) {
        clearInterval(enemySpawnInterval);
    }

    // Set game flags and variables back to their initial state
    gameOverFlag = false;
    enemiesDefeated = 0;
    lasers = [];
    explosions = [];
    enemies = [];
    survivedTime = 0;
    startTime = Date.now();

    // Reset the player to its initial position and state
    player = new Player(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT - 100, 100, 50, playerImage, 2450 / 7, 150, 7, 5);

    // Reset game speed and spawn interval
    gameSpeed = 5;
    spawnInterval = 1500;

    // Reset background layers to their starting positions
    layersObjects.forEach(layer => {
        layer.x = 0;
        layer.x2 = layer.width;
    });

    // Start the enemy spawn interval
    spawnEnemies();

    // Restart the animation loop
    animate();
}

// Animation loop
function animate() {
    context.fillStyle = '#87CEEB';
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    checkAndIncreaseDifficulty();

    // Update and draw each layer
    layersObjects.forEach(layer => {
        layer.update();
        layer.draw();
    });

    // Player movement based on keys pressed
    if (keys.ArrowLeft) player.move(-player.speed, 0);
    if (keys.ArrowRight) player.move(player.speed, 0);
    if (keys.ArrowUp) player.move(0, -player.speed);
    if (keys.ArrowDown) player.move(0, player.speed);

    // Update and draw player sprite
    player.update();
    player.draw(context);

    // Update and draw lasers
    lasers.forEach((laser, index) => {
        laser.update();
        laser.draw(context);

        // Check for laser collisions with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(laser, enemy)) {
                lasers.splice(index, 1);
                explosions.push(new Explosion(enemy.x + enemy.width / 2 - 2800 / (2 * 7), enemy.y + enemy.height / 2 - 300 / 2, explosionImage, 2800, 300, 7, 5));
                enemies.splice(enemyIndex, 1);
                enemiesDefeated++;
                explosionSound.play();
            }
        });
    });

    // Check for collisions between player and enemies
    enemies.forEach((enemy) => {
        if (checkCollision(player, enemy)) {
            gameOver();
        }
    });

    // Update and draw enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw(context);
        enemy.reset();
    });

    // Update and draw explosions
    explosions.forEach((explosion, index) => {
        explosion.update();
        explosion.draw(context);
        if (explosion.spriteIndex >= explosion.spriteCount - 1) {
            explosions.splice(index, 1);
        }
    });

    // Draw game info (time survived)
    drawInfo();
    updateSurvivedTime();

    // Request the next animation frame
    if (!gameOverFlag) {
        requestAnimationFrame(animate);
    }
}

// Draw game info
function drawInfo() {
    context.fillStyle = "black";
    context.font = "20px Arial";
    context.fillText(`Survived: ${survivedTime} sec`, 20, 30);
}

// Handle key events
document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === ' ') shootLaser();
    if (e.key === 'r' && gameOverFlag) resetGame();
});
document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Track loaded images and start the game once all images are loaded
let imagesLoaded = 0;
const totalImages = 9;

function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        spawnEnemies();
        animate();
    }
}

cloudImage.onload = checkImagesLoaded;
mountainImage.onload = checkImagesLoaded;
backForestImage.onload = checkImagesLoaded;
midForestImage.onload = checkImagesLoaded;
frontForestImage.onload = checkImagesLoaded;
playerImage.onload = checkImagesLoaded;
laserImage.onload = checkImagesLoaded;
explosionImage.onload = checkImagesLoaded;
enemyImages[0].onload = checkImagesLoaded;
enemyImages[1].onload = checkImagesLoaded;
enemyImages[2].onload = checkImagesLoaded;
enemyImages[3].onload = checkImagesLoaded;
