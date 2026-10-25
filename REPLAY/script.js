
/* running game */

const game = document.getElementById("game");
const person = document.getElementById("person");
const personSprite = document.getElementById("personSprite");
const rock = document.getElementById("rock");
const scoreText = document.getElementById("score");
const message = document.getElementById("message");

/* game settings */

const groundHeight = 6;
const personX = 60;
const personWidth = 42;

let playing = false;
let score = 0;
let speed = 260;

let personY = 0;
let velocityY = 0;
let jumping = false;
let jumpCount = 0;

let rocks = [];
let nextRock = 300;
let lastTime = 0;

/* random number */

function random(min, max) {
    return Math.random() * (max - min) + min;
}

/* make rocks */

function createRocks() {
    const types = ["small", "big", "double", "mixed"];
    const type = types[Math.floor(Math.random() * types.length)];

    let sizes;

    if (type === "small") {
        sizes = [[25, 18]];
    } else if (type === "big") {
        sizes = [[42, 35]];
    } else if (type === "double") {
        sizes = [[24, 20], [24, 20]];
    } else {
        sizes = [[25, 18], [37, 30]];
    }

    let x = game.clientWidth + 20;

    sizes.forEach(function(size) {
        const element = document.createElement("div");

        element.className = "game-rock";
        element.style.width = size[0] + "px";
        element.style.height = size[1] + "px";

        game.appendChild(element);

        rocks.push({
            element: element,
            x: x,
            width: size[0],
            height: size[1]
        });

        x += size[0] + 10;
    });
}

/* start game */

function startGame() {
    playing = true;
    score = 0;
    speed = 260;

    personY = 0;
    velocityY = 0;
    jumping = false;
    jumpCount = 0;

    // remove old rocks
    rocks.forEach(function(item) {
        item.element.remove();
    });

    rocks = [];

    // hide old rock
    if (rock) {
        rock.style.display = "none";
    }

    nextRock = 300;

    person.style.bottom = groundHeight + "px";

    scoreText.textContent = "Score: 0";
    message.textContent = "";

    personSprite.classList.add("running");

    lastTime = performance.now();
}


/* double jump */

function jump() {
    if (!playing || jumpCount >= 2) return;

    if (jumpCount === 0) {
        velocityY = 650;
    } else {
        velocityY = 750;
    }

    jumping = true;
    jumpCount++;
}


/* game over */

function endGame() {
    playing = false;

    personSprite.classList.remove("running");

    message.textContent = "Game over! Press space to restart";
}

/* update game */

function update(delta) {
    if (!playing) return;

    score += delta * 10;

    // increase speed
    speed = Math.min(480, 260 + score * 1.2);

    scoreText.textContent = "Score: " + Math.floor(score);

    // jump physics
    if (jumping) {
        velocityY -= 1450 * delta;
        personY += velocityY * delta;

        // land on ground
        if (personY <= 0) {
            personY = 0;
            velocityY = 0;
            jumping = false;
            jumpCount = 0;
        }
    }

    person.style.bottom = (groundHeight + personY) + "px";

    // create rocks
    nextRock -= speed * delta;

    if (nextRock <= 0) {
        createRocks();

        // random spacing
        nextRock = random(250, 480);
    }

    // move rocks
    rocks.forEach(function(item) {
        item.x -= speed * delta;
        item.element.style.left = item.x + "px";

        // collision
        const hitX =
            personX + personWidth - 8 > item.x &&
            personX + 8 < item.x + item.width;

        const hitY = personY < item.height - 4;

        if (hitX && hitY) {
            endGame();
        }
    });

    // remove old rocks
    rocks = rocks.filter(function(item) {
        if (item.x + item.width < 0) {
            item.element.remove();
            return false;
        }

        return true;
    });
}

/* game loop */

function gameLoop(time) {
    const delta = Math.min(
        (time - (lastTime || time)) / 1000,
        0.03
    );

    lastTime = time;

    update(delta);

    requestAnimationFrame(gameLoop);
}

/* controls */

document.addEventListener("keydown", function(event) {
    if (event.code !== "Space") return;

    event.preventDefault();

    if (event.repeat) return;

    if (!playing) {
        startGame();
    } else {
        jump();
    }
});

/* start game loop */

requestAnimationFrame(gameLoop);
