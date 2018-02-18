const xxh = require('xxhashjs');
const Character = require('./Character.js');

let io;

const confirmHost = (sock) => {
  const socket = sock;
  socket.isHost = true;
  socket.hostSocket = socket;

  socket.on('hostUpdatedMovement', (data) => {
    socket.broadcast.to('room1').emit('updatedMovement', data);
  });

  socket.on('hostUpdatedAttack', (data) => {
    socket.broadcast.to('room1').emit('attackUpdate', data);
  });

  socket.emit('hostConfirm');
};

const configureSocket = (sock) => {
  const socket = sock;

  const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16);
  socket.hash = hash;

  const character = new Character(hash);

  const socketRoom = io.sockets.adapter.rooms.room1;

  if (!socketRoom || socketRoom.length === 0) {
    confirmHost(socket);
  } else {
    socket.isHost = false;
    const socketKeys = Object.keys(socketRoom.sockets);
    let hostFound = false;

    for (let i = 0; i < socketKeys.length; i++) {
      const socketUser = io.sockets.connected[socketKeys[i]];

      if (socketUser.isHost) {
        socket.hostSocket = socketUser;
        socket.hostSocket.emit('hostAcknowledge', character);
        hostFound = true;
        break;
      }
    }

    if (!hostFound) {
      confirmHost(socket);
    }
  }

  socket.join('room1');
  socket.emit('joined', character);
};

const handleMovement = (socket, dataObj) => {
  if (socket.isHost) {
    return;
  }

  const data = dataObj;
  data.hash = socket.hash;

  socket.hostSocket.emit('movementUpdate', data);
};

const handleAttack = (socket, dataObj) => {
  if (socket.isHost) {
    return;
  }

  const data = dataObj;
  data.hash = socket.hash;

  socket.hostSocket.emit('attackUpdate', data);
};

const handleDisconnect = (socket) => {
  io.sockets.in('room1').emit('left', socket.hash);

  socket.leave('room1');

  const socketRoom = io.sockets.adapter.rooms.room1;

  if (socket.isHost && socketRoom) {
    io.sockets.in('room1').emit('hostLeft');

    const socketKeys = Object.keys(socketRoom.sockets);

    for (let i = 0; i < socketKeys.length; i++) {
      const socketList = io.sockets.connected;
      socketList[socketKeys[i]].disconnect();
    }
  }
};

const handleRemove = (socket, characterHash) => {
  socket.broadcast.to('room1').emit('attackHit', characterHash);
};

const setupSockets = (ioServer) => {
  io = ioServer;

  io.on('connection', (sock) => {
    const socket = sock;
    configureSocket(socket);

    socket.on('movementUpdate', data => handleMovement(socket, data));
    socket.on('attack', data => handleAttack(socket, data));
    socket.on('removePlayer', characterHash => handleRemove(socket, characterHash));
    socket.on('disconnect', data => handleDisconnect(socket, data));
  });
};

module.exports.setupSockets = setupSockets;
