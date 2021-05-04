	var socket = io.connect('http://localhost:3000');

	//Cuando se conecta pide nombre de usuario y con un callback
	//envia al server el nombre de usuario
	socket.on('connect', function(){
		socket.emit('adduser', prompt("Introduce tu Nick:"));
	});

	//Escuchando a que el servidor emita (updatechat) para actualizar la conversacion
	socket.on('updatechat', function (username, data) {
		$('#conversation').append(`\n${username}: ${data}`);
	});

	//Escuchando a que el servidor emita (updaterooms) para actualizar la Sala del cliente
	socket.on('updaterooms', function(rooms, current_room) {
		$('#rooms').empty();
		$.each(rooms, function(key, value) {
			if(value == current_room){
				$('#rooms').append('<li><a color="blue" !important>' + value + '</a></li>');
			}
			else {
				$('#rooms').append('<li><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></li>');
			}
		});
		$('#rooms').append('<li><button id="logout" onclick="logout()">Logout</button></li>')
	});

	//Usuario cambia de Sala
	function switchRoom(room){
		socket.emit('switchRoom', room);
	}

	//Usuario clica Logout
	function logout(){
		socket.emit('logout');
		location.replace('login.html');
	}
	
	$(function(){
		// Usuario clica SEND
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			socket.emit('sendchat', message);
		});

		// Usuario pulsa ENTER 
		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#datasend').focus().click();
			}
		});
	});