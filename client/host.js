const acknowledgeUser = (data) => {
  hosted[data.hash] = data;
  squares[data.hash] = data;
};

const movementUpdate = (data) => {
  hosted[data.hash] = data;
  hosted[data.hash].lastUpdate = new Date().getTime();
  
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
  
  socket.emit('hostUpdatedMovement', hosted[data.hash]);
};

const attackUpdate = (data) => {
  const attack = data;

  let handleAttack = true;

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
    default: {
      handleAttack = false;
    }
  }

  if (handleAttack) {
    addAttack(attack);
    socket.emit('hostUpdatedAttack', attack);
  }
};