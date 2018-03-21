"use strict";

//Possible directions a user can move
//their character. These are mapped
//to integers for fast/small storage
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

//size of our character sprites
var spriteSizes = {
  WIDTH: 61,
  HEIGHT: 121
};

//function to lerp (linear interpolation)
//Takes position one, position two and the 
//percentage of the movement between them (0-1)
var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

//redraw with requestAnimationFrame
var redraw = function redraw(time) {
  //update this user's positions
  updatePosition();

  ctx.clearRect(0, 0, 500, 500);

  //each user id
  var keys = Object.keys(squares);

  //for each user
  for (var i = 0; i < keys.length; i++) {
    var square = squares[keys[i]];

    //if alpha less than 1, increase it by 0.01
    if (square.alpha < 1) square.alpha += 0.05;

    //applying a filter effect to other characters
    //in order to see our character easily
    if (square.hash === hash) {
      ctx.filter = "none";
    } else {
      ctx.filter = "hue-rotate(40deg)";
    }

    //calculate lerp of the x/y from the destinations
    square.x = lerp(square.prevX, square.destX, square.alpha);
    square.y = lerp(square.prevY, square.destY, square.alpha);

    // if we are mid animation or moving in any direction
    if (square.frame > 0 || square.moveUp || square.moveDown || square.moveRight || square.moveLeft) {
      square.frameCount++; //increase our framecount

      //every 8 frames increase which sprite image we draw to animate
      //or reset to the beginning of the animation
      if (square.frameCount % 8 === 0) {
        if (square.frame < 7) {
          square.frame++;
        } else {
          square.frame = 0;
        }
      }
    }

    //draw our characters
    ctx.drawImage(walkImage, spriteSizes.WIDTH * square.frame, spriteSizes.HEIGHT * square.direction, spriteSizes.WIDTH, spriteSizes.HEIGHT, square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);

    //highlight collision box for each character
    ctx.strokeRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
  }

  //for each attack, draw each to the screen
  for (var _i = 0; _i < attacks.length; _i++) {
    var attack = attacks[_i];

    //draw the attack image
    ctx.drawImage(slashImage, attack.x, attack.y, attack.width, attack.height);

    //count how many times we have drawn this particular attack
    attack.frames++;

    //if the attack has been drawn for 30 frames (half a second)
    //then stop drawing it and remove it from the attacks to draw
    if (attack.frames > 30) {
      attacks.splice(_i);
      _i--;
    }
  }

  //set our next animation frame
  animationFrame = requestAnimationFrame(redraw);
};
'use strict';

//function for host to add a new user to the session
var acknowledgeUser = function acknowledgeUser(data) {
  //add the character to our hosted object for calculations
  hosted[data.hash] = data;
  //add the character to our local object for drawing animation
  squares[data.hash] = data;
};

//function for host to handle movement updates from other users
var movementUpdate = function movementUpdate(data) {
  //update our hosted object
  hosted[data.hash] = data;
  hosted[data.hash].lastUpdate = new Date().getTime();

  //grab our local object and update it for animation
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

  //host sends out movement update to server to send to other clients
  socket.emit('hostUpdatedMovement', hosted[data.hash]);
};

//function for host to handle attack updates from clients
var attackUpdate = function attackUpdate(data) {
  var attack = data;

  //should we handle this attack
  //This is just because we didn't program every direction
  var handleAttack = true;

  //check the direction of the attack
  //depending on the direction, we will modify the collision
  //square to match
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
    //any diagonal direction
    default:
      {
        handleAttack = false;
      }
  }

  //if we should handle the attack
  if (handleAttack) {
    //host adds the attack to our local attack object for calculation
    addAttack(attack);
    //host emits an attack update to the server to send to other clients
    socket.emit('hostUpdatedAttack', attack);
  }
};
'use strict';

var canvas = void 0;
var ctx = void 0;
var walkImage = void 0; //spritesheet for character
var slashImage = void 0; //image for attack
//our websocket connection
var socket = void 0;
var hash = void 0; //user's unique character id (from the server)
var isHost = false;
var animationFrame = void 0; //our next animation frame function

var squares = {}; //character list
//hosted characters have to be different because they need to 
//calculate based on the frame they were recieving, not
//the locally drawn user objects
var hosted = {}; //hosted characters (not locally drawn objects)
var attacks = []; //attacks to draw on screen

//handle for key down events
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

//handler for key up events
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
        }
        //Space key was lifted
        else if (keyPressed === 32) {
            sendAttack(); //call to invoke an attack
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

  socket.on('hostConfirm', confirmHost); //setting this as the host
  socket.on('joined', setUser); //when this user joins the server
  socket.on('updatedMovement', update); //when players move
  socket.on('attackHit', playerDeath); //when a player dies
  socket.on('attackUpdate', receiveAttack); //when an attack is sent
  socket.on('left', removeUser); //when a user leaves
  socket.on('hostLeft', hostLeft); //when the host disconnects

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
'use strict';

//object to hold attacks
var attacks = [];

// box collision check between two rectangles
// of a set width/height
var checkCollisions = function checkCollisions(rect1, rect2, width, height) {
  if (rect1.x < rect2.x + width && rect1.x + width > rect2.x && rect1.y < rect2.y + height && height + rect1.y > rect2.y) {
    return true; //is colliding
  }
  return false; //is not colliding
};

// check attack collisions to see if colliding with the
// user themselves and return false so users cannot damage
// themselves
var checkAttackCollision = function checkAttackCollision(character, attackObj) {
  var attack = attackObj;

  // if attacking themselves, we won't check collision
  if (character.hash === attack.hash) {
    return false;
  }

  // otherwise check collision of user rect and attack rect
  return checkCollisions(character, attack, attack.width, attack.height);
};

// handle each attack and calculate collisions
var checkAttacks = function checkAttacks() {
  // if we have attacks
  if (attacks.length > 0) {
    // get all characters
    var keys = Object.keys(hosted);
    var characters = hosted;

    // for each attack
    for (var i = 0; i < attacks.length; i++) {
      // for each character
      for (var k = 0; k < keys.length; k++) {
        var char1 = characters[keys[k]];

        // call to see if the attack and character hit
        var hit = checkAttackCollision(char1, attacks[i]);

        if (hit) {
          //if a hit
          // ask sockets to notify users which character was hit
          socket.emit('removePlayer', char1.hash);
          // kill that character and remove from our hosted user list
          // and our local user list for animations
          delete hosted[char1.hash];
          delete squares[char1.hash];

          //if the character destroyed is the host, we need to handle it
          //We cannot disconnect the host. Instead we will just respawn the host
          //as a new character. Ideally there would be a timer before this
          //so the respawn is not immediate. Alternatively, maybe the host
          //has to click to respawn.
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

            //reset our host's character with the newly spawned character
            hosted[hash] = square;
            squares[hash] = square;
          }
        }
        //miss
        else {
            console.log('miss');
          }
      }

      // once the attack has been calculated again all users
      // remove this attack and move onto the next one
      attacks.splice(i);
      // decrease i since our splice changes the array length
      i--;
    }
  }
};

//add a new attack to calculate collision on
var addAttack = function addAttack(attack) {
  attacks.push(attack);
};
'use strict';

//when we receive a character update
var update = function update(data) {
  //if we do not have that character (based on their id)
  //then add them
  if (!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  //if the update is for our own character (we dont need it)
  //Although, it could be used for player validation
  if (data.hash === hash) {
    return;
  }

  //if we received an old message, just drop it
  if (squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  //grab the character based on the character id we received
  var square = squares[data.hash];
  //update their direction and movement information
  //but NOT their x/y since we are animating those
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

//function to indicate that the host left
var hostLeft = function hostLeft() {
  //disconnect socket. We're having users reload to join a new game
  socket.disconnect();
  //stop animating
  cancelAnimationFrame(animationFrame);
  //draw host left screen
  ctx.fillRect(0, 0, 500, 500);
  ctx.fillStyle = 'white';
  ctx.font = '48px serif';
  ctx.fillText('Host left.', 20, 100);
  ctx.fillText('Reload for a new game.', 20, 200);
};

//function to remove a character from our character list
var removeUser = function removeUser(data) {
  //if we have that character, remove them
  if (squares[data.hash]) {
    delete squares[data.hash];
  }
};

//function to tell this client it needs to host a room session
var confirmHost = function confirmHost() {
  //let this client know it's the host
  isHost = true;

  //attach special listeners for updates from the server
  //that only hosts will receive.
  //Since the clients cannot directly communicate, they
  //will communicate through the server. The will receive
  //messages from other clients and forward it to this
  //client with these message types.
  socket.on('movementUpdate', movementUpdate);
  socket.on('attackUpdate', attackUpdate);
  socket.on('hostAcknowledge', acknowledgeUser);

  //start calculating collisions of attacks
  setInterval(function () {
    checkAttacks();
  }, 20);

  //print host to the screen to indicate which is the host
  document.querySelector('#role').textContent = 'host';
};

//function to set this user's character
var setUser = function setUser(data) {
  hash = data.hash; //set this user's hash to the unique one they received
  squares[hash] = data; //set the character by their hash

  //if this user is the host
  if (isHost) {
    hosted[hash] = data; //also set the hosted data to our own
  }

  requestAnimationFrame(redraw); //start animating
};

//when receiving an attack (cosmetic, not collision event)
//add it to our attacks to draw
var receiveAttack = function receiveAttack(data) {
  attacks.push(data);
};

//function to send an attack request to the server
var sendAttack = function sendAttack() {
  var square = squares[hash];

  //create a new attack in a certain direction for this user
  var attack = {
    hash: hash,
    x: square.x,
    y: square.y,
    direction: square.direction,
    frames: 0
  };

  if (isHost) {
    //if the host add attacks directly to the attacks array
    attackUpdate(attack);
  } else {
    //if not the host, send request to server
    socket.emit('attack', attack);
  }
};

//when a character is killed
var playerDeath = function playerDeath(data) {
  //remove the character
  delete squares[data];

  //if this user's character are killed
  if (data === hash) {
    //disconnect them and we will have them reload to play again
    socket.disconnect();
    cancelAnimationFrame(animationFrame);
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = 'white';
    ctx.font = '48px serif';
    ctx.fillText('You died', 20, 100);
    ctx.fillText('Reload for a new game.', 20, 200);
  }
};

//update this user's positions based on keyboard input
var updatePosition = function updatePosition() {
  var square = squares[hash];

  //move the last x/y to our previous x/y variables
  square.prevX = square.x;
  square.prevY = square.y;

  //if user is moving up, decrease y
  if (square.moveUp && square.destY > 0) {
    square.destY -= 2;
  }
  //if user is moving down, increase y
  if (square.moveDown && square.destY < 400) {
    square.destY += 2;
  }
  //if user is moving left, decrease x
  if (square.moveLeft && square.destX > 0) {
    square.destX -= 2;
  }
  //if user is moving right, increase x
  if (square.moveRight && square.destX < 400) {
    square.destX += 2;
  }

  //determine direction based on the inputs of direction keys
  if (square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if (square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if (square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if (square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if (square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if (square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  if (square.moveLeft && !(square.moveUp || square.moveDown)) square.direction = directions.LEFT;

  if (square.moveRight && !(square.moveUp || square.moveDown)) square.direction = directions.RIGHT;

  //reset this character's alpha so they are always smoothly animating
  square.alpha = 0.05;

  //if the host, update the time stamp and send update to other users
  if (isHost) {
    square.lastUpdate = new Date().getTime();
    socket.emit('hostUpdatedMovement', square);
  } else {
    //if not the host, send the updated movement request to the server to validate the movement.
    socket.emit('movementUpdate', square);
  }
};
