// Config
require('dotenv').config();
const config = process.env;
const { v4: uuid } = require('uuid');
console.log(config.SECRET_MESSAGE);

// APP
const express = require('express');
const cors = require('cors');
const app = express();

// Server
const server = require('http').createServer(app);

// Routes
const path = require('path');
app.get('/', (req, res) => { res.redirect('/' + uniqueNamesGenerator({ dictionaries: [adjectives, colors], separator: '-', style: 'capital' })); })
app.get('/:id', (req, res) => { 
  res.sendFile(path.join(__dirname+'/index.html')); 
});

// User ID Generator
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
let id;

// Socket
const io = require('socket.io')(server, { cors: {origin: '*'} });

online = 0
let users = {
  userId: { name: 'UserName', room: 'roomId', status: 'Active', joined: new Date(), seen: new Date() }
}
let rooms = {
  roomId: { 
    config: { name: 'RoomName', online: 1, created: new Date(), updated: new Date() },
    messages: [ { user: 'userId123', message: 'userMessage', date: new Date() } ], 
    users: [ 'userId' ]
  }
};
io.on('connection', (socket) => {
  // CONNECT
  online++;
  socket.on('init', (name, room) => {
    id = name
    if(!name) id = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], separator: '-' });
    // Create User
    users[id] = { name, room, status: 'Active', joined: new Date(), seen: new Date() }
    // Init Room
    if(!rooms[room]) rooms[room] = { config: { name: id, online: 0, created: new Date() }, messages: [], users: [] }
    // Update Room
    rooms[room].config.updated = new Date()
    rooms[room].config.online ++
    rooms[room].users.push(id)
    // Join Room
    socket.join(room);
    socket.emit('id', id);
    socket.emit('messages', rooms[room].messages);
    // Update Online
    io.to(room).emit('online', rooms[room].config.online);
    console.log(users);
    console.log(rooms);
  });

  // Receive Message
  socket.on('message', (room, message) => {
    msg = { user: id, message, date: new Date() };
    if(rooms[room]) rooms[room].messages.push(msg);
    io.to(room).emit('message', msg);
  })

  // DISCONNECT
  socket.on('disconnect', () => {
    online--;
    if(users[id]) {
      // Update Room
      room = users[id].room
      if(room) {
        // Remove User
        rooms[room].users = rooms[room].users.filter(e => e !== id)
        // Update Online
        rooms[room].config.online --
        io.to(room).emit('online', rooms[room].config.online);
      }
      // Remove User
      delete users[id]
    }

    console.log(users);
    console.log(rooms);
  });
});

// Init Server
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));