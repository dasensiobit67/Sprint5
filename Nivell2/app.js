const passport = require('passport')
const express = require('express')
const path = require('path')

const googleStratergy = require('./Oauth/googleStrategy')

const app = express();

// Inicializamos passport y googleStrategy
app.use(passport.initialize())
//app.use(googleStratergy)

// Api call for google authentication
app.get('/', passport.authenticate('google', {scope:['email', 'profile']}),
    (req,res) => {
});

// Para que los archivos estaticos queden disponibles.
var publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// Api call back function
app.get('/callback'
          ,passport.authenticate('google', {scope: ['email', 'profile']}),
       (req,res)=>{
                res.sendFile(__dirname + '/public/index.html');
});

//require('./chatserver/chatserver')

//-------------------Parte del Chat server-----------------

const http = require('http').createServer(app)
const io = require('socket.io')(http)

// Array para usuarios conectados al chat
var usernames = {};

// Salas disponibles en el chat
var rooms = ['Sala1','Sala2','Sala3'];

io.sockets.on('connection', function (socket) {
	
	// Cuando client emite 'adduser', añadimos usuario al chat
	socket.on('adduser', function(username){
		socket.username = username;
		socket.room = 'Sala1';
		usernames[username] = username;
		console.log(`${username} conectado!`)
		socket.join('Sala1');
		socket.emit('updatechat', 'SERVER', 'Esta conectado en Sala1');
		socket.broadcast.to('Sala1').emit('updatechat', 'SERVER', username + ' se ha conectado a esta Sala');
		socket.emit('updaterooms', rooms, 'Sala1');
	});
	
	// Cuando client emite 'sendchat', emitimos 'updatechat' con usuario y texto
	socket.on('sendchat', function (data) {
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
	//Cuando client emite 'switchRoom', se cambia de Sala al usuario
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'Esta conectado en '+ newroom);
		// enviamos mensaje a la sala que ha dejado
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' ha dejado la Sala');
		// actualizamos socket a la nueva sala
		// enviamos mensaje a la sala que se ha unido
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' se ha unido a esta Sala');
		socket.emit('updaterooms', rooms, newroom);
	});
	

	// Cuando client emite 'disconnect',
	socket.on('disconnect', function(){
		// eliminamos usuario de la lista
		delete usernames[socket.username];
		console.log(`${socket.username} se ha desconectado!`)
		// actualizamos lista usuarios para "client-side"
		io.sockets.emit('updateusers', usernames);
		// enviamos mensaje global de que usuario se ha desconectado
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' se ha desconectado');
		socket.leave(socket.room);
	});
});


http.listen(3000,() => console.log('Oauth Chat listening on port 3000!'));