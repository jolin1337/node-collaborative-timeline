var express = require('express');

var app = express();

app.use(express.static('public/'));
app.use(express.static('node_modules'));

var server = require('http').createServer(app);
var port = process.env.PORT || 8080;
server.listen(port, function (){
	console.log("Server running on port " + port)
});

var items = new (function() {
	this._data = [];
	this.get = function(id) {
		return this._data.find(item => item.id == id);
	};
	this.add = function(item) {
		if (this.get(item.id)) return;
		this._data.push(item);
	};
	this.remove = function (id) {
		var items = this._data.filter(item => item.id == id);
		if (items.length == 0) return;
		items.forEach(item => this._data.splice(this._data.indexOf(item), 1))
		return item;
	};
	this.update = function (new_item) {
		var item = this.get(new_item.id);
		if (!item) return;
		if (new_item.content != null) item.content = new_item.content;
		if (new_item.start != null) item.start = new_item.start;
		// if (new_item.end != null) item.end = new_item.end;
		return item;
	};
})();

var io = require('socket.io')(server);

io.on('connection', function(socket) {
	items._data.forEach(function (item) {
		socket.emit('add', item);
	});

	socket.on('update', function (item) {
		if (items.update(item)) {
			socket.broadcast.emit('update', item);
		}
	});
	socket.on('add', function (item) {
		items.add(item);
		socket.broadcast.emit('add', item);
	});
	socket.on('remove', function (item) {
		if (items.remove(item.id)) {
			socket.broadcast.emit('remove', item);
		}
	});
})
