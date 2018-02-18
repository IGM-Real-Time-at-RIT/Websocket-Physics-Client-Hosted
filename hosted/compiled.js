"use strict";

var directions = {
  DOWNLEFT: 0,
  DOWN: 1,
  DOWNRIGHT: 2,
  LEFT: 3,
  UPLEFT: 4,
  RIGHT: 5,
  UPRIGHT: 6,
  UP: 7
};

var spriteSizes = {
  WIDTH: 61,
  HEIGHT: 121
};

var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

var redraw = function redraw(time) {
  updatePosition();

  ctx.clearRect(0, 0, 500, 500);

  var keys = Object.keys(squares);

  for (var i = 0; i < keys.length; i++) {

    var square = squares[keys[i]];

    //if alpha less than 1, increase it by 0.01
    if (square.alpha < 1) square.alpha += 0.05;

    if (square.hash === hash) {
      ctx.filter = "none";
    } else {
      ctx.filter = "hue-rotate(40deg)";
    }

    square.x = lerp(square.prevX, square.destX, square.alpha);
    square.y = lerp(square.prevY, square.destY, square.alpha);

    // if we are mid animation or moving in any direction
    if (square.frame > 0 || square.moveUp || square.moveDown || square.moveRight || square.moveLeft) {
      square.frameCount++;

      if (square.frameCount % 8 === 0) {
        if (square.frame < 7) {
          square.frame++;
        } else {
          square.frame = 0;
        }
      }
    }

    ctx.drawImage(walkImage, spriteSizes.WIDTH * square.frame, spriteSizes.HEIGHT * square.direction, spriteSizes.WIDTH, spriteSizes.HEIGHT, square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);

    ctx.strokeRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
  }

  for (var _i = 0; _i < attacks.length; _i++) {
    var attack = attacks[_i];

    ctx.drawImage(slashImage, attack.x, attack.y, attack.width, attack.height);

    attack.frames++;

    if (attack.frames > 30) {
      attacks.splice(_i);
      _i--;
    }
  }

  animationFrame = requestAnimationFrame(redraw);
};
'use strict';

var acknowledgeUser = function acknowledgeUser(data) {
  hosted[data.hash] = data;
  squares[data.hash] = data;
};

var movementUpdate = function movementUpdate(data) {
  hosted[data.hash] = data;
  hosted[data.hash].lastUpdate = new Date().getTime();

  var square = squares[data.hash];

  if (!square) {
    return;
  }

  square.prevX = data.prevX;
  square.prevY = data.prevY;
  square.destX = data.destX;
  square.destY = data.destY;
  square.direction = data.direction;
  square.moveLeft = data.moveLeft;
  square.moveRight = data.moveRight;
  square.moveDown = data.moveDown;
  square.moveUp = data.moveUp;
  square.alpha = 0.05;

  socket.emit('hostUpdatedMovement', hosted[data.hash]);
};

var attackUpdate = function attackUpdate(data) {
  var attack = data;

  var handleAttack = true;

  switch (attack.direction) {
    case directions.DOWN:
      {
        attack.width = 66;
        attack.height = 183;
        attack.y = attack.y + 121;
        break;
      }
    case directions.LEFT:
      {
        attack.width = 183;
        attack.height = 66;
        attack.x = attack.x - 183;
        break;
      }
    case directions.RIGHT:
      {
        attack.width = 183;
        attack.height = 66;
        attack.x = attack.x + 61;
        break;
      }
    case directions.UP:
      {
        attack.width = 66;
        attack.height = 183;
        attack.y = attack.y - 183;
        break;
      }
    default:
      {
        handleAttack = false;
      }
  }

  if (handleAttack) {
    addAttack(attack);
    socket.emit('hostUpdatedAttack', attack);
  }
};
'use strict';

var canvas = void 0;
var ctx = void 0;
var walkImage = void 0;
var slashImage = void 0;
//our websocket connection
var socket = void 0;
var hash = void 0;
var isHost = false;
var animationFrame = void 0;

var squares = {};
var hosted = {};
var attacks = [];

var keyDownHandler = function keyDownHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // W OR UP
  if (keyPressed === 87 || keyPressed === 38) {
    square.moveUp = true;
  }
  // A OR LEFT
  else if (keyPressed === 65 || keyPressed === 37) {
      square.moveLeft = true;
    }
    // S OR DOWN
    else if (keyPressed === 83 || keyPressed === 40) {
        square.moveDown = true;
      }
      // D OR RIGHT
      else if (keyPressed === 68 || keyPressed === 39) {
          square.moveRight = true;
        } else if (keyPressed === 32) {
          e.preventDefault();
        }

  return false;
};

var keyUpHandler = function keyUpHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // W OR UP
  if (keyPressed === 87 || keyPressed === 38) {
    square.moveUp = false;
  }
  // A OR LEFT
  else if (keyPressed === 65 || keyPressed === 37) {
      square.moveLeft = false;
    }
    // S OR DOWN
    else if (keyPressed === 83 || keyPressed === 40) {
        square.moveDown = false;
      }
      // D OR RIGHT
      else if (keyPressed === 68 || keyPressed === 39) {
          square.moveRight = false;
        } else if (keyPressed === 32) {
          sendAttack();
          e.preventDefault();
        }

  return false;
};

var init = function init() {
  walkImage = document.querySelector('#walk');
  slashImage = document.querySelector('#slash');

  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');

  socket = io.connect();

  socket.on('hostConfirm', confirmHost);
  socket.on('joined', setUser);
  socket.on('updatedMovement', update);
  socket.on('attackHit', playerDeath);
  socket.on('attackUpdate', receiveAttack);
  socket.on('left', removeUser);
  socket.on('hostLeft', hostLeft);

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
'use strict';

var attacks = [];

var checkCollisions = function checkCollisions(rect1, rect2, width, height) {
  if (rect1.x < rect2.x + width && rect1.x + width > rect2.x && rect1.y < rect2.y + height && height + rect1.y > rect2.y) {
    return true;
  }
  return false;
};

var checkAttackCollision = function checkAttackCollision(character, attackObj) {
  var attack = attackObj;

  if (character.hash === attack.hash) {
    return false;
  }

  return checkCollisions(character, attack, attack.width, attack.height);
};

var checkAttacks = function checkAttacks() {
  if (attacks.length > 0) {
    var keys = Object.keys(hosted);
    var characters = hosted;

    for (var i = 0; i < attacks.length; i++) {
      for (var k = 0; k < keys.length; k++) {
        var char1 = characters[keys[k]];

        var hit = checkAttackCollision(char1, attacks[i]);

        if (hit) {
          socket.emit('removePlayer', char1.hash);
          delete hosted[char1.hash];
          delete squares[char1.hash];

          if (hash === char1.hash) {
            var square = {};
            square.hash = hash;
            square.lastUpdate = new Date().getTime();
            square.x = 0;
            square.y = 0;
            square.prevX = 0;
            square.prevY = 0;
            square.destX = 0;
            square.destY = 0;
            square.height = 100;
            square.width = 100;
            square.alpha = 0;
            square.direction = 0;
            square.frame = 0;
            square.frameCount = 0;
            square.moveLeft = false;
            square.moveRight = false;
            square.moveDown = false;
            square.moveUp = false;

            hosted[hash] = square;
            squares[hash] = square;
          }
        } else {
          console.log('miss');
        }
      }

      attacks.splice(i);
      i--;
    }
  }
};

var addAttack = function addAttack(attack) {
  attacks.push(attack);
};
'use strict';

var update = function update(data) {
  if (!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  if (data.hash === hash) {
    return;
  }

  if (squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  var square = squares[data.hash];
  square.prevX = data.prevX;
  square.prevY = data.prevY;
  square.destX = data.destX;
  square.destY = data.destY;
  square.direction = data.direction;
  square.moveLeft = data.moveLeft;
  square.moveRight = data.moveRight;
  square.moveDown = data.moveDown;
  square.moveUp = data.moveUp;
  square.alpha = 0.05;
};

var hostLeft = function hostLeft() {
  socket.disconnect();
  cancelAnimationFrame(animationFrame);
  ctx.fillRect(0, 0, 500, 500);
  ctx.fillStyle = 'white';
  ctx.font = '48px serif';
  ctx.fillText('Host left.', 20, 100);
  ctx.fillText('Reload for a new game.', 20, 200);
};

var removeUser = function removeUser(data) {
  if (squares[data.hash]) {
    delete squares[data.hash];
  }
};

var confirmHost = function confirmHost() {
  isHost = true;

  socket.on('movementUpdate', movementUpdate);
  socket.on('attackUpdate', attackUpdate);
  socket.on('hostAcknowledge', acknowledgeUser);

  setInterval(function () {
    checkAttacks();
  }, 20);

  document.querySelector('#role').textContent = 'host';
};

var setUser = function setUser(data) {
  hash = data.hash;
  squares[hash] = data;

  if (isHost) {
    hosted[hash] = data;
  }

  requestAnimationFrame(redraw);
};

var receiveAttack = function receiveAttack(data) {
  attacks.push(data);
};

var sendAttack = function sendAttack() {
  var square = squares[hash];

  var attack = {
    hash: hash,
    x: square.x,
    y: square.y,
    direction: square.direction,
    frames: 0
  };

  if (isHost) {
    attackUpdate(attack);
  } else {
    socket.emit('attack', attack);
  }
};

var playerDeath = function playerDeath(data) {
  delete squares[data];

  if (data === hash) {
    socket.disconnect();
    cancelAnimationFrame(animationFrame);
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = 'white';
    ctx.font = '48px serif';
    ctx.fillText('You died', 20, 100);
    ctx.fillText('Reload for a new game.', 20, 200);
  }
};

var updatePosition = function updatePosition() {
  var square = squares[hash];

  square.prevX = square.x;
  square.prevY = square.y;

  if (square.moveUp && square.destY > 0) {
    square.destY -= 2;
  }
  if (square.moveDown && square.destY < 400) {
    square.destY += 2;
  }
  if (square.moveLeft && square.destX > 0) {
    square.destX -= 2;
  }
  if (square.moveRight && square.destX < 400) {
    square.destX += 2;
  }

  if (square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if (square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if (square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if (square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if (square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if (square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  if (square.moveLeft && !(square.moveUp || square.moveDown)) square.direction = directions.LEFT;

  if (square.moveRight && !(square.moveUp || square.moveDown)) square.direction = directions.RIGHT;

  square.alpha = 0.05;

  if (isHost) {
    square.lastUpdate = new Date().getTime();
    socket.emit('hostUpdatedMovement', square);
  } else {
    socket.emit('movementUpdate', square);
  }
};
