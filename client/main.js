let canvas;
let ctx;
let walkImage;
let slashImage;
//our websocket connection
let socket; 
let hash;
let isHost = false;
let animationFrame;

let squares = {};
let hosted = {};
let attacks = [];

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
  else if(keyPressed === 32) {
    sendAttack();
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