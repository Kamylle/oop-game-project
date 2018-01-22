// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;
var MAX_LIVES = 3;

var COOLDOWN_SHOOT = 500;
var ADD_AMMO = 3;

var ITEM_WIDTH = 75;
var ITEM_HEIGHT = 75;
var MAX_ITEMS = 1;

var EXPLOSION_WIDTH = 75;
var EXPLOSION_HEIGHT = 75;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var TOP_ARROW_CODE = 38;
var SPACEBAR_CODE = 33;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';

// Speed Variation
var speedIncrement = 0.00003;
var speedIncrease = 0.25;

// Animations
var explosionTimeout = 0;
var animationSpeed = 300;
var timeSinceSwitch = 0;
var animationSwitch = true;

// Storing the things
var bullets = [];
var oneUps = [];
var ammos = [];
var enemies = [];



// Preload game images
var images = {};
['enemy.png', 'player.png', 'heart.png', 'noheart.png', 'bigheart.png', 'explosion.png', 'bg.png', 'bullet.png', 'gun.png',].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});


// Mapping lists with objects
var listMap = {
    Enemy: enemies,
    OneUp: oneUps,
    Ammo: ammos,
    Bullet: bullets
};

// Mapping max with objects
var maxMap = {
    Enemy: MAX_ENEMIES,
    OneUp: MAX_ITEMS,
    Ammo: MAX_ITEMS,
    Bullet: MAX_ITEMS //TODO Change This
};


// This section is where you will be doing most of your coding

class Entity {
    render(ctx) {
        var frameX = (animationSwitch ? 0 : this.width);
        ctx.drawImage(this.sprite, frameX, 0, this.width, this.height, this.x, this.y, this.width, this.height,);
    }
    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
    doCollide(obj) {
        var colliding = false;
        if (this.x == obj.x && this.y > obj.y && this.y < obj.y + obj.height) {
            colliding = true;
        }
        return colliding;
    }
}

class Enemy extends Entity{

    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;
        this.max = MAX_ENEMIES;

        // Each enemy should have a different speed
        //this.speed = Math.random() / 2 + 0.25; //Original Speed
        this.speed = Math.random() / 3 + speedIncrease;
    }
}

class OneUp extends Entity{
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ITEM_HEIGHT;
        this.width = ITEM_WIDTH;
        this.height = ITEM_HEIGHT;
        this.sprite = images['bigheart.png'];
        this.speed = Math.random() / 4 + speedIncrease;
        this.max = MAX_ITEMS;
    }
}

class Ammo extends Entity{
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ITEM_HEIGHT;
        this.width = ITEM_WIDTH;
        this.height = ITEM_HEIGHT;
        this.sprite = images['gun.png'];
        this.speed = Math.random() / 4 + speedIncrease;
        this.max = MAX_ITEMS;
    }
}


class Bullet extends Entity{
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.width = ITEM_WIDTH;
        this.height = ITEM_HEIGHT;
        this.sprite = images['bullet.png'];
        this.speed = - 3;
    }
}

class Player extends Entity{
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
        this.ammunitions = 5;
        this.cooldownShoot = 0;
        
    }

    shoot() {
        if (this.cooldownShoot <= 0 && this.ammunitions > 0) {
            bullets[bullets.length] = new Bullet(this.x);
            this.ammunitions = this.ammunitions - 1;
            this.cooldownShoot = COOLDOWN_SHOOT;
        }
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }
}



/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup entities
        this.setupElements(Enemy);
        this.setupElements(OneUp);
        this.setupElements(Ammo);

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an element can be present.
     At any point in time there can be at most maxNum enemies otherwise the game would be impossible
     */
    setupElements(objClass) {
        var objectList = listMap[objClass.name];
        var maxNum = maxMap[objClass.name];

        while (objectList.filter(e => !!e).length <  maxNum) {
            this.addElement(objClass);
        }
    }

    // This method finds a random spot where there is no element, and puts one in there
    addElement(objClass) {
        var elementSpots = GAME_WIDTH / ITEM_WIDTH;
        var objectList = listMap[objClass.name];

        var elementSpot;
        // Keep looping until we find a free enemy spot at random
        while (elementSpot == undefined || objectList[elementSpot]) {
            elementSpot = Math.floor(Math.random() * elementSpots);
        }

        objectList[elementSpot] = new objClass(elementSpot * ITEM_WIDTH);
    }

    //Check if anything should disapear
    disapearElements(lst) {
        lst.forEach((item, itemIdx) => {
            if (item.y > GAME_HEIGHT) {
                delete lst[itemIdx];
            }
        });
    }
       

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lives = MAX_LIVES;
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
            else if (e.keyCode === TOP_ARROW_CODE) {
                this.player.shoot();
            }
            else {
                location.reload();
            }
        });

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        //Speed Increase
        speedIncrease = speedIncrease + speedIncrement;

        // Call update on all entities
        enemies.forEach(enemy => enemy.update(timeDiff));
        oneUps.forEach(oneUp => oneUp.update(timeDiff));
        ammos.forEach(ammo => ammo.update(timeDiff));
        bullets.forEach(bullet => bullet.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['bg.png'], 0, 0); // draw the bg
        enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        oneUps.forEach(oneUp => oneUp.render(this.ctx)); // draw the Items
        ammos.forEach(ammo => ammo.render(this.ctx)); // draw the Items
        bullets.forEach(bullet => bullet.render(this.ctx)); // draw the Items
        this.player.render(this.ctx); // draw the player


        this.disapearElements(enemies);
        this.setupElements(Enemy);
        this.killEnemy();

        this.disapearElements(oneUps);
        this.setupElements(OneUp);
        this.gainLife();
        this.gainAmmo();

        this.disapearElements(ammos);
        this.setupElements(Ammo);

        // Check if the player is exploding
        if (this.explosionTimeout > 0) {
            this.ctx.drawImage(images['explosion.png'], 0, 0, 75, 75, this.player.x, this.player.y, 75, 75,);
            this.explosionTimeout = this.explosionTimeout - 1;
        }

        // Check if player is dead
        if (this.isPlayerDead() && this.lives == 0) {
            this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            this.ctx.drawImage(images['bg.png'], 0, 0); // draw the bg
            // If they are dead, then it's game over!
            this.ctx.font = '300 26px "Oswald"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('Score : ' + this.score, 40, 250);

            this.ctx.font = '500 50px "Oswald"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('GAME OVER', 40, 220);
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.drawImage( this.lives > 0 ? images['heart.png'] : images['noheart.png'], 20, 55);
            this.ctx.drawImage( this.lives > 1 ? images['heart.png'] : images['noheart.png'], 60, 55);
            this.ctx.drawImage( this.lives > 2 ? images['heart.png'] : images['noheart.png'], 100, 55);

            this.ctx.font = '500 30px "Oswald"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 20, 40);

            this.ctx.font = '300 30px "Oswald"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText("Ammo: " + this.player.ammunitions, 250, 40);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }

        //Animations Frames
        timeSinceSwitch = timeSinceSwitch + timeDiff;

        if (timeSinceSwitch >= animationSpeed) {
            animationSwitch = !animationSwitch;
            timeSinceSwitch = timeSinceSwitch - animationSpeed;
        }
        //Shooting Cooldown
            if (this.player.cooldownShoot > 0) {
            this.player.cooldownShoot = this.player.cooldownShoot - timeDiff;
        }
    }

    isPlayerDead() {
        var isDead = false;
        enemies.forEach((enemy, enemyIdx) => {
            if (this.player.doCollide(enemy)) {
                    delete enemies[enemyIdx];
                    this.lives = this.lives - 1;
                    isDead = true;
                    this.explosionTimeout = 30;
            }
        })
        return isDead;
    }

    gainLife() {
        if (this.lives < MAX_LIVES) {
            oneUps.forEach((oneUp, oneUpIdx) => {
                if (this.player.doCollide(oneUp)) {
                    delete oneUps[oneUpIdx];
                    this.lives = this.lives + 1;
                }
            })
        }
    }

    gainAmmo() {
        ammos.forEach((ammo, ammoIdx) => {
            if (this.player.doCollide(ammo)) {
                delete ammos[ammoIdx];
                this.player.ammunitions = this.player.ammunitions + ADD_AMMO;
            }
        })
    }

    killEnemy() {
        bullets.forEach((bullet, bulletIdx) => {
            var checkKill = (lst) => {
                for (var i = 0; i < lst.length; i++) {
                    if (lst[i] != undefined && bullets[bulletIdx] != undefined && bullets[bulletIdx].doCollide(lst[i])) {
                        delete lst[i];
                        delete bullets[bulletIdx];
                        if (lst == enemies) {
                            this.score += 1;
                        }
                        break;
                    }
                }
            }
            checkKill(enemies);
            checkKill(oneUps);
            checkKill(ammos);
        })
    }  
}





// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();