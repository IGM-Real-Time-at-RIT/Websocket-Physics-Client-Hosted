// fast hashing library
const xxh = require('xxhashjs');
// Character custom class
const Character = require('./Character.js');

// our socketio instance
let io;

//Function to setup the host of a room
const confirmHost = (sock) => {
  const socket = sock;
  //set the host (custom property we can check on the socket)
  socket.isHost = true;
  //set the hostSocket (custom property we can check on the socket)
  //to itself so we can use the same code as other users when
  //checking the host
  socket.hostSocket = socket;

  //When the host sends a hostUpdatedMovement event to the server.
  /**
    The 'host' needs to act as the server but cannot talk to other clients
    directly (especially through firewalls). As a result, the host needs to
    send data to the server who will act as the medium for communication back
    to the host's client users. 
  **/
  socket.on('hostUpdatedMovement', (data) => {
    //broadcast to everyone else in room1
    socket.broadcast.to('room1').emit('updatedMovement', data);
  });

  //When the hsot sends a hostUpdatedAttack event to the server.
  /**
    The 'host' needs to act as the server but cannot talk to other clients
    directly (especially through firewalls). As a result, the host needs to
    send data to the server who will act as the medium for communication back
    to the host's client users. 
  **/  
  socket.on('hostUpdatedAttack', (data) => {
    socket.broadcast.to('room1').emit('attackUpdate', data);
  });

  //send a confirmation message to the host so they know they are the host
  //of this room.
  socket.emit('hostConfirm');
};

// function to setup our socket server
const configureSocket = (sock) => {
  const socket = sock;

  // create a unique id for the user based on the socket id and time
  const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xCAFEBABE).toString(16);
  // add the id to the user's socket object for quick reference
  socket.hash = hash;

  //create a new character object with a unique id
  //not usually necessary and usually done by the host, but this is can be more 
  //troublesome for a browser (at least with xxhash) so we are handling it server-side.
  const character = new Character(hash);

  //grab a reference to this socket room from socket.io
  const socketRoom = io.sockets.adapter.rooms.room1;

  //if this socket room does not exist or have no users
  //then we will create a host for the session.
  //Keep in mind, the host will have a slight advantage over other users
  //due to having no lag.
  if (!socketRoom || socketRoom.length === 0) {
    //call to make this user the host
    confirmHost(socket);
  } else {
    //if the user is not the first, then they are not the host
    socket.isHost = false;
    //grab all of the sockets in the room
    const socketKeys = Object.keys(socketRoom.sockets);
    
    let hostFound = false; //do we know the host of this room

    //search the sockets in this room for the host
    for (let i = 0; i < socketKeys.length; i++) {
      //grab the socket object from the overall socket list
      //based on the socket ids in the room
      const socketUser = io.sockets.connected[socketKeys[i]];

      //if this socket is the host and matches our room name
      if (socketUser.isHost) {
        //set the host socket reference as this socket's hostSocket (custom property)
        socket.hostSocket = socketUser;
        //call the host socket and let them know a new character has joined
        socket.hostSocket.emit('hostAcknowledge', character);
        hostFound = true; //flag we did find a host (in case host left)
        break; //stop searching for a host
      }
    }

    //did we find a host for this room (in case the host left)
    if (!hostFound) {
      //if not, then make this socket a host
      confirmHost(socket);
    }
  }

  //join this socket to the room
  socket.join('room1');
  //emit a joined event to the socket with their character
  socket.emit('joined', character);
};

//when a user sends the server a movement update
const handleMovement = (socket, dataObj) => {
  //check if this is the host, if so, no reason to update
  //since the host is the authority. They already know
  //their own moves.
  if (socket.isHost) {
    return;
  }

  //Otherwise we will transmit the data to the host
  const data = dataObj;
  
  //set the unique id of this socket so we can transmit it
  //to the host.
  data.hash = socket.hash;

  //send movement update to the host of this socket so it can
  //determine what to do.
  //The "hostSocket" property is a custom property we made when
  //we made this socket.
  socket.hostSocket.emit('movementUpdate', data);
};

//when receiving attack update from users
const handleAttack = (socket, dataObj) => {
  //check if this is the host, if so, no reason to update
  //since the host is the authority. They already know
  //their own moves.
  if (socket.isHost) {
    return; 
  }

  //otherwise we will transmit the data to the host
  const data = dataObj;
  
  //set the unique id of this socket so we can transmit it
  //to the host
  data.hash = socket.hash;

  //send the attack update to the host of this socket so
  //it can determine what to do.
  //The "hostSocket" property is a custom property we made 
  //when we made this socket.
  socket.hostSocket.emit('attackUpdate', data);
};

//when a user disconnects
const handleDisconnect = (socket) => {
  //let everyone know this user left
  io.sockets.in('room1').emit('left', socket.hash);

  //remove this user from the room
  socket.leave('room1');

  //grab the socket room from the socket io server
  const socketRoom = io.sockets.adapter.rooms.room1;

  //check if this is the host and the socket room still exists
  //or has people in it.
  if (socket.isHost && socketRoom) {
    //if so, let everyone know the host left
    io.sockets.in('room1').emit('hostLeft');

    //grab all of the sockets in this room
    const socketKeys = Object.keys(socketRoom.sockets);

    //manually disconnect them since there is no longer
    //a host for the room.
    for (let i = 0; i < socketKeys.length; i++) {
      const socketList = io.sockets.connected;
      socketList[socketKeys[i]].disconnect();
    }
  }
};

//when a user is hit and needs to be removed from the session
const handleRemove = (socket, characterHash) => {
  //send update to everyone so they know a user was hit and
  //should be removed.
  socket.broadcast.to('room1').emit('attackHit', characterHash);
};

//function to setup the sockets
const setupSockets = (ioServer) => {
  //set our io server instance
  io = ioServer;

  //when a new socket joins
  io.on('connection', (sock) => {
    const socket = sock;
    
    //call to configure the socket
    configureSocket(socket);

    //set listeners on this socket
    socket.on('movementUpdate', data => handleMovement(socket, data));
    socket.on('attack', data => handleAttack(socket, data));
    socket.on('removePlayer', characterHash => handleRemove(socket, characterHash));
    socket.on('disconnect', data => handleDisconnect(socket, data));
  });
};

module.exports.setupSockets = setupSockets;
