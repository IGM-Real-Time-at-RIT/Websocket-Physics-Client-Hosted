let canvas;
let ctx;
let walkImage; //spritesheet for character
let slashImage; //image for attack
//our websocket connection
let socket; 
let hash; //user's unique character id (from the server)
let isHost = false;
let animationFrame; //our next animation frame function

let squares = {}; //character list
//hosted characters have to be different because they need to 
//calculate based on the frame they were recieving, not
//the locally drawn user objects
let hosted = {}; //hosted characters (not locally drawn objects)
let attacks = []; //attacks to draw on screen

//handle for key down events
const keyDownHandler = (e) => {
  var keyPressed = e.which;
  const square = squares[hash];

  // W OR UP
  if(keyPressed === 87 || keyPressed === 38) {
    square.moveUp = true;
  }
  // A OR LEFT
  else if(keyPressed === 65 || keyPressed === 37) {
    square.moveLeft = true;
  }
  // S OR DOWN
  else if(keyPressed === 83 || keyPressed === 40) {
    square.moveDown = true;
  }
  // D OR RIGHT
  else if(keyPressed === 68 || keyPressed === 39) {
    square.moveRight = true;
  }
  else if(keyPressed === 32) {
    e.preventDefault();
  }
  
  return false;
};

//handler for key up events
const keyUpHandler = (e) => {
  var keyPressed = e.which;
  const square = squares[hash];

  // W OR UP
  if(keyPressed === 87 || keyPressed === 38) {
    square.moveUp = false;
  }
  // A OR LEFT
  else if(keyPressed === 65 || keyPressed === 37) {
    square.moveLeft = false;
  }
  // S OR DOWN
  else if(keyPressed === 83 || keyPressed === 40) {
    square.moveDown = false;
  }
  // D OR RIGHT
  else if(keyPressed === 68 || keyPressed === 39) {
    square.moveRight = false;
  }
  //Space key was lifted
  else if(keyPressed === 32) {
    sendAttack(); //call to invoke an attack
    e.preventDefault();
  }
  
  return false;
};

const init = () => {
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