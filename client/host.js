//function for host to add a new user to the session
const acknowledgeUser = (data) => {
  //add the character to our hosted object for calculations
  hosted[data.hash] = data;
  //add the character to our local object for drawing animation
  squares[data.hash] = data;
};

//function for host to handle movement updates from other users
const movementUpdate = (data) => {
  //update our hosted object
  hosted[data.hash] = data;
  hosted[data.hash].lastUpdate = new Date().getTime();
  
  //grab our local object and update it for animation
  const square = squares[data.hash];
  
  if(!square) {
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
const attackUpdate = (data) => {
  const attack = data;

  //should we handle this attack
  //This is just because we didn't program every direction
  let handleAttack = true;

  //check the direction of the attack
  //depending on the direction, we will modify the collision
  //square to match
  switch (attack.direction) {
    case directions.DOWN: {
      attack.width = 66;
      attack.height = 183;
      attack.y = attack.y + 121;
      break;
    }
    case directions.LEFT: {
      attack.width = 183;
      attack.height = 66;
      attack.x = attack.x - 183;
      break;
    }
    case directions.RIGHT: {
      attack.width = 183;
      attack.height = 66;
      attack.x = attack.x + 61;
      break;
    }
    case directions.UP: {
      attack.width = 66;
      attack.height = 183;
      attack.y = attack.y - 183;
      break;
    }
    //any diagonal direction
    default: {
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