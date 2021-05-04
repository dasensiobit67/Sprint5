const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const app = express()
const fs = require('fs')
const http = require('http')
const server = http.createServer(app)
const path = require('path')
const io = require('socket.io')(server)
const db = require('./repository/db')

//Control de sesion para login
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

server.listen(3000, (error) => {
	console.log("Chat Server in port 3000");
});

// obtiene la ruta del directorio publico donde se encuentran 
// los elementos estaticos (css, js).
var publicPath = path.resolve(__dirname, 'public'); 
//path.join(__dirname, 'public'); también puede ser una opción

// Para que los archivos estaticos queden disponibles.
app.use(express.static(publicPath));

// routing
app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/login.html');
	});

// Comprobando login en users.json
app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	var users = JSON.parse(fs.readFileSync('./data/users.json'))
	var ok = false
	users.forEach(el => {
		if(username == el.user && password == el.password){
			request.session.loggedin = true;
			request.session.username = username;
			ok = true;
			response.sendFile(__dirname + '/public/chat.html');
		}
	})
	if(!ok){
		response.send('Incorrect Username and/or Password!');
		response.end();
	}
});

//Arrays para gestion de Salas y datos	
var data = [];
var rooms = ['Sala1','Sala2','Sala3'];

io.sockets.on('connection', function (socket) {

	//Se conecta un usuario
	socket.on('adduser', function(username){
		socket.username = username;
		socket.room = 'Sala1';
		data.push({'date':Date.now()},{'name':socket.username},{'message':'Conectado'},{'room':socket.room});
		db.saveData(data);
		console.log(`${username} conectado!`);
		socket.join('Sala1');
		socket.emit('updatechat', 'SERVER', 'Esta conectado en Sala1');
		socket.broadcast.to('Sala1').emit('updatechat', 'SERVER', username + ' se ha conectado a esta Sala');
		socket.emit('updaterooms', rooms, 'Sala1');
	});
	
	//Envia mensaje un usuario
	socket.on('sendchat', function (message) {
		data.push({'date':Date.now()},{'name':socket.username},{'message':message},{'room':socket.room});
		db.saveData(data);
		io.sockets.in(socket.room).emit('updatechat', socket.username, message);
	});
	
	//Cambia de Sala un usuario
	socket.on('switchRoom', function(newroom){
		data.push({'date':Date.now()},{'name':socket.username},{'message':'Cambio de Sala'},{'room':newroom});
		db.saveData(data);
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'Esta conectado en '+ newroom);
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' ha dejado la Sala');
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' se ha unido a esta Sala');
		socket.emit('updaterooms', rooms, newroom);
	});
	
	//Se desconecta un usuario
	socket.on('disconnect', function(){
		data.push({'date':Date.now()},{'name':socket.username},{'message':'Desconectado'},{'room':socket.room});
		db.saveData(data);
		console.log(`${socket.username} se ha desconectado!`);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' se ha desconectado');
		socket.leave(socket.room);
	});

	//Hace logout un usuario
	socket.on('logout', function(){
		data.push({'date':Date.now()},{'name':socket.username},{'message':'Desconectado'},{'room':socket.room});
		db.saveData(data);
		console.log(`${socket.username} ha pulsado Logout!`);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' ha pulsado Logout!');
		socket.leave(socket.room);
	});
});