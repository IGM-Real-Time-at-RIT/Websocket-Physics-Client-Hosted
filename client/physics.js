const attacks = [];

const checkCollisions = (rect1, rect2, width, height) => {
  if (rect1.x < rect2.x + width &&
     rect1.x + width > rect2.x &&
     rect1.y < rect2.y + height &&
     height + rect1.y > rect2.y) {
    return true;
  }
  return false;
};

const checkAttackCollision = (character, attackObj) => {
  const attack = attackObj;

  if (character.hash === attack.hash) {
    return false;
  }

  return checkCollisions(character, attack, attack.width, attack.height);
};

const checkAttacks = () => {
  if (attacks.length > 0) {
    const keys = Object.keys(hosted);
    const characters = hosted;
    
    for (let i = 0; i < attacks.length; i++) {
      for (let k = 0; k < keys.length; k++) {
        const char1 = characters[keys[k]];

        const hit = checkAttackCollision(char1, attacks[i]);

        if (hit) {
          socket.emit('removePlayer', char1.hash);
          delete hosted[char1.hash];
          delete squares[char1.hash];
          
          if(hash === char1.hash) {
            const square = {};
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

const addAttack = (attack) => {
  attacks.push(attack);
};