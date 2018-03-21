//object to hold attacks
const attacks = [];

// box collision check between two rectangles
// of a set width/height
const checkCollisions = (rect1, rect2, width, height) => {
  if (rect1.x < rect2.x + width &&
     rect1.x + width > rect2.x &&
     rect1.y < rect2.y + height &&
     height + rect1.y > rect2.y) {
    return true; //is colliding
  }
  return false; //is not colliding
};

// check attack collisions to see if colliding with the
// user themselves and return false so users cannot damage
// themselves
const checkAttackCollision = (character, attackObj) => {
  const attack = attackObj;

  // if attacking themselves, we won't check collision
  if (character.hash === attack.hash) {
    return false;
  }

  // otherwise check collision of user rect and attack rect
  return checkCollisions(character, attack, attack.width, attack.height);
};

// handle each attack and calculate collisions
const checkAttacks = () => {
   // if we have attacks
  if (attacks.length > 0) {
    // get all characters
    const keys = Object.keys(hosted);
    const characters = hosted;
    
    // for each attack
    for (let i = 0; i < attacks.length; i++) {
      // for each character
      for (let k = 0; k < keys.length; k++) {
        const char1 = characters[keys[k]];

        // call to see if the attack and character hit
        const hit = checkAttackCollision(char1, attacks[i]);

        if (hit) { //if a hit
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
const addAttack = (attack) => {
  attacks.push(attack);
};