var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8889);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/jquery.min.js', function (req, res) {
  res.sendfile(__dirname + '/jquery.min.js');
});
app.get('/bootstrap.min.css', function (req, res) {
  res.sendfile(__dirname + '/bootstrap.min.css');
});
app.get('/bootstrap.min.js', function (req, res) {
  res.sendfile(__dirname + '/bootstrap.min.js');
});


// usernames which are currently connected to the chat
var usernames = {};

var username_length_limit = 15;
var message_length_limit = 200;


var RED_COLOR_HEX = '#FF0000';
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}


io.sockets.on('connection', function (socket) {

  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters

    if(data.length < message_length_limit)
      io.sockets.emit('updatechat', socket.usercolor, socket.username, data);
    else
      socket.emit('updatechat', RED_COLOR_HEX, 'ERROR', 'Message length cannot exceed '+ message_length_limit+' characters');
  });

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', function(username){
    // username cannot be empty ;)
    if(username)
    {
      
      if(username.length < username_length_limit)
      {
	// user cannot choose server nickname !
	if(username.toLowerCase() != "server")
	{
	  if(!(username in usernames))
	  {
	    // we store the username in the socket session for this client
	    socket.username = username;
	    // assign a color this user :)
	    socket.usercolor = getRandomColor();
	    // add the client's username to the global list
	    usernames[username] = username;
	    // echo to client they've connected
	    socket.emit('updatechat', RED_COLOR_HEX, 'SERVER', 'you have connected. Start chatting ;)');
	    // echo globally (all clients) that a person has connected
	    socket.broadcast.emit('updatechat', RED_COLOR_HEX, 'SERVER', username + ' has connected');
	    // update the list of users in chat, client-side
	    io.sockets.emit('updateusers', usernames);
	  }
	  else
	  {
	    username = null;
	    socket.emit('updatechat', RED_COLOR_HEX, 'ERROR', 'The chosen nickname exists! Try again with different nickname by refreshing the page :)');
	  }
	}
	// if the nick name was server then
	else
	{
	  username = null;
	  socket.emit('updatechat', RED_COLOR_HEX, 'ERROR', 'Really?!!! You cannot be the SERVER !! :)');
	}
      }
      // if the username length was more than limit then ... 
      else
      {
	username = null;
	socket.emit('updatechat', RED_COLOR_HEX, 'ERROR', 'Nickname length cannot exceed '+ username_length_limit+' characters');
      }
	
    }
    // if username was empty !
    else
    {
      socket.emit('updatechat', RED_COLOR_HEX, 'ERROR', 'You MUST enter a nick name to start! Retry by refreshing the page');
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function(){
    if(socket.username)
    {
      // remove the username from global usernames list
      delete usernames[socket.username];
      // update list of users in chat, client-side
      io.sockets.emit('updateusers', usernames);
      // echo globally that this client has left
      socket.broadcast.emit('updatechat', RED_COLOR_HEX, 'SERVER', socket.username + ' has disconnected');
    }
  });
});