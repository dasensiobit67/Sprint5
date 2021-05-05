	var socket = io.connect('http://localhost:3000');

	//Cuando se conecta pide nick de usuario y con un callback
	//envia al server el nombre de usuario
	socket.on('connect', function(){
		socket.emit('adduser', prompt("What's your Nick?"));
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
				$('#rooms').append('<li><a style="color:violet !important">' + value + '</a></li>');
			}
			else {
				$('#rooms').append('<li><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></li>');
			}
		});
	});

	//Si el usuario cambia de Sala emitimos 'switchRoom' al Servidor
	function switchRoom(room){
		socket.emit('switchRoom', room);
	}
	
	// on load of page
	$(function(){
		// Cuando el usuario click SEND
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			// emitimos 'sendchat' al Servidor con el mensaje
			socket.emit('sendchat', message);
		});

		// Cuando el cliente pulsa ENTER
		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#datasend').focus().click();
			}
		});
	});