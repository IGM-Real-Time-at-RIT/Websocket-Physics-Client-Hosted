//when we receive a character update
const update = (data) => {
  //if we do not have that character (based on their id)
  //then add them
  if(!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  //if the update is for our own character (we dont need it)
  //Although, it could be used for player validation
  if(data.hash === hash) {
    return;
  }

  //if we received an old message, just drop it
  if(squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  //grab the character based on the character id we received
  const square = squares[data.hash];
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
const hostLeft = () => {
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
const removeUser = (data) => {
  //if we have that character, remove them
  if(squares[data.hash]) {
    delete squares[data.hash];
  }
};

//function to tell this client it needs to host a room session
const confirmHost = () => {
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
  setInterval(() => {
    checkAttacks();
  }, 20);
  
  //print host to the screen to indicate which is the host
  document.querySelector('#role').textContent = 'host';
};

//function to set this user's character
const setUser = (data) => {
  hash = data.hash; //set this user's hash to the unique one they received
  squares[hash] = data; //set the character by their hash
  
  //if this user is the host
  if(isHost) {
    hosted[hash] = data; //also set the hosted data to our own
  }
  
  requestAnimationFrame(redraw); //start animating
};

//when receiving an attack (cosmetic, not collision event)
//add it to our attacks to draw
const receiveAttack = (data) => {
  attacks.push(data);
};

//function to send an attack request to the server
const sendAttack = () => {
  const square = squares[hash];
  
  //create a new attack in a certain direction for this user
  const attack = {
    hash: hash,
    x: square.x,
    y: square.y,
    direction: square.direction,
    frames: 0,
  }
  
  if(isHost) {
    //if the host add attacks directly to the attacks array
    attackUpdate(attack);
  } else {
    //if not the host, send request to server
    socket.emit('attack', attack);
  }
};

//when a character is killed
const playerDeath = (data) => {
  //remove the character
  delete squares[data];
  
  //if this user's character are killed
  if(data === hash) {
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
const updatePosition = () => {
  const square = squares[hash];

  //move the last x/y to our previous x/y variables
  square.prevX = square.x;
  square.prevY = square.y;

  //if user is moving up, decrease y
  if(square.moveUp && square.destY > 0) {
    square.destY -= 2;
  }
  //if user is moving down, increase y
  if(square.moveDown && square.destY < 400) {
    square.destY += 2;
  }
  //if user is moving left, decrease x
  if(square.moveLeft && square.destX > 0) {
    square.destX -= 2;
  }
  //if user is moving right, increase x
  if(square.moveRight && square.destX < 400) {
    square.destX += 2;
  }

  //determine direction based on the inputs of direction keys
  if(square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if(square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if(square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if(square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if(square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if(square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  if(square.moveLeft && !(square.moveUp || square.moveDown)) square.direction = directions.LEFT;

  if(square.moveRight && !(square.moveUp || square.moveDown)) square.direction = directions.RIGHT;

  //reset this character's alpha so they are always smoothly animating
  square.alpha = 0.05;

  //if the host, update the time stamp and send update to other users
  if(isHost) {
    square.lastUpdate = new Date().getTime();
    socket.emit('hostUpdatedMovement', square);
  } else {
    //if not the host, send the updated movement request to the server to validate the movement.
    socket.emit('movementUpdate', square);
  }
};