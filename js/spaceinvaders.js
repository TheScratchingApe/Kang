/*
  spaceinvaders.js

  Core logic for the space invaders game.
*/

/*  
   1) GESTION DES CONSTANTES & IMAGES
*/
var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;

const SCALE = 1.6;
const PLAYER_SCALE = 3.0;

// -- Images du joueur et des invaders --

// Joueur
const playerImage = new Image();
playerImage.src = "images/ovni.png";

// Invaders : plusieurs images aléatoires
const invaderImages = [];
const invImgChill = new Image();
invImgChill.src = "images/chill.png";
invaderImages.push(invImgChill);

const invImgMoo = new Image();
invImgMoo.src = "images/moo.png";
invaderImages.push(invImgMoo);

const invImgPepe = new Image();
invImgPepe.src = "images/pepe.png";
invaderImages.push(invImgPepe);

const invImgShib = new Image();
invImgShib.src = "images/shib.png";
invaderImages.push(invImgShib);

// -- Image pour les cœurs de vie --
const heartImage = new Image();
heartImage.src = "images/heart.png";

/*
   2) CLASSE PRINCIPALE : Game
*/
function Game() {

    this.config = {
        bombRate: 0.05,
        bombMinVelocity: 50 * SCALE,
        bombMaxVelocity: 50 * SCALE,
        invaderInitialVelocity: 25 * SCALE,
        invaderAcceleration: 0,
        invaderDropDistance: 20 * SCALE,
        rocketVelocity: 120 * SCALE,
        rocketMaxFireRate: 2,
        // Largeur/hauteur logiques pour la zone de jeu
        gameWidth: 400 * SCALE,
        gameHeight: 300 * SCALE,
        fps: 50,
        debugMode: false,
        invaderRanks: 5,
        invaderFiles: 10,
        shipSpeed: 120 * SCALE,
        levelDifficultyMultiplier: 0.2,
        pointsPerInvader: 5,
        limitLevelIncrease: 25
    };

    // État du jeu
    this.lives = 3;
    this.width = 0;
    this.height = 0;
    this.gameBounds = { left: 0, top: 0, right: 0, bottom: 0 };
    this.intervalId = 0;
    this.score = 0;
    this.level = 1;

    // Pile d’états
    this.stateStack = [];

    // Entrées
    this.pressedKeys = {};
    this.gameCanvas = null;

    // Sons
    this.sounds = null;

    this.previousX = 0;  // pour le tactile
}

// -- Initialisation du jeu avec un canvas --
Game.prototype.initialise = function(gameCanvas) {

    this.gameCanvas = gameCanvas;
    this.width = gameCanvas.width;
    this.height = gameCanvas.height;

    // Marges
    this.gameBounds = {
        left: 50,
        right: this.width - 50,
        top: 80,
        bottom: this.height - 100
    };
};

// -- Changement d’état --
Game.prototype.moveToState = function(state) {
    if(this.currentState() && this.currentState().leave) {
        this.currentState().leave(game);
        this.stateStack.pop();
    }
    if(state.enter) {
        state.enter(game);
    }
    this.stateStack.pop();
    this.stateStack.push(state);
};

Game.prototype.start = function() {
    this.moveToState(new WelcomeState());
    this.lives = 3;
    this.config.debugMode = /debug=true/.test(window.location.href);

    var game = this;
    this.intervalId = setInterval(function () { GameLoop(game); }, 1000 / this.config.fps);
};

Game.prototype.currentState = function() {
    return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

Game.prototype.mute = function(mute) {
    if(mute === true) {
        this.sounds.mute = true;
    } else if (mute === false) {
        this.sounds.mute = false;
    } else {
        this.sounds.mute = !this.sounds.mute;
    }
};

// -- Boucle principale --
function GameLoop(game) {
    var currentState = game.currentState();
    if(currentState) {
        var dt = 1 / game.config.fps;
        var ctx = game.gameCanvas.getContext("2d");

        // Pour un rendu plus propre
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if(currentState.update) currentState.update(game, dt);
        if(currentState.draw) currentState.draw(game, dt, ctx);
    }
}

Game.prototype.pushState = function(state) {
    if(state.enter) {
        state.enter(game);
    }
    this.stateStack.push(state);
};

Game.prototype.popState = function() {
    if(this.currentState()) {
        if(this.currentState().leave) {
            this.currentState().leave(game);
        }
        this.stateStack.pop();
    }
};

Game.prototype.stop = function Stop() {
    clearInterval(this.intervalId);
};

/*
   3) ENTRÉES CLAVIER & TACTILE
*/
Game.prototype.keyDown = function(keyCode) {
    this.pressedKeys[keyCode] = true;
    if(this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, keyCode);
    }
};

Game.prototype.keyUp = function(keyCode) {
    delete this.pressedKeys[keyCode];
    if(this.currentState() && this.currentState().keyUp) {
        this.currentState().keyUp(this, keyCode);
    }
};

Game.prototype.touchstart = function(e) {
    if(this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, KEY_SPACE);
    }
};

Game.prototype.touchend = function(e) {
    delete this.pressedKeys[KEY_RIGHT];
    delete this.pressedKeys[KEY_LEFT];
};

Game.prototype.touchmove = function(e) {
    var currentX = e.changedTouches[0].pageX;
    if (this.previousX > 0) {
        if (currentX > this.previousX) {
            delete this.pressedKeys[KEY_LEFT];
            this.pressedKeys[KEY_RIGHT] = true;
        } else {
            delete this.pressedKeys[KEY_RIGHT];
            this.pressedKeys[KEY_LEFT] = true;
        }
    }
    this.previousX = currentX;
};

// ------------------------------------------------------------------
// 4) ÉTATS DU JEU : WELCOME, GAMEOVER, PLAY, PAUSE, LEVELINTRO
// ------------------------------------------------------------------

// -- État d'accueil --
function WelcomeState() {}
WelcomeState.prototype.enter = function(game) {
    // Chargement des sons
    game.sounds = new Sounds();
    game.sounds.init();
    // Ajoute tes sons .wav ou .mp3
    game.sounds.loadSound('shoot', 'sounds/shoot.wav');
    game.sounds.loadSound('bang', 'sounds/bang.wav');
    game.sounds.loadSound('explosion', 'sounds/explosion.wav');
};

WelcomeState.prototype.update = function(game, dt) {};
WelcomeState.prototype.draw = function(game, dt, ctx) {
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font = (30 * SCALE) + "px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Kang Invaders", game.width / 2, game.height / 2 - 40 * SCALE);

    ctx.font = (16 * SCALE) + "px Arial";
    ctx.fillText("Press 'Space' or touch to start.", game.width / 2, game.height / 2);
};

WelcomeState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == KEY_SPACE) {
        game.level = 1;
        game.score = 0;
        game.lives = 3;
        game.moveToState(new LevelIntroState(game.level));
    }
};

// -- État de fin de partie --
function GameOverState() {}
GameOverState.prototype.update = function(game, dt) {};
GameOverState.prototype.draw = function(game, dt, ctx) {
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font = (30 * SCALE) + "px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", game.width / 2, game.height / 2 - 40 * SCALE);

    ctx.font = (16 * SCALE) + "px Arial";
    ctx.fillText("You scored " + game.score + " and got to level " + game.level,
                 game.width / 2, game.height / 2);
    ctx.fillText("Press 'Space' to play again.",
                 game.width / 2, game.height / 2 + 40 * SCALE);
};

GameOverState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == KEY_SPACE) {
        game.lives = 3;
        game.score = 0;
        game.level = 1;
        game.moveToState(new LevelIntroState(1));
    }
};

/*
   5) ÉTAT DE JEU (PLAYSTATE)
*/
function PlayState(config, level) {
    this.config = config;
    this.level = level;

    this.invaderCurrentVelocity = 10 * SCALE;
    this.invaderCurrentDropDistance = 0;
    this.invadersAreDropping = false;
    this.lastRocketTime = null;

    this.ship = null;
    this.invaders = [];
    this.rockets = [];
    this.bombs = [];
}

PlayState.prototype.enter = function(game) {

    // Placement du vaisseau
    this.ship = new Ship(
        (game.gameBounds.left + game.gameBounds.right)/2,
        game.gameBounds.bottom - (30 * SCALE) // Ajuste la valeur pour plus ou moins d'espace
    );

    this.invaderCurrentVelocity = 10 * SCALE;
    this.invaderCurrentDropDistance = 0;
    this.invadersAreDropping = false;

    var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
    var limitLevel = (this.level < this.config.limitLevelIncrease ? this.level : this.config.limitLevelIncrease);

    this.shipSpeed = this.config.shipSpeed;
    this.invaderInitialVelocity = this.config.invaderInitialVelocity + 1.5 * (levelMultiplier * this.config.invaderInitialVelocity);
    this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
    this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
    this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);
    this.rocketMaxFireRate = this.config.rocketMaxFireRate + 0.4 * limitLevel;

    // Création des invaders (avec image aléatoire)
    var ranks = this.config.invaderRanks + 0.1 * limitLevel;
    var files = this.config.invaderFiles + 0.2 * limitLevel;
    var invaders = [];
    for(var rank = 0; rank < ranks; rank++){
        for(var file = 0; file < files; file++) {
            var randomIndex = Math.floor(Math.random() * invaderImages.length);
            var chosenImage = invaderImages[randomIndex];
            invaders.push(new Invader(
                (game.gameBounds.left + game.gameBounds.right)/2 + ((files/2 - file) * 200 / files * SCALE),
                (game.gameBounds.top + 0) + (rank * 20 * SCALE),
                rank, file,
                'Invader', chosenImage
            ));
        }
    }
    this.invaders = invaders;
    this.invaderCurrentVelocity = this.invaderInitialVelocity;
    this.invaderVelocity = { x: -this.invaderInitialVelocity, y: 0 };
    this.invaderNextVelocity = null;
};

PlayState.prototype.update = function(game, dt) {

    // -- Décrémenter le timer du clignotement du vaisseau si besoin --
    if(this.ship.hitTimer > 0) {
        this.ship.hitTimer -= dt;
        if(this.ship.hitTimer < 0) {
            this.ship.hitTimer = 0;
        }
    }

    // Mouvement du vaisseau
    if(game.pressedKeys[KEY_LEFT]) {
        this.ship.x -= this.shipSpeed * dt;
    }
    if(game.pressedKeys[KEY_RIGHT]) {
        this.ship.x += this.shipSpeed * dt;
    }
    if(game.pressedKeys[KEY_SPACE]) {
        this.fireRocket();
    }

    // Garder le vaisseau dans la zone
    if(this.ship.x < game.gameBounds.left) {
        this.ship.x = game.gameBounds.left;
    }
    if(this.ship.x > game.gameBounds.right) {
        this.ship.x = game.gameBounds.right;
    }

    // Bombes
    for(var i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        bomb.y += dt * bomb.velocity;
        if(bomb.y > game.gameBounds.bottom) {
            this.bombs.splice(i--, 1);
        }
    }

    // Roquettes
    for(i=0; i<this.rockets.length; i++) {
        var rocket = this.rockets[i];
        rocket.y -= dt * rocket.velocity;
        if(rocket.y < 0) {
            this.rockets.splice(i--, 1);
        }
    }

    // Invaders
    var hitLeft = false, hitRight = false, hitBottom = false;
    for(i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        var newx = invader.x + this.invaderVelocity.x * dt;
        var newy = invader.y + this.invaderVelocity.y * dt;
        if(!hitLeft && newx < game.gameBounds.left) {
            hitLeft = true;
        }
        else if(!hitRight && newx > game.gameBounds.right) {
            hitRight = true;
        }
        else if(!hitBottom && newy > game.gameBounds.bottom) {
            hitBottom = true;
        }
        if(!hitLeft && !hitRight && !hitBottom) {
            invader.x = newx;
            invader.y = newy;
        }
    }

    // Si on doit drop
    if(this.invadersAreDropping) {
        this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
        if(this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
            this.invadersAreDropping = false;
            this.invaderVelocity = this.invaderNextVelocity;
            this.invaderCurrentDropDistance = 0;
        }
    }
    if(hitLeft) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = { x: 0, y: this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = { x: this.invaderCurrentVelocity, y: 0 };
    }
    if(hitRight) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = { x: 0, y: this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = { x: -this.invaderCurrentVelocity, y: 0 };
    }
    if(hitBottom) {
        game.lives = 0;
    }

    // Collision roquette/invader
    for(i=0; i<this.invaders.length; i++) {
        var inv = this.invaders[i];
        var bang = false;

        for(var j=0; j<this.rockets.length; j++){
            var r = this.rockets[j];
            if(r.x >= (inv.x - inv.width/2) && r.x <= (inv.x + inv.width/2) &&
               r.y >= (inv.y - inv.height/2) && r.y <= (inv.y + inv.height/2)) {
                this.rockets.splice(j--, 1);
                bang = true;
                game.score += this.config.pointsPerInvader;
                break;
            }
        }
        if(bang) {
            this.invaders.splice(i--, 1);
            game.sounds.playSound('bang');
        }
    }

    // Lâcher des bombes
    var frontRankInvaders = {};
    for(i=0; i<this.invaders.length; i++) {
        var current = this.invaders[i];
        if(!frontRankInvaders[current.file] || frontRankInvaders[current.file].rank < current.rank) {
            frontRankInvaders[current.file] = current;
        }
    }
    for(i=0; i<this.config.invaderFiles; i++) {
        var front = frontRankInvaders[i];
        if(!front) continue;
        var chance = this.bombRate * dt;
        if(chance > Math.random()) {
            this.bombs.push(new Bomb(
                front.x,
                front.y + front.height / 2,
                this.bombMinVelocity + Math.random() * (this.bombMaxVelocity - this.bombMinVelocity)
            ));
        }
    }

    // Collision bombe/ship
    for(i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        if(bomb.x >= (this.ship.x - this.ship.width/2) && bomb.x <= (this.ship.x + this.ship.width/2) &&
           bomb.y >= (this.ship.y - this.ship.height/2) && bomb.y <= (this.ship.y + this.ship.height/2)) {
            this.bombs.splice(i--, 1);
            game.lives--;
            game.sounds.playSound('explosion');

            // --> Clignotement rouge pendant 1 seconde
            this.ship.hitTimer = 1.0;
        }
    }

    // Collision invader/ship
    for(i=0; i<this.invaders.length; i++) {
        var inva = this.invaders[i];
        if((inva.x + inva.width/2) > (this.ship.x - this.ship.width/2) &&
           (inva.x - inva.width/2) < (this.ship.x + this.ship.width/2) &&
           (inva.y + inva.height/2) > (this.ship.y - this.ship.height/2) &&
           (inva.y - inva.height/2) < (this.ship.y + this.ship.height/2)) {
            game.lives = 0;
            game.sounds.playSound('explosion');
            // Clignotement si tu veux, mais game.lives=0 => fin
        }
    }

    // Défaite
    if(game.lives <= 0) {
        game.moveToState(new GameOverState());
    }

    // Victoire
    if(this.invaders.length === 0) {
        game.score += this.level * 50;
        game.level += 1;
        game.moveToState(new LevelIntroState(game.level));
    }
};

PlayState.prototype.draw = function(game, dt, ctx) {
    ctx.clearRect(0, 0, game.width, game.height);

    // -- Dessin du vaisseau --
    ctx.drawImage(
        playerImage,
        this.ship.x - this.ship.width / 2,
        this.ship.y - this.ship.height / 2,
        this.ship.width,
        this.ship.height
    );

    // Clignotement rouge si hitTimer > 0
    if(this.ship.hitTimer > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";  // rouge semi-transparent
        ctx.fillRect(
            this.ship.x - this.ship.width / 2,
            this.ship.y - this.ship.height / 2,
            this.ship.width,
            this.ship.height
        );
        ctx.restore();
    }

    // -- Dessin des invaders --
    for(var i=0; i<this.invaders.length; i++) {
        var invader = this.invaders[i];
        ctx.drawImage(
            invader.image,
            invader.x - invader.width / 2,
            invader.y - invader.height / 2,
            invader.width,
            invader.height
        );
    }

    // -- Dessin des bombes --
    ctx.fillStyle = '#ff5555';
    for(i=0; i<this.bombs.length; i++) {
        var bomb = this.bombs[i];
        var size = 4 * SCALE;
        ctx.fillRect(bomb.x - size/2, bomb.y - size/2, size, size);
    }

    // -- Dessin des roquettes --
    ctx.fillStyle = '#ff0000';
    for(i=0; i<this.rockets.length; i++) {
        var rocket = this.rockets[i];
        var w = 2 * SCALE;
        var h = 8 * SCALE;
        ctx.fillRect(rocket.x - w/2, rocket.y - h/2, w, h);
    }

    // -- Dessin des coeurs (pour représenter les vies) --
    var heartSize = 30;
    for(var l = 0; l < game.lives; l++) {
        // On dessine chaque coeur à x=10*SCALE + 40*l
        var xPos = (10 * SCALE) + (l * 40);
        var yPos = 10 * SCALE;
        ctx.drawImage(heartImage, xPos, yPos, heartSize, heartSize);

        // Optionnel: un trait blanc autour du coeur
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(xPos, yPos, heartSize, heartSize);
    }

    // -- Dessin du score et du niveau --
    ctx.font = (14 * SCALE) + "px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = "left";

    // On affiche en dessous des coeurs
    var info = "Score: " + game.score + ", Level: " + game.level;
    ctx.fillText(info, 10 * SCALE, (10 * SCALE) + heartSize + 20);

    // Mode debug ?
    if(this.config.debugMode) {
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(0, 0, game.width, game.height);
        ctx.strokeRect(
            game.gameBounds.left,
            game.gameBounds.top,
            game.gameBounds.right - game.gameBounds.left,
            game.gameBounds.bottom - game.gameBounds.top
        );
    }
};

PlayState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == KEY_SPACE) {
        this.fireRocket();
    }
    if(keyCode == 80) { // touche 'P'
        game.pushState(new PauseState());
    }
};

PlayState.prototype.keyUp = function(game, keyCode) {};
PlayState.prototype.fireRocket = function() {
    if(this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.rocketMaxFireRate)) {
        this.rockets.push(new Rocket(this.ship.x, this.ship.y - (12 * SCALE), this.config.rocketVelocity));
        this.lastRocketTime = (new Date()).valueOf();
        game.sounds.playSound('shoot');
    }
};

// -- État de pause --
function PauseState() {}
PauseState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == 80) {
        game.popState();
    }
};
PauseState.prototype.draw = function(game, dt, ctx) {
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font = (14 * SCALE) + "px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Paused", game.width / 2, game.height / 2);
    return;
};

// -- État d'intro de niveau --
function LevelIntroState(level) {
    this.level = level;
    this.countdownMessage = "3";
}
LevelIntroState.prototype.update = function(game, dt) {
    if(this.countdown === undefined) {
        this.countdown = 3;
    }
    this.countdown -= dt;

    if(this.countdown < 2) {
        this.countdownMessage = "2";
    }
    if(this.countdown < 1) {
        this.countdownMessage = "1";
    }
    if(this.countdown <= 0) {
        game.moveToState(new PlayState(game.config, this.level));
    }
};
LevelIntroState.prototype.draw = function(game, dt, ctx) {
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font = (36 * SCALE) + "px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Level " + this.level, game.width / 2, game.height / 2);

    ctx.font = (24 * SCALE) + "px Arial";
    ctx.fillText(
        "Ready in " + this.countdownMessage,
        game.width / 2,
        game.height / 2 + 36 * SCALE
    );
    return;
};

/*
   6) ENTITÉS : SHIP, ROCKET, BOMB, INVADER
*/

// -- Vaisseau (PLAYER_SCALE + un timer de clignotement 'hitTimer') --
function Ship(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20 * PLAYER_SCALE;
    this.height = 16 * PLAYER_SCALE;

    // Timer pour clignoter en rouge
    this.hitTimer = 0;
}

// -- Roquette --
function Rocket(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity * SCALE;
}

// -- Bombe --
function Bomb(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity * SCALE;
}

// -- Invader (avec paramètre 'image') --
function Invader(x, y, rank, file, type, image) {
    this.x = x;
    this.y = y;
    this.rank = rank;
    this.file = file;
    this.type = type;
    this.image = image;  // l'une des 4 images aléatoires
    this.width = 18 * SCALE;
    this.height = 14 * SCALE;
}

/*
   7) CLASSE GameState (optionnel)
*/
function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
    this.updateProc = updateProc;
    this.drawProc = drawProc;
    this.keyDown = keyDown;
    this.keyUp = keyUp;
    this.enter = enter;
    this.leave = leave;
}

/*
   8) CLASSE SONS
*/
function Sounds() {
    this.audioContext = null;
    this.sounds = {};
    this.mute = false;
}

Sounds.prototype.init = function() {
    // Création du contexte audio
    var contextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new contextClass();
    this.mute = false;
};

Sounds.prototype.loadSound = function(name, url) {
    var self = this;
    this.sounds[name] = null;

    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function() {
        self.audioContext.decodeAudioData(req.response, function(buffer) {
            self.sounds[name] = { buffer: buffer };
        }, function(e) {
            console.log("Error decoding audio data for " + name, e);
        });
    };
    try {
        req.send();
    } catch(e) {
        console.log("Exception loading sound:", name, e);
    }
};

Sounds.prototype.playSound = function(name) {
    // Nécessite une interaction user préalable sur la page
    if(!this.sounds[name] || this.mute) {
        return;
    }
    var source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name].buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
};
